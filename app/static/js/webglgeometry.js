import { mat4 } from "./linalg.js";
import { uniformSetter } from "./webglcommon.js";
/**
 * Vertices reference for future me.
 *  ----------------------------------------------
 * | Colored objects      | Textured objects      |
 *  ----------------------------------------------
 * | xyz rgba offset type | xyz uv depth 0 0 type |
 *  ----------------------------------------------
 *
 * With the current logic vertices should always be:
 *  -------------------------------------------------------
 * | vertices colored objects == vertices textured objects |
 *  -------------------------------------------------------
 * However, since every object has their own VAO, this is not a limitation,
 * but the developer (me) is lazy.
 */
const STRIDE = 9;
// Default color is white.
const WHITE = [255, 255, 255, 1];
// ShapeType is a bitfield enum.
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["COLORED"] = 0] = "COLORED";
    ShapeType[ShapeType["LINE"] = 2] = "LINE";
    ShapeType[ShapeType["SHADOW"] = 4] = "SHADOW";
    ShapeType[ShapeType["TEXTURED"] = 1] = "TEXTURED";
    ShapeType[ShapeType["LOGO"] = 1] = "LOGO";
    ShapeType[ShapeType["HINT"] = 3] = "HINT";
    ShapeType[ShapeType["PERSONAL"] = 5] = "PERSONAL";
})(ShapeType || (ShapeType = {}));
function createVertexBuffer(data) {
    const buffer = new ArrayBuffer(data.length * 4);
    const floats = new Float32Array(buffer);
    const ints = new Int32Array(buffer);
    for (let i = 0; i < data.length; i++) {
        if (i % STRIDE == STRIDE - 1) {
            ints[i] = data[i];
        }
        else {
            floats[i] = data[i];
        }
    }
    return buffer;
}
function createGrid(xmax, ymax, step, color = WHITE, type = ShapeType.COLORED) {
    const vertices = [];
    for (let x = -xmax; x <= xmax; x += step) {
        // xyz                      rgba      offset    type
        vertices.push(x, 0, -ymax, ...color, 0, type);
        vertices.push(x, 0, ymax, ...color, 0, type);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz                      rgba      offset    type
        vertices.push(-xmax, 0, y, ...color, 0, type);
        vertices.push(xmax, 0, y, ...color, 0, type);
    }
    return vertices;
}
function createSphere(radius, latitudeBands, longitudeBands, color = WHITE, type = ShapeType.COLORED) {
    const vertices = [];
    const indices = [];
    for (let lat = 0; lat <= latitudeBands; ++lat) {
        const theta = (lat * Math.PI) / latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= longitudeBands; ++lon) {
            const phi = (lon * 2 * Math.PI) / longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            vertices.push(
            // xyz
            radius * cosPhi * sinTheta, radius * cosTheta, radius * sinPhi * sinTheta, 
            // rgba     offset  type
            ...color, 0, type);
        }
    }
    for (let lat = 0; lat < latitudeBands; ++lat) {
        for (let lon = 0; lon < longitudeBands; ++lon) {
            const current = lat * (longitudeBands + 1) + lon;
            const next = (lat + 1) * (longitudeBands + 1) + lon;
            indices.push(current, next, current + 1, current + 1, next, next + 1);
        }
    }
    return indices.flatMap(index => vertices.slice(index * STRIDE, index * STRIDE + STRIDE));
}
function createCircle(radius, segments, color = WHITE, type = ShapeType.SHADOW) {
    const vertices = [];
    for (let i = 0; i <= segments; i++) {
        const a = 2 * Math.PI / segments * i;
        const b = 2 * Math.PI / segments * (i + 1);
        vertices.push(
        // xyz                                      rgba      offset    type
        0, 0, 0, ...color, 0, type, radius * Math.cos(a), 0, radius * Math.sin(a), ...color, 0, type, radius * Math.cos(b), 0, radius * Math.sin(b), ...color, 0, type);
    }
    return vertices;
}
function createLine(width, a, b, color = WHITE, type = ShapeType.LINE) {
    width /= 2;
    const dx = -(b[0] - a[0]);
    const dz = (b[2] - a[2]);
    const length = Math.sqrt(dx * dx + dz * dz);
    const p = [(-dz / length) * width, 0, (dx / length) * width];
    return [
        // xyz                      rgba      type
        -p[0], 0, -p[2], ...color, 0, type,
        p[0], 0, p[2], ...color, 0, type,
        p[0] + dx, 0, p[2] + dz, ...color, 0, type,
        -p[0], 0, -p[2], ...color, 0, type,
        p[0] + dx, 0, p[2] + dz, ...color, 0, type,
        -p[0] + dx, 0, -p[2] + dz, ...color, 0, type,
    ];
}
function createTexturePlane(size, depth, ratio = 1.0, type = ShapeType.TEXTURED) {
    return [
        // xyz                      uv      depth  alpha    offset  type
        -size * ratio, 0.0, -size, 0, 1, depth, 0, 0, type,
        size * ratio, 0.0, size, 1, 0, depth, 0, 0, type,
        -size * ratio, 0.0, size, 0, 0, depth, 0, 0, type,
        -size * ratio, 0.0, -size, 0, 1, depth, 0, 0, type,
        size * ratio, 0.0, -size, 1, 1, depth, 0, 0, type,
        size * ratio, 0.0, size, 1, 0, depth, 0, 0, type,
    ];
}
export class Shape {
    constructor(gl, method, vertices, id = 0, pos = [0, 0, 0], texture = 0) {
        this.gl = gl;
        this.method = method;
        this.visible = 1;
        this.hovered = 0;
        this.focused = 0;
        this.id = new Int32Array([id]);
        this.vertices = vertices;
        this.texture = texture;
        this.buffer = createVertexBuffer(vertices);
        /**
         * xyz reference for future me.
         * So, in OpenGL, x == left/right, y == up/down, z == near/far.
         * This means, that the ViewProjection matrix inverts the coordinates such that:
         * y == up/down (makes sense), z == near/far (makes sense), +x == left && -x == right (doesn't make sense).
         * So, I've inverted the x-axis (pos[0]) in the world matrix to make it more intuitive.
         */
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -pos[0], pos[1], pos[2], 1,
        ]);
        this.display = "inherit";
    }
    *[Symbol.iterator]() {
        yield this;
    }
    show() {
        this.visible = 1;
    }
    hide() {
        if (this.display == "fixed" || this.focused) {
            return;
        }
        this.visible = 0;
    }
    hoverIn() {
        this.hovered = 1;
    }
    hoverOut() {
        if (this.focused) {
            console.log(this);
            return;
        }
        this.hovered = 0;
    }
    isHovered() {
        return this.hovered == 1;
    }
    focus() {
        this.hovered = 1;
        this.focused = 1;
    }
    blur() {
        this.hovered = 0;
        this.focused = 0;
    }
    isFocused() {
        return this.focused == 1;
    }
    draw(gl, map, uniforms, offset = 0) {
        if (!this.visible) {
            return;
        }
        if (uniforms) {
            for (const [key, func] of Object.entries(uniforms)) {
                if (!map.has(key)) {
                    continue;
                }
                uniformSetter(gl, map.get(key), func(this));
            }
        }
        gl.drawArrays(this.method, offset, this.vertices.length / STRIDE);
    }
}
export class Grid extends Shape {
    constructor(gl, xmax, ymax, step, { id = 0, x = 0, y = 0, z = 0, r = 255, g = 255, b = 255, a = 1, display = "inherit", }) {
        super(gl, gl.LINES, createGrid(xmax, ymax, step, [r, g, b, a]), id, [x, y, z]);
        this.display = display;
    }
}
export class Sphere extends Shape {
    constructor(gl, radius, latitudeBands, longitudeBands, { id = 0, x = 0, y = 0, z = 0, r = 255, g = 255, b = 255, a = 1, display = "inherit", }) {
        super(gl, gl.TRIANGLES, createSphere(radius, latitudeBands, longitudeBands, [r, g, b, a]), id, [x, y, z]);
        this.display = display;
    }
}
export class Circle extends Shape {
    constructor(gl, radius, segments, { id = 0, type = ShapeType.COLORED, x = 0, y = 0, z = 0, r = 255, g = 255, b = 255, a = 1, display = "inherit", }) {
        super(gl, gl.TRIANGLE_STRIP, createCircle(radius, segments, [r, g, b, a], type), id, [x, y, z]);
        this.display = display;
    }
}
export class Line extends Shape {
    constructor(gl, start, end, size, { id = 0, type = ShapeType.LINE, x = 0, y = 0, z = 0, r = 255, g = 255, b = 255, a = 1, display = "inherit", }) {
        super(gl, gl.TRIANGLES, createLine(size, start, end, [r, g, b, a], type), id, [x, y, z]);
        this.display = display;
    }
}
export class AtlasPlane extends Shape {
    constructor(gl, depth, { id = 0, type = ShapeType.TEXTURED, tex = 0, size = 1, ratio = 1, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, display = "inherit", visible = 1, }) {
        super(gl, gl.TRIANGLES, createTexturePlane(size, depth, ratio, type), id, [x, y, z]);
        this.gl = gl;
        this.visible = 0;
        this.hovered = 0;
        this.focused = 0;
        const c = Math.cos(Math.PI * 0.25); // ≈ 0.707
        const s = Math.sin(Math.PI * 0.25); // ≈ 0.707
        this.world = new mat4([
            -1, 0, 0, 0,
            0, 0, -1, 0,
            0, 1, 0, 0,
            -x, y, z, 1,
        ]).rotate(rx, ry, rz);
        this.texture = tex;
        this.display = display;
        this.visible = visible;
    }
}
export class Composite extends Shape {
    constructor(gl, { id = 0, x = 0, y = 0, z = 0, display = "inherit", visible = 1, shapes = [] } = {}) {
        const vertices = [];
        for (const shape of shapes) {
            vertices.push(...shape.vertices);
            for (const child of shape) {
                // Hijack the world matrix.
                child.world[12] += -x;
                child.world[13] += y;
                child.world[14] += z;
                // Hijack the id.
                if (!child.id[0]) {
                    child.id[0] = id;
                }
            }
        }
        super(gl, 0, vertices, id, [x, y, z]);
        this.visible = 1;
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            -x, y, z, 1,
        ]);
        this.shapes = shapes;
        this.display = display;
        this.visible = visible;
    }
    *[Symbol.iterator]() {
        yield this;
        for (const shape of this.shapes) {
            yield* shape;
        }
    }
    show() {
        for (const shape of this.shapes) {
            shape.visible = 1;
        }
        this.visible = 1;
    }
    hide() {
        if (this.display == "fixed" || this.focused) {
            return;
        }
        for (const shape of this.shapes) {
            if (shape.display == "fixed" || shape.focused) {
                continue;
            }
            shape.visible = 0;
        }
    }
    hoverIn() {
        for (const shape of this.shapes) {
            shape.hovered = 1;
        }
        this.hovered = 1;
    }
    hoverOut() {
        for (const shape of this.shapes) {
            shape.hovered = 0;
        }
        this.hovered = 0;
    }
    focus() {
        for (const shape of this.shapes) {
            shape.focused = 1;
        }
        this.focused = 1;
    }
    blur() {
        for (const shape of this.shapes) {
            shape.blur();
        }
        this.focused = 0;
    }
    draw(gl, map, uniforms, offset = 0) {
        if (!this.visible) {
            return;
        }
        for (const shape of this.shapes) {
            shape.draw(gl, map, uniforms, offset);
            offset += shape.vertices.length / STRIDE;
        }
    }
}
export class Node extends Composite {
    constructor(gl, { id = 0, x = 0, y = 0, z = 0 } = {}) {
        super(gl, { id, display: "fixed", x, z, shapes: [
                new Sphere(gl, 0.015, 16, 16, { y, x: 0, z: 0 }),
                new Circle(gl, 0.02, 16, { type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8 }),
            ] });
    }
}
export class Edge extends Composite {
    constructor(gl, start, end, { id = 0, x = 0, y = 0, z = 0 } = {}) {
        super(gl, { id, x, z, shapes: [
                new Line(gl, start, end, 0.0075, { y }),
                new Line(gl, start, end, 0.0075, {
                    type: ShapeType.SHADOW,
                    y: 0.001,
                    r: 0, g: 0, b: 0, a: 0.8
                }),
            ] });
        this.visible = 0;
    }
}
export class Icon extends Composite {
    constructor(gl, icon, logo, { id = 0, x = 0, y = 0, z = 0 } = {}) {
        super(gl, { id, x, z, shapes: [
                new Composite(gl, { id, display: "fixed", y, shapes: [
                        new AtlasPlane(gl, icon, { type: ShapeType.LOGO, tex: 0, size: 0.03 }),
                        new Circle(gl, 0.015, 16, { type: ShapeType.SHADOW, y: -y + 0.002, r: 0, g: 0, b: 0, a: 0.8 }),
                    ] }),
                new AtlasPlane(gl, logo, {
                    type: ShapeType.HINT,
                    tex: 1,
                    size: 0.15,
                    ratio: 0.5625,
                    x: x * -0.33,
                    y: y * 5,
                    z: -0.025,
                    visible: 0
                }),
            ] });
    }
}

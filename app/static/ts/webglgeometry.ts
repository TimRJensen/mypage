import {mat4} from "./linalg.js";
import {Drawable, UniformDynamic, UniformInfo, uniformSetter} from "./webglcommon.js";

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
const WHITE = [255, 255, 255, 1]

// ShapeType is a bitfield enum.
export enum ShapeType {
    COLORED = 0x0,
    LINE = ShapeType.COLORED | 0x2,
    SHADOW = ShapeType.COLORED | 0x4,
    TEXTURED = 0x1,
    LOGO = ShapeType.TEXTURED | 0x1,
    HINT = ShapeType.TEXTURED | 0x2,
    PERSONAL = ShapeType.TEXTURED | 0x4,
}

function createVertexBuffer(data: number[]) {
    const buffer = new ArrayBuffer(data.length*4);
    const floats = new Float32Array(buffer);
    const ints = new Int32Array(buffer);

    for (let i = 0; i < data.length; i++) {
        if (i%STRIDE == STRIDE - 1) {
            ints[i] = data[i];
        } else {
            floats[i] = data[i];
        }
    }

    return buffer;
}
    
function createGrid(xmax: number, ymax: number, step: number, color = WHITE, type = ShapeType.COLORED) {
    const vertices = [];

    for (let x = -xmax; x <= xmax; x += step) {
        // xyz                      rgba      offset    type
        vertices.push(x, 0, -ymax,  ...color, 0,        type);
        vertices.push(x, 0, ymax,   ...color, 0,        type);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz                      rgba      offset    type
        vertices.push(-xmax, 0, y,  ...color, 0,        type);
        vertices.push(xmax, 0, y,   ...color, 0,        type);
    }
    
    return vertices;
}

function createSphere(radius: number, latitudeBands: number, longitudeBands: number, color = WHITE, type = ShapeType.COLORED) {
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let lat = 0; lat <= latitudeBands; ++lat) {
        const theta = (lat*Math.PI)/latitudeBands;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let lon = 0; lon <= longitudeBands; ++lon) {
            const phi = (lon*2*Math.PI)/longitudeBands;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);

            vertices.push(
                // xyz
                radius*cosPhi*sinTheta, radius*cosTheta, radius*sinPhi*sinTheta,
                // rgba     offset  type
                ...color,   0,      type,
            );
        }
    }

    for (let lat = 0; lat < latitudeBands; ++lat) {
        for (let lon = 0; lon < longitudeBands; ++lon) {
            const current = lat*(longitudeBands + 1) + lon;
            const next = (lat + 1)*(longitudeBands + 1) + lon;

            indices.push(current, next, current + 1, current + 1, next, next + 1);
        }
    }

    return indices.flatMap(index => vertices.slice(index*STRIDE, index*STRIDE + STRIDE));
}

function createCircle(radius: number, segments: number, color = WHITE, type = ShapeType.SHADOW) {
    const vertices: number[] = [];

    for (let i = 0; i <= segments; i++) {
        const a = 2*Math.PI/segments*i;
        const b = 2*Math.PI/segments*(i+1);

        vertices.push(
            // xyz                                      rgba      offset    type
            0, 0, 0,                                    ...color, 0,        type,
            radius*Math.cos(a), 0, radius*Math.sin(a),  ...color, 0,        type,
            radius*Math.cos(b), 0, radius*Math.sin(b),  ...color, 0,        type,
        );
    }

    return vertices;
}

function createLine(width: number, a: Array<number>, b: Array<number>, color = WHITE, type = ShapeType.LINE) {
    width /= 2;

    const dx = -(b[0] - a[0]);
    const dz = (b[2] - a[2]);
    const length = Math.sqrt(dx*dx + dz*dz);
    const p = [(-dz/length)*width, 0, (dx/length)*width];

    return [
        // xyz                      rgba      type
        -p[0], 0, -p[2],            ...color, 0, type,
        p[0], 0, p[2],              ...color, 0,type,
        p[0] + dx, 0, p[2] + dz,    ...color, 0,type,
        -p[0], 0, -p[2],            ...color, 0,type,
        p[0] + dx, 0, p[2] + dz,    ...color, 0,type,
        -p[0] + dx, 0, -p[2] + dz,  ...color, 0, type,
    ];
}

function createTexturePlane(size: number, depth: number, ratio = 1.0, type = ShapeType.TEXTURED) {
    return [
        // xyz                      uv      depth  alpha    offset  type
        -size*ratio, 0.0, -size,          0, 1,   depth, 0,       0,      type,
        size*ratio, 0.0, size,            1, 0,   depth, 0,       0,      type,
        -size*ratio, 0.0, size,           0, 0,   depth, 0,       0,      type,
        -size*ratio, 0.0, -size,          0, 1,   depth, 0,       0,      type,
        size*ratio, 0.0, -size,           1, 1,   depth, 0,       0,      type,
        size*ratio, 0.0, size,            1, 0,   depth, 0,       0,      type,
    ];
}

export interface ShapeLike extends Drawable<ShapeLike> {
    readonly id: Int32Array,
    readonly world: mat4,
    readonly texture: number,
    show(): void,
    hide(): void,
    hoverIn(): void,
    hoverOut(): void,
    isHovered(): boolean,
    focus(): void,
    isFocused(): boolean,
    blur(): void,
}

type DrawableProps = {
    id?: number,
    type?: number,
    display?: "inherit" | "fixed" | "none",
    x?: number,
    y?: number,
    z?: number,
    r?: number,
    g?: number,
    b?: number,
    a?: number
}

export class Shape implements ShapeLike {
    public readonly id: Int32Array;
    public readonly vertices: number[];
    public readonly texture: number;
    public readonly buffer: ArrayBuffer;
    public readonly world: mat4;
    public display: "inherit" | "fixed" | "none";
    public visible = 1;
    public hovered = 0;
    public focused = 0;

    constructor(
        readonly gl: WebGL2RenderingContext,
        readonly method: GLenum,
        vertices: number[],
        id = 0,
        pos = [0, 0, 0],
        texture = 0,
    ) {
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

    draw(gl: WebGL2RenderingContext, map: Map<string, UniformInfo>, uniforms?: UniformDynamic<ShapeLike>, offset = 0) {
        if (!this.visible) {
            return;
        }

        if (uniforms) {
            for (const [key, func] of Object.entries(uniforms)) {
                if (!map.has(key)) {
                    continue;
                }
                uniformSetter(gl, map.get(key)!, func(this));
            }
        }

        gl.drawArrays(this.method, offset, this.vertices.length/STRIDE);
    }
}

export class Grid extends Shape {
    constructor(
        gl: WebGL2RenderingContext,
        xmax: number,
        ymax: number,
        step: number,
        {
            id = 0,
            x = 0, y = 0, z = 0,
            r = 255, g = 255, b = 255, a = 1,
            display = "inherit",
        }: DrawableProps,
    ) {
        super(gl, gl.LINES, createGrid(xmax, ymax, step, [r, g, b, a]), id, [x, y, z]);
        this.display = display;
    }
}

export class Sphere extends Shape {
    constructor(
        gl: WebGL2RenderingContext,
        radius: number,
        latitudeBands: number,
        longitudeBands: number,
        {
            id = 0,
            x = 0, y = 0, z = 0,
            r = 255, g = 255, b = 255, a = 1,
            display = "inherit",
        }: DrawableProps,
    ) {
        super(gl, gl.TRIANGLES, createSphere(radius, latitudeBands, longitudeBands, [r, g, b, a]), id, [x, y, z]);
        this.display = display;
    }
}

export class Circle extends Shape {
    constructor(
        gl: WebGL2RenderingContext,
        radius: number,
        segments: number,
        {
            id = 0, type = ShapeType.COLORED,
            x = 0, y = 0, z = 0,
            r = 255, g = 255, b = 255, a = 1,
            display = "inherit",
        }: DrawableProps,
    ) {
        super(gl, gl.TRIANGLE_STRIP, createCircle(radius, segments, [r, g, b, a], type),  id, [x, y, z]);
        this.display = display;
    }
}

export class Line extends Shape {
    constructor(
        gl: WebGL2RenderingContext,
        start: Array<number>,
        end: Array<number>,
        size: number,
        {
            id = 0, type = ShapeType.LINE,
            x = 0, y = 0, z = 0,
            r = 255, g = 255, b = 255, a = 1,
            display = "inherit",
        }: DrawableProps,
    ) {
        super(gl, gl.TRIANGLES, createLine(size, start, end, [r, g, b, a], type), id, [x, y, z]);
        this.display = display;
    }
}

interface TextureProps extends Omit<DrawableProps, "r"|"g"|"b"|"a"> {
    size?: number,
    tex?: number,
    ratio?: number,
    visible?: number,
    rx?: number,
    ry?: number,
    rz?: number,
}

export class AtlasPlane extends Shape {
    public readonly texture;
    public readonly world;
    public visible = 0;
    public hovered = 0;
    public focused = 0;

    constructor(
        readonly gl: WebGL2RenderingContext,
        depth: number,
        {
            id = 0, type = ShapeType.TEXTURED,
            tex = 0,
            size = 1, ratio = 1,
            x = 0, y = 0, z = 0,
            rx = 0, ry = 0, rz = 0,
            display = "inherit", visible = 1,
        }: TextureProps,
    ) {
        super(gl, gl.TRIANGLES, createTexturePlane(size, depth, ratio, type), id, [x, y, z]);

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

interface CompositeProps extends Omit<DrawableProps, "r"|"g"|"b"|"a"> {
    visible?: number,
    shapes?: Array<Shape>,
}

export class Composite extends Shape {
    public readonly world;
    public readonly shapes;
    public visible = 1;

    constructor(
        gl: WebGL2RenderingContext,
        {id = 0, x = 0, y = 0, z = 0, display = "inherit", visible = 1, shapes = []}: CompositeProps = {}) {
        const vertices = [];
        for (const shape of shapes ) {
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

    *[Symbol.iterator](this: any) { // type this
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

    hoverIn(): void {
        for (const shape of this.shapes) {
            shape.hovered = 1;
        }
        this.hovered = 1;
    }

    hoverOut(): void {
        for (const shape of this.shapes) {
            shape.hovered = 0;
        }
        this.hovered = 0;
    }

    focus(): void {
        for (const shape of this.shapes) {
            shape.focused = 1;
        }
        this.focused = 1;
    }

    blur(): void {
        for (const shape of this.shapes) {
            shape.blur();
        }
        this.focused = 0;
    }

    draw(gl: WebGL2RenderingContext, map: Map<string, UniformInfo>, uniforms?: UniformDynamic<ShapeLike>, offset = 0) {
        if (!this.visible) {
            return;
        }

        for (const shape of this.shapes) {
            shape.draw(gl, map, uniforms, offset);
            offset += shape.vertices.length/STRIDE;
        }
    }
}

export class Node extends Composite {
    constructor(
        gl: WebGL2RenderingContext,
        {id = 0, x = 0, y = 0, z = 0}: CompositeProps = {}) {
        super(gl, {id, display: "fixed", x, z, shapes: [
            new Sphere(gl, 0.015, 16, 16, {y, x: 0, z: 0}),
            new Circle(gl, 0.02, 16, {type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8}),
        ]});
    }
}

export class Edge extends Composite {
    constructor(
        gl: WebGL2RenderingContext,
        start: Array<number>,
        end: Array<number>,
        {id = 0, x = 0, y = 0, z = 0}: CompositeProps = {}) {
        super(gl, {id, x, z, shapes: [
            new Line(gl, start, end, 0.0075, {y}),
            new Line(gl, start, end, 0.0075, {
                type: ShapeType.SHADOW,
                y: 0.001,
                r: 0, g: 0, b: 0, a: 0.8
            }),
        ]});
        this.visible = 0;
    }
}

export class Icon extends Composite {
    constructor(
        gl: WebGL2RenderingContext,
        icon: number,
        logo: number,
        {id = 0, x = 0, y = 0, z = 0}: CompositeProps = {}) {
        super(gl, {id, x, z, shapes: [
            new Composite(gl, {id, display: "fixed", y, shapes: [
                new AtlasPlane(gl, icon, {type: ShapeType.LOGO, tex: 0, size: 0.03}),
                new Circle(gl, 0.015, 16, {type: ShapeType.SHADOW, y: -y+0.002, r: 0, g: 0, b: 0, a: 0.8}),
            ]}),
            new AtlasPlane(gl, logo, {
                type: ShapeType.HINT,
                tex: 1,
                size: 0.15,
                ratio: 0.5625,
                x: x*-0.33,
                y: y*5,
                z: -0.025,
                visible: 0
            }),
        ]});
    }
}

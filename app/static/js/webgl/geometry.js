var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mat4, vec3 } from "../linalg.js";
import { setUniform } from "./common.js";
import { createStaticBuffer, createStaticBufferN } from "./core.js";
// Default color (white).
const WHITE = [255, 255, 255];
const OBJECT_FILES = [
    "/static/objects/ico-sphere.bin",
    "/static/objects/root.bin",
    "/static/objects/plane-circle.bin",
    "/static/objects/line-segment.bin",
    "/static/objects/plane-square.bin",
];
// ShapeType is a bitfield enum.
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["COLORED"] = 0] = "COLORED";
    ShapeType[ShapeType["SPHERE"] = 2] = "SPHERE";
    ShapeType[ShapeType["LINE"] = 4] = "LINE";
    ShapeType[ShapeType["BACKGROUND"] = 8] = "BACKGROUND";
    ShapeType[ShapeType["SHADOW"] = 16] = "SHADOW";
    ShapeType[ShapeType["TEXTURED"] = 1] = "TEXTURED";
    ShapeType[ShapeType["LOGO"] = 1] = "LOGO";
    ShapeType[ShapeType["TEXT"] = 3] = "TEXT";
    ShapeType[ShapeType["SKILL"] = 3] = "SKILL";
    ShapeType[ShapeType["PROJECT"] = 5] = "PROJECT";
})(ShapeType || (ShapeType = {}));
// Alias for WebGL2RenderingContext constants.
var DrawType;
(function (DrawType) {
    DrawType[DrawType["LINES"] = WebGL2RenderingContext.LINES] = "LINES";
    DrawType[DrawType["TRIANGLES"] = WebGL2RenderingContext.TRIANGLES] = "TRIANGLES";
    DrawType[DrawType["TRIANGLE_STRIP"] = WebGL2RenderingContext.TRIANGLE_STRIP] = "TRIANGLE_STRIP";
    DrawType[DrawType["TRIANGLE_FAN"] = WebGL2RenderingContext.TRIANGLE_FAN] = "TRIANGLE_FAN";
})(DrawType || (DrawType = {}));
function createGrid(xmax, ymax, step) {
    const vertices = [];
    step = (xmax / ymax / step);
    for (let x = -xmax; x <= xmax; x += step) {
        // xyz uv nxnynz
        vertices.push(x, -0.005, -ymax, 0, 0, 0.6, 1, 1);
        vertices.push(x, -0.005, ymax, 0, 0, 0.6, 1, 1);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz uv nxnynz
        vertices.push(-xmax, -0.005, y, 0, 0, 0.6, 1, 1);
        vertices.push(xmax, -0.005, y, 0, 0, 0.6, 1, 1);
    }
    return new Float32Array(vertices).buffer;
}
const cache = new Map();
export class Shape {
    constructor(gl, method, id = -1, type = ShapeType.COLORED, data, { pos = [0, 0, 0], color = WHITE, pick_color = WHITE, display = "inherit", } = {}) {
        this.gl = gl;
        this.method = method;
        this.id = id;
        this.type = type;
        this.buffer = null;
        this.indices = 0;
        this.vertices = 0;
        this.visible = 1;
        this.hovered = 0;
        this.focused = 0;
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, data.then((res) => __awaiter(this, void 0, void 0, function* () {
                const view = new DataView(res);
                const n = view.getInt32(0, true) + 4;
                const vView = view.buffer.slice(4, n);
                const [vOK, vBuff] = createStaticBuffer(gl, vView);
                if (!vOK) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const iView = new Uint16Array(view.buffer, n, (view.byteLength - n) / 2);
                const [iOK, iBuff] = createStaticBuffer(gl, iView, gl.ELEMENT_ARRAY_BUFFER);
                if (!iOK) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([vBuff, iBuff]);
            })));
        }
        this.buffer = data.then((res) => __awaiter(this, void 0, void 0, function* () {
            const view = new DataView(res);
            const n = view.getInt32(0, true);
            // @ts-ignore
            this.vertices = n / Float32Array.BYTES_PER_ELEMENT;
            // @ts-ignore
            this.indices = (view.byteLength - (n + 4)) / Uint16Array.BYTES_PER_ELEMENT;
            return cache.get(this.constructor.name);
        }));
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.color = new Float32Array(color);
        this.pick_color = new Float32Array(pick_color);
        this.depth = 0;
        this.display = display;
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
            return;
        }
        this.hovered = 0;
    }
    focus() {
        this.hovered = 1;
        this.focused = 1;
    }
    blur() {
        this.hovered = 0;
        this.focused = 0;
    }
    draw(gl, map, drawObject, offset = 0) {
        if (!this.visible) {
            return;
        }
        for (const [key, val] of Object.entries(drawObject)) {
            if (!map.has(key) || !(val instanceof Function)) {
                continue;
            }
            setUniform(gl, map.get(key), val(this));
        }
        if (this.indices > 0) {
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_SHORT, offset * Uint16Array.BYTES_PER_ELEMENT * 2);
        }
    }
}
export class Grid extends Shape {
    constructor(gl, xmax, ymax, step, { id = 0, type = ShapeType.COLORED, pos = [0, 0, 0], color = WHITE, pick_color = WHITE, display = "fixed", }) {
        const data = new Promise(resolve => {
            const data = createGrid(xmax, ymax, step);
            const indices = new Uint16Array(data.byteLength / 32);
            for (let i = 0; i < indices.length; i++) {
                indices[i] = i;
            }
            const buff = new ArrayBuffer(4 + data.byteLength + indices.byteLength);
            const view = new DataView(buff);
            view.setInt32(0, data.byteLength, true);
            const vView = new Float32Array(buff, 4, data.byteLength / Float32Array.BYTES_PER_ELEMENT);
            vView.set(new Float32Array(data));
            const iView = new Uint16Array(buff, 4 + data.byteLength, indices.length);
            iView.set(indices);
            resolve(buff);
        });
        super(gl, DrawType.LINES, id, type, data, { pos, color, pick_color, display });
    }
}
export class Sphere extends Shape {
    constructor(gl, { id = -1, type = ShapeType.SPHERE, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(gl, gl.TRIANGLES, id, type, Sphere.data, { pos, color, pick_color, display });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .scale(scale[0], scale[1], scale[2]);
    }
}
Sphere.data = fetch(OBJECT_FILES[0]).then(res => res.arrayBuffer());
export class Root extends Shape {
    constructor(gl, { id = -1, type = ShapeType.COLORED, pos = [0, 0, 0], scale = [0.075, 0.125, 0.075], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(gl, gl.TRIANGLES, id, type, Root.data, { pos, color, pick_color, display });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotateX(-Math.PI / 2)
            .scale(scale[0], scale[1], scale[2]);
    }
}
Root.data = fetch(OBJECT_FILES[1]).then(res => res.arrayBuffer());
export class Circle extends Shape {
    constructor(gl, { id = -1, type = ShapeType.COLORED, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(gl, gl.TRIANGLE_STRIP, id, type, Circle.data, { pos, color, pick_color, display });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .scale(scale[0], scale[1], scale[2]);
    }
}
Circle.data = fetch(OBJECT_FILES[2]).then(res => res.arrayBuffer());
export class Background extends Circle {
    constructor(gl, { id = -1, type = ShapeType.SHADOW, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(gl, { id, type, pos, scale, color, pick_color, display });
        this.method = gl.TRIANGLE_FAN;
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotateX(-Math.PI / 2)
            .scale(scale[0] + 0.175, scale[1], scale[2] + 0.175);
    }
}
const lineDefault = {
    id: -1,
    type: ShapeType.LINE,
    color: WHITE,
    pick_color: WHITE,
    display: "inherit",
};
export class Line extends Shape {
    constructor(gl, start, end, scale, { id = -1, type = ShapeType.LINE, color = WHITE, pick_color = WHITE, display = "inherit", } = lineDefault) {
        super(gl, gl.TRIANGLES, id, type, Line.data, { color, pick_color, display });
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const dz = end[2] - start[2];
        const len = Math.hypot(dx, dy, dz);
        const up = new vec3(0, 1, 0);
        const dir = new vec3(dx, dy, dz).normalize();
        const axis = up.cross(dir).normalize();
        const theta = Math.acos(up.dot(dir));
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            dx / 2 + start[0], dy / 2 + start[1], dz / 2 + start[2], 1,
        ])
            .rotateAxis(axis, theta)
            .scale(scale, len / 2, scale);
    }
}
Line.data = fetch(OBJECT_FILES[3]).then(res => res.arrayBuffer());
export class Plane extends Shape {
    constructor(gl, depth, { id = -1, type = ShapeType.TEXTURED, pos = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "hidden", }) {
        super(gl, gl.TRIANGLES, id, type, Plane.data, { color, pick_color, display });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotate(rotation[0], rotation[1], rotation[2])
            .scale(scale[0], scale[1], scale[2]);
        this.depth = depth;
    }
}
Plane.data = fetch(OBJECT_FILES[4]).then(res => res.arrayBuffer());
export class Composite {
    constructor(gl, { id = -1, pos = [0, 0, 0], display = "inherit", visible = 1, shapes = [] }) {
        this.gl = gl;
        this.indices = 0;
        this.vertices = 0;
        this.method = 0;
        this.type = ShapeType.COLORED;
        this.color = null;
        this.pick_color = null;
        this.depth = 0;
        this.visible = 1;
        this.hovered = 0;
        this.focused = 0;
        const key = shapes.map(shape => shape.constructor.name).join();
        if (!cache.has(key)) {
            cache.set(key, Promise.all(shapes.map(shape => shape.buffer)).then(buffers => {
                const [cvOk, cvBuff] = createStaticBufferN(gl, shapes.reduce((acc, shape) => acc + shape.vertices * 4, 0));
                if (!cvOk) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [ciOk, ciBuff] = createStaticBufferN(gl, shapes.reduce((acc, shape) => acc + shape.indices * 4, 0), gl.ELEMENT_ARRAY_BUFFER);
                if (!ciOk) {
                    throw new Error("Failed to create index buffer.");
                }
                let offset = [0, 0];
                for (const [vBuff, iBuff] of buffers) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
                    const vView = new Float32Array(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4);
                    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vView, 0);
                    const iView = new Uint16Array(gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 2);
                    gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, iView, 0);
                    for (let i = 0; i < iView.length; i++) {
                        iView[i] += offset[0] / (8 * 4);
                    }
                    gl.bindBuffer(gl.ARRAY_BUFFER, cvBuff);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ciBuff);
                    gl.bufferSubData(gl.ARRAY_BUFFER, offset[0], vView);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset[1], iView);
                    offset[0] += vView.byteLength;
                    offset[1] += iView.length * 4;
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }
                return Promise.resolve([cvBuff, ciBuff]);
            }));
        }
        this.buffer = cache.get(key).then(([vBuff, iBuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / Float32Array.BYTES_PER_ELEMENT;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / Uint16Array.BYTES_PER_ELEMENT;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vBuff, iBuff];
        });
        this.id = id;
        this.shapes = shapes;
        for (const shape of this) {
            if (shape.id == -1) {
                // Hijack the id.
                Reflect.set(shape, "id", id);
            }
            // Hijack the world matrix.
            shape.world[12] += pos[0];
            shape.world[13] += pos[1];
            shape.world[14] += pos[2];
        }
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.display = display;
        this.visible = visible;
    }
    *[Symbol.iterator]() {
        for (const shape of this.shapes) {
            yield* shape;
        }
    }
    show() {
        for (const shape of this.shapes) {
            if (shape.display == "hidden" && !shape.focused) {
                continue;
            }
            shape.visible = 1;
        }
    }
    hide() {
        if (this.display == "fixed") {
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
    }
    hoverOut() {
        for (const shape of this.shapes) {
            shape.hovered = 0;
        }
    }
    focus() {
        for (const shape of this.shapes) {
            shape.focused = 1;
        }
    }
    blur() {
        for (const shape of this.shapes) {
            shape.focused = 0;
        }
    }
    draw(gl, map, drawInfo, offset = 0) {
        if (!this.visible) {
            return;
        }
        for (const shape of this.shapes) {
            shape.draw(gl, map, drawInfo, offset);
            offset += shape.indices > 0 ? shape.indices : shape.vertices;
        }
    }
}
export class RootNode extends Composite {
    constructor(gl, { id = -1, pos = [0, 0, 0] }) {
        super(gl, { id, display: "fixed", pos, shapes: [
                new Root(gl, { pos: [0.0, 0.05, 0.0], pick_color: [255, 141, 35] }),
                new Background(gl, { type: ShapeType.SHADOW, pos: [0.0, 0.07, 0.0], color: [102, 51, 153] }),
                new Circle(gl, { id: 0, type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: [0, 0, 0] }),
            ] });
    }
}
export class Node extends Composite {
    constructor(gl, { id = -1, pos = [0, 0, 0] }) {
        super(gl, { id, display: "fixed", pos, shapes: [
                new Sphere(gl, { pos: [0.0, 0.06, 0.0], pick_color: [255, 141, 35] }),
                new Circle(gl, { id: 0, type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: [0, 0, 0] }),
            ] });
    }
}
export class Edge extends Composite {
    constructor(gl, start, end) {
        super(gl, { id: -1, pos: [-start[0], 0.0, -start[2]], shapes: [
                new Line(gl, start, end, 0.0015, { pick_color: [255, 141, 35] }),
                new Line(gl, [start[0] - 0.0025, 0.005, start[2] + 0.01], [end[0] - 0.0025, 0.005, end[2] + 0.025], 0.00125, { type: ShapeType.SHADOW, color: [0, 0, 0] }),
            ] });
        this.visible = 0;
    }
}
export class Logo extends Composite {
    constructor(gl, depth, { id = 0, pos = [0, 0, 0] }) {
        super(gl, { id, display: "hidden", pos, shapes: [
                new Plane(gl, depth, { pos: [0.0, 0.1, 0.0], rotation: [-Math.PI / 2, 0.0, 0.0], scale: [1.2, 1.0, 1.0] }),
                new Circle(gl, { id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0] }),
            ] });
        this.visible = 0;
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[0]);
        super.draw(gl, map, drawInfo, offset);
    }
}
export class Text extends Composite {
    constructor(gl, depth, { id = 0, display = "fixed", pos = [0, 0, 0], rotation = [0, 0, 0] }) {
        super(gl, { id, display, pos: [pos[0], 0.002, pos[2]], shapes: [
                new Plane(gl, depth, { type: ShapeType.TEXT, rotation, scale: [2.5, 1.0, 1.5] }),
            ] });
        this.visible = display == "fixed" ? 1 : 0;
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[1]);
        super.draw(gl, map, drawInfo, offset);
    }
}
export class Skill extends Composite {
    constructor(gl, depth, { id = 0, pos = [0, 0, 0], rotation = [-Math.PI / 2, 0.0, 0.0], scale = [0.75, 1.0, 0.75] }) {
        super(gl, { id, display: "hidden", pos, shapes: [
                new Plane(gl, depth, { pos: [0.0, 0.1, 0.0], rotation, scale }),
                new Circle(gl, { id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0] }),
            ] });
        this.visible = 0;
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[2]);
        super.draw(gl, map, drawInfo, offset);
    }
}
export class Project extends Composite {
    constructor(gl, depth, { id = 0, pos = [0, 0, 0], rotation = [-Math.PI / 2, 0.0, 0.0] }) {
        super(gl, { id, display: "hidden", pos, shapes: [
                new Plane(gl, depth, { pos: [0.0, 0.1, 0.0], rotation, scale: [1.2, 1.0, 1.0] }),
                new Circle(gl, { id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0] }),
            ] });
        this.visible = 0;
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[3]);
        super.draw(gl, map, drawInfo, offset);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy93ZWJnbC9nZW9tZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN4QyxPQUFPLEVBQXFCLFVBQVUsRUFBZ0IsTUFBTSxhQUFhLENBQUM7QUFDMUUsT0FBTyxFQUFDLGtCQUFrQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRWxFLHlCQUF5QjtBQUN6QixNQUFNLEtBQUssR0FBNkIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBRXZELE1BQU0sWUFBWSxHQUFHO0lBQ2pCLGdDQUFnQztJQUNoQywwQkFBMEI7SUFDMUIsa0NBQWtDO0lBQ2xDLGtDQUFrQztJQUNsQyxrQ0FBa0M7Q0FDckMsQ0FBQTtBQUVELGdDQUFnQztBQUNoQyxNQUFNLENBQU4sSUFBWSxTQVdYO0FBWEQsV0FBWSxTQUFTO0lBQ2pCLCtDQUFpQixDQUFBO0lBQ2pCLDZDQUFxQyxDQUFBO0lBQ3JDLHlDQUFxQyxDQUFBO0lBQ3JDLHFEQUFxQyxDQUFBO0lBQ3JDLDhDQUFzQyxDQUFBO0lBQ3RDLGlEQUFpQixDQUFBO0lBQ2pCLHlDQUFzQyxDQUFBO0lBQ3RDLHlDQUFzQyxDQUFBO0lBQ3RDLDJDQUFzQyxDQUFBO0lBQ3RDLCtDQUFzQyxDQUFBO0FBQzFDLENBQUMsRUFYVyxTQUFTLEtBQVQsU0FBUyxRQVdwQjtBQUVELDhDQUE4QztBQUM5QyxJQUFLLFFBS0o7QUFMRCxXQUFLLFFBQVE7SUFDVCw2QkFBUSxzQkFBc0IsQ0FBQyxLQUFLLFdBQUEsQ0FBQTtJQUNwQyxpQ0FBWSxzQkFBc0IsQ0FBQyxTQUFTLGVBQUEsQ0FBQTtJQUM1QyxzQ0FBaUIsc0JBQXNCLENBQUMsY0FBYyxvQkFBQSxDQUFBO0lBQ3RELG9DQUFlLHNCQUFzQixDQUFDLFlBQVksa0JBQUEsQ0FBQTtBQUN0RCxDQUFDLEVBTEksUUFBUSxLQUFSLFFBQVEsUUFLWjtBQUVELFNBQVMsVUFBVSxDQUFDLElBQVksRUFBRSxJQUFZLEVBQUUsSUFBWTtJQUN4RCxNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDcEIsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFDLElBQUksR0FBQyxJQUFJLENBQUMsQ0FBQztJQUV4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3ZDLGdCQUFnQjtRQUNoQixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDakQsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUN2QyxnQkFBZ0I7UUFDaEIsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVELE9BQU8sSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzdDLENBQUM7QUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBK0MsQ0FBQztBQWNyRSxNQUFNLE9BQU8sS0FBSztJQWFkLFlBQ2EsRUFBMEIsRUFDMUIsTUFBYyxFQUNkLEtBQUssQ0FBQyxDQUFDLEVBQ1AsT0FBTyxTQUFTLENBQUMsT0FBTyxFQUNqQyxJQUEwQixFQUMxQixFQUNJLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ2YsS0FBSyxHQUFHLEtBQUssRUFBRSxVQUFVLEdBQUcsS0FBSyxFQUNqQyxPQUFPLEdBQUcsU0FBUyxNQUNQLEVBQUU7UUFUVCxPQUFFLEdBQUYsRUFBRSxDQUF3QjtRQUMxQixXQUFNLEdBQU4sTUFBTSxDQUFRO1FBQ2QsT0FBRSxHQUFGLEVBQUUsQ0FBSztRQUNQLFNBQUksR0FBSixJQUFJLENBQW9CO1FBaEJyQixXQUFNLEdBQXdDLElBQUssQ0FBQztRQUNwRCxZQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ1osYUFBUSxHQUFHLENBQUMsQ0FBQztRQU10QixZQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ1osWUFBTyxHQUFHLENBQUMsQ0FBQztRQUNaLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFjZixJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDcEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUE2QixDQUFNLEdBQUcsRUFBQyxFQUFFO2dCQUMvRSxNQUFNLElBQUksR0FBRyxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUVyQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsa0JBQWtCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO2dCQUN2RCxDQUFDO2dCQUNELE1BQU0sS0FBSyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFDekUsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM1RSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ1AsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO2dCQUN0RCxDQUFDO2dCQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQU0sRUFBRSxLQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzdDLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztRQUNSLENBQUM7UUFDRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQTZCLENBQU0sR0FBRyxFQUFDLEVBQUU7WUFDNUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDL0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakMsYUFBYTtZQUNiLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxHQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztZQUNqRCxhQUFhO1lBQ2IsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUM7WUFFekUsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFFLENBQUM7UUFDN0MsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUM7WUFDbEIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUM1QixDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUMzQixDQUFDO0lBRUQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7UUFDZCxNQUFNLElBQUksQ0FBQztJQUNmLENBQUM7SUFFRCxJQUFJO1FBQ0EsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELElBQUk7UUFDQSxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUMxQyxPQUFPO1FBQ1gsQ0FBQztRQUNELElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxPQUFPO1FBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELFFBQVE7UUFDSixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNmLE9BQU87UUFDWCxDQUFDO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSTtRQUNBLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJLENBQUMsRUFBMEIsRUFBRSxHQUErQixFQUFFLFVBQTJCLEVBQUUsTUFBTSxHQUFHLENBQUM7UUFDckcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNoQixPQUFPO1FBQ1gsQ0FBQztRQUVELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7WUFDbEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsWUFBWSxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUM5QyxTQUFTO1lBQ2IsQ0FBQztZQUNELFVBQVUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxjQUFjLEVBQUUsTUFBTSxHQUFDLFdBQVcsQ0FBQyxpQkFBaUIsR0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRyxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBRUQsTUFBTSxPQUFPLElBQUssU0FBUSxLQUFLO0lBQzNCLFlBQ0ksRUFBMEIsRUFDMUIsSUFBWSxFQUNaLElBQVksRUFDWixJQUFZLEVBQ1osRUFDSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxTQUFTLENBQUMsT0FBTyxFQUNoQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNmLEtBQUssR0FBRyxLQUFLLEVBQUUsVUFBVSxHQUFHLEtBQUssRUFDakMsT0FBTyxHQUFHLE9BQU8sR0FDUjtRQUViLE1BQU0sSUFBSSxHQUFHLElBQUksT0FBTyxDQUFjLE9BQU8sQ0FBQyxFQUFFO1lBQzVDLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzFDLE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixDQUFDO1lBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFXLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3ZFLE1BQU0sSUFBSSxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFFeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsVUFBVSxHQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3hGLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUVsQyxNQUFNLEtBQUssR0FBRyxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3pFLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsS0FBSyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztJQUNqRixDQUFDO0NBQ0o7QUFFRCxNQUFNLE9BQU8sTUFBTyxTQUFRLEtBQUs7SUFJN0IsWUFDSSxFQUEwQixFQUMxQixFQUNJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFDaEMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNqQixLQUFLLEdBQUcsS0FBSyxFQUFFLFVBQVUsR0FBRyxLQUFLLEVBQ2pDLE9BQU8sR0FBRyxTQUFTLEdBQ1Y7UUFFYixLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFHLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUNuRixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDNUIsQ0FBQzthQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7O0FBckJnQixXQUFJLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBd0JsRixNQUFNLE9BQU8sSUFBSyxTQUFRLEtBQUs7SUFJM0IsWUFDSSxFQUEwQixFQUMxQixFQUNJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFDakMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDZixLQUFLLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUM3QixLQUFLLEdBQUcsS0FBSyxFQUFFLFVBQVUsR0FBRyxLQUFLLEVBQ2pDLE9BQU8sR0FBRyxTQUFTLEdBQ1Y7UUFFYixLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFHLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUVqRixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDNUIsQ0FBQzthQUNELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQyxDQUFDO2FBQ25CLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7O0FBdkJnQixTQUFJLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBMEJsRixNQUFNLE9BQU8sTUFBTyxTQUFRLEtBQUs7SUFJN0IsWUFDSSxFQUEwQixFQUMxQixFQUNJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFDakMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNqQixLQUFLLEdBQUcsS0FBSyxFQUFFLFVBQVUsR0FBRyxLQUFLLEVBQ2pDLE9BQU8sR0FBRyxTQUFTLEdBQ1Y7UUFFYixLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxjQUFjLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLEVBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUV2RixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDNUIsQ0FBQzthQUNELEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7O0FBdEJnQixXQUFJLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBeUJsRixNQUFNLE9BQU8sVUFBVyxTQUFRLE1BQU07SUFJbEMsWUFDSSxFQUEwQixFQUMxQixFQUNJLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFDaEMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDZixLQUFLLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNqQixLQUFLLEdBQUcsS0FBSyxFQUFFLFVBQVUsR0FBRyxLQUFLLEVBQ2pDLE9BQU8sR0FBRyxTQUFTLEdBQ1Y7UUFFYixLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUM5RCxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUM7UUFFOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQztZQUNsQixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1NBQzVCLENBQUM7YUFDRCxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUMsQ0FBQzthQUNuQixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JELENBQUM7Q0FDSjtBQUVELE1BQU0sV0FBVyxHQUFlO0lBQzVCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDTixJQUFJLEVBQUUsU0FBUyxDQUFDLElBQUk7SUFDcEIsS0FBSyxFQUFFLEtBQUs7SUFDWixVQUFVLEVBQUUsS0FBSztJQUNqQixPQUFPLEVBQUUsU0FBUztDQUNyQixDQUFBO0FBRUQsTUFBTSxPQUFPLElBQUssU0FBUSxLQUFLO0lBSTNCLFlBQ0ksRUFBMEIsRUFDMUIsS0FBb0IsRUFDcEIsR0FBa0IsRUFDbEIsS0FBYSxFQUNiLEVBQ0ksRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxFQUM5QixLQUFLLEdBQUcsS0FBSyxFQUFFLFVBQVUsR0FBRyxLQUFLLEVBQ2pDLE9BQU8sR0FBRyxTQUFTLE1BQ1AsV0FBVztRQUUzQixLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBRTNFLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDN0MsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDO1lBQ2xCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDVixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO1lBQ1YsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztZQUNWLEVBQUUsR0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxF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
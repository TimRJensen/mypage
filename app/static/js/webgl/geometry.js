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
    "/static/objects/indexed-line-segment.bin",
    "/static/objects/circle.bin",
    "/static/objects/line-plane.bin",
];
// ShapeType is a bitfield enum.
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["COLORED"] = 0] = "COLORED";
    ShapeType[ShapeType["SPHERE"] = 2] = "SPHERE";
    ShapeType[ShapeType["LINE"] = 4] = "LINE";
    ShapeType[ShapeType["SHADOW"] = 6] = "SHADOW";
    ShapeType[ShapeType["TEXTURED"] = 1] = "TEXTURED";
    ShapeType[ShapeType["LOGO"] = 1] = "LOGO";
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
    step = (xmax / ymax / step) * 2;
    for (let x = -xmax; x <= xmax; x += step) {
        // xyz uv nxnynz
        vertices.push(x, 0, -ymax, 0, 0, 0.6, 1, 1);
        vertices.push(x, 0, ymax, 0, 0, 0.6, 1, 1);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz uv nxnynz
        vertices.push(-xmax, 0, y, 0, 0, 0.6, 1, 1);
        vertices.push(xmax, 0, y, 0, 0, 0.6, 1, 1);
    }
    return new Float32Array(vertices).buffer;
}
export class Shape {
    constructor(method, id = -1, type = ShapeType.COLORED, { pos = [0, 0, 0], color = WHITE, pick_color = WHITE, display = "inherit", } = {}) {
        this.method = method;
        this.id = id;
        this.type = type;
        this.buffer = null;
        this.indices = 0;
        this.vertices = 0;
        this.visible = 1;
        this.hovered = 0;
        this.focused = 0;
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.color = new Float32Array(color);
        this.pick_color = new Float32Array(pick_color);
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
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_INT, offset * 4);
        }
    }
}
export class Grid extends Shape {
    constructor(gl, xmax, ymax, step, { id = 0, type = ShapeType.COLORED, pos = [0, 0, 0], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(DrawType.LINES, id, type, { pos, color, pick_color, display });
        this.vertices = 0;
        this.indices = 0;
        this.buffer = Promise.resolve().then(() => {
            const data = createGrid(xmax, ymax, step);
            const [vok, vbuff] = createStaticBuffer(gl, data);
            if (!vok) {
                throw new Error("Failed to create buffer.");
            }
            const indices = new Uint32Array(data.byteLength / 4);
            for (let i = 0; i < indices.length; i++) {
                indices[i] = i;
            }
            const [iok, ibuff] = createStaticBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
            if (!iok) {
                throw new Error("Failed to create index buffer.");
            }
            // @ts-ignore
            this.vertices = data.byteLength / 4, this.indices = indices.byteLength / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vbuff, ibuff];
        });
    }
}
const cache = new Map();
export class Sphere extends Shape {
    constructor(gl, { id = -1, type = ShapeType.SPHERE, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(DrawType.TRIANGLES, id, type, { pos, color, pick_color, display });
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[0]).then((res) => __awaiter(this, void 0, void 0, function* () {
                const view = new DataView(yield res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([vbuff, ibuff]);
            })));
        }
        this.buffer = cache.get(this.constructor.name).then(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vbuff, ibuff];
        });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]).scale(scale[0], scale[1], scale[2]);
    }
}
export class Circle extends Shape {
    constructor(gl, { id = 0, type = ShapeType.COLORED, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(DrawType.TRIANGLE_STRIP, id, type, { pos, color, pick_color, display });
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[2]).then((res) => __awaiter(this, void 0, void 0, function* () {
                const view = new DataView(yield res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([vbuff, ibuff]);
            })));
        }
        this.buffer = cache.get(this.constructor.name).then(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vbuff, ibuff];
        });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]).scale(scale[0], scale[1], scale[2]);
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
    constructor(gl, start, end, { id = -1, type = ShapeType.LINE, color = WHITE, pick_color = WHITE, display = "inherit", } = lineDefault) {
        super(DrawType.TRIANGLES, id, type, { color, pick_color, display });
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[1]).then((res) => __awaiter(this, void 0, void 0, function* () {
                const view = new DataView(yield res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([vbuff, ibuff]);
            })));
        }
        this.buffer = cache.get(this.constructor.name).then(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vbuff, ibuff];
        });
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
            .scale(0.0015, len / 2, 0.0015); // TODO: Extract the width.
    }
}
export class LinePlane extends Shape {
    constructor(gl, start, end, { id = -1, type = ShapeType.LINE, color = WHITE, pick_color = WHITE, display = "inherit", } = lineDefault) {
        super(DrawType.TRIANGLES, id, type, { color, pick_color, display });
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[1]).then((res) => __awaiter(this, void 0, void 0, function* () {
                const view = new DataView(yield res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([vbuff, ibuff]);
            })));
        }
        this.buffer = cache.get(this.constructor.name).then(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vbuff, ibuff];
        });
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
            dx / 2 + start[0], 0.005, dz / 2 + start[2] + 0.005, 1,
        ])
            .rotateAxis(axis, theta)
            .scale(0.0015, len / 2, 0.0015); // TODO: Extract the width.
    }
}
export class Composite extends Shape {
    constructor(gl, { id = 0, type = ShapeType.COLORED, pos = [0, 0, 0], display = "inherit", visible = 1, shapes = [] }) {
        super(0, id, type, { pos });
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
                    const iView = new Int32Array(gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4);
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
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / 4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vBuff, iBuff];
        });
        this.shapes = shapes;
        for (const shape of this) {
            if (shape.id != -1) {
                continue;
            }
            // Hijack the id.
            Reflect.set(shape, "id", id);
        }
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
    draw(gl, map, drawInfo, offset = 0) {
        if (!this.visible) {
            return;
        }
        for (const shape of this.shapes) {
            shape.draw(gl, map, drawInfo, offset);
            if (shape.indices > 0) {
                offset += shape.indices;
            }
            else {
                offset += shape.vertices;
            }
        }
    }
}
export class Node extends Composite {
    constructor(gl, { id = -1, pos = [0, 0, 0] }) {
        super(gl, { id, display: "fixed", shapes: [
                new Sphere(gl, { pos: [pos[0], pos[1], pos[2]], scale: [0.025, 0.025, 0.025], pick_color: [255, 141, 35] }),
                new Circle(gl, { type: ShapeType.SHADOW, pos: [pos[0], 0.01, pos[2]], scale: [0.0275, 0.0275, 0.0275], color: [0, 0, 0] }),
            ] });
    }
}
export class Edge extends Composite {
    constructor(gl, start, end) {
        super(gl, { id: -1, shapes: [
                new Line(gl, start, end, { pick_color: [255, 141, 35] }),
                new LinePlane(gl, start, end, { type: ShapeType.SHADOW, color: [0, 0, 0] }),
            ] });
        this.visible = 0;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy93ZWJnbC9nZW9tZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN4QyxPQUFPLEVBQVcsVUFBVSxFQUFnQixNQUFNLGFBQWEsQ0FBQztBQUNoRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFbEUseUJBQXlCO0FBQ3pCLE1BQU0sS0FBSyxHQUE2QixDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUE7QUFFdkQsTUFBTSxZQUFZLEdBQUc7SUFDakIsZ0NBQWdDO0lBQ2hDLDBDQUEwQztJQUMxQyw0QkFBNEI7SUFDNUIsZ0NBQWdDO0NBQ25DLENBQUE7QUFFRCxnQ0FBZ0M7QUFDaEMsTUFBTSxDQUFOLElBQVksU0FPWDtBQVBELFdBQVksU0FBUztJQUNqQiwrQ0FBaUIsQ0FBQTtJQUNqQiw2Q0FBcUMsQ0FBQTtJQUNyQyx5Q0FBcUMsQ0FBQTtJQUNyQyw2Q0FBcUMsQ0FBQTtJQUNyQyxpREFBaUIsQ0FBQTtJQUNqQix5Q0FBc0MsQ0FBQTtBQUMxQyxDQUFDLEVBUFcsU0FBUyxLQUFULFNBQVMsUUFPcEI7QUFFRCw4Q0FBOEM7QUFDOUMsSUFBSyxRQUtKO0FBTEQsV0FBSyxRQUFRO0lBQ1QsNkJBQVEsc0JBQXNCLENBQUMsS0FBSyxXQUFBLENBQUE7SUFDcEMsaUNBQVksc0JBQXNCLENBQUMsU0FBUyxlQUFBLENBQUE7SUFDNUMsc0NBQWlCLHNCQUFzQixDQUFDLGNBQWMsb0JBQUEsQ0FBQTtJQUN0RCxvQ0FBZSxzQkFBc0IsQ0FBQyxZQUFZLGtCQUFBLENBQUE7QUFDdEQsQ0FBQyxFQUxJLFFBQVEsS0FBUixRQUFRLFFBS1o7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFZLEVBQUUsSUFBWSxFQUFFLElBQVk7SUFDeEQsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLElBQUksR0FBRyxDQUFDLElBQUksR0FBQyxJQUFJLEdBQUMsSUFBSSxDQUFDLEdBQUMsQ0FBQyxDQUFDO0lBRTFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDdkMsZ0JBQWdCO1FBQ2hCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFDdkMsZ0JBQWdCO1FBQ2hCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELE9BQU8sSUFBSSxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQzdDLENBQUM7QUFjRCxNQUFNLE9BQU8sS0FBSztJQVlkLFlBQ2EsTUFBYyxFQUNkLEtBQUssQ0FBQyxDQUFDLEVBQ1As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
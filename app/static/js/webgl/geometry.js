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
import { createStaticBuffer } from "./core.js";
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
            Reflect.set(this, "vertices", n / Float32Array.BYTES_PER_ELEMENT);
            Reflect.set(this, "indices", (view.byteLength - (n + 4)) / Uint16Array.BYTES_PER_ELEMENT);
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
        this.visible = display == "hidden" ? 0 : 1;
    }
    *[Symbol.iterator]() {
        yield this;
    }
    show() {
        this.visible = 1;
    }
    hide() {
        switch (true) {
            case this.focused == 1:
            case this.hovered == 1:
            case this.display == "fixed":
            case this.display == "inherit":
                return;
        }
        this.visible = 0;
    }
    focus() {
        this.focused = 1;
        this.visible = 1;
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
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_SHORT, offset * Uint16Array.BYTES_PER_ELEMENT);
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
    constructor(gl, { id = -1, type = ShapeType.COLORED, pos = [0, 0, 0], scale = [0.075, 0.075, 0.075], color = WHITE, pick_color = WHITE, display = "inherit", }) {
        super(gl, gl.TRIANGLES, id, type, Root.data, { pos, color, pick_color, display });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotateX(-0.25)
            .scale(scale[0], scale[1], scale[2]);
    }
}
Root.data = fetch(OBJECT_FILES[1]).then(res => res.arrayBuffer());
export class Circle extends Shape {
    constructor(gl, { id = 0, type = ShapeType.COLORED, pos = [0, 0, 0], scale = [1, 1, 1], color = WHITE, pick_color = WHITE, display = "inherit", }) {
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
            .scale(scale[0] + 0.15, scale[1], scale[2] + 0.15);
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
            .scale(scale, len * 0.5, scale);
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
    constructor(gl, { id = -1, pos = [0, 0, 0], display = "inherit", shapes = [] }) {
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
                const vBytes = shapes.reduce((acc, shape) => acc + shape.vertices, 0);
                const iBytes = shapes.reduce((acc, shape) => acc + shape.indices, 0);
                const vAll = new Float32Array(vBytes * 4);
                const iAll = new Uint16Array(iBytes * 2);
                let offset = [0, 0];
                for (const [vBuff, iBuff] of buffers) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
                    const vSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / Float32Array.BYTES_PER_ELEMENT;
                    const vView = new Float32Array(vSize);
                    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vView, 0);
                    vAll.set(vView, offset[0]);
                    const iSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / Uint16Array.BYTES_PER_ELEMENT;
                    const iView = new Uint16Array(iSize);
                    gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, iView, 0);
                    iAll.set(iView, offset[1]);
                    const n = offset[0] / 8;
                    for (let i = offset[1]; i < offset[1] + iSize; i++) {
                        iAll[i] += n;
                    }
                    offset[0] += vSize;
                    offset[1] += iSize;
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }
                const [cvOk, cvBuff] = createStaticBuffer(gl, vAll);
                if (!cvOk) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [ciOk, ciBuff] = createStaticBuffer(gl, iAll, gl.ELEMENT_ARRAY_BUFFER);
                if (!ciOk) {
                    throw new Error("Failed to create index buffer.");
                }
                return Promise.resolve([cvBuff, ciBuff]);
            }));
        }
        this.buffer = cache.get(key).then(([vBuff, iBuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
            Reflect.set(this, "vertices", gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / Float32Array.BYTES_PER_ELEMENT);
            Reflect.set(this, "indices", gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / Uint16Array.BYTES_PER_ELEMENT);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            return [vBuff, iBuff];
        });
        this.id = id;
        this.shapes = shapes;
        for (const shape of shapes) {
            for (const child of shape) {
                // Hijack the id.
                Reflect.set(child, "id", child.id == -1 ? id : child.id);
                // Hijack the world matrix.
                child.world[12] += pos[0];
                child.world[13] += pos[1];
                child.world[14] += pos[2];
            }
        }
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.display = display;
    }
    *[Symbol.iterator]() {
        for (const shape of this.shapes) {
            yield* shape;
        }
    }
    show() {
        for (const shape of this.shapes) {
            shape.show();
        }
        this.visible = 1;
    }
    hide() {
        for (const shape of this.shapes) {
            shape.hide();
        }
        switch (true) {
            case this.focused == 1:
            case this.hovered == 1:
            case this.display == "fixed":
            case this.display == "inherit":
                return;
        }
        this.visible = 0;
    }
    focus() {
        for (const shape of this.shapes) {
            shape.focus();
        }
        this.focused = 1;
        this.visible = 1;
    }
    blur() {
        for (const shape of this.shapes) {
            shape.blur();
        }
        this.hovered = 0;
        this.focused = 0;
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
    constructor(gl, { id = -1, display = "fixed", pos = [0, 0, 0] }) {
        super(gl, { id, display, pos, shapes: [
                new Root(gl, { display, pos: [0.0, 0.025, 0.0], pick_color: [255, 141, 35] }),
                new Background(gl, { id: -1, type: ShapeType.BACKGROUND, pos: [0.0, 0.075, 0.0] }),
                new Circle(gl, { display, type: ShapeType.SHADOW, pos: [0.0, 0.015, 0.0], color: [0, 0, 0] }),
            ] });
    }
}
export class Node extends Composite {
    constructor(gl, { id = -1, display = "fixed", pos = [0, 0, 0] }) {
        super(gl, { id, pos, shapes: [
                new Sphere(gl, { display, pos: [0.0, 0.06, 0.0], pick_color: [255, 141, 35] }),
                new Circle(gl, { display, type: ShapeType.SHADOW, pos: [0.0, 0.015, 0.0], color: [0, 0, 0] }),
            ] });
    }
}
export class Edge extends Composite {
    constructor(gl, start, end) {
        super(gl, { pos: [-start[0], 0.0, -start[2]], shapes: [
                new Line(gl, start, end, 0.0015, { display: "hidden", pick_color: [255, 141, 35] }),
                new Line(gl, [start[0], 0.0125, start[2]], [end[0], 0.0125, end[2]], 0.00125, { display: "hidden", type: ShapeType.SHADOW, color: [0, 0, 0] }),
            ] });
    }
}
export class Logo extends Composite {
    constructor(gl, depth, { id = 0, display = "hidden", pos = [0, 0, 0], scale = [1.2, 1.0, 1.0] }) {
        super(gl, { id, display, visible: 0, pos: [pos[0], 0.0, pos[2]], shapes: [
                new Plane(gl, depth, { display, pos: [0.0, pos[1], 0.0], rotation: [-Math.PI / 2, 0.0, 0.0], scale }),
                new Circle(gl, { display, type: ShapeType.SHADOW, pos: [0.0, 0.015, 0.0], color: [0, 0, 0] }),
            ] });
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[0]);
        super.draw(gl, map, drawInfo, offset);
    }
}
export class Text extends Composite {
    constructor(gl, depth, { id = 0, display = "fixed", pos = [0, 0, 0], scale = [2.5, 1.0, 1.5], rotation = [-Math.PI / 2, 0.0, 0.0] }) {
        super(gl, { id, pos: [pos[0], pos[1], pos[2]], shapes: [
                new Plane(gl, depth, { display, type: ShapeType.TEXT, rotation, scale }),
            ] });
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[1]);
        super.draw(gl, map, drawInfo, offset);
    }
}
export class Project extends Composite {
    constructor(gl, depth, { id = 0, pos = [0, 0, 0], rotation = [-Math.PI / 2, 0.0, 0.0] }) {
        super(gl, { id, visible: 0, pos, shapes: [
                new Plane(gl, depth, { display: "hidden", pos: [0.0, 0.1, 0.0], rotation, scale: [1.2, 1.0, 1.0] }),
                new Circle(gl, { display: "hidden", type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0] }),
            ] });
    }
    draw(gl, map, drawInfo, offset) {
        const { atlases } = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[2]);
        super.draw(gl, map, drawInfo, offset);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy93ZWJnbC9nZW9tZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN4QyxPQUFPLEVBQXFCLFVBQVUsRUFBZ0IsTUFBTSxhQUFhLENBQUM7QUFDMUUsT0FBTyxFQUFDLGtCQUFrQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBRTdDLHlCQUF5QjtBQUN6QixNQUFNLEtBQUssR0FBNkIsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0FBRXZELE1BQU0sWUFBWSxHQUFHO0lBQ2pCLGdDQUFnQztJQUNoQywwQkFBMEI7SUFDMUIsa0NBQWtDO0lBQ2xDLGtDQUFrQztJQUNsQyxrQ0FBa0M7Q0FDckMsQ0FBQTtBQUVELGdDQUFnQztBQUNoQyxNQUFNLENBQU4sSUFBWSxTQVNYO0FBVEQsV0FBWSxTQUFTO0lBQ2pCLCtDQUFpQixDQUFBO0lBQ2pCLDZDQUFxQyxDQUFBO0lBQ3JDLHlDQUFxQyxDQUFBO0lBQ3JDLHFEQUFxQyxDQUFBO0lBQ3JDLDhDQUFzQyxDQUFBO0lBQ3RDLGlEQUFpQixDQUFBO0lBQ2pCLHlDQUFzQyxDQUFBO0lBQ3RDLHlDQUFzQyxDQUFBO0FBQzFDLENBQUMsRUFUVyxTQUFTLEtBQVQsU0FBUyxRQVNwQjtBQUVELDhDQUE4QztBQUM5QyxJQUFLLFFBS0o7QUFMRCxXQUFLLFFBQVE7SUFDVCw2QkFBUSxzQkFBc0IsQ0FBQyxLQUFLLFdBQUEsQ0FBQTtJQUNwQyxpQ0FBWSxzQkFBc0IsQ0FBQyxTQUFTLGVBQUEsQ0FBQTtJQUM1QyxzQ0FBaUIsc0JBQXNCLENBQUMsY0FBYyxvQkFBQSxDQUFBO0lBQ3RELG9DQUFlLHNCQUFzQixDQUFDLFlBQVksa0JBQUEsQ0FBQTtBQUN0RCxDQUFDLEVBTEksUUFBUSxLQUFSLFFBQVEsUUFL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
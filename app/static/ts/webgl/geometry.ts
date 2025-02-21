import {mat4, vec3} from "../linalg.js";
import {DrawInfo, setUniform, UniformObject} from "./common.js";
import {createStaticBuffer, createStaticBufferN} from "./core.js";

// Default color (white).
const WHITE: [number, number, number] = [255, 255, 255]

const OBJECT_FILES = [
    "/static/objects/ico-sphere.bin",
    "/static/objects/indexed-line-segment.bin",
    "/static/objects/circle.bin",
    "/static/objects/line-plane.bin",
]

// ShapeType is a bitfield enum.
export enum ShapeType {
    COLORED     = 0x0,
    SPHERE      = ShapeType.COLORED | 0x2,
    LINE        = ShapeType.COLORED | 0x4,
    SHADOW      = ShapeType.COLORED | 0x6,
    TEXTURED    = 0x1,
    LOGO        = ShapeType.TEXTURED | 0x1,
}

// Alias for WebGL2RenderingContext constants.
enum DrawType {
    LINES = WebGL2RenderingContext.LINES,
    TRIANGLES = WebGL2RenderingContext.TRIANGLES,
    TRIANGLE_STRIP = WebGL2RenderingContext.TRIANGLE_STRIP,
    TRIANGLE_FAN = WebGL2RenderingContext.TRIANGLE_FAN,
}

function createGrid(xmax: number, ymax: number, step: number) {
    const vertices = [];
    step = (xmax/ymax/step)*2;

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

type ShapeProps = {
    id?: number,
    type?: number,
    display?: "inherit" | "fixed" | "none",
    visible?: number,
    pos?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number],
    color?: [number, number, number],
    pick_color?: [number, number, number],
}

export class Shape  {
    public readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]> = null!;
    public readonly indices = 0;
    public readonly vertices = 0;
    public readonly color;
    public readonly pick_color;
    public readonly world;
    public display: "inherit" | "fixed" | "none";
    public visible = 1;
    public hovered = 0;
    public focused = 0;

    constructor(
        readonly method: GLenum,
        readonly id = -1,
        readonly type = ShapeType.COLORED,
        {
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = {},
    ) {
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

    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<Shape>, offset = 0) {
        if (!this.visible) {
            return;
        }

        for (const [key, val] of Object.entries(drawObject)) {
            if (!map.has(key) || !(val instanceof Function)) {
                continue;
            }
            setUniform(gl, map.get(key)!, val(this));
        }

        if (this.indices > 0) {
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_INT, offset*4);
        }
    }
}

export class Grid extends Shape {
    public override readonly buffer;
    public override readonly vertices = 0;
    public override readonly indices = 0;

    constructor(
        gl: WebGL2RenderingContext,
        xmax: number,
        ymax: number,
        step: number,
        {
            id = 0, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(DrawType.LINES, id, type, {pos, color, pick_color, display});
        this.buffer = Promise.resolve().then<[WebGLBuffer, WebGLBuffer]>(() => {
            const data = createGrid(xmax, ymax, step);
            const [vok, vbuff] = createStaticBuffer(gl, data);
            if (!vok) {
                throw new Error("Failed to create buffer.");
            }
            const indices = new Uint32Array(data.byteLength/4);
            for (let i = 0; i < indices.length; i++) {
                indices[i] = i;
            }
            const [iok, ibuff] = createStaticBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
            if (!iok) {
                throw new Error("Failed to create index buffer.");
            }
            // @ts-ignore
            this.vertices = data.byteLength/4, this.indices = indices.byteLength/4;
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

            return [vbuff!, ibuff!];
        });
    }
}

const cache = new Map<string, Promise<[WebGLBuffer, WebGLBuffer]>>();

export class Sphere extends Shape {
    public override readonly buffer;
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        {
            id = -1, type = ShapeType.SPHERE,
            pos = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps
    ) {
        super(DrawType.TRIANGLES, id, type,  {pos, color, pick_color, display});

        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[0]).then<[WebGLBuffer, WebGLBuffer]>(async res => {
                const view = new DataView(await res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;

                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
    
                return Promise.resolve([vbuff!, ibuff!]);
            }));
        } 
        this.buffer = cache.get(this.constructor.name)!.then<[WebGLBuffer, WebGLBuffer]>(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
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
    public override readonly buffer;
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        {
            id = 0, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(DrawType.TRIANGLE_STRIP, id, type, {pos, color, pick_color, display});
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[2]).then<[WebGLBuffer, WebGLBuffer]>(async res => {
                const view = new DataView(await res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;

                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
    
                return Promise.resolve([vbuff!, ibuff!]);
            }));
        } 
        this.buffer = cache.get(this.constructor.name)!.then<[WebGLBuffer, WebGLBuffer]>(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
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

const lineDefault: ShapeProps = {
    id: -1,
    type: ShapeType.LINE,
    color: WHITE,
    pick_color: WHITE,
    display: "inherit",      
}

export class Line extends Shape {
    public override readonly buffer;
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        start: Array<number>,
        end: Array<number>,
        {
            id = -1, type = ShapeType.LINE,
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = lineDefault,
    ) {
        super(DrawType.TRIANGLES, id, type, {color, pick_color, display});

        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[1]).then<[WebGLBuffer, WebGLBuffer]>(async res => {
                const view = new DataView(await res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;

                
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
    
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
    
                return Promise.resolve([vbuff!, ibuff!]);
            }));
        } 
        this.buffer = cache.get(this.constructor.name)!.then<[WebGLBuffer, WebGLBuffer]>(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
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
            dx/2 + start[0], dy/2 + start[1], dz/2 + start[2], 1,
        ])
            .rotateAxis(axis, theta)
            .scale(0.0015, len/2, 0.0015); // TODO: Extract the width.
    }
}
export class LinePlane extends Shape {
    public override readonly buffer;
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        start: Array<number>,
        end: Array<number>,
        {
            id = -1, type = ShapeType.LINE,
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = lineDefault,
    ) {
        super(DrawType.TRIANGLES, id, type, {color, pick_color, display});

        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, fetch(OBJECT_FILES[1]).then<[WebGLBuffer, WebGLBuffer]>(async res => {
                const view = new DataView(await res.arrayBuffer());
                const n = view.getInt32(0, true) + 4;

                
                const [vok, vbuff] = createStaticBuffer(gl, view.buffer.slice(4, n));
                if (!vok) {
                    throw new Error("Failed to create vertex buffer.");
                }
    
                const [iok, ibuff] = createStaticBuffer(gl, view.buffer.slice(n), gl.ELEMENT_ARRAY_BUFFER);
                if (!iok) {
                    throw new Error("Failed to create index buffer.");
                }
    
                return Promise.resolve([vbuff!, ibuff!]);
            }));
        } 
        this.buffer = cache.get(this.constructor.name)!.then<[WebGLBuffer, WebGLBuffer]>(([vbuff, ibuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
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
            dx/2 + start[0], 0.005, dz/2 + start[2] + 0.005, 1,
        ])
            .rotateAxis(axis, theta)
            .scale(0.0015, len/2, 0.0015); // TODO: Extract the width.
    }
}

interface CompositeProps extends Omit<ShapeProps, "color" | "pick_color"> {
    shapes?: Array<Shape>,
}

export class Composite extends Shape {
    public override readonly buffer;
    public readonly shapes;

    constructor(
    gl: WebGL2RenderingContext,
    {
        id = 0, type = ShapeType.COLORED,
        pos = [0, 0, 0],
        display = "inherit", visible = 1,
        shapes = []
    }: CompositeProps
    ) {
        super(0, id, type, {pos});

        const key = shapes.map(shape => shape.constructor.name).join();
        if (!cache.has(key)) {
            cache.set(key, Promise.all(shapes.map(shape => shape.buffer)).then(buffers => {
                const [cvOk, cvBuff] = createStaticBufferN(gl, shapes.reduce((acc, shape) => acc + shape.vertices*4, 0));
                if (!cvOk) {
                    throw new Error("Failed to create vertex buffer.");
                }
                const [ciOk, ciBuff] = createStaticBufferN(gl, shapes.reduce((acc, shape) => acc + shape.indices*4, 0), gl.ELEMENT_ARRAY_BUFFER);
                if (!ciOk) {
                    throw new Error("Failed to create index buffer.");
                }

                let offset = [0, 0];
                for (const [vBuff, iBuff] of buffers) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);

                    const vView = new Float32Array(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4);
                    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vView, 0);

                    const iView = new Int32Array(gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4);
                    gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, iView, 0);
                    for (let i = 0; i < iView.length; i++) {
                        iView[i] += offset[0]/(8*4);
                    }

                    gl.bindBuffer(gl.ARRAY_BUFFER, cvBuff);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ciBuff);
                    gl.bufferSubData(gl.ARRAY_BUFFER, offset[0], vView);
                    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, offset[1], iView);

                    offset[0] += vView.byteLength;
                    offset[1] += iView.length*4;
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                }

                return Promise.resolve([cvBuff!, ciBuff!]);
            }));
        }
        this.buffer = cache.get(key)!.then<[WebGLBuffer, WebGLBuffer]>(([vBuff, iBuff]) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuff);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff);
            // @ts-ignore
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/4;
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

    override *[Symbol.iterator](this: any) { // TODO: type this
        yield this;
        for (const shape of this.shapes) {
            yield* shape;
        }
    }

    override show() {
        for (const shape of this.shapes) {
            shape.visible = 1;
        }
        this.visible = 1;
    }

    override hide() {
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

    override hoverIn(): void {
        for (const shape of this.shapes) {
            shape.hovered = 1;
        }
        this.hovered = 1;
    }

    override hoverOut(): void {
        for (const shape of this.shapes) {
            shape.hovered = 0;
        }
        this.hovered = 0;
    }

    override focus(): void {
        for (const shape of this.shapes) {
            shape.focused = 1;
        }
        this.focused = 1;
    }

    override blur(): void {
        for (const shape of this.shapes) {
            shape.blur();
        }
        this.focused = 0;
    }

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset = 0) {
        if (!this.visible) {
            return;
        }

        for (const shape of this.shapes) {
            shape.draw(gl, map, drawInfo, offset);
            if (shape.indices > 0) {
                offset += shape.indices;
            } else {
                offset += shape.vertices;
            }
        }
    }
}

export class Node extends Composite {
    constructor(gl: WebGL2RenderingContext, {id = -1, pos = [0, 0, 0]}: CompositeProps) {
        super(gl, {id, display: "fixed", shapes: [
            new Sphere(gl, {pos: [pos[0], pos[1], pos[2]], scale: [0.025, 0.025, 0.025], pick_color: [255, 141, 35]}),
            new Circle(gl, {type: ShapeType.SHADOW, pos: [pos[0], 0.01, pos[2]], scale: [0.0275, 0.0275, 0.0275], color: [0, 0, 0]}),
        ]});
    }
}

export class Edge extends Composite {
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>) {
        super(gl, {id: -1, shapes: [
            new Line(gl, start, end, {pick_color: [255, 141, 35]}),
            new LinePlane(gl, start, end, {type: ShapeType.SHADOW, color: [0, 0, 0]}),
        ]});
        this.visible = 0;
    }
}

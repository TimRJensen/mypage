import {mat4, vec3} from "../linalg.js";
import {Drawable, DrawInfo, setUniform, UniformObject} from "./common.js";
import {createStaticBuffer, createStaticBufferN} from "./core.js";

// Default color (white).
const WHITE: [number, number, number] = [255, 255, 255]

const OBJECT_FILES = [
    "/static/objects/ico-sphere.bin",
    "/static/objects/root.bin",
    "/static/objects/plane-circle.bin",
    "/static/objects/line-segment.bin",
    "/static/objects/plane-square.bin",
]

// ShapeType is a bitfield enum.
export enum ShapeType {
    COLORED     = 0x0,
    SPHERE      = ShapeType.COLORED | 0x2,
    LINE        = ShapeType.COLORED | 0x4,
    BACKGROUND  = ShapeType.COLORED | 0x8,
    SHADOW      = ShapeType.COLORED | 0x10,
    TEXTURED    = 0x1,
    LOGO        = ShapeType.TEXTURED | 0x1,
    TEXT        = ShapeType.TEXTURED | 0x2,
    SKILL       = ShapeType.TEXTURED | 0x3,
    PROJECT     = ShapeType.TEXTURED | 0x4,
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
    step = (xmax/ymax/step);

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

const cache = new Map<string, Promise<[WebGLBuffer, WebGLBuffer]>>();

type ShapeProps = {
    id?: number,
    type?: number,
    display?: "inherit" | "fixed" | "hidden",
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
    public readonly world;
    public readonly color;
    public readonly pick_color;
    public readonly depth; 
    public display: "inherit" | "fixed" | "hidden";
    public visible = 1;
    public hovered = 0;
    public focused = 0;

    constructor(
        readonly gl: WebGL2RenderingContext,
        readonly method: GLenum,
        readonly id = -1,
        readonly type = ShapeType.COLORED,
        data: Promise<ArrayBuffer>,
        {
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = {},
    ) {
        if (!cache.has(this.constructor.name)) {
            cache.set(this.constructor.name, data.then<[WebGLBuffer, WebGLBuffer]>(async res => {
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
    
                return Promise.resolve([vBuff!, iBuff!]);
            }));
        }
        this.buffer = data.then<[WebGLBuffer, WebGLBuffer]>(async res => {
            const view = new DataView(res);
            const n = view.getInt32(0, true);
            // @ts-ignore
            this.vertices = n/Float32Array.BYTES_PER_ELEMENT;
            // @ts-ignore
            this.indices = (view.byteLength - (n + 4))/Uint16Array.BYTES_PER_ELEMENT;

            return cache.get(this.constructor.name)!;
        });


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
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_SHORT, offset*Uint16Array.BYTES_PER_ELEMENT*2);
        }
    }
}

export class Grid extends Shape {
    constructor(
        gl: WebGL2RenderingContext,
        xmax: number,
        ymax: number,
        step: number,
        {
            id = 0, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            display = "fixed",
        }: ShapeProps,
    ) {
        const data = new Promise<ArrayBuffer>(resolve => {
            const data = createGrid(xmax, ymax, step);
            const indices = new Uint16Array(data.byteLength/32);
            for (let i = 0; i < indices.length; i++) {
                indices[i] = i;
            }
            
            const buff = new ArrayBuffer(4 + data.byteLength + indices.byteLength);
            const view = new DataView(buff);
            view.setInt32(0, data.byteLength, true);
            
            const vView = new Float32Array(buff, 4, data.byteLength/Float32Array.BYTES_PER_ELEMENT);
            vView.set(new Float32Array(data));
            
            const iView = new Uint16Array(buff, 4 + data.byteLength, indices.length);
            iView.set(indices);
            
            resolve(buff);
        });
        super(gl, DrawType.LINES, id, type, data, {pos, color, pick_color, display});
    }
}

export class Sphere extends Shape {
    protected static data = fetch(OBJECT_FILES[0]).then(res => res.arrayBuffer());
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
        super(gl, gl.TRIANGLES, id, type, Sphere.data,  {pos, color, pick_color, display});
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
        .scale(scale[0], scale[1], scale[2]);
    }
}

export class Root extends Shape {
    protected static data = fetch(OBJECT_FILES[1]).then(res => res.arrayBuffer());
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        {
            id = -1, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            scale = [0.075, 0.125, 0.075],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps
    ) {
        super(gl, gl.TRIANGLES, id, type, Root.data,  {pos, color, pick_color, display});

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
        .rotateX(-Math.PI/2)
        .scale(scale[0], scale[1], scale[2]);
    }
}

export class Circle extends Shape {
    protected static data = fetch(OBJECT_FILES[2]).then(res => res.arrayBuffer());
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        {
            id = -1, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(gl, gl.TRIANGLE_STRIP, id, type, Circle.data, {pos, color, pick_color, display});

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
        .scale(scale[0], scale[1], scale[2]);
    }
}

export class Background extends Circle {
    public override readonly method;
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        {
            id = -1, type = ShapeType.SHADOW,
            pos = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(gl, {id, type, pos, scale, color, pick_color, display});
        this.method = gl.TRIANGLE_FAN;

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
        .rotateX(-Math.PI/2)
        .scale(scale[0]+0.175, scale[1], scale[2]+0.175);
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
    protected static data = fetch(OBJECT_FILES[3]).then(res => res.arrayBuffer());
    public override readonly world;

    constructor(
        gl: WebGL2RenderingContext,
        start: Array<number>,
        end: Array<number>,
        scale: number,
        {
            id = -1, type = ShapeType.LINE,
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = lineDefault,
    ) {
        super(gl, gl.TRIANGLES, id, type, Line.data, {color, pick_color, display});

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
            .scale(scale, len/2, scale);
    }
}

export class Plane extends Shape {
    protected static data = fetch(OBJECT_FILES[4]).then(res => res.arrayBuffer());
    public override readonly world;
    public override readonly depth;

    constructor(
        gl: WebGL2RenderingContext,
        depth: number,
        {
            id = -1, type = ShapeType.TEXTURED,
            pos = [0, 0, 0],
            rotation = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "hidden",
        }: ShapeProps,
    ) {
        super(gl, gl.TRIANGLES, id, type, Plane.data, {color, pick_color, display});

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

interface CompositeProps extends Omit<ShapeProps, "color" | "pick_color"> {
    shapes?: Array<Shape>,
}

export class Composite implements Drawable<Shape> {
    public readonly buffer;
    public readonly indices = 0;
    public readonly vertices = 0;
    public readonly method: GLenum = 0;
    public readonly type = ShapeType.COLORED;
    public readonly id ;
    public readonly shapes;
    public readonly world;
    public readonly color = null!;
    public readonly pick_color = null!;
    public readonly depth = 0;
    public display: "inherit" | "fixed" | "hidden";
    public visible = 1;
    public hovered = 0;
    public focused = 0;

    constructor(
    readonly gl: WebGL2RenderingContext,
    {
        id = -1,
        pos = [0, 0, 0],
        display = "inherit", visible = 1,
        shapes = []
    }: CompositeProps
    ) {
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
                    const iView = new Uint16Array(gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/2);
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
            this.vertices = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/Float32Array.BYTES_PER_ELEMENT;
            // @ts-ignore
            this.indices = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE)/Uint16Array.BYTES_PER_ELEMENT;
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

    *[Symbol.iterator](this: Composite) {
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

    hoverIn(): void {
        for (const shape of this.shapes) {
            shape.hovered = 1;
        }
    }
    hoverOut(): void {
        for (const shape of this.shapes) {
            shape.hovered = 0;
        }
    }

    focus(): void {
        for (const shape of this.shapes) {
            shape.focused = 1;
        }
    }
    blur(): void {
        for (const shape of this.shapes) {
            shape.focused = 0;
        }
    }

    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset = 0) {
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
    constructor(gl: WebGL2RenderingContext, {id = -1, pos = [0, 0, 0]}: CompositeProps) {
        super(gl, {id, display: "fixed", pos, shapes: [
            new Root(gl, {pos: [0.0, 0.05, 0.0], pick_color: [255, 141, 35]}),
            new Background(gl, {type: ShapeType.SHADOW, pos: [0.0, 0.07, 0.0], color: [102, 51, 153]}),
            new Circle(gl, {id: 0, type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: [0, 0, 0]}),
        ]});
    }
} 

export class Node extends Composite {
    constructor(gl: WebGL2RenderingContext, {id = -1, pos = [0, 0, 0]}: CompositeProps) {
        super(gl, {id, display: "fixed", pos, shapes: [
            new Sphere(gl, {pos: [0.0, 0.06, 0.0], pick_color: [255, 141, 35]}),
            new Circle(gl, {id: 0, type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: [0, 0, 0]}),
        ]});
    }
}

export class Edge extends Composite {
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>) {
        super(gl, {id: -1, pos: [-start[0], 0.0, -start[2]], shapes: [
            new Line(gl, start, end, 0.0015, {pick_color: [255, 141, 35]}),
            new Line(
                gl,
                [start[0] -0.0025, 0.005, start[2] + 0.01],
                [end[0] -0.0025, 0.005, end[2] + 0.025],
                0.00125,
                {type: ShapeType.SHADOW, color: [0, 0, 0]}
            ),
        ]});
        this.visible = 0;
    }
}

export class Logo extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, {id = 0, pos = [0, 0, 0]}: CompositeProps) {
        super(gl, {id, display: "hidden", pos, shapes: [
            new Plane(gl, depth, {pos: [0.0, 0.1, 0.0], rotation: [-Math.PI/2, 0.0, 0.0], scale: [1.2, 1.0, 1.0]}),
            new Circle(gl, {id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0]}),
        ]});
        this.visible = 0;
    }

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>,  drawInfo: DrawInfo<Shape>, offset?: number): void {
        const {atlases} = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases![0]);

        super.draw(gl, map, drawInfo, offset);
    }
}

export class Text extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, {id = 0, display = "fixed", pos = [0, 0, 0], rotation = [0, 0, 0]}: CompositeProps) {
        super(gl, {id, display, pos: [pos[0], 0.002, pos[2]], shapes: [
            new Plane(gl, depth, {type: ShapeType.TEXT, rotation, scale: [2.5, 1.0, 1.5]}),
        ]});
        this.visible = display == "fixed" ? 1 : 0;
    }

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void {
        const {atlases} = drawInfo;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases![1]);
        super.draw(gl, map, drawInfo, offset);
    }
}

export class Skill extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, {id = 0, pos = [0, 0, 0], rotation = [-Math.PI/2, 0.0, 0.0], scale = [0.75, 1.0, 0.75]}: CompositeProps) {
        super(gl, {id, display: "hidden", pos, shapes: [
            new Plane(gl, depth, {pos: [0.0, 0.1, 0.0], rotation, scale}),
            new Circle(gl, {id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0]}),
        ]});
        this.visible = 0;
    }

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>,  drawInfo: DrawInfo<Shape>, offset?: number): void {
        const {atlases} = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases![2]);

        super.draw(gl, map, drawInfo, offset);
    }
}

export class Project extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, {id = 0, pos = [0, 0, 0], rotation = [-Math.PI/2, 0.0, 0.0]}: CompositeProps) {
        super(gl, {id, display: "hidden", pos, shapes: [
            new Plane(gl, depth, {pos: [0.0, 0.1, 0.0], rotation, scale: [1.2, 1.0, 1.0]}),
            new Circle(gl, {id: -1, type: ShapeType.SHADOW, pos: [0.0, 0.005, 0.0], color: [0, 0, 0]}),
        ]});
        this.visible = 0;
    }

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>,  drawInfo: DrawInfo<Shape>, offset?: number): void {
        const {atlases} = drawInfo;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases![3]);

        super.draw(gl, map, drawInfo, offset);
    }
}

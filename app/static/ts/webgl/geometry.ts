import {mat4, vec3} from "../linalg.js";
import {DrawInfo, setUniform, UniformObject} from "./common.js";

/**
 * Vertices reference for future me.
 *  ----------------------------------------------
 * | xyz uv nxnynz 
 *  ----------------------------------------------
 */
const STRIDE = 32;

// Default color is white.
const WHITE: [number, number, number] = [255, 255, 255]

// ShapeType is a bitfield enum.
export enum ShapeType {
    COLORED = 0x0,
    LINE = ShapeType.COLORED | 0x2,
    SHADOW = ShapeType.COLORED | 0x4,
    TEXTURED = 0x1,
    LOGO = ShapeType.TEXTURED | 0x1,
}

// Alias for WebGL2RenderingContext constants.
enum DrawType {
    LINES = WebGL2RenderingContext.LINES,
    TRIANGLES = WebGL2RenderingContext.TRIANGLES,
    TRIANGLE_STRIP = WebGL2RenderingContext.TRIANGLE_STRIP,
    TRIANGLE_FAN = WebGL2RenderingContext.TRIANGLE_FAN,
}

function createVertexBuffer(data: number[]) {
    const buffer = new ArrayBuffer(data.length*4);
    const view = new DataView(buffer);

    for (let i = 0; i < data.length; i++) {
        view.setFloat32(i*4, data[i], true);
    }

    return buffer;
}

function vertexBufferFrom(data: Array<ArrayBuffer>, n: number) {
    const buffer = new ArrayBuffer(n);
    const trg = new DataView(buffer);

    let k = 0;
    for (const src of data) {
        const view = new DataView(src);
        const count = src.byteLength/4;

        for (let i = 0; i < count; i++) {
                trg.setFloat32(k, view.getFloat32(i*4, true), true);
            k += 4;
        }
    }

    return buffer;
}
    
function createGrid(xmax: number, ymax: number, step: number) {
    const vertices = [];

    for (let x = -xmax; x <= xmax; x += step) {
        // xyz
        vertices.push(x, 0, -ymax, 0, 0, 0, 1, 0);
        vertices.push(x, 0, ymax, 0, 0, 0, 1, 0);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz
        vertices.push(-xmax, 0, y, 0, 0, 0, 1, 0);
        vertices.push(xmax, 0, y, 0, 0, 0, 1, 0);
    }
    
    return vertices;
}

function createSphere(radius: number, latitudeBands: number, longitudeBands: number) {
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

            const x = radius*cosPhi*sinTheta;
            const y = radius*cosTheta;
            const z =  radius*sinPhi*sinTheta;
            const len = Math.hypot(x, y, z);

            vertices.push(
                // xyz
                x, y, z,
                // normal               //padding               
                x/len, y/len, z/len,   0,
            );
        }
    }

    for (let lat = 0; lat < latitudeBands; ++lat) {
        for (let lon = 0; lon < longitudeBands; ++lon) {
            const current = lat*(longitudeBands + 1) + lon;
            const next = (lat + 1)*(longitudeBands + 1) + lon;

            indices.push(current, next, current + 1, current + 1, next, next + 1, 6);
        }
    }

    return indices.flatMap(index => vertices.slice(index*7, index*7 + 7));
}

function createCircle(radius: number, segments: number) {
    const vertices: number[] = [];

    for (let i = 0; i <= segments; i++) {
        const a = 2*Math.PI/segments*i;
        const b = 2*Math.PI/segments*(i+1);

        vertices.push(
            // xyz     
            0, 0, 0, 0, 1, 0, 0,
            radius*Math.cos(a), 0, radius*Math.sin(a), 0, 1, 0, 0,
            radius*Math.cos(b), 0, radius*Math.sin(b), 0, 1, 0, 0,
        );
    }

    return vertices;
}

function createLine(width: number, a: Array<number>, b: Array<number>) {
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    let len = Math.sqrt(dx*dx + dy*dy);
    if (len < 0.0001) len = 1;
    let dirX = -dx / len;
    let dirY = dy / len;
    let normal = [ -dirY, dirX, 0 ];
    return [
        // xyz
        ...a, ...normal, width,
        ...a, ...normal, -width,
        ...b, ...normal, width,
        ...b, ...normal, -width,
    ];
}

function createTexturePlane(size: number, depth: number, ratio = 1.0) {
    return [
        // xyz                      uv      depth
        -size*ratio, 0.0, -size,    0, 1,   depth, 0,
        size*ratio, 0.0, size,      1, 0,   depth, 0,
        -size*ratio, 0.0, size,     0, 0,   depth, 0,
        -size*ratio, 0.0, -size,    0, 1,   depth, 0,
        size*ratio, 0.0, -size,     1, 1,   depth, 0,
        size*ratio, 0.0, size,      1, 0,   depth, 0,
    ];
}

type ShapeProps = {
    id?: number,
    type?: number,
    display?: "inherit" | "fixed" | "none",
    pos?: [number, number, number],
    rotation?: [number, number, number],
    scale?: [number, number, number],
    color?: [number, number, number],
    pick_color?: [number, number, number],
}

export class Shape  {
    public readonly buffer;
    public readonly vertices: ArrayBuffer = null!;
    public readonly id;
    public readonly type;
    public readonly color;
    public readonly pick_color;
    public readonly texture;
    public readonly world;
    public display: "inherit" | "fixed" | "none";
    public visible = 1;
    public hovered = 0;
    public focused = 0;

    constructor(
        readonly method: GLenum,
        vertices: number[],
        id = 0,
        type = ShapeType.COLORED,
        {
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            texture = 0,
        }
    ) {
        this.id = id;
        this.type = type;
        this.texture = texture;
        this.buffer = Promise.resolve(createVertexBuffer(vertices)).then(data => {
            // @ts-ignore
            this.vertices = data;
            return data;
        });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.color = new Float32Array(color);
        this.pick_color = new Float32Array(pick_color);
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

        gl.drawArrays(this.method, offset, this.vertices.byteLength/STRIDE);
    }
}

export class Grid extends Shape {
    constructor(
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
        super(DrawType.LINES, createGrid(xmax, ymax, step), id, type, {pos, color, pick_color});
        this.display = display;
    }
}

export class Sphere extends Shape {
    public override readonly buffer;
    public override readonly world;
    constructor(
        radius: number,
        latitudeBands: number,
        longitudeBands: number,
        {
            id = 0, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            scale = [1, 1, 1],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(DrawType.TRIANGLES, createSphere(radius, latitudeBands, longitudeBands), id, type,  {pos, color, pick_color});
        
        this.buffer = fetch("/static/objects/sphere.bin").then(async res => {
            const buffer = await res.arrayBuffer();
            // @ts-ignore
            this.vertices = buffer;
            return buffer;
            // return res.arrayBuffer().then(data => {
            //     this.vertices = data;
            //     return data;
            // });
        });
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]).scale(scale[0], scale[1], scale[2]);
        this.display = display;
    }
}

export class Circle extends Shape {
    constructor(
        radius: number,
        segments: number,
        {
            id = 0, type = ShapeType.COLORED,
            pos = [0, 0, 0],
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(DrawType.TRIANGLE_STRIP, createCircle(radius, segments), id, type, {pos, color, pick_color});
        this.display = display;
    }
}

export class Line extends Shape {
    public override readonly buffer;
    public override readonly world;

    constructor(
        start: Array<number>,
        end: Array<number>,
        {
            id = 0, type = ShapeType.LINE,
            color = WHITE, pick_color = WHITE,
            display = "inherit",
        }: ShapeProps,
    ) {
        super(DrawType.TRIANGLE_STRIP, createLine(0, start, end), id, type, {color, pick_color});

        this.buffer = fetch("/static/objects/line-segment.bin").then(async res => {
            const buffer = await res.arrayBuffer();
            // @ts-ignore
            this.vertices = buffer;
            return buffer;
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
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            dx/2, dy/2 + start[1], dz/2, 1,
        ])
            .rotateAxis(axis, theta)
            .scale(0.0015, len/2, 0.0015); // TODO: Extract the width.
        this.display = display;
    }
}

interface TextureProps extends Omit<ShapeProps, "r"|"g"|"b"|"a"> {
    size?: number,
    tex?: number,
    ratio?: number,
    visible?: number,
    rx?: number,
    ry?: number,
    rz?: number,
}

export class AtlasPlane extends Shape {
    public override readonly texture;
    public override readonly world;

    constructor(
        depth: number,
        {
            id = 0, type = ShapeType.TEXTURED,
            tex = 0,
            size = 1, ratio = 1,
            pos = [0, 0, 0],
            rotation = [0, 0, 0],
            display = "inherit", visible = 1,
        }: TextureProps,
    ) {
        super(DrawType.TRIANGLES, createTexturePlane(size, depth, ratio), type, id, {});

        this.world = new mat4([
            -1, 0, 0, 0,
            0, 0, -1, 0,
            0, 1, 0, 0,
            pos[0], pos[1], pos[2], 1,
        ]).rotate(rotation[0], rotation[1], rotation[2]);

        this.texture = tex;
        this.display = display;
        this.visible = visible;
    }
}

interface CompositeProps extends Omit<ShapeProps, "r"|"g"|"b"|"a"> {
    visible?: number,
    shapes?: Array<Shape>,
}

export class Composite extends Shape {
    public override readonly buffer;
    public readonly shapes;

    constructor({
        id = 0, type = ShapeType.COLORED,
        pos = [0, 0, 0],
        display = "inherit", visible = 1,
        shapes = []
    }: CompositeProps
    ) {
        super(0, [], id, type, {pos});

        const buffers = [];
        for (const shape of shapes ) {
            for (const child of shape) {
                // Hijack the world matrix.
                child.world[12] += pos[0];
                child.world[13] += pos[1];
                child.world[14] += pos[2];
    
                // Hijack the id.
                if (!child.id) {
                    // @ts-ignore
                    child.id = id;
                }
            }

            buffers.push(shape.buffer);
        }
        this.buffer = Promise.all(buffers).then(data => {
            let n = 0;
            for (const vertices of data) {
                n += vertices.byteLength;
            }
            // @ts-ignore
            this.vertices = vertexBufferFrom(data, n);

            return this.vertices;
        });
        this.shapes = shapes;
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

    override draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<Shape>, offset = 0) {
        if (!this.visible) {
            return;
        }

        for (const shape of this.shapes) {
            shape.draw(gl, map, drawObject, offset);
            offset += shape.vertices.byteLength/STRIDE;
        }
    }
}

export class Node extends Composite {
    constructor({id = 0, pos = [0, 0, 0]}: CompositeProps) {
        super({id, display: "fixed", pos: [pos[0], 0.0, pos[2]], shapes: [
            new Sphere(0.015, 16, 16, {pos: [0.0, pos[1], 0.0], scale: [0.025, 0.025, 0.025], pick_color: [255, 141, 35]}),
            //new Circle(0.02, 16, {type: ShapeType.SHADOW, y: 0.002, color: [0, 0, 0]}),
        ]});
    }
}

export class Edge extends Composite {
    constructor(start: Array<number>, end: Array<number>, {id = 0}: CompositeProps) {
        super({id, pos: [start[0], 0.0, start[2]], shapes: [
            new Line(start, end, {pick_color: [255, 141, 35]}),
            //new Line(start, end, 0.005, {type: ShapeType.SHADOW, pos, color: [0, 0, 0]}),
        ]});
        this.visible = 1;
    }
}

export class Icon extends Composite {
    constructor(
        icon: number,
        /*logo: number,*/
        {id = 0, pos = [0, 0, 0]}: CompositeProps
    ) {
        super({id, pos, shapes: [
            new Composite({id, display: "fixed", pos, shapes: [
                new AtlasPlane(icon, {type: ShapeType.LOGO, tex: 0, size: 0.03}),
            ]}),
        ]});
    }
}

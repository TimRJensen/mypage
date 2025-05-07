import {mat4, vec3} from "../linalg.ts";
import {DrawableNode} from "./common.ts";
import { setUniform } from "./core.ts";
import { Scene } from "./scene-driver.ts";

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const PICKED: [number, number, number] = [255, 141, 35];
const ORIGIN: [number, number, number] = [0, 0, 0];

const OBJECT_FILES = [
    "/static/models/ico-sphere.bin",
    "/static/models/root.bin",
    "/static/models/plane-circle.bin",
    "/static/models/line-segment.bin",
    "/static/models/plane-square.bin",
];

// ShapeType is a bitfield enum.
export enum ShapeType {
    COLORED = 0x0,
    SPHERE = ShapeType.COLORED | 0x2,
    ROOT = ShapeType.COLORED | 0x4,
    BACKGROUND = ShapeType.COLORED | 0x8,
    SHADOW = ShapeType.COLORED | 0x10,
    TEXTURED = 0x1,
    LOGO = ShapeType.TEXTURED | 0x1,
    TEXT = ShapeType.TEXTURED | 0x2,
}

// Alias for WebGL2RenderingContext constants.
enum DrawType {
    LINES = WebGL2RenderingContext.LINES,
    TRIANGLES = WebGL2RenderingContext.TRIANGLES,
    TRIANGLE_STRIP = WebGL2RenderingContext.TRIANGLE_STRIP,
    TRIANGLE_FAN = WebGL2RenderingContext.TRIANGLE_FAN,
}

const STRIDE = 8;

function createGrid(xmax: number, ymax: number, step: number) {
    const vertices = [];
    step = xmax / ymax / step;

    for (let x = -xmax; x <= xmax; x += step) {
        // xyz uv nxnynz
        vertices.push(x, 0.0, -ymax, 0, 0, 0.2, 0.4, 1.45);
        vertices.push(x, 0.0, ymax, 0, 0, 0.2, 0.4, 1.45);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        // xyz uv nxnynz
        vertices.push(-xmax, 0.0, y, 0, 0, 0.2, 0.4, 1.45);
        vertices.push(xmax, 0.0, y, 0, 0, 0.2, 0.4, 1.45);
    }
    const vertexData = new Float32Array(vertices);

    // Generate indices
    const indexData = new Uint16Array(vertexData.length/STRIDE);
    for (let i = 0; i < indexData.length; i++) {
        indexData[i] = i;
    }

    // Create the combined buffer
    const buff = new ArrayBuffer(4 + vertexData.byteLength + indexData.byteLength);
    const view = new DataView(buff);
    view.setInt32(0, vertexData.byteLength, true);

    const vView = new Float32Array(buff, 4, vertexData.length);
    vView.set(vertexData);
    const iView = new Uint16Array(buff, 4 + vertexData.byteLength, indexData.length);
    iView.set(indexData);

    return buff;
}
const CACHE = new Map<string, Promise<[Float32Array, Uint16Array]>>();

type ShapeProps = {
    id?: number;
    type?: ShapeType;
    display?: "inherit" | "fixed" | "hidden";
    visible?: number;
    pos?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: [number, number, number];
    pickColor?: [number, number, number];
};

const shapePropsDefault: ShapeProps = {
    id: 0, type: ShapeType.COLORED,
    display: "inherit", visible: 1,
    pos: ORIGIN, rotation: ORIGIN, scale: [1, 1, 1],
    color: WHITE, pickColor: WHITE,
};

export class Shape implements DrawableNode<Shape> {
    public readonly buffer: Promise<[Float32Array, Uint16Array]> = null!;
    public readonly indices = 0;
    public readonly vertices = 0;
    public readonly world;
    public readonly color;
    public readonly pickColor;
    public readonly depth;
    public display: "inherit" | "fixed" | "hidden" | "none" = "inherit";
    public visible = 1;
    public hovered = 0;
    public focused = 0;
    protected _parent: Shape|null = null;
    protected _idx: number = -1;
    protected _id = 0;
    protected children: Array<Shape> = [];

    constructor(
        readonly method: GLenum,
        readonly type = ShapeType.COLORED,
        id = 0,
        data: Promise<ArrayBuffer>|null,
        {
            pos = ORIGIN,
            color = WHITE,
            pickColor: pick_color = WHITE,
            display = "inherit",
        }: ShapeProps = shapePropsDefault,
    ) {
        if (data) {
            if (!CACHE.has(this.constructor.name)) {
                CACHE.set(
                    this.constructor.name,
                    data.then((res) => {
                        const view = new DataView(res);
                        const n = view.getInt32(0, true) + 4;
                        return [new Float32Array(view.buffer.slice(4, n)), new Uint16Array(view.buffer.slice(n, view.byteLength))];
                    }),
                );
            }
            this.buffer = CACHE.get(this.constructor.name)!.then((res) => {
                Reflect.set(this, "vertices",res[0].length);
                Reflect.set(this, "indices", res[1].length);
                return res;
            });
        }

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ]);
        this.color = new Float32Array(color);
        this.pickColor = new Float32Array(pick_color);
        this.depth = 0;
        this.display = display;
        this.visible = display == "hidden" ? 0 : 1;
        this._id = id;
    }

    get id (): number {
        if (this._id != 0) {
            return this._id;
        }
        return this.parent()?.id ?? 0;
    }

    *[Symbol.iterator]() {
        yield this;
    }

    parent(): Shape|null {
        return this._parent;
    }

    addChild(node: Shape): void {
        node._idx = this.children.length;
        node._parent = this;
        this.children.push(node);
    }

    firstChild(): Shape|null {
        return this.children[0] ?? null;
    }

    lastChild(): Shape|null {
        return this.children[this.children.length - 1] ?? null;
    }

    nextSibling(): Shape|null {
        return this._parent?.children[this._idx + 1] ?? null;
    }

    prevSibling(): Shape|null {
        return this._parent?.children[this._idx - 1] ?? null;
    }

    show() {
        this.visible = 1;
    }

    hide() {
        switch (true) {
            case this.focused == 1:
            case this.hovered == 1:
            case this.display == "fixed":
            case this.display == "inherit" && this._parent?.visible == 1:
                return;
            case this.display == "none":
                break;
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

    draw(gl: WebGL2RenderingContext, scene: Scene<Shape>, offset = 0) {
        if (!this.visible) {
            return;
        }

        const {setters, uniformInfo} = scene;
        for (const [key, val] of setters.entries()) {
            if (!uniformInfo.has(key)) {
                continue;
            }
            switch (typeof val) {
                case "function":
                    if (key == "u_type") console.log(val(this));
                    setUniform(gl, uniformInfo.get(key)!, val(this));
                    break;
            }

        }

        if (this.indices > 0) {
            gl.drawElements(this.method, this.indices, gl.UNSIGNED_SHORT, offset*Uint16Array.BYTES_PER_ELEMENT);
        }
    }
}

export class Grid extends Shape {
    constructor(
        xmax: number,
        ymax: number,
        step: number,
        {
            id = 0,
            type = ShapeType.COLORED, display = "fixed",
            pos = ORIGIN,
            color = WHITE, pickColor: pick_color = WHITE,
        }: ShapeProps = shapePropsDefault,
    ) {
        const data = new Promise<ArrayBuffer>((resolve) => {
            resolve(createGrid(xmax, ymax, step));
        });
        super(DrawType.LINES, id, type, data, {pos, color, pickColor: pick_color, display});
    }
}

export class Test extends Shape {
    constructor(
        props: ShapeProps = shapePropsDefault,
    ) {
        const data = new Promise<ArrayBuffer>((resolve) => {
            const vertices =  new Float32Array([
                // xyz              uv      normal
                -.5,-.5, -.5,       0.0,0.0, 0.0, 0.0, 0.0,
                0.5,-.5, -.5,       0.0,0.0, 0.0, 0.0, 0.0,
                0.0,0.4, -.5,       0.0,0.0, 0.0, 0.0, 0.0,
            
                -.5,0.5, 0.5,       1.0,0.0, 0.0, 0.0, 0.0,
                0.5,0.5, 0.5,       1.0,0.0, 0.0, 0.0, 0.0,
                0.0,-.4, 0.5,       1.0,0.0, 0.0, 0.0, 0.0,
            ]);
            const indicies = new Uint16Array([0, 1, 2]);

            const buff = new ArrayBuffer(4 + vertices.byteLength + indicies.byteLength);
            const view = new DataView(buff);
            view.setInt32(0, vertices.byteLength, true);
        
            const vView = new Float32Array(buff, 4, vertices.length);
            vView.set(vertices);
            const iView = new Uint16Array(buff, 4 + vertices.byteLength, indicies.length);
            iView.set(indicies);
            
            resolve(buff);
        });
        super(DrawType.TRIANGLES, props.id, props.type, data, props);
    }
}

export class Sphere extends Shape {
    protected static data = fetch(OBJECT_FILES[0]).then((res) => res.arrayBuffer());
    public override readonly world;

    constructor(
        {
            id = 0, type = ShapeType.SPHERE,  display = "inherit",
            pos = ORIGIN, scale = [1, 1, 1],
            color = WHITE, pickColor: pick_color = WHITE,
        }: ShapeProps = shapePropsDefault,
    ) {
        super(DrawType.TRIANGLES, type, id, Sphere.data, {pos, color, pickColor: pick_color, display});
        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1 ,0,
            pos[0], pos[1], pos[2], 1,
        ])
            .scale(scale[0], scale[1], scale[2]);
    }
}

export class Root extends Shape {
    protected static data = fetch(OBJECT_FILES[1]).then((res) => res.arrayBuffer());
    public override readonly world;

    constructor(
        {
            id = 0, type = ShapeType.ROOT, display = "inherit",
            pos = ORIGIN, scale = [0.066, 0.066, 0.075], rotation = [-Math.PI/2, 0.0, 0.0],
            color = WHITE, pickColor: pick_color = WHITE,
        }: ShapeProps = shapePropsDefault,
    ) {
        super(DrawType.TRIANGLES, type, id, Root.data, {pos, color, pickColor: pick_color, display});

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotate(rotation[0], rotation[1], rotation[2])
            .scale(scale[0], scale[1], scale[2]);
    }
}

export class Circle extends Shape {
    protected static data = fetch(OBJECT_FILES[2]).then((res) => res.arrayBuffer());
    public override readonly world;

    constructor(
        {
            id = 0, type = ShapeType.COLORED, display = "inherit",
            pos = ORIGIN, scale = [1, 1, 1], rotation = [Math.PI, 0.0, 0.0],
            color = BLACK, pickColor: pick_color = BLACK,
        }: ShapeProps = shapePropsDefault,
    ) {
        super(DrawType.TRIANGLE_FAN, type, id, Circle.data, {pos, color, pickColor: pick_color, display});

        this.world = new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            pos[0], pos[1], pos[2], 1,
        ])
            .rotate(rotation[0], rotation[1], rotation[2])
            .scale(scale[0], scale[1], scale[2]);
    }
}

export class Line extends Shape {
    protected static data = fetch(OBJECT_FILES[3]).then((res) => res.arrayBuffer());
    public override readonly world;

    constructor(
        start: Array<number>,
        end: Array<number>,
        scale: number,
        {
            id = 0, type = ShapeType.COLORED, display = "inherit",
            color = BLACK, pickColor: pick_color = BLACK,
        }: ShapeProps = shapePropsDefault,
    ) {
        super(DrawType.TRIANGLES, type, id, Line.data, {color, pickColor: pick_color, display});

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
            dx/2 + start[0], start[1], dz/2 + start[2], 1,
        ])
            .rotateAxis(axis, theta)
            .scale(scale, len*0.5, scale);
    }
}

export class Plane extends Shape {
    protected static data = fetch(OBJECT_FILES[4]).then((res) => res.arrayBuffer());
    public override readonly world;
    public override readonly depth;

    constructor(
        depth: number,
        {
            id = 0, type = ShapeType.TEXTURED, display = "hidden",
            pos = ORIGIN, rotation = [-Math.PI/2, 0.0, 0.0], scale = [1.0, 1.0, 0.75],
            color = BLACK, pickColor: pick_color = BLACK,
        }: ShapeProps = shapePropsDefault,
    ) {
        super(DrawType.TRIANGLES, type, id, Plane.data, {color, pickColor: pick_color, display});

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

interface CompositeProps extends ShapeProps {
    shapes?: Array<Shape>;
}

const compositePropsDefault: CompositeProps = {
    id: 0, type: ShapeType.COLORED,
    display: "inherit", visible: 1,
    pos: ORIGIN, rotation: ORIGIN, scale: [1, 1, 1],
    color: WHITE, pickColor: WHITE,
    shapes: [],
};

export class Composite extends Shape {
     public override readonly buffer;
     public override readonly world;

    constructor(
        {
            id = 0, type = ShapeType.COLORED, display = "inherit",
            pos = ORIGIN,
            color = WHITE, pickColor: pick_color = WHITE, 
            shapes = [],
        }: CompositeProps = compositePropsDefault,
    ) {
        super(DrawType.TRIANGLES, type, id, null, {color, pickColor: pick_color, display});

        let key = "";
        for (const shape of shapes) {
            key += shape.constructor.name;
            for (const child of shape) {
                key += child.constructor.name;
            }
        }

        if (!CACHE.has(key)) {
            CACHE.set(
                key,
                Promise.all(shapes.map((shape) => shape.buffer)).then((buffers) => {
                    const vBytes = buffers.reduce((acc, buff) => acc + buff[0].length, 0);
                    const iBytes = buffers.reduce((acc, buff) => acc + buff[1].length, 0);
                    const vAll = new Float32Array(vBytes);
                    const iAll = new Uint16Array(iBytes);

                    const offset = [0, 0];
                    for (const [vBuff, iBuff] of buffers) {
                        const vSize = vBuff.length;
                        vAll.set(vBuff, offset[0]);

                        const iSize = iBuff.length;
                        iAll.set(iBuff, offset[1]);

                        const n = offset[0]/STRIDE;
                        for (let i = offset[1]; i < offset[1] + iSize; i++) {
                            iAll[i] += n;
                        }

                        offset[0] += vSize;
                        offset[1] += iSize;
                    }

                    return [vAll, iAll];
                }),
            );
            CACHE.set(Composite.constructor.name, CACHE.get(key)!);
        }

        this.buffer = CACHE.get(key)!.then<[Float32Array, Uint16Array]>((res) => {
            Reflect.set(this, "vertices",res[0].length);
            Reflect.set(this, "indices", res[1].length);
            return res;
        });

        for (const shape of shapes) {
            this.addChild(shape);
            for (const child of shape) {
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
        this.visible = display == "hidden" ? 0 : 1;
        this._id = id;
    }

    override *[Symbol.iterator](): Generator<this> {
        yield this;
        for (const child of this.children) {
            yield* <this>child;
        }
    }

    override show(): void {
        for (const child of this.children) {
            child.show();
        }
        this.visible = 1;
    }

    override hide(): void {
        for (const child of this.children) {
            child.hide();
        }

        switch (true) {
            case this.focused == 1:
            case this.hovered == 1:
            case this.display == "hidden" && this.parent()?.focused == 1:
            case this.display == "hidden" && this.parent()?.hovered == 1:
            case this.display == "inherit" && this.parent()?.visible == 1:
            case this.display == "fixed":
                return;
        }
        this.visible = 0;
    }

    override focus(): void {
        for (const child of this.children) {
            child.focus();
        }
        this.focused = 1;
        this.visible = 1;
    }

    override blur(): void {
        for (const child of this.children) {
            child.blur();
        }
        this.hovered = 0;
        this.focused = 0;
    }

    override draw(gl: WebGL2RenderingContext, scene: Scene<Shape>, offset: number,): void {
        if (!this.visible) {
            return;
        }
        for (const child of this.children) {
            child.draw(gl, scene, offset);
            offset += child.indices > 0 ? child.indices : child.vertices;
        }
    }
}

export class RootNode extends Composite {
    constructor(
        {id = 0, display = "fixed", pos = ORIGIN}: CompositeProps = shapePropsDefault,
    ) {
        super({id, display, pos, shapes: [
            new Root({display, pos: [0.0, 0.04, 0.0], pickColor: PICKED}),
            new Circle({type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: BLACK}),
            new Circle({type: ShapeType.BACKGROUND, pos: [0.0, 0.07, 0.0],  rotation: [-Math.PI/2, 0.0, 0.0], scale: [1.1, 1.1, 1.1]}),
        ],});
    }
}

export class Node extends Composite {
    constructor(
        {id = 0, display = "fixed", pos = ORIGIN, shapes = []}: CompositeProps = shapePropsDefault,
    ) {
        super({id, display, pos, shapes: [
            new Sphere({display, pos: [0.0, 0.06, 0.0], pickColor: PICKED}),
            new Circle({type: ShapeType.SHADOW, pos: [0.0, 0.01, 0.0], color: BLACK}),
            ...shapes,
        ],});
    }
}

export class Edge extends Composite {
    constructor(start: Array<number>, end: Array<number>) {
        super({pos: [-start[0], 0.0, -start[2]], shapes: [
            new Line(start, end, 0.0015, {display: "hidden", pickColor: PICKED}),
            new Line([start[0]-0.0, 0.01, start[2]], [end[0], 0.005, end[2]-0.0], 0.001, {display: "hidden", type: ShapeType.SHADOW},),
        ],});
    }
}

export class Texture extends Composite {
    protected texture: number;

    constructor(
        texture: number,
        depth: number, 
        {id = 0, display = "hidden", pos = ORIGIN, rotation = [-Math.PI/2, 0.0, 0.0], scale = [1.2, 1.0, 1.0], shapes = []}: CompositeProps = compositePropsDefault,
    ) {
        super({id, display, pos, shapes: [
            new Plane(depth, {display, pos: [0.0, 0.1, 0.0], rotation, scale}),
            new Circle({display, type: ShapeType.SHADOW, pos: [0.0, 0.0, 0.0], color: BLACK}),
            ...shapes,
        ],});
        this.texture = texture;
    }

    override draw(gl: WebGL2RenderingContext, scene: Scene<Shape>, offset: number,): void {
        const {textures, uniformInfo} = scene;
        gl.activeTexture(gl.TEXTURE0 + this.texture);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures.get(this.texture.toString())!);
        setUniform(gl, uniformInfo.get("u_sampler")!, this.texture);
        super.draw(gl, scene, offset);
    }
}

export class Text extends Composite {
    protected texture: number;

    constructor(
        texture: number,
        depth: number,
        {id = 0, display = "hidden", pos = ORIGIN, rotation = [Math.PI, 0.0, 0.0], scale = [2.5, 1.0, 1.5], shapes = []}: CompositeProps = shapePropsDefault
    ) {
        super({id, display, pos, shapes: [
            new Plane(depth, {display, rotation, scale}),
            ...shapes,
        ],});
        this.texture = texture;
    }

    override draw(gl: WebGL2RenderingContext, scene: Scene<Shape>, offset: number,): void {
        const {textures, uniformInfo} = scene;
        gl.activeTexture(gl.TEXTURE0 + this.texture);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures.get(this.texture.toString())!);
        setUniform(gl, uniformInfo.get("u_sampler")!, this.texture);
        super.draw(gl, scene, offset);
    }
}

import { mat4 } from "../linalg.js";
import { Drawable, DrawInfo, UniformObject } from "./common.js";
export declare enum ShapeType {
    COLORED = 0,
    SPHERE = 2,
    LINE = 4,
    BACKGROUND = 8,
    SHADOW = 16,
    TEXTURED = 1,
    LOGO = 1,
    TEXT = 3,
    SKILL = 3,
    PROJECT = 5
}
type ShapeProps = {
    id?: number;
    type?: number;
    display?: "inherit" | "fixed" | "hidden";
    visible?: number;
    pos?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: [number, number, number];
    pick_color?: [number, number, number];
};
export declare class Shape {
    readonly gl: WebGL2RenderingContext;
    readonly method: GLenum;
    readonly id: number;
    readonly type: ShapeType;
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly indices = 0;
    readonly vertices = 0;
    readonly world: mat4;
    readonly color: Float32Array<ArrayBuffer>;
    readonly pick_color: Float32Array<ArrayBuffer>;
    readonly depth: number;
    display: "inherit" | "fixed" | "hidden";
    visible: number;
    hovered: number;
    focused: number;
    constructor(gl: WebGL2RenderingContext, method: GLenum, id: number | undefined, type: ShapeType | undefined, data: Promise<ArrayBuffer>, { pos, color, pick_color, display, }?: ShapeProps);
    [Symbol.iterator](): Generator<this, void, unknown>;
    show(): void;
    hide(): void;
    hoverIn(): void;
    hoverOut(): void;
    focus(): void;
    blur(): void;
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<Shape>, offset?: number): void;
}
export declare class Grid extends Shape {
    constructor(gl: WebGL2RenderingContext, xmax: number, ymax: number, step: number, { id, type, pos, color, pick_color, display, }: ShapeProps);
}
export declare class Sphere extends Shape {
    protected static data: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Root extends Shape {
    protected static data: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Circle extends Shape {
    protected static data: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Background extends Circle {
    readonly method: 6;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Line extends Shape {
    protected static data: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>, scale: number, { id, type, color, pick_color, display, }?: ShapeProps);
}
export declare class Plane extends Shape {
    protected static data: Promise<ArrayBuffer>;
    readonly world: mat4;
    readonly depth: number;
    constructor(gl: WebGL2RenderingContext, depth: number, { id, type, pos, rotation, scale, color, pick_color, display, }: ShapeProps);
}
interface CompositeProps extends Omit<ShapeProps, "color" | "pick_color"> {
    shapes?: Array<Shape>;
}
export declare class Composite implements Drawable<Shape> {
    readonly gl: WebGL2RenderingContext;
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly indices = 0;
    readonly vertices = 0;
    readonly method: GLenum;
    readonly type = ShapeType.COLORED;
    readonly id: number;
    readonly shapes: Shape[];
    readonly world: mat4;
    readonly color: never;
    readonly pick_color: never;
    readonly depth = 0;
    display: "inherit" | "fixed" | "hidden";
    visible: number;
    hovered: number;
    focused: number;
    constructor(gl: WebGL2RenderingContext, { id, pos, display, visible, shapes }: CompositeProps);
    [Symbol.iterator](this: Composite): Generator<Shape, void, unknown>;
    show(): void;
    hide(): void;
    hoverIn(): void;
    hoverOut(): void;
    focus(): void;
    blur(): void;
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void;
}
export declare class RootNode extends Composite {
    constructor(gl: WebGL2RenderingContext, { id, pos }: CompositeProps);
}
export declare class Node extends Composite {
    constructor(gl: WebGL2RenderingContext, { id, pos }: CompositeProps);
}
export declare class Edge extends Composite {
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>);
}
export declare class Logo extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, { id, pos }: CompositeProps);
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void;
}
export declare class Text extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, { id, display, pos, rotation }: CompositeProps);
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void;
}
export declare class Skill extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, { id, pos, rotation, scale }: CompositeProps);
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void;
}
export declare class Project extends Composite {
    constructor(gl: WebGL2RenderingContext, depth: number, { id, pos, rotation }: CompositeProps);
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawInfo: DrawInfo<Shape>, offset?: number): void;
}
export {};

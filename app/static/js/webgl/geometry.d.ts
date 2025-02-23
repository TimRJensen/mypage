import { mat4 } from "../linalg.js";
import { DrawInfo, UniformObject } from "./common.js";
export declare enum ShapeType {
    COLORED = 0,
    SPHERE = 2,
    LINE = 4,
    SHADOW = 6,
    TEXTURED = 1,
    LOGO = 1
}
type ShapeProps = {
    id?: number;
    type?: number;
    display?: "inherit" | "fixed" | "none";
    visible?: number;
    pos?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: [number, number, number];
    pick_color?: [number, number, number];
};
export declare class Shape {
    readonly method: GLenum;
    readonly id: number;
    readonly type: ShapeType;
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly indices = 0;
    readonly vertices = 0;
    readonly color: Float32Array;
    readonly pick_color: Float32Array;
    readonly world: mat4;
    display: "inherit" | "fixed" | "none";
    visible: number;
    hovered: number;
    focused: number;
    constructor(method: GLenum, id?: number, type?: ShapeType, { pos, color, pick_color, display, }?: ShapeProps);
    [Symbol.iterator](): Generator<this, void, unknown>;
    show(): void;
    hide(): void;
    hoverIn(): void;
    hoverOut(): void;
    isHovered(): boolean;
    focus(): void;
    blur(): void;
    isFocused(): boolean;
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<Shape>, offset?: number): void;
}
export declare class Grid extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly vertices = 0;
    readonly indices = 0;
    constructor(gl: WebGL2RenderingContext, xmax: number, ymax: number, step: number, { id, type, pos, color, pick_color, display, }: ShapeProps);
}
export declare class Sphere extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Root extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Circle extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Line extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>, { id, type, color, pick_color, display, }?: ShapeProps);
}
export declare class LinePlane extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    constructor(gl: WebGL2RenderingContext, start: Array<number>, end: Array<number>, { id, type, color, pick_color, display, }?: ShapeProps);
}
interface CompositeProps extends Omit<ShapeProps, "color" | "pick_color"> {
    shapes?: Array<Shape>;
}
export declare class Composite extends Shape {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    readonly world: mat4;
    readonly shapes: Shape[];
    constructor(gl: WebGL2RenderingContext, { id, type, pos, display, visible, shapes }: CompositeProps);
    [Symbol.iterator](this: any): Generator<any, void, any>;
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
export {};

import { mat4 } from "../linalg.js";
import { DrawInfo, UniformObject } from "./common.js";
export declare enum ShapeType {
    COLORED = 0,
    LINE = 2,
    SHADOW = 4,
    TEXTURED = 1,
    LOGO = 1
}
type ShapeProps = {
    id?: number;
    type?: number;
    display?: "inherit" | "fixed" | "none";
    pos?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: [number, number, number];
    pick_color?: [number, number, number];
};
export declare class Shape {
    readonly method: GLenum;
    readonly buffer: Promise<ArrayBuffer>;
    readonly vertices: ArrayBuffer;
    readonly id: number;
    readonly type: ShapeType;
    readonly color: Float32Array;
    readonly pick_color: Float32Array;
    readonly texture: number;
    readonly world: mat4;
    display: "inherit" | "fixed" | "none";
    visible: number;
    hovered: number;
    focused: number;
    constructor(method: GLenum, vertices: number[], id: number | undefined, type: ShapeType | undefined, { pos, color, pick_color, texture, }: {
        pos?: number[] | undefined;
        color?: [number, number, number] | undefined;
        pick_color?: [number, number, number] | undefined;
        texture?: number | undefined;
    });
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
    constructor(xmax: number, ymax: number, step: number, { id, type, pos, color, pick_color, display, }: ShapeProps);
}
export declare class Sphere extends Shape {
    readonly buffer: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(radius: number, latitudeBands: number, longitudeBands: number, { id, type, pos, scale, color, pick_color, display, }: ShapeProps);
}
export declare class Circle extends Shape {
    constructor(radius: number, segments: number, { id, type, pos, color, pick_color, display, }: ShapeProps);
}
export declare class Line extends Shape {
    readonly buffer: Promise<ArrayBuffer>;
    readonly world: mat4;
    constructor(start: Array<number>, end: Array<number>, { id, type, color, pick_color, display, }: ShapeProps);
}
interface TextureProps extends Omit<ShapeProps, "r" | "g" | "b" | "a"> {
    size?: number;
    tex?: number;
    ratio?: number;
    visible?: number;
    rx?: number;
    ry?: number;
    rz?: number;
}
export declare class AtlasPlane extends Shape {
    readonly texture: number;
    readonly world: mat4;
    constructor(depth: number, { id, type, tex, size, ratio, pos, rotation, display, visible, }: TextureProps);
}
interface CompositeProps extends Omit<ShapeProps, "r" | "g" | "b" | "a"> {
    visible?: number;
    shapes?: Array<Shape>;
}
export declare class Composite extends Shape {
    readonly buffer: Promise<ArrayBuffer>;
    readonly shapes: Shape[];
    constructor({ id, type, pos, display, visible, shapes }: CompositeProps);
    [Symbol.iterator](this: any): Generator<any, void, any>;
    show(): void;
    hide(): void;
    hoverIn(): void;
    hoverOut(): void;
    focus(): void;
    blur(): void;
    draw(gl: WebGL2RenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<Shape>, offset?: number): void;
}
export declare class Node extends Composite {
    constructor({ id, pos }: CompositeProps);
}
export declare class Edge extends Composite {
    constructor(start: Array<number>, end: Array<number>, { id }: CompositeProps);
}
export declare class Icon extends Composite {
    constructor(icon: number, { id, pos }: CompositeProps);
}
export {};

export type AttributeObject = {
    loc?: number;
    type?: number;
    len: number;
    stride: number;
    size: number;
};
export type AttributeInfo = {
    [key: string]: AttributeObject;
};
export type UniformObject = {
    loc: WebGLUniformLocation;
    type: number;
};
export type TextureObject = {
    width: number;
    height: number;
    depth: number;
};
export type TextureInfo = {
    [key: string]: TextureObject;
};
export type DrawInfo<T> = {
    [key: string]: number | ArrayBuffer | ((shape: T) => number | ArrayBuffer);
} & {
    atlases?: Array<WebGLTexture | null>;
};
export interface Drawable<T> extends Iterable<T> {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    draw(gl: WebGLRenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<T>, offset?: number): void;
}
export interface CompositeLike<T> extends Drawable<T> {
    readonly shapes: Array<T>;
}
export type Scene<T> = Array<[WebGLVertexArrayObject, Drawable<T>]>;
export declare function setUniform(gl: WebGL2RenderingContext, info: UniformObject, data: ArrayBuffer | number): void;

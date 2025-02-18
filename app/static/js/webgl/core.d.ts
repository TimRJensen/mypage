import { AttributeInfo, AttributeObject, UniformObject, TextureInfo, Drawable, Scene, DrawInfo } from "./common.js";
/**
 * Utility function to create a WebGL2 shader.
 */
export declare function createShader(gl: WebGL2RenderingContext, src: string, type: GLenum): WebGLShader;
/**
 * Utility function to attach and link shaders to a WebGL2 program.
 */
export declare function initializeProgram(gl: WebGL2RenderingContext, program: WebGLProgram, vs: string, fs: string): boolean;
export declare function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): [boolean, WebGLProgram | null];
/**
 * Utility function to initialize attributes from a WebGL2 program.
 */
export declare function initializeAtrtibutes(gl: WebGL2RenderingContext, program: WebGLProgram, attrs: AttributeInfo): Map<string, AttributeObject>;
/**
 * Utility function to initialize uniforms from a WebGL2 program.
 */
export declare function initializeUniforms(gl: WebGL2RenderingContext, program: WebGLProgram): Map<string, UniformObject>;
/**
 * Utility function to create a static buffer from an ArrayBuffer.
 */
export declare function createStaticBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer, method?: number): [boolean, WebGLBuffer | null];
/**
 * Utility function to create a Vertex Array Object.
 */
export declare function createVAO(gl: WebGL2RenderingContext, program: WebGLProgram, attrs: Map<string, AttributeObject>, buff: WebGLBuffer): [boolean, WebGLVertexArrayObject | null];
/**
 * Utility function to create a texture array buffer from an HTMLImageElement.
 */
export declare function createTextureArrayBuffer(gl: WebGL2RenderingContext, data: HTMLImageElement, idx: number, width: number, height: number, depth: number): WebGLTexture | undefined;
export declare class FrameBufferObject {
    readonly buff: WebGLFramebuffer;
    width: number;
    height: number;
    attachments: Array<WebGLTexture | null>;
    depth: WebGLRenderbuffer | null;
    constructor(buff: WebGLFramebuffer, width: number, height: number);
}
export declare function attachTextureBuffer(gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number, type: GLenum, n?: number): WebGLTexture | null;
/**
 * Utility function to create a framebuffer object.
 */
export declare function createFrameBufferObject(gl: WebGL2RenderingContext, width: number, height: number, type?: GLenum, n?: number, render?: boolean): [boolean, FrameBufferObject | null];
/**
 * Utility function to resize a framebuffer object.
 */
export declare function resizeFrameBufferObject(gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number): [boolean, FrameBufferObject | null];
export declare class PluginEvent<T> extends CustomEvent<T> {
    shape: T;
    constructor(type: string, { shape }: {
        shape: T;
    });
}
export type PluginEventHandler<T, E = PluginEvent<T>> = (e: E) => void;
type EventMap<T> = {
    [key in keyof HTMLElementEventMap]: PluginEvent<T>;
} & {
    "done": PluginEvent<T>;
};
export interface PluginLike {
    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
    after(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
}
type ProgramOptions<T extends Drawable<T>> = {
    color?: [number, number, number, number];
    attrs?: AttributeInfo;
    textures?: TextureInfo;
};
/**
 * A WebGL2 program wrapper.
 */
export declare class Program<T extends Drawable<T>> {
    readonly canvas: HTMLCanvasElement;
    readonly shapes: Array<T>;
    protected gl: WebGL2RenderingContext;
    protected quad: WebGLProgram;
    protected vao: WebGLVertexArrayObject;
    protected main: WebGLProgram;
    protected attribs: Map<string, AttributeObject>;
    protected uniforms: Map<string, UniformObject>;
    protected programOptions: ProgramOptions<T>;
    protected rendering: boolean;
    protected scene: Scene<T>;
    protected handlers: Map<string, PluginEventHandler<T, any>>;
    protected events: Array<PluginEvent<T>>;
    readonly fbo: FrameBufferObject;
    readonly plugins: Array<PluginLike>;
    readonly drawInfo: DrawInfo<T>;
    constructor(canvas: HTMLCanvasElement, shapes: Array<T>, vs: string, fs: string, options?: ProgramOptions<T>);
    use(): void;
    draw(): void;
    render(options?: DrawInfo<T>): void;
    fire(e: PluginEvent<T>): void;
    on<E extends PluginEvent<T>>(type: keyof EventMap<T>, handler: PluginEventHandler<T, E>): void;
}
export {};

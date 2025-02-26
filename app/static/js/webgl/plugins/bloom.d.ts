import { Shape } from "../geometry.js";
import { Program, PluginLike, FrameBufferObject } from "../core.js";
import { UniformObject } from "../common.js";
export declare class BloomPlugin implements PluginLike {
    protected gl: WebGL2RenderingContext;
    protected shapes: Array<Shape>;
    protected quads: Array<WebGLProgram>;
    protected vaos: Array<WebGLVertexArrayObject>;
    protected uniforms: Array<Map<string, UniformObject>>;
    protected fbos: Array<FrameBufferObject>;
    protected n: number;
    constructor(gl: WebGL2RenderingContext, shapes: Array<Shape>, program: Program<Shape>);
    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
    after(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
}

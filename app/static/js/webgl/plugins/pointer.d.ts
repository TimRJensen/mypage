import { Shape } from "../geometry.js";
import { PluginLike, PluginEventHandler, PluginEvent, Program, FrameBufferObject } from "../core.js";
export declare class PointerPluginEvent extends PluginEvent<Shape> {
    id: number;
    composite: Shape;
    clientX: number;
    clientY: number;
    constructor(type: string, { id, shape, composite, clientX, clientY }: {
        id: number;
        shape: Shape;
        composite: Shape;
        clientX: number;
        clientY: number;
    });
}
export type PointerPluginHandler = PluginEventHandler<Shape, PointerPluginEvent>;
export declare class PointerPlugin implements PluginLike {
    protected gl: WebGL2RenderingContext;
    protected shapes: Array<Shape>;
    protected n: number;
    constructor(gl: WebGL2RenderingContext, shapes: Array<Shape>, program: Program<Shape>);
    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
    after(): void;
}

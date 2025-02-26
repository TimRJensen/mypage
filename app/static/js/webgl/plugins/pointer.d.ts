import { Shape } from "../geometry.js";
import { PluginLike, PluginEventHandler, PluginEvent, Program, FrameBufferObject } from "../core.js";
export declare class PointerPluginEvent extends PluginEvent<Shape> {
    id: number;
    composite: Shape;
    constructor(type: string, { id, shape, composite }: {
        id: number;
        shape: Shape;
        composite: Shape;
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

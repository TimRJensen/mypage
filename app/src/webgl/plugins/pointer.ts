import {Shape} from "../geometry.ts";
import {
    attachTextureBuffer,
    FrameBufferObject,
    PluginEvent,
    PluginEventHandler,
    PluginLike,
    Program,
} from "../core.ts";

export class PointerPluginEvent extends PluginEvent<Shape> {
    id: number;
    composite: Shape;
    clientX: number;
    clientY: number;

    constructor(
        type: string,
        { id, shape, composite, clientX, clientY }: {
            id: number;
            shape: Shape;
            composite: Shape;
            clientX: number;
            clientY: number;
        },
    ) {
        super(type, { shape });
        this.id = id;
        this.composite = composite;
        this.clientX = clientX;
        this.clientY = clientY;
    }
}
export type PointerPluginHandler = PluginEventHandler<Shape, PointerPluginEvent>;

function handler(gl: WebGL2RenderingContext, program: Program<Shape>, shapes: Array<Shape>) {
    return function (e: PointerEvent) {
        // Read pixel
        /**
         * Note to future me:
         * Device space and clip space are not equal. The former is in pixels, the latter is in the range [-1, 1].
         * To convert from device space to clip space, one need to normalize the device space to clip space:
         * ndc == xy/resolution*2 - 1
         * cx == (ndcX + 1)*0.5*width
         * cy == (1 - ndcY)*0.5*height
         */
        const rect = (gl.canvas as HTMLCanvasElement).getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left)/rect.width)*2 - 1;
        const ndcY = ((e.clientY - rect.top)/rect.height)*2 - 1;
        const data = new Int16Array(4);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, program.fbo.buff);
        gl.readBuffer(gl.COLOR_ATTACHMENT2);
        gl.readPixels(
            ((ndcX + 1)*0.5)*gl.canvas.width, ((-ndcY + 1)*0.5)*gl.canvas.height,
            1, 1,
            gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
            gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
            data,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Find shape
        const id = data[0];
        if (id == 0) {
            program.fire(
                new PointerPluginEvent(e.type, {
                    id, shape: null!, composite: null!, clientX: e.movementX,clientY: e.movementY,
                }),
            );
            return;
        }

        for (const shape of shapes) {
            if (shape.id == id) {
                program.fire(
                    new PointerPluginEvent(e.type, {
                        id, shape, composite: shape, clientX: e.movementX, clientY: e.movementY,
                    }),
                );
                break;
            }

            for (const child of shape) {
                if (child.id != id) {
                    continue;
                }

                program.fire(
                    new PointerPluginEvent(e.type, {
                        id, shape: child, composite: shape, clientX: e.movementX, clientY: e.movementY,
                    }),
                );
                return;
            }
        }
    };
}

export class PointerPlugin implements PluginLike {
    protected n = 0;

    constructor(
        protected gl: WebGL2RenderingContext,
        protected shapes: Array<Shape>,
        program: Program<Shape>,
    ) {
        // Extend the framebuffer object
        const n = program.fbo.attachments.length;
        attachTextureBuffer(gl, program.fbo, program.fbo.width, program.fbo.height, gl.R16I, n);

        // Attach event listeners
        program.canvas.addEventListener("pointermove", <EventListener>handler(gl, program, shapes));
        program.canvas.addEventListener("pointerdown", <EventListener>handler(gl, program, shapes));
        program.canvas.addEventListener("pointerup", <EventListener>handler(gl, program, shapes));

        this.gl = gl;
        this.n = n;
    }

    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
        gl.drawBuffers(fbo.attachments.map((_, i) => i == 0 || i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
        gl.clearBufferiv(gl.COLOR, this.n, new Int32Array([0, 0, 0, 0]));
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    after() {/*no-op */}
}

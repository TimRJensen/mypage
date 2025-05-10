import {UniformInfo, UniformSetter} from "../common.ts";
import {attachTextureBuffer, createProgram, PluginLike, setUniform} from "../core.ts";
import {Scene, SceneEvent} from "../scene-driver.ts";
import {Event, EventQueue} from "../event-driver.ts";
import {Shape} from "../geometry.ts";
import vs from "../shaders/vertex-pick.ts";
import fs from "../shaders/fragment-pick.ts";

export class PickPluginEvent extends Event<Shape> {
    id: number;
    movementX: number;
    movementY: number;

    constructor(
        type: string,
        {id, shape, movementX, movementY}: {
            id: number;
            shape: Shape;
            movementX: number;
            movementY: number;
        },
    ) {
        super(type, {shape});
        this.id = id;
        this.movementX = movementX;
        this.movementY = movementY;
    }
}

function fence(gl: WebGL2RenderingContext, plugin: PickPlugin) {
    return new Promise<number>((resolve) => {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)!;
        gl.flush();

        const fn = () => {
            const status = gl.getSyncParameter(sync, gl.SYNC_STATUS);

            if (status == gl.SIGNALED) {
                const data = new Uint16Array(1);
                gl.bindBuffer(gl.PIXEL_PACK_BUFFER, plugin.pbo);
                gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
                gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
                gl.deleteSync(sync);
                plugin.fence = null;
                resolve(data[0]);
            } else {
                requestAnimationFrame(fn);
            }
        }
        fn();
    });
}

function handler(gl: WebGL2RenderingContext, scene: Scene<Shape>, plugin: PickPlugin, ) {
    return (e: PointerEvent) => {
        if (plugin.fence) {
            return;
        }
        /**
         * Note to future me:
         * Device space and clip space are not equal. The former is in pixels, the latter is in the range [-1, 1].
         * To convert from device space to clip space, one need to normalize the device space to clip space:
         * ndc == xy/resolution*2 - 1
         * cx == (ndcX + 1)*0.5*width
         * cy == (1 - ndcY)*0.5*height
         */
        const [fbo] = scene.fbos;
        const rect = (<HTMLCanvasElement>gl.canvas).getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left)/rect.width)*2 - 1;
        const ndcY = ((e.clientY - rect.top)/rect.height)*2 - 1;
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo.buff);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, plugin.pbo);
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + plugin.n);
        gl.readPixels(
            ((ndcX + 1)*0.5)*fbo.width, ((-ndcY + 1)*0.5)*fbo.height,
            1, 1,
            plugin.readFormat,
            plugin.readType,
            0,
        );
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        plugin.fence = fence(gl, plugin).then((id) => {
            if (id == 0) {
                scene.fire(
                    new PickPluginEvent(e.type, {
                        id, shape: null!, movementX: e.movementX, movementY: e.movementY,
                    }),
                );
                return;
            }
    
            for (const shape of scene.drawables) {
                if (shape.id == id) {
                    scene.fire(
                        new PickPluginEvent(e.type, {
                            id, shape, movementX: e.movementX, movementY: e.movementY,
                        }),
                    );
                    break;
                }
    
                for (const child of shape) {
                    if (child.id != id) {
                        continue;
                    }
    
                    scene.fire(
                        new PickPluginEvent(e.type, {
                            id, shape: child, movementX: e.movementX, movementY: e.movementY,
                        }),
                    );
                    return;
                }
            }
        });
    }
};

const EVENTS = ["pointermove", "pointerdown", "pointerup"];
const DUMMY_DRIVER = new EventQueue<Shape, Event<Shape>>(null!);

export class PickPlugin implements PluginLike<Shape> {
    readonly n: number;
    readonly readFormat: GLenum = null!;
    readonly readType: GLenum = null!; 
    readonly pbo: WebGLBuffer = null!;
    public fence: Promise<void>|null = null;
    protected pick: WebGLProgram = null!;
    protected uniformInfo: Map<string, UniformInfo> = null!;
    protected setters:  Map<string, UniformSetter<Shape>> = null!;

    constructor(
        gl: WebGL2RenderingContext,
        scene: Scene<Shape>,
    ) {
        // Extend the framebuffer object
        const [mainFBO] = scene.fbos;
        this.n = mainFBO.attachments.length;
        attachTextureBuffer(gl, mainFBO, gl.R16I, this.n);

        // Create the pick program
        const [pick, _, uniformInfo] = createProgram(gl, vs, fs, {
            a_position: {type: gl.FLOAT, len: 3, stride: 24, size: 12},
            a_uv: {type: gl.FLOAT, len: 2, stride: 24, size: 12},
        });
        if (!pick) {
            console.error("Pick Plugin: Failed to create program");
            return;
        }
        this.pick = pick!;
        this.uniformInfo = uniformInfo!;
        
        // Create a pixel buffer to read data asynchroniously
        const pbo = gl.createBuffer();
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, 4, gl.STREAM_READ);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        this.pbo = pbo;

        // Get device specific read format & type
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, mainFBO.buff);
        gl.readBuffer(gl.COLOR_ATTACHMENT0 + this.n);
        this.readFormat = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
        this.readType = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Initialize events
        scene.setters.set("u_id", (shape) => shape.id);
        let fn = <EventListener>handler(gl, scene, this);
        for (let i = 0; i < EVENTS.length; i++) {
            gl.canvas.addEventListener(EVENTS[i], fn);
        }

        // Swwitch events on scene switch
        scene.on("switch", function (this: PickPlugin, e: SceneEvent<Shape>) {
            e.next.setters.set("u_id", e.prev.setters.get("u_id")!);
            e.prev.setters.delete("u_id");
            for (const event of EVENTS) {
                gl.canvas.removeEventListener(event, fn);
            }
            fn = <EventListener>handler(gl, e.next, this);
            for (const event of EVENTS) {
                gl.canvas.addEventListener(event, fn);
             }
        }.bind(this));
    }

    ready() {/**no-op */}

    before(gl: WebGL2RenderingContext, scene: Scene<Shape>) {
        const [mainFBO] = scene.fbos;
        gl.bindFramebuffer(gl.FRAMEBUFFER, mainFBO.buff);
        gl.drawBuffers(mainFBO.attachments.map((_, i) => i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
        gl.clearBufferiv(gl.COLOR, this.n, new Float32Array([0, 0, 0, 0]));
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    after(gl: WebGL2RenderingContext, scene: Scene<Shape>) {
        const {pick: quad, uniformInfo} = this;
        const {fbos: [fbo], vaos, setters, drawables} = scene;
        scene = new Scene(
            DUMMY_DRIVER,
            scene.fbos,
            scene.vaos,
            scene.drawables,
            scene.textures,
            setters,
            uniformInfo,
        );

        // Use program
        gl.useProgram(quad);
        gl.viewport(0, 0, fbo.width, fbo.height);

        // Static uniforms
        for (const [key, val] of setters.entries()) {
            if (!uniformInfo.has(key)) {
                continue;
            }
            switch (typeof val) {
                case "number":
                case "object":
                    setUniform(gl, uniformInfo.get(key)!, val);
                    break;
            }
        }
        
        // Draw
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
        gl.drawBuffers(fbo.attachments.map((_, i) => i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
        for (let i = 0; i < drawables.length; i++) {
            gl.bindVertexArray(vaos.get(drawables[i])!);
            drawables[i].draw(gl, scene, 0);
            gl.bindVertexArray(null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

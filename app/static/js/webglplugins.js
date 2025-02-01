import { uniformSetter } from "./webglcommon.js";
import { PluginEvent, createShader } from "./webgl.js";
export class PointerPlugin {
    constructor(canvas, shapes = [], vs, fs) {
        this.canvas = canvas;
        this.shapes = shapes;
        this.gl = null;
        this.program = null;
        this.fbo = null;
        this.uniforms = new Map();
        this.events = new Map();
        this.queue = [];
        this.shape = null;
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }
        const program = gl.createProgram();
        if (!program) {
            return;
        }
        gl.attachShader(program, createShader(gl, fs, gl.FRAGMENT_SHADER));
        gl.attachShader(program, createShader(gl, vs, gl.VERTEX_SHADER));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.detachShader(program, vs);
            gl.detachShader(program, fs);
            gl.deleteProgram(program);
            return;
        }
        const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) {
            const info = gl.getActiveUniform(program, i);
            if (!info) {
                continue;
            }
            this.uniforms.set(info.name, { loc: gl.getUniformLocation(program, info.name), type: info.type });
        }
        this.gl = gl;
        this.program = program;
    }
    use() {
        this.gl.useProgram(this.program);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    draw(fbo, options, objects) {
        // Resize canvas
        this.gl.canvas.width = this.canvas.clientWidth * 0.5;
        this.gl.canvas.height = this.canvas.clientHeight * 0.5;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        // Clear canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // Create frame buffer
        this.fbo = fbo;
        // Static uniforms
        if (options.static) {
            for (const [key, value] of Object.entries(options.static)) {
                if (!this.uniforms.has(key)) {
                    continue;
                }
                uniformSetter(this.gl, this.uniforms.get(key), value);
            }
        }
        // Draw
        for (const { vao, shape } of objects) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
            this.gl.bindVertexArray(vao);
            shape.draw(this.gl, this.uniforms, options.dynamic);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            this.gl.bindVertexArray(null);
        }
    }
    on(type, handler) {
        this.events.set(type, handler);
        this.canvas.addEventListener(type, (e) => {
            if (e.type != "pointermove" && e.type != "pointerdown") {
                return;
            }
            const event = e;
            // Bind frame buffer
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
            // Read pixel
            const data = new Uint8Array(4);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.readPixels(event.offsetX * 0.5, (this.canvas.height - event.offsetY) * 0.5, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
            // Unbind frame buffer
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            // Find shape
            const id = data[0] + data[1] * 256 + data[2] * 256;
            if (id == 0) {
                this.queue.push(new PluginEvent(e.type, { id, shape: null, node: null, shapes: this.shapes }));
                return;
            }
            for (const shape of this.shapes) {
                if (shape.id[0] == id) {
                    this.queue.push(new PluginEvent(e.type, { id, shape, node: shape, shapes: this.shapes }));
                    break;
                }
                for (const child of shape) {
                    if (child.id[0] == id) {
                        this.queue.push(new PluginEvent(e.type, { id, shape: child, node: shape, shapes: this.shapes }));
                        return;
                    }
                }
            }
        });
    }
    flush() {
        for (const e of this.queue) {
            if (!this.events.has(e.type)) {
                continue;
            }
            this.events.get(e.type)(e);
        }
        this.queue = [];
    }
    done() {
        if (!this.events.has("done")) {
            return;
        }
        this.events.get("done")(new PluginEvent("done", { id: 0, shape: null, node: null, shapes: this.shapes }));
    }
}

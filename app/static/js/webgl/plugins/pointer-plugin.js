import { setUniform } from "../../webglcommon.js";
import { PluginEvent, initializeUniforms, initializeProgram, createFrameBufferObject } from "../../webgl.js";
const pluginVectorShader = `#version 300 es
in vec3 a_position;

uniform mat4 u_world;
uniform mat4 u_vp;

void main() {
    gl_Position = u_vp*u_world*vec4(a_position, 1.0);
}
`;
const pluginFragmentShader = `#version 300 es
precision highp float;
precision highp sampler2DArray;

out vec4 f_color;

uniform int u_id;

void main() {
    if (u_id == -1) {
        f_color = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    float r = float((u_id & 0xFF))/255.0;
    float g = float((u_id >> 8) & 0xFF)/255.0;
    float b = float((u_id >> 16) & 0xFF)/255.0;

    f_color = vec4(r, g, b, 1.0);
}
`;
export class PointerPlugin {
    constructor(canvas, shapes) {
        this.canvas = canvas;
        this.shapes = shapes;
        this.gl = null;
        this.program = null;
        this.attribs = new Map();
        this.uniforms = new Map();
        this.fbo = null;
        this.events = new Map();
        this.queue = [];
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }
        const program = gl.createProgram();
        if (!program) {
            return;
        }
        this.uniforms = initializeUniforms(gl, program);
        if (!initializeProgram(gl, program, pluginVectorShader, pluginFragmentShader)) {
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
        const dpi = window.devicePixelRatio || 1;
        const [ok, fbo] = createFrameBufferObject(gl, canvas.width * dpi, canvas.height * dpi);
        if (!ok) {
            return;
        }
        this.fbo = fbo;
        this.gl = gl;
        this.program = program;
    }
    use() {
        this.gl.useProgram(this.program);
    }
    resizeFrameBuffer(width, height) {
        if (width == this.fbo.width && height == this.fbo.height) {
            return [true, this.fbo];
        }
        if (this.fbo.buff) {
            this.gl.deleteFramebuffer(this.fbo.buff);
            this.gl.deleteRenderbuffer(this.fbo.depth);
            for (const tex of this.fbo.texs) {
                this.gl.deleteTexture(tex);
            }
        }
        return createFrameBufferObject(this.gl, width, height);
    }
    draw(drawObject, shapes) {
        // Static uniforms
        for (const [key, val] of Object.entries(drawObject)) {
            if (!this.uniforms.has(key) || val instanceof Function) {
                continue;
            }
            setUniform(this.gl, this.uniforms.get(key), val);
        }
        // Draw
        const dpi = window.devicePixelRatio || 1;
        const [ok, fbo] = this.resizeFrameBuffer(this.canvas.width * dpi, this.canvas.height * dpi);
        if (!ok) {
            return;
        }
        this.fbo = fbo;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo.buff);
        for (const shape of shapes) {
            shape.draw(this.gl, this.uniforms, drawObject);
        }
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
    on(type, handler) {
        if (type == "done") {
            this.events.set(type, handler);
            return;
        }
        if (type != "pointermove" && type != "pointerdown") {
            return;
        }
        this.events.set(type, handler);
        this.canvas.addEventListener(type, (e) => {
            const pe = e;
            // Bind frame buffer
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo.buff);
            // Read pixel
            /**
             * Note to future me:
             * Device space and clip space are not equal. The former is in pixels, the latter is in the range [-1, 1].
             * To convert from device space to clip space, we need to normalize the device space to the range clip space:
             * ndc == xy/resolution*2 - 1
             * cx == (ndcX + 1)*0.5*width
             * cy == (1 - ndcY)*0.5*height
             */
            const rect = this.canvas.getBoundingClientRect();
            const ndcX = ((pe.clientX - rect.left) / rect.width) * 2 - 1;
            const ndcY = ((pe.clientY - rect.top) / rect.height) * 2 - 1;
            const data = new Uint8Array(4);
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.readPixels(((ndcX + 1) * 0.5) * this.canvas.width, ((-ndcY + 1) * 0.5) * this.canvas.height, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
            // Unbind frame buffer
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            // Find shape
            const id = data[0] + data[1] * 256 + data[2] * 256;
            if (id == 0) {
                this.queue.push(new PluginEvent(type, { id, shape: null, composite: null }));
                return;
            }
            for (const shape of this.shapes) {
                if (shape.id[0] == id) {
                    this.queue.push(new PluginEvent(type, { id, shape, composite: shape }));
                    break;
                }
                for (const child of shape) {
                    if (child.id[0] == id) {
                        this.queue.push(new PluginEvent(type, { id, shape: child, composite: shape }));
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
        if (this.events.has("done")) {
            this.events.get("done")(new PluginEvent("done", { id: 0, shape: null, composite: null }));
        }
        this.queue.length = 0;
    }
}

import { FrameBufferObject, createProgram, initializeAtrtibutes, initializeUniforms, } from "../core.js";
const WIDTH = 1024;
const HEIGHT = 1024;
// TODO: Move this to a separate file.
const vs = `#version 300 es
    layout(location=0) in vec3 aPos;

    uniform mat4 u_lpm;
    uniform mat4 u_model;

    void main() {
        gl_Position = u_lpm*u_model*vec4(aPos, 1.0);
    }  
`;
const fs = `#version 300 es
    void main() {}
`;
// https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping
export class ShadowPlugin {
    constructor(canvas, shapes, program) {
        this.canvas = canvas;
        this.shapes = shapes;
        this.gl = null;
        this.fbo = null;
        this.attribs = null;
        this.uniforms = null;
        this.program = null;
        this.drawInfo = null;
        this.scene = new Array();
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }
        // Depthmaps are too specific for the utility functions from core,
        // so create a framebuffer from scratch.
        const fb = gl.createFramebuffer(), tex = gl.createTexture();
        if (!fb || !tex) {
            console.error("Shadow Plugin: Failed to create framebuffer or texture");
            return;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, WIDTH, HEIGHT, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const fbo = new FrameBufferObject(fb, WIDTH, HEIGHT);
        fbo.attachments.push(tex);
        //gl.bindFramebuffer(gl.FRAMEBUFFER, program.fbo.buff);
        //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tex, 0);
        //gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //program.fbo.attachments.push(tex);
        // Create the depthmap(shadow) program.
        const [ok, webgl_program] = createProgram(gl, vs, fs);
        if (!ok) {
            console.error("Shadow Plugin: Failed to create program");
            return;
        }
        // Initialize the attributes and uniforms. The stride and size should match that of the main program.
        const attribs = initializeAtrtibutes(gl, webgl_program, { a_position: { len: 3, stride: 6, size: 3 } });
        const uniforms = initializeUniforms(gl, webgl_program);
        this.gl = gl;
        this.fbo = fbo;
        this.attribs = attribs;
        this.uniforms = uniforms;
        this.program = webgl_program;
        this.drawInfo = program.drawInfo;
        this.scene = program.scene;
    }
    before(gl, fbo) {
        gl.viewport(0, 0, WIDTH, HEIGHT);
        gl.useProgram(this.program);
        gl.enable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.buff);
        gl.clearBufferfi(this.gl.DEPTH_STENCIL, 0, 1, 1);
        for (const [vao, shape] of this.scene) {
            this.gl.bindVertexArray(vao);
            shape.draw(gl, this.uniforms, this.drawInfo);
            this.gl.bindVertexArray(null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // Reset the viewport
        //gl.viewport(0, 0, fbo.width, fbo.height);
    }
    draw() { }
    after() { }
    on() { }
    flush() { }
}

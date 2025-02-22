import {Shape} from "../geometry.js";
import {
    Program,
    PluginLike,
    FrameBufferObject,
    createProgram,
    initializeAtrtibutes,
    initializeUniforms,
    createFrameBufferObject,
    attachTextureBuffer,
    resizeFrameBufferObject,
    createStaticBuffer,
    createVAO,
} from "../core.js";
import {setUniform, UniformObject} from "../common.js";
import vs from "../shaders/vertex-quad.js";
import blurfs from "../shaders/fragment-blur.js";
import blendfs from "../shaders/fragment-blend.js";

const vertices = new Float32Array([
    // xy   uv     
    -1, 1,  0,1,
    -1,-1,  0,0,
     1, 1,  1,1,
     1,-1,  1,0,
]);

export class BloomPlugin implements PluginLike {
    protected gl: WebGL2RenderingContext = null!;
    protected n = 0;
    protected quads: Array<WebGLProgram> = [];
    protected vaos: Array<WebGLVertexArrayObject> = [];
    protected uniforms : Array<Map<string, UniformObject>> = [];
    protected fbos: Array<FrameBufferObject> = [];

    constructor(
        protected canvas: HTMLCanvasElement,
        protected shapes: Array<Shape>,
        program: Program<Shape>,
    ) {
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }
        
        // Extend the framebuffer object
        const n = program.fbo.attachments.length;
        attachTextureBuffer(gl, program.fbo, program.fbo.width, program.fbo.height, gl.RGBA8, n);

        // Create the bloom programs
        const shaders = [blurfs, blendfs]
        const attrib_object = {
            a_position: {type: gl.FLOAT, len: 2, stride: 16, size: 4},
            a_texcoord: {type: gl.FLOAT, len: 2, stride: 16, size: 4},
        }
        for (const shader of shaders) {
            const [ok, quad] = createProgram(gl, vs, shader);
            if (!ok) {
                console.error("Bloom Plugin: Failed to create program");
                return;
            }

            const attribs = initializeAtrtibutes(gl, quad!, attrib_object);
            const uniforms = initializeUniforms(gl, quad!);

            const [ok_buff, buff] = createStaticBuffer(gl, vertices);
            if (!ok_buff) {
                return;
            }
    
            const [ok_vao, vao] = createVAO(gl, quad!, attribs, buff!);
            if (!ok_vao) {
                return;
            }

            this.uniforms.push(uniforms);
            this.quads.push(quad!);
            this.vaos.push(vao!);
        }
        
        // Create the bloom framebuffer objects
        for (let i = 0; i < 3; i++) {
            const [ok, fbo] = createFrameBufferObject(gl, program.fbo.width*0.25, program.fbo.height*0.25, gl.RGBA8, 0, false);
            if (!ok) {
                console.error("Bloom Plugin: Failed to create framebuffer object");
                return;
            }

            this.fbos.push(fbo!);
        }

        this.gl = gl;
        this.n = n;
    }

    before(gl: WebGL2RenderingContext,  fbo: FrameBufferObject) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
        gl.drawBuffers(fbo.attachments.map((_, i) => i == 0 || i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
        gl.clearBufferfv(gl.COLOR, this.n, new Float32Array([0, 0, 0, 0]));
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        for (const bloom_fbo of this.fbos) {
            resizeFrameBufferObject(gl, bloom_fbo, fbo.width, fbo.height);
            gl.bindFramebuffer(gl.FRAMEBUFFER, bloom_fbo.buff);
            gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }

    after(gl: WebGL2RenderingContext, fbo: FrameBufferObject) {
        const blur = 0;
        gl.useProgram(this.quads[blur]);
        gl.bindVertexArray(this.vaos[blur]);
        for (let i = 0; i < 10; i++) {
            const mode = i%2;
            setUniform(gl, this.uniforms[blur].get("u_mode")!, mode);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[mode].buff);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, !i ? fbo.attachments[this.n] : this.fbos[1-mode].attachments[0]);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }

        const blend = 1;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[blend+1].buff); // blend+1 == blend fbo
        gl.useProgram(this.quads[blend]);
        setUniform(gl, this.uniforms[blend].get("u_scene")!, 0);
        setUniform(gl, this.uniforms[blend].get("u_blur")!, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.attachments[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.fbos[blend].attachments[0]);
        gl.bindVertexArray(this.vaos[blend]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbos[blend+1].buff);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, fbo.buff);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.blitFramebuffer(0, 0, fbo.width, fbo.height, 0, 0, fbo.width, fbo.height, gl.COLOR_BUFFER_BIT, gl.LINEAR);
        
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}

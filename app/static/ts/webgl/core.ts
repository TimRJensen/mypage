import {
    AttributeInfo,
    AttributeObject,
    UniformObject,
    TextureInfo,
    Drawable,
    Scene,
    DrawInfo,
    setUniform,
} from "./common.js";
import quadvs from "./shaders/vertex-quad.js";
import quadfs from "./shaders/fragment-quad.js";

/**
 * Utility function to create a WebGL2 shader.
 */
export function createShader(gl: WebGL2RenderingContext, src: string, type: GLenum) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null!;
    }

    return shader
}

/**
 * Utility function to attach and link shaders to a WebGL2 program.
 */
export function initializeProgram(gl: WebGL2RenderingContext, program: WebGLProgram, vs: string, fs: string) {
    gl.attachShader(program, createShader(gl, vs, gl.VERTEX_SHADER));
    gl.attachShader(program, createShader(gl, fs, gl.FRAGMENT_SHADER)); 
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.detachShader(program, vs);
        gl.detachShader(program, fs);
        gl.deleteProgram(program);
        return false;
    }

    return true;
}

export function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): [boolean, WebGLProgram|null] {
    const program = gl.createProgram();
    if (!program) {
        return [false, null];
    }

    return [initializeProgram(gl, program, vs, fs), program];
}

/**
 * Utility function to initialize attributes from a WebGL2 program.
 */
export function initializeAtrtibutes(gl: WebGL2RenderingContext, program: WebGLProgram, attrs: AttributeInfo) {
    const map = new Map<string, AttributeObject>();
    const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveAttrib(program, i);
        if (!info) {
            continue;
        }

        const name = info.name.split("[")[0];
        if (attrs[name]) {
            const loc = gl.getAttribLocation(program, name);
            map.set(name, {loc, type: info.type, ...attrs[name]});
        }
    }

    return map;
}

/**
 * Utility function to initialize uniforms from a WebGL2 program.
 */
export function initializeUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const map = new Map<string, UniformObject>();
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(program, i);
        if (!info) {
            continue;
        }

        map.set(info.name.split("[")[0], {loc: gl.getUniformLocation(program, info.name)!, type: info.type});
    }

    return map;
}

/**
 * Utility function to create a static buffer from an ArrayBuffer.
 */
export function createStaticBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer, target?: GLenum , method?: number): [boolean, WebGLBuffer|null] {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return [false, null];
    }

    gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target ?? gl.ARRAY_BUFFER, data, method ?? gl.STATIC_DRAW);
    return [true, buffer];
}

/**
 * Utility function to create a static buffer with a fixed length.
 */
export function createStaticBufferN(gl: WebGL2RenderingContext, n: number, target?: GLenum, method?: number): [boolean, WebGLBuffer|null] {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return [false, null];
    }

    gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target ?? gl.ARRAY_BUFFER, n, method ?? gl.STATIC_DRAW);
    return [true, buffer];
}

/**
 * Utility function to create a Vertex Array Object.
 */
export function createVAO(gl: WebGL2RenderingContext, program: WebGLProgram, attrs: Map<string, AttributeObject>, vbuff: WebGLBuffer, ibuff: WebGLBuffer|null = null): [boolean, WebGLVertexArrayObject|null] {
    const vao = gl.createVertexArray();
    if (!vao) {
        return [false, null];
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff!);

    let offset = 0;
    for (const [name, {type, len, stride, size}] of attrs.entries()) {
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);

        if (type === gl.FLOAT) {
            gl.vertexAttribPointer(loc, len, type, false, stride, offset);
        } else {
            gl.vertexAttribIPointer(loc, len, type!, stride, offset);
        }

        offset += len*size;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return [true, vao];
}

/**
 * Utility function to create a texture array buffer from an HTMLImageElement.
 */
export function createTextureArrayBuffer(gl: WebGL2RenderingContext, data: HTMLImageElement, idx: number, width: number, height: number, depth: number) { 
    const tex = gl.createTexture();
    if (!tex) {
        return undefined;
    }

    gl.activeTexture(gl.TEXTURE0 + idx);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, width, height, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    return tex;
}

/**
 * Internal function to load textures from a TextureInfo object.
 */
function loadTexture(gl: WebGL2RenderingContext, texInfo?: TextureInfo) {
    if (!texInfo) {
        return;
    }

    for (const [key, info] of Object.entries(texInfo)) {
        const img = new Image();
        img.onload = () => {
            createTextureArrayBuffer(gl, img, info.idx, info.width, info.height, info.depth);
        };
        img.src = key
    }
}

export class FrameBufferObject {
    public attachments: Array<WebGLTexture|null> = [];
    public depth: WebGLRenderbuffer|null = null;

    constructor(
        readonly buff: WebGLFramebuffer,
        public width: number,
        public height: number,
    ) {}
}

export function attachTextureBuffer(gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number, type: GLenum, n = 0) {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.activeTexture(gl.TEXTURE0+n);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, type, width, height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0+n, gl.TEXTURE_2D, tex, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (n < fbo.attachments.length) {
        fbo.attachments[n] = tex;
    } else {
        fbo.attachments.push(tex);
    }

    return tex;
}

function attachDepthBuffer(gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number) {
    const depth = gl.createRenderbuffer();
    if (!depth) {
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbo.depth = depth;

    return depth;
}

/**
 * Utility function to create a framebuffer object.
 */
export function createFrameBufferObject(gl: WebGL2RenderingContext, width: number, height: number, type: GLenum = gl.RGBA8, n = 0, render = true): [boolean, FrameBufferObject|null] {
    const fb = gl.createFramebuffer();
    if (!fb) {
        return [false, null];
    }

    if (render) {
        const fbo = new FrameBufferObject(fb, width, height);
        attachTextureBuffer(gl, fbo, width, height, type, n);
        attachDepthBuffer(gl, fbo, width, height)

        return [true, fbo];
    }

    const fbo = new FrameBufferObject(fb, width, height);
    attachTextureBuffer(gl, fbo, width, height, type, n);
    return [true, fbo];
}

/**
 * Utility function to resize a framebuffer object.
 */
export function resizeFrameBufferObject(
    gl: WebGL2RenderingContext,
    fbo: FrameBufferObject,
    width: number,
    height: number,
): [boolean, FrameBufferObject|null] {
    if (width == fbo.width && height == fbo.height) {
        return [true, fbo];
    }
    fbo.width = width;
    fbo.height = height;

    for (let i = 0; i < fbo.attachments.length; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);

        let type = 0;
        switch (gl.getFramebufferAttachmentParameter(
            gl.FRAMEBUFFER, 
            gl.COLOR_ATTACHMENT0+i,
            gl.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE
        )) {
            case gl.INT:
                type = gl.R16I;
                break;
            case gl.UNSIGNED_NORMALIZED:
                type = gl.RGBA8;
                break;
            default:
                console.error("Unknown framebuffer attachment type", type);
                return [false, null];
        }

        gl.deleteTexture(fbo.attachments[i]);        
        attachTextureBuffer(gl, fbo, width, height, type, i);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (!fbo.depth) {
        return [true, fbo];
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.deleteRenderbuffer(fbo.depth);
    attachDepthBuffer(gl, fbo, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return [true, fbo];
}

export class PluginEvent<T> extends CustomEvent<T> {
    shape: T;
    
    constructor(type: string, {shape}: {shape: T}) {
        super(type);
        this.shape = shape;
    }
}
export type PluginEventHandler<T, E = PluginEvent<T>> = (e: E) => void;

type EventMap<T> = {[key in keyof HTMLElementEventMap]: PluginEvent<T>} & {"done": PluginEvent<T>};
export interface PluginLike {
    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
    after(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
}

const vertices = new Float32Array([
    // xy   uv     
    -1, 1,  0,1,
    -1,-1,  0,0,
     1, 1,  1,1,
     1,-1,  1,0,
]);
 
type ProgramOptions<T extends Drawable<T>> = {
    color?: [number, number, number, number],
    attrs?: AttributeInfo,
    textures?: TextureInfo,
}

/**
 * A WebGL2 program wrapper.
 */
export class Program<T extends Drawable<T>> {
    // Internal state
    protected gl: WebGL2RenderingContext = null!;
    protected quad: WebGLProgram = null!;
    protected vao: WebGLVertexArrayObject = null!;
    protected main: WebGLProgram = null!;
    protected attribs: Map<string, AttributeObject> = null!;
    protected uniforms: Map<string, UniformObject> = null!;
    protected programOptions: ProgramOptions<T> = null!;
    protected rendering: boolean = false;
    protected scene: Scene<T> = [];
    // Event stuff
    protected handlers: Map<string, PluginEventHandler<T, any>> = new Map(); // TODO: Type this
    protected events: Array<PluginEvent<T>> = [];
    // Public state
    readonly fbo: FrameBufferObject = null!;
    readonly plugins: Array<PluginLike> = [];
    readonly drawInfo: DrawInfo<T> = {};

    constructor (
        readonly canvas: HTMLCanvasElement,
        readonly shapes: Array<T>,
        vs: string,
        fs: string,
        options: ProgramOptions<T> = {},
    ) {
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }

        // Program draws everything to a fbo. This allows plugins to obtain that fbo,
        // and extend it with their own drawing logic. So start by creating a quad,
        // and if that fails, just return.
        const [ok_quad, quad] = createProgram(gl, quadvs, quadfs);
        if (!ok_quad) {
            return;
        }

        // Initialize quad attributes
        const quad_attribs = initializeAtrtibutes(gl, quad!, {
            a_position: {type: gl.FLOAT, len: 2, stride: 16, size: 4},
            a_texcoord: {type: gl.FLOAT, len: 2, stride: 16, size: 4},
        });

        // Create quad VAO
        const [ok_buff, buff] = createStaticBuffer(gl, vertices);
        if (!ok_buff) {
            return;
        }

        const [ok_vao, vao] = createVAO(gl, quad!, quad_attribs, buff!, null!);
        if (!ok_vao) {
            return;
        }

        // Create the main program
        const [ok_main, main] = createProgram(gl, vs, fs);
        if (!ok_main) {
            return;
        }

        // Initalize textures. Do this first as it is async.
        loadTexture(gl, options.textures);

        // Initialize attributes
        const main_attribs = initializeAtrtibutes(gl, main!, options.attrs ?? {});

        // Initialize uniforms
        const main_uniforms = initializeUniforms(gl, main!);

        // Initialize object VAOs
        for (const shape of shapes) {
            shape.buffer.then(([vbuff, ibuff]) => {
                let [ok, vao] = createVAO(gl, main!, main_attribs, vbuff, ibuff);
                if (!ok) {
                    return;
                }
                this.scene.push([vao!, shape]);
            });
        }

        // Initialize frambuffer
        const dpi = window.devicePixelRatio >= 1.5 ? 1.5 : 1;
        const [ok, main_fbo] = createFrameBufferObject(gl, canvas.width*dpi, canvas.height*dpi);
        if (!ok) {
            return;
        }

        // Resize canvas
        gl.canvas.width = canvas.width*dpi;
        gl.canvas.height = canvas.height*dpi;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        
        this.gl = gl;
        this.quad = quad!;
        this.vao = vao!;
        this.main = main!;
        this.attribs = main_attribs;
        this.uniforms = main_uniforms;
        this.programOptions = options;
        this.programOptions.color ??= [0, 0, 0, 1];
        this.programOptions.color[0] /= 255;
        this.programOptions.color[1] /= 255;
        this.programOptions.color[2] /= 255;
        this.fbo = main_fbo!;
    }

    use() {
        this.gl.useProgram(this.main);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    protected static lastTime = 0;

    draw(time: number) {
        if (time - Program.lastTime < 1000/60) {
            requestAnimationFrame(this.draw.bind(this));
            return;
        }
        Program.lastTime = time;

        const {gl, uniforms, drawInfo, fbo} = this;


        // Resize framebuffer
        // const [ok, fbo] = resizeFrameBufferObject(gl, this.fbo!, canvas.width, canvas.height);
        // if (!ok) {
        //     return;
        // }
        
        // Clear canvas.
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo!.buff);
        gl.clearBufferfv(gl.COLOR, 0, this.programOptions.color!);
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Consume plugins (before). This is a good place to clear attachments.
        for (const plugin of this.plugins) {
            plugin.before(this.gl, this.fbo);
        }
 
        // Use main program
        this.use();
        
        // Static uniforms
        for (const [key, val] of Object.entries(drawInfo)) {
            if (!uniforms.has(key) || val instanceof Function) {
                continue;
            }
            setUniform(gl, uniforms.get(key)!, val);
        }
        
        // Draw to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo!.buff);
        gl.drawBuffers(fbo!.attachments.map((tex, i) => {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            return gl.COLOR_ATTACHMENT0 + i;
        }));

        for (const [vao, shape] of this.scene) {
            gl.bindVertexArray(vao);
            shape.draw(gl, uniforms, drawInfo);
            gl.bindVertexArray(null);
        }
        gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        // Consume plugins (after). This is a good place to do post-processing.
        for (const plugin of this.plugins!) {
            plugin.after(gl, fbo!);
        }

        // Draw scene
        gl.useProgram(this.quad);
        gl.bindVertexArray(this.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo!.attachments[0]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // Flush events
        for (const e of this.events) {
            if (!this.handlers.has(e.type)) {
                continue;
            }
            this.handlers.get(e.type)!(e);
        }
        if (this.handlers.has("done")) {
            this.handlers.get("done")!(new PluginEvent("done", {shape: null!}));
        }
        this.events = [];

       requestAnimationFrame(this.draw.bind(this));
    }

    render(options: DrawInfo<T> = {}) {
        if (this.rendering) {
            return;
        }
        this.rendering = true;

        // @ts-ignore
        this.drawInfo = options;
        Promise.all(this.shapes.map((shape) => shape.buffer)).then(() => {
            requestAnimationFrame(this.draw.bind(this));
        });
    }

    fire (e: PluginEvent<T>) {
        this.events.push(e);
    }

    on<E extends PluginEvent<T>> (type: keyof EventMap<T>, handler: PluginEventHandler<T, E>) {
        this.handlers.set(type, handler);
    }
}

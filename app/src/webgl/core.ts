import {
    AttributeInfo,
    AttributeObject,
    Drawable,
    DrawInfo,
    Scene,
    setUniform,
    TextureInfo,
    TextureObject,
    UniformObject,
} from "./common.ts";
import quadvs from "./shaders/vertex-quad.ts";
import quadfs from "./shaders/fragment-quad.ts";

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

    return shader;
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

export function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string): [boolean, WebGLProgram | null] {
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

        const name = info.name.split('[')[0];
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
export function createStaticBuffer(gl: WebGL2RenderingContext, data: ArrayBufferLike, target?: GLenum, method?: number,): [boolean, WebGLBuffer | null] {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return [false, null];
    }

    gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target ?? gl.ARRAY_BUFFER, <ArrayBuffer> data, method ?? gl.STATIC_DRAW);
    return [true, buffer];
}

/**
 * Utility function to create a Vertex Array Object.
 */
export function createVAO(
    gl: WebGL2RenderingContext, program: WebGLProgram, attrs: Map<string, AttributeObject>, vbuff: WebGLBuffer, ibuff: WebGLBuffer | null = null,
): [boolean, WebGLVertexArrayObject | null] {
    const vao = gl.createVertexArray();
    if (!vao) {
        return [false, null];
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff!);

    let offset = 0;
    for (const [name, { type, len, stride, size }] of attrs.entries()) {
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);

        if (type === gl.FLOAT) {
            gl.vertexAttribPointer(loc, len, type, false, stride, offset);
        } else {
            gl.vertexAttribIPointer(loc, len, type!, stride, offset);
        }

        offset += len * size;
    }
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return [true, vao];
}

/**
 * Utility function to create a texture array buffer from an HTMLImageElement.
 */
export function createTextureArrayBuffer(
    gl: WebGL2RenderingContext, data: ArrayBufferLike, width: number, height: number, info: TextureObject,
) {
    const tex = gl.createTexture(), pbo = gl.createBuffer();
    if (!tex || !pbo) {
        return null;
    }

    const size = Math.trunc(width / info.width);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, size, gl.RGBA8, info.width, info.height, info.depth);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, <ArrayBuffer> data, gl.STATIC_DRAW);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (let i = 0; i < info.depth; i++) {
        const row = Math.floor(i / size) * info.height;
        const col = (i % size) * info.width;
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, col);
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, info.width, info.height, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    }
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    return tex;
}

/**
 * Internal function to load textures from a TextureInfo object.
 */
function loadTexture(gl: WebGL2RenderingContext, texInfo?: TextureInfo) {
    if (!texInfo) {
        return Promise.resolve([]);
    }

    const promises: Array<Promise<WebGLTexture | null>> = [];
    for (const [key, info] of Object.entries(texInfo)) {
        const img = new Image();
        const promise = new Promise<WebGLTexture | null>((resolve) => {
            img.onload = () => {
                const { width, height } = img;
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);

                resolve(
                    createTextureArrayBuffer(
                        gl, ctx.getImageData(0, 0, width, height).data.buffer, width, height, info,
                    ),
                );
            };
            img.src = key;
        });
        promises.push(promise);
    }

    return Promise.all(promises);
}

export class FrameBufferObject {
    public attachments: Array<WebGLTexture | null> = [];
    public depth: WebGLRenderbuffer | null = null;

    constructor(
        readonly buff: WebGLFramebuffer,
        public width: number,
        public height: number,
    ) {}
}

export function attachTextureBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number, type: GLenum, n = 0,
) {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.activeTexture(gl.TEXTURE0 + n);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, type, width, height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.TEXTURE_2D, tex, 0);
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
export function createFrameBufferObject(
    gl: WebGL2RenderingContext, width: number, height: number, type: GLenum = gl.RGBA8, n = 0, render = true,
): [boolean, FrameBufferObject | null] {
    const fb = gl.createFramebuffer();
    if (!fb) {
        return [false, null];
    }

    if (render) {
        const fbo = new FrameBufferObject(fb, width, height);
        attachTextureBuffer(gl, fbo, width, height, type, n);
        attachDepthBuffer(gl, fbo, width, height);

        return [true, fbo];
    }

    const fbo = new FrameBufferObject(fb, width, height);
    attachTextureBuffer(gl, fbo, width, height, type, n);
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

type EventMap<T> = Record<keyof HTMLElementEventMap | "done" | "ready", PluginEvent<T>>;
export interface PluginLike {
    before(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
    after(gl: WebGL2RenderingContext, fbo: FrameBufferObject): void;
}

const vertices = new Float32Array([
    // xy   uv
    -1, 1, 0, 1,
    -1, -1, 0, 0,
    1, 1, 1, 1,
    1, -1, 1, 0,
]);

type ProgramOptions<T extends Drawable<T>> = {
    color?: [number, number, number, number];
    attrs?: AttributeInfo;
    textures?: TextureInfo;
};

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
    protected atlases: Array<WebGLTexture | null> = null!;
    protected programOptions: ProgramOptions<T> = null!;
    protected rendering: boolean = false;
    protected scene: Scene<T> = [];
    protected ready: Array<Promise<unknown>> = null!;
    // Event stuff
    protected handlers: Map<string, Array<PluginEventHandler<T, PluginEvent<T>>>> = new Map();
    protected events: Array<PluginEvent<T>> = [];
    // Public state
    readonly fbo: FrameBufferObject = null!;
    readonly plugins: Array<PluginLike> = [];
    readonly drawInfo: DrawInfo<T> = {};

    constructor(
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

        // Initalize textures. Do this first as it is async.
        this.ready = [
            loadTexture(gl, options.textures).then((atlases) => {
                this.atlases = atlases;
            }),
        ];

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
        const [ok_buff, buff] = createStaticBuffer(gl, vertices.buffer);
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

        // Initialize attributes
        const main_attribs = initializeAtrtibutes(gl, main!, options.attrs ?? {});

        // Initialize uniforms
        const main_uniforms = initializeUniforms(gl, main!);

        // Initialize object VAOs
        for (const shape of shapes) {
            shape.buffer.then(([vbuff, ibuff]) => {
                const [ok, vao] = createVAO(gl, main!, main_attribs, vbuff, ibuff);
                if (!ok) {
                    return;
                }
                this.scene.push([vao!, shape]);
            });
            this.ready.push(shape.buffer);
        }

        // Initialize frambuffer
        const [ok, main_fbo] = createFrameBufferObject(gl, canvas.width, canvas.height);
        if (!ok) {
            return;
        }
        gl.viewport(0, 0, canvas.width, canvas.height);

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
        this.gl.depthFunc(this.gl.LESS);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.depthMask(true);
    }

    protected static lastTime = 0;

    draw(time: number) {
        if (time - Program.lastTime < 1000 / 60) {
            requestAnimationFrame(this.draw.bind(this));
            return;
        }
        Program.lastTime = time;

        const {gl, uniforms, drawInfo, atlases, fbo} = this;

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
            if (!uniforms.has(key) || val instanceof Function || val instanceof Array) {
                continue;
            }
            setUniform(gl, uniforms.get(key)!, val);
        }

        // Draw to framebuffer
        gl.viewport(0, 0, fbo.width, fbo.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo!.buff);
        gl.drawBuffers(fbo!.attachments.map((tex, i) => {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            return gl.COLOR_ATTACHMENT0 + i;
        }));
        for (const [vao, shape] of this.scene) {
            gl.bindVertexArray(vao);
            shape.draw(gl, uniforms, drawInfo, atlases);
            gl.bindVertexArray(null);
        }
        gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        // Consume plugins (after). This is a good place to do post-processing.
        for (const plugin of this.plugins!) {
            plugin.after(gl, fbo!);
        }

        // Draw scene
        gl.useProgram(this.quad);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearBufferfv(gl.COLOR, 0, this.programOptions.color!);
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1, 1);
        gl.bindVertexArray(this.vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fbo.attachments[0]);
        gl.uniform1i(gl.getUniformLocation(this.quad, "tex"), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);

        // Flush events
        for (const e of this.events) {
            if (!this.handlers.has(e.type)) {
                continue;
            }

            for (const handler of this.handlers.get(e.type)!) {
                handler(e);
            }
        }
        if (this.handlers.has("done")) {
            for (const handler of this.handlers.get("done")!) {
                handler(new PluginEvent("done", { shape: null! }));
            }
        }
        this.events = [];

        requestAnimationFrame(this.draw.bind(this));
    }

    render(drawInfo: DrawInfo<T> = {}) {
        if (this.rendering) {
            return;
        }
        this.rendering = true;

        Reflect.set(this, "drawInfo", drawInfo);
        Promise.all(this.ready).then(() => {
            this.fire(new PluginEvent("ready", { shape: null! }));
            requestAnimationFrame(this.draw.bind(this));
        });
    }

    fire(e: PluginEvent<T>) {
        this.events.push(e);
    }

    on<E extends PluginEvent<T>>(type: keyof EventMap<T>, handler: PluginEventHandler<T, E>) {
        if (this.handlers.has(type)) {
            this.handlers.get(type)!.push(<PluginEventHandler<T, PluginEvent<T>>> handler);
        } else {
            this.handlers.set(type, [<PluginEventHandler<T, PluginEvent<T>>> handler]);
        }
    }
}

import {
    AttributeInfo,
    AttributeObject,
    UniformObject,
    UniformInfo,
    TextureInfo,
    TextureObject,
    FrameBufferObject,
    UniformSetter,
    Drawable,
} from "./common.ts";
import {Scene, SceneDriver} from "./scene-driver.ts";
import {EventQueue, Event, EventMap, EventHandler} from "./event-driver.ts";
import quadvs from "./shaders/vertex-quad.ts";
import quadfs from "./shaders/fragment-quad.ts";

export function setUniform(gl: WebGL2RenderingContext, info: UniformInfo, data: Float32Array | Int32Array | number): void {
    if (!info) {
        return;
    }

    const {loc, type} = info;

    switch (type) {
        case gl.SAMPLER_2D_ARRAY:
        case gl.SAMPLER_2D:
        case gl.INT:
            if (typeof data === "number") {
                gl.uniform1i(loc, data);
            } else {
                gl.uniform1iv(loc, <Int32Array> data);
            }
            break;
        case gl.FLOAT:
            if (typeof data === "number") {
                gl.uniform1f(loc, data);
            } else {
                gl.uniform1fv(loc, <Float32Array> data);
            }
            break;
        case gl.FLOAT_VEC2:
            gl.uniform2fv(loc, <Float32Array> data);
            break;
        case gl.FLOAT_VEC3:
            gl.uniform3fv(loc, <Float32Array> data);
            break;
        case gl.FLOAT_VEC4:
            gl.uniform4fv(loc, <Float32Array> data);
            break;
        case gl.FLOAT_MAT2:
            gl.uniformMatrix2fv(loc, false, <Float32Array> data);
            break;
        case gl.FLOAT_MAT3:
            gl.uniformMatrix3fv(loc, false, <Float32Array> data);
            break;
        case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(loc, false, <Float32Array> data);
            break;
    }
}

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
    const map = new Map<string, UniformInfo>();
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
export function createStaticBuffer(gl: WebGL2RenderingContext, data: Float32Array|Uint16Array, target?: GLenum, method?: number,): [boolean, WebGLBuffer | null] {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return [false, null];
    }

    gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target ?? gl.ARRAY_BUFFER, data, method ?? gl.STATIC_DRAW);
    return [true, buffer];
}

/**
 * Utility function to create a Vertex Array Object.
 */
export function createVAO(
    gl: WebGL2RenderingContext, attrs: Map<string, AttributeObject>, vbuff: WebGLBuffer, ibuff: WebGLBuffer | null = null,
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
        const loc = attrs.get(name)?.loc!;
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
    gl: WebGL2RenderingContext, data: Uint8ClampedArray, width: number, height: number, info: TextureObject,
) {
    const tex = gl.createTexture(), pbo = gl.createBuffer();
    if (!tex || !pbo) {
        return null;
    }

    const size = Math.trunc(width/info.width);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, size, gl.RGBA8, info.width, info.height, info.depth);

    const ext = gl.getExtension("EXT_texture_filter_anisotropic")!;
    gl.texParameterf(gl.TEXTURE_2D_ARRAY, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, data, gl.STATIC_DRAW);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);

    for (let i = 0; i < info.depth; i++) {
        const row = Math.trunc(i/size)*info.height;
        const col = (i%size)*info.width;
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, col);
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, info.width, info.height, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    }
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);

    return tex;
}

export function createTextureBuffer(gl: WebGL2RenderingContext, data: Uint8ClampedArray, info: TextureObject) {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }

    gl.activeTexture(gl.TEXTURE0 + info.depth);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, info.width, info.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return tex;
}

/**
 * Internal function to load textures from a TextureInfo object.
 */
function loadTexture(gl: WebGL2RenderingContext, texInfo?: TextureInfo) {
    if (!texInfo) {
        return Promise.resolve([]);
    }

    const promises: Array<Promise<[string, WebGLTexture | null]>> = [];
    for (const [key, info] of Object.entries(texInfo)) {
        const img = new Image();
        const promise = new Promise<[string, WebGLTexture | null]>((resolve) => {
            img.onload = () => {
                const {width, height} = img;
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d")!;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0);

                if (info.target == gl.TEXTURE_2D) {
                    resolve([
                        key,
                        createTextureBuffer(
                            gl, ctx.getImageData(0, 0, width, height).data, info,
                        )],
                    );
                } else {
                    resolve([
                        key,
                        createTextureArrayBuffer(
                            gl, ctx.getImageData(0, 0, width, height).data, width, height, info,
                        )],
                    );
                }
            };
            img.src = key;
        });
        promises.push(promise);
    }

    return Promise.all(promises);
}

export function attachTextureBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, type: GLenum, n = 0,
) {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.activeTexture(gl.TEXTURE0 + n);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, type, fbo.width, fbo.height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.TEXTURE_2D, tex, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (n < fbo.attachments.length) {
        fbo.attachments[n] = {tex: tex, type};
    } else {
        fbo.attachments.push({tex: tex, type});
    }

    return tex;
}

export function attachMSAARenderBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, type: GLenum, n = 0, samples = 4,
) {
    const rb = gl.createRenderbuffer();
    if (!rb) {
        return null
    };
    const maxSamples = Math.max(samples, gl.getParameter(gl.MAX_SAMPLES));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, maxSamples, type, fbo.width, fbo.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.RENDERBUFFER, rb);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (n < fbo.attachments.length) {
        fbo.attachments[n] = {tex: rb, type};
    } else {
        fbo.attachments.push({tex: rb, type});
    }

    return rb;
}

export function attachDepthBuffer(gl: WebGL2RenderingContext, fbo: FrameBufferObject): WebGLRenderbuffer | null {
    const depth = gl.createRenderbuffer();
    if (!depth) {
        return null;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbo.depth = depth;

    return depth;
}

export function attachMSAADepthBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, samples = 4,
): WebGLRenderbuffer | null {
    const depth = gl.createRenderbuffer();
    if (!depth) {
        return null;
    }
    const maxSamples = Math.max(samples, gl.getParameter(gl.MAX_SAMPLES));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, maxSamples, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
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
    gl: WebGL2RenderingContext, width: number, height: number, type: GLenum = gl.RGBA8, depth = true,
): [boolean, FrameBufferObject | null] {
    const fb = gl.createFramebuffer();
    if (!fb) {
        return [false, null];
    }

    const fbo = new FrameBufferObject(fb, width, height);
    if (depth) {
        attachTextureBuffer(gl, fbo, type);
        attachDepthBuffer(gl, fbo);
        return [true, fbo];
    }
    attachTextureBuffer(gl, fbo, type);
    return [true, fbo];
}

export function createMSAAFrameBufferObject(
    gl: WebGL2RenderingContext, width: number, height: number, type: GLenum = gl.RGBA8, samples = 4, depth = true,
): [boolean, FrameBufferObject | null] {

    const fb = gl.createFramebuffer();
    if (!fb) {
        return [false, null];
    }

    const fbo = new FrameBufferObject(fb, width, height, samples);
    if (depth) {
        attachMSAARenderBuffer(gl, fbo, type, 0, samples);
        attachMSAADepthBuffer(gl, fbo, samples);
        return [true, fbo];
    }
    attachMSAARenderBuffer(gl, fbo, type, 0, samples);
    return [true, fbo];
}

export function resizeFrameBufferObject(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number, downscale = true,
) {
    switch (true) {
        case !downscale:
            break;
        case width >= 3840:
            width = 2560;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 3200:
            width = 1920;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 2560:
            width = 1600;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 1920:
            width = 1366;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 1600:
            width = 1280;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 1366:
            width = 1024;
            height = Math.trunc((width/16)*9);
            break;
        case width >= 1280:
            width = 960;
            height = Math.trunc((width/16)*9);
            break;
        default:
            width = 854;
            height = Math.trunc((width/16)*9);
    }

    fbo.width = Math.trunc(width);
    fbo.height = Math.trunc(height);

    for (let i = 0; i < fbo.attachments.length; i++) {
        const {tex, type} = fbo.attachments[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
        if (fbo.samples > 0) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, tex);
            gl.deleteRenderbuffer(tex);
            attachMSAARenderBuffer(gl, fbo, type, i, fbo.samples);
        } else {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.deleteTexture(tex);
            attachTextureBuffer(gl, fbo, type, i);
        }
    }

    if (!fbo.depth) {
        return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.deleteRenderbuffer(fbo.depth);
    if (fbo.samples > 0) {
        attachMSAADepthBuffer(gl, fbo, fbo.samples);
    } else {
        attachDepthBuffer(gl, fbo);
    }
}

/**
 * Plugin event.
 */
export interface PluginLike<T extends Drawable<T>> {
    ready(gl: WebGL2RenderingContext, scene: Scene<T>): void;
    before(gl: WebGL2RenderingContext, scene: Scene<T>): void;
    after(gl: WebGL2RenderingContext, scene: Scene<T>): void;
}
type PluginLikeConstructor<T extends Drawable<T>> = 
    new (gl: WebGL2RenderingContext, scene: Scene<T>) => PluginLike<T>;

/**
 * A WebGL2 program wrapper.
 */
const VERTICES = new Float32Array([
    // xy   uv
    -1, 1, 0, 1,
    -1, -1, 0, 0,
    1, 1, 1, 1,
    1, -1, 1, 0,
]);

type SceneObject<T extends Drawable<T>> = {
    name: string;
    drawables: Array<T>;
    color?: [number, number, number];
    textures?: TextureInfo;
    setters?: UniformObject<T>;
}

type SceneInfo<T extends Drawable<T>> = {
    globals?: {
        fps?: number;
        downscale?: boolean;
        drawables?: Array<T>;
        textures?: TextureInfo;
        setters?: UniformObject<T>;
        color?: [number, number, number];
    },
    scenes: Array<SceneObject<T>>;
}

const sceneInfoDefault = {
    globals: {
        fps: 60,
        downscale: true,
        drawables: [],
        textures: {},
        setters: {},
        color: <[number, number, number]>[0, 0, 0],
    },
    scenes: [],
}

export class Program<T extends Drawable<T>> {
    // Internal state
    protected gl: WebGL2RenderingContext = null!;
    protected programs: Array<WebGLProgram> = null!;
    protected vao: WebGLVertexArrayObject = null!;
    protected fbos: Array<FrameBufferObject> = null!;
    protected sceneDriver: SceneDriver<T> = null!; 
    protected eventQueue: EventQueue<T, Event<T>> = null!;
    protected plugins: Array<PluginLike<T>> = [];
    protected rendering: boolean = false;
    protected rdy: Promise<unknown> = null!;
    protected time = 0;
    protected fps = 60;

    constructor(
        readonly canvas: HTMLCanvasElement,
        vs: string,
        fs: string,
        attribs: AttributeInfo,
        {
            globals = {
                fps: 60,
                downscale: true,
                drawables: [], 
                setters: {}, 
                textures: <TextureInfo>{}
            }, 
            scenes = <Array<SceneObject<T>>>[]
        }: SceneInfo<T> = sceneInfoDefault,
        plugins: Array<PluginLikeConstructor<T>> = [],
    ) {
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            return;
        }
        this.eventQueue = new EventQueue(canvas);

        // Initalize textures. Do this first as it is async.
        const promises: Array<Promise<unknown>> = [];
        let promise: Promise<unknown>|null = promises[0];
        if (globals.textures) {
            promise = loadTexture(gl, globals.textures).then((res) => {
                return res;
            });
            promises.push(promise);
        };
        const textures: Array<Map<string, WebGLTexture|null>> = [];
        for (const scene of scenes) {
            const map = new Map<string, WebGLTexture|null>();
            if (scene.textures) {
                promises.push(loadTexture(gl, scene.textures).then((res) => {
                    for (const [key, tex] of res) {
                        map.set((map.size/2).toString(), tex);
                        map.set(key, tex);
                    }
                }));
            }

            if (promise) {
                promise.then((res) => {
                    for (const [key, tex] of <Array<[string, WebGLTexture]>>res) {
                        map.set((map.size/2).toString(), tex);
                        map.set(key, tex);
                    }
                });
            }
            textures.push(map);
        }
        promise = null;

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
        const [ok_buff, buff] = createStaticBuffer(gl, VERTICES);
        if (!ok_buff) {
            return;
        }

        const [ok_vao, vao] = createVAO(gl, quad_attribs, buff!, null!);
        if (!ok_vao) {
            return;
        }

        // Create the main program
        const [ok_main, main] = createProgram(gl, vs, fs);
        if (!ok_main) {
            return;
        }

        // Initialize attributes
        const mainAttribs = initializeAtrtibutes(gl, main!, attribs ?? {});
        
        // Initialize uniforms
        const uniformInfo = initializeUniforms(gl, main!);
        const setters: Array<Map<string, UniformSetter<T>>> = [];
        for (const scene of scenes) {
            const map = new Map<string, UniformSetter<T>>();
            for (const [key, setter] of Object.entries({...globals.setters, ...scene.setters})) {
                map.set(key, setter);
            }
            setters.push(map);
        }
        
        // Initialize object VAOs
        if (globals.drawables && globals.drawables.length > 0) {
            promise = Promise.all(globals.drawables.map((drawable) => drawable.buffer)).then((res) => {
                return res;
            });
            promises.push(promise);
        }
        
        const vaos: Array<Map<T, WebGLVertexArrayObject>> = [];
        const drawables = new Map<string, Array<T>>();
        for (const scene of scenes) {
            const map = new Map<T, WebGLVertexArrayObject>();
            drawables.set(scene.name, [...scene.drawables]);

            for (const drawable of scene.drawables) {
                promises.push(drawable.buffer.then((res) => {
                    const [vOK, vBuff] = createStaticBuffer(gl, res[0]);
                    if (!vOK) {
                        return;
                    }
        
                    const [iOK, iBuff] = createStaticBuffer(gl, res[1], gl.ELEMENT_ARRAY_BUFFER);
                    if (!iOK) {
                        return;
                    }
        
                    const [ok, vao] = createVAO(gl, mainAttribs, vBuff!, iBuff);
                    if (!ok) {
                        return;
                    }

                    map.set(drawable, vao!);
                }));
            }
            vaos.push(map);
        }

        // Initialize frambuffer
        const [msaaOK, msaaFBO] = createMSAAFrameBufferObject(gl, canvas.width, canvas.height);
        if (!msaaOK) {
            return;
        }
        const [mainOK, mainFBO] = createFrameBufferObject(gl, canvas.width, canvas.height, gl.RGBA8, false);
        if (!mainOK) {
            return;
        }
        const [outOK, outFBO] = createFrameBufferObject(gl, canvas.width, canvas.height,  gl.RGBA8, false);
        if (!outOK) {
            return;
        }

        // Wait for document to load
        promises.push(new Promise<void>((resolve) => {
            globalThis.addEventListener("load", () => {
                resolve();
            });
        }));

        this.gl = gl;
        this.programs = [main!, quad!];
        this.fbos = [mainFBO!, msaaFBO!, outFBO!];
        this.vao = vao!;
        this.fps = globals.fps!;
        this.rdy = Promise.all(promises);
        this.rdy.then(() => {
            const dpi = Math.min(devicePixelRatio || 1, 2);
            const width = canvas.clientWidth*dpi;
            const height = canvas.clientHeight*dpi;
            gl.canvas.width = width;
            gl.canvas.height = height;
            resizeFrameBufferObject(gl, this.fbos[0], width, height, globals.downscale);
            resizeFrameBufferObject(gl, this.fbos[1], width, height, globals.downscale);
            resizeFrameBufferObject(gl, this.fbos[2], width, height, false);

            const map = new Map<string, Scene<T>>();
            for (const scene of scenes.reverse()) {
                const {name, color} = scene;
                map.set(scene.name, new Scene<T>(
                    this.eventQueue,
                    this.fbos.slice(0, 2),
                    vaos.pop()!,
                    drawables.get(name)!,
                    textures.pop()!,
                    setters.pop()!,
                    uniformInfo,
                    color ?? globals?.color
                ));
            }
            this.sceneDriver = new SceneDriver<T>(map, scenes[scenes.length - 1].name);

            for (const plugin of plugins) {
                const i = this.plugins.length;
                this.plugins.push(new plugin(gl, this.sceneDriver.scene()));
                this.plugins[i].ready(gl, this.sceneDriver.scene());
            }
        });
    }

    protected draw(time: number) {
        if (time - this.time < 1000/this.fps) {
            requestAnimationFrame(this.draw.bind(this));
            return;
        }
        this.time = time;

        const {gl} = this;
        const [mainFBO, msaaFBO, outFBO] = this.fbos;
        const scene = this.sceneDriver.scene();
        const {setters, uniformInfo, vaos, drawables, color} = scene;

        // Consume plugins (before). This is a good place to clear attachments.
        for (const plugin of this.plugins) {
            plugin.before(this.gl, scene);
        }

        // Clear MSAA fbo.
        gl.bindFramebuffer(gl.FRAMEBUFFER, msaaFBO.buff);
        gl.drawBuffers(msaaFBO.attachments.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
        for (let i = 0; i < msaaFBO.attachments.length; i++) {
            if (!i) {
                gl.clearBufferfv(gl.COLOR, i, new Float32Array([...color, 1]));
            } else {
                gl.clearBufferfv(gl.COLOR, i, new Float32Array([0, 0, 0, 0]));
            }
        }
        gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1.0, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Use main program
        gl.useProgram(this.programs[0]);
        gl.viewport(0, 0, msaaFBO.width, msaaFBO.height);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        // Set static textures & uniforms
        for (const [key, val] of setters.entries()) {
            if (!uniformInfo.has(key) || val instanceof Function) {
                continue;
            }
            switch (typeof val) {
                case "number":
                case "object":
                    setUniform(gl, uniformInfo.get(key)!, val);
            }
        }

        // Draw to MSAA framebuffer
        gl.clearColor(...color, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, msaaFBO.buff);
        gl.drawBuffers(msaaFBO.attachments.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
        for (let i = 0; i < drawables.length; i++) {
            gl.bindVertexArray(vaos.get(drawables[i])!);
            drawables[i].draw(gl, scene, 0);
            gl.bindVertexArray(null);
        }
        gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);

        // Blit MSAA framebuffer to main framebuffer
        const colorAttachment = <Array<GLenum>>[];
        for (let i = 0; i < msaaFBO.attachments.length; i++) {
            colorAttachment.push(gl.COLOR_ATTACHMENT0 + i);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaaFBO.buff);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, mainFBO.buff);
            gl.readBuffer(gl.COLOR_ATTACHMENT0 + i);
            gl.drawBuffers(colorAttachment);
            gl.blitFramebuffer(
                0, 0, msaaFBO.width, msaaFBO.height,
                0, 0, mainFBO.width, mainFBO.height,
                gl.COLOR_BUFFER_BIT,
                gl.NEAREST,
            );
            colorAttachment[i] = gl.NONE;
        }
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        // Consume plugins (after). This is a good place to do post-processing.
        for (const plugin of this.plugins!) {
            plugin.after(gl, scene);
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, outFBO.buff);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
       
        // Blit to output framebuffer
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, mainFBO.buff);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, outFBO.buff);
        gl.readBuffer(gl.COLOR_ATTACHMENT0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.blitFramebuffer(
            0, 0, mainFBO.width, mainFBO.height,
            0, 0, outFBO.width, outFBO.height,
            gl.COLOR_BUFFER_BIT,
            gl.NEAREST,
        );
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

        // Use quad program
        gl.useProgram(this.programs[1]);
        gl.viewport(0, 0, outFBO.width, outFBO.height);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Draw scene
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, outFBO.attachments[0].tex);
        gl.bindVertexArray(this.vao);
        gl.depthMask(false);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.depthMask(true);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Flush events
        this.eventQueue.fire(new Event<T>("done", {shape: null!}));
        this.eventQueue.flush();

        requestAnimationFrame(this.draw.bind(this));
    }

    switch (name: string) {
        this.sceneDriver.switch(name);
    }

    get(key: string): Scene<T>|null {
        return this.sceneDriver.get(key);
    }

    scene() {
        return this.sceneDriver.scene();
    }

    ready(){
        return this.rdy;
    }

    render() {
        if (this.rendering) {
            return;
        }
        this.rendering = true;
        this.rdy.then(() => {
            requestAnimationFrame(this.draw.bind(this));
        });
    }

    fire(e: Event<T>) {
        this.eventQueue.fire(e);
    }

    on<E extends Event<T>>(type: keyof EventMap<T>, handler: EventHandler<T, E>) {
        this.eventQueue.on(type, <EventHandler<T, Event<T>>>handler);
    }
}

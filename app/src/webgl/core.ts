import {
    AttributeInfo,
    UniformObject,
    UniformInfo,
    TextureInfo,
    TextureObject,
    FrameBufferObject,
    UniformSetter,
    Drawable,
    AttributeObject,
} from "./common.ts";
import {Scene, SceneDriver} from "./scene-driver.ts";
import {EventQueue, Event, EventMap, EventHandler} from "./event-driver.ts";
import quadvs from "./shaders/vertex-quad.ts";
import quadfs from "./shaders/fragment-quad.ts";

export function setUniform(gl: WebGL2RenderingContext, info: UniformInfo, data: Float32Array | Int16Array | number): void {
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
                gl.uniform1iv(loc, <Int16Array> data);
            }
            break;
        case gl.FLOAT:
            if (typeof data === "number") {
                gl.uniform1f(loc, data);
            } else {
                gl.uniform1fv(loc, <Float32Array> data);
            }
            break;
        case gl.INT_VEC2:
            gl.uniform2iv(loc, <Int16Array> data);
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

//########################################################
//# WebGL2 program specific
//########################################################
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
 * Utility function to attach and link shaders for a WebGL2 program.
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

/**
 * Utility function to initialize attributes for a WebGL2 program.
 */
export function initializeAtrtibutes(gl: WebGL2RenderingContext, program: WebGLProgram, attrs: AttributeInfo) {
    const arr: Array<[string, AttributeObject]> = [];
    const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveAttrib(program, i);
        if (!info) {
            continue;
        }

        const name = info.name.split('[')[0];
        if (attrs[name]) {
            arr.push([name, {loc: gl.getAttribLocation(program, name), type: info.type, ...attrs[name]}]);
        }
    }
    arr.sort((a, b) => a[1].loc! - b[1].loc!)

    return new Map(arr);
}

/**
 * Utility function to initialize uniforms for a WebGL2 program.
 */
export function initializeUniforms(gl: WebGL2RenderingContext, program: WebGLProgram) {
    const arr: Array<[string, UniformInfo]> = [];
    const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(program, i);
        if (!info) {
            continue;
        }
        arr.push([info.name, {loc: gl.getUniformLocation(program, info.name)!, type: info.type}]);
    }
    return new Map(arr);
}

type Nullable<T> = T | null;

/**
 * Utility function to create a WebGL2 program.
 */
export function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string, attrs: AttributeInfo
): [Nullable<WebGLProgram>, Nullable<Map<string, AttributeObject>>, Nullable<Map<string, UniformInfo>>] {
    const program = gl.createProgram();
    if (!program) {
        return [null, null, null];
    }

    if (!initializeProgram(gl, program, vs, fs)) {
        return [null, null, null];
    }

    return [program, initializeAtrtibutes(gl, program, attrs), initializeUniforms(gl, program)];
}

//########################################################
//# WebGL2 buffer specific
//########################################################
/**
 * Utility function to create a WebGL2 buffer.
 */
export function createStaticBuffer(
    gl: WebGL2RenderingContext, data: Float32Array|Uint16Array, target?: GLenum, method?: number
): Nullable<WebGLBuffer> {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return null;
    }

    gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
    gl.bufferData(target ?? gl.ARRAY_BUFFER, data, method ?? gl.STATIC_DRAW);
    return buffer;
}

/**
 * Utility function to create a WebGL2 Vertex Array Object.
 */
export function createVAO(
    gl: WebGL2RenderingContext, attrs: Map<string, AttributeObject>, vbuff: Nullable<WebGLBuffer>, ibuff: Nullable<WebGLBuffer> = null,
): Nullable<WebGLVertexArrayObject> {
    const vao = gl.createVertexArray();
    if (!vao) {
        return null;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff!);
    let offset = 0;
    for (const {loc, type, len, stride, size} of attrs.values()) {
                if (type == gl.FLOAT) {
            gl.vertexAttribPointer(loc!, len, type, false, stride, offset);
        } else {
            gl.vertexAttribIPointer(loc!, len, type!, stride, offset);
        }
        gl.enableVertexAttribArray(loc!);
        offset += len*size;
    }
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return vao;
}

//########################################################
//# WebGl 2 texture specific
//########################################################
/**
 * Utility function to create a WebGL2 texture array buffer.
 */
export function createTextureArrayBuffer(
    gl: WebGL2RenderingContext, data: Uint8ClampedArray, width: number, height: number, info: TextureObject,
): Nullable<WebGLTexture> {
    const tex = gl.createTexture(), pbo = gl.createBuffer();
    if (!tex || !pbo) {
        return null;
    }

    const size = Math.trunc(width/info.width);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, size, gl.RGBA8, info.width, info.height, info.depth);

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

/**
 * Utility function to create a WebGL2 texture buffer.
 */
export function createTextureBuffer(gl: WebGL2RenderingContext, data: Uint8ClampedArray, info: TextureObject
): Nullable<WebGLTexture> {
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


//Internal function to load textures from a TextureInfo object. 
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

//########################################################
//# WebGL2 framebuffer specific
//########################################################
function textureInternalFormat(type: GLenum) {
    switch (type) {
        case WebGL2RenderingContext.RGBA8:
            return [WebGL2RenderingContext.RGBA, WebGL2RenderingContext.UNSIGNED_BYTE];
        case WebGL2RenderingContext.R16I:
            return [WebGL2RenderingContext.RED_INTEGER, WebGL2RenderingContext.SHORT];

    }
    return [];
}
/**
 * Utility function to attach a texture to a framebuffer object.
 */
export function attachTextureBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, format: GLenum, n = 0,
): Nullable<WebGLTexture> {
    const tex = gl.createTexture();
    if (!tex) {
        return null;
    }
    const [internalFormat, type] = textureInternalFormat(format);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);    
    gl.texImage2D(gl.TEXTURE_2D, 0, format, fbo.width, fbo.height, 0, internalFormat, type, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.TEXTURE_2D, tex, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbo.attachments.push({tex, format});

    return tex;
}

/**
 * Utility function to attach a depth buffer to a framebuffer object.
 */
export function attachDepthBuffer(gl: WebGL2RenderingContext, fbo: FrameBufferObject
): Nullable<WebGLRenderbuffer> {
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

/**
 * Utility function to attach a MSAA texture to a framebuffer object.
 */
export function attachMSAABuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, format: GLenum, n = 0, samples = 4,
): Nullable<WebGLRenderbuffer> {
    const tex = gl.createRenderbuffer();
    if (!tex) {
        return null
    };
    const maxSamples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.bindRenderbuffer(gl.RENDERBUFFER, tex);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, maxSamples, format, fbo.width, fbo.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.RENDERBUFFER, tex);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    fbo.attachments.push({tex, format});

    return tex;
}

/**
 * Utility function to attach a MSAA depth buffer to a framebuffer object.
 */
export function attachMSAADepthBuffer(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, samples = 4,
): Nullable<WebGLRenderbuffer> {
    const depth = gl.createRenderbuffer();
    if (!depth) {
        return null;
    }
    const maxSamples = Math.min(samples, gl.getParameter(gl.MAX_SAMPLES));
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
): Nullable<FrameBufferObject> {
    const fb = gl.createFramebuffer();
    if (!fb) {
        return null;
    }

    const fbo = new FrameBufferObject(fb, width, height);
    if (depth) {
        attachTextureBuffer(gl, fbo, type);
        attachDepthBuffer(gl, fbo);
        return fbo;
    }
    attachTextureBuffer(gl, fbo, type);
    return fbo;
}

/**
 * Utility function to create a MSAA framebuffer object.
 */
export function createMSAAFrameBufferObject(
    gl: WebGL2RenderingContext, width: number, height: number, type: GLenum = gl.RGBA8, samples = 4, depth = true,
): Nullable<FrameBufferObject> {
    const fb = gl.createFramebuffer();
    if (!fb) {
        return null;
    }

    const fbo = new FrameBufferObject(fb, width, height, samples);
    if (depth) {
        attachMSAABuffer(gl, fbo, type, 0, samples);
        attachMSAADepthBuffer(gl, fbo, samples);
        return fbo;
    }
    attachMSAABuffer(gl, fbo, type, 0, samples);
    return fbo;
}

export function resizeFrameBufferObject(
    gl: WebGL2RenderingContext, fbo: FrameBufferObject, width: number, height: number,
) {
    fbo.width = Math.trunc(width);
    fbo.height = Math.trunc(height);

    for (let i = 0; i < fbo.attachments.length; i++) {
        const {tex, format} = fbo.attachments[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
        if (fbo.samples > 0) {
            gl.bindRenderbuffer(gl.RENDERBUFFER, tex);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.samples, format, fbo.width, fbo.height);
        } else {
            const [internalFormat, type] = textureInternalFormat(format);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, format, fbo.width, fbo.height, 0, internalFormat, type, null);
        }
    }

    if (!fbo.depth) {
        return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    if (fbo.samples > 0) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.depth);
        gl.renderbufferStorageMultisample(gl.RENDERBUFFER, fbo.samples, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
    } else {
        gl.bindRenderbuffer(gl.RENDERBUFFER, fbo.depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fbo.width, fbo.height);
    }
}

//########################################################
//# Plugin specific
//########################################################
export interface PluginLike<T extends Drawable<T>> {
    ready(gl: WebGL2RenderingContext, scene: Scene<T>): void;
    before(gl: WebGL2RenderingContext, scene: Scene<T>): void;
    after(gl: WebGL2RenderingContext, scene: Scene<T>): void;
}

type PluginLikeConstructor<T extends Drawable<T>> = 
    new (gl: WebGL2RenderingContext, scene: Scene<T>) => PluginLike<T>;

//########################################################
//# Scene specific
//########################################################
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
        downsample?: number;
        textures?: TextureInfo;
        setters?: UniformObject<T>;
        color?: [number, number, number];
    },
    scenes: Array<SceneObject<T>>;
}

const sceneInfoDefault = {
    globals: {
        fps: 60,
        downsample: 2,
        textures: {},
        setters: {},
        color: <[number, number, number]>[0, 0, 0],
    },
    scenes: [],
}

//########################################################
//# Program specific
//########################################################
type RenderInfo = {
    downsample: number | "adaptive";
    fps: number | "adaptive";
}

function adaptiveDownsample(gl: WebGL2RenderingContext, downsample: number | "adaptive") {
    const ext = gl.getExtension("WEBGL_debug_renderer_info")!;
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
    
    if (typeof downsample == "number") {
        return downsample;
    }
    switch (true) {
        case vendor.includes("NVIDIA"):
        case vendor.includes("AMD"):
        case vendor.includes("ARM"):
            return 2;
        default:
            return 3;
    }
}

function adaptiveFPSe(gl: WebGL2RenderingContext, fps: number | "adaptive") {
    const ext = gl.getExtension("WEBGL_debug_renderer_info")!;
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);

    if (typeof fps == "number") {
        return fps;
    }
    switch (true) {
        case vendor.includes("NVIDIA"):
        case vendor.includes("AMD"):
            return 60;
        default:
            return 30;
    }
}

const VERTICES = new Float32Array([
    // xy           uv
    -1.0, 1.00,     0, 1,
    -1.0, -1.0,     0, 0,
    1.00, 1.00,     1, 1,
    1.00, -1.0,     1, 0,
]);

export class Program<T extends Drawable<T>> {
    protected canvas: HTMLCanvasElement = null!;
    protected gl: WebGL2RenderingContext = null!;
    protected programs: Array<WebGLProgram> = null!;
    protected quadVAO: WebGLVertexArrayObject = null!;
    protected uniforms: Map<string, UniformInfo> = null!;
    protected fbos: Array<FrameBufferObject> = null!;
    protected sceneDriver: SceneDriver<T> = null!; 
    protected eventQueue: EventQueue<T, Event<T>, Program<T>|Scene<T>> = null!;
    protected renderInfo: RenderInfo = null!;
    protected plugins: Array<PluginLike<T>> = [];
    protected rdy: Promise<Program<T>> = null!;
    protected time = 0;
    protected resizeRequest = 0;
    protected switchRequest = "";
    protected frame = -1;

    constructor(
        canvas: HTMLCanvasElement,
        vertexShader: string,
        fragmentShader: string,
        attributeInfo: AttributeInfo,
        renderInfo: RenderInfo,
        sceneInfo: SceneInfo<T> = sceneInfoDefault,
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
        const textures = new Map<string, Map<string, WebGLTexture|null>>();
        if (sceneInfo.globals?.textures) {
            promises.push(loadTexture(gl, sceneInfo.globals.textures).then((res) => {
                const map = new Map<string, WebGLTexture|null>();
                for (const [key, tex] of <Array<[string, WebGLTexture]>>res) {
                    map.set((map.size/2).toString(), tex);
                    map.set(key, tex);
                }
                textures.set("globals", map);
            }));
        };
        for (const scene of sceneInfo.scenes) {
            if (!scene.textures) {
                continue;
            }
            const map = new Map<string, WebGLTexture|null>();
            promises.push(loadTexture(gl, scene.textures).then((res) => {
                for (const [key, tex] of res) {
                    map.set((map.size/2).toString(), tex);
                    map.set(key, tex);
                }
            }));
            textures.set(scene.name, map);
        }

        // Program draws everything to a fbo. This allows plugins to obtain that fbo,
        // and extend it with their own drawing logic. So start by creating a quad,
        // and if that fails, just return.
        const [quad, quadAttrs] = createProgram(gl, quadvs, quadfs, {
            "a_position": {type: gl.FLOAT, len: 2, size: 4, stride: 16},
            "a_uv": {type: gl.FLOAT, len: 2, size: 4, stride: 16},
        });
        if (!quad) {
            return
        };

        const quadVAO = createVAO(gl, quadAttrs!, createStaticBuffer(gl, VERTICES));
        if (!quadVAO) {
            return;
        }
        
        // Create the main program
        const [main, mainAttrs, mainUniforms] = createProgram(gl, vertexShader, fragmentShader, attributeInfo);
        if (!main) {
            return;
        }
        const setters = new Map<string, Map<string, UniformSetter<T>>>();
        if (sceneInfo.globals?.setters) {
            const map = new Map<string, UniformSetter<T>>();
            for (const [key, setter] of Object.entries(sceneInfo.globals.setters)) {
                map.set(key, setter);
            }
            setters.set("globals", map);
        }
        for (const scene of sceneInfo.scenes) {
            if (!scene.setters) {
                continue;
            }
            const map = new Map<string, UniformSetter<T>>();
            for (const [key, setter] of Object.entries(scene.setters)) {
                map.set(key, setter);
            }
            setters.set(scene.name, map);
        }
        
        // Initialize object VAOs
        const vaos = new Map<string, Map<T, WebGLVertexArrayObject>>();
        const drawables = new Map<string, Array<T>>();
        for (const scene of sceneInfo.scenes) {
            const map = new Map<T, WebGLVertexArrayObject>();
            for (const drawable of scene.drawables) {
                promises.push(drawable.buffer.then((res) => {
                    const vao = createVAO(
                        gl,
                        mainAttrs!,
                        createStaticBuffer(gl, res[0]),
                        createStaticBuffer(gl, res[1], gl.ELEMENT_ARRAY_BUFFER)
                    );
                    map.set(drawable, vao!);
                }));
            }
            vaos.set(scene.name, map);
            drawables.set(scene.name, [...scene.drawables]);
        }

        // Initialize FBOs
        const msaaFBO = createMSAAFrameBufferObject(gl, canvas.width, canvas.height);
        const mainFBO = createFrameBufferObject(gl, canvas.width, canvas.height, gl.RGBA8, false);
        const outFBO = createFrameBufferObject(gl, canvas.width, canvas.height, gl.RGBA8, false);
        if (!msaaFBO || !mainFBO || !outFBO) {
            return;
        }

        // Handle resize
        const obs = new ResizeObserver(() => {
            this.resizeRequest++;
        });
        obs.observe(canvas);

        // Wait for document to load
        promises.push(new Promise<void>((resolve) => {
            globalThis.addEventListener("load", () => resolve());
        }));

        this.canvas = canvas;
        this.gl = gl;
        this.programs = [main, quad];
        this.fbos = [mainFBO, msaaFBO, outFBO];
        this.quadVAO = quadVAO;
        this.renderInfo = renderInfo;
        this.resizeRequest = 1;
        this.rdy = Promise.all(promises).then(() => {
            // Layout has been settled, so resize framebuffers.
            this.resize();

            // All assets has been loaded, so join global/local assets.
            if (textures.has("globals")) {
                const entries = textures.get("globals")!;
                for (const scene of sceneInfo.scenes) {
                    const map = textures.get(scene.name) ?? new Map();
                    for (const [k, v] of entries) {
                        map.set(k, v);
                    }
                    textures.set(scene.name, map);
                }
            }

            if (setters.has("globals")) {
                const entries = setters.get("globals")!;
                for (const scene of sceneInfo.scenes) {
                    const map = setters.get(scene.name) ?? new Map();
                    for (const [k, v] of entries) {
                        map.set(k, v);
                    }
                    setters.set(scene.name, map);
                }
            }

            // Initialize scenedriver.
            const map = new Map<string, Scene<T>>();
            for (const scene of sceneInfo.scenes) {
                const {name, color} = scene;
                map.set(scene.name, new Scene<T>(
                    <EventQueue<T, Event<T>, Scene<T>>>this.eventQueue,
                    this,
                    this.fbos.slice(0, 2),
                    vaos.get(name)!,
                    drawables.get(name)!,
                    textures.get(name)!,
                    setters.get(name)!,
                    mainUniforms!,
                    color ?? sceneInfo.globals?.color
                ));
            }
            this.sceneDriver = new SceneDriver<T>(map, sceneInfo.scenes[0].name);

            // Initiliazie plugins.
            for (const Plugin of plugins) {
                this.plugins.push(new Plugin(gl, this.sceneDriver.scene()));
            }

            // Start the event queue
            const fn = () => {
                const scene = this.sceneDriver.scene();

                // Handle resize requests
                if (this.resizeRequest) {
                    this.resize();
                    this.resizeRequest = 0;
                    this.eventQueue.fire(this, new Event<T>("resize"));
                }

                // Handle switch requests
                if (this.switchRequest != "") {
                    this.sceneDriver.switch(this.switchRequest);
                    this.switchRequest = "";
                }

                // Flush the event queue
                this.eventQueue
                    .flush(this)
                    .flush(scene);
                requestAnimationFrame(fn);
            }
            fn();

            return this;
        });
    }

    protected resize() {
        const {canvas, gl, fbos: [mainFBO, msaaFBO, outFBO], renderInfo} = this;
        const dpi = Math.min(devicePixelRatio || 1, 2);
        const downsample = 1/adaptiveDownsample(gl, renderInfo.downsample)!
        const width = Math.max(canvas.clientWidth*dpi, canvas.clientHeight*dpi);
        const height = Math.min(canvas.clientWidth*dpi, canvas.clientHeight*dpi);
        gl.canvas.width = width;
        gl.canvas.height = height;
        resizeFrameBufferObject(gl, msaaFBO!, width*downsample, height*downsample);
        resizeFrameBufferObject(gl, mainFBO!, width*downsample, height*downsample);
        resizeFrameBufferObject(gl, outFBO!, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }

    protected draw(time: number) {
        const {gl, renderInfo} = this;

        if (time - this.time < 1000/adaptiveFPSe(gl, renderInfo.fps)) {
            this.frame = requestAnimationFrame(this.draw);
            return;
        }
        this.time = time;
        
        const [mainFBO, msaaFBO, outFBO] = this.fbos;
        const scene = this.sceneDriver.scene();
        const {vaos, drawables, color} = scene;

        // Consume plugins (before)
        for (const plugin of this.plugins) {
            plugin.before(gl, scene);
        }

        // Use main program
        gl.useProgram(this.programs[0]);
        gl.viewport(0, 0, msaaFBO.width, msaaFBO.height);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Clear MSAA framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, msaaFBO.buff);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.clearColor(...color, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const {setters, uniformInfo} = scene;
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

        // Draw geometry
        gl.drawBuffers(msaaFBO.attachments.map((_, i) => gl.COLOR_ATTACHMENT0+i));
        for (const drawable of drawables) {
            gl.bindVertexArray(vaos.get(drawable)!);
            drawable.draw(gl, scene, 0);
            gl.bindVertexArray(null);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        // Blit MSAA franebyffer to main framebuffer
        const drawBuffers = [];
        for (let i = 0; i < msaaFBO.attachments.length; i++) {
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaaFBO.buff);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, mainFBO.buff);
            gl.readBuffer(gl.COLOR_ATTACHMENT0+i);
            drawBuffers.push(gl.COLOR_ATTACHMENT0+i)
            gl.drawBuffers(drawBuffers);
            gl.blitFramebuffer(
                0, 0, msaaFBO.width, msaaFBO.height,
                0, 0, mainFBO.width, mainFBO.height,
                gl.COLOR_BUFFER_BIT,
                gl.NEAREST,
            );
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
            drawBuffers[i] = gl.NONE;
        }

        // Consume plugins (after)
        for (const plugin of this.plugins) {
            plugin.after(gl, scene);
        }

        // Blit main framebuffer to out framebuffer
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

        // Use quad
        gl.useProgram(this.programs[1]);
        gl.viewport(0, 0, outFBO.width, outFBO.height);
        gl.depthMask(false);

        // Clear quad
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Draw quad
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, outFBO.attachments[0].tex);
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);

        // Fire events
        this.eventQueue
            .fire(this, new Event<T>("done"))
            .fire(scene, new Event<T>("done"))

        this.frame = requestAnimationFrame(this.draw);
    }

    fire(e: Event<T>) {
        this.eventQueue.fire(this, e);
    }

    on<E extends Event<T>>(type: keyof EventMap<T>, handler: EventHandler<T, E>) {
        this.eventQueue.on(type, this, <EventHandler<T, Event<T>>>handler);
    }

    switch(scene: string) {
        this.switchRequest = scene;
    }

    get(scene: string): Scene<T>|null {
        return this.sceneDriver.get(scene);
    }

    scene() {
        return this.sceneDriver.scene();
    }

    ready() {
        return this.rdy;
    }

    stop() {
        cancelAnimationFrame(this.frame);
        this.frame = -1;
    }

    render() {
        if (this.frame != -1) {
            return;
        }
        return this.rdy.then(() => {
            this.draw = this.draw.bind(this);
            this.frame = requestAnimationFrame(this.draw);
            return this;
        });
    }
}

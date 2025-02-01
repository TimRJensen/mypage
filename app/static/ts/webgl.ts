import {
    Drawable,
    UniformInfo,
    UniformDynamic,
    UniformStatic,
    uniformSetter,
} from "./webglcommon.js";


export function createShader(gl: WebGL2RenderingContext, src: string, type: number): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null!;
    }

    return shader
}

export function createStaticBuffer(gl: WebGL2RenderingContext, data: ArrayBuffer, method: number = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    if (!buffer) {
        return undefined;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, method);
    return buffer;
}

export function createVAO(gl: WebGL2RenderingContext, program: WebGLProgram, attrs:  AttributeInfo = {}, buff?: WebGLBuffer) {
    const vao = gl.createVertexArray();
    if (!vao) {
        return null
    }
    gl.bindVertexArray(vao);

    if (!buff) {
        return vao;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buff);

    let offset = 0, loc = 0;
    for (const [name, {type, len, stride, size}] of Object.entries(attrs)) {
        gl.bindAttribLocation(program, loc, name);
        gl.enableVertexAttribArray(loc);

        if (type === gl.FLOAT) {
            gl.vertexAttribPointer(loc, len, type, false, stride*size, offset);
        } else {
            gl.vertexAttribIPointer(loc, len, type, stride*size, offset);
        }
        loc++;
        offset += len*size;
    }
    gl.bindVertexArray(null);

    return vao;
}

function loadTexture(gl: WebGL2RenderingContext, program: WebGLProgram, atlas?: AtlasInfo) {
    if (!atlas) {
        return;
    }

    for (const [key, info] of Object.entries(atlas)) {
        const img = new Image();
        img.onload = () => {
            createTextureArrayBuffer(gl, program, key, img, info.idx, info.width, info.height, info.depth);
        };
        img.src = info.path;
    }
}

export function createTextureArrayBuffer(gl: WebGL2RenderingContext, program: WebGLProgram, key: string, data: HTMLImageElement, idx: number, width: number, height: number, depth: number) { 
    const tex = gl.createTexture();
    if (!tex) {
        return undefined;
    }

    gl.activeTexture(gl.TEXTURE0 + idx);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, width, height, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    // gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(gl.getUniformLocation(program, key), idx);

    return tex;
}

export function createFrameBuffer(gl: WebGL2RenderingContext, width: number, height: number) {
    const fbo = gl.createFramebuffer(), buff = gl.createRenderbuffer();
    if (!fbo || !buff) {
        return null;
    }

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

    gl.bindRenderbuffer(gl.RENDERBUFFER, buff);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, buff);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return fbo;
}

export type EventMap<T> = {[key in keyof HTMLElementEventMap]: PluginEvent<T>} & {"done": PluginEvent<T>};
export type PluginEventHandler<T, K extends keyof EventMap<T>> = (e: EventMap<T>[K]) => void;
export class PluginEvent<T> extends CustomEvent<T> {
    [key: string]: any;
    id: number;
    shape: T;
    node: T;

    constructor(type: keyof EventMap<T>, {id, shape, shapes, node}: {id: number, shape: T, node: T, shapes: Array<T>}) {
        super(type);

        this.id = id;
        this.shape = shape;
        this.shapes = shapes;
        this.node = node
    }
}

export interface DrawOptions<T> {
    static?: UniformStatic,
    dynamic?: UniformDynamic<T>, 
}

export interface DrawObject<T> {
    vao: WebGLVertexArrayObject|null,
    shape: Drawable<T>,
}

export interface Plugin<T> {
    use(): void,
    draw(fbo: WebGLFramebuffer, options: DrawOptions<T>, objects: Array<DrawObject<T>>): void,
    on<K extends keyof EventMap<T>>(type: K, handler: PluginEventHandler<T, K>): void,
    flush(): void,
    done(): void,
}

type AtlasInfo = {
    [key: string]: {
        path: string,
        idx: number,
        width: number,
        height: number,
        depth: number,
    }
}

type AttributeInfo = {
    [key: string]: {
        type: GLenum,
        len: number,
        stride: number,
        size: number,
    }
};

interface ProgramOptions<T> {
    color?: [number, number, number, number],
    attrs?: AttributeInfo,
    atlases?: AtlasInfo,
    plugins?: Array<Plugin<T>>,
}

export class Program<T extends Drawable<T>> {
    protected gl: WebGL2RenderingContext = null!;
    protected program: WebGLProgram = null!;
    protected programOptions: ProgramOptions<T> = null!;
    protected uniforms: Map<string, UniformInfo> = new Map();
    protected objects: Array<DrawObject<T>> = [];
    protected plugins: Array<Plugin<T>> = [];
    readonly drawOptions: DrawOptions<T> = null!;

    constructor (
        protected canvas: HTMLCanvasElement,
        protected shapes: Array<T>,
        vs: string,
        fs: string,
        options: ProgramOptions<T> = {attrs: {}},
    ) {
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL2 not supported");
            alert("WebGL2 not supported");
            return;
        }

        const program = gl.createProgram();
        if (!program) {
            return;
        }

        // Initalize textures. Do this immediately as it as async.
        loadTexture(gl, program, options.atlases);

        // Initialize object VAOs
        for (const shape of shapes) {
            this.objects.push({
                vao: createVAO(gl, program, options.attrs, createStaticBuffer(gl, shape.buffer)),
                shape,
            });
        }

        // Initialize program
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

        console.log(gl.getParameter(gl.MAX_TEXTURE_SIZE ))
        console.log(gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS ))
        console.log(gl.getParameter(gl.MAX_3D_TEXTURE_SIZE ))


        // Initialize uniforms
        const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < n; i++) {
            const info = gl.getActiveUniform(program, i);
            if (!info) {
                continue
            }

            this.uniforms.set(
                info.name.split("[")[0], 
                {loc: gl.getUniformLocation(program, info.name)!, type: info.type}
            );
        }

        this.gl = gl;
        this.program = program;
        this.programOptions = options;
        this.programOptions.color ??= [0, 0, 0, 1];
        this.programOptions.plugins ??= [];
    }

    setClearColor(r: number, g: number, b: number, a: number) {
        this.programOptions.color = [r/255, g/255, b/255, a];
    }

    use() {
        this.gl.useProgram(this.program);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    
    draw() {
        // Use plugins
        const fbo = createFrameBuffer(this.gl, this.gl.canvas.width*0.5, this.gl.canvas.height*0.5)!;
        for (const plugin of this.programOptions.plugins!) {
            plugin.use();
            plugin.draw(fbo, this.drawOptions, this.objects);
            plugin.flush();
            plugin.done();
        }

        // Setup the draw
        this.use();

        // Resize canvas
        this.gl.canvas.width = this.canvas.clientWidth;
        this.gl.canvas.height = this.canvas.clientHeight;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

        // Clear canvas
        this.gl.clearColor(
            this.programOptions.color![0]/255,
            this.programOptions.color![1]/255,
            this.programOptions.color![2]/255,
            this.programOptions.color![3],
        );
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Static uniforms
        if (this.drawOptions.static) {
            for (const [key, value] of Object.entries(this.drawOptions.static)) {
                if (!this.uniforms.has(key)) {
                    continue;
                }
                uniformSetter(this.gl, this.uniforms.get(key)!, value);
            }
        }
        
        // Draw
        for (const {vao, shape} of this.objects) {
            this.gl.bindVertexArray(vao);
            shape.draw(this.gl, this.uniforms, this.drawOptions.dynamic);
            this.gl.bindVertexArray(null);
        }

        requestAnimationFrame(this.draw.bind(this));
    }

    render(options: DrawOptions<T> = {static: {}, dynamic: {}}) {
        if (this.drawOptions) {
            Reflect.set(this, "drawOptions", options);
            return this;
        }

        Reflect.set(this, "drawOptions", options);
        requestAnimationFrame(this.draw.bind(this));
        return this;
    }
}

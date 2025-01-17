import { vec3, mat4 } from "./linalg.js";
function createShader(gl, src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}
function setFrameBufferSize(gl, tex, buff, width, height) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buff);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}
export class Program {
    constructor(canvas, gl, attrs, uniforms, vs, fs) {
        this.canvas = canvas;
        this.gl = gl;
        this.attrs = attrs;
        this.uniforms = uniforms;
        this.shapes = [];
        this.vp = new mat4();
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.program = gl.createProgram();
        gl.attachShader(this.program, createShader(gl, fs, gl.FRAGMENT_SHADER));
        gl.attachShader(this.program, createShader(gl, vs, gl.VERTEX_SHADER));
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.log(gl.getProgramInfoLog(this.program));
        }
        this.vp = mat4
            .perspective(Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 2500)
            .mul(mat4.lookAt(new vec3([0, 1.5, 0.25]), new vec3([0, 0, 0]), new vec3([0, 1, 0])));
        this.col = [0.0, 0.0, 0.0, 1.0];
    }
    getAttribLocation(name) {
        return this.gl.getAttribLocation(this.program, name);
    }
    getUniformLocation(name) {
        return this.gl.getUniformLocation(this.program, name);
    }
    setShapes(shape) {
        this.shapes.push(...shape);
    }
    setClearColor(r, g, b) {
        this.col = [r / 255, g / 255, b / 255, 1.0];
    }
    draw() {
        this.gl.useProgram(this.program);
        // Clear canvas
        this.gl.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.gl.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(...this.col);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        // Draw
        this.shapes.forEach((shape) => {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.depthFunc(this.gl.LEQUAL);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            shape.draw(this.vp.translate(this.x, this.y, this.z), this.program, this.attrs, this.uniforms);
        });
    }
}
export class Picker extends Program {
    constructor(canvas, gl, attrs, uniforms, vs, fs) {
        super(canvas, gl, attrs, uniforms, vs, fs);
        this.canvas = canvas;
        this.gl = gl;
        this.attrs = attrs;
        this.uniforms = uniforms;
        this.db = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.db);
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.db);
        setFrameBufferSize(gl, this.tex, this.db, gl.canvas.width, gl.canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    draw() {
        this.gl.useProgram(this.program);
        setFrameBufferSize(this.gl, this.tex, this.db, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fb);
        this.gl.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.gl.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        // this.gl.clearColor(...this.col as [number, number, number, number]);
        this.shapes.forEach((shape) => {
            this.gl.enable(this.gl.BLEND);
            this.gl.enable(this.gl.DEPTH_TEST);
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.depthFunc(this.gl.LEQUAL);
            this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
            shape.draw(this.vp.translate(this.x, this.y, this.z), this.program, this.attrs, this.uniforms);
        });
        const x = this.x * this.gl.canvas.width / this.gl.canvas.clientWidth;
        const y = this.gl.canvas.height - this.y * this.gl.canvas.height / this.gl.canvas.clientHeight - 1;
        const data = new Uint8Array(4);
        // console.log(x, y)
        this.gl.readPixels(x, y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
        console.log(data);
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }
}

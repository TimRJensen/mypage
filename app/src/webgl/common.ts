export type AttributeObject = {
    loc?: number;
    type?: number;
    len: number;
    stride: number;
    size: number;
};

export type AttributeInfo = {
    [key: string]: AttributeObject;
};

export type UniformObject = {
    loc: WebGLUniformLocation;
    type: number;
};

export type TextureObject = {
    width: number;
    height: number;
    depth: number;
};

export type TextureInfo = {
    [key: string]: TextureObject;
};

export type DrawInfo<T> = Record<string, number | Float32Array | Int32Array | ((shape: T) => number | Float32Array | Int32Array)>;

export interface Drawable<T> extends Iterable<T> {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    draw(
        gl: WebGLRenderingContext, uniformInfo: Map<string,UniformObject>, drawInfo: DrawInfo<T>, textureInfo: Array<WebGLTexture | null>, offset?: number
    ): void;
}

export type Scene<T> = Array<[WebGLVertexArrayObject, Drawable<T>]>;

export function setUniform(gl: WebGL2RenderingContext, info: UniformObject, data: Float32Array | Int32Array | number): void {
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

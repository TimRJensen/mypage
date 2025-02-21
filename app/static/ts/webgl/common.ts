export type AttributeObject = {
    loc?: number, 
    type?: number,
    len: number,
    stride: number,
    size: number,
}

export type AttributeInfo = {
    [key: string]: AttributeObject,
}

export type UniformObject = {
    loc: WebGLUniformLocation,
    type: number,
};

export type TextureInfo = {
    [key: string]: {
        idx: number,
        width: number,
        height: number,
        depth: number,
    }
}

export type DrawInfo<T> = {
    [key: string]: number | ArrayBuffer | ((shape: T) => number|ArrayBuffer)
}

export interface Drawable <T> extends Iterable<T> {
    readonly buffer: Promise<[WebGLBuffer, WebGLBuffer]>;
    draw(gl: WebGLRenderingContext, map: Map<string, UniformObject>, drawObject: DrawInfo<T>, offset?: number): void;
}

export interface CompositeLike<T> extends Drawable<T> {
    readonly shapes: Array<T>,
}

export type Scene<T> = Array<[WebGLVertexArrayObject, Drawable<T>]>;


export function setUniform(gl: WebGL2RenderingContext, info: UniformObject, data: ArrayBuffer|number) {
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
                gl.uniform1iv(loc, data as Int32Array);
            }
            break;
        case gl.FLOAT:
            if (typeof data === "number") {
                gl.uniform1f(loc, data);
            } else {
                gl.uniform1fv(loc, data as Float32Array);
            }
            break;
        case gl.FLOAT_VEC2:
            gl.uniform2fv(loc, data as Float32Array);
            break;
        case gl.FLOAT_VEC3:
            gl.uniform3fv(loc, data as Float32Array);
            break;
        case gl.FLOAT_VEC4:
            gl.uniform4fv(loc, data as Float32Array);
            break;
        case gl.FLOAT_MAT2:
            gl.uniformMatrix2fv(loc, false, data as Float32Array);
            break;
        case gl.FLOAT_MAT3:
            gl.uniformMatrix3fv(loc, false, data as Float32Array);
            break;
        case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(loc, false, data as Float32Array);
            break;
    }
};

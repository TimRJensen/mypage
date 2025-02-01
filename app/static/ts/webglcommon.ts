export interface Drawable <T> extends Iterable<T> {
    readonly vertices: Array<number>,
    readonly buffer: ArrayBuffer,
    draw(gl: WebGLRenderingContext, map: Map<string, UniformInfo>, uniforms?: UniformDynamic<T>, offset?: number): void,
}

export interface CompositeLike<T> extends Drawable<T> {
    readonly shapes: Array<T>,
}

export type UniformInfo = {
    loc: WebGLUniformLocation,
    type: number,
};

export type UniformStatic = {
    [key: string]: ArrayBuffer | number
};

export type UniformDynamic<T> = {
    [key: string]: (shape: T) => ArrayBuffer|number
};

export function uniformSetter(gl: WebGL2RenderingContext, info: UniformInfo, data: ArrayBuffer|number) {
    const {loc, type} = info;

    switch (type) {
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

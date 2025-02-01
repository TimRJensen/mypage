export function uniformSetter(gl, info, data) {
    const { loc, type } = info;
    switch (type) {
        case gl.INT:
            if (typeof data === "number") {
                gl.uniform1i(loc, data);
            }
            else {
                gl.uniform1iv(loc, data);
            }
            break;
        case gl.FLOAT:
            if (typeof data === "number") {
                gl.uniform1f(loc, data);
            }
            else {
                gl.uniform1fv(loc, data);
            }
            break;
        case gl.FLOAT_VEC2:
            gl.uniform2fv(loc, data);
            break;
        case gl.FLOAT_VEC3:
            gl.uniform3fv(loc, data);
            break;
        case gl.FLOAT_VEC4:
            gl.uniform4fv(loc, data);
            break;
        case gl.FLOAT_MAT2:
            gl.uniformMatrix2fv(loc, false, data);
            break;
        case gl.FLOAT_MAT3:
            gl.uniformMatrix3fv(loc, false, data);
            break;
        case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(loc, false, data);
            break;
    }
}
;

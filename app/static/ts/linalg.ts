export class vec3 extends Float32Array {
    constructor(from?: Iterable<number>) {
        if (!from) {
            from = [0, 0, 0];
        }
        super(from);
    }

    set x(x: number) {
        this[0] = x;
    }
    get x() {
        return this[0];
    }
    set y(y: number) {
        this[1] = y;
    }
    get y() {
        return this[1];
    }
    set z(z: number) {
        this[2] = z;
    }
    get z() {
        return this[2];
    }

    sub (other: vec3) {
        return new vec3([this[0] - other[0], this[1] - other[1], this[2] - other[2]]);
    }

    normalize() {
        let l = this[0]*this[0] + this[1]*this[1] + this[2]*this[2];
        if (l > 0) {
            l = 1/Math.sqrt(l);
        }
        return new vec3([this[0]*l, this[1]*l, this[2]*l]);
    }

    cross(other: vec3) {
        return new vec3([
            this[1]*other[2] - this[2]*other[1], 
            this[2]*other[0] - this[0]*other[2], 
            this[0]*other[1] - this[1]*other[0],
        ]);
    }

}

export class mat4 extends Float32Array {
    private k = 4;

    constructor(from?: Iterable<number>) {
        if (!from) {
            from = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
        super(from);
    }

    private static matt(x: number, y: number, z: number) {
        return new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ]);
    }

    private static matrx(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        ]);
    }
    private static matry(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }
    private static matrz(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }

    static perspective(fov: number, aspect: number, near: number, far: number) {
        const f = Math.tan(Math.PI*0.5 - 0.5*fov);
        const range = 1/(near - far);
        return new mat4([
            f/aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near+far)*range, -1,
            0, 0, 2*near*far*range, 0,
        ]);
    }

    static lookAt(eye: vec3, target: vec3, up: vec3) {
        if (
            Math.abs(eye[0] - target[0]) < 0.000001 && 
            Math.abs(eye[1] - target[1]) < 0.000001 &&
            Math.abs(eye[2] - target[2]) < 0.000001
        ) {
            return new mat4();
        }

        const z = eye.sub(target).normalize();
        const x = up.cross(z).normalize();
        const y = z.cross(x).normalize();

        return new mat4([
            ...x, 0,
            ...y, 0,
            ...z, 0,
            -(x[0]*eye[0] + x[1]*eye[1] + x[2]*eye[2]),
            -(y[0]*eye[0] + y[1]*eye[1] + y[2]*eye[2]),
            -(z[0]*eye[0] + z[1]*eye[1] + z[2]*eye[2]),
            1,
        ]);
    }

    mul(other: mat4) {
        const a = this;
        const b = other;
        const r = new Float32Array(this.k*this.k);
        for (let i = 0; i < this.k; i++) {
            for (let j = 0; j < this.k; j++) {
                r[j*4+i] = a[i]*b[j*4] + a[i+4]*b[j*4+1] + a[i+8]*b[j*4+2] + a[i+12]*b[j*4+3];
            }
        }
        return new mat4(r);
    }

    translate(x: number, y: number, z: number) {
        return this.mul(mat4.matt(x, y, z));
    }

    rotateX(theta: number) {
        return this.mul(mat4.matrx(theta));
    }
    
    rotateY(theta: number) {
        return this.mul(mat4.matry(theta));
    }

    rotateZ(theta: number) {
        return this.mul(mat4.matrz(theta));
    }

    invert() {
        const out = new mat4();
        let a00 = this[0],
          a01 = this[1],
          a02 = this[2],
          a03 = this[3];
        let a10 = this[4],
          a11 = this[5],
          a12 = this[6],
          a13 = this[7];
        let a20 = this[8],
          a21 = this[9],
          a22 = this[10],
          a23 = this[11];
        let a30 = this[12],
          a31 = this[13],
          a32 = this[14],
          a33 = this[15];
      
        let b00 = a00 * a11 - a01 * a10;
        let b01 = a00 * a12 - a02 * a10;
        let b02 = a00 * a13 - a03 * a10;
        let b03 = a01 * a12 - a02 * a11;
        let b04 = a01 * a13 - a03 * a11;
        let b05 = a02 * a13 - a03 * a12;
        let b06 = a20 * a31 - a21 * a30;
        let b07 = a20 * a32 - a22 * a30;
        let b08 = a20 * a33 - a23 * a30;
        let b09 = a21 * a32 - a22 * a31;
        let b10 = a21 * a33 - a23 * a31;
        let b11 = a22 * a33 - a23 * a32;
      
        // Calculate the determinant
        let det =
          b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      
        if (!det) {
          return null;
        }
        det = 1.0 / det;
      
        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
      
        return out;
      }
}

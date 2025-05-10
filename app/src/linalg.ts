export class vec3 extends Float32Array {
    constructor(x: number, y: number, z: number) {
        super([x, y, z]);
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

    sub(other: vec3) {
        return new vec3(this[0] - other[0], this[1] - other[1], this[2] - other[2]);
    }

    normalize() {
        let l = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
        if (l > 0) {
            l = 1 / Math.sqrt(l);
        }
        return new vec3(this[0] * l, this[1] * l, this[2] * l);
    }

    dot(other: vec3) {
        return this[0] * other[0] + this[1] * other[1] + this[2] * other[2];
    }

    cross(other: vec3) {
        return new vec3(
            this[1] * other[2] - this[2] * other[1],
            this[2] * other[0] - this[0] * other[2],
            this[0] * other[1] - this[1] * other[0],
        );
    }
}

export class mat3 extends Float32Array {
    private static n = 3;
    constructor(from?: ArrayLike<number>) {
        super(mat3.n**2);
        if (!from) {
            this[0] = 1, this[1] = 0, this[2] = 0;
            this[3] = 0, this[4] = 1, this[5] = 0;
            this[6] = 0, this[7] = 0, this[8] = 1;
        } else {
            this[0] = from[0], this[1] = from[1], this[2] = from[2];
            this[3] = from[3], this[4] = from[4], this[5] = from[5];
            this[6] = from[6], this[7] = from[7], this[8] = from[8];
        }
    }

    mul(other: mat3) {
        const res = new Float32Array(mat3.n**2);
        res[0] = this[0]*other[0] + this[3]*other[1] + this[6]*other[2];
        res[1] = this[1]*other[0] + this[4]*other[1] + this[7]*other[2];
        res[2] = this[2]*other[0] + this[5]*other[1] + this[8]*other[2];

        res[3] = this[0]*other[3] + this[3]*other[4] + this[6]*other[5];
        res[4] = this[1]*other[3] + this[4]*other[4] + this[7]*other[5];
        res[5] = this[2]*other[3] + this[5]*other[4] + this[8]*other[5];

        res[6] = this[0]*other[6] + this[3]*other[7] + this[6]*other[8];
        res[7] = this[1]*other[6] + this[4]*other[7] + this[7]*other[8];
        res[8] = this[2]*other[6] + this[5]*other[7] + this[8]*other[8];
        return new mat3(res);
    }

    adjugate() {
        const res = new Float32Array(mat3.n**2);
        res[0] = this[4]*this[8] - this[5]*this[7];
        res[1] = -(this[1]*this[8] - this[2]*this[7]);
        res[2] = this[1]*this[5] - this[2]*this[4];
        res[3] = -(this[3]*this[8] - this[5]*this[6]);
        res[4] = this[0]*this[8] - this[2]*this[6];
        res[5] = -(this[0]*this[5] - this[2]*this[3]);
        res[6] = this[3]*this[7] - this[4]*this[6];
        res[7] = -(this[0]*this[7] - this[1]*this[6]);
        res[8] = this[0]*this[4] - this[1]*this[3];
        return new mat3(res);
    }

    inverse() {
        const det = 
            this[0] * (this[4]*this[8] - this[5]*this[7]) -
            this[3] * (this[1]*this[8] - this[2]*this[7]) +
            this[6] * (this[1]*this[5] - this[2]*this[4]);
        const res = this.adjugate();
        res[0] /= det, res[1] /= det, res[2] /= det;
        res[3] /= det, res[4] /= det, res[5] /= det;
        res[6] /= det, res[7] /= det, res[8] /= det;
        return res;
    }

    transpose() {
        const res = new Float32Array(mat3.n**2)
        res[0] = this[0], res[1] = this[3], res[2] = this[6];
        res[3] = this[1], res[4] = this[4], res[5] = this[7];
        res[6] = this[2], res[7] = this[5], res[8] = this[8];
        return new mat3(res);
    }
}

export class mat4 extends Float32Array {
    private static n = 4;

    constructor(from?: ArrayLike<number>) {
        super(mat4.n**2);
        if (!from) {
            this[0] = 1, this[1] = 0, this[2] = 0, this[3] = 0;
            this[4] = 0, this[5] = 1, this[6] = 0, this[7] = 0;
            this[8] = 0, this[9] = 0, this[10] = 1, this[11] = 0;
            this[12] = 0, this[13] = 0, this[14] = 1, this[15] = 1;
        } else {
            this[0] = from[0], this[1] = from[1], this[2] = from[2], this[3] = from[3];
            this[4] = from[4], this[5] = from[5], this[6] = from[6], this[7] = from[7];
            this[8] = from[8], this[9] = from[9], this[10] = from[10], this[11] = from[11];
            this[12] = from[12], this[13] = from[13], this[14] = from[14], this[15] = from[15];
        }
    }

    
    set x(x: number) {
        this[12] = x;
    }
    get x() {
        return this[12];
    }
    set y(y: number) {
        this[13] = y;
    }
    get y() {
        return this[13];
    }
    set z(z: number) {
        this[14] = z;
    }
    get z() {
        return this[14];
    }
    set w(w: number) {
        this[15] = w;
    }
    get w() {
        return this[15];
    }

    mat3() {
        return new mat3([
            this[0], this[1], this[2],
            this[4], this[5], this[6],
            this[8], this[9], this[10],
        ]);
    }

    private static matt(x: number, y: number, z: number) {
        const res = new mat4();
        res[12] = x, res[13] = y, res[14] = z;
        return res;
    }

    private static matrx(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const res = new mat4();
        res[5] = c, res[6] = -s;
        res[9] = s, res[10] = c;
        return res;
    }
    private static matry(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const res = new mat4();
        res[0] = c, res[2] = s;
        res[8] = -s, res[10] = c;
        return res;
    }
    private static matrz(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const res = new mat4();
        res[0] = c, res[1] = -s;
        res[4] = s, res[5] = c;
        return res;
    }

    static perspective(fov: number, aspect: number, near: number, far: number) {
        const f = Math.tan(Math.PI*0.5 - 0.5*fov);
        const range = 1/(near - far);
        const res = new mat4();
        res[0] = f/aspect;
        res[5] = f;
        res[10] = (near + far)*range, res[11] = -1;
        res[14] = 2*near*far*range, res[15] = 0;
        return res;
    }

    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        const lr = 1/(left - right);
        const bt = 1/(bottom - top);
        const nf = 1/(near - far);
        const res = new mat4();
        res[0] = -2*lr;
        res[5] = -2*bt;
        res[10] = 2*nf;
        res[12] = (left + right)*lr, res[13] = (top+bottom)*bt, res[14] = (near + far)*nf;
        return res;
    }

    static lookAt(eye: vec3, target: vec3, up: vec3) {
        if (
            Math.abs(eye[0] - target[0]) < Number.EPSILON &&
            Math.abs(eye[1] - target[1]) < Number.EPSILON &&
            Math.abs(eye[2] - target[2]) < Number.EPSILON
        ) {
            return new mat4();
        }

        const z = eye.sub(target).normalize();
        const x = z.cross(up).normalize();
        const y = x.cross(z).normalize();
        const res = new mat4();
        res[0] = x[0], res[1] = y[0], res[2] = z[0];
        res[4] = x[1], res[5] = y[1], res[6] = z[1];
        res[8] = x[2], res[9] = y[2], res[10] = z[2];
        res[12] = -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]);
        res[13] = -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]);
        res[14] = -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]);
        return res;
    }

    override set(other: mat4): void {
        this[0] = other[0], this[1] = other[1], this[2] = other[2], this[3] = other[3];
        this[4] = other[4], this[5] = other[5], this[6] = other[6], this[7] = other[7];
        this[8] = other[8], this[9] = other[9], this[10] = other[10], this[11] = other[11];
        this[12] = other[12], this[13] = other[13], this[14] = other[14], this[15] = other[15];
    }

    mul(other: mat4) {
        const res = new mat4();
        res[0] = this[0]*other[0] + this[4]*other[1] + this[8]*other[2] + this[12]*other[3];
        res[1] = this[1]*other[0] + this[5]*other[1] + this[9]*other[2] + this[13]*other[3];
        res[2] = this[2]*other[0] + this[6]*other[1] + this[10]*other[2] + this[14]*other[3];
        res[3] = this[3]*other[0] + this[7]*other[1] + this[11]*other[2] + this[15]*other[3];

        res[4] = this[0]*other[4] + this[4]*other[5] + this[8]*other[6] + this[12]*other[7];
        res[5] = this[1]*other[4] + this[5]*other[5] + this[9]*other[6] + this[13]*other[7];
        res[6] = this[2]*other[4] + this[6]*other[5] + this[10]*other[6] + this[14]*other[7];
        res[7] = this[3]*other[4] + this[7]*other[5] + this[11]*other[6] + this[15]*other[7];

        res[8] = this[0]*other[8] + this[4]*other[9] + this[8]*other[10] + this[12]*other[11];
        res[9] = this[1]*other[8] + this[5]*other[9] + this[9]*other[10] + this[13]*other[11];
        res[10] = this[2]*other[8] + this[6]*other[9] + this[10]*other[10] + this[14]*other[11];
        res[11] = this[3]*other[8] + this[7]*other[9] + this[11]*other[10] + this[15]*other[11];

        res[12] = this[0]*other[12] + this[4]*other[13] + this[8]*other[14] + this[12]*other[15];
        res[13] = this[1]*other[12] + this[5]*other[13] + this[9]*other[14] + this[13]*other[15];
        res[14] = this[2]*other[12] + this[6]*other[13] + this[10]*other[14] + this[14]*other[15];
        res[15] = this[3]*other[12] + this[7]*other[13] + this[11]*other[14] + this[15]*other[15];
        return res;
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

    rotate(thetaX: number, thataY: number, thetaZ: number) {
        /**
         * https://en.wikipedia.org/wiki/Rotation_matrix
         *
         * The rotation matrix is the product of the above mat4.matrx, mat4.matry, and mat4.matrz,
         * and is given by:
         *
         * a = thetaX, b = thetaY, c = thetaZ
         * R = [
         *  cos(b)cos(c), sin(a)sin(b)cos(c) - cos(a)sin(c), cos(a)sin(b)cos(c) + sin(a)sin(c),
         *  cos(b)sin(c), sin(a)sin(b)sin(c) + cos(a)cos(c), cos(a)sin(b)sin(c) - sin(a)cos(c),
         *  -sin(b), sin(a)cos(b), cos(a)cos(b)
         * ]
         */
        const cx = Math.cos(thetaX), cy = Math.cos(thataY), cz = Math.cos(thetaZ);
        const sx = Math.sin(thetaX), sy = Math.sin(thataY), sz = Math.sin(thetaZ);
        return this.mul(
            new mat4([
                cy * cz,
                sx * sy * cz - cx * sz,
                cx * sy * cz + sx * sz,
                0,
                cy * sz,
                sx * sy * sz + cx * cz,
                cx * sy * sz - sx * cz,
                0,
                -sy,
                sx * cy,
                cx * cy,
                0,
                0, 0, 0, 1,
            ]),
        );
    }

    rotateAxis(axis: vec3, theta: number) {
        const x = axis[0], y = axis[1], z = axis[2];
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const t = 1 - c;
        return this.mul(
            new mat4([
                t * x * x + c,
                t * x * y - s * z,
                t * x * z + s * y,
                0,
                t * x * y + s * z,
                t * y * y + c,
                t * y * z - s * x,
                0,
                t * x * z - s * y,
                t * y * z + s * x,
                t * z * z + c,
                0,
                0,
                0,
                0,
                1,
            ]),
        );
    }

    scale(x: number, y: number, z: number) {
        return this.mul(
            new mat4([
                x, 0, 0, 0,
                0, y, 0, 0,
                0, 0, z, 0,
                0, 0, 0, 1,
            ]),
        );
    }
}

export class vec3 extends Float32Array {
    constructor(x, y, z) {
        super([x, y, z]);
    }
    set x(x) {
        this[0] = x;
    }
    get x() {
        return this[0];
    }
    set y(y) {
        this[1] = y;
    }
    get y() {
        return this[1];
    }
    set z(z) {
        this[2] = z;
    }
    get z() {
        return this[2];
    }
    sub(other) {
        return new vec3(this[0] - other[0], this[1] - other[1], this[2] - other[2]);
    }
    normalize() {
        let l = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
        if (l > 0) {
            l = 1 / Math.sqrt(l);
        }
        return new vec3(this[0] * l, this[1] * l, this[2] * l);
    }
    cross(other) {
        return new vec3(this[1] * other[2] - this[2] * other[1], this[2] * other[0] - this[0] * other[2], this[0] * other[1] - this[1] * other[0]);
    }
}
export class mat4 extends Float32Array {
    constructor(from) {
        if (!from) {
            from = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        }
        super(from);
        this.k = 4;
    }
    static matt(x, y, z) {
        return new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ]);
    }
    static matrx(theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            1, 0, 0, 0,
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1,
        ]);
    }
    static matry(theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }
    static matrz(theta) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }
    static perspective(fov, aspect, near, far) {
        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const range = 1 / (near - far);
        return new mat4([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * range, -1,
            0, 0, 2 * near * far * range, 0,
        ]);
    }
    static lookAt(eye, target, up) {
        if (Math.abs(eye[0] - target[0]) < 0.000001 &&
            Math.abs(eye[1] - target[1]) < 0.000001 &&
            Math.abs(eye[2] - target[2]) < 0.000001) {
            return new mat4();
        }
        const z = eye.sub(target).normalize();
        const x = up.cross(z).normalize();
        const y = z.cross(x).normalize();
        return new mat4([
            ...x, 0,
            ...y, 0,
            ...z, 0,
            -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
            -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
            -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
            1,
        ]);
    }
    mul(other) {
        const a = this;
        const b = other;
        const r = new Float32Array(this.k * this.k);
        for (let i = 0; i < this.k; i++) {
            for (let j = 0; j < this.k; j++) {
                r[j * 4 + i] = a[i] * b[j * 4] + a[i + 4] * b[j * 4 + 1] + a[i + 8] * b[j * 4 + 2] + a[i + 12] * b[j * 4 + 3];
            }
        }
        return new mat4(r);
    }
    translate(x, y, z) {
        return this.mul(mat4.matt(x, y, z));
    }
    rotateX(theta) {
        return this.mul(mat4.matrx(theta));
    }
    rotateY(theta) {
        return this.mul(mat4.matry(theta));
    }
    rotateZ(theta) {
        return this.mul(mat4.matrz(theta));
    }
    rotate(thetaX, thataY, thetaZ) {
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
        return this.mul(new mat4([
            cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz, 0,
            cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz, 0,
            -sy, sx * cy, cx * cy, 0,
            0, 0, 0, 1
        ]));
    }
    invert() {
        let det = 1.0;
        for (let p = 0; p < this.k; p++) {
            const pivot = this[p * this.k + p];
            if (Math.abs(pivot) < 0.000001) {
                // return this;
            }
            det *= pivot;
            for (let i = 0; i < this.k; i++) {
                this[i * this.k + p] /= -pivot;
            }
            for (let i = 0; i < this.k; i++) {
                if (i == p) {
                    continue;
                }
                for (let j = 0; j < this.k; j++) {
                    if (j == p) {
                        continue;
                    }
                    this[i * this.k + j] += this[i * this.k + p] * this[p * this.k + j];
                }
            }
            for (let j = 0; j < this.k; j++) {
                this[p * this.k + j] /= pivot;
            }
            this[p * this.k + p] = 1 / pivot;
        }
        console.log(det);
        return this;
    }
}
function test() {
    const m = new mat4([
        4, 7, 2, 3,
        0, 5, 9, 1,
        3, 6, 8, 2,
        1, 2, 3, 4,
    ]);
    console.log(m.invert());
    const n = new mat4([
        4, 7, 2, 3,
        0, 5, 9, 1,
        3, 6, 8, 2,
        1, 2, 3, 4,
    ]);
    console.log(n.mul(m));
}
// test();

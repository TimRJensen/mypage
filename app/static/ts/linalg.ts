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

    sub (other: vec3) {
        return new vec3(this[0] - other[0], this[1] - other[1], this[2] - other[2]);
    }

    normalize() {
        let l = this[0]*this[0] + this[1]*this[1] + this[2]*this[2];
        if (l > 0) {
            l = 1/Math.sqrt(l);
        }
        return new vec3(this[0]*l, this[1]*l, this[2]*l);
    }

    dot (other: vec3) {
        return this[0]*other[0] + this[1]*other[1] + this[2]*other[2];
    }

    cross(other: vec3) {
        return new vec3(
            this[1]*other[2] - this[2]*other[1], 
            this[2]*other[0] - this[0]*other[2], 
            this[0]*other[1] - this[1]*other[0],
        );
    }
}

export class mat4 extends Float32Array {
    private k = 4;

    constructor(from?: ArrayLike<number>) {
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
            0, c, -s, 0,
            0, s, c, 0,
            0, 0, 0, 1,
        ]);
    }
    private static matry(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, 0, s, 0,
            0, 1, 0, 0,
            -s, 0, c, 0,
            0, 0, 0, 1,
        ]);
    }
    private static matrz(theta: number) {
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        return new mat4([
            c, -s, 0, 0,
            s, c, 0, 0,
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

    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
        const lr = 1/(left - right);
        const bt = 1/(bottom - top);
        const nf = 1/(near - far);
        return new mat4([
            -2*lr, 0, 0, 0,
            0, -2*bt, 0, 0,
            0, 0, 2*nf, 0,
            (left + right)*lr, (top + bottom)*bt, (near + far)*nf, 1
        ]);
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

        return new mat4([
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
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
                for (let k = 0; k < 4; k++) {
                    r[i + j*4] += a[i + k*4]*b[k + j*4]; 
                }
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
        return this.mul(new mat4([
            cy*cz, sx*sy*cz - cx*sz, cx*sy*cz + sx*sz, 0,
            cy*sz, sx*sy*sz + cx*cz, cx*sy*sz - sx*cz, 0,
            -sy, sx*cy, cx*cy, 0,
            0, 0, 0, 1
        ]));
    }

    rotateAxis(axis: vec3, theta: number) {
        const x = axis[0], y = axis[1], z = axis[2];
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const t = 1 - c;
        return this.mul(new mat4([
            t*x*x + c, t*x*y - s*z, t*x*z + s*y, 0,
            t*x*y + s*z, t*y*y + c, t*y*z - s*x, 0,
            t*x*z - s*y, t*y*z + s*x, t*z*z + c, 0,
            0, 0, 0, 1
        ]));
    }

    scale(x: number, y: number, z: number) {
        return this.mul(new mat4([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ]));
    }

    invert() {
        let det = 1.0;
        for (let p = 0; p < this.k; p++) {
            const pivot = this[p*this.k + p];
            if (Math.abs(pivot) < 0.000001) {
                // return this;
            }

            det *= pivot;
            for (let i = 0; i < this.k; i++) {
                this[i*this.k + p] /= -pivot;
            }
            for (let i = 0; i < this.k; i++) {
                if (i == p) {
                    continue;
                }

                for (let j = 0; j < this.k; j++) {
                    if (j == p) {
                        continue;
                    }
                    this[i*this.k + j] += this[i*this.k + p]*this[p*this.k + j];
                }
            }
            for (let j = 0; j < this.k; j++) {
                this[p*this.k + j] /= pivot;
            }

            this[p*this.k + p] = 1/pivot;
        }
        console.log(det);
        return this;
    }
}

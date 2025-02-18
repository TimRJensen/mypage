export declare class vec3 extends Float32Array {
    constructor(x: number, y: number, z: number);
    set x(x: number);
    get x(): number;
    set y(y: number);
    get y(): number;
    set z(z: number);
    get z(): number;
    sub(other: vec3): vec3;
    normalize(): vec3;
    dot(other: vec3): number;
    cross(other: vec3): vec3;
}
export declare class mat4 extends Float32Array {
    private k;
    constructor(from?: ArrayLike<number>);
    private static matt;
    private static matrx;
    private static matry;
    private static matrz;
    static perspective(fov: number, aspect: number, near: number, far: number): mat4;
    static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): mat4;
    static lookAt(eye: vec3, target: vec3, up: vec3): mat4;
    mul(other: mat4): mat4;
    translate(x: number, y: number, z: number): mat4;
    rotateX(theta: number): mat4;
    rotateY(theta: number): mat4;
    rotateZ(theta: number): mat4;
    rotate(thetaX: number, thataY: number, thetaZ: number): mat4;
    rotateAxis(axis: vec3, theta: number): mat4;
    scale(x: number, y: number, z: number): mat4;
    invert(): this;
}

import { mat4 } from "./linalg.js";
export function createGrid(xmax, ymax, step, color) {
    const vertices = [];
    color[0] /= 255;
    color[1] /= 255;
    color[2] /= 255;
    color[3] = 1.0;
    for (let x = -xmax; x <= xmax; x += step) {
        vertices.push(x, -ymax, 0, ...color);
        vertices.push(x, ymax, 0, ...color);
    }
    for (let y = -ymax; y <= ymax; y += step) {
        vertices.push(-xmax, y, 0, ...color);
        vertices.push(xmax, y, 0, ...color);
    }
    return new Float32Array(vertices);
}
function createNode(radius, latitudeBands, longitudeBands) {
    const vertices = [];
    for (let lat = 0; lat <= latitudeBands; ++lat) {
        const theta = (lat * Math.PI) / latitudeBands;
        const s = Math.sin(theta);
        const c = Math.cos(theta);
        for (let lon = 0; lon <= longitudeBands; ++lon) {
            const phi = (lon * 2 * Math.PI) / longitudeBands;
            const sp = Math.sin(phi);
            const cp = Math.cos(phi);
            const x = radius * cp * s;
            const y = radius * c;
            const z = radius * sp * s;
            vertices.push(x, y, z);
            vertices.push(1, 1, 1, 1);
        }
    }
    for (let lat = 0; lat < latitudeBands; ++lat) {
        for (let lon = 0; lon <= longitudeBands; ++lon) {
            const current = lat * (longitudeBands + 1) + lon;
            const next = (lat + 1) * (longitudeBands + 1) + lon;
            vertices.push(...vertices.slice(current * 7, current * 7 + 7), ...vertices.slice(next * 7, next * 7 + 7), ...vertices.slice((current + 1) * 7, (current + 1) * 7 + 7), ...vertices.slice((current + 1) * 7, (current + 1) * 7 + 7), ...vertices.slice(next * 7, next * 7 + 7), ...vertices.slice((next + 1) * 7, (next + 1) * 7 + 7));
        }
    }
    return new Float32Array(vertices);
}
function createLine(vertices, color) {
    const line = [];
    color[0] /= 255;
    color[1] /= 255;
    color[2] /= 255;
    color[3] = 1;
    for (let i = 0; i < vertices.length; i += 3) {
        line.push(vertices[i], vertices[i + 1], vertices[i + 2], ...color);
    }
    return new Float32Array(line);
}
function createShadowPlane(size) {
    const vertices = [];
    for (let theta = 0; theta <= 2 * Math.PI; theta += 2 * Math.PI / 20) {
        vertices.push(size * Math.sin(theta), size * Math.cos(theta), 0, 0, 0, 0, 0.75);
        vertices.push(0, 0, 0, 0, 0, 0, 0.75);
    }
    return new Float32Array(vertices);
}
function createStaticBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}
function createVAO(gl, program, data, attrs) {
    const buffer = createStaticBuffer(gl, data);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    let last = 0;
    for (const [name, [len, size]] of attrs.entries()) {
        const loc = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, len, gl.FLOAT, false, 7 * size, last * size);
        last += len;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return vao;
}
export class Shape {
    constructor(gl, method, vertices, stride) {
        this.gl = gl;
        this.method = method;
        this.vertices = vertices;
        this.stride = stride;
        this.world = new mat4();
        this.vp = new mat4();
        this.id = [0, 0, 0, 0];
    }
    setWorld(world) {
        this.world = world;
    }
    setViewProjection(vp) {
        this.vp = vp;
    }
    draw(vp, program, attrs, uniforms) {
        this.vp = vp;
        for (const [key, func] of uniforms.entries()) {
            func(program, this[key]);
        }
        this.gl.bindVertexArray(createVAO(this.gl, program, this.vertices, attrs));
        this.gl.drawArrays(this.method, 0, this.vertices.length / this.stride);
        this.gl.bindVertexArray(null);
    }
}
export class Node extends Shape {
    constructor(gl, start, end) {
        super(gl, gl.TRIANGLES, createNode(0.01, 20, 20), 7);
        this.gl = gl;
        this.id = [
            ((Node.n >> 0) & 0xFF) / 0xFF,
            ((Node.n >> 8) & 0xFF) / 0xFF,
            ((Node.n >> 16) & 0xFF) / 0xFF,
            ((Node.n >> 24) & 0xFF) / 0xFF,
        ];
        this.setWorld(new mat4().translate(start[0], start[1], start[2]));
        this.edge = new Shape(gl, gl.LINES, createLine(start.concat(end), [255, 255, 255]), 7);
        this.edge.id = this.id;
        this.shadow = new Shape(gl, gl.TRIANGLE_STRIP, createShadowPlane(0.01), 7);
        this.shadow.setWorld(new mat4().translate(start[0], start[1] - 0.005, 0.001));
        Node.n++;
    }
    draw(vp, program, attrs, uniforms) {
        super.draw(vp, program, attrs, uniforms);
        this.edge.draw(vp, program, attrs, uniforms);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.shadow.draw(vp, program, attrs, uniforms);
    }
}
Node.n = 1;

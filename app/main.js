// src/linalg.ts
var vec3 = class _vec3 extends Float32Array {
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
    return new _vec3(this[0] - other[0], this[1] - other[1], this[2] - other[2]);
  }
  normalize() {
    let l = this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    if (l > 0) {
      l = 1 / Math.sqrt(l);
    }
    return new _vec3(this[0] * l, this[1] * l, this[2] * l);
  }
  dot(other) {
    return this[0] * other[0] + this[1] * other[1] + this[2] * other[2];
  }
  cross(other) {
    return new _vec3(
      this[1] * other[2] - this[2] * other[1],
      this[2] * other[0] - this[0] * other[2],
      this[0] * other[1] - this[1] * other[0]
    );
  }
};
var mat4 = class _mat4 extends Float32Array {
  k = 4;
  constructor(from) {
    if (!from) {
      from = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }
    super(from);
  }
  static matt(x, y, z) {
    return new _mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      x,
      y,
      z,
      1
    ]);
  }
  static matrx(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new _mat4([
      1,
      0,
      0,
      0,
      0,
      c,
      -s,
      0,
      0,
      s,
      c,
      0,
      0,
      0,
      0,
      1
    ]);
  }
  static matry(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new _mat4([
      c,
      0,
      s,
      0,
      0,
      1,
      0,
      0,
      -s,
      0,
      c,
      0,
      0,
      0,
      0,
      1
    ]);
  }
  static matrz(theta) {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new _mat4([
      c,
      -s,
      0,
      0,
      s,
      c,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ]);
  }
  static perspective(fov, aspect, near, far) {
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const range = 1 / (near - far);
    return new _mat4([
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (near + far) * range,
      -1,
      0,
      0,
      2 * near * far * range,
      0
    ]);
  }
  static ortho(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);
    return new _mat4([
      -2 * lr,
      0,
      0,
      0,
      0,
      -2 * bt,
      0,
      0,
      0,
      0,
      2 * nf,
      0,
      (left + right) * lr,
      (top + bottom) * bt,
      (near + far) * nf,
      1
    ]);
  }
  static lookAt(eye, target, up) {
    if (Math.abs(eye[0] - target[0]) < Number.EPSILON && Math.abs(eye[1] - target[1]) < Number.EPSILON && Math.abs(eye[2] - target[2]) < Number.EPSILON) {
      return new _mat4();
    }
    const z = eye.sub(target).normalize();
    const x = z.cross(up).normalize();
    const y = x.cross(z).normalize();
    return new _mat4([
      x[0],
      y[0],
      z[0],
      0,
      x[1],
      y[1],
      z[1],
      0,
      x[2],
      y[2],
      z[2],
      0,
      -(x[0] * eye[0] + x[1] * eye[1] + x[2] * eye[2]),
      -(y[0] * eye[0] + y[1] * eye[1] + y[2] * eye[2]),
      -(z[0] * eye[0] + z[1] * eye[1] + z[2] * eye[2]),
      1
    ]);
  }
  mul(other) {
    const b = other;
    const r = new Float32Array(this.k * this.k);
    for (let i = 0; i < this.k; i++) {
      for (let j = 0; j < this.k; j++) {
        for (let k = 0; k < 4; k++) {
          r[i + j * 4] += this[i + k * 4] * b[k + j * 4];
        }
      }
    }
    return new _mat4(r);
  }
  translate(x, y, z) {
    return this.mul(_mat4.matt(x, y, z));
  }
  rotateX(theta) {
    return this.mul(_mat4.matrx(theta));
  }
  rotateY(theta) {
    return this.mul(_mat4.matry(theta));
  }
  rotateZ(theta) {
    return this.mul(_mat4.matrz(theta));
  }
  rotate(thetaX, thataY, thetaZ) {
    const cx = Math.cos(thetaX), cy = Math.cos(thataY), cz = Math.cos(thetaZ);
    const sx = Math.sin(thetaX), sy = Math.sin(thataY), sz = Math.sin(thetaZ);
    return this.mul(new _mat4([
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
      0,
      0,
      0,
      1
    ]));
  }
  rotateAxis(axis, theta) {
    const x = axis[0], y = axis[1], z = axis[2];
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    const t = 1 - c;
    return this.mul(new _mat4([
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
      1
    ]));
  }
  scale(x, y, z) {
    return this.mul(new _mat4([
      x,
      0,
      0,
      0,
      0,
      y,
      0,
      0,
      0,
      0,
      z,
      0,
      0,
      0,
      0,
      1
    ]));
  }
  inverse() {
    const detA = this[5] * (this[10] * this[15] - this[11] * this[14]) - this[6] * (this[9] * this[15] - this[11] * this[13]) + this[7] * (this[9] * this[14] - this[10] * this[13]);
    const detB = -this[4] * (this[10] * this[15] - this[11] * this[14]) + this[6] * (this[8] * this[15] - this[11] * this[12]) - this[7] * (this[8] * this[14] - this[10] * this[12]);
    const detC = this[4] * (this[9] * this[15] - this[11] * this[13]) - this[5] * (this[8] * this[15] - this[11] * this[12]) + this[7] * (this[8] * this[13] - this[9] * this[12]);
    const detD = -this[4] * (this[9] * this[14] - this[10] * this[13]) + this[5] * (this[8] * this[14] - this[10] * this[12]) - this[6] * (this[8] * this[13] - this[9] * this[12]);
    const det = this[0] * detA + this[1] * detB + this[2] * detC + this[3] * detD;
    if (Math.abs(det) < Number.EPSILON) {
      return new _mat4();
    }
    const inv_det = 1 / det;
    return new _mat4([
      detA * inv_det,
      (-this[1] * (this[10] * this[15] - this[11] * this[14]) + this[2] * (this[9] * this[15] - this[11] * this[13]) - this[3] * (this[9] * this[14] - this[10] * this[13])) * inv_det,
      (this[1] * (this[6] * this[15] - this[7] * this[14]) - this[2] * (this[5] * this[15] - this[7] * this[13]) + this[3] * (this[5] * this[14] - this[6] * this[13])) * inv_det,
      (-this[1] * (this[6] * this[11] - this[7] * this[10]) + this[2] * (this[5] * this[11] - this[7] * this[9]) - this[3] * (this[5] * this[10] - this[6] * this[9])) * inv_det,
      detB * inv_det,
      (this[0] * (this[10] * this[15] - this[11] * this[14]) - this[2] * (this[8] * this[15] - this[11] * this[12]) + this[3] * (this[8] * this[14] - this[10] * this[12])) * inv_det,
      (-this[0] * (this[6] * this[15] - this[7] * this[14]) + this[2] * (this[4] * this[15] - this[7] * this[12]) - this[3] * (this[4] * this[14] - this[6] * this[12])) * inv_det,
      (this[0] * (this[6] * this[11] - this[7] * this[10]) - this[2] * (this[4] * this[11] - this[7] * this[8]) + this[3] * (this[4] * this[10] - this[6] * this[8])) * inv_det,
      detC * inv_det,
      (-this[0] * (this[9] * this[15] - this[11] * this[13]) + this[1] * (this[8] * this[15] - this[11] * this[12]) - this[3] * (this[8] * this[13] - this[9] * this[12])) * inv_det,
      (this[0] * (this[5] * this[15] - this[7] * this[13]) - this[1] * (this[4] * this[15] - this[7] * this[12]) + this[3] * (this[4] * this[13] - this[5] * this[12])) * inv_det,
      (-this[0] * (this[5] * this[11] - this[7] * this[9]) + this[1] * (this[4] * this[11] - this[7] * this[8]) - this[3] * (this[4] * this[9] - this[5] * this[8])) * inv_det,
      detD * inv_det,
      (this[0] * (this[9] * this[14] - this[10] * this[13]) - this[1] * (this[8] * this[14] - this[10] * this[12]) + this[2] * (this[8] * this[13] - this[9] * this[12])) * inv_det,
      (-this[0] * (this[5] * this[14] - this[6] * this[13]) + this[1] * (this[4] * this[14] - this[6] * this[12]) - this[2] * (this[4] * this[13] - this[5] * this[12])) * inv_det,
      (this[0] * (this[5] * this[10] - this[6] * this[9]) - this[1] * (this[4] * this[10] - this[6] * this[8]) + this[2] * (this[4] * this[9] - this[5] * this[8])) * inv_det
    ]);
  }
  transpose() {
    return new _mat4([
      this[0],
      this[4],
      this[8],
      this[12],
      this[1],
      this[5],
      this[9],
      this[13],
      this[2],
      this[6],
      this[10],
      this[14],
      this[3],
      this[7],
      this[11],
      this[15]
    ]);
  }
};

// src/webgl/common.ts
function setUniform(gl, info, data) {
  if (!info) {
    return;
  }
  const { loc, type } = info;
  switch (type) {
    case gl.SAMPLER_2D_ARRAY:
    case gl.SAMPLER_2D:
    case gl.INT:
      if (typeof data === "number") {
        gl.uniform1i(loc, data);
      } else {
        gl.uniform1iv(loc, data);
      }
      break;
    case gl.FLOAT:
      if (typeof data === "number") {
        gl.uniform1f(loc, data);
      } else {
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

// src/webgl/shaders/vertex-quad.ts
var vertex_quad_default = `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = a_position;
}`;

// src/webgl/shaders/fragment-quad.ts
var fragment_quad_default = `#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D tex;

void main() {
    f_color = texture(tex, v_texcoord);
}`;

// src/webgl/core.ts
function createShader(gl, src, type) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}
function initializeProgram(gl, program, vs, fs) {
  gl.attachShader(program, createShader(gl, vs, gl.VERTEX_SHADER));
  gl.attachShader(program, createShader(gl, fs, gl.FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteProgram(program);
    return false;
  }
  return true;
}
function createProgram(gl, vs, fs) {
  const program = gl.createProgram();
  if (!program) {
    return [false, null];
  }
  return [initializeProgram(gl, program, vs, fs), program];
}
function initializeAtrtibutes(gl, program, attrs) {
  const map = /* @__PURE__ */ new Map();
  const n = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (!info) {
      continue;
    }
    const name = info.name.split("[")[0];
    if (attrs[name]) {
      const loc = gl.getAttribLocation(program, name);
      map.set(name, { loc, type: info.type, ...attrs[name] });
    }
  }
  return map;
}
function initializeUniforms(gl, program) {
  const map = /* @__PURE__ */ new Map();
  const n = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) {
      continue;
    }
    map.set(info.name.split("[")[0], { loc: gl.getUniformLocation(program, info.name), type: info.type });
  }
  return map;
}
function createStaticBuffer(gl, data, target, method) {
  const buffer = gl.createBuffer();
  if (!buffer) {
    console.log("Failed to create buffer");
    return [false, null];
  }
  gl.bindBuffer(target ?? gl.ARRAY_BUFFER, buffer);
  gl.bufferData(target ?? gl.ARRAY_BUFFER, data, method ?? gl.STATIC_DRAW);
  return [true, buffer];
}
function createVAO(gl, program, attrs, vbuff, ibuff = null) {
  const vao = gl.createVertexArray();
  if (!vao) {
    return [false, null];
  }
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuff);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuff);
  let offset = 0;
  for (const [name, { type, len, stride, size }] of attrs.entries()) {
    const loc = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(loc);
    if (type === gl.FLOAT) {
      gl.vertexAttribPointer(loc, len, type, false, stride, offset);
    } else {
      gl.vertexAttribIPointer(loc, len, type, stride, offset);
    }
    offset += len * size;
  }
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return [true, vao];
}
function createTextureArrayBuffer(gl, data, width, height, info) {
  const tex = gl.createTexture(), pbo = gl.createBuffer();
  if (!tex || !pbo) {
    return null;
  }
  const size = Math.trunc(width / info.width);
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY, size, gl.RGBA8, info.width, info.height, info.depth);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
  gl.bufferData(gl.PIXEL_UNPACK_BUFFER, data, gl.STATIC_DRAW);
  gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
  gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  for (let i = 0; i < info.depth; i++) {
    const row = Math.floor(i / size) * info.height;
    const col = i % size * info.width;
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, col);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, info.width, info.height, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
  }
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  return tex;
}
function loadTexture(gl, texInfo) {
  if (!texInfo) {
    return Promise.resolve([]);
  }
  const promises = [];
  for (const [key, info] of Object.entries(texInfo)) {
    const img = new Image();
    const promise = new Promise((resolve) => {
      img.onload = () => {
        const { width, height } = img;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        resolve(createTextureArrayBuffer(gl, ctx.getImageData(0, 0, width, height).data.buffer, width, height, info));
      };
      img.src = key;
    });
    promises.push(promise);
  }
  return Promise.all(promises);
}
var FrameBufferObject = class {
  constructor(buff, width, height) {
    this.buff = buff;
    this.width = width;
    this.height = height;
  }
  attachments = [];
  depth = null;
};
function attachTextureBuffer(gl, fbo, width, height, type, n = 0) {
  const tex = gl.createTexture();
  if (!tex) {
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
  gl.activeTexture(gl.TEXTURE0 + n);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, type, width, height);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + n, gl.TEXTURE_2D, tex, 0);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (n < fbo.attachments.length) {
    fbo.attachments[n] = tex;
  } else {
    fbo.attachments.push(tex);
  }
  return tex;
}
function attachDepthBuffer(gl, fbo, width, height) {
  const depth = gl.createRenderbuffer();
  if (!depth) {
    return null;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  fbo.depth = depth;
  return depth;
}
function createFrameBufferObject(gl, width, height, type = gl.RGBA8, n = 0, render = true) {
  const fb = gl.createFramebuffer();
  if (!fb) {
    return [false, null];
  }
  if (render) {
    const fbo2 = new FrameBufferObject(fb, width, height);
    attachTextureBuffer(gl, fbo2, width, height, type, n);
    attachDepthBuffer(gl, fbo2, width, height);
    return [true, fbo2];
  }
  const fbo = new FrameBufferObject(fb, width, height);
  attachTextureBuffer(gl, fbo, width, height, type, n);
  return [true, fbo];
}
var PluginEvent = class extends CustomEvent {
  shape;
  constructor(type, { shape }) {
    super(type);
    this.shape = shape;
  }
};
var vertices = new Float32Array([
  // xy   uv     
  -1,
  1,
  0,
  1,
  -1,
  -1,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  -1,
  1,
  0
]);
var Program = class _Program {
  constructor(canvas, shapes, vs, fs, options = {}) {
    this.canvas = canvas;
    this.shapes = shapes;
    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }
    this.ready = [
      loadTexture(gl, options.textures).then((atlases) => {
        this.atlases = atlases;
      })
    ];
    const [ok_quad, quad] = createProgram(gl, vertex_quad_default, fragment_quad_default);
    if (!ok_quad) {
      return;
    }
    const quad_attribs = initializeAtrtibutes(gl, quad, {
      a_position: { type: gl.FLOAT, len: 2, stride: 16, size: 4 },
      a_texcoord: { type: gl.FLOAT, len: 2, stride: 16, size: 4 }
    });
    const [ok_buff, buff] = createStaticBuffer(gl, vertices.buffer);
    if (!ok_buff) {
      return;
    }
    const [ok_vao, vao] = createVAO(gl, quad, quad_attribs, buff, null);
    if (!ok_vao) {
      return;
    }
    const [ok_main, main] = createProgram(gl, vs, fs);
    if (!ok_main) {
      return;
    }
    const main_attribs = initializeAtrtibutes(gl, main, options.attrs ?? {});
    const main_uniforms = initializeUniforms(gl, main);
    for (const shape of shapes) {
      shape.buffer.then(([vbuff, ibuff]) => {
        const [ok2, vao2] = createVAO(gl, main, main_attribs, vbuff, ibuff);
        if (!ok2) {
          return;
        }
        this.scene.push([vao2, shape]);
      });
      this.ready.push(shape.buffer);
    }
    const [ok, main_fbo] = createFrameBufferObject(gl, canvas.width * devicePixelRatio, canvas.height * devicePixelRatio);
    if (!ok) {
      return;
    }
    gl.canvas.width = canvas.width * devicePixelRatio;
    gl.canvas.height = canvas.height * devicePixelRatio;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    this.gl = gl;
    this.quad = quad;
    this.vao = vao;
    this.main = main;
    this.attribs = main_attribs;
    this.uniforms = main_uniforms;
    this.programOptions = options;
    this.programOptions.color ??= [0, 0, 0, 1];
    this.programOptions.color[0] /= 255;
    this.programOptions.color[1] /= 255;
    this.programOptions.color[2] /= 255;
    this.fbo = main_fbo;
  }
  // Internal state
  gl = null;
  quad = null;
  vao = null;
  main = null;
  attribs = null;
  uniforms = null;
  atlases = null;
  programOptions = null;
  rendering = false;
  scene = [];
  ready = null;
  // Event stuff
  handlers = /* @__PURE__ */ new Map();
  events = [];
  // Public state
  fbo = null;
  plugins = [];
  drawInfo = {};
  use() {
    this.gl.useProgram(this.main);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LESS);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.depthMask(true);
  }
  static lastTime = 0;
  draw(time) {
    if (time - _Program.lastTime < 1e3 / 60) {
      requestAnimationFrame(this.draw.bind(this));
      return;
    }
    _Program.lastTime = time;
    const { gl, uniforms, drawInfo, fbo } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.clearBufferfv(gl.COLOR, 0, this.programOptions.color);
    gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1, 1);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    for (const plugin of this.plugins) {
      plugin.before(this.gl, this.fbo);
    }
    this.use();
    for (const [key, val] of Object.entries(drawInfo)) {
      if (!uniforms.has(key) || val instanceof Function || val instanceof Array) {
        continue;
      }
      setUniform(gl, uniforms.get(key), val);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.drawBuffers(fbo.attachments.map((tex, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      return gl.COLOR_ATTACHMENT0 + i;
    }));
    for (const [vao, shape] of this.scene) {
      gl.bindVertexArray(vao);
      shape.draw(gl, uniforms, drawInfo);
      gl.bindVertexArray(null);
    }
    gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    for (const plugin of this.plugins) {
      plugin.after(gl, fbo);
    }
    gl.useProgram(this.quad);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.attachments[0]);
    gl.viewport(0, 0, fbo.width, fbo.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    for (const e of this.events) {
      if (!this.handlers.has(e.type)) {
        continue;
      }
      for (const handler2 of this.handlers.get(e.type)) {
        handler2(e);
      }
    }
    if (this.handlers.has("done")) {
      for (const handler2 of this.handlers.get("done")) {
        handler2(new PluginEvent("done", { shape: null }));
      }
    }
    this.events = [];
    requestAnimationFrame(this.draw.bind(this));
  }
  render(drawInfo = {}) {
    if (this.rendering) {
      return;
    }
    this.rendering = true;
    Reflect.set(this, "drawInfo", drawInfo);
    Promise.all(this.ready).then(() => {
      this.drawInfo.atlases = this.atlases;
      requestAnimationFrame(this.draw.bind(this));
    });
  }
  fire(e) {
    this.events.push(e);
  }
  on(type, handler2) {
    if (this.handlers.has(type)) {
      this.handlers.get(type).push(handler2);
    } else {
      this.handlers.set(type, [handler2]);
    }
  }
};

// src/webgl/plugins/pointer.ts
var PointerPluginEvent = class extends PluginEvent {
  id;
  composite;
  clientX;
  clientY;
  constructor(type, { id, shape, composite, clientX, clientY }) {
    super(type, { shape });
    this.id = id;
    this.composite = composite;
    this.clientX = clientX;
    this.clientY = clientY;
  }
};
function handler(gl, program, shapes) {
  return function(e) {
    const rect = gl.canvas.getBoundingClientRect();
    const ndcX = (e.clientX - rect.left) / rect.width * 2 - 1;
    const ndcY = (e.clientY - rect.top) / rect.height * 2 - 1;
    const data = new Int16Array(4);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, program.fbo.buff);
    gl.readBuffer(gl.COLOR_ATTACHMENT2);
    gl.readPixels(
      (ndcX + 1) * 0.5 * gl.canvas.width,
      (-ndcY + 1) * 0.5 * gl.canvas.height,
      1,
      1,
      gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT),
      gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE),
      data
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const id = data[0];
    if (id == 0) {
      program.fire(new PointerPluginEvent(e.type, { id, shape: null, composite: null, clientX: e.movementX, clientY: e.movementY }));
      return;
    }
    for (const shape of shapes) {
      if (shape.id == id) {
        program.fire(new PointerPluginEvent(e.type, { id, shape, composite: shape, clientX: e.movementX, clientY: e.movementY }));
        break;
      }
      for (const child of shape) {
        if (child.id != id) {
          continue;
        }
        program.fire(new PointerPluginEvent(e.type, { id, shape: child, composite: shape, clientX: e.movementX, clientY: e.movementY }));
        return;
      }
    }
  };
}
var PointerPlugin = class {
  constructor(gl, shapes, program) {
    this.gl = gl;
    this.shapes = shapes;
    const n = program.fbo.attachments.length;
    attachTextureBuffer(gl, program.fbo, program.fbo.width, program.fbo.height, gl.R16I, n);
    program.canvas.addEventListener("pointermove", handler(gl, program, shapes));
    program.canvas.addEventListener("pointerdown", handler(gl, program, shapes));
    program.canvas.addEventListener("pointerup", handler(gl, program, shapes));
    this.gl = gl;
    this.n = n;
  }
  n = 0;
  before(gl, fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.drawBuffers(fbo.attachments.map((_, i) => i == 0 || i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
    gl.clearBufferiv(gl.COLOR, this.n, new Int32Array([0, 0, 0, 0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  after() {
  }
};

// src/webgl/shaders/fragment-blur.ts
var fragment_blur_default = `#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D u_blur;
uniform int u_mode; // 0 == horizontal, 1 == vertical

const float weight[5] = float[] (0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);

void main() {
    vec2 texel = 1.0/vec2(textureSize(u_blur, 1));
    vec3 result = texture(u_blur, v_texcoord).rgb*weight[0];

    if (u_mode == 0) {
        for (int i = 1; i < 5; ++i) {
            result += texture(u_blur, v_texcoord + vec2(texel.x*float(i), 0.0)).rgb*weight[i];
            result += texture(u_blur, v_texcoord - vec2(texel.x*float(i), 0.0)).rgb*weight[i];
        }
    } else {
        for (int i = 1; i < 5; ++i) {
            result += texture(u_blur, v_texcoord + vec2(0.0, texel.y*float(i))).rgb*weight[i];
            result += texture(u_blur, v_texcoord - vec2(00., texel.y*float(i))).rgb*weight[i];
        }
    }

    f_color = vec4(result, 1.0);
}`;

// src/webgl/shaders/fragment-blend.ts
var fragment_blend_default = `#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D u_scene;
uniform sampler2D u_blur;

void main() {
    vec3 scene = texture(u_scene, v_texcoord).rgb;
    vec3 blur = texture(u_blur, v_texcoord).rgb;
    f_color =  vec4(scene + blur*1.75, 1.0);
}`;

// src/webgl/plugins/bloom.ts
var vertices2 = new Float32Array([
  // xy   uv     
  -1,
  1,
  0,
  1,
  -1,
  -1,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  -1,
  1,
  0
]);
var BloomPlugin = class {
  constructor(gl, shapes, program) {
    this.gl = gl;
    this.shapes = shapes;
    const n = program.fbo.attachments.length;
    attachTextureBuffer(gl, program.fbo, program.fbo.width, program.fbo.height, gl.RGBA8, n);
    const shaders = [fragment_blur_default, fragment_blend_default, fragment_quad_default];
    const attrib_object = {
      a_position: { type: gl.FLOAT, len: 2, stride: 16, size: 4 },
      a_texcoord: { type: gl.FLOAT, len: 2, stride: 16, size: 4 }
    };
    for (const shader of shaders) {
      const [ok, quad] = createProgram(gl, vertex_quad_default, shader);
      if (!ok) {
        console.error("Bloom Plugin: Failed to create program");
        return;
      }
      const attribs = initializeAtrtibutes(gl, quad, attrib_object);
      const uniforms = initializeUniforms(gl, quad);
      const [ok_buff, buff] = createStaticBuffer(gl, vertices2.buffer);
      if (!ok_buff) {
        return;
      }
      const [ok_vao, vao] = createVAO(gl, quad, attribs, buff);
      if (!ok_vao) {
        return;
      }
      this.uniforms.push(uniforms);
      this.quads.push(quad);
      this.vaos.push(vao);
    }
    for (let i = 0; i < 3; i++) {
      const [ok, fbo] = createFrameBufferObject(gl, program.fbo.width * 0.5, program.fbo.height * 0.5, gl.RGBA8, 0, false);
      if (!ok) {
        console.error("Bloom Plugin: Failed to create framebuffer object");
        return;
      }
      this.fbos.push(fbo);
    }
    this.gl = gl;
    this.n = n;
    program.shapes[0].focused;
  }
  quads = [];
  vaos = [];
  uniforms = [];
  fbos = [];
  n = 0;
  before(gl, fbo) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.drawBuffers(fbo.attachments.map((_, i) => i == 0 || i == this.n ? gl.COLOR_ATTACHMENT0 + i : gl.NONE));
    gl.clearBufferfv(gl.COLOR, this.n, new Float32Array([0, 0, 0, 0]));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    for (const bloom_fbo of this.fbos) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloom_fbo.buff);
      gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
  after(gl, fbo) {
    const blur = 0;
    gl.useProgram(this.quads[blur]);
    gl.viewport(0, 0, this.fbos[blur].width, this.fbos[blur].height);
    gl.bindVertexArray(this.vaos[blur]);
    for (let i = 0; i < 10; i++) {
      const mode = i % 2;
      setUniform(gl, this.uniforms[blur].get("u_mode"), mode);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[mode].buff);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, !i ? fbo.attachments[this.n] : this.fbos[1 - mode].attachments[0]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    const blend = 1;
    gl.useProgram(this.quads[blend]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbos[blend + 1].buff);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.attachments[0]);
    setUniform(gl, this.uniforms[blend].get("u_scene"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos[blend].attachments[0]);
    setUniform(gl, this.uniforms[blend].get("u_blur"), 1);
    gl.bindVertexArray(this.vaos[blend]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const out = 2;
    gl.useProgram(this.quads[out]);
    gl.viewport(0, 0, fbo.width, fbo.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.buff);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fbos[out].attachments[0]);
    gl.bindVertexArray(this.vaos[out]);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
};

// src/webgl/geometry.ts
var WHITE = [255, 255, 255];
var OBJECT_FILES = [
  "/static/models/ico-sphere.bin",
  "/static/models/root.bin",
  "/static/models/plane-circle.bin",
  "/static/models/line-segment.bin",
  "/static/models/plane-square.bin"
];
var DrawType = ((DrawType2) => {
  DrawType2[DrawType2["LINES"] = WebGL2RenderingContext.LINES] = "LINES";
  DrawType2[DrawType2["TRIANGLES"] = WebGL2RenderingContext.TRIANGLES] = "TRIANGLES";
  DrawType2[DrawType2["TRIANGLE_STRIP"] = WebGL2RenderingContext.TRIANGLE_STRIP] = "TRIANGLE_STRIP";
  DrawType2[DrawType2["TRIANGLE_FAN"] = WebGL2RenderingContext.TRIANGLE_FAN] = "TRIANGLE_FAN";
  return DrawType2;
})(DrawType || {});
var STRIDE = 8;
function createGrid(xmax, ymax, step) {
  const vertices3 = [];
  step = xmax / ymax / step;
  for (let x = -xmax; x <= xmax; x += step) {
    vertices3.push(x, 0, -ymax, 0, 0, 0.6, 1, 1);
    vertices3.push(x, 0, ymax, 0, 0, 0.6, 1, 1);
  }
  for (let y = -ymax; y <= ymax; y += step) {
    vertices3.push(-xmax, 0, y, 0, 0, 0.6, 1, 1);
    vertices3.push(xmax, 0, y, 0, 0, 0.6, 1, 1);
  }
  const vertexData = new Float32Array(vertices3);
  const indexData = new Uint16Array(vertexData.length / STRIDE);
  for (let i = 0; i < indexData.length; i++) {
    indexData[i] = i;
  }
  const buff = new ArrayBuffer(4 + vertexData.byteLength + indexData.byteLength);
  const view = new DataView(buff);
  view.setInt32(0, vertexData.byteLength, true);
  const vView = new Float32Array(buff, 4, vertexData.length);
  vView.set(vertexData);
  const iView = new Uint16Array(buff, 4 + vertexData.byteLength, indexData.length);
  iView.set(indexData);
  return buff;
}
var cache = /* @__PURE__ */ new Map();
var shapePropsDefault = {
  id: -1,
  type: 0 /* COLORED */,
  display: "inherit",
  visible: 1,
  pos: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
  color: WHITE,
  pick_color: WHITE
};
var Shape = class {
  constructor(gl, method, id = -1, type = 0 /* COLORED */, data, {
    pos = [0, 0, 0],
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    this.gl = gl;
    this.method = method;
    this.id = id;
    this.type = type;
    if (!cache.has(this.constructor.name)) {
      cache.set(this.constructor.name, data.then((res) => {
        const view = new DataView(res);
        const n = view.getInt32(0, true) + 4;
        const vView = new Float32Array(view.buffer.slice(4, n));
        const [vOK, vBuff] = createStaticBuffer(gl, vView.buffer);
        if (!vOK) {
          throw new Error("Failed to create vertex buffer.");
        }
        const iView = new Uint16Array(view.buffer.slice(n, view.byteLength));
        const [iOK, iBuff] = createStaticBuffer(gl, iView.buffer, gl.ELEMENT_ARRAY_BUFFER);
        if (!iOK) {
          throw new Error("Failed to create index buffer.");
        }
        return Promise.resolve([vBuff, iBuff]);
      }));
    }
    this.buffer = data.then((res) => {
      const view = new DataView(res);
      const n = view.getInt32(0, true);
      Reflect.set(this, "vertices", n / Float32Array.BYTES_PER_ELEMENT);
      Reflect.set(this, "indices", (view.byteLength - (n + 4)) / Uint16Array.BYTES_PER_ELEMENT);
      return cache.get(this.constructor.name);
    });
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]);
    this.color = new Float32Array(color);
    this.pick_color = new Float32Array(pick_color);
    this.depth = 0;
    this.display = display;
    this.visible = display == "hidden" ? 0 : 1;
  }
  buffer = null;
  indices = 0;
  vertices = 0;
  world;
  color;
  pick_color;
  depth;
  display;
  visible = 1;
  hovered = 0;
  focused = 0;
  *[Symbol.iterator]() {
    yield this;
  }
  show() {
    this.visible = 1;
  }
  hide() {
    switch (true) {
      case this.focused == 1:
      case this.hovered == 1:
      case this.display == "fixed":
      case this.display == "inherit":
        return;
    }
    this.visible = 0;
  }
  focus() {
    this.focused = 1;
    this.visible = 1;
  }
  blur() {
    this.hovered = 0;
    this.focused = 0;
  }
  draw(gl, map, drawInfo, offset = 0) {
    if (!this.visible) {
      return;
    }
    for (const [key, val] of Object.entries(drawInfo)) {
      if (!map.has(key) || !(val instanceof Function)) {
        continue;
      }
      setUniform(gl, map.get(key), val(this));
    }
    if (this.indices > 0) {
      gl.drawElements(this.method, this.indices, gl.UNSIGNED_SHORT, offset * Uint16Array.BYTES_PER_ELEMENT);
    }
  }
};
var Grid = class extends Shape {
  constructor(gl, xmax, ymax, step, {
    id = 0,
    type = 0 /* COLORED */,
    pos = [0, 0, 0],
    color = WHITE,
    pick_color = WHITE,
    display = "fixed"
  } = shapePropsDefault) {
    const data = new Promise((resolve) => {
      resolve(createGrid(xmax, ymax, step));
    });
    super(gl, DrawType.LINES, id, type, data, { pos, color, pick_color, display });
  }
};
var Sphere = class _Sphere extends Shape {
  static data = fetch(OBJECT_FILES[0]).then((res) => res.arrayBuffer());
  world;
  constructor(gl, {
    id = -1,
    type = 2 /* SPHERE */,
    pos = [0, 0, 0],
    scale = [1, 1, 1],
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    super(gl, gl.TRIANGLES, id, type, _Sphere.data, { pos, color, pick_color, display });
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]).scale(scale[0], scale[1], scale[2]);
  }
};
var Root = class _Root extends Shape {
  static data = fetch(OBJECT_FILES[1]).then((res) => res.arrayBuffer());
  world;
  constructor(gl, {
    id = -1,
    type = 0 /* COLORED */,
    pos = [0, 0, 0],
    scale = [0.075, 0.075, 0.075],
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    super(gl, gl.TRIANGLES, id, type, _Root.data, { pos, color, pick_color, display });
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]).rotateX(-0.25).scale(scale[0], scale[1], scale[2]);
  }
};
var Circle = class _Circle extends Shape {
  static data = fetch(OBJECT_FILES[2]).then((res) => res.arrayBuffer());
  world;
  constructor(gl, {
    id = 0,
    type = 0 /* COLORED */,
    pos = [0, 0, 0],
    scale = [1, 1, 1],
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    super(gl, gl.TRIANGLE_STRIP, id, type, _Circle.data, { pos, color, pick_color, display });
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]).scale(scale[0], scale[1], scale[2]);
  }
};
var Background = class extends Circle {
  method;
  world;
  constructor(gl, {
    id = -1,
    type = 16 /* SHADOW */,
    pos = [0, 0, 0],
    scale = [1, 1, 1],
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    super(gl, { id, type, pos, scale, color, pick_color, display });
    this.method = gl.TRIANGLE_FAN;
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]).rotateX(-Math.PI / 2).scale(scale[0] + 0.15, scale[1], scale[2] + 0.15);
  }
};
var Line = class _Line extends Shape {
  static data = fetch(OBJECT_FILES[3]).then((res) => res.arrayBuffer());
  world;
  constructor(gl, start, end, scale, {
    id = -1,
    type = 4 /* LINE */,
    color = WHITE,
    pick_color = WHITE,
    display = "inherit"
  } = shapePropsDefault) {
    super(gl, gl.TRIANGLES, id, type, _Line.data, { color, pick_color, display });
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    const len = Math.hypot(dx, dy, dz);
    const up = new vec3(0, 1, 0);
    const dir = new vec3(dx, dy, dz).normalize();
    const axis = up.cross(dir).normalize();
    const theta = Math.acos(up.dot(dir));
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      dx / 2 + start[0],
      dy / 2 + start[1],
      dz / 2 + start[2],
      1
    ]).rotateAxis(axis, theta).scale(scale, len * 0.5, scale);
  }
};
var Plane = class _Plane extends Shape {
  static data = fetch(OBJECT_FILES[4]).then((res) => res.arrayBuffer());
  world;
  depth;
  constructor(gl, depth, {
    id = -1,
    type = 1 /* TEXTURED */,
    pos = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    color = WHITE,
    pick_color = WHITE,
    display = "hidden"
  } = shapePropsDefault) {
    super(gl, gl.TRIANGLES, id, type, _Plane.data, { color, pick_color, display });
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]).rotate(rotation[0], rotation[1], rotation[2]).scale(scale[0], scale[1], scale[2]);
    this.depth = depth;
  }
};
var Composite = class {
  constructor(gl, {
    id = -1,
    pos = [0, 0, 0],
    display = "inherit",
    shapes = []
  } = shapePropsDefault) {
    this.gl = gl;
    const key = shapes.map((shape) => shape.constructor.name).join();
    if (!cache.has(key)) {
      cache.set(key, Promise.all(shapes.map((shape) => shape.buffer)).then((buffers) => {
        const vBytes = shapes.reduce((acc, shape) => acc + shape.vertices, 0);
        const iBytes = shapes.reduce((acc, shape) => acc + shape.indices, 0);
        const vAll = new Float32Array(vBytes);
        const iAll = new Uint16Array(iBytes);
        const offset = [0, 0];
        let i = 0;
        for (const [vBuff2, iBuff2] of buffers) {
          gl.bindBuffer(gl.ARRAY_BUFFER, vBuff2);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuff2);
          const vSize = shapes[i].vertices;
          const vView = new Float32Array(vSize);
          gl.getBufferSubData(gl.ARRAY_BUFFER, 0, vView, 0);
          vAll.set(vView, offset[0]);
          const iSize = shapes[i].indices;
          const iView = new Uint16Array(iSize);
          gl.getBufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, iView, 0);
          iAll.set(iView, offset[1]);
          const n = offset[0] / 8;
          for (let i2 = offset[1]; i2 < offset[1] + iSize; i2++) {
            iAll[i2] += n;
          }
          offset[0] += vSize;
          offset[1] += iSize;
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
          i++;
        }
        const [vOk, vBuff] = createStaticBuffer(gl, vAll.buffer);
        if (!vOk) {
          throw new Error("Failed to create vertex buffer.");
        }
        const [iOk, iBuff] = createStaticBuffer(gl, iAll.buffer, gl.ELEMENT_ARRAY_BUFFER);
        if (!iOk) {
          throw new Error("Failed to create index buffer.");
        }
        return Promise.resolve([vBuff, iBuff]);
      }));
    }
    this.buffer = cache.get(key).then(([vBuff, iBuff]) => {
      const vBytes = shapes.reduce((acc, shape) => acc + shape.vertices, 0);
      const iBytes = shapes.reduce((acc, shape) => acc + shape.indices, 0);
      Reflect.set(this, "vertices", vBytes);
      Reflect.set(this, "indices", iBytes);
      return [vBuff, iBuff];
    });
    this.id = id;
    this.shapes = shapes;
    for (const shape of shapes) {
      for (const child of shape) {
        Reflect.set(child, "id", child.id == -1 ? id : child.id);
        child.world[12] += pos[0];
        child.world[13] += pos[1];
        child.world[14] += pos[2];
      }
    }
    this.world = new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      pos[0],
      pos[1],
      pos[2],
      1
    ]);
    this.display = display;
  }
  buffer;
  indices = 0;
  vertices = 0;
  method = 0;
  type = 0 /* COLORED */;
  id;
  shapes;
  world;
  color = null;
  pick_color = null;
  depth = 0;
  display;
  visible = 1;
  hovered = 0;
  focused = 0;
  *[Symbol.iterator]() {
    for (const shape of this.shapes) {
      yield* shape;
    }
  }
  show() {
    for (const shape of this.shapes) {
      shape.show();
    }
    this.visible = 1;
  }
  hide() {
    for (const shape of this.shapes) {
      shape.hide();
    }
    switch (true) {
      case this.focused == 1:
      case this.hovered == 1:
      case this.display == "fixed":
      case this.display == "inherit":
        return;
    }
    this.visible = 0;
  }
  focus() {
    for (const shape of this.shapes) {
      shape.focus();
    }
    this.focused = 1;
    this.visible = 1;
  }
  blur() {
    for (const shape of this.shapes) {
      shape.blur();
    }
    this.hovered = 0;
    this.focused = 0;
  }
  draw(gl, map, drawInfo, offset = 0) {
    if (!this.visible) {
      return;
    }
    for (const shape of this.shapes) {
      shape.draw(gl, map, drawInfo, offset);
      offset += shape.indices > 0 ? shape.indices : shape.vertices;
    }
  }
};
var RootNode = class extends Composite {
  constructor(gl, { id = -1, display = "fixed", pos = [0, 0, 0] } = shapePropsDefault) {
    super(gl, { id, display, pos, shapes: [
      new Root(gl, { display, pos: [0, 0.025, 0], pick_color: [255, 141, 35] }),
      new Background(gl, { id: -1, type: 8 /* BACKGROUND */, pos: [0, 0.075, 0] }),
      new Circle(gl, { display, type: 16 /* SHADOW */, pos: [0, 0.015, 0], color: [0, 0, 0] })
    ] });
  }
};
var Node = class extends Composite {
  constructor(gl, { id = -1, display = "fixed", pos = [0, 0, 0] } = shapePropsDefault) {
    super(gl, { id, pos, shapes: [
      new Sphere(gl, { display, pos: [0, 0.06, 0], pick_color: [255, 141, 35] }),
      new Circle(gl, { display, type: 16 /* SHADOW */, pos: [0, 0.015, 0], color: [0, 0, 0] })
    ] });
  }
};
var Edge = class extends Composite {
  constructor(gl, start, end) {
    super(gl, { pos: [-start[0], 0, -start[2]], shapes: [
      new Line(gl, start, end, 15e-4, { display: "hidden", pick_color: [255, 141, 35] }),
      new Line(
        gl,
        [start[0], 0.0125, start[2]],
        [end[0], 0.0125, end[2]],
        125e-5,
        { display: "hidden", type: 16 /* SHADOW */, color: [0, 0, 0] }
      )
    ] });
  }
};
var Logo = class extends Composite {
  constructor(gl, depth, {
    id = 0,
    display = "hidden",
    pos = [0, 0, 0],
    scale = [1.2, 1, 1]
  } = shapePropsDefault) {
    super(gl, { id, display, visible: 0, pos: [pos[0], 0, pos[2]], shapes: [
      new Plane(gl, depth, { display, pos: [0, pos[1], 0], rotation: [-Math.PI / 2, 0, 0], scale }),
      new Circle(gl, { display, type: 16 /* SHADOW */, pos: [0, 0.015, 0], color: [0, 0, 0] })
    ] });
  }
  draw(gl, map, drawInfo, offset) {
    const { atlases } = drawInfo;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[0]);
    super.draw(gl, map, drawInfo, offset);
  }
};
var Text = class extends Composite {
  constructor(gl, depth, {
    id = 0,
    display = "fixed",
    pos = [0, 0, 0],
    scale = [2.5, 1, 1.5],
    rotation = [-Math.PI / 2, 0, 0]
  } = shapePropsDefault) {
    super(gl, { id, pos: [pos[0], pos[1], pos[2]], shapes: [
      new Plane(gl, depth, { display, rotation, scale })
    ] });
  }
  draw(gl, map, drawInfo, offset) {
    const { atlases } = drawInfo;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[1]);
    super.draw(gl, map, drawInfo, offset);
  }
};
var Project = class extends Composite {
  constructor(gl, depth, {
    id = 0,
    pos = [0, 0, 0],
    rotation = [-Math.PI / 2, 0, 0]
  } = shapePropsDefault) {
    super(gl, { id, visible: 0, pos, shapes: [
      new Plane(gl, depth, { display: "hidden", pos: [0, 0.1, 0], rotation, scale: [1.2, 1, 1] }),
      new Circle(gl, { display: "hidden", type: 16 /* SHADOW */, pos: [0, 5e-3, 0], color: [0, 0, 0] })
    ] });
  }
  draw(gl, map, drawInfo, offset) {
    const { atlases } = drawInfo;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlases[2]);
    super.draw(gl, map, drawInfo, offset);
  }
};

// src/webgl/shaders/vertex-main.ts
var vertex_main_default = `#version 300 es
precision mediump float;
precision mediump int;

layout(location=0) in vec3 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec3 a_normal;

out vec3 v_position;
out vec2 v_uv;
out float v_brightness;

uniform int u_type;
uniform mat4 u_vpm;
uniform mat4 u_model;
uniform vec3 u_light_dir;

void main() {
    gl_Position = u_vpm*u_model*vec4(a_position, 1.0);
    v_uv = a_uv;

    if ((u_type&0x2) == 2) {
        vec4 normal = u_model*vec4(a_position, 0.0);
        v_brightness = max(dot(u_light_dir, normalize(normal.xyz)), 0.0);
    } else {
        vec4 normal = u_model*vec4(a_normal, 0.0);
        v_brightness = max(dot(u_light_dir, normalize(normal.xyz)), 0.0);
    }
}`;

// src/webgl/shaders/fragment-main.ts
var fragment_main_default = `#version 300 es
precision mediump float;
precision mediump int;
precision mediump sampler2DArray;

in vec2 v_uv;
in float v_brightness;

layout(location=0) out vec4 f_color;
layout(location=1) out vec4 f_threshold;
layout(location=2) out int f_id;

uniform int u_type;
uniform int u_id;
uniform int u_picked[6];
uniform vec3 u_color;
uniform vec3 u_pick_color;
uniform sampler2DArray u_sampler;
uniform int u_depth;

void main() {
    if ((u_type&0x1) == 0x1) {
        f_color = texture(u_sampler, vec3(v_uv, float(u_depth)));
        f_threshold = vec4(0.0, 0.0, 0.0, 0.0);
        f_id = u_id;
        return;
    }

    vec3 color = u_color/255.0;
    vec3 threshold = vec3(0.0, 0.0, 0.0);

    if ((u_type&0x8) == 0x8) {
        f_color = vec4(1.0, 0.0, 0.0, 0.0);
        f_threshold = vec4(threshold, 0.0);
        f_id = u_id;
        return;
    }

    if ((u_type&0x10) == 0x10) {
        f_color = vec4(color, 0.2);
        f_threshold = vec4(threshold, 0.0);
        f_id = u_id;
        return;
    }

    for (int i = 0; i < 5; i++) {
        if (u_id != u_picked[i]) {
            continue;
        }
        color = u_pick_color.rgb/255.0;
        f_color = vec4(color, 1.0);
        f_threshold = vec4(color, 1.0);
        f_id = u_id;
        return;
    }

    f_color = vec4(color*0.4 + 0.7*color*v_brightness, 1.0);
    f_threshold = vec4(threshold, 1.0);
    f_id = u_id;
}`;

// src/hints.ts
var hints_default = {
  // Technical skills
  512: {
    txt: "<b>Vue.js</b><br/><br/>I like the simplicity of Vue and that it doesn't include all the frustration found in other directive driven frameworks. However, I've only made very simple projects with it.",
    rating: 3
  },
  513: {
    txt: "<b>React</b><br/><br/>I've been using react extensively and I really like it for its unopinionated minimal API and emphasis on composition.",
    rating: 5
  },
  514: {
    txt: "<b>HTML</b><br/><br/>! + \u23CE<br/><br/>All kidding aside, I'm quite familiar with HTML, including semantic elements and specialized input elements.",
    rating: 4
  },
  515: {
    txt: "<b>TypeScript</b><br/><br/>Type-safety is fine, but more importantly, with a quick glance, it provides a lot of context right in your editor, which often is invaluable.",
    rating: 5
  },
  516: {
    txt: "<b>CSS</b><br/><br/>I know the CSS baseline and I try to keep up with the latest features. I worked with preprocessors like SASS and LESS, but I prefer CSS-in-JS.",
    rating: 4
  },
  517: {
    txt: "<b>JavaScript</b><br/><br/>I'm quite confident with JavaScript and I've worked with libraries such as jQuery, Loadash, Underscore, Knockout, Bootstrap and many more.",
    rating: 5
  },
  518: {
    txt: "<b>WebAssembly</b><br/><br/>I made some simple tools and most of them were written in Go.",
    rating: 4
  },
  528: {
    txt: "<b>Git</b><br/><br/>I know about 12 Git commands, where the first 4 are stage, commit, pull and push. The last eight are for when I messed up.",
    rating: 4
  },
  529: {
    txt: "<b>Docker</b><br/><br/>I love docker. It makes it so easy to spin up a new environment and share it with others. Most of the projects I work on are containerized.",
    rating: 5
  },
  530: {
    txt: "<b>PostgreSQL</b><br/><br/>The databases I've worked with are mostly ones I created, so I'm quite familiar with schemas, views and how to query data.",
    rating: 5
  },
  531: {
    txt: "<b>Next.js</b><br/><br/>I've used Next.js a couple of times and it's certainly a good framework. I however find it a bit opinionated and prefer to use a custom setup.",
    rating: 3
  },
  532: {
    txt: "<b>Deno</b><br/><br/>Packages that I often found myself installing in Node.js are shipped with Deno by default. Because of that, I quickly adopted Deno as my go-to environment.",
    rating: 5
  },
  533: {
    txt: "<b>Node.js</b><br/><br/>I've mostly used Node.js to spin up an Express server, but I've also made some CLI scripts to automate simple tasks.",
    rating: 3
  },
  544: {
    txt: "<b>Go</b><br/><br/>This is without a contest my favorite language. It may be a bit verbose, but you end up with programs that are stable, and easy to maintain. Not to mention that concurrency in Go is awesome.",
    rating: 5
  },
  545: {
    txt: "<b>Python</b><br/><br/>I've worked with most of the popular libraries, like Pandas, Numpy, Matplotlib, Scikit-learn, etc., however they are so vast that I know at best half of what they do.",
    rating: 3
  },
  546: {
    txt: "<b>F#</b><br/><br/>It's a shame that F# isn't more widely used, because the typesystem is outstanding. Unions with match statements are such a versatile feature.",
    rating: 3
  },
  547: {
    txt: "<b>C#</b><br/><br/>I'm not a huge fan of strictly OOP languages, but C# does a lot of things right, so I actually don't mind that I can't define an isolated function.",
    rating: 4
  },
  548: {
    txt: "<b>C</b><br/><br/>The freedom C provides is unmatched and the few structures of the language, really gives you a fundamental understanding of how code works. It also made me appreciate a garbage collector.",
    rating: 4
  },
  // Projects
  768: {
    txt: "<b>mypage</b><br/><br/>This page. Nothing fancy, it just uses standard web APIs so that it can run in any browser.<br/><br/><a href='#canvas' target='_self'>page</a><a href='https://github.com/TimRJensen/mypage' target='_blank'>source</a>",
    rating: -1
  },
  769: {
    txt: "<b>Aruco generator</b><br/><br/>A very simple app, that can generate aruco codes. The codes are mainly used in robotics.<br/><br/><a href='https://aruco-generator.sliplane.app/' target='_blank'>page</a><a href='https://github.com/TimRJensen/aruco-generator' target='_blank'>source</a>",
    rating: -1
  },
  770: {
    txt: "<b>Breakout & Galage</b><br/><br/>A cool little project we did at the institute, where we recreated old arcade games.<br/><br/><a href='https://github.com/TimRJensen/DIKUGames' target='_blank'>source</a>",
    rating: -1
  },
  // Personal skills
  1024: {
    txt: "<b>Creativity</b>",
    rating: 3
  },
  1025: {
    txt: "<b>Planning</b>",
    rating: 4
  },
  1026: {
    txt: "<b>Problem solving</b>",
    rating: 4
  },
  1027: {
    txt: "<b>Communication</b>",
    rating: 3
  },
  1028: {
    txt: "<b>Critical thinking</b>",
    rating: 5
  },
  65: {
    txt: "I enjoy watching football, olympic weightlifting & strong-man competitions.<br/><br/>Besides sports, I enjoy listening to music. I like all kinds of genres and can sit for hours just listening.<br/><br/>I also sometimes like to read, but mostly the classics or fantasy novels.",
    rating: -1
  },
  // Help
  1280: {
    txt: "<b>Hello World!</b><br/><br/>Infoboxes may contain ratings of my experience with a skill.",
    rating: 3
  }
};

// src/main.ts
(function() {
  document.querySelectorAll("#msg-box .button, #footer .button").forEach((button) => {
    button.addEventListener(
      "pointerdown",
      () => document.querySelector("#canvas-box").scrollIntoView({ behavior: "smooth" })
    );
  });
})();
(function() {
  const canvas = document.querySelector("#canvas-box #canvas");
  const gl = canvas.getContext("webgl2", { antialias: true });
  if (!gl) {
    throw new Error("WebGL2 is not supported");
  }
  canvas.width = 1680;
  canvas.height = 1020;
  const shapes = [
    //col == row == 0.1238
    // Grid
    new Grid(gl, 1.3, 1.5, 7, { id: 0, color: [151, 101, 205] }),
    // Root
    new Composite(gl, { id: 1, display: "fixed", pos: [0, 0, -0.728], shapes: [
      new RootNode(gl)
    ] }),
    // Frontend
    new Composite(gl, { id: 32, display: "fixed", pos: [0, 0, 0.5077], shapes: [
      new Text(gl, 7, { pos: [0, 1e-3, -0.0619], rotation: [Math.PI, 0, 0] }),
      new Node(gl),
      new Edge(gl, [0, 0.06, 0.5589], [0, 0.06, -0.0863]),
      new Logo(gl, 0, { id: 512, pos: [0, 0.1, 0.59] }),
      new Logo(gl, 1, { id: 513, pos: [-0.1846, 0.1, 0.5519] }),
      new Logo(gl, 2, { id: 514, pos: [0.1846, 0.1, 0.5519] }),
      new Logo(gl, 3, { id: 515, pos: [-0.3391, 0.1, 0.4437] }),
      new Logo(gl, 4, { id: 516, pos: [0.3391, 0.1, 0.4437] }),
      new Logo(gl, 5, { id: 517, pos: [-0.4381, 0.1, 0.2833] }),
      new Logo(gl, 6, { id: 518, pos: [0.4381, 0.1, 0.2833] })
    ] }),
    // Backend
    new Composite(gl, { id: 33, display: "fixed", pos: [-0.6065, 0, 0.2601], shapes: [
      new Text(gl, 8, { pos: [0.0619, 1e-3, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0] }),
      new Node(gl),
      new Edge(gl, [-0.6065, 0.06, 0.2601], [0, 0.06, -0.1113]),
      new Logo(gl, 7, { id: 528, pos: [0.2331, 0.1, 0.4038] }),
      new Logo(gl, 8, { id: 529, pos: [0.0809, 0.1, 0.4591] }),
      new Logo(gl, 9, { id: 530, pos: [-0.081, 0.1, 0.4591] }),
      new Logo(gl, 10, { id: 531, pos: [-0.2331, 0.1, 0.4037] }),
      new Logo(gl, 11, { id: 532, pos: [-0.3571, 0.1, 0.2997] }),
      new Logo(gl, 12, { id: 533, pos: [-0.4381, 0.1, 0.1595] })
    ] }),
    // All purpose
    new Composite(gl, { id: 34, display: "fixed", pos: [0.6065, 0, 0.2601], shapes: [
      new Text(gl, 9, { pos: [-0.085, 1e-3, -0.0619], rotation: [Math.PI, Math.PI / 4, 0] }),
      new Node(gl),
      new Edge(gl, [0.6065, 0.06, 0.2601], [0, 0.06, -0.1113]),
      new Logo(gl, 13, { id: 544, pos: [-0.2331, 0.1, 0.4038] }),
      new Logo(gl, 14, { id: 545, pos: [-0.0406, 0.1, 0.4644] }),
      new Logo(gl, 15, { id: 546, pos: [0.1595, 0.1, 0.4381] }),
      new Logo(gl, 16, { id: 547, pos: [0.3297, 0.1, 0.3297] }),
      new Logo(gl, 17, { id: 548, pos: [0.4381, 0.1, 0.1595] })
    ] }),
    // Technical skills
    new Composite(gl, { id: 2, display: "fixed", pos: [0, 0, -0.1113], shapes: [
      new Text(gl, 10, { pos: [0, 1e-3, -0.1113], rotation: [Math.PI, 0, 0] }),
      new Node(gl),
      new Edge(gl, [0, 0.06, -0.1113], [0, 0.06, -0.728])
    ] }),
    // Projects
    new Composite(gl, { id: 3, display: "fixed", pos: [0.482, 0, -0.4819], shapes: [
      new Text(gl, 13, { pos: [-0.045, 1e-3, -0.045], rotation: [Math.PI, Math.PI / 4, 0] }),
      new Node(gl),
      new Edge(gl, [0.482, 0.06, -0.4819], [0, 0.06, -0.728]),
      new Project(gl, 1, { id: 768, pos: [0.3885, 0, 0], rotation: [-Math.PI / 2, 0, 0.5] }),
      new Project(gl, 0, { id: 769, pos: [0.2747, 0, 0.15], rotation: [-Math.PI / 2, 0, 0.5] })
    ] }),
    // About me
    new Composite(gl, { id: 65, display: "fixed", pos: [-1.0399, 0, 0.1363], shapes: [
      new Text(gl, 11, { pos: [0.0619, 0, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0] }),
      new Node(gl),
      new Edge(gl, [-1.0399, 0.06, 0.1363], [-0.502, 0.06, -0.462])
    ] }),
    // Personal skills
    new Composite(gl, { id: 4, display: "fixed", pos: [-0.482, 1e-3, -0.482], shapes: [
      new Text(gl, 12, { pos: [0.077, 0, -0.07], rotation: [Math.PI, -Math.PI / 4, 0] }),
      new Node(gl),
      new Edge(gl, [-0.482, 0.06, -0.4819], [0, 0.06, -0.728]),
      new Logo(gl, 18, { id: 1024, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1, 1.1] }),
      new Logo(gl, 19, { id: 1025, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1, 0.75] }),
      new Logo(gl, 20, { id: 1026, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1, 0.75] }),
      new Logo(gl, 21, { id: 1027, pos: [-0.2881, 0.1, 0.15], scale: [1.25, 1, 1.25] }),
      new Logo(gl, 22, { id: 1028, pos: [-0.3266, 0.1, 0], scale: [0.75, 1, 0.75] })
    ] }),
    // Help
    new Composite(gl, { id: 80, display: "hidden", pos: [0, 0, 0], shapes: [
      new Node(gl),
      new Edge(gl, [0, 0.06, 0], [0, 0.06, -0.3714]),
      new Logo(gl, 23, { id: 1280, pos: [0, 0.1, 0.3714] })
    ] }),
    new Composite(gl, { id: 5, display: "hidden", pos: [0, 0, -0.3714], shapes: [
      new Node(gl),
      new Edge(gl, [0, 0.06, -0.3714], [0, 0.06, -0.7428])
    ] }),
    new Composite(gl, { id: 6, display: "hidden", pos: [0, 0, -0.7428], shapes: [
      new Node(gl)
    ] }),
    // Hand
    new Composite(gl, { id: 7, display: "hidden", pos: [0.3714, 0, -0.3714], shapes: [
      new Logo(gl, 24, { display: "fixed", pos: [0, 0, 0], scale: [0.5, 1, 0.5] })
    ] }),
    // Cloud
    new Composite(gl, { id: 8, display: "fixed", pos: [0, 0, 1.1142], shapes: [
      new Text(gl, 0, { id: -1, pos: [0, 0.3714, 0], scale: [3, 1, 1.5] }),
      new Circle(gl, { type: 16 /* SHADOW */, pos: [0, 0.015, 0], color: [0, 0, 0] })
    ] })
  ];
  const ROOT = 1;
  const TECHNICAL_SKILLS = 2;
  const PROJECTS = 3;
  const PERSONAL_SKILLS = 4;
  const FIRST = 5;
  const SECOND = 80;
  const HELP = 6;
  const HAND = 7;
  const CLOUD = 8;
  const ids = [
    [ROOT, "contact"],
    [(TECHNICAL_SKILLS << 4) + 0, "frontend"],
    [(TECHNICAL_SKILLS << 4) + 1, "backend"],
    [(TECHNICAL_SKILLS << 4) + 2, "all purpose"],
    [TECHNICAL_SKILLS, "technical skills"],
    [PROJECTS, "projects"],
    [(PERSONAL_SKILLS << 4) + 1, "about me"],
    [PERSONAL_SKILLS, "personal skills"],
    [(FIRST << 4) + 0, "second"],
    [FIRST, "first"],
    [HELP, "start"],
    [HAND, ""],
    [CLOUD, ""]
  ];
  const map = /* @__PURE__ */ new Map();
  for (let i = 1; i < shapes.length; i++) {
    map.set(ids[i - 1][0], { txt: ids[i - 1][1], index: i });
  }
  const cam = new vec3(0.2, 0.4, -1.45);
  const center = new vec3(0, 0, 0);
  const up = new vec3(0, 1, 0);
  const pm = mat4.perspective(Math.PI / 4, 16 / 9, 0.1, 10);
  let vpm = pm.mul(mat4.lookAt(cam, center, up));
  const main = new Program(canvas, shapes, vertex_main_default, fragment_main_default, {
    color: [102, 51, 153, 1],
    attrs: {
      a_position: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 },
      a_uv: { type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4 },
      a_normal: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 }
    },
    textures: {
      "/static/imgs/atlas-logos.png": {
        width: 256,
        height: 256,
        depth: 25
      },
      "/static/imgs/atlas-grid-texts.png": {
        width: 512,
        height: 256,
        depth: 14
      },
      "/static/imgs/atlas-projects.png": {
        width: 512,
        height: 512,
        depth: 2
      }
    }
  });
  main.plugins.push(
    new BloomPlugin(gl, shapes, main),
    new PointerPlugin(gl, shapes, main)
  );
  main.render({
    u_light_dir: new vec3(0.6, 1, 2).normalize(),
    u_picked: new Int32Array([-1, -1, -1, -1, -1]),
    u_vpm: () => vpm,
    u_type: (shape) => shape.type,
    u_id: (shape) => shape.id,
    u_model: (shape) => shape.world,
    u_color: (shape) => shape.color,
    u_pick_color: (shape) => shape.pick_color,
    u_depth: (shape) => shape.id == CLOUD ? cloudState : shape.depth
  });
  const bounds = [[1.5, -1.5], [0.5, -1.75]];
  let gridDrag = false;
  let pointer = 0;
  canvas.addEventListener(
    "pointermove",
    (e) => {
      if (!gridDrag) {
        return;
      }
      e.preventDefault();
      const dx = e.movementX / canvas.width;
      const dz = e.movementY / canvas.height;
      if (cam.x < bounds[0][0] && dx <= 0 || cam.x > bounds[0][1] && dx >= 0) {
        cam.x -= dx;
        center.x -= dx;
      }
      if (cam.z > bounds[1][1] && dz <= 0 || cam.z < bounds[1][0] && dz >= 0) {
        cam.z += dz;
        center.z += dz;
      }
      vpm = pm.mul(mat4.lookAt(cam, center, up));
    },
    { passive: false }
  );
  canvas.addEventListener(
    "pointerup",
    (e) => {
      e.preventDefault();
      if (!pointer) {
        return;
      }
      canvas.releasePointerCapture(pointer);
      gridDrag = false;
      pointer = 0;
    },
    { passive: false }
  );
  canvas.addEventListener(
    "pointerleave",
    (e) => {
      e.preventDefault();
      if (!pointer) {
        return;
      }
      canvas.releasePointerCapture(pointer);
      gridDrag = false;
      pointer = 0;
    },
    { passive: false }
  );
  canvas.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      gridDrag = true;
      pointer = e.pointerId;
    },
    { passive: false }
  );
  const picked = main.drawInfo.u_picked;
  const srcXZ = [0, 0];
  const trgXZ = [0, 0];
  const duration = 500;
  const step = 1 / (duration / (1e3 / 60));
  const offset = [0.125, -0.6589];
  let progress = 0;
  function easeInOut(alpha) {
    return alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
  }
  function lerp(a, b, alpha) {
    return a * (1 - alpha) + b * alpha;
  }
  function panCamera() {
    if (progress >= 1 || gridDrag) {
      progress = 0;
      return;
    }
    progress += step;
    const alpha = easeInOut(progress);
    const offsetXZ = [center[0] - cam[0], center[2] - cam[2]];
    cam[0] = lerp(srcXZ[0], trgXZ[0], alpha);
    cam[2] = lerp(srcXZ[1], trgXZ[1], alpha);
    center[0] = cam[0] + offsetXZ[0];
    center[2] = cam[2] + offsetXZ[1];
    vpm = pm.mul(mat4.lookAt(cam, center, up));
    requestAnimationFrame(panCamera);
  }
  const infoBox = document.querySelector("#canvas-box .hint-box");
  function moveInfoBox(world, id, panel) {
    if (!world) {
      panel.removeAttribute("data-show");
      return;
    }
    requestAnimationFrame(function fn() {
      if (!progress || progress >= 1) {
        return;
      }
      const vpm3 = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
      const rect2 = canvas.getBoundingClientRect();
      const x2 = vpm3[12] / vpm3[15] * 0.5 + 0.5;
      const y2 = vpm3[13] / vpm3[15] * -0.5 + 0.5;
      panel.style.left = rect2.left + x2 * rect2.width + "px";
      panel.style.top = rect2.top + y2 * rect2.height + "px";
      requestAnimationFrame(fn);
    });
    const vpm2 = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
    const rect = canvas.getBoundingClientRect();
    const x = vpm2[12] / vpm2[15] * 0.5 + 0.5;
    const y = vpm2[13] / vpm2[15] * -0.5 + 0.5;
    panel.style.left = rect.left + x * rect.width + "px";
    panel.style.top = rect.top + y * rect.height + "px";
    if (!id) {
      return;
    }
    panel.dataset.show = id.toString();
    panel.firstElementChild.innerHTML = hints_default[id]?.txt;
    for (let i = 0; i < panel.lastElementChild.children.length; i++) {
      panel.lastElementChild.children[i].dataset.toggled = i < hints_default[id].rating ? "1" : "0";
    }
  }
  const footer = document.querySelector("#footer");
  main.on("pointerdown", (e) => {
    moveInfoBox(null, 0, infoBox);
    if (e.id == 0 || e.id == CLOUD || progress > 0) {
      return;
    }
    for (const shape of shapes) {
      shape.blur();
      shape.hide();
    }
    switch (true) {
      case e.id == ROOT:
        picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
        footer.scrollIntoView({ behavior: "smooth" });
        return;
      case e.id == PERSONAL_SKILLS:
      case e.id == PROJECTS:
      case e.id == TECHNICAL_SKILLS:
      case e.id == FIRST:
      case e.id == HELP:
        picked[0] = e.id < FIRST ? ROOT : HELP, picked[3] = e.id, picked[4] = -1;
        shapes[map.get(picked[0]).index].focus();
        e.shape.focus();
        break;
      case e.id >> 4 == PERSONAL_SKILLS:
      case e.id >> 4 == PROJECTS:
      case e.id >> 4 == TECHNICAL_SKILLS:
      case e.id >> 4 == FIRST:
        picked[0] = e.id >> 4 < FIRST ? ROOT : HELP, picked[3] = e.id >> 4, picked[4] = e.id;
        shapes[map.get(picked[0]).index].focus();
        shapes[map.get(picked[3]).index].focus();
        shapes[map.get(picked[4])?.index ?? 0].focus();
        e.shape.focus();
        if (e.id in hints_default) {
          moveInfoBox(e.shape.world, e.id, infoBox);
        }
        break;
      case e.id >> 8 == PERSONAL_SKILLS:
      case e.id >> 8 == PROJECTS:
      case e.id >> 8 == TECHNICAL_SKILLS:
      case e.id >> 8 == FIRST:
        picked[0] = e.id >> 8 < FIRST ? ROOT : HELP, picked[3] = e.id >> 8, picked[4] = e.id >> 4;
        shapes[map.get(picked[0]).index].focus();
        shapes[map.get(picked[3]).index].focus();
        shapes[map.get(picked[4])?.index ?? 0].focus();
        e.shape.focus();
        if (e.id in hints_default) {
          moveInfoBox(e.shape.world, e.id, infoBox);
          e.shape = shapes[(map.get(e.id >> 4) ?? map.get(e.id >> 8)).index];
        }
        break;
    }
    srcXZ[0] = cam[0];
    srcXZ[1] = cam[2];
    trgXZ[0] = e.shape.world[12] + offset[0];
    trgXZ[1] = e.shape.world[14] + offset[1];
    gridDrag = false;
    panCamera();
  });
  main.on("pointermove", (e) => {
    for (const shape of shapes) {
      shape.hide();
    }
    switch (true) {
      case e.id == ROOT:
      case e.id == PERSONAL_SKILLS:
      case e.id == PROJECTS:
      case e.id == TECHNICAL_SKILLS:
      case e.id == FIRST:
      case e.id == HELP:
        picked[0] = e.id < FIRST ? ROOT : HELP, picked[1] = e.id, picked[2] = -1;
        shapes[map.get(picked[0]).index].show();
        e.shape.show();
        return;
      case e.id >> 4 == PERSONAL_SKILLS:
      case e.id >> 4 == PROJECTS:
      case e.id >> 4 == TECHNICAL_SKILLS:
      case e.id >> 4 == FIRST:
        picked[0] = e.id >> 4 < FIRST ? ROOT : HELP, picked[1] = e.id >> 4, picked[2] = e.id;
        shapes[map.get(picked[0]).index].show();
        shapes[map.get(picked[1]).index].show();
        shapes[map.get(picked[2])?.index ?? 0].show();
        e.shape.show();
        return;
      case e.id >> 8 == PERSONAL_SKILLS:
      case e.id >> 8 == PROJECTS:
      case e.id >> 8 == TECHNICAL_SKILLS:
      case e.id >> 8 == FIRST:
        picked[0] = e.id >> 8 < FIRST ? ROOT : HELP, picked[1] = e.id >> 8, picked[2] = e.id >> 4;
        shapes[map.get(picked[0]).index].show();
        shapes[map.get(picked[1]).index].show();
        shapes[map.get(picked[2])?.index ?? 0].show();
        e.shape.show();
        return;
      default:
        if (picked[3] != -1) {
          picked[1] = picked[2] = -1;
        } else {
          picked[0] = picked[1] = picked[2] = -1;
        }
        return;
    }
  });
  const breadcrumbs = document.querySelector("#canvas-box .breadcrumbs");
  breadcrumbs.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    moveInfoBox(null, 0, infoBox);
    const id = Number.parseInt(e.target.dataset.id ?? ROOT.toString());
    switch (id) {
      case ROOT:
      case HELP:
        shapes[map.get(picked[4])?.index ?? 0].blur();
        shapes[map.get(picked[4])?.index ?? 0].hide();
        shapes[map.get(picked[3])?.index ?? 0].blur();
        shapes[map.get(picked[3])?.index ?? 0].hide();
        picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
        breadcrumbs.replaceChildren(breadcrumbs.firstChild);
        break;
      case PERSONAL_SKILLS:
      case PROJECTS:
      case TECHNICAL_SKILLS:
      case FIRST:
        shapes[map.get(picked[4])?.index ?? 0].blur();
        shapes[map.get(picked[4])?.index ?? 0].hide();
        picked[2] = picked[4] = -1;
        breadcrumbs.replaceChildren(breadcrumbs.firstChild, breadcrumbs.children[1]);
        break;
    }
    srcXZ[0] = cam[0];
    srcXZ[1] = cam[2];
    trgXZ[0] = shapes[map.get(id).index].world[12] + offset[0];
    trgXZ[1] = shapes[map.get(id).index].world[14] + offset[1];
    gridDrag = false;
    panCamera();
  });
  const rootTxt = ["@", "help"];
  main.on("done", () => {
    if (picked[1] == -1 && picked[3] == -1) {
      breadcrumbs.replaceChildren(breadcrumbs.firstChild);
      return;
    }
    const a = [breadcrumbs.firstChild];
    for (const id of picked.slice(3)) {
      if (!map.has(id)) {
        continue;
      }
      const span = document.createElement("span");
      span.textContent = " \u21FE " + map.get(id)?.txt;
      span.dataset.id = id.toString();
      a.push(span);
    }
    const b = [breadcrumbs.firstChild];
    for (const id of picked.slice(1, 3)) {
      if (!map.has(id)) {
        continue;
      }
      const span = document.createElement("span");
      span.textContent = " \u21FE " + map.get(id)?.txt;
      span.dataset.id = id.toString();
      b.push(span);
    }
    breadcrumbs.replaceChildren(...b.length > 1 ? b : a);
  });
  let helpStarted = 0;
  const helpButton = document.querySelector("#canvas-box .control-box #help");
  helpButton.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (helpStarted) {
      return;
    }
    helpStarted = 1;
    for (let i = 1; i < shapes.length; i++) {
      if (i < 9) {
        shapes[i].display = "hidden";
        shapes[i].blur();
        shapes[i].hide();
      } else {
        shapes[i].display = "fixed";
        shapes[i].show();
        shapes[i].hide();
      }
    }
    breadcrumbs.firstElementChild.textContent = rootTxt[1];
    srcXZ[0] = cam[0];
    srcXZ[1] = cam[2];
    trgXZ[0] = shapes[map.get(HELP).index].world[12] + offset[0];
    trgXZ[1] = shapes[map.get(HELP).index].world[14] + offset[1];
    gridDrag = false;
    panCamera();
  });
  const canvasBox = document.querySelector("#canvas-box");
  canvasBox.addEventListener("animationend", () => {
  });
  function moveHand(x, y, z) {
    const hand = shapes[map.get(HAND).index];
    hand.world[12] = x;
    hand.world[13] = y;
    hand.world[14] = z;
    for (const child of hand) {
      if (child.type != 16 /* SHADOW */) {
        child.world[12] = hand.world[12];
        child.world[13] = hand.world[13];
        child.world[14] = hand.world[14];
        continue;
      }
      child.world[12] = hand.world[12];
      child.world[14] = hand.world[14];
    }
  }
  const handAmplitude = 25e-5;
  const handFrequency = 1.75;
  function animateHand() {
    const time = performance.now() / 1e3;
    const hand = shapes[map.get(HAND).index];
    for (const child of hand) {
      child.world[13] += child.type != 16 /* SHADOW */ ? Math.sin(time * handFrequency) * handAmplitude : 0;
    }
  }
  const helpHints = [
    "Click and drag the map to move it around",
    "Click an object to move to it",
    "Click an icon to view an infobox\n\nClick anywhere to close it",
    "Click the breadcrumbs to go back",
    "That's it!"
  ];
  const handWorlds = [
    shapes[map.get(HAND).index].world.translate(0, 0.08, 0),
    shapes[map.get(FIRST).index].world.translate(0, 0.15, 0),
    shapes[map.get(SECOND).index].world.translate(0, 0.225, 0.3714),
    new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      -1.1,
      0.5,
      1,
      1
    ]),
    new mat4([
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    ])
  ];
  const helpBox = document.querySelector("#canvas-box .help-box");
  main.on("done", () => {
    if (!helpStarted) {
      return;
    }
    animateHand();
    if (canvasBox.dataset.help != void 0) {
      return;
    }
    moveInfoBox(null, 0, infoBox);
    canvasBox.dataset.help = "1";
    helpBox.textContent = helpHints[helpStarted - 1];
    const world = handWorlds[helpStarted - 1];
    switch (helpStarted) {
      case 1:
      case 2: {
        moveHand(world[12], world[13], world[14]);
        setTimeout(() => {
          canvasBox.removeAttribute("data-help");
          helpStarted++;
        }, 9e3);
        break;
      }
      case 3: {
        picked[0] = HELP, picked[3] = FIRST, picked[4] = SECOND;
        const second = shapes[map.get(SECOND).index];
        second.focus();
        shapes[map.get(HELP).index].focus();
        shapes[map.get(FIRST).index].focus();
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = second.world[12] + offset[0];
        trgXZ[1] = second.world[14] + offset[1];
        panCamera();
        moveHand(world[12], world[13], world[14]);
        setTimeout(() => {
          canvasBox.removeAttribute("data-help");
          helpStarted++;
        }, 9e3);
        break;
      }
      case 4: {
        const shape = shapes[map.get(HAND).index];
        shape.display = "hidden";
        shape.blur();
        shape.hide();
        setTimeout(() => {
          canvasBox.removeAttribute("data-help");
          helpStarted++;
        }, 9e3);
        break;
      }
      case 5: {
        map.set(0, { txt: ids[0][1], index: ids[0][0] });
        breadcrumbs.firstElementChild.textContent = rootTxt[0];
        picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
        for (let i = 1; i < shapes.length - 1; i++) {
          if (i < 9) {
            shapes[i].display = "fixed";
            shapes[i].show();
            shapes[i].hide();
          } else {
            shapes[i].display = "hidden";
            shapes[i].blur();
            shapes[i].hide();
          }
        }
        for (const child of shapes[map.get(HAND).index]) {
          child.display = "inherit";
        }
        const root = shapes[map.get(ROOT).index];
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = root.world[12] + offset[0];
        trgXZ[1] = root.world[14] + offset[1];
        panCamera();
        setTimeout(() => {
          canvasBox.removeAttribute("data-help");
          helpStarted = 0;
        }, 4e3);
        break;
      }
    }
    if (helpStarted == 2) {
      for (const child of shapes[map.get(HAND).index]) {
        if (child.type == 16 /* SHADOW */) {
          continue;
        }
        child.display = "hidden";
        child.blur();
        child.hide();
      }
    }
  });
  const cloudStates = [0, 1, 2, 3, 4, 5, 6];
  let cloudState = cloudStates[0];
  let cloudDrag = false;
  let cloudTrigger = 0;
  let cloudTimer = 0;
  main.on("pointerdown", (e) => {
    e.preventDefault();
    if (e.id != CLOUD || cloudState != 0) {
      return;
    }
    const rnd = Math.random();
    let newState = 0;
    switch (true) {
      case rnd < 0.1:
      case cloudTrigger == 9:
        newState = cloudStates[5];
        cloudTrigger = 0;
        break;
      case rnd < 0.325:
        newState = cloudStates[1];
        break;
      case rnd < 0.55:
        newState = cloudStates[2];
        break;
      case rnd < 0.775:
        newState = cloudStates[3];
        break;
      case rnd < 1:
        newState = cloudStates[4];
        break;
    }
    gridDrag = false;
    cloudDrag = true;
    cloudTrigger++;
    cloudTimer = setTimeout(() => cloudState = 0, 300);
    requestAnimationFrame(() => {
      if (cloudState != 6) {
        cloudState = newState;
      }
    });
  });
  main.on("pointerup", (e) => {
    e.preventDefault();
    if (cloudState == cloudStates[6]) {
      cloudState = cloudStates[0];
    }
    cloudDrag = false;
  });
  main.on("pointermove", (e) => {
    if (!cloudDrag) {
      return;
    }
    e.preventDefault();
    clearInterval(cloudTimer);
    cloudState = cloudStates[6];
    const dx = e.clientX / canvas.width;
    const dz = e.clientY / canvas.height * 1.5;
    const cloud = shapes[map.get(CLOUD).index];
    cloud.world[12] += dx;
    cloud.world[14] -= dz;
    for (const child of cloud) {
      child.world[12] = cloud.world[12];
      child.world[14] = cloud.world[14];
    }
  });
  const cloudAmplitude = 5e-4;
  const cloudFrequency = 1;
  let cloudDelta = 5e-4;
  let cloudTurn = Math.random();
  main.on("done", () => {
    const cloud = shapes[map.get(CLOUD).index];
    if (cloudDelta > 0 && cloud.world[12] >= cloudTurn || cloudDelta < 0 && cloud.world[12] <= -cloudTurn) {
      cloudDelta = -cloudDelta;
      cloudTurn = Math.random();
    }
    const time = performance.now() / 1e3;
    cloud.world[12] += cloudDelta;
    for (const child of cloud) {
      child.world[12] = cloud.world[12];
      child.world[13] += child.type != 16 /* SHADOW */ ? Math.sin(time * cloudFrequency) * cloudAmplitude : 0;
    }
  });
})();
(function() {
  const portraitBox = document.querySelector("#footer #contact-box > *:first-child");
  const duration = 15e3;
  function switchPortrait() {
    let child = null;
    while ((child = !child ? portraitBox.firstElementChild : child.nextElementSibling).dataset.animate != "1")
      ;
    const next = child.nextElementSibling ?? portraitBox.firstElementChild;
    next.dataset.animate = "1";
    next.style.setProperty("display", "block");
    child.dataset.animate = "0";
  }
  let t = setInterval(switchPortrait, duration);
  portraitBox.addEventListener("pointerdown", () => {
    switchPortrait();
    clearInterval(t);
    t = setInterval(switchPortrait, duration);
  });
  portraitBox.childNodes.forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      return;
    }
    if (child == portraitBox.firstElementChild) {
      child.dataset.animate = "1";
    }
    child.addEventListener("animationend", () => {
      if (child.dataset.animate == "1") {
        return;
      }
      child.style.setProperty("display", "none");
    });
  });
  const obs = new IntersectionObserver(() => {
    clearInterval(t);
    t = setInterval(switchPortrait, duration);
    portraitBox.childNodes.forEach((child) => {
      if (!(child instanceof HTMLElement)) {
        return;
      }
      if (child == portraitBox.firstElementChild) {
        child.dataset.animate = "1";
        child.style.setProperty("display", "block");
      } else {
        child.dataset.animate = "0";
        child.style.setProperty("display", "none");
      }
    });
  }, {
    threshold: 0.5
  });
  obs.observe(portraitBox);
})();

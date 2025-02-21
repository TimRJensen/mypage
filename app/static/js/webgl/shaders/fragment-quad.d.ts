declare const _default: "#version 300 es\nprecision mediump float;\nin vec2 v_texcoord;\nout vec4 f_color;\n\nuniform sampler2D tex;\n\nvoid main() {\n    f_color = texture(tex, v_texcoord);\n}";
export default _default;

declare const _default: "#version 300 es\nin vec4 a_position;\nin vec2 a_texcoord;\nout vec2 v_texcoord;\n\nvoid main() {\n    v_texcoord = a_texcoord;\n    gl_Position = a_position;\n}";
export default _default;

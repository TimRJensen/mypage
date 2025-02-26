declare const _default: "#version 300 es\nprecision mediump float;\n\nin vec2 v_texcoord;\nout vec4 f_color;\n\nuniform sampler2D u_scene;\nuniform sampler2D u_blur;\n\nvoid main() {\n    vec3 scene = texture(u_scene, v_texcoord).rgb;\n    vec3 blur = texture(u_blur, v_texcoord).rgb;\n    f_color =  vec4(scene + blur*1.75, 1.0);\n}";
export default _default;

export default `#version 300 es
precision mediump float;

in vec2 v_uv;
out vec4 f_color;

uniform sampler2D u_scene;
uniform sampler2D u_blur;

void main() {
    vec3 scene = texture(u_scene, v_uv).rgb;
    vec3 blur = texture(u_blur, v_uv).rgb;
    f_color =  vec4(scene + blur*1.2, 1.0);
}`;

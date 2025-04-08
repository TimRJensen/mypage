export default `#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D u_scene;
uniform sampler2D u_blur;

void main() {
    vec3 scene = texture(u_scene, v_texcoord).rgb;
    vec3 blur = texture(u_blur, v_texcoord).rgb;
    f_color =  vec4(scene + blur * 1.75, 1.0);
}`;

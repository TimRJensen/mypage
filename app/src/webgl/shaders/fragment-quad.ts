export default `#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D tex;

void main() {
    f_color = texture(tex, v_texcoord);
}`;

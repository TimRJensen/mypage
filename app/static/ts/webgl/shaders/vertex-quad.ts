export default `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = a_position;
}`;

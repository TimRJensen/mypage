export default `#version 300 es
precision mediump float;

layout(location=0) in vec3 a_position;
layout(location=1) in vec2 a_uv;

out vec2 v_uv;

uniform mat4 u_project;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
    gl_Position = u_project*u_view*u_world*vec4(a_position, 1.0);
    v_uv = a_uv;
}
`;

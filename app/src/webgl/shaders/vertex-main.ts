export default `#version 300 es
precision highp float;
precision highp int;

layout(location=0) in vec3 a_position;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec3 a_normal;

out vec2 v_uv;
out vec3 v_view_normal;
out vec3 v_view_pos;
out vec3 v_view_light;

uniform int u_type;
uniform mat4 u_project;
uniform mat4 u_world;
uniform mat4 u_view;
uniform mat3 u_view_normal;

void main() {
    gl_Position = u_project*u_view*u_world*vec4(a_position, 1.0);
    v_uv = a_uv;

    if ((u_type&0x2) == 0x2) {
        v_view_normal = u_view_normal*a_position;
    } else {
        v_view_normal = u_view_normal*a_normal;
    }
    v_view_pos = vec3(u_view*u_world*vec4(a_position, 1.0));
}`;

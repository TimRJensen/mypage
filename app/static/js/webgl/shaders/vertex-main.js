export default `#version 300 es
precision highp float;
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
uniform mat4 u_inverse_transpose;

uniform vec3 u_light_dir;

void main() {
    gl_Position = u_vpm*u_model*vec4(a_position, 1.0);
    v_uv = a_uv;

    if ((u_type&0x2) == 2) {
        v_brightness = max(dot(u_light_dir, normalize(mat3(u_model)*a_position)), 0.0);
    } else {
        v_brightness = max(dot(u_light_dir, normalize(mat3(u_vpm*u_model)*a_normal)), 0.0);
    }
}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVydGV4LW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy93ZWJnbC9zaGFkZXJzL3ZlcnRleC1tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGVBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUE0QmIsQ0FBQyJ9
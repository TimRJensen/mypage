export default `#version 300 es
precision mediump float;
precision mediump int;
precision mediump sampler2DArray;

in vec2 v_uv;

uniform int u_type;
uniform int u_id;
uniform int u_depth;
uniform sampler2DArray u_sampler;

layout(location=2) out int f_id;

void main() {
    if ((u_type&0x10) == 0x10) {
        discard;
    }

    if ((u_type&0x1) == 0x1) {
        vec4 color = texture(u_sampler, vec3(v_uv, float(u_depth)));
        if (color.a < 0.1) { 
            discard;
        }
    }

    f_id = u_id;
}`;

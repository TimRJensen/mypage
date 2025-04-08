export default `#version 300 es
precision mediump float;
precision mediump int;
precision mediump sampler2DArray;

in vec2 v_uv;
in float v_brightness;

layout(location=0) out vec4 f_color;
layout(location=1) out vec4 f_threshold;
layout(location=2) out int f_id;

uniform int u_type;
uniform int u_id;
uniform int u_picked[5];
uniform vec3 u_color;
uniform vec3 u_pick_color;
uniform sampler2DArray u_sampler;
uniform int u_depth;

void main() {
    if ((u_type&0x1) == 0x1) {
        f_color = texture(u_sampler, vec3(v_uv, float(u_depth)));
        f_threshold = vec4(0.0, 0.0, 0.0, 0.0);
        f_id = u_id;
        return;
    }

    vec3 color = u_color/255.0;
    vec3 threshold = vec3(0.0, 0.0, 0.0);

    if ((u_type&0x8) == 0x8) {
        f_color = vec4(1.0, 0.0, 0.0, 0.0);
        f_threshold = vec4(threshold, 0.0);
        f_id = u_id;
        return;
    }

    if ((u_type&0x10) == 0x10) {
        f_color = vec4(color, 0.2);
        f_threshold = vec4(threshold, 0.0);
        f_id = u_id;
        return;
    }

    for (int i = 0; i < 5; i++) {
        if (u_id != u_picked[i]) {
            continue;
        }
        color = u_pick_color.rgb/255.0;
        f_color = vec4(color, 1.0);
        f_threshold = vec4(color, 1.0);
        f_id = u_id;
        return;
    }

    f_color = vec4(color*0.4 + 0.7*color*v_brightness, 1.0);
    f_threshold = vec4(threshold, 1.0);
    f_id = u_id;
}`;

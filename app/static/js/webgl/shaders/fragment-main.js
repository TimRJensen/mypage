export default `#version 300 es
precision highp float;
precision mediump int;
precision mediump sampler2DArray;

in vec2 v_uv;
in float v_brightness;

layout(location=0) out vec4 f_color;
layout(location=1) out vec4 f_threshold;
layout(location=2) out int f_id;

uniform int u_type;
uniform int u_id;
uniform int u_picked[6];
uniform vec3 u_color;
uniform vec3 u_pick_color;

void main() {
    vec3 color = u_color/255.0;
    vec3 threshold = vec3(0.0, 0.0, 0.0);

    if ((u_type&0x6) == 0x6) {
        f_color = vec4(color, 0.2);
        f_threshold = vec4(threshold, 1.0);
        f_id = u_id;
        return;
    }

    for (int i = 0; i < 6; i++) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhZ21lbnQtbWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3RzL3dlYmdsL3NoYWRlcnMvZnJhZ21lbnQtbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxlQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBMkNiLENBQUMifQ==
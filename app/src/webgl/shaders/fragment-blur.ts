export default `#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D u_blur;
uniform int u_mode; // 0 == horizontal, 1 == vertical

const float weight[5] = float[] (0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);

void main() {
    vec2 texel = 1.0/vec2(textureSize(u_blur, 1));
    vec3 result = texture(u_blur, v_texcoord).rgb*weight[0];

    if (u_mode == 0) {
        for (int i = 1; i < 5; ++i) {
            result += texture(u_blur, v_texcoord + vec2(texel.x*float(i), 0.0)).rgb*weight[i];
            result += texture(u_blur, v_texcoord - vec2(texel.x*float(i), 0.0)).rgb*weight[i];
        }
    } else {
        for (int i = 1; i < 5; ++i) {
            result += texture(u_blur, v_texcoord + vec2(0.0, texel.y*float(i))).rgb*weight[i];
            result += texture(u_blur, v_texcoord - vec2(00., texel.y*float(i))).rgb*weight[i];
        }
    }

    f_color = vec4(result, 1.0);
}`;

export default `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

in vec2 v_uv;
in vec3 v_view_normal;
in vec3 v_view_pos;

layout(location=0) out vec4 f_color;
layout(location=1) out vec4 f_bloom;

// Colored objects
uniform int u_type;
uniform int u_picked;
uniform vec3 u_color;
uniform vec3 u_light;

// Textured objects
uniform sampler2DArray u_sampler;
uniform int u_depth;

void main() {
    if ((u_type&0x1) == 0x1) {
        vec4 color = texture(u_sampler, vec3(v_uv, float(u_depth)));
        f_color = color;
        f_bloom = vec4(0.0);
        if (f_color.a < 0.1) {
            discard;
        }
        return;
    }

    vec4 color = vec4(u_color/255.0, 1.0);
    vec4 bloom = vec4(0.0);
    
    if ((u_type&0x4) == 0x4 || (u_type&0x2) == 0x2) {
        // Lightning
        vec3 pos = normalize(v_view_pos);
        vec3 normal = normalize(v_view_normal);
        // Diffuse
        vec3 light_dir = normalize(-u_light);
        float diffuse = max(dot(normal, light_dir), 0.0);
        // Specular
        vec3 reflect_dir = reflect(-light_dir, normal);
        float specular = pow(max(dot(pos, reflect_dir), 0.0), 32.0);
        color = vec4((0.33 + diffuse + specular)*color.rgb, 1.0);
    }

    if ((u_type&0x8) == 0x8) {
        color.a = 0.0;
    }

    if ((u_type&0x10) == 0x10) {
        color.a = 0.2;
    }

    if (u_picked == 1) {
        bloom = vec4(u_color/255.0, 1.0);
    }

    f_color = color;
    f_bloom = bloom;
}`;

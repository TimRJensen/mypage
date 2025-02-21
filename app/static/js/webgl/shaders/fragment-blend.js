export default `#version 300 es
precision mediump float;

in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D u_scene;
uniform sampler2D u_blur;

void main() {
    vec3 scene = texture(u_scene, v_texcoord).rgb;
    vec3 blur = texture(u_blur, v_texcoord).rgb;
    f_color = vec4(scene + blur*1.5, 1.0);
}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhZ21lbnQtYmxlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy93ZWJnbC9zaGFkZXJzL2ZyYWdtZW50LWJsZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGVBQWU7Ozs7Ozs7Ozs7Ozs7RUFhYixDQUFDIn0=
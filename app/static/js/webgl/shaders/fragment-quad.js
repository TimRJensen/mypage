export default `#version 300 es
precision mediump float;
in vec2 v_texcoord;
out vec4 f_color;

uniform sampler2D tex;

void main() {
    f_color = texture(tex, v_texcoord);
}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhZ21lbnQtcXVhZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3RzL3dlYmdsL3NoYWRlcnMvZnJhZ21lbnQtcXVhZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxlQUFlOzs7Ozs7Ozs7RUFTYixDQUFDIn0=
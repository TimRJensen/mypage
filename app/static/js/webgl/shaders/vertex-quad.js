export default `#version 300 es
in vec4 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = a_position;
}`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmVydGV4LXF1YWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90cy93ZWJnbC9zaGFkZXJzL3ZlcnRleC1xdWFkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGVBQWU7Ozs7Ozs7O0VBUWIsQ0FBQyJ9
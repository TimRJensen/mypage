import {Shape, createGrid, Node} from "./webglgeometry.js";
import {Picker, Program} from "./webgl.js";

/**
 * Handle transition
 */
(function () {
    const msgs = document.querySelector<HTMLDivElement>("#msg-box")!;
    document.querySelector<HTMLButtonElement>("#msg-box .msg .button")!
        .addEventListener("pointerdown", () => {
            document.querySelector<HTMLDivElement>("#content")!
            .scrollTo({left: 0, top: msgs.clientHeight, behavior: "smooth"});
    }, {once: true});
}());

/**
 * Setup WebGL2 - references:
 * https://webgl2fundamentals.org/webgl/lessons/webgl-fundamentals.html
 * https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
 */
(function () {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas-box #canvas")!;
    const gl = canvas.getContext("webgl2", {antialias: true})!;

    if (!gl) {
        console.error("WebGL2 not supported");
        return;
    }
    
    // Define shaders
    const svs = `#version 300 es
        precision mediump float;

        layout (location = 0) in vec3 a_position;
        layout (location = 1) in vec4 a_color;
        out vec4 frag_color;

        uniform mat4 u_world;
        uniform mat4 u_vp;

        void main() {
            frag_color = a_color;
            gl_Position = u_vp*u_world*vec4(a_position, 1.0);
        }
    `;
    const sfs = `#version 300 es
        precision highp float;

        in vec4 frag_color;
        out vec4 out_color;

        void main() {
            out_color = frag_color;
        }
    `;
    const pvs = `#version 300 es
        layout (location = 0) in vec3 a_position;
 
        uniform mat4 u_vp;

        void main() {
            gl_Position = u_vp*vec4(a_position, 1.0);
        }
    `;
    const pfs = `#version 300 es
        precision highp float;
 
        uniform vec4 u_id;
        out vec4 out_color;

        void main() {
            out_color = u_id;
        }
     `;
    // Attach shaders, link program & use it.
    const main = new Program(
        canvas,
        gl,
        new Map(
            [["a_position", [3, Float32Array.BYTES_PER_ELEMENT]],
            ["a_color", [4, Float32Array.BYTES_PER_ELEMENT]]
        ]),
        new Map([
            ["vp", (program, data) => gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_vp"), false, data)],
            ["world", (program, data) => gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_world"), false, data)],
        ]),
        svs, 
        sfs,
    );
    const pick = new Picker(
        canvas,
        gl,
        new Map([["a_position", [3, Float32Array.BYTES_PER_ELEMENT]]]),
        new Map([
            ["vp", (program, data) => gl.uniformMatrix4fv(gl.getUniformLocation(program, "u_vp"), false, data)],
            ["id", (program, data) => gl.uniform4fv(gl.getUniformLocation(program, "u_id"), data)],
        ]),
        pvs, 
        pfs,
    );
    const shapes = [
        new Node(gl, [0, -0.9, 0.035], [0, -0.9, 0.035]),
        new Node(gl, [-0.3, -0.7, 0.035], [0, -0.9, 0.035]),
        new Node(gl, [0.3, -0.7, 0.035], [0, -0.9, 0.035]),
        new Node(gl, [0, -0.5, 0.035],[0, -0.9, 0.035]),
        new Node(gl, [-0.2, -0.2, 0.035], [0, -0.5, 0.035]),
        new Node(gl, [0.2, -0.2, 0.035], [0, -0.5, 0.035]),
        new Node(gl, [0, -0.1, 0.035], [0, -0.5, 0.035]),
        new Shape(
            gl,
            gl.LINES,
            createGrid(1, 1, 0.1, [160, 117, 206]),
            7,
        ),
 
    ];
    pick.setShapes(shapes);
    main.setShapes(shapes);
    main.setClearColor(102, 51, 153);
    main.draw();

    // Handle dragging
    let dragging = false;
    let lastX = 0, lastY = 0;
    canvas.addEventListener("pointermove", (e) => {
        if (dragging) {
            if ((main.x > -0.90 && e.movementX >= 0) || (main.x < 0.90 && e.movementX <= 0)) {
                main.x -= (e.clientX - lastX)/canvas.width;
            }
            if ((main.y > -1.5 && e.movementY >= 0) || (main.y < 0.2 && e.movementY <= 0)) {
                main.y -= (e.clientY - lastY)/canvas.height;
            }
            lastX = e.clientX;
            lastY = e.clientY;
            main.draw();

            return;
        }

        const rect = canvas.getBoundingClientRect();
        pick.x = e.clientX - rect.left;
        pick.y = e.clientY - rect.top;

        // pick.draw();
        // main.draw();
    });
    canvas.addEventListener("pointerup", () => dragging = false);
    canvas.addEventListener("pointerleave", () => dragging = false);

    // Handle click
    canvas.addEventListener("pointerdown", (e) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    // Handle recenter
    document.querySelector<HTMLButtonElement>("#canvas-box #center")!
        .addEventListener("pointerdown", () => {
            main.x = 0;
            main.y = 0;
            main.draw();
        });

    // Handle help
    const msg = document.querySelector<HTMLDivElement>("#canvas-box .msg")!;
    let stage = -1;
    let lastTick = performance.now();
    function loop() {
        if (stage === -1) {}

        const now = performance.now();
        requestAnimationFrame(loop);
    }
    
    const box = document.querySelector<HTMLDivElement>("#canvas-box")!;
    box.addEventListener("pointerdown", (e) => {
        (e.target as HTMLButtonElement).dataset["help"] = "1";
        msg.textContent = "Drag to move the map.";
    });
    box.addEventListener("animationend", (e) => {

    });


}())

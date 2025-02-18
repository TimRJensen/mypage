import { mat4, vec3 } from "./linalg.js";
import { Program } from "./webgl/core.js";
import { PointerPlugin } from "./webgl/plugins/pointer.js";
import { BloomPlugin } from "./webgl/plugins/bloom.js";
import { Grid, /*Composite, AtlasPlane,*/ Node, Edge /*, Icon*/ } from "./webgl/geometry.js";
/**
 * Handle transition
 */
(function () {
    document.querySelector("#msg-box .msg .button")
        .addEventListener("pointerdown", () => {
        document
            .querySelector("#canvas-box")
            .scrollIntoView({ behavior: "smooth" });
    }, { once: true });
}());
/**
 * WebGL2 stuff
 */
(function () {
    const canvas = document.querySelector("#canvas-box #canvas");
    // Shapes
    const shapes = [
        // Grid
        new Grid(2, 1, 2 / 15, { id: 0, display: "fixed", color: [160, 117, 206] }),
        // Root
        new Node({ id: 1, pos: [0.0, 0.04, -0.84] }),
        new Edge([-0.315, 0.04, -0.63], [0.0, 0.04, -0.84], { pos: [0.0, 0.0925, -0.84] }),
        new Node({ id: 2, pos: [-0.315, 0.04, -0.63] }),
        new Edge([0.315, 0.04, -0.63], [0.0, 0.04, -0.84], { pos: [0.0, 0.0925, -0.84] }),
        new Node({ id: 3, pos: [0.315, 0.04, -0.63] }),
        // Personal skills
        // new Composite({id: 2, x: -0.315, z: -0.63, shapes: [
        //     new Node({y: 0.04}),
        //     new Edge([-0.315, 0.04, -0.63], [0, 0.04, -0.84], {}),
        //     new Composite({visible: 0, shapes: [
        //         // Critical thinking
        //         new Composite({id: 50, display: "fixed", x: -0.315, z: 0.105, shapes: [
        //             new AtlasPlane(2, {tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
        //         ]}),
        //         // Analytical thinking
        //         new Composite({id: 51, display: "fixed", x: -0.525, y: 0.005, z: 0.21, shapes: [
        //             new AtlasPlane(0, {tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
        //         ]}),
        //         // Communication
        //         new Composite({id: 52, display: "fixed", x: -0.21, z: 0.21, shapes: [
        //             new AtlasPlane(1, {tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
        //         ]}),
        //         // Organization
        //         new Composite({id: 53, display: "fixed", x: -0.42, y: 0.005, z: 0.315, shapes: [
        //             new AtlasPlane(3, {tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
        //         ]}),
        //     ]}),
        // ]}),
        // Projects
        // new Composite({id: 3, x: 0.315, z: -0.63, shapes: [
        //     new Node({y: 0.04}),
        //     new Edge([0.315, 0.04, -0.63], [0, 0.04, -0.84], {y: 0.04}),
        // ]}),
        //Technical skills
        // new Composite( {id: 4, x: 0, z: -0.42, shapes: [
        //     new Node( {y: 0.04}),
        //     new Edge( [0, 0.04, -0.42], [0, 0.04, -0.84], {y: 0.04}),
        // ]}),
        // // Technical skills - Backend
        // new Composite({id: 5, x: -0.315, shapes: [
        //     new Node({y: 0.04}),
        //     new Edge([-0.315, 0.04, 0], [0, 0.04, -0.42], {y: 0.04}),
        //     new Composite( {visible: 0, shapes: [
        //         // NodeJS
        //         new Icon(11, 11, {id: 100, y: 0.04, z: 0.315}),
        //         // Deno
        //         new Icon(18, 3, {id: 101, x: -0.0991, y: 0.04, z: 0.2990}),
        //         // NextJS
        //         new Icon(19, 10, {id: 102, x: -0.1881, y: 0.04, z: 0.2527}),
        //         // PSQL
        //         new Icon(12, 12, {id: 103, x: -0.2580, y: 0.04, z: 0.1807}),
        //         // Docker
        //         new Icon(4, 4, {id: 104, x: -0.3018, y: 0.04, z: 0.103}),
        //         // Git
        //         new Icon(6, 6, {id: 105, x: -0.3149, y: 0.04, z: 0.0092}),
        //     ]}),
        // ]}),
        // Technical skills - Frontend
        // new Composite({id: 6, z: 0.105, shapes: [
        //     new Node({y: 0.04}),
        //     new Edge([0, 0.04, 0.105], [0, 0.04, -0.42], {y: 0.04}),
        //     new Composite({visible: 0, shapes: [
        //         // TS
        //         new Icon(15, 15, {id: 200, y: 0.04, x: 0.26, z: 0.11}),
        //         // JS
        //         new Icon(9, 9, {id: 201, y: 0.04, x: 0.20, z: 0.21}),
        //         // React
        //         new Icon(14, 14, {id: 202, y: 0.04, x: 0.11, z: 0.29}),
        //         // Vue
        //         new Icon(16, 16, {id: 203, y: 0.04, z: 0.32}),
        //         // HTML
        //         new Icon(8, 8, {id: 204, y: 0.04, x: -0.11, z: 0.2901}),
        //         // CSS
        //         new Icon(2, 2, {id: 205, y: 0.04, x: -0.20, z: 0.21}),
        //         // WASM
        //         new Icon(20, 17, {id: 206, y: 0.04, x: -0.26, z: 0.11}),
        //     ]}),
        // ]}),
        // Technical skills - All purpose
        // new Composite({id: 7, x: 0.315, shapes: [
        //     new Node({y: 0.04}),
        //     new Edge([0.315, 0.04, 0], [0, 0.04, -0.42], {y: 0.04}),
        //     new Composite({visible: 0, shapes: [
        //         // C
        //         new Icon(0, 0, {id: 301, y: 0.04, x: 0.011, z: 0.3148}),
        //         // C#
        //         new Icon(1, 1, {id: 302, y: 0.04, x: 0.1281, z: 0.2878}),
        //         // F#
        //         new Icon(5, 5, {id: 303, y: 0.04, x: 0.2266, z: 0.2188}),
        //         // Python
        //         new Icon(13, 13, {id: 304, y: 0.04, x: 0.2921, z: 0.1180}),
        //         // Go
        //         new Icon(7, 7, {id: 305, y: 0.04, x: 0.3150}),
        //     ]}),
        // ]}),
    ];
    // Breadcumbs - order mattters. Index in msgs == index in shapes
    const msgs = [
        "@", // Root
        "contact",
        "personal skills",
        "projects",
        "technical skills",
        "backend",
        "frontend",
        "all purpose",
    ];
    // Shaders
    const vs = `#version 300 es
        precision highp float;
        precision mediump int;

        layout(location=0) in vec3 a_position;
        layout(location=1) in vec2 a_uv;
        layout(location=2) in vec3 a_normal; // normal || texcoord

        out vec3 v_position;
        out vec2 v_uv;
        out vec3 v_normal;

        uniform int u_type;
        uniform mat4 u_vpm;
        uniform mat4 u_model;

        void main() {
            gl_Position = u_vpm*u_model*vec4(a_position, 1.0);
            v_position = gl_Position.xyz;
            v_uv = a_uv;
            v_normal = a_normal;
        }
    `;
    const fs = `#version 300 es
        precision highp float;
        precision mediump int;
        precision mediump sampler2DArray;

        in vec3 v_position;
        in vec2 v_uv;
        in vec3 v_normal;

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

            if ((u_type&0xF) == 0x4) {
                f_color = vec4(color, 0.2);
                f_threshold = vec4(threshold, 1.0);
                f_id = 0;
                return;
            }
        
            for (int i = 0; i < 6; i++) {
                if (u_id == u_picked[i]) {
                    color = u_pick_color.rgb/255.0;
                    threshold = color;
                    break;
                }
            }

            f_color = vec4(color, 1.0);
            f_threshold = vec4(threshold, 1.0);
            f_id = u_id;
        }
    `;
    // Viewprojection matrix
    // https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
    const vpm = mat4
        .perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 5)
        .mul(mat4.lookAt(new vec3(0.2, 0.4, -1.45), new vec3(0, 0, 0), new vec3(0, 1, 0)));
    // Create the WebGL program.
    const main = new Program(canvas, shapes.slice(0, 6), vs, fs, {
        color: [102, 51, 153, 1],
        attrs: {
            a_position: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 },
            a_uv: { type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4 },
            a_normal: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 },
        },
        textures: {
        // "/static/imgs/logos.png": {
        //     idx: 0,
        //     width: 128,
        //     height: 128,
        //     depth: 21,
        // },
        },
    });
    main.plugins.push(new BloomPlugin(canvas, shapes, main), new PointerPlugin(canvas, shapes, main));
    main.render({
        u_vpm: vpm,
        u_light_position: new vec3(0.2, 1, -1),
        u_picked: new Int32Array([-1, -1, -1, -1, -1, -1]),
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_color: (shape) => shape.color,
        u_pick_color: (shape) => shape.pick_color,
    });
    // Handle drag
    const xz = [0, 0], lastXZ = [0, 0];
    let dragging = false;
    let pointer = 0;
    canvas.addEventListener("pointermove", (e) => {
        if (!dragging) {
            return;
        }
        e.preventDefault();
        if ((xz[0] > -0.90 && e.movementX <= 0) || (xz[0] < 0.90 && e.movementX >= 0)) {
            xz[0] += (e.clientX - lastXZ[0]) / canvas.width;
        }
        if ((xz[1] > -1.5 && e.movementY >= 0) || (xz[1] < 0.5 && e.movementY <= 0)) {
            xz[1] -= (e.clientY - lastXZ[1]) / canvas.height;
        }
        main.drawInfo.u_vpm = vpm.translate(xz[0], 0.0, xz[1]);
        lastXZ[0] = e.clientX;
        lastXZ[1] = e.clientY;
    }, { passive: false });
    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();
        if (!pointer) {
            return;
        }
        canvas.releasePointerCapture(pointer);
        dragging = false;
        pointer = 0;
    }, { passive: false });
    canvas.addEventListener("pointerleave", (e) => {
        e.preventDefault();
        if (!pointer) {
            return;
        }
        canvas.releasePointerCapture(pointer);
        dragging = false;
        pointer = 0;
    }, { passive: false });
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        lastXZ[0] = e.clientX;
        lastXZ[1] = e.clientY;
        canvas.setPointerCapture(e.pointerId);
        dragging = true;
        pointer = e.pointerId;
    }, { passive: false });
    // Handle pick
    const picked = new Int32Array([-1, -1, -1, -1, -1, -1]);
    const lastShape = [shapes[1], shapes[1]];
    main.on("pointermove", (e) => {
        if (e.id == 0) {
            picked[0] = shapes[1].isFocused() ? 1 : -1, picked[1] = -1, picked[2] = -1;
            main.drawInfo.u_picked = picked;
            // shapes[4].hoverOut();
            // shapes[4].hide();
            lastShape[0].hoverOut();
            lastShape[0].hide();
            return;
        }
        lastShape[0].hoverOut();
        lastShape[0].hide();
        switch (e.shape.id) {
            case 5:
            case 6:
            case 7:
                picked[0] = 1, picked[1] = 4, picked[2] = e.id;
                main.drawInfo.u_picked = picked;
                e.shape.show();
                e.shape.hoverIn();
                shapes[4].show();
                shapes[4].hoverIn();
                break;
            default:
                picked[0] = 1, picked[1] = e.id, picked[2] = -1;
                ;
                main.drawInfo.u_picked = picked;
                e.shape.show();
                e.shape.hoverIn();
        }
        lastShape[0] = e.shape;
    });
    const srcXZ = [0.2, -1.35];
    const trgXZ = [0, 0];
    let time = -1;
    // pointerPlugin.on("pointerdown", (e) => {
    //     if (e.id == 0) {
    //         picked[5] = -1;
    //         main.drawInfo.u_picked = picked;
    //         lastShape[1].blur();
    //         lastShape[1].hide();
    //         return;
    //     }
    //     for (const shape of shapes) {
    //         for (const child of shape) {
    //             if (child.isFocused()) {
    //                 child.blur();
    //                 child.hide();
    //             }
    //         }
    //         shape.blur();
    //         shape.hide();
    //     }
    //     switch (e.shape.id) {
    //         case 5: case 6: case 7:
    //             picked[0] = 1, picked[3] = 4, picked[4] = e.id, picked[5] = -1;
    //             shapes[4].focus();
    //             shapes[4].show();
    //             shapes[1].focus();
    //             time = performance.now();
    //             break;
    //         case 100: case 101: case 102: case 103: case 104: case 105: 
    //         case 200: case 201: case 202: case 203: case 204: case 205: case 206:
    //         case 300: case 301: case 302: case 303: case 304: case 305: {
    //             picked[0] = 1, picked[3] = 4, picked[4] = e.composite.id, picked[5] = e.id;
    //             shapes[4].focus();
    //             shapes[4].show();
    //             lastShape[1] = e.shape;
    //             break;
    //         }
    //         case 2:
    //             picked[0] = 1, picked[3] = 2, picked[4] = -1, picked[5] = -1;
    //             shapes[2].focus();
    //             shapes[2].show();
    //             shapes[1].focus();
    //             time = performance.now();
    //             break;
    //         case 50: case 51: case 52: case 53: {
    //             picked[0] = 1, picked[3] = 2, picked[4] = e.id;
    //             shapes[2].focus();
    //             shapes[2].show();
    //             lastShape[1] = e.shape;
    //             break;
    //         }
    //         default: {
    //             picked[0] = 1, picked[3] = e.id, picked[4] = -1, picked[5] = -1;
    //             shapes[1].focus();
    //             time = performance.now();
    //         }
    //     }
    //     main.drawInfo.u_picked = picked;
    //     e.shape.focus();
    //     e.shape.show();
    //     e.composite.focus();
    //     e.composite.show();
    //     const dx = srcXZ[0] - e.composite.world[12];
    //     const dz = srcXZ[1] - e.composite.world[14];
    //     xz[0] = e.composite.world[12]; xz[1] = e.composite.world[14];
    //     trgXZ[0] = e.composite.world[12]; trgXZ[1] = e.composite.world[14];
    //     lastXZ[0] = (xz[0] + 1.0)*canvas.width/2; lastXZ[1] = (1.0 - xz[0])*canvas.height/2;
    // });
    // Handle breadcrumbs
    const breadcrumbs = document.querySelector("#canvas-box .breadcrumbs");
    main.on("done", () => {
        breadcrumbs.textContent = "";
        let a = "", b = "";
        for (const shape of shapes.slice(2)) {
            if (shape.isFocused()) {
                a += " \u21FE " + msgs[shape.id];
            }
        }
        for (const shape of shapes) {
            if (shape.isHovered()) {
                b += " \u21FE " + msgs[shape.id];
            }
        }
        breadcrumbs.textContent = msgs[0] + (b.length > 0 ? b : a);
        if (time < 0) {
            return;
        }
        const dt = performance.now() - time;
        const alpha = Math.min(1.0, dt / 250);
        if (alpha >= 1.0) {
            srcXZ[0] = trgXZ[0] - 0.0525;
            srcXZ[1] = trgXZ[1] - 0.525;
            return;
        }
        main.drawInfo.u_vp = mat4
            .perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 1000)
            .mul(mat4.lookAt(new vec3(srcXZ[0] + (trgXZ[0] - srcXZ[0] - 0.02625) * alpha, 0.25, srcXZ[1] + (trgXZ[1] - srcXZ[1] - 0.525) * alpha), new vec3(trgXZ[0], 0, trgXZ[1] + 1.35), new vec3(0, 1, 0)));
    });
    // Handle recenter
    document.querySelector("#canvas-box #center").addEventListener("pointerdown", () => {
        // Rest drag
        xz[0] = lastXZ[0] = 0;
        xz[1] = lastXZ[1] = 0;
        // Reset pick
        picked[0] = -1, picked[1] = -1, picked[2] = -1;
        picked[3] = -1, picked[4] = -1, picked[5] = -1;
        for (const shape of shapes) {
            if (shape.isFocused()) {
                shape.blur();
                shape.hide();
            }
        }
        // Reset view
        trgXZ[0] = -0.2;
        trgXZ[1] = -0.82;
        time = performance.now();
    });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEMsT0FBTyxFQUFDLGFBQWEsRUFBcUIsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFDLElBQUksRUFBRSwwQkFBMEIsQ0FBQyxJQUFJLEVBQUcsSUFBSSxDQUFBLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBRTNGOztHQUVHO0FBQ0gsQ0FBQztJQUNHLFFBQVEsQ0FBQyxhQUFhLENBQW9CLHVCQUF1QixDQUFFO1NBQzlELGdCQUFnQixDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDbEMsUUFBUTthQUNILGFBQWEsQ0FBaUIsYUFBYSxDQUFFO2FBQzdDLGNBQWMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUMsRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFTDs7R0FFRztBQUNILENBQUM7SUFDRyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFvQixxQkFBcUIsQ0FBRSxDQUFDO0lBQ2pGLFNBQVM7SUFDVCxNQUFNLE1BQU0sR0FBRztRQUNYLE9BQU87UUFDUCxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBQyxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFB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
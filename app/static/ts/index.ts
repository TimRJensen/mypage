import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, /*Composite, AtlasPlane,*/ Node,  Edge/*, Icon*/} from "./webgl/geometry.js";

/**
 * Handle transition
 */
(function () {
    document.querySelector<HTMLButtonElement>("#msg-box .msg .button")!
        .addEventListener("pointerdown", () => {
            document
                .querySelector<HTMLDivElement>("#canvas-box")!
                .scrollIntoView({behavior: "smooth"});
    }, {once: true});
}());

/**
 * WebGL2 stuff
 */
(function () {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas-box #canvas")!;
    // Shapes
    const shapes = [
        // Grid
        new Grid(2, 1, 2/15, {id: 0, display: "fixed", color: [160, 117, 206]}),
        // Root
        new Node({id: 1, pos: [0.0, 0.04, -0.84]}),
        new Edge([-0.315, 0.04, -0.63], [0.0, 0.04, -0.84], {pos: [0.0, 0.0925, -0.84]}),
        new Node({id: 2, pos: [-0.315, 0.04, -0.63]}),
        new Edge([0.315, 0.04, -0.63], [0.0, 0.04, -0.84], {pos: [0.0, 0.0925, -0.84]}),
        new Node({id: 3, pos: [0.315, 0.04, -0.63]}),

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
        .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 5)
        .mul(mat4.lookAt(new vec3(0.2, 0.4, -1.45), new vec3(0, 0, 0), new vec3(0, 1, 0)));

    // Create the WebGL program.
    const main = new Program(canvas, shapes.slice(0, 6), vs, fs, {
        color: [102, 51, 153, 1],
        attrs: {
            a_position: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
            a_uv: {type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4},
            a_normal: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
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
    main.plugins.push(
        new BloomPlugin(canvas, shapes, main),
        new PointerPlugin(canvas, shapes, main),
    );

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
            xz[0] += (e.clientX - lastXZ[0])/canvas.width;
        }
        if ((xz[1] > -1.5 && e.movementY >= 0) || (xz[1] < 0.5 && e.movementY <= 0)) {
            xz[1] -= (e.clientY - lastXZ[1])/canvas.height;
        }

        main.drawInfo.u_vpm = vpm.translate(xz[0], 0.0, xz[1]);
        lastXZ[0] = e.clientX;
        lastXZ[1] = e.clientY;
    },
        {passive: false}
    );
    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();

        if (!pointer) {
            return;
        }

        canvas.releasePointerCapture(pointer);
        dragging = false
        pointer = 0;
    },
        {passive: false}
    );
    canvas.addEventListener("pointerleave", (e) => {
        e.preventDefault();

        if (!pointer) {
            return;
        }

        canvas.releasePointerCapture(pointer);
        dragging = false
        pointer = 0;
    },
        {passive: false}
    );
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        lastXZ[0] = e.clientX;
        lastXZ[1] = e.clientY ;
        canvas.setPointerCapture(e.pointerId);

        dragging = true;
        pointer = e.pointerId;
    },
        {passive: false}
    );

    // Handle pick
    const picked = new Int32Array([-1, -1, -1, -1, -1, -1]);
    const lastShape = [shapes[1], shapes[1]];
    main.on("pointermove", (e: PointerPluginEvent) => {
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
            case 5: case 6: case 7:
                picked[0] = 1, picked[1] = 4, picked[2] = e.id;
                main.drawInfo.u_picked = picked;
                e.shape.show();
                e.shape.hoverIn();
                shapes[4].show();
                shapes[4].hoverIn();
                break;
            default:
                picked[0] = 1, picked[1] = e.id, picked[2] = -1;;
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
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
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
        const alpha = Math.min(1.0, dt/250);
        if (alpha >= 1.0) {
            srcXZ[0] = trgXZ[0] - 0.0525;
            srcXZ[1] = trgXZ[1] - 0.525;
            return;
        }

        main.drawInfo.u_vp = mat4
            .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 1000)
            .mul(mat4.lookAt(
                new vec3(
                    srcXZ[0] + (trgXZ[0] - srcXZ[0] - 0.02625)*alpha,
                    0.25, 
                    srcXZ[1] + (trgXZ[1] - srcXZ[1] - 0.525)*alpha
                ), 
                new vec3(trgXZ[0], 0, trgXZ[1]+1.35),
                new vec3(0, 1, 0)
            ));
    });

    // Handle recenter
    document.querySelector("#canvas-box #center")!.addEventListener("pointerdown", () => {
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
        trgXZ[0] = -0.2; trgXZ[1] = -0.82;
        time = performance.now();
    });
}())

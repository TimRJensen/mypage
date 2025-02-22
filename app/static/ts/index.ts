import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, Composite, Node, Edge} from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";

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
    const gl = canvas.getContext("webgl2", {antialias: true});
    if (!gl) {
        throw new Error("WebGL2 is not supported");
    }
    // Shapes
    const shapes = [
        // Grid
        new Grid(gl, 2, 1, 14, {id: 0, display: "fixed", color: [160, 117, 206]}),
        // Root
        new Node(gl, {id: 1, pos: [0.0714, 0.06, -0.798]}),
        new Composite(gl, {id: 2, shapes: [
            new Node(gl, {pos: [-0.357, 0.06, -0.5125]}),
            new Edge(gl, [-0.357, 0.06, -0.5125], [0.0714, 0.06, -0.798]),
        ]}),
        new Composite(gl, {id: 3, shapes: [
            new Node(gl, {pos: [0.5, 0.06, -0.5125]}),
            new Edge(gl, [0.5, 0.06, -0.5125], [0.0714, 0.06, -0.798]),
        ]}),
        new Composite(gl, {id: 4, shapes: [
            new Node(gl, {pos: [0.0714, 0.06, -0.2268]}),
            new Edge(gl, [0.0714, 0.06, -0.2268], [0.0714, 0.06, -0.798]),
        ]}),
        new Composite(gl, {id: 5, shapes: [
            new Node(gl, {pos: [-0.5, 0.06, 0.2018]}),
            new Edge(gl, [-0.5, 0.06, 0.2018], [0.0714, 0.06, -0.2268]),
        ]}),
        new Composite(gl, {id: 6, shapes: [
            new Node(gl, {pos: [0.0714, 0.06, 0.3446]}),
            new Edge(gl, [0.0714, 0.06, 0.3446], [0.0714, 0.06, -0.2268]),
        ]}),
        new Composite(gl, {id: 7, shapes: [
            new Node(gl, {pos: [0.6429, 0.06, 0.2018]}),
            new Edge(gl, [0.6429, 0.06, 0.2018], [0.0714, 0.06, -0.2268]),
        ]}),
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
    
    // Viewprojection matrix
    // https://webgl2fundamentals.org/webgl/lessons/webgl-3d-perspective.html
    const vpm = mat4
        .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 5)
        .mul(mat4.lookAt(new vec3(0.2, 0.4, -1.45), new vec3(0, 0, 0), new vec3(0, 1, 0)));
        console.log(canvas.width, canvas.height);

    // Create the WebGL program.
    const main = new Program(canvas, shapes, vs, fs, {
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
        u_light_dir: new vec3(0.6, 0.6, 2.0).normalize(),
        u_picked: new Int32Array([-1, -1, -1, -1, -1, -1]),
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_inverse_transpose: (shape) => shape.world.inverse().transpose(),
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
            shapes[4].hoverOut();
            shapes[4].hide();
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
    main.on("pointerdown", (e: PointerPluginEvent) => {
        if (e.id == 0) {
            picked[5] = -1;
            main.drawInfo.u_picked = picked;
            lastShape[1].blur();
            lastShape[1].hide();
            return;
        }

        for (const shape of shapes) {
            for (const child of shape) {
                if (child.isFocused()) {
                    child.blur();
                    child.hide();
                }
            }
            shape.blur();
            shape.hide();
        }

        switch (e.shape.id) {
            default: {
                picked[0] = 1, picked[3] = e.id, picked[4] = -1, picked[5] = -1;
                shapes[1].focus();
                time = performance.now();
            }
        }

        main.drawInfo.u_picked = picked;
        e.shape.focus();
        e.shape.show();
        e.composite.focus();
        e.composite.show();

        const dx = srcXZ[0] - e.composite.world[12];
        const dz = srcXZ[1] - e.composite.world[14];
        xz[0] = dx; xz[1] = dz;
        trgXZ[0] = e.composite.world[12]; trgXZ[1] = e.composite.world[14];
        lastXZ[0] = (xz[0] + 1.0)*canvas.width/2; lastXZ[1] = (1.0 - xz[0])*canvas.height/2;
    });

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

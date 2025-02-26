import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, Composite, RootNode, Node, Edge, Logo} from "./webgl/geometry.js";
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
        new Grid(gl, 1.5, 1.5, 7, {id: 0, color: [160, 117, 206]}),
        // Root
        new Composite(gl, {id: 1, pos: [0.0, 0.0, -0.728], shapes: [
            new RootNode(gl, {}),
        ]}),
        new Composite(gl, {id: 2, pos: [-0.4287, 0.0, -0.4422], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.4287, 0.06, -0.4422], [0.0, 0.06, -0.728]),
        ]}),
        new Composite(gl, {id: 3, pos: [0.4287, 0.0, -0.4422], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.4287, 0.06, -0.4422], [0.0, 0.06, -0.728]),
        ]}),
        new Composite(gl, {id: 0x40, pos: [0.0, 0.0, -0.1564], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, -0.1564], [0.0, 0.06, -0.728]),
        ]}),
        new Composite(gl, {id: 0x41, pos: [-0.5716, 0.0, 0.2723], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.5716, 0.06, 0.2723], [0.0, 0.06, -0.1564]),
            new Logo(gl, 7, {id: 8, pos: [-0.5, 0.0, 2*0.2018]}),
        ]}),
        new Composite(gl, {id: 0x42, pos: [0.0, 0.0, 0.5581], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, 0.5581], [0.0, 0.06, -0.1564]),
        ]}),
        new Composite(gl, {id: 0x43, pos: [0.5716, 0.00, 0.2723], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.5716, 0.06, 0.2723], [0.0, 0.06, -0.1564]),
        ]}),
    ];
    // Breadcumbs
    const msgs = new Map([
        [0, "@"],
        [1, "contact"],
        [2, "personal skills"],
        [3, "projects"],
        [0x40, "technical skills"],
        [0x41, "backend"],
        [0x42, "frontend"],
        [0x43, "all purpose"],
    ])
    
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const vpm = mat4
        .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 5)
        .mul(mat4.lookAt(cam, center, new vec3(0, 1, 0)));

    // Create the WebGL program.
    const main = new Program(canvas, shapes, vs, fs, {
        color: [102, 51, 153, 1],
        attrs: {
            a_position: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
            a_uv: {type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4},
            a_normal: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
        },
        textures: {
            "/static/imgs/atlas-logos.png": {
                idx: 0,
                width: 256,
                height: 256,
                depth: 18,
            },
        },
    });
    main.plugins.push(
        new BloomPlugin(gl, shapes, main),
        new PointerPlugin(gl, shapes, main),
    );

    main.render({
        u_vpm: vpm,
        u_light_dir: new vec3(0.6, 1.0, 2.0).normalize(),
        u_picked: new Int32Array([-1, -1, -1, -1, -1, -1]),
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_color: (shape) => shape.color,
        u_pick_color: (shape) => shape.pick_color,
        u_sampler: (shape) => {
            switch (shape.type) {
                default:
                    return 0;
            }
        },
        u_depth: (shape) => shape.depth,
    });

    // Handle drag
    let dragging = false;
    let pointer = 0;
    canvas.addEventListener("pointermove", (e) => {
        if (!dragging) {
            return;
        }
        e.preventDefault();

        const dx = e.movementX/canvas.width;
        const dz = e.movementY/canvas.height;
        if ((cam.x < 1.5 && dx <= 0) || (cam.x > -1.5 && dx >= 0)) {
            cam.x -= dx;
            center.x -= dx;
        }
        if ((cam.z > - 1.75 && dz <= 0) || (cam.z < 0.5 && dz >= 0)) {
            cam.z += dz;
            center.z += dz;
        }

        main.drawInfo.u_vpm = mat4
            .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 1000)
            .mul(mat4.lookAt(
                cam,
                center,
                new vec3(0, 1, 0)
            ));
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
        canvas.setPointerCapture(e.pointerId);

        dragging = true;
        pointer = e.pointerId;
    },
        {passive: false}
    );

    // Handle pick (click)
    // picked[0] == root, picked[3] == focused
    const picked = main.drawInfo.u_picked as Int32Array;
    const trgXZ = [0, 0];
    const duration = 1000;
    const step = 1/(duration/(1000/60));
    let progress = 0;

    function easeInOut(alpha: number) {
        return alpha < 0.5 ? 2 * alpha*alpha : 1 - Math.pow(-2*alpha + 2, 2)/2;
    }
    function lerp(a: number, b: number, alpha: number): number {
        return a * (1 - alpha) + b * alpha;
    }
    function animateCamera() {
        if (progress >= 1.0 || dragging) {
            progress = 0;
            return;
        }
        progress += step;

        const alpha = easeInOut(progress);
        const offsetXZ = [center[0] - cam[0], center[2] - cam[2]];
        cam[0] = lerp(cam[0], trgXZ[0], alpha);
        cam[2] = lerp(cam[2], trgXZ[1], alpha);
        center[0] = cam[0] + offsetXZ[0];
        center[2] = cam[2] + offsetXZ[1];
    
        main.drawInfo.u_vpm = mat4
        .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 1000)
        .mul(mat4.lookAt(
            cam,
            center,
            new vec3(0, 1, 0)
        ));
        requestAnimationFrame(animateCamera);
    }

    main.on("pointerdown", (e: PointerPluginEvent) => {
        if (e.id == 0) {
            picked[0] = -1, picked[3] = -1, picked[4] = -1, picked[5] = -1;
            for (const shape of shapes) {
                shape.blur();
                shape.hide();
            }
            return;
        }

        for (const shape of shapes) {
            shape.blur();
            shape.hide();
        }

        switch (true) {
            case (e.shape.id&0x40) == 0x40:
                picked[0] = 1, picked[3] = 0x40, picked[4] = e.id, picked[5] = -1;
                shapes[1].focus();
                shapes[4].focus();
                shapes[4].show();
                break;
            default: {
                picked[0] = 1, picked[3] = e.id, picked[4] = -1, picked[5] = -1;
                shapes[1].focus();
            }
        }
        e.shape.focus();
        e.shape.show();

        const dir = new vec3(e.shape.world[12] - cam.x, 0, e.shape.world[14] - cam.z).normalize();
        trgXZ[0] = e.shape.world[12] + dir.x*-0.225;
        trgXZ[1] = e.shape.world[14] + dir.z*-0.75;
        dragging = false;
        requestAnimationFrame(animateCamera);
    });

    // Handle pick (hover)
    main.on("pointermove", (e: PointerPluginEvent) => {
        if (e.id == 0) {
            picked[0] = picked[3] > 0 ? 1 : -1, picked[1] = -1, picked[2] = -1;
            for (const shape of shapes) {
                shape.hoverOut();
                shape.hide();
            }
            return;
        }
        
        switch (true) {
            case (e.shape.id&0x40) == 0x40:
                picked[0] = 1, picked[1] = 0x40, picked[2] = e.id;
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
    });

    // Handle breadcrumbs
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
    main.on("done", () => {
        breadcrumbs.textContent = "";
        let a = "", b = "";

        // focused
        for (const shape of shapes) {
            if (picked.slice(3).includes(shape.id)) {
                a += " \u21FE " + msgs.get(shape.id);
            }
        }
        // hovered
        for (const shape of shapes) {
            if (picked.slice(1, 3).includes(shape.id)) {
                b += " \u21FE " + msgs.get(shape.id);
            }
        }

        breadcrumbs.textContent = msgs.get(0) + (b.length > 0 ? b : a);
    });

    // Handle recenter
    document.querySelector("#canvas-box #center")!.addEventListener("pointerdown", () => {
        // Reset pick
        picked[0] = -1, picked[1] = -1, picked[2] = -1;
        picked[3] = -1, picked[4] = -1, picked[5] = -1;
        for (const shape of shapes) {
            shape.hoverOut();
            shape.blur();
            shape.hide();
        }

        // Rest camera
        trgXZ[0] = 0.2;
        trgXZ[1] = -1.45;
        dragging = false;
        requestAnimationFrame(animateCamera);
    });


    function force() {
        shapes[4].show();
        shapes[4].focus();
        shapes[5].show();
        shapes[5].focus();
        picked[0] = 1, picked[3] = 0x40, picked[4] = 0x41, picked[5] = -1;
        trgXZ[0] = -0.5-0.225;
        trgXZ[1] = 0.2018-0.75;
        dragging = false;
        requestAnimationFrame(animateCamera);
    }
    // force();
}())

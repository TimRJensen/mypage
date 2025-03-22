import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, Composite, RootNode, Node, Edge, Logo} from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";
import hints from "./hints.js";

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
        new Grid(gl, 1.5, 1.5, 7, {id: 0, color: [151, 101, 205]}),
        // Root
        new Composite(gl, {id: 1, pos: [0.0, 0.0, -0.728], shapes: [
            new RootNode(gl, {}),
        ]}),
        // Personal skills
        new Composite(gl, {id: 2, pos: [-0.4286, 0.0, -0.4411], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.4286, 0.06, -0.4411], [0.0, 0.06, -0.728]),
        ]}),
        // Projects
        new Composite(gl, {id: 3, pos: [0.4286, 0.0, -0.4411], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.4286, 0.06, -0.4411], [0.0, 0.06, -0.728]),
        ]}),
        // Technical skills
        new Composite(gl, {id: 0x40, pos: [0.0, 0.0, -0.1554], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, -0.1554], [0.0, 0.06, -0.728]),
        ]}),
        // Backend
        new Composite(gl, {id: 0x41, pos: [-0.5714, 0.0, 0.2732], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.5714, 0.06, 0.2732], [0.0, 0.06, -0.1564]),
            new Logo(gl, 11, {id: 0x410, pos: [0.2331, 0.0, 0.4038]}),
            new Logo(gl, 3, {id: 0x411, pos: [0.0809, 0.0, 0.4591]}),
            new Logo(gl, 10, {id: 0x412, pos: [-0.0810, 0.0, 0.4591]}),
            new Logo(gl, 12, {id: 0x413, pos: [-0.2331, 0.0, 0.4037]}),
            new Logo(gl, 4, {id: 0x414, pos: [-0.3571, 0.0, 0.2997]}),
            new Logo(gl, 6, {id: 0x415, pos: [-0.4381, 0.0, 0.1595]}),
        ]}),
        // Frontend
        new Composite(gl, {id: 0x42, pos: [0.0, 0.0, 0.5589], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.1564]),
            new Logo(gl, 9, {id: 0x420, pos: [0.4381, 0.0, 0.1595]}),
            new Logo(gl, 15, {id: 0x421, pos: [0.3391, 0.0, 0.3199]}),
            new Logo(gl, 14, {id: 0x422, pos: [0.1846, 0.0, 0.4281]}),
            new Logo(gl, 16, {id: 0x423, pos: [0.0000, 0.0, 0.4662]}),
            new Logo(gl, 8, {id: 0x424, pos: [-0.1846, 0.0, 0.4281]}),
            new Logo(gl, 2, {id: 0x425, pos: [-0.3391, 0.0, 0.3199]}),
            new Logo(gl, 17, {id: 0x426, pos: [-0.4381, 0.0, 0.1595]}),
        ]}),
        // All purpose
        new Composite(gl, {id: 0x43, pos: [0.5714, 0.00, 0.2732], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.5714, 0.06, 0.2732], [0.0, 0.06, -0.1564]),
            new Logo(gl, 0, {id: 0x430, pos: [-0.2331, 0.0, 0.4038]}),
            new Logo(gl, 1, {id: 0x431, pos: [-0.0406, 0.0, 0.4644]}),
            new Logo(gl, 5, {id: 0x432, pos: [0.1595, 0.0, 0.4381]}),
            new Logo(gl, 13, {id: 0x433, pos: [0.3297, 0.0, 0.3297]}),
            new Logo(gl, 7, {id: 0x434, pos: [0.4381, 0.0, 0.1595]}),
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
    console.log("Max Elements Indices:", window.outerWidth, window.outerHeight);
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI/4, 1920/1080, 0.1, 50)
    const vpm = pm.mul(mat4.lookAt(cam, center, up));

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

        main.drawInfo.u_vpm = pm.mul(mat4.lookAt(cam, center, up));
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
    // picked[0] == root, picked[1 < i < 3] == hovered, picked[i >= 3] == focused
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
        main.drawInfo.u_vpm = pm.mul(mat4.lookAt(cam, center, up));

        requestAnimationFrame(animateCamera);
    }

    const panel = document.querySelector<HTMLDivElement>("#canvas-box .info-box")!;
    function setInfoPanel(cx: number, cy: number, id: number) {
        if (id < 0) {
            panel.style.display = "none";
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = cx*0.5 + 0.5;
        const y = cy*-0.5 + 0.5;
        panel.style.display = "flex";
        panel.style.left = rect.left + x*rect.width + "px";
        panel.style.top = rect.top + y*rect.height + "px";
        panel.firstElementChild!.textContent = hints[id].txt;

        for (let i = 0; i < panel.lastElementChild!.children.length; i++) {
            (panel.lastElementChild!.children[i] as HTMLElement).dataset.toggled = i < hints[id].rating ? "1" : "0";
        }
    }

    main.on("pointerdown", (e: PointerPluginEvent) => {
        if (e.id == 0) {
            panel.style.display = "none";
            picked[0] = -1, picked[3] = -1, picked[4] = -1, picked[5] = -1;
            for (const shape of shapes) {
                shape.blur();
                shape.hide();
            }
            return;
        }

        switch (true) {
            case (e.shape.id&0x400) == 0x400:
                const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(e.shape.world)
                setInfoPanel(clip[12]/clip[15], clip[13]/clip[15], e.id);
                return;
            default:
                setInfoPanel(0, 0, -1);
                for (const shape of shapes) {
                    shape.blur();
                    shape.hide();
                }
        }

        switch (true) {
            case (e.shape.id&0x40) == 0x40:
                picked[0] = 1, picked[3] = 0x40, picked[4] = e.id, picked[5] = -1;
                shapes[1].focus();
                shapes[4].show();
                shapes[4].focus();
                break;
            default: {
                picked[0] = 1, picked[3] = e.id, picked[4] = -1, picked[5] = -1;
                shapes[1].focus();

            }
        }
        e.shape.focus();
        e.shape.show();

        trgXZ[0] = e.shape.world[12] + 0.1554;
        trgXZ[1] = e.shape.world[14] - 3.5*0.1554;
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
            case (e.shape.id&0x400) == 0x400:
                return;
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
        panel.style.display = "none";
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
}())

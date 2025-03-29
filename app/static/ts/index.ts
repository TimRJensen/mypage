import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, Composite, RootNode, Node, Edge, Logo, Text, Project} from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";
import hints from "./hints.js";

/**
 * Handle transition
 */
(function () {
    document.querySelectorAll<HTMLButtonElement>("#msg-box .button, #footer .button")!.forEach((button) => {
        button.addEventListener("pointerdown", () => 
            document.querySelector<HTMLDivElement>("#canvas-box")!.scrollIntoView({behavior: "smooth"})
        )
    });
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
    const shapes = [//col: 0.0929 row: 0.1071
        // Grid
        new Grid(gl, 1.3, 1.5, 7, {id: 0, color: [151, 101, 205]}),
        // Root
        new Composite(gl, {id: 1, display: "fixed", pos: [0.0, 0.0, -0.728], shapes: [
            new RootNode(gl, {}),
        ]}),
        // Backend
        new Composite(gl, {id: 0x41, display: "fixed", pos: [-0.6065, 0.0, 0.2601], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.6065, 0.06, 0.2601], [0.0, 0.06, -0.11]),
            new Logo(gl, 11, {id: 0x410, pos: [0.2331, 0.1, 0.4038]}),
            new Logo(gl, 9, {id: 0x411, pos: [0.0809, 0.1, 0.4591]}),
            new Logo(gl, 17, {id: 0x412, pos: [-0.0810, 0.1, 0.4591]}),
            new Logo(gl, 15, {id: 0x413, pos: [-0.2331, 0.1, 0.4037]}),
            new Logo(gl, 8, {id: 0x414, pos: [-0.3571, 0.1, 0.2997]}),
            new Logo(gl, 16, {id: 0x415, pos: [-0.4381, 0.1, 0.1595]}),
        ]}),
        // Frontend
        new Composite(gl, {id: 0x42, display: "fixed", pos: [0.0, 0.0, 0.5077], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.0]),
            new Logo(gl, 22, {id: 0x420, pos: [0.4381, 0.1, 0.1595]}),
            new Logo(gl, 7, {id: 0x421, pos: [0.3391, 0.1, 0.3199]}),
            new Logo(gl, 13, {id: 0x422, pos: [0.1846, 0.1, 0.4281]}),
            new Logo(gl, 21, {id: 0x423, pos: [0.0000, 0.1, 0.4662]}),
            new Logo(gl, 19, {id: 0x424, pos: [-0.1846, 0.1, 0.4281]}),
            new Logo(gl, 20, {id: 0x425, pos: [-0.3391, 0.1, 0.3199]}),
            new Logo(gl, 14, {id: 0x426, pos: [-0.4381, 0.1, 0.1595]}),
        ]}),
        // All purpose
        new Composite(gl, {id: 0x43, display: "fixed", pos: [0.6065, 0.00, 0.2601], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.6065, 0.06, 0.2601], [0.0, 0.06, -0.11]),
            new Logo(gl, 12, {id: 0x430, pos: [-0.2331, 0.1, 0.4038]}),
            new Logo(gl, 18, {id: 0x431, pos: [-0.0406, 0.1, 0.4644]}),
            new Logo(gl, 10, {id: 0x432, pos: [0.1595, 0.1, 0.4381]}),
            new Logo(gl, 6, {id: 0x433, pos: [0.3297, 0.1, 0.3297]}),
            new Logo(gl, 5, {id: 0x434, pos: [0.4381, 0.1, 0.1595]}),
        ]}),
        // Technical skills
        new Composite(gl, {id: 0x4, display: "fixed", pos: [0.0, 0.0, -0.1113], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, -0.1113], [0.0, 0.06, -0.728]),
            new Text(gl, 5, {pos: [0.0, 0.0, -0.1], rotation: [Math.PI, 0.0, 0.0]}),
            new Text(gl, 1, {display: "hidden", pos: [-0.53, 0.0,  0.33], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Text(gl, 2, {display: "hidden", pos: [0.0, 0.0, 0.55], rotation: [Math.PI, 0.0, 0.0]}),
            new Text(gl, 0, {display: "hidden", pos: [0.51, 0.0,  0.31], rotation: [Math.PI, Math.PI/4, 0.0]}),
        ]}),
        // Projects
        new Composite(gl, {id: 0x3, display: "fixed", pos: [0.4820, 0.0, -0.4819], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
            new Text(gl, 4, {pos: [-0.045, 0.0, -0.045], rotation: [Math.PI, Math.PI/4, 0.0]}),
            new Project(gl, 1, {id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI/2, 0.0, 0.5]}),
            new Project(gl, 0, {id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI/2, 0.0, 0.5]}),
        ]}),
        // About me
        new Composite(gl, {id: 0x21, display: "fixed", pos: [-1.1018, 0.0, 0.0125], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-1.1018, 0.06, 0.0125], [-0.4820, 0.06, -0.4814]),
        ]}),
        // Personal skills
        new Composite(gl, {id: 0x2, display: "fixed", pos: [-0.4820, 0.0, -0.4814], shapes: [
            new Node(gl, {}),
            new Edge(gl, [-0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
            new Text(gl, 3, {pos: [0.077, 0.0, -0.07], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Logo(gl, 3, {id: 0x204, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1.0, 1.1]}),
            new Logo(gl, 23, {id: 0x203, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1.0, 0.75]}),
            new Logo(gl, 4, {id: 0x202, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1.0, 0.75]}),
            new Logo(gl, 2, {id: 0x201, pos: [-0.2881, 0.1, 0.1500], scale: [1.25, 1.0, 1.25]}),
            new Logo(gl, 1, {id: 0x200, pos: [-0.3266, 0.1, 0.0], scale: [0.75, 1.0, 0.75]}),
        ]}),

    ];
    const ROOT = 0x1;
    const PERSONAL_SKILLS = 0x2;
    const PROJECTS = 0x3;
    const TECHNICAL_SKILLS = 0x4;
    const ABOUT_ME = 0x21;

    const map = new Map([
        [0x0, {txt: "@", index: 0}],
        [0x1, {txt: "contact", index: 1}],
        [0x2, {txt: "personal skills", index: 8}],
        [0x21, {txt: "about me", index: 7}],
        [0x3, {txt: "projects", index: 6}],
        [0x4, {txt: "technical skills", index: 5}],
        [0x41, {txt: "backend", index: 2}],
        [0x42, {txt: "frontend", index: 3}],
        [0x43, {txt: "all purpose", index: 4}],
    ]);
  
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 50)
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
                width: 256,
                height: 256,
                depth: 24,
            },
            "/static/imgs/atlas-grid-texts.png": {
                width: 512,
                height: 256,
                depth: 6,
            },
            "/static/imgs/atlas-projects.png": {
                width: 512,
                height: 512,
                depth: 2,
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
        u_picked: new Int32Array([-1, -1, -1, -1, -1]),
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_color: (shape) => shape.color,
        u_pick_color: (shape) => shape.pick_color,
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
    // picked[0] == root, picked[1 && 2] == hovered, picked[3 && 4] == focused
    const picked = main.drawInfo.u_picked as Int32Array;
    const srcXZ = [0, 0];
    const trgXZ = [0, 0];
    const duration = 500;
    const step = 1/(duration/(1000/60));
    const offset = [0.125, -0.6589];
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
        cam[0] = lerp(srcXZ[0], trgXZ[0], alpha);
        cam[2] = lerp(srcXZ[1], trgXZ[1], alpha);
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
        panel.dataset.id = id.toString();
        panel.firstElementChild!.innerHTML = hints[id].txt;

        for (let i = 0; i < panel.lastElementChild!.children.length; i++) {
            (panel.lastElementChild!.children[i] as HTMLElement).dataset.toggled = i < hints[id].rating ? "1" : "0";
        }
    }

    const footer = document.querySelector<HTMLFieldSetElement>("#footer")!;
    main.on("pointerdown", function fn(e: PointerPluginEvent) {
        if (e.id == 0) {
            setInfoPanel(0, 0, -1);
            return;
        }

        for (const shape of shapes) {
            shape.blur();
            shape.hide();
        }
        setInfoPanel(0, 0, -1);

        switch (true) {
            case e.id == ROOT:
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                footer.scrollIntoView({behavior: "smooth"});
                return;
            case e.id>>4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[3] = PERSONAL_SKILLS, picked[4] = e.id;
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                shapes[map.get(picked[3])!.index].show();
                e.id = ABOUT_ME<<4;
                fn(e);
                return;
            case e.id>>4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[3] = TECHNICAL_SKILLS, picked[4] = e.id;
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                shapes[map.get(picked[3])!.index].show();
                break;
            case e.id>>8 == PERSONAL_SKILLS:
            case e.id>>8 == PROJECTS:
            case e.id>>8 == TECHNICAL_SKILLS:
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                shapes[map.get(picked[3])!.index].show();
                if (picked[4] != -1) {
                    shapes[map.get(picked[4])!.index].focus();
                    shapes[map.get(picked[4])!.index].show();
                }

                const delta = Math.hypot(e.shape.world[12] - cam[0], e.shape.world[14] - cam[2]);
                if (delta < 1.15) {
                    const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(e.shape.world);
                    setInfoPanel(clip[12]/clip[15], clip[13]/clip[15], e.id);
                    return;
                }

                const world = e.shape.world;
                const id = e.id;
                requestAnimationFrame(function fn() {
                    if (progress >= 1) {
                        return;
                    }

                    const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
                    setInfoPanel(clip[12]/clip[15], clip[13]/clip[15], id);
                    requestAnimationFrame(fn);
                });

                if (e.id>>8 == PERSONAL_SKILLS && e.id>>4 != ABOUT_ME) {
                    e.shape = shapes[map.get(picked[3])!.index];
                } else {
                    e.shape = shapes[map.get(picked[4])!.index];
                }
                break;
            default: {
                picked[0] = ROOT, picked[3] = e.id, picked[4] = -1;
                shapes[map.get(picked[0])!.index].focus();
            }
        }

        e.shape.focus();
        e.shape.show();
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = e.shape.world[12] + offset[0];
        trgXZ[1] = e.shape.world[14] + offset[1];
        dragging = false;
        requestAnimationFrame(animateCamera);
    });

    // Handle pick (hover)
    main.on("pointermove", (e: PointerPluginEvent) => {
        for (const shape of shapes) {
            shape.hoverOut();
            shape.hide();
        }

        if (e.id == 0) {
            picked[0] = picked[3] > 0 ? 1 : -1, picked[1] = picked[2] = -1;
            return;
        }
        
        switch (true) {
            case e.id>>8 == PERSONAL_SKILLS:
            case e.id>>8 == PROJECTS:
            case e.id>>8 == TECHNICAL_SKILLS:
                return;
            case e.id>>4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[1] = PERSONAL_SKILLS, picked[2] = e.id;
                e.shape.show();
                e.shape.hoverIn();
                shapes[map.get(picked[1])!.index].show();
                shapes[map.get(picked[1])!.index].hoverIn();
                break;
            case e.id>>4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[1] = TECHNICAL_SKILLS, picked[2] = e.id;
                e.shape.show();
                e.shape.hoverIn();
                shapes[map.get(picked[1])!.index].show();
                shapes[map.get(picked[1])!.index].hoverIn();
                break;
            default:
                picked[0] = ROOT, picked[1] = e.id, picked[2] = -1;;
                e.shape.show();
                e.shape.hoverIn();
        }
    });

    // Handle breadcrumbs
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
    breadcrumbs.addEventListener("pointerdown", (e: PointerEvent) => {
        setInfoPanel(0, 0, -1);

        const id = Number.parseInt((e.target as HTMLElement).dataset.id!);
        switch (id) {
            case ROOT:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4])!.index].hoverOut();
                    shapes[map.get(picked[4])!.index].blur();
                    shapes[map.get(picked[4])!.index].hide();
                }
                if (picked[3] != -1) {
                    shapes[map.get(picked[3])!.index].hoverOut();
                    shapes[map.get(picked[3])!.index].blur();
                    shapes[map.get(picked[3])!.index].hide();
                }
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild!);
                break;
            case PERSONAL_SKILLS:
            case PROJECTS:
            case TECHNICAL_SKILLS:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4])!.index].hoverOut();
                    shapes[map.get(picked[4])!.index].blur();
                    shapes[map.get(picked[4])!.index].hide();
                }
                picked[2] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild!, breadcrumbs.children[1]);
                break;
        }

        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = shapes[map.get(id)!.index].world[12] + offset[0];
        trgXZ[1] = shapes[map.get(id)!.index].world[14] + offset[1];
        dragging = false;
        requestAnimationFrame(animateCamera);        
    });

    main.on("done", () => {
        if (picked[1] == -1  && picked[3] == -1) {
            breadcrumbs.replaceChildren(breadcrumbs.firstChild!);
            return;
        }

        // focused
        const a = [breadcrumbs.firstChild!];
        for (const id of picked.slice(3)) {
            if (id == -1) {
                continue;
            }

            const span = document.createElement("span");
            span.textContent = " \u21FE " + map.get(id)?.txt;
            span.dataset.id = id.toString();
            a.push(span);
        }
        // hovered
        const b = [breadcrumbs.firstChild!];
        for (const id of picked.slice(1, 3)) {
            if (id == -1) {
                continue;
            }

            const span = document.createElement("span");
            span.textContent = " \u21FE " + map.get(id)?.txt;
            span.dataset.id = id.toString();
            b.push(span);            
        }

        breadcrumbs.replaceChildren(...(b.length > 1 ? b : a));
    });

    (breadcrumbs.firstChild as HTMLElement)!.dataset.id = ROOT.toString();
}())

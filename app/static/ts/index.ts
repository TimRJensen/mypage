import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl/core.js";
import {PointerPlugin, PointerPluginEvent} from "./webgl/plugins/pointer.js";
import {BloomPlugin} from "./webgl/plugins/bloom.js";
import {Grid, Composite, RootNode, Node, Edge, Logo, Text, Project, Circle, ShapeType} from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";
import infos from "./hints.js";

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

    canvas.width = window.innerWidth;
    canvas.height = (window.innerWidth*9)/16;

    // Shapes
    const shapes = [//col == row == 0.1238
        // Grid
        new Grid(gl, 1.3, 1.5, 7, {id: 0, color: [151, 101, 205]}),
        // Root
        new Composite(gl, {id: 1, display: "fixed", pos: [0.0, 0.0,-0.728], shapes: [
            new RootNode(gl, {}),
        ]}),
        // Frontend
        new Composite(gl, {id: 0x20, display: "fixed", pos: [0.0, 0.0, 0.5077], shapes: [
            new Text(gl, 7, {pos: [0.0, 0.001, -0.0619], rotation: [Math.PI, 0.0, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.0863]),
            new Logo(gl, 0, {id: 0x200, pos: [0.0000, 0.1, 0.4043]}),
            new Logo(gl, 1, {id: 0x201, pos: [-0.1846, 0.1, 0.3662]}),
            new Logo(gl, 2, {id: 0x202, pos: [0.1846, 0.1, 0.3662]}),
            new Logo(gl, 3, {id: 0x203, pos: [-0.3391, 0.1, 0.2580]}),
            new Logo(gl, 4, {id: 0x204, pos: [0.3391, 0.1, 0.2580]}),
            new Logo(gl, 5, {id: 0x205, pos: [-0.4381, 0.1, 0.0976]}),
            new Logo(gl, 6, {id: 0x206, pos: [0.4381, 0.1, 0.0976]}),
        ]}),
        // Backend
        new Composite(gl, {id: 0x21, display: "fixed", pos: [-0.6065, 0.0, 0.2601], shapes: [
            new Text(gl, 8, {pos: [0.0619, 0.001,  -0.0619], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [-0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
            new Logo(gl, 7, {id: 0x210, pos: [0.2331, 0.1, 0.4038]}),
            new Logo(gl, 8, {id: 0x211, pos: [0.0809, 0.1, 0.4591]}),
            new Logo(gl, 9, {id: 0x212, pos: [-0.0810, 0.1, 0.4591]}),
            new Logo(gl, 10, {id: 0x213, pos: [-0.2331, 0.1, 0.4037]}),
            new Logo(gl, 11, {id: 0x214, pos: [-0.3571, 0.1, 0.2997]}),
            new Logo(gl, 12, {id: 0x215, pos: [-0.4381, 0.1, 0.1595]}),
        ]}),
        // All purpose
        new Composite(gl, {id: 0x22, display: "fixed", pos: [0.6065, 0.00, 0.2601], shapes: [
            new Text(gl, 9, {pos: [-0.0850, 0.001,  -0.0619], rotation: [Math.PI, Math.PI/4, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
            new Logo(gl, 13, {id: 0x220, pos: [-0.2331, 0.1, 0.4038]}),
            new Logo(gl, 14, {id: 0x221, pos: [-0.0406, 0.1, 0.4644]}),
            new Logo(gl, 15, {id: 0x222, pos: [0.1595, 0.1, 0.4381]}),
            new Logo(gl, 16, {id: 0x223, pos: [0.3297, 0.1, 0.3297]}),
            new Logo(gl, 17, {id: 0x224, pos: [0.4381, 0.1, 0.1595]}),
        ]}),
        // Technical skills
        new Composite(gl, {id: 0x2, display: "fixed", pos: [0.0, 0.0, -0.1113], shapes: [
            new Text(gl, 10, {pos: [0.0, 0.001, -0.1113], rotation: [Math.PI, 0.0, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, -0.1113], [0.0, 0.06, -0.728]),
        ]}),
        // Projects
        new Composite(gl, {id: 0x3, display: "fixed", pos: [0.4820, 0.0, -0.4819], shapes: [
            new Text(gl, 13, {pos: [-0.045, 0.001, -0.045], rotation: [Math.PI, Math.PI/4, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
            new Project(gl, 1, {id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI/2, 0.0, 0.5]}),
            new Project(gl, 0, {id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI/2, 0.0, 0.5]}),
        ]}),
        // About me
        new Composite(gl, {id: 0x41, display: "fixed", pos: [-1.1018, 0.0, 0.0125], shapes: [
            new Text(gl, 11, {pos: [0.0619, 0.0, -0.0619], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [-1.1018, 0.06, 0.0125], [-0.5020, 0.06, -0.4620]),
        ]}),
        // Personal skills
        new Composite(gl, {id: 0x4, display: "fixed", pos: [-0.4820, 0.001, -0.4820], shapes: [
            new Text(gl, 12, {pos: [0.077, 0.0, -0.07], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Node(gl, {}),
            new Edge(gl, [-0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
            new Logo(gl, 18, {id: 0x400, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1.0, 1.1]}),
            new Logo(gl, 19, {id: 0x401, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1.0, 0.75]}),
            new Logo(gl, 20, {id: 0x402, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1.0, 0.75]}),
            new Logo(gl, 21, {id: 0x403, pos: [-0.2881, 0.1, 0.1500], scale: [1.25, 1.0, 1.25]}),
            new Logo(gl, 22, {id: 0x404, pos: [-0.3266, 0.1, 0.0], scale: [0.75, 1.0, 0.75]}),
        ]}),
        // Help
        new Composite(gl, {id: 0x50, display: "hidden", pos: [0.0, 0.0, 0.0], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, 0.0], [0.0, 0.06, -0.3714]),
            new Logo(gl, 23, {id: 0x500, pos: [0.0, 0.1, 0.3714]}),
        ]}),
        new Composite(gl, {id: 0x51, display: "hidden", pos: [0.0, 0.0, -0.3714], shapes: [
            new Node(gl, {}),
            new Edge(gl, [0.0, 0.06, -0.3714], [0.0, 0.06, -0.7428]),
        ]}),
        new Composite(gl, {id: 0x5, display: "hidden", pos: [0.0, 0.0, -0.7428], shapes: [
            new Node(gl, {}),
        ]}),
        // Hand
        new Composite(gl, {id: 0x6, display: "hidden", pos: [0.3714, 0.0, -0.3714], shapes: [
            new Logo(gl, 24, {display: "fixed", pos: [0.0, 0.0, 0.0], scale: [0.5, 1.0, 0.5]}),
        ]}),
        // Cloud
        new Composite(gl, {id: 0x7, display: "fixed",  pos: [0.0, 0.0, 1.1142], shapes: [
            new Text(gl, 0, {id: -1, pos: [0.0, 0.3714, 0.0], scale: [3.0, 1.0, 1.5]}),
            new Circle(gl, {type: ShapeType.SHADOW, pos: [0.0, 0.015, 0.0], color: [0, 0, 0]}),
        ]}),
    ];
    const ROOT = 0x1;
    const TECHNICAL_SKILLS = 0x2;
    const PROJECTS = 0x3;
    const PERSONAL_SKILLS = 0x4;
    const HELP = 0x5;
    const SECOND = 0x50;
    const FIRST = 0x51;
    const HAND = 0x6;
    const CLOUD = 0x7

    const ids: Array<[number, string]> = [
        [ROOT, "contact"],
        [(TECHNICAL_SKILLS<<4) + 0x0, "frontend"],
        [(TECHNICAL_SKILLS<<4) + 0x1, "backend"],
        [(TECHNICAL_SKILLS<<4) + 0x2, "all purpose"],
        [TECHNICAL_SKILLS, "technical skills"],
        [PROJECTS, "projects"],
        [(PERSONAL_SKILLS<<4) + 0x1, "about me"],
        [PERSONAL_SKILLS, "personal skills"],
        [(HELP<<4) + 0x0, "second"],
        [(HELP<<4) + 0x1, "first"],
        [HELP, "start"],
        [HAND, ""],
        [CLOUD, ""],
    ];
    const map = new Map<number, {txt: string, index:number}>();
    for (let i = 1; i < shapes.length; i++) {
        map.set(ids[i - 1][0], {txt: ids[i - 1][1], index: i});
    }

    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 10)
    let vpm = pm.mul(mat4.lookAt(cam, center, up));

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
                depth: 25,
            },
            "/static/imgs/atlas-grid-texts.png": {
                width: 512,
                height: 256,
                depth: 14,
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
        u_light_dir: new vec3(0.6, 1.0, 2.0).normalize(),
        u_picked: new Int32Array([-1, -1, -1, -1, -1]),
        u_vpm: () => vpm,
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_color: (shape) => shape.color,
        u_pick_color: (shape) => shape.pick_color,
        u_depth: (shape) => shape.id == CLOUD ? cloudState : shape.depth,
    });

    // Handle drag
    let gridDrag = false;
    let pointer = 0;
    canvas.addEventListener("pointermove", (e) => {
        if (!gridDrag) {
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

        vpm = pm.mul(mat4.lookAt(cam, center, up));
    },
        {passive: false}
    );
    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();

        if (!pointer) {
            return;
        }

        canvas.releasePointerCapture(pointer);
        gridDrag = false
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
        gridDrag = false
        pointer = 0;
    },
        {passive: false}
    );
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);

        gridDrag = true;
        pointer = e.pointerId;
    },
        {passive: false}
    );

    // Handle pick (click)
    // picked[0] == root, picked[1 && 2] == hovered, picked[3 && 4] == focused
    const picked = <Int32Array>main.drawInfo.u_picked;
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
    function panCamera() {
        if (progress >= 1.0 || gridDrag) {
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
        vpm = pm.mul(mat4.lookAt(cam, center, up));

        requestAnimationFrame(panCamera);
    }

    const infoBox = document.querySelector<HTMLDivElement>("#canvas-box .hint-box")!;
    function moveInfoBox(world: mat4|null, id: number, panel: HTMLDivElement) {
        if (!world) {
            panel.removeAttribute("data-show");
            return;
        }

        requestAnimationFrame(function fn() {
            if (!progress || progress >= 1.0) {
                return;
            }

            const vpm = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
            const rect = canvas.getBoundingClientRect();
            const x = (vpm[12]/vpm[15])*0.5 + 0.5;
            const y = (vpm[13]/vpm[15])*-0.5 + 0.5;
            panel.style.left = rect.left + x*rect.width + "px";
            panel.style.top = rect.top + y*rect.height + "px";
            requestAnimationFrame(fn);
        });

        const vpm = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
        const rect = canvas.getBoundingClientRect();
        const x = (vpm[12]/vpm[15])*0.5 + 0.5;
        const y = (vpm[13]/vpm[15])*-0.5 + 0.5;
        panel.style.left = rect.left + x*rect.width + "px";
        panel.style.top = rect.top + y*rect.height + "px";
        
        if (!id) {
            return;
        } 
        panel.dataset.show = id.toString();
        panel.firstElementChild!.innerHTML = infos[id]?.txt;

        for (let i = 0; i < panel.lastElementChild!.children.length; i++) {
            (<HTMLElement>panel.lastElementChild!.children[i]).dataset.toggled = i < infos[id].rating ? "1" : "0";
        }
    }

    const footer = document.querySelector<HTMLFieldSetElement>("#footer")!;
    main.on("pointerdown", function fn(e: PointerPluginEvent) {
        moveInfoBox(null, 0, infoBox);

        if (e.id == 0 || e.id == CLOUD || progress > 0) {
            return;
        }

        for (const shape of shapes) {
            shape.blur();
            shape.hide();
        }

        switch (true) {
            case e.id == ROOT:
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                footer.scrollIntoView({behavior: "smooth"});
                return;
            case e.id>>4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[3] = TECHNICAL_SKILLS, picked[4] = e.id != TECHNICAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                break;
            case e.id>>4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[3] = PERSONAL_SKILLS, picked[4] = e.id != PERSONAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                moveInfoBox(e.shape.world, e.shape.id, infoBox);
                break;
            case e.id == HELP:
            case e.id>>4 == HELP:
                picked[0] = HELP, picked[3] = e.id == SECOND ? FIRST : e.id, picked[4] = e.id == SECOND ? e.id : -1;
                shapes[map.get(picked[0])!.index].focus();
                shapes[map.get(picked[3])!.index].focus();
                break;
            case e.id>>8 == PERSONAL_SKILLS:
            case e.id>>8 == PROJECTS:
            case e.id>>8 == TECHNICAL_SKILLS:
            case e.id>>8 == HELP:
                if (e.id>>4 != picked[4]) {
                    picked[4] = -1;
                    shapes[map.get(picked[3])!.index].focus();
                } else {
                    shapes[map.get(picked[3])!.index].focus();
                    shapes[map.get(picked[4])!.index].focus();
                }

                moveInfoBox(e.shape.world, e.shape.id, infoBox);
                e.shape = shapes[(map.get(e.id>>4) ?? map.get(e.id>>8))!.index];
                break;
            default: {
                picked[0] = ROOT, picked[3] = e.id, picked[4] = -1;
                shapes[map.get(picked[0])!.index].focus();
            }
        }

        e.shape.focus();
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = e.shape.world[12] + offset[0];
        trgXZ[1] = e.shape.world[14] + offset[1];
        gridDrag = false;
        panCamera();
    });

    // Handle pick (hover)
    main.on("pointermove", (e: PointerPluginEvent) => {
        for (const shape of shapes) {
            shape.hide();
        }

        switch (true) {
            case e.id == 0x0:
            case e.id>>8 == PERSONAL_SKILLS:
            case e.id>>8 == PROJECTS:
            case e.id>>8 == TECHNICAL_SKILLS:
            case e.id>>8 == HELP:
            case e.id == CLOUD:
                if (picked[3] != -1) {
                    picked[1] = picked[2] = -1;
                } else {
                    picked[0] = picked[1] = picked[2] = -1;
                }
                return;
            case e.id == PERSONAL_SKILLS:
            case e.id>>4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[1] = PERSONAL_SKILLS, picked[2] = e.id != PERSONAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[1])!.index].show();
                break;
            case e.id == TECHNICAL_SKILLS:
            case e.id>>4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[1] = TECHNICAL_SKILLS, picked[2] = e.id != TECHNICAL_SKILLS ? e.id : -1;                 
                shapes[map.get(picked[1])!.index].show();
                break;
            case e.id == HELP:
            case e.id>>4 == HELP:
                picked[0] = HELP, picked[1] = e.id == SECOND ? FIRST : e.id, picked[2] = e.id == SECOND ? e.id : -1;
                shapes[map.get(picked[1])!.index].show();
                break;
            default:
                picked[0] = ROOT, picked[1] = e.id, picked[2] = -1;;
            }
            e.shape.show();
    });

    // Handle breadcrumbs
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
    breadcrumbs.addEventListener("pointerdown", (e: PointerEvent) => {
        moveInfoBox(null, 0, infoBox);

        const id = Number.parseInt((<HTMLElement>e.target).dataset.id!);
        switch (id) {
            case ROOT:
            case HELP:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4])!.index].blur();
                    shapes[map.get(picked[4])!.index].hide();
                }
                if (picked[3] != -1) {
                    shapes[map.get(picked[3])!.index].blur();
                    shapes[map.get(picked[3])!.index].hide();
                }
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild!);
                break;
            case PERSONAL_SKILLS:
            case PROJECTS:
            case TECHNICAL_SKILLS:
            case FIRST:
                if (picked[4] != -1) {
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
        gridDrag = false;
        panCamera();
    });

    const rootTxt = ["@", "help"];
    main.on("done", () => {
        if (picked[0] == -1) {
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

    (<HTMLElement>breadcrumbs.firstChild!).dataset.id = ROOT.toString();

    // Handle help
    let helpStarted = 0;
    const helpButton = document.querySelector<HTMLDivElement>("#canvas-box .control-box #help")!;
    helpButton.addEventListener("pointerdown", (e) => {
        e.preventDefault();

        if (helpStarted) {
            return;
        }
        helpStarted = 1;


        for (let i = 1; i < shapes.length; i++) {
            if (i < 9) {
                shapes[i].display = "hidden";
                shapes[i].blur();
                shapes[i].hide();
            } else {
                shapes[i].display = "fixed";
                shapes[i].show();
                shapes[i].hide();
            }
        }

        map.set(0, map.get(HELP)!);
        breadcrumbs.firstElementChild!.textContent = rootTxt[1];

        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = shapes[map.get(HELP)!.index].world[12] + offset[0];
        trgXZ[1] = shapes[map.get(HELP)!.index].world[14] + offset[1];
        gridDrag = false;
        panCamera();
    });

    const canvasBox = document.querySelector<HTMLDivElement>("#canvas-box")!;
    canvasBox.addEventListener("animationend", () => {
        canvasBox.dataset.help = "0";
    });

    function moveHand(x: number, y: number, z: number) {
        const hand = shapes[map.get(HAND)!.index];
        hand.world[12] = x;
        hand.world[13] = y;
        hand.world[14] = z;
        for (const child of hand) {
            if (child.type != ShapeType.SHADOW) { 
                child.world[12] = hand.world[12];
                child.world[13] = hand.world[13];
                child.world[14] = hand.world[14];
                continue;
            }

            if (helpStarted == 1) {
                child.world[12] = hand.world[12];
                child.world[14] = hand.world[14];
            } else {
                child.display = "hidden";
                child.blur();
                child.hide();
            }
        }

    }

    const handAmplitude = 0.00025;
    const handFrequency = 1.75;
    function animateHand() {
        const time = performance.now()/1000;
        const hand = shapes[map.get(HAND)!.index];
        for (const child of hand) {
            child.world[13] += child.type != ShapeType.SHADOW ? Math.sin(time*handFrequency)*handAmplitude : 0.0;
        }
    }

    const helpHints = [
        "Click and drag the map to move it around",
        "Click an object to move to it",
        "Click an icon to view a infobox.\n\nClick anywhere to close it",
        "Click the breadcrumbs to go back",
        "That's it!"
    ];
    const handWorlds = [
        shapes[map.get(HAND)!.index].world.translate(0.0, 0.08, 0.0),
        shapes[map.get(FIRST)!.index].world.translate(0.0, 0.15, 0.0),
        shapes[map.get(SECOND)!.index].world.translate(0.0, 0.225, 0.3714),
        new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
           -1.1, 0.5, 1.0, 1,
        ]),
        new mat4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]),
    ];
    const helpBox = document.querySelector<HTMLDivElement>("#canvas-box .help-box")!;
    main.on("done", () => {
        if (!helpStarted) {
            return;
        }
        animateHand();

        if (canvasBox.dataset.help != undefined) {
            return;
        }
        moveInfoBox(null, 0, infoBox);

        switch (helpStarted) {
            case 1:
            case 2:
                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);

                break;
            case 3:
                picked[0] = HELP, picked[3] = FIRST, picked[4] = SECOND;
                const first = shapes[map.get(FIRST)!.index]
                first.focus();
                const second = shapes[map.get(SECOND)!.index]
                second.focus();

                srcXZ[0] = cam[0];
                srcXZ[1] = cam[2];
                trgXZ[0] = second.world[12] + offset[0];
                trgXZ[1] = second.world[14] + offset[1];
                panCamera();

                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);

                break;
            case 4:
                const shape = shapes[map.get(HAND!)!.index];
                shape.display = "hidden";
                shape.blur();
                shape.hide();

                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);

                break;
            case 5:
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                for (let i = 1; i < shapes.length - 1; i++) {
                    if (i < 9) {
                        shapes[i].display = "fixed";
                        shapes[i].show();
                        shapes[i].hide();
                    } else {
                        shapes[i].display = "hidden";
                        shapes[i].blur();
                        shapes[i].hide();
                    }
                }
                map.set(0, {txt: ids[0][1], index: ids[0][0]});
                breadcrumbs.firstElementChild!.textContent = rootTxt[0];

                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted = 0;
                }, 4000);

                break;
        }

        const world = handWorlds[helpStarted - 1];
        canvasBox.dataset.help = "1";
        helpBox.textContent = helpHints[helpStarted - 1];
        gridDrag = false;
        moveInfoBox(world, 0, helpBox);
        moveHand(world[12], world[13], world[14]);
    });

    // Handle cloud
    let cloudState = 0;
    let cloudDrag = false;
    let cloudTrigger = 0;
    let cloudTimer = 0;
    main.on("pointerdown", (e: PointerPluginEvent) => {
        if (e.id != CLOUD || cloudState != 0) {
            return;
        }

        const rnd = Math.random();
        let newState = 0;
        switch (true) {
            case rnd < 0.1:
            case cloudTrigger == 9:
                newState = 5;
                cloudTrigger = 0;
                break;
            case rnd < 0.325:
                newState = 1;
                break;
            case rnd < 0.55:
                newState = 2;
                break;
            case rnd < 0.775:
                newState = 3;
                break;
            case rnd < 1:
                newState = 4;
                break;
        }

        gridDrag = false;
        cloudDrag = true;
        cloudTrigger++;
        cloudTimer = setTimeout(() => cloudState = 0, 300);
        requestAnimationFrame(() => {
            if (cloudState != 6) {
                cloudState = newState;
            }
        });
    });

    main.on("pointerup", () => {
        if (cloudState == 6) {
            cloudState = 0;
        }
        cloudDrag = false;
    });

    main.on("pointermove", (e: PointerPluginEvent) => {
        if (!cloudDrag) {
            return;
        }
        clearInterval(cloudTimer);
        cloudState = 6;

        const dx = (e.clientX/canvas.width);
        const dz = (e.clientY/canvas.height)*1.5;
        const cloud = shapes[map.get(CLOUD)!.index];
        cloud.world[12] += dx;
        cloud.world[14] -= dz;
        for (const child of cloud) {
            child.world[12] = cloud.world[12];
            child.world[14] = cloud.world[14];
        }
    });

    const cloudAmplitude = 0.0005;
    const cloudFrequency = 1;
    let cloudDelta = 0.0005;
    let cloudTurn = Math.random();
    main.on("done", () => {
        const cloud = shapes[map.get(CLOUD)!.index];
        if ((cloudDelta > 0.0 && cloud.world[12] >= cloudTurn) || (cloudDelta < 0.0 && cloud.world[12] <= -cloudTurn)) {
            cloudDelta = -cloudDelta;
            cloudTurn = Math.random();
        }

        const time = performance.now()/1000;
        cloud.world[12] += cloudDelta;
        for (const child of cloud) {
            child.world[12] = cloud.world[12];
            child.world[13] += child.type != ShapeType.SHADOW ? Math.sin(time*cloudFrequency)*cloudAmplitude : 0.0;
        }
    });
}());

// Handle portraits
(function () {
    const portraitBox = document.querySelector<HTMLDivElement>("#footer #contact-box > *:first-child")!;
    const duration = 15000;
    
    function switchPortrait() {
        let child: HTMLElement = null!
        while ((child = <HTMLElement>(!child ? portraitBox.firstElementChild : child.nextElementSibling)).dataset.animate != "1");

        const next = <HTMLElement>(child.nextElementSibling ?? portraitBox.firstElementChild);
        next.dataset.animate = "1";
        next.style.setProperty("display", "block");
        child.dataset.animate = "0";
    }

    let t = setInterval(switchPortrait, duration);
    portraitBox.addEventListener("pointerdown", () => {
        switchPortrait();
        clearInterval(t);
        t = setInterval(switchPortrait, duration);
    });

    portraitBox.childNodes.forEach((child) => {
        if (!(child instanceof HTMLElement)) {
            return;
        }

        if (child == portraitBox.firstElementChild) {
            child.dataset.animate = "1";
        }

        child.addEventListener("animationend", () => {
            if (child.dataset.animate == "1") {
                return;
            }
            child.style.setProperty("display", "none");
        });
    });

    const obs = new IntersectionObserver(() => {
        portraitBox.childNodes.forEach((child) => {
            if (!(child instanceof HTMLElement)) {
                return;
            }

            if (child == portraitBox.firstElementChild) {
                child.dataset.animate = "1";
                child.style.setProperty("display", "block");
            } else {
                child.dataset.animate = "0";
                child.style.setProperty("display", "none");
            }
        });
    }, {
        threshold: 0.5,
    });
    obs.observe(portraitBox);
}());

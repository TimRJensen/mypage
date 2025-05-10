import {mat4, vec3} from "./linalg.ts";
import {Program} from "./webgl/core.ts";
import {SceneEvent} from "./webgl/scene-driver.ts";
import {PickPlugin, PickPluginEvent} from "./webgl/plugins/pick.ts";
import {BloomPlugin} from "./webgl/plugins/bloom.ts";
import {Shape, Circle, Edge, Grid, Node, Plane, RootNode, ShapeType, Text, Texture,} from "./webgl/geometry.ts";
import vs from "./webgl/shaders/vertex-main.ts";
import fs from "./webgl/shaders/fragment-main.ts";
import hints from "./hints.ts";

/**
 * Handle live-reload
 */
(function (on: boolean) {
    if (!on) {
        return;
    }

    const ws = new WebSocket("ws://192.168.0.107:4242");
    ws.onmessage = (msg) => {
        if (msg.data === "reload") {
            location.reload();
        }
    };
})(false);

/**
 * Handle text
 */
(function () {
    const textBox = document.querySelector<HTMLDivElement>("#text-box")!;
    for (const child of textBox.children) {
        if (child == textBox.firstElementChild) {
            child.setAttribute("data-show", "");
        }
        (<HTMLElement>child).addEventListener("animationend", () => {
            if (!child.nextElementSibling) {
                return;
            }
            child.removeAttribute("data-show");
        }, {once: true});
    }

    const duration = [5725, 5725, 5725, 5725, 5725, 2725];
    let t = setTimeout(function fn() {
        const child = textBox.querySelector<HTMLDivElement>(".text[data-show]")!;
        if (!child.nextElementSibling) {
            return;
        }
        child.nextElementSibling.setAttribute("data-show", "1");
        clearTimeout(t);
        t = setTimeout(fn, duration.pop()!);
    }, duration.pop()!);
}());

/**
 * Handle transition
 */
(function () {
    const canvasBox = document.querySelector<HTMLDivElement>("#canvas-box")!;
    document.querySelectorAll<HTMLButtonElement>("#text-box .button, #footer .button")!.forEach((button) => {
        button.addEventListener(
            "pointerdown",
            () => canvasBox.scrollIntoView({behavior: "smooth"}),
        );
    });
})();

/**
 * WebGL2 stuff
 */
(async function () {
    // Shapes
    const shapes = [ //col == row == 0.1238
        // Grid
        new Grid(1.3, 1.5, 7, {id: 0, color: [133, 71, 194]}),
        // Frontend
        new Node({id: 0x20, pos: [0.0, 0.0, 0.5321], scale: [2.5, 1.0, 1.5], shapes: [
            new Text(1, 7, {pos: [0.0, 0.0025, -0.077], rotation: [Math.PI, 0.0, 0.0]}),
            new Edge([0.0, 0.06, 0.5571], [0.0, 0.06, -0.0869], 0x20),
            new Texture(0, 0, {id: 0x200, pos: [0.0000, 0.0, 0.5900]}),
            new Texture(0, 1, {id: 0x201, pos: [-0.1846, 0.0, 0.5519], shapes: [
                new Plane(0, {id: 0x201, type: ShapeType.BACKGROUND, pos: [0.0, 0.1, 0.0]}),
            ]}),
            new Texture(0, 2, {id: 0x202, pos: [0.1846, 0.0, 0.5519]}),
            new Texture(0, 3, {id: 0x203, pos: [-0.3391, 0.0, 0.4437]}),
            new Texture(0, 4, {id: 0x204, pos: [0.3391, 0.0, 0.4437]}),
            new Texture(0, 5, {id: 0x205, pos: [-0.4381, 0.0, 0.2833]}),
            new Texture(0, 6, {id: 0x206, pos: [0.4381, 0.0, 0.2833]}),
        ]}),
        // Backend
        new Node({id: 0x21, pos: [-0.6190, 0.0, 0.2845], shapes: [
            new Text(1, 8, {pos: [0.077, 0.0025, -0.077], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Edge([-0.6190, 0.06, 0.2845], [0.0, 0.06, -0.0869], 0x21),
            new Texture(0, 7, {id: 0x210, pos: [0.2331, 0.0, 0.4038]}),
            new Texture(0, 8, {id: 0x211, pos: [0.0809, 0.0, 0.4591]}),
            new Texture(0, 9, {id: 0x212, pos: [-0.0810, 0.0, 0.4591]}),
            new Texture(0, 10, {id: 0x213, pos: [-0.2331, 0.0, 0.4037]}),
            new Texture(0, 11, {id: 0x214, pos: [-0.3571, 0.0, 0.2997]}),
            new Texture(0, 12, {id: 0x215, pos: [-0.4381, 0.0, 0.1595], shapes: [
                new Plane(0, {id: 0x215, type: ShapeType.BACKGROUND, pos: [0.0, 0.1, 0.0]}),
            ]}),
        ]}),
        // All purpose
        new Node({id: 0x22, pos: [0.6190, 0.00, 0.2845], shapes: [
            new Text(1, 9, {pos: [-0.077, 0.0025, -0.077], rotation: [Math.PI, Math.PI/4, 0.0]}),
            new Edge([0.6190, 0.06, 0.2845], [0.0, 0.06, -0.0869], 0x22),
            new Texture(0, 13, {id: 0x220, pos: [-0.2331, 0.0, 0.4038]}),
            new Texture(0, 14, {id: 0x221, pos: [-0.0406, 0.0, 0.4644]}),
            new Texture(0, 15, {id: 0x222, pos: [0.1595, 0.0, 0.4381], shapes: [
                new Plane(0, {id: 0x222, type: ShapeType.BACKGROUND, pos: [0.0, 0.1, 0.0]}),
            ]}),
            new Texture(0, 16, {id: 0x223, pos: [0.3297, 0.0, 0.3297]}),
            new Texture(0, 17, {id: 0x224, pos: [0.4381, 0.0, 0.1595]}),
        ]}),
        // Technical skills
        new Node({id: 0x2, pos: [0.0, 0.0, -0.0869], shapes: [
            new Text(1, 10, {pos: [0.0, 0.0025, -0.1155], rotation: [Math.PI, 0.0, 0.0]}),
            new Edge([0.0, 0.07, -0.1113], [0.0, 0.06, -0.7092], 0x2),
        ]}),
        // Projects
        new Node({id: 0x3, pos: [0.4952, 0.0, -0.4583], shapes: [
            new Text(1, 13, {pos: [-0.05, 0.0025, -0.05], rotation: [Math.PI, Math.PI/4, 0.0]}),
            new Edge([0.4952, 0.07, -0.4583], [0.024, 0.06, -0.7092], 0x3),
            new Texture(2, 2, {id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI/2, 0.0, 0.5]}),
            new Texture(2, 0, {id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI/2, 0.0, 0.5]}),
        ]}),
        // About me
        new Node({id: 0x41, pos: [-1.1142, 0.0, 0.0369], shapes: [
            new Text(1, 11, {pos: [0.077, 0.0025, -0.077], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Edge([-1.1142, 0.06, 0.0369], [-0.4952, 0.06, -0.4583], 0x41),
        ]}),
        // Personal skills
        new Node({id: 0x4, pos: [-0.4952, 0.0, -0.4583], shapes: [
            new Text(1, 12, {pos: [0.077, 0.0025, -0.077], rotation: [Math.PI, -Math.PI/4, 0.0]}),
            new Edge([-0.4952, 0.07, -0.4583], [-0.024, 0.06, -0.7092], 0x4),
            new Texture(0, 18, {id: 0x400, pos: [0.0619, 0.0, 0.3885], scale: [1.1, 1.0, 1.1]}),
            new Texture(0, 19, {id: 0x401, pos: [-0.0868, 0.0, 0.3589], scale: [0.75, 1.0, 0.75]}),
            new Texture(0, 20, {id: 0x402, pos: [-0.2128, 0.0, 0.2747], scale: [0.75, 1.0, 0.75]}),
            new Texture(0, 21, {id: 0x403, pos: [-0.2881, 0.0, 0.1500], scale: [1.25, 1.0, 1.25]}),
            new Texture(0, 22, {id: 0x404, pos: [-0.3266, 0.0, 0.0], scale: [0.75, 1.0, 0.75]}),
        ]}),
        // Root
        new RootNode({id: 1, pos: [0.0, 0.0, -0.7059]}),
        // Help
        new Node({id: 0x50, pos: [0.0, 0.0, 0.5321], shapes: [
            new Edge([0.0, 0.06, 0.5321], [0.0, 0.06, -0.0869], 0x50),
            new Texture(0, 23, {id: 0x500, pos: [0.0, 0.0, 0.3714]}),
        ]}),
        new Node({id: 0x5, pos: [0.0, 0.0, -0.0869], shapes: [
            new Edge([0.0, 0.06, -0.0869], [0.0, 0.06, -0.7059], 0x5),
        ]}),
        new Node({id: 0x6, pos: [0.0, 0.0, -0.7059]}),
        // Hand
        new Texture(0, 24, {display: "fixed", pos: [0.3714, 0.0, -0.3345], scale: [0.5, 1.0, 0.5]}),
        // Cloud
        new Text(1, 0, {id: 0x8, display: "fixed", pos: [0.0, 0.3714, 1.1142], rotation: [-Math.PI/2, 0.0, 0.0], scale: [3.0, 1.0, 1.5], shapes: [
            new Circle({type: ShapeType.SHADOW, pos: [0.0, -0.3610, 0.0], color: [0, 0, 0]}),
        ]}),
    ];
    const ROOT = 0x1;
    const TECHNICAL_SKILLS = 0x2;
    const PROJECTS = 0x3;
    const PERSONAL_SKILLS = 0x4;
    const FIRST = 0x5;
    const SECOND = 0x50;
    const HELP = 0x6;
    const HAND = 0x7;
    const CLOUD = 0x8;

    const map = new Map<number, {txt: string; shape: Shape}>([
        [(TECHNICAL_SKILLS << 4) + 0x0, {txt: "frontend", shape: shapes[1]}],
        [(TECHNICAL_SKILLS << 4) + 0x1, {txt: "backend", shape: shapes[2]}],
        [(TECHNICAL_SKILLS << 4) + 0x2, {txt: "all purpose", shape: shapes[3]}],
        [TECHNICAL_SKILLS, {txt: "technical skills", shape: shapes[4]}],
        [PROJECTS, {txt: "projects", shape: shapes[5]}],
        [(PERSONAL_SKILLS << 4) + 0x1, {txt: "about me", shape: shapes[6]}],
        [PERSONAL_SKILLS, {txt: "personal skills", shape: shapes[7]}],
        [ROOT, {txt: "contact", shape: shapes[8]}],
        [(FIRST << 4) + 0.0, {txt: "second", shape: shapes[9]}],
        [FIRST, {txt: "first", shape: shapes[10]}],
        [HELP, {txt: "start", shape: shapes[11]}],
        [HAND, {txt: "", shape: shapes[12]}],
        [CLOUD, {txt: "", shape: shapes[13]}],
    ]);
    const picked = [-1, -1, -1, -1, -1];

    // Viewprojection matrix
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas-box #canvas")!;
    const pm = mat4.perspective(Math.PI/4, 16/9, 0.1, 3.5);
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const view = mat4.lookAt(cam, center, up);
    
    // Create the WebGL program.
    const program = await new Program(canvas, vs, fs, {
        a_position: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
        a_uv: {type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4},
        a_normal: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4},
    }, {
        fps: "adaptive",
        downsample: "adaptive"
    },
    {
        globals: {
            color: [102, 51, 153],
            textures: {
                "/static/imgs/atlas-logos.png": {
                    width: 256,
                    height: 256,
                    depth: 28,
                    target: WebGL2RenderingContext.TEXTURE_2D_ARRAY,
                },
                "/static/imgs/atlas-grid-texts.png": {
                    width: 512,
                    height: 256,
                    depth: 14,
                    target: WebGL2RenderingContext.TEXTURE_2D_ARRAY,
                },
                "/static/imgs/atlas-projects.png": {
                    width: 512,
                    height: 512,
                    depth: 4,
                    target: WebGL2RenderingContext.TEXTURE_2D_ARRAY,
                },
            },
            setters: {
                u_project: pm,
                u_view: view,
                u_view_normal: () => view.mat3().inverse().transpose(),
                u_light: new vec3(0.0, -0.75, 1.45),
            }
        },
        scenes: [
            {
                name: "main",
                drawables: [...shapes.slice(0, 9), shapes[shapes.length - 1]],
                setters: {
                    u_world: (shape) => shape.world,
                    u_type: (shape) => shape.type,
                    u_picked: (shape) => picked.some((id) => id == shape.id) ? 1 : 0,
                    u_color: (shape) => picked.some((id) => id == shape.id) ? shape.pickColor : shape.color,
                    u_depth: (shape) => shape.id == CLOUD ? cloudState : shape.depth,
                }
            },
            {
                name: "guide",
                drawables: [shapes[0], ...shapes.slice(9)],
                setters: {
                    u_world: (shape) => shape.world,
                    u_type: (shape) => shape.type,
                    u_picked: (shape) => picked.some((id) => id == shape.id) ? 1 : 0,
                    u_color: (shape) => picked.some((id) => id == shape.id) ? shape.pickColor : shape.color,
                    u_depth: (shape) => shape.id == CLOUD ? cloudState : shape.depth,
                }
            },
        ],
    }, [
        BloomPlugin,
        PickPlugin,
    ])
        .ready();
    program.render();

    // Handle drag
    const bounds = [[1.5, -1.5], [0.5, -1.75]];
    let pointer = -1;
    canvas.addEventListener("pointermove", (e) => {
        if (pointer == -1) {
            return;
        }

        const dx = e.movementX/canvas.width;
        const dz = e.movementY/canvas.height;
        if ((cam.x < bounds[0][0] && dx <= 0) || (cam.x > bounds[0][1] && dx >= 0)) {
            cam.x -= dx;
            center.x -= dx;
        }
        if ((cam.z > bounds[1][1] && dz <= 0) || (cam.z < bounds[1][0] && dz >= 0)) {
            cam.z += dz;
            center.z += dz;
        }

        view.set(mat4.lookAt(cam, center, up));
    }, {passive: false});
    canvas.addEventListener("pointerup", () => {
        if (pointer == -1) {
            return;
        }

        canvas.releasePointerCapture(pointer);
        pointer = -1;
    }, {passive: false});
    canvas.addEventListener("pointerdown", (e) => {
        if (progress != 0) {
            return;
        }

        canvas.setPointerCapture(e.pointerId);
        pointer = e.pointerId;
    }, {passive: false});

    // Handle pick (click)
    // picked[0] == root, picked[1 && 2] == hovered, picked[3 && 4] == focused
    const duration = 500;
    const step = 1/(duration/(1000/60));
    const offset = [0.2, -0.8];
    let progress = 0;

    function easeInOut(alpha: number) {
        return alpha < 0.5 ? 2*alpha*alpha : 1 - Math.pow(-2*alpha + 2, 2)/2;
    }
    function lerp(a: number, b: number, alpha: number): number {
        return a*(1 - alpha) + b*alpha;
    }
    function panCamera(srcX: number, srcZ: number, trgX: number, trgZ: number) {
        requestAnimationFrame(function fn() {
            if (progress >= 1.0) {
                progress = 0;
                return;
            }
            progress += step;
    
            const alpha = easeInOut(progress);
            const offsetXZ = [center.x - cam.x, center.z - cam.z];
            cam.x = lerp(srcX, trgX, alpha);
            cam.z = lerp(srcZ, trgZ, alpha);
            center.x = cam.x + offsetXZ[0];
            center.z = cam.z + offsetXZ[1];
            view.set(mat4.lookAt(cam, center, up));
    
            requestAnimationFrame(fn);
        });
    }

    const infoBox = document.querySelector<HTMLDivElement>("#canvas-box .hint-box")!;
    function moveInfoBox(world: mat4 | null, id: number, panel: HTMLDivElement) {
        if (!world) {
            panel.removeAttribute("data-show");
            return;
        }

        requestAnimationFrame(function fn() {
            if (progress >= 1.0) {
                return;
            }

            const vpm = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
            const rect = canvas.getBoundingClientRect();
            const x = (vpm.x/vpm.w)*0.5 + 0.5;
            const y = (vpm.y/vpm.w)*-0.5 + 0.5;
            panel.style.left = rect.left + x*rect.width + "px";
            panel.style.top = rect.top + y*rect.height + "px";
            requestAnimationFrame(fn);
        });

        const vpm = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
        const rect = canvas.getBoundingClientRect();
        const x = (vpm.x/vpm.w)*0.5 + 0.5;
        const y = (vpm.y/vpm.w)*-0.5 + 0.5;
        panel.style.left = rect.left + x*rect.width + "px";
        panel.style.top = rect.top + y*rect.height + "px";

        if (id) {
            panel.setAttribute("data-show", id.toString());
            panel.firstElementChild!.innerHTML = hints[id]?.txt;
        }

        const last = panel.lastElementChild!;
        for (let i = 0; i < last.children.length; i++) {
            last.children[i].setAttribute("data-toggled", i < hints[id].rating ? "1" : "0");
        }
    }

    const footer = document.querySelector<HTMLFieldSetElement>("#footer")!;
    program.on("pointerdown", (e: PickPluginEvent) => {
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
            case e.id == PERSONAL_SKILLS:
            case e.id == PROJECTS:
            case e.id == TECHNICAL_SKILLS:
            case e.id == FIRST:
            case e.id == HELP:
                picked[0] = e.id < FIRST ? ROOT : HELP, picked[3] = e.id, picked[4] = -1;
                map.get(picked[0])!.shape.focus();
                e.shape.focus();
                e.shape.parent()?.focus();
                break;
            case e.id >> 4 == PERSONAL_SKILLS:
            case e.id >> 4 == PROJECTS:
            case e.id >> 4 == TECHNICAL_SKILLS:
            case e.id >> 4 == FIRST:
                picked[0] = e.id >> 4 < FIRST ? ROOT : HELP, picked[3] = e.id >> 4, picked[4] = e.id;
                map.get(picked[0])!.shape.focus();
                map.get(picked[3])!.shape.focus();
                e.shape.focus();
                e.shape.parent()?.focus();
                if (e.id in hints) {
                    moveInfoBox(e.shape.world, e.id, infoBox);
                }
                break;
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
            case e.id >> 8 == FIRST:
                picked[0] = e.id >> 8 < FIRST ? ROOT : HELP, picked[3] = e.id >> 8, picked[4] = e.id >> 4;
                map.get(picked[0])!.shape.focus();
                map.get(picked[3])!.shape.focus();
                map.get(picked[4])?.shape.focus();
                if (e.id in hints) {
                    moveInfoBox(e.shape.world, e.id, infoBox);
                }
                if (Math.hypot(e.shape.world.x - cam.x, e.shape.world.z - cam.z) < 0.3714) {
                    return;
                };
                // e.shape = (map.get(e.id >> 4) ?? map.get(e.id >> 8))!.shape;
                break;
        }

        panCamera(cam.x, cam.z, e.shape.world.x + offset[0], e.shape.world.z + offset[1]);
    });

    // Handle pick (hover)
    program.on("pointermove", (e: PickPluginEvent) => {
        if (picked[1] == e.id || picked[2] == e.id) {
            return;
        }

        for (const shape of shapes) {
            shape.hide();
        }

        switch (true) {
            case e.id == ROOT:
            case e.id == PERSONAL_SKILLS:
            case e.id == PROJECTS:
            case e.id == TECHNICAL_SKILLS:
            case e.id == FIRST:
            case e.id == HELP:
                picked[0] = e.id < FIRST ? ROOT : HELP, picked[1] = e.id, picked[2] = -1;
                map.get(picked[0])!.shape.show();
                e.shape.show();
                e.shape.parent()?.show();
                return;
            case e.id >> 4 == PERSONAL_SKILLS:
            case e.id >> 4 == PROJECTS:
            case e.id >> 4 == TECHNICAL_SKILLS:
            case e.id >> 4 == FIRST:
                picked[0] = e.id >> 4 < FIRST ? ROOT : HELP, picked[1] = e.id >> 4, picked[2] = e.id;
                map.get(picked[0])!.shape.show();
                map.get(picked[1])!.shape.show();
                e.shape.show();
                e.shape.parent()?.show();
                return;
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
            case e.id >> 8 == FIRST:
                picked[0] = e.id >> 8 < FIRST ? ROOT : HELP, picked[1] = e.id >> 8, picked[2] = e.id >> 4;
                map.get(picked[0])!.shape.show();
                map.get(picked[1])!.shape.show();
                e.shape.show();
                e.shape.parent()?.show();
                return;
            default:
                if (picked[3] != -1) {
                    picked[1] = picked[2] = -1;
                } else {
                    picked[0] = picked[1] = picked[2] = -1;
                }
                return;
        }
    });

    // Handle breadcrumbs
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
    breadcrumbs.addEventListener("pointerdown", (e: PointerEvent) => {
        e.preventDefault();
        moveInfoBox(null, 0, infoBox);

        const id = Number.parseInt((<HTMLElement>e.target).getAttribute("id") ?? ROOT.toString());
        switch (id) {
            case ROOT:
            case HELP:
                map.get(picked[4])?.shape.blur();
                map.get(picked[4])?.shape.hide();
                map.get(picked[3])?.shape.blur();
                map.get(picked[3])?.shape.hide();
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild!);
                break;
            case PERSONAL_SKILLS:
            case PROJECTS:
            case TECHNICAL_SKILLS:
            case FIRST:
                map.get(picked[4])?.shape.blur();
                map.get(picked[4])?.shape.hide();
                picked[2] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild!, breadcrumbs.children[1]);
                break;
        }

        const shape = map.get(id)!.shape;
        panCamera(cam.x, cam.z, shape.world.x + offset[0], shape.world.z + offset[1]);
    });

    program.on("done", () => {
        if (picked[1] == -1 && picked[3] == -1) {
            breadcrumbs.replaceChildren(breadcrumbs.firstChild!);
            return;
        }

        // focused
        const a = [breadcrumbs.firstChild!];
        for (const id of picked.slice(3)) {
            if (!map.has(id)) {
                continue;
            }

            const span = document.createElement("span");
            span.textContent = ' \u21FE ' + map.get(id)?.txt;
            span.setAttribute("id", id.toString());
            a.push(span);
        }
        // hovered
        const b = [breadcrumbs.firstChild!];
        for (const id of picked.slice(1, 3)) {
            if (!map.has(id)) {
                continue;
            }

            const span = document.createElement("span");
            span.textContent = ' \u21FE ' + map.get(id)?.txt;
            span.setAttribute("id", id.toString());
            b.push(span);
        }

        breadcrumbs.replaceChildren(...(b.length > 1 ? b : a));
    });

    // Handle help
    let helpStarted = 0;
    const rootTxt = ["@", "breadcrumbs"];
    const guide = program.get("guide")!;
    guide.on("switch", (e: SceneEvent<Shape>) => {
        breadcrumbs.firstElementChild!.textContent = rootTxt[e.next == guide ? 1 : 0];
        picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
        for (const shape of e.prev.drawables) {
            shape.blur();
            shape.hide();
        }

        const shape = map.get(HELP)!.shape;
        panCamera(cam.x, cam.z, shape.world.x + offset[0], shape.world.z + offset[1]);
    });

    const helpButton = document.querySelector<HTMLDivElement>("#canvas-box .control-box #help")!;
    helpButton.addEventListener("pointerdown", (e) => {
        e.preventDefault();

        if (helpStarted) {
            return;
        }
        helpStarted = 1;
        program.switch("guide");
    });

    function moveHand(x: number, y: number, z: number) {
        const hand = map.get(HAND)!.shape;
        hand.world.x = x;
        hand.world.y = y;
        hand.world.z = z;
        for (const child of hand) {
            if (child == hand.firstChild()) {
                child.world.y = hand.world.y;
            }
            child.world.x = hand.world.x;
            child.world.z = hand.world.z;
        }
    }

    const handAmplitude = 0.00025;
    const handFrequency = 1.75;
    function animateHand() {
        const time = performance.now()/1000;
        const hand = map.get(HAND)!.shape;
        for (const child of hand) {
            if (child == hand.firstChild()) {
                child.world.y += Math.sin(time*handFrequency)*handAmplitude;
            }
            child.world.x = hand.world.x;
        }
    }

    const helpHints = [
        "Here's a quick tour",
        "Click and drag the map to move it around",
        "Click an object to move to it",
        "Click an icon to view an infobox\n\nClick anywhere to close it",
        "Click the breadcrumbs to go back",
        "That's it!",
    ];
    const handWorlds = [
        map.get(HAND)!.shape.world.translate(0.0, 0.06, 0.0),
        map.get(FIRST)!.shape.world.translate(0.0, 0.15, 0.0),
        map.get(SECOND)!.shape.world.translate(0.0, 0.225, 0.3714),
        map.get(HAND)!.shape.world.translate(0.0, 0.08, 0.0),
    ];
    const helpBox = document.querySelector<HTMLDivElement>("#canvas-box .help-box")!;
    guide.on("done", () => {
        if (!helpStarted) {
            return;
        }
        animateHand();

        if (helpBox.hasAttribute("data-show")) {
            return;
        }
        moveInfoBox(null, 0, infoBox);
        
        helpBox.setAttribute("data-show", "1");
        helpBox.textContent = helpHints[helpStarted - 1];
        let shape = map.get(HAND)!.shape;
        switch (helpStarted) {
            case 1:
                shape.display = "none";
                shape.hide();
                setTimeout(() => {
                    helpBox.setAttribute("data-show", "0");
                }, 4000);
                setTimeout(() => {
                    shape.display = "fixed";
                    shape.show();

                    helpBox.removeAttribute("data-show");
                    helpStarted++;
                }, 5000);
                return;
            case 3:
                shape = shape.lastChild()!;
                shape.display = "none";
                shape.blur();
                shape.hide();
                break;
            case 4:
                picked[0] = HELP, picked[3] = FIRST, picked[4] = SECOND;
                
                shape = map.get(SECOND)!.shape;
                shape.focus();
                map.get(HELP)!.shape.focus();
                map.get(FIRST)!.shape.focus();

                panCamera(cam.x, cam.z, shape.world.x + offset[0], shape.world.z + offset[1]);
                break;
            case 5:
                shape.display = "none";
                shape.blur();
                shape.hide();
                break;
            case 6:
                program.switch("main");

                shape.display = "fixed";
                shape = shape.lastChild()!;
                shape.display = "inherit";

                helpBox.setAttribute("data-show", "1");
                helpBox.textContent = helpHints[helpStarted - 1];
                setTimeout(() => {
                    helpBox.removeAttribute("data-show");
                    helpStarted = 0;
                }, 4000);
                return;
        }
        const world = handWorlds[helpStarted - 2];
        moveHand(world.x, world.y, world.z);
 
        setTimeout(() => {
            helpBox.setAttribute("data-show", "");
        }, 4000);
        setTimeout(() => {
            helpBox.removeAttribute("data-show");
            helpStarted++;
        }, 9000);
    });

    const obs = new IntersectionObserver((entry) => {
        if (entry[0].intersectionRatio < 0.25) {
            return;
        }

        requestAnimationFrame(function fn() {
            if (globalThis.matchMedia("(orientation: landscape)").matches) {
                helpStarted = 1;
                program.switch("guide");
            } else {
                requestAnimationFrame(fn);
            }
        });
        
        obs.disconnect();
    }, {
        threshold: 0.25,
    });
    obs.observe(canvas);

    // Handle cloud
    const cloudStates = [0, 1, 2, 3, 4, 5, 6];
    let cloudState = cloudStates[0];
    let cloudDrag = false;
    let cloudTrigger = 0;
    program.on("pointerdown", (e: PickPluginEvent) => {
        if (e.id != CLOUD || cloudState != 0) {
            return;
        }

        const rnd = Math.random();
        switch (true) {
            case rnd < 0.1:
            case cloudTrigger == 9:
                cloudState = cloudStates[5];
                cloudTrigger = 0;
                break;
            case rnd < 0.325:
                cloudState = cloudStates[1];
                break;
            case rnd < 0.55:
                cloudState = cloudStates[2];
                break;
            case rnd < 0.775:
                cloudState = cloudStates[3];
                break;
            case rnd < 1:
                cloudState = cloudStates[4];
                break;
        }

        pointer = -1;
        cloudDrag = true;
        cloudTrigger++;
    });

    program.on("pointerup", () => {
        if (cloudState == cloudStates[6]) {
            cloudState = cloudStates[0];
            console.log("foo")
        } else {
            setTimeout(() => cloudState = 0, 300);
        }
        cloudDrag = false;
    });

    program.on("pointermove", (e: PickPluginEvent) => {
        if (!cloudDrag) {
            return;
        }
        cloudState = cloudStates[6];

        const dx = e.movementX/canvas.width;
        const dz = (e.movementY/canvas.height)*1.5;
        const cloud = map.get(CLOUD)!.shape;
        cloud.world.x += dx;
        cloud.world.z -= dz;
        for (const child of cloud) {
            child.world.x = cloud.world.x;
            child.world.z = cloud.world.z;
        }
    });

    const cloudAmplitude = 0.0005;
    const cloudFrequency = 1;
    let cloudDelta = 0.0005;
    let cloudTurn = Math.random();
    program.on("done", () => {
        const cloud = map.get(CLOUD)!.shape;
        if ((cloudDelta > 0.0 && cloud.world[12] >= cloudTurn) || (cloudDelta < 0.0 && cloud.world[12] <= -cloudTurn)) {
            cloudDelta = -cloudDelta;
            cloudTurn = Math.random();
        }

        const time = performance.now()/1000;
        cloud.world.x += cloudDelta;
        for (const child of cloud) {
            if (child == cloud.firstChild()) {
                child.world.y += Math.sin(time*cloudFrequency)*cloudAmplitude;
            }
            child.world.x = cloud.world.x;
        }
    });

    program.render();
})();

// Handle portraits
(function () {
    const portraitBox = document.querySelector<HTMLDivElement>("#footer #contact-box > *:first-child")!;
    for (const child of portraitBox.children) {
        (<HTMLElement>child).addEventListener("animationend", () => {
            child.removeAttribute("data-show");
        });
    }

    let t = 0;
    const duration = 14500;
    function switchPortrait() {
        const child = portraitBox.querySelector<HTMLDivElement>("*[data-show]")!;
        if (child.nextElementSibling) {
            child.nextElementSibling.setAttribute("data-show", "1");
        } else {
            portraitBox.firstElementChild!.setAttribute("data-show", "1");
        }
    }

    portraitBox.addEventListener("pointerdown", () => {
        const child = portraitBox.querySelector<HTMLDivElement>("*[data-show")!;
        switchPortrait();
        child.removeAttribute("data-show");
        
        clearInterval(t);
        t = setInterval(switchPortrait, duration);
    });

    const obs = new IntersectionObserver((intersection) => {
        if (intersection[0].intersectionRatio < 0.5) {
            for (const child of portraitBox.children) {
                child.removeAttribute("data-show");
            }
            clearInterval(t);
            return;
        }

        portraitBox.firstElementChild!.setAttribute("data-show", "");
        t = setInterval(switchPortrait, duration);
    }, {
        threshold: 0.5,
    });
    obs.observe(portraitBox);
})();

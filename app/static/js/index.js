import { mat4, vec3 } from "./linalg.js";
import { Program } from "./webgl/core.js";
import { PointerPlugin } from "./webgl/plugins/pointer.js";
import { BloomPlugin } from "./webgl/plugins/bloom.js";
import { Grid, Composite, RootNode, Node, Edge, Logo, Text, Project, Circle, ShapeType } from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";
import infos from "./hints.js";
/**
 * Handle transition
 */
(function () {
    document.querySelectorAll("#msg-box .button, #footer .button").forEach((button) => {
        button.addEventListener("pointerdown", () => document.querySelector("#canvas-box").scrollIntoView({ behavior: "smooth" }));
    });
}());
/**
 * WebGL2 stuff
 */
(function () {
    const canvas = document.querySelector("#canvas-box #canvas");
    const gl = canvas.getContext("webgl2", { antialias: true });
    if (!gl) {
        throw new Error("WebGL2 is not supported");
    }
    canvas.width = window.innerWidth;
    canvas.height = (window.innerWidth * 9) / 16;
    // Shapes
    const shapes = [
        // Grid
        new Grid(gl, 1.3, 1.5, 7, { id: 0, color: [151, 101, 205] }),
        // Root
        new Composite(gl, { id: 1, display: "fixed", pos: [0.0, 0.0, -0.728], shapes: [
                new RootNode(gl, {}),
            ] }),
        // Frontend
        new Composite(gl, { id: 0x20, display: "fixed", pos: [0.0, 0.0, 0.5077], shapes: [
                new Text(gl, 7, { pos: [0.0, 0.001, -0.0619], rotation: [Math.PI, 0.0, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.0863]),
                new Logo(gl, 0, { id: 0x200, pos: [0.0000, 0.1, 0.5900] }),
                new Logo(gl, 1, { id: 0x201, pos: [-0.1846, 0.1, 0.5519] }),
                new Logo(gl, 2, { id: 0x202, pos: [0.1846, 0.1, 0.5519] }),
                new Logo(gl, 3, { id: 0x203, pos: [-0.3391, 0.1, 0.4437] }),
                new Logo(gl, 4, { id: 0x204, pos: [0.3391, 0.1, 0.4437] }),
                new Logo(gl, 5, { id: 0x205, pos: [-0.4381, 0.1, 0.2833] }),
                new Logo(gl, 6, { id: 0x206, pos: [0.4381, 0.1, 0.2833] }),
            ] }),
        // Backend
        new Composite(gl, { id: 0x21, display: "fixed", pos: [-0.6065, 0.0, 0.2601], shapes: [
                new Text(gl, 8, { pos: [0.0619, 0.001, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
                new Logo(gl, 7, { id: 0x210, pos: [0.2331, 0.1, 0.4038] }),
                new Logo(gl, 8, { id: 0x211, pos: [0.0809, 0.1, 0.4591] }),
                new Logo(gl, 9, { id: 0x212, pos: [-0.0810, 0.1, 0.4591] }),
                new Logo(gl, 10, { id: 0x213, pos: [-0.2331, 0.1, 0.4037] }),
                new Logo(gl, 11, { id: 0x214, pos: [-0.3571, 0.1, 0.2997] }),
                new Logo(gl, 12, { id: 0x215, pos: [-0.4381, 0.1, 0.1595] }),
            ] }),
        // All purpose
        new Composite(gl, { id: 0x22, display: "fixed", pos: [0.6065, 0.00, 0.2601], shapes: [
                new Text(gl, 9, { pos: [-0.0850, 0.001, -0.0619], rotation: [Math.PI, Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
                new Logo(gl, 13, { id: 0x220, pos: [-0.2331, 0.1, 0.4038] }),
                new Logo(gl, 14, { id: 0x221, pos: [-0.0406, 0.1, 0.4644] }),
                new Logo(gl, 15, { id: 0x222, pos: [0.1595, 0.1, 0.4381] }),
                new Logo(gl, 16, { id: 0x223, pos: [0.3297, 0.1, 0.3297] }),
                new Logo(gl, 17, { id: 0x224, pos: [0.4381, 0.1, 0.1595] }),
            ] }),
        // Technical skills
        new Composite(gl, { id: 0x2, display: "fixed", pos: [0.0, 0.0, -0.1113], shapes: [
                new Text(gl, 10, { pos: [0.0, 0.001, -0.1113], rotation: [Math.PI, 0.0, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, -0.1113], [0.0, 0.06, -0.728]),
            ] }),
        // Projects
        new Composite(gl, { id: 0x3, display: "fixed", pos: [0.4820, 0.0, -0.4819], shapes: [
                new Text(gl, 13, { pos: [-0.045, 0.001, -0.045], rotation: [Math.PI, Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Project(gl, 1, { id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI / 2, 0.0, 0.5] }),
                new Project(gl, 0, { id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI / 2, 0.0, 0.5] }),
            ] }),
        // About me
        new Composite(gl, { id: 0x41, display: "fixed", pos: [-1.1018, 0.0, 0.0125], shapes: [
                new Text(gl, 11, { pos: [0.0619, 0.0, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-1.1018, 0.06, 0.0125], [-0.5020, 0.06, -0.4620]),
            ] }),
        // Personal skills
        new Composite(gl, { id: 0x4, display: "fixed", pos: [-0.4820, 0.001, -0.4820], shapes: [
                new Text(gl, 12, { pos: [0.077, 0.0, -0.07], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Logo(gl, 18, { id: 0x400, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1.0, 1.1] }),
                new Logo(gl, 19, { id: 0x401, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 20, { id: 0x402, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 21, { id: 0x403, pos: [-0.2881, 0.1, 0.1500], scale: [1.25, 1.0, 1.25] }),
                new Logo(gl, 22, { id: 0x404, pos: [-0.3266, 0.1, 0.0], scale: [0.75, 1.0, 0.75] }),
            ] }),
        // Help
        new Composite(gl, { id: 0x50, display: "hidden", pos: [0.0, 0.0, 0.0], shapes: [
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, 0.0], [0.0, 0.06, -0.3714]),
                new Logo(gl, 23, { id: 0x500, pos: [0.0, 0.1, 0.3714] }),
            ] }),
        new Composite(gl, { id: 0x51, display: "hidden", pos: [0.0, 0.0, -0.3714], shapes: [
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, -0.3714], [0.0, 0.06, -0.7428]),
            ] }),
        new Composite(gl, { id: 0x5, display: "hidden", pos: [0.0, 0.0, -0.7428], shapes: [
                new Node(gl, {}),
            ] }),
        // Hand
        new Composite(gl, { id: 0x6, display: "hidden", pos: [0.3714, 0.0, -0.3714], shapes: [
                new Logo(gl, 24, { display: "fixed", pos: [0.0, 0.0, 0.0], scale: [0.5, 1.0, 0.5] }),
            ] }),
        // Cloud
        new Composite(gl, { id: 0x7, display: "fixed", pos: [0.0, 0.0, 1.1142], shapes: [
                new Text(gl, 0, { id: -1, pos: [0.0, 0.3714, 0.0], scale: [3.0, 1.0, 1.5] }),
                new Circle(gl, { type: ShapeType.SHADOW, pos: [0.0, 0.015, 0.0], color: [0, 0, 0] }),
            ] }),
    ];
    const ROOT = 0x1;
    const TECHNICAL_SKILLS = 0x2;
    const PROJECTS = 0x3;
    const PERSONAL_SKILLS = 0x4;
    const HELP = 0x5;
    const SECOND = 0x50;
    const FIRST = 0x51;
    const HAND = 0x6;
    const CLOUD = 0x7;
    const ids = [
        [ROOT, "contact"],
        [(TECHNICAL_SKILLS << 4) + 0x0, "frontend"],
        [(TECHNICAL_SKILLS << 4) + 0x1, "backend"],
        [(TECHNICAL_SKILLS << 4) + 0x2, "all purpose"],
        [TECHNICAL_SKILLS, "technical skills"],
        [PROJECTS, "projects"],
        [(PERSONAL_SKILLS << 4) + 0x1, "about me"],
        [PERSONAL_SKILLS, "personal skills"],
        [(HELP << 4) + 0x0, "second"],
        [(HELP << 4) + 0x1, "first"],
        [HELP, "start"],
        [HAND, ""],
        [CLOUD, ""],
    ];
    const map = new Map();
    for (let i = 1; i < shapes.length; i++) {
        map.set(ids[i - 1][0], { txt: ids[i - 1][1], index: i });
    }
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
    let vpm = pm.mul(mat4.lookAt(cam, center, up));
    // Create the WebGL program.
    const main = new Program(canvas, shapes, vs, fs, {
        color: [102, 51, 153, 1],
        attrs: {
            a_position: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 },
            a_uv: { type: WebGL2RenderingContext.FLOAT, len: 2, stride: 32, size: 4 },
            a_normal: { type: WebGL2RenderingContext.FLOAT, len: 3, stride: 32, size: 4 },
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
    main.plugins.push(new BloomPlugin(gl, shapes, main), new PointerPlugin(gl, shapes, main));
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
        const dx = e.movementX / canvas.width;
        const dz = e.movementY / canvas.height;
        if ((cam.x < 1.5 && dx <= 0) || (cam.x > -1.5 && dx >= 0)) {
            cam.x -= dx;
            center.x -= dx;
        }
        if ((cam.z > -1.75 && dz <= 0) || (cam.z < 0.5 && dz >= 0)) {
            cam.z += dz;
            center.z += dz;
        }
        vpm = pm.mul(mat4.lookAt(cam, center, up));
    }, { passive: false });
    canvas.addEventListener("pointerup", (e) => {
        e.preventDefault();
        if (!pointer) {
            return;
        }
        canvas.releasePointerCapture(pointer);
        gridDrag = false;
        pointer = 0;
    }, { passive: false });
    canvas.addEventListener("pointerleave", (e) => {
        e.preventDefault();
        if (!pointer) {
            return;
        }
        canvas.releasePointerCapture(pointer);
        gridDrag = false;
        pointer = 0;
    }, { passive: false });
    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        gridDrag = true;
        pointer = e.pointerId;
    }, { passive: false });
    // Handle pick (click)
    // picked[0] == root, picked[1 && 2] == hovered, picked[3 && 4] == focused
    const picked = main.drawInfo.u_picked;
    const srcXZ = [0, 0];
    const trgXZ = [0, 0];
    const duration = 500;
    const step = 1 / (duration / (1000 / 60));
    const offset = [0.125, -0.6589];
    let progress = 0;
    function easeInOut(alpha) {
        return alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
    }
    function lerp(a, b, alpha) {
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
    const infoBox = document.querySelector("#canvas-box .hint-box");
    function moveInfoBox(world, id, panel) {
        var _a;
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
            const x = (vpm[12] / vpm[15]) * 0.5 + 0.5;
            const y = (vpm[13] / vpm[15]) * -0.5 + 0.5;
            panel.style.left = rect.left + x * rect.width + "px";
            panel.style.top = rect.top + y * rect.height + "px";
            requestAnimationFrame(fn);
        });
        const vpm = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
        const rect = canvas.getBoundingClientRect();
        const x = (vpm[12] / vpm[15]) * 0.5 + 0.5;
        const y = (vpm[13] / vpm[15]) * -0.5 + 0.5;
        panel.style.left = rect.left + x * rect.width + "px";
        panel.style.top = rect.top + y * rect.height + "px";
        if (!id) {
            return;
        }
        panel.dataset.show = id.toString();
        panel.firstElementChild.innerHTML = (_a = infos[id]) === null || _a === void 0 ? void 0 : _a.txt;
        for (let i = 0; i < panel.lastElementChild.children.length; i++) {
            panel.lastElementChild.children[i].dataset.toggled = i < infos[id].rating ? "1" : "0";
        }
    }
    const footer = document.querySelector("#footer");
    main.on("pointerdown", function fn(e) {
        var _a;
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
                footer.scrollIntoView({ behavior: "smooth" });
                return;
            case e.id >> 4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[3] = TECHNICAL_SKILLS, picked[4] = e.id != TECHNICAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                break;
            case e.id >> 4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[3] = PERSONAL_SKILLS, picked[4] = e.id != PERSONAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                moveInfoBox(e.shape.world, e.shape.id, infoBox);
                break;
            case e.id == HELP:
            case e.id >> 4 == HELP:
                picked[0] = HELP, picked[3] = e.id == SECOND ? FIRST : e.id, picked[4] = e.id == SECOND ? e.id : -1;
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                break;
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
            case e.id >> 8 == HELP:
                if (e.id >> 4 != picked[4]) {
                    picked[4] = -1;
                    shapes[map.get(picked[3]).index].focus();
                }
                else {
                    shapes[map.get(picked[3]).index].focus();
                    shapes[map.get(picked[4]).index].focus();
                }
                moveInfoBox(e.shape.world, e.shape.id, infoBox);
                e.shape = shapes[((_a = map.get(e.id >> 4)) !== null && _a !== void 0 ? _a : map.get(e.id >> 8)).index];
                break;
            default: {
                picked[0] = ROOT, picked[3] = e.id, picked[4] = -1;
                shapes[map.get(picked[0]).index].focus();
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
    main.on("pointermove", (e) => {
        for (const shape of shapes) {
            shape.hide();
        }
        switch (true) {
            case e.id == 0x0:
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
            case e.id >> 8 == HELP:
            case e.id == CLOUD:
                if (picked[3] != -1) {
                    picked[1] = picked[2] = -1;
                }
                else {
                    picked[0] = picked[1] = picked[2] = -1;
                }
                return;
            case e.id == PERSONAL_SKILLS:
            case e.id >> 4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[1] = PERSONAL_SKILLS, picked[2] = e.id != PERSONAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[1]).index].show();
                break;
            case e.id == TECHNICAL_SKILLS:
            case e.id >> 4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[1] = TECHNICAL_SKILLS, picked[2] = e.id != TECHNICAL_SKILLS ? e.id : -1;
                shapes[map.get(picked[1]).index].show();
                break;
            case e.id == HELP:
            case e.id >> 4 == HELP:
                picked[0] = HELP, picked[1] = e.id == SECOND ? FIRST : e.id, picked[2] = e.id == SECOND ? e.id : -1;
                shapes[map.get(picked[1]).index].show();
                break;
            default:
                picked[0] = ROOT, picked[1] = e.id, picked[2] = -1;
                ;
        }
        e.shape.show();
    });
    // Handle breadcrumbs
    const breadcrumbs = document.querySelector("#canvas-box .breadcrumbs");
    breadcrumbs.addEventListener("pointerdown", (e) => {
        var _a;
        e.preventDefault();
        moveInfoBox(null, 0, infoBox);
        const id = Number.parseInt((_a = e.target.dataset.id) !== null && _a !== void 0 ? _a : ROOT.toString());
        switch (id) {
            case ROOT:
            case HELP:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4]).index].blur();
                    shapes[map.get(picked[4]).index].hide();
                }
                if (picked[3] != -1) {
                    shapes[map.get(picked[3]).index].blur();
                    shapes[map.get(picked[3]).index].hide();
                }
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild);
                break;
            case PERSONAL_SKILLS:
            case PROJECTS:
            case TECHNICAL_SKILLS:
            case FIRST:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4]).index].blur();
                    shapes[map.get(picked[4]).index].hide();
                }
                picked[2] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild, breadcrumbs.children[1]);
                break;
        }
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = shapes[map.get(id).index].world[12] + offset[0];
        trgXZ[1] = shapes[map.get(id).index].world[14] + offset[1];
        gridDrag = false;
        panCamera();
    });
    const rootTxt = ["@", "help"];
    main.on("done", () => {
        var _a, _b;
        if (picked[0] == -1) {
            breadcrumbs.replaceChildren(breadcrumbs.firstChild);
            return;
        }
        // focused
        const a = [breadcrumbs.firstChild];
        for (const id of picked.slice(3)) {
            if (id == -1) {
                continue;
            }
            const span = document.createElement("span");
            span.textContent = " \u21FE " + ((_a = map.get(id)) === null || _a === void 0 ? void 0 : _a.txt);
            span.dataset.id = id.toString();
            a.push(span);
        }
        // hovered
        const b = [breadcrumbs.firstChild];
        for (const id of picked.slice(1, 3)) {
            if (id == -1) {
                continue;
            }
            const span = document.createElement("span");
            span.textContent = " \u21FE " + ((_b = map.get(id)) === null || _b === void 0 ? void 0 : _b.txt);
            span.dataset.id = id.toString();
            b.push(span);
        }
        breadcrumbs.replaceChildren(...(b.length > 1 ? b : a));
    });
    // Handle help
    let helpStarted = 0;
    const helpButton = document.querySelector("#canvas-box .control-box #help");
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
            }
            else {
                shapes[i].display = "fixed";
                shapes[i].show();
                shapes[i].hide();
            }
        }
        map.set(0, map.get(HELP));
        breadcrumbs.firstElementChild.textContent = rootTxt[1];
        srcXZ[0] = cam[0];
        srcXZ[1] = cam[2];
        trgXZ[0] = shapes[map.get(HELP).index].world[12] + offset[0];
        trgXZ[1] = shapes[map.get(HELP).index].world[14] + offset[1];
        gridDrag = false;
        panCamera();
    });
    const canvasBox = document.querySelector("#canvas-box");
    canvasBox.addEventListener("animationend", () => {
        canvasBox.dataset.help = "0";
    });
    function moveHand(x, y, z) {
        const hand = shapes[map.get(HAND).index];
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
            child.world[12] = hand.world[12];
            child.world[14] = hand.world[14];
        }
    }
    const handAmplitude = 0.00025;
    const handFrequency = 1.75;
    function animateHand() {
        const time = performance.now() / 1000;
        const hand = shapes[map.get(HAND).index];
        for (const child of hand) {
            child.world[13] += child.type != ShapeType.SHADOW ? Math.sin(time * handFrequency) * handAmplitude : 0.0;
        }
    }
    const helpHints = [
        "Click and drag the map to move it around",
        "Click an object to move to it",
        "Click an icon to view an infobox\n\nClick anywhere to close it",
        "Click the breadcrumbs to go back",
        "That's it!"
    ];
    const handWorlds = [
        shapes[map.get(HAND).index].world.translate(0.0, 0.08, 0.0),
        shapes[map.get(FIRST).index].world.translate(0.0, 0.15, 0.0),
        shapes[map.get(SECOND).index].world.translate(0.0, 0.225, 0.3714),
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
    const helpBox = document.querySelector("#canvas-box .help-box");
    main.on("done", () => {
        if (!helpStarted) {
            return;
        }
        animateHand();
        if (canvasBox.dataset.help != undefined) {
            return;
        }
        moveInfoBox(null, 0, infoBox);
        const world = handWorlds[helpStarted - 1];
        switch (helpStarted) {
            case 1:
            case 2:
                moveHand(world[12], world[13], world[14]);
                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);
                break;
            case 3:
                picked[0] = HELP, picked[3] = FIRST, picked[4] = SECOND;
                const first = shapes[map.get(FIRST).index];
                first.focus();
                const second = shapes[map.get(SECOND).index];
                second.focus();
                srcXZ[0] = cam[0];
                srcXZ[1] = cam[2];
                trgXZ[0] = second.world[12] + offset[0];
                trgXZ[1] = second.world[14] + offset[1];
                panCamera();
                moveHand(world[12], world[13], world[14]);
                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);
                break;
            case 4:
                const shape = shapes[map.get(HAND).index];
                shape.display = "hidden";
                shape.blur();
                shape.hide();
                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted++;
                }, 9000);
                break;
            case 5:
                map.set(0, { txt: ids[0][1], index: ids[0][0] });
                breadcrumbs.firstElementChild.textContent = rootTxt[0];
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                for (let i = 1; i < shapes.length - 1; i++) {
                    if (i < 9) {
                        shapes[i].display = "fixed";
                        shapes[i].show();
                        shapes[i].hide();
                    }
                    else {
                        shapes[i].display = "hidden";
                        shapes[i].blur();
                        shapes[i].hide();
                    }
                }
                for (const child of shapes[map.get(HAND).index]) {
                    child.display = "inherit";
                }
                const root = shapes[map.get(ROOT).index];
                srcXZ[0] = cam[0];
                srcXZ[1] = cam[2];
                trgXZ[0] = root.world[12] + offset[0];
                trgXZ[1] = root.world[14] + offset[1];
                panCamera();
                setTimeout(() => {
                    canvasBox.removeAttribute("data-help");
                    helpStarted = 0;
                }, 4000);
                break;
        }
        if (helpStarted == 2) {
            for (const child of shapes[map.get(HAND).index]) {
                if (child.type == ShapeType.SHADOW) {
                    child.display = "hidden";
                    child.blur();
                    child.hide();
                }
            }
        }
        canvasBox.dataset.help = "1";
        helpBox.textContent = helpHints[helpStarted - 1];
        gridDrag = false;
        moveInfoBox(world, 0, helpBox);
    });
    // Handle cloud
    let cloudState = 0;
    let cloudDrag = false;
    let cloudTrigger = 0;
    let cloudTimer = 0;
    main.on("pointerdown", (e) => {
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
    main.on("pointermove", (e) => {
        if (!cloudDrag) {
            return;
        }
        clearInterval(cloudTimer);
        cloudState = 6;
        const dx = (e.clientX / canvas.width);
        const dz = (e.clientY / canvas.height) * 1.5;
        const cloud = shapes[map.get(CLOUD).index];
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
        const cloud = shapes[map.get(CLOUD).index];
        if ((cloudDelta > 0.0 && cloud.world[12] >= cloudTurn) || (cloudDelta < 0.0 && cloud.world[12] <= -cloudTurn)) {
            cloudDelta = -cloudDelta;
            cloudTurn = Math.random();
        }
        const time = performance.now() / 1000;
        cloud.world[12] += cloudDelta;
        for (const child of cloud) {
            child.world[12] = cloud.world[12];
            child.world[13] += child.type != ShapeType.SHADOW ? Math.sin(time * cloudFrequency) * cloudAmplitude : 0.0;
        }
    });
}());
// Handle portraits
(function () {
    const portraitBox = document.querySelector("#footer #contact-box > *:first-child");
    const duration = 15000;
    function switchPortrait() {
        var _a;
        let child = null;
        while ((child = (!child ? portraitBox.firstElementChild : child.nextElementSibling)).dataset.animate != "1")
            ;
        const next = ((_a = child.nextElementSibling) !== null && _a !== void 0 ? _a : portraitBox.firstElementChild);
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
            }
            else {
                child.dataset.animate = "0";
                child.style.setProperty("display", "none");
            }
        });
    }, {
        threshold: 0.5,
    });
    obs.observe(portraitBox);
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEMsT0FBTyxFQUFDLGFBQWEsRUFBcUIsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2xILE9BQU8sRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ2hELE9BQU8sRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBQ2xELE9BQU8sS0FBSyxNQUFNLFlBQVksQ0FBQztBQUUvQjs7R0FFRztBQUNILENBQUM7SUFDRyxRQUFRLENBQUMsZ0JBQWdCLENBQW9CLG1DQUFtQyxDQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7UUFDbEcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUUsQ0FDeEMsUUFBUSxDQUFDLGFBQWEsQ0FBaUIsYUFBYSxDQUFFLENBQUMsY0FBYyxDQUFDLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQzlGLENBQUE7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsRUFBRSxDQUFDLENBQUM7QUFFTDs7R0FFRztBQUNILENBQUM7SUFDRyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFvQixxQkFBcUIsQ0FBRSxDQUFDO0lBQ2pGLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLEVBQUMsU0FBUyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7SUFDMUQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ04sTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7SUFDakMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEdBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxDQUFDO0lBRXpDLFNBQVM7SUFDVCxNQUFNLE1BQU0sR0FBRztRQUNYLE9BQU87UUFDUCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztRQUMxRCxPQUFPO1FBQ1AsSUFBSSxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxNQUFNLEVBQUU7Z0JBQ3hFLElBQUksUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7YUFDdkIsRUFBQyxDQUFDO1FBQ0gsV0FBVztRQUNYLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDNUUsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUM1RSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3hELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUN6RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3hELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUN6RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3hELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUs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RSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFO2dCQUM1RSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7Z0JBQzdFLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUMxRCxFQUFDLENBQUM7UUFDSCxXQUFXO1FBQ1gsSUFBSSxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUU7Z0JBQy9FLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7Z0JBQ3JGLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUMxRixJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7YUFDaEcsRUFBQyxDQUFDO1FBQ0gsV0FBVztRQUNYLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFO2dCQUNoRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUNyRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNsRSxFQUFDLENBQUM7UUFDSCxrQkFBa0I7UUFDbEIsSUFBSSxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDbEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDbEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzNELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUNqRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUNwRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUNwRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO2dCQUNwRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBQyxDQUFDO2FBQ3BGLEVBQUMsQ0FBQztRQUNILE9BQU87UUFDUCxJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBRSxNQUFNLEVBQUU7Z0JBQzFFLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELElBQUksSUFBSSxDQUFDLEVB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QUFDO0lBRUQsd0JBQXdCO0lBQ3hCLE1BQU0sR0FBRyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxNQUFNLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sRUFBRSxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQzNFLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFL0MsNEJBQTRCO0lBQzVCLE1BQU0sSUFBSSxHQUFHLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtRQUM3QyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDeEIsS0FBSyxFQUFFO1lBQ0gsVUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLHNCQUFzQixDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBQztZQUM3RSxJQUFJLEVBQUUsRUFBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFDO1lBQ3ZFLFFBQVEsRUFBRSxFQUFDLElBQUksRUFBRSxzQkFBc0Is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TUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDakcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMxQyxNQUFNO1lBQ1YsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFFLENBQUMsSUFBSSxlQUFlO2dCQUMzQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQzFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUMxQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBQ2hELE1BQU07WUFDVixLQUFLLENBQUMs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
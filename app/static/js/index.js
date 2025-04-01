import { mat4, vec3 } from "./linalg.js";
import { Program } from "./webgl/core.js";
import { PointerPlugin } from "./webgl/plugins/pointer.js";
import { BloomPlugin } from "./webgl/plugins/bloom.js";
import { Grid, Composite, RootNode, Node, Edge, Logo, Text, Project, Circle, ShapeType, Plane } from "./webgl/geometry.js";
import vs from "./webgl/shaders/vertex-main.js";
import fs from "./webgl/shaders/fragment-main.js";
import hints from "./hints.js";
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
        // Backend
        new Composite(gl, { id: 0x41, display: "fixed", pos: [-0.6065, 0.0, 0.2601], shapes: [
                new Text(gl, 2, { pos: [0.0619, 0.001, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
                new Logo(gl, 11, { id: 0x410, pos: [0.2331, 0.1, 0.4038] }),
                new Logo(gl, 9, { id: 0x411, pos: [0.0809, 0.1, 0.4591] }),
                new Logo(gl, 17, { id: 0x412, pos: [-0.0810, 0.1, 0.4591] }),
                new Logo(gl, 15, { id: 0x413, pos: [-0.2331, 0.1, 0.4037] }),
                new Logo(gl, 8, { id: 0x414, pos: [-0.3571, 0.1, 0.2997] }),
                new Logo(gl, 16, { id: 0x415, pos: [-0.4381, 0.1, 0.1595] }),
            ] }),
        // Frontend
        new Composite(gl, { id: 0x42, display: "fixed", pos: [0.0, 0.0, 0.5077], shapes: [
                new Text(gl, 8, { pos: [0.0, 0.001, -0.0619], rotation: [Math.PI, 0.0, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.0863]),
                new Logo(gl, 22, { id: 0x420, pos: [0.4381, 0.1, 0.1595] }),
                new Logo(gl, 7, { id: 0x421, pos: [0.3391, 0.1, 0.3199] }),
                new Logo(gl, 13, { id: 0x422, pos: [0.1846, 0.1, 0.4281] }),
                new Logo(gl, 21, { id: 0x423, pos: [0.0000, 0.1, 0.4662] }),
                new Logo(gl, 19, { id: 0x424, pos: [-0.1846, 0.1, 0.4281] }),
                new Logo(gl, 20, { id: 0x425, pos: [-0.3391, 0.1, 0.3199] }),
                new Logo(gl, 14, { id: 0x426, pos: [-0.4381, 0.1, 0.1595] }),
            ] }),
        // All purpose
        new Composite(gl, { id: 0x43, display: "fixed", pos: [0.6065, 0.00, 0.2601], shapes: [
                new Text(gl, 1, { pos: [-0.0850, 0.001, -0.0619], rotation: [Math.PI, Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.6065, 0.06, 0.2601], [0.0, 0.06, -0.1113]),
                new Logo(gl, 12, { id: 0x430, pos: [-0.2331, 0.1, 0.4038] }),
                new Logo(gl, 18, { id: 0x431, pos: [-0.0406, 0.1, 0.4644] }),
                new Logo(gl, 10, { id: 0x432, pos: [0.1595, 0.1, 0.4381] }),
                new Logo(gl, 6, { id: 0x433, pos: [0.3297, 0.1, 0.3297] }),
                new Logo(gl, 5, { id: 0x434, pos: [0.4381, 0.1, 0.1595] }),
            ] }),
        // Technical skills
        new Composite(gl, { id: 0x4, display: "fixed", pos: [0.0, 0.0, -0.1113], shapes: [
                new Text(gl, 11, { pos: [0.0, 0.001, -0.1113], rotation: [Math.PI, 0.0, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, -0.1113], [0.0, 0.06, -0.728]),
            ] }),
        // Projects
        new Composite(gl, { id: 0x3, display: "fixed", pos: [0.4820, 0.0, -0.4819], shapes: [
                new Text(gl, 10, { pos: [-0.045, 0.001, -0.045], rotation: [Math.PI, Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Project(gl, 1, { id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI / 2, 0.0, 0.5] }),
                new Project(gl, 0, { id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI / 2, 0.0, 0.5] }),
            ] }),
        // About me
        new Composite(gl, { id: 0x21, display: "fixed", pos: [-1.1018, 0.0, 0.0125], shapes: [
                new Text(gl, 0, { pos: [0.0619, 0.0, -0.0619], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-1.1018, 0.06, 0.0125], [-0.5020, 0.06, -0.4620]),
            ] }),
        // Personal skills
        new Composite(gl, { id: 0x2, display: "fixed", pos: [-0.4820, 0.001, -0.4820], shapes: [
                new Text(gl, 9, { pos: [0.077, 0.0, -0.07], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Node(gl, {}),
                new Edge(gl, [-0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Logo(gl, 3, { id: 0x204, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1.0, 1.1] }),
                new Logo(gl, 23, { id: 0x203, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 4, { id: 0x202, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 2, { id: 0x201, pos: [-0.2881, 0.1, 0.1500], scale: [1.25, 1.0, 1.25] }),
                new Logo(gl, 1, { id: 0x200, pos: [-0.3266, 0.1, 0.0], scale: [0.75, 1.0, 0.75] }),
            ] }),
        // Cloud
        new Composite(gl, { id: 0x5, display: "fixed", pos: [0.0, 0.0, 1.35], shapes: [
                new Text(gl, 3, { id: -1, pos: [0.0, 0.3714, 0.0], scale: [3.0, 1.0, 1.5] }),
                new Circle(gl, { id: 0, display: "fixed", type: ShapeType.SHADOW, pos: [0.0, 0.0015, 0.0], color: [0, 0, 0], /*scale: [3.2, 1.0, 1.5]*/ }),
            ] }),
    ];
    const ROOT = 0x1;
    const PERSONAL_SKILLS = 0x2;
    const PROJECTS = 0x3;
    const TECHNICAL_SKILLS = 0x4;
    const ABOUT_ME = 0x21;
    const map = new Map([
        [0x0, { txt: "@", index: 0 }],
        [0x1, { txt: "contact", index: 1 }],
        [0x2, { txt: "personal skills", index: 8 }],
        [0x20, { txt: "personal skills", index: 8 }],
        [0x21, { txt: "about me", index: 7 }],
        [0x3, { txt: "projects", index: 6 }],
        [0x30, { txt: "projects", index: 6 }],
        [0x4, { txt: "technical skills", index: 5 }],
        [0x41, { txt: "backend", index: 2 }],
        [0x42, { txt: "frontend", index: 3 }],
        [0x43, { txt: "all purpose", index: 4 }],
    ]);
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 10);
    const vpm = pm.mul(mat4.lookAt(cam, center, up));
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
                depth: 24,
            },
            "/static/imgs/atlas-grid-texts.png": {
                width: 512,
                height: 256,
                depth: 12,
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
        u_vpm: vpm,
        u_light_dir: new vec3(0.6, 1.0, 2.0).normalize(),
        u_picked: new Int32Array([-1, -1, -1, -1, -1]),
        u_type: (shape) => shape.type,
        u_id: (shape) => shape.id,
        u_model: (shape) => shape.world,
        u_color: (shape) => shape.color,
        u_pick_color: (shape) => shape.pick_color,
        u_depth: (shape) => shape.id == 0x5 ? cloudState : shape.depth,
    });
    // Handle drag
    let dragging = false;
    let pointer = 0;
    canvas.addEventListener("pointermove", (e) => {
        if (!dragging) {
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
        main.drawInfo.u_vpm = pm.mul(mat4.lookAt(cam, center, up));
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
        canvas.setPointerCapture(e.pointerId);
        dragging = true;
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
    const panel = document.querySelector("#canvas-box .hint-box");
    function setInfoPanel(cx, cy, id) {
        if (id < 0) {
            panel.style.display = "none";
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = cx * 0.5 + 0.5;
        const y = cy * -0.5 + 0.5;
        panel.style.display = "flex";
        panel.style.left = rect.left + x * rect.width + "px";
        panel.style.top = rect.top + y * rect.height + "px";
        panel.dataset.id = id.toString();
        panel.firstElementChild.innerHTML = hints[id].txt;
        for (let i = 0; i < panel.lastElementChild.children.length; i++) {
            panel.lastElementChild.children[i].dataset.toggled = i < hints[id].rating ? "1" : "0";
        }
    }
    const footer = document.querySelector("#footer");
    main.on("pointerdown", function fn(e) {
        setInfoPanel(0, 0, -1);
        if (e.id == 0 || e.id == 0x5) {
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
            case e.id >> 4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[3] = PERSONAL_SKILLS, picked[4] = e.id;
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                shapes[map.get(picked[3]).index].show();
                e.id = ABOUT_ME << 4;
                fn(e);
                return;
            case e.id >> 4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[3] = TECHNICAL_SKILLS, picked[4] = e.id;
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                shapes[map.get(picked[3]).index].show();
                break;
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
                for (const id of picked) {
                    if (id == -1) {
                        continue;
                    }
                    if (id == ABOUT_ME && e.id != ABOUT_ME << 4) {
                        picked[0] = ROOT, picked[3] = PERSONAL_SKILLS, picked[4] = -1;
                        continue;
                    }
                    shapes[map.get(id).index].focus();
                    shapes[map.get(id).index].show();
                }
                const delta = Math.hypot(e.shape.world[12] - cam[0], e.shape.world[14] - cam[2]);
                if (delta < 1.1857) {
                    const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(e.shape.world);
                    dragging = false;
                    setInfoPanel(clip[12] / clip[15], clip[13] / clip[15], e.id);
                    return;
                }
                const world = e.shape.world;
                const id = e.id;
                requestAnimationFrame(function fn() {
                    if (progress >= 1) {
                        return;
                    }
                    const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(world);
                    setInfoPanel(clip[12] / clip[15], clip[13] / clip[15], id);
                    requestAnimationFrame(fn);
                });
                e.shape = shapes[map.get(e.id >> 4).index];
                break;
            default: {
                picked[0] = ROOT, picked[3] = e.id, picked[4] = -1;
                shapes[map.get(picked[0]).index].focus();
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
    main.on("pointermove", (e) => {
        for (const shape of shapes) {
            shape.hoverOut();
            shape.hide();
        }
        switch (true) {
            case e.id == 0x0:
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
            case e.id == 0x5:
                picked[0] = picked[1] = picked[2] = -1;
                return;
            case e.id >> 4 == PERSONAL_SKILLS:
                picked[0] = ROOT, picked[1] = PERSONAL_SKILLS, picked[2] = e.id;
                e.shape.show();
                e.shape.hoverIn();
                shapes[map.get(picked[1]).index].show();
                shapes[map.get(picked[1]).index].hoverIn();
                break;
            case e.id >> 4 == TECHNICAL_SKILLS:
                picked[0] = ROOT, picked[1] = TECHNICAL_SKILLS, picked[2] = e.id;
                e.shape.show();
                e.shape.hoverIn();
                shapes[map.get(picked[1]).index].show();
                shapes[map.get(picked[1]).index].hoverIn();
                break;
            default:
                picked[0] = ROOT, picked[1] = e.id, picked[2] = -1;
                ;
                e.shape.show();
                e.shape.hoverIn();
        }
    });
    // Handle cloud
    let cloudState = 3;
    let cloudDrag = false;
    let cloudTrigger = 0;
    main.on("pointerdown", (e) => {
        if (e.id != 0x5 || cloudState != 3) {
            return;
        }
        const rnd = Math.random();
        switch (true) {
            case rnd < 0.1:
            case cloudTrigger == 9:
                cloudState = 7;
                cloudTrigger = 0;
                break;
            case rnd < 0.4:
                cloudState = 4;
                break;
            case rnd < 0.7:
                cloudState = 5;
                break;
            case rnd < 1.0:
                cloudState = 6;
                break;
        }
        dragging = false;
        cloudDrag = true;
        cloudTrigger++;
        setTimeout(() => cloudState = 3, 250);
    });
    main.on("pointerup", () => {
        cloudDrag = false;
    });
    main.on("pointermove", (e) => {
        //return;
        if (!cloudDrag) {
            return;
        }
        const dx = (e.clientX / canvas.width);
        const dz = (e.clientY / canvas.height) * 1.5;
        shapes[9].world[12] += dx;
        shapes[9].world[14] -= dz;
        for (const child of shapes[9]) {
            child.world[12] = shapes[9].world[12];
            child.world[14] = shapes[9].world[14];
        }
    });
    const amplitude = 0.0005;
    const frequency = 1;
    let cloudDelta = 0.0005;
    let turn = Math.random();
    main.on("done", () => {
        if ((cloudDelta > 0.0 && shapes[9].world[12] >= turn) || (cloudDelta < 0.0 && shapes[9].world[12] <= -turn)) {
            cloudDelta = -cloudDelta;
            turn = Math.random();
        }
        const time = performance.now() / 1000; // Time in seconds
        shapes[9].world[12] += cloudDelta;
        shapes[9].world[13] += Math.sin(time * frequency) * amplitude;
        for (const child of shapes[9]) {
            child.world[12] = shapes[9].world[12];
            child.world[13] += child instanceof Plane ? Math.sin(time * frequency) * amplitude : 0.0;
        }
    });
    // Handle breadcrumbs
    const breadcrumbs = document.querySelector("#canvas-box .breadcrumbs");
    breadcrumbs.addEventListener("pointerdown", (e) => {
        setInfoPanel(0, 0, -1);
        const id = Number.parseInt(e.target.dataset.id);
        switch (id) {
            case ROOT:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4]).index].hoverOut();
                    shapes[map.get(picked[4]).index].blur();
                    shapes[map.get(picked[4]).index].hide();
                }
                if (picked[3] != -1) {
                    shapes[map.get(picked[3]).index].hoverOut();
                    shapes[map.get(picked[3]).index].blur();
                    shapes[map.get(picked[3]).index].hide();
                }
                picked[0] = picked[1] = picked[2] = picked[3] = picked[4] = -1;
                breadcrumbs.replaceChildren(breadcrumbs.firstChild);
                break;
            case PERSONAL_SKILLS:
            case PROJECTS:
            case TECHNICAL_SKILLS:
                if (picked[4] != -1) {
                    shapes[map.get(picked[4]).index].hoverOut();
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
        dragging = false;
        requestAnimationFrame(animateCamera);
    });
    main.on("done", () => {
        var _a, _b;
        if (picked[1] == -1 && picked[3] == -1) {
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
    breadcrumbs.firstChild.dataset.id = ROOT.toString();
}());
// Handle portraits
(function () {
    const portraitBox = document.querySelector("#footer #contact-box > *:first-child");
    portraitBox.addEventListener("pointerdown", (e) => {
        var _a;
        const element = e.target;
        const next = ((_a = element.nextElementSibling) !== null && _a !== void 0 ? _a : portraitBox.firstElementChild);
        element.style.setProperty("display", "none");
        next.style.setProperty("display", "block");
    });
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEMsT0FBTyxFQUFDLGFBQWEsRUFBcUIsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN6SCxPQUFPLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNoRCxPQUFPLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNsRCxPQUFPLEtBQUssTUFBTSxZQUFZLENBQUM7QUFFL0I7O0dBRUc7QUFDSCxDQUFDO0lBQ0csUUFBUSxDQUFDLGdCQUFnQixDQUFvQixtQ0FBbUMsQ0FBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ2xHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLENBQ3hDLFFBQVEsQ0FBQyxhQUFhLENBQWlCLGFBQWEsQ0FBRSxDQUFDLGNBQWMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUM5RixDQUFBO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRUw7O0dBRUc7QUFDSCxDQUFDO0lBQ0csTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBb0IscUJBQXFCLENBQUUsQ0FBQztJQUNqRixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0lBQzFELElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO0lBQ2pDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsQ0FBQztJQUV6QyxTQUFTO0lBQ1QsTUFBTSxNQUFNLEdBQUc7UUFDWCxPQUFPO1FBQ1AsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7UUFDMUQsT0FBTztRQUNQLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsTUFBTSxFQUFFO2dCQUN6RSxJQUFJLFFBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ3ZCLEVBQUMsQ0FBQztRQUNILFVBQVU7UUFDVixJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDaEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDdkYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3pELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDeEQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQzFELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUMxRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDekQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7YUFDN0QsRUFBQyxDQUFDO1FBQ0gsV0FBVztRQUNYLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDNUUsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUM1RSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3pELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDeEQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUN6RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3pELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUMxRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDMUQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7YUFDN0QsRUFBQyxDQUFDO1FBQ0gsY0FBYztRQUNkLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDaEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDdkYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQzFELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUMxRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3pELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDeEQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2FBQzNELEVBQUMsQ0FBQztRQUNILG1CQUFtQjtRQUNuQixJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDNUUsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUM3RSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDMUQsRUFBQyxDQUFDO1FBQ0gsV0FBVztRQUNYLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxFQUFFO2dCQUMvRSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUNyRixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFELElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDMUYsSUFBSSxPQUFPLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxDQUFDO2FBQ2hHLEVBQUMsQ0FBQztRQUNILFdBQVc7UUFDWCxJQUFJLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRTtnQkFDaEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDcEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEIsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDbEUsRUFBQyxDQUFDO1FBQ0gsa0JBQWtCO1FBQ2xCLElBQUksU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEVBQUU7Z0JBQ2xGLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7Z0JBQ2pGLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hCLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDaEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQztnQkFDcEYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQztnQkFDbkYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQztnQkFDbkYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUMsQ0FBQzthQUNuRixFQUFDLENBQUM7UUFDSCxRQUFRO1FBQ1IsSUFBSSxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFO2dCQUMxRSxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFBQyxD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
import { mat4, vec3 } from "./linalg.js";
import { Program } from "./webgl/core.js";
import { PointerPlugin } from "./webgl/plugins/pointer.js";
import { BloomPlugin } from "./webgl/plugins/bloom.js";
import { Grid, Composite, RootNode, Node, Edge, Logo, Text, Project } from "./webgl/geometry.js";
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
                new Node(gl, {}),
                new Edge(gl, [-0.6065, 0.06, 0.2601], [0.0, 0.06, -0.11]),
                new Logo(gl, 11, { id: 0x410, pos: [0.2331, 0.1, 0.4038] }),
                new Logo(gl, 9, { id: 0x411, pos: [0.0809, 0.1, 0.4591] }),
                new Logo(gl, 17, { id: 0x412, pos: [-0.0810, 0.1, 0.4591] }),
                new Logo(gl, 15, { id: 0x413, pos: [-0.2331, 0.1, 0.4037] }),
                new Logo(gl, 8, { id: 0x414, pos: [-0.3571, 0.1, 0.2997] }),
                new Logo(gl, 16, { id: 0x415, pos: [-0.4381, 0.1, 0.1595] }),
            ] }),
        // Frontend
        new Composite(gl, { id: 0x42, display: "fixed", pos: [0.0, 0.0, 0.5077], shapes: [
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, 0.5589], [0.0, 0.06, -0.0]),
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
                new Node(gl, {}),
                new Edge(gl, [0.6065, 0.06, 0.2601], [0.0, 0.06, -0.11]),
                new Logo(gl, 12, { id: 0x430, pos: [-0.2331, 0.1, 0.4038] }),
                new Logo(gl, 18, { id: 0x431, pos: [-0.0406, 0.1, 0.4644] }),
                new Logo(gl, 10, { id: 0x432, pos: [0.1595, 0.1, 0.4381] }),
                new Logo(gl, 6, { id: 0x433, pos: [0.3297, 0.1, 0.3297] }),
                new Logo(gl, 5, { id: 0x434, pos: [0.4381, 0.1, 0.1595] }),
            ] }),
        // Technical skills
        new Composite(gl, { id: 0x4, display: "fixed", pos: [0.0, 0.0, -0.1113], shapes: [
                new Node(gl, {}),
                new Edge(gl, [0.0, 0.06, -0.1113], [0.0, 0.06, -0.728]),
                new Text(gl, 5, { pos: [0.0, 0.0, -0.1], rotation: [Math.PI, 0.0, 0.0] }),
                new Text(gl, 1, { display: "hidden", pos: [-0.53, 0.0, 0.33], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Text(gl, 2, { display: "hidden", pos: [0.0, 0.0, 0.55], rotation: [Math.PI, 0.0, 0.0] }),
                new Text(gl, 0, { display: "hidden", pos: [0.51, 0.0, 0.31], rotation: [Math.PI, Math.PI / 4, 0.0] }),
            ] }),
        // Projects
        new Composite(gl, { id: 0x3, display: "fixed", pos: [0.4820, 0.0, -0.4819], shapes: [
                new Node(gl, {}),
                new Edge(gl, [0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Text(gl, 4, { pos: [-0.045, 0.0, -0.045], rotation: [Math.PI, Math.PI / 4, 0.0] }),
                new Project(gl, 1, { id: 0x300, pos: [0.3885, 0.0, 0.0], rotation: [-Math.PI / 2, 0.0, 0.5] }),
                new Project(gl, 0, { id: 0x301, pos: [0.2747, 0.0, 0.1500], rotation: [-Math.PI / 2, 0.0, 0.5] }),
            ] }),
        // About me
        new Composite(gl, { id: 0x21, display: "fixed", pos: [-1.1018, 0.0, 0.0125], shapes: [
                new Node(gl, {}),
                new Edge(gl, [-1.1018, 0.06, 0.0125], [-0.4820, 0.06, -0.4814]),
            ] }),
        // Personal skills
        new Composite(gl, { id: 0x2, display: "fixed", pos: [-0.4820, 0.0, -0.4814], shapes: [
                new Node(gl, {}),
                new Edge(gl, [-0.4820, 0.06, -0.4819], [0.0, 0.06, -0.728]),
                new Text(gl, 3, { pos: [0.077, 0.0, -0.07], rotation: [Math.PI, -Math.PI / 4, 0.0] }),
                new Logo(gl, 3, { id: 0x204, pos: [0.0619, 0.1, 0.3885], scale: [1.1, 1.0, 1.1] }),
                new Logo(gl, 23, { id: 0x203, pos: [-0.0868, 0.1, 0.3589], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 4, { id: 0x202, pos: [-0.2128, 0.1, 0.2747], scale: [0.75, 1.0, 0.75] }),
                new Logo(gl, 2, { id: 0x201, pos: [-0.2881, 0.1, 0.1500], scale: [1.25, 1.0, 1.25] }),
                new Logo(gl, 1, { id: 0x200, pos: [-0.3266, 0.1, 0.0], scale: [0.75, 1.0, 0.75] }),
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
        [0x21, { txt: "about me", index: 7 }],
        [0x3, { txt: "projects", index: 6 }],
        [0x4, { txt: "technical skills", index: 5 }],
        [0x41, { txt: "backend", index: 2 }],
        [0x42, { txt: "frontend", index: 3 }],
        [0x43, { txt: "all purpose", index: 4 }],
    ]);
    // Viewprojection matrix
    const cam = new vec3(0.2, 0.4, -1.45);
    const center = new vec3(0, 0, 0);
    const up = new vec3(0, 1, 0);
    const pm = mat4.perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 50);
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
                depth: 6,
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
    const panel = document.querySelector("#canvas-box .info-box");
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
                shapes[map.get(picked[0]).index].focus();
                shapes[map.get(picked[3]).index].focus();
                shapes[map.get(picked[3]).index].show();
                if (picked[4] != -1) {
                    shapes[map.get(picked[4]).index].focus();
                    shapes[map.get(picked[4]).index].show();
                }
                const delta = Math.hypot(e.shape.world[12] - cam[0], e.shape.world[14] - cam[2]);
                if (delta < 1.15) {
                    const clip = pm.mul(mat4.lookAt(cam, center, up)).mul(e.shape.world);
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
                if (e.id >> 8 == PERSONAL_SKILLS && e.id >> 4 != ABOUT_ME) {
                    e.shape = shapes[map.get(picked[3]).index];
                }
                else {
                    e.shape = shapes[map.get(picked[4]).index];
                }
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
        if (e.id == 0) {
            picked[0] = picked[3] > 0 ? 1 : -1, picked[1] = picked[2] = -1;
            return;
        }
        switch (true) {
            case e.id >> 8 == PERSONAL_SKILLS:
            case e.id >> 8 == PROJECTS:
            case e.id >> 8 == TECHNICAL_SKILLS:
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBQyxNQUFNLGFBQWEsQ0FBQztBQUN2QyxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDeEMsT0FBTyxFQUFDLGFBQWEsRUFBcUIsTUFBTSw0QkFBNEIsQ0FBQztBQUM3RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDckQsT0FBTyxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvRixPQUFPLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUNoRCxPQUFPLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNsRCxPQUFPLEtBQUssTUFBTSxZQUFZLENBQUM7QUFFL0I7O0dBRUc7QUFDSCxDQUFDO0lBQ0csUUFBUSxDQUFDLGdCQUFnQixDQUFvQixtQ0FBbUMsQ0FBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ2xHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFLENBQ3hDLFFBQVEsQ0FBQyxhQUFhLENBQWlCLGFBQWEsQ0FBRSxDQUFDLGNBQWMsQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUM5RixDQUFBO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRUw7O0dBRUc7QUFDSCxDQUFDO0lBQ0csTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBb0IscUJBQXFCLENBQUUsQ0FBQztJQUNqRixNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFB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LEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDekQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUN4RCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQ3pELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUMsQ0FBQztnQkFDekQsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxFQUFDLENBQUM7Z0JBQzFELElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBQyxDQUFDO2dCQUMxRCxJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUMsRUFBRSxFQUFFLEtBQUss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Q0FBQyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDakYsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFDLENBQUM7Z0JBQ2hGLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFDLENBQUM7Z0JBQ3BGLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFDLENBQUM7Z0JBQ25GLElBQUksSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMs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
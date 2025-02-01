import {mat4, vec3} from "./linalg.js";
import {Program} from "./webgl.js";
import {PointerPlugin} from "./webglplugins.js";
import {Grid, Composite, Circle, AtlasPlane, ShapeType, Node, Edge, Icon} from "./webglgeometry.js";

/**
 * Handle transition
 */
(function () {
    const msgs = document.querySelector<HTMLDivElement>("#msg-box")!;
    document.querySelector<HTMLButtonElement>("#msg-box .msg .button")!
        .addEventListener("pointerdown", () => {
            document
            .querySelector<HTMLDivElement>("#content")!
            .scrollTo({left: 0, top: msgs.clientHeight, behavior: "smooth"});
    }, {once: true});
}());

/**
 * Setup WebGL2
 */
(function () {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas-box #canvas")!;
    const gl = canvas.getContext("webgl2", {antialias: true})!;

    if (!gl) {
        console.error("WebGL2 not supported");
        return;
    }

    // Shapes
    const shapes = [
        // Grid
        new Grid(gl, 1, 1, 0.105, {id: 0, display: "fixed", /*type: 1,*/ r: 160, g: 117, b: 206}),
        // Root
        new Node(gl, {id: 1, y: 0.04, z: -0.84}),
        // Personal skills
        new Composite(gl, {id: 2, x: -0.315, z: -0.63, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [-0.315, 0, -0.63], [0, 0, -0.84], {y: 0.04}),
            new Composite(gl, {visible: 0, shapes: [
                // Critical thinking
                new Composite(gl, {id: 50, display: "fixed", x: -0.315, z: 0.105, shapes: [
                    new AtlasPlane(gl, 2, {type: ShapeType.PERSONAL, tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
                    new Circle(gl, 0.015, 16, {type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8}),
                ]}),
                // Analytical thinking
                new Composite(gl, {id: 51, display: "fixed", x: -0.525, y: 0.005, z: 0.21, shapes: [
                    new AtlasPlane(gl, 0, {type: ShapeType.PERSONAL, tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
                    new Circle(gl, 0.015, 16, {type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8}),
                ]}),
                // Communication
                new Composite(gl, {id: 52, display: "fixed", x: -0.21, z: 0.21, shapes: [
                    new AtlasPlane(gl, 1, {type: ShapeType.PERSONAL, tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
                    new Circle(gl, 0.015, 16, {type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8}),
                ]}),
                // Organization
                new Composite(gl, {id: 53, display: "fixed", x: -0.42, y: 0.005, z: 0.315, shapes: [
                    new AtlasPlane(gl, 3, {type: ShapeType.PERSONAL, tex: 2, size: 0.03, y: 0.04, ratio: 1.78, rz: 0.78}),
                    new Circle(gl, 0.015, 16, {type: ShapeType.SHADOW, y: 0.002, r: 0, g: 0, b: 0, a: 0.8}),
                ]}),
            ]}),
        ]}),
        // Projects
        new Composite(gl, {id: 3, x: 0.315, z: -0.63, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [0.315, 0, -0.63], [0, 0, -0.84], {y: 0.04}),
        ]}),
        //Technical skills
        new Composite(gl, {id: 4, x: 0, z: -0.42, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [0, 0, -0.42], [0, 0, -0.84], {y: 0.04}),
        ]}),
        // // Technical skills - Backend
        new Composite(gl, {id: 5, x: -0.315, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [-0.315, 0, 0], [0, 0, -0.42], {y: 0.04}),
            new Composite(gl, {visible: 0, shapes: [
                // NodeJS
                new Icon(gl, 11, 11, {id: 100, y: 0.04, z: 0.315}),
                // Deno
                new Icon(gl, 18, 3, {id: 101, x: -0.0991, y: 0.04, z: 0.2990}),
                // NextJS
                new Icon(gl, 19, 10, {id: 102, x: -0.1881, y: 0.04, z: 0.2527}),
                // PSQL
                new Icon(gl, 12, 12, {id: 103, x: -0.2580, y: 0.04, z: 0.1807}),
                // Docker
                new Icon(gl, 4, 4, {id: 104, x: -0.3018, y: 0.04, z: 0.103}),
                // Git
                new Icon(gl, 6, 6, {id: 105, x: -0.3149, y: 0.04, z: 0.0092}),
            ]}),
        ]}),
        // Technical skills - Frontend
        new Composite(gl, {id: 6, z: 0.105, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [0, 0, 0.105], [0, 0, -0.42], {y: 0.04}),
            new Composite(gl, {visible: 0, shapes: [
                // TS
                new Icon(gl, 15, 15, {id: 200, y: 0.04, x: 0.26, z: 0.11}),
                // JS
                new Icon(gl, 9, 9, {id: 201, y: 0.04, x: 0.20, z: 0.21}),
                // React
                new Icon(gl, 14, 14, {id: 202, y: 0.04, x: 0.11, z: 0.29}),
                // Vue
                new Icon(gl, 16, 16, {id: 203, y: 0.04, z: 0.32}),
                // HTML
                new Icon(gl, 8, 8, {id: 204, y: 0.04, x: -0.11, z: 0.2901}),
                // CSS
                new Icon(gl, 2, 2, {id: 205, y: 0.04, x: -0.20, z: 0.21}),
                // WASM
                new Icon(gl, 20, 17, {id: 206, y: 0.04, x: -0.26, z: 0.11}),
            ]}),
        ]}),
        // Technical skills - All purpose
        new Composite(gl, {id: 7, x: 0.315, shapes: [
            new Node(gl, {y: 0.04}),
            new Edge(gl, [0.315, 0, 0], [0, 0, -0.42], {y: 0.04}),
            new Composite(gl, {visible: 0, shapes: [
                // C
                new Icon(gl, 0, 0, {id: 301, y: 0.04, x: 0.011, z: 0.3148}),
                // C#
                new Icon(gl, 1, 1, {id: 302, y: 0.04, x: 0.1281, z: 0.2878}),
                // F#
                new Icon(gl, 5, 5, {id: 303, y: 0.04, x: 0.2266, z: 0.2188}),
                // Python
                new Icon(gl, 13, 13, {id: 304, y: 0.04, x: 0.2921, z: 0.1180}),
                // Go
                new Icon(gl, 7, 7, {id: 305, y: 0.04, x: 0.3150}),
            ]}),
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
    const vp = mat4
        .perspective(Math.PI/4, canvas.width/canvas.height, 0.1, 1000)
        .mul(mat4.lookAt(new vec3(0.2, 0.25, -1.35), new vec3(0, 0, 0), new vec3(0, 1, 0)));
        
    // Shaders
    const mainVectorShader = `#version 300 es
        in vec3 a_position;
        in vec3 a_texcoord;
        in float a_alpha;
        in float a_offset;
        in int a_type;

        flat out highp int v_type;
        out vec3 v_texcoord;
        out float v_alpha;

        uniform vec2 u_resolution;
        uniform mat4 u_world;
        uniform mat4 u_vp;

        void main() {
            v_texcoord = a_texcoord;
            v_type = a_type;
            v_alpha = a_alpha;
            gl_Position = u_vp*u_world*vec4(a_position, 1.0);
        }
    `;
    const mainFragmentShader = `#version 300 es
        precision highp int;
        precision highp float;
        precision highp sampler2DArray;

        in vec3 v_texcoord;     // rgb or uv depth
        in float v_alpha;
        flat in int v_type;

        out vec4 f_color;

        uniform sampler2DArray u_logo;
        uniform sampler2DArray u_hint;
        uniform sampler2DArray u_personal;

        uniform int u_id;
        uniform int u_picked[6];

        void main() {
            if ((v_type&0x1) == 1) {
                if ((v_type&0xF) == 3) {
                    f_color = texture(u_hint, vec3(v_texcoord[0], v_texcoord[1], v_texcoord[2]));
                } else if ((v_type&0xF) == 5) {
                    f_color = texture(u_personal, vec3(v_texcoord[0], v_texcoord[1], v_texcoord[2]));
                } else {
                    f_color = texture(u_logo, vec3(v_texcoord[0], v_texcoord[1], v_texcoord[2]));
                }
                return;
            }
                
            vec4 color = vec4(v_texcoord[0]/255.0, v_texcoord[1]/255.0, v_texcoord[2]/255.0, v_alpha);

            if ((v_type&0xF) == 4) {
                f_color = color;
                return;
            }
        
            for (int i = 0; i < 6; i++) {
                if (u_id == u_picked[i]) {
                    f_color = vec4(1.0, 141.0/255.0, 35.0/255.0, 1.0);
                    return;
                }
            }

            f_color = color;
        }
    `;
    const pluginVectorShader = `#version 300 es
        in vec3 a_position;

        uniform mat4 u_world;
        uniform mat4 u_vp;

        void main() {
            gl_Position = u_vp*u_world*vec4(a_position, 1.0);
        }
    `;
    const pluginFragmentShader = `#version 300 es
        precision highp float;

        out vec4 f_color;

        uniform int u_id;

        void main() {
            float r = float((u_id & 0xFF))/255.0;
            float g = float((u_id >> 8) & 0xFF)/255.0;
            float b = float((u_id >> 16) & 0xFF)/255.0;

            f_color = vec4(r, g, b, 1.0);
        }
    `;

    // Attach shaders, link program & render.
    const pointerPlugin = new PointerPlugin(canvas, shapes, pluginVectorShader, pluginFragmentShader);
    const main = new Program(canvas, shapes, mainVectorShader, mainFragmentShader, {
        color: [102, 51, 153, 1],
        attrs: {
            a_position: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 9, size: 4},
            a_texcoord: {type: WebGL2RenderingContext.FLOAT, len: 3, stride: 9, size: 4},
            a_alpha: {type: WebGL2RenderingContext.FLOAT,len: 1, stride: 9, size: 4},
            a_offset: {type: WebGL2RenderingContext.FLOAT,len: 1, stride: 9, size: 4},
            a_type: {type: WebGL2RenderingContext.INT, len: 1, stride: 9, size: 4},
        },
        atlases: {
            u_logo: {
                path: "/static/imgs/logos.png",
                idx: ShapeType.LOGO,
                width: 128,
                height: 128,
                depth: 21,
            },
            u_hint: {
                path: "/static/imgs/atlas.png",
                idx: ShapeType.HINT,
                width: 720,
                height: 1280,
                depth: 12,
            },
            u_personal: {
                path: "/static/imgs/personal.png",
                idx: ShapeType.PERSONAL,
                width: 360,
                height: 202,
                depth: 4,
            }
        },
        plugins: [
            pointerPlugin,
        ],
    })
    .render({
        static: {
            u_resolution: new Float32Array([window.outerWidth, window.outerHeight]),
            u_vp: vp,
            u_picked: new Int32Array([-1, -1, -1, -1, -1, -1]),
        },
        dynamic: {
            u_id: (shape) => shape.id,
            u_world: (shape) => shape.world,
            u_logo: (shape) => shape.texture,
            u_hint: (shape) => shape.texture,
            u_personal: (shape) => shape.texture,
        }
    });

    // Handle drag
    let DRAGGING = false;
    const xz = [0, 0];
    const lastXZ = [0, 0];
    canvas.addEventListener("pointermove", (e) => {
        if (!DRAGGING) {
            return;
        }

        if ((xz[0] > -0.90 && e.movementX >= 0) || (xz[0] < 0.90 && e.movementX <= 0)) {
            xz[0] -= (e.offsetX - lastXZ[0])/canvas.width;
        }
        if ((xz[1] > -1.5 && e.movementY >= 0) || (xz[1] < 0.2 && e.movementY <= 0)) {
            xz[1] -= (e.offsetY - lastXZ[1])/canvas.height;
        }

        main.drawOptions.static!.u_vp = vp.translate(xz[0], 0.0, xz[1]);
        lastXZ[0] = e.offsetX;
        lastXZ[1] = e.offsetY;

    });
    canvas.addEventListener("pointerup", () => DRAGGING = false);
    canvas.addEventListener("pointerleave", () => DRAGGING = false);
    canvas.addEventListener("pointerdown", (e) => {
        lastXZ[0] = e.offsetX;
        lastXZ[1] = e.offsetY;
        DRAGGING = true;
    });

    // Handle pick
    const picked = new Int32Array([-1, -1, -1, -1, -1, -1]);
    const lastShape = [shapes[1], shapes[1]];
    pointerPlugin.on("pointermove", (e) => {
        if (e.id == 0) {
            picked[0] = shapes[1].isFocused() ? 1 : -1, picked[1] = -1, picked[2] = -1;
            main.drawOptions.static!.u_picked = picked;
            shapes[4].hoverOut();
            shapes[4].hide();
            lastShape[0].hoverOut();
            lastShape[0].hide();
            return;
        }

        lastShape[0].hoverOut();
        lastShape[0].hide();

        switch (e.shape.id[0]) {
            case 5: case 6: case 7:
                picked[0] = 1, picked[1] = 4, picked[2] = e.id;
                main.drawOptions.static!.u_picked = picked;
                e.shape.show();
                e.shape.hoverIn();
                shapes[4].show();
                shapes[4].hoverIn();
                break;
            default:
                picked[0] = 1, picked[1] = e.id;
                main.drawOptions.static!.u_picked = picked;
                e.shape.show();
                e.shape.hoverIn();
        }

        lastShape[0] = e.shape;
    });

    const srcXZ = [0.2, -1.35];
    const trgXZ = [0, 0];
    let time = -1;
    pointerPlugin.on("pointerdown", (e) => {
        if (e.id == 0) {
            picked[5] = -1;
            main.drawOptions.static!.u_picked = picked;
            lastShape[1].blur();
            lastShape[1].hide();
            return;
        }

        DRAGGING = false;
        lastShape[1].blur();
        lastShape[1].hide();
        for (const shape of shapes) {
            for (const child of shape) {
                if (child.isFocused()) {
                    child.blur();
                    child.hide();
                }
            }
        }

        switch (e.shape.id[0]) {
            case 5: case 6: case 7:
                picked[0] = 1, picked[3] = 4, picked[4] = e.id, picked[5] = -1;
                shapes[4].focus();
                shapes[4].show();
                shapes[1].focus();
                break;
            case 100: case 101: case 102: case 103: case 104: case 105: 
            case 200: case 201: case 202: case 203: case 204: case 205: case 206:
            case 300: case 301: case 302: case 303: case 304: case 305: {
                picked[0] = 1, picked[3] = 4, picked[4] = e.node.id[0], picked[5] = e.id;
                shapes[4].focus();
                shapes[4].show();
                lastShape[1] = e.shape;
                break;
            }
            case 2:
                picked[0] = 1, picked[3] = 2, picked[4] = -1, picked[5] = -1;
                shapes[2].focus();
                shapes[2].show();
                shapes[1].focus();
                break;
            case 50: case 51: case 52: case 53: {
                picked[0] = 1, picked[3] = 2, picked[4] = e.id;
                shapes[2].focus();
                shapes[2].show();
                lastShape[1] = e.shape;
                break;
            }
            default: {
                picked[0] = 1, picked[3] = e.id, picked[4] = -1, picked[5] = -1;
                shapes[1].focus();
            }
        }

        main.drawOptions.static!.u_picked = picked;
        e.shape.focus();
        e.shape.show();
        e.node.focus();
        e.node.show();

        // const dx = shapes[1].world[12] - e.node.world[12];
        const dx = srcXZ[0] - e.node.world[12];
        // const dz = shapes[1].world[14] - e.node.world[14];
        const dz = srcXZ[1] - e.node.world[14];
        xz[0] = e.node.world[12]; xz[1] = e.node.world[14];
        trgXZ[0] = e.node.world[12]; trgXZ[1] = e.node.world[14];
        lastXZ[0] = (xz[0] + 1.0)*canvas.width/2; lastXZ[1] = (1.0 - xz[0])*canvas.height/2;
        time = performance.now();
    });

    // Handle breadcrumbs
    const breadcrumbs = document.querySelector<HTMLDivElement>("#canvas-box .breadcrumbs")!;
    pointerPlugin.on("done", () => {
        breadcrumbs.textContent = "";
        let a = "", b = "";

        for (const shape of shapes.slice(2)) {
            if (shape.isFocused()) {
                a += " \u21FE " + msgs[shape.id[0]];
            }
        }

        for (const shape of shapes) {
            if (shape.isHovered()) {
                b += " \u21FE " + msgs[shape.id[0]];
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

        main.drawOptions.static!.u_vp = mat4
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

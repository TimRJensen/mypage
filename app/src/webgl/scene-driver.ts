import {Drawable, FrameBufferObject, UniformInfo, UniformSetter} from "./common.ts";
import {Event, EventQueue, EventHandler, EventMap} from "./event-driver.ts";

export class SceneEvent<T extends Drawable<T>> extends Event<T> {
    prev: Scene<T>;
    next: Scene<T>;
    constructor(type: string, data: {shape: T; next: Scene<T>; prev: Scene<T>}) {
        super(type, {shape: data.shape});
        this.prev = data.prev;
        this.next = data.next;
    }
}

export class Scene<T extends Drawable<T>>  {
    readonly fbos: Array<FrameBufferObject>;
    readonly drawables: Array<T>;
    readonly vaos: Map<T, WebGLVertexArrayObject>;
    readonly textures: Map<string, WebGLTexture|null>;
    readonly setters: Map<string, UniformSetter<T>>;
    readonly uniformInfo: Map<string, UniformInfo>
    readonly color: [number, number, number];
    private eventQueue: EventQueue<T, Event<T>>;

    constructor(
        eventQueue: EventQueue<T, Event<T>>,
        fbos: Array<FrameBufferObject>,
        vaos: Map<T, WebGLVertexArrayObject>,
        drawables: Array<T>,
        textures: Map<string, WebGLTexture|null>,
        uniforms: Map<string, UniformSetter<T>>,
        uniformInfo: Map<string, UniformInfo>,
        color: [number, number, number] = [0, 0, 0],
    ) {
        this.eventQueue = eventQueue;
        this.fbos = fbos;
        this.vaos = vaos;
        this.drawables = drawables;
        this.textures = textures;
        this.setters = uniforms;
        this.uniformInfo = uniformInfo;
        this.color = [...color];
        this.color[0] /= 255;
        this.color[1] /= 255;
        this.color[2] /= 255;
    }

    fire(e: Event<T>) {
        this.eventQueue.fire(e);
    }

    on<E extends Event<T>>(type: keyof EventMap<T>, handler: EventHandler<T, E>) {
        this.eventQueue.on(type, <EventHandler<T, Event<T>>>handler);
    }
}

export class SceneDriver<T extends Drawable<T>> {
    readonly scenes: Map<string, Scene<T>>;
    private current: Scene<T> = null!;


    constructor(scenes: Map<string, Scene<T>>, defaultScene: string) {
        this.scenes = scenes;
        this.current = scenes.get(defaultScene)!;
    }

    switch (key: string): void {
        if (this.scenes.has(key)) {
            const prev = this.current, next = this.get(key)!;
            this.current = next;
            this.current.fire(new SceneEvent("switch", {shape: null!, next, prev}))
        }
    }

    get(key: string): Scene<T>|null {
        return this.scenes.get(key) ?? null;
    }

    scene(): Scene<T> {
        return this.current;
    }
}

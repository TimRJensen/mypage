export type AttributeObject = {
    loc?: number;
    type?: number;
    len: number;
    stride: number;
    size: number;
};

export type AttributeInfo = {
    [key: string]: AttributeObject;
};

export type UniformInfo = {
    loc: WebGLUniformLocation;
    type: number;
};

export type TextureObject = {
    width: number;
    height: number;
    depth: number;
    target?: GLenum;
};

export type TextureInfo = {
    [key: string]: TextureObject;
};

export type UniformSetter<T> = number | Float32Array | Int16Array | ((shape: T) => number | Float32Array | Int16Array)
export type UniformObject<T> = Record<string, UniformSetter<T>>;

export interface DrawableScene<T> {
    readonly fbos: Array<FrameBufferObject>;
    readonly drawables: Array<T>;
    readonly vaos: Map<T, WebGLVertexArrayObject>;
    readonly textures: Map<string, WebGLTexture|null>;
    readonly setters: Map<string, UniformSetter<T>>;
    readonly uniformInfo: Map<string, UniformInfo>
    readonly color: [number, number, number];
}

export interface Drawable<T> extends Iterable<T> {
    readonly buffer: Promise<[Float32Array, Uint16Array]>;
    draw(gl: WebGLRenderingContext, scene: DrawableScene<T>, offset?: number): void;
}

export interface DrawableNode<T> extends Drawable<T> {
    parent(): DrawableNode<T>|null;
    addChild(child: DrawableNode<T>): void;
    firstChild(): DrawableNode<T>|null;
    lastChild(): DrawableNode<T>|null;
    nextSibling(): DrawableNode<T>|null;
    prevSibling(): DrawableNode<T>|null;
}

type Attachment = {
    format: GLenum;
    tex: WebGLTexture | null;
}

export class FrameBufferObject {
    public attachments: Array<Attachment> = [];
    public depth: WebGLRenderbuffer | null = null;

    constructor(
        readonly buff: WebGLFramebuffer,
        public width: number,
        public height: number,
        public samples: number = 0,
    ) {}
}

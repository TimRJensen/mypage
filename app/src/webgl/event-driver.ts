import {Drawable} from "./common.ts";

export class Event<T> extends CustomEvent<T> {
    shape: T;

    constructor(type: string, {shape}: {shape: T}) {
        super(type);
        this.shape = shape;
    }
}
export type EventHandler<T, E extends Event<T> = Event<T>> = (e: E) => void;
export type EventMap<T> = Record<keyof HTMLElementEventMap | "done" | "ready" | "switch", Event<T>>;

export class EventQueue<T extends Drawable<T>, E extends Event<T>> {
    protected handlers: Map<string, Array<EventHandler<T>>> = new Map();
    protected events: Array<Event<T>> = [];
    protected canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    fire(e: Event<T>) {
        this.events.push(e);
    }

    on(type: keyof EventMap<T>, handler: EventHandler<T, E>) {
        if (this.handlers.has(type)) {
            this.handlers.get(type)!.push(<EventHandler<T>>handler);
        } else {
            this.handlers.set(type, [<EventHandler<T>>handler]);
        }
    }

    flush() {
        for (const e of this.events) {
            if (!this.handlers.has(e.type)) {
                continue;
            }

            for (const handler of this.handlers.get(e.type)!) {
                handler(e);
            }
        }
        this.events = [];
    }
}

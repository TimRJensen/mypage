import {Drawable} from "./common.ts";

export class Event<T> extends CustomEvent<T> {
    constructor(type: string) {
        super(type);
    }
}
export type EventHandler<T, E extends Event<T> = Event<T>> = (e: E) => void;
export type EventMap<T> = Record<keyof HTMLElementEventMap | "done" | "ready" | "switch" | "resize", Event<T>>;

export interface ChannelLike<T, E extends Event<T>> {
    on(type: keyof EventMap<T>, handler: EventHandler<T, E>): void
    fire(e: Event<T>): void
}

export class EventQueue<T extends Drawable<T>, E extends Event<T>, C extends ChannelLike<T, E>,> {
    protected handlers: Map<string, Array<[C, EventHandler<T>]>> = new Map();
    protected events: Array<[C, Event<T>]> = [];
    protected canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    fire(target: C, e: Event<T>) {
        this.events.push([target, e]);
        return this;
    }

    on(type: keyof EventMap<T>, target: C, handler: EventHandler<T, E>) {
        if (this.handlers.has(type)) {
            this.handlers.get(type)!.push([target, <EventHandler<T>>handler]);
        } else {
            this.handlers.set(type, [[target, <EventHandler<T>>handler]]);
        }
        return this;
    }

    flush(target: C) {
        for (const [trg, e] of this.events) {
            if (!this.handlers.has(e.type)) {
                continue;
            }
            if (target != trg) {
                continue;
            }
            
            for (const [_, handler] of  this.handlers.get(e.type)!.filter(([trg]) => trg == target)) {
                handler(e);
            }
        }
        this.events = this.events.filter(([obj]) => target != obj);
        return this;
    }
}

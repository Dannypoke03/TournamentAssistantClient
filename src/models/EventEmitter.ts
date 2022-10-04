export interface IHasEmitter<T> {
    emitter: Emitter<T>;
}

export type EventMap<T> = Record<keyof T, any>;

export type EventKey<T extends EventMap<T>> = keyof T;
export type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap<T>> {
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    once<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
    emit<K extends EventKey<T>>(eventName: K): void;
}

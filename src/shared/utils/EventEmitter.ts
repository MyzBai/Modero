type Callback<T> = (args: T, instance: EventInstance<T>) => void;

interface EventInstance<T> {
    callback: Callback<T>;
    opts?: CallbackInputOptions;
    removeListener: () => void;
}
interface CallbackInputOptions {
    once?: boolean;
}

export class EventEmitter<T> {
    private readonly listeners = new Map<Callback<T>, EventInstance<T>>;

    listen(callback: Callback<T>, opts?: CallbackInputOptions) {
        const removeListener = () => this.removeListener(callback);
        const instance: EventInstance<T> = { callback, opts, removeListener };
        this.listeners.set(callback, instance);
    }
    removeListener(callback: Callback<T>) {
        this.listeners.delete(callback);
    }
    removeAllListeners() {
        this.listeners.clear();
    }

    invoke(value: T) {
        for (const [callback, listener] of this.listeners.entries()) {
            listener.callback(value, listener);
            if (listener.opts?.once) {
                this.listeners.delete(callback);
            }
        }
    }
}
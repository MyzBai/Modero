import { EventEmitter } from './EventEmitter';

export type ValueEventType = 'change' | 'set' | 'add' | 'subtract';
type Callback = (args: EventEmitterCallbackArgs) => void;
type TargetValueCallback = (v: number) => void;
type EventEmitterCallbackArgs = { curValue: number; change: number; };

export class Value {
    private _value: number;
    readonly listeners = {
        change: new EventEmitter<EventEmitterCallbackArgs>,
        set: new EventEmitter<EventEmitterCallbackArgs>,
        add: new EventEmitter<EventEmitterCallbackArgs>,
        subtract: new EventEmitter<EventEmitterCallbackArgs>,
    } as const;
    mutated = false;
    constructor(public defaultValue: number) {
        this._value = defaultValue;
    }

    get value() {
        return this._value;
    }

    set(v: number, silent = false) {
        if (v === this._value) {
            return;
        }
        this._value = v;
        if (!silent) {
            this.listeners.set.invoke({ curValue: this._value, change: v });
            this.listeners.change.invoke({ curValue: this._value, change: v });
        }
        this.mutated = true;
    }

    add(v: number) {
        if (v === 0) {
            return;
        }
        this._value += v;
        this.listeners.add.invoke({ curValue: this._value, change: v });
        this.listeners.change.invoke({ curValue: this._value, change: v });
        this.mutated = true;
    }

    subtract(v: number) {
        if (v === 0) {
            return;
        }
        this._value -= v;
        this.listeners.subtract.invoke({ curValue: this._value, change: v });
        this.listeners.change.invoke({ curValue: this._value, change: v });
        this.mutated = true;
    }

    reset() {
        this.mutated = false;
        this._value = this.defaultValue;
        Object.values(this.listeners).forEach(x => x.removeAllListeners());
    }

    addListener(type: keyof typeof this.listeners, callback: Callback) {
        this.listeners[type].listen(callback);
    }

    removeListener(type: keyof typeof this.listeners, callback: Callback) {
        this.listeners[type].removeListener(callback);
    }

    registerTargetValueCallback(targetValue: number, callback: TargetValueCallback) {
        if (this._value >= targetValue) {
            callback(this._value);
            return;
        }
        const listener = () => {
            if (this._value >= targetValue) {
                callback(this._value);
                this.removeListener('change', listener);
            }
        };
        this.addListener('change', listener);
    }
}
import { uuid } from './utils';
import { LoopWorker } from './LoopWorker';

export type LoopType = 'Default' | 'WebWorker' | 'Animation';
export type LoopState = 'Running' | 'Stopped';
type Callback = (dt: number, instance: Instance) => void;
interface Instance {
    time: number;
    id: string;
    callback: Callback;
    options?: Options;
}
type InstanceMap = Map<string, Instance>;
export interface Options {
    delay?: number;
    once?: boolean;
}

export interface LoopSubscription {
    id: string;
    unsubscribe: () => void;
}

export const TARGET_TICK_RATE = 1000 / 60;
const DELTA_TIME_SECONDS = TARGET_TICK_RATE / 1000;

export class Loop {
    private _state: LoopState = 'Stopped';
    private loop: BaseLoop;
    constructor(type: LoopType = 'Default') {
        switch (type) {
            case 'Default': this.loop = new DefaultLoop(); break;
            case 'WebWorker': this.loop = new WebWorkerLoop(); break;
            case 'Animation': this.loop = new AnimationLoop(); break;
        }
    }

    get state() {
        return this._state;
    }

    get loopType() {
        return this.loop.type;
    }

    setLoopType(type: LoopType) {
        if (this.loopType === type) {
            return;
        }
        const state = this._state;
        const instanceMap = this.loop.instanceMap;
        if (state === 'Running') {
            this.stop();
        }
        this.loop?.dispose?.();

        switch (type) {
            case 'WebWorker': this.loop = new WebWorkerLoop(); break;
            case 'Animation': this.loop = new AnimationLoop(); break;
            default: this.loop = new DefaultLoop(); break;
        }
        instanceMap.forEach((value, key) => this.loop.instanceMap.set(key, value));
        if (state === 'Running') {
            this.start();
        }
    }

    setSpeed(speed: number) {
        BaseLoop.speedMultiplier = Math.round(speed);
    }

    registerCallback(callback: Callback, options?: Options): string {
        const id = uuid();
        const instance: Instance = {
            time: 0,
            id,
            callback,
            options,
        };
        this.loop.instanceMap.set(id, instance);
        return id;
    }

    unregister(id: string) {
        this.loop.unregister(id);
    }

    reset() {
        this.loop.instanceMap.clear();
    }

    toggleState() {
        switch (this._state) {
            case 'Running': this.stop(); break;
            case 'Stopped': this.start(); break;
        }
    }

    start() {
        if (this._state === 'Running') {
            return;
        }
        this._state = 'Running';
        this.loop.start();
    }

    stop() {
        this._state = 'Stopped';
        this.loop.stop();
    }
}

abstract class BaseLoop {
    static speedMultiplier = 1;
    abstract readonly type: LoopType;
    readonly instanceMap: InstanceMap = new Map();
    private lastTime = 0;
    private remainder = 0;

    dispose?(): void;

    unregister(id: string) {
        this.instanceMap.delete(id);
    }

    start() {
        this.remainder = 0;
        this.lastTime = performance.now();
    }

    abstract stop(): void;

    tick() {
        const frameTime = Math.min(performance.now() - this.lastTime, 2000); //to prevent accumulation using breakpoints etc..
        let time = frameTime + this.remainder;
        while (time >= TARGET_TICK_RATE) {
            time -= TARGET_TICK_RATE / BaseLoop.speedMultiplier;
            for (const instance of this.instanceMap.values()) {
                instance.time += TARGET_TICK_RATE;
                const targetWaitTime = instance.options?.delay ?? TARGET_TICK_RATE;
                if (instance.time < targetWaitTime) {
                    continue;
                }
                instance.callback(DELTA_TIME_SECONDS, instance);
                if (instance.options?.once) {
                    this.instanceMap.delete(instance.id);
                } else {
                    instance.time -= targetWaitTime;
                }
            }
        }
        this.remainder = time;
        this.lastTime = performance.now();
    }

    skipTime(time: number) {
        this.remainder += time;
    }
}

class DefaultLoop extends BaseLoop {
    readonly type = 'Default';
    private loopId: number = -1;
    start(): void {
        clearTimeout(this.loopId);
        super.start();
        const loop = () => {
            this.loopId = window.setTimeout(() => {
                super.tick();
                if (this.loopId) {
                    loop();
                }
            }, TARGET_TICK_RATE);
        };
        loop();
    }
    stop(): void {
        window.clearTimeout(this.loopId);
        this.loopId = -1;
    }
}

class WebWorkerLoop extends BaseLoop {
    readonly type = 'WebWorker';
    private readonly worker: LoopWorker;
    constructor() {
        super();

        this.worker = new LoopWorker();
        this.worker.onMessage = () => {
            super.tick();
        };
    }
    start(): void {
        this.worker.postMessage({ state: 'start' });
        super.start();
    }
    stop(): void {
        this.worker.postMessage({ state: 'stop' });
    }
    dispose() {
        this.worker.terminate();
    }
}

class AnimationLoop extends BaseLoop {
    readonly type = 'Animation';
    private requestId = 0;
    start() {
        cancelAnimationFrame(this.requestId);
        super.start();
        const loop = () => {
            this.requestId = requestAnimationFrame(() => {
                super.tick();
                if (this.requestId > 0) {
                    loop();
                }
            });
        };
        loop();
    }
    stop(): void {
        cancelAnimationFrame(this.requestId);
        this.requestId = 0;
    }
}
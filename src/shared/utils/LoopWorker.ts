export interface LoopWorkerData {
    state: 'start' | 'stop';
}

export class LoopWorker {
    private worker: Worker;
    constructor() {
        const blob = new Blob([`(${workerScript.toString()})();`]);
        const blobURL = window.URL.createObjectURL(blob);
        this.worker = new Worker(blobURL);
        this.worker.addEventListener('message', () => this.onMessage());
        this.worker.onmessage = this.onMessage.bind(this);
    }

    postMessage(data: LoopWorkerData) {
        this.worker.postMessage(data);
    }

    onMessage() { }

    terminate() {
        this.worker.terminate();
    }
}

const workerScript = (() => {
    const WAIT_TIME = 1000;
    let loopId: number | undefined;
    const loop = () => {
        let remainder = 0;
        let now = performance.now();
        clearTimeout(loopId);
        const loop = () => {
            loopId = self.setTimeout(() => {
                let time = performance.now() - now + remainder;
                now = performance.now();
                if (time >= WAIT_TIME) {
                    self.postMessage(undefined);
                    time -= 1000;
                }
                remainder = time;
                loop();
            }, WAIT_TIME);
        };
        loop();
    };
    self.addEventListener('message', (e: MessageEvent<LoopWorkerData>) => {
        switch (e.data.state) {
            case 'start': loop(); break;
            case 'stop': clearTimeout(loopId); break;
        }
    });
});
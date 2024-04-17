import { CustomElement } from './CustomElement';

export class ProgressElement extends CustomElement {
    static name = 'progress-element';
    private _value: number = 0;
    private readonly valueElement: HTMLElement;
    constructor() {
        super();
        this.valueElement = document.createElement('div');
        this.valueElement.classList.add('value');
    }

    set value(v: number) {
        this._value = Number.isFinite(v) ? v : 1;
        this.update();
    }

    get value() {
        return this._value;
    }

    private update() {
        this.valueElement.style.width = CSS.percent(this._value * 100).toString();
    }

    init(): void {
        this.appendChild(this.valueElement);
        const inner = document.createElement('div');
        inner.classList.add('inner');
        this.valueElement.appendChild(inner);
        this.update();
    }
}
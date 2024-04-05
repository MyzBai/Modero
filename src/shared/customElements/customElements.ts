import type { CustomElement } from './CustomElement';

export function createCustomElement<T extends new () => CustomElement>(ctor: T) {
    const name = ctor.name;
    if (!customElements.get(name)) {
        customElements.define(name, ctor);
    }
    const element = document.createElement(name) as InstanceType<T>;
    element.init?.();
    return element;
}
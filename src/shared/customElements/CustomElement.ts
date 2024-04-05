
export abstract class CustomElement extends HTMLElement {
    init?(): void;

    cloneNode(deep?: boolean | undefined): Node {
        super.cloneNode(deep);
        this.init?.();
        return this;
    }
}
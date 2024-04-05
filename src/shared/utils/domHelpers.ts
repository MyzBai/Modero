

export function elementFromHTML(type: keyof HTMLElementTagNameMap, innerHTML: string): HTMLElement {
    const element = document.createElement(type);
    element.innerHTML = innerHTML;
    return element;
}
import { ModalElement } from '../customElements/ModalElement';
import { createCustomElement } from '../customElements/customElements';
import { isString } from './utils';


export function createHelpIcon(title: string, textCallback: () => string): HTMLElement;
export function createHelpIcon(title: string, text: string): HTMLElement;
export function createHelpIcon(title: string, text: string | (() => string)): HTMLElement {
    const element = document.createElement('div');
    element.classList.add('g-help-icon');
    element.textContent = '?';
    element.addEventListener('click', () => {
        const modal = createCustomElement(ModalElement);
        modal.setTitle(title);
        const bodyText = isString(text) ? text : text();
        modal.setBodyText(bodyText);
    });
    return element;
}
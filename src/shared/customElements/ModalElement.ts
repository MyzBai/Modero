import { CustomElement } from './CustomElement';

export interface ButtonArgs {
    text: string;
    type?: 'confirm' | 'utility' | 'cancel';
    waitId?: string;
    callback?: () => Promise<void>;
}

export class ModalElement extends CustomElement {
    static readonly name = 'modal-element';
    set minWidth(v: string) {
        this.querySelectorStrict<HTMLElement>('[data-body]').style.minWidth = v;
    }

    init() {
        const content = document.createElement('div');
        content.classList.add('s-content');
        this.appendChild(content);

        content.insertAdjacentHTML('beforeend', '<div class="title hidden" data-title></div>');
        content.insertAdjacentHTML('beforeend', '<div class="s-body" data-body></div>');
        content.insertAdjacentHTML('beforeend', '<div class="s-buttons" data-buttons></div>');

        const backdrop = document.createElement('div');
        backdrop.classList.add('backdrop');
        backdrop.addEventListener('mousedown', this.remove.bind(this));
        this.appendChild(backdrop);

        document.body.appendChild(this);
    }

    setTitle(text: string) {
        const titleElement = this.querySelectorStrict<HTMLElement>('[data-title]');
        titleElement.textContent = text;
        titleElement.classList.toggle('hidden', text.length === 0);
    }

    setBodyText(text: string) {
        this.querySelectorStrict<HTMLElement>('[data-body]').textContent = text;
    }

    setBodyElement(element: HTMLElement) {
        this.querySelectorStrict<HTMLElement>('[data-body]').appendChild(element);
    }

    async setButtons<T extends ButtonArgs[], U extends T[number]['waitId']>(buttons: (T[number] & { waitId?: U; })[], align: 'vertical' | 'horizontal' = 'horizontal') {
        return new Promise<U | undefined>((resolve) => {
            const buttonElements: HTMLButtonElement[] = [];
            for (const buttonData of buttons) {
                const button = document.createElement('button');
                button.setAttribute('type', 'submit');
                if (buttonData.type) {
                    button.setAttribute('data-role', buttonData.type);
                }
                button.textContent = buttonData.text;
                button.addEventListener('click', async () => {
                    await buttonData.callback?.();
                    this.remove();
                    resolve(buttonData.waitId);
                });
                buttonElements.push(button);
            }
            const buttonsElement = this.querySelectorStrict<HTMLElement>('[data-buttons]');
            buttonsElement.replaceChildren(...buttonElements);
            buttonsElement.style.display = 'flex';
            buttonsElement.style.flexDirection = align === 'horizontal' ? 'column' : 'row';
        });
    }
}
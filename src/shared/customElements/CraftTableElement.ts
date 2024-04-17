import { ModifierTagList } from 'src/game/mods/types';
import { createCustomElement } from './customElements';
import { ModalElement } from './ModalElement';
import { CustomElement } from './CustomElement';

export class CraftTableElement extends CustomElement {
    static readonly name = 'craft-table-element';
    confirmCraftCallback?: () => void;
    cancelCraftCallback?: () => void;
    craftCallback?: (id: string) => void;
    selectCraftCallback?: (id: string | null) => void;
    compareCallback?: () => [HTMLElement, HTMLElement];
    private _craftMode = false;

    init() {
        this.insertAdjacentHTML('beforeend', '<div class="g-title">Craft Table</div>');
        const toolbar = document.createElement('ul');
        toolbar.classList.add('s-toolbar', 'g-toolbar');
        toolbar.insertAdjacentHTML('beforeend', '<li><button data-compare-button>Compare</button></li>');
        toolbar.insertAdjacentHTML('beforeend', '<li><button data-confirm-button data-role="confirm">Confirm</button></li>');
        toolbar.insertAdjacentHTML('beforeend', '<li><button data-cancel-button data-role="cancel">Cancel</button></li>');
        this.appendChild(toolbar);

        const craftContainer = document.createElement('div');
        craftContainer.classList.add('s-craft-container');
        craftContainer.setAttribute('data-craft-container', '');
        craftContainer.insertAdjacentHTML('beforeend', '<button class="craft-button" data-craft-button disabled>Craft</button>');
        craftContainer.insertAdjacentHTML('beforeend', '<div class="craft-msg" data-msg>\u200B</div>');
        craftContainer.insertAdjacentHTML('beforeend', '<ul class="s-craft-list g-scroll-list-v" data-craft-list></ul>');
        this.appendChild(craftContainer);

        toolbar.querySelectorStrict('[data-compare-button]').addEventListener('click', () => {
            this.compare();
        });

        toolbar.querySelectorStrict('[data-confirm-button]').addEventListener('click', () => {
            this.confirmCraftCallback?.();
            this.setCraftModeState(false);
        });

        toolbar.querySelectorStrict('[data-cancel-button]').addEventListener('click', () => {
            this.cancelCraftCallback?.();
            this.setCraftModeState(false);
        });

        craftContainer.querySelectorStrict('[data-craft-button]').addEventListener('click', () => {
            const element = this.querySelector('[data-craft-list] [data-id].selected');
            const id = element?.getAttribute('data-id');
            if (element && id) {
                this.craftCallback?.(id);
            }
        });

        this.setCraftModeState(false);
    }

    enableCraftMode() {
        if (this._craftMode) {
            return;
        }
        this.setCraftModeState(true);
    }
    setCraftModeState(on: boolean) {
        this._craftMode = on;
        this.querySelectorStrict('[data-compare-button]').toggleAttribute('disabled', !on);
        this.querySelectorStrict('[data-confirm-button]').toggleAttribute('disabled', !on);
        this.querySelectorStrict('[data-cancel-button]').toggleAttribute('disabled', !on);
    }

    setCraftMessage(msg?: string) {
        this.querySelectorStrict('[data-msg]').textContent = msg || '\u200B';
    }

    setCraftButtonState(state: 'enabled' | 'disabled') {
        this.querySelectorStrict('[data-craft-button]').toggleAttribute('disabled', state === 'enabled' ? false : true);
    }

    registerCraft(desc: string, id: string) {
        const listElement = this.querySelectorStrict(`[data-craft-list]`);

        const li = document.createElement('li');
        li.classList.add('g-list-item', 'g-field');
        li.setAttribute('data-id', id);
        desc = desc.replace(/\b\w+\b/g, a => {
            if (ModifierTagList.some(x => x.toLowerCase() == a.toLowerCase())) {
                return `<span data-tag="${a}">${a}</span>`;
            }
            return a;
        });
        li.insertAdjacentHTML('beforeend', `<div>${desc}</div><var data-count>0</var>`);
        li.addEventListener('click', () => this.selectCraft(id));
        listElement.appendChild(li);
    }

    updateCraftCount(id: string, count: number) {
        const element = this.querySelector(`[data-craft-list] [data-id="${id}"] [data-count]`);
        if (element) {
            element.textContent = Number.isFinite(count) ? count.toFixed() : '∞';
        }
    }

    addLog(message: string) {
        this.querySelectorStrict('[data-log-list]').insertAdjacentHTML('beforeend', `<li>${message}</li>`);
    }

    sortCraftList(comparer: (a: HTMLElement, b: HTMLElement) => number) {
        this.append(...[...this.querySelectorAll<HTMLElement>('[data-craft-list] [data-id]')].sort(comparer));
    }

    selectCraft(id: string | null) {
        this.querySelectorAll('[data-craft-list] [data-id]').forEach(x => x.classList.toggle('selected', x.getAttribute('data-id') === id));
        this.selectCraftCallback?.(id);
    }

    private compare() {
        if (!this.compareCallback) {
            return;
        }
        const [a, b] = this.compareCallback();
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Item Compare');
        const element = document.createElement('div');
        element.classList.add('s-compare');
        element.append(a, b);
        modal.setBodyElement(element);
        this.append(modal);
    }
}
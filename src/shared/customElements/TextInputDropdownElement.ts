import { game } from 'src/game/game';
import { CustomElement } from './CustomElement';

export class TextInputDropdownElement extends CustomElement {
    static readonly name = 'text-input-dropdown-element';
    readonly input: HTMLInputElement;
    private prevValue?: string;
    private inputAnchor: 'top left' | 'top right' | 'bottom right' | 'bottom left' = 'bottom left';
    private boxAnchor: 'top left' | 'top right' | 'bottom right' | 'bottom left' = 'top left';
    private dropdownList: string[] = [];
    private abortController?: AbortController;
    validator = (text: string) => text.length > 0 ? this.dropdownList.includes(text) : true;
    onInputChange?: (args: { text: string; index: number; valid: boolean; }) => void;
    onInputOpen?: () => void;

    constructor() {
        super();

        this.input = document.createElement('input');
        this.input.setAttribute('spellcheck', 'false');
        this.input.setAttribute('type', 'text');
        this.input.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            if (!this.isOpen) {
                this.openContent();
            } else {
                this.closeDropdownContentElement();
            }
        }, { capture: true });
        this.input.addEventListener('input', () => {
            for (const child of this.dropdownContentElement.children) {
                const include = child.textContent?.toLowerCase().includes(this.input.value.toLowerCase());
                child.classList.toggle('hidden', !include);
            }
        });

        this.closeDropdownContentElement = this.closeDropdownContentElement.bind(this);
        this.updateDropdownContentElementPosition = this.updateDropdownContentElementPosition.bind(this);
    }

    get validText() {
        return this.validator(this.input.value);
    }

    get dropdownContentElement() {
        return this.querySelector<HTMLElement>('[data-dropdown-content]') ?? this.createDropdownContentElement();
    }

    get isOpen() {
        return !this.dropdownContentElement.classList.contains('hidden');
    }

    private createDropdownContentElement() {
        const element = document.createElement('div');
        element.classList.add('s-dropdown-content', 'hidden');
        element.setAttribute('data-dropdown-content', '');
        // window.addEventListener('resize', this.updateDropdownContentElementPosition.bind(this));
        this.appendChild(element);
        return element;
    }

    private updateBackgroundState() {
        const valid = this.validator(this.input.value);
        this.setAttribute('data-state', valid ? 'valid' : 'invalid');
    }

    private openContent() {
        this.onInputOpen?.();
        const elements: HTMLElement[] = [];
        for (const item of this.dropdownList || []) {
            const li = document.createElement('li');
            li.classList.add('g-list-item');
            li.textContent = item;

            li.addEventListener('mouseup', () => {
                this.input.value = li.textContent || '';
                this.input.dispatchEvent(new Event('change', { bubbles: true }));
                this.closeDropdownContentElement();
            }, { capture: true });
            elements.push(li);
        }
        this.dropdownContentElement.replaceChildren(...elements);
        this.dropdownContentElement.classList.toggle('hidden', elements.length === 0);
        this.appendChild(this.dropdownContentElement);
        if (elements.length > 0) {
            this.abortController = new AbortController();
            this.updateDropdownContentElementPosition();
            document.addEventListener('mouseup', e => {
                if (e.currentTarget !== this) {
                    this.closeDropdownContentElement();
                }
            }, { signal: this.abortController.signal });
            // window.addEventListener('resize', this.updateDropdownContentElementPosition, { signal: this.abortController.signal });
        }
        this.dropdownContentElement.style.width = CSS.px(Math.max(this.clientWidth, this.dropdownContentElement.getBoundingClientRect().width)).toString();
    }

    private closeDropdownContentElement(e?: MouseEvent) {
        if (e?.target instanceof Element) {
            if (this.contains(e.target)) {
                return;
            }
            if (e.target.tagName.toLowerCase() !== 'input') {
                e.stopPropagation();
            }
        }
        this.dropdownContentElement.remove();
        this.abortController?.abort();

        this.updateBackgroundState();
        if (this.prevValue !== this.input.value) {
            this.prevValue = this.input.value;
            this.onInputChange?.({ text: this.input.value, index: this.dropdownList.indexOf(this.input.value), valid: this.validText });
        }
    }

    private updateDropdownContentElementPosition() {
        const inputRect = this.input.getBoundingClientRect();
        const boxRect = this.dropdownContentElement.getBoundingClientRect();

        let left = inputRect.left;
        let top = inputRect.top;

        //inputAnchor = bottom left boxAnchor = top left
        if (this.inputAnchor.includes('bottom')) {
            top += inputRect.height;
        }
        if (this.inputAnchor.includes('right')) {
            left += inputRect.width;
        }

        if (this.boxAnchor.includes('bottom')) {
            top -= boxRect.height;
        }
        if (this.boxAnchor.includes('right')) {
            left -= boxRect.width;
        }

        left = Number.isFinite(left) ? left : 0;
        top = Number.isFinite(top) ? top : 0;

        //TODO: position dropdown content element dynamically

        this.dropdownContentElement.style.left = CSS.px(left + 4).toString();
        this.dropdownContentElement.style.top = CSS.px(top + 6).toString();

        const newBoxRect = this.dropdownContentElement.getBoundingClientRect();
        const maxHeight = game.page.getBoundingClientRect().bottom - newBoxRect.top;

        this.dropdownContentElement.style.maxHeight = CSS.px(Number.isFinite(maxHeight) ? maxHeight : 0).toString();
    }

    init() {
        this.replaceChildren(this.input);
    }

    setReadonly(state = true) {
        this.input.toggleAttribute('readonly', state);
    }

    setInputText<T extends string>(text?: T) {
        this.input.value = text ?? '';
        this.prevValue = this.input.value;
    }

    setDropdownList(items: string[]) {
        this.dropdownList = items;
        const value = items[0];
        if (!this.input.value) {
            this.setInputText(value);
        }
    }

    setInputAnchor(position: typeof this.inputAnchor) {
        this.inputAnchor = position;
        this.updateDropdownContentElementPosition();
    }

    setBoxAnchor(position: typeof this.boxAnchor) {
        this.boxAnchor = position;
        this.updateDropdownContentElementPosition();
    }

    validate() {
        this.updateBackgroundState();
    }
}
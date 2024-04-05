import { CustomElement } from './CustomElement';

export class FilterDropdown extends CustomElement {
    static readonly name = 'filter-dropdown-element';
    private readonly input: HTMLInputElement;
    // private dropdownContent: HTMLElement;
    private inputAnchor: 'top left' | 'top right' | 'bottom right' | 'bottom left' = 'bottom left';
    private boxAnchor: 'top left' | 'top right' | 'bottom right' | 'bottom left' = 'top right';
    private readonly filterBox: HTMLElement;
    private filterList: string[] = [];

    validator = (text: string) => text ? this.filterList?.includes(text) : true || false;
    constructor() {
        super();

        this.input = document.createElement('input');
        this.input.setAttribute('spellcheck', 'false');
        this.input.setAttribute('type', 'text');
        this.input.addEventListener('focusin', () => {
            this.openContent();
        });
        this.input.addEventListener('focusout', () => {
            this.closeContent();
            this.setBackgroundState();
        });
        this.input.addEventListener('input', e => {
            if (e.target instanceof HTMLInputElement) {
                this.openContent();
                this.filterContentList(e.target.value);
            }
        });
        this.input.addEventListener('keyup', e => {
            if (e.key === 'Enter') {
                this.input.blur();
            }
        });
        //TODO: add escape event, revert back to previous

        this.filterBox = document.createElement('div');
        this.filterBox.classList.add('filter-dropdown-box', 'hidden');

        // if (!FilterDropdown.filterBox) {
        //     const box = document.createElement('div');
        //     box.classList.add('filter-dropdown-box', 'hidden');
        //     FilterDropdown.filterBox = box;
        //     document.body.appendChild(FilterDropdown.filterBox);
        // }
    }

    init() {
        this.replaceChildren(this.input, this.filterBox);
    }

    setText<T extends string>(text: T) {
        this.input.value = text;
    }

    setFilterList(items: string[]) {
        this.filterList = items;
    }

    private setBackgroundState() {

        const valid = this.validator(this.input.value);
        this.setAttribute('data-state', valid ? 'valid' : 'invalid');
    }

    setInputAnchor(position: typeof this.inputAnchor) {
        this.inputAnchor = position;
        this.updateBoxPosition();
    }

    setBoxAnchor(position: typeof this.boxAnchor) {
        this.boxAnchor = position;
        this.updateBoxPosition();
    }

    private filterContentList(filter: string) {
        for (const child of this.filterBox.children) {
            const include = child.textContent?.toLowerCase().includes(filter.toLowerCase());
            child.classList.toggle('hidden', !include);
        }
    }

    private openContent() {
        const elements: HTMLElement[] = [];
        for (const item of this.filterList || []) {
            const li = document.createElement('li');
            li.classList.add('g-list-item');
            li.textContent = item;

            li.addEventListener('mousedown', () => {
                this.input.value = li.textContent || '';
                this.input.dispatchEvent(new Event('change', { bubbles: true }));
                this.closeContent();
            });
            elements.push(li);
        }
        this.filterBox.replaceChildren(...elements);
        this.filterBox.classList.remove('hidden');
        this.updateBoxPosition();
    }

    private updateBoxPosition() {

        const inputRect = this.input.getBoundingClientRect();
        const boxRect = this.filterBox.getBoundingClientRect();

        //inputAnchor = top left boxAnchor = top left
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

        //TODO if box exceeds screen, shift by an offset..
        this.filterBox.style.left = `${left}px`;
        this.filterBox.style.top = `${top}px`;
        this.filterBox.style.maxHeight = '500px';
    }

    private closeContent() {
        this.filterBox.classList.add('hidden');
    }

}
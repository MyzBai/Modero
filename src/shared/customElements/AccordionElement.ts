import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { isDefined } from 'src/shared/utils/utils';
import { CustomElement } from './CustomElement';

export class AccordionElement extends CustomElement {
    static readonly name = 'accordion-element';
    private readonly header: HTMLElement;
    private contentParent: HTMLElement;
    readonly content: HTMLElement;
    readonly onToggle = new EventEmitter<boolean>();
    private _isOpen = false;
    constructor() {
        super();
        this.header = document.createElement('div');
        this.header.classList.add('header');
        this.header.setAttribute('data-header', '');
        this.header.insertAdjacentHTML('beforeend', '<div class="title" data-title></div>');
        this.header.addEventListener('click', this.open.bind(this));

        this.contentParent = document.createElement('div');
        this.contentParent.classList.add('content-parent');

        this.content = document.createElement('div');
        this.content.classList.add('s-content');
        this.content.setAttribute('data-content', '');
        this.contentParent.appendChild(this.content);
    }

    get isOpen() {
        return this._isOpen;
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this.header.removeEventListener('click', this.open.bind(this));
    }

    init() {
        this.replaceChildren(this.header, this.contentParent);
    }

    open() {
        if (!this.content.firstChild?.hasChildNodes()) {
            return;
        }
        this.toggle(!this.isOpen);
    }

    setTitle(title: string) {
        this.header.querySelectorStrict('[data-title]').textContent = title;
    }

    setTitleElement(element: Element) {
        this.header.querySelectorStrict('[data-title]').replaceWith(element);
    }

    setContentElements(...element: HTMLElement[]) {
        this.content.replaceChildren(...element);
        this.header.classList.toggle('has-content', this.content.childElementCount > 0);
    }

    toggle(open?: boolean) {
        this._isOpen = isDefined(open) ? open : !this._isOpen;
        this.header.classList.toggle('open', this.isOpen);
        this.onToggle.invoke(this.isOpen);
    }
}
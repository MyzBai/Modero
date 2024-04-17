import { CustomElement } from './CustomElement';

type MenuItem = Element;
type PageElement = Element;

export class TabMenuElement extends CustomElement {
    static readonly name = 'tab-menu-element';
    private pageList: HTMLElement[] = [];
    init() {
        this.setDirection('vertical');
        this.classList.add('g-scroll-list-v');
    }

    setDirection(dir: 'vertical' | 'horizontal') {
        this.setAttribute('data-direction', dir);
    }

    private appendMenuItem(menuItem: HTMLLIElement, id: string) {
        menuItem.classList.add('g-list-item');
        this.appendChild(menuItem);
        menuItem.addEventListener('click', () => {
            this.querySelectorAll('[data-page-target]').forEach(x => {
                x.classList.toggle('selected', x === menuItem);
                x.toggleAttribute('disabled', x === menuItem);
            });
            this.pageList.forEach(x => x.classList.toggle('hidden', x.getAttribute('data-page-content') !== id));
        });
    }

    addMenuItem(label: string, id: string, index?: number) {
        const element = document.createElement('li');
        element.textContent = label;
        element.setAttribute('data-page-target', id);
        index = index ?? this.children.length;
        element.setAttribute('data-index', index.toFixed());
        this.appendMenuItem(element, id);
        return element;
    }

    removeMenuItem(item: HTMLElement) {
        this.pageList = this.pageList.filter(x => x.getAttribute('data-page-content') !== item.getAttribute('data-page-target'));
    }

    registerPageElement(pageElement: HTMLElement, id: string) {
        pageElement.classList.add('hidden');
        pageElement.setAttribute('data-page-content', id);
        this.pageList.push(pageElement);

        if (!this.querySelector('.selected')) {
            this.querySelector<HTMLLIElement>(`[data-page-target="${id}"]`)?.click();
        }
    }

    getMenuItemById(id: string) {
        return this.querySelector<HTMLElement>(`[data-page-target="${id}"]`);
    }

    sort() {
        const comparer = (a: HTMLElement, b: HTMLElement) => (a.getAttribute('data-index')?.localeCompare(b.getAttribute('data-index') || '', undefined, { numeric: true }) || 0);
        this.append(...[...this.querySelectorAll<HTMLLIElement>('li')].sort(comparer));
    }

    *generateTabMenuAnectors(from: Element | null, targetPageName = ''): Generator<[MenuItem, PageElement]> {
        if (!from) {
            return;
        }
        if (targetPageName.length > 0) {
            const menu = from.querySelector(`:scope > ${TabMenuElement.name}`);
            if (menu) {
                const menuItem = menu.querySelector(`[data-page-target="${targetPageName}"]`);
                if (menuItem) {
                    yield [menuItem, from];
                }
            }
        }
        if (from.hasAttribute('data-page-content')) {
            targetPageName = from.getAttribute('data-page-content') ?? targetPageName;
        }
        const next = from.parentElement ?? from.nextElementSibling;
        return yield* this.generateTabMenuAnectors(next, targetPageName);
    }
}
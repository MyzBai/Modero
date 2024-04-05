import { CustomElement } from './CustomElement';

type SortComparer = (a: HTMLElement, b: HTMLElement) => number;

export class TabMenuElement extends CustomElement {
    static readonly name = 'tab-menu-element';
    private pageList: HTMLElement[] = [];

    init() {
        this.setDirection('vertical');
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

    registerPageElement(pageElement: HTMLElement, id: string) {
        pageElement.classList.add('hidden');
        pageElement.setAttribute('data-page-content', id);
        this.pageList.push(pageElement);

        if (!this.querySelector('.selected')) {
            this.querySelector<HTMLLIElement>(`[data-page-target="${id}"]`)?.click();
        }
    }

    sort(compare: SortComparer) {
        this.append(...[...this.querySelectorAll<HTMLLIElement>('li')].sort(compare));
    }

    *generateTabMenuAncestorList(from: Element | null, targetPageName = ''): Generator<Element> {
        if (!from) {
            return;
        }
        let page = from?.hasAttribute('data-page-content') ? from : null;
        if (!page) {
            page = from?.closest('[data-page-content]');
            return yield* this.generateTabMenuAncestorList(page);
        }
        const menu = page?.querySelector(`:scope > ${TabMenuElement.name}`);
        if (!menu) {
            const pageName = page.getAttribute('data-page-content');
            page = page.parentElement?.closest('[data-page-content]') ?? null;
            return yield* this.generateTabMenuAncestorList(page, pageName ?? '');
        }
        if (!targetPageName) {
            return;
        }
        const menuItem = menu.querySelector(`[data-page-target="${targetPageName}"]`);
        if (menuItem) {
            yield menuItem;
        }
        targetPageName = page?.getAttribute('data-page-content') ?? '';
        page = page.parentElement?.closest('[data-page-content]') ?? null;
        yield* this.generateTabMenuAncestorList(page, targetPageName);
    }

    *generateMenuItemListFromPageNameList(from: Element | null, pageNameList: string[]) {
        for (const pageTargetName of pageNameList) {
            if (!from) {
                return;
            }
            const menu = from.querySelector(`:scope > ${TabMenuElement.name}`);
            if (!menu) {
                return;
            }
            const menuItem = menu.querySelector(`[data-page-target="${pageTargetName}"]`);
            if (!menuItem) {
                return;
            }
            yield menuItem;

            from = from.querySelector(`[data-page-content="${pageTargetName}"]`);
        }
    }
}
import { Zone } from 'src/game/combat/Zone';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameModule from 'src/game/gameModule/GameModule';

interface AscensionInstance {
    data: GameModule.AscensionInstance;
    name: string;
    element: HTMLElement;
}

export class Ascensions {
    readonly page: HTMLElement;
    readonly ascensionInstanceList: AscensionInstance[] = [];
    constructor() {

        this.page = document.createElement('div');
        this.page.classList.add('p-ascensions');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Ascension List</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-ascension-info" data-ascension-info></div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-ascension-list" data-ascension-list></ul>');
    }

    get lastInstance() {
        return this.ascensionInstanceList[this.ascensionInstanceList.length - 1];
    }

    addAscension(ascensionInstance: GameModule.AscensionInstance) {
        const element = document.createElement('li');
        element.classList.add('g-list-item');
        const name = `Ascension ${this.ascensionInstanceList.length + 1}`;
        element.textContent = name;
        element.addEventListener('click', () => {
            this.selectAscensionByName(name);
        });
        this.ascensionInstanceList.push({ data: ascensionInstance, name, element });
        this.page.querySelectorStrict('[data-ascension-list]').appendChild(element);

        if (!element.parentElement?.querySelector('li.selected')) {
            element.click();
        }

        Zone.GlobalAreaModList.push(...ascensionInstance.modList);
    }

    private selectAscensionByName(name: string) {
        const instance = this.ascensionInstanceList.findStrict(x => x.name === name);
        this.showAscensionInstance(instance);
        this.ascensionInstanceList.forEach(x => x.element.classList.toggle('selected', x === instance));
    }

    private showAscensionInstance(ascension: AscensionInstance) {
        const element = this.page.querySelectorStrict('[data-ascension-info]');
        element.replaceChildren();

        element.insertAdjacentHTML('beforeend', `<div class="g-title">${ascension.name}</div>`);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of ascension.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);
    }
}
import { CombatArea } from 'src/game/combat/CombatArea';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { game, player } from 'src/game/game';
import { areaModTemplateList } from 'src/game/mods/areaModTemplates';
import { playerModTemplateList } from 'src/game/mods/playerModTemplates';

interface AscensionInstance {
    data: GameConfig.AscensionInstance;
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
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-ascension-list g-scroll-list" data-ascension-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');
    }

    updateAscensionList() {
        this.ascensionInstanceList.clear();
        this.page.querySelectorStrict('[data-ascension-list]').replaceChildren();
        const maxCount = game.gameConfig.ascension.ascensionInstanceList?.length ?? 0;
        const count = Math.min(game.stats.ascensionCount.value, maxCount);
        for (let i = 0; i < count; i++) {
            this.addAscension();
        }
        this.applyModifiers();
    }

    private addAscension() {
        const ascensionInstanceData = game.gameConfig.ascension.ascensionInstanceList?.[this.ascensionInstanceList.length];
        if (!ascensionInstanceData) {
            return;
        }
        const element = document.createElement('li');
        element.classList.add('g-list-item');
        const name = `Ascension ${this.ascensionInstanceList.length + 1}`;
        element.textContent = name;
        element.addEventListener('click', () => {
            this.selectAscensionByName(name);
        });
        this.ascensionInstanceList.push({ data: ascensionInstanceData, name, element });
        this.page.querySelectorStrict('[data-ascension-list]').appendChild(element);

        if (!element.parentElement?.querySelector('li.selected')) {
            element.click();
        }
    }

    private applyModifiers() {
        const modifiers = Modifier.modListFromTexts(this.ascensionInstanceList.flatMap(x => x.data.modList));
        const areaModList = modifiers.filter(x => areaModTemplateList.some(y => y.id === x.template.id));
        CombatArea.addGlobalAreaModifiers('ascension', ...areaModList);
        const playerModList = modifiers.filter(x => playerModTemplateList.some(y => y.id === x.template.id));
        player.modDB.add('Ascension', Modifier.extractStatModifierList(...playerModList));
    }

    private selectAscensionByName(name: string) {
        const instance = this.ascensionInstanceList.findStrict(x => x.name === name);
        this.showAscensionInstance(instance);
        this.ascensionInstanceList.forEach(x => x.element.classList.toggle('selected', x === instance));
    }

    private showAscensionInstance(ascension: AscensionInstance) {
        const element = this.page.querySelectorStrict('[data-item-info]');
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
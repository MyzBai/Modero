import { CombatArea } from 'src/game/combat/CombatArea';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { game, player } from 'src/game/game';
import { areaModTemplateList } from 'src/game/mods/areaModTemplates';
import { playerModTemplateList } from 'src/game/mods/playerModTemplates';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { fadeIn, fadeOut } from './utils';
import { assertDefined } from '../../../shared/utils/assert';

interface AscensionInstance {
    data?: GameConfig.AscensionInstance;
    name: string;
    element: HTMLElement;
}

export class Ascensions {
    readonly page: HTMLElement;
    private readonly ascensionInstanceList: AscensionInstance[] = [];
    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-ascensions');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Ascension List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-ascension-list g-scroll-list" data-ascension-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-item-info" data-item-info></div>');
    }

    updateAscensionList() {
        this.ascensionInstanceList.clear();
        this.page.querySelectorStrict('[data-ascension-list]').replaceChildren();
        const maxCount = game.gameConfig.ascension.ascensionInstanceList?.length ?? 0;
        const count = Math.min(game.stats.ascensionMax.value, maxCount);
        for (let i = 0; i <= count; i++) {
            this.addAscensionElement(i);
        }
        this.initializeAscension();
    }

    async initializeAscension() {
        for (const [i, instance] of this.ascensionInstanceList.entries()) {
            instance.element.setAttribute('data-tag', i <= game.stats.ascension.value ? 'valid' : '');
        }
        this.applyModifiers();
    }

    private addAscensionElement(index: number) {
        const ascensionData = game.gameConfig.ascension.ascensionInstanceList?.[index - 1];
        const element = document.createElement('li');
        element.classList.add('g-list-item');
        const name = `Ascension ${index}`;
        element.textContent = name;
        element.addEventListener('click', () => {
            this.selectAscensionByIndex(index);
        });
        this.ascensionInstanceList.push({ data: ascensionData, name, element });
        this.page.querySelectorStrict('[data-ascension-list]').appendChild(element);

        if (!element.parentElement?.querySelector('li.selected')) {
            element.click();
        }
    }

    private applyModifiers() {
        const modList = this.ascensionInstanceList.slice(0, game.stats.ascension.value + 1).flatMap(x => x.data?.modList ?? []);
        const modifiers = Modifier.modListFromTexts(modList);
        const areaModList = modifiers.filter(x => areaModTemplateList.some(y => y.id === x.template.id));
        CombatArea.addGlobalAreaModifiers('ascension', ...areaModList);
        const playerModList = modifiers.filter(x => playerModTemplateList.some(y => y.id === x.template.id));
        player.modDB.replace('Ascension', Modifier.extractStatModifierList(...playerModList));
    }

    private selectAscensionByIndex(index: number) {
        const instance = this.ascensionInstanceList[index];
        assertDefined(instance);
        this.showAscensionInstance(instance);
        this.ascensionInstanceList.forEach(x => x.element.classList.toggle('selected', x === instance));
    }

    private showAscensionInstance(ascensionInstance: AscensionInstance) {
        const element = this.page.querySelectorStrict('[data-item-info]');
        element.replaceChildren();

        element.insertAdjacentHTML('beforeend', `<div class="g-title">${ascensionInstance.name}</div>`);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of ascensionInstance.data?.modList ?? []) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        button.textContent = 'Start';
        button.toggleAttribute('disabled', game.stats.ascension.value === this.ascensionInstanceList.indexOf(ascensionInstance));
        button.addEventListener('click', async () => {
            const modal = createCustomElement(ModalElement);
            modal.setTitle('Begin Ascension');
            modal.setBodyText('This will reset your current ascension. Are you sure?');
            const id = await modal.setButtons([
                { text: 'Yes', type: 'confirm', waitId: 'yes' },
                { text: 'No', type: 'cancel' }
            ]);
            if (id === 'yes') {
                await fadeOut();
                const index = this.ascensionInstanceList.indexOf(ascensionInstance);
                game.stats.ascension.set(index);
                game.softReset();
                this.initializeAscension();
                await fadeIn();
            }
        });
        element.appendChild(button);
    }
}
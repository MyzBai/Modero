import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Component } from '../Component';
import { createAssignableObject, createObjectInfoElements, createObjectListElement, type AssignableObject } from 'src/game/utils/objectUtils';
import { player, statistics } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { createModListElement } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { evalCost } from '../../utils/utils';

export interface GuildClass extends AssignableObject {
    data: GameConfig.GuildClass;
    element: HTMLElement;
    unlocked: boolean;
}
export interface Guild {
    data: GameConfig.Guild;
    element: HTMLElement;
}

export class GuildHall extends Component {
    private readonly guildClassList: GuildClass[];
    private activeGuildClass: GuildClass | null = null;
    private readonly level = new Value(1);
    constructor(private readonly data: GameConfig.GuildHall) {
        super('guildHall');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Guild Hall';
        if (data.levelList) {
            titleElement.innerHTML = `<span class="g-clickable-text">Guild Hall Lv.<var data-level>1</var></span>`;
            titleElement.addEventListener('click', this.openGuildHallLevelModal.bind(this));
            this.updateGuildHallLevel();
        }
        this.page.appendChild(titleElement);

        const toolbar = document.createElement('div');
        toolbar.classList.add('g-toolbar', 's-toolbar');
        const resetClassElement = document.createElement('div');
        resetClassElement.insertAdjacentHTML('beforeend', '<span class="g-clickable-text">Reset</span>');
        resetClassElement.addEventListener('click', this.resetClass.bind(this));
        toolbar.appendChild(resetClassElement);
        this.page.appendChild(toolbar);

        this.page.insertAdjacentHTML('beforeend', '<ul class="g-scroll-list-v guild-class-list" data-guild-class-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-guild-class-info></div>');

        this.guildClassList = [];
        const fragment = document.createDocumentFragment();
        for (const guild of this.data.guildList) {
            const element = document.createElement('div');
            element.classList.add('g-title');
            element.insertAdjacentHTML('beforeend', `<span class="g-clickable-text">${guild.name}</span>`);
            element.addEventListener('click', () => {
                const modal = createCustomElement(ModalElement);
                modal.setTitle(`${guild.name} Guild`);
                const modList = this.data.guildList.findStrict(x => x.name === guild.name).modList;
                const modListElement = createModListElement(modList);
                modal.addBodyElement(modListElement);
            });
            fragment.appendChild(element);
            for (const guildClass of this.data.guildClassList.filter(x => x.guildName === guild.name)) {
                const element = createObjectListElement(guildClass);
                element.classList.remove('hidden');
                element.addEventListener('click', this.selectGuildClassByName.bind(this, guildClass.name));
                const data: GuildClass = { data: guildClass, ...createAssignableObject(guildClass), unlocked: true, element };
                this.guildClassList.push(data);
                fragment.appendChild(element);
            }
        }
        this.page.querySelectorStrict('[data-guild-class-list]').append(fragment);

        player.stats.activity.texts = ['None'];
        player.stats.guildClass.texts = ['None'];

        this.guildClassList.find(x => x.unlocked)?.element.click();
        this.page.querySelector<HTMLElement>('[data-class-list] li')?.click();

        this.level.addListener('change', this.updateGuildHallLevel.bind(this));
    }

    get selectedGuildClass() {
        return this.guildClassList.find(x => x.selected);
    }

    private openGuildHallLevelModal() {
        const modal = createCustomElement(ModalElement);
        modal.setTitle(`Guild Hall Lv.${this.level.value.toFixed()}`);
        const body = document.createElement('div');
        const upgradeButton = document.createElement('button');
        upgradeButton.textContent = 'Upgrade';
        const cost = this.data.levelList?.[this.level.value - 1]?.upgradeCost;
        if (cost) {
            upgradeButton.toggleAttribute('disabled', evalCost(cost));
            upgradeButton.textContent += `\n${cost.value.toFixed()}${cost.name}`;
        }
        upgradeButton.addEventListener('click', () => {
            this.level.add(1);
            this.openGuildHallLevelModal();
        });
        body.appendChild(upgradeButton);
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        const modListElement = createModListElement(modList);
        body.appendChild(modListElement);
        modal.addBodyElement(body);
    }

    private updateGuildHallLevel() {
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList));
        player.modDB.replace('GuildHall', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private selectGuildClassByName(name: string) {
        const guildClass = this.guildClassList.findStrict(x => x.data.name === name);
        if (this.selectedGuildClass) {
            this.selectedGuildClass.selected = false;
        }
        guildClass.selected = true;
        this.guildClassList.forEach(x => x.element.classList.toggle('selected', x === guildClass));
        this.showClassInfo(guildClass);
    }

    private showClassInfo(guildClass: GuildClass) {
        const element = this.page.querySelector('[data-guild-class-info]');
        element?.replaceChildren();
        if (!guildClass) {
            return;
        }
        const elements = createObjectInfoElements({
            obj: { name: guildClass.name },
            modList: guildClass.data.modList
        });
        elements.element.classList.add('guild-class-info');
        elements.element.setAttribute('data-guild-class-info', '');
        element?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            button.textContent = 'Assign';
            button.setAttribute('data-tag', 'valid');
        };
        updateButton();
        button.toggleAttribute('disabled', !guildClass.unlocked || player.stats.guildClass.value !== 0);
        button.addEventListener('click', () => {
            this.assignClass(guildClass);
            updateButton();
        });
        elements.contentElement.appendChild(button);
    }

    private resetClass() {
        this.assignClass(null);
    }

    private assignClass(guildClass: GuildClass | null) {
        this.activeGuildClass = guildClass;
        if (guildClass) {
            player.stats.guildClass.setText(guildClass.name);
            player.modDB.replace('GuildClass', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.data.modList)));
            const guild = this.data.guildList.findStrict(x => x.name === guildClass.data.guildName);
            player.modDB.replace('Guild', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guild.modList)));
        } else {
            player.stats.guildClass.setDefault();
            player.modDB.removeBySource('Guild');
            player.modDB.removeBySource('GuildClass');
            if (this.selectedGuildClass) {
                this.selectGuildClassByName(this.selectedGuildClass.name);
            }
        }
        if (this.activeGuildClass) {
            this.selectGuildClassByName(this.activeGuildClass.name);
        }

        this.page.querySelectorAll('[data-guild-class-list] [data-id]').forEach(x => x.classList.toggle('m-text-green', x.getAttribute('data-id') === guildClass?.id));
        statistics.updateStats('Player');
    }

    serialize(save: Serialization) {
        save.guildHall = {
            level: this.level.value,
            classId: this.activeGuildClass?.data.id,
        };
    }

    deserialize({ guildHall: save }: UnsafeSerialization) {
        if (this.data.levelList && save?.level) {
            this.level.set(save?.level);
        }
        const guildClass = this.guildClassList.find(x => x.data.id === save?.classId);
        if (guildClass) {
            this.assignClass(guildClass);
            this.selectGuildClassByName(guildClass.name);
        }
    }
}
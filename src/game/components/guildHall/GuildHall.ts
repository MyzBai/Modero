import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Component } from '../Component';
import { createAssignableObject, createObjectInfoElements, createObjectListElement, type AssignableObject } from 'src/game/utils/objectUtils';
import { player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { createHelpIcon } from '../../../shared/utils/dom';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { createModListElement } from '../../utils/dom';
import { LevelElement } from '../../../shared/customElements/LevelElement';
import { PlayerUpdateStatsFlag } from '../../Player';

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
    private activeGuildClass?: GuildClass;
    private readonly levelElement?: LevelElement;
    constructor(private readonly data: GameConfig.GuildHall) {
        super('guildHall');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Class List</div>');

        if (data.levelList) {
            this.levelElement = createCustomElement(LevelElement);
            this.levelElement.setAction('Training');
            this.levelElement.setLevelClickCallback(this.showGuildHallOverview.bind(this));
            this.levelElement.onLevelChange.listen(this.updateGuildHallLevel.bind(this));
            this.page.appendChild(this.levelElement);
            this.updateGuildHallLevel();
        }

        this.page.insertAdjacentHTML('beforeend', '<ul class="g-scroll-list-v guild-class-list" data-guild-class-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-guild-class-info></div>');

        const guildHelp = createHelpIcon('', () => `
            [Rest]
            You can click the rest button to stop combat. Guild hall will receieve exp while resting.
            [Class]
            You can assign a class. Choose wisely...
            [Guild]
            Each class is associated with a guild. You can click on the guild's title to see their bonus.

            Class and guild modifiers can be improved by increasing the level of the guild hall.
        `.trim());
        this.page.appendChild(guildHelp);

        this.guildClassList = [];
        const fragment = document.createDocumentFragment();
        for (const guild of this.data.guildList) {
            const element = document.createElement('div');
            element.classList.add('g-title', 's-guild-title');
            element.textContent = guild.name;
            element.addEventListener('click', () => {
                const modal = createCustomElement(ModalElement);
                modal.setTitle(`${guild.name} Guild`);
                const modListElement = createModListElement(this.getGuildModList(guild.name));
                modal.setBodyElement(modListElement);
            })
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
    }

    get level() {
        return this.levelElement?.level ?? 1;
    }

    get selectedGuildClass() {
        return this.guildClassList.find(x => x.selected);
    }

    get isTraining() {
        return player.stats.activity.getText() === 'Training';
    }

    private updateGuildHallLevel() {
        if (!this.data.levelList) {
            return;
        }
        if (!this.levelElement) {
            return;
        }
        this.levelElement.maxExp = this.data.levelList[this.level - 1]?.exp ?? Infinity;
        if (!this.activeGuildClass) {
            return;
        }
        const modList = Modifier.modListFromTexts(this.getGuildClassModList(this.activeGuildClass.name));
        player.modDB.replace('GuildClass', Modifier.extractStatModifierList(...modList));
        const guildName = this.activeGuildClass?.data.guildName;
        if (guildName) {
            const modList = Modifier.modListFromTexts(this.getGuildModList(guildName));
            player.modDB.replace('GuildClassAscension', Modifier.extractStatModifierList(...modList));
        }
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private getGuildClassModList(name: string) {
        const guildClass = this.data.guildClassList.findStrict(x => x.name === name);
        const index = Math.min(this.level - 1, guildClass.modList.length - 1);
        return guildClass.modList[index]!;
    }

    private getGuildModList(name: string) {
        const guild = this.data.guildList.findStrict(x => x.name === name);
        const index = Math.min(this.level - 1, guild.modList.length - 1);
        return guild.modList[index]!;
    }

    private selectGuildClassByName(name: string) {
        const guildClass = this.guildClassList.findStrict(x => x.data.name === name);
        this.guildClassList.forEach(x => x.element.classList.toggle('selected', x === guildClass));
        this.showClassInfo(guildClass);
    }

    private showGuildHallOverview() {
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Guild Hall Overview');
        const element = document.createElement('div');
        if (this.activeGuildClass) {
            {
                const fieldset = document.createElement('fieldset');
                fieldset.insertAdjacentHTML('beforeend', `<legend>Guild Modifiers [${this.activeGuildClass.data.guildName}]</legend>`);
                fieldset.appendChild(createModListElement(this.getGuildModList(this.activeGuildClass.data.guildName)));
                element.appendChild(fieldset);
            }
            {
                const fieldset = document.createElement('fieldset');
                fieldset.insertAdjacentHTML('beforeend', `<legend>Class Modifiers [${this.activeGuildClass.name}]</legend>`);
                fieldset.appendChild(createModListElement(this.getGuildClassModList(this.activeGuildClass.name)));
                element.appendChild(fieldset);
            }
        }
        if (element.childElementCount === 0) {
            modal.setBodyText('Nothing to view yet.');
            return;
        }
        modal.setBodyElement(element);
    }

    private showClassInfo(guildClass: GuildClass) {
        const element = this.page.querySelector('[data-guild-class-info]');
        element?.replaceChildren();
        if (!guildClass) {
            return;
        }
        const modList = guildClass.data.modList[this.level - 1];
        const elements = createObjectInfoElements({
            obj: { name: guildClass.name },
            modList
        });
        elements.element.classList.add('guild-class-info');
        elements.element.setAttribute('data-guild-class-info', '');
        element?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);

        const button = document.createElement('button');
        const updateLabel = () => {
            button.textContent = 'Assign';
            button.setAttribute('data-tag', 'valid');
            if (player.stats.guildClass.getText() === guildClass.name) {
                button.textContent = 'Unassign';
                button.setAttribute('data-tag', 'invalid');
            }
        };
        updateLabel();
        button.toggleAttribute('disabled', !guildClass.unlocked);
        button.addEventListener('click', () => {
            this.assignClass(guildClass);
            updateLabel();
        });
        elements.contentElement.appendChild(button);
    }

    private assignClass(guildClass: GuildClass) {
        this.activeGuildClass = guildClass;
        player.stats.guildClass.setText(guildClass.name);
        player.modDB.replace('GuildClass', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.data.modList[this.level - 1] ?? [])));

        this.page.querySelectorAll('[data-guild-class-list] [data-id]').forEach(x => x.classList.toggle('m-text-green', x.getAttribute('data-id') === guildClass.id));

        const guild = this.data.guildList.findStrict(x => x.name === guildClass.data.guildName);
        const modList = guild.modList[this.level - 1] ?? [];
        player.modDB.replace('Guild', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    }

    serialize(save: Serialization) {
        save.guildHall = {
            classId: this.activeGuildClass?.data.id,
            training: this.isTraining,
            level: this.level,
            exp: this.levelElement?.curExp,
        }
    }

    deserialize({ guildHall: save }: UnsafeSerialization) {
        if (this.levelElement) {
            this.levelElement.setLevel(save?.level ?? 1);
            this.levelElement.curExp = save?.exp ?? 0;
            this.levelElement.updateProgressBar();
            this.updateGuildHallLevel();
            if (save?.training) {
                this.levelElement.startAction();
            }
        }
        const guildClass = this.guildClassList.find(x => x.data.id === save?.classId);
        if (guildClass) {
            this.assignClass(guildClass);
            this.selectGuildClassByName(guildClass.name);
        }

        this.selectGuildClassByName(this.data.guildClassList[0]?.name!);
    }
}
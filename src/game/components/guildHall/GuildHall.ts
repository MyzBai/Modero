import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Component } from '../Component';
import { createItem, createItemInfoElements, createItemListElement, type Item } from 'src/game/utils/itemUtils';
import { ascension, game, player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { createHelpIcon } from '../../../shared/utils/dom';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { createModListElement } from '../../utils/dom';
import { combineModifiers } from '../../mods/utils';
import { LevelElement } from '../../../shared/customElements/LevelElement';

export interface GuildClass extends Item {
    data: GameConfig.GuildClass;
    element: HTMLElement;
    ascensionCount: number;
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
            this.levelElement.onLevelChange.listen(this.updateLevel.bind(this));
            this.page.appendChild(this.levelElement);
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
                const element = createItemListElement(guildClass);
                element.classList.remove('hidden');
                element.addEventListener('click', this.selectGuildClassByName.bind(this, guildClass.name));
                const data: GuildClass = { data: guildClass, ...createItem(guildClass), ascensionCount: 0, unlocked: true, element };
                this.guildClassList.push(data);
                fragment.appendChild(element);
            }
        }
        this.page.querySelectorStrict('[data-guild-class-list]').append(fragment);

        player.stats.activity.texts = ['None'];
        player.stats.guildClass.texts = ['None'];

        this.guildClassList.find(x => x.unlocked)?.element.click();
        this.page.querySelector<HTMLElement>('[data-class-list] li')?.click();

        ascension.ascendEvent.listen(listElements => {
            if (!this.activeGuildClass) {
                return;
            }
            this.activeGuildClass.ascensionCount += 1;
            const element = document.createElement('div');
            const text = `${this.activeGuildClass.name} has reached ascension ${game.stats.ascension.value} and now provides global modifiers`;
            const modList = this.getAscensionModList(this.activeGuildClass.name) ?? [];
            const modListElement = createModListElement(modList);
            element.insertAdjacentHTML('beforeend', `<span>${text}</span>`);
            element.appendChild(modListElement);
            listElements.push(element);
        });

        this.updateLevel();
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

    private updateLevel() {
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

    private getAscensionModList(guildClassName: string) {
        return this.data.guildClassList.findStrict(x => x.name === guildClassName).ascensionModList[game.stats.ascension.value - 1];
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
        if (game.stats.ascensionMax.value > 0) {
            const fieldset = document.createElement('fieldset');
            fieldset.insertAdjacentHTML('beforeend', '<legend>Global Ascension Modifiers</legend>');
            const modTextList = this.guildClassList.filter(x => x.ascensionCount > 0).flatMap(x => x.data.ascensionModList[x.ascensionCount - 1] ?? []).flatMap(x => x);
            const modList = combineModifiers(Modifier.modListFromTexts(modTextList));
            fieldset.appendChild(createModListElement(modList));
            element.appendChild(fieldset);
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
        const elements = createItemInfoElements({
            item: { name: guildClass.name },
            propertyList: guildClass.ascensionCount > 0 ? [['Ascensions', guildClass.ascensionCount.toFixed()]] : [],
            modList
        });
        elements.element.classList.add('guild-class-info');
        elements.element.setAttribute('data-guild-class-info', '');
        element?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);

        const button = document.createElement('button');
        button.textContent = 'Assign';
        button.toggleAttribute('disabled', !!this.activeGuildClass || !guildClass.unlocked);
        button.addEventListener('click', () => {
            this.assignClass(guildClass);
            button.setAttribute('disabled', '');
        });
        elements.contentElement.appendChild(button);

        if (!guildClass.unlocked) {
            elements.contentElement.insertAdjacentHTML('beforeend', '<span data-tag="invalid" style="text-align: center;">You have not completed previous ascension with this class</span>');
        } else if (game.stats.ascension.value < guildClass.ascensionCount) {
            elements.contentElement.insertAdjacentHTML('beforeend', '<span class="m-text-yellow" style="text-align: center;">This class has already completed this ascension</span>');
        }
    }

    private assignClass(guildClass: GuildClass) {
        this.activeGuildClass = guildClass;
        player.stats.guildClass.setText(guildClass.name);
        player.modDB.replace('GuildClass', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.data.modList[this.level - 1] ?? [])));
        this.page.querySelectorStrict(`[data-guild-class-list] [data-id="${guildClass.id}"]`).setAttribute('data-tag', 'valid');

        const guild = this.data.guildList.findStrict(x => x.name === guildClass.data.guildName);
        const modList = guild.modList[this.level - 1] ?? [];
        player.modDB.replace('Guild', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));

        player.modDB.replace('GuildClassGlobal', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.data.ascensionModList[game.stats.ascension.value - 1] ?? [])));
    }

    serialize(save: Serialization) {
        save.guildHall = {
            classId: this.activeGuildClass?.data.id,
            training: this.isTraining,
            level: this.level,
            exp: this.levelElement?.curExp,
            guildClassList: this.guildClassList.filter(x => x.ascensionCount > 0).map(x => ({ classId: x.data.id, ascensionCount: x.ascensionCount }))
        }
    }

    deserialize({ guildHall: save }: UnsafeSerialization) {
        if (this.levelElement) {
            this.levelElement.setLevel(save?.level ?? 1);
            this.levelElement.curExp = save?.exp ?? 0;
            this.levelElement.updateProgressBar();
            this.updateLevel();
            if (save?.training) {
                this.levelElement.startAction();
            }
        }
        const guildClass = this.guildClassList.find(x => x.data.id === save?.classId);
        if (guildClass) {
            this.assignClass(guildClass);
            this.selectGuildClassByName(guildClass.name);
        }
        for (const serializedGuildClass of save?.guildClassList ?? []) {
            const guildClass = this.guildClassList.find(x => x.data.id === serializedGuildClass?.classId);
            if (!guildClass) {
                continue;
            }
            guildClass.ascensionCount = serializedGuildClass?.ascensionCount ?? 0;
        }
        for (const guildClass of this.guildClassList) {
            guildClass.unlocked = guildClass.ascensionCount >= game.stats.ascension.value;
        }
        this.selectGuildClassByName(this.data.guildClassList[0]?.name!);
    }
}
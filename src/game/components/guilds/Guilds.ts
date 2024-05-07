import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { Component } from '../Component';
import { createItem, createItemInfoElements, createItemListElement, type Item } from 'src/game/utils/itemUtils';
import { player } from 'src/game/game';
import { assertNonNullable } from 'src/shared/utils/assert';
import { Modifier } from 'src/game/mods/Modifier';
import { startActivity, stopActivity } from './activities';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';

type GuildClassData = GameConfig.GuildClasses['classList'][number];
export interface Guild extends Item {
    data: GameConfig.Guild;
    exp: number;
    maxExp: number;
    level: number;
    element: HTMLElement;
}

export class Guilds extends Component {

    private readonly guildList: Guild[];
    private guild?: Guild | null;
    private guildClass?: GuildClassData | null;
    private selectedClass?: GuildClassData | null;
    private activity?: GameConfig.GuildActivityName | null;

    constructor(private readonly data: GameConfig.Guilds) {
        super('guilds');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-toolbar"><span>Tokens: <var data-token-counter></var></span></div>')
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Guild List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="g-scroll-list-v guild-list" data-guild-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Class List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="g-scroll-list-v class-list" data-class-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info data-guild-info></div>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info data-class-info></div>');

        this.guildList = this.data.guildList.map(data => {
            const element = createItemListElement(data);
            element.addEventListener('click', this.selectGuildByName.bind(this, data.name));
            return { data, ...createItem(data), maxExp: data.levels[0]?.exp ?? 0, exp: 0, level: 1, element };
        });
        this.page.querySelectorStrict('[data-guild-list]').append(...this.guildList.map(x => x.element));
        this.guildList.filter(x => !x.probability).forEach(x => this.unlockGuild(x));

        player.stats.activity.setText('None');
        player.stats.guildClass.setText('None');

        this.guildList.find(x => x.unlocked)?.element.click();
        this.page.querySelector<HTMLElement>('[data-class-list] li')?.click();
    }

    private selectGuildByName(name: string) {
        const guild = this.guildList.findStrict(x => x.data.name === name);
        this.guildList.forEach(x => x.element.classList.toggle('selected', x === guild));
        this.showGuildInfo(guild);
    }

    private showGuildInfo(guild: Guild) {
        const element = this.page.querySelector('[data-guild-info]');
        element?.replaceChildren();
        if (!guild) {
            return;
        }
        const modList = guild.data.levels[guild.level - 1]?.modList;
        const elements = createItemInfoElements({ item: { name: guild.data.name, exp: guild.exp, maxExp: guild.maxExp }, modList });
        elements.element.setAttribute('data-guild-info', '');
        element?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);

        const activitiesElement = document.createElement('div');
        activitiesElement.classList.add('s-activites');
        for (const activity of guild.data.activityList) {
            const toggle = document.createElement('button');
            toggle.classList.add('g-toggle-button');
            toggle.setAttribute('data-activity-button', activity.name);
            toggle.textContent = activity.name;
            toggle.addEventListener('click', () => {
                const active = player.stats.activity.getText() !== activity.name;
                stopActivity();
                this.activity = null;
                if (active) {
                    startActivity(guild, activity);
                    this.activity = activity.name;
                }
                this.updateGuildInfo(guild);
            });
            activitiesElement.appendChild(toggle);
        }
        elements.contentElement.appendChild(activitiesElement);

        const button = document.createElement('button');
        button.setAttribute('data-join-button', '');
        button.addEventListener('click', () => {
            if (this.guild && this.guild === guild) {
                this.leaveGuild();
            } else {
                this.joinGuild(guild);
            }
            this.updateGuildInfo(guild);
            if (this.selectedClass) {
                this.updateGuildClassInfo(this.selectedClass);
            }
        });
        elements.contentElement.appendChild(button);
        this.updateGuildInfo(guild);

        this.updateClassListElement(guild);
    }

    private updateGuildInfo(guild: Guild) {
        const infoElement = this.page.querySelector('[data-guild-info]');
        if (!infoElement) {
            return;
        }

        infoElement.querySelectorAll('[data-activity-button]').forEach(x => x.toggleAttribute('disabled', guild !== this.guild));
        infoElement.querySelectorAll('[data-activity-button]').forEach(x => x.classList.toggle('active', player.stats.activity.getText() === x.getAttribute('data-activity-button')));

        const button = infoElement?.querySelector('[data-join-button]');
        if (!button) {
            return;
        }
        button.textContent = guild === this.guild ? 'Leave' : 'Join';
        button.toggleAttribute('disabled', !!this.guild && this.guild !== guild);
    }

    private showClassInfo(guildClass: GuildClassData) {
        const element = this.page.querySelector('[data-class-info]');
        element?.replaceChildren();
        if (!guildClass) {
            return;
        }
        const modList = guildClass.modList;
        const elements = createItemInfoElements({ item: { name: guildClass.name }, modList });
        elements.element.setAttribute('data-class-info', '');
        element?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);

        const button = document.createElement('button');
        button.addEventListener('click', () => {
            if (this.guildClass === guildClass) {
                this.unassignClass();
            } else {
                this.assignClass(guildClass);
            }
            this.updateGuildClassInfo(guildClass);
        });
        elements.contentElement.appendChild(button);
        this.updateGuildClassInfo(guildClass);
    }

    private updateGuildClassInfo(guildClass: GuildClassData) {
        const button = this.page.querySelector('[data-class-info] button');
        if (!button) {
            return;
        }
        button.textContent = guildClass === this.guildClass ? 'Unassign' : 'Assign';
        const conditions = [!this.guild?.data.classes.classList.includes(guildClass), this.guild?.data.classes.classList.filter(x => x !== guildClass).some(x => x === this.guildClass)];
        const disabled = conditions.some(x => x);
        button.toggleAttribute('disabled', disabled);
    }

    private unlockGuild(guild: Guild) {
        guild.unlocked = true;
        guild.element.textContent = guild.name;
        guild.element.removeAttribute('disabled');
        guild.element.classList.remove('hidden');
    }

    private joinGuild(guild: Guild) {
        this.guild = guild;
        const modList = guild.data.levels[guild.level - 1]?.modList ?? [];
        player.modDB.replace('Guild', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    }

    private leaveGuild() {
        if (this.guildClass) {
            this.unassignClass();
        }
        assertNonNullable(this.guild);
        stopActivity();
        this.guild = null;
        player.modDB.removeBySource('Guild');
    }

    private assignClass(guildClass: GuildClassData) {
        this.guildClass = guildClass;
        player.stats.guildClass.setText(guildClass.name);
        player.modDB.replace('GuildClass', Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.modList)));
        this.page.querySelectorStrict(`[data-class-list] [data-id="${guildClass.id}"]`).setAttribute('data-tag', 'valid');
    }

    private unassignClass() {
        assertNonNullable(this.guild);
        assertNonNullable(this.guildClass);
        this.page.querySelectorStrict(`[data-class-list] [data-id="${this.guildClass.id}"]`).removeAttribute('data-tag');
        this.guildClass = null;
        player.stats.guildClass.setDefault();
        player.modDB.removeBySource('GuildClass');
    }

    private updateClassListElement(guild: Guild) {
        const classListElement = this.page.querySelectorStrict('[data-class-list]');
        classListElement.replaceChildren();
        for (const guildClass of guild.data.classes.classList) {
            const element = createItemListElement(guildClass);
            if (guildClass.id === this.guildClass?.id) {
                element.setAttribute('data-tag', 'valid');
            }
            element.addEventListener('click', () => {
                classListElement.querySelectorAll('li').forEach(x => x.classList.toggle('selected', x === element));
                this.selectedClass = guildClass;
                this.showClassInfo(guildClass);
            });
            classListElement.appendChild(element);
        }
        classListElement.querySelector<HTMLElement>('li')?.click();
    }

    serialize(save: Serialization) {
        save.guilds = {
            guildId: this.guild?.id,
            classId: this.guildClass?.id,
            activity: this.activity,
        }
    }

    deserialize({ guilds: save }: UnsafeSerialization) {
        const guild = this.guildList.find(x => x.data.id === save?.guildId);
        if (guild) {
            this.joinGuild(guild);

            this.activity = save?.activity;
            const activity = guild.data.activityList.find(x => x.name === save?.activity);
            if (activity) {
                this.activity = activity.name;
                startActivity(guild, activity);
            }

            guild.element.click();
            const guildClass = guild.data.classes.classList.find(x => x.id === save?.classId);
            if (guildClass) {
                this.assignClass(guildClass);
                this.page.querySelector<HTMLElement>(`[data-class-list] [data-id="${guildClass.id}"]`)?.click();
            }
        }
    }
}
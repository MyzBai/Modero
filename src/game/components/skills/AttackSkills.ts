import { combat, notifications, player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameModule from 'src/game/gameModule/GameModule';
import { calcItemProbability } from 'src/shared/utils/helpers';
import type * as GameSerialization from 'src/game/serialization/serialization';
import { assertDefined } from 'src/shared/utils/assert';
import { textContainsRankNumerals } from 'src/shared/utils/textParsing';
import type { StatModifier } from 'src/game/mods/ModDB';

interface Skill {
    name: string;
    data: GameModule.AttackSkill;
    pickProbability: number;
    element: HTMLElement;
    unlocked: boolean;
}

export class AttackSkills {
    readonly page: HTMLElement;
    private _activeSkill: Skill;
    private selectedSkill: Skill;
    readonly skillList: Skill[];
    constructor(data: Required<GameModule.Skills>['attackSkills']) {
        this.page = document.createElement('div');
        this.page.classList.add('p-attack-skills');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-skill-info" data-skill-info></div>');

        this.skillList = data.attackSkillList.map(data => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', data.id);
            element.toggleAttribute('disabled');
            element.textContent = '?????';
            element.addEventListener('click', () => this.selectSkillByName(data.name));
            return { name: data.name, data, pickProbability: data.pickProbability, unlocked: data.pickProbability === 0, element };
        });
        this.skillList.forEach(x => x.element.classList.toggle('hidden', textContainsRankNumerals(x.name)));
        this.page.querySelectorStrict('[data-skill-list]').append(...this.skillList.map(x => x.element));
        this.skillList.filter(x => x.data.pickProbability === 0).forEach(x => {
            this.unlockSkill(x);
        });

        const firstSkill = this.skillList.findStrict(x => x.pickProbability === 0);
        assertDefined(firstSkill, 'no attack skill available, at least 1 attack skill must have a pickProbability of 0');
        this._activeSkill = firstSkill;
        this.assignSkill(this._activeSkill);

        this.selectedSkill = this._activeSkill;
        this.selectSkillByName(this._activeSkill.data.name);

        combat.enemyDeathEvent.listen((_, instance) => {
            this.processSkillUnlock();
            if (this.skillList.every(x => x.unlocked)) {
                instance.removeListener();
            }
        });
    }

    get activeSkill() {
        return this._activeSkill;
    }

    get canAssignSkill() {
        return this.selectedSkill !== this._activeSkill;
    }

    private assignSkill(skill: Skill) {
        this._activeSkill.element.removeAttribute('data-tag');
        this._activeSkill = skill;

        const statModList: StatModifier[] = [
            ...Modifier.extractStatModifierList(...Modifier.modsFromTexts(skill.data.modList)),
            { name: 'AttackSpeed', valueType: 'Base', value: skill.data.attackSpeed, override: true },
            { name: 'AttackManaCost', value: skill.data.manaCost, valueType: 'Base' }
        ];
        player.stats.attackEffectiveness.set(skill.data.attackEffectiveness);
        player.modDB.replace('AttackSkill', statModList);

        skill.element.setAttribute('data-tag', 'valid');
    }

    private selectSkillByName(name: string) {
        const skill = this.skillList.findStrict(x => x.data.name === name);
        this.selectedSkill = skill;
        this.showSkill(skill);
        this.skillList.forEach(x => x.element.classList.toggle('selected', x === skill));
    }

    private showSkill(skill: Skill) {
        const element = this.page.querySelectorStrict('[data-skill-info]');
        element.replaceChildren();
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${skill.data.name}</div>`);

        const propertyListElement = document.createElement('ul');
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Attack Speed</div><div>${skill.data.attackSpeed.toFixed(2)}</div></li>`);
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Attack Effectiveness</div><div>${skill.data.attackEffectiveness.toFixed()}%</div></li>`);
        propertyListElement.insertAdjacentHTML('beforeend', `<li class="g-field"><div>Mana Cost</div><div>${skill.data.manaCost.toFixed()}</div></li>`);
        element.appendChild(propertyListElement);

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        for (const mod of skill.data.modList) {
            modListElement.insertAdjacentHTML('beforeend', `<li>${Modifier.toDescription(mod)}</li>`);
        }
        element.appendChild(modListElement);

        const button = document.createElement('button');
        button.textContent = 'Assign';
        const updateButton = () => {
            button.toggleAttribute('disabled', skill === this._activeSkill);
        };
        button.addEventListener('click', () => {
            this.assignSkill(skill);
            updateButton();
        });
        updateButton();
        element.appendChild(button);
    }

    private processSkillUnlock() {
        const skill = calcItemProbability(this.skillList);
        if (!skill) {
            return;
        }
        this.unlockSkill(skill);

        notifications.addNotification({
            title: `New Attack Skill: ${skill.name}`,
            description: 'wow, a new attack skill. That\'s amazing!',
            addHighlight: true,
            elementId: skill.data.id,
        });
        // game.addElementHighlight(skill.element);
    }

    private unlockSkill(skill: Skill) {
        skill.unlocked = true;
        skill.element.textContent = skill.data.name;
        skill.element.removeAttribute('disabled');
        skill.element.classList.remove('hidden');
    }

    serialize(): GameSerialization.Skills['attackSkills'] {
        return { skillName: this._activeSkill.data.name, skillNameList: this.skillList.filter(x => x.unlocked).map(x => x.data.name) };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['attackSkills']>) {
        const activeSkill = this.skillList.find(x => x.data.name === save?.skillName);
        if (activeSkill) {
            this.assignSkill(activeSkill);
            this.selectSkillByName(activeSkill.data.name);
        }

        const skillList = this.skillList.filter(x => save?.skillNameList?.includes(x.data.name));
        for (const skill of skillList) {
            this.unlockSkill(skill);
        }
    }
}

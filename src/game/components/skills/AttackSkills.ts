import { combat, notifications, player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type * as GameSerialization from 'src/game/serialization';
import { assertDefined } from 'src/shared/utils/assert';
import type { StatModifier } from 'src/game/mods/ModDB';
import { isDefined, pickOneFromPickProbability } from 'src/shared/utils/utils';
import { createItemCandidates, createItem, createItemListElement, getNextRankItem, type Item, createItemInfoElements } from 'src/game/utils/itemUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';

interface Skill extends Item {
    name: string;
    data: GameConfig.AttackSkill;
    exp: number;
    maxExp: number;
    unlocked: boolean;
    assigned: boolean;
    element: HTMLElement;
}

export class AttackSkills {
    readonly page: HTMLElement;
    readonly skillList: Skill[];
    private activeSkill: Skill;
    constructor(data: Required<GameConfig.Skills>['attackSkills']) {
        this.page = document.createElement('div');
        this.page.classList.add('p-attack-skills');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.attackSkillList.map(data => {
            const element = createItemListElement(data);
            element.addEventListener('click', this.selectSkillByName.bind(this, data.name));
            return { data, unlocked: false, assigned: false, maxExp: 0, exp: 0, ...createItem(data), element };
        });
        this.page.querySelectorStrict('[data-skill-list]').append(...this.skillList.map(x => x.element));
        this.skillList.filter(x => x.unlocked).forEach(x => this.unlockSkill(x));

        const firstSkill = this.skillList.findStrict(x => x.probability === 0);
        assertDefined(firstSkill, 'no attack skill available, at least 1 attack skill must have a pickProbability of 0');
        this.activeSkill = firstSkill;
        this.assignSkill(firstSkill);

        this.selectSkillByName(this.activeSkill.data.name);

        combat.events.enemyDeath.listen((_, instance) => {
            this.tryUnlockSkill();
            if (this.skillList.filter(x => x.probability).every(x => x.unlocked)) {
                instance.removeListener();
            }
        });

        combat.events.enemyHit.listen(() => {
            if (!this.activeSkill.maxExp || this.activeSkill.exp >= this.activeSkill.maxExp) {
                return;
            }
            this.activeSkill.exp += 1 * player.stats.trainingMultiplier.value;
            this.updateSkillInfo();
            if (this.activeSkill.exp >= this.activeSkill.maxExp) {
                this.tryUnlockNextSkillRank(this.activeSkill);
            }
        });
    }

    get selectedSkill() {
        return this.skillList.findStrict(x => x.element.classList.contains('selected'));
    }

    get canAssignSkill() {
        return this.selectedSkill !== this.activeSkill;
    }

    private assignSkill(skill: Skill) {
        this.activeSkill.element.removeAttribute('data-tag');
        this.activeSkill.assigned = false;
        this.activeSkill = skill;
        skill.assigned = true;

        const statModList: StatModifier[] = [
            ...Modifier.extractStatModifierList(...Modifier.modListFromTexts(skill.data.modList)),
            { name: 'AttackSpeed', valueType: 'Base', value: skill.data.attackSpeed, override: true },
            { name: 'AttackManaCost', value: skill.data.manaCost, valueType: 'Base' }
        ];
        player.stats.attackEffectiveness.set(skill.data.attackEffectiveness);
        player.modDB.replace('AttackSkill', statModList);

        skill.element.setAttribute('data-tag', 'valid');
    }

    private selectSkillByName(name: string) {
        const skill = this.skillList.findStrict(x => x.data.name === name);
        this.showSkill(skill);
        this.skillList.forEach(x => x.element.classList.toggle('selected', x === skill));
    }

    private showSkill(skill: Skill) {
        const propertyList = [
            ['Attack Speed', skill.data.attackSpeed.toFixed(2)],
            ['Attack Effectiveness', skill.data.attackEffectiveness.toFixed()],
            ['Mana Cost', skill.data.manaCost.toFixed()]
        ];
        const itemInfoElements = createItemInfoElements({ item: skill, propertyList, modList: skill.data.modList });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        button.setAttribute('data-button', 'valid');
        button.textContent = 'Assign';
        const updateButton = () => {
            button.toggleAttribute('disabled', skill === this.activeSkill);
        };
        button.addEventListener('click', () => {
            this.assignSkill(skill);
            updateButton();
        });
        updateButton();
        itemInfoElements.contentElement.appendChild(button);
    }

    private updateSkillInfo() {
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = this.selectedSkill.exp / this.selectedSkill.maxExp;
        }
    }

    private tryUnlockSkill() {
        const candidates = createItemCandidates(this.skillList);
        const skill = pickOneFromPickProbability(candidates);
        if (!skill) {
            return;
        }
        this.unlockSkill(skill);
        notifications.addNotification({
            title: `New Attack Skill: ${skill.name}`,
            elementId: skill.data.id,
        });
    }

    private tryUnlockNextSkillRank(skill: Skill) {
        const nextSkill = getNextRankItem(skill, this.skillList);
        if (!nextSkill) {
            return;
        }
        this.unlockSkill(nextSkill);
        notifications.addNotification({
            title: `New Attack Skill: ${nextSkill.name}`,
            elementId: nextSkill.data.id,
        });
    }

    private unlockSkill(skill: Skill) {
        skill.unlocked = true;
        skill.element.textContent = skill.data.name;
        skill.element.removeAttribute('disabled');
        skill.element.classList.remove('hidden');
    }

    serialize(): GameSerialization.Skills['attackSkills'] {
        return {
            skillId: this.activeSkill.data.id,
            skillList: this.skillList.filter(x => x.unlocked).map(x => ({ id: x.data.id, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Skills['attackSkills']>) {
        const activeSkill = this.skillList.find(x => x.data.id === save?.skillId);
        if (activeSkill) {
            this.assignSkill(activeSkill);
            this.selectSkillByName(activeSkill.data.name);
        }

        for (const skillData of save?.skillList?.filter(isDefined) ?? []) {
            const skill = this.skillList.find(x => x.id === skillData?.id);
            if (!skill) {
                continue;
            }
            this.unlockSkill(skill);
            skill.exp = skill.maxExp * (skillData.expFac ?? 0);
        }
        this.selectSkillByName(this.activeSkill.name);
    }
}
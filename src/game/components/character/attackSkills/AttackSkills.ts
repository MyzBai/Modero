import { combat, player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type * as GameSerialization from 'src/game/serialization';
import { assertDefined } from 'src/shared/utils/assert';
import type { StatModifier } from 'src/game/mods/ModDB';
import { isDefined } from 'src/shared/utils/utils';
import { createAssignableObject, createObjectListElement, createObjectInfoElements, getRankBaseName, unlockObject } from 'src/game/utils/objectUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { SkillPage, type AttackSkill } from '../SkillPage';


export class AttackSkills extends SkillPage {
    readonly page: HTMLElement;
    protected readonly skillList: AttackSkill[];
    constructor(data: Required<GameConfig.Character>['attackSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-attack-skills');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.attackSkillList.map(data => {
            const baseName = getRankBaseName(data.name);
            if (!this.elementMap.has(baseName)) {
                const element = createObjectListElement(data);
                element.addEventListener('click', this.selectSkillByName.bind(this, data.name));
                this.elementMap.set(baseName, element);
            }
            return { type: 'Attack', data, ...createAssignableObject(data), rankList: [] };
        });
        this.skillList.forEach(x => x.rankList = this.skillList.filter(y => y.baseName === x.baseName));
        this.page.querySelectorStrict('[data-skill-list]').append(...this.elementMap.values());
        this.skillList.filter(x => x.unlocked).forEach(x => unlockObject(x, this.elementMap));

        const firstSkill = this.skillList.findStrict(x => x.probability === 0);
        assertDefined(firstSkill, 'no attack skill available, at least 1 attack skill must have a pickProbability of 0');
        firstSkill.assigned = true;
        this.assignSkill(firstSkill);
        this.selectSkillByName(this.activeSkill.name);

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
        return this.skillList.findStrict(x => x.selected);
    }

    get activeSkill() {
        return this.skillList.findStrict(x => x.assigned);
    }

    get canAssignSkill() {
        return this.selectedSkill !== this.activeSkill;
    }

    protected showSkill(skill: AttackSkill) {
        const propertyList = [
            ['Attack Speed', skill.data.attackSpeed.toFixed(2)],
            ['Attack Effectiveness', skill.data.attackEffectiveness.toFixed()],
            ['Mana Cost', skill.data.manaCost.toFixed()]
        ];
        const rankList = this.skillList.filter(x => x.baseName === skill.baseName);
        const itemInfoElements = createObjectInfoElements({
            obj: skill,
            propertyList,
            modList: skill.data.modList,
            rankList: rankList.length > 1 ? rankList : undefined,
            onRankChange: (item) => this.showSkill(item as AttackSkill)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        button.setAttribute('data-tag', 'valid');
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

    protected assignSkill(skill: AttackSkill) {
        this.unassignSkill(this.activeSkill);
        super.assignSkill(skill);

        const statModList: StatModifier[] = [
            ...Modifier.extractStatModifierList(...Modifier.modListFromTexts(skill.data.modList)),
            { name: 'AttackSpeed', valueType: 'Base', value: skill.data.attackSpeed, override: true },
            { name: 'AttackManaCost', value: skill.data.manaCost, valueType: 'Base' }
        ];
        player.stats.attackEffectiveness.set(skill.data.attackEffectiveness);
        player.modDB.replace('AttackSkill', statModList);
    }

    private updateSkillInfo() {
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = this.selectedSkill.exp / this.selectedSkill.maxExp;
        }
    }

    serialize(): GameSerialization.Character['attackSkills'] {
        return {
            skillId: this.activeSkill.data.id,
            skillList: this.skillList.filter(x => x.unlocked).map(x => ({ id: x.data.id, expFac: x.exp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Character['attackSkills']>) {
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
            unlockObject(skill, this.elementMap);
            skill.exp = skill.maxExp * (skillData.expFac ?? 0);
        }
        this.selectSkillByName(this.activeSkill.name);
    }
}
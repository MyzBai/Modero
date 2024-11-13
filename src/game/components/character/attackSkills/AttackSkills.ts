import { combat, player } from 'src/game/game';
import { Modifier } from 'src/game/mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type * as GameSerialization from 'src/game/serialization';
import { assertDefined } from 'src/shared/utils/assert';
import type { StatModifier } from 'src/game/mods/ModDB';
import { isDefined } from 'src/shared/utils/utils';
import { createObjectInfoElements, unlockObject } from 'src/game/utils/objectUtils';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { SkillPage, type AttackSkill } from '../SkillPage';
import type { Value } from '../../../../shared/utils/Value';
import { addRankExp, createRankObject, deserializeRankObject, getRankExpPct, tryUnlockNextRank } from '../../../utils/rankObjectUtils';

export class AttackSkills extends SkillPage {
    readonly page: HTMLElement;
    protected readonly skillList: AttackSkill[] = [];
    constructor(characterLevel: Value, data: Required<GameConfig.Character>['attackSkills']) {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-attack-skills');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skill List</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-item-info></div>');

        this.skillList = data.attackSkillList.reduce((skillList, skillData) => {
            const attackSkill: AttackSkill = {
                type: 'Attack',
                ...createRankObject(skillData),
            };
            attackSkill.element.addEventListener('click', this.selectSkill.bind(this, attackSkill));
            this.page.querySelectorStrict('[data-skill-list]').appendChild(attackSkill.element);
            skillList.push(attackSkill);
            characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, attackSkill));
            return skillList;
        }, [] as AttackSkill[]);

        const firstSkill = this.skillList.findStrict(x => x.unlocked);
        assertDefined(firstSkill, 'no attack skill available, at least 1 attack skill must be available');
        firstSkill.assigned = true;
        this.assignSkill(firstSkill);
        this.selectSkill(this.activeSkill);

        combat.events.enemyHit.listen(this.attackSkillExpCallback.bind(this));
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
        const rankData = skill.rankData(skill.selectedRank);
        const propertyList = [
            ['Attack Speed', rankData.attackSpeed.toFixed(2)],
            ['Attack Effectiveness', rankData.attackEffectiveness.toFixed()],
            ['Mana Cost', rankData.manaCost.toFixed()]
        ];

        const itemInfoElements = createObjectInfoElements({
            name: skill.name,
            propertyList,
            modList: rankData.modList,
            rankObj: skill,
            onRankChange: this.showSkill.bind(this)
        });
        this.page.querySelector('[data-item-info]')?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);

        const button = document.createElement('button');
        const updateButton = () => {
            let disabled = true;
            const tag = 'valid';
            const label = 'Assign';
            if (skill.assigned) {
                disabled = false;
                if (skill.selectedRank === skill.curRank) {
                    disabled = true;
                }
            } else {
                disabled = false;
            }
            button.textContent = label;
            button.setAttribute('data-tag', tag);
            button.toggleAttribute('disabled', disabled);
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

        const rankData = skill.rankList[skill.curRank - 1];
        assertDefined(rankData);

        const statModList: StatModifier[] = [
            ...Modifier.extractStatModifierList(...Modifier.modListFromTexts(rankData.modList)),
            { name: 'AttackSpeed', valueType: 'Base', value: rankData.attackSpeed, override: true },
            { name: 'AttackManaCost', value: rankData.manaCost, valueType: 'Base' }
        ];
        player.stats.attackEffectiveness.set(rankData.attackEffectiveness);
        player.modDB.replace('AttackSkill', statModList);
    }

    private updateSkillInfo() {
        const expbar = this.page.querySelector<ProgressElement>(`[data-item-info] ${ProgressElement.name}`);
        if (expbar) {
            expbar.value = getRankExpPct(this.selectedSkill);
        }
    }

    private attackSkillExpCallback() {
        addRankExp(this.activeSkill, player.stats.trainingMultiplier.value);
        if (this.activeSkill.curExp === this.activeSkill.maxExp) {
            if (tryUnlockNextRank(this.activeSkill)) {
                console.log('rank up');
            }
        }
        this.updateSkillInfo();
    }

    serialize(): GameSerialization.Character['attackSkills'] {
        return {
            skillId: this.activeSkill.id,
            skillList: this.skillList.map(x => ({ id: x.id, curRank: x.curRank, maxRank: x.maxRank, expFac: x.curExp / x.maxExp }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Character['attackSkills']>) {
        for (const skillData of save?.skillList?.filter(isDefined) ?? []) {
            const skill = this.skillList.find(x => x.id === skillData?.id);
            if (!skill) {
                continue;
            }
            unlockObject(skill);
            deserializeRankObject(skill, skillData);
        }
        const activeSkill = this.skillList.find(x => x.id === save?.skillId);
        if (activeSkill) {
            this.assignSkill(activeSkill);
        }
        this.selectSkill(this.activeSkill);
        this.updateSkillInfo();
    }
}
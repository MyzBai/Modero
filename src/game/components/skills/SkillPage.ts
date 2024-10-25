import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { notifications } from '../../game';
import { getRankNumeral, getNextRankObject, selectObjectByName, unlockObject, type AssignableObject } from '../../utils/objectUtils';
import { pickOneFromPickProbability } from '../../../shared/utils/utils';

type SkillType = 'Attack' | 'Aura' | 'Passive';
export type AttackSkill = BaseSkill<GameConfig.AttackSkill>;
export type AuraSkill = BaseSkill<GameConfig.AuraSkill>;
export type PassiveSkill = BaseSkill<GameConfig.PassiveSkill>;

export type Skill = AttackSkill | AuraSkill | PassiveSkill;

export interface BaseSkill<T> extends AssignableObject {
    type: SkillType;
    baseName: string;
    data: T;
    rankList: Skill[];
}

export abstract class SkillPage {
    abstract readonly page: HTMLElement;
    protected abstract readonly skillList: Skill[];
    protected readonly elementMap = new Map<string, HTMLElement>();
    constructor() { }

    protected selectSkillByName(name: string | undefined) {
        if (name) {
            const skill = selectObjectByName(name, this.skillList, this.elementMap);
            this.showSkill(skill);
        } else {
            this.page.querySelector('[data-skill-info]')?.replaceChildren();
        }
    }

    protected assignSkill(skill: Skill) {
        if (skill.assigned) {
            return;
        }
        skill.rankList.filter(x => x.assigned).forEach(x => this.unassignSkill(x));
        const element = this.elementMap.get(skill.baseName)!;
        this.elementMap.forEach((el, key) => key === skill.baseName && el.classList.toggle('m-text-green', key === skill.baseName));
        element.textContent = skill.name;
        skill.assigned = true;
    }

    protected unassignSkill(skill: Skill) {
        const element = this.elementMap.get(skill.baseName)!;
        element.classList.remove('m-text-green');
        skill.assigned = false;
    }

    protected tryUnlockSkill() {
        const candidates = this.skillList.filter(x => !x.unlocked && (getRankNumeral(x.name) ?? 'I') === 'I');
        const skill = pickOneFromPickProbability(candidates);
        if (!skill) {
            return;
        }
        unlockObject(skill, this.elementMap);
        notifications.addNotification({
            title: `New ${skill.type} Skill: ${skill.name}`,
            elementId: skill.data.id,
        });
    }

    protected tryUnlockNextSkillRank(skill: Skill) {
        const nextSkill = getNextRankObject(skill);
        if (!nextSkill) {
            return;
        }
        unlockObject(nextSkill, this.elementMap);
        notifications.addNotification({
            title: `New ${skill.type} Skill Rank: ${nextSkill.name}`,
        });
        // if (skill.rankList.some(x => x.assigned)) {
        //     this.assignSkill(nextSkill);
        // }
        // if (skill.rankList.some(x => x.selected)) {
        //     this.selectSkillByName(nextSkill.name);
        // }
    }

    protected abstract showSkill(skill: Skill): void;
}
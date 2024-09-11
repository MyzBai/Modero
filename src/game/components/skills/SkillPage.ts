import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { notifications } from '../../game';
import { getItemRankNumeral, getNextRankItem, selectItemByName, unlockItem, type Item } from '../../utils/itemUtils';
import { pickOneFromPickProbability } from '../../../shared/utils/utils';

type SkillType = 'Attack' | 'Aura' | 'Passive';
export type AttackSkill = BaseSkill<GameConfig.AttackSkill>;
export type AuraSkill = BaseSkill<GameConfig.AuraSkill>;
export type PassiveSkill = BaseSkill<GameConfig.PassiveSkill>;

export type Skill = AttackSkill | AuraSkill | PassiveSkill;

export interface BaseSkill<T> extends Item {
    type: SkillType;
    baseName: string;
    name: string;
    data: T;
    exp: number;
    maxExp: number;
    unlocked: boolean;
    assigned: boolean;
}

export abstract class SkillPage {
    abstract readonly page: HTMLElement;
    protected abstract readonly skillList: Skill[];
    protected readonly elementMap = new Map<string, HTMLElement>();
    constructor() { }

    protected selectSkillByName(name: string | undefined) {
        if (name) {
            const skill = selectItemByName(name, this.skillList, this.elementMap);
            this.showSkill(skill);
        } else {
            this.page.querySelector('[data-skill-info]')?.replaceChildren();
        }
    }

    protected tryUnlockSkill() {
        const candidates = this.skillList.filter(x => !x.unlocked && (getItemRankNumeral(x.name) ?? 'I') === 'I');
        const skill = pickOneFromPickProbability(candidates);
        if (!skill) {
            return;
        }
        unlockItem(skill, this.elementMap);
        notifications.addNotification({
            title: `New ${skill.type} Skill: ${skill.name}`,
            elementId: skill.data.id,
        });
    }

    protected tryUnlockNextSkillRank(skill: Skill) {
        const nextSkill = getNextRankItem(skill, this.skillList);
        if (!nextSkill) {
            return;
        }
        unlockItem(nextSkill, this.elementMap);
        notifications.addNotification({
            title: `New ${skill.type} Skill Rank: ${nextSkill.name}`,
        });
    }

    protected abstract showSkill(skill: Skill): void;
}
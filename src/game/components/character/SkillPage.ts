import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { updateRankObjectListItemElement, type RankObject, type RankObjectData } from '../../utils/rankObjectUtils';

export type AttackSkill = { type: 'Attack'; } & BaseSkill<GameConfig.AttackSkill['rankList'][number]>;
export type AuraSkill = { type: 'Aura'; } & BaseSkill<GameConfig.AuraSkill['rankList'][number]>;
export type PassiveSkill = { type: 'Passive'; } & Pick<GameConfig.PassiveSkill, 'insightCost'> & BaseSkill<GameConfig.PassiveSkill['rankList'][number]>;

export type Skill = AttackSkill | AuraSkill | PassiveSkill;
export type SkillType = Skill['type'];

export interface BaseSkill<Data extends RankObjectData> extends RankObject<Data> {
    type: string;
    id: string;
    name: string;
}

export abstract class SkillPage {
    abstract readonly page: HTMLElement;
    protected abstract readonly skillList: Skill[];

    protected selectSkill(skill?: Skill) {
        this.skillList.forEach(x => {
            x.selected = x === skill;
            x.element.classList.toggle('selected', x.selected);
        });
        if (skill) {
            this.showSkill(skill);
        } else {
            this.page.querySelector('[data-item-info]')?.replaceChildren();
        }
    }

    protected assignSkill(skill: Skill) {
        if (skill.assigned) {
            return;
        }
        skill.curRank = skill.selectedRank;
        skill.assigned = true;
        updateRankObjectListItemElement(skill);
    }

    protected unassignSkill(skill: Skill) {
        skill.assigned = false;
        skill.curRank = 1;
        updateRankObjectListItemElement(skill);
    }

    protected abstract showSkill(skill: Skill): void;
}
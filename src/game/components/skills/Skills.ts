import { Component } from '../Component';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { AttackSkills } from './AttackSkills';
import { AuraSkills } from './AuraSkills';
import { Passives } from './Passives';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { player } from 'src/game/game';
import { createHelpIcon } from 'src/shared/utils/dom';
import { LevelElement } from '../../../shared/customElements/LevelElement';
import { Modifier } from '../../mods/Modifier';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { createModListElement } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';

export class Skills extends Component {

    private attackSkills?: AttackSkills;
    private auraSkills?: AuraSkills;
    private passiveSkills?: Passives;
    private readonly levelElement?: LevelElement;
    constructor(readonly data: GameConfig.Skills) {
        super('skills');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Skills</div>');
        if (data.levelList) {
            this.levelElement = createCustomElement(LevelElement);
            this.levelElement.setAction('Meditating');
            this.levelElement.setLevelClickCallback(this.showSkillsOverview.bind(this));
            this.levelElement.onLevelChange.listen(this.updateLevel.bind(this));
            this.page.appendChild(this.levelElement);
            this.updateLevel();
        }
        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setDirection('horizontal');
        this.page.appendChild(menu);

        const helpIconElement = createHelpIcon('Skills', () => `
            Attack skills contains two base stats, attack speed and attack effectiveness.
            Attack speed is your base attack rate and can be further scaled with stat modifiers.
            Both attack damage and damage over time (DOT) are scaled by attack effectiveness when performing a hit.

            Mana cost is the cost for each attack. You must have enough mana to perform an attack.
            ${this.auraSkills ? `
            Aura skills are temporary buffs. They cost mana and they last for a duration.
            ` : ''}
            Passives requires insight. You can gain insight by killing enemies.
        `.trim());
        this.page.appendChild(helpIconElement);



        if (data.attackSkills) {
            this.attackSkills = new AttackSkills(data.attackSkills);
            menu.addMenuItem('Attack', 'attack', 0);
            menu.registerPageElement(this.attackSkills.page, 'attack');
            this.page.append(this.attackSkills.page);
        }
        if (data.auraSkills) {
            this.auraSkills = new AuraSkills(data.auraSkills);
            menu.addMenuItem('Aura', 'aura', 1);
            menu.registerPageElement(this.auraSkills.page, 'aura');
            menu.sort();
            this.page.append(this.auraSkills.page);
        }
        if (data.passiveSkills) {
            this.passiveSkills = new Passives(data.passiveSkills);
            menu.addMenuItem('Passives', 'passives', 2);
            menu.registerPageElement(this.passiveSkills.page, 'passives');
            this.page.appendChild(this.passiveSkills.page);
        }
    }

    private updateLevel() {
        if (!this.levelElement) {
            return;
        }
        this.levelElement.maxExp = this.data.levelList?.[this.levelElement.level - 1]?.exp ?? Infinity;
        const modList = this.data.levelList?.[this.levelElement!.level - 1]?.modList ?? [];
        player.modDB.replace('Skills', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private showSkillsOverview() {
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Skills Overview');

        const body = createModListElement(this.data.levelList?.[this.levelElement!.level - 1]?.modList ?? []);

        modal.setBodyElement(body);
    }

    serialize(save: Serialization) {
        save.skills = {
            level: this.levelElement?.level,
            exp: this.levelElement?.curExp,
            meditating: player.activity?.name === 'Meditating',
            attackSkills: this.attackSkills?.serialize(),
            auraSkills: this.auraSkills?.serialize(),
            passiveSkills: this.passiveSkills?.serialize(),
        };
    }

    deserialize({ skills: save }: UnsafeSerialization) {
        if (this.levelElement) {
            this.levelElement.setLevel(save?.level ?? 1);
            this.levelElement.curExp = save?.exp ?? 0;
            this.levelElement.updateProgressBar();
            this.updateLevel();
            if (save?.meditating) {
                this.levelElement.startAction();
            }
        }
        if (save?.attackSkills) {
            this.attackSkills?.deserialize(save.attackSkills);
        }
        if (save?.auraSkills) {
            this.auraSkills?.deserialize(save.auraSkills);
        }
        if (save?.passiveSkills) {
            this.passiveSkills?.deserialize(save.passiveSkills);
        }
    }
}
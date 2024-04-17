import { Component } from '../Component';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { AttackSkills } from './AttackSkills';
import { AuraSkills } from './AuraSkills';
import { Passives } from './Passives';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { GameInitializationStage, game, notifications } from 'src/game/game';
import { evaluateStatRequirements } from 'src/game/statistics/statRequirements';
import { createHelpIcon } from 'src/shared/utils/dom';

export class Skills extends Component {

    private attackSkills?: AttackSkills;
    private auraSkills?: AuraSkills;
    private passiveSkills?: Passives;
    readonly abortController = new AbortController();
    constructor(readonly data: GameConfig.Skills) {
        super('skills');

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
        menu.appendChild(helpIconElement);

        if (data.attackSkills) {
            this.attackSkills = new AttackSkills(data.attackSkills);
            menu.addMenuItem('Attack', 'attack', 0);
            menu.registerPageElement(this.attackSkills.page, 'attack');
            this.page.append(this.attackSkills.page);
        }
        const auraSkills = data.auraSkills;
        if (auraSkills) {
            evaluateStatRequirements(auraSkills.requirements ?? {}, () => {
                const initDone = game.initializationStage === GameInitializationStage.Done;
                if (initDone) {
                    notifications.addNotification({
                        title: 'You Unlocked Aura Skills'
                    });
                }

                this.auraSkills = new AuraSkills(auraSkills);
                menu.addMenuItem('Aura', 'aura', 1);
                menu.registerPageElement(this.auraSkills.page, 'aura');
                menu.sort();
                this.page.append(this.auraSkills.page);

                if (initDone) {
                    const element = menu.getMenuItemById('aura');
                    if (element) {
                        game.addElementHighlight(element);
                    }
                }
            });
        }
        if (data.passiveSkills) {
            this.passiveSkills = new Passives(data.passiveSkills);
            menu.addMenuItem('Passives', 'passives', 2);
            menu.registerPageElement(this.passiveSkills.page, 'passives');
            this.page.appendChild(this.passiveSkills.page);
        }
    }

    serialize(save: Serialization) {
        save.skills = {
            attackSkills: this.attackSkills?.serialize(),
            auraSkills: this.auraSkills?.serialize(),
            passiveSkills: this.passiveSkills?.serialize(),
        };
    }

    deserialize({ skills: save }: UnsafeSerialization) {
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
import { Component } from '../Component';
import type * as GameModule from 'src/game/gameModule/GameModule';
import { AttackSkills } from './AttackSkills';
import { AuraSkills } from './AuraSkills';
import { Passives } from './Passives';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';

export class Skills extends Component {

    private attackSkills?: AttackSkills;
    private auraSkills?: AuraSkills;
    private passiveSkills?: Passives;

    constructor(readonly data: GameModule.Skills) {
        super('skills');

        const menu = createCustomElement(TabMenuElement);
        menu.setDirection('horizontal');
        this.page.appendChild(menu);

        if (data.attackSkills) {
            this.attackSkills = new AttackSkills(data.attackSkills);
            menu.addMenuItem('Attack', 'attack');
            menu.registerPageElement(this.attackSkills.page, 'attack');
            this.page.append(this.attackSkills.page);
        }
        if (data.auraSkills) {
            this.auraSkills = new AuraSkills(data.auraSkills);
            menu.addMenuItem('Aura', 'aura');
            menu.registerPageElement(this.auraSkills.page, 'aura');
            this.page.append(this.auraSkills.page);
        }
        if (data.passiveSkills) {
            this.passiveSkills = new Passives(data.passiveSkills);
            menu.addMenuItem('Passives', 'passives');
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
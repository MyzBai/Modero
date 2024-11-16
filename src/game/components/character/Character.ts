import { Component } from '../Component';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { AttackSkills } from './attackSkills/AttackSkills';
import { AuraSkills } from './auraSkills/AuraSkills';
import { Passives } from './passiveSkills/PassiveSkills';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { player } from 'src/game/game';
import { Modifier } from '../../mods/Modifier';
import { createLevelModal, createTitleElement } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { isNumber } from '../../../shared/utils/utils';
import { assertDefined } from '../../../shared/utils/assert';

export class Character extends Component {

    private attackSkills?: AttackSkills;
    private auraSkills?: AuraSkills;
    private passiveSkills?: Passives;
    private readonly level = new Value(1);
    constructor(readonly data: GameConfig.Character) {
        super('character');

        const titleElement = createTitleElement({
            label: 'Character',
            levelClickCallback: data.levelList ? this.openCharacterLevelModal.bind(this) : undefined,
            helpText: this.getHelpText.bind(this)
        });
        this.page.appendChild(titleElement);

        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setDirection('horizontal');
        this.page.appendChild(menu);

        if (data.attackSkills) {
            this.attackSkills = new AttackSkills(this.level, data.attackSkills);
            menu.addMenuItem('Attack', 'attack', 0);
            menu.registerPageElement(this.attackSkills.page, 'attack');
            this.page.append(this.attackSkills.page);
        }
        const auraSkillsData = data.auraSkills;
        if (auraSkillsData) {
            this.level.registerTargetValueCallback(auraSkillsData.requirements?.characterLevel ?? 1, () => {
                this.auraSkills = new AuraSkills(this.level, auraSkillsData);
                menu.addMenuItem('Aura', 'aura', 1);
                menu.registerPageElement(this.auraSkills.page, 'aura');
                menu.sort();
                this.page.append(this.auraSkills.page);
            });
        }
        if (data.passiveSkills) {
            this.passiveSkills = new Passives(this.level, data.passiveSkills);
            menu.addMenuItem('Passive', 'passive', 2);
            menu.registerPageElement(this.passiveSkills.page, 'passive');
            this.page.appendChild(this.passiveSkills.page);
        }

        this.updateCharacterLevel();
        this.level.addListener('change', this.updateCharacterLevel.bind(this));
    }

    private getHelpText() {
        return `
        [Attack]
        Attack skills contains two base stats not available anywhere else, Attack speed and Attack effectiveness.
        Attack speed determines your base attack speed.
        Attack Effectiveness determines the base damage of both attacks and damage over time.
        ${this.auraSkills ? `
        [Aura]
        Aura skills are temporary buffs. They cost mana and they last for a duration.
        ` : ''}
        [Passive]
        Passives requires insight. You gain insight by killing enemies and collecting insight capacity items.`;
    }

    private openCharacterLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Character',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateCharacterLevel() {
        if (!this.data.levelList) {
            return;
        }
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('Character', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    serialize(save: Serialization) {
        save.character = {
            level: this.level.value,
            attackSkills: this.attackSkills?.serialize(),
            auraSkills: this.auraSkills?.serialize(),
            passiveSkills: this.passiveSkills?.serialize(),
        };
    }

    deserialize({ character: save }: UnsafeSerialization) {
        if (isNumber(save?.level)) {
            this.level.set(save.level);
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
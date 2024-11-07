import { Component } from '../Component';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { AttackSkills } from './attackSkills/AttackSkills';
import { AuraSkills } from './auraSkills/AuraSkills';
import { Passives } from './passiveSkills/Passives';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { player } from 'src/game/game';
import { createHelpIcon } from 'src/shared/utils/dom';
import { Modifier } from '../../mods/Modifier';
import { createLevelModal } from '../../utils/dom';
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

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Character';
        if (data.levelList) {
            titleElement.innerHTML = `<span class="g-clickable-text">Character Lv.<var data-level>1</var></span>`;
            titleElement.addEventListener('click', this.openCharacterLevelModal.bind(this));
            this.page.appendChild(titleElement);
            this.updateCharacterLevel();
        }
        this.page.appendChild(titleElement);
        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setDirection('horizontal');
        this.page.appendChild(menu);

        const helpIconElement = createHelpIcon('Character', () => `
            [Attacks]
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
        const auraSkillsData = data.auraSkills;
        if (auraSkillsData) {
            this.level.registerTargetValueCallback(auraSkillsData.levelReq ?? 1, () => {
                this.auraSkills = new AuraSkills(auraSkillsData);
                menu.addMenuItem('Aura', 'aura', 1);
                menu.registerPageElement(this.auraSkills.page, 'aura');
                menu.sort();
                this.page.append(this.auraSkills.page);
            });
        }
        if (data.passiveSkills) {
            this.passiveSkills = new Passives(data.passiveSkills);
            menu.addMenuItem('Passives', 'passives', 2);
            menu.registerPageElement(this.passiveSkills.page, 'passives');
            this.page.appendChild(this.passiveSkills.page);
        }

        this.level.addListener('add', this.updateCharacterLevel.bind(this));
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
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
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
            this.updateCharacterLevel();
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
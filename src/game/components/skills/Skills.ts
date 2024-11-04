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

export class Skills extends Component {

    private attackSkills?: AttackSkills;
    private auraSkills?: AuraSkills;
    private passiveSkills?: Passives;
    private readonly level = new Value(1);
    constructor(readonly data: GameConfig.Skills) {
        super('skills');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Skills';
        if (data.levelList) {
            titleElement.innerHTML = `<span class="g-clickable-text">Skills Lv.<var data-level>1</var></span>`;
            titleElement.addEventListener('click', this.openSkillsLevelModal.bind(this));
            this.page.appendChild(titleElement);
            this.updateSkillsLevel();
        }
        this.page.appendChild(titleElement);
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

        this.level.addListener('change', this.updateSkillsLevel.bind(this));
    }

    private openSkillsLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Skills',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateSkillsLevel() {
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('Skills', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    serialize(save: Serialization) {
        save.skills = {
            level: this.level.value,
            meditating: player.activity?.name === 'Meditating',
            attackSkills: this.attackSkills?.serialize(),
            auraSkills: this.auraSkills?.serialize(),
            passiveSkills: this.passiveSkills?.serialize(),
        };
    }

    deserialize({ skills: save }: UnsafeSerialization) {
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
import { createCustomElement } from '../../../shared/customElements/customElements';
import { TabMenuElement } from '../../../shared/customElements/TabMenuElement';
import { player } from '../../game';
import type * as GameConfig from '../../gameConfig/GameConfig';
import { Modifier } from '../../mods/Modifier';
import { createLevelModal, createTitleElement } from '../../utils/dom';
import { Artifacts } from './artifacts/Artifacts';
import { Component } from '../Component';
import type { Serialization, UnsafeSerialization } from '../../serialization';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { isNumber } from '../../../shared/utils/utils';
import { assertDefined } from '../../../shared/utils/assert';

export class Treasury extends Component {
    private readonly level = new Value(1);
    private artifacts?: Artifacts;
    constructor(private readonly data: GameConfig.Treasury) {
        super('treasury');

        const titleElement = createTitleElement({
            label: 'Treasury',
            levelClickCallback: data.levelList ? this.openTreasuryLevelModal.bind(this) : undefined
        });
        this.page.appendChild(titleElement);

        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setDirection('horizontal');
        this.page.appendChild(menu);

        if (data.artifacts) {
            this.artifacts = new Artifacts(data.artifacts);
            menu.addMenuItem('Artifacts', 'artifacts', 0);
            menu.registerPageElement(this.artifacts.page, 'artifacts');
            this.page.append(this.artifacts.page);
        }

        this.updateTreasuryLevel();
        this.level.addListener('change', this.updateTreasuryLevel.bind(this));
    }

    private openTreasuryLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Treasury',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateTreasuryLevel() {
        if (!this.data.levelList) {
            return;
        }
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('Treasury', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    serialize(save: Serialization): void {
        save.treasury = {
            level: this.level.value,
            artifacts: this.artifacts?.serialize()
        };
    }

    deserialize({ treasury: save }: UnsafeSerialization): void {
        if (isNumber(save?.level)) {
            this.level.set(save.level);
        }
        this.artifacts?.deserialize(save?.artifacts);
    }
}
import { createCustomElement } from '../../../shared/customElements/customElements';
import { LevelElement } from '../../../shared/customElements/LevelElement';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { TabMenuElement } from '../../../shared/customElements/TabMenuElement';
import { player } from '../../game';
import * as GameConfig from '../../gameConfig/GameConfig';
import { Modifier } from '../../mods/Modifier';
import { createModListElement } from '../../utils/dom';
import { Artifacts } from './artifacts/Artifacts';
import { Component } from '../Component';
import type { Serialization, UnsafeSerialization } from '../../serialization';

export class Treasury extends Component {
    private readonly levelElement?: LevelElement;
    private artifacts?: Artifacts;
    constructor(private readonly data: GameConfig.Treasury) {
        super('treasury');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Treasury</div>');
        if (data.levelList) {
            this.levelElement = createCustomElement(LevelElement);
            this.levelElement.setAction('Expanding Treasury');
            this.levelElement.setLevelClickCallback(this.showTreasuryUpgradeOverview.bind(this));
            this.levelElement.onLevelChange.listen(this.updateLevel.bind(this));
            this.page.appendChild(this.levelElement);
        }
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

        this.updateLevel();
    }

    private updateLevel() {
        if (!this.levelElement) {
            return;
        }
        this.levelElement.maxExp = this.data.levelList![this.levelElement.level - 1]?.exp ?? Infinity;
        const modList = this.data.levelList?.[this.levelElement.level - 1]?.modList ?? [];
        player.modDB.replace('Treasury', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    }

    private showTreasuryUpgradeOverview() {
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Treasury Overview');

        const body = createModListElement(this.data.levelList?.[this.levelElement!.level - 1]?.modList ?? []);

        modal.setBodyElement(body);
    }

    serialize(save: Serialization): void {
        save.treasury = {
            level: this.levelElement?.level,
            exp: this.levelElement?.curExp,
            expanding: player.activity?.name === 'Expanding Treasury',
            artifacts: this.artifacts?.serialize()
        }
    }

    deserialize({ treasury: save }: UnsafeSerialization): void {
        if (this.levelElement) {
            this.levelElement.setLevel(save?.level ?? 1);
            this.levelElement.curExp = save?.exp ?? 0;
            this.levelElement.updateProgressBar();
            this.updateLevel();
            if (save?.expanding) {
                this.levelElement.startAction();
            }
        }
        this.artifacts?.deserialize(save?.artifacts);
    }
}
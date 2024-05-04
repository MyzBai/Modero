import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import { Ascend } from './Ascend';
import { Ascensions } from './Ascensions';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { evaluateStatRequirements } from 'src/game/statistics/statRequirements';
import { GameInitializationStage, game, notifications } from 'src/game/game';
import { assertDefined } from 'src/shared/utils/assert';

export class Ascension {
    private page?: HTMLElement;
    private menu?: TabMenuElement;
    private ascend?: Ascend;
    private ascensions?: Ascensions;

    init() {
        evaluateStatRequirements({ maxLevel: game.maxLevel }, () => {
            this.setup();
        });
    }

    private setup() {
        this.page = document.createElement('div');
        this.page.classList.add('p-ascension', 'hidden');
        const { menuItem } = game.addPage(this.page, 'Ascension', 'ascension');

        this.menu = createCustomElement(TabMenuElement);
        this.menu.style.visibility = 'hidden';
        this.menu.setDirection('horizontal');
        this.page.appendChild(this.menu);

        this.ascend = new Ascend();
        this.page.appendChild(this.ascend.page);
        this.menu.addMenuItem('Ascend', 'ascend');
        this.menu.registerPageElement(this.ascend.page, 'ascend');

        game.stats.ascensionCount.addListener('change', ({ curValue }) => {
            if (!this.ascensions) {
                this.createAscensions();
            }
            assertDefined(this.ascensions);
            const lastInstance = game.gameConfig.ascension.ascensionInstanceList?.[curValue - 1];
            if (lastInstance) {
                this.ascensions.updateAscensionList();
            }
        });

        if (game.initializationStage === GameInitializationStage.Done) {
            notifications.addNotification({
                title: 'You Unlocked Ascension',
                description: 'It\'s time to prove your worth...',
            });
            game.addElementHighlight(menuItem);
        }
    }

    private createAscensions() {
        this.ascensions = new Ascensions();
        assertDefined(this.page);
        assertDefined(this.menu);
        this.page.appendChild(this.ascensions.page);
        this.menu.addMenuItem('Ascensions', 'ascensions');
        this.menu.registerPageElement(this.ascensions.page, 'ascensions');
        this.menu.style.visibility = 'visible';
    }

    reset() {
        this.page?.remove();
        this.page = undefined;
        this.menu = undefined;
        this.ascend = undefined;
        this.ascensions = undefined;
        game.menu.getMenuItemById('ascension')?.remove();
    }

    serialize(save: Serialization) {
        if (!this.page) {
            return;
        }
        save.ascension = {
            ...this.ascend?.serialize()
        };
    }

    deserialize({ ascension: save }: UnsafeSerialization) {
        if (!save) {
            return;
        }
        this.ascensions?.updateAscensionList();
        assertDefined(this.ascend);
        this.ascend.deserialize({ state: save.state, combatArea: save.combatArea, timeout: save.timeout });
    }
}
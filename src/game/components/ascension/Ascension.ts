import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import { Ascend as Trial } from './Trial';
import { Ascensions } from './Ascensions';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { evaluateStatRequirements } from 'src/game/statistics/statRequirements';
import { GameInitializationStage, game, gameLoop, notifications } from 'src/game/game';
import { assertDefined } from 'src/shared/utils/assert';
import { EventEmitter } from '../../../shared/utils/EventEmitter';
import { fadeIn, fadeOut } from './utils';
import { ModalElement } from '../../../shared/customElements/ModalElement';

export class Ascension {
    private page?: HTMLElement;
    private menu?: TabMenuElement;
    private trial?: Trial;
    private ascensions?: Ascensions;
    private readonly ascensionListElements: HTMLElement[] = [];
    readonly ascendEvent = new EventEmitter<HTMLElement[]>();
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

        this.trial = new Trial();
        this.page.appendChild(this.trial.page);
        this.menu.addMenuItem('Ascend', 'ascend');
        this.menu.registerPageElement(this.trial.page, 'ascend');

        game.stats.ascensionMax.addListener('change', ({ curValue }) => {
            if (!this.ascensions) {
                this.createAscensions();
            }
            assertDefined(this.ascensions);
            const lastInstance = game.gameConfig.ascension.ascensionInstanceList?.[curValue - 1];
            if (lastInstance) {
                this.ascensions.updateAscensionList();
            }
        });

        game.stats.ascension.addListener('change', () => {
            void this.ascensions?.initializeAscension();
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

    async ascend() {
        gameLoop.stop();
        game.saveGame();
        await fadeOut();
        game.clearHighlights();
        game.stats.ascensionMax.add(1);
        game.stats.ascension.add(1);
        this.ascensionListElements.clear();
        this.ascendEvent.invoke(this.ascensionListElements);
        await game.softReset();
        const modal = createCustomElement(ModalElement);
        modal.setTitle('You have ascended!');
        const body = document.createElement('div');
        body.append(...this.ascensionListElements);
        modal.setBodyElement(body);
        await modal.setButtons([{ type: 'confirm', text: 'Contine' }]);
        notifications.addNotification({ title: 'You Have Ascended!' });
        game.saveGame();
        gameLoop.start();
        await fadeIn();
    }

    reset() {
        this.page?.remove();
        this.page = undefined;
        this.menu = undefined;
        this.trial = undefined;
        this.ascensions = undefined;
        game.menu.getMenuItemById('ascension')?.remove();
        this.ascendEvent.removeAllListeners();
    }

    serialize(save: Serialization) {
        if (!this.page) {
            return;
        }
        save.ascension = {
            ...this.trial?.serialize()
        };
    }

    deserialize({ ascension: save }: UnsafeSerialization) {
        if (!save) {
            return;
        }
        this.ascensions?.updateAscensionList();
        assertDefined(this.trial);
        this.trial.deserialize({ state: save.state, combatArea: save.combatArea, timeout: save.timeout });
    }
}
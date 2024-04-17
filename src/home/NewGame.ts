import { assertDefined } from 'src/shared/utils/assert';
import gameModRegistry from '../game/gameConfig/gameModRegistry.json';
import { GameInitializer } from './GameInitializer';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';
import { createModEntryInfoElement } from './dom';
import { createHelpIcon } from 'src/shared/utils/dom';

export type GameModEntryData = typeof gameModRegistry.list[number];

export interface GameModEntry {
    gameModEntryData: GameModEntryData;
    element: HTMLElement;
}

export class NewGame extends GameInitializer {
    readonly page: HTMLElement;
    private readonly gameModEntryList: GameModEntry[];
    constructor() {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-new-game');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title', 'title');
        titleElement.textContent = 'Mod List';
        this.page.appendChild(titleElement);

        const helpIcon = createHelpIcon('Game Mod', `
        This game is designed around user-made mods. Pure data driven files with no scripting involved.
        A mod contains almost all of the game's data. Therefore a mod must be selected before playing.
        `.trim());

        titleElement.appendChild(helpIcon);

        this.page.insertAdjacentHTML('beforeend', '<ul class="entry-list g-scroll-list-v" data-entry-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-mod-entry-info></div>');

        this.gameModEntryList = gameModRegistry.list.map(entry => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', entry.id);
            element.textContent = entry.name;
            element.addEventListener('click', () => {
                this.selectEntryById(entry.id);
            });
            return { gameModEntryData: entry, element };
        });

        this.page.querySelectorStrict('[data-entry-list]').append(...this.gameModEntryList.map(x => x.element));

        this.gameModEntryList[0]?.element.click();
    }

    private selectEntryById(id: string) {
        const entry = this.gameModEntryList.findStrict(x => x.gameModEntryData.id === id);
        this.showEntry(entry.gameModEntryData);
        this.gameModEntryList.forEach(x => x.element.classList.toggle('selected', x === entry));
    }

    private showEntry(modEntryData: GameModEntryData) {
        const modEntryInfoElements = createModEntryInfoElement(modEntryData);
        this.page.querySelector('[data-mod-entry-info]')?.replaceWith(modEntryInfoElements.element) ?? this.page.appendChild(modEntryInfoElements.element);

        const startButton = document.createElement('button');
        startButton.setAttribute('data-role', 'confirm');
        startButton.textContent = 'Start Game';
        startButton.addEventListener('click', async () => {
            await this.tryStartNewGame(modEntryData);
        });
        modEntryInfoElements.contentElement.appendChild(startButton);
    }

    private async tryStartNewGame(modEntryData: GameModEntryData) {
        const save = loadGame(modEntryData.id);
        if (save) {
            await this.showExistingSaveModal(modEntryData);
            return;
        }
        await this.startGame(modEntryData);
    }

    private async showExistingSaveModal(modEntryData: GameModEntryData) {
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Save Detected!');
        modal.setBodyText('You already have an existing save. \nYou can resume from this save or start a new game.');
        const id = await modal.setButtons([
            { text: 'Resume', type: 'utility', waitId: 'continue' },
            { text: 'New Game', type: 'confirm', waitId: 'new' },
            { text: 'Cancel', type: 'cancel', waitId: 'cancel' },
        ], 'horizontal');
        if (id === 'continue') {
            const save = loadGame(modEntryData.id);
            assertDefined(save);
            await this.startSavedGame(save);
        } else if (id === 'new') {
            const saves = loadGame();
            saves.delete(modEntryData.id);
            saveGame(saves);
            await this.tryStartNewGame(modEntryData);
        }
    }
}
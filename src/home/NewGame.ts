import { assertDefined } from 'src/shared/utils/assert';
import moduleList from '../game/gameModule/moduleList.json';
import { GameInitializer } from './GameInitializer';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { PromptWindowElement } from 'src/shared/customElements/PromptWindowElement';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';

export type ModuleEntryData = typeof moduleList.list[number];

export interface ModuleEntry {
    moduleEntryData: ModuleEntryData;
    element: HTMLElement;
}

export class NewGame extends GameInitializer {
    readonly page: HTMLElement;
    private readonly moduleEntryList: ModuleEntry[];
    constructor() {
        super();
        this.page = document.createElement('div');
        this.page.classList.add('p-new-game');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Module List</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-entry-info" data-entry-info></div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="entry-list" data-entry-list></ul>');

        this.moduleEntryList = moduleList.list.map(entry => {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-id', entry.id);
            element.textContent = entry.name;
            element.addEventListener('click', () => {
                this.selectEntryById(entry.id);
            });
            return { moduleEntryData: entry, element };
        });

        this.page.querySelectorStrict('[data-entry-list]').append(...this.moduleEntryList.map(x => x.element));

        this.moduleEntryList[0]?.element.click();
    }

    private selectEntryById(id: string) {
        const entry = this.moduleEntryList.findStrict(x => x.moduleEntryData.id === id);
        this.showEntry(entry);
        this.moduleEntryList.forEach(x => x.element.classList.toggle('selected', x === entry));
    }

    private showEntry(entry: ModuleEntry) {
        const element = this.page.querySelectorStrict('[data-entry-info]');
        element.replaceChildren();

        element.insertAdjacentHTML('beforeend', `<div class="g-title">${entry.moduleEntryData.name}</div>`);

        element.insertAdjacentHTML('beforeend', `<div class="s-desc">${entry.moduleEntryData.description}</div>`);

        const startButton = document.createElement('button');
        startButton.setAttribute('data-role', 'confirm');
        startButton.textContent = 'Start Game';
        startButton.addEventListener('click', async () => {
            await this.tryStartNewGame(entry);
        });
        element.appendChild(startButton);
    }

    private async tryStartNewGame(entry: ModuleEntry) {
        const save = loadGame(entry.moduleEntryData.id);
        if (save) {
            await this.showExistingSavePrompt(entry);
            return;
        }
        await this.startGame(entry.moduleEntryData);
    }

    private async showExistingSavePrompt(entry: ModuleEntry) {
        const prompt = createCustomElement(PromptWindowElement);
        prompt.setTitle('Save Detected!');
        prompt.setBodyText('You already have an existing save. \nYou can resume from this save or start a new game.');
        const id = await prompt.setButtons([
            { text: 'Resume', type: 'utility', waitId: 'continue' },
            { text: 'New Game', type: 'confirm', waitId: 'new' },
            { text: 'Cancel', type: 'cancel', waitId: 'cancel' },
        ], 'horizontal');
        if (id === 'continue') {
            const save = loadGame(entry.moduleEntryData.id);
            assertDefined(save);
            await this.startSavedGame(save);
        } else if (id === 'new') {
            const saves = loadGame();
            saves.delete(entry.moduleEntryData.id);
            saveGame(saves);
            await this.tryStartNewGame(entry);
        }
    }
}
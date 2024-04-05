import { NewGame } from './NewGame';
import { LoadGame } from './LoadGame';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';

export class Home {
    private readonly page = document.querySelectorStrict<HTMLElement>('[data-page-content="home"]');
    private loadGame: LoadGame;
    constructor() {
        const menu = createCustomElement(TabMenuElement);

        this.page.appendChild(menu);

        const mainView = document.createElement('div');
        mainView.classList.add('main-view');
        mainView.setAttribute('data-main-view', '');
        this.page.appendChild(mainView);

        const newGameMenuButton = document.createElement('li');
        newGameMenuButton.textContent = 'New Game';
        const newGame = new NewGame();
        menu.addMenuItem('New', 'new');
        menu.registerPageElement(newGame.page, 'new');
        mainView.appendChild(newGame.page);

        const loadGameMenuButton = document.createElement('li');
        loadGameMenuButton.textContent = 'Load Game';
        this.loadGame = new LoadGame();
        menu.addMenuItem('Load', 'load');
        menu.registerPageElement(this.loadGame.page, 'load');
        mainView.appendChild(this.loadGame.page);

        newGameMenuButton.click();
    }

    async init() {
        await this.loadGame.tryLoadRecentSave();
    }
}
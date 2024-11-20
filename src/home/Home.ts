import { NewGame } from './NewGame';
import { LoadGame } from './LoadGame';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';

export class Home {
    private readonly page: HTMLElement;
    private loadGame: LoadGame;
    constructor() {

        this.page = document.createElement('main');
        this.page.classList.add('p-home');
        this.page.setAttribute('data-page-content', 'home');

        this.page.insertAdjacentHTML('beforeend', '<span class="title" data-game-title>Modero</span>');

        const menu = createCustomElement(TabMenuElement);

        this.page.appendChild(menu);

        const newGameMenuButton = document.createElement('li');
        newGameMenuButton.textContent = 'New Game';
        const newGame = new NewGame();
        menu.addMenuItem('New', 'new');
        menu.registerPageElement(newGame.page, 'new');
        this.page.appendChild(newGame.page);

        const loadGameMenuButton = document.createElement('li');
        loadGameMenuButton.textContent = 'Load Game';
        this.loadGame = new LoadGame();
        menu.addMenuItem('Load', 'load');
        menu.registerPageElement(this.loadGame.page, 'load');
        this.page.appendChild(this.loadGame.page);

        newGameMenuButton.click();

        document.body.insertAdjacentElement('afterbegin', this.page);
    }

    async init() {
        await this.loadGame.tryLoadRecentSave();
    }
}
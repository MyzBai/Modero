import '../extensions/arrayExtensions';
import '../extensions/DOMExtensions';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import gameModRegistry from './gameConfig/gameModRegistry.json';
import { World } from './combat/World';
import { Combat } from './combat/Combat';
import { Components } from './components/Components';
import { Player } from './Player';
import { Statistics } from './statistics/Statistics';
import type { Serialization, UnsafeSerialization } from './serialization';
import { createGameStats, deserializeStats, serializeStats } from './statistics/stats';
import { GAME_CONFIG_VERSION, type GameConfig } from './gameConfig/GameConfig';
import { Loop } from '../shared/utils/Loop';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import { isNonNullable } from 'src/shared/utils/utils';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { ENVIRONMENT, resolveGamePathFromVersion } from 'src/config';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { initDevTools } from 'src/game/dev';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';
import { Notifications } from './Notifications';
import { Trials } from './trials/Trials';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { createModEntryInfoElement } from 'src/home/dom';

export const mainMenuNames = ['combat', 'skills', 'weapon', 'treasury', 'guildHall', 'trials', 'achievements', 'statistics', 'notifications'] as const;

export const enum GameInitializationStage {
    None = 0,
    Init = 1,
    Deserialize = 2,
    Setup = 3,
    Done = 4
}

export class Game {
    readonly pageShadowHost: HTMLElement;
    readonly page: HTMLElement;
    readonly components = new Components();
    readonly tickSecondsEvent = new EventEmitter<void>();
    private _gameConfig: GameConfig | null = null;
    private _gameConfigId?: string;
    readonly stats = createGameStats();
    private _initializationStage = GameInitializationStage.None;
    constructor() {

        this.pageShadowHost = document.createElement('div');
        this.pageShadowHost.classList.add('game-page-shadow-host');
        this.pageShadowHost.setAttribute('data-page-content', 'game');
        this.pageShadowHost.setAttribute('data-game-page-shadow-host', '');
        const shadowRoot = this.pageShadowHost.attachShadow({ mode: 'open' });
        this.page = document.createElement('main');
        this.page.classList.add('p-game');
        shadowRoot.appendChild(this.page);
        document.body.appendChild(this.pageShadowHost);

        this.page.insertAdjacentHTML('beforeend', '<span class="title" onclick="location.hash = \'home\'">Idle Ascension</span>');

        //combat overview
        const combatOverview = document.createElement('div');
        combatOverview.classList.add('s-combat-overview');
        combatOverview.setAttribute('data-combat-overview', '');

        const playerBar = document.createElement('div');
        playerBar.classList.add('s-player-bar');
        playerBar.insertAdjacentHTML('beforeend', '<span class="player-name" data-player-name>Player</span>');
        const manabar = createCustomElement(ProgressElement);
        manabar.classList.add('s-mana-bar');
        manabar.setAttribute('data-mana-bar', '');
        playerBar.appendChild(manabar);

        const enemyBar = document.createElement('div');
        enemyBar.setAttribute('data-enemy', '');
        enemyBar.classList.add('s-enemy-bar');
        enemyBar.insertAdjacentHTML('beforeend', '<span class="enemy-name" data-enemy-name></span>');
        const lifebar = createCustomElement(ProgressElement);
        lifebar.classList.add('s-life-bar');
        lifebar.setAttribute('data-life-bar', '');
        enemyBar.appendChild(lifebar);

        combatOverview.append(playerBar, enemyBar);
        this.page.appendChild(combatOverview);


        const modTitleElement = document.createElement('span');
        modTitleElement.classList.add('title');
        modTitleElement.setAttribute('data-mod-title', '');
        modTitleElement.addEventListener('click', () => {
            const modEntry = gameModRegistry.list.findStrict(x => x.id === this.gameConfigId);
            const modal = createCustomElement(ModalElement);
            modal.setTitle(this.gameConfigName ?? 'undefined');
            modal.setBodyElement(createModEntryInfoElement(modEntry).contentElement);
            modal.style.textAlign = 'center';
        });
        this.page.appendChild(modTitleElement);

        //menu
        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setAttribute('data-main-menu', '');
        this.page.appendChild(menu);

        //stats
        this.page.insertAdjacentHTML('beforeend', '<ul class="sticky-stat-group-list g-scroll-list-v" data-sticky-stat-group-list></ul>');


        window.addEventListener('beforeunload', () => {
            if (this._gameConfigId && loadGame().has(this._gameConfigId)) {
                this.saveGame();
            }
        });
    }

    get menu() {
        return this.page.querySelectorStrict<TabMenuElement>(TabMenuElement.name);
    }

    get gameConfig() {
        assertDefined(this._gameConfig, 'gameConfig is not available');
        return this._gameConfig;
    }

    get hasGameConfig() {
        return !!this._gameConfig;
    }

    get gameConfigId() {
        return this._gameConfigId;
    }

    get gameConfigName() {
        return gameModRegistry.list.find(x => x.id === this.gameConfigId)?.name;
    }

    get initializationStage() {
        return this._initializationStage;
    }

    get maxLevel() {
        assertDefined(this._gameConfig);
        return this._gameConfig.enemyBaseLifeList.length + 1;
    }

    async init(gameConfig: GameConfig, gameConfigId: string, save?: UnsafeSerialization) {

        if (this._gameConfig) {
            this.reset();
        }

        this._gameConfigId = gameConfigId;
        this._gameConfig = gameConfig;

        statistics.createGroup('General', this.stats);

        this._initializationStage = GameInitializationStage.Init;


        //Init
        statistics.init();
        combat.init();
        player.init();
        this.components.init();

        //UI
        this.page.querySelectorStrict<HTMLElement>('[data-page-target="combat"]').click();

        //Deserialize
        if (save) {
            this._initializationStage = GameInitializationStage.Deserialize;
            this.deserialize(save);
        }

        this._initializationStage = GameInitializationStage.Setup;

        trials.setup();
        //Setup
        player.setup();
        world.setup();
        combat.effectHandler.setup();
        this.components.setup();

        this.saveGame();

        statistics.updateAll();

        //Events
        player.stats.level.addListener('change', ({ curValue }) => this.stats.maxLevel.set(Math.max(curValue, this.stats.maxLevel.value)));

        //Per second loop
        gameLoop.registerCallback(() => {
            this.tickSecondsEvent.invoke(undefined);
        }, { delay: 1000 });

        //time played
        this.tickSecondsEvent.listen(() => {
            this.stats.timePlayed.add(1);
        });

        gameLoop.registerCallback(() => {
            this.saveGame();
        }, { delay: 1000 * 10 });

        if (ENVIRONMENT !== 'development') {
            gameLoop.start();
            gameLoopAnim.start();
        }

        const configName = gameModRegistry.list.find(x => x.id === gameConfigId)?.name ?? 'undefined';
        this.page.querySelectorStrict('[data-mod-title]').textContent = configName;
        await this.loadPage();
        this._initializationStage = GameInitializationStage.Done;
    }

    private async loadPage(): Promise<void> {
        document.body.appendChild(this.pageShadowHost);
        this.pageShadowHost.shadowRoot?.querySelector('link[rel="stylesheet"]')?.remove();
        return new Promise((resolve, error) => {
            const linkElement = document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', resolveGamePathFromVersion(GAME_CONFIG_VERSION, 'style.css'));
            linkElement.addEventListener('error', () => error(), { once: true });
            linkElement.addEventListener('load', () => resolve(), { once: true });
            this.page.appendChild(linkElement);
        });
    }

    private reset() {
        this.components.reset();
        this.tickSecondsEvent.removeAllListeners();
        gameLoop.reset();
        gameLoopAnim.reset();
        Object.values(this.stats).forEach(x => x.reset());
        world.reset();
        combat.reset();
        player.reset();
        statistics.reset();
        notifications.reset();
    }

    async softReset() {
        assertNonNullable(game.gameConfig);
        assertDefined(game.gameConfigId);

        this.saveGame();

        const save = loadGame(game.gameConfigId) as UnsafeSerialization;
        assertDefined(save);

        const newSave: UnsafeSerialization = {
            ...save.meta,
            guildHall: { ...save.guildHall, classId: undefined },
            game: { stats: save.game?.stats }
        };

        void await game.init(game.gameConfig, game.gameConfigId, newSave);
    }

    addPage(pageElement: HTMLElement, label: string, id: typeof mainMenuNames[number]) {
        const menuItem = this.menu.addMenuItem(label, id, mainMenuNames.indexOf(id));
        this.menu.registerPageElement(pageElement, id);
        this.menu.after(pageElement);
        this.menu.sort();
        return { menuItem };
    }

    addElementHighlight(id: string, onRemove?: () => void): void;
    addElementHighlight(element: HTMLElement, onRemove?: () => void): void;
    addElementHighlight(arg: string | HTMLElement, onRemove?: () => void) {
        const element = arg instanceof HTMLElement ? arg : this.page.querySelector<HTMLElement>(`[data-id="${arg}"]`);
        if (!element || element.classList.contains('selected')) {
            return;
        }
        element.setAttribute('data-highlight', '');
        const removeHighlight = ((e: MouseEvent) => {
            if (e.type === 'mouseover' && !e.ctrlKey) {
                return;
            }
            element.removeAttribute('data-highlight');
            this.updateHighlightMenuItems(element);
            element.removeEventListener('click', removeHighlight);
            element.removeEventListener('mouseover', removeHighlight);
            onRemove?.();
        }).bind(this);
        element.addEventListener('click', removeHighlight);
        element.addEventListener('mouseover', removeHighlight);
        this.updateHighlightMenuItems(element);
    }

    removeHighlightElement(id: string): void;
    removeHighlightElement(element: HTMLElement): void;
    removeHighlightElement(arg: string | HTMLElement) {
        const element = arg instanceof HTMLElement ? arg : this.page.querySelector<HTMLElement>(`[data-id="${arg}"]`);
        if (!element) {
            return;
        }
        element.removeAttribute('data-highlight');
        this.updateHighlightMenuItems(element);
    }

    clearHighlights() {
        this.page.querySelectorAll('[data-highlight]').forEach(x => x.removeAttribute('data-highlight'));
    }

    private updateHighlightMenuItems(element: HTMLElement) {
        for (const [menuItem, pageElement] of this.menu.generateTabMenuAnectors(element)) {
            const pageId = menuItem.getAttribute('data-page-target');
            const highlightedElementsCount = pageElement.querySelector(`[data-page-content="${pageId}"]`)?.querySelectorAll('[data-highlight]').length ?? 0;
            menuItem.toggleAttribute('data-highlight', highlightedElementsCount > 0);
        }
    }

    saveGame() {
        assertDefined(this._gameConfigId);
        const saves = loadGame();

        const oldSave = saves.get(this._gameConfigId);

        const serialization: Serialization = {
            meta: { gameConfigId: this._gameConfigId, createdAt: oldSave?.meta?.createdAt || Date.now(), lastSavedAt: Date.now() }
        };

        this.serialize(serialization);

        saves.set(this._gameConfigId, serialization);

        saveGame(saves);
    }

    dispose() {
        this.pageShadowHost.remove();
    }

    serialize(save: Serialization) {
        save.game = { stats: serializeStats(this.stats) };
        world.serialize(save);
        statistics.serialize(save);
        player.serialize(save);
        combat.effectHandler.serialize(save);
        notifications.serialize(save);
        this.components.serialize(save);

        save.elementHighlightIdList = [...game.page.querySelectorAll('[data-highlight]')].map(x => x.getAttribute('data-id')).filter(isNonNullable);

        const name = this.menu.querySelectorStrict('.selected')?.getAttribute('data-page-target');
        sessionStorage.setItem('main-menu', name || '');
    }

    private deserialize(save: UnsafeSerialization) {
        for (const id of save.elementHighlightIdList ?? []) {
            if (id) {
                this.addElementHighlight(id);
            }
        }

        deserializeStats(game.stats, save.game?.stats || {});
        statistics.deserialize(save);
        player.deserialize(save);

        this.components.deserialize(save);

        world.deserialize(save);

        combat.effectHandler.deserialize(save);
        notifications.deserialize(save);

        this.menu.querySelector<HTMLElement>(`[data-page-target="${sessionStorage.getItem('main-menu')}"]`)?.click();
    }
}

export const gameLoop = new Loop('Default');
export const gameLoopAnim = new Loop('Animation');

export const game = new Game();
export const statistics = new Statistics();
export const combat = new Combat();
export const world = new World();
export const player = new Player();
export const notifications = new Notifications();
export const trials = new Trials();

export async function init(args: [...Parameters<typeof game['init']>]) {
    await game.init(args[0], args[1], args[2]);

    document.addEventListener('visibilitychange', toggleLoopType);

    if (ENVIRONMENT === 'development') {
        window.idleAscension = { ...window.idleAscension, ...initDevTools() };
    } else {
        document.querySelector('[data-live-server-proxy]')?.remove();
    }
}

export function dispose() {
    game.dispose();
    if (ENVIRONMENT === 'development') {
        window.idleAscension.dispose();
    }
}

function toggleLoopType() {
    if (document.hidden) {
        gameLoop.setLoopType('WebWorker');
    } else {
        gameLoop.setLoopType('Default');
    }
}
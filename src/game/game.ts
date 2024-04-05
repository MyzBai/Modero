import '../arrayExtensions';
import '../DOMExtensions';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import moduleList from './gameModule/moduleList.json';
import { World } from './combat/World';
import { Combat } from './combat/Combat';
import { Components } from './components/Components';
import { Player } from './Player';
import { Statistics } from './statistics/Statistics';
import type { Serialization, UnsafeSerialization } from './serialization/serialization';
import { createGameStats, createResourceStats, deserializeStats, serializeStats, type ResourceStatCollection } from './statistics/stats';
import { GAME_MODULE_VERSION, type GameModule } from './gameModule/GameModule';
import { Loop } from '../shared/utils/Loop';
import { TabMenuElement } from 'src/shared/customElements/TabMenuElement';
import { isNonNullable } from 'src/shared/utils/helpers';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { ENVIRONMENT, resolveGamePathFromVersion } from 'src/config';
import { createCustomElement } from 'src/shared/customElements/customElements';
import type { TS } from 'src/global';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';
import { Notifications } from './Notifications';

const DOCUMENT_TITLE = 'Idle Ascension';
const updateDocumentTitle = () => document.title = `${DOCUMENT_TITLE} (${gameLoop.state})`;

export class Game {
    readonly page: HTMLElement;
    readonly components = new Components();
    readonly tickSecondsEvent = new EventEmitter<undefined>();
    private _module: GameModule | null = null;
    private _moduleId?: string;
    readonly stats = createGameStats();
    private _resources: ResourceStatCollection = {};

    constructor() {
        this.page = this.createPage();
    }

    get menu() {
        return this.page.querySelectorStrict<TabMenuElement>('[data-main-menu]');
    }

    get module() {
        return this._module;
    }

    get hasModule() {
        return !!this._module;
    }

    get moduleId() {
        return this._moduleId;
    }

    get resources() {
        return this._resources;
    }

    get maxLevel() {
        assertDefined(this._module);
        return this._module.enemyBaseLifeList.length + 1;
    }

    async init(module: GameModule, moduleId: string, save?: UnsafeSerialization) {
        if (this._module) {
            this.reset();
        }

        this._moduleId = moduleId;
        const moduleName = moduleList.list.findStrict(x => x.id === moduleId).name;
        this._module = module;

        statistics.createGroup('General', this.stats);
        if (module.resourceList) {
            this._resources = createResourceStats(module.resourceList);
            statistics.createGroup('Resources', this.resources);
        }

        //Init
        statistics.init();
        combat.init();
        player.init();
        this.components.init();

        //UI
        this.page.querySelectorStrict('[data-module-name]').textContent = moduleName;
        this.page.querySelectorStrict<HTMLElement>('[data-page-target="combat"]').click();

        //Deserialize
        if (save) {
            this.deserialize(save);
        }

        //Setup
        player.setup();
        world.setup();
        combat.effectHandler.setup();
        this.components.setup();

        await this.saveGame();

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
            // document.title = `${combat.stats.enemyCount.value.toFixed()}/${combat.stats.maxEnemyCount.value.toFixed()}`;
        });

        gameLoop.registerCallback(async () => {
            await this.saveGame();
        }, { delay: 1000 * 10 });

        if (ENVIRONMENT !== 'development') {
            gameLoop.start();
            gameLoopAnim.start();
        }

        document.body.appendChild(this.page);
        await this.createStyle();
    }

    private createPage() {
        const element = document.createElement('main');
        element.classList.add('p-game', 'hidden');
        element.setAttribute('data-page-content', 'game');

        //home button
        const homeButton = document.createElement('button');
        homeButton.textContent = 'Home';
        homeButton.addEventListener('click', () => location.hash = '#home');
        element.appendChild(homeButton);
        //combat overview
        const combatOverview = document.createElement('div');
        combatOverview.classList.add('s-combat-overview');
        combatOverview.setAttribute('data-combat-overview', '');
        combatOverview.insertAdjacentHTML('beforeend', '<span class="enemy-name" data-enemy-name></span>');
        combatOverview.insertAdjacentHTML('beforeend', '<progress class="s-life-bar" data-life-bar value="1" max="1"></progress>');
        combatOverview.insertAdjacentHTML('beforeend', '<span class="player-name" data-player-name>Player</span>');
        combatOverview.insertAdjacentHTML('beforeend', '<progress class="s-mana-bar" data-mana-bar value="1" max="1"></progress>');
        element.appendChild(combatOverview);
        //title
        element.insertAdjacentHTML('beforeend', '<span class="title" data-module-name>Idle Ascension</span>');
        //menu
        const menu = createCustomElement(TabMenuElement);
        menu.classList.add('s-menu');
        menu.setAttribute('data-main-menu', '');
        element.appendChild(menu);
        //main view
        element.insertAdjacentHTML('beforeend', '<div data-main-view></div>');

        //stats
        element.insertAdjacentHTML('beforeend', '<ul class="sticky-stat-group-list" data-sticky-stat-group-list></ul>');

        return element;
    }

    private createStyle(): Promise<void> {
        this.page.querySelector('[data-game-style]')?.remove();
        return new Promise((resolve, error) => {
            const linkElement = document.createElement('link');
            linkElement.setAttribute('data-game-style', '');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', resolveGamePathFromVersion(GAME_MODULE_VERSION, 'style.css'));
            linkElement.addEventListener('error', () => error());
            linkElement.addEventListener('load', () => resolve());
            this.page.appendChild(linkElement);
        });
    }

    private reset() {
        this.components.reset();
        this.tickSecondsEvent.removeAllListeners();
        gameLoop.reset();
        gameLoopAnim.reset();
        Object.values(this.stats).forEach(x => x.reset());
        Object.values(this.resources).forEach(x => x.reset());
        world.restart();
        combat.reset();
        player.reset();
        statistics.reset();
        notifications.reset();
        updateDocumentTitle();

        game.page.remove();
    }

    async resetAscension() {
        assertNonNullable(game.module);
        assertDefined(game.moduleId);

        const save = loadGame(game.moduleId) as UnsafeSerialization;
        assertDefined(save);

        const newSave: UnsafeSerialization = {
            ...save.meta,
            ascension: save.ascension,
            game: { stats: save.game?.stats }
        };

        void await game.init(game.module, game.moduleId, newSave);
    }

    addPage(pageElement: HTMLElement, label: string, id: string, menuIndex: number) {
        const menuItem = this.menu.addMenuItem(label, id, menuIndex);
        this.menu.registerPageElement(pageElement, id);
        this.page.querySelectorStrict('[data-main-view]').appendChild(pageElement);
        const comparer = (a: HTMLElement, b: HTMLElement) => (a.getAttribute('data-index')?.localeCompare(b.getAttribute('data-index') || '', undefined, { numeric: true }) || 0);
        this.menu.sort(comparer);
        return { menuItem };
    }

    addElementHighlight(id: string, onRemove?: () => void): void;
    addElementHighlight(element: HTMLElement, onRemove?: () => void): void;
    addElementHighlight(arg: string | HTMLElement, onRemove?: () => void) {
        const element = arg instanceof HTMLElement ? arg : this.page.querySelector<HTMLElement>(`[data-id="${arg}"]`);
        if (!element) {
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

    private updateHighlightMenuItems(element: HTMLElement) {
        for (const menuItem of this.menu.generateTabMenuAncestorList(element)) {
            const pageId = menuItem.getAttribute('data-page-target');
            const page = menuItem.closest('[data-page-content]');
            const highlightedElementsCount = page?.querySelector(`[data-page-content="${pageId}"]`)?.querySelectorAll('[data-highlight]').length ?? 0;
            menuItem.toggleAttribute('data-highlight', highlightedElementsCount > 0);
        }
    }

    async saveGame() {
        assertDefined(this._moduleId);
        const saves = loadGame();

        const oldSave = saves.get(this._moduleId);

        const serialization: Serialization = {
            meta: { moduleId: this._moduleId, createdAt: oldSave?.meta?.createdAt || Date.now(), lastSavedAt: Date.now() }
        };

        this.serialize(serialization);

        saves.set(this._moduleId, serialization);

        saveGame(saves);
    }

    dispose() {
        this.page.remove();
    }

    serialize(save: Serialization) {
        save.game = { stats: serializeStats(this.stats), resources: serializeStats(this.resources) };
        world.serialize(save);
        statistics.serialize(save);

        player.serialize(save);

        combat.effectHandler.serialize(save);

        notifications.serialize(save);

        this.components.serialize(save);

        const name = this.menu.querySelectorStrict('.selected')?.getAttribute('data-page-target');
        sessionStorage.setItem('main-menu', name || '');

        save.elementHighlightIdList = [...game.page.querySelectorAll('[data-highlight]')].map(x => x.getAttribute('data-id')).filter(isNonNullable);
    }

    private deserialize(save: UnsafeSerialization) {
        for (const id of save.elementHighlightIdList ?? []) {
            if (id) {
                this.addElementHighlight(id);
            }
        }

        statistics.deserialize(save);
        deserializeStats(game.stats, save.game?.stats || {});
        deserializeStats(game.resources, save.game?.resources || {});
        player.deserialize(save);
        world.deserialize(save);
        this.components.deserialize(save);
        combat.effectHandler.deserialize(save);

        notifications.deserialize(save);

        this.menu.querySelector<HTMLElement>(`[data-page-target="${sessionStorage.getItem('main-menu')}"]`)?.click();
    }
}

export const gameLoop = new Loop();
export const gameLoopAnim = new Loop();
gameLoopAnim.setLoopType('Animation');

export const game = new Game();
export const statistics = new Statistics();
export const combat = new Combat();
export const world = new World();
export const player = new Player();
export const notifications = new Notifications();

export async function init(args: [...Parameters<typeof game['init']>, TS]) {
    await game.init(args[0], args[1], args[2]);

    setupGlobalScope(args[3]);
}


export function dispose(globalScope: TS) {
    game.page.remove();

    delete globalScope.game;

    document.body.removeEventListener('keydown', toggleLoop);
}

function setupGlobalScope(globalScope: TS) {
    document.addEventListener('visibilitychange', toggleLoopType);

    if (ENVIRONMENT === 'development') {
        console.log('Press Space to toggle GameLoop');
        document.body.addEventListener('keydown', toggleLoop);
        globalScope.game = {
            save: () => game.moduleId && game.saveGame(),
            printSave: () => game.moduleId && loadGame(game.moduleId),
            game,
            player,
            getEnemy: () => combat.enemy,
            setLevel: (level: number) => player.stats.level.set(level),
            addResource: (type: string, value: number) => {
                game.resources[type]?.add(value);
            },
            skipTime: (time, units: 'ms' | 'sec' | 'min' = 'ms') => {
                switch (units) {
                    case 'sec': time *= 1000; break;
                    case 'min': time *= 1000 * 60; break;
                }
                console.time('Skip Time');
                gameLoop.skipTime(time);
                console.timeEnd('Skip Time');
            }
        };
    }

}

function toggleLoopType() {
    if (document.hidden) {
        gameLoop.setLoopType('WebWorker');
    } else {
        gameLoop.setLoopType('Default');
    }
}

function toggleLoop(e: KeyboardEvent) {
    if (e.code !== 'Space') {
        return;
    }
    e.preventDefault();
    gameLoop.toggleState();
    gameLoopAnim.toggleState();
    updateDocumentTitle();
}
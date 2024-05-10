import { GameInitializer } from './GameInitializer';
import type { Meta, UnsafeSerialization } from 'src/game/serialization';
import gameModRegistry from '../game/gameConfig/gameModRegistry.json';
import { assertDefined } from 'src/shared/utils/assert';
import { loadGame } from 'src/shared/utils/saveManager';
import { getFormattedTimeSince } from 'src/shared/utils/date';
import { createModEntryInfoElement } from './dom';

interface SaveEntry {
    id: string;
    meta: Meta;
    gameModEntryData: typeof gameModRegistry.list[number];
    element: HTMLElement;
}

const sortMetaListBySaveTime = (a: UnsafeSerialization['meta'] | undefined, b: UnsafeSerialization['meta'] | undefined) => (b?.lastSavedAt || Number.POSITIVE_INFINITY) - (a?.lastSavedAt || Number.POSITIVE_INFINITY);

export class LoadGame extends GameInitializer {
    readonly page: HTMLElement;
    readonly saveEntryList: SaveEntry[] = [];
    constructor() {
        super();

        this.page = document.createElement('div');
        this.page.classList.add('p-load-game');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Saved Games</div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="entry-list g-scroll-list-v" data-entry-list></ul>');
        this.page.insertAdjacentHTML('beforeend', '<div data-mod-entry-info></div>');

        this.loadSaveDataList();

        const observer = new MutationObserver(() => {
            if (!this.page.classList.contains('hidden')) {
                this.loadSaveDataList();
            }
        });
        observer.observe(this.page, { attributes: true, attributeFilter: ['class'] });
    }

    private loadSaveDataList() {
        const saves = loadGame();
        const saveValues = [...saves.values()];
        this.saveEntryList.splice(0);
        const gameModEntryIdList = gameModRegistry.list.map(x => x.id);
        const metaList = saveValues.map(x => x.meta).filter(x => x?.gameConfigId && gameModEntryIdList.includes(x.gameConfigId));
        metaList.sort(sortMetaListBySaveTime);
        for (const [id, { meta }] of saves) {
            if (!meta || !meta.gameConfigId) {
                continue;
            }
            const gameModEntryData = gameModRegistry.list.find(x => x.id === meta.gameConfigId);
            if (!gameModEntryData) {
                continue;
            }
            const element = document.createElement('li');
            element.classList.add('g-list-item');

            const formattedTime = getFormattedTimeSince(meta.lastSavedAt || Date.now());
            element.insertAdjacentHTML('beforeend', `<div>${gameModEntryData?.name}</div><var data-tag="mute">${formattedTime}</var>`);
            element.addEventListener('click', () => this.selectEntryById(meta.gameConfigId));

            const entry: SaveEntry = {
                id,
                meta: { gameConfigId: meta.gameConfigId, ...meta },
                gameModEntryData: gameModEntryData,
                element
            };
            this.saveEntryList.push(entry);
        }
        this.page.querySelectorStrict('[data-entry-list]').replaceChildren(...this.saveEntryList.map(x => x.element));
        this.selectEntryById(this.saveEntryList[0]?.id);
    }

    private selectEntryById(id: string | undefined) {
        const entry = this.saveEntryList.find(x => x.meta.gameConfigId === id);
        this.showEntry(entry);
        this.saveEntryList.forEach(x => x.element.classList.toggle('selected', x === entry));
    }

    private showEntry(entry: SaveEntry | undefined) {
        if (!entry) {
            this.page.querySelector('[data-mod-entry-info]')?.remove();
            return;
        }

        const modEntryInfoElements = createModEntryInfoElement(entry.gameModEntryData);
        this.page.querySelector('[data-mod-entry-info]')?.replaceWith(modEntryInfoElements.element) ?? this.page.appendChild(modEntryInfoElements.element);

        const resumeButton = document.createElement('button');
        resumeButton.setAttribute('data-role', 'confirm');
        resumeButton.textContent = 'Resume';
        resumeButton.addEventListener('click', async () => {
            const save = loadGame().get(entry.id);
            assertDefined(save);
            await this.startSavedGame(save);
        });
        modEntryInfoElements.contentElement.appendChild(resumeButton);

        const removeButton = document.createElement('button');
        removeButton.setAttribute('data-role', 'cancel');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            this.deleteSaveById(entry.id);
            this.loadSaveDataList();
        });
        modEntryInfoElements.contentElement.appendChild(removeButton);
    }

    async tryLoadRecentSave(): Promise<void> {
        const saves = loadGame();
        const saveList = [...saves.values()];
        saveList.sort((a, b) => sortMetaListBySaveTime(a.meta, b.meta));
        const save = saveList[0];
        if (!save || !gameModRegistry.list.some(x => x.id === save.meta?.gameConfigId)) {
            return;
        }
        await this.startSavedGame(save);
    }
}
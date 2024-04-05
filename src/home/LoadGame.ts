import { GameInitializer } from './GameInitializer';
import type { Meta, UnsafeSerialization } from 'src/game/serialization/serialization';
import { generateTime } from 'src/shared/utils/helpers';
import moduleList from '../game/gameModule/moduleList.json';
import { assertDefined } from 'src/shared/utils/assert';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';

interface SaveEntry {
    id: string;
    meta: Meta;
    moduleEntryData: typeof moduleList.list[number];
    element: HTMLElement;
}

const sortMetaListBySaveTime = (a: UnsafeSerialization['meta'] | undefined, b: UnsafeSerialization['meta'] | undefined) => (b?.lastSavedAt || Number.POSITIVE_INFINITY) - (a?.lastSavedAt || Number.POSITIVE_INFINITY);

export class LoadGame extends GameInitializer {
    readonly page: HTMLElement;
    readonly saveEntryList: SaveEntry[] = [];
    private cachedSaveCount?: number;
    constructor() {
        super();

        this.page = document.createElement('div');
        this.page.classList.add('p-load-game');
        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Saved Games</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-entry-info" data-entry-info></div>');
        this.page.insertAdjacentHTML('beforeend', '<ul class="entry-list" data-entry-list></ul>');

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
        if (this.cachedSaveCount === saveValues.length) {
            return;
        }
        this.cachedSaveCount = saveValues.length;
        this.saveEntryList.splice(0);
        const moduleEntryIdList = moduleList.list.map(x => x.id);
        const metaList = saveValues.map(x => x.meta).filter(x => x?.moduleId && moduleEntryIdList.includes(x.moduleId));
        metaList.sort(sortMetaListBySaveTime);
        for (const [id, { meta }] of saves) {
            if (!meta || !meta.moduleId) {
                continue;
            }
            const moduleEntryData = moduleList.list.find(x => x.id === meta.moduleId);
            if (!moduleEntryData) {
                continue;
            }
            const element = document.createElement('li');
            element.classList.add('g-list-item');

            const time = generateTime(meta.lastSavedAt || Date.now());
            const formattedTime = time.days ? `${time.days}d` : time.hours ? `${time.hours}h` : `${time.mins}min`;
            element.insertAdjacentHTML('beforeend', `<div>${moduleEntryData?.name}</div><var data-tag="mute">${formattedTime}</var>`);
            element.addEventListener('click', () => this.selectEntryById(meta.moduleId));

            const entry: SaveEntry = {
                id,
                meta: { moduleId: meta.moduleId, ...meta },
                moduleEntryData,
                element
            };
            this.saveEntryList.push(entry);
        }
        this.page.querySelectorStrict('[data-entry-list]').replaceChildren(...this.saveEntryList.map(x => x.element));
        this.selectEntryById(this.saveEntryList[0]?.id);
    }

    private selectEntryById(id: string | undefined) {
        const entry = this.saveEntryList.find(x => x.meta.moduleId === id);
        this.showEntry(entry);
        this.saveEntryList.forEach(x => x.element.classList.toggle('selected', x === entry));
    }

    private showEntry(entry: SaveEntry | undefined) {
        const element = this.page.querySelectorStrict('[data-entry-info]');
        element.replaceChildren();
        if (!entry) {
            return;
        }
        element.insertAdjacentHTML('beforeend', `<div class="g-title">${entry.moduleEntryData.name}</div>`);

        element.insertAdjacentHTML('beforeend', `<div class="s-desc">${entry.moduleEntryData.description}</div>`);

        const resumeButton = document.createElement('button');
        resumeButton.setAttribute('data-role', 'confirm');
        resumeButton.textContent = 'Resume';
        resumeButton.addEventListener('click', async () => {
            const save = loadGame().get(entry.id);
            assertDefined(save);
            await this.startSavedGame(save);
        });
        element.appendChild(resumeButton);

        const removeButton = document.createElement('button');
        removeButton.setAttribute('data-role', 'cancel');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', async () => {
            const saves = loadGame();
            saves.delete(entry.id);
            saveGame(saves);
            this.loadSaveDataList();
        });
        element.appendChild(removeButton);
    }

    async tryLoadRecentSave(): Promise<void> {
        const saves = loadGame();
        const saveList = [...saves.values()];
        saveList.sort((a, b) => sortMetaListBySaveTime(a.meta, b.meta));
        const save = saveList[0];
        if (!save || !moduleList.list.some(x => x.id === save.meta?.moduleId)) {
            return;
        }
        await this.startSavedGame(save);
    }
}
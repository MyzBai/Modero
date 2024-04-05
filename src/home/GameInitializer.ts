import moduleList from '../game/gameModule/moduleList.json';
import { isString } from 'src/shared/utils/helpers';
import type * as GameSerialization from 'src/game/serialization/serialization';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { validateModule } from 'src/game/gameModule/validate';
import { resolveGamePathFromVersion } from 'src/config';
import type * as game from 'src/game/game';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';

interface GameInstance {
    init: (...args: Parameters<typeof game.init>) => Promise<void>;
    dispose: (...args: Parameters<typeof game.dispose>) => void;
}

export abstract class GameInitializer {
    private static activeGameInstance?: GameInstance;

    protected async startGame(moduleEntry: typeof moduleList.list[number], useSave?: boolean) {
        try {
            const id = moduleEntry.id;
            const entryUrl = moduleList.list.findStrict(x => x.id === id).url;
            const moduleText = await this.getModuleText(entryUrl);
            if (!moduleText) {
                return;
            }

            const module = await validateModule(moduleText);
            if (isString(module)) {
                console.error(module);
                return;
            }

            const save = useSave ? loadGame(id) : undefined;

            const path = resolveGamePathFromVersion(module.version, 'game.js');
            const url = new URL(path, window.location.href).href;

            GameInitializer.activeGameInstance?.dispose(window.TS);
            GameInitializer.activeGameInstance = await import(url);
            assertNonNullable(GameInitializer.activeGameInstance);
            await GameInitializer.activeGameInstance.init([module, id, save, window.TS]);
            document.querySelectorStrict<HTMLElement>('[data-return-to-game-button]').style.visibility = 'visible';
            location.hash = '#game';
        } catch (error) {
            console.error(error);
            throw 'Failed to start game';
        }
    }

    protected async startSavedGame(save: GameSerialization.UnsafeSerialization) {
        const entry = moduleList.list.find(x => x.id === save.meta?.moduleId);
        assertDefined(entry, 'invalid id');
        await this.startGame(entry, true);
    }

    private async getModuleText(url: string): Promise<string | null> {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`failed to get the module at (${url})`);
            return null;
        }
        return await response.text();
    }

    protected async deleteSaveById(...ids: string[]) {
        const saves = loadGame();
        if (saves) {
            ids.forEach(x => saves.delete(x));
            saveGame(saves);
        }
    }
}
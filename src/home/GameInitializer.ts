import gameModRegistry from '../game/gameConfig/gameModRegistry.json';
import { isString } from 'src/shared/utils/utils';
import type * as GameSerialization from 'src/game/serialization';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { validateGameConfig } from 'src/game/gameConfig/validate';
import { resolveGamePathFromVersion } from 'src/config';
import type * as game from 'src/game/game';
import { loadGame, saveGame } from 'src/shared/utils/saveManager';

interface GameInstance {
    init: (...args: Parameters<typeof game.init>) => Promise<void>;
    dispose: (...args: Parameters<typeof game.dispose>) => void;
}

export abstract class GameInitializer {
    private static activeGameInstance?: GameInstance;

    protected async startGame(gameModEntry: typeof gameModRegistry.list[number], useSave?: boolean) {
        try {
            const id = gameModEntry.id;
            const entryUrl = gameModRegistry.list.findStrict(x => x.id === id).url;
            const gameConfigText = await this.getGameConfigText(entryUrl);
            if (!gameConfigText) {
                return;
            }

            const gameConfig = await validateGameConfig(gameConfigText);
            if (isString(gameConfig)) {
                console.error(gameConfig);
                return;
            }

            const save = useSave ? loadGame(id) : undefined;

            const path = resolveGamePathFromVersion(gameConfig.version, 'game.js');
            const url = new URL(path, window.location.href).href;

            GameInitializer.activeGameInstance?.dispose();
            GameInitializer.activeGameInstance = await import(url);
            assertNonNullable(GameInitializer.activeGameInstance);
            await GameInitializer.activeGameInstance.init([gameConfig, id, save]);
            location.hash = 'game';
        } catch (error) {
            console.error(error);
            throw 'Failed to start game';
        }
    }

    protected async startSavedGame(save: GameSerialization.UnsafeSerialization) {
        const entry = gameModRegistry.list.find(x => x.id === save.meta?.gameConfigId);
        assertDefined(entry, 'invalid id');
        await this.startGame(entry, true);
    }

    private async getGameConfigText(url: string): Promise<string | null> {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`failed to get the gameConfig at (${url})`);
            return null;
        }
        return await response.text();
    }

    protected deleteSaveById(...ids: string[]) {
        const saves = loadGame();
        if (saves) {
            ids.forEach(x => saves.delete(x));
            saveGame(saves);
        }
    }
}
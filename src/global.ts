import type { Enemy } from './game/combat/Enemy';
import type { Game } from './game/game';
import type { Player } from './game/Player';
import type { ResourceName } from './game/gameModule/GameModule';

declare global {
    interface Window {
        TS: TS;
    }

    interface ParentNode extends Node {
        querySelectorStrict<E extends Element = Element>(selectors: string): E;
    }
    interface Element extends Node {
        getAttributeStrict(selectors: string): string;
    }

    interface Array<T> {
        remove(item: T): boolean;
        clear(): void;
        random(): T;
        findStrict(predicate: (value: T, index: number, obj: readonly T[]) => unknown, thisArg?: unknown): T;
    }
    interface ReadonlyArray<T> {
        findStrict(predicate: (value: T, index: number, obj: readonly T[]) => unknown, thisArg?: unknown): T;
    }
}

export interface TS {
    game?: {
        save: () => void;
        printSave: () => void;
        game: Game;
        player: Player;
        getEnemy?: () => Enemy | undefined;
        setLevel: (number: number) => void;
        addResource: (type: Lowercase<ResourceName>, value: number) => void;
        skipTime: (time: number, units: 'ms' | 'sec' | 'min') => void;
    };
}

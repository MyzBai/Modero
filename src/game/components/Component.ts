
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import { game } from '../game';
import type { Serialization, UnsafeSerialization } from '../serialization';

export abstract class Component {
    readonly page: HTMLElement;
    constructor(readonly name: GameConfig.ComponentName) {
        this.page = document.createElement('div');
        this.page.classList.add(`p-${name}`, 'hidden');
        game.page.appendChild(this.page);
    }

    setup?(): void;
    dispose?(): void;
    serialize?(save: Serialization): void;
    deserialize?(save: UnsafeSerialization): void;
}
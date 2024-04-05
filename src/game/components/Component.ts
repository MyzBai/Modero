
import type * as GameModule from 'src/game/gameModule/GameModule';
import { game } from '../game';
import type { Serialization, UnsafeSerialization } from '../serialization/serialization';

export abstract class Component {
    readonly page: HTMLElement;
    constructor(readonly name: GameModule.ComponentName) {
        this.page = document.createElement('div');
        this.page.classList.add(`p-${name}`, 'hidden');
        game.page.querySelectorStrict('[data-main-view]').appendChild(this.page);
        this.page.setAttribute('data-page-content', name);
    }

    setup?(): void;
    serialize?(save: Serialization): void;
    deserialize?(save: UnsafeSerialization): void;
}
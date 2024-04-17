import { CombatArea, type CombatAreaOptions } from 'src/game/combat/CombatArea';
import { combat, game, notifications, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { assertNonNullable } from 'src/shared/utils/assert';

const states = ['invalid', 'Start', 'Trial', 'Ascend', 'Done'] as const;
type State = typeof states[number];

export class Ascend {
    readonly page: HTMLElement;
    private trialCompleted = false;
    private _zone?: CombatArea | null;
    private _state: State = 'invalid';
    constructor() {
        this.page = document.createElement('div');
        this.page.classList.add('p-ascend');

        const button = document.createElement('button');
        button.textContent = 'Begin Trial';
        button.setAttribute('data-ascend-button', '');
        button.addEventListener('click', () => {
            if (this.trialCompleted) {
                this.executeState('Ascend');
                return;
            }
            if (this._state === 'Start') {
                this.executeState('Trial');
            } else if (this._state === 'Trial') {
                this.cancelTrial();
                this.executeState('Start');
            }
        });
        this.page.appendChild(button);

        player.stats.level.addListener('change', (e) => {
            this.updateButton();
            if (e.curValue < game.maxLevel) {
                this.executeState('invalid');
                return;
            }
            this.executeState('Start');
        });
    }

    get state() {
        return this._state;
    }

    get zone() {
        return this._zone;
    }

    private updateButton() {
        const btn = this.page.querySelectorStrict('[data-ascend-button]');
        switch (this._state) {
            case 'Ascend': btn.textContent = 'Ascend'; break;
            case 'Trial': btn.textContent = 'Abort'; break;
            default: btn.textContent = 'Begin Trial'; break;
        }
        btn.toggleAttribute('disabled', this._state === 'invalid' || this._state === 'Done');
    }

    executeState(state: State) {
        this._state = state;
        this.updateButton();
        switch (state) {
            case 'Trial': this.startTrial(); break;
            case 'Ascend': void this.ascend(); break;
        }
    }

    private startTrial() {
        const trialData = game.gameConfig.ascension.trial;
        const zoneOptions: CombatAreaOptions = {
            name: 'Trial',
            enemyBaseLife: combat.enemyBaseLife,
            enemyBaseCount: trialData.enemyCount,
            enemyCountOverride: trialData.enemyCount === 1 ? 1 : undefined,
            candidates: trialData.enemyList,
            areaModList: []
        };
        this._zone = new CombatArea(zoneOptions);
        this._zone.onComplete.listen(() => {
            this._state = 'Ascend';
            this.trialCompleted = true;
            this.updateButton();
            this._zone = null;
        });
        combat.startZone(this._zone);
    }

    private cancelTrial() {
        assertNonNullable(this._zone);
        combat.stopZone();
        this._zone = null;
    }

    private async ascend() {
        this.executeState('invalid');
        this.trialCompleted = false;
        game.saveGame();
        await this.fadeOut();
        if (game.stats.ascensionCount.value >= (game.gameConfig.ascension.ascensionInstanceList?.length ?? 0)) {
            this._state = 'Done';
            await this.printEndScreen();
        } else {
            game.clearHighlights();
            game.saveGame();
            await game.resetForAscension();
            notifications.addNotification({ title: 'You Have Ascended!' });
            game.stats.ascensionCount.add(1);
            game.saveGame();
        }
        await this.fadeIn();
    }

    private async fadeOut(): Promise<void> {
        return new Promise((resolve) => {
            const fadeElement = document.createElement('div');
            fadeElement.setAttribute('data-ascension-fade', '');
            fadeElement.style.cssText = `
                    position: absolute;
                    inset: 0;
                    background-color: black;
                    z-index: 1000;
                    opacity: 0;
                    text-align: center;
                    padding-top: 5em;
                `;
            document.body.appendChild(fadeElement);
            const anim = fadeElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' });
            anim.addEventListener('finish', () => {
                resolve();
            });
        });
    }

    private async fadeIn(): Promise<void> {
        return new Promise((resolve) => {
            const fadeElement = document.body.querySelectorStrict('[data-ascension-fade]');
            const anim = fadeElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1000, fill: 'forwards' });
            anim.addEventListener('finish', () => {
                fadeElement.remove();
                resolve();
            });
        });
    }

    private async printEndScreen() {
        const fadeElement = document.body.querySelectorStrict<HTMLElement>('[data-ascension-fade]');
        fadeElement.insertAdjacentHTML('beforeend', 'Thank you for playing!');
        return new Promise<void>((resolve) => {
            fadeElement.addEventListener('click', () => {
                resolve();
            });
        });
    }

    serialize() {
        return { state: this._state, zone: this._zone?.serialize() };
    }

    deserialize(state?: string, zone?: DeepPartial<GameSerialization.Zone>) {
        this._state = state && states.includes(state as State) ? state as State : 'invalid';
        if (zone) {
            this.trialCompleted = false;
            this.executeState('Trial');
            this._zone?.deserialize(zone);
        } else if (this._state === 'Ascend' || this._state === 'Done') {
            this.trialCompleted = true;
        }
        this.updateButton();
    }
}
import { CombatArea, type CombatAreaOptions } from 'src/game/combat/CombatArea';
import { ascension, combat, game, gameLoop, player } from 'src/game/game';
import type * as GameSerialization from 'src/game/serialization';
import { assertNonNullable } from 'src/shared/utils/assert';

const states = ['invalid', 'Start', 'Trial', 'Ascend', 'Done'] as const;
type State = typeof states[number];

export class Ascend {
    readonly page: HTMLElement;
    private trialCompleted = false;
    private _combatArea?: CombatArea | null;
    private _state: State = 'invalid';
    private timeout = 0;
    private readonly timeoutElement: HTMLElement;
    private timeoutId?: string | null;
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

        this.timeoutElement = document.createElement('div');
        this.timeoutElement.classList.add('timeout');
        this.page.appendChild(this.timeoutElement);

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

    get combatArea() {
        return this._combatArea;
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
            case 'Ascend': this.ascend(); break;
        }
    }

    private startTrial() {
        const trialData = game.gameConfig.ascension.trial;
        const areaOptions: CombatAreaOptions = {
            name: 'Trial',
            enemyBaseLife: combat.enemyBaseLife,
            enemyBaseCount: trialData.enemyCount,
            enemyCountOverride: trialData.enemyCount === 1 ? 1 : undefined,
            candidates: trialData.enemyList,
            areaModList: []
        };
        this._combatArea = new CombatArea(areaOptions);
        this._combatArea.onComplete.listen(() => {
            this._state = 'Ascend';
            this.trialCompleted = true;
            this.updateButton();
            this._combatArea = null;
            this.stopTimeout();
        });
        combat.startArea(this._combatArea);
        this.startTimeout();
    }

    private cancelTrial() {
        assertNonNullable(this._combatArea);
        combat.stopArea();
        combat.startArea(null);
        this._combatArea = null;
        this.stopTimeout();
    }

    private startTimeout() {
        this.timeout = game.gameConfig.ascension.trial.timeout ?? 0;
        if (this.timeout === 0) {
            return;
        }
        this.timeoutElement.classList.remove('hidden');
        this.timeoutId = gameLoop.registerCallback(this.timeoutTick.bind(this), { delay: 1000 });

        this.updateTimeoutElement();
    }

    private stopTimeout() {
        this.timeoutElement.classList.add('hidden');
        if (this.timeoutId) {
            gameLoop.unregister(this.timeoutId);
        }
    }

    private timeoutTick() {
        this.timeout--;
        if (this.timeout <= 0) {
            this.timeout = 0;
            this.cancelTrial();
            this.executeState('Start');
        }
        this.updateTimeoutElement();
    }

    private updateTimeoutElement() {
        this.timeoutElement.textContent = `Time remaining: ${this.timeout.toFixed()} seconds`;
    }


    private ascend() {
        this.executeState('invalid');
        this.trialCompleted = false;
        ascension.ascend();
    }

    serialize(): PickStrict<Required<GameSerialization.Serialization>['ascension'], 'state' | 'combatArea' | 'timeout'> {
        return { state: this._state, combatArea: this._combatArea?.serialize(), timeout: this.timeout };
    }

    deserialize({ state, combatArea, timeout }: { state?: string, combatArea?: DeepPartial<GameSerialization.CombatArea>, timeout?: number; }) {
        this._state = state && states.includes(state as State) ? state as State : 'invalid';
        if (combatArea) {
            this.trialCompleted = false;
            this.executeState('Trial');
            this._combatArea?.deserialize(combatArea);
            this.timeout = timeout ?? 0;
            this.updateTimeoutElement();
        } else if (this._state === 'Ascend' || this._state === 'Done') {
            this.trialCompleted = true;
        }
        this.updateButton();
    }
}
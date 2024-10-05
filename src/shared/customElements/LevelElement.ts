import { combat, game, player, statistics } from '../../game/game';
import type { PlayerActivityName } from '../../game/Player';
import { EventEmitter } from '../utils/EventEmitter';
import { CustomElement } from './CustomElement';
import { createCustomElement } from './customElements';
import { ProgressElement } from './ProgressElement';


export class LevelElement extends CustomElement {
    static readonly name = 'level-element';
    actionName?: PlayerActivityName;

    private _level = 1;
    maxExp = 0;
    curExp = 0;
    onLevelChange = new EventEmitter<number>();
    private upgradeButton?: HTMLSpanElement;
    private active?: boolean;

    get actionActive() {
        return player.stats.activity.getText() === this.actionName;
    }

    get level() {
        return this._level;
    }

    private performAction() {
        this.curExp++;
        if (this.curExp >= this.maxExp) {
            this._level++;
            this.curExp = 0;
            this.onLevelChange.invoke(this._level);
        }
        this.updateProgressBar();
        if (this.maxExp === Infinity) {
            this.stopAction();
            combat.startArea(null);
            statistics.updateStats('Player');
            this.upgradeButton!.style.visibility = 'hidden';
        }
    }

    startAction() {
        this.active = true;
        game.tickSecondsEvent.listen(this.performAction);
        combat.stopArea();
        player.setActivity(this.actionName!, true);
        this.upgradeButton?.classList.add('m-text-green');
        statistics.updateStats('Player');
    }

    private stopAction() {
        this.active = false;
        game.tickSecondsEvent.removeListener(this.performAction);
        this.upgradeButton?.classList.remove('m-text-green');
    }

    init() {
        const levelElement = document.createElement('div');
        levelElement.classList.add('level');
        levelElement.setAttribute('data-level', '');
        levelElement.textContent = '1';

        this.upgradeButton = document.createElement('span');
        this.upgradeButton.textContent = 'Upgrade';
        this.upgradeButton.classList.add('action');
        this.upgradeButton.setAttribute('data-action', '');

        const expProgressElement = createCustomElement(ProgressElement);
        expProgressElement.setAttribute('data-exp', '');
        expProgressElement.addEventListener('pointerenter', () => {
            this.updateProgressBar();
        });

        this.append(levelElement, this.upgradeButton, expProgressElement);
        document.body.appendChild(this);

        this.performAction = this.performAction.bind(this);

        player.stats.activity.addListener('change', () => {
            if (this.active && !this.actionActive) {
                this.stopAction();
            }
            const disabled = player.activity && !player.activity?.interruptable;
            this.upgradeButton?.toggleAttribute('disabled', disabled ?? false);
        });

        this.onLevelChange.listen(() => {
            this.querySelectorStrict('[data-level]').textContent = this._level.toFixed();
        });
        this.onLevelChange.invoke(this._level);
    }

    setAction(name: PlayerActivityName) {
        this.actionName = name;
        this.upgradeButton?.addEventListener('click', () => {
            if (this.active) {
                this.stopAction();
                combat.startArea(null);
                statistics.updateStats('Player');
            } else {
                this.startAction();
            }
        });
    }

    setLevel(level: number) {
        this._level = level;
        this.onLevelChange.invoke(this._level);
    }

    setLevelClickCallback(callback: () => void) {
        this.querySelectorStrict('[data-level]').addEventListener('click', callback);
    }

    updateProgressBar() {
        const v = this.curExp / this.maxExp;
        this.querySelectorStrict<ProgressElement>('progress-element').value = v;
        this.querySelectorStrict<ProgressElement>('progress-element').setAttribute('data-exp', this.maxExp !== Infinity ? `${this.curExp}/${this.maxExp}` : '');
    }
}
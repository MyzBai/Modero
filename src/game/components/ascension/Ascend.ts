import type { ZoneOptions } from 'src/game/combat/Zone';
import { Zone } from 'src/game/combat/Zone';
import { combat, game, gameLoop, player } from 'src/game/game';
import * as GameSerialization from 'src/game/serialization/serialization';
import * as GameModule from 'src/game/gameModule/GameModule';
import { assertNonNullable } from 'src/shared/utils/assert';
import { EventEmitter } from 'src/shared/utils/EventEmitter';

const states = ['invalid', 'pendingText', 'text', 'pendingCombat', 'combat', 'cancelCombat', 'finalText', 'pendingAscend', 'ascend', 'complete'] as const;
type State = typeof states[number];

export class Ascend {
    private curAscension?: GameModule.AscensionInstance | null;
    readonly onAscension = new EventEmitter<GameModule.AscensionInstance>();
    readonly page: HTMLElement;
    private _zone?: Zone | null;
    private _state: State = 'invalid';
    constructor(private readonly overlord: GameModule.AscensionOverLord) {
        this.page = document.createElement('div');
        this.page.classList.add('p-ascend');

        const button = document.createElement('button');
        button.textContent = 'Begin Ascend';
        button.setAttribute('data-ascend-button', '');
        button.addEventListener('click', () => {
            void Promise.resolve(() => {
                switch (this._state) {
                    case 'pendingText': return this.executeState('text'); break;
                    case 'pendingCombat': return this.executeState('combat'); break;
                    case 'combat': return this.executeState('cancelCombat'); break;
                    case 'pendingAscend': return this.executeState('ascend'); break;
                    default: throw `${this._state} is an invalid state here`;
                }
            });
        });
        this.page.appendChild(button);

        // this.page.insertAdjacentHTML('beforeend', '<div class="message" data-msg></div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-text-area" data-text-area></div>');

        player.stats.level.addListener('change', (e) => {
            if (this._state !== 'invalid') {
                return;
            }
            if (e.curValue < game.maxLevel) {
                void this.executeState('invalid');
                return;
            }
            if (this._state !== 'invalid') {
                return;
            }
            void this.executeState('pendingText');
        });
    }

    get state() {
        return this._state;
    }

    get zone() {
        return this._zone;
    }

    setAscension(instance?: GameModule.AscensionInstance) {
        this.curAscension = instance;
    }

    async executeState(state: State) {
        const updateBtn = async (btnDisabled: boolean, btnText?: string) => {
            const btn = this.page.querySelectorStrict('[data-ascend-button]');
            btn.textContent = btnText ?? btn.textContent;
            btn.toggleAttribute('disabled', btnDisabled);
        };
        this._state = state;

        switch (state) {
            case 'invalid': await updateBtn(true, 'Begin Ascension'); break;
            case 'pendingText': await updateBtn(false, 'Begin Ascension'); break;
            case 'text':
                await updateBtn(true);
                await this.beginPrintText(this.getTempTextLines());
                await this.executeState('pendingCombat');
                break;
            case 'pendingCombat': await updateBtn(false, 'Attack'); break;
            case 'combat':
                await updateBtn(false, 'Abort');
                this.startCombat();
                break;
            case 'cancelCombat':
                this.cancelCombat();
                await this.executeState('pendingCombat');
                break;
            case 'finalText':
                await updateBtn(true, 'Ascend');
                await this.beginPrintText(['Good Luck!']);
                await this.executeState('pendingAscend');
                break;
            case 'pendingAscend': await updateBtn(false, 'Ascend'); break;
            case 'ascend': await this.ascend(); break;
            case 'complete': await updateBtn(true, 'Ascend'); break;
        }
    }

    private async beginPrintText(lines: string[]) {
        await Promise.resolve(this.typeText(lines));
    }

    private startCombat() {
        const zoneOptions: ZoneOptions = {
            name: 'Overlord',
            enemyBaseCount: 1,
            candidates: [{ ...this.overlord, id: 'overlord', weight: 1 }],
            areaModList: [],
            enemyBaseLife: combat.enemyBaseLife
        };
        this._zone = new Zone(zoneOptions);
        this._zone.onComplete.listen(async () => {
            await this.executeState('finalText');
            this._zone = null;
        });
        combat.startZone(this._zone);
    }

    private cancelCombat() {
        assertNonNullable(this._zone);
        combat.stopZone(this._zone);
    }

    private async ascend() {
        await this.executeState('invalid');
        game.stats.ascensionCount.add(1);

        if (!this.curAscension) {
            console.log('You have reached the end!');
            void this.executeState('complete');
            return;
        }

        assertNonNullable(this.curAscension);
        this.onAscension.invoke(this.curAscension);

        await game.saveGame();

        //TODO do some fade in/out
        await game.resetAscension();
    }

    private appendAllText(lines: string[]) {
        this.page.querySelectorStrict('[data-text-area]').textContent = lines.join('\n');
    }

    serialize() {
        return { ascendState: this._state as string, zone: this._zone?.serialize() };
    }

    deserialize(state?: string, zone?: DeepPartial<GameSerialization.Zone>) {
        if (state && states.includes(state as State)) {
            const stateIndex = states.indexOf(state as State);
            if (stateIndex > states.indexOf('finalText')) {
                this.appendAllText(['Good Luck!']);
            } else if (stateIndex > states.indexOf('text')) {
                this.appendAllText(this.getTempTextLines());
            }
            void this.executeState(state as State);
        }
        if (zone && (state as State) === 'combat') {
            this.startCombat();
            this._zone?.deserialize(zone);
        }
    }

    private getTempTextLines() {
        return `
            [Overlord] You've come far... Let's see how you fare against a real challenge...
            ...
            Prepare yourself!
        `.split(/\r?\n/m).filter(x => x).map(x => x.trim());
    }

    private typeText(textLines: string[]): Promise<void> {
        const text = textLines.join('\n');
        return new Promise((resolve) => {
            const element = this.page.querySelectorStrict('[data-text-area]');
            element.textContent = '';
            let charIndex = 0;
            let timeTotal = 0;
            const cancel = gameLoop.registerCallback((dt) => {
                timeTotal += dt * 1000;
                while (timeTotal > 50 && charIndex <= text.length) {
                    element.innerHTML += text.charAt(charIndex++);
                    timeTotal -= 50;
                }
                if (charIndex >= text.length) {
                    cancel();
                    resolve();
                }
            });

        });
    }
}
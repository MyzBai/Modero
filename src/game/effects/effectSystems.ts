import { lerp } from 'src/shared/utils/utils';
import { combat, player } from '../game';
import type { DOTEffect, EffectType } from './Effects';
import type * as GameSerialization from '../serialization';
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';

const sortByDamage = (a: { damage: number; }, b: { damage: number; }) => b.damage - a.damage;

export type EffectSystem = BleedSystem | BurnSystem;

export abstract class BaseEffectSystem<T extends BaseEffectInstance = BaseEffectInstance> {
    readonly element: HTMLElement;
    protected readonly timeSpan: HTMLElement;
    protected readonly stackSpan: HTMLElement;
    protected readonly progressBar: ProgressElement;
    protected _effectInstances: T[] = [];
    private time = 0;
    protected sort = <U extends T>(a: U, b: U) => b.time - a.time;
    constructor(readonly type: EffectType) {
        this.element = this.createElement();
        this.timeSpan = this.element.querySelectorStrict('[data-time]');
        this.stackSpan = this.element.querySelectorStrict('[data-stacks]');
        this.progressBar = this.element.querySelectorStrict(ProgressElement.name);
    }

    get effectInstances() {
        return this._effectInstances;
    }

    abstract get duration(): number;
    abstract get maxStacks(): number;

    update() {
        let maxTime = 0;
        for (const effectInstance of this._effectInstances) {
            effectInstance.time = this.duration * effectInstance.timePct;
            maxTime = Math.max(maxTime, effectInstance.time);
        }
    }

    addEffect(effect: T) {
        this.effectInstances.push(effect);
        this.time = effect.time;
        this.update();
        this.updateElements();
    }

    removeEffect(effect: T) {
        this._effectInstances.remove(effect);
        this.updateElements();
    }

    clear() {
        this._effectInstances = [];
    }

    updateElements() {
        const stacks = Math.min(this._effectInstances.length, this.maxStacks);
        const visible = stacks > 0 && this.time > 0;
        this.element.classList.toggle('hidden', !visible);
        if (!visible) {
            return;
        }
        this.timeSpan.textContent = `${this.time.toFixed()}s`;
        this.stackSpan.textContent = stacks.toFixed();
        const pct = this.time / this.duration;
        this.progressBar.value = pct;
    }

    protected dealDamageOverTime(effectInstances: DOTEffectInstance[], dt: number) {
        const count = Math.min(effectInstances.length, this.maxStacks);
        for (let i = 0; i < count; i++) {
            const instance = effectInstances[i];
            if (!instance) {
                break;
            }
            const damage = instance.damage * dt * (combat.enemy?.stats.reducedDamageTakenMultiplier.value ?? 1);
            combat.dealDamageOverTime(damage, instance.type);
        }
    }

    tick(dt: number) {
        let maxTime = 0;
        for (let i = this._effectInstances.length - 1; i >= 0; i--) {
            const effectInstance = this._effectInstances[i];
            if (!effectInstance) {
                continue;
            }
            effectInstance.time -= dt;
            maxTime = Math.max(effectInstance.time, maxTime);
            if (effectInstance.time <= 0) {
                this.removeEffect(effectInstance);
            }
            effectInstance.timePct = effectInstance.time / this.duration;
        }
        this.time = Math.min(maxTime, this.duration);
    }

    private createElement() {
        const li = document.createElement('li');
        li.classList.add('hidden', 's-effect');
        li.insertAdjacentHTML('beforeend', `<div><span>${this.type}</span> | Time: <span data-time></span> | Stacks: <span data-stacks></span></div>`);
        const progressBar = createCustomElement(ProgressElement);
        progressBar.classList.add('progress-bar');
        li.appendChild(progressBar);
        return li;
    }

    serialize(): GameSerialization.Effect[] {
        return this._effectInstances.map(x => ({ type: x.type, timePct: x.timePct, effectivenessFactor: x.effectivenessFactor }));
    }
}

export class BleedSystem extends BaseEffectSystem<DOTEffectInstance> {
    readonly type = 'Bleed';
    constructor() {
        super('Bleed');

        this.sort<DOTEffectInstance> = sortByDamage;
    }

    get maxStacks() {
        return player.stats.maxBleedStackCount.value;
    }
    get duration() {
        return player.stats.bleedDuration.value;
    }

    update() {
        super.update();
        for (const instance of this._effectInstances) {
            instance.damage = lerp(player.stats.minBleedDamage.value, player.stats.maxBleedDamage.value, instance.effectivenessFactor);
        }
        this._effectInstances.sort(this.sort);
    }

    tick(dt: number) {
        this.dealDamageOverTime(this._effectInstances, dt);
        super.tick(dt);
    }
}

export class BurnSystem extends BaseEffectSystem<DOTEffectInstance> {
    readonly type = 'Burn';
    constructor() {
        super('Burn');
        this.sort<DOTEffectInstance> = sortByDamage;
    }

    get maxStacks() {
        return player.stats.maxBurnStackCount.value;
    }

    get duration() {
        return player.stats.burnDuration.value;
    }

    update() {
        super.update();
        for (const instance of this._effectInstances) {
            instance.damage = lerp(player.stats.minBurnDamage.value, player.stats.maxBurnDamage.value, instance.effectivenessFactor);
        }
        this._effectInstances.sort(this.sort);
    }

    tick(dt: number) {
        this.dealDamageOverTime(this._effectInstances, dt);
        super.tick(dt);
    }
}

export interface BaseEffectInstance {
    type: EffectType;
    timePct: number;
    time: number;
    effectivenessFactor?: number;
}


export interface DOTEffectInstance extends BaseEffectInstance {
    type: DOTEffect;
    effectivenessFactor: number;
    damage: number;
}
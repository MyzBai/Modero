import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { isString } from 'src/shared/utils/utils';
import { combat, gameLoop, gameLoopAnim, player } from '../game';
import { type BaseEffectInstance, type BaseEffectSystem, BleedSystem, BurnSystem } from './effectSystems';
import type * as GameSerialization from '../serialization';

export const effectTypes = ['Bleed', 'Burn'] as const;
export type EffectType = typeof effectTypes[number];
export type AilmentType = Extract<EffectType, 'Bleed' | 'Burn'>;
export type DOTEffect = ExtractStrict<EffectType, 'Bleed' | 'Burn'>;

export class Effects {
    readonly onEffectChanged = new EventEmitter<EffectType>();
    private readonly systems = {
        Bleed: new BleedSystem(),
        Burn: new BurnSystem(),
    } as const satisfies Record<EffectType, BaseEffectSystem>;

    init() {
        gameLoopAnim.registerCallback(() => this.updateElements());
        gameLoop.registerCallback(dt => this.tick(dt));
        player.onStatsChange.listen(() => this.updateInstances());

        const effectListContainer = combat.page.querySelectorStrict('[data-effect-list]');
        effectListContainer.replaceChildren();
        for (const system of Object.values(this.systems)) {
            effectListContainer.appendChild(system.element);
        }
    }

    setup() {
        this.updateValues();
        this.updateElements();
    }
    clear() {
        for (const system of Object.values(this.systems)) {
            system.clear();
        }
    }
    updateValues() {
        for (const system of Object.values(this.systems)) {
            system.update();
        }
    }
    updateElements() {
        for (const system of Object.values(this.systems)) {
            system.updateElements();
        }
    }
    hasEffect(type: EffectType) {
        return this.getSystem(type).effectInstances.length > 0;
    }

    reset() {
        this.removeAllEffects();
    }

    getSystem<T extends keyof typeof this.systems>(type: T): typeof this.systems[T] {
        const system = this.systems[type];
        return system;
    }

    addEffects(...effects: EffectData[]) {
        for (const effectData of effects) {
            const system = this.getSystem(effectData.type) as BaseEffectSystem;
            const instance: BaseEffectInstance = {
                type: effectData.type,
                timePct: effectData.timePct || 1,
                time: 0,
                effectivenessFactor: effectData.effectivenessFactor
            };
            system.addEffect(instance);
            this.onEffectChanged.invoke(effectData.type);
        }

        this.updateInstances();
    }

    clearEffectsByType(types: EffectType[]) {
        for (const type of types) {
            const system = this.getSystem(type) as BaseEffectSystem;
            system.clear();
            this.onEffectChanged.invoke(type);
        }
        player.updateStats();
        combat.enemy?.updateStats();
    }

    removeAllEffects() {
        this.clear();
        this.updateElements();
    }

    private updateInstances() {
        this.updateValues();
    }

    private tick(dt: number) {
        for (const system of Object.values(this.systems)) {
            const instanceCount = system.effectInstances.length;
            if (instanceCount === 0) {
                continue;
            }

            system.tick(dt);

            if (system.effectInstances.length !== instanceCount) {
                this.onEffectChanged.invoke(system.type);
            }
        }
    }

    serialize(save: GameSerialization.Serialization) {
        save.effects = { effectList: Object.values(this.systems).flatMap(x => x.serialize()) };
    }

    deserialize({ effects: save }: GameSerialization.UnsafeSerialization) {
        if (!save) {
            return;
        }

        for (const serializedEffect of save.effectList ?? []) {
            if (!serializedEffect) {
                continue;
            }
            if (!isString(serializedEffect.type)) {
                continue;
            }

            const system = this.getSystem(serializedEffect.type) as BaseEffectSystem;
            system.effectInstances.push({
                type: serializedEffect.type,
                timePct: serializedEffect.timePct || 0,
                time: 0,
                effectivenessFactor: serializedEffect.effectivenessFactor
            });
        }
    }
}

export type EffectData = BaseEffectData | DOTEffectData;
export interface BaseEffectData {
    type: EffectType;
    effectivenessFactor?: number;
    timePct?: number;
}
export interface DOTEffectData extends PickStrict<BaseEffectData, 'timePct'> {
    type: DOTEffect;
    effectivenessFactor: number;
}

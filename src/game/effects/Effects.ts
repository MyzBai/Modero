import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { isString } from 'src/shared/utils/helpers';
import { combat, gameLoop, gameLoopAnim, player } from '../game';
import { EffectSystems, type BaseEffectInstance, BaseEffectSystem } from './effectSystems';
import type * as GameSerialization from '../serialization/serialization';

export const effectTypes = ['Bleed', 'Burn'] as const;
export type EffectType = typeof effectTypes[number];
export type AilmentType = Extract<EffectType, 'Bleed' | 'Burn'>;
export type DOTEffect = ExtractStrict<EffectType, 'Bleed' | 'Burn'>

export class Effects {
    readonly onEffectChanged = new EventEmitter<EffectType>();
    readonly systems = new EffectSystems();

    init() {
        gameLoopAnim.registerCallback(() => this.systems.updateElements());
        gameLoop.registerCallback(dt => this.tick(dt));
        player.onStatsChange.listen(() => this.updateInstances());

        const effectListContainer = combat.page.querySelectorStrict('[data-effect-list]');
        effectListContainer.replaceChildren();
        for (const system of this.systems) {
            effectListContainer.appendChild(system.element);
        }
    }

    setup() {
        this.systems.updateValues();
        this.systems.updateElements();
    }

    hasEffect(type: EffectType) {
        return this.systems.getSystem(type).effectInstances.length > 0;
    }

    reset() {
        this.removeAllEffects();
    }

    addEffects(...effects: EffectData[]) {
        for (const effectData of effects) {
            const system = this.systems.getSystem(effectData.type) as BaseEffectSystem;
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

    removeEffects(...effects: BaseEffectInstance[]) {
        for (const effect of effects) {
            const system = this.systems.getSystem(effect.type) as BaseEffectSystem;
            system.removeEffect(effect);
            this.onEffectChanged.invoke(effect.type);
        }
        player.updateStats();
        combat.enemy?.updateStats();
    }

    removeAllEffects() {
        this.systems.clear();
        this.systems.updateElements();
    }

    private updateInstances() {
        this.systems.updateValues();
    }

    private tick(dt: number) {
        for (const system of this.systems) {
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
        const effects: GameSerialization.Effect[] = [];
        for (const system of this.systems) {
            const serializedEffects = system.serialize();
            effects.push(...serializedEffects);
        }
        save.effects = effects;
    }

    deserialize({ effects: save }: GameSerialization.UnsafeSerialization) {
        if (!save) {
            return;
        }

        for (const serializedEffect of save || []) {
            if (!serializedEffect) {
                continue;
            }
            if (!isString(serializedEffect.type)) {
                continue;
            }

            const system = this.systems.getSystem(serializedEffect.type) as BaseEffectSystem;
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

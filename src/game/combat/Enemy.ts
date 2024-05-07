import { clamp, isDefined, isNumber } from 'src/shared/utils/utils';
import { calcEnemyStats } from '../calc/calcStats';
import { Modifier } from '../mods/Modifier';
import { ConditionFlags } from '../mods/types';
import { combat } from '../game';
import { ModDB } from '../mods/ModDB';
import type * as GameSerialization from '../serialization';
import { createEnemyStats } from '../statistics/stats';

export interface EnemyData {
    id: string;
    name: string;
    baseLife: number;
    enemyModList: string[];
}

export class Enemy {
    readonly modDB = new ModDB();
    readonly stats = createEnemyStats();
    readonly modList: Modifier[];
    constructor(readonly enemyData: EnemyData) {
        this.stats.baseLife.set(enemyData.baseLife);
        this.modList = Modifier.modListFromTexts([...enemyData.enemyModList]);
        this.modDB.add('EnemyMod', Modifier.extractStatModifierList(...this.modList));
        this.stats.maxLife.set(1);
        this.stats.life.set(this.stats.maxLife.value);
    }

    get life() {
        return this.stats.life.value;
    }

    set life(v: number) {
        v = clamp(v, 0, this.maxLife);
        this.stats.life.set(v);
    }

    get maxLife() {
        return this.stats.maxLife.value;
    }

    get lifeFrac() {
        return clamp(this.life / this.maxLife, 0, 1);
    }

    updateStats() {
        const lifeFrac = this.lifeFrac;
        calcEnemyStats(this);
        this.life = this.maxLife * lifeFrac;
    }

    updateModifiers(modList: Modifier[]) {
        this.modDB.replace('AreaMod', Modifier.extractStatModifierList(...modList));
        this.updateStats();
    }

    getConditionFlags(): number {
        let flags = 0;
        if (combat.effectHandler.hasEffect('Bleed')) {
            flags |= ConditionFlags.Bleed;
        }

        if (combat.effectHandler.hasEffect('Burn')) {
            flags |= ConditionFlags.Burn;
        }
        return flags;
    }

    serialize(): GameSerialization.EnemyInstance {
        return {
            lifeFraction: this.lifeFrac,
            modList: this.modList.map(x => ({ srcId: x.template.id, values: x.values }))
        };
    }

    deserialize(save: DeepPartial<GameSerialization.EnemyInstance>) {
        if (isNumber(save.lifeFraction)) {
            this.life = this.stats.maxLife.value * save.lifeFraction;
        }
        if (save.modList) {
            for (const serializedMod of save.modList.filter(isDefined)) {
                const mod = this.modList.find(x => x.template.id === serializedMod.srcId);
                if (mod && serializedMod.values) {
                    mod.setValues(serializedMod.values.filter(isNumber));
                }
            }
        }
        this.modDB.replace('EnemyMod', Modifier.extractStatModifierList(...this.modList));
        this.updateStats();
    }
}
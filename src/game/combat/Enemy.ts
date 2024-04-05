import { clamp, isDefined, isNumber } from 'src/shared/utils/helpers';
import { calcEnemyStats } from '../calc/calcStats';
import { Modifier } from '../mods/Modifier';
import { ConditionFlags } from '../mods/types';
import { combat } from '../game';
import { ModDB } from '../mods/ModDB';
import type * as GameSerialization from '../serialization/serialization';
import { createEnemyStats } from '../statistics/stats';
import type * as GameModule from 'src/game/gameModule/GameModule';

export interface EnemyData {
    id: string;
    name: string;
    baseLife: number;
    enemyModList: string[];
    zoneModList: string[];
}

export class Enemy {
    readonly modDB = new ModDB();
    readonly stats = createEnemyStats();
    readonly modList: Modifier[];
    readonly localRewards: GameModule.Rewards = {};
    constructor(readonly enemyData: EnemyData) {
        this.stats.baseLife.set(combat.enemyBaseLife);
        this.modList = Modifier.modsFromTexts([...enemyData.enemyModList]);
        this.modDB.add('EnemyMod', Modifier.extractStatModifierList(...this.modList));
        this.modDB.add('AreaMod', Modifier.extractStatModifierList(...Modifier.modsFromTexts(enemyData.zoneModList)));
        this.updateStats();
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

    updateStats() {
        calcEnemyStats(this);
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
            lifeFraction: clamp(this.life / this.maxLife, 0, 1),
            modList: this.modList.map(x => x.serialize())
        };
    }

    deserialize(save: DeepPartial<GameSerialization.EnemyInstance>) {
        if (isNumber(save.lifeFraction)) {
            this.life = this.stats.maxLife.value * save.lifeFraction;
        }
        if (save.modList) {
            for (const serializedMod of save.modList.filter(isDefined)) {
                const mod = this.modList.find(x => x.template.id === serializedMod.id);
                if (mod && serializedMod.values) {
                    mod.setValues(serializedMod.values.filter(isNumber));
                }
            }
        }
        this.modDB.replace('EnemyMod', Modifier.extractStatModifierList(...this.modList));
        this.updateStats();
    }
}
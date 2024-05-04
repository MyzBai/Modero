import { type CalcMinMax, calcModBase, calcModIncMore, type OffenceConfiguration, type PlayerConfiguration } from './calcMod';
import { ModifierFlags, type DamageStatName, type StatName } from '../mods/types';
import { randomRange, lerp } from 'src/shared/utils/utils';
import { assertDefined } from 'src/shared/utils/assert';
import type { ModDB } from '../mods/ModDB';
import { extractStats } from './calcStats';
import type { EffectData } from '../effects/Effects';
import type { EnemyStatCollection, PlayerStatCollection } from '../statistics/stats';

interface Player {
    stats: PlayerStatCollection;
    modDB: ModDB;
}

interface Enemy {
    stats: EnemyStatCollection;
    modDB: ModDB;
}

type ConversionValues = Partial<Record<keyof typeof DamageTypeFlags | 'multi', number>>;
export type ConversionTable = Partial<Record<keyof typeof DamageTypeFlags, ConversionValues>>;

export const DamageTypes = ['Physical', 'Elemental'] as const;
export type DamageType = typeof DamageTypes[number];
type DamageFlag = number;
export const DamageTypeFlags: Record<DamageType, DamageFlag> = {
    Physical: 1 << 0,
    Elemental: 1 << 1,
} as const;


export interface AttackResult {
    hit: boolean;
    crit?: boolean;
    totalDamage?: number;
}

const damageNamesMetaTable = (() => {
    const names: DamageStatName[][] = [];
    const length = Object.values(DamageTypeFlags).reduce((a, v) => a + v);
    for (let i = 0; i <= length; i++) {
        const flagList: DamageStatName[] = ['Damage'];
        for (const [key, flag] of Object.entries(DamageTypeFlags)) {
            if (flag & i) {
                flagList.push(`${key as keyof typeof DamageTypeFlags}Damage`);
            }
        }
        names.push(flagList);
    }
    return names;
})();

export function calcAttack(source: Player, enemy: Enemy) {

    const stats = extractStats(source.stats);
    const enemyStats = extractStats(enemy.stats);

    //Hit
    const hitChance = stats.hitChance;

    const hitFac = randomRange(0, 1);
    const hit = hitChance >= hitFac;
    if (!hit) {
        return;
    }
    const enemyEvade = enemyStats.evadeChance;
    const evadeFac = randomRange(0, 1);
    if (evadeFac < enemyEvade) {
        return;
    }

    const attackEffectiveness = randomRange(0, 1);

    const critChance = stats.criticalHitChance;
    const critFac = randomRange(0, 1);
    const crit = critChance >= critFac;

    //Crit
    let critMultiplier = 1;
    if (crit) {
        critMultiplier = stats.criticalHitMultiplier;
    }

    //finalize
    const finalMultiplier = critMultiplier;

    const minPhysicalDamage = stats.minPhysicalDamage;
    const maxPhysicalDamage = stats.maxPhysicalDamage;
    const physicalDamage = lerp(minPhysicalDamage, maxPhysicalDamage, attackEffectiveness);

    const minElementalDamage = stats.minElementalDamage;
    const maxElementalDamage = stats.maxElementalDamage;
    const elementalDamage = lerp(minElementalDamage, maxElementalDamage, attackEffectiveness);

    const reducedDamageMultiplier = enemy.stats.reducedDamageTakenMultiplier.value;

    const totalDamage = (physicalDamage + elementalDamage) * finalMultiplier * reducedDamageMultiplier;


    const effects: EffectData[] = [];
    //ailments
    {
        if (physicalDamage > 0) {
            //bleed
            const bleedChance = stats.bleedChanceOnHit;
            if (bleedChance >= randomRange(0, 1)) {
                effects.push({ type: 'Bleed', effectivenessFactor: attackEffectiveness });
            }
        }

        if (elementalDamage > 0) {
            //burn
            const burnChance = stats.burnChanceOnHit;
            if (burnChance >= randomRange(0, 1)) {
                effects.push({ type: 'Burn', effectivenessFactor: attackEffectiveness });
            }
        }
    }
    return {
        hit,
        crit,
        physicalDamage,
        elementalDamage,
        totalDamage,
        effects
    };
}

export function calcBaseAttackDamage(config: PlayerConfiguration, calcMinMax: CalcMinMax) {
    config.flags = config.flags || 0;

    const conversionTable = generateConversionTable(config);
    const output = {
        totalBaseDamage: 0,
        minPhysicalDamage: 0,
        maxPhysicalDamage: 0,
        minElementalDamage: 0,
        maxElementalDamage: 0
    };

    const damageMultiplier = config.source.stats.attackEffectiveness / 100;
    let totalBaseDamage = 0;
    for (const damageType of Object.keys(DamageTypeFlags) as (keyof typeof DamageTypeFlags)[]) {
        const bit = ModifierFlags[damageType];
        config.flags |= bit;
        let { min, max } = calcDamage(damageType, config, conversionTable);
        min *= damageMultiplier;
        max *= damageMultiplier;
        output[`min${damageType}Damage`] = min;
        output[`max${damageType}Damage`] = max;
        const baseDamage = calcMinMax(min, max);
        totalBaseDamage += baseDamage;
        config.flags &= ~bit;
    }

    output.totalBaseDamage = totalBaseDamage;
    return output;
}

function calcDamage(damageType: DamageType, config: OffenceConfiguration, conversionTable: ConversionTable, damageFlag = 0) {

    damageFlag |= DamageTypeFlags[damageType];
    let addMin = 0;
    let addMax = 0;
    for (const type of DamageTypes) {
        if (type === damageType) {
            break;
        }
        const conversionValue = conversionTable[type] || {};
        const convMulti = conversionValue[damageType] || 0;
        if (convMulti > 0) {
            const { min, max } = calcDamage(type, config, conversionTable, damageFlag);
            addMin += min * convMulti;
            addMax += max * convMulti;
        }
    }

    const baseMin = calcModBase('MinDamage', config);
    const baseMax = calcModBase('MaxDamage', config);

    const modNames = damageNamesMetaTable[damageFlag];
    assertDefined(modNames);
    const min = calcModIncMore(modNames, baseMin, config) + addMin;
    const max = calcModIncMore(modNames, baseMax, config) + addMax;
    return { min, max };
}

export function calcAilmentBaseDamage(damageType: DamageType, config: PlayerConfiguration, typeFlags = 0) {
    const conversionTable = generateConversionTable(config);
    let { min, max } = calcDamage(damageType, config, conversionTable, typeFlags);
    const convMulti = conversionTable[damageType]?.multi || 1;
    const attackEffectiveness = config.source.stats.attackEffectiveness / 100;
    min *= attackEffectiveness;
    max *= attackEffectiveness;
    return { min: min * convMulti, max: max * convMulti };
}

//TODO: Remove as keywords and implement prober type check
function generateConversionTable(config: OffenceConfiguration) {
    type Conversion = Partial<Record<DamageType, number>>;
    const conversionTable: ConversionTable = {};
    const damageTypeFlagKeys = Object.keys(DamageTypeFlags) as (keyof typeof DamageTypeFlags)[];
    for (let i = 0; i < damageTypeFlagKeys.length; i++) {
        const damageType = damageTypeFlagKeys[i];
        assertDefined(damageType);
        const globalConv: Conversion = {};
        const skillConv: Conversion = {};
        const add: Conversion = {};
        let globalTotal = 0;
        let skillTotal = 0;
        for (let j = i + 1; j < damageTypeFlagKeys.length; j++) {
            const otherDamageType = damageTypeFlagKeys[i] as DamageType;
            const convertedToName = `${damageType}ConvertedTo${otherDamageType}` as DamageStatName;
            globalConv[otherDamageType] = calcModBase(convertedToName, config);

            globalTotal += (globalConv[otherDamageType] || 0);
            skillConv[otherDamageType] = calcModBase(convertedToName as StatName, config);

            skillTotal += (skillConv[otherDamageType] || 0);
            add[otherDamageType] = calcModBase(`${damageType}GainAs${otherDamageType}` as StatName, config);
        }

        const fac = skillTotal > 100 ? 100 / skillTotal : (100 - skillTotal) / globalTotal;
        for (const key of Object.keys(skillConv) as DamageType[]) {
            skillConv[key] = (skillConv[key] || 0) * fac;
        }

        const conversionValues: ConversionValues = { multi: 1 };
        for (const key of Object.keys(globalConv) as DamageType[]) {
            const value = conversionValues[key];
            const skillConvValue = skillConv[key] || 0;
            const addValue = add[key] || 0;
            conversionValues[key] = ((value || 0) + skillConvValue + addValue) / 100;
        }
        conversionValues.multi = 1 - Math.min((globalTotal + skillTotal) / 100, 1);
        conversionTable[damageType] = conversionValues;
    }
    return conversionTable;
}
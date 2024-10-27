import type { ConditionFlags, ModifierFlags, StatModConditionTag, StatModifierValueType, StatModTag, StatName } from '../mods/types';
import type { ModDB, StatModifier } from '../mods/ModDB';
import { assertDefined } from 'src/shared/utils/assert';
import { isDefined, hasAnyFlag, hasAllFlags } from 'src/shared/utils/utils';
import type { EnemyStatCollection, PlayerStatCollection } from '../statistics/stats';

export type CalcMinMax = (min: number, max: number) => number;

export interface Source {
    stats?: { [key: string]: number; };
    modDB?: ModDB;
    conditionFlags?: ConditionFlags;
}

export interface PlayerSource extends Omit<Source, 'stats'> {
    type: 'Player';
    stats: Record<keyof PlayerStatCollection, number>;
}
export interface EnemySource extends Omit<Source, 'stats'> {
    type: 'Enemy';
    stats?: Record<keyof EnemyStatCollection, number>;
}

export interface Configuration {
    source?: Source;
    target?: Source;
    flags?: ModifierFlags;
    reference?: { type: string; name: string; };
}

export interface OffenceConfiguration extends Omit<Configuration, 'source' | 'target'> {
    source: PlayerSource;
    target?: EnemySource;
}

export type PlayerConfiguration = OffenceConfiguration;
export type EnemyConfiguration = Omit<Configuration, 'source'> & { source: EnemySource; target?: PlayerSource; };


const isConditionTag = (tag: StatModTag): tag is StatModConditionTag => tag.type === 'Condition';

//#region calcMod
export function calcModBase(modName: StatName | StatName[], config: Configuration) {
    return calcModSum('Base', modName, config);
}
export function calcModInc(modName: StatName | StatName[], config: Configuration) {
    return Math.max(0, 1 + calcModSum('Inc', modName, config) / 100);
}
export function calcModMore(modName: StatName | StatName[], config: Configuration) {
    return Math.max(0, calcModSum('More', modName, config));
}
export function calcModIncMore(modName: StatName | StatName[], base: number, config: Configuration) {
    if (base <= 0) return 0;
    const inc = calcModInc(modName, config);
    const more = calcModMore(modName, config);
    return base * inc * more;
}
export function calcModTotal(modName: StatName | StatName[], config: Configuration) {
    const base = calcModBase(modName, config);
    if (base === 0) {
        return 0;
    }
    const inc = calcModInc(modName, config);
    const more = calcModMore(modName, config);
    return base * inc * more;
}
export function calcModFlag(modName: StatName, config: Configuration) {
    return Math.min(calcModSum('Flag', modName, config), 1);
}
export function calcModSum(valueType: StatModifierValueType, names: StatName | StatName[], config: Configuration) {
    names = Array.isArray(names) ? names : [names]; // force array
    let result = valueType === 'More' ? 1 : 0;

    const modDB = config.source?.modDB;
    assertDefined(modDB, 'modDB is undefined');
    const modList = names.flatMap(x => modDB.getModListByName(x)).filter(isDefined).filter(x => x.valueType === valueType);
    const override = modList.find(x => x.override);
    if (isDefined(override)) {
        return evalMod(override, config) || 0;
    }

    for (const mod of modList) {
        const value = evalMod(mod, config);
        switch (valueType) {
            case 'More': result *= 1 + (value / 100); break;
            default: result += value;
        }
    }
    return result;
}

function evalMod(mod: StatModifier, config: Configuration) {
    if (!hasAllFlags(config.flags || 0, mod.modFlagsAll || 0)) {
        return 0;
    }
    if (!hasAnyFlag(config.flags || 0, mod.modFlagsAny || 0)) {
        return 0;
    }
    if (mod.reference) {
        if (!config.reference) {
            return 0;
        }
        if (mod.reference.type !== config.reference.type) {
            return 0;
        }
        if (mod.reference.name && mod.reference.name !== config.reference.name) {
            return 0;
        }
    }
    const conditionsPassed = evalConditions(mod.extends?.filter(isConditionTag) || [], config);
    if (!conditionsPassed) {
        return 0;
    }

    let value = mod.negate ? -mod.value : mod.value;
    for (const tag of mod.extends || []) {
        if (tag.type === 'Multiplier') {
            const multiplier = config.source?.stats?.[tag.statName as keyof typeof config.source.stats] || 1;
            value *= multiplier;
        } else if (tag.type === 'PerStat') {
            value /= tag.value || 1;
            value /= tag.div || 1;
            const statValue = config.source?.stats?.[tag.statName as keyof typeof config.source.stats] || 0;
            value *= statValue;
        }
    }
    return value;
}

function evalConditions(conditions: ReadonlyArray<StatModConditionTag>, config: Configuration) {
    for (const condition of conditions) {
        let flag = condition.flagsAny || condition.flagsAll || 0;
        if (condition.negate) {
            flag = flag & ~flag;
        }
        let targetConditionFlags = 0;
        switch (condition.target) {
            case 'Self': targetConditionFlags = config.source?.conditionFlags || 0; break;
            case 'Other': targetConditionFlags = config.target?.conditionFlags || 0; break;
        }
        if (condition.flagsAny !== 0) {
            if (!hasAnyFlag(targetConditionFlags, flag)) {
                return false;
            }
        } else if (condition.flagsAll !== 0) {
            if (!hasAllFlags(targetConditionFlags, flag)) {
                return false;
            }
        }
    }
    return true;
}
//#endregion calcMod
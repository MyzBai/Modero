import { clamp, avg, isNumber, isDefined, hasAnyFlag } from 'src/shared/utils/utils';
import { calcBaseAttackDamage, calcAilmentBaseDamage } from './calcDamage';
import { calcModBase, calcModFlag, calcModIncMore, calcModTotal, type Configuration, type EnemyConfiguration, type PlayerConfiguration } from './calcMod';
import { ModifierFlags } from '../mods/types';
import type { EnemyStatCollection, PlayerStatCollection, StatCollection } from '../statistics/stats';
import type { Statistic } from '../statistics/Statistic';
import { compareValueTypes } from '../utils/utils';
import type { ModDB } from '../mods/ModDB';
import { PlayerUpdateStatsFlag } from '../Player';

export interface PlayerOptions {
    flags?: PlayerUpdateStatsFlag;
    stats: Record<keyof PlayerStatCollection, number>;
    conditionFlags?: number;
    modDB?: ModDB;
    enemy?: EnemyOptions;
}
export interface EnemyOptions {
    stats?: EnemyStatCollection;
    conditionFlags?: number;
    modDB?: ModDB;
}
export interface CombatAreaOptions {
    stats: Record<'baseEnemyCount', number>;
    modDB?: ModDB;
}

export function extractStats<T extends StatCollection>(stats: T) {
    return Object.keys(stats).reduce((a, key) => {
        const value = stats[key]?.value;
        if (isNumber(value)) {
            a[key as keyof typeof stats] = value;
        }
        return a;
    }, {} as Record<keyof T, number>);
}

export function applyStatValues<T extends StatCollection>(stats: T, values: Record<keyof T, number>) {
    for (const key of Object.keys(stats)) {
        const stat = stats[key] as Statistic;
        const value = values[key];
        if (!isDefined(value)) {
            continue;
        }
        if (compareValueTypes(value, stat.value)) {
            stat.set(value);
        }
    }
}

export function calcPlayerStats(player: PlayerOptions) {
    player.flags = player.flags ?? 0;
    const stats = player.stats;
    const config: PlayerConfiguration = {
        flags: 0,
        source: {
            type: 'Player',
            stats,
            modDB: player.modDB,
            conditionFlags: player.conditionFlags || 0,
        }
    };

    if (hasAnyFlag(player.flags, PlayerUpdateStatsFlag.Combat)) {
        calcPlayerCombatStats(player.stats, config, player.enemy);
    }

    if (hasAnyFlag(player.flags, PlayerUpdateStatsFlag.Persistent)) {
        calcPlayerPersistantStats(player.stats, config);
    }

    return stats;
}

function calcPlayerCombatStats(stats: PlayerOptions['stats'], config: PlayerConfiguration, enemy?: EnemyOptions) {
    config.flags = config.flags ?? 0;
    //Attributes
    stats.strength = calcModTotal(['Attribute', 'Strength'], config);
    stats.dexterity = calcModTotal(['Attribute', 'Dexterity'], config);
    stats.intelligence = calcModTotal(['Attribute', 'Intelligence'], config);

    //Mana
    stats.maxMana = calcModTotal('MaxMana', config);
    stats.manaRegeneration = calcModTotal('ManaRegen', config);
    config.flags |= ModifierFlags.Skill;
    stats.attackManaCost = calcModTotal('AttackManaCost', config);
    config.flags &= ~ModifierFlags.Skill;

    //create target
    if (enemy) {
        config.target = { type: 'Enemy', stats: extractStats(enemy.stats || {} as StatCollection), conditionFlags: enemy.conditionFlags, modDB: enemy.modDB };
    }

    config.flags = ModifierFlags.Attack;
    //Hit Chance
    stats.hitChance = calcModBase('HitChance', config) / 100;
    const clampedHitChance = clamp(stats.hitChance, 0, 1);

    //Attack Speed
    stats.attackSpeed = calcModTotal('AttackSpeed', config);

    //Crit
    stats.criticalHitChance = calcModBase('CriticalHitChance', config) / 100;
    const clampedCritChance = clamp(stats.criticalHitChance, 0, 1);
    stats.criticalHitMultiplier = (150 + calcModBase('CriticalHitMultiplier', config)) / 100;
    stats.criticalHitMultiplier = Math.min(stats.criticalHitMultiplier, 100);


    let attackDps = 0;
    {
        const baseDamageResult = calcBaseAttackDamage(config, avg);
        const critDamageMultiplier = 1 + (clampedCritChance * (stats.criticalHitMultiplier - 1));
        attackDps = baseDamageResult.totalBaseDamage * clampedHitChance * stats.attackSpeed * critDamageMultiplier;

        stats.minPhysicalDamage = baseDamageResult.minPhysicalDamage * critDamageMultiplier;
        stats.maxPhysicalDamage = baseDamageResult.maxPhysicalDamage * critDamageMultiplier;
        stats.minElementalDamage = baseDamageResult.minElementalDamage * critDamageMultiplier;
        stats.maxElementalDamage = baseDamageResult.maxElementalDamage * critDamageMultiplier;
    }

    //bleed
    let bleedDps = 0;
    {
        config.flags = ModifierFlags.Physical | ModifierFlags.Bleed;
        stats.bleedChanceOnHit = calcModBase('BleedChance', config) / 100;
        stats.bleedDuration = calcModTotal(['BleedDuration', 'AilmentDuration'], config);
        stats.maxBleedStackCount = calcModBase('BleedStack', config);
        const { min, max } = calcAilmentBaseDamage('Physical', config);
        const stacksPerSecond = clampedHitChance * stats.bleedChanceOnHit * stats.attackSpeed * stats.bleedDuration;
        const maxStacks = Math.min(stacksPerSecond, stats.maxBleedStackCount);
        stats.baseBleedDamageMultiplier = calcModTotal('BaseBleedDamageMultiplier', config) / 100;
        stats.bleedDamageMultiplier = 1 + calcModTotal('DamageOverTimeMultiplier', config) / 100;
        stats.minBleedDamage = min * stats.baseBleedDamageMultiplier * stats.bleedDamageMultiplier;
        stats.maxBleedDamage = max * stats.baseBleedDamageMultiplier * stats.bleedDamageMultiplier;
        const avgDamage = avg(stats.minBleedDamage, stats.maxBleedDamage);
        bleedDps = avgDamage * maxStacks;
    }

    //burn
    let burnDps = 0;
    {
        config.flags = ModifierFlags.Elemental | ModifierFlags.Burn;
        stats.burnChanceOnHit = calcModBase('BurnChance', config) / 100;
        stats.burnDuration = calcModTotal(['BurnDuration', 'AilmentDuration'], config);
        stats.maxBurnStackCount = calcModBase('BurnStack', config);
        const { min, max } = calcAilmentBaseDamage('Elemental', config);
        const stacksPerSecond = clampedHitChance * stats.burnChanceOnHit * stats.attackSpeed * stats.burnDuration;
        const maxStacks = Math.min(stacksPerSecond, stats.maxBurnStackCount);
        stats.baseBurnDamageMultiplier = calcModTotal('BaseBurnDamageMultiplier', config) / 100;
        stats.burnDamageMultiplier = 1 + calcModTotal('DamageOverTimeMultiplier', config) / 100;
        stats.minBurnDamage = min * stats.baseBurnDamageMultiplier * stats.burnDamageMultiplier;
        stats.maxBurnDamage = max * stats.baseBurnDamageMultiplier * stats.burnDamageMultiplier;

        const baseDamage = avg(stats.minBurnDamage, stats.maxBurnDamage);
        burnDps = baseDamage * maxStacks;
    }

    const ailmentDps = bleedDps + burnDps;

    stats.dps = (attackDps + ailmentDps);

    config.flags = 0;
    stats.auraDurationMultiplier = calcModIncMore('AuraDuration', 1, config);

    stats.lingeringBurn = calcModFlag('LingeringBurn', config);

}

function calcPlayerPersistantStats(stats: PlayerOptions['stats'], config: PlayerConfiguration) {
    stats.maxAura = calcModBase('AuraSlot', config);
    stats.maxArtifacts = calcModBase('MaxArtifact', config);
    stats.insightCapacity = calcModBase('Insight', config);
}

export function calcCombatAreaStats(area: CombatAreaOptions) {
    const config: Configuration = {
        flags: 0,
        source: { modDB: area.modDB, stats: area.stats }
    };

    const baseEnemyCount = area.stats.baseEnemyCount + calcModBase('EnemyCount', config);
    const maxEnemyCount = calcModIncMore('EnemyCount', baseEnemyCount, config);

    return { maxEnemyCount };
}

export function calcEnemyStats(enemy: EnemyOptions) {
    const stats = extractStats(enemy.stats || {} as StatCollection);
    const config: EnemyConfiguration = {
        flags: 0,
        source: { type: 'Enemy', conditionFlags: enemy.conditionFlags, stats, modDB: enemy.modDB }
    };

    const baseLife = stats.baseLife;
    stats.maxLife = calcModIncMore('Life', baseLife, config);

    stats.evadeChance = calcModBase('Evade', config) / 100;
    stats.reducedDamageTakenMultiplier = calcModIncMore('DamageTaken', 1, config);

    applyStatValues(enemy.stats || {} as StatCollection, stats);
}
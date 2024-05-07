import { Statistic } from './Statistic';
import { assertDefined } from 'src/shared/utils/assert';
import type * as GameSerialization from '../serialization';
import { isDefined } from 'src/shared/utils/utils';
import { compareValueTypes } from '../utils/utils';

export type StatCollection = Readonly<Record<string, Statistic>>;
export type GameStatCollection = ReturnType<typeof createGameStats>;
export type PlayerStatCollection = ReturnType<typeof createPlayerStats>;
export type EnemyStatCollection = ReturnType<typeof createEnemyStats>;


export function createGameStats(parent?: StatCollection) {
    const statList = {
        timePlayed: new Statistic({ label: 'Time Played', isTime: true }),
        maxLevel: new Statistic(),
        ascensionCount: new Statistic({ label: 'Ascensions', defaultValue: 0, hiddenBeforeMutation: true }),
        totalDamage: new Statistic(),
        totalAttackDamage: new Statistic(),
        totalDamageOverTime: new Statistic(),
        totalPhysicalAttackDamage: new Statistic(),
        totalPhysicalDamage: new Statistic(),
        totalElementalAttackDamage: new Statistic(),
        totalElementalDamage: new Statistic(),
        totalBleedDamage: new Statistic(),
        totalBurnDamage: new Statistic(),
        totalHitCount: new Statistic(),
        totalCriticalHitCount: new Statistic(),
        totalMana: new Statistic(),
    };
    if (parent) {
        Object.entries(statList).forEach(([statName, stat]) => {
            const parentStat = parent[statName as keyof typeof parent];
            assertDefined(parentStat);
            stat.addAccumulator(parentStat);
        });
    }
    return statList;
}

export function createCombatStats() {
    // const area = new Statistic({ label: 'Area', sticky: true, computed: true, type: 'text' });
    const maxEnemyCount = new Statistic({ computed: true });
    const enemyCount = new Statistic({ label: 'Enemies', sticky: true, computed: true, statFormat: (self) => [self, '/', maxEnemyCount] });
    return { maxEnemyCount, enemyCount };
}

export function createPlayerStats(gameStats: GameStatCollection) {
    const maxMana = new Statistic({ defaultValue: Infinity, computed: true });
    const minPhysicalDamage = new Statistic({ computed: true });
    const maxPhysicalDamage = new Statistic({ computed: true });
    const minElementalDamage = new Statistic({ computed: true });
    const maxElementalDamage = new Statistic({ computed: true });
    return {
        activity: new Statistic({ label: 'Activity', type: 'text', computed: true, hiddenBeforeMutation: true }),
        guildClass: new Statistic({ label: 'Player Class', type: 'text', computed: true, hiddenBeforeMutation: true }),
        level: new Statistic({ label: 'Level', sticky: true, defaultValue: 1 }),
        dps: new Statistic({ label: 'DPS', sticky: true, computed: true, decimals: 1, hoverTip: 'Damage Per Second' }),
        totalHitCount: new Statistic({ accumulators: [gameStats.totalHitCount] }),
        hitChance: new Statistic({ label: 'Hit Chance', sticky: true, computed: true, multiplier: 100, suffix: '%' }),
        attackSpeed: new Statistic({ label: 'Attack Speed', sticky: true, computed: true, decimals: 2, hoverTip: 'Attacks Per Second' }),
        attackManaCost: new Statistic({ label: 'Attack Mana Cost', computed: true }),
        attackEffectiveness: new Statistic({ computed: true }),
        attackTime: new Statistic(),
        //Mana
        maxMana,
        mana: new Statistic({ label: 'Mana', sticky: true, defaultValue: Infinity, statFormat: (self) => [self, '/', maxMana], accumulators: [gameStats.totalMana] }),
        manaRegeneration: new Statistic({ label: 'Mana Regeneration', 'decimals': 1, computed: true, sticky: true }),

        //Physical
        physicalAttackDamage: new Statistic({ label: 'Physical Attack Damage', computed: true, statFormat: () => [minPhysicalDamage, '-', maxPhysicalDamage] }),
        minPhysicalDamage,
        maxPhysicalDamage,
        //Elemental
        elementalAttackDamage: new Statistic({ label: 'Elemental Attack Damage', computed: true, statFormat: () => [minElementalDamage, '-', maxElementalDamage] }),
        minElementalDamage,
        maxElementalDamage,
        //Crit
        criticalHitChance: new Statistic({ label: 'Critical Hit Chance', computed: true, multiplier: 100, suffix: '%' }),
        criticalHitMultiplier: new Statistic({ label: 'Critical Hit Multiplier', computed: true, multiplier: 100, suffix: '%' }),
        //Bleed
        bleedChanceOnHit: new Statistic({ label: 'Bleed Chance', computed: true, multiplier: 100, suffix: '%' }),
        bleedDuration: new Statistic({ label: 'Bleed Duration', computed: true, suffix: 's', decimals: 1 }),
        maxBleedStackCount: new Statistic({ label: 'Maximum Bleed Stacks', computed: true }),
        minBleedDamage: new Statistic({ computed: true }),
        maxBleedDamage: new Statistic({ computed: true }),
        baseBleedDamageMultiplier: new Statistic({ computed: true }),
        bleedDamageMultiplier: new Statistic({ computed: true }),
        //Burn
        burnChanceOnHit: new Statistic({ label: 'Burn Chance', computed: true, multiplier: 100, suffix: '%' }),
        burnDuration: new Statistic({ label: 'Burn Duration', computed: true, decimals: 1, suffix: 's', }),
        maxBurnStackCount: new Statistic({ label: 'Maximum Burn Stacks', computed: true }),
        baseBurnDamageMultiplier: new Statistic({ computed: true }),
        burnDamageMultiplier: new Statistic({ computed: true }),
        minBurnDamage: new Statistic({ computed: true }),
        maxBurnDamage: new Statistic({ computed: true }),
        lingeringBurn: new Statistic({ computed: true, type: 'boolean' }),

        //Attributes
        strength: new Statistic({ label: 'Strength', computed: true }),
        dexterity: new Statistic({ label: 'Dexterity', computed: true }),
        intelligence: new Statistic({ label: 'Intelligence', computed: true }),

        //Skills
        auraDurationMultiplier: new Statistic({ computed: true }),
        insightCapacity: new Statistic({ computed: true }),
        maxArtifacts: new Statistic({ computed: true }),
        guildTokenCount: new Statistic(),

        trainingMultiplier: new Statistic({ defaultValue: 1, computed: true }),
        explorationMultiplier: new Statistic({ defaultValue: 1, computed: true }),
        meditationMultiplier: new Statistic({ defaultValue: 1, computed: true }),

    } as const;
}

export function createEnemyStats() {
    return {
        baseLife: new Statistic({}),
        maxLife: new Statistic({ label: 'Max Life', sticky: true }),
        life: new Statistic({ label: 'Life', sticky: true, valueColorTag: 'life' }),
        evadeChance: new Statistic({ computed: true }),
        reducedDamageTakenMultiplier: new Statistic({ computed: true }),
    } as const;
}

export function copyStats<T extends StatCollection>(stats: T): Readonly<Record<keyof T, Statistic>> {
    const copy = Object.entries(stats).reduce((a, [propName, stat]) => {
        a[propName as keyof T] = new Statistic(stat.options);
        return a;
    }, {} as Record<keyof T, Statistic>);
    return copy;
}


export function serializeStats<T extends StatCollection, U extends keyof T>(stats: T): Record<U, GameSerialization.Statistic> {
    const obj: Record<U, GameSerialization.Statistic> = Object.create({});
    for (const [key, stat] of Object.entries(stats)) {
        const hasChanged = [(stat.options.sticky || false) !== stat.sticky, !stat.options.computed && stat.mutated].some(x => x);
        if (!hasChanged) {
            continue;
        }
        obj[key as U] = { sticky: stat.sticky, value: stat.value };
    }
    return obj;
}

export function deserializeStats(statList: StatCollection, serializedStats: DeepPartial<Record<string, GameSerialization.Statistic>>) {
    for (const [key, serializedStat] of Object.entries(serializedStats)) {
        if (!isDefined(serializedStat?.value)) {
            continue;
        }
        const stat = statList[key] as Statistic | undefined;
        if (!isDefined(stat)) {
            continue;
        }
        if (compareValueTypes(serializedStat.value, stat.value)) {
            stat.set(serializedStat.value);
        }
        if (isDefined(serializedStat.sticky)) {
            stat.sticky = serializedStat.sticky;
        }
    }
}

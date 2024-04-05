import { DamageTypes } from 'src/shared/types/types';
import type { DamageType } from '../calc/calcDamage';
import type { AilmentType, EffectType } from '../effects/Effects';
import type { PlayerStatCollection, StatCollection } from '../statistics/stats';


export type StatModifierValueType = 'Base' | 'Inc' | 'More' | 'Flag';

export type CriticalStatName = 'CriticalHitChance' | 'CriticalHitMultiplier';

export type StatName =
    | DamageStatName
    | 'AttackManaCost'
    | 'AttackSpeed'
    | 'HitChance'
    | CriticalStatName
    | 'ManaRegen' | 'MaxMana'
    | `${AilmentType}Stack`
    | `Base${AilmentType}DamageMultiplier`
    | `${EffectType}Chance`
    | `${EffectType}Duration`
    | Attributes
    | 'AilmentDuration' | 'LingeringAilments'
    | 'AuraDuration'
    | 'AttackSkillCost'
    | 'Resource'
    | 'Artifact' | 'Insight'
    | EnemyStatNames
    | ZoneStatNames;

export type DamageStatName =
    | 'Damage'
    | 'MinDamage' | 'MaxDamage'
    | `Min${DamageType}Damage` | `Max${DamageType}Damage`
    | `${DamageType}Damage`
    | 'DamageOverTimeMultiplier'
    | ConversionStatName | GainAsStatName;

export const Test = [
    ...(DamageTypes.map(x => `Min${x}Damage` as const)),
    ...(DamageTypes.map(x => `Max${x}Damage` as const))
] as const;

export type ConversionStatName =
    | 'PhysicalConvertedToElemental'
    | 'ElementalConvertedToPhysical'
    | 'PhysicalConvertedToChaos'
    | 'ElementalConvertedToChaos';

export type GainAsStatName =
    | 'PhysicalGainAsElemental'
    | 'ElementalGainAsChaos'
    | 'PhysicalGainAsChaos';

export type Attributes = 'Attribute' | 'Strength' | 'Dexterity' | 'Intelligence';

type EnemyStatNames =
    | 'DamageTaken'
    | 'Evade'
    | 'Life';

type ZoneStatNames = 'EnemyCount';


export type StatModTag = StatModConditionTag | StatModMultiplierTag | StatModPerStat;
export interface StatModConditionTag {
    type: 'Condition';
    target: 'Self' | 'Other';
    flagsAny?: ConditionFlags;
    flagsAll?: ConditionFlags;
    negate?: boolean;
}

export interface StatModMultiplierTag {
    type: 'Multiplier';
    statName: KeysOfUnion<StatCollection>;
    limit?: number;
    div?: number;
}

export interface StatModPerStat {
    type: 'PerStat';
    statName: keyof PlayerStatCollection;
    index?: number;
    value?: number;
    div?: number;
}

export interface ModTemplateStat {
    name: StatName;
    valueType: StatModifierValueType;
    negate?: boolean;
    override?: boolean;
    modFlagsAny?: number;
    modFlagsAll?: number;
    tags?: ReadonlyArray<StatModTag>;
}
export type ModTemplateTarget = 'Player' | 'Enemy';
export interface ModTemplate {
    desc: string;
    stats: ReadonlyArray<ModTemplateStat>;
    tags?: ReadonlyArray<ModifierTag>;
    target?: 'Player' | 'Enemy' | 'Area';
    id: string;
}


export enum ModifierFlags {
    None = 0,
    Attack = 1 << 0,
    Physical = 1 << 1,
    Elemental = 1 << 2,
    Chaos = 1 << 3,
    Skill = 1 << 4,
    Bleed = 1 << 5,
    Burn = 1 << 6,
    DOT = ModifierFlags.Bleed | ModifierFlags.Burn,
    Ailment = 1 << 7
}

export enum ConditionFlags {
    None = 0,
    Bleed = 1 << 0,
    Burn = 1 << 1,
    DOT = ConditionFlags.Bleed | ConditionFlags.Burn
}

export type ModifierTag = typeof ModifierTags[number];
export const ModifierTags = [
    'Global',
    'Resource',
    'Damage',
    'Attack',
    'Physical',
    'Elemental',
    'Speed',
    'Mana',
    'Critical',
    'Ailment',
    'Bleed',
    'Burn',
    'Duration',
    'Skill',
    'Aura',
    'Attribute',
    'Life'
] as const;
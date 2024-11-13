import type { DamageType } from '../calc/calcDamage';
import type { AilmentType, EffectType } from '../effects/Effects';
import type { ReferenceNames } from '../gameConfig/GameConfig';
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
    | 'AilmentDuration' | 'LingeringBurn'
    | 'AuraDuration'
    | 'AttackSkillCost'
    | 'MaxArtifact' | 'ArtifactFind'
    | 'Insight' | 'AuraSlot'
    | `${'Attack' | 'Aura' | 'Passive'}SkillExpMultiplier`
    | EnemyStatNames
    | AreaStatNames
    | 'ResourceChanceOnEnemyDeath' | 'ResourceAmountOnEnemyDeath'
    ;

export type DamageStatName =
    | 'Damage'
    | 'MinDamage' | 'MaxDamage'
    | `Min${DamageType}Damage` | `Max${DamageType}Damage`
    | `${DamageType}Damage`
    | 'DamageOverTimeMultiplier'
    | DamageConvertion | DamageAsExtra;



export type DamageConvertion =
    | 'PhysicalConvertedToElemental'
    | 'ElementalConvertedToPhysical'
    | 'PhysicalConvertedToChaos'
    | 'ElementalConvertedToChaos';

export type DamageAsExtra =
    | 'PhysicalAsExtraElemental'
    | 'ElementalAsExtraChaos'
    | 'PhysicalAsExtraChaos';

export type Attributes = 'Attribute' | 'Strength' | 'Dexterity' | 'Intelligence';

type EnemyStatNames =
    | 'DamageTaken'
    | 'Evade'
    | 'Life';

type AreaStatNames = 'EnemyCount';


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

export interface ModReference {
    type: typeof ReferenceNames[number];
    name?: string;
}

export interface ModTemplateStat {
    name: StatName;
    valueType: StatModifierValueType;
    negate?: boolean;
    override?: boolean;
    modFlagsAny?: number;
    modFlagsAll?: number;
    extends?: ReadonlyArray<StatModTag>;
    reference?: ModReference;
}
export type ModTemplateTarget = 'Player' | 'Enemy';
export interface ModTemplate {
    desc: string;
    stats: ReadonlyArray<ModTemplateStat>;
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

export type ModifierTag = typeof ModifierTagList[number];
export const ModifierTagList = [
    'Global',
    'Damage',
    'DamageOverTime',
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
export const GAME_CONFIG_VERSION = 'v0' as const;

export type Components = Required<Config>['components'];
export type ComponentName = keyof Components;

export interface Config {
    version: typeof GAME_CONFIG_VERSION;
    playerStartModList: PlayerStartModList;
    resources: Resource[];
    worlds: Worlds;
    components?: {
        guildHall?: GuildHall;
        character?: Character;
        weapon?: Weapon;
        treasury?: Treasury;
        achievements?: Achievements;
    };
}

export interface Requirements {
    curLevel?: Level;
    // maxLevel?: Level;
    /**@TJS-minimum 1 */
    world?: UnsignedInteger;
}

export interface Resource {
    id: Id;
    name: ResourceName;
    sticky: boolean;
    hiddenBeforeMutation: boolean;
}

export interface Enemy {
    id: Id;
    name: Name;
    level?: Level;
    weight?: Weight;
    modList?: EnemyModList;
}

export interface Worlds {
    enemyBaseLifeList: EnemyBaseLifeList;
    enemyBaseCountList: EnemyBaseCountList;
    /**@TJS-minItems 1 */
    worldList: {
        id: Id;
        modList: WorldModList;
        /**@TJS-minItems 1 */
        enemyList: Enemy[];
    }[];
}

export interface Weapon {
    levelList?: {
        upgradeCost?: Cost;
        modList: WeaponUpgradeModList;
    }[];
    weaponTypeList?: WeaponType[];
    modLists: WeaponMod[][];
    crafting: {
        advancedReforge: {
            requirements: Requirements;
        };
        craftList: WeaponCraft[];
    };
}
export interface WeaponType {
    id: Id;
    name: WeaponTypeName;
}
export interface WeaponMod {
    id: Id;
    level: Level;
    weight: Weight;
    mod: PlayerMod;
    weaponTypes?: WeaponTypeName[];
}
export interface WeaponCraft {
    desc: WeaponCraftDescription;
    cost?: Cost;
    successRates: { min: UnsignedInteger; max: UnsignedInteger; };
}

export interface Character {
    levelList?: {
        upgradeCost?: Cost;
        modList: SkillsUpgradeModList;
    }[];
    attackSkills?: {
        /**TJS-minItems 1 */
        attackSkillList: AttackSkill[];
    };
    auraSkills?: {
        levelReq?: Level;
        /**TJS-minItems 1 */
        auraSkillList: AuraSkill[];
    };
    passiveSkills?: {
        insightCapacityEnhancerList: {
            id: Id;
            name: Name;
            insight: UnsignedInteger;
            probabilities: Probability[];
        }[];
        /**TJS-minItems 1 */
        passiveSkillList: PassiveSkill[];
    };
}
export interface AttackSkill {
    id: Id;
    name: Name;
    requirement?: { characterLevel: Level; };
    manaCost: UnsignedInteger;
    /**@TJS-default 1 @TJS-minimum 0.1 */
    attackSpeed: number;
    /**@TJS-default 100 */
    attackEffectiveness: UnsignedInteger;
    modList: PlayerModList;
    /**@description 1 exp gained per attack */
    exp?: Exp;
}
export interface AuraSkill {
    id: Id;
    name: Name;
    requirement?: { characterLevel: Level; };
    manaCost: UnsignedInteger;
    baseDuration: UnsignedInteger;
    modList: PlayerModList;
    /**@description 1 exp gained per second while active */
    exp?: UnsignedInteger;
}
export interface PassiveSkill {
    id: Id;
    name: Name;
    requirement?: { characterLevel: Level; };
    /**@description only first rank requires this property */
    insightCost?: UnsignedInteger;
    modList: PlayerModList;
    /**@description 1 exp gained per second while active */
    exp?: UnsignedInteger;
}

export interface Treasury {
    requirements?: Requirements;
    levelList?: {
        upgradeCost?: Cost;
        modList: TreasuryUpgradeModList;
    }[];
    artifacts?: Artifacts;
}

export interface Artifacts {
    requirements?: Requirements;
    artifactList: Artifact[];
}
export interface Artifact {
    id: Id;
    name: Name;
    modList: PlayerModList;
    probability?: Probability;
    exp?: UnsignedInteger;
}

export type GuildName = 'Vanguard' | 'Wanderer' | 'Arcane';

export interface GuildHall {
    requirements?: Requirements;
    levelList?: {
        upgradeCost?: Cost;
        modList: GuildHallModList;
    }[];
    guildList: Guild[];
    guildClassList: GuildClass[];
}
export interface Guild {
    name: GuildName;
    modList: PlayerModList;
}
/**@uniqueItemProperties {["id"]} */
export interface GuildClass {
    id: Id;
    guildName: GuildName;
    name: Name;
    modList: PlayerModList;
}

export interface Achievements {
    achievementList: Achievement[];
}
export interface Achievement {
    description: AchievementDescription;
}

export const SchemaOverrideSymbolNames = [
    'PlayerMod',
    'PlayerStartMod',
    'EnemyMod',
    'EnemyBaseLife',
    'EnemyBaseCount',
    'SkillsUpgradeMod',
    'WeaponUpgradeMod',
    'WeaponCraftDescription',
    'TreasuryUpgradeMod',
    'GuildHallMod',
    'WorldMod',
    'AchievementDescription'
] as const satisfies readonly string[];
export type SchemaOverrideSymbolName = typeof SchemaOverrideSymbolNames[number];

/**
 * @TJS-type integer
 * @TJS-minimum 0
 */
type UnsignedInteger = number;

/**
 * @TJS-type integer
 * @TJS-minimum 1
 * @default 1
 */
type Level = number;

/**@$ref #/definitions/Id */
type Id = string;

/**
 * @TJS-type integer
 * @TJS-minimum 0
 * @TJS-default 100
 */
type Weight = number;

/**
 * @TJS-type integer
 * @TJS-minimum 1
 * @TJS-default 100
 * @TJS-description Percent = 1/Probability
 */
type Probability = number;

/**
 * @TJS-type integer
 * @TJS-minimum 1
 * @TJS-default 0
 */
type Exp = number;

/**@TJS-pattern ^[A-Za-z 0-9]{3,32}$*/
type Name = string;

// /**@pattern ^[A-Za-z .,!?0-9]{3,128}$ */
// type FlavourText = string;

/**
 * @TJS-type integer
 * @minimum 1
 * @maximum 9007199254740991
 */
type EnemyBaseLife = number;

/**
 * @description Enemy life for each level starting at level 1. This will determine the max level. Max Level == array.length + 1.
 * @items {"$ref": "#/definitions/EnemyBaseLife"}
*/
type EnemyBaseLifeList = EnemyBaseLife[];

/**
 * @TJS-type integer
 * @minimum 1
 * @maximum 9007199254740991
 */
type EnemyBaseCount = number;

/**
 * @description Number of enemies for each level starting at level 1
 * @items {"$ref": "#/definitions/EnemyBaseCount"}
 */
type EnemyBaseCountList = EnemyBaseCount[];

/**@$ref #/definitions/PlayerMod */
type PlayerMod = string;
/**@items {"$ref": "#/definitions/PlayerMod"} */
type PlayerModList = PlayerMod[];

/**@$ref #/definitions/PlayerStartMod */
type PlayerStartMod = string;
/**@items {"$ref": "#/definitions/PlayerStartMod"} */
type PlayerStartModList = PlayerStartMod[];

/**@$ref #/definitions/EnemyMod */
type EnemyMod = string;
/**@items {"$ref": "#/definitions/EnemyMod"}*/
type EnemyModList = EnemyMod[];

/**@$ref #/definitions/SkillsUpgradeMod */
type SkillsUpgradeMod = string;
/**@items {"$ref": "#/definitions/SkillsUpgradeMod"} */
type SkillsUpgradeModList = SkillsUpgradeMod[];

/**@$ref #/definitions/WeaponUpgradeMod */
type WeaponUpgradeMod = string;
/**@items {"$ref": "#/definitions/WeaponUpgradeMod"} */
type WeaponUpgradeModList = WeaponUpgradeMod[];

/**@$ref #/definitions/WeaponCraftDescription */
type WeaponCraftDescription = string;

/**@$ref #/definitions/TreasuryUpgradeMod */
type TreasuryUpgradeMod = string;
/**@items {"$ref": "#/definitions/TreasuryUpgradeMod"} */
type TreasuryUpgradeModList = TreasuryUpgradeMod[];

/**@$ref #/definitions/GuildHallMod */
type GuildHallMod = string;
/**@items {"$ref": "#/definitions/GuildHallMod"} */
type GuildHallModList = GuildHallMod[];

/**@$ref #/definitions/WorldMod */
type WorldMod = string;
/**@items {"$ref": "#/definitions/WorldMod"} */
type WorldModList = WorldMod[];

/**@$ref #/definitions/AchievementDescription */
type AchievementDescription = string;


export interface Cost {
    name: ResourceName;
    value: UnsignedInteger;
}

export const ReferenceNames = ['Resource'] as const;

//User Override
export const WeaponTypeNames = ['One Handed Sword', 'Two Handed Axe', 'Wand', 'Staff'] as const satisfies readonly Name[];
export type WeaponTypeName = typeof WeaponTypeNames[number] extends undefined ? Name : typeof WeaponTypeNames[number];

export const ResourceNames = ['Gold', 'Silver', 'Copper'] as const satisfies readonly Name[];
export type ResourceName = typeof ResourceNames[number] extends undefined ? Name : typeof ResourceNames[number];
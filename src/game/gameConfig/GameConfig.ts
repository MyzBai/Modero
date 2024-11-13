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
        blacksmith?: Blacksmith;
        treasury?: Treasury;
        achievements?: Achievements;
    };
}

export interface Requirements {
    curLevel?: Level;
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

export interface Blacksmith {
    levelList?: {
        upgradeCost?: Cost;
        modList: BlacksmithUpgradeModList;
    }[];
    /**@TJS-minItems 1 */
    itemList: {
        id: Id;
        name: BlacksmithItemName;
        reforgeWeights: UnsignedInteger[];
    }[];
    modLists: BlacksmithMod[][];
    crafting: {
        advancedReforge: {
            requirements: { blacksmithLevel: Level; };
        };
        craftList: BlacksmithCraft[];
    };
}
export interface BlacksmithMod {
    id: Id;
    level: Level;
    weight: Weight;
    mod: PlayerMod;
    itemFilter?: BlacksmithItemName[];
}
export interface BlacksmithCraft {
    desc: BlacksmithCraftDescription;
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
        requirements: { characterLevel: Level; };
        /**TJS-minItems 1 */
        auraSkillList: AuraSkill[];
    };
    passiveSkills?: {
        /**TJS-minItems 1 */
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
    /**@description only applies to first rank */
    requirements?: { characterLevel: Level; };
    /**@TJS-minItems 1 */
    rankList: {
        /**@description 1 exp gained per attack */
        exp?: Exp;
        manaCost: UnsignedInteger;
        /**@TJS-default 1 @TJS-minimum 0.1 */
        attackSpeed: number;
        /**@TJS-default 100 */
        attackEffectiveness: UnsignedInteger;
        modList: PlayerModList;
    }[];
}
export interface AuraSkill {
    id: Id;
    name: Name;
    /**@description only applies to first rank */
    requirements?: { characterLevel: Level; };
    /**@TJS-minItems 1 */
    rankList: {
        /**@description 1 exp gained per attack */
        exp?: Exp;
        manaCost: UnsignedInteger;
        baseDuration: UnsignedInteger;
        modList: PlayerModList;
    }[];
}
export interface PassiveSkill {
    id: Id;
    name: Name;
    /**@description only applies to first rank */
    requirements?: { characterLevel: Level; };
    insightCost: UnsignedInteger;
    /**@TJS-minItems 1 */
    rankList: {
        /**@description 1 exp gained per attack */
        exp?: Exp;
        modList: PlayerModList;
    }[];
}

export interface Treasury {
    requirements?: Requirements;
    /**@TJS-minItems 1 */
    levelList?: {
        upgradeCost?: Cost;
        modList: TreasuryUpgradeModList;
    }[];
    artifacts?: Artifacts;
}

export interface Artifacts {
    /**@TJS-minItems 1 */
    artifactList: Artifact[];
}
export interface Artifact {
    id: Id;
    name: Name;
    probability?: Probability;
    /**@TJS-minItems 1 */
    rankList: {
        /**@description 1 exp everytime its found */
        exp?: UnsignedInteger;
        modList: PlayerModList;
    }[];
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

export interface GuildClass {
    id: Id;
    guildName: GuildName;
    requirements?: { guildHallLevel: Level; }
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
    'BlacksmithUpgradeMod',
    'BlacksmithCraftDescription',
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

/**@$ref #/definitions/BlacksmithUpgradeMod */
type BlacksmithUpgradeMod = string;
/**@items {"$ref": "#/definitions/BlacksmithUpgradeMod"} */
type BlacksmithUpgradeModList = BlacksmithUpgradeMod[];

/**@$ref #/definitions/BlacksmithCraftDescription */
type BlacksmithCraftDescription = string;

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
export const BlacksmithItemNames = ['Weapon', 'Armour'] as const satisfies readonly Name[];
export type BlacksmithItemName = typeof BlacksmithItemNames[number] extends undefined ? Name : typeof BlacksmithItemNames[number];

export const ResourceNames = ['Gold', 'Silver', 'Copper'] as const satisfies readonly Name[];
export type ResourceName = typeof ResourceNames[number] extends undefined ? Name : typeof ResourceNames[number];
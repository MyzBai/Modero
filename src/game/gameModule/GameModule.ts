export const GAME_MODULE_VERSION = 'v0' as const;

export type Components = Required<GameModule>['components'];
export type ComponentName = keyof Components;

export interface GameModule {
    $schema?: string;
    version: typeof GAME_MODULE_VERSION;
    resourceList?: Resource[];
    player?: Player;
    enemyBaseLifeList: EnemyBaseLifeList;
    enemyBaseCountList: EnemyBaseCountList;
    enemyList: Enemy[];
    components?: {
        playerClasses?: PlayerClasses;
        skills?: Skills;
        weapon?: Weapon;
        artifacts?: Artifacts;
        ascension?: Ascension;
        achievements?: Achievements;
    };
}

export interface Resource {
    id: Id;
    name: ResourceName;
    hiddenBeforeMutation?: boolean;
    stickyByDefault?: boolean;
}

export interface Requirements {
    curLevel?: Level;
    maxLevel?: Level;
    ascensionCount?: Level;
}

export interface Player {
    /**@description Default modifiers*/
    modList: GlobalPlayerModList;
}

export interface Enemy {
    id: Id;
    name: Name;
    level: Level;
    weight: number;
    modList: EnemyModList;
    // /**@description only what is specified will be overwritten if using global rewards list */
    // rewards?: Rewards;
}

export type EnemyReward = ResourceReward;
export type Rewards = EnemyReward[] | { [K: string]: EnemyReward[]; };

export interface ResourceReward {
    type: 'Resource';
    name: ResourceName;
    pickProbability: PickProbability;
    quantity: [number] | [number, number];
    level: Level;
}

export interface World {
    /**@minItems 1 */
    enemyZoneList: EnemyZone[];
    /**@minItems 1 */
    enemyList: Enemy[];
}
export interface EnemyZone {
    level: Level;
    /**@TJS-default 100 */
    enemyCount: Integer;
}

export interface Weapon {
    level?: Level;
    weaponTypeList?: WeaponType[];
    modLists: WeaponMod[][];
    crafting: {
        craftList: WeaponCraft[];
    };
}
export interface WeaponType {
    name: WeaponTypeName;
    id?: Id;
}
export interface WeaponMod {
    level: Level;
    weight: Weight;
    mod: PlayerMod;
    weaponTypes?: WeaponTypeName[];
}
export interface WeaponCraft {
    desc: WeaponCraftDescription;
    pickProbability: PickProbability;
    startCount?: UnsignedInteger;
}

export interface PlayerClasses {
    requirement?: Requirements;
    classList: {
        id: Id;
        name: Name;
        modList: PlayerModList;
        isDefault?: boolean;
    }[];
}

export interface Skills {
    attackSkills?: {
        attackSkillList: AttackSkill[];
    };
    auraSkills?: {
        auraSkillList: AuraSkill[];
        auraSkillSlotList: AuraSkillSlot[];
    };
    passiveSkills?: {
        insightCapacityEnhancerList: {
            name: Name;
            insight: UnsignedInteger;
            pickProbability: PickProbability;
            maxCount: UnsignedInteger;
            flavourText?: FlavourText;
        }[];
        passiveSkillList: PassiveSkill[];
    };
}
export interface AttackSkill {
    id: Id;
    name: Name;
    pickProbability: PickProbability;
    manaCost: UnsignedInteger;
    /**@TJS-default 1 */
    attackSpeed: number;
    /**@TJS-default 100 */
    attackEffectiveness: UnsignedInteger;
    modList: PlayerModList;
}
export interface AuraSkill {
    id: Id;
    name: Name;
    pickProbability: PickProbability;
    manaCost: UnsignedInteger;
    baseDuration: UnsignedInteger;
    modList: PlayerModList;
}
export interface AuraSkillSlot {
    level: Level;
}
export interface PassiveSkill {
    id: Id;
    name: Name;
    pickProbability: PickProbability;
    insight: UnsignedInteger;
    modList: PlayerModList;
}

export interface Artifacts {
    artifactList: Artifact[];
}
export interface Artifact {
    id: Id;
    name: string;
    modList: PlayerModList;
    pickProbability: PickProbability;
}

export interface Ascension {
    overLord: AscensionOverLord;
    ascensionInstanceList: AscensionInstance[];
}
export interface AscensionOverLord {
    name: string;
    modList: EnemyModList;
}
export interface AscensionInstance {
    id: Id;
    /**
     * @description these modifiers will be applied upon ascending
     * @items {"anyOf": [{"$ref": "#/definitions/PlayerMod"}, {"$ref": "#/definitions/AreaMod"}] }
     */
    modList: (PlayerMod | AreaMod)[];
}

export interface Achievements {
    achievementList: Achievement[];
}
export interface Achievement {
    description: AchievementDescription;
    modList?: AchievementModList;
}

export const enum SchemaOverrideNames {
    Cost = 'Cost',
    AreaMod = 'AreaMod',
    PlayerMod = 'PlayerMod',
    GlobalPlayerMod = 'GlobalPlayerMod',
    EnemyMod = 'EnemyMod',
    WeaponCraftDescription = 'WeaponCraftDescription',
    AchievementDescription = 'AchievementDescription',
}

// export type EnemyType = 'Normal' | 'Boss';

export const WeaponTypeNames = ['One Handed Sword', 'Two Handed Axe', 'Wand', 'Staff'] as const satisfies readonly string[];
export type WeaponTypeName = typeof WeaponTypeNames[number] extends undefined ? string : typeof WeaponTypeNames[number];

export const ResourceNames = [] as const satisfies readonly string[];
export type ResourceName = typeof ResourceNames[number] extends undefined ? string : typeof ResourceNames[number];

// export const ArtifactNames = [] as const satisfies string[];
// type ArtifactName = typeof ArtifactNames[number] extends undefined ? string : typeof ArtifactNames[number];

/**
 * @default 1
 */
type Level = UnsignedInteger;

/**
 * @TJS-type integer
 */
type Integer = number;

/**@TJS-type integer @TJS-minimum 0 */
type UnsignedInteger = number;

/**
 * @TJS-pattern ^[a-f0-9]{6}$
 * @TJS-body {"test":5}
 */
/**@$ref #/definitions/Id */
type Id = string;

/**
 * @TJS-default 100
 */
type Weight = UnsignedInteger;

/**
 * @TJS-default 100
 * @TJS-description Probability = 1/PickProbability
 */
type PickProbability = UnsignedInteger;


/**
 * @TJS-pattern ^[A-Za-z 0-9]{3,32}$
 */
type Name = string;

/**@pattern ^[A-Za-z .,!?0-9]{3,128}$ */
type FlavourText = string;

/**@minimum 1 @maximum 9007199254740991 */
type EnemyBaseLife = Integer;
/**@description Enemy life for each level starting at level 1. This will determine the max level. Max Level == array.length + 1.*/
type EnemyBaseLifeList = EnemyBaseLife[];

/**@minimum 1 @maximum 9007199254740991 */
type EnemyBaseCount = Integer;
/**@description Number of enemies for each level starting at level 1 */
type EnemyBaseCountList = EnemyBaseCount[];

/**@$ref #/definitions/PlayerMod */
type PlayerMod = string;
/**@items {"$ref": "#/definitions/PlayerMod"} */
type PlayerModList = PlayerMod[];

/**@$ref #/definitions/GlobalPlayerMod */
type GlobalPlayerMod = string;
/**@items {"$ref": "#/definitions/GlobalPlayerMod"} */
type GlobalPlayerModList = GlobalPlayerMod[];

/**@$ref #/definitions/AreaMod */
type AreaMod = string;
// /**@items {"$ref": "#/definitions/AreaMod"} */
// type AreaModList = AreaMod[];

/**@$ref #/definitions/EnemyMod */
type EnemyMod = string;
/**@items {"$ref": "#/definitions/EnemyMod"}*/
type EnemyModList = EnemyMod[];

/**@$ref #/definitions/AchievementDescription */
type AchievementDescription = string;
/**@items {"$ref": "#/definitions/PlayerMod"} */
type AchievementModList = string[];

// /**@items {"$ref": "#/definitions/WeaponCraftDescription"} */
// type WeaponCraftDescriptionList = string[];
/**@$ref #/definitions/WeaponCraftDescription */
type WeaponCraftDescription = string;
// /**@$ref #/definitions/WeaponCraftId */
// type WeaponCraftId = string;

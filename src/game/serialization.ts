import type { EffectType } from './effects/Effects';
import type { SerializedModifier } from './mods/Modifier';
import type { GameStatCollection, PlayerStatCollection } from './statistics/stats';

export type UnsafeSerialization = DeepPartial<Serialization>;

export interface Serialization {
    meta: Meta;
    game?: Game;
    player?: Player;
    world?: World;
    statistics?: Statistics;
    effects?: Effects;
    notifications?: Notifications;
    //components
    playerClasses?: PlayerClasses;
    weapon?: Weapon;
    skills?: Skills;
    artifacts?: Artifacts;
    ascension?: Ascension;
    elementHighlightIdList?: string[];
}

export interface Meta {
    gameConfigId: string;
    createdAt?: number;
    lastSavedAt?: number;
}

export interface Game {
    stats: Record<keyof GameStatCollection, Statistic>;
}

export interface Player {
    stats: Record<keyof PlayerStatCollection, Statistic>;
}

export interface World {
    zone?: Zone;
}

export interface Zone {
    enemyCount: number;
    enemy?: EnemyInstance;
    enemyId?: string;
    active: boolean;
}

export interface Enemy {
    enemyInstance: EnemyInstance;
}

export interface EnemyInstance {
    lifeFraction: number;
    modList: Omit<SerializedModifier, 'text'>[];
}

export interface Statistics {
    groups: Record<string, StatisticGroup>;
}

export interface StatisticGroup {
    pageHeaderOpenState: boolean;
    sideHeaderOpenState: boolean;
}

export interface Statistic {
    value: number;
    sticky: boolean;
}

export interface Notifications {
    notificationList: {
        title: string;
        description?: string;
        time: number;
        elementId: string | null | undefined;
        seen: boolean;
    }[];
}

export interface Effects {
    effectList: Effect[];
}

export interface Effect {
    type: EffectType;
    timePct: number;
    effectivenessFactor?: number;
}

export interface PlayerClasses {
    activePlayerClassName: string;
    playerClassList: {
        name: string;
    }[];
}

export interface Weapon {
    weaponTypeId?: string;
    modList: SerializedModifier[];
    crafting: WeaponCrafting;
}
export interface WeaponCrafting {
    craftList: { id: string; count: number; }[];
    modList?: SerializedModifier[];
}

export interface Skills {
    attackSkills?: {
        skillName: string;
        skillList: {
            name: string;
            expFac: number;
        }[];
    };
    auraSkills?: {
        skillSlotList: ({
            skillName: string;
            timePct: number;
        } | undefined)[];
        skillList: {
            name: string;
            expFac: number;
        }[];
    };
    passiveSkills?: {
        insightCapacityEnhancerList: { name: string; count: number; }[];
        passiveList: {
            name: string;
            allocated: boolean;
            expFac: number;
        }[];
    };
}

export interface Artifacts {
    artifactNameList: {
        name: string;
        assigned: boolean;
        expFac: number;
    }[];
}

export interface Ascension {
    ascensionInstanceId?: string;
    state?: string;
    zone?: Zone;
}

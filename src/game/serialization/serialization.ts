import type { EffectType } from '../effects/Effects';
import type { SerializedModifier } from '../mods/Modifier';
import type { GameStatCollection, PlayerStatCollection } from '../statistics/stats';

export type UnsafeSerialization = DeepPartial<Serialization>;

export interface Serialization {
    meta: Meta;
    game?: Game;
    player?: Player;
    world?: World;
    statistics?: Statistics;
    effects?: Effect[];
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
    moduleId: string;
    createdAt?: number;
    lastSavedAt?: number;
}

export interface Game {
    stats: Record<keyof GameStatCollection, Statistic>;
    resources: Record<string, Statistic>;
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
        elementSourceId?: string | null | undefined;
        seen: boolean;
    }[];
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
    activeWeaponInstance: WeaponInstance;
    tempWeaponInstance: WeaponInstance | undefined;
    craftList: {
        id: string;
        craftCount: number;
    }[];
}
export interface WeaponInstance {
    weaponTypeId?: string;
    weaponModList: (SerializedModifier & { groupIndex: number; })[];
}

export interface Skills {
    attackSkills?: {
        skillName: string;
        skillNameList: string[];
    };
    auraSkills?: {
        skillSlotList: ({
            skillName: string;
            timePct: number;
        } | undefined)[];
        skillNameList: string[];
    };
    passiveSkills?: {
        insightCapacityEnhancerList: { name: string; count: number; }[];
        passiveList: { name: string; allocated: boolean; }[];
    };
}

export interface Artifacts {
    artifactNameList: { name: string; assigned: boolean; }[];
}

export interface Ascension {
    id?: string; //this points to most recent ascension
    ascendState: string;
    zone?: Zone;
}

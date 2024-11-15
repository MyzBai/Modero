import type { EffectType } from './effects/Effects';
import type { SerializedModifier } from './mods/Modifier';
import type { GameStatCollection, PlayerStatCollection } from './statistics/stats';

export type UnsafeSerialization = DeepPartial<Serialization>;

export interface Serialization {
    meta: Meta;
    game?: Game;
    player?: Player;
    worlds?: Worlds;
    statistics?: Statistics;
    effects?: Effects;
    notifications?: Notifications;
    //components
    guildHall?: GuildHall;
    blacksmith?: Blacksmith;
    character?: Character;
    treasury?: Treasury;
    elementHighlightIdList?: string[];
}

export interface Meta {
    gameConfigId: string;
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
    combatCtx?: CombatContext;
}

export interface Worlds {
    combatCtx?: CombatContext;
}

export interface CombatContext {
    enemyCount: number;
    enemy?: EnemyInstance;
    enemyId?: string;
    active: boolean;
}

export interface Enemy {
    enemyInstance: EnemyInstance;
}

export interface EnemyInstance {
    lifeRatio: number;
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

export interface GuildHall {
    level?: number;
    classId?: string;
}

export interface Blacksmith {
    level?: number;
    itemList: {
        id: string;
        modList: SerializedModifier[];
        modListCrafting?: SerializedModifier[];
        advReforge?: { count: number; modItems: { text: string; tier: number; }[]; };
    }[];
}

export interface Character {
    level?: number;
    attackSkills?: {
        skillId: string;
        skillList: {
            id: string;
            curRank: number;
            maxRank: number;
            expFac: number;
        }[];
    };
    auraSkills?: {
        skillList: {
            id: string;
            skillSlot?: { index: number; timePct: number; };
            curRank: number;
            maxRank: number;
            expFac: number;
        }[];
    };
    passiveSkills?: {
        insightCapacityEnhancerList: { id: string; }[];
        passiveList: {
            id: string;
            allocated: boolean;
            curRank: number;
            maxRank: number;
            expFac: number;
        }[];
    };
}

export interface Treasury {
    level?: number;
    exp?: number;
    expanding?: boolean;
    artifacts?: {
        artifactNameList: {
            id: string;
            assigned: boolean;
            expFac: number;
        }[];
    };
}
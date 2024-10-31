import type GameConfig from '../gameConfig/GameConfigExport';
import type { ModifierTag } from '../mods/types';
import type { Statistic } from '../statistics/Statistic';

export const compareValueTypes = (v1: number, v2: number): v1 is typeof v2 => typeof v1 === typeof v2;

export function getFormattedTag(tag: ModifierTag) {
    return `<span data-tag="${tag.toLowerCase()}">${tag}</span>`;
}

export function evalCost(cost: GameConfig.Cost, resources: GameConfig.Resource[], resourceStats: Record<string, Statistic>) {
    const id = resources.findStrict(x => x.name === cost.name).id;
    const stat = resourceStats[id]!;
    return stat.value >= cost.value;
}

export function subtractCost(cost: GameConfig.Cost, resources: GameConfig.Resource[], resourceStats: Record<string, Statistic>) {
    const id = resources.findStrict(x => x.name === cost.name).id;
    const stat = resourceStats[id]!;
    stat.subtract(cost.value);
}
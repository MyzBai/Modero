import { assertDefined } from '../../shared/utils/assert';
import { game } from '../game';
import type GameConfig from '../gameConfig/GameConfigExport';
import type { ModifierTag } from '../mods/types';

export const compareValueTypes = (v1: number, v2: number): v1 is typeof v2 => typeof v1 === typeof v2;

export function getFormattedTag(tag: ModifierTag) {
    return `<span data-tag="${tag.toLowerCase()}">${tag}</span>`;
}

export function getResourceByName(name: string) {
    const id = game.gameConfig.resources.findStrict(x => x.name === name).id;
    const resource = game.resources[id];
    assertDefined(resource);
    return resource;
}

export function evalCost(cost: GameConfig.Cost) {
    const stat = getResourceByName(cost.name);
    return stat.value >= cost.value;
}

export function subtractCost(cost: GameConfig.Cost) {
    const resource = getResourceByName(cost.name);
    resource.subtract(cost.value);
}
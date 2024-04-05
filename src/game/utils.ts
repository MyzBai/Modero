import type { Requirements } from 'src/game/gameModule/GameModule';
import { game, player } from './game';
import type { ModifierTag } from './mods/types';

export const compareValueTypes = (v1: number, v2: number): v1 is typeof v2 => typeof v1 === typeof v2;

// export function evalCosts(costs: Cost[], resources: ResourceStatList) {
//     return costs.every(x => {
//         const { propertyName, value } = extractCost(x);
//         return (resources[propertyName]?.value || 0) >= value;
//     });
// }

// export function subtractResources(costs: Cost[], resources: ResourceStatList) {
//     for (const cost of costs) {
//         const { propertyName, value } = extractCost(cost);
//         resources[propertyName]?.subtract(value);
//     }
// }

export function getFormattedTag(tag: ModifierTag) {
    return `<span data-tag="${tag.toLowerCase()}">${tag}</span>`;
}

export function executeRequirement(requirement: Requirements, callback: () => void) {
    const requirements = [];
    if (requirement.curLevel) {
        requirements.push({ stat: player.stats.level, value: requirement.curLevel });
    }
    if (requirement.maxLevel) {
        requirements.push({ stat: game.stats.maxLevel, value: requirement.maxLevel });
    }
    if (requirement.ascensionCount) {
        requirements.push({ stat: game.stats.ascensionCount, value: requirement.ascensionCount });
    }

    let count = 0;
    if (count === requirements.length) {
        callback();
        return;
    }
    for (const requirement of requirements) {
        requirement.stat.registerTargetValueCallback(requirement.value, () => {
            count++;
            if (count === requirements.length) {
                callback();
            }
        });
    }
}
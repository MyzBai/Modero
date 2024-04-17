import { game, player } from '../game';
import type { Requirements } from '../gameConfig/GameConfig';


export function evaluateStatRequirements(requirement: Requirements | undefined, callback: () => void) {
    const requirements = [];
    if (requirement?.curLevel) {
        requirements.push({ stat: player.stats.level, value: requirement.curLevel });
    }
    if (requirement?.maxLevel) {
        requirements.push({ stat: game.stats.maxLevel, value: requirement.maxLevel });
    }
    if (requirement?.ascensionCount) {
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
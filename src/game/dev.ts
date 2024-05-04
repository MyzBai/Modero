import { combat, game, gameLoop, gameLoopAnim, player, world } from './game';
import { loadGame } from '../shared/utils/saveManager';
import { CombatArea } from './combat/CombatArea';
import { assertDefined } from 'src/shared/utils/assert';

declare global {
    interface Window {
        idleAscension: ReturnType<typeof initDevTools>;
    }
}

export function initDevTools() {
    console.groupCollapsed('Dev tools enabled');
    console.log('Dev tools: window.idleAscension');
    console.log('Press Space to toggle Game Loop', '(state indicated by * in tab title)');
    console.groupEnd();

    document.body.addEventListener('keydown', toggleLoop);

    return {
        save: () => game.gameConfigId && game.saveGame(),
        printSave: () => game.gameConfigId && loadGame(game.gameConfigId),
        game,
        player,
        getEnemy: () => combat.enemy,
        setLevel: (level: number) => player.stats.level.set(level),
        setAscension: (count: number) => game.stats.maxLevel.value >= game.maxLevel ? game.stats.ascensionCount.set(count) : console.error('reach max level first'),
        skipTime: (time: number, units: 'ms' | 'sec' | 'min' = 'ms') => {
            switch (units) {
                case 'sec': time *= 1000; break;
                case 'min': time *= 1000 * 60; break;
            }
            console.time('Skip Time');
            gameLoop.skipTime(time);
            console.timeEnd('Skip Time');
        },
        killEnemies: (count: number, worldProgression = true) => {
            const area = worldProgression ? world.area : new CombatArea({
                areaModList: [],
                candidates: game.gameConfig.enemyList.filter(x => (x.level ?? 1) <= player.level),
                enemyBaseCount: Number.isFinite(count) ? count : 0,
                enemyBaseLife: 1,
                name: '',
                excludeGlobalAreaMods: true
            });
            assertDefined(area);
            combat.startArea(area);
            for (let i = 0; i < count; i++) {
                combat.dealDamage(Infinity);
            }
            combat.startArea(null);
        },
        dispose: () => {
            document.body.removeEventListener('keydown', toggleLoop);
        }
    };
}

function toggleLoop(e: KeyboardEvent) {
    if (e.code !== 'Space' || document.activeElement?.tagName.toLowerCase() === 'input') {
        return;
    }
    e.preventDefault();
    gameLoop.toggleState();
    gameLoopAnim.toggleState();
    document.title = document.title.startsWith('*') ? document.title.slice(1) : `*${document.title}`;
}
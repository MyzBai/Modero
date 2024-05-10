import { combat, game, gameLoop, gameLoopAnim, player } from './game';
import { loadGame } from '../shared/utils/saveManager';

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

        setLoopSpeed: (speed: number) => {
            gameLoop.setSpeed(speed);
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
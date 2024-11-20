import { combat, game, gameLoop, gameLoopAnim, player, statistics } from './game';
import { loadGame } from '../shared/utils/saveManager';

declare global {
    interface Window {
        idleAscension?: ReturnType<typeof initDevTools>;
    }
    interface GlobalEventHandlersEventMap {
        'Dev:AddArtifact': CustomEvent<string>;
        'Dev:IncreaseArtifactRank': CustomEvent<string>;
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
        combat,
        getEnemy: () => combat.enemy,
        setLevel: (level: number) => game.stats.level.set(level),
        addResource: (name: string, amount: number) => {
            Object.values(game.resources).find(x => x.options.label?.toLowerCase() === name.toLowerCase())?.add(amount);
            statistics.updateStats('Resources');
        },
        addArtifact: (baseName: string) => window.dispatchEvent(new CustomEvent('Dev:AddArtifact', { detail: baseName })),
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
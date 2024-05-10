import { CombatArea } from 'src/game/combat/CombatArea';
import { combat, game, player } from 'src/game/game';
import * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Guild } from './Guilds';
import { clamp } from 'src/shared/utils/utils';
import { assertNullable } from 'src/shared/utils/assert';

let tickCallback: (() => void) | undefined | null = undefined;

export function startActivity(guild: Guild, activity: GameConfig.GuildActivity) {
    player.stats.activity.setText(activity.name);
    const multiplier = (activity.multiplier[guild.level - 1] || 100) / 100;
    switch (activity.name) {
        case 'Training': startTraining(multiplier); break;
        case 'Exploring': startExploration(multiplier); break;
        case 'Meditation': startMeditation(multiplier); break;
    }

    assertNullable(tickCallback);
    tickCallback = tick.bind(guild);
    game.tickSecondsEvent.listen(tickCallback);
}

export function stopActivity() {
    player.stats.activity.setDefault();
    player.stats.trainingMultiplier.setDefault();
    player.stats.explorationMultiplier.setDefault();
    player.stats.meditationMultiplier.setDefault();
    player.modDB.removeBySource('GuildActivity');
    combat.stopArea();
    combat.startArea(null);

    if (tickCallback) {
        game.tickSecondsEvent.removeListener(tickCallback);
        tickCallback = null;
    }
}

function tick(this: Guild) {
    this.exp++;
    if (this.exp >= this.maxExp) {
        if (this.level < this.data.levels.length) {
            this.exp = 0;
        }
        this.level = clamp(this.level, 0, this.data.levels.length - 1);
    }
}

function startTraining(multiplier: number) {
    const area = new CombatArea({
        name: 'Training',
        enemyBaseCount: 1,
        enemyCountOverride: 1,
        excludeGlobalAreaMods: true,
        enemyBaseLife: Infinity,
        candidates: [{ id: '', name: 'Dummy' }]
    });
    combat.startArea(area);
    player.stats.activity.setText('Training');
    player.stats.trainingMultiplier.set(multiplier);
}

function startExploration(multiplier: number) {
    const area = new CombatArea({
        name: 'Exploring',
        enemyBaseCount: Infinity,
        excludeGlobalAreaMods: true,
        enemyBaseLife: combat.enemyBaseLife,
        candidates: [{ id: '', name: 'Placeholder' }]
    });
    combat.startArea(area);
    player.stats.activity.setText('Exploring');
    player.stats.explorationMultiplier.set(multiplier);
}

function startMeditation(multiplier: number) {
    player.stats.activity.setText('Meditation');
    player.stats.meditationMultiplier.set(multiplier);
    player.modDB.add('GuildActivity', [{ name: 'MaxMana', valueType: 'More', value: 100 }, { name: 'ManaRegen', valueType: 'More', value: 100 }]);
}
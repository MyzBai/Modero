import { game, statistics, gameLoop, gameLoopAnim, GameInitializationStage } from './game';
import { applyStatValues, calcPlayerCombatStats, calcPlayerPersistantStats, extractStats, type PlayerOptions } from './calc/calcStats';
import { Modifier } from './mods/Modifier';
import { createPlayerStats, deserializeStats, serializeStats } from './statistics/stats';
import { ModDB } from './mods/ModDB';
import type * as GameSerialization from './serialization';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { ENVIRONMENT } from 'src/config';
import type { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { hasAnyFlag } from '../shared/utils/utils';

export enum PlayerUpdateStatsFlag {
    None = 0,
    Combat = 1 << 0,
    Persistent = 1 << 1,
    All = PlayerUpdateStatsFlag.Combat | PlayerUpdateStatsFlag.Persistent
}

export class Player {
    readonly onStatsChange = new EventEmitter();
    readonly modDB = new ModDB();
    readonly stats = createPlayerStats(game.stats);
    private readonly manaBar: ProgressElement;
    private statUpdatePending = false;
    constructor() {
        this.manaBar = game.page.querySelectorStrict<ProgressElement>('[data-combat-overview] [data-mana-bar]');
    }

    init() {
        statistics.createGroup('Player', this.stats);

        this.modDB.onChange.listen(this.updateStats.bind(this));

        if (game.gameConfig.playerStartModList) {
            const statModifiers = Modifier.extractStatModifierList(...Modifier.modListFromTexts(game.gameConfig.playerStartModList));
            this.modDB.add('Player', statModifiers);
        }

        this.stats.mana.addListener('change', (mana) => {
            const maxMana = this.stats.maxMana.value;
            if (mana.curValue > maxMana) {
                this.stats.mana.set(maxMana, true);
            }
        });

        gameLoop.registerCallback((dt) => {
            const manaRegen = this.stats.manaRegeneration.value * dt;
            this.stats.mana.add(manaRegen);
        });

        gameLoopAnim.registerCallback(() => this.updateManaBar());
    }

    reset() {
        this.statUpdatePending = false;
        this.onStatsChange.removeAllListeners();
        this.modDB.clear();
        Object.values(this.stats).forEach(x => x.reset());
    }

    setup() {
        if (!this.stats.guildClass.texts) {
            this.stats.guildClass.options.label = undefined;
        }
        this.updateStatsDirect();
        if (this.stats.mana.value === Infinity) {
            this.stats.mana.set(this.stats.maxMana.value);
        }

        this.updateManaBar();
    }

    private updateManaBar() {
        if (this.stats.maxMana.value <= 0) {
            return;
        }
        const value = this.stats.mana.value / this.stats.maxMana.value;
        this.manaBar.value = value;
    }

    updateStats() {
        if (this.statUpdatePending) {
            return;
        }
        this.statUpdatePending = true;
        if (ENVIRONMENT === 'development' && gameLoop.state === 'Stopped' && game.initializationStage === GameInitializationStage.Done) {
            this.updateStatsDirect();
            statistics.updateStats('Player');
            this.statUpdatePending = false;
            return;
        }
        gameLoop.registerCallback(() => {
            this.statUpdatePending = false;
            this.updateStatsDirect();
            this.onStatsChange.invoke(undefined);
        }, { once: true });
    }

    updateStatsDirect(updateFlags: PlayerUpdateStatsFlag = PlayerUpdateStatsFlag.All) {
        const playerOptions: PlayerOptions = {
            modDB: this.modDB,
            stats: extractStats(this.stats),
        };

        if (hasAnyFlag(updateFlags, PlayerUpdateStatsFlag.Combat)) {
            const result = calcPlayerCombatStats(playerOptions);
            applyStatValues(this.stats, result);
        }

        if (hasAnyFlag(updateFlags, PlayerUpdateStatsFlag.Persistent)) {
            const result = calcPlayerPersistantStats(playerOptions);
            applyStatValues(this.stats, result);
        }

        statistics.updateStats('Player');
    }

    serialize(save: GameSerialization.Serialization) {
        save.player = { stats: serializeStats(this.stats) };
    }

    deserialize({ player: save }: GameSerialization.UnsafeSerialization) {
        const stats = save?.stats;
        if (stats) {
            deserializeStats(this.stats, stats);
        }
        this.updateStatsDirect();
    }
}
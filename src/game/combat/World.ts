import { game, combat, player } from '../game';
import { CombatArea } from './CombatArea';
import type * as GameSerialization from '../serialization';

export class World {
    private _zone?: CombatArea;

    get zone() {
        return this._zone;
    }

    get baseEnemyCount() {
        return game.gameConfig.enemyBaseCountList[player.level - 1] ?? Infinity;
    }

    setup() {
        player.stats.level.addListener('change', () => {
            if (combat.zone === this._zone) {
                this._zone = this.createZone();
                combat.startZone(this._zone);
            }
        });

        if (!this._zone) {
            this._zone = this.createZone();
            combat.startZone(this._zone);
        }
    }

    reset() {
        this._zone = undefined;
    }

    private processZoneCompletion() {
        if (player.level < game.maxLevel) {
            player.stats.level.add(1);
        }
        this._zone = this.createZone();
        combat.startZone(this._zone);
    }

    private createZone() {
        const enemyList = game.gameConfig.enemyList;
        const zone = new CombatArea({
            name: 'World',
            enemyBaseCount: this.baseEnemyCount,
            enemyBaseLife: combat.enemyBaseLife,
            candidates: enemyList,
            areaModList: []
        });

        if (Number.isFinite(this.baseEnemyCount)) {
            zone.onComplete.listen(this.processZoneCompletion.bind(this));
        }
        return zone;
    }

    serialize(save: GameSerialization.Serialization) {
        if (!this._zone) {
            return;
        }
        const zone = this._zone.serialize();
        save.world = { zone };
    }

    deserialize({ world: save }: GameSerialization.UnsafeSerialization) {
        const serializedZone = save?.zone;
        if (!serializedZone) {
            return;
        }

        this._zone = this.createZone();
        this._zone.deserialize(serializedZone);
    }
}
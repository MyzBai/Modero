import { assertDefined } from 'src/shared/utils/assert';
import { game, combat, player } from '../game';
import { Zone } from './Zone';
import type * as GameSerialization from '../serialization/serialization';


export class World {
    private _zone?: Zone;
    private createZoneAtSetup?: () => Zone;
    get zone() {
        return this._zone;
    }

    get baseEnemyCount() {
        return game.module?.enemyBaseCountList[player.level - 1] ?? Infinity;
    }

    setup() {
        player.stats.level.addListener('change', () => {
            if (combat.zone?.name === 'World') {
                this._zone = this.createZone();
                combat.startZone(this._zone);
            }
        });
        if (!this.createZoneAtSetup) {
            this._zone = this.createZone();
            this._zone.active = true;
        } else {
            this._zone = this.createZoneAtSetup();
        }
        if (this._zone.active) {
            combat.startZone(this._zone);
        }
    }

    restart() {
        this.reset();
        player.stats.level.set(1);
        if (!this._zone) {
            return;
        }
        const active = this._zone.active;
        this._zone = this.createZone();
        if (active) {
            combat.startZone(this._zone);
        }
    }

    reset() {
        combat.effectHandler.removeAllEffects();
        this._zone = undefined;
        this.createZoneAtSetup = undefined;
    }

    private processZoneCompletion() {
        if (player.level < game.maxLevel) {
            player.stats.level.add(1);
        }
        this._zone = this.createZone();
        combat.startZone(this._zone);
    }

    private createZone() {
        assertDefined(game.module, 'no game module defined');
        const enemyList = game.module.enemyList;
        const zone = new Zone({
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
        if (!save) {
            return;
        }
        const serializedZone = save.zone;
        if (serializedZone) {
            this.createZoneAtSetup = () => {
                const zone = this.createZone();
                zone.deserialize(serializedZone);
                return zone;
            };
        }
    }
}
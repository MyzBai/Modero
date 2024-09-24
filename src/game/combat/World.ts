import { game, combat, player } from '../game';
import { CombatArea } from './CombatArea';
import type * as GameSerialization from '../serialization';

export class World {
    private _combatArea?: CombatArea;

    get area() {
        return this._combatArea;
    }

    get baseEnemyCount() {
        return game.gameConfig.enemyBaseCountList[player.level - 1] ?? Infinity;
    }

    setup() {
        player.stats.level.addListener('change', () => {
            if (combat.area === this._combatArea) {
                this._combatArea = this.createCombatArea();
                combat.startArea(this._combatArea);
            }
        });

        if (!this._combatArea) {
            this._combatArea = this.createCombatArea();
            combat.startArea(this._combatArea);
        }
    }

    reset() {
        this._combatArea = undefined;
    }

    private processCombatAreaCompletion() {
        if (player.level < game.maxLevel) {
            player.stats.level.add(1);
        }
        this._combatArea = this.createCombatArea();
        combat.startArea(this._combatArea);
    }

    private createCombatArea() {
        const enemyList = game.gameConfig.enemyList;
        const area = new CombatArea({
            name: 'World',
            enemyBaseCount: this.baseEnemyCount,
            enemyBaseLife: combat.enemyBaseLife,
            candidates: enemyList,
            areaModList: []
        });

        if (Number.isFinite(this.baseEnemyCount)) {
            area.onComplete.listen(this.processCombatAreaCompletion.bind(this));
        }
        return area;
    }

    serialize(save: GameSerialization.Serialization) {
        if (!this._combatArea) {
            return;
        }
        const area = this._combatArea.serialize();
        save.world = { area: area };
    }

    deserialize({ world: save }: GameSerialization.UnsafeSerialization) {
        const serializedCombatArea = save?.area;
        if (!serializedCombatArea) {
            return;
        }

        this._combatArea = this.createCombatArea();
        this._combatArea.deserialize(serializedCombatArea);
    }
}
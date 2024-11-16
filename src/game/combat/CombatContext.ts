import { calcCombatContextStats as calcCombatContextStats } from '../calc/calcStats';
import { ModDB } from '../mods/ModDB';
import { Modifier } from '../mods/Modifier';
import { Enemy, type EnemyData } from './Enemy';
import { clamp, getRandomWeightedIndex } from 'src/shared/utils/utils';
import { assertDefined } from 'src/shared/utils/assert';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import type * as GameSerialization from '../serialization';
import { combat, player } from '../game';
import { combatCtxModTemplateList } from '../mods/combatCtxModTemplates';

export interface EnemyCandidate {
    id: string;
    name: string;
    weight?: number;
    modList?: string[];
}

export interface CombatContextOptions {
    readonly name: string;
    readonly enemyBaseLife: number;
    readonly enemyBaseCount: number;
    readonly enemyCountOverride?: number;
    readonly candidates: EnemyCandidate[];
    readonly combatModList?: string[];
    readonly interruptable: boolean;
}

export class CombatContext {
    readonly name: string;
    readonly modDB: ModDB;
    readonly onComplete: EventEmitter<CombatContext>;
    readonly modList: Modifier[];
    private _modList: Modifier[] = [];
    private _completed = false;
    private _enemy: Enemy;
    private _enemyCount: number;
    private _maxEnemyCount: number;
    active = false;
    constructor(private readonly data: CombatContextOptions) {
        this.name = data.name;
        this.modDB = new ModDB();
        this.onComplete = new EventEmitter<CombatContext>();

        this.modList = Modifier.modListFromTexts(data.combatModList ?? []);

        this._enemyCount = 1;
        this._maxEnemyCount = 0;

        this._enemy = this.generateEnemy();

        this.updateModifiers();
    }

    get completed() {
        return this._completed;
    }

    private set completed(v: boolean) {
        this._completed = v;
    }

    get enemy() {
        return this._enemy;
    }

    get enemyCount() {
        return clamp(this._enemyCount, 1, this._maxEnemyCount);
    }

    get maxEnemyCount() {
        return Math.ceil(this._maxEnemyCount);
    }

    get interruptable() {
        return this.data.interruptable ?? false;
    }

    private updateModifiers() {
        const combatModList = this._modList.filter(x => combatCtxModTemplateList.find(y => y === x.template && !y.target));
        this.modDB.replace('Combat', Modifier.extractStatModifierList(...combatModList));
        const enemyModList = this._modList.filter(x => combatCtxModTemplateList.find(y => y === x.template && y.target === 'Enemy'));
        this.enemy.modDB.replace('Combat', Modifier.extractStatModifierList(...enemyModList));
        const playerModList = this._modList.filter(x => combatCtxModTemplateList.find(y => y === x.template && y.target === 'Player'));
        player.modDB.replace('Combat', Modifier.extractStatModifierList(...playerModList));
        this.calcStats();
    }

    private calcStats() {
        const { maxEnemyCount } = calcCombatContextStats({ stats: { baseEnemyCount: this.data.enemyBaseCount }, modDB: this.modDB });
        this._maxEnemyCount = this.data.enemyCountOverride ?? maxEnemyCount;
    }

    private generateEnemy() {
        const candidate = this.createEnemyCandidate();
        return this.createEnemyFromCandidate(candidate);
    }

    private createEnemyCandidate() {
        const candidates = this.data.candidates;
        let candidate: EnemyCandidate | undefined;
        if (candidates.length === 1) {
            candidate = candidates[0];
        } else {
            const weights = candidates.length === 1 ? [1] : candidates.map(x => x.weight ?? 1);
            const weightedIndex = getRandomWeightedIndex(weights);
            candidate = candidates[weightedIndex];
        }
        assertDefined(candidate, 'failed creating enemy');
        return candidate;
    }

    private createEnemyFromCandidate(candidate: Omit<EnemyCandidate, 'weight'>) {
        const enemyData: EnemyData = {
            id: candidate.id,
            name: candidate.name ?? 'Enemy',
            baseLife: this.data.enemyBaseLife,
            enemyModList: candidate.modList ?? []
        };
        return new Enemy(enemyData);
    }

    next() {
        if (this.enemyCount >= this.maxEnemyCount) {
            this.completed = true;
            this.onComplete.invoke(this);
            return;
        }
        this._enemyCount++;
        this._enemy = this.generateEnemy();
        this.updateModifiers();
    }

    serialize(): GameSerialization.CombatContext {
        return {
            active: this.active,
            enemyId: this._enemy.enemyData.id,
            enemyCount: this.enemyCount,
            enemy: this._enemy?.serialize()
        };
    }

    deserialize(save: DeepPartial<GameSerialization.CombatContext>) {
        this._enemyCount = Math.floor(Math.min(save.enemyCount || this._maxEnemyCount, this._maxEnemyCount));
        const enemyRef = this.data.candidates.find(x => x.id === save.enemyId);
        if (save.enemy && enemyRef) {
            this._enemy = this.createEnemyFromCandidate({ ...enemyRef });
            this._enemy.deserialize(save.enemy);
        }
        if (save.active) {
            combat.startCombat(this);
        }
    }
}
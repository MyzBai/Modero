import { calcCombatAreaStats as calcCombatAreaStats } from '../calc/calcStats';
import { ModDB } from '../mods/ModDB';
import { Modifier } from '../mods/Modifier';
import { Enemy, type EnemyData } from './Enemy';
import { clamp, getRandomWeightedIndex } from 'src/shared/utils/utils';
import { assertDefined } from 'src/shared/utils/assert';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import type * as GameSerialization from '../serialization';
import { combat, player } from '../game';
import { areaModTemplateList } from '../mods/areaModTemplates';

export interface EnemyCandidate {
    id: string;
    name: string;
    level?: number;
    weight?: number;
    modList?: string[];
}

export interface CombatAreaOptions {
    readonly name: string;
    readonly enemyBaseLife: number;
    readonly enemyBaseCount: number;
    readonly enemyCountOverride?: number;
    readonly candidates: EnemyCandidate[];
    readonly areaModList: string[];
    readonly excludeGlobalAreaMods?: boolean;
}

export class CombatArea {
    private static globalAreaModListMap: Map<string, Modifier[]> = new Map();
    readonly name: string;
    readonly modDB: ModDB;
    readonly onComplete: EventEmitter<CombatArea>;
    readonly localModList: Modifier[];
    private _modList: Modifier[] = [];
    private _completed = false;
    private _enemy: Enemy;
    private _enemyCount: number;
    private _maxEnemyCount: number;
    constructor(readonly data: CombatAreaOptions) {
        this.name = data.name;
        this.modDB = new ModDB();
        this.onComplete = new EventEmitter<CombatArea>();

        this.localModList = Modifier.modListFromTexts(data.areaModList);

        this._enemyCount = 0;
        this._maxEnemyCount = 0;

        this._enemy = this.generateEnemy();

        this.updateModifiers();
    }

    get modList() {
        return this._modList;
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

    private updateModifiers() {
        const globalModifiers = [...CombatArea.globalAreaModListMap.values()].flatMap(x => x);
        this._modList = [...this.localModList, ...globalModifiers];
        const areaModList = this._modList.filter(x => areaModTemplateList.find(y => y === x.template && !y.target));
        this.modDB.replace('Area', Modifier.extractStatModifierList(...areaModList));
        const enemyModList = this._modList.filter(x => areaModTemplateList.find(y => y === x.template && y.target === 'Enemy'));
        this.enemy.updateModifiers(enemyModList);
        this.calcStats();
        if (combat.area === this) {
            combat.startArea(this);
        }
    }

    private calcStats() {
        const { maxEnemyCount } = calcCombatAreaStats({ stats: { baseEnemyCount: this.data.enemyBaseCount }, modDB: this.modDB });
        this._maxEnemyCount = this.data.enemyCountOverride ?? maxEnemyCount;
    }

    private generateEnemy() {
        const candidate = this.createEnemyCandidate();
        return this.createEnemyFromCandidate(candidate);
    }

    private createEnemyCandidate() {
        const candidates = this.data.candidates.filter(x => (x.level ?? 1) <= player.level) || [];
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

    serialize(): GameSerialization.CombatArea {
        return {
            active: combat.area === this,
            enemyId: this._enemy.enemyData.id,
            enemyCount: this.enemyCount,
            enemy: this._enemy?.serialize()
        };
    }

    deserialize(save: DeepPartial<GameSerialization.CombatArea>) {
        this._enemyCount = Math.floor(Math.min(save.enemyCount || this._maxEnemyCount, this._maxEnemyCount));
        const enemyRef = this.data.candidates.find(x => x.id === save.enemyId);
        if (save.enemy && enemyRef) {
            this._enemy = this.createEnemyFromCandidate({ ...enemyRef });
            this._enemy.deserialize(save.enemy);
        }
        if (save.active) {
            combat.startArea(this);
        }
    }

    static addGlobalAreaModifiers(key: string, ...modList: Modifier[]) {
        this.globalAreaModListMap.set(key, modList);
        combat.area?.updateModifiers();
    }

    static clearGlobalAreaModList() {
        this.globalAreaModListMap.clear();
    }
}
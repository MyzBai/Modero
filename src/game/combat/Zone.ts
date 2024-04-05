import { calcZoneStats } from '../calc/calcStats';
import { ModDB } from '../mods/ModDB';
import { Modifier } from '../mods/Modifier';
import { Enemy, type EnemyData } from './Enemy';
import { getRandomWeightedIndex } from 'src/shared/utils/helpers';
import { assertDefined } from 'src/shared/utils/assert';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import type * as GameSerialization from '../serialization/serialization';
import { player } from '../game';

export interface EnemyCandidate {
    id: string;
    name: string;
    weight: number;
    modList: string[];
}

export interface ZoneOptions {
    readonly name: string;
    readonly enemyBaseLife: number;
    readonly enemyBaseCount: number;
    readonly candidates: EnemyCandidate[];
    readonly areaModList: string[];
}

export interface ZoneStats {
    maxEnemyCount: number;
    enemyCount: number;
}

export class Zone {
    static GlobalAreaModList: string[] = [];
    active = false;
    readonly name: string;
    readonly modDB = new ModDB();
    readonly stats: ZoneStats = {
        maxEnemyCount: 0,
        enemyCount: 1
    };
    readonly onComplete = new EventEmitter<Zone>();

    private _enemy: Enemy;
    private _completed = false;
    readonly localModList: Modifier[];
    readonly modList: Modifier[];
    constructor(readonly data: ZoneOptions) {
        this.name = data.name;
        this.stats.maxEnemyCount = data.enemyBaseCount;
        this.localModList = Modifier.modsFromTexts(data.areaModList);
        this.modList = [...Modifier.modsFromTexts(Zone.GlobalAreaModList), ...this.localModList];
        this.applyModifiers();
        this.calcStats();
        this._enemy = this.generateEnemy();
    }

    get enemy() {
        return this._enemy;
    }

    get completed() {
        return this._completed;
    }

    private set completed(v: boolean) {
        this._completed = v;
    }

    private applyModifiers() {
        const areaModList = this.modList.filter(x => x.template.target === 'Area');
        const playerModList = this.modList.filter(x => x.template.target === 'Player');
        this.modDB.replace('Zone', Modifier.extractStatModifierList(...areaModList));
        player.modDB.replace('Zone', Modifier.extractStatModifierList(...playerModList));
    }

    private calcStats() {
        calcZoneStats({ stats: this.stats, modDB: this.modDB });
    }

    next() {
        if (this.stats.enemyCount === this.stats.maxEnemyCount) {
            this.completed = true;
            this.onComplete.invoke(this);
            return;
        }
        this.stats.enemyCount++;
        this._enemy = this.generateEnemy();
    }

    private generateEnemy() {
        const candidate = this.createEnemyCandidate();
        return this.createEnemyFromCandidate(candidate);
    }

    private createEnemyCandidate() {
        const candidates = this.data.candidates || [];
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
            enemyModList: candidate.modList ?? [],
            zoneModList: this.modList.filter(x => x.template.target === 'Enemy').map(x => x.text)
        };
        return new Enemy(enemyData);
    }

    serialize(): GameSerialization.Zone {
        return {
            active: this.active,
            enemyId: this._enemy.enemyData.id,
            enemyCount: this.stats.enemyCount,
            enemy: this._enemy?.serialize()
        };
    }

    deserialize(save: DeepPartial<GameSerialization.Zone>) {
        this.active = save.active ?? false;
        this.stats.enemyCount = Math.min(save.enemyCount || this.stats.maxEnemyCount, this.stats.maxEnemyCount);
        const enemyRef = this.data.candidates.find(x => x.id === save.enemyId);
        if (save.enemy && enemyRef) {
            this._enemy = this.createEnemyFromCandidate({ ...enemyRef });
            this._enemy.deserialize(save.enemy);
        }
    }
}
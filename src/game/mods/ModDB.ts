import { EventEmitter } from '../../shared/utils/EventEmitter';
import type { ModTemplateStat, StatName } from './types';

export interface StatModifier extends ModTemplateStat {
    value: number;
    min?: number;
    max?: number;
    source?: string;
}

export class ModDB {
    private mods = new Map<StatName, (StatModifier & { source: string; })[]>();
    public readonly onChange = new EventEmitter();

    getModListByName(name?: StatName) {
        if (!name) {
            return [...this.mods.values()].flatMap(x => x);
        }
        return [...this.mods.get(name) || []];
    }

    add(source: string, statModList: StatModifier[]) {
        this.addModList(source, statModList);
        this.onChange.invoke(undefined);
    }

    removeBySource(source: string) {
        this.remove(source);
        this.onChange.invoke(undefined);
    }

    replace(source: string, statModList: StatModifier[]) {
        this.remove(source);
        this.add(source, statModList);
    }

    clear() {
        this.mods.clear();
        this.onChange.removeAllListeners();
    }

    private addModList(source: string, statModList: StatModifier[]) {
        for (const mod of statModList) {
            let arr = this.mods.get(mod.name);
            if (!arr) {
                arr = [];
                this.mods.set(mod.name, arr);
            }
            arr.push({
                ...mod,
                source
            });
        }
    }

    private remove(source: string) {
        for (const [name, arr] of this.mods) {
            this.mods.set(name, arr.filter(x => x.source !== source));
        }
    }
}
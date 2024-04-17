import { getRandomWeightedIndex, getRandomWeightedItem, randomRange, randomRangeInt } from 'src/shared/utils/utils';
import { Modifier } from '../mods/Modifier';
import { ModifierTagList, type ModifierTag, type ModTemplate } from '../mods/types';
import { assertDefined } from 'src/shared/utils/assert';
import { createModTags } from '../mods/utils';

export interface ModifierCandidate {
    text: string;
    template: ModTemplate;
    weight: number;
}

export interface CraftData {
    readonly crafter: CraftManager;
    readonly itemModList: Modifier[];
    readonly candidateModList: ModifierCandidate[];
}

export interface CrafterArgs {
    readonly groups: string[][];
    readonly reforgeWeights: number[];
    readonly maxModifierCount: number;
}

export type CraftResult = ModListCraftResult | WeaponTypeCraftResult;
export interface ModListCraftResult {
    type: 'ModList';
    modList: Modifier[];
}
export interface WeaponTypeCraftResult {
    type: 'WeaponType';
    weaponType: string;
}

export class CraftManager {
    private readonly groups: string[][];
    private reforgeWeights: readonly number[];
    private maxModifierCount: number;
    constructor(args: CrafterArgs) {
        this.groups = args.groups;
        this.reforgeWeights = args.reforgeWeights;
        this.maxModifierCount = args.maxModifierCount;
    }

    reforge(itemModList: Modifier[], candidateModList: readonly ModifierCandidate[], tag?: ModifierTag): ModListCraftResult | string {
        const modList: Modifier[] = [];
        if (tag) {
            const msg = this.addOne(itemModList, candidateModList, tag);
            if (msg) {
                return msg;
            }
        }
        const reforgeModCountOffset = modList.length;
        const modCount = this.generateReforgeModCount(this.reforgeWeights, reforgeModCountOffset);
        modList.push(...this.generateModList(itemModList, candidateModList, modCount));
        if (modList.length === 0) {
            return 'No modifiers available';
        }
        return { type: 'ModList', modList };
    }

    addOne(itemModList: Modifier[], candidateModList: readonly ModifierCandidate[], tag?: ModifierTag): ModListCraftResult | string {
        if (itemModList.length >= this.maxModifierCount) {
            return 'Item has maximum number of modifiers';
        }
        if (tag) {
            candidateModList = candidateModList.filter(x => createModTags(x.template.stats).includes(tag));
            if (candidateModList.length === 0) {
                return `No modifier with tag: ${tag} available`;
            }
        }
        const mod = this.generateModList(itemModList, candidateModList, 1)[0];
        if (!mod) {
            return 'No modifier available';
        }
        return { type: 'ModList', modList: [...itemModList, mod] };
    }

    removeOne(itemModList: readonly Modifier[], tag?: ModifierTag): ModListCraftResult | string {
        let modList = [...itemModList];
        if (tag) {
            modList = modList.filter(x => [...createModTags(x.template.stats)].includes(tag));
        }
        const index = randomRangeInt(0, modList.length);
        const target = modList[index];
        if (!target) {
            return tag ? `Item has no ${tag.toLowerCase()} modifiers` : 'Item has no modifiers to remove';
        }

        if (!modList.remove(target)) {
            return 'Failed to remove modifier. This was unexpected';
        }
        return { type: 'ModList', modList: itemModList.filter(x => x !== target) };
    }

    improveTierOfRandomMod(itemModList: readonly Modifier[]): ModListCraftResult | string {
        //TODO: shuffle array and go
        const modCandidate = itemModList[randomRangeInt(0, itemModList.length)];
        if (!modCandidate) {
            return 'Item has no modifiers';
        }
        const groupIndex = this.groups.findIndex(x => x.indexOf(modCandidate.text) !== -1);
        const group = this.groups[groupIndex] || [];
        const modIndex = group?.indexOf(modCandidate.text) + 1;
        if (group[modIndex]) {
            return 'No modifier can be improved';
        }

        const modText = group[modIndex];
        assertDefined(modText);
        const mod = Modifier.modFromText(modText);
        mod.randomizeValues();

        return { type: 'ModList', modList: [...itemModList.filter(x => x !== modCandidate), mod] };
    }

    modifyNumericalValues(itemModList: readonly Modifier[], type: 'random' | 'max'): ModListCraftResult | string {
        if (itemModList.length === 0) {
            return 'No modifiers available';
        }
        const modList = itemModList.map(x => x.copy());
        for (const mod of modList) {
            switch (type) {
                case 'random': mod.setValues(mod.rangeValues.map(x => randomRange(x.min, x.max))); break;
                case 'max': mod.setValues(mod.rangeValues.map(x => x.max)); break;
            }
        }
        return { type: 'ModList', modList };
    }

    private generateModList(itemModList: readonly Modifier[], candidateModList: readonly ModifierCandidate[], count: number) {
        const tagWeightMultiplier = 1.2;
        const tagWeights = ModifierTagList.reduce((a, c) => {
            a[c] = 1;
            return a;
        }, {} as Record<ModifierTag, number>);
        const addTagWeight = (mod: Modifier) => createModTags(mod.template.stats).forEach(x => tagWeights[x] *= tagWeightMultiplier);
        itemModList.forEach(x => addTagWeight(x));
        const newModList: Modifier[] = [];
        for (let i = 0; i < count; i++) {
            candidateModList = candidateModList.filter(x => !itemModList.concat(newModList).some(y => x.template.desc === y.template.desc));
            if (candidateModList.length === 0) {
                console.warn(`failed to generate the expected amount of modifiers of (${count})`);
                return [];
            }
            const candidateCopyList = candidateModList.map(x => {
                const tags = createModTags(x.template.stats);
                const weight = tags.reduce((a, c) => a *= tagWeights[c], x.weight);
                return { ...x, weight };
            });
            const candidate = getRandomWeightedItem(candidateCopyList);
            if (!candidate) {
                continue;
            }

            const mod = Modifier.modFromText(candidate.text);
            mod.randomizeValues();
            addTagWeight(mod);
            newModList.push(mod);
        }
        return newModList;
    }

    private generateReforgeModCount(weights: readonly number[], offset = 0) {
        return getRandomWeightedIndex(weights.slice(offset)) + 1;
    }
}
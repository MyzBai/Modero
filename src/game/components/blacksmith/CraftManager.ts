import { Modifier, type ModGroupList } from 'src/game/mods/Modifier';
import { ModifierTagList, type ModTemplate, type ModifierTag } from 'src/game/mods/types';
import { getRandomWeightedIndex, getRandomWeightedItem, remap } from 'src/shared/utils/utils';
import { assertDefined } from 'src/shared/utils/assert';
import { getModGroupList, calcModTier, createModTags } from '../../mods/modUtils';
import type { Craft } from './CraftTable';

export interface CraftContext {
    filterName?: string;
    modList: Modifier[];
    modGroupsList: ModGroupList[];
    maxModCount: number;
}

export interface ModifierCandidate {
    text: string;
    template: ModTemplate;
    weight: number;
}
interface MinMax { min: number; max: number; }
export interface CraftSuccessRates {
    add: MinMax;
    remove: MinMax;
    upgrade: MinMax;
    randomizeNumericals: MinMax;
}

export class CraftManager {

    reforge(candidateModList: ModifierCandidate[], weights: number[]) {
        const reforgeModCount = getRandomWeightedIndex(weights) + 1;
        const newModList = this.generateMods([], candidateModList, reforgeModCount);
        return newModList;
    }

    addModifier(modList: Modifier[], candidateModList: ModifierCandidate[]) {
        const mod = this.generateMods(modList, candidateModList, 1)[0];
        assertDefined(mod, 'failed generating modifier');
        return mod;
    }

    upgradeModifier(mod: Modifier, modGroupsList: ModGroupList[]) {
        const modGroup = getModGroupList(mod.text, modGroupsList);
        const tier = modGroup.findIndex(x => x.text === mod.text) + 1;
        const newModText = modGroup[tier]?.text;
        assertDefined(newModText, 'unexpected out of range');
        const newMod = Modifier.modFromText(newModText);
        newMod.randomizeValues();
        return newMod;
    }

    calcSuccessRate(craft: Craft, ctx: CraftContext, mod?: Modifier) {
        const type = craft.template.type;
        if (type === 'Add') {
            return remap(ctx.maxModCount - 1, 1, craft.successRates.min, craft.successRates.max, ctx.modList.length);
        }
        if (type === 'Remove') {
            assertDefined(mod);
            const v0 = remap(ctx.maxModCount, 1, craft.successRates.min, craft.successRates.max, ctx.modList.length);
            const modGroup = getModGroupList(mod.text, ctx.modGroupsList, ctx.filterName);
            const tier = calcModTier(mod.text, modGroup);
            const v1 = modGroup.length === 1 ? craft.successRates.max : remap(1, modGroup.length, craft.successRates.min, craft.successRates.max, tier);
            const avg = (v0 + v1) / 2;
            return avg;
        }
        if (type === 'Upgrade') {
            assertDefined(mod);
            const modGroup = getModGroupList(mod.text, ctx.modGroupsList, ctx.filterName);
            const tier = calcModTier(mod.text, modGroup);
            const minChance = modGroup.length === 1 ? craft.successRates.max : craft.successRates.min;
            const maxChance = craft.successRates.max;
            return remap(2, modGroup.length, minChance, maxChance, tier);
        }
        if (type === 'Randomize Numericals') {
            if (craft.template.target === 'Single') {
                assertDefined(mod);
                const modGroup = getModGroupList(mod.text, ctx.modGroupsList, ctx.filterName);
                const tier = calcModTier(mod.text, modGroup);
                const minChance = modGroup.length === 1 ? craft.successRates.max : craft.successRates.min;
                const maxChance = craft.successRates.max;
                return remap(tier, modGroup.length, minChance, maxChance, modGroup.length);
            } else if (craft.template.target === 'All') {
                return remap(1, ctx.maxModCount, craft.successRates.min, craft.successRates.max, ctx.modList.length);
            }
        }
        return 100;
    }

    generateMods(itemModList: Modifier[], candidateModList: ModifierCandidate[], count: number) {
        const tagWeightMultiplier = 2;
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
}
import { assertDefined, assertNonNullable } from '../../../shared/utils/assert';
import { EventEmitter } from '../../../shared/utils/EventEmitter';
import { randomRangeInt } from '../../../shared/utils/utils';
import { extractStats, calcPlayerCombatStats } from '../../calc/calcStats';
import { player } from '../../game';
import { ModDB } from '../../mods/ModDB';
import { Modifier } from '../../mods/Modifier';
import { calcModTier, getModGroupList } from '../../mods/modUtils';
import { evalCost, subtractCost } from '../../utils/utils';
import { CraftManager } from './CraftManager';
import { type AdvancedReforge, type CraftContext } from './CraftTable';


export class Crafting {
    readonly craftAction = new EventEmitter<'Cancel'>();
    constructor(private readonly ctx: CraftContext) {

    }

    //#region Process Templates
    async processCraft(mod?: Modifier) {
        assertDefined(this.ctx.item.modListCrafting);
        assertNonNullable(this.ctx.craft);

        const successRate = CraftManager.calcSuccessRate(this.ctx.craft, {
            filterName: this.ctx.item.name,
            maxModCount: this.ctx.item.maxModCount,
            modGroupsList: this.ctx.modGroupsList,
            modList: this.ctx.item.modListCrafting
        }, mod);

        if (randomRangeInt(0, 100) > Math.floor(successRate)) {
            return this.triggerItemDestroyAnim();
        }

        if (this.ctx.craft.template.type === 'Reforge') {
            this.processReforge();
        } else {
            switch (this.ctx.craft.template.type) {
                case 'Add': this.processAdd(); break;
                case 'Remove':
                    assertDefined(mod);
                    this.processRemove(mod);
                    break;
                case 'Upgrade':
                    assertDefined(mod);
                    this.processUpgrade(mod);
                    break;
                case 'Randomize Numericals':
                    this.processRandomizedNumericals(mod);
                    break;
            }
            if (this.ctx.craft.cost) {
                subtractCost(this.ctx.craft.cost);
            }
        }
    }

    private processReforge() {
        assertDefined(this.ctx.craft);
        switch (this.ctx.craft.template.desc) {
            case '[Dev] Reforge High DPS': this.performReforgeDevCraft(); break;
            case 'Reforge item with new random modifiers': this.performReforgeCraft(); break;
        }
    }

    private processAdd() {
        assertDefined(this.ctx.item.modListCrafting);
        const mod = CraftManager.addModifier(this.ctx.item.modListCrafting, this.ctx.candidateModList());
        this.ctx.item.modListCrafting.push(mod);
    }

    private processRemove(mod: Modifier) {
        assertDefined(this.ctx.item.modListCrafting);
        this.ctx.item.modListCrafting.remove(mod);
    }

    private processUpgrade(mod: Modifier) {
        assertDefined(this.ctx.item.modListCrafting);
        const newMod = CraftManager.upgradeModifier(mod, this.ctx.modGroupsList);
        this.ctx.item.modListCrafting.replace(mod, newMod);
    }

    private processRandomizedNumericals(mod?: Modifier) {
        assertDefined(this.ctx.item.modListCrafting);
        switch (this.ctx.craft?.template.target) {
            case 'All': this.ctx.item.modListCrafting.forEach(x => x.randomizeValues()); break;
            case 'Single':
                assertDefined(mod);
                mod.randomizeValues();
                break;
        }
    }

    //#endregion


    //#region Craft
    private performReforgeDevCraft() {
        const stats = extractStats(player.stats);
        const curDps = calcPlayerCombatStats({ stats, modDB: player.modDB }).dps;

        const modDB = new ModDB(player.modDB);
        let lastDps = curDps;
        let modList: Modifier[] = [];
        for (let i = 0; i < 100; i++) {
            const newModList = CraftManager.reforge(this.ctx.candidateModList(), [0, 0, 0, 0, 0, 1]);
            modDB.replace('ReforgeDevCraft', Modifier.extractStatModifierList(...newModList));
            const dps = calcPlayerCombatStats({ stats, modDB }).dps;
            if (dps > lastDps || modList.length === 0) {
                modList = newModList;
                lastDps = dps;
            }
        }
        this.ctx.item.modListCrafting = modList;
    }

    private performReforgeCraft() {
        assertDefined(this.ctx.item.modListCrafting);
        const advancedReforge = this.ctx.item.advancedReforge;
        const useAdvReforge = (advancedReforge?.maxReforgeCount ?? 0) > 0;
        let reforgeCount = 1;
        if (advancedReforge && useAdvReforge) {
            reforgeCount = advancedReforge.maxReforgeCount;
        }
        let success = false;
        for (let i = 0; i < reforgeCount; i++) {
            if (this.ctx.craft?.cost) {
                if (!evalCost(this.ctx.craft.cost)) {
                    break;
                }
                subtractCost(this.ctx.craft.cost);
            }
            const newModList = CraftManager.reforge(this.ctx.candidateModList(), this.ctx.item.reforgeWeights);
            this.ctx.item.modListCrafting = newModList;

            if (advancedReforge && useAdvReforge) {
                const evaluateModItem = (modItem: AdvancedReforge['modItems'][number]) => {
                    const mod = newModList.find(x => x.template.desc === modItem.text);
                    if (!mod) {
                        return false;
                    }
                    const modTier = calcModTier(mod.text, getModGroupList(mod.text, this.ctx.modGroupsList));
                    if (modTier > modItem.tier) {
                        return false;
                    }
                    return true;
                };
                success = advancedReforge.modItems.filter(x => x.text.length > 0 && x.tier > 0).every(evaluateModItem);
                if (success) {
                    break;
                }
            }
        }
        if (useAdvReforge) {
            void this.triggerAdvReforgeOutcomeAnim(success);
        }
    }

    //#endregion Craft

    //#region Other

    private async triggerItemDestroyAnim() {
        const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict<HTMLElement>('[data-craft-area]');
        const animations: Promise<void>[] = [...this.ctx.craftAreaElement.querySelectorAll('[data-mod]')].map(x => {
            return new Promise(resolve => {
                x.animate([
                    { offset: 0, opacity: 1, filter: 'blur(0px)' },
                    { offset: 1, opacity: 0, filter: 'blur(10px)' }
                ], 600).addEventListener('finish', resolve.bind(this, undefined));
            });
        });
        animations.push(new Promise(resolve => {
            craftAreaElement.animate([
                { offset: 0, opacity: 1 },
                { offset: 1, opacity: 0 }
            ], 600).addEventListener('finish', resolve.bind(this, undefined));
        }));
        document.body.style.pointerEvents = 'none';
        await Promise.allSettled(animations);
        this.ctx.craftAreaElement.querySelectorStrict<HTMLLegendElement>('[data-craft-backdrop]').click();
        craftAreaElement.style.opacity = '1';
        document.body.style.pointerEvents = 'all';

        this.craftAction.invoke('Cancel');
    }

    private async triggerAdvReforgeOutcomeAnim(success: boolean) {
        const animate: Promise<void> = new Promise(resolve => {
            const outline = '1px solid rgba(255, 255, 255, 0)';
            const anim = this.ctx.craftAreaElement.querySelectorStrict('[data-craft-area]').animate([
                { outline },
                { offset: 0.8, outlineColor: success ? 'green' : 'red' },
                { offset: 1, outline }
            ], 1000);
            anim.addEventListener('finish', () => {
                resolve();
            });
        });
        await animate;
    }

    //#endregion Other
}
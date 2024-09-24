import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { type CraftTemplate, type CraftTemplateDescription } from './craftTemplates';
import { Modifier } from 'src/game/mods/Modifier';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { clamp, isDefined, isNumber, randomRangeInt } from 'src/shared/utils/utils';
import type { ModifierCandidate } from 'src/game/crafting/CraftManager';
import { CraftManager } from './CraftManager';
import { calcModTier, generateModListElements, getModGroupList } from './utils';
import type { Serialization, WeaponCrafting } from 'src/game/serialization';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { evaluateStatRequirements } from 'src/game/statistics/statRequirements';
import { TextInputDropdownElement } from 'src/shared/customElements/TextInputDropdownElement';
import { createHelpIcon } from 'src/shared/utils/dom';
import type { Requirements } from 'src/game/gameConfig/GameConfig';
import { player } from '../../game';
import { ModDB } from '../../mods/ModDB';
import { calcPlayerStats, extractStats } from '../../calc/calcStats';
import { Weapon } from './Weapon';
import { ENVIRONMENT } from '../../../config';

export interface Craft {
    template: CraftTemplate;
    desc: CraftTemplateDescription;
    element: HTMLElement;
    count: number;
    successRates: { min: number; max: number; };
}

interface AdvancedReforge {
    maxReforgeCount: number;
    modItems: { text: string; tier: number; }[];
}

type ContextCopy = Pick<CraftContext, 'modList' | 'weaponType'>;
export interface CraftContext {
    readonly weaponTypes?: { id: string; name: string; }[];
    weaponType?: Required<CraftContext>['weaponTypes'][number];
    modList: Modifier[];
    element: HTMLElement;
    modGroupsList: ModGroupList[];
    candidateModList: WeaponModifierCandidate[];
    advReforgeRequirements?: Requirements;
    getMaxModCount: () => number;
}

export interface WeaponModifierCandidate extends ModifierCandidate {
    weaponTypeNameList?: string[];
}

export type ModGroupList = {
    text: string;
    weaponTypeNameList: string[];
}[];

export class CraftTable {
    readonly craftConfirmed = new EventEmitter<void>();
    readonly element: HTMLElement;
    private readonly craftManager: CraftManager;
    private readonly craftListElement: HTMLElement;
    private craftList: Craft[] = [];
    private selectedCraft: Craft | null = null;
    private ctxCopy: ContextCopy | null = null;
    private abortController?: AbortController;
    private advReforge?: AdvancedReforge;

    constructor(private readonly ctx: CraftContext) {
        this.element = document.createElement('div');
        this.element.classList.add('craft-table');
        this.element.insertAdjacentHTML('beforeend', '<div class="g-title">Craft Table</div>');
        this.createToolbar();

        this.craftListElement = document.createElement('ul');
        this.craftListElement.classList.add('s-craft-list', 'g-scroll-list-v');
        this.craftListElement.setAttribute('data-craft-list', '');
        this.element.appendChild(this.craftListElement);

        this.craftManager = new CraftManager();
        this.stopCrafting();

        if (ENVIRONMENT === 'development') {
            this.addCraft({ id: 'c71a6a', desc: '[Dev] Reforge High DPS' }, { min: 100, max: 100 }, Infinity);
        }
    }

    private createToolbar() {
        const toolbarElement = document.createElement('div');
        toolbarElement.classList.add('s-toolbar', 'g-toolbar');
        toolbarElement.setAttribute('data-toolbar', '');
        const compareButton = document.createElement('button');
        compareButton.setAttribute('data-compare-button', '');
        compareButton.textContent = 'Compare';
        compareButton.addEventListener('click', this.openCompareModal.bind(this));

        const confirmButton = document.createElement('button');
        confirmButton.setAttribute('data-confirm-button', '');
        confirmButton.setAttribute('data-role', 'confirm');
        confirmButton.textContent = 'Confirm';
        confirmButton.addEventListener('click', this.confirm.bind(this));

        const cancelButton = document.createElement('button');
        cancelButton.setAttribute('data-cancel-button', '');
        cancelButton.setAttribute('data-role', 'cancel');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', this.cancel.bind(this));

        toolbarElement.append(compareButton, confirmButton, cancelButton);

        evaluateStatRequirements(this.ctx.advReforgeRequirements, () => {
            const advReforgeElement = document.createElement('button');
            advReforgeElement.classList.add('advanced');
            advReforgeElement.setAttribute('data-advanced-reforge', '');
            advReforgeElement.textContent = 'Adv. Reforge';
            advReforgeElement.addEventListener('click', () => {
                this.openAdvancedReforgeModal();
            });
            toolbarElement.appendChild(advReforgeElement);
        });

        this.element.appendChild(toolbarElement);
    }

    private createContextCopy() {
        this.ctxCopy = { modList: [...this.ctx.modList], weaponType: this.ctx.weaponType };
    }

    private updateCraftItemWeaponTypeElement() {
        const ctx = this.ctxCopy ?? this.ctx;
        if (!ctx || !ctx.weaponType) {
            return;
        }
        this.ctx.element.querySelectorStrict('[data-weapon-type]').textContent = ctx.weaponType.name;
    }

    private updateModListElement() {
        const ctx = this.ctxCopy ?? this.ctx;
        const element = this.ctx.element;

        if (ctx.weaponType) {
            element.querySelectorStrict('[data-weapon-type]').textContent = ctx.weaponType.name;
        }
        const modListElement = element.querySelectorStrict<HTMLElement>('[data-mod-list]');
        modListElement.replaceChildren(...generateModListElements(ctx.modList, this.ctx.modGroupsList));
        element.appendChild(modListElement);
    }

    private updateCraftListItemStates() {
        for (const craft of this.craftList) {
            craft.element.classList.toggle('selected', craft === this.selectedCraft);
            if (craft.count === 0) {
                craft.element.toggleAttribute('disabled', true);
                continue;
            }
            if (craft.count === Infinity) {
                craft.element.toggleAttribute('disabled', false);
                continue;
            }

            if (craft.template.desc as CraftTemplateDescription === 'Reforge item with new random modifiers') {
                craft.element.removeAttribute('disabled');
            } else {
                craft.element.toggleAttribute('disabled', !this.ctxCopy);
            }
            if (!this.ctxCopy) {
                continue;
            }
            switch (craft.template.desc as CraftTemplateDescription) {
                case 'Reforge item with new random modifiers':
                    craft.element.toggleAttribute('disabled', false);
                    break;
                case 'Add new modifier':
                    craft.element.toggleAttribute('disabled', this.ctxCopy.modList.length >= this.ctx.getMaxModCount() || this.craftManager.generateMods(this.ctxCopy.modList, this.ctx.candidateModList, 1).length === 0);
                    break;
                case 'Remove modifier':
                case 'Upgrade modifier':
                case 'Randomize numerical values':
                    craft.element.toggleAttribute('disabled', this.ctxCopy.modList.length === 0);
                    break;
            }
        }
    }

    private createBackdrop() {
        const element = document.createElement('div');
        element.classList.add('backdrop');
        element.setAttribute('data-craft-backdrop', '');
        element.addEventListener('click', () => {
            element.remove();
            this.clearCraftSelection();
        });
        this.ctx.element.append(element);
    }

    private updateSuccessRateAttribute(e: MouseEvent) {
        this.ctx.element.removeAttribute('data-success-rate');
        if (!this.selectedCraft) {
            return;
        }

        let mod: Modifier | undefined;
        if (e.target instanceof HTMLElement && e.target.hasAttribute('data-mod')) {
            const id = e.target.getAttribute('data-mod');
            mod = this.ctxCopy?.modList.find(x => x.template.id === id);
        }

        const successRate = this.craftManager.calcSuccessRate(this.selectedCraft, { ...this.ctx, ...this.ctxCopy }, mod);
        this.ctx.element.setAttribute('data-success-rate', successRate.toFixed());
    }

    private selectCraftById(id: string | null) {
        this.selectedCraft = this.craftList.find(x => x.template.id === id) ?? null;

        this.updateCraftListItemStates();

        const modListElement = this.ctx.element.querySelectorStrict<HTMLElement>('[data-mod-list]');
        modListElement.toggleAttribute('data-craft-area', !!this.selectedCraft);

        this.abortController?.abort();

        //remove all listeners
        this.ctx.element.querySelectorAll<HTMLElement>('[data-craft]').forEach(x => {
            x.removeAttribute('data-craft');
        });

        if (!this.selectedCraft) {
            return;
        }

        this.abortController = new AbortController();

        const desc = this.selectedCraft.template.desc as CraftTemplateDescription;
        if (desc === '[Dev] Reforge High DPS') {
            modListElement.setAttribute('data-craft', '');
        }
        if (desc === 'Reforge item with new random modifiers' || desc === 'Add new modifier') {
            modListElement.setAttribute('data-craft', '');
        }
        if (desc === 'Remove modifier' || desc === 'Randomize numerical values') {
            this.ctx.element.querySelectorAll<HTMLElement>('[data-mod]').forEach(x => x.setAttribute('data-craft', ''));
        }
        if (desc === 'Upgrade modifier') {
            assertDefined(this.ctxCopy);
            const modElementList = [...this.ctx.element.querySelectorAll<HTMLElement>('[data-mod]')];
            for (const modElement of modElementList) {
                const id = modElement.getAttribute('data-mod');
                const mod = this.ctxCopy.modList.find(x => x.template.id === id);
                const tier = mod ? calcModTier(mod.text, getModGroupList(mod.text, this.ctx.modGroupsList)) : 0;
                const craftable = !!mod && tier > 1;
                modElement.setAttribute('data-craft', String(craftable));
            }
        }
        if (desc === 'Randomize numerical values') {
            assertDefined(this.ctxCopy);
            const modElementList = [...this.ctx.element.querySelectorAll<HTMLElement>('[data-mod]')];
            for (const modElement of modElementList) {
                const id = modElement.getAttribute('data-mod');
                const mod = this.ctxCopy.modList.find(x => x.template.id === id);
                const craftable = !!mod && mod.rangeValues.some(x => x.min !== x.max);
                modElement.setAttribute('data-craft', String(craftable));
            }
        }
        this.ctx.element.querySelectorAll<HTMLElement>('[data-craft]').forEach(x => {
            assertDefined(this.abortController);
            x.addEventListener('mouseover', this.updateSuccessRateAttribute.bind(this), { signal: this.abortController.signal });
            x.addEventListener('click', this.performCraft.bind(this), { capture: true, signal: this.abortController.signal });
        });
        this.createBackdrop();
    }

    private performCraft(e: MouseEvent) {
        e.stopPropagation();
        assertDefined(this.selectedCraft, 'no craft selected');

        this.updateCraftCount();

        const modId = e.target instanceof HTMLElement ? e.target.getAttribute('data-mod') : undefined;
        const mod = modId ? this.ctxCopy?.modList.findStrict(x => x.template.id === modId) : undefined;

        const successRate = this.craftManager.calcSuccessRate(this.selectedCraft, { ...this.ctx, ...this.ctxCopy }, mod);
        if (randomRangeInt(0, 100) > Math.floor(successRate)) {
            void this.triggerItemDestroyAnim();
            return;
        }

        const desc = this.selectedCraft.template.desc as CraftTemplateDescription;
        if (desc === '[Dev] Reforge High DPS') {
            this.beginCrafting();
            this.performReforgeDevCraft();
        } else if (desc === 'Reforge item with new random modifiers') {
            this.beginCrafting();
            this.performReforgeCraft();
        } else {
            this.selectedCraft.count--;
            if (desc === 'Add new modifier') {
                assertNonNullable(this.ctxCopy);
                const mod = this.craftManager.addModifier(this.ctxCopy.modList, this.ctx.candidateModList);
                this.ctxCopy.modList.push(mod);
            } else if (desc === 'Remove modifier') {
                assertNonNullable(this.ctxCopy);
                assertNonNullable(mod);
                this.ctxCopy?.modList.remove(mod);
            } else if (desc === 'Upgrade modifier') {
                assertNonNullable(this.ctxCopy);
                assertNonNullable(mod);
                const index = this.ctxCopy.modList.indexOf(mod);
                const newMod = this.craftManager.upgradeModifier(mod, this.ctx.modGroupsList);
                this.ctxCopy.modList[index] = newMod;
            } else if (desc === 'Randomize numerical values') {
                assertNonNullable(mod);
                mod.randomizeValues();
            }
        }

        this.updateCraftCount();
        this.syncCraftItem();
        this.updateCraftCount();
        this.ctx.element.querySelectorStrict<HTMLElement>('[data-craft-backdrop]').click();
    }

    private beginCrafting() {
        this.createContextCopy();
        this.element.querySelectorStrict('[data-compare-button]').removeAttribute('disabled');
        this.element.querySelectorStrict('[data-confirm-button]').removeAttribute('disabled');
        this.element.querySelectorStrict('[data-cancel-button]').removeAttribute('disabled');
    }

    private performReforgeCraft() {
        assertNonNullable(this.ctxCopy);
        const reforgeCraft = this.craftList.findStrict(x => x.desc === 'Reforge item with new random modifiers');
        const reforgeWeights = [0, 0, 10, 30, 60, 20];
        let craftCount = reforgeCraft.count;
        craftCount = clamp(craftCount, 1, this.advReforge?.maxReforgeCount ?? 1);
        const useAdvReforge = !!this.advReforge && this.advReforge.maxReforgeCount > 0;
        for (let i = 0; i < craftCount; i++) {
            const newModList = this.craftManager.reforge(this.ctx.candidateModList, reforgeWeights);
            this.ctxCopy.modList.splice(0, this.ctxCopy.modList.length, ...newModList);

            reforgeCraft.count--;

            const evaluateAdvReforge = () => {
                assertDefined(this.advReforge);
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
                return this.advReforge.modItems.filter(x => x.text.length > 0 && x.tier > 0).every(evaluateModItem);
            };

            if (useAdvReforge) {
                const success = evaluateAdvReforge();
                if (success) {
                    void this.triggerAdvReforgeOutcomeAnim(true);
                    return;
                }
            }
        }
        if (useAdvReforge) {
            void this.triggerAdvReforgeOutcomeAnim(false);
        }
    }

    private performReforgeDevCraft() {
        assertDefined(this.ctxCopy);

        const stats = extractStats(player.stats);
        const curDps = calcPlayerStats({ stats, modDB: player.modDB }).dps;

        const modDB = new ModDB(player.modDB);
        let lastDps = curDps;
        let modList: Modifier[] = [];
        for (let i = 0; i < 100; i++) {
            const newModList = this.craftManager.reforge(this.ctx.candidateModList, [0, 0, 0, 0, 0, 1]);
            modDB.replace(Weapon.sourceName, Modifier.extractStatModifierList(...newModList));
            const dps = calcPlayerStats({ stats, modDB }).dps;
            if (dps > lastDps || modList.length === 0) {
                modList = newModList;
                lastDps = dps;
            }
        }
        this.ctxCopy.modList.splice(0, this.ctxCopy.modList.length, ...modList);
    }

    private confirm() {
        assertNonNullable(this.ctxCopy);
        this.ctx.modList.splice(0, this.ctx.modList.length, ...this.ctxCopy?.modList ?? []);
        this.stopCrafting();
        this.craftConfirmed.invoke();
    }

    private cancel() {
        this.stopCrafting();
    }

    private async triggerItemDestroyAnim() {
        const modListElement = this.ctx.element.querySelectorStrict<HTMLElement>('[data-mod-list]');
        const animations: Promise<void>[] = [...this.ctx.element.querySelectorAll('[data-mod]')].map(x => {
            return new Promise(resolve => {
                x.animate([
                    { offset: 0, opacity: 1, filter: 'blur(0px)' },
                    { offset: 1, opacity: 0, filter: 'blur(10px)' }
                ], 600).addEventListener('finish', resolve.bind(this, undefined));
            });
        });
        animations.push(new Promise(resolve => {
            modListElement.animate([
                { offset: 0, opacity: 1 },
                { offset: 1, opacity: 0 }
            ], 600).addEventListener('finish', resolve.bind(this, undefined));
        }));
        this.disableCraft();
        await Promise.allSettled(animations);
        this.cancel();
        this.ctx.element.querySelectorStrict<HTMLLegendElement>('[data-craft-backdrop]').click();
        modListElement.style.opacity = '1';
        this.enableCraft();
    }

    private async triggerAdvReforgeOutcomeAnim(success: boolean) {
        this.disableCraft();
        const animate: Promise<void> = new Promise(resolve => {
            const outline = '1px solid rgba(255, 255, 255, 0)';
            const anim = this.ctx.element.animate([
                { outline },
                { offset: 0.8, outlineColor: success ? 'green' : 'red' },
                { offset: 1, outline }
            ], 1000);
            anim.addEventListener('finish', () => {
                resolve();
            });
        });
        await animate;
        this.enableCraft();
    }

    private stopCrafting() {
        this.ctxCopy = null;
        this.element.querySelectorStrict('[data-compare-button]').setAttribute('disabled', '');
        this.element.querySelectorStrict('[data-confirm-button]').setAttribute('disabled', '');
        this.element.querySelectorStrict('[data-cancel-button]').setAttribute('disabled', '');
        this.clearCraftSelection();
        this.updateModListElement();
    }

    private disableCraft() {
        this.element.style.pointerEvents = 'none';
        this.ctx.element.style.pointerEvents = 'none';
    }

    private enableCraft() {
        this.element.style.pointerEvents = 'all';
        this.ctx.element.style.pointerEvents = 'all';
    }

    private clearCraftSelection() {
        this.selectCraftById(null);
    }

    private openCompareModal() {
        assertDefined(this.ctxCopy);

        const modal = createCustomElement(ModalElement);
        modal.setTitle('Compare');

        const element = document.createElement('div');
        element.classList.add('s-compare');

        {
            const stats = extractStats(player.stats);
            const dps1 = calcPlayerStats({ stats, modDB: player.modDB }).dps;

            const modDB = new ModDB(player.modDB);
            modDB.replace(Weapon.sourceName, Modifier.extractStatModifierList(...this.ctxCopy.modList));
            const dps2 = calcPlayerStats({ stats, modDB }).dps;
            const dpsCompareElement = document.createElement('div');
            dpsCompareElement.classList.add('dps-compare');

            dpsCompareElement.innerHTML = `<span data-tag="${dps2 > dps1 ? 'valid' : dps2 < dps1 ? 'invalid' : ''}">DPS: <var>${dps1.toFixed(0)}</var> → <var>${dps2.toFixed(0)}</var></span>`;

            element.appendChild(dpsCompareElement);
        }


        const createModListElement = (modList: Modifier[]) => {
            const element = document.createElement('ul');
            element.classList.add('g-mod-list');
            element.append(...generateModListElements(modList, this.ctx.modGroupsList));
            return element;
        };

        const a = createModListElement(this.ctx.modList);
        const b = createModListElement(this.ctxCopy.modList);
        element.append(a, b);



        const missingModifiers = this.ctx.modList.filter(x => !this.ctxCopy?.modList.some(y => y.template === x.template));
        [...a.querySelectorAll<HTMLElement>('[data-mod]')].filter(x => missingModifiers.find(y => y.desc === x.textContent)).forEach(x => x.setAttribute('data-tag', 'invalid'));

        const additions = this.ctxCopy.modList.filter(x => !this.ctx.modList.some(y => y.template === x.template));
        [...b.querySelectorAll<HTMLElement>('[data-mod]')].filter(x => additions.find(y => y.desc === x.textContent)).forEach(x => x.setAttribute('data-tag', 'valid'));

        modal.setBodyElement(element);

        this.element.appendChild(modal);
    }

    private openAdvancedReforgeModal() {
        const advReforge = this.advReforge = this.advReforge ?? { maxReforgeCount: 0, modItems: [] };

        const modal = createCustomElement(ModalElement);
        modal.classList.add('adv-reforge-modal');
        const bodyElement = document.createElement('div');
        bodyElement.classList.add('s-adv-reforge');
        const createMaxReforgeCountInputElement = () => {
            const label = document.createElement('span');
            label.classList.add('max-reforge-count-label');
            label.textContent = 'Max Reforge Count';
            const input = document.createElement('input');
            input.classList.add('max-reforge-count-input');
            label.setAttribute('data-max-reforge-count-input', '');
            input.setAttribute('type', 'number');
            input.addEventListener('change', () => {
                const value = parseInt(input.value || '0');
                advReforge.maxReforgeCount = value;
            });
            input.value = advReforge.maxReforgeCount.toFixed();
            bodyElement.append(label, input);
        };

        const createRowElement = (modItem: AdvancedReforge['modItems'][number]): HTMLElement => {
            //Modifier
            const modTextDropdown = createCustomElement(TextInputDropdownElement);
            modTextDropdown.setReadonly();
            modTextDropdown.setInputText(modItem.text);
            const modListSet = new Set(this.ctx.candidateModList.filter(x => (x.weaponTypeNameList ?? []).length === 0).map(x => x.template.desc));
            const none = 'None';
            modTextDropdown.setDropdownList([none, ...modListSet]);
            modTextDropdown.onInputChange = ({ text }) => {
                modItem.text = text === none ? '' : text;
                if (modItem.text.length === 0) {
                    modTextDropdown.setInputText('');
                }
                updateTierInput();
            };

            const updateTierInput = () => {
                const modText = modItem.text;
                const modList = this.ctx.candidateModList.filter(x => x.template.desc === modText).filter(x => (x.weaponTypeNameList ?? []).length === 0);
                const modListCount = modList.length;
                const filterList = [...Array(modListCount)].map((_, i) => `Tier ${i + 1}`);
                tierDropdown.setDropdownList(filterList);
                modItem.tier = Math.min(modItem.tier || 1, modListCount);
                tierDropdown.setInputText(filterList[modItem.tier - 1] ?? '');
            };

            //Tier
            const tierDropdown = createCustomElement(TextInputDropdownElement);
            tierDropdown.setReadonly();
            tierDropdown.onInputChange = ({ index }) => {
                modItem.tier = index + 1;
            };
            updateTierInput();

            const row = document.createElement('div');
            row.classList.add('s-row');
            row.append(modTextDropdown, tierDropdown);
            return row;
        };

        createMaxReforgeCountInputElement();
        const conditionsElement = document.createElement('div');
        conditionsElement.classList.add('s-conditions');
        conditionsElement.insertAdjacentHTML('beforeend', '<div>Conditions</div>');
        for (let i = 0; i < this.ctx.getMaxModCount(); i++) {
            const modItem: AdvancedReforge['modItems'][number] = this.advReforge.modItems[i] ?? { text: '', tier: 0 };
            assertDefined(modItem);
            this.advReforge.modItems[i] = modItem;
            const rowElement = createRowElement(modItem);
            conditionsElement.appendChild(rowElement);
        }
        bodyElement.appendChild(conditionsElement);

        const helpIcon = createHelpIcon('', `
        Specify how many times to reforge with a single action. (set to 0 to disable)
        Each reforge will evaluate the conditions.
        When all conditions are met or reaching max reforge count, the reforging will stop.

        The modifier tier determines the minimum required tier. E.g. Tier 2 will match Tier 2 and Tier 1.
        `.trim());
        bodyElement.appendChild(helpIcon);

        modal.setBodyElement(bodyElement);
        this.element.appendChild(modal);
    }

    addCraft(craftTemplate: CraftTemplate, successRates: Craft['successRates'], startCount = 0) {
        const element = document.createElement('li');
        element.classList.add('g-list-item', 'g-field');
        element.setAttribute('data-craft-id', craftTemplate.id);
        element.insertAdjacentHTML('beforeend', `<div>${craftTemplate.desc}</div><var data-count>0</var>`);
        element.addEventListener('click', this.selectCraftById.bind(this, craftTemplate.id));
        this.craftListElement.appendChild(element);
        const craft: Craft = {
            template: craftTemplate,
            desc: craftTemplate.desc as CraftTemplateDescription,
            element,
            successRates,
            count: startCount,
        };
        this.craftList.push(craft);
        this.updateCraftCount(craft);
    }

    addCraftCount(desc: CraftTemplateDescription, count: number) {
        const craft = this.craftList.findStrict(x => x.template.desc === desc);
        craft.count += count;
        this.updateCraftCount(craft);
        this.updateCraftListItemStates();
    }

    private updateCraftCount(craft?: Craft) {
        const craftList = craft ? [craft] : this.craftList;
        for (const craft of craftList) {
            craft.element.querySelectorStrict('[data-count]').textContent = craft.count.toFixed();
        }
    }

    updateCraftList() {
        this.selectCraftById(this.selectedCraft?.template.id ?? null);
    }

    syncCraftItem() {
        this.updateCraftItemWeaponTypeElement();
        this.updateModListElement();
    }

    serialize(modDataList: { id: string; text: string; }[]): Required<Serialization>['weapon']['crafting'] {
        return {
            craftList: this.craftList.map(x => ({ id: x.template.id, count: x.count })),
            modList: this.ctxCopy?.modList.map(x => ({ srcId: modDataList.findStrict(y => y.text === x.text).id, values: x.values }))
        };
    }

    deserialize(save: DeepPartial<WeaponCrafting>, modDataList: { id: string; text: string; }[]) {
        if (save.modList) {
            this.beginCrafting();
            assertNonNullable(this.ctxCopy);
            this.ctxCopy.modList.clear();
            for (const { srcId, values } of save.modList.filter(isDefined)) {
                if (!values) {
                    continue;
                }
                const modData = modDataList.find(x => x.id === srcId);
                if (!modData) {
                    continue;
                }
                const mod = Modifier.modFromText(modData.text);
                mod.setValues(values?.filter(isNumber));
                this.ctxCopy.modList.push(mod);
            }
            this.syncCraftItem();
        }
        if (save.craftList) {
            for (const serializedCraft of save.craftList.filter(isDefined)) {
                const craft = this.craftList.find(x => x.template.id === serializedCraft.id);
                if (!craft) {
                    continue;
                }
                craft.count = serializedCraft.count === null ? Infinity : serializedCraft.count ?? 0;
            }
            this.updateCraftCount();
            this.updateCraftListItemStates();
        }

    }
}
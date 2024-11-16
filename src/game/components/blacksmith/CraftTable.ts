import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { craftTemplates, devCraftTemplates, type CraftTemplate, type CraftTemplateDescription } from './craftTemplates';
import { Modifier, type ModGroupList } from 'src/game/mods/Modifier';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ModalElement } from 'src/shared/customElements/ModalElement';
import { CraftManager, type ModifierCandidate } from './CraftManager';
import { EventEmitter } from 'src/shared/utils/EventEmitter';
import { TextInputDropdownElement } from 'src/shared/customElements/TextInputDropdownElement';
import { game, GameInitializationStage, player } from '../../game';
import { ModDB } from '../../mods/ModDB';
import { calcPlayerCombatStats, extractStats } from '../../calc/calcStats';
import { ENVIRONMENT } from '../../../config';
import type GameConfig from '../../gameConfig/GameConfigExport';
import { evalCost } from '../../utils/utils';
import type { BlacksmithItem } from './Blacksmith';
import { calcModTier, getModGroupList } from '../../mods/modUtils';
import { generateModListElements } from '../../mods/modUtilsDOM';
import { Crafting } from './Crafting';

export interface Craft {
    template: CraftTemplate;
    desc: CraftTemplateDescription;
    element: HTMLElement;
    successRates: { min: number; max: number; };
    cost?: GameConfig.Cost;
}

export interface AdvancedReforge {
    maxReforgeCount: number;
    modItems: { text: string; tier: number; }[];
}

export interface CraftContext {
    item: BlacksmithItem;
    craftList: GameConfig.BlacksmithCraft[];
    craft: Craft | null;
    craftAreaElement: HTMLElement;
    modGroupsList: ModGroupList[];
    candidateModList: () => ModifierCandidate[];
}

export type CraftActionType = 'Confirm' | 'Cancel' | 'Change';

export class CraftTable {
    readonly craftAction = new EventEmitter<{ item: BlacksmithItem; type: CraftActionType; }>();
    readonly element: HTMLElement;
    private readonly crafting: Crafting;
    private readonly craftListElement: HTMLElement;
    private craftList: Craft[] = [];
    private abortController?: AbortController | null = null;

    constructor(readonly ctx: CraftContext) {
        this.crafting = new Crafting(ctx);
        this.crafting.craftAction.listen(e => {
            switch (e) {
                case 'Cancel': this.cancel(); break;
            }
        });

        this.element = document.createElement('div');
        this.element.classList.add('craft-table');
        this.element.insertAdjacentHTML('beforeend', '<div class="g-title">Craft Table</div>');
        this.createToolbar();

        this.craftListElement = document.createElement('ul');
        this.craftListElement.classList.add('s-craft-list', 'g-scroll-list-v');
        this.craftListElement.setAttribute('data-craft-list', '');
        this.craftListElement.insertAdjacentHTML('beforeend', '<li><div>Description</div><div data-cost>Cost</div><div data-resource>Resource</div></li>');
        this.element.appendChild(this.craftListElement);

        this.stopCrafting();

        if (ENVIRONMENT === 'development') {
            this.addCraft({ desc: '[Dev] Reforge High DPS', successRates: { min: 100, max: 100 } });
        }

        for (const craftData of ctx.craftList) {
            this.addCraft(craftData);
        }

        this.updateCraftListItemStates();

        Object.values(game.resources).forEach(x => x.addListener('change', () => {
            if (game.initializationStage >= GameInitializationStage.Done) {
                this.updateCraftListItemStates();
            }
        }));

        new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                this.updateCraftList();
            }
        }).observe(this.craftListElement);
    }

    private createToolbar() {
        const toolbarElement = document.createElement('div');
        toolbarElement.classList.add('s-toolbar', 'g-toolbar');
        toolbarElement.setAttribute('data-toolbar', '');

        const startCraftingButton = document.createElement('button');
        startCraftingButton.setAttribute('data-start-crafting-button', '');
        startCraftingButton.textContent = 'Craft';
        startCraftingButton.addEventListener('click', this.startCrafting.bind(this));

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

        toolbarElement.append(startCraftingButton, compareButton, confirmButton, cancelButton);

        this.element.appendChild(toolbarElement);

        const advReforgeElement = document.createElement('button');
        advReforgeElement.classList.add('hidden', 'advanced-reforge');
        advReforgeElement.setAttribute('data-advanced-reforge-button', '');
        advReforgeElement.textContent = 'Adv. Reforge';
        advReforgeElement.addEventListener('click', () => {
            this.openAdvancedReforgeModal();
        });
        toolbarElement.appendChild(advReforgeElement);

    }

    private updateToolbar() {
        this.element.querySelectorStrict('[data-start-crafting-button]').classList.toggle('hidden', !!this.ctx.item.modListCrafting);
        this.element.querySelectorStrict('[data-compare-button]').classList.toggle('hidden', !this.ctx.item.modListCrafting);
        this.element.querySelectorStrict('[data-confirm-button]').classList.toggle('hidden', !this.ctx.item.modListCrafting);
        this.element.querySelectorStrict('[data-cancel-button]').classList.toggle('hidden', !this.ctx.item.modListCrafting);
    }

    private updateCraftListItemStates() {
        for (const craft of this.craftList) {
            craft.element.classList.toggle('selected', craft === this.ctx.craft);
            const disabled = !this.evalCraft(craft);
            craft.element.toggleAttribute('disabled', disabled);
        }
    }

    private createBackdrop() {
        const element = document.createElement('div');
        element.classList.add('craft-backdrop');
        element.setAttribute('data-craft-backdrop', '');
        element.addEventListener('click', () => {
            element.remove();
            this.clearCraftSelection();
        });
        this.ctx.craftAreaElement.append(element);
    }

    private removeBackdrop() {
        this.ctx.craftAreaElement.querySelector<HTMLElement>('[data-craft-backdrop]')?.click();
    }

    private updateSuccessRateAttribute(e: MouseEvent) {
        assertDefined(this.ctx.item.modListCrafting);

        const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict('[data-craft-area]');
        craftAreaElement.removeAttribute('data-success-rate');
        if (!this.ctx.craft) {
            return;
        }

        let mod: Modifier | undefined;
        if (e.target instanceof HTMLElement && e.target.hasAttribute('data-mod') && e.target.getAttribute('data-craft') !== 'false') {
            const id = e.target.getAttribute('data-mod');
            mod = this.ctx.item.modListCrafting.find(x => x.template.id === id);
        }

        const successRate = CraftManager.calcSuccessRate(this.ctx.craft, {
            filterName: this.ctx.item.name,
            maxModCount: this.ctx.item.maxModCount,
            modList: this.ctx.item.modListCrafting,
            ...this.ctx
        }, mod);

        craftAreaElement.setAttribute('data-success-rate', successRate.toFixed());
    }

    private selectCraftById(id: string | null) {
        this.ctx.craft = this.craftList.find(x => x.template.id === id) ?? null;

        this.abortController?.abort();

        const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict('[data-craft-area]');

        craftAreaElement.querySelectorAll<HTMLElement>('[data-craft]').forEach(x => {
            x.removeAttribute('data-craft');
        });

        this.updateCraftListItemStates();

        if (!this.ctx.craft) {
            return;
        }

        assertDefined(this.ctx.item.modListCrafting);
        this.abortController = new AbortController();

        switch (this.ctx.craft.template.target) {
            case 'All':
                craftAreaElement.querySelectorStrict('[data-mod-list]').setAttribute('data-craft', '');
                break;
            case 'Single':
                craftAreaElement.querySelectorAll<HTMLElement>('[data-mod]').forEach(x => x.setAttribute('data-craft', ''));
                break;
        }

        if (this.ctx.craft.template.type === 'Upgrade') {
            const modElementList = [...craftAreaElement.querySelectorAll<HTMLElement>('[data-mod]')];
            for (const modElement of modElementList) {
                const id = modElement.getAttribute('data-mod');
                const mod = this.ctx.item.modListCrafting.findStrict(x => x.template.id === id);
                const tier = calcModTier(mod.text, getModGroupList(mod.text, this.ctx.modGroupsList));
                const craftable = tier > 1;
                modElement.setAttribute('data-craft', String(craftable));
            }
        }
        if (this.ctx.craft.template.type === 'Randomize Numericals') {
            const modElementList = [...craftAreaElement.querySelectorAll<HTMLElement>('[data-mod]')];
            for (const modElement of modElementList) {
                const id = modElement.getAttribute('data-mod');
                const mod = this.ctx.item.modListCrafting.find(x => x.template.id === id);
                const craftable = !!mod && mod.rangeValues.some(x => x.min !== x.max);
                modElement.setAttribute('data-craft', String(craftable));
            }
        }
        craftAreaElement.querySelectorAll<HTMLElement>('[data-craft]').forEach(x => {
            assertNonNullable(this.abortController);
            x.addEventListener('mouseover', this.updateSuccessRateAttribute.bind(this), { signal: this.abortController.signal });
            x.addEventListener('click', this.performCraft.bind(this), { capture: true, signal: this.abortController.signal });
        });
        this.createBackdrop();
    }

    private startCrafting() {
        this.ctx.item.modListCrafting = [];
        this.craftAction.invoke({ item: this.ctx.item, type: 'Change' });
        this.updateToolbar();
        this.updateCraftListItemStates();
    }

    private async performCraft(e: MouseEvent) {
        assertDefined(this.ctx.item.modListCrafting);
        e.stopPropagation();

        const modId = e.target instanceof HTMLElement ? e.target.getAttribute('data-mod') : undefined;
        const mod = modId ? this.ctx.item.modListCrafting.findStrict(x => x.template.id === modId) : undefined;

        await this.crafting.processCraft(mod);

        this.craftAction.invoke({ item: this.ctx.item, type: 'Change' });

        const craft = this.ctx.craft;
        if (craft) {
            this.removeBackdrop();
            if (this.evalCraft(craft)) {
                this.selectCraftById(craft.template.id);
            }
        }
    }

    private evalCraft(craft: Craft) {
        let valid = false;
        if (this.ctx.item.modListCrafting) {
            switch (craft.template.type) {
                case 'Reforge':
                    valid = true;
                    break;
                case 'Add':
                    valid = this.ctx.item.modListCrafting.length < this.ctx.item.maxModCount && CraftManager.generateMods(this.ctx.item.modListCrafting, this.ctx.candidateModList(), 1).length !== 0;
                    break;
                case 'Remove':
                case 'Upgrade':
                case 'Randomize Numericals':
                    valid = this.ctx.item.modListCrafting.length !== 0;
                    break;
            }
        }
        if (craft.cost && !evalCost(craft.cost)) {
            valid = false;
        }
        return valid;
    }

    private confirm() {
        this.craftAction.invoke({ item: this.ctx.item, type: 'Confirm' });
        this.stopCrafting();
    }

    private cancel() {
        this.stopCrafting();
        this.craftAction.invoke({ item: this.ctx.item, type: 'Cancel' });
    }

    private stopCrafting() {
        delete this.ctx.item.modListCrafting;
        this.updateToolbar();
        this.clearCraftSelection();
        this.updateCraftListItemStates();
    }

    private clearCraftSelection() {
        this.selectCraftById(null);
    }

    private openCompareModal() {
        assertDefined(this.ctx.item.modListCrafting);
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Compare');

        const element = document.createElement('div');
        element.classList.add('s-compare');

        const stats = extractStats(player.stats);
        const dps1 = calcPlayerCombatStats({ stats, modDB: player.modDB }).dps;

        const modDB = new ModDB(player.modDB);
        modDB.replace(`Blacksmith/${this.ctx.item.name}`, Modifier.extractStatModifierList(...this.ctx.item.modListCrafting));
        const dps2 = calcPlayerCombatStats({ stats, modDB }).dps;
        const dpsCompareElement = document.createElement('div');
        dpsCompareElement.classList.add('dps-compare');

        dpsCompareElement.innerHTML = `<span data-tag="${dps2 > dps1 ? 'valid' : dps2 < dps1 ? 'invalid' : ''}">DPS: <var>${dps1.toFixed(0)}</var> → <var>${dps2.toFixed(0)}</var></span>`;

        element.appendChild(dpsCompareElement);


        const createModListElement = (modList: Modifier[]) => {
            const element = document.createElement('ul');
            element.classList.add('g-mod-list');
            element.append(...generateModListElements({ modList, modGroupsList: this.ctx.modGroupsList }));
            return element;
        };

        const a = createModListElement(this.ctx.item.modList);
        const b = createModListElement(this.ctx.item.modListCrafting);
        element.append(a, b);

        const missingModifiers = this.ctx.item.modList.filter(x => !(this.ctx.item.modListCrafting ?? []).some(y => y.template === x.template));
        [...a.querySelectorAll<HTMLElement>('[data-mod]')].filter(x => missingModifiers.find(y => y.desc === x.textContent)).forEach(x => x.setAttribute('data-tag', 'invalid'));

        const additions = this.ctx.item.modListCrafting.filter(x => !this.ctx.item.modList.some(y => y.template === x.template));
        [...b.querySelectorAll<HTMLElement>('[data-mod]')].filter(x => additions.find(y => y.desc === x.textContent)).forEach(x => x.setAttribute('data-tag', 'valid'));

        modal.addBodyElement(element);

        this.element.appendChild(modal);
    }

    private openAdvancedReforgeModal() {
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

            const advancedReforge = this.ctx.item.advancedReforge;
            assertDefined(advancedReforge);
            input.addEventListener('change', () => {
                const value = parseInt(input.value || '0');
                advancedReforge.maxReforgeCount = value;
            });
            input.value = advancedReforge.maxReforgeCount.toFixed();
            bodyElement.append(label, input);
        };

        const createRowElement = (modItem: AdvancedReforge['modItems'][number]): HTMLElement => {
            //Modifier
            const modTextDropdown = createCustomElement(TextInputDropdownElement);
            // modTextDropdown.setReadonly();
            modTextDropdown.setInputText(modItem.text);
            const modListSet = new Set(this.ctx.candidateModList().map(x => x.template.desc));
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
                const modList = this.ctx.candidateModList().filter(x => x.template.desc === modText);
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
        for (let i = 0; i < this.ctx.item.maxModCount; i++) {
            assertDefined(this.ctx.item.advancedReforge);
            const modItem: AdvancedReforge['modItems'][number] = this.ctx.item.advancedReforge.modItems[i] ?? { text: '', tier: 0 };
            assertDefined(modItem);
            this.ctx.item.advancedReforge.modItems[i] = modItem;
            const rowElement = createRowElement(modItem);
            conditionsElement.appendChild(rowElement);
        }
        bodyElement.appendChild(conditionsElement);

        modal.addBodyElement(bodyElement);
        this.element.appendChild(modal);
    }


    initItem(item: BlacksmithItem) {
        this.ctx.item = item;
        this.updateToolbar();
        this.updateCraftListItemStates();
    }

    unlockAdvReforge() {
        this.element.querySelectorStrict('[data-advanced-reforge-button]').classList.remove('hidden');
    }

    addCraft(craftData: GameConfig.BlacksmithCraft) {
        const template = [...craftTemplates, ...devCraftTemplates].findStrict(x => x.desc === craftData.desc);
        const element = document.createElement('li');
        element.classList.add('g-list-item');
        element.setAttribute('data-craft-id', template.id);
        const resource = this.craftList.length === 0 ? 'A Very Long Resource Name' : 'Gold';
        element.insertAdjacentHTML('beforeend', `<div>${template.desc}</div><var data-cost>0</var><var data-resource>${resource}</var>`);
        element.addEventListener('click', this.selectCraftById.bind(this, template.id));
        this.craftListElement.appendChild(element);
        const craft: Craft = {
            template: template,
            desc: template.desc as CraftTemplateDescription,
            element,
            successRates: craftData.successRates,
            cost: craftData.cost
        };
        this.craftList.push(craft);
        this.updateCraftList();
    }

    updateCraftList() {
        this.craftListElement.querySelectorAll('[data-craft-id]').forEach(x => {
            const id = x.getAttribute('data-craft-id');
            const cost = this.craftList.findStrict(x => x.template.id === id).cost;
            x.querySelectorStrict('[data-resource]').textContent = cost ? cost.name : '';
            x.querySelectorStrict('[data-cost]').textContent = cost ? cost.value.toFixed() : '';
        });

        requestAnimationFrame(() => {
            setTimeout(() => {
                const calcWidth = (elements: HTMLElement[]) => {
                    let maxWidth = 0;
                    for (const element of elements) {
                        maxWidth = Math.max(maxWidth, element.offsetWidth);
                    }
                    elements.forEach(x => x.style.minWidth = CSS.px(maxWidth).toString());
                    return maxWidth;
                };
                calcWidth([...this.craftListElement.querySelectorAll<HTMLElement>('[data-cost]')]);
                calcWidth([...this.craftListElement.querySelectorAll<HTMLElement>('[data-resource]')]);
            }, 100);
        });
    }
}
import { Component } from 'src/game/components/Component';
import { player } from 'src/game/game';
import { Modifier, type ModGroupList } from '../../mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { modTemplateList } from 'src/game/mods/modTemplates';
import { isNumber } from 'src/shared/utils/utils';
import { createLevelModal, createTitleElement } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { assertDefined } from '../../../shared/utils/assert';
import type { ModifierCandidate } from './CraftManager';
import { CraftTable, type AdvancedReforge } from './CraftTable';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { TextInputDropdownElement } from '../../../shared/customElements/TextInputDropdownElement';
import { generateModListElements } from '../../mods/modUtilsDOM';

export interface BlacksmithItem {
    id: string;
    name: string;
    reforgeWeights: number[];
    maxModCount: number;
    modList: Modifier[];
    modListCrafting?: Modifier[];
    advancedReforge?: AdvancedReforge;
}

export class Blacksmith extends Component {
    private readonly modGroupsList: ModGroupList[] = [];
    private readonly candidateModList: ModifierCandidate[] = [];
    private readonly craftTable: CraftTable;
    private readonly level = new Value(1);
    private readonly itemList: BlacksmithItem[];
    constructor(readonly data: GameConfig.Blacksmith) {
        super('blacksmith');

        const titleElement = createTitleElement({
            label: 'Blacksmith',
            levelClickCallback: data.levelList ? this.openBlacksmithLevelModal.bind(this) : undefined,
            helpText: this.getHelpText(),
        });
        this.page.appendChild(titleElement);

        const itemListDropdownParent = document.createElement('div');
        itemListDropdownParent.classList.add('s-item-dropdown');
        const itemListDropdown = createCustomElement(TextInputDropdownElement);
        itemListDropdown.setReadonly();
        itemListDropdown.setDropdownList(data.itemList.map(x => x.name));
        itemListDropdown.onInputChange = ({ index }) => {
            const item = this.itemList[index];
            assertDefined(item);
            this.updateModListElements(item);
            this.craftTable.initItem(item);
        };
        itemListDropdownParent.appendChild(itemListDropdown);
        this.page.appendChild(itemListDropdownParent);

        const craftAreaElement = document.createElement('div');
        craftAreaElement.classList.add('s-craft-area');
        craftAreaElement.setAttribute('data-craft-area', '');
        this.page.appendChild(craftAreaElement);

        craftAreaElement.insertAdjacentHTML('beforeend', '<ul class="s-mod-list g-mod-list" data-mod-list></ul>');

        this.itemList = this.data.itemList.map(x => ({
            id: x.id,
            name: x.name,
            modList: [],
            reforgeWeights: x.reforgeWeights,
            maxModCount: x.reforgeWeights.length,
            advancedReforge: data.crafting.advancedReforge ? { maxReforgeCount: 0, modItems: [] } : undefined
        }));
        const firstItem = this.itemList[0];
        assertDefined(firstItem);

        this.craftTable = new CraftTable({
            item: firstItem,
            craftAreaElement: this.page,
            craft: null,
            craftList: data.crafting.craftList,
            modGroupsList: this.modGroupsList,
            candidateModList: () => {
                return this.candidateModList.filter(x => !x.filter || x.filter.includes(this.craftTable.ctx.item.name));
            },
        });
        this.page.appendChild(this.craftTable.element);

        for (const modList of data.modLists) {
            const groupList: ModGroupList = [];
            this.modGroupsList.push(groupList);
            for (const modData of modList) {
                this.level.registerTargetValueCallback(modData.level, () => {
                    const template = modTemplateList.findStrict(x => x.desc === Modifier.getTemplate(modData.mod)?.desc);
                    this.candidateModList.push({ text: modData.mod, template, weight: modData.weight, filter: modData.itemFilter });
                    groupList.push({ text: modData.mod, filter: modData.itemFilter });
                });
            }
        }

        this.craftTable.craftAction.listen(({ item, type }) => {
            switch (type) {
                case 'Confirm':
                    assertDefined(item.modListCrafting);
                    item.modList = item.modListCrafting;
                    this.applyModifiers(item);
                    break;
                case 'Cancel':
                    delete item.modListCrafting;
                    break;
            }
            this.updateModListElements(item);
        });

        this.updateBlacksmithLevel();
        this.level.addListener('change', this.updateBlacksmithLevel.bind(this));

        if (data.crafting.advancedReforge) {
            this.level.registerTargetValueCallback(data.crafting.advancedReforge.requirements.blacksmithLevel, this.craftTable.unlockAdvReforge.bind(this.craftTable));
        }
    }

    private getHelpText() {
        return `Craft your items using the craft table.
        New and better modifiers become available as you level up the blacksmith.`;
    }

    private updateModListElements(item: BlacksmithItem) {
        const modList = item.modListCrafting ?? item.modList;
        this.page.querySelectorStrict('[data-mod-list]').replaceChildren(...generateModListElements({ modList, modGroupsList: this.modGroupsList }));
    }

    private openBlacksmithLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Blacksmith',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateBlacksmithLevel() {
        if (!this.data.levelList) {
            return;
        }
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('BlacksmithUpgrade', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private applyModifiers(item: BlacksmithItem) {
        player.modDB.replace(`Blacksmith/${item.name}`, Modifier.extractStatModifierList(...item.modList));
    }

    serialize(save: Serialization) {
        save.blacksmith = {
            level: this.level.value ?? 0,
            itemList: this.itemList.map(item => ({
                id: item.id,
                modList: item.modList.map(mod => ({ srcId: this.data.modLists.flatMap(x => x).findStrict(y => y.mod === mod.text).id, values: mod.values })),
                modListCrafting: item.modListCrafting?.map(mod => ({ srcId: this.data.modLists.flatMap(x => x).findStrict(y => y.mod === mod.text).id, values: mod.values })) ?? undefined,
                advReforge: item.advancedReforge ? { count: item.advancedReforge.maxReforgeCount, modItems: item.advancedReforge.modItems } : undefined
            })),
        };
    }

    deserialize({ blacksmith: save }: UnsafeSerialization) {
        if (!save) {
            return;
        }
        if (isNumber(save.level)) {
            this.level.set(save.level);
        }

        for (const itemData of save.itemList ?? []) {
            const srcItem = this.itemList.find(x => x.id === itemData?.id);
            if (!srcItem) {
                continue;
            }

            srcItem.modList = Modifier.deserialize(...itemData?.modList?.map(x =>
                ({
                    text: this.data.modLists.flatMap(y => y).find(y => y.id === x?.srcId)?.mod,
                    srcId: x?.srcId, values: x?.values
                })) ?? []);
            srcItem.modListCrafting = itemData?.modListCrafting ? Modifier.deserialize(...itemData?.modListCrafting?.map(x =>
                ({
                    text: this.data.modLists.flatMap(y => y).find(y => y.id === x?.srcId)?.mod,
                    srcId: x?.srcId, values: x?.values
                })) ?? []) : undefined;

            if (srcItem.advancedReforge && itemData?.advReforge) {
                srcItem.advancedReforge = { maxReforgeCount: itemData.advReforge.count ?? 0, modItems: itemData.advReforge.modItems?.map(x => ({ text: x?.text ?? '', tier: x?.tier ?? 0 })) ?? [] };
            }
        }

        this.itemList.forEach(x => this.applyModifiers(x));
        if (this.itemList[0]) {
            if (this.itemList[0].modListCrafting) {
                this.craftTable.initItem(this.itemList[0]);
            }
            this.updateModListElements(this.itemList[0]);
        }
    }
}
import { Component } from 'src/game/components/Component';
import { player } from 'src/game/game';
import { Modifier, type ModGroupList } from '../../mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { modTemplateList } from 'src/game/mods/modTemplates';
import { isNumber } from 'src/shared/utils/utils';
import { createHelpIcon } from 'src/shared/utils/dom';
import { createLevelModal } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { assertDefined } from '../../../shared/utils/assert';
import type { ModifierCandidate } from './CraftManager';
import { CraftTable } from './CraftTable';
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
}

export class Blacksmith extends Component {
    private readonly modGroupsList: ModGroupList[] = [];
    private readonly candidateModList: ModifierCandidate[] = [];
    private readonly craftTable: CraftTable;
    private readonly level = new Value(1);
    private readonly itemList: BlacksmithItem[];
    constructor(readonly data: GameConfig.Blacksmith) {
        super('blacksmith');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Blacksmith';
        this.page.appendChild(titleElement);
        if (data.levelList) {
            titleElement.innerHTML = `<span class="g-clickable-text">Blacksmith Lv.<var data-level>1</var></span>`;
            titleElement.addEventListener('click', this.openBlacksmithLevelModal.bind(this));
            this.page.appendChild(titleElement);
            this.updateBlacksmithLevel();
        }
        this.page.appendChild(titleElement);

        const helpIconElement = createHelpIcon('Weapon Help', `
            Craft your weapon using the craft table.
            New and better modifiers become available as you level up.
            You can click modifiers to see more information about them.
        `.trim());
        this.page.appendChild(helpIconElement);

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

        this.page.insertAdjacentHTML('beforeend', '<ul class="s-mod-list g-mod-list" data-mod-list></ul>');

        this.itemList = this.data.itemList.map(x => ({
            id: x.id,
            name: x.name,
            modList: [],
            reforgeWeights: x.reforgeWeights,
            maxModCount: x.reforgeWeights.length
        }));
        const firstItem = this.itemList[0];
        assertDefined(firstItem);

        this.craftTable = new CraftTable({
            item: firstItem,
            element: this.page,
            craftList: data.crafting.craftList,
            modGroupsList: this.modGroupsList,
            candidateModList: this.candidateModList,
            advReforgeRequirements: this.data.crafting.advancedReforge.requirements,
        });
        this.page.appendChild(this.craftTable.element);

        for (const modList of data.modLists) {
            const groupList: ModGroupList = [];
            this.modGroupsList.push(groupList);
            for (const modData of modList) {
                player.stats.level.registerTargetValueCallback(modData.level, () => {
                    const template = modTemplateList.findStrict(x => x.desc === Modifier.getTemplate(modData.mod)?.desc);
                    this.candidateModList.push({ text: modData.mod, template, weight: modData.weight });
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

        this.level.addListener('change', this.updateBlacksmithLevel.bind(this));
    }

    private updateModListElements(item: BlacksmithItem) {
        const modList = item.modListCrafting ?? item.modList;
        this.page.querySelectorStrict('[data-mod-list]').replaceChildren(...generateModListElements({ modList, modGroupsList: this.modGroupsList }));
    }

    private openBlacksmithLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Weapon',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateBlacksmithLevel() {
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('WeaponUpgrade', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private applyModifiers(item: BlacksmithItem) {
        player.modDB.replace(`Blacksmith/${item.name}`, Modifier.extractStatModifierList(...item.modList));
    }

    serialize(save: Serialization) {
        save.blacksmith = {
            level: this.level.value ?? 0,
            itemList: this.itemList.map(x => ({
                id: x.id,
                modList: Modifier.serialize(...x.modList),
                modListCrafting: x.modListCrafting ? Modifier.serialize(...x.modListCrafting) : undefined
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
                text: this.data.modLists.flatMap(y => y).findStrict(y => Modifier.getTemplate(y.mod)?.id === x?.srcId).mod,
                srcId: x?.srcId, values: x?.values
            })) ?? []);
            srcItem.modListCrafting = itemData?.modListCrafting ? Modifier.deserialize(...itemData?.modListCrafting?.map(x =>
            ({
                text: this.data.modLists.flatMap(y => y).findStrict(y => Modifier.getTemplate(y.mod)?.id === x?.srcId).mod,
                srcId: x?.srcId, values: x?.values
            })) ?? []) : undefined;
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
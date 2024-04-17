import { Component } from 'src/game/components/Component';
import { combat, player } from 'src/game/game';
import { Modifier } from '../../mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { modTemplateList } from 'src/game/mods/modTemplates';
import { CraftTable, type ModGroupList, type WeaponModifierCandidate } from './CraftTable';
import { craftTemplates, type CraftTemplateDescription } from './craftTemplates';
import { isDefined, isNumber, isString, pickManyFromPickProbability } from 'src/shared/utils/utils';
import { createHelpIcon } from 'src/shared/utils/dom';

export class Weapon extends Component {
    private readonly modGroupsList: ModGroupList[] = [];
    private readonly candidateModList: WeaponModifierCandidate[] = [];
    private readonly craftTable: CraftTable;
    private readonly modList: Modifier[] = [];
    constructor(readonly data: GameConfig.Weapon) {
        super('weapon');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Weapon';
        const helpIconElement = createHelpIcon('Weapon Help', `
            Craft your weapon using the craft table.
            New and better modifiers become available as you level up.
            You can click modifiers to see more information about them.
        `.trim());
        titleElement.appendChild(helpIconElement);
        this.page.appendChild(titleElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="s-weapon" data-weapon><div class="hidden" data-weapon-type></div><ul class="s-mod-list g-mod-list" data-mod-list></ul></div>');

        this.craftTable = new CraftTable({
            element: this.page.querySelectorStrict('[data-weapon]'),
            modList: this.modList,
            modGroupsList: this.modGroupsList,
            weaponTypes: this.data.weaponTypeList,
            candidateModList: this.candidateModList,
            advReforgeRequirements: this.data.crafting.advReforgeRequirements,
            getMaxModCount: () => 6,

        });
        this.page.appendChild(this.craftTable.element);

        for (const craftData of data.crafting.craftList) {
            const template = craftTemplates.find(x => x.desc === craftData.desc);
            if (!template) {
                console.error(`invalid craft desc: ${craftData.desc}`);
                continue;
            }
            this.craftTable.addCraft(template, craftData.successRates, craftData.startCount ?? 0);
        }

        for (const modList of data.modLists) {
            const groupList: ModGroupList = [];
            this.modGroupsList.push(groupList);
            for (const modData of modList) {
                player.stats.level.registerTargetValueCallback(modData.level, () => {
                    const template = modTemplateList.findStrict(x => x.desc === Modifier.getTemplate(modData.mod)?.desc);
                    this.candidateModList.push({ text: modData.mod, template, weight: modData.weight, weaponTypeNameList: modData.weaponTypes });
                    groupList.push({ text: modData.mod, weaponTypeNameList: modData.weaponTypes ?? [] });
                });
            }
        }

        this.craftTable.updateCraftList();

        this.craftTable.craftConfirmed.listen(() => {
            this.applyModifiers();
        });

        combat.events.enemyDeath.listen(() => {
            const candidates = this.data.crafting.craftList;
            pickManyFromPickProbability(candidates).forEach(x => this.craftTable.addCraftCount(x.desc as CraftTemplateDescription, 1));
        });
    }

    private applyModifiers() {
        player.modDB.replace('Weapon', Modifier.extractStatModifierList(...this.modList));
    }

    serialize(save: Serialization) {
        save.weapon = {
            modList: this.modList.map(x => ({ srcId: this.data.modLists.flatMap(x => x).findStrict(y => y.mod === x.text).id, values: x.values })),
            crafting: this.craftTable.serialize(this.data.modLists.flatMap(x => x).map(x => ({ id: x.id, text: x.mod })))
        };
    }

    deserialize({ weapon: save }: UnsafeSerialization) {
        if (!save) {
            return;
        }
        const deserializeMod = (srcId?: string, values?: number[]) => {
            if (!isString(srcId)) {
                return;
            }
            const modData = this.data.modLists.flatMap(x => x).find(x => x.id === srcId);
            if (!modData) {
                return;
            }
            const template = Modifier.getTemplate(modData.mod);
            if (!template) {
                return;
            }
            const mod = Modifier.modFromText(modData.mod);
            if (values) {
                mod.setValues(values.filter(isNumber));
            }
            return mod;
        };
        const modList = save.modList?.map(x => x && deserializeMod(x.srcId, x.values?.filter(isNumber))).filter(isDefined) ?? [];
        this.modList.splice(0, this.modList.length, ...modList);
        this.applyModifiers();

        this.craftTable.deserialize(save.crafting ?? {}, this.data.modLists.flatMap(x => x).map(x => ({ id: x.id, text: x.mod })));

        this.craftTable.syncCraftItem();
    }
}
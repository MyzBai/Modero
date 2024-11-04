import { Component } from 'src/game/components/Component';
import { player } from 'src/game/game';
import { Modifier } from '../../mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { modTemplateList } from 'src/game/mods/modTemplates';
import { CraftTable, type ModGroupList, type WeaponModifierCandidate } from './CraftTable';
import { isDefined, isNumber, isString } from 'src/shared/utils/utils';
import { createHelpIcon } from 'src/shared/utils/dom';
import { createLevelModal } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';
import { Value } from '../../../shared/utils/Value';
import { assertDefined } from '../../../shared/utils/assert';

export class Weapon extends Component {
    static sourceName = 'Weapon';
    private readonly modGroupsList: ModGroupList[] = [];
    private readonly candidateModList: WeaponModifierCandidate[] = [];
    private readonly craftTable: CraftTable;
    private readonly modList: Modifier[] = [];
    private readonly level = new Value(1);
    constructor(readonly data: GameConfig.Weapon) {
        super('weapon');

        const titleElement = document.createElement('div');
        titleElement.classList.add('g-title');
        titleElement.textContent = 'Weapon';
        this.page.appendChild(titleElement);
        if (data.levelList) {
            titleElement.innerHTML = `<span class="g-clickable-text">Weapon Lv.<var data-level>1</var></span>`;
            titleElement.addEventListener('click', this.openWeaponLevelModal.bind(this));
            this.page.appendChild(titleElement);
            this.updateWeaponLevel();
        }
        this.page.appendChild(titleElement);

        const helpIconElement = createHelpIcon('Weapon Help', `
            Craft your weapon using the craft table.
            New and better modifiers become available as you level up.
            You can click modifiers to see more information about them.
        `.trim());
        this.page.appendChild(helpIconElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="s-weapon" data-weapon><div class="hidden" data-weapon-type></div><ul class="s-mod-list g-mod-list" data-mod-list></ul></div>');

        this.craftTable = new CraftTable({
            element: this.page.querySelectorStrict('[data-weapon]'),
            data: data.crafting.craftList,
            modList: this.modList,
            modGroupsList: this.modGroupsList,
            weaponTypes: this.data.weaponTypeList,
            candidateModList: this.candidateModList,
            advReforgeRequirements: this.data.crafting.advancedReforge.requirements,
            getMaxModCount: () => 6,

        });
        this.page.appendChild(this.craftTable.element);

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

        this.craftTable.craftConfirmed.listen(() => {
            this.applyModifiers();
        });

        this.level.addListener('change', this.updateWeaponLevel.bind(this));
    }

    private openWeaponLevelModal() {
        assertDefined(this.data.levelList);
        createLevelModal({
            title: 'Weapon',
            level: this.level,
            levelData: this.data.levelList
        });
    }

    private updateWeaponLevel() {
        this.page.querySelectorStrict('[data-level]').textContent = this.level.value.toFixed();
        const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
        player.modDB.replace('WeaponUpgrade', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private applyModifiers() {
        player.modDB.replace(Weapon.sourceName, Modifier.extractStatModifierList(...this.modList));
    }

    serialize(save: Serialization) {
        save.weapon = {
            level: this.level.value ?? 0,
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
        if (isNumber(save.level)) {
            this.level.set(save.level);
        }

        const modList = save.modList?.map(x => x && deserializeMod(x.srcId, x.values?.filter(isNumber))).filter(isDefined) ?? [];
        this.modList.splice(0, this.modList.length, ...modList);
        this.applyModifiers();

        this.craftTable.deserialize(save.crafting ?? {}, this.data.modLists.flatMap(x => x).map(x => ({ id: x.id, text: x.mod })));

        this.craftTable.syncCraftItem();
    }
}
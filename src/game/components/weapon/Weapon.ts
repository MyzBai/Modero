import { Component } from 'src/game/components/Component';
import { player } from 'src/game/game';
import { Modifier } from '../../mods/Modifier';
import type * as GameConfig from 'src/game/gameConfig/GameConfig';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization';
import { modTemplateList } from 'src/game/mods/modTemplates';
import { CraftTable, type ModGroupList, type WeaponModifierCandidate } from './CraftTable';
import { isDefined, isNumber, isString } from 'src/shared/utils/utils';
import { createHelpIcon } from 'src/shared/utils/dom';
import { LevelElement } from '../../../shared/customElements/LevelElement';
import { createCustomElement } from '../../../shared/customElements/customElements';
import { ModalElement } from '../../../shared/customElements/ModalElement';
import { createModListElement } from '../../utils/dom';
import { PlayerUpdateStatsFlag } from '../../Player';

export class Weapon extends Component {
    static sourceName = 'Weapon';
    private readonly modGroupsList: ModGroupList[] = [];
    private readonly candidateModList: WeaponModifierCandidate[] = [];
    private readonly craftTable: CraftTable;
    private readonly modList: Modifier[] = [];
    private readonly levelElement?: LevelElement;
    constructor(readonly data: GameConfig.Weapon) {
        super('weapon');

        const helpIconElement = createHelpIcon('Weapon Help', `
            Craft your weapon using the craft table.
            New and better modifiers become available as you level up.
            You can click modifiers to see more information about them.
        `.trim());
        this.page.appendChild(helpIconElement);

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Weapon</div>');
        if (data.levelList) {
            this.levelElement = createCustomElement(LevelElement);
            this.levelElement.setAction('Refining Weapon');
            this.levelElement.setLevelClickCallback(this.showWeaponUpgradeOverview.bind(this));
            this.levelElement.onLevelChange.listen(this.updateWeaponLevel.bind(this));
            this.page.appendChild(this.levelElement);
            this.updateWeaponLevel();
        }
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
    }

    private applyModifiers() {
        player.modDB.replace(Weapon.sourceName, Modifier.extractStatModifierList(...this.modList));
    }

    private updateWeaponLevel() {
        if (!this.levelElement) {
            return;
        }
        this.levelElement.maxExp = this.data.levelList?.[this.levelElement.level - 1]?.exp ?? Infinity;
        const modList = this.data.levelList?.[this.levelElement.level - 1]?.modList ?? [];
        player.modDB.replace('WeaponUpgrade', Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
        player.updateStatsDirect(PlayerUpdateStatsFlag.Persistent);
    }

    private showWeaponUpgradeOverview() {
        const modal = createCustomElement(ModalElement);
        modal.setTitle('Weapon Upgrade Overview');
        const body = createModListElement(this.data.levelList?.[this.levelElement!.level - 1]?.modList ?? []);
        modal.setBodyElement(body);
    }

    serialize(save: Serialization) {
        save.weapon = {
            level: this.levelElement?.level ?? 0,
            exp: this.levelElement?.curExp ?? 0,
            refining: player.activity?.name === 'Refining Weapon',
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
        if (this.levelElement) {
            this.levelElement.setLevel(save?.level ?? 1);
            this.levelElement.curExp = save?.exp ?? 0;
            this.levelElement.updateProgressBar();
            this.updateWeaponLevel();
            if (save?.refining) {
                this.levelElement.startAction();
            }
        }

        const modList = save.modList?.map(x => x && deserializeMod(x.srcId, x.values?.filter(isNumber))).filter(isDefined) ?? [];
        this.modList.splice(0, this.modList.length, ...modList);
        this.applyModifiers();

        this.craftTable.deserialize(save.crafting ?? {}, this.data.modLists.flatMap(x => x).map(x => ({ id: x.id, text: x.mod })));

        this.craftTable.syncCraftItem();
    }
}
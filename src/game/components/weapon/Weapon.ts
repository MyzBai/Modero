import { Component } from 'src/game/components/Component';
import { combat, player } from 'src/game/game';
import { Modifier } from '../../mods/Modifier';
import type * as GameModule from 'src/game/gameModule/GameModule';
import type { Serialization, UnsafeSerialization } from 'src/game/serialization/serialization';
import { CraftManager, type CraftData, type ModifierCandidate } from 'src/game/crafting/CraftManager';
import { weaponCraftTemplates } from 'src/game/crafting/craftTemplates';
import { CraftTableElement } from 'src/shared/customElements/CraftTableElement';
import { assertDefined, assertNonNullable } from 'src/shared/utils/assert';
import { calcTier, isNull, isNumber, isString, pickManyFromPickProbability } from 'src/shared/utils/helpers';
import { modTemplates, sortModifiers } from 'src/game/mods/modTemplates';
import { ModifierInfoPopup } from 'src/game/mods/ModifierInfoPopup';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { PromptWindowElement } from 'src/shared/customElements/PromptWindowElement';

interface WeaponModifierCandidate extends ModifierCandidate {
    weaponTypeNameList?: string[];
}
interface WeaponCraft {
    template: typeof weaponCraftTemplates[number];
    craftCount: number;
}
interface WeaponInstance {
    weaponType?: GameModule.WeaponType;
    modList: Modifier[];
}
type ModGroup = {
    text: string;
    weaponTypeNameList: string[];
}[];
export class Weapon extends Component {
    private activeWeaponInstance: WeaponInstance;
    private tempWeaponInstance: WeaponInstance | null = null;
    private readonly modGroupList: ModGroup[] = [];
    private candidateModList: WeaponModifierCandidate[] = [];
    private readonly craftList: WeaponCraft[] = [];
    private readonly crafter: CraftManager;
    private readonly craftTableElement: CraftTableElement;

    constructor(readonly data: GameModule.Weapon) {
        super('weapon');

        this.page.insertAdjacentHTML('beforeend', '<div class="g-title">Weapon</div>');
        this.page.insertAdjacentHTML('beforeend', '<div class="s-weapon-info" data-weapon-info></div>');

        this.craftTableElement = createCustomElement(CraftTableElement);
        this.craftTableElement.craftCallback = this.performCraft.bind(this);
        this.craftTableElement.selectCraftCallback = this.selectCraft.bind(this);
        this.craftTableElement.confirmCraftCallback = this.applyCraft.bind(this);
        this.craftTableElement.cancelCraftCallback = this.cancelCraft.bind(this);
        this.craftTableElement.compareCallback = this.compareWeaponInstances.bind(this);
        this.page.appendChild(this.craftTableElement);

        this.activeWeaponInstance = { modList: [], weaponType: data.weaponTypeList?.[0] };

        this.craftList = this.data.crafting.craftList.map(x => ({ template: weaponCraftTemplates.findStrict(template => template.desc === x.desc), craftCount: 0 }));
        for (const craft of this.craftList) {
            this.craftTableElement.registerCraft(craft.template.desc, craft.template.id);
            this.craftTableElement.updateCraftCount(craft.template.id, craft.craftCount);
        }

        for (const modList of data.modLists) {
            const group: ModGroup = [];
            this.modGroupList.push(group);
            for (const modData of modList) {
                player.stats.level.registerTargetValueCallback(modData.level, () => {
                    const template = modTemplates.findStrict(x => x.desc === Modifier.getTemplate(modData.mod)?.desc);
                    this.candidateModList.push({ text: modData.mod, template, weight: modData.weight, weaponTypeNameList: modData.weaponTypes });
                    group.push({ text: modData.mod, weaponTypeNameList: modData.weaponTypes ?? [] });
                });
            }
        }

        this.crafter = new CraftManager({
            groups: this.modGroupList.map(x => x.map(x => x.text)),
            reforgeWeights: [0, 10, 30, 100, 30],
            maxModifierCount: 6
        });

        this.updateWeapon();

        combat.enemyDeathEvent.listen(() => {
            this.calcCraftReward();
        });

        this.craftTableElement.selectCraft(this.craftList[0]?.template.id ?? null);

        data.crafting.craftList.filter(x => x.startCount).
            map(x => ({ id: weaponCraftTemplates.findStrict(template => template.desc === x.desc).id, count: x.startCount })).
            forEach(({ id, count }) => this.addCraftCount(id, count));
    }

    get weaponInstance() {
        return this.tempWeaponInstance ?? this.activeWeaponInstance;
    }

    private createCraftData(): CraftData {
        const weaponInstance = this.weaponInstance;
        const filterByWeaponType = function* (candidateModList: WeaponModifierCandidate[]) {
            for (const candidate of candidateModList) {
                if (weaponInstance.weaponType && candidate.weaponTypeNameList && candidate.weaponTypeNameList.includes(weaponInstance.weaponType.name)) {
                    yield candidate;
                } else if (!candidate.weaponTypeNameList) {
                    yield candidate;
                }
            }
        };
        const candidateModList = [...filterByWeaponType(this.candidateModList)];
        return {
            crafter: this.crafter,
            itemModList: weaponInstance.modList,
            candidateModList
        };
    }

    private addCraftCount(id: string, count = 1) {
        const craft = this.craftList.findStrict(x => x.template.id === id);
        craft.craftCount += count;
        this.craftTableElement.updateCraftCount(id, craft.craftCount);
        this.selectCraft(null);
    }

    private updateWeapon() {
        const element = this.createWeaponInfoElement(this.weaponInstance);
        this.page.querySelectorStrict('[data-weapon-info]').replaceChildren(...element.children);
    }

    private setWeaponType(weaponType: GameModule.WeaponType) {
        this.weaponInstance.weaponType = weaponType;
        this.weaponInstance.modList = [];
        this.updateWeapon();
    }

    private async triggerChangeWeaponTypePopup() {
        const ul = document.createElement('ul');
        ul.style.textAlign = 'center';
        for (const { name } of this.data.weaponTypeList ?? []) {
            const element = document.createElement('li');
            element.classList.add('g-list-item');
            element.setAttribute('data-name', name);
            element.textContent = name;
            element.addEventListener('click', () => {
                prompt.querySelector('[data-role="confirm"]')?.toggleAttribute('disabled', this.weaponInstance.weaponType?.name === name);
                ul.querySelectorAll('[data-name]').forEach(x => x.classList.toggle('selected', x === element));
            });
            ul.appendChild(element);
        }
        ul.insertAdjacentHTML('beforeend', '<div class="g-text-mute g-text-small" style="text-align: center;">This will reset your weapon!</div>');

        const prompt = createCustomElement(PromptWindowElement);
        prompt.style.minWidth = '25em';
        prompt.setTitle('Pick a weapon type');
        prompt.setBodyElement(ul);

        const waitPromise = prompt.setButtons([{ text: 'Confirm', type: 'confirm', waitId: 'confirm' }, { text: 'Cancel', type: 'cancel' }]);
        ul.querySelector<HTMLElement>(`[data-name="${this.weaponInstance.weaponType?.name}"]`)?.click();

        const waitId = await waitPromise;
        if (waitId === 'confirm') {
            const weaponTypeName = ul.querySelectorStrict('[data-name].selected').getAttribute('data-name');
            assertNonNullable(weaponTypeName);
            assertNonNullable(this.data.weaponTypeList);
            const weaponType = this.data.weaponTypeList.findStrict(x => x.name === weaponTypeName);
            this.setWeaponType(weaponType);
        }

    }

    private createWeaponInfoElement(weaponInstance: WeaponInstance): HTMLElement {
        const element = document.createElement('div');
        element.classList.add('s-weapon-info');

        if (weaponInstance.weaponType) {
            const weaponTypeElement = document.createElement('div');
            weaponTypeElement.classList.add('s-weapon-type');
            weaponTypeElement.setAttribute('data-weapon-type', '');
            weaponTypeElement.insertAdjacentHTML('beforeend', `<span title="Weapon type">${weaponInstance.weaponType?.name}</span>`);
            const changeElement = document.createElement('span');
            changeElement.setAttribute('data-change-weapon-type', '');
            changeElement.classList.add('g-text-small', 'g-text-mute', 'change');
            changeElement.textContent = '(change)';
            changeElement.addEventListener('click', () => void this.triggerChangeWeaponTypePopup());
            weaponTypeElement.appendChild(changeElement);
            element.appendChild(weaponTypeElement);
        }

        const modListElement = document.createElement('ul');
        modListElement.classList.add('g-mod-list');
        sortModifiers(weaponInstance.modList);
        for (const mod of weaponInstance.modList) {
            const element = document.createElement('li');
            element.setAttribute('data-info', '');
            element.textContent = mod.desc;
            element.addEventListener('click', () => {
                const group = this.findModGroup(mod)?.filter(x => x.weaponTypeNameList.length === 0 || x.weaponTypeNameList.some(x => x === weaponInstance.weaponType?.name)) ?? [];
                const tier = calcTier(mod.text, group.map(x => x.text));
                const additionalProperties: [string, string][] = [['Tier', tier.toFixed()]];
                new ModifierInfoPopup(mod, additionalProperties);
            });
            modListElement.appendChild(element);
        }
        element.appendChild(modListElement);
        return element;
    }

    private createTempWeaponInstance() {
        return { weaponType: this.activeWeaponInstance.weaponType, modList: this.activeWeaponInstance.modList.map(x => x.copy()) };
    }

    private selectCraft(id: string | null) {
        id = id ?? this.craftTableElement.querySelector('[data-craft-list] [data-id].selected')?.getAttribute('data-id') ?? null;
        if (isNull(id)) {
            return;
        }
        const craft = this.craftList.findStrict(x => x.template.id === id);
        if (!craft) {
            this.craftTableElement.setCraftMessage('No Craft Selected');
            this.craftTableElement.setCraftButtonState('disabled');
            return;
        }
        if (craft.craftCount <= 0) {
            this.craftTableElement.setCraftMessage('Insufficient Crafts');
            this.craftTableElement.setCraftButtonState('disabled');
            return;
        }
        const result = craft.template.craft(this.createCraftData());
        if (isString(result)) {
            this.craftTableElement.setCraftMessage(result);
            this.craftTableElement.setCraftButtonState('disabled');
            return;
        }

        this.craftTableElement.setCraftMessage();
        this.craftTableElement.setCraftButtonState('enabled');
    }

    private performCraft(id: string) {
        this.tempWeaponInstance = this.tempWeaponInstance ?? this.createTempWeaponInstance();
        const craft = this.craftList.findStrict(x => x.template.id === id);
        const template = craft.template;

        const result = template.craft(this.createCraftData());

        if (typeof result === 'string') {
            throw new Error('Unexpected error.');
        }

        switch (result.type) {
            case 'ModList':
                this.tempWeaponInstance.modList.splice(0, this.tempWeaponInstance.modList.length, ...result.modList);
                break;
        }

        craft.craftCount--;
        this.craftTableElement.updateCraftCount(id, craft.craftCount);
        this.selectCraft(id);

        this.craftTableElement.setCraftModeState(true);

        this.updateWeapon();
    }

    private applyCraft() {
        assertNonNullable(this.tempWeaponInstance);
        this.activeWeaponInstance = this.tempWeaponInstance;
        this.tempWeaponInstance = null;
        this.applyMods();
        this.selectCraft(null);
    }

    private cancelCraft() {
        this.tempWeaponInstance = null;
        this.updateWeapon();
        this.selectCraft(null);
    }

    private applyMods() {
        player.modDB.replace('Weapon', Modifier.extractStatModifierList(...this.activeWeaponInstance.modList));
    }

    private calcCraftReward() {
        const candidates = this.data.crafting.craftList;
        const crafts = pickManyFromPickProbability(candidates);
        for (const craft of crafts) {
            const craftDesc = craft.desc;
            const template = weaponCraftTemplates.findStrict(x => x.desc === craftDesc);
            this.addCraftCount(template.id);
        }
    }

    private compareWeaponInstances(): [HTMLElement, HTMLElement] {
        assertDefined(this.tempWeaponInstance);
        const a = this.createWeaponInfoElement(this.activeWeaponInstance);
        const b = this.createWeaponInfoElement(this.tempWeaponInstance);
        [a, b].forEach(x => {
            x.querySelector('[data-weapon-type]')?.remove();
            x.querySelectorAll('li[data-info]').forEach(x => x.removeAttribute('data-info'));
        });
        return [a, b];
    }

    private findModGroup(mod: Modifier): ModGroup | undefined {
        return this.modGroupList.find(group => group.some(x => x.text === mod.text));
    }

    serialize(save: Serialization) {
        const calcGroupIndex = (text: string) => this.modGroupList.findIndex(x => x.some(x => x.text === text));
        save.weapon = {
            activeWeaponInstance: {
                weaponTypeId: this.activeWeaponInstance.weaponType?.id,
                weaponModList: this.activeWeaponInstance.modList.map(mod => {
                    return { ...mod.serialize(), groupIndex: calcGroupIndex(mod.text) };
                })
            },
            tempWeaponInstance: this.tempWeaponInstance ? {
                weaponTypeId: this.tempWeaponInstance.weaponType?.id,
                weaponModList: this.tempWeaponInstance.modList.map(mod => {
                    return { ...mod.serialize(), groupIndex: calcGroupIndex(mod.text) };
                })
            } : undefined,
            craftList: this.craftList.map(x => ({ id: x.template.id, craftCount: x.craftCount }))
        };
    }

    deserialize({ weapon: save }: UnsafeSerialization) {
        if (!save) {
            return;
        }
        const applySavedDataToWeaponInstance = (weaponInstance: WeaponInstance, data: Required<UnsafeSerialization>['weapon']['activeWeaponInstance']) => {
            weaponInstance.weaponType = this.data.weaponTypeList?.find(x => x.id === data?.weaponTypeId) ?? this.data.weaponTypeList?.[0];
            for (const modData of data?.weaponModList || []) {
                if (!isString(modData?.id) || !isString(modData.text)) {
                    continue;
                }
                const template = modTemplates.find(x => x.id === modData.id);
                if (!template) {
                    continue;
                }
                const mod = Modifier.modFromText(modData.text);
                if (modData.values) {
                    mod.setValues(modData.values.filter(isNumber));
                }
                weaponInstance.modList.push(mod);
            }
        };
        this.activeWeaponInstance.modList.splice(0);
        applySavedDataToWeaponInstance(this.activeWeaponInstance, save.activeWeaponInstance);

        for (const craftData of save.craftList || []) {
            const id = craftData?.id;
            const craft = this.craftList.find(x => x.template.id === id);
            if (!craft || !id) {
                continue;
            }
            craft.craftCount = craftData.craftCount === null ? Infinity : craftData.craftCount ?? 0;
            this.craftTableElement.updateCraftCount(id, craft.craftCount);
        }

        if (save.tempWeaponInstance) {
            this.craftTableElement.setCraftModeState(true);
            this.tempWeaponInstance = { modList: [] };
            applySavedDataToWeaponInstance(this.tempWeaponInstance, save.tempWeaponInstance);
            this.craftTableElement.selectCraft(this.craftList[0]?.template.id ?? null);
        }

        this.updateWeapon();
        this.applyMods();
        this.craftTableElement.selectCraft(this.craftList[0]?.template.id ?? null);
    }
}
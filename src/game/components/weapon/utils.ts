import type { Modifier } from 'src/game/mods/Modifier';
import type { ModGroupList } from './CraftTable';
import { sortModifiers } from 'src/game/mods/utils';
import { ModifierInfoPopup } from 'src/game/mods/ModifierInfoPopup';


export function getModGroupList(modText: string, modGroupsList: ModGroupList[], weaponTypeName?: string): ModGroupList {
    const modGroup = modGroupsList.find(x => x.some(x => x.text === modText)) ?? [];
    return modGroup.filter(x => x.weaponTypeNameList.length === 0 || x.weaponTypeNameList.some(x => x === weaponTypeName));
}

export function calcModTier(modText: string, modGroupList: ModGroupList) {
    const index = modGroupList.map(x => x.text).indexOf(modText);
    return Math.abs(index - modGroupList.length);
}

export function* generateModListElements(modList: Modifier[], modGroupsList: ModGroupList[]): Generator<HTMLElement> {
    sortModifiers(modList);
    for (const mod of modList) {
        const element = document.createElement('li');
        element.setAttribute('data-info', '');
        element.setAttribute('data-mod', mod.template.id);
        element.textContent = mod.desc;
        element.addEventListener('click', () => {
            const tier = calcModTier(mod.text, getModGroupList(mod.text, modGroupsList));
            const additionalProperties: [string, string][] = [['Tier', tier.toFixed()]];
            new ModifierInfoPopup(mod, additionalProperties);
        });
        yield element;
    }
}
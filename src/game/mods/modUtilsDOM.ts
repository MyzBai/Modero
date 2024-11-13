import type { ModGroupList, Modifier } from './Modifier';
import { ModifierInfoPopup } from './ModifierInfoPopup';
import { calcModTier, getModGroupList, sortModifiers } from './modUtils';


export function* generateModListElements(params: { modList: Modifier[]; modGroupsList?: ModGroupList[]; }): Generator<HTMLElement> {
    sortModifiers(params.modList);
    for (const mod of params.modList) {
        const element = document.createElement('li');
        element.setAttribute('data-info', '');
        element.setAttribute('data-mod', mod.template.id);
        element.textContent = mod.desc;
        element.addEventListener('click', () => {
            const additionalProperties: [string, string][] = [];
            if (params.modGroupsList) {
                const tier = calcModTier(mod.text, getModGroupList(mod.text, params.modGroupsList));
                additionalProperties.push(['Tier', tier.toFixed()]);
            }
            new ModifierInfoPopup(mod, additionalProperties);
        });
        yield element;
    }
}

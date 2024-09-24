import { isString } from 'src/shared/utils/utils';
import { Modifier } from '../mods/Modifier';
import { sortModifiers } from '../mods/utils';


export function createModListElement(modList: string[]): HTMLUListElement;
export function createModListElement(modList: Modifier[]): HTMLUListElement;
export function createModListElement(modList: string[] | Modifier[]) {
    sortModifiers(modList);
    const modListElement = document.createElement('ul');
    modListElement.classList.add('g-mod-list');
    modListElement.setAttribute('data-mod-list', '');
    for (const mod of modList) {
        const desc = isString(mod) ? Modifier.toDescription(mod) : mod.desc;
        modListElement.insertAdjacentHTML('beforeend', `<li>${desc}</li>`);
    }
    return modListElement;
}
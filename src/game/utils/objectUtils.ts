import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { createModListElement } from './dom';
import { isDefined } from 'src/shared/utils/utils';
import type { TextInputDropdownElement } from '../../shared/customElements/TextInputDropdownElement';
import { createRankDropdown, getRankExpPct, type RankObject } from './rankObjectUtils';

export interface AssignableObject {
    id: string;
    name: string;
    assigned: boolean;
    selected: boolean;
    unlocked: boolean;
    element: HTMLElement;
}

export interface ObjectInfo<T extends RankObject = RankObject> {
    name: string;
    propertyList?: string[][];
    modList?: string[];
    rankObj?: T;
    onRankChange?: (obj: T) => void;
}

export interface AssignableObjectInitData {
    id: string;
    name: string;
}

export function createAssignableObject(data: AssignableObjectInitData): AssignableObject {
    return {
        id: data.id,
        name: data.name,
        selected: false,
        unlocked: false,
        assigned: false,
        element: createObjectListElement({ id: data.id, name: data.name }),
    };
}

export function createObjectListElement(obj: Pick<AssignableObject, 'id' | 'name'>): HTMLElement {
    const element = document.createElement('li');
    element.classList.add('g-list-item', 'hidden');
    element.setAttribute('data-id', obj.id);
    element.textContent = obj.name;
    return element;
}


export function createObjectPropertyElement(propertyList: string[][]) {
    const element = document.createElement('ul');
    element.setAttribute('data-property-list', '');
    for (const [key, value] of propertyList) {
        element.insertAdjacentHTML('beforeend', `<li class="g-field"><div>${key}</div><div>${value}<div></li>`);
    }
    return element;
}

export function createObjectInfoElements<T extends RankObject>(objInfo: ObjectInfo<T>) {
    const element = document.createElement('div');
    element.classList.add('g-item-info');
    element.setAttribute('data-item-info', '');

    const titleElement = document.createElement('div');
    titleElement.classList.add('g-title');
    titleElement.textContent = objInfo.name;

    const contentElement = document.createElement('div');
    contentElement.classList.add('s-content');
    contentElement.setAttribute('data-content', '');

    let rankDropdownElement: TextInputDropdownElement | undefined = undefined;
    if (objInfo.rankObj && objInfo.onRankChange) {
        rankDropdownElement = createRankDropdown(objInfo.rankObj, objInfo.onRankChange);
    }

    const propertyListElement = objInfo.propertyList ? createObjectPropertyElement(objInfo.propertyList) : undefined;

    const modListElement = objInfo.modList ? createModListElement(objInfo.modList) : undefined;

    let expBar: ProgressElement | undefined = undefined;
    if (objInfo.rankObj && objInfo.rankObj.rankData(objInfo.rankObj.selectedRank).exp) {
        expBar = createCustomElement(ProgressElement);
        expBar.value = getRankExpPct(objInfo.rankObj);
    }

    contentElement.append(...Object.values([rankDropdownElement, propertyListElement, modListElement, expBar].filter(isDefined)));

    element.append(titleElement, contentElement);
    return { element, titleElement, contentElement, rankDropdownElement, propertyListElement, modListElement, expBar };
}

export function unlockObject(obj: AssignableObject) {
    obj.unlocked = true;
    obj.element.classList.remove('hidden');
    obj.element.removeAttribute('disabled');
}
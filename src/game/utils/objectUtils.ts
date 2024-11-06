import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ROMAN_NUMERALS } from 'src/shared/utils/constants';
import { rankNumeralsRegex } from 'src/shared/utils/textParsing';
import { createModListElement } from './dom';
import { isDefined } from 'src/shared/utils/utils';
import { TextInputDropdownElement } from '../../shared/customElements/TextInputDropdownElement';

export interface AssignableObject {
    id?: string;
    baseName: string;
    name: string;
    probability: number;
    exp: number;
    maxExp: number;
    unlocked: boolean;
    assigned: boolean;
    selected: boolean;
    rankList: AssignableObject[];
}


interface ObjectInfo<T extends AssignableObject = AssignableObject> {
    obj: Partial<T> & { name: string; };
    propertyList?: string[][];
    modList?: string[];
    rankList?: T[];
    onRankChange?: (obj: T) => void;
}


export function createAssignableObject<T extends { id: string; name: string; probability?: number; exp?: number; }>(data: T): AssignableObject {
    const rankNumeral = getRankNumeral(data.name);
    const unlocked = !data.probability && (!rankNumeral || rankNumeral === 'I');
    const obj: AssignableObject = {
        id: data.id,
        baseName: getRankBaseName(data.name),
        name: data.name,
        probability: data.probability ?? 0,
        maxExp: data.exp ?? 0,
        exp: 0,
        unlocked,
        assigned: false,
        selected: false,
        rankList: []
    };
    return obj;
}

export function getRankNumeral(name: string) {
    const rank = rankNumeralsRegex.exec(name)?.groups?.['rank'];
    const index = ROMAN_NUMERALS.findIndex(x => x === rank);
    return ROMAN_NUMERALS[index];
}

export function getNextObjectRankNumeral(text: string) {
    const rankNumeral = getRankNumeral(text);
    return rankNumeral ? ROMAN_NUMERALS[ROMAN_NUMERALS.indexOf(rankNumeral) + 1] : undefined;
}

export function getRankBaseName(name: string) {
    return name.replace(rankNumeralsRegex, '').trimEnd();
}

export function createObjectListElement(obj: { id: string; name: string; probability?: number; }): HTMLElement {
    const element = document.createElement('li');
    element.classList.add('g-list-item');
    element.classList.add('hidden');
    if (obj.id) {
        element.setAttribute('data-id', obj.id);
    }
    element.toggleAttribute('disabled', !!obj.probability);
    element.textContent = obj.probability ? '?????' : obj.name;
    return element;
}

export function getNextRankObject<T extends AssignableObject>(obj: T & { rankList: T[]; }): T | undefined {
    const index = obj.rankList.findIndex(x => x.name === obj.name) + 1;
    const nextRankObj = obj.rankList[index];
    return nextRankObj;
}

export function createObjectRankDropdown(rankList: AssignableObject[], callback: (obj: AssignableObject) => void) {
    const element = createCustomElement(TextInputDropdownElement);
    element.setReadonly();
    const updateDropdownList = () => {
        element.setDropdownList(rankList.filter(x => x.unlocked).map(x => x.name));
        element.setInputText(rankList.find(x => x.selected)?.name ?? rankList.find(x => x.assigned)?.name ?? rankList[0]?.name);
    };
    updateDropdownList();

    element.onInputOpen = () => {
        updateDropdownList();
    };
    element.onInputChange = ({ index }) => {
        const obj = rankList[index];
        if (!obj) {
            throw Error('invalid dropdown index');
        }
        rankList.forEach(x => x.selected = x === obj);
        callback(obj);
    };
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

export function createObjectInfoElements(objInfo: ObjectInfo) {
    const element = document.createElement('div');
    element.classList.add('g-item-info');
    element.setAttribute('data-item-info', '');

    const titleElement = document.createElement('div');
    titleElement.classList.add('g-title');
    titleElement.textContent = objInfo.obj.name;

    const contentElement = document.createElement('div');
    contentElement.classList.add('s-content');
    contentElement.setAttribute('data-content', '');

    const rankDropdownElement = (objInfo.rankList && objInfo.onRankChange) ? createObjectRankDropdown(objInfo.rankList, objInfo.onRankChange) : undefined;

    const propertyListElement = objInfo.propertyList ? createObjectPropertyElement(objInfo.propertyList) : undefined;

    const modListElement = objInfo.modList ? createModListElement(objInfo.modList) : undefined;

    const expBar = objInfo.obj.maxExp ? createCustomElement(ProgressElement) : undefined;
    if (expBar && objInfo.obj.maxExp) {
        expBar.value = (objInfo.obj.exp ?? 0) / objInfo.obj.maxExp;
    }

    contentElement.append(...Object.values([rankDropdownElement, propertyListElement, modListElement, expBar].filter(isDefined)));

    element.append(titleElement, contentElement);
    return { element, titleElement, contentElement, rankDropdownElement, propertyListElement, modListElement, expBar };
}

export function unlockObject(obj: AssignableObject, elementMap: Map<string, HTMLElement>) {
    obj.unlocked = true;
    const rankNumeral = getRankNumeral(obj.name);
    if (!rankNumeral || rankNumeral === 'I') {
        const baseName = getRankBaseName(obj.name);
        const element = elementMap.get(baseName);
        if (!element) {
            throw Error(`${baseName} is missing an element`);
        }
        element.textContent = obj.name;
        element.removeAttribute('disabled');
        element.classList.remove('hidden');
    }
}

export function selectObjectByName<T extends AssignableObject>(name: string, objList: T[], elementMap: Map<string, HTMLElement>) {
    const obj = objList.findStrict(x => x.name === name);
    obj.rankList.forEach(x => x.selected = x === obj);
    objList.forEach(x => x.selected = x === obj);
    elementMap.forEach((el, key) => el.classList.toggle('selected', key === obj.baseName));
    return obj;
}
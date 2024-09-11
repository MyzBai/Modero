import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ROMAN_NUMERALS } from 'src/shared/utils/constants';
import { rankNumeralsRegex } from 'src/shared/utils/textParsing';
import { createModListElement } from './dom';
import { isDefined } from 'src/shared/utils/utils';
import { TextInputDropdownElement } from '../../shared/customElements/TextInputDropdownElement';

export interface Item {
    id?: string;
    name: string;
    probability?: number;
    exp?: number;
    maxExp?: number;
    unlocked?: boolean;
    assigned?: boolean;
    selected?: boolean;
}


interface ItemInfo<T extends Item = Item> {
    item: T;
    propertyList?: string[][];
    modList?: string[];
    rankList?: T[];
    onRankChange?: (item: T) => void;
}


export function createItem<T extends { name: string; probability?: number; exp?: number; }>(data: T) {
    const rankNumeral = getItemRankNumeral(data.name);
    const unlocked = (!rankNumeral || rankNumeral === 'I') && !data.probability;
    const item: Item = {
        name: data.name,
        probability: data.probability ?? 0,
        maxExp: data.exp ?? 0,
        exp: 0,
        unlocked,
    };
    return { ...data, ...item };
}

export function getItemRankNumeral(text: string) {
    const rank = rankNumeralsRegex.exec(text)?.groups?.['rank'];
    const index = ROMAN_NUMERALS.findIndex(x => x === rank);
    return ROMAN_NUMERALS[index];
}

export function getNextItemRankNumeral(text: string) {
    const rankNumeral = getItemRankNumeral(text);
    return rankNumeral ? ROMAN_NUMERALS[ROMAN_NUMERALS.indexOf(rankNumeral) + 1] : undefined;
}

export function getRankItemBaseName(text: string) {
    return text.replace(rankNumeralsRegex, '').trimEnd();
}

export function createItemListElement(item: { id: string; name: string; probability?: number; }): HTMLElement {
    const element = document.createElement('li');
    element.classList.add('g-list-item');
    element.classList.add('hidden');
    if (item.id) {
        element.setAttribute('data-id', item.id);
    }
    element.toggleAttribute('disabled', !!item.probability);
    element.textContent = item.probability ? '?????' : item.name;
    return element;
}

export function getNextRankItem<T extends { name: string; }>(item: T, itemList: T[]): T | null {
    const baseName = getRankItemBaseName(item.name);
    const rank = getItemRankNumeral(item.name) ?? 'I';
    const nextRank = getNextItemRankNumeral(rank);
    const nextSkillName = `${baseName} ${nextRank}`;
    const nextItem = itemList.find(x => x.name === nextSkillName);
    return nextItem ?? null;
}

export function createItemRankDropdown(rankList: Item[], callback: (item: Item) => void) {
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
        const item = rankList[index];
        if (!item) {
            throw Error('invalid dropdown index');
        }
        rankList.forEach(x => x.selected = x === item);
        callback(item);
    };
    return element;
}

export function createItemPropertyElement(propertyList: string[][]) {
    const element = document.createElement('ul');
    element.setAttribute('data-property-list', '');
    for (const [key, value] of propertyList) {
        element.insertAdjacentHTML('beforeend', `<li class="g-field"><div>${key}</div><div>${value}<div></li>`);
    }
    return element;
}

export function createExpBar(item: Item): ProgressElement {
    const element = createCustomElement(ProgressElement);
    element.value = (!!item.exp && !!item.maxExp) ? item.exp / item.maxExp : 0;
    return element;
}

export function createItemInfoElements(itemInfo: ItemInfo) {
    const element = document.createElement('div');
    element.classList.add('g-item-info');
    element.setAttribute('data-item-info', '');

    const titleElement = document.createElement('div');
    titleElement.classList.add('g-title');
    titleElement.textContent = itemInfo.item.name;

    const contentElement = document.createElement('div');
    contentElement.classList.add('s-content');
    contentElement.setAttribute('data-content', '');

    const rankDropdownElement = (itemInfo.rankList && itemInfo.onRankChange) ? createItemRankDropdown(itemInfo.rankList, itemInfo.onRankChange) : undefined;

    const propertyListElement = itemInfo.propertyList ? createItemPropertyElement(itemInfo.propertyList) : undefined;

    const modListElement = itemInfo.modList ? createModListElement(itemInfo.modList) : undefined;

    const expBar = itemInfo.item.maxExp ? createExpBar(itemInfo.item) : undefined;

    contentElement.append(...Object.values([rankDropdownElement, propertyListElement, modListElement, expBar].filter(isDefined)));

    element.append(titleElement, contentElement);
    return { element, titleElement, contentElement, rankDropdownElement, propertyListElement, modListElement, expBar };
}

export function unlockItem(item: Item, elementMap: Map<string, HTMLElement>) {
    item.unlocked = true;
    const rankNumeral = getItemRankNumeral(item.name);
    if (!rankNumeral || rankNumeral === 'I') {
        const baseName = getRankItemBaseName(item.name);
        const element = elementMap.get(baseName);
        if (!element) {
            throw Error(`${baseName} is missing an element`);
        }
        element.textContent = item.name;
        element.removeAttribute('disabled');
        element.classList.remove('hidden');
    }
}

export function selectItemByName<T extends Item>(name: string, itemList: T[], elementMap: Map<string, HTMLElement>) {
    const baseName = getRankItemBaseName(name);
    const rankList = itemList.filter(x => getRankItemBaseName(x.name) === baseName);
    const item = rankList.find(x => x.selected || x.assigned) ?? rankList[0]!;
    itemList.forEach(x => x.selected = x === item);
    elementMap.forEach((el, key) => el.classList.toggle('selected', key === baseName));
    return item;
}
import { ProgressElement } from 'src/shared/customElements/ProgressElement';
import { createCustomElement } from 'src/shared/customElements/customElements';
import { ROMAN_NUMERALS } from 'src/shared/utils/constants';
import { rankNumeralsRegex } from 'src/shared/utils/textParsing';
import { createModListElement } from './dom';
import { isDefined } from 'src/shared/utils/utils';

export interface Item {
    name: string;
    probability: number;
    exp: number;
    maxExp: number;
    unlocked: boolean;
}


interface ItemInfo {
    item: Item;
    propertyList?: string[][];
    modList?: string[];
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

export function createItemCandidates<T extends Item & { assigned?: boolean; allocated?: boolean; }>(itemList: T[]): T[] {
    return itemList.filter(x => {
        if (x.assigned || x.allocated || x.unlocked) {
            return false;
        }
        const numeral = getItemRankNumeral(x.name);
        if (numeral && numeral !== 'I') {
            return false;
        }
        return true;
    });
}

export function createItemListElement(item: { id: string; name: string; probability?: number; }): HTMLElement {
    const element = document.createElement('li');
    element.classList.add('g-list-item');
    const rankIndex = ROMAN_NUMERALS.indexOf(getItemRankNumeral(item.name) ?? 'I');
    element.classList.toggle('hidden', rankIndex > 0 || !item.probability);
    element.setAttribute('data-id', item.id);
    element.toggleAttribute('disabled');
    element.textContent = '?????';
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
    element.value = item.exp / item.maxExp;
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

    const propertyListElement = itemInfo.propertyList ? createItemPropertyElement(itemInfo.propertyList) : undefined;

    const modListElement = itemInfo.modList ? createModListElement(itemInfo.modList) : undefined;

    const expBar = itemInfo.item.maxExp ? createExpBar(itemInfo.item) : undefined;

    contentElement.append(...Object.values([propertyListElement, modListElement, expBar].filter(isDefined)));

    element.append(titleElement, contentElement);
    return { element, titleElement, contentElement, propertyListElement, modListElement, expBar };
}
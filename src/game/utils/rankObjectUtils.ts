import { createCustomElement } from '../../shared/customElements/customElements';
import { TextInputDropdownElement } from '../../shared/customElements/TextInputDropdownElement';
import { assertDefined } from '../../shared/utils/assert';
import { ROMAN_NUMERALS } from '../../shared/utils/constants';
import { rankNumeralsRegex } from '../../shared/utils/textParsing';
import { clamp } from '../../shared/utils/utils';
import { createAssignableObject, type AssignableObject, type AssignableObjectInitData } from './objectUtils';

export interface RankObjectData {
    exp?: number;
}

export interface RankObject<Data extends RankObjectData = RankObjectData> extends AssignableObject {
    curExp: number;
    maxExp: number;
    selectedRank: number;
    curRank: number;
    maxRank: number;
    rankList: Data[];
    rankData: (rank: number) => Data;
}

export interface RankObjectInitData<Data extends RankObjectData> extends AssignableObjectInitData {
    rankList: Data[];
}
export function createRankObject<T extends RankObjectData>(data: RankObjectInitData<T>): RankObject<T> {
    const rankData = data.rankList[0];
    assertDefined(rankData, 'rankList must contain at last 1 item');
    const rankObject: RankObject<T> = {
        ...createAssignableObject(data),
        curExp: 0,
        maxExp: rankData.exp ?? 0,
        selectedRank: 1,
        curRank: 1,
        maxRank: 1,
        rankList: data.rankList,
        rankData: (rank: number) => {
            const rankData = rankObject.rankList[rank - 1];
            assertDefined(rankData, 'rank is outside the range of rankList');
            return rankData;
        }
    }
    return rankObject;
}

export function getRankName(obj: RankObject) {
    obj.curRank = clamp(obj.curRank, 1, obj.rankList.length);
    const rankNumeral = ROMAN_NUMERALS[obj.curRank - 1];
    return `${obj.name} ${rankNumeral}`;
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

export function tryUnlockNextRank(rankObj: RankObject) {
    if (rankObj.maxRank >= rankObj.rankList.length) {
        return false;
    }
    rankObj.maxRank = rankObj.curRank + 1;
    const data = rankObj.rankList[rankObj.maxRank - 1];
    assertDefined(data, 'maxRank outside the bounds of rankList');
    rankObj.curExp = 0;
    rankObj.maxExp = data.exp ?? 0;
    return true;
}

export function setNextRank(rankObj: RankObject) {
    rankObj.curRank = clamp(rankObj.curRank + 1, 1, rankObj.rankList.length);
}

export function getRankExpPct(rankObj: RankObject) {
    if (rankObj.selectedRank < rankObj.maxRank) {
        return 1;
    }
    return rankObj.curExp / rankObj.maxExp;
}


export function addRankExp(rankObj: RankObject, multiplier: number) {
    if (rankObj.curRank !== rankObj.maxRank) {
        return;
    }
    if (rankObj.curExp >= rankObj.maxExp) {
        return;
    }
    rankObj.curExp += 1 * multiplier;
    if (rankObj.curExp >= rankObj.maxExp) {
        rankObj.curExp = rankObj.maxExp;
    }
}

export function createRankDropdown<T extends RankObject>(rankObj: T, callback: (obj: T) => void) {
    const element = createCustomElement(TextInputDropdownElement);
    element.setReadonly();
    const updateDropdownList = () => {
        element.setDropdownList(rankObj.rankList.slice(0, rankObj.maxRank).map((_, i) => `${rankObj.name} ${ROMAN_NUMERALS[i]}`));
        element.setInputText(`${rankObj.name} ${ROMAN_NUMERALS[rankObj.selectedRank - 1]}`);
    };
    updateDropdownList();

    element.onInputOpen = () => {
        updateDropdownList();
    };
    element.onInputChange = ({ index }) => {
        rankObj.selectedRank = index + 1;
        callback(rankObj);
    };
    return element;
}

export function deserializeRankObject(rankObj: RankObject, data: { curRank?: number; maxRank?: number; expFac?: number; }) {
    rankObj.curRank = data.curRank ?? 1;
    rankObj.maxRank = data.maxRank ?? 1;
    rankObj.selectedRank = rankObj.curRank;
    rankObj.maxExp = rankObj.rankData(rankObj.maxRank).exp ?? 0;
    rankObj.curExp = rankObj.maxExp * (data.expFac ?? 0);
}
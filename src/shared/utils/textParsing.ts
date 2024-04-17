import { assertDefined } from './assert';
import { ROMAN_NUMERALS } from './constants';

export const numberRangeRegex = /((?<min>[0-9]+(\.[0-9]+)?)([-](?<max>[0-9]+(\.[0-9]+)?))?)/;
export const integerRangeRegex = /((?<min>[0-9]+)([-](?<max>[0-9]+))?)/;
export const numberRegex = /([0-9]+(\.[0-9]+)?)/;
export const integerRegex = /([0]|[1-9][0-9]+)/;
export const symbolsRegex = /([-+])/;
export const referenceRegex = /(@\{(?<name>\w+)\})/;
export const costRegex = new RegExp(`(?<value>${integerRegex.source}) (?<name>\\w+)`);
export const rankNumeralsRegex = new RegExp(`\\b(?<rank>${ROMAN_NUMERALS.join('|')})$`);
export const strToPascal = (str: string) => str[0]?.toLowerCase() + str.replace(/(\w)(\w*)/g, (_, g1: string, g2: string) => `${g1.toUpperCase()}${g2.toLowerCase()}`).replaceAll(' ', '').substring(1);
export const strToKebab = (str: string) => str.split(' ').join('-').toLowerCase();

export function parseTextValues(text: string) {
    const matches = [...text.matchAll(new RegExp(numberRangeRegex, 'g'))];
    const values = [];
    for (const match of matches) {
        assertDefined(match.groups, `failed matching groups on mod: (${text})`);
        const { min, max } = match.groups;
        if (!min) {
            throw `failed matching min value on mod: (${text})`;
        }
        values.push({
            min: parseFloat(min),
            max: parseFloat(max || min),
            value: parseFloat(min),
            startIndex: match.index || 0,
            text: match[0],
        });
    }
    return values;
}

export function pluralizeWords(text: string) {
    text = text.replace(/\b(time)\b/gi, '$1s');
    return text;
}

export function textContainsRankNumerals(text: string) {
    return rankNumeralsRegex.test(text);
}

export function compareNamesWithNumerals(name1: string, name2: string) {
    return name1.replace(rankNumeralsRegex, '') === name2.replace(rankNumeralsRegex, '');
}
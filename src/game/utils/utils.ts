import type { ModifierTag } from '../mods/types';

export const compareValueTypes = (v1: number, v2: number): v1 is typeof v2 => typeof v1 === typeof v2;

export function getFormattedTag(tag: ModifierTag) {
    return `<span data-tag="${tag.toLowerCase()}">${tag}</span>`;
}
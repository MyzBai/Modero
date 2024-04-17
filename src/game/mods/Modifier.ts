import { assertType } from 'src/shared/utils/assert';
import { type ModTemplate } from './types';
import { modTemplateList } from './modTemplates';
import { parseTextValues } from 'src/shared/utils/textParsing';
import type { StatModifier } from './ModDB';
import { isNumber, randomRangeInt, toDecimals } from 'src/shared/utils/utils';

export interface PopupOptions {
    title?: string;
    fields?: { [key: string]: string; };
}
export interface GroupModOptions {
    mod: string;
    levelReq?: number;
    weight?: number;
    groups?: GroupModOptions[];
}

export interface ModValueRange {
    min: number;
    max: number;
    decimalCount: number;
    value: number;
}

export interface SerializedModifier {
    srcId: string;//template id or id in GameConfig
    values: number[];
}

export class Modifier {
    weight = 0;
    constructor(
        readonly text: string,
        readonly template: ModTemplate,
        readonly rangeValues: ModValueRange[]) { }

    get desc() {
        return Modifier.parseDescription(this.template.desc, this.rangeValues.map(x => x.value));
    }

    get rawDesc() {
        return this.text.replace(/\{([^}]+)\}/g, '($1)');
    }

    get values() {
        return this.rangeValues.map(x => x.value);
    }

    private extractStatModifiers() {
        const stats: StatModifier[] = [];
        for (const [index, stat] of this.template.stats.entries()) {
            const value = stat.valueType === 'Flag' ? { value: 1, min: 1, max: 1, decimals: 0 } : this.rangeValues[index];
            if (!value) {
                continue;
            }
            const newStat: StatModifier = { ...stat, ...value };
            for (const tag of newStat.extends || []) {
                if (tag.type === 'PerStat') {
                    const value = this.rangeValues[tag.index || -1]?.value;
                    tag.value = value;
                }
            }
            stats.push(newStat);
        }
        return stats;
    }

    static extractStatModifierList(...items: Modifier[]) {
        return items.flatMap(x => x.extractStatModifiers());
    }

    static toDescription(text: string) {
        return this.modFromText(text).desc;
    }

    static parseDescription(desc: ModTemplate['desc'], values: number[]) {
        let i = 0;
        return desc.replace(/#+/g, (x) => {
            let value = values[i++];
            assertType(value, isNumber);
            const decimals = x.length - 1;
            value = toDecimals(value, decimals);
            return value.toString() || '#';
        });
    }

    static modListFromTexts(texts: string[]) {
        return texts.map(text => Modifier.modFromText(text)).filter((x): x is Modifier => x instanceof Modifier);
    }

    static modFromText(text: string) {
        const template = Modifier.getTemplate(text);

        if (!template) {
            console.warn(`invalid mod: ${text}`);
            return Modifier.empty();
        }
        const values = parseTextValues(text);
        const ranges: ModValueRange[] = values.map((x, i) => ({ min: x.min, max: x.max, value: x.min, decimalCount: Math.max(0, (template.desc.match(/#+/g)?.[i]?.length || 0) - 1) }));
        return new Modifier(text, template, ranges);
    }

    static getTemplate(text: string) {
        const desc = text.replace(/{[^}]+}/g, '#');
        return modTemplateList.find(x => x.desc.replace(/#+/g, '#') === desc);
    }

    sort(other: Modifier) {
        return modTemplateList.findIndex(x => x.desc === this.template.desc) - modTemplateList.findIndex(x => x.desc === other.template.desc);
    }

    static sort(a: Modifier, b: Modifier) {
        return a.sort(b);
    }

    compare(other: Modifier) {
        return this.template.desc === other.template.desc;
    }

    static compare(a: Modifier, b: Modifier) {
        return a.compare(b);
    }

    copy() {
        const copy = Modifier.modFromText(this.text);
        copy.setValues(this.values);
        return copy;
    }

    createHTMLElement(desc?: 'raw'): HTMLElement {
        const li = document.createElement('li');
        li.classList.add('g-mod-desc');
        li.setAttribute('data-mod-desc', '');
        li.textContent = desc === 'raw' ? this.rawDesc : this.desc;
        return li;
    }

    setValues(values: number[]) {
        if (values.length !== this.rangeValues.length) {
            console.error(`${this.template.desc} has incompatible stats`);
            return;
        }
        for (let i = 0; i < this.rangeValues.length; i++) {
            const rangeValue = this.rangeValues[i];
            if (rangeValue) {
                rangeValue.value = values[i] || 0;
            }
        }
    }

    randomizeValues() {
        for (const rangeValue of this.rangeValues) {
            const pow = Math.pow(10, rangeValue.decimalCount + 1);
            const min = rangeValue.min * pow;
            const max = rangeValue.min === rangeValue.max ? min : rangeValue.max * pow + 1 * pow;
            rangeValue.value = (Math.floor(randomRangeInt(min, max))) / pow;
        }
    }

    static empty() {
        const template: ModTemplate = { desc: '[Removed]', stats: [], id: '' };
        return new Modifier(template.desc, template, []);
    }
}
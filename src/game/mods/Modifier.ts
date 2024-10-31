import { type ModTemplate, type ModTemplateStat } from './types';
import { modTemplateList } from './modTemplates';
import { parseTextReferences as parseTextReference, parseTextValues } from 'src/shared/utils/textParsing';
import type { StatModifier } from './ModDB';
import { randomRangeInt } from 'src/shared/utils/utils';
import { assertDefined } from '../../shared/utils/assert';

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
        readonly rangeValues: ModValueRange[],
        readonly reference?: ModTemplateStat['reference']) { }

    get desc() {
        return Modifier.parseDescription(this);
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
            if (this.reference) {
                stat.reference = this.reference;
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

    static parseDescription(mod: Modifier) {
        const regex = /(@\w+|#+)/g;
        let i = 0;
        const replacer: (_: string, $1: string) => string = (_, $1) => {
            if ($1.startsWith('@')) {
                assertDefined(mod.reference?.name, 'mod is missing a name in reference property');
                return mod.reference.name;
            } else if ($1.startsWith('#')) {
                const { value, decimalCount } = mod.rangeValues[i]!;
                return value.toFixed(decimalCount);
            }
            throw new Error('failed parsing mod description');
        };
        return mod.template.desc.replace(regex, replacer);
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
        const textValues = parseTextValues(text);
        const valueRanges: ModValueRange[] = [];
        for (const [i, valueRange] of textValues.entries()) {
            const decimalCount = Math.max(0, (template.desc.match(/#+/g)?.[i]?.length || 0) - 1);
            valueRanges.push({ ...valueRange, decimalCount });
        }
        const references = parseTextReference(text);
        return new Modifier(text, template, valueRanges, references);
    }

    static getTemplate(text: string) {
        const desc = text.replace(/@(\w+){\w+}/, '@$1').replace(/{[^}]+}/g, '#');
        return modTemplateList.find(x => x.desc.replace(/#+/g, '#').replace(/@\w+{}/, '') === desc);
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

    static combine(mod1: Modifier, mod2: Modifier) {
        if (mod1.values.length !== mod2.values.length) {
            throw Error('modifiers are not compatible');
        }
        const newValues = [];
        for (let i = 0; i < mod1.values.length; i++) {
            newValues[i] = mod1.values[i]! + mod2.values[i]!;
        }
        mod1.setValues(newValues);
    }
}
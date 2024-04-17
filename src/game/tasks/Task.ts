import { game, player } from '../game';
import { numberRegex, pluralizeWords, referenceRegex } from 'src/shared/utils/textParsing';
import { assertDefined } from 'src/shared/utils/assert';
import { taskTemplates } from './taskTemplates';

export interface TextData {
    values: NumberValue[];
    references: ReferenceValue[];
}
export interface NumberValue {
    value: number;
    indices: [number, number];
}
export interface ReferenceValue {
    value: string;
    indices: [number, number];
}
export class Task {
    public readonly text: string;
    readonly desc: string;
    private readonly textData: TextData;

    constructor(text: string) {
        try {
            this.text = text;

            //values
            const extractValues = (): NumberValue[] => {
                const matches = [...text.matchAll(new RegExp(`\\{(${numberRegex.source})\\}`, 'gd'))];
                return matches.map(match => {
                    const indices = match.indices?.[0];
                    assertDefined(indices);
                    assertDefined(match[1]);
                    const value = parseFloat(match[1]);
                    return { value, indices };
                });
            };
            const extractReferences = (): ReferenceValue[] => {
                const matches = [...text.matchAll(new RegExp(referenceRegex.source, 'gd'))];
                return matches.map(match => {
                    const indices = match.indices?.[0];
                    assertDefined(indices);
                    assertDefined(match[2]);
                    const value = match[2];
                    return { value, indices };
                });
            };

            this.textData = {
                values: extractValues(),
                references: extractReferences()
            };

            this.desc = text.replace(/{[^}]+}/g, '#').replace(/@(\w+)({[^}]+})/g, '@$1');
        } catch (error) {
            console.error(error);
            throw new Error(`invalid task description: ${text}`);
        }
    }

    get completed() {
        return this.getProgess() >= 1;
    }

    get pct() {
        return Math.min(this.getProgess(), 1);
    }

    getProgess() {
        const template = taskTemplates.find(x => x.desc === pluralizeWords(this.desc));
        assertDefined(template, 'invalid description');
        const values = this.textData.values.map(x => x.value);
        const references = this.textData.references.map(x => x.value);
        const pct = template.progress({
            gameStats: game.stats,
            playerStats: player.stats,
            value: values[0] ?? 0,
            values,
            reference: references[0] ?? '',
            references: references
        });
        return pct;
    }

    createHTML(): string {
        let offset = 0;
        const html = [...this.textData.values, ...this.textData.references].sort((a, b) => a.indices[0] - b.indices[0]).reduce((a, c) => {
            a += this.text.substring(offset, c.indices[0]).concat(`<var data-type="${typeof c.value}">${c.value.toString()}</var>`);
            offset = c.indices[1];
            return a;
        }, '').concat(this.text.substring(offset));
        return `<div>${html}</div>`;
    }
}
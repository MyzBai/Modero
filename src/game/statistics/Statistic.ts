import type { ColorTag } from 'src/shared/types/types';
import { Value } from 'src/shared/utils/Value';
import { isString } from 'src/shared/utils/utils';

export interface StatisticOptions {
    type?: 'number' | 'text' | 'boolean';
    defaultValue?: number;
    label?: string;
    sticky?: boolean;
    valueColorTag?: ColorTag;
    computed?: boolean;
    hiddenBeforeMutation?: boolean;
    hoverTip?: string;
    /**@description add() will apply to these stats as well */
    accumulators?: Statistic[];
    /**@description Overrides formatting and performs formatting in sequence on array elements, e.g [{@link self}, '/', Statistic] > formattedSelf/formattedOther */
    statFormat?: (self: Statistic) => (Statistic | string)[];

    decimals?: number;
    isTime?: boolean;
    suffix?: '%' | 's';
    multiplier?: number;
}

export class Statistic extends Value {
    sticky: boolean;
    texts?: string[];
    constructor(readonly options: StatisticOptions = {}) {
        super(options.defaultValue || 0);
        options.type = options.type || 'number';
        this.sticky = options.sticky || false;
        this.mutated = false;

        this.options.accumulators?.forEach(x => this.addAccumulator(x));
    }

    get visible() {
        if (this.options.hiddenBeforeMutation && !this.mutated) {
            return false;
        }
        return isString(this.options.label);
    }


    setText(text: string) {
        this.texts = this.texts || [];
        if (!this.texts.includes(text)) {
            this.texts.push(text);
        }
        this.set((this.texts || []).indexOf(text));
    }
    getText() {
        return this.texts?.[this.value];
    }

    reset(): void {
        super.reset();
        this.sticky = this.options.sticky || false;
        this.mutated = false;
    }

    addAccumulator(stat: Statistic) {
        this.options.accumulators = this.options.accumulators || [];
        this.addListener('add', ({ change }) => stat.add(change));
        this.options.accumulators.push(stat);
    }
}
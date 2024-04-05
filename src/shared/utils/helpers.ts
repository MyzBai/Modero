export const hasAllFlags = (a: number, b: number) => (a & b) === b; //a must have all flags of b
export const hasAnyFlag = (a: number, b: number) => b === 0 ? true : (a & b) !== 0; //a must have any flag of b
export const avg = (a: number, b: number) => (a + b) / 2;
export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
export const randomRangeInt = (min: number, max: number) => Math.floor(randomRange(min, max));
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number) => (v - a) / (b - a);
export const remap = (iMin: number, iMax: number, oMin: number, oMax: number, v: number) => lerp(oMin, oMax, invLerp(iMin, iMax, v));
export const inRange = (value: number, min: number, max: number) => value >= min && value <= max;

export const isNumber = (v?: unknown): v is number => typeof v === 'number';
export const isString = (v?: unknown): v is string => typeof v === 'string';
export const isBoolean = (v?: unknown): v is boolean => typeof v === 'boolean';
export const isDefined = <T>(v?: T): v is T => v !== undefined;
export const isNull = <T>(v: T | null | undefined): v is T => v === null;
export const isUndefined = <T>(v: T | null | undefined): v is T => !isDefined(v);
export const isNonNullable = <T>(v: T | null | undefined): v is T => isDefined(v) && !isNull(v);
export const isArrayOf = <T>(arr: T[], predicate: (element: unknown) => element is T): arr is T[] => arr.every(predicate);

export const includes = <T>(arr: T[]) => (v: T): boolean => arr.includes(v);

export const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function generateTime(startTime = 0) {
    const ms = Date.now() - startTime;
    const days = Math.floor(ms / 86400000);
    const hours = (Math.floor(ms / 3600000) % 24);
    const mins = (Math.floor(ms / 60000) % 60).toFixed();
    return {
        days, hours, mins, ms
    };
}

export function getTimestamp() {
    return getCurrentTimeInUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
}

export function getCurrentTimeInUserTimezone(timezone: string) {
    // Create a new Date object for the current date and time
    const now = new Date();

    // Format the date according to the user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
        hour12: false // Use 24-hour format
    });

    // Format the current date and time
    const formattedDate = formatter.format(now);

    // Extract hours and minutes from the formatted date
    const [hours, minutes] = formattedDate.split(':');

    // Return the formatted time
    return `${hours}:${minutes}`;
}

export function getRandomWeightedIndex(weights: readonly number[], nullWeight = 0): number | -1 {
    const tempWeights = [nullWeight, ...weights];
    let sum = tempWeights.reduce((a, c) => a + c, 0);
    const random = Math.random() * sum;
    if (random === 0) {
        return -1;
    }
    for (const [i, v] of tempWeights.entries()) {
        sum -= v;
        if (sum <= random) {
            return i - 1;
        }
    }
    return -1;
}

export function getRandomWeightedItem<T extends readonly { weight: number; }[]>(items: T, nullWeight = 0) {
    const index = getRandomWeightedIndex(items.map(x => x.weight), nullWeight);
    const item = items[index] as T[number] | undefined;
    return item;
}

export function pickOneFromPickProbability<T extends { pickProbability: number; }>(items: readonly T[]): T | undefined {
    for (const item of items) {
        const random = randomRangeInt(1, item.pickProbability + 1);
        const pick = item.pickProbability === random;
        if (pick) {
            return item;
        }
    }
    return undefined;
}

export function pickManyFromPickProbability<T extends { pickProbability: number; }>(items: readonly T[]): T[] {
    const result: T[] = [];
    for (const item of items) {
        const random = randomRangeInt(1, item.pickProbability + 1);
        const pick = item.pickProbability === random;
        if (pick) {
            result.push(item);
        }
    }
    return result;
}

export function filterItemsFirstRank<T extends { name: string; }>(items: T[]): T[] {
    const numerals = ['II', 'III', 'IV', 'V'];
    const regex = new RegExp(` (${numerals.join('|')})?$`);
    return items.reduce((a, c) => {
        const nameWithoutNumeral = c.name.replace(regex, '');
        if (a.some(x => x.name.replace(regex, '') === nameWithoutNumeral)) {
            return a;
        }
        a.push(c);
        return a;
    }, [] as T[]) as T[];
}

export function calcItemProbability<T extends { name: string; pickProbability: number; unlocked?: boolean; }>(items: T[]): T | undefined {
    const candidateList = filterItemsFirstRank(items.filter(x => typeof x.unlocked === 'boolean' && x.unlocked ? false : true));
    const item = pickOneFromPickProbability(candidateList);
    return item;
}

export function toRatios(arr: number[]) {
    const sum = arr.reduce((a, c) => a + c, 0) || Number.EPSILON;
    return arr.map((num) => num / sum);
}

export function toDecimals(value: number, decimals: number, rounding: (v: number) => number = Math.floor) {
    return rounding(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calcTier<T>(item: T, items: T[], order: 'ascending' | 'descending' = 'descending') {
    const group = items || [item];
    const index = group.indexOf(item);
    if (index === -1) {
        return index;
    }
    switch (order) {
        case 'ascending': return index + 1;
        case 'descending': return Math.abs(index - group.length);
    }
}
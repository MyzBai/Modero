import { assertDefined } from '../shared/utils/assert';
import { randomRangeInt } from '../shared/utils/utils';

Array.prototype.remove = function <T>(this: T[], item: T) {
    const index = this.indexOf(item);
    if (index === -1) {
        return false;
    }
    this.splice(index, 1);
    return true;
};

Array.prototype.clear = function <T>(this: T[]) {
    this.splice(0);
};
Array.prototype.random = function <T>(this: T[]) {
    const index = randomRangeInt(0, this.length);
    const value = this[index];
    assertDefined(value);
    return value;
};
Array.prototype.findStrict = function <T>(this: T[], predicate: (value: T, index: number, arr: T[]) => unknown) {
    const item = this.find(predicate);
    assertDefined(item, 'Item must exist when called with Array.findStrict()');
    return item;
};
import { assertType } from './shared/utils/assert';
import { isString } from './shared/utils/helpers';


if (typeof Document !== 'undefined') {
    Document.prototype.querySelectorStrict = function <E extends Element = Element>(this: Element, selectors: string) {
        const element = this.querySelector<E>(selectors);
        if (!element) {
            throw new Error(`Element with selectors ${selectors} could not be found!`);
        }
        return element;
    };
}
if (typeof Element !== 'undefined') {
    Element.prototype.querySelectorStrict = function <E extends Element = Element>(this: Element, selectors: string) {
        const element = this.querySelector<E>(selectors);
        if (!element) {
            throw new Error(`Element with selectors ${selectors} could not be found!`);
        }
        return element;
    };

    Element.prototype.getAttributeStrict = function (this: Element, qualifiedName: string) {
        const attr = this.getAttribute(qualifiedName);
        assertType(attr, isString, `missing attribute: ${qualifiedName}`);
        return attr;
    };
}
import { isDefined, isNonNullable, isUndefined } from './utils';

export function assertDefined(value?: unknown | null, msg?: string): asserts value {
    if (!isDefined(value)) {
        throw new TypeError(msg ?? 'value is undefined');
    }
}

export function assertUndefined<T>(value: undefined | T, msg?: string): asserts value is T {
    if (!isUndefined(value)) {
        throw new TypeError(msg ?? 'value is defined');
    }
}

export function assertNullable<T>(value: T | undefined | null, msg?: string): asserts value is T {
    if (isNonNullable(value)) {
        throw new TypeError(msg ?? 'value is not null or undefined');
    }
}

export function assertNonNullable<T>(value: T | undefined | null, msg?: string): asserts value is T {
    if (!isNonNullable(value)) {
        throw new TypeError(msg ?? 'value is null or undefined');
    }
}

export function assertType<T>(value: T | null | undefined, func: (arg?: T | null) => boolean, msg?: string): asserts value is T {
    if (!func(value)) {
        throw new TypeError(msg);
    }
}
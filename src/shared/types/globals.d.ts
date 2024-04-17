
interface ParentNode extends Node {
    querySelectorStrict<E extends Element = Element>(selectors: string): E;
}
interface Element extends Node {
    getAttributeStrict(selectors: string): string;
}

interface Array<T> {
    remove(item: T): boolean;
    clear(): void;
    random(): T;
    findStrict(predicate: (value: T, index: number, obj: readonly T[]) => unknown, thisArg?: unknown): T;
}
interface ReadonlyArray<T> {
    findStrict(predicate: (value: T, index: number, obj: readonly T[]) => unknown, thisArg?: unknown): T;
}

type ExtractStrict<T, U extends T> = Extract<T, U>;
type PickStrict<T, U extends keyof T> = {
    [P in U as T[P] extends Value | undefined ? P : never]: T[P]
}


type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type DeepReplace<T, M extends [unknown, unknown]> = {
    [P in keyof T]: T[P] extends M[0]
    ? M extends unknown ? [T[P]] extends [M[0]] ? M[1] : never : never
    : T[P] extends object
    ? DeepReplace<T[P], M>
    : T[P];
};

type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>;
type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>>;

type KeysUnder<T, K = keyof T> =
    T extends object ? {
        [P in keyof T]-?: (P extends K ? keyof T[P] : never) | KeysUnder<T[P], K>
    }[keyof T] : never;

type Explode<T> = keyof T extends infer K
    ? K extends unknown
    ? { [I in keyof T]: I extends K ? T[I] : never }
    : never
    : never;
type AtMostOne<T> = Explode<Partial<T>>;
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];
type ExactlyOne<T> = AtMostOne<T> & AtLeastOne<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;


type ReplaceAll<S extends string, From extends string, To extends string | number> =
    From extends '' ? S :
    S extends `${infer Prefix}${From}${infer Suffix}` ? `${ReplaceAll<Prefix, From, To>}${To}${ReplaceAll<Suffix, From, To>}`
    : S;

type PropertyValuesToUnion<T> = T[keyof T];
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
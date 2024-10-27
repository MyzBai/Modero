

export function assertUniqueStringList(stringList: string[], msg?: string): asserts stringList is string[] {
    const set = new Set();
    for (const str of stringList) {
        if (set.has(str)) {
            throw new Error(`\x1b[31m${msg} [Duplicate string: ${str}] \x1b[0m`);
        }
        set.add(str);
    }
}
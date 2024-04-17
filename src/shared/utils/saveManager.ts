import * as lzString from 'lz-string';
import type { UnsafeSerialization } from 'src/game/serialization';

export function saveGame(data: Map<string, UnsafeSerialization>) {
    saveData('game', Object.fromEntries(data));
}
export function loadGame(id: string): UnsafeSerialization;
export function loadGame(): Map<string, UnsafeSerialization>;
export function loadGame(id?: string) {
    const text = loadText('game');
    const map = new Map(Object.entries(JSON.parse(text) as Record<string, UnsafeSerialization>));
    return id ? map.get(id) : map;
}

function saveData(name: string, data: unknown) {
    const text = JSON.stringify(data);
    const compressed = lzString.compressToEncodedURIComponent(text);
    localStorage.setItem(name, compressed);
}

function loadText(name: string) {
    const compressed = localStorage.getItem(name);
    if (!compressed) {
        return '{}';
    }
    const uncompressed = lzString.decompressFromEncodedURIComponent(compressed);
    return uncompressed;
}

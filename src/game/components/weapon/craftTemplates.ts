
export type CraftTemplateDescription = typeof craftTemplates[number]['desc'] | typeof devCraftTemplates[number]['desc'];
export interface CraftTemplate {
    desc: string;
    id: string;
}

export const craftTemplates = [
    { desc: 'Reforge item with new random modifiers', id: '44f6fd' },
    { desc: 'Add new modifier', id: '0488a4' },
    { desc: 'Remove modifier', id: 'a4f8f8' },
    { desc: 'Upgrade modifier', id: '1f89b1' },
    { desc: 'Randomize numerical values', id: '2eb926' }
] as const satisfies readonly CraftTemplate[];

export const devCraftTemplates = [
    { desc: '[Dev] Reforge High DPS', id: '22dc2d' }
] as const satisfies readonly CraftTemplate[];
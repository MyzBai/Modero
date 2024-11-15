
export type CraftType = 'Reforge' | 'Add' | 'Remove' | 'Upgrade' | 'Randomize Numericals';
export type CraftTarget = 'All' | 'Single';
export type CraftTemplateDescription = CraftTemplate['desc'];
export interface CraftTemplate {
    id: string;
    desc: typeof craftTemplates[number]['desc'] | typeof devCraftTemplates[number]['desc'];
    type: CraftType;
    target: CraftTarget;
}

export const craftTemplates = [
    { desc: 'Reforge item with new random modifiers', type: 'Reforge', target: 'All', id: '44f6fd' },
    { desc: 'Add new modifier', type: 'Add', target: 'All', id: '0488a4' },
    { desc: 'Remove modifier', type: 'Remove', target: 'Single', id: 'a4f8f8' },
    { desc: 'Upgrade modifier', type: 'Upgrade', target: 'Single', id: '1f89b1' },
    { desc: 'Randomize numerical values of a modifier', type: 'Randomize Numericals', target: 'Single', id: '2eb926' },
    { desc: 'Randomize all numerical values', type: 'Randomize Numericals', target: 'All', id: '5d2686' }
] as const satisfies readonly (Omit<CraftTemplate, 'desc'> & { desc: string; })[];

export const devCraftTemplates = [
    { desc: '[Dev] Reforge High DPS', type: 'Reforge', target: 'All', id: '22dc2d' }
] as const satisfies readonly (Omit<CraftTemplate, 'desc'> & { desc: string; })[];
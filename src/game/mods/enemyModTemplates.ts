import type { ModTemplate } from './types';


export const enemyModTemplateList = [
    { desc: '#% Reduced Damage Taken', stats: [{ name: 'DamageTaken', valueType: 'Inc', negate: true }], id: 'b1be9a' },
    { desc: '+#% Evade Chance', stats: [{ name: 'Evade', valueType: 'Base' }], id: 'e2297b' },
    { desc: '#% Increased Life', stats: [{ name: 'Life', valueType: 'Inc' }], id: '3d298b' },
    { desc: '#% Reduced Life', stats: [{ name: 'Life', valueType: 'Inc', negate: true }], id: '7e6b87' },
] as const satisfies readonly ModTemplate[];
import type { ModTemplate } from './types';


export const enemyModTemplateList = [
    { desc: '#% Reduced Damage Taken', stats: [{ name: 'DamageTaken', valueType: 'Inc', negate: true }], id: 'b1be9a' },
    { desc: '+#% Evade Chance', stats: [{ name: 'Evade', valueType: 'Base' }], id: 'e2297b' },
    { desc: '#% More Life', stats: [{ name: 'Life', valueType: 'More' }], id: 'fbefc9' },
    { desc: '#% Less Life', stats: [{ name: 'Life', valueType: 'More', negate: true }], id: '6a0379' },
    { desc: '#% Increased Life', stats: [{ name: 'Life', valueType: 'Inc' }], id: '3d298b' },
    { desc: '#% Reduced Life', stats: [{ name: 'Life', valueType: 'Inc', negate: true }], id: '7e6b87' },
    { desc: '#% Chance To Drop # @Resource On Death', stats: [{ name: 'ResourceChanceOnEnemyDeath', valueType: 'Base', reference: { type: 'Resource' } }, { name: 'ResourceAmountOnEnemyDeath', valueType: 'Base', reference: { type: 'Resource' } }], id: '31827b' },
] as const satisfies readonly ModTemplate[];
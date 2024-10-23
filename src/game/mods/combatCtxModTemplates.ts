import type { ModTemplate } from './types';

export interface CombatContextModTemplate extends ModTemplate {
    target?: 'Player' | 'Enemy';
}

export const combatCtxModTemplateList: ReadonlyArray<CombatContextModTemplate> = [
    { desc: '#% More Enemy Life', stats: [{ name: 'Life', valueType: 'More' }], target: 'Enemy', id: '0c0148' },
    { desc: '#% More Enemies', stats: [{ name: 'EnemyCount', valueType: 'More' }], id: 'd4b6e5' },
] as const satisfies readonly CombatContextModTemplate[];

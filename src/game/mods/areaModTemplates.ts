import type { ModTemplate } from './types';

export interface AreaModTemplate extends ModTemplate {
    target?: 'Player' | 'Enemy';
}

export const areaModTemplateList: ReadonlyArray<AreaModTemplate> = [
    { desc: '#% More Enemy Life', stats: [{ name: 'Life', valueType: 'More' }], target: 'Enemy', id: '0c0148' },
    { desc: '#% More Enemies', stats: [{ name: 'EnemyCount', valueType: 'More' }], id: 'd4b6e5' },
] as const satisfies readonly AreaModTemplate[];

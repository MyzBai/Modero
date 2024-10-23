import type { player } from '../game';
import type { GameStatCollection } from '../statistics/stats';


export interface TaskTemplate {
    desc: string;
    progress: (data: TaskTemplateArgs) => number;
}

export interface TaskTemplateArgs {
    gameStats: GameStatCollection;
    playerStats: typeof player.stats;
    value: number;//first element in values
    values: number[];
    reference: string;//first element in references
    references: string[];

}

export const taskTemplates = [
    { desc: 'Reach Level #', progress: (data) => data.playerStats.maxLevel.value / data.value },
    { desc: 'Deal # Total Physical Attack Damage', progress: (data) => data.gameStats.totalPhysicalAttackDamage.value / data.value },
    { desc: 'Deal # Total Elemental Attack Damage', progress: (data) => data.gameStats.totalElementalAttackDamage.value / data.value },
    { desc: 'Deal # Total Physical Damage', progress: (data) => data.gameStats.totalPhysicalDamage.value / data.value },
    { desc: 'Deal # Total Elemental Damage', progress: (data) => data.gameStats.totalElementalDamage.value / data.value },
    { desc: 'Deal # Total Bleed Damage', progress: (data) => data.gameStats.totalBleedDamage.value / data.value },
    { desc: 'Deal # Total Burn Damage', progress: (data) => data.gameStats.totalBurnDamage.value / data.value },
    { desc: 'Perform # Critical Hits', progress: (data) => data.gameStats.totalCriticalHitCount.value / data.value },
    { desc: 'Regenerate # Mana', progress: (data) => data.gameStats.totalMana.value / data.value },
] as const satisfies TaskTemplate[];
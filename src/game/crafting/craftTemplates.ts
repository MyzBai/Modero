import { assertUniqueStringList } from 'src/shared/utils/assert';
import type { CraftData, CraftResult } from './CraftManager';

export interface CraftTemplate {
    desc: string;
    craft: (data: CraftData) => CraftResult | string;
    id: string;
}

export const weaponCraftTemplates = [
    {
        desc: 'Reforge item with new random modifiers',
        craft: data => data.crafter.reforge(data.itemModList, data.candidateModList),
        id: 'ab8ed8'
    },
    {
        desc: 'Reforge item with new random modifiers, including a physical modifier',
        craft: data => data.crafter.reforge(data.itemModList, data.candidateModList, 'Physical'),
        id: '53dbb7'
    },
    {
        desc: 'Add a random modifier',
        craft: data => data.crafter.addOne(data.itemModList, data.candidateModList),
        id: '167a65'
    },
    {
        desc: 'Add a physical modifier',
        craft: data => data.crafter.addOne(data.itemModList, data.candidateModList, 'Physical'),
        id: '7d9d53'
    },
    {
        desc: 'Remove a random modifier',
        craft: data => data.crafter.removeOne(data.itemModList),
        id: '8a071c'
    },
    {
        desc: 'Remove an attack modifier',
        craft: data => data.crafter.removeOne(data.itemModList, 'Attack'),
        id: 'f6b79e'
    },
    {
        desc: 'Remove a mana modifier',
        craft: data => data.crafter.removeOne(data.itemModList, 'Mana'),
        id: '72038a'
    },
    {
        desc: 'Remove an ailment modifier',
        craft: data => data.crafter.removeOne(data.itemModList, 'Ailment'),
        id: '1d3692'
    },
    {
        desc: 'Remove a critical hit modifier',
        craft: data => data.crafter.removeOne(data.itemModList, 'Critical'),
        id: '369ea2'
    },
    {
        desc: 'Remove an attribute modifier',
        craft: data => data.crafter.removeOne(data.itemModList, 'Attribute'),
        id: 'd92037'
    },
    {
        desc: 'Randomize numerical values',
        craft: data => data.crafter.modifyNumericalValues(data.itemModList, 'random'),
        id: 'f5e3cf'
    }
] as const satisfies CraftTemplate[];

assertUniqueStringList(weaponCraftTemplates.map(x => x.id), 'weaponCrafTemplates contains non-unique ids');
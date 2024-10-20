import { assertUniqueStringList } from 'src/shared/utils/assert';
import { type ModTemplate } from './types';
import { areaModTemplateList } from './areaModTemplates';
import { persistentPlayerModTemplateList, playerModTemplateList } from './playerModTemplates';
import { enemyModTemplateList } from './enemyModTemplates';

export type ModDescription = typeof modTemplateList[number]['desc'];

export const trialModTemplateList = [
    ...persistentPlayerModTemplateList,
    ...areaModTemplateList
] as const satisfies readonly ModTemplate[];


export const modTemplateList = [
    ...playerModTemplateList,
    ...enemyModTemplateList,
    ...areaModTemplateList,
];

assertUniqueStringList(modTemplateList.map(x => x.id), 'modTemplates contains non-unique ids');

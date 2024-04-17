import { assertUniqueStringList } from 'src/shared/utils/assert';
import { type ModTemplate } from './types';
import { areaModTemplateList } from './areaModTemplates';
import { persistentPlayerModTemplateList, playerModTemplateList } from './playerModTemplates';
import { extractModifier } from './utils';
import { enemyModTemplateList } from './enemyModTemplates';

export type ModDescription = typeof modTemplateList[number]['desc'];

export const ascensionModTemplateList = [
    ...areaModTemplateList,
    extractModifier(persistentPlayerModTemplateList, '+# Maximum Artifacts'),
    extractModifier(persistentPlayerModTemplateList, '+# Maximum Insight'),
] as const satisfies readonly ModTemplate[];


export const modTemplateList = [
    ...playerModTemplateList,
    ...enemyModTemplateList,
    ...areaModTemplateList
];

assertUniqueStringList(modTemplateList.map(x => x.id), 'modTemplates contains non-unique ids');

import { playerModTemplateList } from '../../../mods/playerModTemplates';
import type { ModTemplate } from '../../../mods/types';
import { extractModifier } from '../../../mods/modUtils';


export const artifactModTemplateList = [
    extractModifier(playerModTemplateList, '+#% Increased Artifacts Found'),
    extractModifier(playerModTemplateList, '+# Maximum Artifacts')
] as const satisfies readonly ModTemplate[];
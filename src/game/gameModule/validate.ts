import { type ErrorObject } from 'ajv';
import { type GameModule } from './GameModule';
import { resolveGamePathFromVersion } from 'src/config';

type ErrorMessage = string;
const removeComments = (str: string) => str.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g, '').trim();

export async function validateModule(moduleText: string): Promise<GameModule | ErrorMessage> {
    moduleText = removeComments(moduleText);
    const module = JSON.parse(moduleText) as DeepPartial<GameModule>;

    let version: string = 'v0';
    if (Object.hasOwn(module, 'version') && typeof module.version === 'string') {
        version = module.version;
    }

    const path = resolveGamePathFromVersion(version, 'gameModuleSchemaValidator.mjs');
    const url = new URL(path, window.location.href).href;
    const { validate } = await import(url);

    if (!validate(module)) {
        let errors: Partial<ErrorObject>[] = [];
        if ('errors' in validate) {
            errors = validate.errors as Partial<ErrorObject>[];
        }
        const errorMsg = `GameModule Validation Failed!\n${JSON.stringify(errors.map(x => ({ instancePath: x.instancePath, message: x.message })), null, 2)}`;
        return errorMsg;
    }
    return module as GameModule;
}
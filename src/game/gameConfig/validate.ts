import { type ErrorObject } from 'ajv';
import { type GameConfig } from './GameConfig';
import { ENVIRONMENT, resolveGamePathFromVersion } from 'src/config';

type ErrorMessage = string;
const removeComments = (str: string) => str.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*/g, '').trim();

export async function validateGameConfig(gameConfigText: string): Promise<GameConfig | ErrorMessage> {
    gameConfigText = removeComments(gameConfigText);
    const gameConfig = JSON.parse(gameConfigText) as DeepPartial<GameConfig>;

    let version: string = 'v0';
    if (Object.hasOwn(gameConfig, 'version') && typeof gameConfig.version === 'string') {
        version = gameConfig.version;
    }

    const path = resolveGamePathFromVersion(version, 'gameConfigSchemaValidator.mjs');
    const url = new URL(path, window.location.href).href;
    const { validate } = await import(url);

    if (!validate(gameConfig)) {
        let errors: Partial<ErrorObject>[] = [];
        if ('errors' in validate) {
            errors = validate.errors as Partial<ErrorObject>[];
        }
        return [...createErrorMessage(errors)].filter(x => x).join('\n');
    }
    return gameConfig as GameConfig;
}

function* createErrorMessage(errors: Partial<ErrorObject>[]): Generator<string> {
    yield 'gameConfig is invalid';
    const patternError = errors.filter(x => x.keyword === 'pattern')[0];
    if (patternError) {
        yield `invalid pattern at ${patternError.instancePath}`;
        if (ENVIRONMENT !== 'production') {
            yield `see pattern at ${patternError.schemaPath}`;
        }
        yield ' ';
    }

    const additionalProperties = errors.filter(x => x.keyword === 'additionalProperties');
    if (additionalProperties.length > 0) {
        yield additionalProperties[0]?.message ?? '';
        for (const additionalProperty of additionalProperties) {
            const params = additionalProperty.params;
            if (!params) {
                continue;
            }
            let key = 'additionalProperty';
            if (key in params && params[key]) {
                key = params[key];
                yield `property: "${key}" at "${additionalProperty.instancePath}/${key}"`;
            }
        }
    }

    const requiredProperties = errors.filter(x => x.keyword === 'required');
    if (requiredProperties.length > 0) {
        for (const requiredProperty of requiredProperties) {
            yield requiredProperty.message ?? '';
            const params = requiredProperty.params;
            if (!params) {
                continue;
            }
            let key = 'missingProperty';
            if (key in params && params[key]) {
                key = params[key];
                yield `property: "${key}" at "${requiredProperty.instancePath}/${key}"`;
            }
        }
    }

    const wrongTypes = errors.filter(x => x.keyword === 'type');
    if (wrongTypes.length > 0) {
        for (const wrongType of wrongTypes) {
            yield `wrong type at "${wrongType.instancePath}". (${wrongType.message})`;
        }
    }
}
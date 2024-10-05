import 'src/extensions/arrayExtensions';
import { ascensionModTemplateList } from '../src/game/mods/modTemplates';
import { integerRangeRegex, numberRangeRegex, symbolsRegex } from '../src/shared/utils/textParsing';
import { generateSchema, buildGenerator, type PartialArgs, type Definition, type JsonSchemaGenerator, getProgramFromFiles } from 'typescript-json-schema';
import { writeFile } from 'fs/promises';
import { assertNonNullable } from '../src/shared/utils/assert';
import { SchemaOverrideSymbolNames, type SchemaOverrideSymbolName } from '../src/game/gameConfig/GameConfig';
import { isDefined } from '../src/shared/utils/utils';
import { taskTemplates } from '../src/game/tasks/taskTemplates';
import { craftTemplates } from '../src/game/components/weapon/craftTemplates';
import { generalPlayerModTemplateList, persistentPlayerModTemplateList, playerStartModTemplateList } from '../src/game/mods/playerModTemplates';
import { enemyModTemplateList } from '../src/game/mods/enemyModTemplates';

interface SchemaOverride {
    oneOf?: { pattern: string; }[];
    pattern: string;
    defaultSnippets?: { body: string; }[];
}

interface StringSchemaOverrideOptions {
    /**Name of the property to be overridden */
    symbolName: SchemaOverrideSymbolName;
    descriptions: string[];
    /**determines how to deal with #. e.g "+{#} Strength" or "100 Gold" instead of "{100} Gold" */
    valueOptions?: ValueOptions;
}

interface ValueOptions {
    excludeBrackets?: boolean;
}

export const SCHEMA_PATH = 'src/game/gameConfig/gameConfig.schema.json';
const GAME_CONFIG_PATH = 'src/game/gameConfig/GameConfig.ts';

void (async () => {
    console.time('generate schema');
    const schema = createSchema();
    console.timeEnd('generate schema');
    if (schema) {
        await writeFile(SCHEMA_PATH, schema);
    }
})();

function createSchema() {
    const settings: PartialArgs = {
        required: true,
        noExtraProps: true,
        ignoreErrors: true,
        ref: true
    };

    try {
        const program = getProgramFromFiles([GAME_CONFIG_PATH]);
        const generator = buildGenerator(program, settings, [GAME_CONFIG_PATH]);
        assertNonNullable(generator, 'building generator failed');

        createSchemaOverrideProperties(generator);

        const schema = generateSchema(program, 'GameConfig', settings, [GAME_CONFIG_PATH], generator);
        assertNonNullable(schema, 'generating schema failed');
        schema.definitions = {
            ...schema?.definitions,
            ...includeMissingDefinitions(schema, generator)
        };
        assertNoMissingReferences(schema);
        assertNoUnusedDefinitions(schema);
        return JSON.stringify(schema, null, 2);
    } catch (error) {
        console.log(error);
    }
    return;
}

function createSchemaOverrideProperties(generator: JsonSchemaGenerator) {
    //strings which can be referenced throughout the config file
    createStringSchemaOverride(generator, { symbolName: 'PlayerMod', descriptions: generalPlayerModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'PlayerStartMod', descriptions: playerStartModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'SkillsUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'WeaponUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'TreasuryUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'AscensionMod', descriptions: ascensionModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'EnemyMod', descriptions: enemyModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'WeaponCraftDescription', descriptions: craftTemplates.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'AchievementDescription', descriptions: taskTemplates.map(x => x.desc) });

    //create snippet for id to automatically generate random base-16 digts
    const idOverride: SchemaOverride = {
        pattern: '^[a-f0-9]{6}$',
        defaultSnippets: process.env.NODE_ENV !== 'production' ? [{ body: '${RANDOM_HEX}' }] : undefined
    };
    generator.setSchemaOverride('Id', { type: 'string', ...idOverride });
}

function createStringSchemaOverride(generator: JsonSchemaGenerator, opts: StringSchemaOverrideOptions) {
    const createDefaultSnippet = (text: string) => {
        let count = 1;
        text = text.replace(/\{#+\}/g, () => {
            return `{\${${count++}:#}}`;
        });
        return text;
    };

    const definitions = createDefinitions(opts);

    const patterns = definitions.map(x => x.pattern).filter(isDefined);
    const oneOf = patterns.length > 0 ? patterns.map(x => ({ pattern: x })) : undefined;
    const schemaOverride: SchemaOverride = {
        pattern: '^[^#]*$',
        defaultSnippets: process.env.NODE_ENV !== 'production' ? definitions.map(x => ({ body: createDefaultSnippet(x.desc) })) : undefined,
        oneOf
    };
    generator.setSchemaOverride(opts.symbolName, {
        type: 'string',
        ...schemaOverride
    });
}

function createDefinitions(opts: StringSchemaOverrideOptions) {
    return opts.descriptions.map(x => createDefinition(x, opts));
}

function createDefinition(desc: string, opts: StringSchemaOverrideOptions) {
    let pattern: string | undefined = replaceSymbol(desc);
    pattern = replaceHash(pattern, opts.valueOptions);
    pattern = removeGroupNames(pattern);
    pattern = insertQuestionMarkForPluralization(pattern);

    if (pattern === desc) {
        pattern = undefined;
    } else {
        pattern = `^${pattern}$`;
    }
    desc = desc.replace(/(#+)/g, '{#}').replace(/@(\w+)/g, '@{$1}');
    return { pattern: pattern ?? desc, desc };
}

function removeGroupNames(text: string) {
    return text.replace(/\?<(min|max|name)>/g, '');
}

function replaceSymbol(text: string) {
    return text.replace(new RegExp(symbolsRegex, 'g'), symbolsRegex.source);
}

function replaceHash(text: string, opts?: ValueOptions) {
    return text.replace(/(#+)/g, (a) => {
        const pattern = a.length > 1 ? numberRangeRegex.source : integerRangeRegex.source;
        if (!opts?.excludeBrackets) {
            return `\\{${pattern}\\}`;
        }
        return pattern;
    });
}

function insertQuestionMarkForPluralization(text: string) {
    return text.replace(/(times)/gi, '$1?');
}

function assertNoMissingReferences(schema: Definition) {
    const text = JSON.stringify(schema);
    const definitions = Object.keys(schema.definitions ?? {});
    const referenceNames = [...text.matchAll(/"#\/definitions\/([^"]+)"/g)]?.map(x => x[1]);
    const missingReferences = referenceNames.filter(isDefined).reduce((a, c) => {
        if (!definitions.includes(c)) {
            a.add(c);
        }
        return a;
    }, new Set<string>());
    if (missingReferences.size > 0) {
        throw `schema has missing references:\n\x1b[31m${[...missingReferences.keys()].join('\n')}\x1b[0m`;
    }
}

function assertNoUnusedDefinitions(schema: Definition) {
    const text = JSON.stringify(schema);
    const unusedDefinitions = Object.keys(schema.definitions ?? {}).map(x => new RegExp(`#/definitions/${x}`).test(text) ? undefined : x).filter(isDefined);
    if (unusedDefinitions.length > 0) {
        throw `schema contains unused definitions:\n\x1b[31m${unusedDefinitions.join('\n')}\x1b[0m`;
    }
}

function includeMissingDefinitions(schema: Definition, generator: JsonSchemaGenerator) {
    const missingDefinitions = SchemaOverrideSymbolNames.map(x => schema.definitions?.[x] ? undefined : x).filter(isDefined);
    return { ...Object.fromEntries(missingDefinitions.map(x => [x, { ...generator.getSchemaForSymbol(x), $schema: undefined }])) };
}
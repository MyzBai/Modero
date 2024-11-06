import 'src/extensions/arrayExtensions';
import { modTemplateList, worldModTemplateList } from '../src/game/mods/modTemplates';
import { integerRangeRegex, numberRangeRegex, symbolsRegex } from '../src/shared/utils/textParsing';
import { generateSchema, buildGenerator, type PartialArgs, type Definition, type JsonSchemaGenerator, getProgramFromFiles } from 'typescript-json-schema';
import { writeFile } from 'fs/promises';
import { assertNonNullable } from '../src/shared/utils/assert';
import { ReferenceNames, ResourceNames, SchemaOverrideSymbolNames, type SchemaOverrideSymbolName } from '../src/game/gameConfig/GameConfig';
import { isDefined } from '../src/shared/utils/utils';
import { taskTemplates } from '../src/game/tasks/taskTemplates';
import { craftTemplates } from '../src/game/components/weapon/craftTemplates';
import { generalPlayerModTemplateList, persistentPlayerModTemplateList, playerStartModTemplateList } from '../src/game/mods/playerModTemplates';
import { enemyModTemplateList } from '../src/game/mods/enemyModTemplates';
import { assertUniqueStringList } from './utils';

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

        const schema = generateSchema(program, 'Config', settings, [GAME_CONFIG_PATH], generator);
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

    assertUniqueStringList(modTemplateList.map(x => x.id), 'modTemplates contains duplicate ids');
    assertUniqueStringList(craftTemplates.map(x => x.id), 'weaponCrafTemplates contains duplicate ids');


    //strings which can be referenced throughout the config file
    createStringSchemaOverride(generator, { symbolName: 'PlayerMod', descriptions: generalPlayerModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'PlayerStartMod', descriptions: playerStartModTemplateList.map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'SkillsUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'WeaponUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'TreasuryUpgradeMod', descriptions: [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList].map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: 'WorldMod', descriptions: worldModTemplateList.map(x => x.desc) });
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
        return text.replace(/\{([^}])\}/g, (_, $1) => {
            return `{\${${count++}:${$1}}}`;
        });
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

function createDefinition(desc: string, _opts: StringSchemaOverrideOptions) {
    let pattern: string | undefined = replaceSymbol(desc);
    pattern = replaceHash(pattern);
    pattern = replaceReference(pattern, [['Resource', ResourceNames]]);
    pattern = removeGroupNames(pattern);
    pattern = insertQuestionMarkForPluralization(pattern);

    if (pattern === desc) {
        pattern = undefined;
    } else {
        pattern = `^${pattern}$`;
    }
    desc = desc.replace(/(#+)/g, '{$1}').replace(new RegExp(`@(${ReferenceNames.join('|')})`), '@$1{#}');
    return { pattern: pattern ?? desc, desc };
}

function removeGroupNames(text: string) {
    return text.replace(/\?<(min|max|name)>/g, '');
}

function replaceSymbol(text: string) {
    return text.replace(new RegExp(symbolsRegex, 'g'), symbolsRegex.source);
}

function replaceHash(text: string, valueOpts?: ValueOptions) {
    return text.replace(/(#+)/g, str => {
        const pattern = str.length > 1 ? numberRangeRegex.source : integerRangeRegex.source;
        if (valueOpts?.excludeBrackets) {
            return pattern;
        }
        return `\\{${pattern}\\}`;
    });
}

function replaceReference(text: string, referenceTable: [typeof ReferenceNames[number], readonly string[]][]) {
    return text.replace(new RegExp(`@(${ReferenceNames.join('|')})`), (_, $1) => {
        const refList = referenceTable.findStrict(x => x[0] === $1)[1];
        return `@${$1}\\{(${refList.join('|')})\\}`;
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
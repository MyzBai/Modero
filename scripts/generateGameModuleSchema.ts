import 'src/arrayExtensions';
import { enemyModTemplates, playerModTemplates, globalPlayerModTemplates, areaModTemplates } from '../src/game/mods/modTemplates';
import { integerRangeRegex, numberRangeRegex, symbolsRegex } from '../src/shared/utils/textParsing';
import { generateSchema, buildGenerator, type PartialArgs, programFromConfig, JsonSchemaGenerator } from 'typescript-json-schema';
import { weaponCraftTemplates } from '../src/game/crafting/craftTemplates';
import { writeFile } from 'fs/promises';
import { assertNonNullable } from 'src/shared/utils/assert';
import { ResourceNames, SchemaOverrideNames } from 'src/game/gameModule/GameModule';
import { isDefined } from 'src/shared/utils/helpers';
import { taskTemplates } from 'src/game/tasks/taskTemplates';

interface SchemaOverride {
    oneOf?: { pattern: string; }[];
    pattern: string;
    defaultSnippets?: { body: string }[];
}

interface StringSchemaOverrideOptions {
    /**Name of the property to be overridden */
    symbolName: SchemaOverrideNames;
    descriptions: string[];
    /**determines how to deal with #. e.g "+{#} Strength" or "100 Gold" instead of "{100} Gold" */
    valueOptions?: ValueOptions;
    referenceOptions?: ReferenceOptions;
}

interface ValueOptions {
    excludeBrackets?: boolean;
}

type NameReferenceList = readonly [string, readonly string[]][];
interface ReferenceOptions {
    //Idea:
    //enum: Collect {1000} \@Gold
    //pattern: Collect \\{[0-9]+\\} \@(Gold|Silver|Copper)
    //which can later be parsed to identifier Gold because of the \@ symbol
    //['Resource', ['Gold', 'Silver', 'Copper']]
    /** This is not currently in use.*/
    nameReferenceList?: NameReferenceList;
}

(async () => {
    const schema = await createSchema();
    if (schema) {
        await writeFile('src/game/gameModule/module.schema.json', schema);
    }
})();

async function createSchema() {
    const settings: PartialArgs = {
        required: true,
        noExtraProps: true,
        ignoreErrors: false,
        ref: true
    };

    try {
        console.time('create schema');
        const program = programFromConfig('tsconfig.json', ['src/game/gameModule/GameModule.ts']);
        const generator = buildGenerator(program, settings);
        assertNonNullable(generator, 'building generator failed');
        createSchemaOverrideProperties(generator);
        const schema = generateSchema(program, 'GameModule', settings, undefined, generator);
        return JSON.stringify(schema, null, 2);
    } catch (error) {
        console.log(error);
    } finally {
        console.timeEnd('create schema');
    }
    return;
}

function createSchemaOverrideProperties(generator: JsonSchemaGenerator) {
    //strings which can be referenced throughout the module file
    const references: readonly [string, readonly string[]][] = [['Resource', ResourceNames]];
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.PlayerMod, descriptions: Object.values(playerModTemplates).map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.GlobalPlayerMod, descriptions: Object.values(globalPlayerModTemplates).map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.EnemyMod, descriptions: Object.values(enemyModTemplates).map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.AreaMod, descriptions: Object.values(areaModTemplates).map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.WeaponCraftDescription, descriptions: Object.values(weaponCraftTemplates).map(x => x.desc) });
    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.AchievementDescription, descriptions: Object.values(taskTemplates).map(x => x.desc), referenceOptions: { nameReferenceList: references } });

    createStringSchemaOverride(generator, { symbolName: SchemaOverrideNames.Cost, descriptions: ResourceNames.map(x => `# ${x}`), valueOptions: { excludeBrackets: true } });

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
    pattern = replaceRefSymbol(pattern, opts.referenceOptions?.nameReferenceList || []);
    pattern = removeGroupNames(pattern);
    pattern = insertQuestionMarkForPluralization(pattern);

    if (pattern === desc) {
        pattern = undefined;
    } else {
        pattern = `^${pattern}$`;
    }
    desc = desc.replace(/(#+)/g, '{#}').replace(/@(\w+)/g, '@{$1}');
    return { pattern: pattern ?? desc, desc }
}

function removeGroupNames(text: string) {
    return text.replace(/\?<(min|max|name)>/g, '');
}

function replaceSymbol(text: string) {
    return text.replace(new RegExp(symbolsRegex, 'g'), symbolsRegex.source);
}

function replaceRefSymbol(text: string, references: NameReferenceList) {
    return text.replace(/@(\w+)/, (_, name) => {
        const ref = references.find(x => x[0] === name)?.[1]?.join('|');
        return `@\\{(${ref})\\}` || '';
    });
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
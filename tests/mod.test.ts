import 'src/global';
import { calcModBase, calcModInc, calcModMore, type Configuration, type Source } from "src/game/calc/calcMod";
import { ModDB } from "src/game/mods/ModDB";
import { Modifier } from "src/game/mods/Modifier";
import { modTemplates, type ModDescription } from "src/game/mods/modTemplates";
import { assertDefined } from "src/shared/utils/assert";
import { ModifierFlags } from 'src/game/mods/types';

//npm run test -S -F -M for list of successful, failure and missing respectively

interface ModTest {
    mod: ModDescription | ReplaceAll<ModDescription, '#', `{${number}}`>;
    expect: number[];
    config?: Omit<Configuration, 'source'> & { source?: Partial<Source> };
}
interface TestResult {
    mod: string;
    success: boolean;
    errorMessages: string[];
}

const params = process.argv.slice(2);


const logSuccess = (msg: string) => console.log('\x1b[32m', msg, '\x1b[0m');
const logFailure = (msg: string) => console.log('\x1b[31m', msg, '\x1b[0m');
const logMessage = (msg: string) => console.log('\x1b[33m', msg, '\x1b[0m');

const listSuccessful = process.argv.some(x => x === '-s');
const listFailed = process.argv.some(x => x === '-f');
const listMissing = process.argv.some(x => x === '-m');
const testResults: TestResult[] = [];

if (params.includes('--help')) {
    const logs: [string, string][] = [];
    const log = (arg: string, desc: string = '') => logs.push([arg, desc]);
    log('-s', 'list successful modifiers');
    log('-f', 'list failed modifiers');
    log('-m', 'list missing modifiers');
    const maxLength = Math.max(logs.map(x => x[0].length).reduce((a, c) => Math.max(c, a)) + 1, 30);
    logs.forEach(([arg, desc]) => console.log(`${arg + ' '.repeat(maxLength - arg.length)} ${desc}`));
} else {
    test();
}

export function test() {
    runTests();
    for (const result of testResults) {
        if (listSuccessful && result.success) {
            logSuccess(result.mod);
        }
        if (listFailed && !result.success) {
            logFailure(result.errorMessages.join(' | '));
        }


    }
    if (listMissing) {
        const modTexts = testResults.map(x => x.mod);
        const missing = modTemplates.map(x => x.desc).filter(x => !modTexts.includes(x));
        for (const mod of missing) {
            logMessage(`Missing: ${mod}`);
        }
    }

    if (!listSuccessful && !listFailed && !listMissing) {
        testResults.filter(x => !x.success).map(x => x.errorMessages).forEach(x => logFailure(x.join(' | ')));
    }
}

function runTests() {

    //player
    addTest({ mod: '{10}% Increased Attack Damage', expect: [1.1], config: { flags: ModifierFlags.Attack } });
    addTest({ mod: '{10}% Increased Physical Attack Damage', expect: [1.1], config: { flags: ModifierFlags.Attack | ModifierFlags.Physical } });
    addTest({ mod: '{10}% Increased Elemental Attack Damage', expect: [1.1], config: { flags: ModifierFlags.Attack | ModifierFlags.Elemental } });
    addTest({ mod: '{10}% Increased Elemental Damage', expect: [1.1], config: { flags: ModifierFlags.Elemental } });
    addTest({ mod: 'Adds {1} To {2} Physical Damage', expect: [1, 2], config: { flags: ModifierFlags.Physical } });
    addTest({ mod: 'Adds {1} To {2} Elemental Damage', expect: [1, 2], config: { flags: ModifierFlags.Elemental } });
    addTest({ mod: '{5}% Increased Bleed Duration', expect: [1.05] });
    addTest({ mod: '{10}% More Bleed Damage', expect: [1.1], config: { flags: ModifierFlags.Bleed } });
    addTest({ mod: '+{1} Maximum Bleed Stack', expect: [1], config: {} });
    addTest({ mod: '+{10}% Bleed Damage Multiplier', expect: [10], config: { flags: ModifierFlags.Bleed } });
    addTest({ mod: '+{10}% Bleed Damage Multiplier', expect: [0] });
    addTest({ mod: '+{10}% Damage Over Time Multiplier', expect: [10] });

    addTest({ mod: '{10}% More Attack Damage Per {5} Strength', expect: [1.2], config: { flags: ModifierFlags.Attack, source: { stats: { strength: 10 } } } });
    addTest({ mod: '{10}% More Attack Speed Per {5} Dexterity', expect: [1.2], config: { source: { stats: { dexterity: 10 } } } });
    addTest({ mod: '{10}% More Maximum Mana Per {5} Intelligence', expect: [1.2], config: { source: { stats: { intelligence: 10 } } } });
}

function addTest(test: ModTest) {
    const modTemplate = modTemplates.find(x => x.desc === test.mod.replace(/{[0-9]+}/g, '#'));
    assertDefined(modTemplate, `invalid mod description: ${test.mod}`);

    const mod = Modifier.modFromText(test.mod);

    const modDB = new ModDB();
    modDB.add('test', mod.extractStatModifiers());

    let stats = {};
    stats = test.config?.source?.stats || stats;
    const config: Configuration = {
        flags: test.config?.flags || 0,
        source: {
            stats,
            conditionFlags: test.config?.source?.conditionFlags,
            modDB: test.config?.source?.modDB
        }
    };
    config.source = { ...config.source, modDB, stats: config.source?.stats || {} };
    config.target = { ...config.target, modDB, stats: config.target?.stats || {} };
    try {
        let success = false;
        let errorMessages: string[] = [];
        for (let i = 0; i < modTemplate.stats.length; i++) {
            let value = 0;
            const templateStat = modTemplate.stats[i];
            assertDefined(templateStat, `template stat [${i}] is undefined for: ${modTemplate.desc}`);
            switch (templateStat.valueType) {
                case 'Base': value = calcModBase(templateStat.name, config); break;
                case 'Inc': value = calcModInc(templateStat.name, config); break;
                case 'More': value = calcModMore(templateStat.name, config); break;
            }

            const expect = test.expect[i];
            assertDefined(expect, 'invalid array length of expect');

            if (value.toPrecision(2) == expect.toPrecision(2)) {
                success = true;
            } else {
                errorMessages.push(`${test.mod} | expected ${expect} | result: ${value}`);
                success = false;
                break;
            }
        }
        if (!success && errorMessages.length === 0) {
            throw `internal error`;
        }
        testResults.push({ mod: test.mod, success, errorMessages });
    } catch (error) {
        console.error(error);
    }
}
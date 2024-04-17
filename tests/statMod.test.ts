import { calcModBase, calcModFlag, calcModInc, calcModMore, type Configuration, type Source } from 'src/game/calc/calcMod';
import { ModDB, type StatModifier } from 'src/game/mods/ModDB';
import { assertDefined } from 'src/shared/utils/assert';


interface ModTest {
    statModList: StatModifier[];
    expect: number;
    config?: Omit<Configuration, 'source'> & { source?: Partial<Source>; };
}
runTests();

function runTests() {

    addTest({ statModList: [{ name: 'LingeringBurn', value: 1, valueType: 'Flag' }], expect: 1 });
    addTest({ statModList: [{ name: 'LingeringBurn', value: 0, valueType: 'Flag' }], expect: 0 });
    addTest({ statModList: [{ name: 'MinDamage', value: 1, valueType: 'Base' }], expect: 1 });
    addTest({ statModList: [{ name: 'Damage', value: 1, valueType: 'More', extends: [{ type: 'PerStat', statName: 'strength', value: 2 }] }], expect: 1.05, config: { source: { stats: { strength: 10 } } } });
    addTest({ statModList: [{ name: 'HitChance', valueType: 'Base', value: 2, extends: [{ type: 'PerStat', statName: 'dexterity', value: 6 }] }], expect: 33.3, config: { source: { stats: { dexterity: 100 } } } });
    addTest({ statModList: [{ name: 'ManaRegen', valueType: 'Base', value: 2, extends: [{ type: 'PerStat', statName: 'maxMana', div: 100 }] }], expect: 1, config: { source: { stats: { maxMana: 50 } } } });
}

function addTest(test: ModTest) {
    try {
        const modDB = new ModDB();
        modDB.add('test', test.statModList);

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

        for (const stat of test.statModList) {
            let value = 0;
            assertDefined(stat);

            switch (stat.valueType) {
                case 'Base': value = calcModBase(stat.name, config); break;
                case 'Inc': value = calcModInc(stat.name, config); break;
                case 'More': value = calcModMore(stat.name, config); break;
                case 'Flag': value = calcModFlag(stat.name, config); break;
            }

            const expect = test.expect;
            if (value.toPrecision(2) !== expect.toPrecision(2)) {
                throw `test failed | value: ${value} expect: ${expect} | ${JSON.stringify(test, null, 0)}`;
            }
        }
    } catch (error) {
        console.log(`\x1b[31m${error}\x1b[0m`);
    }

}
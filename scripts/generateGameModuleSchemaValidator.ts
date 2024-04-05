import ajvStandaloneCode from 'ajv/dist/standalone';
import type { Vocabulary } from 'ajv';
import { writeFile } from 'fs/promises';
import Ajv from 'ajv';
import { resolveGamePathFromVersion } from 'src/config';
import { GAME_MODULE_VERSION } from 'src/game/gameModule/GameModule';

(async () => {
    console.time('build schema validator');
    const schemaUrl = 'src/game/gameModule/module.schema.json';
    const schema = await import(schemaUrl) as object;
    const file = await createAjvSchemaStandalone(JSON.stringify(schema));
    const path = `public/${resolveGamePathFromVersion(GAME_MODULE_VERSION, 'gameModuleSchemaValidator.mjs')}`;
    console.log('path:', path);
    await writeFile(path, file);
    console.timeEnd('build schema validator');
})();


async function createAjvSchemaStandalone(schema: string) {
    const keywords: Vocabulary = [];
    if (process.env.NODE_ENV !== 'production') {
        keywords.push({ keyword: 'defaultSnippets' });
    }
    const ajv = new Ajv({ code: { es5: false, source: true, esm: true }, keywords });
    const schemaObj = JSON.parse(schema);
    const validate = ajv.compile(schemaObj);
    let moduleCode = ajvStandaloneCode(ajv, validate);
    return moduleCode;
}
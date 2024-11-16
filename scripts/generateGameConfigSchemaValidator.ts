import ajvStandaloneCode from 'ajv/dist/standalone';
import { mkdir, writeFile } from 'fs/promises';
import * as path from 'path';
import Ajv from 'ajv';
import { resolveGamePathFromVersion } from '../src/config';
import { GAME_CONFIG_VERSION } from '../src/game/gameConfig/GameConfig';
import { _Code } from 'ajv/dist/compile/codegen/code';

void (async () => {
    console.time('build schema validator');
    const schema = await import('src/game/gameConfig/gameConfig.schema.json') as object;
    const file = createAjvSchemaStandalone(JSON.stringify(schema));
    const filePath = `public/${resolveGamePathFromVersion(GAME_CONFIG_VERSION, 'gameConfigSchemaValidator.mjs')}`;
    console.log('path:', filePath);

    await mkdir(path.dirname(filePath), { recursive: true });

    await writeFile(filePath, file);
    console.timeEnd('build schema validator');
})();


function createAjvSchemaStandalone(schema: string) {
    const ajv = new Ajv({ code: { es5: false, source: true, esm: true }, removeAdditional: 'all', allErrors: true });
    if (process.env.NODE_ENV !== 'production') {
        ajv.addKeyword('defaultSnippets');
    }
    const schemaObj = JSON.parse(schema);
    const validate = ajv.compile(schemaObj);
    const code = ajvStandaloneCode(ajv, validate);
    return code;
}
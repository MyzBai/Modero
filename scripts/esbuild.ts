import { type BuildOptions } from 'esbuild';
import * as esbuild from 'esbuild';
import * as fs from 'fs/promises';
import { ENVIRONMENT, IS_REMOTE } from 'src/config';
import { GAME_MODULE_VERSION } from 'src/game/gameModule/GameModule';

//NOTE: changing GAME_MODULE_VERSION requires esbuild watch to be restarted

const developmentOptions: BuildOptions = {
    sourcemap: true,
    logLevel: 'info',
};

const productionOptions: BuildOptions = {
    sourcemap: false,
};

const defaultOptions: BuildOptions = {
    ...(process.env.NODE_ENV === 'production' ? productionOptions : developmentOptions),
    bundle: true,
    minify: true,
    format: 'esm',
    treeShaking: true,
    plugins: [configPlugin()]
};
build({
    ...defaultOptions,
    entryPoints: ['src/main.ts'],
    outfile: 'public/dist/main.js'
});
build({
    ...defaultOptions,
    minify: false,
    entryPoints: ['src/game/game.ts'],
    outfile: `public/dist/game_${GAME_MODULE_VERSION}/game.js`
});


async function build(buildOptions: BuildOptions) {
    const ctx = await esbuild.context(buildOptions);
    if (process.argv.includes('--watch')) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        ctx.dispose();
    }
}

function configPlugin(): esbuild.Plugin {
    return {
        name: 'env',
        setup(build) {
            build.onLoad({ filter: /config.ts/ }, async (args) => {
                let contents = await fs.readFile(args.path, 'utf8');
                contents = contents.replace(`export const ENVIRONMENT: EnvironmentMode = '${ENVIRONMENT}';`, `export const ENVIRONMENT: EnvironmentMode = '${process.env.NODE_ENV ?? ENVIRONMENT}';`);
                contents = contents.replace(`export const IS_REMOTE = ${IS_REMOTE};`, `export const IS_REMOTE = ${process.env.ENV_IS_REMOTE};`);
                return { contents, loader: 'ts' };
            });
        }
    }
}
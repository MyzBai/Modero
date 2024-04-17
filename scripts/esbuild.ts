import { type BuildOptions } from 'esbuild';
import * as esbuild from 'esbuild';
import * as fs from 'fs/promises';
import { ENVIRONMENT } from 'src/config';
import { GAME_CONFIG_VERSION } from 'src/game/gameConfig/GameConfig';

const developmentOptions: BuildOptions = {
    minify: false,
    logLevel: 'info',
};

const productionOptions: BuildOptions = {
    minify: true
};

const defaultOptions: BuildOptions = {
    ...(process.env.NODE_ENV === 'production' ? productionOptions : developmentOptions),
    sourcemap: true,
    bundle: true,
    format: 'esm',
    treeShaking: true,
    plugins: [configPlugin()]
};
void build({
    ...defaultOptions,
    entryPoints: ['src/main.ts'],
    outfile: 'public/dist/main.js'
});
void build({
    ...defaultOptions,
    minify: false,
    entryPoints: ['src/game/game.ts'],
    outfile: `public/dist/game_${GAME_CONFIG_VERSION}/game.js`
});


async function build(buildOptions: BuildOptions) {
    const ctx = await esbuild.context(buildOptions);
    if (process.argv.includes('--watch')) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        void ctx.dispose();
    }
}

function configPlugin(): esbuild.Plugin {
    return {
        name: 'env',
        setup(build) {
            build.onLoad({ filter: /config.ts/ }, async (args) => {
                let contents = await fs.readFile(args.path, 'utf8');
                contents = contents.replace(`export const ENVIRONMENT: EnvironmentMode = '${ENVIRONMENT}';`, `export const ENVIRONMENT: EnvironmentMode = '${process.env.NODE_ENV ?? ENVIRONMENT}';`);
                return { contents, loader: 'ts' };
            });
        }
    };
}
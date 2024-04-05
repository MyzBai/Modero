import { spawn } from 'child_process';
import * as path from 'path';
import { GAME_MODULE_VERSION } from 'src/game/gameModule/GameModule';

//NOTE: changing GAME_MODULE_VERSION requires sass watch to be restarted

build();

function build() {
    const args: string[] = [
        'src/styles/style.scss:public/dist/style.css',
        `src/styles/game.scss:public/dist/game_${GAME_MODULE_VERSION}/style.css`,
        '--update',
        '--load-path=src/game',
        '--load-path=src/styles',
        '--no-source-map'
    ];
    args.push(...process.argv.slice(2));
    const sassPath = path.join('node_modules', '.bin', 'sass');
    const sassProcess = spawn(sassPath, args, { stdio: 'inherit', shell: true });
    sassProcess.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });

    sassProcess.on('close', (code) => {
        if (code !== 0) {
            console.log(`child process exited with code ${code}`);
        }
    });

    sassProcess.on('message', e => { console.log(e) });
}
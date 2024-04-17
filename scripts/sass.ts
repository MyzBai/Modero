import { spawn } from 'child_process';
import * as path from 'path';
import { GAME_CONFIG_VERSION } from 'src/game/gameConfig/GameConfig';

build();

function build() {
    const args: string[] = [
        'src/styles/style.scss:public/dist/style.css',
        `src/styles/game.scss:public/dist/game_${GAME_CONFIG_VERSION}/style.css`,
        '--update',
        '--load-path=src/game',
        '--load-path=src/styles',
        '--no-source-map'
    ];
    args.push(...process.argv.slice(2));
    const sassPath = path.join('node_modules', '.bin', 'sass');
    let connectionAttempts = 0;

    const connect = () => {
        const sassProcess = spawn(sassPath, args, { stdio: 'inherit', shell: true });
        sassProcess.on('error', (error) => {
            console.error(`Error: ${error.message}`);
        });
        sassProcess.on('close', (code) => {
            if (code === 255 && connectionAttempts < 2) {
                connectionAttempts++;
                connect();
            }
            if (code !== 0) {
                console.log(`\nchild process exited with code ${code}`);
            }
        });
    };
    connect();
}
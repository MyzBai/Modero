export type EnvironmentMode = 'development' | 'production';
export const ENVIRONMENT: EnvironmentMode = 'development';

export const IS_REMOTE = false;

export function resolveGamePathFromVersion(version: string, filename: string) {
    return `dist/game_${version}/${filename}`;
}
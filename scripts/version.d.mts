// Types de scripts/version.mjs, importé par vite.config.ts.
export type Bump = 'major' | 'minor' | 'patch' | 'none';
export function bumpOf(message: string): Bump;
export function bump(version: [number, number, number], kind: Bump): [number, number, number];
export function versionOf(rev?: string, cwd?: string): string | null;
export function appVersion(cwd?: string): string;

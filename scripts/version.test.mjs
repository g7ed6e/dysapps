import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bump, bumpOf, versionOf } from './version.mjs';

describe('bumpOf', () => {
  it('monte la mineure par défaut', () => {
    expect(bumpOf('Blocland : les quatre archipels (#90)')).toBe('minor');
  });
  it('lit « +semver: » sur une ligne du message', () => {
    expect(bumpOf('Correctif\n\n+semver: patch')).toBe('patch');
    expect(bumpOf('Refonte\n\n+semver: major')).toBe('major');
    expect(bumpOf('Réglage CI\n\n+semver: none')).toBe('none');
  });
});

describe('bump', () => {
  it('remet à zéro les crans inférieurs', () => {
    expect(bump([0, 14, 2], 'minor')).toEqual([0, 15, 0]);
    expect(bump([0, 14, 2], 'major')).toEqual([1, 0, 0]);
    expect(bump([0, 14, 2], 'patch')).toEqual([0, 14, 3]);
    expect(bump([0, 14, 2], 'none')).toEqual([0, 14, 2]);
  });
});

describe('versionOf', () => {
  let dir;
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  const commit = (message) => git('commit', '--allow-empty', '-q', '-m', message);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'version-'));
    git('init', '-q', '-b', 'main');
    git('config', 'user.name', 'Test');
    git('config', 'user.email', 'test@example.com');
    git('config', 'commit.gpgsign', 'false');
    git('config', 'tag.gpgsign', 'false');
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('part de la dernière étiquette et compte les commits de premier parent', () => {
    commit('départ');
    git('tag', 'v0.14.0');
    expect(versionOf('HEAD', dir)).toBe('0.14.0');
    commit('pull request A');
    commit('pull request B\n\n+semver: patch');
    commit('pull request C');
    expect(versionOf('HEAD', dir)).toBe('0.16.0');
    expect(versionOf('HEAD~1', dir)).toBe('0.15.1');
  });

  it('ne compte pas les commits internes d’une branche fusionnée', () => {
    commit('départ');
    git('tag', 'v1.2.0');
    git('checkout', '-q', '-b', 'branche');
    commit('travail 1');
    commit('travail 2');
    git('checkout', '-q', 'main');
    git('merge', '-q', '--no-ff', '-m', 'fusion', 'branche');
    expect(versionOf('HEAD', dir)).toBe('1.3.0');
  });

  it('renvoie null sans étiquette', () => {
    commit('départ');
    expect(versionOf('HEAD', dir)).toBeNull();
  });
});

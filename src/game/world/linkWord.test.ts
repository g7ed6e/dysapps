// Le mot d'une liaison dans l'univers (GD-9) : « ouvrage » dans Blocland et Archipéo, comme partout à l'écran ; les
// phrases s'accordent avec lui.
import { describe, expect, it } from 'vitest';
import { textesDe } from '../../universes';
import { LIAISON, linkPhrases } from './linkWord';

describe('le mot d’une liaison', () => {
  it('« ouvrage » dans les deux univers, le même que partout ailleurs à l’écran', () => {
    for (const u of ['blocland', 'archipeo'] as const) expect(textesDe(u).liaisons?.nom).toBe('ouvrage');
  });

  it('les phrases s’accordent : un ouvrage, l’ouvrage, cet ouvrage ; une liaison, la liaison, cette liaison', () => {
    const o = linkPhrases(textesDe('blocland').liaisons);
    expect([o.un, o.le, o.ce, o.Le]).toEqual(['un ouvrage', 'l’ouvrage', 'cet ouvrage', 'L’ouvrage']);
    expect(o.aReposer(1)).toBe('Un ouvrage est à reposer.');
    expect(o.aReposer(3)).toBe('3 ouvrages sont à reposer.');
    expect(o.accord('reposé')).toBe('reposé');
    const l = linkPhrases(LIAISON);
    expect([l.un, l.le, l.ce]).toEqual(['une liaison', 'la liaison', 'cette liaison']);
    expect(l.accord('reposé')).toBe('reposée');
    expect(linkPhrases({ nom: 'pont', pluriel: 'ponts', feminin: false }).ce).toBe('ce pont');
    expect([o.du, l.du, linkPhrases({ nom: 'pont', pluriel: 'ponts', feminin: false }).du]).toEqual(['de l’ouvrage', 'de la liaison', 'du pont']);
  });
});

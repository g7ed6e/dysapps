// Ce qui ne se coupe pas à l'affichage (keepTogether) : le texte reste le même, seuls les morceaux à garder ensemble
// sont marqués.
import { describe, expect, it } from 'vitest';
import { frenchTypography, gluedEnds, keepTogether } from './typography';

const kept = (text: string) => keepTogether(text).filter((r) => r.keep).map((r) => r.text);

describe('keepTogether', () => {
  it('garde la case à compléter avec le mot qui lui est collé, avec ou sans apostrophe', () => {
    expect(kept('ce métal conduit bien l’… et la chaleur')).toEqual(['l’…']);
    expect(kept('Il manque d’…')).toEqual(['d’…']);
    expect(kept("le bois isole de l'… ?")).toEqual(["l'…"]);
    expect(kept('les chat… dorment')).toEqual(['chat…']);
    expect(kept('le bois isole de la … et de la …')).toEqual(['…', '…']);
  });

  it('garde un mot composé et une inversion verbe-pronom, tous leurs traits d’union compris', () => {
    expect(kept('Quel élément du taille-crayon garde les copeaux ?')).toEqual(['taille-crayon']);
    expect(kept('Pourquoi le cadre est-il en aluminium ?')).toEqual(['est-il']);
    expect(kept('Que soulève-t-il ?')).toEqual(['soulève-t-il']);
    expect(kept('Que fait-on ? Que dit-on, a-t-on vu ?')).toEqual(['fait-on', 'dit-on', 'a-t-on']);
    expect(kept('Les États-Unis, en 52 av. J.-C.')).toEqual(['États-Unis', 'J.-C.']);
    expect(kept('un tiret - seul, 3-4 ou -il')).toEqual([]);
  });

  it('ne change pas le texte : les morceaux, mis bout à bout, le redonnent tel quel (la voix lit le même)', () => {
    for (const t of ['Le fil électrique est en cuivre, parce que ce métal conduit bien l’…', 'Que soulève-t-il ?', 'Sans rien.', '']) {
      expect(keepTogether(t).map((r) => r.text).join('')).toBe(t);
      expect(keepTogether(frenchTypography(t)).map((r) => r.text).join('')).toBe(frenchTypography(t));
    }
    expect(keepTogether('Que soulève-t-il ?').some((r) => r.text.includes('‑'))).toBe(false);
  });
});

describe('gluedEnds', () => {
  it('ce qui reste collé à une réponse posée dans la phrase', () => {
    expect(gluedEnds('ce métal conduit bien l’', ' et la chaleur.')).toEqual({ head: 'ce métal conduit bien ', tail: 'l’', lead: '', rest: ' et la chaleur.' });
    expect(gluedEnds('Il mange des ', 's.')).toEqual({ head: 'Il mange des ', tail: '', lead: 's.', rest: '' });
  });
});

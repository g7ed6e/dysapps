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
    expect(kept('Que fait-on ? Que dit-on, a-t-on vu ?')).toEqual(['fait-on', 'dit-on,', 'a-t-on']);
    expect(kept('Les États-Unis, en 52 av. J.-C.')).toEqual(['États-Unis,', 'J.-C.']);
    expect(kept('un tiret - seul, 3-4 ou -il')).toEqual([]);
  });

  it('prend avec lui la ponctuation et ce qu’une espace insécable lui colle : rien ne passe seul à la ligne à son bord', () => {
    expect(kept(frenchTypography('Pourquoi « est-il » là ? Que voit-on ?'))).toEqual(['«\u00a0est-il\u00a0»', 'voit-on\u00a0?']);
    expect(kept('(av. J.-C.). Fin')).toEqual(['J.-C.).']);
    expect(keepTogether('Le taille-crayon garde les copeaux.')).toEqual([
      { text: 'Le ', keep: false },
      { text: 'taille-crayon', keep: true },
      { text: ' garde les copeaux.', keep: false },
    ]);
  });

  it('ne change pas le texte : les morceaux, mis bout à bout, le redonnent tel quel (la voix lit le même)', () => {
    for (const t of ['Le fil électrique est en cuivre, parce que ce métal conduit bien l’…', 'Que soulève-t-il ?', 'Sans rien.', '']) {
      expect(keepTogether(t).map((r) => r.text).join('')).toBe(t);
      expect(keepTogether(frenchTypography(t)).map((r) => r.text).join('')).toBe(frenchTypography(t));
    }
    expect(keepTogether('Que soulève-t-il ?').some((r) => r.text.includes('‑'))).toBe(false);
  });
});

describe('frenchTypography', () => {
  it('tient le nombre et ce qu’il compte sur la même ligne, sans toucher aux nombres entre eux', () => {
    expect(frenchTypography('66 millions et 3 milliards')).toBe('66\u00a0millions et 3\u00a0milliards');
    expect(frenchTypography('À 12 h, il fait 30 °C : 50 % de plus, 2 €.')).toBe('À 12\u00a0h, il fait 30\u00a0°C\u00a0: 50\u00a0% de plus, 2\u00a0€.');
    expect(frenchTypography('2\u00a0000 mètres, 4,5 cm')).toBe('2\u00a0000\u00a0mètres, 4,5\u00a0cm');
    expect(frenchTypography('9 000 mètres, 3,5 kg')).toBe('9\u00a0000\u00a0mètres, 3,5\u00a0kg');
    expect(frenchTypography('5 000 = 100 000')).toBe('5\u00a0000 = 100\u00a0000');
    expect(frenchTypography('3 + 4 = 7 et 1 2 3, 12 3456')).toBe('3 + 4 = 7\u00a0et 1 2 3, 12 3456');
    expect(frenchTypography('Le chat dort.')).toBe('Le chat dort.');
  });
});

describe('gluedEnds', () => {
  it('ce qui reste collé à une réponse posée dans la phrase', () => {
    expect(gluedEnds('ce métal conduit bien l’', ' et la chaleur.')).toEqual({ head: 'ce métal conduit bien ', tail: 'l’', lead: '', rest: ' et la chaleur.' });
    expect(gluedEnds('Il mange des ', 's.')).toEqual({ head: 'Il mange des ', tail: '', lead: 's.', rest: '' });
    expect(gluedEnds('le bois isole de l’', '\u00a0? Oui.')).toEqual({ head: 'le bois isole de ', tail: 'l’', lead: '\u00a0?', rest: ' Oui.' });
  });
});

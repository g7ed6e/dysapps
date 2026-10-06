// Les boutons transparents posés sur les poignées dessinées dans le monde (GD-9, 6 octobre 2026) : chacun sur sa
// poignée, jamais sous 48 px, toujours dans la place libre ; la dernière place donnée aux boutons qui arrivent après
// elle ; et les touchers transmis à la 3D.
import { describe, expect, it } from 'vitest';
import { creerSuiviALEcran, placerLesBoutons } from './ArrangeHandles';
import type { ChoixALEcran } from './world/view';

const LIBRE = { x0: 0, y0: 80, x1: 800, y1: 500 };

describe('les boutons des poignées', () => {
  it('chacun sur sa poignée, aussi grand qu’elle, jamais sous 48 px', () => {
    const b: ChoixALEcran = {
      libre: LIBRE,
      poignees: [
        { cle: 'nord', x: 400, y: 200, w: 30, h: 20 },
        { cle: 'est', x: 500, y: 290, w: 80, h: 60 },
      ],
    };
    const p = placerLesBoutons(b);
    expect(p.get('nord')).toEqual({ x: 400, y: 200, w: 48, h: 48 });
    expect(p.get('est')).toEqual({ x: 500, y: 290, w: 80, h: 60 });
    expect(p.get('sud')).toBeUndefined();
  });

  it('au bord de l’écran, sous le bandeau : ramenés dans la place libre', () => {
    const p = placerLesBoutons({ libre: LIBRE, poignees: [{ cle: 'nord', x: 10, y: 60, w: 48, h: 48 }] });
    const n = p.get('nord')!;
    expect(n.x - n.w / 2).toBeGreaterThanOrEqual(LIBRE.x0);
    expect(n.y - n.h / 2).toBeGreaterThanOrEqual(LIBRE.y0);
  });

  it('les boutons qui arrivent reçoivent la dernière place ; les touchers vont à la 3D', () => {
    const suivi = creerSuiviALEcran();
    const b: ChoixALEcran = { libre: LIBRE, poignees: [{ cle: 'sud', x: 1, y: 2, w: 48, h: 48 }] };
    suivi.suivre(b);
    const recu: (ChoixALEcran | null)[] = [];
    const arreter = suivi.ecouter((x) => recu.push(x));
    suivi.suivre(null);
    arreter();
    suivi.suivre(b);
    expect(recu).toEqual([b, null]);
    const touches: string[] = [];
    const fin = suivi.touchers.ecouter((c) => touches.push(c));
    suivi.toucher('tourner');
    fin();
    suivi.toucher('nord');
    expect(touches).toEqual(['tourner']);
  });
});

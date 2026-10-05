import { maillageDuDecor } from '../decorMesh';
import { champDuSol } from '../landMesh';
import { ARCHIPELAGO_IDS } from '../map';
import { worldBounds } from '../terrain';
import { LOINTAINS } from './formes';
import { BORNES_DU_LOINTAIN, dessinerLointain, SANS_ELEMENT, type Lointain } from './lointain';
import { Pinceau } from './pinceau';

/** Les sommets d'un lointain dessiné seul. */
function sommets(l: Lointain, e = { minX: 0, maxX: 90, minY: 0, maxY: 90 }) {
  const P = new Pinceau();
  P.element = 7;
  dessinerLointain(P, e, l);
  const f = P.fin();
  expect(P.element).toBe(7);
  return f;
}

it('le lointain de chaque archipel reste dans ses bornes : loin derrière l’archipel, jamais plus haut que 30 blocs', () => {
  for (const a of ARCHIPELAGO_IDS) {
    const l = LOINTAINS[a];
    if (!l) continue;
    for (const p of l.pieces) {
      expect(p.recul, a).toBeGreaterThanOrEqual(BORNES_DU_LOINTAIN.recul[0]);
      expect(p.recul, a).toBeLessThanOrEqual(BORNES_DU_LOINTAIN.recul[1]);
      expect(p.haut, a).toBeGreaterThanOrEqual(BORNES_DU_LOINTAIN.haut[0]);
      expect(p.haut + (p.genre === 'gradins' && p.tour ? p.tour.haut + p.tour.cote : 0), a).toBeLessThanOrEqual(BORNES_DU_LOINTAIN.haut[1] + 8);
    }
    const e = worldBounds(a);
    const f = sommets(l, e);
    for (let i = 0; i < f.positions.length; i += 3) {
      // Aucun sommet au-dessus des îles : tout est au-delà du bord nord, moins la moitié de la plus large pièce.
      expect(f.positions[i + 2], a).toBeGreaterThan(e.maxY + BORNES_DU_LOINTAIN.recul[0] - 20);
      expect(f.positions[i + 1], a).toBeLessThanOrEqual(BORNES_DU_LOINTAIN.haut[1] + 8);
    }
  }
});

it('ses triangles n’ont pas d’élément : le toucher ne les retrouve pas', () => {
  const f = sommets({ graine: 't', pieces: [{ genre: 'cone', u: 0.5, recul: 80, haut: 20, rayon: 8, cratere: 1.5, pans: 8, couleur: 0x555555 }] });
  expect(f.elements.length).toBeGreaterThan(0);
  expect(new Set(f.elements)).toEqual(new Set([SANS_ELEMENT]));
});

it('une masse en gradins a son sommet plat ; `allonge` l’élargit le long de l’horizon', () => {
  const masse = (allonge?: number): Lointain => ({ graine: 'g', pieces: [{ genre: 'gradins', u: 0.5, recul: 80, haut: 24, rayon: 7, marche: 2.5, retrait: 0.6, pans: 7, couleur: 0x6895ad, sommet: 0x6f8f6a, allonge }] });
  const mesure = (f: ReturnType<typeof sommets>) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let haut = -Infinity;
    for (let i = 0; i < f.positions.length; i += 3) {
      minX = Math.min(minX, f.positions[i]);
      maxX = Math.max(maxX, f.positions[i]);
      haut = Math.max(haut, f.positions[i + 1]);
    }
    return { large: maxX - minX, haut };
  };
  const f = sommets(masse());
  const { large, haut } = mesure(f);
  expect(haut).toBeCloseTo(24);
  expect(mesure(sommets(masse(2))).large).toBeCloseTo(large * 2, 0);
  // Le sommet : des facettes horizontales tout en haut.
  let plat = 0;
  for (let i = 0; i < f.normals.length; i += 3) if (f.normals[i + 1] > 0.999 && Math.abs(f.positions[i + 1] - 24) < 1e-4) plat++;
  expect(plat).toBeGreaterThan(0);
});

it('le lointain va dans le maillage du décor, après ses éléments, sans appel de dessin de plus', () => {
  const champ = champDuSol('5e', [], []);
  const m = maillageDuDecor('5e', champ, []);
  expect(m.debutDuLointain).toBe(0);
  expect(m.decor.elements.length).toBeGreaterThan(0);
  expect(m.decor.elements.length).toBeLessThanOrEqual(1600);
  const sans = maillageDuDecor('6e', champDuSol('6e', [], []), []);
  expect(sans.debutDuLointain).toBe(sans.decor.elements.length);
});

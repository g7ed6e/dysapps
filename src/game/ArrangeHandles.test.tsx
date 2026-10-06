// Les flèches autour du choix (GD-9, 6 octobre 2026) : chacune à son côté, hors du choix ; resserrées autour d'un grand
// lieu ; toujours dans la place libre, sans se toucher, même au bord de l'écran ; et la dernière place du choix donnée
// aux flèches qui arrivent après elle.
import { describe, expect, it } from 'vitest';
import { creerSuiviALEcran, placerLesPoignees, RAYON, type Poignee } from './ArrangeHandles';
import type { ChoixALEcran } from './world/view';

const TAILLE = 48;
const POIGNEES: Poignee[] = [
  { cle: 'nord', dx: 0, dy: -1, w: TAILLE, h: TAILLE },
  { cle: 'sud', dx: 0, dy: 1, w: TAILLE, h: TAILLE },
  { cle: 'ouest', dx: -1, dy: 0, w: TAILLE, h: TAILLE },
  { cle: 'est', dx: 1, dy: 0, w: TAILLE, h: TAILLE },
  { cle: 'tourner', dx: 1, dy: -1, w: TAILLE, h: TAILLE },
  { cle: 'reunir', dx: 1, dy: 1, w: TAILLE, h: TAILLE },
];
const LIBRE = { x0: 0, y0: 80, x1: 800, y1: 500 };

function sansChevauchement(places: Map<string, { x: number; y: number }>) {
  const p = [...places.values()];
  for (let i = 0; i < p.length; i++)
    for (let j = i + 1; j < p.length; j++) expect(Math.abs(p[i].x - p[j].x) >= TAILLE || Math.abs(p[i].y - p[j].y) >= TAILLE).toBe(true);
}

function dansLaPlace(places: Map<string, { x: number; y: number }>) {
  for (const { x, y } of places.values()) {
    expect(x - TAILLE / 2).toBeGreaterThanOrEqual(LIBRE.x0);
    expect(x + TAILLE / 2).toBeLessThanOrEqual(LIBRE.x1);
    expect(y - TAILLE / 2).toBeGreaterThanOrEqual(LIBRE.y0);
    expect(y + TAILLE / 2).toBeLessThanOrEqual(LIBRE.y1);
  }
}

describe('les flèches autour du choix', () => {
  it('chacune à son côté, hors du choix', () => {
    const b: ChoixALEcran = { x: 400, y: 290, rx: 60, ry: 40, libre: LIBRE };
    const p = placerLesPoignees(b, POIGNEES, RAYON.tablette);
    expect(p.get('nord')!.y).toBeLessThan(b.y - b.ry);
    expect(p.get('sud')!.y).toBeGreaterThan(b.y + b.ry);
    expect(p.get('ouest')!.x).toBeLessThan(b.x - b.rx);
    expect(p.get('est')!.x).toBeGreaterThan(b.x + b.rx);
    expect(p.get('nord')!.x).toBe(b.x);
    expect(p.get('tourner')!.x).toBeGreaterThan(b.x);
    expect(p.get('tourner')!.y).toBeLessThan(b.y);
    expect(p.get('reunir')!.y).toBeGreaterThan(b.y);
    sansChevauchement(p);
    dansLaPlace(p);
  });

  it('autour d’un grand lieu, elles se resserrent (au téléphone plus encore)', () => {
    const b: ChoixALEcran = { x: 400, y: 290, rx: 600, ry: 600, libre: LIBRE };
    const tablette = placerLesPoignees(b, POIGNEES, RAYON.tablette);
    const telephone = placerLesPoignees(b, POIGNEES, RAYON.telephone);
    expect(b.x - tablette.get('ouest')!.x).toBeLessThanOrEqual(RAYON.tablette + TAILLE);
    expect(b.x - telephone.get('ouest')!.x).toBeLessThan(b.x - tablette.get('ouest')!.x);
  });

  it('au bord de l’écran, sous le bandeau : toujours dans la place libre, sans se toucher', () => {
    for (const [x, y] of [
      [10, 90],
      [790, 90],
      [10, 495],
      [790, 495],
      [400, 60],
    ]) {
      const p = placerLesPoignees({ x, y, rx: 20, ry: 20, libre: LIBRE }, POIGNEES, RAYON.telephone);
      dansLaPlace(p);
      sansChevauchement(p);
    }
  });

  it('les flèches qui arrivent reçoivent la dernière place du choix', () => {
    const suivi = creerSuiviALEcran();
    const b: ChoixALEcran = { x: 1, y: 2, rx: 3, ry: 4, libre: LIBRE };
    suivi.suivre(b);
    const recu: (ChoixALEcran | null)[] = [];
    const arreter = suivi.ecouter((x) => recu.push(x));
    suivi.suivre(null);
    arreter();
    suivi.suivre(b);
    expect(recu).toEqual([b, null]);
  });
});

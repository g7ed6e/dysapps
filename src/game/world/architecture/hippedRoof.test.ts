// Le toit en pavillon (./hippedRoof.ts) : un seul toit continu, sans trou ni recouvrement, d'une seule hauteur
// d'avant-toit, chaque morceau dans sa colonne ; la verrière au faîte, posée sur le pied du toit.
import { crownLantern, HIPPED_ROOF, roofOverColumn, type HippedRoof } from './hippedRoof';
import type { Facette } from './rooms';

// Le kiosque : un rang bas en disque de 7 (le centre à 3,5 ; la demi-largeur 3,5 ; les coins coupés à 4,5).
const ROOF: HippedRoof = { cx: 3.5, cy: 3.5, base: 4, half: 3.5, cut: 4.5 };

/** L'aire d'une facette vue d'en haut. */
const aireAPlat = (f: Facette) => Math.abs(f.points.reduce((s, p, i) => s + p[0] * f.points[(i + 1) % f.points.length][1] - f.points[(i + 1) % f.points.length][0] * p[1], 0) / 2);

/** La hauteur attendue du toit en un point : une seule surface, de l'avant-toit au pied de la verrière. */
function hauteur(x: number, y: number): number {
  const u = Math.abs(x - ROOF.cx);
  const v = Math.abs(y - ROOF.cy);
  const n = Math.max(u, v, (ROOF.half / ROOF.cut) * (u + v));
  return ROOF.base + HIPPED_ROOF.eave + (ROOF.half - n) * HIPPED_ROOF.slope;
}

const colonnes = Array.from({ length: 64 }, (_, i) => [i % 8, Math.floor(i / 8)] as const);
const morceaux = colonnes.map(([x, y]) => ({ x, y, f: roofOverColumn(ROOF, x, y) }));

describe('Le toit en pavillon', () => {
  it('couvre le plan d’un seul tenant : les pans ont l’aire du toit hors de la verrière, sans trou ni recouvrement', () => {
    const k = ROOF.half / ROOF.cut;
    // L'octogone du bord : le carré de 7, moins quatre coins de 2,5 × 2,5 / 2 ; celui de la verrière, de même à 1,2.
    const octogone = (n: number) => (2 * n) ** 2 - 2 * (2 * n - n / k) ** 2;
    const pans = morceaux.flatMap((m) => m.f).filter((f) => f.normale[2] > 0);
    // Aucun dessous : aucune caméra ne le voit.
    expect(morceaux.flatMap((m) => m.f).filter((f) => f.normale[2] < 0)).toEqual([]);
    expect(pans.reduce((s, f) => s + aireAPlat(f), 0)).toBeCloseTo(octogone(ROOF.half) - octogone(HIPPED_ROOF.crown), 6);
  });

  it('une seule surface : chaque point d’un pan est sur le pavillon, sans redan d’une case à l’autre', () => {
    for (const { f } of morceaux) for (const p of f.filter((x) => x.normale[2] > 0).flatMap((x) => x.points)) expect(p[2]).toBeCloseTo(hauteur(p[0], p[1]), 9);
  });

  it('l’avant-toit a une seule hauteur tout autour ; chaque morceau reste dans sa colonne', () => {
    for (const { x, y, f } of morceaux) {
      for (const g of f) for (const p of g.points) expect(p[0] >= x - 1e-9 && p[0] <= x + 1 + 1e-9 && p[1] >= y - 1e-9 && p[1] <= y + 1 + 1e-9).toBe(true);
      for (const g of f.filter((x) => x.normale[2] === 0)) expect(Math.max(...g.points.map((p) => p[2])) - ROOF.base).toBeCloseTo(HIPPED_ROOF.eave, 9);
    }
    // Hors du toit : rien.
    expect(roofOverColumn(ROOF, 7, 7)).toEqual([]);
    expect(roofOverColumn(ROOF, 6, 6)).toEqual([]);
  });

  it('des facettes de trois ou quatre sommets, à la normale unitaire ; la verrière posée sur le pied du toit, basse', () => {
    const toutes = [...morceaux.flatMap((m) => m.f), ...crownLantern(ROOF)];
    for (const f of toutes) {
      expect(f.points.length === 3 || f.points.length === 4).toBe(true);
      expect(Math.hypot(...f.normale)).toBeCloseTo(1, 9);
    }
    const verriere = crownLantern(ROOF);
    const z = verriere.flatMap((f) => f.points.map((p) => p[2]));
    expect(Math.min(...z)).toBeCloseTo(hauteur(ROOF.cx + HIPPED_ROOF.crown, ROOF.cy), 9);
    expect(Math.max(...z) - Math.min(...z)).toBeCloseTo(HIPPED_ROOF.lantern.height, 9);
    // 8 côtés et un dessus en trois quadrilatères : 22 triangles.
    expect(verriere.reduce((n, f) => n + f.points.length - 2, 0)).toBe(22);
  });
});

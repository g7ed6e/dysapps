// Les nappes des sommets des Îles du Ciel (DA-35) : chacune la sienne, jamais des halos identiques alignés comme les îles,
// et jamais sur une autre île, un îlot ni un pont.
import { describe, expect, it } from 'vitest';
import { ALTITUDE, type ArchipelagoId } from '../map';
import { mistPatches } from '../terrain';
import { bordDesNappes, ilesDesNappes, NAPPES_3E, nappesDesSommets, nappesPosees, VARIATION_DES_NAPPES } from './mist';

describe('les nappes des sommets (3e)', () => {
  const nappes = nappesPosees('3e');
  const V = VARIATION_DES_NAPPES;

  it('une nappe par île haute, au même nombre de triangles qu’avant (14 pans, 3 triangles par pan)', () => {
    expect(nappes.length).toBe(mistPatches('3e').length);
    expect(nappesDesSommets('3e')!.indices.length / 3).toBe(nappes.length * NAPPES_3E.pans * 3);
  });

  it('chacune la sienne : centre décalé, taille, opacité et pans tirés, pas deux pareilles', () => {
    const patches = mistPatches('3e');
    nappes.forEach((n, i) => {
      expect(Math.abs(n.x - patches[i].x)).toBeLessThanOrEqual(V.decalage);
      expect(Math.abs(n.y - patches[i].y)).toBeLessThanOrEqual(V.decalage);
      expect(n.opacite).toBeGreaterThanOrEqual(V.opacite[0]);
      expect(n.opacite).toBeLessThanOrEqual(V.opacite[1]);
      expect(n.opacite).toBeLessThanOrEqual(NAPPES_3E.opacite);
      for (const r of n.rayons) {
        expect(r).toBeGreaterThanOrEqual(V.minimum);
        expect(r).toBeLessThanOrEqual(V.echelle[1] * (1 + V.pans));
      }
      // Les pans d'une nappe ne sont pas tous du même rayon : pas de disque régulier.
      expect(Math.max(...n.rayons) - Math.min(...n.rayons)).toBeGreaterThan(0.05);
    });
    // Des opacités et des décalages variés d'une nappe à l'autre.
    expect(new Set(nappes.map((n) => n.opacite.toFixed(3))).size).toBe(nappes.length);
    const ecarts = nappes.map((n, i) => `${(n.x - patches[i].x).toFixed(2)},${(n.y - patches[i].y).toFixed(2)}`);
    expect(new Set(ecarts).size).toBe(nappes.length);
    // Pas tous du même côté : le décalage n'est pas un glissement d'ensemble.
    expect(new Set(nappes.map((n, i) => Math.sign(n.x - patches[i].x))).size).toBeGreaterThan(1);
  });

  it('jamais sur une autre île, un îlot ni un pont : le bord et le milieu de chaque côté restent libres', () => {
    const libre = bordDesNappes('3e');
    nappes.forEach((n, i) => {
      const bord = (j: number) => {
        const a = (j / NAPPES_3E.pans) * Math.PI * 2;
        return { x: n.x + Math.cos(a) * n.rx * n.rayons[j], y: n.y + Math.sin(a) * n.ry * n.rayons[j] };
      };
      for (let j = 0; j < NAPPES_3E.pans; j++) {
        const p = bord(j);
        const q = bord((j + 1) % NAPPES_3E.pans);
        expect(libre(i, p.x, p.y)).toBe(true);
        expect(libre(i, (p.x + q.x) / 2, (p.y + q.y) / 2)).toBe(true);
      }
    });
  });

  it('reproductibles : les mêmes nappes à chaque calcul', () => {
    expect(nappesPosees('3e')).toEqual(nappes);
  });
});

it('chaque nappe se règle sur son île : mistPatches et ilesDesNappes se répondent, dans chaque archipel qui a des nappes', () => {
  const avecNappes = (Object.keys(ALTITUDE) as ArchipelagoId[]).filter((a) => mistPatches(a).length > 0);
  expect(avecNappes).toContain('3e');
  for (const a of avecNappes) {
    const boites = ilesDesNappes(a);
    const patches = mistPatches(a);
    expect(boites.length).toBe(patches.length);
    patches.forEach((m, i) => {
      expect(m.x).toBeGreaterThanOrEqual(boites[i].x0);
      expect(m.x).toBeLessThanOrEqual(boites[i].x1);
      expect(m.y).toBeGreaterThanOrEqual(boites[i].y0);
      expect(m.y).toBeLessThanOrEqual(boites[i].y1);
    });
  }
});

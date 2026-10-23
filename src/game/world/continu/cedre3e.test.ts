// Le Détour du Cèdre (les Prairies du 3e, GD-25, lot 4) : sa place réservée au milieu de la plus petite Prairie, hors des
// chemins, loin des lieux et des rives ; sa sente depuis le chemin des Ondes, libre et marchable ; la vue au nord, le
// cèdre à gauche, la petite arche et le Palais dans le cadre, rien de lui dans l'axe ; ses plateaux étagés, un peu
// décalés ; trois pierres ; ses 175 triangles, sa sauvegarde, la phrase de Kéo.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { BERGERIE } from './bergerie3e';
import { COMMON_DETOUR_VIEW } from './camera';
import { CADRAN } from './cadran3e';
import { CEDRE, CEDRE_BUDGET, CEDRE_LAYOUT, CEDRE_STONES, TIERS, cedreFacets, cedreStoneAt } from './cedre3e';
import { LAC } from './lac3e';
import { DETOURS_3E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import type { Facets } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2 } from './geometry';
import { NETWORK_3E } from './paths3e';
import { C3E } from './place3eKit';
import { DETOUR_SPOTS_3E, PATH_EDGES_3E, PLACES_3E, TERRAIN_3E } from './plan3e';
import { buildHeightField3e, ground3e, landDistance3e, obstaclesIn3e, walkBlocked3e } from './terrain3e';

const ground = ground3e(buildHeightField3e());
const node = (id: string) => NETWORK_3E.pathNode(id).at;
const EDGES = PATH_EDGES_3E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: Vec2) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));
const capTo = (from: Vec2, to: Vec2) => ((Math.atan2(to.x - from.x, -(to.z - from.z)) * 180) / Math.PI + 360) % 360;
/** La caméra des Détours, à une douzaine d'unités derrière Kéo, dans l'axe de la vue (au nord). */
const CAMERA = { x: CEDRE.at.x, z: CEDRE.at.z + 12 };
/** Le cap de `to` vu de la caméra, moins celui de la vue, en degrés de −180 à 180 (positif : à droite). */
const offView = (to: Vec2) => ((capTo(CAMERA, to) + 540) % 360) - 180;
/** Le demi-champ de la tablette (4:3, 56° en hauteur), en degrés. */
const HALF_TABLET = (Math.atan(Math.tan((28 * Math.PI) / 180) * (4 / 3)) * 180) / Math.PI;

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3)
    if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

describe('Le Cèdre, le Détour des Prairies', () => {
  it('se nomme « Le Cèdre », aux Prairies, dans la sauvegarde à la fin ; Kéo dit sa phrase, écrite sous le nom', () => {
    expect(detourById('cedre')).toBe(CEDRE);
    expect(DETOURS_3E).toEqual([CADRAN, BERGERIE, CEDRE, LAC]);
    expect(CEDRE.name).toBe('Le Cèdre');
    expect(CEDRE.land).toBe('prairies');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-2)).toBe('cedre');
    expect(sanitizeDetours(['cedre', 'cadran'])).toEqual(['cadran', 'cedre']);
    expect(CEDRE.says).toBe('Un seul arbre, et toute la montagne en face.');
    expect(CEDRE.saysAloudOnly).toBeUndefined();
    expect(CEDRE.says).not.toMatch(/vide|chute|tomb|vertige|phare/i);
  });

  it('se tient près de sa place réservée, hors des chemins, loin des lieux et des rives', () => {
    const at = CEDRE.at;
    expect(distance(at, DETOUR_SPOTS_3E.cedre)).toBeLessThanOrEqual(8);
    expect(walkBlocked3e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(8);
    expect(pathDistance(DETOUR_SPOTS_3E.cedre)).toBeGreaterThan(8);
    for (const p of PLACES_3E) expect(distance(p.center, at), p.id).toBeGreaterThan(20);
    expect(landDistance3e(at)).toBeGreaterThan(5);
    for (const t of CEDRE_LAYOUT.tiers) expect(landDistance3e(t)).toBeGreaterThan(t.r + 2);
    expect(detourAtPoint(at, '3e')).toBe(CEDRE);
    expect(detourAtPoint(at, '4e')).toBeNull();
  });

  it('à l’arrivée, la caméra se tourne au nord : le cèdre à droite, la petite arche et le Palais dans le cadre, rien du cèdre dans l’axe ni devant le Palais', () => {
    const cap = detourCap(CEDRE)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const deg = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(Math.min(deg, 360 - deg)).toBeLessThan(1e-6);
    const palais = offView(PLACES_3E.find((p) => p.id === 'palais')!.center);
    expect(Math.abs(palais)).toBeLessThan(HALF_TABLET - 8);
    const arch = {
      x: (node('sa2-a').x + node('sa2-b').x) / 2,
      z: (node('sa2-a').z + node('sa2-b').z) / 2,
    };
    expect(Math.abs(offView(arch))).toBeLessThan(HALF_TABLET - 8);
    expect(offView(CEDRE_LAYOUT.spot)).toBeGreaterThan(8);
    expect(offView(CEDRE_LAYOUT.spot)).toBeLessThan(HALF_TABLET - 4);
    // Le bord gauche de chaque plateau reste à droite de l'axe de Kéo, et à droite du Palais vu de la caméra.
    for (const t of CEDRE_LAYOUT.tiers) {
      expect(t.x - t.r - CEDRE.at.x).toBeGreaterThan(0.5);
      expect(offView({ x: t.x - t.r, z: t.z })).toBeGreaterThan(palais + 2);
    }
    expect(detourViewOf(CEDRE).height).toBeLessThanOrEqual(COMMON_DETOUR_VIEW.height);
  });

  it('des plateaux étagés, du plus large au plus petit, chacun un peu décalé : ce n’est pas un sapin', () => {
    for (let k = 1; k < TIERS.length; k++) {
      expect(TIERS[k].r).toBeLessThan(TIERS[k - 1].r);
      expect(TIERS[k].y).toBeGreaterThan(TIERS[k - 1].y + TIERS[k - 1].t + 0.3);
      expect(Math.hypot(TIERS[k].dx - TIERS[k - 1].dx, TIERS[k].df - TIERS[k - 1].df)).toBeGreaterThan(0.2);
    }
    // Des plateaux larges et plats : plus de cinq fois plus larges qu'épais.
    for (const t of TIERS.slice(0, -1)) expect((2 * t.r) / t.t).toBeGreaterThan(5);
    expect(CEDRE_LAYOUT.trunk.r0).toBeGreaterThan(0.5);
  });

  it('sa sente part du chemin des Ondes, et reste libre et marchable, loin du tronc', () => {
    const [start, end] = CEDRE.sente;
    expect(distanceToPolyline(start, [node('sa2-a'), node('sa2-b'), node('ondes')])).toBeLessThan(0.3);
    expect(end).toEqual(CEDRE.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = {
        x: start.x + ((end.x - start.x) * t) / len,
        z: start.z + ((end.z - start.z) * t) / len,
      };
      expect(walkBlocked3e(p), `${t}`).toBe(false);
    }
    expect(CEDRE_LAYOUT.clearOfSente(CEDRE_LAYOUT.spot)).toBeGreaterThan(2);
    const tile = TERRAIN_3E.step * TERRAIN_3E.tileCells;
    const spot = CEDRE_LAYOUT.spot;
    const xs = [Math.min(start.x, end.x, spot.x) - 10, Math.max(start.x, end.x, spot.x) + 10];
    const zs = [Math.min(start.z, end.z, spot.z) - 10, Math.max(start.z, end.z, spot.z) + 10];
    for (let tx = Math.floor((xs[0] - TERRAIN_3E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_3E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_3E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_3E.minZ) / tile); tz++)
        for (const o of obstaclesIn3e(tx, tz)) {
          expect(distanceToPolyline(o, CEDRE.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, spot) - o.r, `${o.x},${o.z}`).toBeGreaterThan(4);
        }
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus', () => {
    const sides = new Set<number>();
    for (let k = 0; k < CEDRE_STONES.length; k++) {
      const p = cedreStoneAt(k);
      expect(distanceToPolyline(p, CEDRE.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, CEDRE.at), String(k)).toBeLessThan(4);
      sides.add(Math.sign(CEDRE_STONES[k].deg));
    }
    expect(sides.size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente ; ni lanterne, ni bronze, rien de presque noir ; la sente se trace une fois trouvée', () => {
    const hidden = cedreFacets(false, ground);
    expect(CEDRE_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(CEDRE_BUDGET.triangles);
    expect(countColor(hidden, C3E.lantern)).toBe(0);
    expect(countColor(hidden, C3E.bronze)).toBe(0);
    for (const c of Object.values(CEDRE_LAYOUT.colors)) expect(Math.max((c >> 16) & 255, (c >> 8) & 255, c & 255), c.toString(16)).toBeGreaterThan(0x60);
    const traced = cedreFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(CEDRE_BUDGET.sente);
  });
});

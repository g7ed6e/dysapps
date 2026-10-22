// Le Détour du Replat (les Coteaux du 4e, rattaché à la Veillée) : sa place sur l'épaule ouest du cône, hors des
// chemins, descendue de la place réservée pour voir l'usine ; la pente adoucie autour de Kéo, toujours marchable ; sa
// sente depuis le chemin de la Veillée ; la vue au cap de 105°, la Forge entière un peu à gauche ; son muret en arc ouvert
// de huit blocs jointifs, sa lanterne allumée, ses trois pierres ; ses 175 triangles, sa sauvegarde, la phrase de la voix.
import { describe, expect, it } from 'vitest';
import { DETOUR_IDS as SAVED_IDS, sanitizeDetours } from '../../engine/detours';
import { DETOURS_4E, DETOUR_IDS, detourAtPoint, detourById, detourCap, detourViewOf } from './detours';
import { EPAVE } from './epave4e';
import { RECOIN } from './recoin4e';
import { DALLE } from './dalle4e';
import { followPose } from './camera';
import type { Facets } from './facets';
import { FREE_WALK } from './freeWalk';
import { distance, distanceToPolyline, linearRgb } from './geometry';
import { NETWORK_4E } from './paths4e';
import { modelOfPlace } from './places';
import { C4E } from './place4eKit';
import { DETOUR_SPOTS_4E, PATH_EDGES_4E, PLACES_4E, REPLAT_4E, TERRAIN_4E, inReplatClearing } from './plan4e';
import { REPLAT, REPLAT_BUDGET, REPLAT_LAYOUT, REPLAT_STONES, replatFacets, replatStoneAt } from './replat4e';
import { standingHeight } from './terrain';
import { buildHeightField4e, groundOn4e, heightAt4e, obstaclesIn4e, walkBlocked4e } from './terrain4e';

const field = buildHeightField4e();
const ground = (x: number, z: number) => groundOn4e(field, x, z);
const node = (id: string) => NETWORK_4E.pathNode(id).at;
const EDGES = PATH_EDGES_4E.map(([a, b]) => [node(a), node(b)]);
const pathDistance = (p: { x: number; z: number }) => Math.min(...EDGES.map((l) => distanceToPolyline(p, l)));

function countColor(f: Facets, color: number): number {
  const [r, g, b] = linearRgb(color);
  let n = 0;
  for (let i = 0; i < f.colors.length; i += 3) if (Math.abs(f.colors[i] - r) < 1e-4 && Math.abs(f.colors[i + 1] - g) < 1e-4 && Math.abs(f.colors[i + 2] - b) < 1e-4) n++;
  return n;
}

/** La pente du sol en un point, sur un pas de la grille. */
const slopeAt = (p: { x: number; z: number }) => {
  const e = TERRAIN_4E.step / 2;
  return Math.hypot(heightAt4e({ x: p.x + e, z: p.z }) - heightAt4e({ x: p.x - e, z: p.z }), heightAt4e({ x: p.x, z: p.z + e }) - heightAt4e({ x: p.x, z: p.z - e })) / (2 * e);
};

describe('Le Replat, le Détour des Coteaux', () => {
  it('se nomme « Le Replat », aux Coteaux, dans la sauvegarde après l’Épave, le Recoin et la Dalle ; sa phrase est seulement lue', () => {
    expect(detourById('replat')).toBe(REPLAT);
    expect(DETOURS_4E).toEqual([EPAVE, RECOIN, DALLE, REPLAT]);
    expect(REPLAT.name).toBe('Le Replat');
    expect(REPLAT.land).toBe('coteaux');
    expect(SAVED_IDS).toEqual(DETOUR_IDS);
    expect(DETOUR_IDS.at(-1)).toBe('replat');
    expect(DETOUR_IDS.at(-2)).toBe('dalle');
    expect(sanitizeDetours(['replat', 'dalle', 'recoin', 'epave'])).toEqual(['epave', 'recoin', 'dalle', 'replat']);
    expect(REPLAT.says).toBe('Un replat, c’est un endroit plat dans une pente.');
    expect(REPLAT.saysAloudOnly).toBe(true);
  });

  it('se tient sur l’épaule ouest du cône, hors des chemins, à 8 u au plus de sa place réservée, plus bas qu’elle', () => {
    const at = REPLAT.at;
    expect(distance(at, DETOUR_SPOTS_4E.replat)).toBeLessThanOrEqual(8);
    expect(heightAt4e(at)).toBeLessThan(heightAt4e(DETOUR_SPOTS_4E.replat));
    expect(at.z).toBeGreaterThan(DETOUR_SPOTS_4E.replat.z);
    expect(heightAt4e(at)).toBeGreaterThan(8);
    expect(walkBlocked4e(at)).toBe(false);
    expect(pathDistance(at)).toBeGreaterThan(25);
    for (const p of PLACES_4E) expect(distance(p.center, at), p.id).toBeGreaterThan(25);
    const veillee = PLACES_4E.find((p) => p.id === 'veillee')!.center;
    expect(distance(veillee, at)).toBeGreaterThan(30);
    expect(distance(veillee, at)).toBeLessThan(45);
    expect(detourAtPoint(at, '4e')).toBe(REPLAT);
    expect(detourAtPoint(at, '5e')).toBeNull();
  });

  it('la terrasse est vraiment plate autour de Kéo, jusqu’au muret et au-delà (retouche 1), dans le sol dessiné aussi', () => {
    const M = REPLAT_LAYOUT.muret;
    const y0 = ground(REPLAT.at.x, REPLAT.at.z);
    for (let r = 0; r <= M.r + M.t / 2; r += 0.25)
      for (let a = 0; a < 360; a += 15) {
        const p = { x: REPLAT.at.x + r * Math.cos((a * Math.PI) / 180), z: REPLAT.at.z + r * Math.sin((a * Math.PI) / 180) };
        // Une pente de moins d'un dixième (le flanc : 0,67), mesurée sur un pas de la grille.
        expect(slopeAt(p), `${r} ${a}`).toBeLessThan(0.1);
        // Le sol dessiné (la grille, qui lisse sur ses mailles) : à moins de la moitié de la hauteur du muret de Kéo.
        expect(Math.abs(ground(p.x, p.z) - y0), `${r} ${a}`).toBeLessThan(M.h / 2);
      }
  });

  it('la pente s’adoucit autour de Kéo (le replat) et reste marchable autour de lui', () => {
    const steep = slopeAt({ x: REPLAT.at.x + 14, z: REPLAT.at.z });
    expect(slopeAt(REPLAT.at)).toBeLessThan(steep * 0.6);
    for (let r = 0; r <= 12; r += 1)
      for (let a = 0; a < 360; a += 30) {
        const p = { x: REPLAT.at.x + r * Math.cos((a * Math.PI) / 180), z: REPLAT.at.z + r * Math.sin((a * Math.PI) / 180) };
        expect(slopeAt(p), `${r} ${a}`).toBeLessThan(FREE_WALK.slope);
      }
  });

  it('à l’arrivée, la caméra se tourne au cap de 105° (à 45° au moins du soleil) et ne monte pas', () => {
    const cap = detourCap(REPLAT)!;
    const look = { x: -Math.sin(cap), z: -Math.cos(cap) };
    const deg = ((Math.atan2(look.x, -look.z) * 180) / Math.PI + 360) % 360;
    expect(deg).toBeCloseTo(105, 6);
    expect(Math.abs(deg - 153)).toBeGreaterThanOrEqual(45);
    expect(detourViewOf(REPLAT).height).toBeLessThanOrEqual(0);
  });

  it('la Forge se voit au-dessus du flanc, ses quatre cinquièmes du haut au moins, un peu à gauche du cap', () => {
    const at = REPLAT.at;
    // L'œil : la caméra de l'arrivée, toute la vue du Replat montée, derrière Kéo.
    const cam = followPose({ x: at.x, y: standingHeight(heightAt4e(at)), z: at.z }, 0, undefined, detourCap(REPLAT)!, 1, undefined, detourViewOf(REPLAT)).position;
    const eye = cam.y;
    const forge = PLACES_4E.find((p) => p.id === 'forge')!;
    const fg = standingHeight(heightAt4e(forge.center));
    // Rien du sol entre l'œil et la Forge, dès le cinquième de sa hauteur.
    const low = fg + modelOfPlace('forge').top * 0.2;
    for (let k = 3; k < 290; k++) {
      const u = k / 300;
      const x = cam.x + (forge.center.x - cam.x) * u,
        z = cam.z + (forge.center.z - cam.z) * u;
      expect(heightAt4e({ x, z }), `${u}`).toBeLessThan(eye + (low - eye) * u);
    }
    const bearing = ((Math.atan2(forge.center.x - at.x, -(forge.center.z - at.z)) * 180) / Math.PI + 360) % 360;
    expect(bearing).toBeLessThan(105);
    expect(bearing).toBeGreaterThan(105 - 20);
  });

  it('sa sente part du chemin de cot-3 à la Veillée, et reste libre et marchable, sans un buisson ni un rocher', () => {
    const [start, end] = REPLAT.sente;
    expect(distanceToPolyline(start, [node('cot-3'), node('veillee')])).toBeLessThan(0.3);
    expect(end).toEqual(REPLAT.at);
    const len = distance(start, end);
    for (let t = 0; t <= len; t += 0.5) {
      const p = { x: start.x + ((end.x - start.x) * t) / len, z: start.z + ((end.z - start.z) * t) / len };
      expect(walkBlocked4e(p), `${t}`).toBe(false);
      expect(slopeAt(p), `${t}`).toBeLessThan(FREE_WALK.slope);
      expect(inReplatClearing(p)).toBe(true);
    }
    const tile = TERRAIN_4E.step * TERRAIN_4E.tileCells;
    const xs = [Math.min(start.x, end.x) - 8, Math.max(start.x, end.x) + 8];
    const zs = [Math.min(start.z, end.z) - 8, Math.max(start.z, end.z) + 8];
    for (let tx = Math.floor((xs[0] - TERRAIN_4E.minX) / tile); tx <= Math.floor((xs[1] - TERRAIN_4E.minX) / tile); tx++)
      for (let tz = Math.floor((zs[0] - TERRAIN_4E.minZ) / tile); tz <= Math.floor((zs[1] - TERRAIN_4E.minZ) / tile); tz++)
        for (const o of obstaclesIn4e(tx, tz)) {
          expect(distanceToPolyline(o, REPLAT.sente) - o.r, `${o.x},${o.z}`).toBeGreaterThan(0.8);
          expect(distance(o, REPLAT.at) - o.r, `${o.x},${o.z}`).toBeGreaterThan(REPLAT_LAYOUT.muret.r + 1);
        }
    // Elle monte vers le Replat.
    expect(heightAt4e(end)).toBeGreaterThan(heightAt4e(start) + 5);
    expect(REPLAT_4E.senteFrom).toEqual(start);
  });

  it('le muret : huit blocs jointifs en arc ouvert du côté où la pente descend, la sente entre deux ; haut de 0,5', () => {
    const M = REPLAT_LAYOUT.muret;
    expect(M.blocks).toHaveLength(8);
    // Il se lit en arc (retouche 1) : des blocs jointifs, chacun la corde de sa part d'arc, sauf au passage de la sente.
    const chord = (deg: number) => 2 * M.r * Math.sin((deg * Math.PI) / 360);
    for (let k = 1; k < M.blocks.length; k++) {
      const step = M.blocks[k] - M.blocks[k - 1];
      if (M.blocks[k - 1] < 0 && M.blocks[k] > 0) continue;
      expect(M.len, String(k)).toBeGreaterThanOrEqual(chord(step));
      expect(M.len, String(k)).toBeLessThan(chord(step) + 0.2);
    }
    expect(Math.max(...M.blocks) - Math.min(...M.blocks)).toBeGreaterThanOrEqual(150);
    expect(M.h).toBe(0.5);
    for (const deg of M.blocks) {
      const p = REPLAT_LAYOUT.around(deg, M.r);
      // Plus bas que Kéo : du côté où la pente descend.
      expect(heightAt4e(p), String(deg)).toBeLessThan(heightAt4e(REPLAT.at) + 0.05);
      expect(distanceToPolyline(p, REPLAT.sente) - M.len / 2, String(deg)).toBeGreaterThan(0.6);
    }
    expect(M.blocks.some((d) => d < 0) && M.blocks.some((d) => d > 0)).toBe(true);
  });

  it('ses trois pierres entourent Kéo, de part et d’autre de la sente, jamais dessus', () => {
    const sides = new Set<number>();
    for (let k = 0; k < REPLAT_STONES.length; k++) {
      const p = replatStoneAt(k);
      expect(distanceToPolyline(p, REPLAT.sente), String(k)).toBeGreaterThan(1);
      expect(distance(p, REPLAT.at), String(k)).toBeLessThan(4);
      sides.add(Math.sign(REPLAT_STONES[k].deg));
    }
    expect(sides.size).toBe(2);
  });

  it('coûte 175 triangles au plus sans sa sente, sa lanterne d’ocre allumée dès le départ ; la sente se trace une fois trouvée', () => {
    const hidden = replatFacets(false, ground);
    expect(REPLAT_BUDGET.triangles).toBe(175);
    expect(hidden.triangles).toBeLessThanOrEqual(REPLAT_BUDGET.triangles);
    expect(countColor(hidden, C4E.lantern)).toBe(30);
    // Ni fer, ni orange : un poteau de bois gris.
    expect(countColor(hidden, C4E.iron)).toBe(0);
    const traced = replatFacets(true, ground);
    expect(traced.triangles).toBeGreaterThan(hidden.triangles);
    expect(traced.triangles - hidden.triangles).toBeLessThanOrEqual(REPLAT_BUDGET.sente);
  });
});

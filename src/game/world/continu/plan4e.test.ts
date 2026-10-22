// Le monde ouvert du 4e (lot 1, « l'île entière en grandes masses ») : ses seize lieux, ses quatre terres et leurs trois
// passages, le volcan, la coulée figée, le ravin sec et le bassin à flot, la lave figée seulement au cratère et dans la
// cuvette, les rails, ses couleurs (jamais presque noires), la marche libre, et son budget. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { LINK_PRICE, islandsOf } from '../archipelago';
import { OPEN_WORLD_BUDGETS, PLACE_TRIANGLES_MAX_4E, mapCost4e, openWorldCost4e } from './budget';
import { BRIDGE, bridgeSite } from './bridges';
import { CRIQUE_SITE, NEF_4E, criqueDecorFacets, nef4eFlight } from './crique4e';
import { EPAVE_BUDGET } from './epave4e';
import { followPose, keepFeetAbove, screenOf } from './camera';
import { distance, distanceToPolyline, insidePolygon, linearRgb, type Vec2 } from './geometry';
import { bridgeEdge, landOf, landPrice, linkedLands, nodeLands } from './lands';
import { levelWorld } from './levelWorld';
import { planFor } from './levelPlan';
import { modelOfPlace } from './places';
import { CUT_CLEARANCE_4E, NETWORK_4E, pathRibbons4e } from './paths4e';
import { COLORS_4E, CRIQUE_PAD, CUVETTE_4E, DEPARTURE_4E, LINKS_4E, PATH_EDGES_4E, RAILS_4E, SUMMIT_4E, VOLCANO_4E, criqueFloor } from './plan4e';
import { COLORS_6E } from './plan6e';
import { SKY_OF } from './sky';
import { WATER_TONES_4E, seaPixels4e } from './sea';
import { FLORA_4E_COLORS, buildHeightField4e, couleeClearance, groundOn4e, heightAt4e, landDistance4e, lavaFacets, ravinClearance, summitMapHatch, tileFacets4e, walkBlocked4e } from './terrain4e';
import { buildWalkGrid } from './freeWalk';
import { TERRAIN_4E } from './plan4e';

const PLAN = planFor('4e');
const LINKED = linkedLands(PLAN);
const node = (id: string): Vec2 => NETWORK_4E.pathNode(id).at;
const isPassage = (a: string, b: string) => Object.values(LINKS_4E).some(({ bridge: [u, v] }) => (u === a && v === b) || (u === b && v === a));

/** La luminance relative d'une couleur linéaire : au-dessus de tant, rien n'est presque noir. */
const luminance = ([r, g, b]: readonly number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const NOT_BLACK = 0.03;

/**
 * Le plafond du 4e après son lot 2, la Forge (mesuré le 21 octobre 2026 : 67 656 triangles et 17 appels la scénette de la
 * Forge ouverte, 60 560 et 14 hors scénette, 59 438 et 15 au départ, 57 289 et 12 sur la Carte ; au lot 1, 59 624 et 14
 * dans le monde), avec sa marge : relevé de 64 000 et 16 appels pour la scénette et la chaudronnière en modèle (8 000
 * triangles, un appel).
 */
const LOT2_CEILING = { triangles: 72_000, calls: 18 } as const;

/**
 * Le plafond du 4e avec la Soute, la Porte et l'Étalon (lot 2) : celui de la Forge, relevé de 2 000 triangles pour
 * la Soute et la Porte (à la place de leurs ruines simples, leurs traces comprises) et d'un lieu du 4e au plus chargé
 * pour l'Étalon (`PLACE_TRIANGLES_MAX_4E`), et du budget du Détour de l'Épave et de sa sente (`EPAVE_BUDGET`) ; aucun appel
 * de plus (une seule scénette ouverte à la fois, l'Épave dans le maillage des lieux). Mesuré le
 * 21 octobre 2026, après la retouche 2 (le toit de la salle de la Porte, la coque de l'Épave) : 71 045 triangles et 17
 * appels la scénette ouverte, 63 623 et 14 hors scénette, 62 501 et 15 au départ, 60 432 et 12 sur la Carte (avant :
 * 70 943, 63 521, 62 399 et 60 330).
 */
const LOT2_FABRIQUES_CEILING = { triangles: LOT2_CEILING.triangles + 2_000 + PLACE_TRIANGLES_MAX_4E + EPAVE_BUDGET.triangles + EPAVE_BUDGET.sente, calls: LOT2_CEILING.calls } as const;

/**
 * Le plafond du 4e avec le Gabarit (lot 3, le Bastion) : celui des Fabriques, relevé d'un lieu du 4e au plus chargé
 * (`PLACE_TRIANGLES_MAX_4E`, à la place de sa ruine simple) ; aucun appel de plus. Le pont tournant du bassin coûte moins
 * que le pont sur pieds qu'il remplace. Mesuré le 22 octobre 2026 : 71 680 triangles et 17 appels la scénette ouverte,
 * 64 066 et 14 hors scénette, 63 136 et 15 au départ, 61 067 et 12 sur la Carte.
 */
const LOT3_GABARIT_CEILING = { triangles: LOT2_FABRIQUES_CEILING.triangles + PLACE_TRIANGLES_MAX_4E, calls: LOT2_FABRIQUES_CEILING.calls } as const;

/** Les couleurs d'un maillage. */
function colorsOf(f: { colors: Float32Array }): Set<string> {
  const out = new Set<string>();
  for (let k = 0; k < f.colors.length; k += 3) out.add(`${f.colors[k].toFixed(4)},${f.colors[k + 1].toFixed(4)},${f.colors[k + 2].toFixed(4)}`);
  return out;
}
const key = (c: number) => linearRgb(c).map((v) => v.toFixed(4)).join(',');

describe('Le plan du 4e', () => {
  it('seize lieux aux identifiants fixés (ceux des habitants `4e-habitant-<id>`), chacun dans une terre et une seule', () => {
    expect(PLAN.places.map((p) => p.id)).toEqual(['forge', 'soute', 'porte', 'etalon', 'gabarit', 'manufacture', 'loge', 'chariot', 'herbier', 'roches', 'jonction', 'veillee', 'basilique', 'terminus', 'orgues', 'dynamo']);
    const all = PLAN.lands.flatMap((l) => l.places);
    expect(new Set(all)).toEqual(new Set(PLAN.places.map((p) => p.id)));
    expect(all).toHaveLength(16);
    expect(PLAN.lands.map((l) => l.name)).toEqual(['Les Fabriques', 'Le Bastion', 'Les Coteaux', 'L’Épaule']);
    expect(PLAN.lands.map((l) => l.places.length)).toEqual([4, 4, 5, 3]);
  });

  it('chaque île du 4e a son lieu ; l’Étalon et la Jonction, nouveaux, attendent la leur', () => {
    const islands = new Set<string>(islandsOf('4e').map((b) => b.id));
    const fresh = PLAN.places.filter((p) => !islands.has(p.island)).map((p) => p.id);
    expect(fresh).toEqual(['etalon', 'jonction']);
    expect(new Set(PLAN.places.map((p) => p.island).filter((i) => islands.has(i)))).toEqual(islands);
  });

  it('le prix d’une terre : celui d’une liaison du 4e par lieu, la Veillée et la Basilique en option ne comptent pas (20, 15, 15)', () => {
    expect(PLAN.pricePerPlace).toBe(LINK_PRICE['4e']);
    expect(PLAN.unpriced).toEqual(['veillee', 'basilique']);
    expect(LINKED).toEqual(['bastion', 'coteaux', 'epaule']);
    expect(LINKED.map(landPrice)).toEqual([20, 15, 15]);
  });

  it('la Crique, le départ, au sud-est, dans les Fabriques, près de la Soute', () => {
    expect(nodeLands(PLAN).get(DEPARTURE_4E.node)).toBe('fabriques');
    expect(distance(node(DEPARTURE_4E.node), PLAN.places.find((p) => p.id === 'soute')!.center)).toBeLessThan(80);
    expect(DEPARTURE_4E.at.x).toBeGreaterThan(0);
    expect(DEPARTURE_4E.at.z).toBeGreaterThan(0);
    expect(criqueFloor(DEPARTURE_4E.at.x, DEPARTURE_4E.at.z)).not.toBeNull();
  });

  it('sans ses trois ponts, le réseau fait exactement les quatre terres ; avec eux, on va partout depuis la Crique', () => {
    const lands = nodeLands(PLAN);
    expect(new Set(lands.values())).toEqual(new Set(PLAN.lands.map((l) => l.id)));
    for (const p of PLAN.places) expect(lands.get(p.door), p.id).toBe(landOf(p.id));
    const passages = new Set(LINKED.map((l) => bridgeEdge(PLAN, l)));
    PATH_EDGES_4E.forEach(([a, b], i) => {
      if (!passages.has(i)) expect(lands.get(a), `${a}–${b}`).toBe(lands.get(b));
    });
    for (const p of PLAN.places) expect(NETWORK_4E.findRoute(NETWORK_4E.atNode('port-quai'), NETWORK_4E.atNode(p.door)).length, p.id).toBeGreaterThan(1);
  });
});

describe('Les coupures : le bassin à flot, le ravin sec, la coulée figée', () => {
  it('aucun sentier ne passe une coupure ni la mer : seuls les trois ponts', () => {
    for (const [a, b] of PATH_EDGES_4E) {
      if (isPassage(a, b)) continue;
      const p = node(a);
      const q = node(b);
      const n = Math.ceil(distance(p, q) / 0.5);
      for (let k = 0; k <= n; k++) {
        const at = { x: p.x + ((q.x - p.x) * k) / n, z: p.z + ((q.z - p.z) * k) / n };
        if (criqueFloor(at.x, at.z) !== null) continue;
        expect(landDistance4e(at), `${a}–${b}`).toBeGreaterThan(1);
        for (const [cut, clear] of Object.entries(CUT_CLEARANCE_4E)) expect(clear(at), `${a}–${b} (${cut})`).toBeGreaterThan(1);
        expect(insidePolygon(at, SUMMIT_4E), `${a}–${b}`).toBe(false);
      }
    }
  });

  it('chaque pont franchit sa coupure, sous son tablier : le bassin profond, le ravin et la coulée creusés et secs', () => {
    for (const land of LINKED) {
      const s = bridgeSite(land);
      const cut = LINKS_4E[land as keyof typeof LINKS_4E].cut;
      expect(CUT_CLEARANCE_4E[cut](s.mid), land).toBeLessThan(-1);
      expect(s.water[1] - s.water[0], land).toBeGreaterThan(5);
      // Le sol sous les culées reste sous le tablier.
      for (const d of [s.abut[0], s.abut[1]]) expect(heightAt4e({ x: s.near.x + s.dir.x * d, z: s.near.z + s.dir.z * d }), land).toBeLessThan(BRIDGE.deck - 0.2);
    }
    expect(heightAt4e(bridgeSite('bastion').mid)).toBeLessThan(-1.5);
    for (const land of ['coteaux', 'epaule'] as const) expect(heightAt4e(bridgeSite(land).mid), land).toBeGreaterThan(0);
  });

  it('les lieux sont sur la terre, hors des coupures, du sommet et de la coulée', () => {
    for (const p of PLAN.places) {
      expect(landDistance4e(p.center), p.id).toBeGreaterThan(3);
      expect(couleeClearance(p.center), p.id).toBeGreaterThan(3);
      expect(ravinClearance(p.center), p.id).toBeGreaterThan(3);
      expect(insidePolygon(p.center, SUMMIT_4E), p.id).toBe(false);
      expect(walkBlocked4e(node(p.door)), p.id).toBe(false);
    }
  });
});

describe('Le volcan et la lave figée', () => {
  it('un cône large et bas : sa hauteur fait environ le tiers de sa base, le cratère creusé', () => {
    const top = heightAt4e({ x: VOLCANO_4E.crater.x + VOLCANO_4E.craterRadius, z: VOLCANO_4E.crater.z });
    expect(top).toBeGreaterThan(44);
    expect(top / (2 * VOLCANO_4E.radius)).toBeGreaterThan(0.3);
    expect(top / (2 * VOLCANO_4E.radius)).toBeLessThan(0.36);
    expect(heightAt4e(VOLCANO_4E.crater)).toBeLessThan(top - 2);
  });

  it('la lave n’est qu’au liseré du cratère et dans la cuvette : aucune sous le cratère, ni sur les flancs, ni près d’un lieu', () => {
    const f = lavaFacets();
    expect(f.triangles).toBeLessThan(80);
    for (let k = 0; k < f.positions.length; k += 3) {
      const p = { x: f.positions[k], z: f.positions[k + 2] };
      const atRim = Math.abs(distance(p, VOLCANO_4E.crater) - VOLCANO_4E.craterRadius) < 0.6;
      const inBasin = ((p.x - CUVETTE_4E.center.x) / (CUVETTE_4E.rx + 1)) ** 2 + ((p.z - CUVETTE_4E.center.z) / (CUVETTE_4E.rz + 1)) ** 2 <= 1;
      expect(atRim || inBasin, `${p.x}, ${p.z}`).toBe(true);
      if (inBasin) expect(couleeClearance(p)).toBeLessThan(0);
    }
    // Une seule couleur, dessinée sans ombre et peu voilée par la vue : une lueur fixe.
    expect(colorsOf(f)).toEqual(new Set([key(COLORS_4E.lava)]));
    expect(levelWorld('4e').thinFog.find((t) => t.color === COLORS_4E.lava)?.unlit).toBe(true);
    // La lave ne se peint jamais sur le sol ni dans la Crique.
    const field = buildHeightField4e();
    const ground = new Set<string>();
    for (let tz = 0; tz < TERRAIN_4E.tilesZ; tz += 2) for (let tx = 0; tx < TERRAIN_4E.tilesX; tx += 2) for (const c of colorsOf(tileFacets4e(field, tx, tz, 'far'))) ground.add(c);
    expect(ground.has(key(COLORS_4E.lava))).toBe(false);
  });

  it('le sommet et la coulée ne se marchent pas ; le sommet est hachuré sur la Carte', () => {
    expect(walkBlocked4e(VOLCANO_4E.crater)).toBe(true);
    expect(walkBlocked4e(CUVETTE_4E.center)).toBe(true);
    const grid = buildWalkGrid(buildHeightField4e(), PLAN);
    const cellOf = (p: Vec2) => grid.kind[Math.floor((p.z - grid.minZ) / grid.cell) * grid.nx + Math.floor((p.x - grid.minX) / grid.cell)];
    expect(cellOf(CUVETTE_4E.center)).toBe(0);
    expect(cellOf({ x: VOLCANO_4E.crater.x + 15, z: VOLCANO_4E.crater.z })).toBe(0);
    expect(summitMapHatch().triangles).toBeGreaterThan(40);
  });
});

describe('Les rails et la Crique', () => {
  it('la ligne va du Terminus au butoir de la Forge par le pont de basalte ; l’embranchement passe le pont du ravin vers la Jonction', () => {
    const at = (id: string) => PLAN.places.find((p) => p.id === id)!.center;
    expect(distance(RAILS_4E.line[0], at('terminus'))).toBeLessThan(15);
    expect(distance(RAILS_4E.line[RAILS_4E.line.length - 1], at('etalon'))).toBeLessThan(12);
    expect(distanceToPolyline(bridgeSite('epaule').mid, RAILS_4E.line)).toBeLessThan(1);
    expect(distanceToPolyline(bridgeSite('coteaux').mid, RAILS_4E.branch)).toBeLessThan(1);
    expect(distance(RAILS_4E.branch[RAILS_4E.branch.length - 1], at('jonction'))).toBeLessThan(15);
    // Les rails ne passent jamais l'eau ni le sommet.
    for (const line of [RAILS_4E.line, RAILS_4E.branch, ...RAILS_4E.sidings])
      for (const p of line) {
        expect(landDistance4e(p)).toBeGreaterThan(1);
        expect(insidePolygon(p, SUMMIT_4E)).toBe(false);
      }
  });

  it('l’aire de l’aéronef est sur l’eau, au bout de la passerelle de l’aire ; l’aéronef est la troisième forme, et son départ monte', () => {
    const pad = CRIQUE_SITE.frame.toWorld(CRIQUE_PAD.pad.x, CRIQUE_PAD.pad.z);
    expect(landDistance4e(pad)).toBeLessThan(-2);
    expect(NEF_4E.form).toBe(3);
    expect(distance(NEF_4E.berth, pad)).toBeLessThan(0.01);
    const out = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    const start = nef4eFlight(0, { ...out }).y;
    expect(nef4eFlight(1, out).y).toBeGreaterThan(start + 50);
  });
});

describe('Les couleurs chaudes du 4e', () => {
  it('rien de presque noir : le sol, la mer, le ciel, les ruines, les chemins, la Crique et son décor', () => {
    const colors = [
      ...Object.values(COLORS_4E),
      ...Object.values(FLORA_4E_COLORS),
      ...Object.values(WATER_TONES_4E).filter((c) => c > 0xff),
      ...SKY_OF['4e'].map((s) => s.color),
    ];
    for (const c of colors) expect(luminance(linearRgb(c)), c.toString(16)).toBeGreaterThan(NOT_BLACK);
    const field = buildHeightField4e();
    const meshes = [pathRibbons4e((x, z) => groundOn4e(field, x, z)), criqueDecorFacets(), ...PLAN.places.map((p) => modelOfPlace(p.id).facets)];
    for (const f of meshes)
      for (let k = 0; k < f.colors.length; k += 3) expect(luminance([f.colors[k], f.colors[k + 1], f.colors[k + 2]])).toBeGreaterThan(NOT_BLACK);
  });

  it('le sable des chemins et le pavé de la Crique se détachent de la terre rouge par la clarté, 3 contre 1 au moins (référent dys, retouche 1)', () => {
    const ratio = (a: number, b: number) => {
      const [la, lb] = [luminance(linearRgb(a)), luminance(linearRgb(b))];
      return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
    };
    for (const earth of [COLORS_4E.soil, COLORS_4E.soilSun, COLORS_4E.soilShade])
      for (const light of [COLORS_6E.path, CRIQUE_SITE.colors.stone]) expect(ratio(light, earth), `${light.toString(16)} / ${earth.toString(16)}`).toBeGreaterThanOrEqual(3);
  });

  it('la mer : l’image de l’eau couvre l’île entière', () => {
    expect(seaPixels4e().length).toBeGreaterThan(0);
  });
});

describe('Le budget du 4e', () => {
  it('le monde, la scénette, le départ et la Carte tiennent dans l’enveloppe du 4e, et sous le plafond du lot 3', () => {
    const total = (list: { triangles: number; calls: number }[]) => list.reduce((s, p) => ({ triangles: s.triangles + p.triangles, calls: s.calls + p.calls }), { triangles: 0, calls: 0 });
    const env = OPEN_WORLD_BUDGETS['4e'];
    expect(env).toEqual({ triangles: 118_000, calls: 22 });
    for (const cost of [total(openWorldCost4e('monde')), total(openWorldCost4e('scenette')), total(openWorldCost4e('depart')), mapCost4e()]) {
      expect(cost.triangles).toBeLessThanOrEqual(LOT3_GABARIT_CEILING.triangles);
      expect(cost.calls).toBeLessThanOrEqual(LOT3_GABARIT_CEILING.calls);
    }
  });
});

describe('La caméra du 4e et « Y aller » (deuxième relecture du lot 1, consultant UX UI)', () => {
  it('les pieds de Kéo restent au-dessus de la rangée du bas, quelle que soit sa hauteur', () => {
    const feet = { x: 2, y: heightAt4e({ x: 2, z: -36 }), z: -36 };
    for (const room of [96, 130, 200]) {
      const pose = followPose(feet, 0, undefined, 0.4);
      keepFeetAbove(pose, feet, room, 860);
      expect(screenOf(pose, feet, 1280, 860).y).toBeLessThanOrEqual(860 - room + 1e-6);
    }
    // Déjà au-dessus : rien ne bouge.
    const pose = followPose(feet, 0, undefined, 0.4);
    const target = { ...pose.target };
    keepFeetAbove(pose, feet, 20, 860);
    expect(pose.target).toEqual(target);
  });
});

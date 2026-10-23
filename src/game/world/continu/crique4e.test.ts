// La Crique, le lieu de départ du 4e (lot 4, piste A « La place de l'usine », choisie par le mainteneur le 22 octobre
// 2026 ; intention du directeur artistique du même jour) : la rangée de brique, le dallage clair, le quai et ses bittes,
// la digue, l'aire cerclée de fer et ses lanternes, l'aéronef sur son aire, les pièces déposées du dirigeable, les îles
// du ciel et le départ entre deux d'entre elles, le Rafiot de flanc et ses bronzes, les Aiguilles ; la vue d'arrivée ;
// leurs coûts sous les plafonds du lot. Sans Three.js.
import { beforeAll, describe, expect, it } from 'vitest';
import { NEF_SISTERS, nefParts } from '../nefModels';
import { loadNefFromDisk } from '../nefModels.fromDisk.testing';
import { PORT_BUDGET } from './budget';
import { followPose, lookUp, screenOf, type CameraPose } from './camera';
import {
  AIGUILLES_4E,
  AIGUILLES_AT,
  AIGUILLES_COLORS,
  CRIQUE_PAVING_COLOR,
  CRIQUE_SITE,
  CRIQUE_VIEW,
  DEPOSIT_SISTERS,
  DEPOSIT_SPOTS,
  FOLLOW_FAR_4E,
  NEF_4E,
  NEF_4E_DEPARTURE,
  NEF_4E_TEMPS,
  PIECES_BRONZE,
  RAFIOT_FUNNEL,
  RAFIOT_HULL_COLORS,
  SKY_GATE_4E,
  SKY_ISLANDS_4E,
  SKY_ISLAND_COLORS,
  aiguillesFacets,
  criqueLook,
  criqueDecorFacets,
  digueFacets,
  envelopeShown,
  nef4eFlight,
  nef4eSiteTriangles,
  rafiotPiece,
  skyIslandTouched,
  skyIslandsFacets,
} from './crique4e';
import { FacetBuilder } from './facets';
import { distance, distanceToPolyline, linearRgb, type Vec2, type Vec3 } from './geometry';
import { LISIERE_SITE } from './lisiere';
import { levelWorld } from './levelWorld';
import { nefModelFacets, type NefFlight } from './nef';
import { C4E } from './place4eKit';
import { COLORS_3E } from './plan3e';
import { criqueWalkwayFacets } from './paths4e';
import { COLORS_4E, CRIQUE, CRIQUE_DIGUE, CRIQUE_LEVEL, CRIQUE_PAD, DEPARTURE_4E, PATH_EDGES_4E, PATH_NODES_4E, PLACES_4E, RAFIOT_4E, VOLCANO_4E } from './plan4e';
import { ESCALE, PORT_WORST, portFacets, type PortState } from './port';
import { FOG_4E } from './sky';
import { heightAt4e, lavaFacets, plumeFacets, volcanoFarFacets } from './terrain4e';
import type { Facets } from './facets';

/** Les triangles de l'Escale et de la Lisière au plus chargé, avant le lot 4 du 4e (mesurés le 22 octobre 2026). */
const BEFORE = { escale: 3666, lisiere: 3596 } as const;

/** Les plafonds du lot (intention, « Le budget »). */
const CEILINGS = { crique: 4000, digue: 200, aire: 500, deposits: 150, buoy: 196, rafiot: 600, islands: 400, aiguilles: 60 } as const;

const key = (c: number) => linearRgb(c).map((v) => v.toFixed(4)).join(',');
function colorsOf(f: Facets): Set<string> {
  const out = new Set<string>();
  for (let k = 0; k < f.colors.length; k += 3) out.add(`${f.colors[k].toFixed(4)},${f.colors[k + 1].toFixed(4)},${f.colors[k + 2].toFixed(4)}`);
  return out;
}
/** Les sommets d'un maillage. */
function* vertices(f: Facets): Generator<Vec3> {
  for (let k = 0; k < f.positions.length; k += 3) yield { x: f.positions[k], y: f.positions[k + 1], z: f.positions[k + 2] };
}
/** La luminance relative (WCAG) d'une couleur, et le contraste de deux couleurs. */
function lum(c: number): number {
  const [r, g, b] = linearRgb(c);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: number, b: number) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

/** Le quai, Kéo et la caméra d'arrivée (le regard levé vers le cratère), sur un écran de 1 024 × 768. */
const KEO: Vec3 = { x: DEPARTURE_4E.at.x, y: CRIQUE_LEVEL, z: DEPARTURE_4E.at.z };
function arrival(): CameraPose {
  const pose = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw);
  lookUp(pose, criqueLook(), KEO, 1, 768);
  return pose;
}
const inFrame = (pose: CameraPose, p: Vec3, margin = 0) => {
  const s = screenOf(pose, p, 1024, 768);
  const ahead = (p.x - pose.position.x) * (pose.target.x - pose.position.x) + (p.y - pose.position.y) * (pose.target.y - pose.position.y) + (p.z - pose.position.z) * (pose.target.z - pose.position.z) > 0;
  return ahead && s.x >= -margin && s.x <= 1024 + margin && s.y >= -margin && s.y <= 768 + margin;
};
const STATES: PortState[] = ([0, 1, 2, 3, 4] as const).map((degree) => ({ ...PORT_WORST, degree }));

describe('La place et la rangée de la Crique', () => {
  it('tient sous 4 000 triangles au plus chargé ; l’Escale et la Lisière gardent exactement leurs triangles', () => {
    expect(portFacets(PORT_WORST, { assembling: false }, CRIQUE_SITE).triangles).toBeLessThanOrEqual(CEILINGS.crique);
    expect(portFacets(PORT_WORST).triangles).toBe(BEFORE.escale);
    expect(portFacets(PORT_WORST, { assembling: false }, LISIERE_SITE).triangles).toBe(BEFORE.lisiere);
    expect(portFacets(PORT_WORST).triangles).toBeLessThanOrEqual(PORT_BUDGET);
    expect(ESCALE.masonry).toBeUndefined();
    expect(LISIERE_SITE.masonry).toBeUndefined();
  });

  it('le dallage clair et chaud, la brique et son joint dans le maillage ; aucune rouille sur la place ni sur l’aire', () => {
    expect(CRIQUE_SITE.colors.stone).toBe(0xf0e6d6);
    for (const state of STATES) {
      const seen = colorsOf(portFacets(state, { assembling: false }, CRIQUE_SITE));
      for (const c of [CRIQUE_PAVING_COLOR, COLORS_4E.brick, COLORS_4E.brickShade, COLORS_4E.brickJoint, COLORS_4E.stone, COLORS_4E.stoneSun, 0x5b7c99, 0x8aa3b8]) expect(seen.has(key(c)), c.toString(16)).toBe(true);
      for (const c of [COLORS_4E.rust, COLORS_4E.rustShade, COLORS_4E.copper, 0xe2c4a8, 0xcfa486, 0xffd36b]) expect(seen.has(key(c)), c.toString(16)).toBe(false);
    }
    const aire = colorsOf(criqueWalkwayFacets());
    for (const c of [COLORS_4E.rust, COLORS_4E.rustShade, COLORS_4E.copper]) expect(aire.has(key(c)), c.toString(16)).toBe(false);
    expect(aire.has(key(C4E.iron))).toBe(true);
    // L'anneau en fer froid, plus clair sur le dessus : jamais le brun des bittes, qu'on lisait comme du bois.
    expect(aire.has(key(0x4e4a4c))).toBe(true);
    expect(aire.has(key(0x6e6a6c))).toBe(true);
  });

  it('le dallage se détache de la terre rouge (3 pour 1), les encadrements de la brique et du vantail (1,5 pour 1)', () => {
    for (const earth of [COLORS_4E.soil, COLORS_4E.soilSun, COLORS_4E.soilShade]) expect(contrast(CRIQUE_PAVING_COLOR, earth)).toBeGreaterThanOrEqual(3);
    const C = CRIQUE_SITE.colors;
    expect(contrast(C.frame, C.white)).toBeGreaterThanOrEqual(1.5);
    expect(contrast(C.frame, C.door)).toBeGreaterThanOrEqual(1.5);
    // Les ferrures de fer bruni, la lampe à l'ocre du 4e (sans ombre, comme toutes les lanternes du 4e).
    expect(C.bollard).toBe(0x5c504c);
    expect(C.lamp).toBe(C4E.lantern);
  });

  it('une lanterne seulement à côté d’une porte ouverte : aucune sur une école aux portes fermées et endormie', () => {
    const lamp = key(C4E.lantern);
    const asleep: PortState = { ...PORT_WORST, degree: 0, doors: { french: 'closed', maths: 'closed', english: 'closed' } };
    expect(colorsOf(portFacets(asleep, { assembling: false }, CRIQUE_SITE)).has(lamp)).toBe(false);
    expect(colorsOf(portFacets({ ...asleep, degree: 1 }, { assembling: false }, CRIQUE_SITE)).has(lamp)).toBe(true);
  });

  it('deux bittes au bout du quai, de part et d’autre de la passerelle de l’aire', () => {
    const { bollards } = CRIQUE_SITE.quay;
    expect(bollards).toHaveLength(2);
    expect(bollards.map(([x]) => Math.sign(x)).sort()).toEqual([-1, 1]);
    for (const [x] of bollards) expect(Math.abs(x)).toBeGreaterThan(CRIQUE_PAD.width / 2);
  });
});

describe('La digue', () => {
  it('six blocs séparés au plus 200 triangles, dans l’eau (passé son pied), loin des chemins et du chemin de la Soute', () => {
    expect(digueFacets().triangles).toBeLessThanOrEqual(CEILINGS.digue);
    const points = CRIQUE_DIGUE.points.map(([x, z]) => CRIQUE.toWorld(x, z));
    expect(points.length - 1).toBe(6);
    for (const p of points.slice(1)) expect(heightAt4e(p)).toBeLessThan(0);
    const node = (id: string) => PATH_NODES_4E.find((n) => n.id === id)!.at;
    for (const p of points)
      for (const [a, b] of PATH_EDGES_4E) expect(distanceToPolyline(p, [node(a), node(b)]), `${a}–${b}`).toBeGreaterThan(5);
    // Chaque bloc son haut, de 0,45 à 0,75 au-dessus de l'eau, sous le quai ; à l'est de l'aire et jusqu'à sa hauteur (elle
    // ferme l'anse).
    expect(CRIQUE_DIGUE.tops).toHaveLength(6);
    expect(new Set(CRIQUE_DIGUE.tops).size).toBe(6);
    for (const t of CRIQUE_DIGUE.tops) {
      expect(t).toBeGreaterThanOrEqual(0.45);
      expect(t).toBeLessThanOrEqual(0.75);
    }
    let top = -Infinity;
    for (const v of vertices(digueFacets())) top = Math.max(top, v.y);
    expect(top).toBeCloseTo(Math.max(...CRIQUE_DIGUE.tops));
    expect(top).toBeLessThan(CRIQUE_LEVEL);
    const end = points[points.length - 1];
    expect(end.x).toBeGreaterThan(NEF_4E.berth.x + CRIQUE_PAD.radius);
    expect(end.z).toBeGreaterThan(NEF_4E.berth.z);
  });

  it('l’eau entre deux blocs : un vide d’environ 0,8 au moins au bord du dessus, jamais un ruban continu ; le dessus en pierre grise', () => {
    const f = digueFacets();
    // Les dessus (normale vers le ciel), bloc par bloc : deux coins de deux blocs voisins jamais à moins du vide.
    const tops: Vec3[][] = [];
    for (let k = 0; k < f.positions.length; k += 9) {
      if (f.normals[k + 1] < 0.99) continue;
      const tri = [0, 3, 6].map((o) => ({ x: f.positions[k + o], y: f.positions[k + o + 1], z: f.positions[k + o + 2] }));
      const block = tops.find((t) => Math.abs(t[0].y - tri[0].y) < 1e-4);
      if (block) block.push(...tri);
      else tops.push(tri);
    }
    expect(tops).toHaveLength(6);
    for (let i = 1; i < tops.length; i++) {
      let near = Infinity;
      for (const a of tops[i - 1]) for (const c of tops[i]) near = Math.min(near, distance(a, c));
      expect(near, `${i}`).toBeGreaterThanOrEqual(CRIQUE_DIGUE.gap - 0.05);
    }
    const seen = colorsOf(f);
    expect(seen.has(key(COLORS_4E.stone))).toBe(true);
    expect(seen.has(key(COLORS_4E.stoneSun))).toBe(false);
  });

  it('ses facettes regardent dehors : le dessus vers le ciel', () => {
    const f = digueFacets();
    let up = 0;
    for (let k = 1; k < f.normals.length; k += 9) if (f.normals[k] > 0.5) up++;
    expect(up).toBeGreaterThan(0);
    for (let k = 1; k < f.normals.length; k += 9) expect(f.normals[k]).toBeGreaterThan(-0.5);
  });
});

describe('L’aire et l’aéronef au repos', () => {
  beforeAll(() => loadNefFromDisk());

  it('la passerelle et l’aire, cerclage, bornes et lanternes compris, sous 500 triangles ; deux lanternes allumées', () => {
    const f = criqueWalkwayFacets();
    expect(f.triangles).toBeLessThanOrEqual(CEILINGS.aire);
    // Deux lanternes : leurs vitres d'ocre (deux faces chacune vues de côté, un pavé de dix triangles).
    const lamp = key(C4E.lantern);
    let lit = 0;
    for (let k = 0; k < f.colors.length; k += 9) if (`${f.colors[k].toFixed(4)},${f.colors[k + 1].toFixed(4)},${f.colors[k + 2].toFixed(4)}` === lamp) lit++;
    expect(lit).toBe(2 * 10);
  });

  it('l’aéronef sur l’aire, au-dessus de l’eau, jamais sur la terre : sa coque dans le disque', () => {
    const pad = CRIQUE.toWorld(CRIQUE_PAD.pad.x, CRIQUE_PAD.pad.z);
    expect(distance(NEF_4E.berth, pad)).toBeLessThan(0.01);
    expect(heightAt4e(NEF_4E.berth)).toBeLessThan(0);
    expect(NEF_4E.lift.ber).toBeGreaterThan(CRIQUE_PAD.deck);
    const parts = nefParts(3)!;
    const hull = nefModelFacets(parts, ['coque'], NEF_4E.model);
    for (const v of vertices(hull)) {
      const c = Math.cos(NEF_4E.berth.yaw),
        s = Math.sin(NEF_4E.berth.yaw);
      const w = { x: NEF_4E.berth.x + v.x * c + v.z * s, z: NEF_4E.berth.z - v.x * s + v.z * c };
      expect(distance(w, pad)).toBeLessThan(CRIQUE_PAD.radius);
      expect(heightAt4e(w)).toBeLessThan(0);
    }
  });

  it('ses trois temps, et les pièces déposées qui partent quand leur sœur touche l’aire (la mue de la grille)', () => {
    for (const [piece, sister] of Object.entries(DEPOSIT_SISTERS)) expect(NEF_SISTERS[3][sister], piece).toBe(piece);
    // Et dans l'autre sens : chaque pièce que l'aéronef reprend du dirigeable (la coque et la lanterne restent) est déposée.
    const taken = new Set(Object.entries(NEF_SISTERS[3]).filter(([part, from]) => part !== from).map(([, from]) => from));
    expect([...taken].sort()).toEqual(Object.keys(DEPOSIT_SISTERS).sort());
    expect([...NEF_4E_TEMPS[1], ...NEF_4E_TEMPS[2], ...NEF_4E_TEMPS[3]].sort()).toEqual(['cabine', 'coque', 'derive', 'helices', 'lanterne', 'mat', 'rotor']);
    expect(envelopeShown(0).sort()).toEqual(['ballon', 'empennage', 'suspentes']);
    expect(envelopeShown(1).sort()).toEqual(['ballon', 'empennage', 'suspentes']);
    expect(envelopeShown(2)).toEqual(['empennage']);
    expect(envelopeShown(3)).toEqual([]);
    expect(envelopeShown(4)).toEqual([]);
  });

  it('les pièces déposées sous 150 triangles, la bouée après le départ ; jamais un second modèle de Nef', () => {
    const t = nef4eSiteTriangles();
    expect(t.ber).toBeLessThanOrEqual(CEILINGS.deposits);
    expect(NEF_4E.ber(4).triangles).toBeGreaterThan(0);
    expect(NEF_4E.ber(4).triangles).toBeLessThanOrEqual(CEILINGS.buoy);
    expect(NEF_4E.ber(3).triangles).toBe(0);
    expect(NEF_4E.ber(2).triangles).toBeLessThan(NEF_4E.ber(1).triangles);
    // Un seul modèle par niveau, chacun de sa forme : le 4e n'a que l'aéronef.
    expect((['6e', '5e', '4e'] as const).map((l) => levelWorld(l).departure.nef.form)).toEqual([1, 2, 3]);
    // La bouée, dans l'eau, sur le flanc de l'aire, à 1,5 environ hors de l'anneau, entre la passerelle et le bout de l'aire.
    const buoy = CRIQUE.toWorld(DEPOSIT_SPOTS.buoy.x, DEPOSIT_SPOTS.buoy.z);
    expect(heightAt4e(buoy)).toBeLessThan(0);
    expect(distance(buoy, NEF_4E.berth) - CRIQUE_PAD.radius).toBeGreaterThan(1.3);
    expect(distance(buoy, NEF_4E.berth) - CRIQUE_PAD.radius).toBeLessThan(2);
    expect(DEPOSIT_SPOTS.buoy.z).toBeGreaterThan(CRIQUE_PAD.z1);
    expect(DEPOSIT_SPOTS.buoy.z).toBeLessThan(CRIQUE_PAD.pad.z + CRIQUE_PAD.radius);
    // Vue du demi-tour du quai, dans l'image, à côté de l'aire (pas derrière elle).
    const turned = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw + Math.PI);
    const at = screenOf(turned, { x: buoy.x, y: 0.5, z: buoy.z }, 1024, 768);
    const pad = screenOf(turned, { x: NEF_4E.berth.x, y: CRIQUE_PAD.deck, z: NEF_4E.berth.z }, 1024, 768);
    expect(inFrame(turned, { x: buoy.x, y: 0.5, z: buoy.z })).toBe(true);
    expect(Math.abs(at.x - pad.x)).toBeGreaterThan(100);
  });

  it('la toile et le gouvernail sur l’aire, hors de la coque, jamais entre la caméra du quai et Kéo', () => {
    const { toile, gouvernail } = DEPOSIT_SPOTS;
    const pose = arrival();
    const corners: Vec2[] = [];
    for (const x of [toile.x - toile.width / 2, toile.x + toile.width / 2]) for (const z of [toile.z0, toile.z1]) corners.push({ x, z });
    for (const z of gouvernail.zs) for (const dx of [-0.5, 0.5]) for (const dz of [-0.6, 0.6]) corners.push({ x: gouvernail.x + dx * gouvernail.size[0], z: z + dz * gouvernail.size[1] });
    for (const c of corners) {
      // Dans l'anneau de fer, hors de la coque (1,45 de demi-largeur).
      expect(Math.hypot(c.x - CRIQUE_PAD.pad.x, c.z - CRIQUE_PAD.pad.z)).toBeLessThan(CRIQUE_PAD.radius - 0.4);
      expect(Math.abs(c.x)).toBeGreaterThan(1.6);
      const w = CRIQUE.toWorld(c.x, c.z);
      expect(distanceToPolyline(w, [pose.position, KEO])).toBeGreaterThan(1);
    }
    // La toile du côté de la passerelle : entre l'arrivée de la passerelle et le milieu de l'aire.
    expect(toile.z0).toBeGreaterThan(CRIQUE_PAD.z1);
    expect(toile.z0).toBeLessThan(CRIQUE_PAD.pad.z);
    // Le gouvernail : ses deux plans côte à côte, parallèles.
    expect(gouvernail.zs).toHaveLength(2);
    expect(Math.abs(gouvernail.zs[1] - gouvernail.zs[0])).toBeGreaterThan(gouvernail.size[1]);
  });
});

describe('Les îles du ciel et le départ', () => {
  const quay = DEPARTURE_4E.at;

  it('cinq îles au nord-est, au-dessus de la mer, loin du panache, au loin et en deçà du bout de la caméra ; sous 400 triangles', () => {
    expect(skyIslandsFacets().triangles).toBeLessThanOrEqual(CEILINGS.islands);
    expect(SKY_ISLANDS_4E.length).toBeGreaterThanOrEqual(4);
    expect(SKY_ISLANDS_4E.length).toBeLessThanOrEqual(5);
    const bastion = PLACES_4E.find((p) => p.id === 'gabarit')!.center;
    for (const v of SKY_ISLANDS_4E) {
      expect(v.x).toBeGreaterThan(quay.x);
      expect(v.z).toBeLessThan(quay.z);
      expect(heightAt4e(v)).toBeLessThan(0);
      expect(distance(v, quay)).toBeGreaterThan(distance(bastion, quay));
      expect(distance(v, VOLCANO_4E.crater)).toBeGreaterThan(400);
      expect(distance(v, quay)).toBeGreaterThan(FOG_4E.near);
      expect(Math.hypot(distance(v, quay) + v.r, v.top)).toBeLessThan(FOLLOW_FAR_4E);
      // Plates dessus, plus larges que hautes : jamais une boule.
      expect(2 * v.r).toBeGreaterThan(v.depth);
      expect(v.sides).toBeGreaterThanOrEqual(8);
      expect(v.sides).toBeLessThanOrEqual(10);
      expect(skyIslandTouched(v)).toBe(true);
    }
    // À des distances différentes : deux îles jamais à moins de 8 l'une de l'autre en distance au quai.
    const far = SKY_ISLANDS_4E.map((v) => distance(v, quay)).sort((a, b) => a - b);
    for (let i = 1; i < far.length; i++) expect(far[i] - far[i - 1]).toBeGreaterThan(8);
    expect(skyIslandTouched(NEF_4E.berth)).toBe(false);
    expect(NEF_4E.obstacle()).toBe(NEF_4E.after());
    // Jamais sur la Carte : elles s'y lisaient comme des îles en mer.
    expect(NEF_4E.offMap).toBe(true);
    expect(levelWorld('5e').departure.nef.offMap).toBeUndefined();
    // Sans ombre, peu voilées, leurs couleurs à elles.
    const thin = levelWorld('4e').thinFog;
    for (const c of Object.values(SKY_ISLAND_COLORS)) expect(thin.find((t) => t.color === c)?.unlit, c.toString(16)).toBe(true);
  });

  it('aucune dans la première image ; un quart de tour à droite, toutes dans l’image, au-dessus de l’horizon', () => {
    const first = arrival();
    for (const v of vertices(skyIslandsFacets())) expect(inFrame(first, v)).toBe(false);
    const turned = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw - Math.PI / 2);
    for (const v of SKY_ISLANDS_4E) {
      expect(inFrame(turned, { x: v.x, y: v.top, z: v.z }), `${v.x}`).toBe(true);
      // Leur pointe au-dessus de la mer au loin : elles flottent dans le ciel.
      const d = distance(v, quay);
      const sea = { x: turned.position.x + ((v.x - turned.position.x) / d) * FOLLOW_FAR_4E, y: 0, z: turned.position.z + ((v.z - turned.position.z) / d) * FOLLOW_FAR_4E };
      expect(screenOf(turned, { x: v.x, y: v.top - v.depth, z: v.z }, 1024, 768).y).toBeLessThan(screenOf(turned, sea, 1024, 768).y);
    }
  });

  it('le départ monte droit au-dessus de l’aire, passe entre deux îles sans en traverser aucune, en 8 s au plus', () => {
    const f: NefFlight = { x: 0, y: 0, z: 0, yaw: 0, shiftX: 0, shiftZ: 0, open: 0 };
    expect(nef4eFlight(0, f)).toBe(f);
    expect(distance(f, NEF_4E.berth)).toBeLessThan(0.01);
    expect(f.yaw).toBeCloseTo(NEF_4E.berth.yaw);
    // Droit en haut d'abord : au-dessus de l'aire jusqu'à la hauteur de la montée.
    let risen = false;
    for (let u = 0; u <= 1; u += 0.01) {
      nef4eFlight(u, f);
      risen ||= f.y >= NEF_4E.lift.ber + NEF_4E_DEPARTURE.rise - 0.01;
      if (!risen) expect(distance(f, NEF_4E.berth), `${u}`).toBeLessThan(0.01);
      for (const v of SKY_ISLANDS_4E) {
        const inside = Math.hypot(f.x - v.x, f.z - v.z) < v.r * 1.1 + 3 && f.y < v.top + 3 && f.y > v.top - v.depth - 3;
        expect(inside, `${u} ${v.x}`).toBe(false);
      }
    }
    // À la ligne des îles, entre les deux de la porte, une de chaque côté.
    nef4eFlight(NEF_4E.obstacleDone, f);
    expect(distance(f, SKY_GATE_4E)).toBeLessThan(0.5);
    const gate = SKY_ISLANDS_4E.filter((v) => v.gate);
    const dir = { x: SKY_GATE_4E.x - NEF_4E.berth.x, z: SKY_GATE_4E.z - NEF_4E.berth.z };
    const side = (v: Vec2) => Math.sign(dir.x * (v.z - SKY_GATE_4E.z) - dir.z * (v.x - SKY_GATE_4E.x));
    expect(gate.map(side).sort()).toEqual([-1, 1]);
    // Chacune plus près de la porte que toutes les autres.
    const others = SKY_ISLANDS_4E.filter((v) => !v.gate);
    for (const g of gate) for (const o of others) expect(distance(g, SKY_GATE_4E)).toBeLessThan(distance(o, SKY_GATE_4E));
    // La porte entre leurs cônes, à leur hauteur.
    for (const g of gate) expect(SKY_GATE_4E.y).toBeLessThan(g.top);
    nef4eFlight(1, f);
    expect(distance(f, NEF_4E.berth)).toBeGreaterThan(distance(SKY_GATE_4E, NEF_4E.berth));
    expect(NEF_4E_DEPARTURE.seconds).toBeLessThanOrEqual(8);
    expect(NEF_4E.obstacleDone).toBeGreaterThan(0.5);
    expect(NEF_4E.obstacleDone).toBeLessThan(1);
    expect(NEF_4E.obstacleTouched(SKY_GATE_4E)).toBe(true);
  });
});

describe('La vue d’arrivée, le Rafiot et les Aiguilles', () => {
  it('le fourneau de la Forge près du milieu, le cratère à gauche du milieu', () => {
    const pose = arrival();
    const forge = PLACES_4E.find((p) => p.id === 'forge')!.center;
    const at = screenOf(pose, { x: forge.x, y: heightAt4e(forge) + 6, z: forge.z }, 1024, 768);
    expect(Math.abs(at.x - 512)).toBeLessThan(120);
    const crater = screenOf(pose, criqueLook(), 1024, 768);
    expect(crater.x).toBeLessThan(512 - 60);
    expect(crater.x).toBeGreaterThan(0);
    expect(crater.y).toBeGreaterThan(0);
  });

  it('le Rafiot de flanc face au quai (entre 70° et 110°), sous 600 triangles avec son quai, ses bronzes et sa fumée', () => {
    const axis = { x: Math.sin(RAFIOT_4E.yaw), z: Math.cos(RAFIOT_4E.yaw) };
    const toQuay = { x: DEPARTURE_4E.at.x - RAFIOT_4E.at.x, z: DEPARTURE_4E.at.z - RAFIOT_4E.at.z };
    const angle = (Math.acos(Math.abs(axis.x * toQuay.x + axis.z * toQuay.z) / Math.hypot(toQuay.x, toQuay.z)) * 180) / Math.PI;
    expect(angle).toBeGreaterThanOrEqual(70);
    expect(angle).toBeLessThanOrEqual(110);
    const rafiot = criqueDecorFacets().triangles - volcanoFarFacets().triangles - lavaFacets().triangles - plumeFacets().triangles - digueFacets().triangles - aiguillesFacets().triangles;
    expect(rafiot).toBeLessThanOrEqual(CEILINGS.rafiot);
    // Sa fumée, courte et basse : jamais plus haute que deux fois sa cheminée au-dessus d'elle ; le Rafiot n'a pas de mât.
    let top = -Infinity;
    const decor = criqueDecorFacets();
    for (const v of vertices(decor)) if (Math.hypot(v.x - RAFIOT_4E.at.x, v.z - RAFIOT_4E.at.z) < 8) top = Math.max(top, v.y);
    expect(top).toBeLessThanOrEqual(RAFIOT_FUNNEL.top + 2 * RAFIOT_FUNNEL.height);
    // Sa coque de fer rouillé sombre, jamais presque noire, sans ombre (vers #8C5444 au soleil), de couleurs à elle : la
    // rouille des ruines reste éclairée ; aucune lanterne allumée.
    for (const c of Object.values(RAFIOT_HULL_COLORS)) {
      expect(lum(c)).toBeGreaterThan(0.02);
      expect(levelWorld('4e').thinFog.find((t) => t.color === c)?.unlit, c.toString(16)).toBe(true);
      for (const other of [...Object.values(COLORS_4E), ...Object.values(C4E)] as number[]) {
        const near = linearRgb(c).every((v, i) => Math.abs(v - linearRgb(other)[i]) < 0.004);
        expect(near, `${c.toString(16)} ${other.toString(16)}`).toBe(false);
      }
    }
    const hullSeen = colorsOf(decor);
    expect(hullSeen.has(key(RAFIOT_HULL_COLORS.hull))).toBe(true);
    expect(hullSeen.has(key(RAFIOT_HULL_COLORS.hullShade))).toBe(true);
    let lamp = 0;
    for (let k = 0; k < decor.colors.length; k += 3) if (`${decor.colors[k].toFixed(4)},${decor.colors[k + 1].toFixed(4)},${decor.colors[k + 2].toFixed(4)}` === key(C4E.lantern)) lamp++;
    expect(lamp).toBe(0);
  });

  it('le pont du Rafiot vide quand ses six pièces sont rendues au Fanal du 3e, le reste du décor identique', () => {
    const full = criqueDecorFacets();
    const empty = criqueDecorFacets(true);
    expect(empty.triangles).toBeLessThan(full.triangles);
    // Rien d'autre ne change : seules les pièces partent (le même nombre de triangles que le dessin des six pièces).
    const b = new FacetBuilder();
    for (const id of ['anneau', 'cloche', 'poids', 'regulateur', 'gong', 'vasque'] as const) rafiotPiece(b, id, 0, 0, 0, PIECES_BRONZE);
    expect(full.triangles - empty.triangles).toBe(b.build().triangles);
  });

  it('un seul bronze : les pièces du Rafiot sont du bronze du 3e (#A77B3F, dessus #B98C4C), plus jamais #9C8452 (restes du 3e, piste 5)', () => {
    expect(PIECES_BRONZE).toEqual({ bronze: 0xa77b3f, bronzeTop: 0xb98c4c });
    expect(PIECES_BRONZE.bronze).toBe(COLORS_3E.bronze);
    const seen = colorsOf(criqueDecorFacets());
    expect(seen.has(key(PIECES_BRONZE.bronze))).toBe(true);
    expect(seen.has(key(PIECES_BRONZE.bronzeTop))).toBe(true);
    expect(seen.has(key(0x9c8452))).toBe(false);
    expect(seen.has(key(0xb59c66))).toBe(false);
  });

  it('les Aiguilles au sud, sur la mer, sous 60 triangles, hors de la première image, dans l’image au demi-tour', () => {
    expect(aiguillesFacets().triangles).toBeLessThanOrEqual(CEILINGS.aiguilles);
    expect(AIGUILLES_AT.z).toBeGreaterThan(DEPARTURE_4E.at.z + 150);
    expect(heightAt4e(AIGUILLES_AT)).toBeLessThan(0);
    for (const v of vertices(aiguillesFacets())) expect(inFrame(arrival(), v)).toBe(false);
    const turned = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw + Math.PI);
    for (const [, h] of AIGUILLES_4E.needles) expect(inFrame(turned, { x: AIGUILLES_AT.x, y: h, z: AIGUILLES_AT.z })).toBe(true);
    // Basses, au milieu de la moitié droite de l'image, loin de la colonne de boutons de droite.
    for (const [, h] of AIGUILLES_4E.needles) expect(h).toBeLessThanOrEqual(13);
    const at = screenOf(turned, { x: AIGUILLES_AT.x, y: 0, z: AIGUILLES_AT.z }, 1024, 768);
    expect(Math.abs(at.x - 768)).toBeLessThan(60);
    const thin = levelWorld('4e').thinFog;
    for (const c of Object.values(AIGUILLES_COLORS)) expect(thin.find((t) => t.color === c)?.unlit, c.toString(16)).toBe(true);
  });

  it('au demi-tour, l’aire à gauche du milieu et la digue derrière elle ; le Rafiot jamais dans la même image que l’aire', () => {
    const turned = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw + Math.PI);
    const pad = screenOf(turned, { x: NEF_4E.berth.x, y: CRIQUE_PAD.deck, z: NEF_4E.berth.z }, 1024, 768);
    expect(pad.x).toBeLessThan(512);
    expect(pad.x).toBeGreaterThan(256);
    const end = CRIQUE_DIGUE.points[CRIQUE_DIGUE.points.length - 1];
    const w = CRIQUE.toWorld(end[0], end[1]);
    expect(inFrame(turned, { x: w.x, y: CRIQUE_DIGUE.tops[CRIQUE_DIGUE.tops.length - 1], z: w.z })).toBe(true);
    expect(distance(w, turned.position)).toBeGreaterThan(distance(NEF_4E.berth, turned.position));
    for (let k = -8; k <= 8; k++) {
      const pose = followPose(KEO, 0, undefined, CRIQUE_VIEW.yaw + (k * Math.PI) / 8);
      expect(inFrame(pose, { x: NEF_4E.berth.x, y: 2, z: NEF_4E.berth.z }) && inFrame(pose, { x: RAFIOT_4E.at.x, y: 2, z: RAFIOT_4E.at.z }), `${k}`).toBe(false);
    }
  });
});

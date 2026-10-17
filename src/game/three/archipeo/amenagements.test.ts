// Les aménagements du monde ouvert (GD-20, point 4, piste B, lot L0) : les dix-neuf petites constructions du 6e, leurs
// dessins de la grille posés chacun à son lieu. La table (une place par lieu, au sol, dans le rayon de toucher, hors de
// tout ce que le lieu, ses traces, l'Escale, les passerelles et la scénette posent ; jamais sur la porte, un chemin, le
// chenal de la Nef), la coupe de chaque dessin en éléments, une par ressource que la commande demande, la règle de
// hauteur et son exception (la grue des Archives, adossée à la façade), le verre mat des lanternes éteintes, le
// cadrage de la remise, ce qu'ils coûtent. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGET, mapCost, openWorldCost } from '../../world/continu/budget';
import { screenOf } from '../../world/continu/camera';
import { WHOLE, constructionFacets } from '../../world/continu/construction';
import { boundsOf, type Facets } from '../../world/continu/facets';
import { linearRgb, type Vec2 } from '../../world/continu/geometry';
import { allObstacles, linkFacets } from '../../world/continu/links';
import { networkSamples, pathNode } from '../../world/continu/paths';
import { NEF_CHANNEL, PLACES, placeById, portFloor, toPlan, type PlaceId } from '../../world/continu/plan6e';
import { PHARE_GARDEN } from '../../world/continu/places';
import { PORT_WORST, portFacets } from '../../world/continu/port';
import { placeTrace } from '../../world/continu/questionScene';
import { remisePose, scenetteDecor, scenetteHabitant, scenetteKeo } from '../../world/continu/scenette';
import { buildHeightField, heightOnMesh, standingHeight } from '../../world/continu/terrain';
import { AMENAGEMENTS, AMENAGEMENT_SCALE, HABITANT_HEIGHT, MATTE_GLASS, amenagementsOf, piecesOf, remisePosed, remiseStage } from '../../world/continu/amenagements';
import { casesDeLaPetiteConstruction } from '../../world/fixtures';
import { COMMANDES } from '../../world/requests';
import { amenagementsCost, drawnObject, placedAmenagement, posedAmenagements } from './amenagements';

const field = buildHeightField();
const ground = (x: number, z: number) => portFloor(x, z) ?? heightOnMesh(field, x, z);

/** Les points de la forme d'un aménagement au sol, tous les dix centimètres (son contour tourné, sous ses sommets). */
function footprint(f: Facets): Vec2[] {
  const out: Vec2[] = [];
  for (let k = 0; k < f.positions.length; k += 9) {
    const [ax, az, bx, bz, cx, cz] = [f.positions[k], f.positions[k + 2], f.positions[k + 3], f.positions[k + 5], f.positions[k + 6], f.positions[k + 8]];
    for (let u = 0; u <= 1; u += 0.25) for (let v = 0; v <= 1 - u; v += 0.25) out.push({ x: ax + u * (bx - ax) + v * (cx - ax), z: az + u * (bz - az) + v * (cz - az) });
  }
  return out;
}

/** Les seuls triangles d'un maillage qui passent au-dessus d'une boîte (vue d'en haut) : pour chercher vite. */
function within(f: Facets, b: { min: readonly number[]; max: readonly number[] }): Facets {
  const keep: number[] = [];
  for (let k = 0; k < f.positions.length; k += 9) {
    const xs = [f.positions[k], f.positions[k + 3], f.positions[k + 6]];
    const zs = [f.positions[k + 2], f.positions[k + 5], f.positions[k + 8]];
    if (Math.max(...xs) < b.min[0] || Math.min(...xs) > b.max[0] || Math.max(...zs) < b.min[2] || Math.min(...zs) > b.max[2]) continue;
    for (let i = 0; i < 9; i++) keep.push(f.positions[k + i]);
  }
  const positions = new Float32Array(keep);
  return { positions, normals: positions, colors: positions, triangles: keep.length / 9 };
}

/** Le plus haut d'un maillage au-dessus d'un point (ses triangles qui le couvrent, vus d'en haut), ou rien. */
function topAt(f: Facets, q: Vec2): number | null {
  let top: number | null = null;
  for (let k = 0; k < f.positions.length; k += 9) {
    const [ax, ay, az] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
    const [bx, by, bz] = [f.positions[k + 3], f.positions[k + 4], f.positions[k + 5]];
    const [cx, cy, cz] = [f.positions[k + 6], f.positions[k + 7], f.positions[k + 8]];
    if (Math.min(ax, bx, cx) > q.x || Math.max(ax, bx, cx) < q.x || Math.min(az, bz, cz) > q.z || Math.max(az, bz, cz) < q.z) continue;
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(d) < 1e-9) continue;
    const l1 = ((bz - cz) * (q.x - cx) + (cx - bx) * (q.z - cz)) / d;
    const l2 = ((cz - az) * (q.x - cx) + (ax - cx) * (q.z - cz)) / d;
    const l3 = 1 - l1 - l2;
    if (l1 < 0 || l2 < 0 || l3 < 0) continue;
    const y = l1 * ay + l2 * by + l3 * cy;
    top = top === null ? y : Math.max(top, y);
  }
  return top;
}

const placed = AMENAGEMENTS.map((a) => ({ a, p: placedAmenagement(a.id, ground) }));

describe('La table des aménagements', () => {
  it('dix-neuf : les seize commandes du 6e et les trois objets d’entraide, chacun une petite construction de la grille', () => {
    expect(AMENAGEMENTS).toHaveLength(19);
    expect(new Set(AMENAGEMENTS.map((a) => a.id)).size).toBe(19);
    for (const a of AMENAGEMENTS) expect(casesDeLaPetiteConstruction(a.id), a.id).toBeDefined();
    const commandes6e = COMMANDES.filter((c) => AMENAGEMENTS.some((a) => a.id === c.fixture));
    expect(commandes6e).toHaveLength(16);
    expect(AMENAGEMENTS.filter((a) => a.kind === 'commande').map((a) => a.id).sort()).toEqual(commandes6e.map((c) => c.fixture).sort());
    // Le nom de la grille, celui de la commande.
    for (const c of commandes6e) expect(AMENAGEMENTS.find((a) => a.id === c.fixture)?.name).toBe(c.blocland.name);
  });

  it('une place par lieu : seize lieux, deux aménagements au Phare, aux Filets et à la Vigie', () => {
    expect(new Set(AMENAGEMENTS.map((a) => a.place)).size).toBe(16);
    for (const p of PLACES) expect(amenagementsOf(p.id).length, p.id).toBe(['phare', 'filets', 'lookout'].includes(p.id) ? 2 : 1);
  });

  it('un élément par ressource que la commande demande, un seul pour un objet d’entraide ; chaque morceau du dessin dans un élément, une fois', () => {
    for (const a of AMENAGEMENTS) {
      const c = COMMANDES.find((x) => x.fixture === a.id);
      expect(a.elements.length, a.id).toBe(a.kind === 'commande' ? c?.count : 1);
      const pieces = piecesOf(drawnObject(a.id));
      expect(a.elements.flat().sort((u, v) => u - v), a.id).toEqual(pieces.map((_, i) => i));
      for (const piece of pieces) expect(piece.to, a.id).toBeGreaterThan(piece.from);
    }
  });

  it('posé, chaque élément suit le précédent, et leurs triangles sont tous ceux du dessin', () => {
    for (const { a, p } of placed) {
      expect(p.elements).toHaveLength(a.elements.length);
      expect(p.elements[0].from).toBe(0);
      for (let i = 1; i < p.elements.length; i++) expect(p.elements[i].from).toBe(p.elements[i - 1].to);
      expect(p.elements.at(-1)?.to).toBe(p.facets.triangles);
      expect(p.facets.triangles).toBe(drawnObject(a.id).positions.length / 9);
    }
  });
});

describe('La place de chaque aménagement', () => {
  const samples = networkSamples(0.25);
  const obstacles = allObstacles().flatMap((o) => [linkFacets(o, false, ground), linkFacets(o, true, ground)]);
  const port = portFacets(PORT_WORST);

  it('dans le rayon de toucher de son lieu (son toucher ouvre le lieu), loin de la porte, des chemins et du chenal de la Nef', () => {
    const out: string[] = [];
    for (const { a, p } of placed) {
      const place = placeById(a.place);
      const door = pathNode(place.door).at;
      const near = samples.filter((s) => Math.hypot(s.x - place.center.x, s.z - place.center.z) < place.touchRadius + 3);
      let [r, d, path, nef] = [0, Infinity, Infinity, false];
      for (const q of footprint(p.facets)) {
        r = Math.max(r, Math.hypot(q.x - place.center.x, q.z - place.center.z));
        d = Math.min(d, Math.hypot(q.x - door.x, q.z - door.z));
        for (const s of near) path = Math.min(path, Math.hypot(s.x - q.x, s.z - q.z));
        const [px, py] = toPlan(q);
        nef ||= px >= NEF_CHANNEL.x0 && px <= NEF_CHANNEL.x1 && py >= NEF_CHANNEL.y0 && py <= NEF_CHANNEL.y1;
      }
      if (r > place.touchRadius) out.push(`${a.id} : à ${r.toFixed(2)} du centre (rayon ${place.touchRadius})`);
      if (d <= 1.2) out.push(`${a.id} : à ${d.toFixed(2)} de la porte`);
      if (path <= 0.9) out.push(`${a.id} : à ${path.toFixed(2)} d’un chemin`);
      if (nef) out.push(`${a.id} : dans le chenal de la Nef`);
    }
    expect(out).toEqual([]);
  });

  const NAMES = ['le lieu entier', 'le lieu en ruine', 'ses traces', 'le décor de la scénette', 'le décor de la scénette ouverte', 'l’Escale'];
  it('rien du lieu (entier ou en ruine), de ses traces, de l’Escale, des passerelles ni du décor de la scénette ne monte sous sa forme', () => {
    const out: string[] = [];
    for (const { a, p } of placed) {
      const place = placeById(a.place);
      const base = boundsOf(p.facets).min[1];
      const others = [
        constructionFacets(a.place, [WHOLE], ground),
        constructionFacets(a.place, [], ground),
        placeTrace(a.place, [...place.scenes, ...(place.panels ?? [])]),
        scenetteDecor(a.place, false, remisePosed(a.place)),
        scenetteDecor(a.place, true, remisePosed(a.place)),
        port,
        ...obstacles,
        ...placed.filter((o) => o.a.id !== a.id).map((o) => o.p.facets),
      ].map((f) => within(f, boundsOf(p.facets)));
      others.forEach((f, i) => {
        let [worst, at] = [0, ''];
        for (const q of footprint(p.facets)) {
          const top = topAt(f, q);
          if (top !== null && top - base > worst) [worst, at] = [top - base, `${(q.x - place.center.x).toFixed(2)},${(q.z - place.center.z).toFixed(2)}`];
        }
        if (worst >= 0.12) out.push(`${a.id} : ${NAMES[i] ?? (i < NAMES.length + obstacles.length ? 'une passerelle' : 'un autre aménagement')} monte de ${worst.toFixed(2)} en ${at}`);
      });
    }
    expect(out).toEqual([]);
  });

  it('à l’écart de l’habitant et de Kéo, dans la scénette et dans la remise', () => {
    for (const { a, p } of placed) {
      for (const posed of [true, remisePosed(a.place)]) {
        const h = scenetteHabitant(a.place, posed);
        const k = scenetteKeo(a.place, posed).at;
        for (const q of footprint(p.facets)) {
          expect(Math.hypot(q.x - h.x, q.z - h.z), a.id).toBeGreaterThan(0.5);
          expect(Math.hypot(q.x - k.x, q.z - k.z), a.id).toBeGreaterThan(0.5);
        }
      }
    }
  });

  it('au sol, à sec et presque à plat ; sur la surface de son lieu quand il y est posé (la terrasse de l’Observatoire, le quai de la Gare maritime)', () => {
    const out: string[] = [];
    for (const { a, p } of placed) {
      const base = boundsOf(p.facets).min[1];
      const under = footprint(p.facets);
      if (a.floor === undefined) {
        const heights = under.map((q) => ground(q.x, q.z));
        const [low, high] = [Math.min(...heights), Math.max(...heights)];
        if (low <= 0.05) out.push(`${a.id} : dans l’eau (${low.toFixed(2)})`);
        if (high - low >= 0.3) out.push(`${a.id} : pente de ${(high - low).toFixed(2)}`);
        if (Math.abs(base - low) > 0.05) out.push(`${a.id} : posé à ${base.toFixed(2)}, le sol à ${low.toFixed(2)}`);
      } else {
        const c = placeById(a.place).center;
        expect(base, a.id).toBeCloseTo(standingHeight(ground(c.x, c.z)) + a.floor, 5);
        const model = within(constructionFacets(a.place, [WHOLE], ground), boundsOf(p.facets));
        for (const q of under) {
          const top = topAt(model, q);
          if (top === null || Math.abs(top - base) > 0.05) out.push(`${a.id} : hors de la surface en ${q.x.toFixed(2)},${q.z.toFixed(2)} (${top?.toFixed(2)})`);
        }
      }
    }
    expect([...new Set(out)].slice(0, 20)).toEqual([]);
  });

  it('le potager du Phare prolonge le jardin clos par l’ouverture de son muret est, sur le même sol', () => {
    const potager = placed.find((o) => o.a.id === 'french-6e-phonology-fixture-1');
    if (!potager) throw new Error('le potager');
    const c = placeById('phare').center;
    const b = boundsOf(potager.p.facets);
    const g = PHARE_GARDEN;
    // Son bord ouest dans l'épaisseur du muret est (0,3), là où il est ouvert ; tout entier dans la largeur de l'ouverture.
    const wall = c.x + g.x + g.w / 2;
    expect(b.min[0]).toBeGreaterThanOrEqual(wall - 0.15);
    expect(b.min[0]).toBeLessThanOrEqual(wall + 0.15);
    const half = g.d / 2 - g.eastWall;
    expect(b.min[2]).toBeGreaterThanOrEqual(c.z + g.z - half);
    expect(b.max[2]).toBeLessThanOrEqual(c.z + g.z + half);
    // Le même sol que le jardin, sans marche ni socle : son pied à moins de 0,2 du sol du seuil, dans l'ouverture du muret
    // (le sol y descend vers la tour : le potager, posé au plus bas, entre de 0,16 dans la pente à son bord ouest).
    expect(Math.abs(b.min[1] - ground(wall, c.z + g.z))).toBeLessThan(0.2);
  });

  it('plus bas que l’habitant d’une scénette, à l’échelle commune ; la grue des Archives, adossée à la façade, la seule exception', () => {
    expect(AMENAGEMENT_SCALE).toBe(0.45);
    expect(AMENAGEMENTS.filter((a) => a.facade).map((a) => a.id)).toEqual(['french-6e-word-spelling-fixture-1']);
    for (const { a, p } of placed) {
      const b = boundsOf(p.facets);
      const height = b.max[1] - b.min[1];
      if (a.facade) {
        expect(height, a.id).toBeGreaterThan(HABITANT_HEIGHT);
        expect(height, a.id).toBeLessThan(HABITANT_HEIGHT * 1.1);
      } else expect(height, a.id).toBeLessThanOrEqual(HABITANT_HEIGHT);
    }
  });
});

describe('Les lanternes éteintes', () => {
  const same = (c: Float32Array, k: number, rgb: readonly number[]) => Math.abs(c[k] - rgb[0]) < 2e-3 && Math.abs(c[k + 1] - rgb[1]) < 2e-3 && Math.abs(c[k + 2] - rgb[2]) < 2e-3;
  const hasColor = (id: string, hex: number) => {
    const c = drawnObject(id).colors;
    const rgb = linearRgb(hex);
    for (let k = 0; k < c.length; k += 3) if (same(c, k, rgb)) return true;
    return false;
  };

  it('la lanterne d’entraide du Phare et le poteau-lanterne de la Vigie : leurs vitres en verre mat, jamais la couleur d’une lampe', () => {
    for (const id of ['french-6e-phonology-fixture-2', 'french-6e-reading-fixture-1']) {
      expect(hasColor(id, MATTE_GLASS.dessus) || hasColor(id, MATTE_GLASS.cote), id).toBe(true);
      expect(hasColor(id, 0xffd36b), id).toBe(false);
    }
    for (const a of AMENAGEMENTS) expect(hasColor(a.id, 0xffd36b), a.id).toBe(false);
  });
});

describe('Posés quand leur petite construction l’est', () => {
  it('suit la sauvegarde (`world.parts`), sans rien de neuf', () => {
    expect(Object.values(posedAmenagements({})).flat()).toEqual([]);
    const [potager, puits] = AMENAGEMENTS;
    const parts = { [potager.id]: ['0,0'], [puits.id]: [] };
    const posed = posedAmenagements(parts);
    expect(posed.phare).toEqual([potager.id]);
    expect(posed.printworks).toEqual([]);
    const all = Object.fromEntries(AMENAGEMENTS.map((a) => [a.id, ['0,0']]));
    expect(Object.values(posedAmenagements(all)).flat().sort()).toEqual(AMENAGEMENTS.map((a) => a.id).sort());
    // Une clé inconnue de la grille ne pose rien.
    expect(Object.values(posedAmenagements({ 'inconnue-fixture-1': ['0,0'] })).flat()).toEqual([]);
  });
});

describe('Le cadrage de la remise', () => {
  const screens = [
    [1024, 768],
    [844, 390],
  ] as const;

  it('l’aménagement tient dans la scène de la remise, avec l’habitant et Kéo, sur la tablette et le téléphone', () => {
    for (const p of PLACES) {
      const list = placed.filter((o) => o.a.place === p.id);
      const b = list.map((o) => boundsOf(o.p.facets));
      const include = { min: [0, 1, 2].map((i) => Math.min(...b.map((x) => x.min[i]))), max: [0, 1, 2].map((i) => Math.max(...b.map((x) => x.max[i]))) };
      for (const [w, h] of screens) {
        const stage = remiseStage(w, h);
        const { pose, shift } = remisePose(p.id, include, stage, w, h, remisePosed(p.id));
        for (const x of [include.min[0], include.max[0]])
          for (const y of [include.min[1], include.max[1]])
            for (const z of [include.min[2], include.max[2]]) {
              // La scène est décalée de `shift` : le milieu de l'écran vient au milieu de la scène.
              const o = screenOf(pose, { x, y, z }, w, h);
              const s = { x: o.x - shift.x, y: o.y - shift.y };
              const tag = `${p.id} ${w}×${h}`;
              expect(s.x, tag).toBeGreaterThanOrEqual(stage.left - 4);
              expect(s.x, tag).toBeLessThanOrEqual(stage.right + 4);
              expect(s.y, tag).toBeGreaterThanOrEqual(stage.top - 4);
              expect(s.y, tag).toBeLessThanOrEqual(stage.bottom + 4);
            }
      }
    }
  });

  it('devant l’habitant ou Kéo (plus près de la caméra), un aménagement ne les couvre jamais à l’écran', () => {
    const out: string[] = [];
    for (const p of PLACES) {
      const list = placed.filter((o) => o.a.place === p.id);
      const b = list.map((o) => boundsOf(o.p.facets));
      const include = { min: [0, 1, 2].map((i) => Math.min(...b.map((x) => x.min[i]))), max: [0, 1, 2].map((i) => Math.max(...b.map((x) => x.max[i]))) };
      const posed = remisePosed(p.id);
      const h = scenetteHabitant(p.id, posed);
      const k = scenetteKeo(p.id, posed).at;
      // L'habitant et Kéo, en boîtes (une épaule de chaque côté ; l'habitant de sa hauteur, Kéo de la sienne, plus petit).
      const figures = [
        { name: 'l’habitant', min: [h.x - 0.3, h.y, h.z - 0.3], max: [h.x + 0.3, h.y + HABITANT_HEIGHT, h.z + 0.3] },
        { name: 'Kéo', min: [k.x - 0.3, k.y, k.z - 0.3], max: [k.x + 0.3, k.y + 1, k.z + 0.3] },
      ];
      for (const [w, hh] of [...screens, [800, 1280]] as const) {
        const { pose, shift } = remisePose(p.id, include, remiseStage(w, hh), w, hh, posed);
        const onScreen = (box: { min: readonly number[]; max: readonly number[] }) => {
          const s: { x: number; y: number }[] = [];
          for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) s.push(screenOf(pose, { x, y, z }, w, hh));
          return { l: Math.min(...s.map((q) => q.x)) - shift.x, r: Math.max(...s.map((q) => q.x)) - shift.x, t: Math.min(...s.map((q) => q.y)) - shift.y, b: Math.max(...s.map((q) => q.y)) - shift.y };
        };
        for (const o of list) {
          const ob = boundsOf(o.p.facets);
          const so = onScreen(ob);
          for (const f of figures) {
            // Derrière la figure (plus loin de la caméra, au nord), c'est elle qui le cache en partie : permis.
            if (ob.max[2] <= f.min[2]) continue;
            const sf = onScreen(f);
            if (Math.min(so.r, sf.r) > Math.max(so.l, sf.l) && Math.min(so.b, sf.b) > Math.max(so.t, sf.t)) out.push(`${o.a.id} couvre ${f.name} (${w}×${hh})`);
          }
        }
      }
    }
    expect(out).toEqual([]);
  });

  it('au Phare, la remise se joue au pied de la tour, jamais sur la galerie', () => {
    expect(remisePosed('phare')).toBe(false);
    for (const p of PLACES.filter((x) => x.id !== 'phare')) expect(remisePosed(p.id as PlaceId)).toBe(true);
  });
});

describe('Ce qu’ils coûtent', () => {
  it('les dix-neuf posés, dans le maillage des lieux : aucun appel de plus, et le monde et la Carte dans l’enveloppe', () => {
    const cost = amenagementsCost();
    expect(cost.calls).toBe(0);
    expect(cost.triangles).toBe(placed.reduce((s, o) => s + o.p.facets.triangles, 0));
    const world = openWorldCost(cost.triangles);
    expect(world.find((c) => c.poste === 'aménagements')).toEqual({ poste: 'aménagements', triangles: cost.triangles, calls: 0 });
    expect(world.reduce((s, c) => s + c.triangles, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
    expect(world.reduce((s, c) => s + c.calls, 0)).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.calls);
    const map = mapCost(cost.triangles);
    expect(map.triangles).toBe(mapCost().triangles + cost.triangles);
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
  });
});

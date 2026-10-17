// Les aménagements du monde ouvert (GD-20, point 4, piste B, lot L0) : les dix-neuf petites constructions du 6e, leurs
// dessins de la grille posés chacun à son lieu. La table (une place par lieu, au sol, dans le rayon de toucher, hors de
// tout ce que le lieu, ses traces, l'Escale, les ponts et la scénette posent ; jamais sur la porte, un chemin, le
// chenal de la Nef), la coupe de chaque dessin en éléments, une par ressource que la commande demande, la règle de
// hauteur et son exception (la grue des Archives, potence de façade, mesurée à l'architrave), l'assise de pierre sur
// la pente, les places revues sur l'avis du directeur artistique (lot L0, 17 octobre 2026), le verre mat des lanternes
// éteintes, le cadrage de la remise (entier dans la scène, avec une marge, aux trois formats), ce qu'ils coûtent. Sans
// Three.js.
import { describe, expect, it } from 'vitest';
import { OPEN_WORLD_BUDGET, mapCost, openWorldCost } from '../../world/continu/budget';
import { screenOf } from '../../world/continu/camera';
import { WHOLE, constructionFacets } from '../../world/continu/construction';
import { boundsOf, type Facets } from '../../world/continu/facets';
import { linearRgb, type Vec2 } from '../../world/continu/geometry';
import { bridgeFacets } from '../../world/continu/bridges';
import { LINKED_LANDS } from '../../world/continu/lands';
import { networkSamples, pathNode } from '../../world/continu/paths';
import { NEF_CHANNEL, PLACES, placeById, portFloor, toPlan, type PlaceId } from '../../world/continu/plan6e';
import { PHARE_GARDEN } from '../../world/continu/places';
import { PORT_WORST, portFacets } from '../../world/continu/port';
import { placeTrace } from '../../world/continu/questionScene';
import { remisePose, scenetteDecor, scenetteHabitant, scenetteKeo } from '../../world/continu/scenette';
import type { PlacedAmenagement } from '../../world/continu/amenagements';
import { buildHeightField, heightOnMesh, standingHeight } from '../../world/continu/terrain';
import { AMENAGEMENTS, AMENAGEMENT_SCALE, ASSISE_STONE, ASSISE_TRIANGLES, HABITANT_HEIGHT, MATTE_GLASS, QUAI_STONE, QUAI_TRIANGLES, amenagementsOf, piecesOf, remiseFrame, remiseInclude, remisePosed, remiseStage } from '../../world/continu/amenagements';
import { OBJECT_TOUCH_PIXELS, nearestPlace, touchedObject, type ObjectTarget } from '../../world/continu/toucher';
import { casesDeLaPetiteConstruction } from '../../world/fixtures';
import { COMMANDES } from '../../world/requests';
import { POTENCE, amenagementsCost, drawnObject, placedAmenagement, posedAmenagements } from './amenagements';

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

/**
 * Le plus haut d'un maillage au-dessus d'un point (ses triangles qui le couvrent, vus d'en haut), ou rien ; sous `ceiling`
 * seulement, s'il est donné (ce qui passe au-dessus d'un objet, l'architrave sur la potence, ne le touche pas).
 */
function topAt(f: Facets, q: Vec2, ceiling = Infinity): number | null {
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
    if (y > ceiling) continue;
    top = top === null ? y : Math.max(top, y);
  }
  return top;
}

/** L'objet sur son assise, sans le morceau de quai de la scène sous elle (le quai, ses premiers triangles). */
function withoutQuai(a: (typeof AMENAGEMENTS)[number], p: PlacedAmenagement): Facets {
  const from = (a.quai ? QUAI_TRIANGLES : 0) * 9;
  const positions = p.facets.positions.slice(from);
  return { positions, normals: p.facets.normals.slice(from), colors: p.facets.colors.slice(from), triangles: positions.length / 9 };
}

/** L'objet seul, sans son assise de pierre. */
function objectOnly(p: PlacedAmenagement): Facets {
  const from = (p.assise?.to ?? 0) * 9;
  const positions = p.facets.positions.slice(from);
  return { positions, normals: p.facets.normals.slice(from), colors: p.facets.colors.slice(from), triangles: positions.length / 9 };
}

const placed = AMENAGEMENTS.map((a) => ({ a, p: placedAmenagement(a.id, ground) }));
const byId = (id: string) => {
  const o = placed.find((x) => x.a.id === id);
  if (!o) throw new Error(id);
  return o;
};

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
      const stone = (p.assise ? ASSISE_TRIANGLES : 0) + (a.quai ? QUAI_TRIANGLES : 0);
      expect(p.facets.triangles).toBe(drawnObject(a.id).positions.length / 9 + stone);
      expect(p.assise?.to ?? 0).toBe(stone);
    }
  });
});

describe('La place de chaque aménagement', () => {
  const samples = networkSamples(0.25);
  const obstacles = LINKED_LANDS.flatMap((l) => [bridgeFacets(l, false), bridgeFacets(l, true)]);
  const port = portFacets(PORT_WORST);

  // Son toucher ouvre son lieu (lot L1, une seule règle pour les dix-neuf, world/continu/toucher.ts) : il n'a plus à être
  // dans le rayon de toucher de son lieu (la boutique des Quais, le lavoir des Écluses, le nichoir de la Mangrove sont
  // près de l'habitant, hors du rayon) ; il n'est jamais dans celui d'un autre lieu.
  it('dans le rayon d’aucun autre lieu, loin de la porte, des chemins et du chenal de la Nef', () => {
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
      const other = footprint(p.facets)
        .map((q) => nearestPlace(q))
        .find((id) => id !== null && id !== a.place);
      if (other) out.push(`${a.id} : dans le rayon de toucher de ${other}`);
      // Près de son habitant, ou dans le rayon de son lieu : jamais loin de ce qu'il dit.
      const h = scenetteHabitant(a.place, remisePosed(a.place));
      if (r > Math.max(place.touchRadius, Math.hypot(h.x - place.center.x, h.z - place.center.z) + 2)) out.push(`${a.id} : à ${r.toFixed(2)} du centre, loin du lieu et de l’habitant`);
      if (d <= 1.2) out.push(`${a.id} : à ${d.toFixed(2)} de la porte`);
      if (path <= 0.9) out.push(`${a.id} : à ${path.toFixed(2)} d’un chemin`);
      if (nef) out.push(`${a.id} : dans le chenal de la Nef`);
    }
    expect(out).toEqual([]);
  });

  const NAMES = ['le lieu entier', 'le lieu en ruine', 'ses traces', 'le décor de la scénette', 'le décor de la scénette ouverte', 'l’Escale'];
  it('rien du lieu (entier ou en ruine), de ses traces, de l’Escale, des ponts ni du décor de la scénette ne monte sous sa forme', () => {
    const out: string[] = [];
    for (const { a, p } of placed) {
      const place = placeById(a.place);
      const base = p.base;
      const ceiling = boundsOf(p.facets).max[1];
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
      // Le morceau de quai de la scène (le lavoir des Écluses) est sous la dalle de la scène : l'habitant et son levier y
      // sont posés, au-dessus de lui ; il compte pour tout le reste.
      const [whole, onDeck] = [footprint(p.facets), footprint(withoutQuai(a, p))];
      others.forEach((f, i) => {
        let [worst, at] = [0, ''];
        for (const q of i === 3 || i === 4 ? onDeck : whole) {
          const top = topAt(f, q, ceiling);
          if (top !== null && top - base > worst) [worst, at] = [top - base, `${(q.x - place.center.x).toFixed(2)},${(q.z - place.center.z).toFixed(2)}`];
        }
        if (worst >= 0.12) out.push(`${a.id} : ${NAMES[i] ?? (i < NAMES.length + obstacles.length ? 'un pont' : 'un autre aménagement')} monte de ${worst.toFixed(2)} en ${at}`);
      });
    }
    expect(out).toEqual([]);
  });

  it('à l’écart de l’habitant et de Kéo, dans la scénette et dans la remise', () => {
    for (const { a, p } of placed) {
      for (const posed of [true, remisePosed(a.place)]) {
        const h = scenetteHabitant(a.place, posed);
        const k = scenetteKeo(a.place, posed).at;
        for (const q of footprint(objectOnly(p))) {
          expect(Math.hypot(q.x - h.x, q.z - h.z), a.id).toBeGreaterThan(0.5);
          expect(Math.hypot(q.x - k.x, q.z - k.z), a.id).toBeGreaterThan(0.5);
        }
      }
    }
  });

  it('au sol, à sec et presque à plat ; sur une pente, à plat sur son assise, sans jamais s’enfoncer ; sur la surface de son lieu ou la dalle de la scène quand il y est posé', () => {
    const out: string[] = [];
    for (const { a, p } of placed) {
      const base = p.base;
      // La potence de façade ne pose au sol que son mât : sa flèche est en l'air (vérifiée avec elle, plus bas).
      const standing = a.facade ? { ...p.facets, positions: p.facets.positions.slice(0, p.elements[0].to * 9) } : objectOnly(p);
      const under = footprint(standing);
      if (a.scene) {
        // Sur la dalle de la scène de la remise (les Balises) : juste au-dessus d'elle, partout sous sa forme.
        const deck = within(scenetteDecor(a.place, false, remisePosed(a.place)), boundsOf(p.facets));
        for (const q of under) {
          const top = topAt(deck, q);
          if (top === null || base - top < 0 || base - top > 0.05) out.push(`${a.id} : hors de la dalle de la scène en ${q.x.toFixed(2)},${q.z.toFixed(2)} (${top?.toFixed(2)})`);
        }
      } else if (a.floor === undefined) {
        const heights = under.map((q) => ground(q.x, q.z));
        const [low, high] = [Math.min(...heights), Math.max(...heights)];
        if (low <= 0.05) out.push(`${a.id} : dans l’eau (${low.toFixed(2)})`);
        if (a.assise) {
          // Aucun enfoncement visible : au plus 0,03 sous le sol, partout sous sa forme ; la pente, rattrapée par l'assise.
          if (high - base > 0.03) out.push(`${a.id} : s’enfonce de ${(high - base).toFixed(2)}`);
          if (high - low >= 0.6) out.push(`${a.id} : pente de ${(high - low).toFixed(2)}`);
        } else {
          if (high - low >= 0.3) out.push(`${a.id} : pente de ${(high - low).toFixed(2)}`);
          if (Math.abs(base - low) > 0.05) out.push(`${a.id} : posé à ${base.toFixed(2)}, le sol à ${low.toFixed(2)}`);
        }
      } else {
        const c = placeById(a.place).center;
        expect(base, a.id).toBeCloseTo(standingHeight(ground(c.x, c.z)) + a.floor, 5);
        const model = within(constructionFacets(a.place, [WHOLE], ground), boundsOf(p.facets));
        for (const q of under) {
          const top = topAt(model, q, base + 0.2);
          if (top === null || Math.abs(top - base) > 0.05) out.push(`${a.id} : hors de la surface en ${q.x.toFixed(2)},${q.z.toFixed(2)} (${top?.toFixed(2)})`);
        }
      }
    }
    expect([...new Set(out)].slice(0, 20)).toEqual([]);
  });

  it('l’assise de pierre : sous les seuls objets posés sur une pente ou sur la dalle de la scène, de leur pied jusque sous le sol, dans la pierre du muret', () => {
    for (const { a, p } of placed) {
      expect(Boolean(p.assise), a.id).toBe(Boolean(a.assise || a.scene));
      if (!p.assise) continue;
      const stone = { ...p.facets, positions: p.facets.positions.slice(0, p.assise.to * 9) };
      const b = boundsOf(stone as Facets);
      expect(b.max[1], a.id).toBeCloseTo(p.base, 5);
      // Son pied sous le sol, partout : elle ne flotte jamais.
      for (const q of footprint(stone as Facets)) expect(ground(q.x, q.z), a.id).toBeGreaterThan(b.min[1]);
      // Dans la pierre du muret, et rien d'autre (le morceau de quai, dans celle du quai de la scène) ; elle se pose avec le
      // premier élément.
      const quai = (a.quai ? QUAI_TRIANGLES : 0) * 9;
      for (let k = 0; k < p.assise.to * 9; k += 3) {
        const stones = k < quai ? QUAI_STONE : ASSISE_STONE;
        const c = [p.facets.colors[k], p.facets.colors[k + 1], p.facets.colors[k + 2]];
        expect([linearRgb(stones.dessus), linearRgb(stones.cote)].some((rgb) => rgb.every((v, i) => Math.abs(v - c[i]) < 1e-3)), a.id).toBe(true);
      }
      expect(p.elements[0].from).toBe(0);
    }
    expect(AMENAGEMENTS.filter((a) => a.assise || a.scene).map((a) => a.place).sort()).toEqual(['beacons', 'ecluses', 'phare']);
  });

  it('le potager du Phare prolonge le jardin clos par l’ouverture de son muret est, à plat au niveau du seuil, son assise côté tour', () => {
    const potager = byId('french-6e-phonology-fixture-1');
    const c = placeById('phare').center;
    const b = boundsOf(objectOnly(potager.p));
    const g = PHARE_GARDEN;
    // Son bord ouest dans l'épaisseur du muret est (0,3), là où il est ouvert ; tout entier dans la largeur de l'ouverture.
    const wall = c.x + g.x + g.w / 2;
    expect(b.min[0]).toBeGreaterThanOrEqual(wall - 0.15);
    expect(b.min[0]).toBeLessThanOrEqual(wall + 0.15);
    const half = g.d / 2 - g.eastWall;
    expect(b.min[2]).toBeGreaterThanOrEqual(c.z + g.z - half);
    expect(b.max[2]).toBeLessThanOrEqual(c.z + g.z + half);
    // Son dessus à plat, au niveau du seuil du muret (pas surélevé comme les carrés du jardin : sa bordure basse, au sol) ;
    // aucun coin ne s'enfonce de plus de 0,03 ; côté tour, où le sol descend, l'assise rattrape la pente.
    expect(Math.abs(potager.p.base - ground(wall, c.z + g.z))).toBeLessThan(0.03);
    for (const x of [b.min[0], b.max[0]]) for (const z of [b.min[2], b.max[2]]) expect(ground(x, z) - potager.p.base).toBeLessThanOrEqual(0.03);
    expect(ground(b.max[0], c.z + g.z)).toBeLessThan(potager.p.base - 0.05);
  });

  it('le lavoir des Écluses, à la marche, sur le morceau du quai de la scène : son assise n’en dépasse pas d’une marche basse ; le quai, à fleur du sol en haut de la pente, un mur droit en bas, contre la maison, hors de l’axe de sa porte et de la table', () => {
    const { a, p } = byId('maths-6e-fractions-fixture-1');
    const c = placeById('ecluses').center;
    expect(AMENAGEMENTS.filter((x) => x.quai).map((x) => x.id)).toEqual([a.id]);
    const q = a.quai!;
    const top = p.quai!;
    const quai = { ...p.facets, positions: p.facets.positions.slice(0, QUAI_TRIANGLES * 9) };
    const b = boundsOf(quai);
    // Le dessus du quai, sous tout ce qui pose le lavoir (ses triangles qui touchent son pied ; son toit déborde) : son
    // assise le dépasse de moins d'une marche basse (0,3), partout.
    expect(b.max[1]).toBeCloseTo(top, 5);
    const lavoir = objectOnly(p);
    const feet: number[] = [];
    for (let k = 0; k < lavoir.positions.length; k += 9) if (Math.min(lavoir.positions[k + 1], lavoir.positions[k + 4], lavoir.positions[k + 7]) < p.base + 0.1) feet.push(...lavoir.positions.slice(k, k + 9));
    for (const pt of footprint({ ...lavoir, positions: new Float32Array(feet) })) {
      const under = topAt(quai, pt);
      expect(under, `${pt.x.toFixed(2)},${pt.z.toFixed(2)}`).not.toBeNull();
      expect(p.base - (under ?? -Infinity)).toBeGreaterThanOrEqual(0);
      expect(p.base - (under ?? -Infinity)).toBeLessThanOrEqual(0.3);
    }
    // De la marge autour du lavoir, sur le quai (pas juste au bord) ; à l'est, contre l'assise de la maison. Au nord et au
    // sud, son pied garde au moins 0,1 de quai (directeur artistique, quatrième passe) ; son toit déborde, sans sortir du quai.
    const o = boundsOf(objectOnly(p));
    expect(o.min[0] - b.min[0]).toBeGreaterThanOrEqual(0.3);
    expect(Math.min(o.min[2] - b.min[2], b.max[2] - o.max[2])).toBeGreaterThanOrEqual(0);
    const pied = boundsOf({ ...lavoir, positions: new Float32Array(feet) });
    expect(Math.min(pied.min[2] - b.min[2], b.max[2] - pied.max[2])).toBeGreaterThanOrEqual(0.1);
    // Le morceau du quai de la scène : à la hauteur de sa dalle (un rien dessous : dans la remise, elle le couvre), et dans
    // elle, vu d'en haut.
    const deck = within(scenetteDecor('ecluses', false, true), b);
    for (const pt of [{ x: b.min[0] + 0.01, z: b.min[2] + 0.01 }, { x: b.min[0] + 0.01, z: b.max[2] - 0.01 }, { x: b.max[0] - 0.01, z: b.min[2] + 0.01 }, { x: b.max[0] - 0.01, z: b.max[2] - 0.01 }]) {
      const d = topAt(deck, pt, top + 0.1);
      expect(d, `${pt.x.toFixed(2)},${pt.z.toFixed(2)}`).not.toBeNull();
      expect((d ?? Infinity) - top).toBeGreaterThan(0);
      expect((d ?? Infinity) - top).toBeLessThan(0.05);
    }
    // Son pied sous le sol partout : il ne flotte jamais ; en haut de la pente, à fleur du sol (moins de 0,3) ; en bas, un mur.
    let [low, high] = [Infinity, -Infinity];
    for (const pt of footprint(quai)) {
      const g = ground(pt.x, pt.z);
      expect(g).toBeGreaterThan(b.min[1]);
      [low, high] = [Math.min(low, g), Math.max(high, g)];
    }
    expect(top - high).toBeLessThan(0.3);
    expect(top - low).toBeGreaterThan(0.6);
    // Contre l'assise de la maison de l'éclusier (son mur ouest), sans entrer dans sa porte : le quai s'arrête au nord de
    // l'axe de la porte, qui donne à l'ouest ; la porte, plus haut que le pied de la maison, au-dessus de son assise.
    const house = within(constructionFacets('ecluses', [WHOLE], ground), { min: [b.max[0] - 0.01, 0, b.min[2]], max: [b.max[0] + 0.3, 0, b.max[2]] });
    expect(topAt(house, { x: b.max[0] + 0.05, z: (b.min[2] + b.max[2]) / 2 }, top)).not.toBeNull();
    expect(c.x + q.x[1]).toBeCloseTo(b.max[0], 5);
    const model = constructionFacets('ecluses', [WHOLE], ground);
    let door = Infinity;
    for (let k = 0; k < model.positions.length; k += 9) {
      const xs = [model.positions[k], model.positions[k + 3], model.positions[k + 6]];
      const zs = [model.positions[k + 2], model.positions[k + 5], model.positions[k + 8]];
      const ys = [model.positions[k + 1], model.positions[k + 4], model.positions[k + 7]];
      // La porte : la feuille fine posée contre le mur ouest, du seuil à hauteur d'épaule.
      const thin = Math.max(...xs) - Math.min(...xs) < 0.1 && Math.max(...zs) - Math.min(...zs) < 0.8;
      if (thin && Math.min(...xs) > b.max[0] - 0.1 && Math.min(...xs) < b.max[0] + 0.2 && Math.max(...ys) - Math.min(...ys) > 0.9) door = Math.min(door, ...zs);
    }
    expect(door).toBeLessThan(Infinity);
    expect(b.max[2]).toBeLessThanOrEqual(door);
    // La table de l'éclusier : au sud du quai, sans le toucher ; ses pieds dans le sol, jamais en l'air.
    const table = placeTrace('ecluses', ['sharing']);
    const gate = placeTrace('ecluses', []).positions.length;
    const t = boundsOf({ ...table, positions: table.positions.slice(gate) });
    expect(t.min[2]).toBeGreaterThan(b.max[2] + 0.1);
    for (let k = gate; k < table.positions.length; k += 3) if (table.positions[k + 1] < t.min[1] + 1e-4) expect(ground(table.positions[k], table.positions[k + 2])).toBeGreaterThan(table.positions[k + 1]);
    // Loin des chemins de Kéo.
    for (const s of networkSamples(0.25)) expect(Math.max(b.min[0] - s.x, s.x - b.max[0], b.min[2] - s.z, s.z - b.max[2])).toBeGreaterThan(1);
  });

  it('plus bas que l’habitant d’une scénette, à l’échelle commune ; la grue des Archives, potence de façade, la seule exception', () => {
    expect(AMENAGEMENT_SCALE).toBe(0.45);
    expect(AMENAGEMENTS.filter((a) => a.facade).map((a) => a.id)).toEqual(['french-6e-word-spelling-fixture-1']);
    expect(AMENAGEMENTS.filter((a) => a.scale !== undefined).map((a) => a.id)).toEqual(['french-6e-word-spelling-fixture-1']);
    for (const { a, p } of placed) {
      if (a.facade) continue;
      expect(boundsOf(objectOnly(p)).max[1] - p.base, a.id).toBeLessThanOrEqual(HABITANT_HEIGHT);
    }
  });

  it('la potence de façade : le pied du mât contre le pilier d’angle gauche, le haut du mât juste sous l’architrave, sa flèche vers l’avant et l’ouest, entre un quart et un tiers du mât, le panier sous son bout', () => {
    const { a, p } = byId('french-6e-word-spelling-fixture-1');
    const c = placeById('archives').center;
    const model = constructionFacets('archives', [WHOLE], ground);
    const b = boundsOf(p.facets);
    // Le mât, le premier élément : son pied, son axe.
    const mast = boundsOf({ ...p.facets, positions: p.facets.positions.slice(0, p.elements[0].to * 9) });
    const foot = { x: (mast.min[0] + mast.max[0]) / 2, z: (mast.min[2] + mast.max[2]) / 2 };
    // L'architrave au-dessus du mât : le bas de ce qui passe au-dessus de lui (plus haut que l'habitant), au droit du mât
    // (son pavé n'a pas de dessous : le bas de sa face avant, qui court au-dessus de lui).
    let architrave = Infinity;
    for (let k = 0; k < model.positions.length; k += 9) {
      const xs = [model.positions[k], model.positions[k + 3], model.positions[k + 6]];
      const ys = [model.positions[k + 1], model.positions[k + 4], model.positions[k + 7]];
      const zs = [model.positions[k + 2], model.positions[k + 5], model.positions[k + 8]];
      if (Math.min(...ys) < p.base + HABITANT_HEIGHT || Math.min(...xs) > foot.x || Math.max(...xs) < foot.x || Math.abs(Math.min(...zs) - foot.z) > 1.5) continue;
      architrave = Math.min(architrave, Math.min(...ys));
    }
    expect(architrave).toBeLessThan(Infinity);
    // Le haut de la flèche juste sous l'architrave, jamais au-dessus ; plus haut que l'habitant : elle se mesure à la façade.
    expect(b.max[1]).toBeLessThanOrEqual(architrave);
    expect(b.max[1]).toBeGreaterThan(architrave - 0.25);
    expect(b.max[1] - p.base).toBeGreaterThan(HABITANT_HEIGHT);
    // Le pied du mât à moins de 0,1 de la façade : juste à l'est de lui (vers la colonnade), la base du pilier monte.
    const q = { x: mast.max[0] + 0.1, z: foot.z };
    const east = topAt(within(model, { min: [q.x - 0.05, 0, q.z - 0.05], max: [q.x + 0.05, 0, q.z + 0.05] }), q, p.base + 1);
    expect((east ?? -Infinity) - p.base).toBeGreaterThan(0.12);
    // Contre le pilier d'angle gauche, à l'ouest de la colonnade (du côté opposé aux Quais), jamais devant une colonne.
    expect(foot.x).toBeLessThan(c.x - 2.7);
    // La flèche (deuxième passe du directeur artistique, point A) : de l'axe du mât à son bout, entre un quart et un tiers
    // du mât, vers l'avant (vers la caméra, +z) et l'ouest (−x), à 45 degrés environ ; son dessus sous le haut du mât (du
    // jour sous l'architrave).
    const mastHeight = b.max[1] - p.base;
    expect(POTENCE.jib).toBeGreaterThanOrEqual(POTENCE.mast / 4);
    expect(POTENCE.jib).toBeLessThanOrEqual(POTENCE.mast / 3);
    const P = p.facets.positions;
    let [reach, tip, jibTop] = [0, { x: foot.x, z: foot.z }, -Infinity];
    for (let k = p.elements[1].from * 9; k < P.length; k += 3) {
      const r = Math.hypot(P[k] - foot.x, P[k + 2] - foot.z);
      if (r > reach) [reach, tip] = [r, { x: P[k], z: P[k + 2] }];
      jibTop = Math.max(jibTop, P[k + 1]);
    }
    expect(reach).toBeGreaterThanOrEqual(mastHeight / 4);
    expect(reach).toBeLessThanOrEqual(mastHeight / 3);
    const angle = (Math.atan2(tip.z - foot.z, foot.x - tip.x) * 180) / Math.PI;
    expect(angle).toBeGreaterThan(30);
    expect(angle).toBeLessThan(60);
    expect(jibTop).toBeLessThan(b.max[1] - 0.05);
    // Le panier sous le bout de la flèche : le bas de l'objet, hors du mât, est sous les deux derniers tiers de la flèche.
    let [low, lowAt] = [Infinity, { x: 0, z: 0 }];
    for (let k = p.elements[1].from * 9; k < P.length; k += 3) if (P[k + 1] < low) [low, lowAt] = [P[k + 1], { x: P[k], z: P[k + 2] }];
    expect(Math.hypot(lowAt.x - foot.x, lowAt.z - foot.z)).toBeGreaterThan(reach * 0.6);
    // Au-dessus du socle ou de sa marche, partout sous la flèche et ce qu'elle porte : jamais au-dessus du parvis, où passe
    // Kéo vers les marches.
    const jib = { ...p.facets, positions: P.slice(p.elements[1].from * 9) };
    const under = within(model, boundsOf(jib));
    for (const q of footprint(jib)) {
      const top = topAt(under, q, p.base + 0.2);
      expect(top, `${q.x.toFixed(2)},${q.z.toFixed(2)}`).not.toBeNull();
      expect(p.base - (top ?? -Infinity), `${q.x.toFixed(2)},${q.z.toFixed(2)}`).toBeLessThan(0.2);
    }
    // La coupe : deux éléments, le mât puis la flèche et ce qu'elle porte.
    expect(a.elements).toHaveLength(2);
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
    [800, 1280],
  ] as const;
  /** La marge, en pixels, entre un aménagement et le bord de la scène de la remise. */
  const MARGIN = 12;

  /** Le cadrage de la remise d'un lieu, sur un écran : sa pose, et le point d'un coin du monde dans la scène. */
  function remiseOf(place: PlaceId, w: number, h: number) {
    const list = placed.filter((o) => o.a.place === place);
    const include = remiseInclude(list.map((o) => ({ a: o.a, box: o.p.box })));
    const { pose, shift } = remisePose(place, include, remiseStage(w, h), w, h, remisePosed(place));
    const onScreen = (box: { min: readonly number[]; max: readonly number[] }) => {
      const s: { x: number; y: number }[] = [];
      for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) s.push(screenOf(pose, { x, y, z }, w, h));
      return { l: Math.min(...s.map((q) => q.x)) - shift.x, r: Math.max(...s.map((q) => q.x)) - shift.x, t: Math.min(...s.map((q) => q.y)) - shift.y, b: Math.max(...s.map((q) => q.y)) - shift.y };
    };
    return { list, onScreen };
  }

  it('toucher un aménagement ouvre son lieu, jamais un autre : en plein, et dans le disque de 48 px au moins autour, aux trois formats', () => {
    const out: string[] = [];
    const near = OBJECT_TOUCH_PIXELS - 6;
    for (const p of PLACES)
      for (const [w, h] of screens) {
        const { list, onScreen } = remiseOf(p.id, w, h);
        // Les aménagements de ce lieu et de ses voisins proches, comme la scène les met en concurrence sous le doigt.
        const targets: ObjectTarget[] = placed
          .filter((o) => Math.hypot(o.p.box.min[0] - p.center.x, o.p.box.min[2] - p.center.z) < 16)
          .map((o) => {
            const r = onScreen(o.p.box);
            return { place: o.a.place, rect: { left: r.l, top: r.t, right: r.r, bottom: r.b } };
          });
        for (const o of list) {
          const r = onScreen(o.p.box);
          const [cx, cy] = [(r.l + r.r) / 2, (r.t + r.b) / 2];
          for (const [dx, dy] of [[0, 0], [near, 0], [-near, 0], [0, near], [0, -near]]) {
            const got = touchedObject(cx + dx, cy + dy, targets);
            if (got !== p.id) out.push(`${o.a.id} ${w}×${h} (${dx}, ${dy}) : ${got ?? 'rien'}`);
          }
        }
      }
    expect(out).toEqual([]);
  });

  it('chaque aménagement tient entier dans la scène de la remise, avec une marge, avec l’habitant et Kéo, aux trois formats', () => {
    const out: string[] = [];
    for (const p of PLACES)
      for (const [w, h] of screens) {
        const stage = remiseStage(w, h);
        const { list, onScreen } = remiseOf(p.id, w, h);
        for (const o of list) {
          const s = onScreen(o.p.box);
          const m = Math.min(s.l - stage.left, stage.right - s.r, s.t - stage.top, stage.bottom - s.b);
          if (m < MARGIN) out.push(`${o.a.id} ${w}×${h} : marge ${m.toFixed(0)} px`);
        }
      }
    expect(out).toEqual([]);
  });

  it('l’écran change de taille pendant la remise (une tablette qui tourne) : le cadrage se recalcule, l’aménagement reste entier dans la nouvelle scène', () => {
    const out: string[] = [];
    let stale = 0;
    /** La marge, à l'écran de `w` × `h`, de la boîte `box` vue avec la pose `fit` ; négative quand elle sort de la scène. */
    const margin = (fit: ReturnType<typeof remiseFrame>, box: { min: readonly number[]; max: readonly number[] }, w: number, h: number) => {
      const stage = remiseStage(w, h);
      const s: { x: number; y: number }[] = [];
      for (const x of [box.min[0], box.max[0]]) for (const y of [box.min[1], box.max[1]]) for (const z of [box.min[2], box.max[2]]) s.push(screenOf(fit.pose, { x, y, z }, w, h));
      const [l, r] = [Math.min(...s.map((q) => q.x)) - fit.shift.x, Math.max(...s.map((q) => q.x)) - fit.shift.x];
      const [t, b] = [Math.min(...s.map((q) => q.y)) - fit.shift.y, Math.max(...s.map((q) => q.y)) - fit.shift.y];
      return Math.min(l - stage.left, stage.right - r, t - stage.top, stage.bottom - b);
    };
    for (const p of PLACES) {
      const list = placed.filter((o) => o.a.place === p.id);
      if (!list.length) continue;
      const boxes = list.map((o) => ({ a: o.a, box: o.p.box }));
      const before = remiseFrame(p.id, boxes, 1024, 768);
      const after = remiseFrame(p.id, boxes, 768, 1024);
      for (const o of list) {
        const m = margin(after, o.p.box, 768, 1024);
        if (m < MARGIN) out.push(`${o.a.id} 768×1024 : marge ${m.toFixed(0)} px`);
        if (margin(before, o.p.box, 768, 1024) < MARGIN) stale++;
      }
    }
    expect(out).toEqual([]);
    // Sans le recalcul, la pose de l'ancienne taille sortirait des aménagements de la scène.
    expect(stale).toBeGreaterThan(0);
  });

  it('au Phare, le potager garde au moins sa largeur jusqu’au bord gauche du cadre ; la lanterne reste entière', () => {
    for (const [w, h] of screens) {
      const stage = remiseStage(w, h);
      const { onScreen } = remiseOf('phare', w, h);
      const s = onScreen(byId('french-6e-phonology-fixture-1').p.box);
      expect(s.l - stage.left, `${w}×${h}`).toBeGreaterThanOrEqual(s.r - s.l);
      const l = onScreen(byId('french-6e-phonology-fixture-2').p.box);
      expect(stage.right - l.r, `${w}×${h}`).toBeGreaterThanOrEqual(MARGIN);
    }
  });

  it('à la Gare maritime, la vitrine, du côté de Kéo (l’exception de côté), reste hors de la bande de passage entre Kéo et l’habitant', () => {
    const { p } = byId('english-6e-grammar-fixture-1');
    const k = scenetteKeo('ferry', remisePosed('ferry')).at;
    const h = scenetteHabitant('ferry', remisePosed('ferry'));
    for (const q of footprint(p.facets)) {
      const between = q.x >= Math.min(k.x, h.x) && q.x <= Math.max(k.x, h.x);
      expect(between && Math.abs(q.z - (k.z + h.z) / 2) < 0.6).toBe(false);
    }
    // Du côté de Kéo : à l'ouest de lui.
    expect(boundsOf(p.facets).max[0]).toBeLessThan(k.x);
  });

  it('devant l’habitant ou Kéo (plus près de la caméra), un aménagement ne les couvre jamais à l’écran', () => {
    const out: string[] = [];
    for (const p of PLACES) {
      const posed = remisePosed(p.id);
      const h = scenetteHabitant(p.id, posed);
      const k = scenetteKeo(p.id, posed).at;
      // L'habitant et Kéo, en boîtes (une épaule de chaque côté ; l'habitant de sa hauteur, Kéo de la sienne, plus petit).
      const figures = [
        { name: 'l’habitant', min: [h.x - 0.3, h.y, h.z - 0.3], max: [h.x + 0.3, h.y + HABITANT_HEIGHT, h.z + 0.3] },
        { name: 'Kéo', min: [k.x - 0.3, k.y, k.z - 0.3], max: [k.x + 0.3, k.y + 1, k.z + 0.3] },
      ];
      for (const [w, hh] of screens) {
        const { list, onScreen } = remiseOf(p.id, w, hh);
        for (const o of list) {
          const ob = o.p.box;
          for (const f of figures) {
            // Derrière la figure (plus loin de la caméra, au nord), c'est elle qui le cache en partie : permis.
            if (ob.max[2] <= f.min[2]) continue;
            // Seule la part de l'objet plus près que le dos de la figure peut la couvrir ; à côté d'elle (sans rien de
            // commun en x), seule sa part plus près que le devant de la figure.
            const beside = ob.max[0] < f.min[0] || ob.min[0] > f.max[0];
            const near = beside ? f.max[2] : f.min[2];
            if (ob.max[2] <= near) continue;
            const so = onScreen({ min: [ob.min[0], ob.min[1], Math.max(ob.min[2], near)], max: ob.max });
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
    expect(map.triangles).toBe(mapCost(0).triangles + cost.triangles);
    expect(map.triangles).toBeLessThanOrEqual(OPEN_WORLD_BUDGET.triangles);
  });
});

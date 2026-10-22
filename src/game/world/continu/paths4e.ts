// Le réseau des chemins du 4e (lot 1 du monde ouvert du 4e) : ses nœuds et ses liaisons (./plan4e.ts), le plus court
// trajet, et son dessin, un ruban par liaison comme au 6e et au 5e (./paths.ts, `networkRibbons`). Le ruban s'arrête aux
// culées d'un pont : le pont du bassin, sur l'eau ; le pont du ravin et le pont de basalte, sur une coupure sèche
// (./bridges.ts les dessine). Avec eux, dans le même maillage (aucun appel de plus) : la ligne de rails en masses (son
// ballast, ses deux rails de fer rouillé, ses traverses, le butoir de la Forge et les heurtoirs), la rigole couverte de
// la Forge, vide et grise, et la passerelle de l'aire, du quai de la Crique à l'aire de la Nef. Code pur.
import { FacetBuilder, mergeFacets, placeFacets, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import type { LinkedLand } from './lands';
import { createNetwork } from './network';
import { BRIDGE_ABUT } from './plan6e';
import { COLORS_4E, CRIQUE, CRIQUE_PAD, JONCTION_TRACK_4E, LINKS_4E, PATH_EDGES_4E, PATH_NODES_4E, RAILS_4E, RIGOLE_4E, criqueFloor, type Cut4e } from './plan4e';
import { networkRibbons, type RibbonNet } from './paths';
import { C4E, postLantern } from './place4eKit';
import { standingHeight } from './terrain';
import { bassinClearance, couleeClearance, ravinClearance } from './terrain4e';

/** Le réseau du 4e. */
export const NETWORK_4E = createNetwork(PATH_NODES_4E, PATH_EDGES_4E);

/** Les terres du 4e qu'on relie, et leur passage. */
type Link4e = keyof typeof LINKS_4E;

/** Une terre qu'on relie est-elle du 4e ? */
export const isLand4e = (land: LinkedLand): land is Link4e => land in LINKS_4E;

/** La distance au bord de chaque coupure : négative dedans (l'eau du bassin, le creux du ravin, la croûte de la coulée). */
export const CUT_CLEARANCE_4E: Readonly<Record<Cut4e, (p: Vec2) => number>> = { bassin: bassinClearance, ravin: ravinClearance, coulee: couleeClearance };

/** La part d'une liaison, de `a` à `c`, où `inside` est vrai (de `from` à `to` unités depuis `a`). */
function spanWhere(a: Vec2, c: Vec2, inside: (p: Vec2) => boolean): [number, number] {
  const len = distance(a, c);
  const STEP = 0.05;
  let from = len;
  let to = 0;
  for (let d = 0; d <= len; d += STEP) {
    if (!inside({ x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len })) continue;
    from = Math.min(from, d);
    to = Math.max(to, d);
  }
  return [from, to];
}

/** La part d'un passage du 4e que prennent les culées de son pont : à moins de `BRIDGE_ABUT` unités de sa coupure, comme au 6e. */
export const passageCut4e = (a: Vec2, c: Vec2, land: Link4e): readonly [number, number] => spanWhere(a, c, (p) => CUT_CLEARANCE_4E[LINKS_4E[land].cut](p) < BRIDGE_ABUT);

/** Le passage d'une liaison du 4e, s'il y en a un. */
function passageOfEdge(ia: string, ib: string): Link4e | null {
  for (const land of Object.keys(LINKS_4E) as Link4e[]) {
    const [u, v] = LINKS_4E[land].bridge;
    if ((u === ia && v === ib) || (u === ib && v === ia)) return land;
  }
  return null;
}

const cuts = new Map<number, readonly [number, number] | null>();

/** La part d'une liaison que prend un pont (ses culées), ou rien. */
function cutOf(edge: number): readonly [number, number] | null {
  if (!cuts.has(edge)) {
    const [ia, ib] = PATH_EDGES_4E[edge];
    const land = passageOfEdge(ia, ib);
    cuts.set(edge, land ? passageCut4e(NETWORK_4E.pathNode(ia).at, NETWORK_4E.pathNode(ib).at, land) : null);
  }
  return cuts.get(edge)!;
}

/** Le réseau du 4e, pour son dessin : la pierre de la Crique n'a pas de sentier, comme l'Escale. */
export const RIBBONS_4E: RibbonNet = {
  edges: PATH_EDGES_4E,
  node: (id) => NETWORK_4E.pathNode(id),
  cut: cutOf,
  skip: (p) => criqueFloor(p.x, p.z) !== null,
  planks: () => false,
};

/**
 * La ligne de rails en masses (fiche, § 5 ; lot 1) : un ballast brun, deux rails de fer rouillé, une traverse de bois
 * tous les `sleeper` unités ; au bout de la ligne, contre la halle de l'Étalon, le butoir de la Forge (un bloc de bois
 * cerclé de cuivre). Les heurtoirs des deux voies de service, la plaque tournante et le tronçon du rail tordu sont à la
 * Jonction (./jonction4e.ts, `JONCTION_TRACK_4E`), pour que sa ruine et ses étapes les changent. Ni benne au lot 1.
 * Les rails s'arrêtent au bout des culées des ponts (`railCut`) : le pont, posé, les porte de rive à rive (l'arche de
 * l'Épaule, lot 3). Le ballast et les rails sont des bandes continues, par pans de `piece` unités qui suivent le sol
 * (retouche 1 du lot 1, expert frontend : un pavé par traverse coûtait deux fois plus) ; seules les traverses se
 * répètent. Exportés pour les rails de l'arche de l'Épaule (./bridges.ts), du même dessin.
 */
export const RAILS_LOOK_4E = { gauge: 0.7, rail: 0.12, ballast: 1.15, ballastTop: 0.1, ballastFoot: 0.25, sleeper: 1.6, sleeperLength: 1.5, lift: 0.07, piece: 3.2 } as const;

/** Un point est-il sous un pont (dans la part que prennent ses culées) ? Les rails s'y arrêtent. */
const railCut = (p: Vec2): boolean => (Object.keys(LINKS_4E) as Link4e[]).some((land) => CUT_CLEARANCE_4E[LINKS_4E[land].cut](p) < BRIDGE_ABUT);

type P3 = readonly [number, number, number];

/** Un quadrilatère tourné vers `out` (sa normale du même côté), quel que soit l'ordre de ses coins. */
function quadFacing(b: FacetBuilder, a: P3, c: P3, d: P3, e: P3, out: P3, color: number): void {
  const ux = c[0] - a[0], uy = c[1] - a[1], uz = c[2] - a[2];
  const vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
  const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) b.quad(a, c, d, e, color);
  else b.quad(e, d, c, a, color);
}

/**
 * Une bande le long d'une voie, de `p` à `q` (leur sol `yp`, `yq`) : décalée de `off` en travers, large de `2 × half`,
 * son dessus à `top` au-dessus du sol, ses deux flancs jusqu'à `foot` sous lui.
 */
function strip(b: FacetBuilder, p: Vec2, q: Vec2, yp: number, yq: number, off: number, half: number, top: number, foot: number, side: number, face: number): void {
  const len = distance(p, q) || 1e-6;
  const nx = (q.z - p.z) / len,
    nz = -(q.x - p.x) / len;
  const at = (o: Vec2, y: number, v: number, h: number): P3 => [o.x + nx * (off + v), y + h, o.z + nz * (off + v)];
  quadFacing(b, at(p, yp, -half, top), at(q, yq, -half, top), at(q, yq, half, top), at(p, yp, half, top), [0, 1, 0], face);
  for (const s of [-1, 1]) quadFacing(b, at(p, yp, s * half, -foot), at(q, yq, s * half, -foot), at(q, yq, s * half, top), at(p, yp, s * half, top), [nx * s, 0, nz * s], side);
}

/**
 * Ce que le dessin des rails laisse au lieu, à `d` unités du début d'une ligne : tout (`tout` : ni ballast, ni rails, ni
 * traverses), les rails et les traverses seulement (`rails`), ou rien.
 */
type RailSkip = (d: number) => 'tout' | 'rails' | null;

/** Ce que la Jonction dessine elle-même sur une de ses voies de service (`JONCTION_TRACK_4E`). */
function sidingSkip(siding: number): RailSkip {
  const { plaque, twisted } = JONCTION_TRACK_4E;
  return (d) => {
    if (plaque.siding === siding && Math.abs(d - plaque.d) < plaque.pit) return 'tout';
    if (twisted.siding === siding && d > twisted.from && d < twisted.to) return 'rails';
    return null;
  };
}

/** Les rails d'une ligne, sur le sol `ground` : le ballast et deux rails par pans, une traverse par pas ; rien sous un pont, ni où le lieu dessine (`skip`). */
function railLine(b: FacetBuilder, line: readonly Vec2[], ground: (x: number, z: number) => number, skip: RailSkip = () => null): void {
  const R = RAILS_LOOK_4E;
  const yOf = (p: Vec2) => standingHeight(ground(p.x, p.z)) + R.lift;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const yaw = Math.atan2(c.x - a.x, c.z - a.z);
    const along = (d: number): Vec2 => ({ x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len });
    // Le ballast et les rails, par pans : un pan hors d'un pont ; celui qui y entre, coupé au bout de la culée (lot 3,
    // l'Épaule : les rails de l'arche reliée en repartent, la ligne se lit d'un seul tenant) ; coupé aussi aux bords de ce
    // que le lieu dessine.
    const n = Math.max(1, Math.ceil(len / R.piece));
    const cutsAt = [...Array.from({ length: n + 1 }, (_, k) => (len * k) / n)];
    if (i === 1) {
      const { plaque, twisted } = JONCTION_TRACK_4E;
      for (const d of [plaque.d - plaque.pit, plaque.d + plaque.pit, twisted.from, twisted.to]) if (d > 0 && d < len && skip(d - 1e-3) !== skip(d + 1e-3)) cutsAt.push(d);
    }
    cutsAt.sort((u, v) => u - v);
    for (let k = 0; k < cutsAt.length - 1; k++) {
      let s0 = cutsAt[k],
        s1 = cutsAt[k + 1];
      const cut0 = railCut(along(s0)),
        cut1 = railCut(along(s1));
      if (cut0 && cut1) continue;
      if (cut0 || cut1) {
        // Le bout de la culée, par dichotomie : `free` hors du pont, `held` dessous.
        let free = cut0 ? s1 : s0,
          held = cut0 ? s0 : s1;
        for (let t = 0; t < 14; t++) {
          const m = (free + held) / 2;
          if (railCut(along(m))) held = m;
          else free = m;
        }
        if (cut0) s0 = free;
        else s1 = free;
      }
      const p = along(s0),
        q = along(s1);
      const left = i === 1 ? skip((s0 + s1) / 2) : null;
      if (left === 'tout') continue;
      const yp = yOf(p),
        yq = yOf(q);
      strip(b, p, q, yp, yq, 0, R.ballast, R.ballastTop, R.ballastFoot, COLORS_4E.ballast, COLORS_4E.ballast);
      if (left === 'rails') continue;
      for (const side of [-1, 1]) strip(b, p, q, yp + R.ballastTop + 0.08, yq + R.ballastTop + 0.08, (side * R.gauge) / 2, R.rail / 2, R.rail, 0, COLORS_4E.rustShade, COLORS_4E.rust);
    }
    // Les traverses, une par pas.
    const m = Math.max(1, Math.ceil(len / R.sleeper));
    for (let k = 0; k < m; k++) {
      const p = along((len * (k + 0.5)) / m);
      if (railCut(p) || (i === 1 && skip((len * (k + 0.5)) / m))) continue;
      b.box({ x: p.x, y: yOf(p) + R.ballastTop, z: p.z, yaw }, [R.sleeperLength, 0.08, 0.32], COLORS_4E.woodShade, COLORS_4E.wood);
    }
  }
}

/** Le butoir de la Forge, au bout de la ligne (`end`, la voie venant de `from`). */
function stopBlock(b: FacetBuilder, from: Vec2, end: Vec2, ground: (x: number, z: number) => number): void {
  const yaw = Math.atan2(end.x - from.x, end.z - from.z);
  const y = standingHeight(ground(end.x, end.z)) + RAILS_LOOK_4E.lift + RAILS_LOOK_4E.ballastTop;
  const w = 1.6;
  const h = 1.1;
  b.box({ x: end.x, y, z: end.z, yaw }, [w, h, 0.7], COLORS_4E.woodShade, COLORS_4E.wood);
  b.box({ x: end.x, y: y + h * 0.55, z: end.z, yaw }, [w + 0.06, 0.16, 0.76], COLORS_4E.rustShade);
}

/** Les rails du 4e : la ligne, son embranchement, ses deux voies de service (sauf ce que la Jonction dessine), le butoir. */
function railFacets4e(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  railLine(b, RAILS_4E.line, ground);
  railLine(b, RAILS_4E.branch, ground);
  const line = RAILS_4E.line;
  stopBlock(b, line[line.length - 2], line[line.length - 1], ground);
  RAILS_4E.sidings.forEach((siding, k) => railLine(b, siding, ground, sidingSkip(k)));
  return b.build();
}

/**
 * La rigole de la Forge (références : couverte devant la Forge) : un canal de pierre grise, couvert de dalles sur toute
 * sa longueur, vide ; seule sa prise, au bord de la cuvette, reste ouverte (un creux gris, sans lave : la restauration
 * l'allumera). Posée sur le sol, un rien au-dessus.
 */
const RIGOLE_LOOK_4E = { width: 1.5, height: 0.35, slab: 1.3, gap: 0.12 } as const;

function rigoleFacets(ground: (x: number, z: number) => number): Facets {
  const b = new FacetBuilder();
  const W = RIGOLE_LOOK_4E;
  const line = RIGOLE_4E;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    const len = distance(a, c);
    const yaw = Math.atan2(c.x - a.x, c.z - a.z);
    const n = Math.max(1, Math.round(len / W.slab));
    for (let k = 0; k < n; k++) {
      const d = (len * (k + 0.5)) / n;
      const p = { x: a.x + ((c.x - a.x) * d) / len, z: a.z + ((c.z - a.z) * d) / len };
      const y = standingHeight(ground(p.x, p.z)) - 0.15;
      const open = i === 1 && k === 0;
      // Les deux murets, puis la dalle qui couvre (sauf à la prise, ouverte sur son fond gris).
      for (const side of [-1, 1]) {
        const o = side * (W.width / 2 - 0.15);
        b.box({ x: p.x + Math.cos(yaw) * o, y, z: p.z - Math.sin(yaw) * o, yaw }, [0.3, W.height, len / n], COLORS_4E.stoneShade, COLORS_4E.stone);
      }
      if (open) b.box({ x: p.x, y, z: p.z, yaw }, [W.width - 0.3, 0.12, len / n], COLORS_4E.stoneShade);
      else b.box({ x: p.x, y: y + W.height, z: p.z, yaw }, [W.width + 0.1, 0.14, len / n - W.gap], COLORS_4E.stoneShade, COLORS_4E.stoneSun);
    }
  }
  return b.build();
}

/**
 * Les planches de la passerelle de l'aire et de l'aire (retouche 1 du lot 1, référent dys : le bois brun se confondait
 * avec la terre rouge, rapport 1,06) : un bois clair, blanchi, qui se détache par sa clarté ; ses flancs bruns.
 */
const PLANKS_4E = { top: 0xecd8b6, side: COLORS_4E.woodShade } as const;

/** Le pas des pieux de la passerelle de l'aire, et leur pied sous l'eau. */
const WALKWAY_PILES = { step: 3, foot: -2.4 } as const;

/**
 * Le cerclage de l'aire (lot 4, intention du directeur artistique du 22 octobre 2026, § 3 : la planche posait la coque
 * sur la terre battue ; l'aire doit se lire comme une plate-forme ronde de bois cerclée de fer, posée sur l'eau) : un
 * anneau plat de fer bruni sombre, large de `width`, en relief de `rise` sur le bord du dessus, en `sides` pans (l'aire
 * reste ronde à l'œil) ; sous lui, la bande du bord, du même fer, de `drop` sous les planches jusqu'au haut de l'anneau.
 * Un fer froid (retouche 1 du consultant d'Archipéo et du directeur artistique : le fer bruni des bittes, brun, s'y lisait
 * comme du bois sombre), plus clair sur le dessus ; les bittes gardent le leur.
 */
const PAD_RING = { width: 0.45, rise: 0.08, drop: 0.32, sides: 16, out: 0.06, iron: 0x4e4a4c, ironTop: 0x6e6a6c } as const;

/**
 * Sur l'anneau, les quatre bornes de fer bruni (à 60° et 120° de chaque côté de l'arrivée de la passerelle : aucune entre
 * elle et la coque) et les deux lanternes sur poteaux de fer, de part et d'autre de l'arrivée (à 25°), allumées dès
 * l'arrivée (l'aire est en service ; l'ocre fixe, sans ombre) : leurs angles depuis l'arrivée de la passerelle, leur rayon.
 */
const PAD_POSTS = { bollards: [60, 120, -60, -120], lanterns: [25, -25], radius: 4.25, lanternHeight: 1.9 } as const;

/** Un point de l'anneau de l'aire, à `deg` degrés de l'arrivée de la passerelle (vers −z du repère de la Crique). */
function onPad(deg: number, r: number = PAD_POSTS.radius): { x: number; z: number } {
  const a = (deg * Math.PI) / 180;
  return { x: CRIQUE_PAD.pad.x + r * Math.sin(a), z: CRIQUE_PAD.pad.z - r * Math.cos(a) };
}

/**
 * La passerelle de l'aire et l'aire de la Nef (fiche, § 5) : du bout du quai de la Crique, une passerelle de planches
 * sur pieux, puis l'aire ronde de bois cerclée de fer, sur l'eau de la baie ; sur son anneau, quatre bornes et deux
 * lanternes. Les pieux, posés sous les planches, sans chapeau (on ne le voit jamais). Rien de rouillé : le fer est bruni
 * (la rouille est aux ruines). Un décor : on n'y marche pas.
 */
export function criqueWalkwayFacets(): Facets {
  const b = new FacetBuilder();
  const { z0, z1, width, pad, radius, deck } = CRIQUE_PAD;
  const len = z1 - z0;
  b.box({ x: 0, y: deck - 0.25, z: (z0 + z1) / 2 }, [width, 0.25, len], PLANKS_4E.side, PLANKS_4E.top);
  for (let z = z0 + 0.6; z < z1; z += WALKWAY_PILES.step)
    for (const side of [-1, 1]) b.band({ x: side * (width / 2 - 0.2), y: WALKWAY_PILES.foot, z }, 0.23, deck - WALKWAY_PILES.foot - 0.2, 5, COLORS_4E.woodShade);
  // L'aire : un disque de planches, son cerclage de fer bruni (la bande du bord, l'anneau en relief), ses pieux tout autour.
  const R = PAD_RING;
  b.prism({ x: pad.x, y: deck - 0.3, z: pad.z }, radius, radius, 0.3, R.sides, PLANKS_4E.side, PLANKS_4E.top);
  b.band({ x: pad.x, y: deck - R.drop, z: pad.z }, radius + R.out, R.drop + R.rise, R.sides, R.iron);
  const inner = radius + R.out - R.width;
  const top = deck + R.rise;
  b.annulus({ x: pad.x, y: deck, z: pad.z }, inner, radius + R.out, R.rise, R.sides, R.iron, R.ironTop, false);
  // Le bord intérieur de l'anneau, tourné vers le milieu de l'aire (le relief, vu de l'autre côté de l'aire).
  const at = (k: number, y: number): [number, number, number] => {
    const a = (2 * Math.PI * k) / R.sides;
    return [pad.x + inner * Math.cos(a), y, pad.z + inner * Math.sin(a)];
  };
  for (let k = 0; k < R.sides; k++) b.quad(at(k, deck), at(k + 1, deck), at(k + 1, top), at(k, top), R.iron);
  for (let k = 0; k < 6; k++) {
    const a = (2 * Math.PI * k) / 6 + 0.26;
    b.band({ x: pad.x + Math.cos(a) * (radius - 0.5), y: WALKWAY_PILES.foot, z: pad.z + Math.sin(a) * (radius - 0.5) }, 0.25, deck - WALKWAY_PILES.foot - 0.3, 5, COLORS_4E.woodShade);
  }
  for (const deg of PAD_POSTS.bollards) {
    const p = onPad(deg);
    b.prism({ x: p.x, y: top, z: p.z }, 0.18, 0.15, 0.42, 6, C4E.iron, C4E.ironTop);
  }
  for (const deg of PAD_POSTS.lanterns) {
    const p = onPad(deg);
    postLantern(b, p.x, top, p.z, PAD_POSTS.lanternHeight, true);
  }
  return placeFacets(b.build(), { x: CRIQUE.origin.x, y: 0, z: CRIQUE.origin.z, yaw: CRIQUE.yaw });
}

/** Les chemins du 4e : un ruban par liaison, un octogone par nœud ; les rails, la rigole couverte, la passerelle de l'aire. */
export const pathRibbons4e = (ground: (x: number, z: number) => number): Facets =>
  mergeFacets([networkRibbons(RIBBONS_4E, ground), railFacets4e(ground), rigoleFacets(ground), criqueWalkwayFacets()]);

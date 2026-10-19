// La vie animale du 5e (choix du mainteneur, 19 octobre 2026, piste « Ambiance par terre ») : la faune du 6e
// (./wildlife.ts), terre par terre. Dans les Frondaisons, la forêt de racines noyées (« la mangrove » du mainteneur, jamais
// un nom de lieu), des crocodiles qui flottent au ras de l'eau des chenaux ou se dorent sur la rive, et des crabes de
// palétuvier ; dans les Roselières, des hérons au bord de l'eau et des poissons qui sautent ; dans les Contreforts, des
// aigrettes ; dans les Aiguilles, des choucas qui tournent autour des aiguilles. Elles ne servent pas le jeu : le décor
// vit. Code pur, sans Three.js : leurs places (tirées une fois), leurs formes en aplats et leurs poses à l'instant `t` ;
// la vue (three/archipeo/scene.ts) les tient comme celles du 6e, dans le même maillage.
//
// Règles dys (référent dys), celles du 6e : des gestes lents et rares, jamais de clignotement ; tout se fige pendant une
// question, une scénette ou sur la Carte ; avec « Réduire les animations », rien ne bouge (les choucas posés au pied de
// leur aiguille, aucun poisson ne saute). Les crocodiles ne font jamais peur (directeur artistique) : aucune dent, un
// museau arrondi, gueule fermée, aucun bruit ; ils ne bougent plus quand Kéo est près, ni dans l'eau ni sur la rive.
import { birdFacets } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { closestOnSegment, distance, type Vec2 } from './geometry';
import type { LandId } from './lands';
import { CHANNELS_5E, COAST_5E, DEPARTURE_5E, LANDS_5E, LINKS_5E, NEEDLES_5E, PATH_EDGES_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { heightAt5e, landDistance5e, onPlateau } from './terrain5e';
import { crabFacets, crabsOn, critterForms, ease, fishOn, phase, WILDLIFE, type CritterForm, type CritterGroup, type CritterPose } from './wildlife';

/**
 * Les mesures : les places tous les `spacing` unités de rive ; combien de groupes à la fois par espèce (`slots`) et de
 * bêtes par groupe (`perGroup`) ; le crocodile dérive de `crocDrift` unités en `crocTurn` secondes, et s'arrête peu à peu
 * quand Kéo approche (à `calm` unités, immobile ; à `calm + 6`, libre) ; le héron se repose `wadeRest` secondes, puis fait
 * un pas de `wadeStep` unités (ou se retourne) en `wadeMove` secondes ; le choucas tourne en `jackdawTurn` secondes autour
 * de son aiguille. Loin des lieux, du débarcadère, des passages et des chemins : le décor ne se mêle pas à ce qui se joue.
 */
export const WILDLIFE_5E = {
  spacing: 12,
  slots: { crocs: 2, crabs: 2, herons: 2, fish: 2, egrets: 2, jackdaws: 2 },
  perGroup: { egrets: 2, jackdaws: 3 },
  crocDrift: 0.7,
  crocTurn: 40,
  calm: 8,
  wadeRest: 8,
  wadeMove: 1.6,
  wadeStep: 0.5,
  jackdawTurn: 22,
  clearOfPlaces: 16,
  clearOfDeparture: 22,
  clearOfPassages: 12,
  clearOfPaths: 5,
  /** Le crocodile qui se dore, plus loin des chemins : sur la rive d'en face. */
  crocClearOfPaths: 8,
} as const;

/** Une place au bord de l'eau : sur la rive (`water` faux) ou dans l'eau ; le long de la rive, la direction de la terre, sa terre. */
export interface Spot5e {
  at: Vec2;
  water: boolean;
  /** Le long de la rive, unitaire. */
  along: Vec2;
  /** De l'eau vers la terre, unitaire. */
  toLand: Vec2;
  land: LandId;
}

const nodeAt = (id: string): Vec2 => PATH_NODES_5E.find((n) => n.id === id)!.at;
const PASSAGES = Object.values(LINKS_5E).flatMap((l) => l.bridge.map(nodeAt));
const PATHS = PATH_EDGES_5E.map(([a, b]) => [nodeAt(a), nodeAt(b)] as const);
const pathDistance = (p: Vec2): number => Math.min(...PATHS.map(([a, b]) => distance(p, closestOnSegment(p, a, b).point)));

/** La terre d'un point : celle du lieu le plus proche ; le plateau est aux Aiguilles. */
function landAt(p: Vec2): LandId {
  if (onPlateau(p)) return 'aiguilles';
  let best = PLACES_5E[0];
  for (const pl of PLACES_5E) if (distance(p, pl.center) < distance(p, best.center)) best = pl;
  return LANDS_5E.find((l) => l.places.includes(best.id))!.id;
}

const clear = (p: Vec2): boolean =>
  PLACES_5E.every((pl) => distance(p, pl.center) >= WILDLIFE_5E.clearOfPlaces) &&
  distance(p, DEPARTURE_5E.at) >= WILDLIFE_5E.clearOfDeparture &&
  PASSAGES.every((q) => distance(p, q) >= WILDLIFE_5E.clearOfPassages);

/** Une rive où une bête se tient : au bord de l'eau, basse, en bas (jamais le plateau ni sa falaise), loin des chemins. */
const bankOk = (p: Vec2): boolean => {
  const d = landDistance5e(p);
  return d > 0.6 && d < 2.6 && !onPlateau(p) && heightAt5e(p) < 1.4 && clear(p) && pathDistance(p) >= WILDLIFE_5E.clearOfPaths;
};

/** Une eau où une bête nage : à quatre unités au moins de la rive. */
const waterOk = (p: Vec2): boolean => landDistance5e(p) < -4 && clear(p);

/** La pente de la distance à la terre : vers la terre, unitaire. */
function inlandAt(p: Vec2): Vec2 {
  const e = 0.5;
  const gx = landDistance5e({ x: p.x + e, z: p.z }) - landDistance5e({ x: p.x - e, z: p.z });
  const gz = landDistance5e({ x: p.x, z: p.z + e }) - landDistance5e({ x: p.x, z: p.z - e });
  const l = Math.hypot(gx, gz) || 1;
  return { x: gx / l, z: gz / l };
}

/** Le point à `target` de la terre, en suivant la pente depuis `p`. */
function towards(p: Vec2, target: number): Vec2 {
  let q = p;
  for (let k = 0; k < 6; k++) {
    const g = inlandAt(q);
    const s = target - landDistance5e(q);
    if (Math.abs(s) < 0.1) break;
    q = { x: q.x + g.x * s, z: q.z + g.z * s };
  }
  return q;
}

/** Des points tous les `spacing` unités le long d'une ligne, avec sa direction. */
function along(line: readonly Vec2[], closed: boolean): { at: Vec2; dir: Vec2 }[] {
  const out: { at: Vec2; dir: Vec2 }[] = [];
  const n = closed ? line.length : line.length - 1;
  for (let i = 0; i < n; i++) {
    const a = line[i];
    const b = line[(i + 1) % line.length];
    const l = distance(a, b);
    const dir = { x: (b.x - a.x) / l, z: (b.z - a.z) / l };
    const m = Math.max(1, Math.round(l / WILDLIFE_5E.spacing));
    for (let k = 0; k < m; k++) out.push({ at: { x: a.x + ((b.x - a.x) * k) / m, z: a.z + ((b.z - a.z) * k) / m }, dir });
  }
  return out;
}

let spots: Spot5e[] | null = null;

/**
 * Les places, faites une fois : le long des deux chenaux (le milieu de l'eau et chaque rive, à un pas de l'eau), puis le
 * long de la côte (la rive, et le large à six unités) ; jamais l'anse de la Lisière.
 */
export function spots5e(): readonly Spot5e[] {
  if (spots) return spots;
  const out: Spot5e[] = [];
  const push = (at: Vec2, water: boolean, dir: Vec2, toLand: Vec2) => out.push({ at, water, along: dir, toLand, land: landAt(at) });
  for (const id of ['grand', 'ouest'] as const) {
    const c = CHANNELS_5E[id];
    for (const { at, dir } of along(c.line, false)) {
      const n = { x: -dir.z, z: dir.x };
      if (waterOk(at)) push(at, true, dir, n);
      for (const side of [-1, 1]) {
        const bank = { x: at.x + n.x * side * (c.halfWidth + 1.4), z: at.z + n.z * side * (c.halfWidth + 1.4) };
        if (bankOk(bank)) push(bank, false, dir, { x: n.x * side, z: n.z * side });
      }
    }
  }
  for (const { at } of along(COAST_5E, true)) {
    const shore = towards(at, 0);
    const inland = inlandAt(shore);
    const dir = { x: -inland.z, z: inland.x };
    const bank = towards(shore, 1.3);
    const sea = towards(shore, -6);
    if (bankOk(bank)) push(bank, false, dir, inland);
    if (waterOk(sea)) push(sea, true, dir, inland);
  }
  spots = out;
  return spots;
}

/**
 * Les aiguilles où tournent les choucas : loin de tous les lieux et des deux bouts de la cabine (leurs étiquettes, son
 * bouton ; référent dys).
 */
function jackdawNeedles(): readonly number[] {
  const cabin = LINKS_5E.aiguilles.bridge.map(nodeAt);
  return NEEDLES_5E.map((_, i) => i).filter((i) => {
    const at = NEEDLES_5E[i].at;
    return onPlateau(at) && PLACES_5E.every((p) => distance(at, p.center) >= 20) && cabin.every((c) => distance(at, c) >= 20);
  });
}

/** Ralentit un geste quand Kéo approche : 0 à `calm` unités de lui (immobile), 1 à `calm + 6` (libre). */
const calmed = (p: Vec2, keo: Vec2): number => ease((distance(p, keo) - WILDLIFE_5E.calm) / 6);

const yawOf = (d: Vec2): number => Math.atan2(-d.z, d.x);

/**
 * Le crocodile d'une place : dans l'eau, il flotte, le dos, la tête et les yeux au-dessus, et dérive lentement le long du
 * chenal ; sur la rive, il se dore, tourné vers l'eau, sans bouger. Immobile quand Kéo est près et avec « Réduire les
 * animations ».
 */
export function crocPose(spot: number, t: number, still: boolean, keo: Vec2, ground: (p: Vec2) => number): CritterPose {
  const s = spots5e()[spot];
  const way = phase(spot, 0) < 0.5 ? 1 : -1;
  if (!s.water) {
    const x = s.at.x - s.toLand.x * 0.4;
    const z = s.at.z - s.toLand.z * 0.4;
    return { x, y: Math.max(0, ground({ x, z })), z, yaw: yawOf({ x: -s.toLand.x, z: -s.toLand.z }), pitch: 0, form: 'croc' };
  }
  const off = still ? 0 : WILDLIFE_5E.crocDrift * Math.sin((2 * Math.PI * t) / WILDLIFE_5E.crocTurn + phase(spot, 1) * 6) * calmed(s.at, keo);
  return { x: s.at.x + s.along.x * off, y: -0.04, z: s.at.z + s.along.z * off, yaw: yawOf({ x: s.along.x * way, z: s.along.z * way }), pitch: 0, form: 'croc' };
}

/**
 * Un échassier d'une place (le héron, l'aigrette), les pattes dans l'eau au bord de la rive : il se repose, fait un pas,
 * se repose, se retourne doucement, se repose, revient, se repose, se retourne. `k` : son rang dans le groupe (côte à
 * côte, à deux unités). Immobile quand Kéo est près et avec « Réduire les animations ».
 */
export function waderPose(spot: number, k: number, t: number, still: boolean, keo: Vec2, form: 'heron' | 'egret', ground: (p: Vec2) => number): CritterPose {
  const s = spots5e()[spot];
  const R = WILDLIFE_5E.wadeRest, M = WILDLIFE_5E.wadeMove;
  const base = { x: s.at.x - s.toLand.x * 1.2 + s.along.x * k * 2, z: s.at.z - s.toLand.z * 1.2 + s.along.z * k * 2 };
  // Le cycle : repos, pas, repos, demi-tour, repos, retour, repos, demi-tour (8 temps).
  const cycle = 4 * (R + M);
  const u = (t + phase(spot, k + 2) * cycle) % cycle;
  const part = Math.floor(u / (R + M));
  const v = u % (R + M) < R ? 0 : ease((u % (R + M) - R) / M);
  const g = still ? 0 : calmed(base, keo);
  // Le pas (temps 0 et 2), puis le demi-tour (temps 1 et 3) : le pas fait se tient jusqu'au retour.
  const step = part === 0 ? v : part === 1 ? 1 : part === 2 ? 1 - v : 0;
  const turn = part === 1 ? v : part === 2 ? 1 : part === 3 ? 1 - v : 0;
  const off = WILDLIFE_5E.wadeStep * step * g;
  const x = base.x + s.along.x * off;
  const z = base.z + s.along.z * off;
  return { x, y: Math.max(-0.12, ground({ x, z })), z, yaw: yawOf(s.along) + Math.PI * turn * g, pitch: 0, form };
}

/**
 * Les choucas d'une aiguille : `perGroup.jackdaws` autour d'elle, aux deux tiers de sa hauteur, chacun à son cercle ;
 * `still` : posés au pied de l'aiguille, en rang.
 */
export function jackdawsPose(needle: number, t: number, still: boolean, ground: (p: Vec2) => number): CritterPose[] {
  const n = NEEDLES_5E[needle];
  const foot = ground(n.at);
  const out: CritterPose[] = [];
  for (let k = 0; k < WILDLIFE_5E.perGroup.jackdaws; k++) {
    if (still) {
      const a = n.turn + k * 0.35;
      const r = n.radius + 1.6;
      const x = n.at.x + Math.cos(a) * r;
      const z = n.at.z + Math.sin(a) * r;
      out.push({ x, y: ground({ x, z }), z, yaw: -a, pitch: 0, form: 'jackdawPerched' });
      continue;
    }
    const a = 2 * Math.PI * (t / WILDLIFE_5E.jackdawTurn + k / WILDLIFE_5E.perGroup.jackdaws + phase(needle, k) * 0.1);
    const r = n.radius + 4 + 0.7 * k;
    const y = foot + n.height * 0.65 + 0.9 * k + 0.3 * Math.sin(t * 0.6 + k);
    out.push({ x: n.at.x + Math.cos(a) * r, y, z: n.at.z + Math.sin(a) * r, yaw: -a - Math.PI / 2, pitch: 0, form: 'jackdaw' });
  }
  return out;
}

/**
 * Les espèces du 5e, terre par terre, telles que la vue les tient. `ground` : le sol où elles se posent (la vue donne
 * celui de son maillage ; sans lui, la hauteur du terrain).
 */
export function wildlifeGroups5e(ground: (p: Vec2) => number = heightAt5e): CritterGroup[] {
  const all = spots5e();
  const where = (land: LandId, water: boolean | null, ok: (s: Spot5e) => boolean = () => true) =>
    all.map((_, i) => i).filter((i) => all[i].land === land && (water === null || all[i].water === water) && ok(all[i]));
  const at = (i: number) => all[i].at;
  const S = WILDLIFE_5E.slots;
  const needles = jackdawNeedles();
  // Les crocodiles : dans l'eau, ou sur une rive d'en face des chemins, une sur deux ; les crabes prennent les autres rives
  // (à douze unités au moins : jamais deux bêtes l'une sur l'autre).
  const crocSpots = where('frondaisons', null, (s) => s.water || pathDistance(s.at) >= WILDLIFE_5E.crocClearOfPaths).filter((i) => all[i].water || i % 2 === 0);
  return [
    // Les Frondaisons : les crocodiles, dans l'eau ou sur la rive d'en face des chemins ; les crabes de palétuvier, sur
    // les autres rives.
    { form: 'croc', slots: S.crocs, perGroup: 1, spots: crocSpots, at, pose: (spot, _s, t, still, keo) => [crocPose(spot, t, still, keo, ground)] },
    { form: 'mangroveCrab', slots: S.crabs, perGroup: WILDLIFE.perGroup.crabs, spots: where('frondaisons', false).filter((i) => !crocSpots.includes(i)), at, pose: (spot, _s, t, still, keo) => crabsOn(all[spot].at, all[spot].toLand, spot, t, still, keo, 'mangroveCrab', ground, WILDLIFE.perGroup.crabs) },
    // Les Roselières : les hérons au bord de l'eau, les poissons qui sautent.
    { form: 'heron', slots: S.herons, perGroup: 1, spots: where('roselieres', false), at, pose: (spot, _s, t, still, keo) => [waderPose(spot, 0, t, still, keo, 'heron', ground)] },
    { form: 'fish', slots: S.fish, perGroup: 1, spots: where('roselieres', true), at, pose: (spot, slot, t, still) => [fishOn(all[spot].at, all[spot].toLand, slot, t, still, S.fish)] },
    // Les Contreforts : les aigrettes, par deux.
    { form: 'egret', slots: S.egrets, perGroup: WILDLIFE_5E.perGroup.egrets, spots: where('contreforts', false), at, pose: (spot, _s, t, still, keo) => [0, 1].map((k) => waderPose(spot, k, t, still, keo, 'egret', ground)) },
    // Les Aiguilles : les choucas autour des aiguilles.
    { form: 'jackdaw', slots: S.jackdaws, perGroup: WILDLIFE_5E.perGroup.jackdaws, spots: needles, at: (i) => NEEDLES_5E[i].at, pose: (needle, _s, t, still) => jackdawsPose(needle, t, still, ground) },
  ];
}

type P3 = [number, number, number];

/**
 * Le crocodile : un corps bas et long à arête, un museau arrondi (aucune dent), deux yeux d'ocre au-dessus de la tête,
 * quatre pattes en éclats, en aplats d'olive (jamais presque noir) ; la tête vers +x, deux unités et demie de long.
 */
function crocFacets(): Facets {
  const b = new FacetBuilder();
  const tops = [0x7a8a50, 0x6f8048];
  const side = 0x66763f;
  const eye = 0xe0a84a;
  // De la pointe du museau à la pointe de la queue : l'abscisse, la demi-largeur, la hauteur de l'arête et du flanc.
  const xs = [1.15, 0.75, 0.35, -0.35, -0.75, -1.35];
  const ws = [0.07, 0.17, 0.3, 0.28, 0.14, 0.02];
  const ridge = [0.1, 0.2, 0.3, 0.3, 0.2, 0.08];
  const flank = [0.06, 0.12, 0.17, 0.17, 0.11, 0.05];
  for (let i = 0; i < xs.length - 1; i++) {
    for (const s of [-1, 1]) {
      const r0: P3 = [xs[i], ridge[i], 0], r1: P3 = [xs[i + 1], ridge[i + 1], 0];
      const f0: P3 = [xs[i], flank[i], ws[i] * s], f1: P3 = [xs[i + 1], flank[i + 1], ws[i + 1] * s];
      b.triangle(r0, r1, f1, tops[i % 2]);
      b.triangle(r0, f1, f0, tops[(i + 1) % 2]);
      b.triangle(f0, f1, [(xs[i] + xs[i + 1]) / 2, 0, ((ws[i] + ws[i + 1]) / 2) * s * 0.9], side);
    }
  }
  // Les yeux, deux bosses au-dessus de la tête.
  for (const s of [-1, 1]) b.triangle([0.7, 0.21, 0.1 * s], [0.54, 0.23, 0.12 * s], [0.62, 0.34, 0.11 * s], eye);
  // Les pattes, couchées de côté.
  for (const x of [0.4, -0.3]) for (const s of [-1, 1]) b.triangle([x + 0.1, 0.06, 0.26 * s], [x - 0.1, 0.06, 0.26 * s], [x + 0.06, 0, 0.5 * s], side);
  return b.build();
}

/**
 * Un échassier debout : deux pattes fines, un corps en losange, un cou, une tête et un bec ; la tête vers +x. Le héron,
 * gris-bleu, un mètre de haut ; l'aigrette, blanche, plus petite (`scale`).
 */
function waderFacets(body: number, wing: number, neck: number, beak: number, legs: number, scale: number): Facets {
  const b = new FacetBuilder();
  const p = (x: number, y: number, z: number): P3 => [x * scale, y * scale, z * scale];
  for (const s of [-1, 1]) b.triangle(p(-0.03, 0, 0.06 * s), p(0.03, 0, 0.06 * s), p(0, 0.56, 0.05 * s), legs);
  const front = p(0.22, 0.7, 0), back = p(-0.34, 0.62, 0), top = p(-0.02, 0.84, 0), low = p(0, 0.52, 0);
  for (const s of [-1, 1]) {
    const side = p(0, 0.68, 0.13 * s);
    b.triangle(top, front, side, body);
    b.triangle(top, side, back, wing);
    b.triangle(low, side, front, body);
    b.triangle(low, back, side, wing);
  }
  for (const s of [-1, 1]) b.triangle(p(0.15, 0.72, 0.04 * s), p(0.24, 0.74, 0), p(0.24, 1.12, 0.03 * s), neck);
  b.triangle(p(0.19, 1.1, 0.05), p(0.19, 1.1, -0.05), p(0.31, 1.17, 0), neck);
  b.triangle(p(0.3, 1.15, 0.02), p(0.3, 1.11, -0.02), p(0.58, 1.11, 0), beak);
  return b.build();
}

/** Le crabe de palétuvier (fiche du niveau, § 6) : le crabe du 6e, en mauve et rouille (jamais presque noir). */
const MANGROVE_CRAB = [0x9c5a66, 0x80505a, 0xd98a6a] as const;

let forms: Record<CritterForm, Facets> | null = null;

/** Toutes les formes des bêtes, celles du 6e et celles du 5e, faites une fois. */
export function allCritterForms(): Record<CritterForm, Facets> {
  forms ??= {
    ...critterForms(),
    croc: crocFacets(),
    mangroveCrab: crabFacets(...MANGROVE_CRAB),
    heron: waderFacets(0x9aa8b0, 0x7f8d96, 0xb7c2c7, 0xd9a441, 0x9a8a62, 1),
    // L'aigrette, d'un blanc crème chaud : un blanc pur se perdait dans la brume des terres fermées.
    egret: waderFacets(0xe9dcbc, 0xcdbf9c, 0xf1e6ca, 0xe8b23c, 0x8a8a70, 0.75),
    // Le choucas : gris ardoise clair, la mouette pour forme ; plus sombre, il se lisait presque noir à contre-jour sur le
    // ciel (captures du 19 octobre 2026).
    jackdaw: birdFacets(false, 0xaab3c0, 0x8e98a6),
    jackdawPerched: birdFacets(true, 0xaab3c0, 0x8e98a6),
  };
  return forms;
}

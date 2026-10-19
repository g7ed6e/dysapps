// La vie animale des côtes du 6e (choix du mainteneur, 19 octobre 2026, piste « Ambiance ») : des mouettes qui tournent
// au-dessus de la côte, des crabes sur la plage, des poissons qui sautent au large. Elles ne servent pas le jeu : le
// décor vit. Code pur, sans Three.js : leurs places le long de la côte (tirées une fois), leurs formes en aplats et leurs
// poses à l'instant `t` ; la vue (three/archipeo/scene.ts) les écrit dans le maillage de la baleine et des oiseaux du
// bord d'eau (aucun appel de dessin de plus).
//
// Peu de bêtes à la fois, près de Kéo seulement (`WILDLIFE.slots`) : l'île fait plus de mille unités de côte, la brume
// en cache tout ce qui est au-delà de 115. Une place prise est gardée tant que Kéo n'en est pas loin (`keep`) ; une
// place qui change va au plus près de Kéo, mais jamais à moins de `appear` unités (dans la brume) : rien n'apparaît sous
// ses yeux.
//
// Règles dys (référent dys) : des gestes lents et rares, jamais de clignotement ; tout se fige pendant une question, une
// scénette ou sur la Carte (la vue n'avance leur horloge qu'en marche libre) ; avec « Réduire les animations », les
// mouettes sont posées sur la plage, les crabes immobiles et aucun poisson ne saute.
import { birdFacets, DETOURS } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { COAST, PLACES } from './plan6e';
import { heightAt, landDistance, standingHeight } from './terrain';

/**
 * Les mesures : les places tous les `spacing` unités de côte ; combien de bêtes à la fois (`slots`) ; la mouette tourne
 * en `gullTurn` secondes sur un cercle de `gullRadius`, à `gullHeight` au-dessus de l'eau ; le crabe se repose
 * `crabRest` secondes, puis file de côté sur `crabStep` unités en `crabRun` secondes, et se tient immobile quand Kéo est
 * à moins de `crabCalm` unités (rien ne bouge dans son champ, référent dys) ; un poisson saute toutes les `fishEvery` secondes, `fishLeap` secondes en l'air.
 */
export const WILDLIFE = {
  spacing: 18,
  slots: { gulls: 2, crabs: 2, fish: 2 },
  perGroup: { gulls: 3, crabs: 2 },
  keep: 90,
  appear: 45,
  gullRadius: 5,
  gullHeight: 4,
  gullTurn: 16,
  crabRest: 5,
  crabRun: 1.4,
  crabStep: 1.2,
  crabCalm: 6,
  fishEvery: 16,
  fishLeap: 0.9,
  fishArc: 1.1,
  fishLength: 2.4,
  /** Loin des lieux et du bord d'eau de la baleine : le décor ne se mêle pas à ce qui se joue. */
  clearOfPlaces: 14,
  clearOfShore: 20,
} as const;

/** Une place le long de la côte : un point de la plage, un point du large, et la direction de la terre. */
export interface CoastSpot {
  beach: Vec2 | null;
  sea: Vec2 | null;
  /** La direction de la terre (de la mer vers la plage), unitaire. */
  inland: Vec2;
}

/** La pente de la distance à la terre : vers la terre, unitaire. */
function inlandAt(p: Vec2): Vec2 {
  const e = 0.5;
  const gx = landDistance({ x: p.x + e, z: p.z }) - landDistance({ x: p.x - e, z: p.z });
  const gz = landDistance({ x: p.x, z: p.z + e }) - landDistance({ x: p.x, z: p.z - e });
  const l = Math.hypot(gx, gz) || 1;
  return { x: gx / l, z: gz / l };
}

/** Le point à `target` de la terre (positif sur la terre, négatif dans l'eau), en suivant la pente depuis `p`. */
function towards(p: Vec2, target: number): Vec2 {
  let q = p;
  for (let k = 0; k < 6; k++) {
    const g = inlandAt(q);
    const s = target - landDistance(q);
    if (Math.abs(s) < 0.1) break;
    q = { x: q.x + g.x * s, z: q.z + g.z * s };
  }
  return q;
}

const clearOf = (p: Vec2) =>
  PLACES.every((pl) => distance(p, pl.center) >= WILDLIFE.clearOfPlaces) && DETOURS.every((d) => d.kind !== 'rive' || distance(p, d.at) >= WILDLIFE.clearOfShore);

let spots: CoastSpot[] | null = null;

/**
 * Les places le long de la côte, faites une fois : tous les `spacing` unités du contour de l'île, la plage à un pas de
 * l'eau (seulement là où elle est basse et presque plate : ni falaise, ni rive rocheuse), le large à six unités de la
 * côte ; ni l'une ni l'autre près d'un lieu ou du bord d'eau de la baleine.
 */
export function coastSpots(): readonly CoastSpot[] {
  if (spots) return spots;
  spots = [];
  for (let i = 0; i < COAST.length; i++) {
    const a = COAST[i];
    const b = COAST[(i + 1) % COAST.length];
    const n = Math.max(1, Math.round(distance(a, b) / WILDLIFE.spacing));
    for (let k = 0; k < n; k++) {
      const c = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n };
      const shore = towards(c, 0);
      const beach = towards(shore, 1.3);
      const sea = towards(shore, -6);
      const flat = Math.abs(heightAt(beach) - heightAt(towards(shore, 2.3))) < 0.35;
      const beachOk = landDistance(beach) > 0.8 && landDistance(beach) < 2 && heightAt(beach) >= 0 && heightAt(beach) < 0.9 && flat && clearOf(beach);
      const seaOk = landDistance(sea) < -4 && clearOf(sea);
      if (beachOk || seaOk) spots.push({ beach: beachOk ? beach : null, sea: seaOk ? sea : null, inland: inlandAt(shore) });
    }
  }
  return spots;
}

/**
 * Les places tenues par `count` groupes de bêtes, autour de Kéo en `focus` : chaque groupe garde sa place (`held`) tant
 * qu'elle est à moins de `keep` unités ; sinon il prend la place libre la plus proche de Kéo à `appear` unités au moins.
 * Au départ (rien de tenu), les plus proches. `usable` : les places qui conviennent à ces bêtes.
 */
export function assignSpots(usable: readonly number[], at: (i: number) => Vec2, focus: Vec2, held: readonly (number | null)[], count: number): (number | null)[] {
  const out: (number | null)[] = [];
  const first = held.every((h) => h === null);
  const byDistance = [...usable].sort((i, j) => distance(at(i), focus) - distance(at(j), focus));
  for (let s = 0; s < count; s++) {
    const h = held[s] ?? null;
    if (h !== null && distance(at(h), focus) < WILDLIFE.keep && !out.includes(h)) {
      out.push(h);
      continue;
    }
    const pick = byDistance.find((i) => !out.includes(i) && !held.includes(i) && (first || distance(at(i), focus) >= WILDLIFE.appear));
    out.push(pick ?? null);
  }
  return out;
}

/** Une bête posée : sa place, son cap (radians, autour de la verticale ; la tête vers +x), sa forme. */
export interface CritterPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  /** La bascule de la tête (le poisson qui saute) ; 0 sinon. */
  pitch: number;
  form: CritterForm;
}

/** Les formes des bêtes du 6e, puis celles du 5e (./wildlife5e.ts). */
export type CritterForm6e = 'gull' | 'perched' | 'crab' | 'fish';
export type CritterForm = CritterForm6e | 'croc' | 'mangroveCrab' | 'heron' | 'egret' | 'jackdaw' | 'jackdawPerched';

/**
 * Une espèce d'un niveau, telle que la vue la tient : `slots` groupes de `perGroup` bêtes, chacun à une place de `spots`
 * (`at` : où elle est, pour la choisir près de Kéo) ; `pose` : les bêtes d'un groupe à l'instant `t` (`null` : aucune,
 * rien ne se dessine). `form` : la forme qui donne aux bêtes du groupe leur place dans le maillage et leurs couleurs ; les
 * autres formes qu'elles prennent ont les mêmes sommets, dans le même ordre (la mouette posée, le choucas posé).
 */
export interface CritterGroup<F extends CritterForm = CritterForm> {
  form: F;
  slots: number;
  perGroup: number;
  spots: readonly number[];
  at: (spot: number) => Vec2;
  pose: (spot: number, slot: number, t: number, still: boolean, keo: Vec2) => readonly (CritterPose | null)[];
}

/** Les mouettes, les crabes et les poissons des côtes du 6e, en espèces que la vue tient. */
export function wildlifeGroups6e(): CritterGroup<CritterForm6e>[] {
  const coast = coastSpots();
  const all = coast.map((_, i) => i);
  const beachAt = (i: number) => coast[i].beach ?? coast[i].sea!;
  const seaAt = (i: number) => coast[i].sea!;
  return [
    { form: 'gull', slots: WILDLIFE.slots.gulls, perGroup: WILDLIFE.perGroup.gulls, spots: all, at: beachAt, pose: (spot, _s, t, still) => gullsPose(spot, t, still) },
    { form: 'crab', slots: WILDLIFE.slots.crabs, perGroup: WILDLIFE.perGroup.crabs, spots: all.filter((i) => coast[i].beach !== null), at: beachAt, pose: (spot, _s, t, still, keo) => crabsPose(spot, t, still, keo) },
    { form: 'fish', slots: WILDLIFE.slots.fish, perGroup: 1, spots: all.filter((i) => coast[i].sea !== null), at: seaAt, pose: (spot, slot, t, still) => [fishPose(spot, slot, t, still)] },
  ];
}

/** Les triangles de toutes les bêtes d'un niveau à la fois, au pire (chacune dans la forme de sa place). */
export const groupsTriangles = <F extends CritterForm>(groups: readonly CritterGroup<F>[], forms: Record<F, Facets>): number => groups.reduce((n, g) => n + g.slots * g.perGroup * forms[g.form].triangles, 0);

/** Le départ doux et l'arrivée douce, de 0 à 1. */
export const ease = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};

/** Un décalage fixe, de 0 à 1, propre à une place et à une bête du groupe. */
export const phase = (spot: number, k: number) => ((spot * 7919 + k * 104729) % 1000) / 1000;

/**
 * Les mouettes d'une place à l'instant `t` : `perGroup.gulls` mouettes sur un cercle au-dessus de l'eau, au bord de la
 * côte, chacune à sa hauteur ; `still` : posées sur la plage, en rang, tournées vers la mer.
 */
export function gullsPose(spot: number, t: number, still: boolean): CritterPose[] {
  const s = coastSpots()[spot];
  const ground = s.beach ?? s.sea!;
  const out: CritterPose[] = [];
  for (let k = 0; k < WILDLIFE.perGroup.gulls; k++) {
    if (still) {
      // Posées le long de la plage (ou, sans plage, sur l'eau, comme au repos sur les vagues).
      // À cinq unités des crabes, le long de la plage : chaque bête se lit seule (directeur artistique).
      const side = 5 + k * 0.9;
      const x = ground.x - s.inland.z * side;
      const z = ground.z + s.inland.x * side;
      out.push({ x, y: s.beach ? Math.max(0, standingHeight(heightAt({ x, z }))) : 0.02, z, yaw: Math.atan2(s.inland.z, -s.inland.x), pitch: 0, form: 'perched' });
      continue;
    }
    // Le centre du cercle : trois unités côté mer depuis la côte.
    const cx = ground.x - s.inland.x * 3;
    const cz = ground.z - s.inland.z * 3;
    const a = 2 * Math.PI * (t / WILDLIFE.gullTurn + phase(spot, k) * 0.15 + k / WILDLIFE.perGroup.gulls);
    const r = WILDLIFE.gullRadius * (0.8 + 0.25 * k);
    const y = WILDLIFE.gullHeight + 0.8 * k + 0.25 * Math.sin(t * 0.7 + k);
    // Toutes dans le même sens, sans se croiser ; le cap : la tangente au cercle.
    out.push({ x: cx + Math.cos(a) * r, y, z: cz + Math.sin(a) * r, yaw: -a - Math.PI / 2, pitch: 0, form: 'gull' });
  }
  return out;
}

/**
 * Les crabes d'une place à l'instant `t` : `perGroup.crabs` crabes sur la plage, de côté, qui filent un pas puis se
 * reposent (aller, repos, retour, repos) ; près de Kéo (`keo`), chacun se tient à sa place de repos. `still` : à leur
 * place de repos.
 */
export function crabsPose(spot: number, t: number, still: boolean, keo: Vec2): CritterPose[] {
  const s = coastSpots()[spot];
  return crabsOn(s.beach!, s.inland, spot, t, still, keo, 'crab', heightAt, WILDLIFE.perGroup.crabs);
}

/**
 * Les crabes d'une plage `b` (`inland` : la direction de la terre) : le cœur de `crabsPose`, que le 5e reprend pour ses
 * crabes de palétuvier (sa forme, son sol `ground`).
 */
export function crabsOn(b: Vec2, inland: Vec2, spot: number, t: number, still: boolean, keo: Vec2, form: CritterForm, ground: (p: Vec2) => number, count: number): CritterPose[] {
  const along = { x: -inland.z, z: inland.x };
  const cycle = 2 * (WILDLIFE.crabRest + WILDLIFE.crabRun);
  const out: CritterPose[] = [];
  for (let k = 0; k < count; k++) {
    const home = { x: b.x + along.x * (k * 2.2 - 1.1) + inland.x * 0.4 * k, z: b.z + along.z * (k * 2.2 - 1.1) + inland.z * 0.4 * k };
    let off = 0;
    if (!still && distance(home, keo) >= WILDLIFE.crabCalm) {
      const u = (t + phase(spot, k) * cycle) % cycle;
      const R = WILDLIFE.crabRest, F = WILDLIFE.crabRun;
      off = u < R ? 0 : u < R + F ? ease((u - R) / F) : u < 2 * R + F ? 1 : 1 - ease((u - 2 * R - F) / F);
      off *= WILDLIFE.crabStep * (k % 2 ? 1 : -1);
    }
    const x = home.x + along.x * off;
    const z = home.z + along.z * off;
    // De face vers la mer : il file de côté, le long de la plage.
    out.push({ x, y: Math.max(0, standingHeight(ground({ x, z }))), z, yaw: Math.atan2(inland.z, -inland.x), pitch: 0, form });
  }
  return out;
}

/**
 * Le poisson d'une place à l'instant `t` : un saut en arc hors de l'eau toutes les `fishEvery` secondes, de côté par
 * rapport à la côte ; sous l'eau le reste du temps (`null`). `still` : jamais.
 */
export function fishPose(spot: number, slot: number, t: number, still: boolean): CritterPose | null {
  const s = coastSpots()[spot];
  return fishOn(s.sea!, s.inland, slot, t, still, WILDLIFE.slots.fish);
}

/**
 * Le poisson d'un point d'eau `s` (`inland` : la direction de la rive), le `slot`-ième de `slots` qui sautent chacun à son
 * tour : le cœur de `fishPose`, que le 5e reprend.
 */
export function fishOn(s: Vec2, inland: Vec2, slot: number, t: number, still: boolean, slots: number): CritterPose | null {
  if (still) return null;
  // Les deux poissons sautent chacun à son tour (jamais ensemble).
  const u = (t + (slot * WILDLIFE.fishEvery) / slots) % WILDLIFE.fishEvery;
  if (u > WILDLIFE.fishLeap) return null;
  const v = u / WILDLIFE.fishLeap;
  const along = { x: -inland.z, z: inland.x };
  const L = WILDLIFE.fishLength;
  const x = s.x + along.x * L * (v - 0.5);
  const z = s.z + along.z * L * (v - 0.5);
  const y = -0.2 + 4 * WILDLIFE.fishArc * v * (1 - v);
  return { x, y, z, yaw: Math.atan2(-along.z, along.x), pitch: Math.atan(4 * WILDLIFE.fishArc * (1 - 2 * v) / L), form: 'fish' };
}

/**
 * Le crabe : une carapace basse à six pans, deux pinces et six pattes en éclats, en aplats brique et orange brûlé
 * (jamais presque noir) ; la tête (ses pinces) vers +x.
 */
export function crabFacets(shell = 0xc8673d, side = 0xa4512f, claw = 0xeba070): Facets {
  const b = new FacetBuilder();
  const R = 0.28;
  const top: [number, number, number] = [0, 0.2, 0];
  const ring = Array.from({ length: 6 }, (_, k) => [Math.cos((Math.PI * k) / 3) * R * 0.85, 0.08, Math.sin((Math.PI * k) / 3) * R * 1.2] as [number, number, number]);
  for (let k = 0; k < 6; k++) b.triangle(top, ring[(k + 1) % 6], ring[k], shell);
  for (let k = 0; k < 6; k++) {
    const a = ring[k];
    const c = ring[(k + 1) % 6];
    b.triangle(a, c, [c[0], 0, c[2]], side);
  }
  // Les pinces, couchées en avant, larges et presque à plat (debout, elles se lisaient comme des cornes).
  for (const s of [-1, 1]) b.triangle([0.2, 0.1, 0.06 * s], [0.48, 0.13, 0.14 * s], [0.26, 0.12, 0.28 * s], claw);
  // Les pattes : trois éclats de chaque côté, posés au sol.
  for (const s of [-1, 1]) for (const x of [-0.12, 0.02]) b.triangle([x, 0.08, 0.3 * s], [x + 0.08, 0.08, 0.3 * s], [x - 0.02, 0, 0.48 * s], side);
  return b.build();
}

/** Le poisson : un fuseau plat à deux tons et sa queue en V, gris-bleu argenté ; la tête vers +x. */
function fishFacets(): Facets {
  const b = new FacetBuilder();
  const back = 0x7f9cb0;
  const belly = 0xc3d2da;
  const nose: [number, number, number] = [0.35, 0, 0];
  const tail: [number, number, number] = [-0.25, 0, 0];
  const up: [number, number, number] = [0, 0.1, 0];
  const down: [number, number, number] = [0, -0.08, 0];
  for (const s of [-1, 1]) {
    const flank: [number, number, number] = [0.02, 0, 0.07 * s];
    b.triangle(nose, s > 0 ? up : flank, s > 0 ? flank : up, back);
    b.triangle(up, s > 0 ? tail : flank, s > 0 ? flank : tail, back);
    b.triangle(nose, s > 0 ? flank : down, s > 0 ? down : flank, belly);
  }
  b.triangle(tail, [-0.45, 0.14, 0], [-0.45, -0.12, 0], back);
  return b.build();
}

/** Les formes du 6e, faites une fois (celles du 5e : ./wildlife5e.ts). */
let forms: Record<CritterForm6e, Facets> | null = null;
export function critterForms(): Record<CritterForm6e, Facets> {
  forms ??= { gull: birdFacets(), perched: birdFacets(true), crab: crabFacets(), fish: fishFacets() };
  return forms;
}

/** Combien de bêtes à la fois, au plus : leurs places dans le maillage. */
export const CRITTER_COUNT = WILDLIFE.slots.gulls * WILDLIFE.perGroup.gulls + WILDLIFE.slots.crabs * WILDLIFE.perGroup.crabs + WILDLIFE.slots.fish;

/** Les triangles de toutes les bêtes à la fois, au pire (chacune dans sa forme la plus chargée). */
export const wildlifeTriangles = (): number => groupsTriangles(wildlifeGroups6e(), critterForms());

// Le Détour du Creux (GD-22, lot 6 ; intention du directeur artistique du 20 octobre 2026, « Le Détour du Creux ») : le
// premier Détour du 5e. Un palétuvier géant, creusé à son pied comme une porte, avec une lanterne dedans ; on s'y arrête
// pour souffler. Pas de récompense, pas de compteur, pas de mission ni d'étape. Sa place, son seuil et sa sente sont au
// plan (./plan5e.ts, `CREUX_5E`) ; sa couronne est celle d'un arbre de la forêt, élargi (./terrain5e.ts, `CREUX_CROWN`),
// comptée avec la forêt : le Détour ne paie que le pied creusé.
//
// La silhouette : le fût court et très large (plus large que tous les palétuviers voisins), en huit pans, de l'écorce des
// palétuviers géants (jamais le vert-de-gris, couleur du motif des Passeurs), qui monte jusque dans la couronne (jamais
// coupé net : il se lirait comme une tour). Au pied, l'arche, haute de deux fois Kéo, en voûte à facettes, ouverte vers le
// chemin d'où l'on vient ; ni porte ni seuil. Dedans : un banc de racine, un sol de planches claires, une lanterne d'ocre
// pendue à un crochet de bronze, allumée dès le départ, fixe (une lueur qui invite : le geste de « rallumer » est celui
// du cairn). Dehors : les trois pierres plates, comme aux autres Détours. Rien à lire. Code pur.
import type { Detour } from './detours';
import { FacetBuilder, type Facets } from './facets';
import { distance, type Vec2 } from './geometry';
import { COLORS_5E, CREUX_5E } from './plan5e';
import { standingHeight } from './terrain';
import { CREUX_CROWN, FOREST_COLORS, heightAt5e } from './terrain5e';

/** Le Détour du Creux : sur sa terre, les Frondaisons ; Kéo arrive sur le seuil. */
export const CREUX: Detour = {
  id: 'creux',
  land: 'frondaisons',
  name: 'Le Creux',
  kind: 'creux',
  at: CREUX_5E.threshold,
  radius: 1,
  foot: CREUX_5E.threshold,
  face: CREUX_5E.face,
  sente: CREUX_5E.sente,
};

/**
 * Les couleurs : l'écorce des palétuviers géants (dehors) et son revers dans le creux, un cran plus sombre (jamais
 * presque noir) ; les planches claires du sol ; la racine du banc ; le bronze du crochet ; les pierres claires des
 * Détours ; la sente, une terre pâle sur la mousse sombre du 5e (3:1 au moins, un test le vérifie).
 */
const C = {
  bark: FOREST_COLORS.trunk,
  barkInside: 0x5f5648,
  plank: 0xc8b48e,
  plankShade: 0xb6a27c,
  root: FOREST_COLORS.root,
  bronze: 0xb8954f,
  lantern: COLORS_5E.lantern,
  stone: 0xc9c0ae,
  stoneSide: 0xa9a08f,
} as const;

/**
 * Le fût : huit pans ; le rayon au sol (celui du plan), au haut de l'arche et au haut du fût, dans la couronne ; la
 * hauteur des naissances de l'arche, de sa clé et de la bande où elle s'arrête ; le haut du fût, dans la couronne.
 */
const CREUX_TRUNK = { sides: 8, r0: CREUX_5E.radius, r1: 2.45, r2: 1.8, spring: 3.4, key: 5.1, band: 5.6, top: CREUX_CROWN.base + 0.2, sink: 0.6 } as const;

/** La hauteur de Kéo, debout (`KEO_HEIGHT`, camera.ts), pour la hauteur de l'arche : deux fois lui, à peu près. */
export const CREUX_ARCH_HEIGHT = CREUX_TRUNK.key;

/** Le sol sous un point du monde. */
const groundAt = (x: number, z: number): number => standingHeight(heightAt5e({ x, z }));

/** Le sommet `k` d'un anneau du fût, de rayon `r`, à la hauteur `y` : le pan 0 est centré sur le cap de l'arche. */
function ring(k: number, r: number, y: number): [number, number, number] {
  const c = CREUX_5E.center;
  const a = CREUX_5E.face + ((k - 0.5) * 2 * Math.PI) / CREUX_TRUNK.sides;
  return [c.x + r * Math.cos(a), y, c.z + r * Math.sin(a)];
}

/**
 * Le fût creusé : la bande basse (sept pans dehors, sept pans dedans, de l'écorce et de son revers), le pan de l'arche
 * (ouvert jusqu'aux naissances, puis la voûte à facettes, en six triangles, jusqu'au haut de la bande), et la bande
 * haute, qui s'amincit jusque dans la couronne. Cinquante triangles.
 */
function trunk(b: FacetBuilder, g: number): void {
  const T = CREUX_TRUNK;
  const n = T.sides;
  const y0 = g - T.sink,
    y1 = g + T.band,
    y2 = g + T.top;
  for (let k = 1; k < n; k++) {
    const a0 = ring(k, T.r0, y0),
      a1 = ring(k + 1, T.r0, y0),
      b0 = ring(k, T.r1, y1),
      b1 = ring(k + 1, T.r1, y1);
    // Dehors : vu de l'extérieur, dans le sens inverse des aiguilles d'une montre.
    b.quad(a1, a0, b0, b1, C.bark);
    // Dedans : le revers, vu du creux.
    b.quad(a0, a1, b1, b0, C.barkInside);
  }
  // Le pan de l'arche : la voûte à facettes, des naissances à la clé, et l'écorce au-dessus jusqu'au haut de la bande.
  const at = (s: number, y: number): [number, number, number] => {
    // Un point du pan de l'arche : `s` de −1 (à gauche, sommet 0) à 1 (à droite, sommet 1), à la hauteur `y`.
    const u = (y - y0) / (y1 - y0);
    const r = T.r0 + (T.r1 - T.r0) * u;
    const l = ring(0, r, y),
      rr = ring(1, r, y);
    const t = (s + 1) / 2;
    return [l[0] + (rr[0] - l[0]) * t, y, l[2] + (rr[2] - l[2]) * t];
  };
  const A0 = at(1, g + T.spring),
    A1 = at(0.55, g + (T.spring + T.key) / 2 + 0.25),
    A2 = at(0, g + T.key),
    A3 = at(-0.55, g + (T.spring + T.key) / 2 + 0.25),
    A4 = at(-1, g + T.spring);
  const TL = at(1, y1),
    TM = at(0, y1),
    TR = at(-1, y1);
  b.triangle(A0, A1, TL, C.bark);
  b.triangle(A1, A2, TM, C.bark);
  b.triangle(A1, TM, TL, C.bark);
  b.triangle(A2, A3, TM, C.bark);
  b.triangle(A3, TR, TM, C.bark);
  b.triangle(A3, A4, TR, C.bark);
  // La bande haute, jusque dans la couronne : huit pans.
  for (let k = 0; k < n; k++) b.quad(ring(k + 1, T.r1, y1), ring(k, T.r1, y1), ring(k, T.r2, y2), ring(k + 1, T.r2, y2), C.bark);
}

/** Un point du creux : `d` depuis le centre vers l'arche (négatif vers le fond), `s` de côté. */
function inside(d: number, s: number): Vec2 {
  const c = CREUX_5E.center;
  const fx = Math.cos(CREUX_5E.face),
    fz = Math.sin(CREUX_5E.face);
  return { x: c.x + fx * d - fz * s, z: c.z + fz * d + fx * s };
}

/** Le sol de planches claires : trois longues planches, de l'arche au fond. Six triangles. */
function floor(b: FacetBuilder, g: number): void {
  const y = g + 0.05;
  const half = 1.65;
  for (let k = 0; k < 3; k++) {
    const s0 = -half + (k * 2 * half) / 3 + 0.03,
      s1 = s0 + (2 * half) / 3 - 0.06;
    const p = [inside(half, s0), inside(half, s1), inside(-half, s1), inside(-half, s0)];
    b.quad([p[0].x, y, p[0].z], [p[3].x, y, p[3].z], [p[2].x, y, p[2].z], [p[1].x, y, p[1].z], k % 2 ? C.plankShade : C.plank);
  }
}

/** Le banc : une racine couchée le long du fond, d'un côté à l'autre. Douze triangles. */
function bench(b: FacetBuilder, g: number): void {
  const a = inside(-1.75, -1.3),
    c = inside(-1.8, 1.3);
  b.beam({ x: a.x, y: g + 0.5, z: a.z }, { x: c.x, y: g + 0.58, z: c.z }, 0.45, C.root);
}

/** Le crochet de bronze, du fond vers le milieu, et la lanterne d'ocre pendue à son bout, allumée, fixe. */
const CREUX_LANTERN = { from: -2.3, to: -1.1, y: 3.1, drop: 0.55 } as const;

function lantern(b: FacetBuilder, g: number): void {
  const L = CREUX_LANTERN;
  const a = inside(L.from, 0),
    c = inside(L.to, 0);
  b.beam({ x: a.x, y: g + L.y, z: a.z }, { x: c.x, y: g + L.y - 0.1, z: c.z }, 0.08, C.bronze);
  const y = g + L.y - L.drop - 0.42;
  b.prism({ x: c.x, y, z: c.z }, 0.2, 0.2, 0.42, 6, C.lantern);
  b.prism({ x: c.x, y: y + 0.42, z: c.z, yaw: Math.PI / 4 }, 0.27, 0, 0.18, 4, C.bronze);
}

/** Les trois pierres plates, au pied, de part et d'autre du seuil (jamais dessus). */
function stones(b: FacetBuilder): void {
  const ux = Math.cos(CREUX_5E.face),
    uz = Math.sin(CREUX_5E.face);
  const f = CREUX_5E.threshold;
  for (const [k, s] of [
    { lat: -2.4, along: 0.6, r: 0.55 },
    { lat: 2.3, along: 0.9, r: 0.5 },
    { lat: -3.2, along: 1.9, r: 0.42 },
  ].entries()) {
    const x = f.x + ux * s.along - uz * s.lat,
      z = f.z + uz * s.along + ux * s.lat;
    b.prism({ x, y: groundAt(x, z) - 0.05, z, yaw: CREUX_5E.face + k }, s.r, s.r * 0.85, 0.22, 5, C.stoneSide, C.stone);
  }
}

/**
 * La sente du Creux : de la terre pâle en pointillé, plus étroite qu'un chemin (comme les sentes du 6e, ./detours.ts,
 * `SENTE`, sur la mousse sombre du 5e) : un trait de `dash`, un vide de `gap`, de demi-largeur `half`, posé sur le sol.
 */
export const SENTE_5E = { dash: 1.4, gap: 0.7, half: 0.48, lift: 0.025, color: 0xd8c49a } as const;

function sente(b: FacetBuilder): void {
  const line = CREUX_5E.sente;
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      c = line[i];
    // La sente s'arrête juste avant le seuil, au pied du fût (le sol du creux est en planches).
    const d = distance(a, c);
    const len = d - 0.3;
    const dx = (c.x - a.x) / d,
      dz = (c.z - a.z) / d;
    let s = carry;
    while (s < len) {
      const e = Math.min(len, s + SENTE_5E.dash);
      const y = (t: number) => groundAt(a.x + dx * t, a.z + dz * t) + SENTE_5E.lift;
      const p = (t: number, o: number) => [a.x + dx * t + dz * o, y(t), a.z + dz * t - dx * o] as const;
      for (let t = s; t < e - 1e-6; t += 0.7) {
        const t1 = Math.min(e, t + 0.7);
        b.quad(p(t, SENTE_5E.half), p(t, -SENTE_5E.half), p(t1, -SENTE_5E.half), p(t1, SENTE_5E.half), SENTE_5E.color);
      }
      s = e + SENTE_5E.gap;
    }
    carry = s - len;
  }
}

/**
 * Le Creux : le fût creusé, le sol, le banc, la lanterne et son crochet, les trois pierres ; sa sente, s'il est trouvé
 * (`found`). Dans le maillage des lieux : aucun appel de plus.
 */
export function creuxFacets(found: boolean): Facets {
  const b = new FacetBuilder();
  const c = CREUX_5E.center;
  const g = groundAt(c.x, c.z);
  trunk(b, g);
  floor(b, g);
  bench(b, g);
  lantern(b, g);
  stones(b);
  if (found) sente(b);
  return b.build();
}

/** Les triangles du Creux seul (sans sa sente), et avec sa sente : le budget. */
export const creuxTriangles = (): { creux: number; withSente: number } => ({ creux: creuxFacets(false).triangles, withSente: creuxFacets(true).triangles });

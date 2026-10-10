// Le toit en pavillon d'un plan rond (au 5e, le kiosque à musique ; retouches du directeur artistique du 9 octobre 2026,
// troisième tour : « un toit en pavillon, le damier peint dessus, sans redans ») : un seul toit en pente sur tout le
// rang bas du toit du plan, quatre grands pans tournés vers les coins coupés du plan, et quatre petites croupes à leurs
// pointes, d'une seule hauteur d'avant-toit tout autour ; une verrière basse au faîte, plus claire que le toit.
// - Le plan ne change pas (ses rangs de toile et de tuile, son lanterneau de vitraux) : c'est le dessin.
// - Chaque colonne du rang bas porte le morceau du toit au-dessus d'elle, dans la matière de son bloc : le damier du plan
//   se lit sur la pente (une case de toile, une de tuile), sans arête par case ni redan entre les rangs.
// - Le morceau sort de la hauteur de sa case (le toit monte jusqu'au faîte), jamais de sa colonne, sauf aux quatre coins
//   coupés du plan, où le bord du toit, droit, passe sur une case vide : ce bout-là va à la case du coin, sa voisine.
// - Le même toit coiffe, au 3e, la coupole de lentilles de l'observatoire des étoiles (intention du directeur artistique
//   du 10 octobre 2026) : `hippedRoofPieces` le lit sur le plan de n'importe quel monument.
// Code pur, sans Three.js.
import type { VoxelCube } from '../cube';
import type { DessinDePiece, Facette, V3 } from './rooms';

/** Les mesures du toit en pavillon, en part de case. */
export const HIPPED_ROOF = {
  /** La hauteur de l'avant-toit : le bord du toit, tout autour, au-dessus du dessous du rang bas. */
  eave: 0.3,
  /** La pente : ce que le toit monte par case vers le faîte. */
  slope: 0.68,
  /** Le pied de la verrière : où le toit s'arrête, en cases depuis le centre (sur les axes). */
  crown: 1.2,
  /** La verrière : sa hauteur, et son dessus, en part de son pied. */
  lantern: { height: 0.4, top: 0.75 },
} as const;

/** Le toit d'un plan : son centre, le dessous de son rang bas, sa demi-largeur sur les axes et sa coupe aux coins. */
export interface HippedRoof {
  cx: number;
  cy: number;
  base: number;
  /** La demi-largeur du toit sur les axes (le bord droit des côtés). */
  half: number;
  /** La coupe des coins : |u| + |v| au plus. */
  cut: number;
}

type P2 = [number, number];
/** Un demi-plan : a·u + b·v ≤ c. */
type HalfPlane = [number, number, number];

const EPS = 1e-9;

/** Le polygone convexe `poly` coupé par le demi-plan (Sutherland-Hodgman). */
function clip(poly: P2[], [a, b, c]: HalfPlane): P2[] {
  const out: P2[] = [];
  const inside = (p: P2) => a * p[0] + b * p[1] <= c + EPS;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const pi = inside(p);
    const qi = inside(q);
    if (pi) out.push(p);
    if (pi !== qi) {
      const fp = a * p[0] + b * p[1] - c;
      const fq = a * q[0] + b * q[1] - c;
      const t = fp / (fp - fq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  // Sans les points doublés (une coupe sur un sommet).
  return out.filter((p, i) => {
    const q = out[(i + 1) % out.length];
    return out.length < 2 || Math.abs(p[0] - q[0]) > EPS || Math.abs(p[1] - q[1]) > EPS;
  });
}

/** L'aire signée d'un polygone (positive : dans le sens direct). */
const area = (poly: P2[]) => poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length][1] - poly[(i + 1) % poly.length][0] * p[1], 0) / 2;

/** Le bord du toit : ses six demi-plans (deux côtés droits par axe, quatre coupes de coin). */
function outline(r: HippedRoof): HalfPlane[] {
  return [
    [1, 0, r.half],
    [-1, 0, r.half],
    [0, 1, r.half],
    [0, -1, r.half],
    [1, 1, r.cut],
    [-1, 1, r.cut],
    [-1, -1, r.cut],
    [1, -1, r.cut],
  ];
}

/** Un polygone convexe en facettes de trois ou quatre sommets (un éventail de quadrilatères). */
function facets(points: V3[], normale: V3, face: Facette['face']): Facette[] {
  const out: Facette[] = [];
  for (let i = 1; i + 1 < points.length; i += 2) {
    const quad = i + 2 < points.length ? [points[0], points[i], points[i + 1], points[i + 2]] : [points[0], points[i], points[i + 1]];
    out.push({ points: quad, normale, face, motif: 0 });
  }
  return out;
}

const unit = (v: V3): V3 => {
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
};

/**
 * Les pans du toit : dans chaque quart (signes `su`, `sv`), trois pans, chacun là où sa mesure du centre est la plus
 * grande (le côté le long de u, celui le long de v, la coupe du coin, ramenée à la demi-largeur) ; le toit monte de
 * l'avant-toit, au bord, jusqu'au pied de la verrière.
 */
function pans(r: HippedRoof): { region: HalfPlane[]; grad: P2 }[] {
  const k = r.half / r.cut;
  const out: { region: HalfPlane[]; grad: P2 }[] = [];
  for (const su of [1, -1])
    for (const sv of [1, -1]) {
      // Les trois mesures, linéaires dans le quart : L = g·(u, v).
      const L: P2[] = [
        [su, 0],
        [0, sv],
        [k * su, k * sv],
      ];
      for (let i = 0; i < 3; i++) {
        const g = L[i];
        const region: HalfPlane[] = [
          [-su, 0, 0],
          [0, -sv, 0],
          // Sa mesure l'emporte sur les deux autres.
          ...L.filter((_, j) => j !== i).map(([a, b]): HalfPlane => [a - g[0], b - g[1], 0]),
          // Au-delà du pied de la verrière.
          [-g[0], -g[1], -HIPPED_ROOF.crown],
        ];
        out.push({ region, grad: g });
      }
    }
  return out;
}

/** La hauteur du toit (au-dessus de son dessous) à une mesure `n` du centre. */
const heightAt = (r: HippedRoof, n: number) => HIPPED_ROOF.eave + (r.half - n) * HIPPED_ROOF.slope;

/**
 * Le morceau du toit au-dessus de la colonne (x, y) (sa case de grille), en coordonnées du monde : ses pans, et son
 * avant-toit là où le bord du toit la traverse. Vide hors du toit, et sous la verrière.
 */
export function roofOverColumn(r: HippedRoof, x: number, y: number): Facette[] {
  const square: P2[] = [
    [x - r.cx, y - r.cy],
    [x + 1 - r.cx, y - r.cy],
    [x + 1 - r.cx, y + 1 - r.cy],
    [x - r.cx, y + 1 - r.cy],
  ];
  let inRoof = square;
  for (const h of outline(r)) inRoof = clip(inRoof, h);
  if (inRoof.length < 3 || area(inRoof) < 1e-6) return [];
  const world = (p: P2, z: number): V3 => [p[0] + r.cx, p[1] + r.cy, z];
  const out: Facette[] = [];
  const { slope, eave } = HIPPED_ROOF;
  for (const { region, grad } of pans(r)) {
    let poly = inRoof;
    for (const h of region) poly = clip(poly, h);
    if (poly.length < 3 || area(poly) < 1e-6) continue;
    const pts = poly.map((p) => world(p, r.base + heightAt(r, grad[0] * p[0] + grad[1] * p[1])));
    out.push(...facets(pts, unit([slope * grad[0], slope * grad[1], 1]), 'dessus'));
  }
  // Pas de dessous : tourné vers le bas, sous l'avant-toit, aucune caméra (toujours au-dessus du toit) ne le voit.
  // L'avant-toit : les côtés du morceau posés sur le bord du toit.
  for (let i = 0; i < inRoof.length; i++) {
    const a = inRoof[i];
    const b = inRoof[(i + 1) % inRoof.length];
    const bord = outline(r).find(([p, q, c]) => Math.abs(p * a[0] + q * a[1] - c) < 1e-6 && Math.abs(p * b[0] + q * b[1] - c) < 1e-6);
    if (!bord) continue;
    const n = unit([bord[0], bord[1], 0]);
    out.push({ points: [world(a, r.base), world(b, r.base), world(b, r.base + eave), world(a, r.base + eave)], normale: n, face: 'cote', motif: 0 });
  }
  return out;
}

/** La verrière au faîte : un tronc de pyramide bas, du pied du toit à son dessus, en coordonnées du monde. */
export function crownLantern(r: HippedRoof): Facette[] {
  const k = r.half / r.cut;
  const { crown, lantern } = HIPPED_ROOF;
  // L'octogone d'une mesure n : |u| ≤ n, |u| + |v| ≤ n / k.
  const ring = (n: number, z: number): V3[] => {
    const d = n / k - n;
    const pts: P2[] = [
      [n, -d],
      [n, d],
      [d, n],
      [-d, n],
      [-n, d],
      [-n, -d],
      [-d, -n],
      [d, -n],
    ];
    return pts.map((p) => [p[0] + r.cx, p[1] + r.cy, z]);
  };
  const z0 = r.base + heightAt(r, crown);
  const z1 = z0 + lantern.height;
  const bas = ring(crown, z0);
  const haut = ring(crown * lantern.top, z1);
  const out: Facette[] = [];
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    const pts = [bas[i], bas[j], haut[j], haut[i]];
    const e1: V3 = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1], pts[1][2] - pts[0][2]];
    const e2: V3 = [pts[3][0] - pts[0][0], pts[3][1] - pts[0][1], pts[3][2] - pts[0][2]];
    out.push({ points: pts, normale: unit([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]), face: 'dessus', motif: 0 });
  }
  out.push(...facets(haut, [0, 0, 1], 'dessus'));
  return out;
}

/** Des facettes du monde ramenées dans la case (x, y, z) : la pièce de cette case. */
function inCase(facettes: readonly Facette[], x: number, y: number, z: number): DessinDePiece {
  return { facettes: facettes.map((f) => ({ ...f, points: f.points.map((p): V3 => [p[0] - x, p[1] - y, p[2] - z]) })), couvre: 0 };
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Le toit en pavillon d'un monument : le monument, les matières de son toit, le bloc qui porte la verrière du faîte. */
export interface PlanRoofSpec {
  /** Le lieu du monument (`monument:<id>`). */
  place: string;
  /** Les matières des rangs du toit : le rang le plus bas porte le pavillon. */
  roofs: ReadonlySet<string>;
  /** Le bloc qui porte la verrière, une fois le toit fini : sa matière, et sa hauteur en rangs au-dessus du rang bas. */
  crown: { texture: string; rise: number };
}

/** Le toit lu sur le plan d'un monument (fantômes compris) : le pavillon, ses cases, et les bouts de toit des coins coupés. */
interface PlanRoof {
  roof: HippedRoof;
  /** Les cases du plan (clé `x,y,z`). */
  at: ReadonlyMap<string, VoxelCube>;
  /** Un bloc du toit est-il encore en fantôme ? (La verrière attend le toit fini.) */
  unfinished: boolean;
  /** Les colonnes vides des coins coupés que le bord du toit passe, par case du rang bas qui les porte. */
  corners: ReadonlyMap<string, readonly (readonly [number, number])[]>;
}

/** Le toit en pavillon d'un plan, d'après les cases de son rang bas (le centre, la demi-largeur, la coupe des coins). */
function planRoofOf(plan: readonly VoxelCube[], roofs: ReadonlySet<string>): PlanRoof | null {
  const at = new Map<string, VoxelCube>();
  for (const c of plan) if (Number.isInteger(c.x) && Number.isInteger(c.y) && Number.isInteger(c.z)) at.set(cle(c.x, c.y, c.z), c);
  const toit = [...at.values()].filter((c) => roofs.has(c.texture ?? ''));
  if (!toit.length) return null;
  const base = Math.min(...toit.map((c) => c.z));
  const bas = toit.filter((c) => c.z === base);
  const cx = bas.reduce((s, c) => s + c.x + 0.5, 0) / bas.length;
  const cy = bas.reduce((s, c) => s + c.y + 0.5, 0) / bas.length;
  const half = Math.max(...bas.map((c) => Math.max(Math.abs(c.x + 0.5 - cx), Math.abs(c.y + 0.5 - cy)))) + 0.5;
  const cut = Math.max(...bas.map((c) => Math.abs(c.x + 0.5 - cx) + Math.abs(c.y + 0.5 - cy))) + 0.5;
  const roof: HippedRoof = { cx, cy, base, half, cut };
  // Les coins coupés : une colonne vide sous le bord du toit va à sa voisine vers le centre, le long de son plus grand écart.
  const corners = new Map<string, [number, number][]>();
  const dans = new Set(bas.map((c) => `${c.x},${c.y}`));
  const [x0, x1] = [Math.floor(cx - half), Math.ceil(cx + half)];
  const [y0, y1] = [Math.floor(cy - half), Math.ceil(cy + half)];
  for (let x = x0; x < x1; x++)
    for (let y = y0; y < y1; y++) {
      if (dans.has(`${x},${y}`) || !roofOverColumn(roof, x, y).length) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const pas: [number, number][] = Math.abs(dx) >= Math.abs(dy) ? [[-Math.sign(dx), 0], [0, -Math.sign(dy)]] : [[0, -Math.sign(dy)], [-Math.sign(dx), 0]];
      const porteur = pas.map(([px, py]) => `${x + px},${y + py}`).find((k) => dans.has(k));
      if (!porteur) continue;
      const l = corners.get(porteur) ?? [];
      l.push([x, y]);
      corners.set(porteur, l);
    }
  return { roof, at, unfinished: toit.some((c) => c.ghost), corners };
}

/**
 * Le toit en pavillon d'un monument d'un seul tenant (`Kit.monumentPieces`) : chaque case posée de son rang bas porte le
 * toit au-dessus de sa colonne (et les bouts des coins coupés), sauf sous un fantôme (elle garde son dessin ordinaire) ;
 * une case d'un rang du dessus ne dessine rien sur une case posée (le pavillon passe à travers) ; la case du milieu qui
 * porte la verrière la dessine une fois le toit fini, les autres blocs de sa matière rien. `undefined` : le dessin
 * ordinaire.
 */
export function hippedRoofPieces(spec: PlanRoofSpec): (c: VoxelCube, plan: readonly VoxelCube[]) => DessinDePiece | null | undefined {
  const read = new WeakMap<readonly VoxelCube[], PlanRoof | null>();
  const roofOf = (plan: readonly VoxelCube[]) => {
    let k = read.get(plan);
    if (k === undefined) read.set(plan, (k = planRoofOf(plan, spec.roofs)));
    return k;
  };
  return (c, plan) => {
    if (c.place !== spec.place) return undefined;
    const k = roofOf(plan);
    if (!k) return undefined;
    const { roof, at } = k;
    const crown = !k.unfinished && c.texture === spec.crown.texture;
    if (crown && c.z === roof.base + spec.crown.rise && c.x === Math.floor(roof.cx) && c.y === Math.floor(roof.cy)) return inCase(crownLantern(roof), c.x, c.y, c.z);
    if (spec.roofs.has(c.texture ?? '')) {
      if (c.z === roof.base) {
        const dessus = at.get(cle(c.x, c.y, c.z + 1));
        if (dessus?.ghost) return undefined;
        const facettes = [roofOverColumn(roof, c.x, c.y), ...(k.corners.get(`${c.x},${c.y}`) ?? []).map(([x, y]) => roofOverColumn(roof, x, y))].flat();
        return inCase(facettes, c.x, c.y, c.z);
      }
      const dessous = at.get(cle(c.x, c.y, roof.base));
      return dessous && !dessous.ghost ? null : undefined;
    }
    return crown ? null : undefined;
  };
}

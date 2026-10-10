// La lueur d'une lanterne allumée de Blocland, la nuit (GD-10 : le phare du large fini, `VoxelCube.lit`), sans Three.js :
// ce que la vue 3D (three/lanternGlow.ts) pose autour des blocs allumés, en deux appels de dessin.
//
// - la peau : les côtés de la lanterne, un rien au-dessus de ses blocs, pleins de la lueur la nuit (la lanterne y
//   devient nettement plus vive que le jour) ;
// - les flaques : la lumière chaude posée sur la corniche (le dessus des blocs autour du pied de la lanterne) et sur
//   l'eau au pied de la tour, dans le même maillage ;
// - le halo : un disque doux face à la caméra, centré sur la lanterne, deux à trois fois plus large qu'elle.
//
// Tout est fixe : ni faisceau, ni clignotement, ni pulsation (règles dys). De jour, rien n'est dessiné ; la nuit monte
// avec la lumière (chaque minute au plus, figée avec « Réduire les animations »). Les positions sont dans le repère de
// Three (X = x, Y = z, la hauteur, Z = y), comme le maillage des blocs (./mesher.ts) ; les uv lisent un dégradé
// radial (plein au centre, nul au bord), et un sommet de la peau lit le centre du dégradé, plein.
import type { VoxelCube } from './cube';

/** La peau de la lanterne dépasse ses blocs de tant de case (au-dessus de leurs faces, sans s'y mêler). */
export const PEAU = 0.03;
/** L'opacité de la peau, la nuit : presque pleine, les plombs du vitrail se devinent encore. */
const OPACITE_DE_LA_PEAU = 0.9;
/** Le halo : son côté, en part de la plus grande dimension de la lanterne (le dégradé s'efface avant le bord). */
export const HALO = 3;
/** L'opacité du halo en son centre, la nuit. */
export const OPACITE_DU_HALO = 0.6;
/** La flaque de la corniche : son rayon dépasse le bord de la lanterne de tant de cases. */
const DEBORD_DE_LA_CORNICHE = 1.6;
/** L'opacité de la flaque de la corniche en son centre, la nuit. */
const OPACITE_DE_LA_CORNICHE = 0.7;
/** La flaque sur l'eau : son rayon, en part de la plus grande dimension de la lanterne (au moins `RAYON_DE_L_EAU_MIN`). */
const RAYON_DE_L_EAU = 2.6;
export const RAYON_DE_L_EAU_MIN = 6;
/** L'opacité de la flaque sur l'eau en son centre, la nuit (son centre est caché par l'îlot : on voit son bord). */
const OPACITE_DE_L_EAU = 0.55;
/** Les flaques flottent de tant au-dessus de ce qu'elles éclairent. */
const AU_DESSUS = 0.02;

/** Le halo d'une lanterne : son centre (repère de Three) et son côté. */
interface HaloDeLanterne {
  centre: [number, number, number];
  cote: number;
}

/** La peau et les flaques (un maillage, des couleurs à quatre composantes : blanc, et l'opacité), et les halos. */
export interface LueursDesLanternes {
  positions: number[];
  uvs: number[];
  /** Quatre composantes par sommet : 1, 1, 1 et l'opacité du sommet (le matériau porte la couleur de la lueur). */
  colors: number[];
  indices: number[];
  halos: HaloDeLanterne[];
}

const cle = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Les lueurs des lanternes allumées de ces cubes, une par lieu (`place`, sinon `tag`) ; `null` sans bloc allumé.
 * `eau` : la hauteur de l'eau (repère de Three), ou `null` sans mer (les Îles du Ciel).
 */
export function lueursDesLanternes(cubes: readonly VoxelCube[], eau: number | null): LueursDesLanternes | null {
  const groupes = new Map<string, VoxelCube[]>();
  for (const c of cubes) {
    if (!c.lit || c.ghost || c.muted) continue;
    const k = c.place ?? c.tag ?? '';
    let g = groupes.get(k);
    if (!g) groupes.set(k, (g = []));
    g.push(c);
  }
  if (!groupes.size) return null;
  const l: LueursDesLanternes = { positions: [], uvs: [], colors: [], indices: [], halos: [] };
  const boites = [...groupes.values()].map((g) => {
    const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
    for (const c of g) {
      b.x0 = Math.min(b.x0, c.x);
      b.y0 = Math.min(b.y0, c.y);
      b.z0 = Math.min(b.z0, c.z);
      b.x1 = Math.max(b.x1, c.x + 1);
      b.y1 = Math.max(b.y1, c.y + 1);
      b.z1 = Math.max(b.z1, c.z + 1);
    }
    return b;
  });
  // Les cases pleines autour du pied de chaque lanterne, en un passage : la corniche et ce qui la couvre.
  const pleines = new Set<string>();
  for (const c of cubes) {
    if (c.ghost) continue;
    for (const b of boites) {
      const r = DEBORD_DE_LA_CORNICHE + 1;
      if (c.z >= b.z0 - 1 && c.z <= b.z0 && c.x >= b.x0 - r && c.x < b.x1 + r && c.y >= b.y0 - r && c.y < b.y1 + r) pleines.add(cle(c.x, c.y, c.z));
    }
  }
  for (const b of boites) {
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.y0 + b.y1) / 2;
    const largeur = Math.max(b.x1 - b.x0, b.y1 - b.y0);
    peau(l, b);
    // La corniche : le dessus de chaque case pleine sous le pied de la lanterne, que rien ne couvre.
    const r = largeur / 2 + DEBORD_DE_LA_CORNICHE;
    for (let x = Math.floor(cx - r); x < Math.ceil(cx + r); x++)
      for (let y = Math.floor(cz - r); y < Math.ceil(cz + r); y++) {
        if (!pleines.has(cle(x, y, b.z0 - 1)) || pleines.has(cle(x, y, b.z0))) continue;
        flaque(l, x, x + 1, y, y + 1, b.z0 + AU_DESSUS, cx, cz, r, OPACITE_DE_LA_CORNICHE);
      }
    // L'eau au pied de la tour : un carré centré sur la lanterne, dont l'îlot cache le milieu.
    if (eau !== null) {
      const re = Math.max(RAYON_DE_L_EAU_MIN, RAYON_DE_L_EAU * largeur);
      flaque(l, cx - re, cx + re, cz - re, cz + re, eau + AU_DESSUS, cx, cz, re, OPACITE_DE_L_EAU);
    }
    l.halos.push({ centre: [cx, (b.z0 + b.z1) / 2, cz], cote: HALO * Math.max(largeur, b.z1 - b.z0) });
  }
  return l;
}

/** Un quadrilatère : quatre sommets (repère de Three), leurs uv et leur opacité, deux triangles tournés vers `n`. */
function quad(l: LueursDesLanternes, p: [number, number, number][], uv: [number, number][], a: number) {
  const base = l.positions.length / 3;
  for (let i = 0; i < 4; i++) {
    l.positions.push(...p[i]);
    l.uvs.push(...uv[i]);
    l.colors.push(1, 1, 1, a);
  }
  l.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

/** Les quatre côtés de la boîte de la lanterne, un rien au-dehors, tournés vers l'extérieur ; ils lisent le centre du dégradé. */
function peau(l: LueursDesLanternes, b: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number }) {
  const [x0, x1, z0, z1] = [b.x0 - PEAU, b.x1 + PEAU, b.y0 - PEAU, b.y1 + PEAU];
  const [h0, h1] = [b.z0, b.z1 + PEAU];
  const plein: [number, number][] = [
    [0.5, 0.5],
    [0.5, 0.5],
    [0.5, 0.5],
    [0.5, 0.5],
  ];
  const a = OPACITE_DE_LA_PEAU;
  // Sud (−Z), est (+X), nord (+Z), ouest (−X) : dans l'ordre direct vu du dehors.
  quad(l, [[x0, h0, z0], [x0, h1, z0], [x1, h1, z0], [x1, h0, z0]], plein, a);
  quad(l, [[x1, h0, z0], [x1, h1, z0], [x1, h1, z1], [x1, h0, z1]], plein, a);
  quad(l, [[x1, h0, z1], [x1, h1, z1], [x0, h1, z1], [x0, h0, z1]], plein, a);
  quad(l, [[x0, h0, z1], [x0, h1, z1], [x0, h1, z0], [x0, h0, z0]], plein, a);
}

/** Une flaque horizontale à la hauteur `h`, de `x0` à `x1` et de `z0` à `z1`, qui lit le dégradé centré sur (cx, cz) de rayon `r`. */
function flaque(l: LueursDesLanternes, x0: number, x1: number, z0: number, z1: number, h: number, cx: number, cz: number, r: number, a: number) {
  const uv = (x: number, z: number): [number, number] => [(x - cx) / (2 * r) + 0.5, (z - cz) / (2 * r) + 0.5];
  // Tournée vers le haut (+Y).
  quad(l, [[x0, h, z0], [x0, h, z1], [x1, h, z1], [x1, h, z0]], [uv(x0, z0), uv(x0, z1), uv(x1, z1), uv(x1, z0)], a);
}

/** Ce que coûtent les lueurs la nuit : les triangles de la peau, des flaques et des halos, et leurs appels de dessin. */
export function coutDesLueurs(l: LueursDesLanternes | null): { triangles: number; drawCalls: number } {
  if (!l) return { triangles: 0, drawCalls: 0 };
  return { triangles: l.indices.length / 3 + 2 * l.halos.length, drawCalls: (l.indices.length ? 1 : 0) + l.halos.length };
}

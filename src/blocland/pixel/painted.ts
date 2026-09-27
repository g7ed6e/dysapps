// La 2D peinte (lot R7 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les couleurs de la vue 2D derrière le
// drapeau `?rendu=archipeo`, toutes tirées de la palette d'Archipéo (world/palette.ts), par archipel, de jour et de nuit.
// Calcul pur, testé sans canvas : les correspondances des sols, les couleurs d'une face, des bords, de la mer, des ombres,
// les festons des franges et la clé des caches. Le dessin est dans ./paintedDraw.ts et ./paintedSprites.ts ; sans le
// drapeau, la 2D en pixels (./draw.ts, ./tiles.ts, ./sprites.ts) ne passe jamais par ici.
import type { VoxelCube } from '../Voxel';
import { mixColor } from '../world/daylight';
import type { ArchipelagoId, Ground } from '../world/map';
import { MATIERES, PALETTES, cielDe, couleurDeMatiere, couleurDuSol, multiplie, type Ciel, type Couleur, type Faces } from '../world/palette';
import type { TextureKind } from '../world/pixels';
import { FROID, FROID_SOUS, bruit } from '../world/style';
import { CHUNK, type TileMap } from './oblique';
import type { Material } from './surface';

/** Brume (la planche d'Archipéo) : l'écume, et le délavé d'une île verrouillée. */
export const BRUME = 0xe5ebe3;
/** Nuit océan (la planche) : le trait des rebords, les contours, les ombres. */
export const NUIT_OCEAN = 0x142b38;

/**
 * La lumière se lit par paliers (0 : nuit, `PALIERS` : plein jour) : un palier est une clé de cache, un changement de
 * palier redessine le terrain. Cinq paliers : la tombée du jour passe par trois teintes intermédiaires.
 */
export const PALIERS = 4;

export function palierDe(light: number): number {
  return Math.round(Math.min(1, Math.max(0, light)) * PALIERS);
}

/** Le sol de la palette qui peint chaque matière dessinée de la 2D (`terre` et `autre` n'en ont pas). */
export const SOL_DE: Record<Material, Ground | null> = {
  herbe: 'herbe',
  mousse: 'mousse',
  sable: 'sable',
  terre: null,
  pierre: 'roche',
  basalte: 'basalte',
  eau: 'eau',
  lave: 'lave',
  glace: 'glace',
  neige: 'neige',
  autre: null,
};

const channels = (c: Couleur): [number, number, number] => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const pack = (r: number, g: number, b: number): Couleur =>
  (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)));

/** Multiplie une couleur par un nombre (une nuance). */
export function nuancer(c: Couleur, k: number): Couleur {
  return pack(((c >> 16) & 255) * k, ((c >> 8) & 255) * k, (c & 255) * k);
}

/** `#rrggbb` → couleur. */
export const depuisHex = (h: string): Couleur => parseInt(h.slice(1), 16);
/** Couleur → `rgba(…)` pour le canvas. */
export const rgba = (c: Couleur, a = 1): string => {
  const [r, g, b] = channels(c);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** La nuance des dessus : de larges taches (9 blocs environ), ±6 %, comme les dessus de la 3D (world/style.ts). */
export const TACHES = 0.06;
export const TACHE_BLOCS = 9;

export function nuanceDuDessus(x: number, y: number): number {
  return 1 + TACHES * (bruit(x / TACHE_BLOCS, y / TACHE_BLOCS) * 2 - 1);
}

/**
 * Un feston : la profondeur (en pixels) d'une frange ondulée à l'abscisse `s` le long d'un bord, des arcs réguliers
 * de `periode` pixels entre `min` et `max`. `s` se compte dans le monde (pixels depuis l'origine) : deux cases voisines
 * se raccordent sans marche.
 */
export function feston(s: number, periode: number, min: number, max: number): number {
  const u = (((s + 0.5) % periode) + periode) % periode / periode;
  return min + (max - min) * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2));
}

/**
 * Le pointillé d'un fantôme, au bord de sa case : des points blancs (comme en pixels) et, entre eux, des points Nuit
 * océan ; l'un des deux se lit sur tout sol, clair (sable, neige, pierre) ou sombre, de jour comme de nuit.
 */
export const POINTILLE: { blanc: [Couleur, number]; sombre: [Couleur, number] } = { blanc: [0xffffff, 0.85], sombre: [NUIT_OCEAN, 0.6] };

/** Trois festons par case de 16 pixels (l'intention : deux à quatre). */
export const FESTON = 16 / 3;

/** Ce que la 2D peinte sait d'un archipel à un palier de lumière : son ciel, et les couleurs de ses faces. */
export interface Peinture {
  archipel: ArchipelagoId;
  palier: number;
  light: number;
  /** La clé des caches (tuiles, sprites, mer) : archipel et palier. */
  cle: string;
  ciel: Ciel;
  /** La mer : le large, la bande claire près des rives, le haut-fond, les reflets. */
  mer: { large: Couleur; pres: Couleur; rive: Couleur; reflet: Couleur };
  /** L'écume, de la Brume (plus sombre la nuit). */
  ecume: Couleur;
  /** Les ombres portées : bleutées, jamais noires. */
  ombre: Couleur;
  /** Le trait des rebords et des contours. */
  trait: Couleur;
  /** Les couleurs d'une face (dessus, côté) d'un cube, délavées s'il est sur une île verrouillée. */
  faces(cube: VoxelCube): Faces;
  /** Les couleurs d'un sol dessiné (les franges d'un sol chez son voisin), délavées si `muted`. */
  sol(m: Material, muted: boolean): Faces;
  /** Les couleurs d'une matière (bloc, décor), délavées si `muted`. */
  matiere(m: TextureKind, muted: boolean): Faces;
  /** Une couleur libre (un bloc sans matière, une fleur) à ce moment du jour, délavée si `muted`. */
  libre(c: Couleur, muted: boolean): Couleur;
  /** Le dessus d'un sol près de la mer (sous la hauteur `FROID_SOUS`) tire vers l'ambiance renvoyée par l'eau. */
  froid(c: Couleur, z: number): Couleur;
  /** Le pied d'une falaise : plus sombre et bleuté. */
  pied(c: Couleur): Couleur;
  /** Le haut d'une falaise, sous la lèvre : plus clair. */
  levre(c: Couleur): Couleur;
}

/** Une couleur sans matière, la nuit : sous la lune, relevée vers l'horizon de nuit (comme les surfaces de la palette). */
export function deNuit(a: ArchipelagoId, c: Couleur, light: number): Couleur {
  const n = PALETTES[a].nuit;
  const nuit = mixColor(multiplie(c, n.ambianceCiel), n.horizon, 0.3);
  return mixColor(nuit, c, Math.min(1, Math.max(0, light)));
}

/**
 * Délave une couleur vers la Brume (une île verrouillée) : moins de couleur, plus de clair, moins de contraste. Jamais
 * vers le gris : la Brume est un blanc verdi. `brume` : la Brume au moment du jour.
 */
export function delaver(c: Couleur, brume: Couleur): Couleur {
  const [r, g, b] = channels(c);
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const terne = pack(r * 0.45 + lum * 0.55, g * 0.45 + lum * 0.55, b * 0.45 + lum * 0.55);
  return mixColor(terne, brume, 0.55);
}

const peintures = new Map<string, Peinture>();

/** La peinture d'un archipel à un palier de lumière (gardée en cache : cinq paliers par archipel au plus). */
export function peinture(a: ArchipelagoId, palier: number): Peinture {
  const cle = `${a}:${palier}`;
  const found = peintures.get(cle);
  if (found) return found;
  const light = palier / PALIERS;
  const ciel = cielDe(a, light);
  // La Brume à ce moment du jour : la nuit la bleuit, sans l'éteindre (une île fermée reste plus claire que les autres).
  const brume = mixColor(deNuit(a, BRUME, light), BRUME, 0.25);
  const muer = (f: Faces, muted: boolean): Faces => (muted ? { dessus: delaver(f.dessus, brume), cote: delaver(f.cote, brume) } : f);
  const sols = new Map<string, Faces>();
  const sol = (m: Material, muted: boolean): Faces => {
    const k = `${m}:${muted ? 1 : 0}`;
    let f = sols.get(k);
    if (!f) {
      const g = SOL_DE[m];
      const base = g ? couleurDuSol(a, g, light) : couleurDeMatiere(a, m === 'terre' ? 'terre' : 'pierre', light);
      sols.set(k, (f = muer(base, muted)));
    }
    return f;
  };
  const matieres = new Map<string, Faces>();
  const matiere = (m: TextureKind, muted: boolean): Faces => {
    const k = `${m}:${muted ? 1 : 0}`;
    let f = matieres.get(k);
    if (!f) matieres.set(k, (f = muer(couleurDeMatiere(a, m, light), muted)));
    return f;
  };
  const libre = (c: Couleur, muted: boolean) => {
    const n = deNuit(a, c, light);
    return muted ? delaver(n, brume) : n;
  };
  const p: Peinture = {
    archipel: a,
    palier,
    light,
    cle,
    ciel,
    mer: {
      large: ciel.mer,
      // Près des rives, l'eau s'éclaircit vers le turquoise des sols d'eau, puis vers l'horizon sur le haut-fond.
      pres: mixColor(ciel.mer, couleurDuSol(a, 'eau', light).dessus, 0.45),
      rive: mixColor(mixColor(ciel.mer, couleurDuSol(a, 'eau', light).dessus, 0.6), ciel.horizon, 0.3),
      reflet: mixColor(ciel.mer, ciel.horizon, 0.55),
    },
    // L'écume reste claire la nuit : elle dessine le bord des îles sur la mer sombre.
    ecume: brume,
    ombre: mixColor(NUIT_OCEAN, ciel.ambianceCiel, 0.2),
    trait: NUIT_OCEAN,
    faces(cube) {
      const m = SURFACE_DE_TEXTURE[cube.texture ?? ''];
      if (m) return sol(m, Boolean(cube.muted));
      if (cube.texture && cube.texture in MATIERES) return matiere(cube.texture as TextureKind, Boolean(cube.muted));
      const cote = depuisHex(cube.color);
      const dessus = cube.top ? depuisHex(cube.top) : nuancer(cote, 1.16);
      return { dessus: libre(dessus, Boolean(cube.muted)), cote: libre(cote, Boolean(cube.muted)) };
    },
    sol,
    matiere,
    libre,
    froid: (c, z) => (z < FROID_SOUS ? mixColor(c, ciel.ambianceSol, FROID) : c),
    pied: (c) => mixColor(multiplie(c, mixColor(ciel.ambianceCiel, NUIT_OCEAN, 0.18)), NUIT_OCEAN, 0.06),
    levre: (c) => mixColor(c, 0xffffff, 0.12),
  };
  peintures.set(cle, p);
  return p;
}

/**
 * Les textures des sols dessinés, peintes de la couleur de leur sol (le même que la 3D tire de la grille des hauteurs) :
 * l'herbe, le sable, la roche (pierre et galet), la neige… Les autres textures (planches, briques, tuiles…) prennent la
 * couleur de leur matière.
 */
export const SURFACE_DE_TEXTURE: Record<string, Material> = {
  herbe: 'herbe',
  sable: 'sable',
  terre: 'terre',
  pierre: 'pierre',
  galet: 'pierre',
  nuage: 'neige',
  mousse: 'mousse',
  basalte: 'basalte',
  lave: 'lave',
  glace: 'glace',
  eau: 'eau',
};

/**
 * Les grands motifs, très peu contrastés, des matières de bâtiment qu'on ne reconnaîtrait plus en aplat (planches,
 * tuiles, briques) : des bandes de deux pixels au moins, jamais un grain.
 */
export type Motif = 'lames' | 'rangs' | 'briques' | null;

export function motifDe(texture: string | undefined): Motif {
  if (texture === 'planches' || texture === 'lambris' || texture === 'barriere' || texture === 'escalier') return 'lames';
  if (texture === 'tuile' || texture === 'toit') return 'rangs';
  if (texture === 'brique') return 'briques';
  return null;
}

/** Un motif : la nuance d'un pixel d'une face de 16 × 16 (1 : rien), des bandes de deux pixels à 5 % au plus. */
export function nuanceDuMotif(motif: Motif, px: number, py: number): number {
  if (motif === 'lames') return py % 8 >= 6 ? 0.95 : 1;
  if (motif === 'rangs') return py % 6 >= 4 ? 0.95 : 1;
  if (motif === 'briques') return py % 8 >= 6 || (px + (py >> 3) * 8) % 16 >= 14 ? 0.95 : 1;
  return 1;
}

/**
 * Le dégradé d'une falaise : la part d'ombre bleutée (0 à 1) à `profondeur` blocs sous sa lèvre. Claire en haut, plus
 * sombre au pied ; sur un mur de bâtiment (`sol` faux), moitié moins.
 */
export function ombreDeFalaise(profondeur: number, sol: boolean): number {
  const t = Math.min(1, Math.max(0, profondeur / 3.5));
  const s = t * t * (3 - 2 * t);
  return sol ? 0.2 + 0.7 * s : 0.1 + 0.35 * s;
}

/**
 * Les strates d'une falaise : un bloc de haut chacune, au bord ondulé (jamais une ligne d'un pixel) ; renvoie la nuance
 * (1 ou 0,95) du pixel à l'abscisse `wx` (en blocs) et à la hauteur `wz` (en blocs).
 */
export function strate(wx: number, wz: number, onde = ondeDesStrates(wx)): number {
  return Math.floor(wz + 0.35 + onde) % 2 === 0 ? 1 : 0.94;
}

/** Le bord ondulé des strates, à l'abscisse `wx` (en blocs) : il ne dépend que de l'abscisse (calculé une fois par colonne). */
export function ondeDesStrates(wx: number): number {
  return 0.12 * Math.sin(wx * 1.9) + 0.07 * Math.sin(wx * 4.3 + 1.3);
}

/**
 * Les morceaux de terrain à peindre quand il y a une mer : ceux qui ont des cases, et ceux où déborde la bande claire
 * des rives (une case autour du terrain). Les morceaux de mer seule ne sont jamais peints (ni gardés en mémoire).
 */
export function morceauxAPeindre(map: TileMap, mer: boolean): Set<string> {
  const out = new Set(map.chunks.keys());
  if (!mer) return out;
  const chunkOf = (v: number) => Math.floor(v / CHUNK);
  for (const t of map.tiles.values()) {
    if (!t.solid) continue;
    // Seules les cases au bord de leur morceau débordent chez un voisin.
    const cx = chunkOf(t.col);
    const cy = chunkOf(t.row);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        const nx = chunkOf(t.col + dx);
        const ny = chunkOf(t.row + dy);
        if (nx !== cx || ny !== cy) out.add(`${nx},${ny}`);
      }
  }
  return out;
}

// La 2D peinte (lot R7 de la piste Rendu, docs/conception/cadrage-archipeo.md) : les couleurs de la vue 2D dans l’univers
// Archipéo (voir ../rendu.ts), toutes tirées de la palette d'Archipéo (world/palette.ts), par archipel, de jour et de nuit.
// Calcul pur, testé sans canvas : les correspondances des sols, les couleurs d'une face, des bords, de la mer, des ombres,
// les festons des franges et la clé des caches. Le dessin est dans ./paintedDraw.ts et ./paintedSprites.ts ; sans le
// drapeau, la 2D en pixels (./draw.ts, ./tiles.ts, ./sprites.ts) ne passe jamais par ici.
import type { VoxelCube } from '../Voxel';
import { mixColor } from '../world/daylight';
import type { ArchipelagoId, Ground } from '../world/map';
import { MATIERES, cielDe, couleurDeMatiere, couleurDuSol, deNuit, luminance, multiplie, type Ciel, type Couleur, type Faces } from '../world/palette';
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

/**
 * Délave une couleur vers la Brume (une île verrouillée) : moins de couleur, plus de clair, moins de contraste. Jamais
 * vers le gris : la Brume est un blanc verdi, sous un léger voile froid. Si le délavé tombe à la valeur de la couleur
 * d'origine (neige, glace, marbre, le sable au crépuscule), il s'en écarte : plus clair vers la Brume, ou, pour ce qui
 * est déjà aussi clair qu'elle, plus sombre vers le voile froid. L'île fermée se distingue ainsi de l'ouverte même en
 * niveaux de gris (`ECART_FERMEE`). `brume` : la Brume au moment du jour.
 */
export function delaver(c: Couleur, brume: Couleur): Couleur {
  const [r, g, b] = channels(c);
  const lum = r * 0.3 + g * 0.59 + b * 0.11;
  const terne = pack(r * 0.45 + lum * 0.55, g * 0.45 + lum * 0.55, b * 0.45 + lum * 0.55);
  const froid = voileFroid(brume);
  const lave = mixColor(mixColor(terne, brume, 0.6), froid, 0.08);
  const ecart = (x: Couleur) => {
    const [p, q] = [luminance(x), luminance(c)].sort((u, v) => v - u);
    return (p + 0.05) / (q + 0.05);
  };
  if (ecart(lave) >= ECART_FERMEE) return lave;
  const vers = luminance(c) >= luminance(brume) * 0.8 ? froid : brume;
  for (let k = 0.1; k <= 1; k += 0.1) {
    const x = mixColor(lave, vers, k);
    if (ecart(x) >= ECART_FERMEE) return x;
  }
  return mixColor(lave, vers, 1);
}

/** L'écart de valeur (contraste WCAG) entre une surface d'une île fermée et la même, ouverte. */
export const ECART_FERMEE = 1.2;

/** Le voile froid d'une île fermée : la Brume assombrie vers la Nuit océan. */
export const voileFroid = (brume: Couleur): Couleur => mixColor(brume, NUIT_OCEAN, 0.45);

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
 * La matière des ouvrages, qu'on ne reconnaîtrait plus en aplat : les rangs de tuiles d'un toit, les planches d'un mur
 * de bois, les joints larges des briques et des pierres taillées. Des bandes de deux pixels au moins, 11 % plus
 * sombres, jamais un grain ; comptées en pixels de l'écran, elles courent d'une case à l'autre sans rupture.
 */
export type Motif = 'lames' | 'rangs' | 'briques' | 'pierres' | 'dalles' | 'tresse' | 'ecailles' | null;

export function motifDe(texture: string | undefined): Motif {
  if (texture === 'planches' || texture === 'lambris' || texture === 'barriere' || texture === 'escalier' || texture === 'porte') return 'lames';
  if (texture === 'tuile' || texture === 'toit') return 'rangs';
  if (texture === 'brique') return 'briques';
  if (texture === 'taille' || texture === 'marbre') return 'pierres';
  if (texture === 'dalle') return 'dalles';
  if (texture === 'osier') return 'tresse';
  if (texture === 'bardeau') return 'ecailles';
  return null;
}

/** La nuance d'un joint (ou d'un bas de rang) : 11 % plus sombre que la face. */
export const JOINT = 0.89;

/**
 * Un motif : la nuance du pixel (`gx`, `gy`) de l'écran, en pixels de base (1 : la face, `JOINT` : un joint). Les
 * tuiles : deux rangs par case ; les planches : deux lames ; les briques : 8 × 16 en quinconce ; les pierres : 16 × 16.
 */
export function nuanceDuMotif(motif: Motif, gx: number, gy: number): number {
  const mod = (v: number, n: number) => ((v % n) + n) % n;
  if (motif === 'lames' || motif === 'rangs') return mod(gy, 8) >= 6 ? JOINT : 1;
  if (motif === 'briques') return mod(gy, 8) >= 6 || mod(gx + (mod(Math.floor(gy / 8), 2) ? 8 : 0), 16) >= 14 ? JOINT : 1;
  // Les dalles du Relais : 8 × 8 en quinconce, d'une demi-dalle d'une rangée à l'autre (deux par case).
  if (motif === 'dalles') return mod(gy, 8) >= 6 || mod(gx + (mod(Math.floor(gy / 8), 2) ? 4 : 0), 8) >= 6 ? JOINT : 1;
  // L'osier du Jardin : des brins de deux pixels, un joint de deux, et un montant de deux pixels tous les huit, qui passe
  // devant un rang sur deux, en quinconce (dessus-dessous).
  if (motif === 'tresse') return mod(gy, 4) >= 2 || mod(gx + (mod(Math.floor(gy / 4), 2) ? 4 : 0), 8) >= 6 ? JOINT : 1;
  // Le bardeau du Refuge : des rangs de quatre pixels, des bardeaux de huit décalés de quatre d'un rang à l'autre, le
  // bas de chaque rang en joint, et ses deux coins coupés un pixel plus haut (le bas arrondi).
  if (motif === 'ecailles') {
    const u = mod(gx + (mod(Math.floor(gy / 4), 2) ? 4 : 0), 8);
    return mod(gy, 4) === 3 || (mod(gy, 4) === 2 && (u === 0 || u === 7)) ? JOINT : 1;
  }
  if (motif === 'pierres') return mod(gy, 16) >= 14 || mod(gx + (mod(Math.floor(gy / 16), 2) ? 8 : 0), 16) >= 14 ? JOINT : 1;
  return 1;
}

/** Les fenêtres et les lanternes : un cadre de deux pixels, dans la teinte sombre de leur matière. */
export const aCadre = (texture: string | undefined): boolean => texture === 'verre' || texture === 'lanterne';

/** Le cadre d'une fenêtre ou d'une lanterne, et le contour d'un ouvrage : la teinte sombre de sa matière, pas un noir. */
export const sombreDe = (cote: Couleur): Couleur => mixColor(cote, NUIT_OCEAN, 0.62);

/**
 * Le dégradé d'une falaise : la part d'ombre bleutée (0 à 1) à `profondeur` blocs sous sa lèvre. Claire en haut, plus
 * sombre au pied. Un mur d'ouvrage (`sol` faux) n'en a pas : une seule teinte par face.
 */
export function ombreDeFalaise(profondeur: number, sol: boolean): number {
  if (!sol) return 0;
  const t = Math.min(1, Math.max(0, profondeur / 3.5));
  const s = t * t * (3 - 2 * t);
  return 0.2 + 0.7 * s;
}

/** Les rochers et les bancs de sable du large (`tag` « mer ») : ni rive claire autour, ni morceau peint pour eux. */
export const auLarge = (cube: VoxelCube): boolean => cube.tag === 'mer';

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
    if (!t.solid || auLarge(t.solid.cube)) continue;
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

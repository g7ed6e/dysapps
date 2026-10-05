// La mer d'Archipéo (lot R3 de la piste Rendu, docs/univers/archipeo/cadrage.md) : code pur, sans Three.js. La vue
// 3D la dessine dans l’univers Archipéo (voir rendu.ts) (three/mer.ts), en un seul appel de dessin.
//
// - La carte de la mer (`carteDeLaMer`) : une image calculée, deux points par case, sur l'étendue de l'archipel et une
//   marge. Ses couleurs vont du Bleu lagon sur les hauts-fonds à la mer de l'archipel, puis au large vers la Nuit océan
//   (`eauxDe` dans ./palette.ts), selon la distance à la terre ; son canal alpha garde cette distance (jusqu'à `PORTEE`
//   cases) : l'écume du rivage et le calme de la houle près des côtes s'en déduisent au dessin, nettes à toute échelle.
// - La grille de la mer (`grilleDeLaMer`) : de grands triangles irréguliers (un pas de `PAS` cases, sommets déplacés au
//   hasard), et une couronne jusqu'à l'horizon ; la houle (`houle`, la même formule que le dessin) soulève les sommets,
//   et les facettes prennent la lumière chacune à leur façon.
// - Aux Îles du Ciel, le même principe fait le plancher de nuages : plus sombre sous les îles, clair au loin, une houle
//   lente et plus ample, pas d'écume.
import { AMBIENCE, mixColor } from './daylight';
import { eclairement, NIVEAU_EAU, type ChampDuSol } from './landMesh';
import type { ArchipelagoId } from './map';
import { eauxDe, type Couleur } from './palette';
import { cellHash } from '../../core/random';
import { smoothstep } from '../../core/math';

/** Les points de la carte de la mer par case (sur chaque axe). */
export const PAR_CASE = 2;
/** Le plancher de nuages des Îles du Ciel : sa hauteur, sous la roche des îles (à 9), au-dessus de la mer qu'on ne voit plus. */
export const PLANCHER_DE_NUAGES = 2.5;
/** La marge de la carte autour de l'étendue de l'archipel, en cases : au-delà, le large. */
const MARGE = 24;
/** La distance à la terre gardée dans la carte (canal alpha), en cases. */
export const PORTEE = 8;
/** Les distances (en cases) où la mer passe du lagon à la mer de l'archipel, puis de la mer au large. */
export const PALIERS = { lagon: 1.5, mer: 8, large: 22 } as const;
/** Le lissage de la profondeur (rayon en cases) : pas de pli sombre à mi-chemin entre deux îles. */
const LISSAGE = 3;
/** Sur ce bord du cadre (en cases), la mer rejoint le large : rien ne s'étire au-delà de la carte. */
export const BORD = 6;
/** Le pas de la grille de la mer, en cases. */
const PAS = 4;
/** L'écume du rivage : sa largeur (en cases), son souffle (± en cases), son bord (fondu, en cases). */
/**
 * L'écume du rivage : le liseré (sa largeur et son bord, en cases, et son souffle, ± en cases) ; plus loin, à `ligne`
 * case du liseré, une seconde ligne fixe à `force` de son opacité, seulement là où l'eau fait au moins `passe` cases
 * entre deux terres (ailleurs, le liseré seul).
 */
export const ECUME = { largeur: 0.26, souffle: 0.07, bord: 0.05, ligne: 0.42, force: 0.4, passe: 1.5 } as const;

/** La houle d'un archipel : amplitude au large et au rivage (en blocs), vitesse, et échelle des vagues (1 : 13 cases). */
export interface Houle {
  large: number;
  rivage: number;
  vitesse: number;
  echelle: number;
}

/** La houle, sur la mer ; ample et lente sur le plancher de nuages des Îles du Ciel. */
export function houleDe(a: ArchipelagoId): Houle {
  return AMBIENCE[a].sky ? { large: 0.4, rivage: 0.4, vitesse: 0.35, echelle: 0.55 } : { large: 0.14, rivage: 0.03, vitesse: 1, echelle: 1 };
}

/**
 * La hauteur de la houle en un point (x, z du repère Three), au temps `t` (secondes), à `distance` cases de la terre :
 * la même formule que le dessin (three/mer.ts). Entre −amplitude et +amplitude ; calme près des côtes.
 */
export function houle(h: Houle, x: number, z: number, t: number, distance: number): number {
  const amp = h.rivage + (h.large - h.rivage) * smoothstep(0.5, 4, distance);
  const s = h.echelle;
  const tt = t * h.vitesse;
  return amp * (0.55 * Math.sin(s * (0.42 * x + 0.23 * z) + 0.9 * tt) + 0.45 * Math.sin(s * (-0.19 * x + 0.37 * z) + 0.7 * tt + 1.3));
}

// ---------- La lumière ----------

/** sRGB (0..1) vers linéaire, et retour. */
const versLineaire = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
const versSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);

/**
 * La part de sa couleur qu'une surface plate renvoie de jour dans la vue 3D (la lumière de la palette sur un matériau
 * mat, divisée par π comme le fait Three.js) : 1 la montrerait telle quelle.
 */
export function exposition(a: ArchipelagoId): number {
  return eclairement(a, [0, 1, 0]) / Math.PI;
}

/** La couleur à donner à une surface plate pour qu'on la voie `vue` de jour (bornée au blanc). */
export function compense(vue: Couleur, e: number): Couleur {
  const ch = [(vue >> 16) & 255, (vue >> 8) & 255, vue & 255].map((c) => Math.round(versSrgb(Math.min(1, versLineaire(c / 255) / e)) * 255));
  return (ch[0] << 16) | (ch[1] << 8) | ch[2];
}

/** Ce qu'on voit, de jour, d'une surface plate de couleur `c` (l'inverse de `compense`, hors saturation). */
export function vueDeJour(c: Couleur, e: number): Couleur {
  const ch = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => Math.round(versSrgb(Math.min(1, versLineaire(v / 255) * e)) * 255));
  return (ch[0] << 16) | (ch[1] << 8) | ch[2];
}

// ---------- La terre, vue de la mer ----------

/** Une case de terre, vue de la mer ; un écueil (rocher, banc, pilotis) fait de l'écume, pas de lagon. */
export interface Terre {
  x: number;
  y: number;
  ecueil?: boolean;
}

/**
 * Les cases où la terre rencontre l'eau : les colonnes du sol qui plongent sous l'eau, les éboulis à leur pied, et ce
 * qui affleure dans la mer (rochers, bancs, pierres de gué, pilotis : les cubes sous le niveau 0). Aux Îles du Ciel,
 * l'emprise des îles au-dessus du plancher de nuages.
 */
export function terresDeLaMer(champ: ChampDuSol, autres: { x: number; y: number; z: number }[] = []): Terre[] {
  const vues = new Set<string>();
  const out: Terre[] = [];
  const ajoute = (x: number, y: number, ecueil = false) => {
    const k = `${x},${y}`;
    if (vues.has(k)) return;
    vues.add(k);
    out.push(ecueil ? { x, y, ecueil } : { x, y });
  };
  const ciel = AMBIENCE[champ.archipel].sky;
  for (const c of champ.colonnes) if (ciel || c.bas < NIVEAU_EAU) ajoute(c.x, c.y);
  if (ciel) return out;
  for (const p of champ.pieds) ajoute(p.x, p.y);
  for (const c of autres) if (c.z < 0) ajoute(c.x, c.y, true);
  return out;
}

/** La signature d'une liste de terres : la même tant que la côte ne change pas. */
export function signatureDesTerres(terres: Terre[]): string {
  return terres
    .map((t) => `${t.x},${t.y}${t.ecueil ? 'e' : ''}`)
    .sort()
    .join('|');
}

// ---------- La carte de la mer ----------

/** L'étendue d'un archipel, en cases (`worldBounds` de ./terrain.ts). */
export interface Etendue {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CarteDeLaMer {
  /** Le coin de la carte (en cases) et sa taille (en cases). */
  x0: number;
  y0: number;
  largeur: number;
  hauteur: number;
  /** Sa taille en points (`PAR_CASE` par case). */
  l: number;
  h: number;
  /** Les points, ligne par ligne depuis `y0` : couleur sRGB (à montrer telle quelle de jour) et distance à la terre. */
  data: Uint8Array;
  /** Un point par point de la carte : 255 là où l'eau laisse la place à la seconde ligne d'écume (voir `ECUME.passe`), 0 sinon. */
  seconde: Uint8Array;
  /** L'écume, sRGB, compensée comme la mer. */
  ecume: Couleur;
  /** Vrai aux Îles du Ciel : pas d'écume. */
  nuages: boolean;
}

/** Le cadre de la carte : l'étendue de l'archipel et sa marge. */
export function cadreDeLaMer(e: Etendue): { x0: number; y0: number; largeur: number; hauteur: number } {
  const x0 = Math.floor(e.minX) - MARGE;
  const y0 = Math.floor(e.minY) - MARGE;
  return { x0, y0, largeur: Math.ceil(e.maxX) + MARGE - x0, hauteur: Math.ceil(e.maxY) + MARGE - y0 };
}

/** La couleur de la mer (à voir) à `d` cases de la terre. */
export function couleurDeLaMer(a: ArchipelagoId, d: number): Couleur {
  const e = eauxDe(a);
  const versMer = mixColor(e.lagon, e.mer, smoothstep(PALIERS.lagon, PALIERS.mer, d));
  return mixColor(versMer, e.large, smoothstep(PALIERS.mer, PALIERS.large, d));
}

/**
 * La carte de la mer d'un archipel : pour chaque point, la couleur de l'eau (compensée : de jour, on la voit telle que
 * la palette la veut) et la distance à la terre (canal alpha, 0 à `PORTEE` cases, exacte près des côtes).
 */
export function carteDeLaMer(a: ArchipelagoId, terres: Terre[], etendue: Etendue): CarteDeLaMer {
  const { x0, y0, largeur, hauteur } = cadreDeLaMer(etendue);
  const l = largeur * PAR_CASE;
  const h = hauteur * PAR_CASE;
  // La terre, case par case, sur le cadre.
  const terre = new Uint8Array(largeur * hauteur);
  for (const t of terres) {
    const i = t.x - x0;
    const j = t.y - y0;
    if (i >= 0 && j >= 0 && i < largeur && j < hauteur) terre[j * largeur + i] = t.ecueil ? 2 : 1;
  }
  // Une distance approchée, point par point (chanfrein en deux passes), depuis les points dont le centre est sur terre :
  // à toute terre (l'écume), et aux îles seulement (la profondeur, sans les écueils).
  const INF = 1e9;
  const D = Math.SQRT2;
  const chanfrein = (source: (v: number) => boolean) => {
    const d = new Float32Array(l * h).fill(INF);
    for (let j = 0; j < h; j++)
      for (let i = 0; i < l; i++) if (source(terre[Math.floor(j / PAR_CASE) * largeur + Math.floor(i / PAR_CASE)])) d[j * l + i] = 0;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < l; i++) {
        const k = j * l + i;
        let v = d[k];
        if (i > 0) v = Math.min(v, d[k - 1] + 1);
        if (j > 0) {
          v = Math.min(v, d[k - l] + 1);
          if (i > 0) v = Math.min(v, d[k - l - 1] + D);
          if (i < l - 1) v = Math.min(v, d[k - l + 1] + D);
        }
        d[k] = v;
      }
    for (let j = h - 1; j >= 0; j--)
      for (let i = l - 1; i >= 0; i--) {
        const k = j * l + i;
        let v = d[k];
        if (i < l - 1) v = Math.min(v, d[k + 1] + 1);
        if (j < h - 1) {
          v = Math.min(v, d[k + l] + 1);
          if (i < l - 1) v = Math.min(v, d[k + l + 1] + D);
          if (i > 0) v = Math.min(v, d[k + l - 1] + D);
        }
        d[k] = v;
      }
    return d;
  };
  const d = chanfrein((v) => v > 0);
  const dIles = chanfrein((v) => v === 1);
  // La profondeur, pour la couleur : la distance ramenée à la case, lissée (deux passes d'une moyenne glissante), pour
  // que la mer ne marque pas de pli à mi-chemin entre deux îles.
  const MAX = PALIERS.large + 2;
  let prof = new Float32Array(largeur * hauteur);
  for (let v = 0; v < hauteur; v++)
    for (let u = 0; u < largeur; u++) {
      let sum = 0;
      for (let b = 0; b < PAR_CASE; b++) for (let c = 0; c < PAR_CASE; c++) sum += dIles[(v * PAR_CASE + b) * l + u * PAR_CASE + c];
      prof[v * largeur + u] = Math.min(MAX, sum / (PAR_CASE * PAR_CASE) / PAR_CASE);
    }
  const glisse = (src: Float32Array, dx: number, dy: number) => {
    const out = new Float32Array(src.length);
    for (let v = 0; v < hauteur; v++)
      for (let u = 0; u < largeur; u++) {
        let sum = 0;
        let n = 0;
        for (let k = -LISSAGE; k <= LISSAGE; k++) {
          const uu = u + k * dx;
          const vv = v + k * dy;
          if (uu < 0 || vv < 0 || uu >= largeur || vv >= hauteur) continue;
          sum += src[vv * largeur + uu];
          n++;
        }
        out[v * largeur + u] = sum / n;
      }
    return out;
  };
  for (let pass = 0; pass < 2; pass++) prof = glisse(glisse(prof, 1, 0), 0, 1);
  /** La profondeur lissée en un point (en cases), entre les centres des cases. */
  const profEn = (x: number, y: number) => {
    const fx = Math.min(largeur - 1, Math.max(0, x - x0 - 0.5));
    const fy = Math.min(hauteur - 1, Math.max(0, y - y0 - 0.5));
    const u = Math.floor(fx);
    const v = Math.floor(fy);
    const u1 = Math.min(largeur - 1, u + 1);
    const v1 = Math.min(hauteur - 1, v + 1);
    const tx = fx - u;
    const ty = fy - v;
    const at = (a: number, b: number) => prof[b * largeur + a];
    return (at(u, v) * (1 - tx) + at(u1, v) * tx) * (1 - ty) + (at(u, v1) * (1 - tx) + at(u1, v1) * tx) * ty;
  };
  const e = exposition(a);
  // Les couleurs, par pas de 1/32 de case : la table évite de refaire le mélange à chaque point.
  const table = new Map<number, number>();
  const couleur = (dist: number) => {
    const q = Math.round(Math.min(dist, MAX) * 32);
    let c = table.get(q);
    if (c === undefined) {
      c = compense(couleurDeLaMer(a, q / 32), e);
      table.set(q, c);
    }
    return c;
  };
  const data = new Uint8Array(l * h * 4);
  const PRES = 3.2;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < l; i++) {
      const k = j * l + i;
      // Le centre du point, en cases.
      const px = x0 + (i + 0.5) / PAR_CASE;
      const py = y0 + (j + 0.5) / PAR_CASE;
      // Loin : la distance approchée, du centre du point au bord de la terre la plus proche.
      let dist = Math.max(0, (d[k] - 0.5) / PAR_CASE);
      if (d[k] === 0) dist = 0;
      else if (dist <= PRES) {
        // Près des côtes : la distance exacte au carré de chaque case de terre voisine.
        let best = Infinity;
        const cx = Math.floor(px) - x0;
        const cy = Math.floor(py) - y0;
        for (let v = cy - 4; v <= cy + 4; v++)
          for (let u = cx - 4; u <= cx + 4; u++) {
            if (u < 0 || v < 0 || u >= largeur || v >= hauteur || !terre[v * largeur + u]) continue;
            const qx = x0 + u;
            const qy = y0 + v;
            const dx = Math.max(qx - px, 0, px - qx - 1);
            const dy = Math.max(qy - py, 0, py - qy - 1);
            best = Math.min(best, Math.hypot(dx, dy));
          }
        if (best < Infinity) dist = best;
      }
      // Sur le bord du cadre, tout rejoint le large (couleur et distance) : la carte s'étire au-delà sans rien y traîner.
      const bord = smoothstep(1, BORD, Math.min(px - x0, py - y0, x0 + largeur - px, y0 + hauteur - py));
      // La couleur suit la profondeur lissée (loin des îles, pas des écueils), sans jamais être plus profonde que la
      // distance exacte près des côtes.
      const pres = dIles[k] === 0 ? 0 : dIles[k] === d[k] ? dist : Math.max(0, (dIles[k] - 0.5) / PAR_CASE);
      const p = Math.min(profEn(px, py), pres);
      const profondeur = p + (MAX - p) * (1 - bord);
      const c = couleur(profondeur);
      const o = k * 4;
      data[o] = (c >> 16) & 255;
      data[o + 1] = (c >> 8) & 255;
      data[o + 2] = c & 255;
      const vue = dist + (PORTEE - Math.min(dist, PORTEE)) * (1 - bord);
      data[o + 3] = Math.round((Math.min(vue, PORTEE) / PORTEE) * 255);
    }
  const nuages = AMBIENCE[a].sky;
  // La seconde ligne d'écume : là où l'eau d'un passage fait au moins `ECUME.passe` cases, le point le plus éloigné des
  // deux rives est à `passe / 2` au moins ; on le cherche à une case autour de chaque point.
  const seconde = new Uint8Array(l * h);
  const R = PAR_CASE;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < l; i++) {
      let max = 0;
      for (let v = Math.max(0, j - R); v <= Math.min(h - 1, j + R) && max < ECUME.passe / 2; v++)
        for (let u = Math.max(0, i - R); u <= Math.min(l - 1, i + R); u++) max = Math.max(max, (data[(v * l + u) * 4 + 3] / 255) * PORTEE);
      seconde[j * l + i] = max >= ECUME.passe / 2 - 1e-3 ? 255 : 0;
    }
  return { x0, y0, largeur, hauteur, l, h, data, seconde, ecume: compense(eauxDe(a).ecume, e), nuages };
}

/** La distance à la terre (en cases) lue dans la carte, au point le plus proche de (x, y) : pour les tests. */
export function distanceSurLaCarte(c: CarteDeLaMer, x: number, y: number): number {
  const i = Math.min(c.l - 1, Math.max(0, Math.floor((x - c.x0) * PAR_CASE)));
  const j = Math.min(c.h - 1, Math.max(0, Math.floor((y - c.y0) * PAR_CASE)));
  return (c.data[(j * c.l + i) * 4 + 3] / 255) * PORTEE;
}

// ---------- La grille ----------

export interface GrilleDeLaMer {
  /** Sommets (repère Three : X = x, Y = 0, Z = y) et coordonnées dans la carte (hors de 0..1 : le large). */
  positions: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

/**
 * La grille de la mer : le cadre de la carte en triangles de `PAS` cases, sommets intérieurs déplacés au hasard (pas
 * de motif régulier), et une couronne jusqu'à `loin` cases au-delà du cadre, pour l'horizon.
 */
export function grilleDeLaMer(e: Etendue, loin: number): GrilleDeLaMer {
  const { x0, y0, largeur, hauteur } = cadreDeLaMer(e);
  const lignes = (debut: number, n: number) => {
    const out = [debut - loin];
    const m = Math.max(1, Math.round(n / PAS));
    for (let k = 0; k <= m; k++) out.push(debut + (n * k) / m);
    out.push(debut + n + loin);
    return out;
  };
  const xs = lignes(x0, largeur);
  const zs = lignes(y0, hauteur);
  const nx = xs.length;
  const nz = zs.length;
  const positions = new Float32Array(nx * nz * 3);
  const uvs = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      // Les sommets intérieurs bougent (d'un cinquième de pas au plus : aucun triangle ne se retourne) ; le bord du cadre
      // et la couronne restent droits.
      const interieur = i > 1 && i < nx - 2 && j > 1 && j < nz - 2;
      const jx = interieur ? (cellHash(i * 7 + 1, j * 13 + 5) - 0.5) * 0.4 * PAS : 0;
      const jz = interieur ? (cellHash(i * 11 + 3, j * 5 + 7) - 0.5) * 0.4 * PAS : 0;
      const x = xs[i] + jx;
      const z = zs[j] + jz;
      const k = j * nx + i;
      positions[k * 3] = x;
      positions[k * 3 + 1] = 0;
      positions[k * 3 + 2] = z;
      uvs[k * 2] = (x - x0) / largeur;
      uvs[k * 2 + 1] = (z - y0) / hauteur;
    }
  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let n = 0;
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx + 1;
      const d = a + nx;
      // Vus d'en haut, dans le sens inverse des aiguilles d'une montre (face vers +Y) ; la diagonale au hasard.
      if (cellHash(i * 3 + 11, j * 17 + 2) < 0.5) indices.set([a, d, c, a, c, b], n);
      else indices.set([a, d, b, b, d, c], n);
      n += 6;
    }
  return { positions, uvs, indices };
}

/** Nombre de triangles d'une grille de la mer. */
export const trianglesDeLaGrille = (g: GrilleDeLaMer) => g.indices.length / 3;

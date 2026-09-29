// Les bancs de brume des Îles Brumeuses (sous-lot R4b-5e ; intention du directeur artistique, design/archipeo/
// intentions/5e-iles-brumeuses.md §2 et §6) : deux ou trois couches étagées, translucides, sur la mer libre seulement,
// toujours sous le sol des îles. Code pur, sans Three.js : un maillage à couleurs par sommet, avec leur opacité, que
// three/brume.ts dessine en un appel et fait respirer selon la règle commune (`respirationDeLaBrume`, ./fumee.ts).
//
// - Jamais sur la terre : les couches sont sous le sol des îles (3 blocs au 5e, 2 pour les mares), qui les cache ; elles
//   viennent donc lécher le pied des falaises, dans les chenaux, comme la fiche le demande. Jamais sur un ouvrage, le
//   quai, un îlot, les places de la baleine ni la route du navire, droit vers le large depuis le quai (../voyage.ts,
//   `vehiclePath`) : la brume s'y éteint.
// - Une grille lâche : chaque sommet a son opacité (nulle là où la brume n'a pas sa place, et au cœur des îles, où rien
//   ne se verrait), modulée par un bruit lent qui fait les bancs ; seuls les carrés où un sommet au moins est visible
//   sont tracés. Sans la brume de profondeur : de la couleur de l'horizon, elle s'y fondrait.
import { BIOMES } from '../../biomes';
import { BRIDGES, getArchipelago } from '../archipelago';
import { archipelagoOfIsland } from '../archipels';
import { dockBox } from '../harbour';
import { lineaire, NIVEAU_EAU } from '../landMesh';
import { landCells, mapOf, smoothNoise, type ArchipelagoId } from '../map';
import { MONUMENT_ISLET, monumentsOf } from '../monuments';
import type { Couleur } from '../palette';
import { rgb } from './pinceau';
import { bossIsletOrigin, bridgePath, ISLET_W, ISLET_H, mistPatches, whaleSpots, worldBounds } from '../terrain';

/** Une couche de brume : sa hauteur au-dessus de l'eau, sa couleur, son opacité la plus forte et la part de la mer qu'elle couvre. */
export interface CoucheDeBrume {
  hauteur: number;
  couleur: Couleur;
  opacite: number;
  /** De 0 (aucun banc) à 1 (toute la mer libre) : le seuil du bruit au-dessus duquel la couche est là. */
  couvre: number;
}

/**
 * Les couches du 5e, du bas vers le haut : `#C5D9EB` en bas, `#E5EBE3` en haut, la couche du bas à 0,6 d'opacité au
 * plus, respiration comprise (±10 %). Toutes sous le sol des îles (à 3 blocs dans les Îles Brumeuses).
 */
export const COUCHES_5E: readonly CoucheDeBrume[] = [
  { hauteur: 0.35, couleur: 0xc5d9eb, opacite: 0.54, couvre: 0.7 },
  { hauteur: 0.95, couleur: 0xd5e2e7, opacite: 0.45, couvre: 0.45 },
  { hauteur: 1.6, couleur: 0xe5ebe3, opacite: 0.4, couvre: 0.25 },
];

/** Les bancs de brume des archipels qui en ont. */
export const BANCS_DE_BRUME: Readonly<Partial<Record<ArchipelagoId, readonly CoucheDeBrume[]>>> = { '5e': COUCHES_5E };

/** Le pas de la grille, en cases, et la marge autour de l'archipel (celle de l'habillage de la mer). */
export const PAS_DE_LA_BRUME = 6;
const MARGE = 26;
/** La largeur du couloir laissé au navire, de part et d'autre de son quai, et sa longueur vers le large. */
const ROUTE_DU_NAVIRE = { marge: 4, large: 30 };

/** Les bancs de brume d'un archipel : sommets (repère Three), couleurs RGBA linéaires, et indices. */
export interface BancsDeBrume {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Au cœur d'une île, à plus de tant de cases de la mer, la brume ne se verrait pas : elle n'y est pas tracée. */
const BORD_DES_ILES = 4;

/**
 * Là où la brume a sa place : partout sauf sur un ouvrage (à une case près), le quai (à deux), un îlot, les places de
 * la baleine, la route du navire et le cœur des îles. Au pied des îles, elle passe sous leur sol, qui la cache.
 */
export function placeDeLaBrume(a: ArchipelagoId): (x: number, y: number) => boolean {
  const cle = (x: number, y: number) => (x + 16384) * 32768 + (y + 16384);
  const interdit = new Set<number>();
  const terre = new Set<number>();
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) terre.add(cle(c.x, c.y));
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = -1; x <= ISLET_W; x++) for (let y = -1; y <= ISLET_H; y++) interdit.add(cle(o.x + x, o.y + y));
  }
  for (const def of BRIDGES.filter((br) => archipelagoOfIsland(br.from) === a))
    for (const c of bridgePath(def)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) interdit.add(cle(c.x + dx, c.y + dy));
  const quai = dockBox(getArchipelago(a).port);
  for (let x = quai.x0 - 2; x <= quai.x1 + 2; x++) for (let y = quai.y0 - 2; y <= quai.y1 + 2; y++) interdit.add(cle(x, y));
  for (const m of monumentsOf(a)) for (let x = -1; x <= MONUMENT_ISLET; x++) for (let y = -1; y <= MONUMENT_ISLET; y++) interdit.add(cle(m.islet.x + x, m.islet.y + y));
  const baleines = whaleSpots(a);
  const auCoeur = (x: number, y: number) => {
    for (let dx = -BORD_DES_ILES; dx <= BORD_DES_ILES; dx += BORD_DES_ILES) for (let dy = -BORD_DES_ILES; dy <= BORD_DES_ILES; dy += BORD_DES_ILES) if (!terre.has(cle(x + dx, y + dy))) return false;
    return true;
  };
  return (x, y) => {
    if (x >= quai.x0 - ROUTE_DU_NAVIRE.marge && x <= quai.x1 + ROUTE_DU_NAVIRE.marge && y <= quai.y1 && y >= quai.y0 - ROUTE_DU_NAVIRE.large) return false;
    if (interdit.has(cle(x, y)) || auCoeur(x, y)) return false;
    return baleines.every((w) => Math.hypot(w.x - x, w.y - y) > w.r + 2);
  };
}

/**
 * L'opacité d'une couche en un point : nulle là où la brume n'a pas sa place, pleine au cœur d'un banc ; elle s'éteint au large,
 * au bord de la grille (`b` : l'étendue de l'archipel), pour qu'aucun bord droit ne se voie.
 */
export function opaciteDeLaBrume(c: CoucheDeBrume, k: number, x: number, y: number, estLibre: (x: number, y: number) => boolean, b: { minX: number; maxX: number; minY: number; maxY: number }): number {
  if (!estLibre(x, y)) return 0;
  // Deux bruits lents, l'un large (les bancs), l'autre plus fin (leurs bords déchirés).
  const n = 0.7 * smoothNoise(91 + k * 7, x, y, 22) + 0.3 * smoothNoise(131 + k * 5, x, y, 9);
  const seuil = 1 - c.couvre;
  const banc = smooth(Math.min(1, Math.max(0, (n - seuil) / 0.3)));
  const large = Math.max(b.minX - x, x - b.maxX, b.minY - y, y - b.maxY, 0);
  const bord = 1 - smooth(Math.min(1, Math.max(0, (large - 4) / (MARGE - 4 - PAS_DE_LA_BRUME))));
  return c.opacite * banc * bord;
}

const cache = new Map<ArchipelagoId, BancsDeBrume | null>();

/** Les bancs de brume d'un archipel (calculés une fois), ou `null` s'il n'en a pas. */
export function bancsDeBrume(a: ArchipelagoId): BancsDeBrume | null {
  const connu = cache.get(a);
  if (connu !== undefined) return connu;
  const couches = BANCS_DE_BRUME[a];
  if (!couches) {
    cache.set(a, null);
    return null;
  }
  const b = worldBounds(a);
  const estLibre = placeDeLaBrume(a);
  const x0 = b.minX - MARGE;
  const y0 = b.minY - MARGE;
  const nx = Math.ceil((b.maxX + MARGE - x0) / PAS_DE_LA_BRUME);
  const ny = Math.ceil((b.maxY + MARGE - y0) / PAS_DE_LA_BRUME);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  couches.forEach((c, k) => {
    const lin = rgb(c.couleur).map((v) => lineaire(v / 255));
    const alpha: number[] = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) alpha.push(opaciteDeLaBrume(c, k, x0 + i * PAS_DE_LA_BRUME, y0 + j * PAS_DE_LA_BRUME, estLibre, b));
    const sommet = new Map<number, number>();
    const indice = (i: number, j: number) => {
      const id = j * (nx + 1) + i;
      let v = sommet.get(id);
      if (v === undefined) {
        v = positions.length / 3;
        positions.push(x0 + i * PAS_DE_LA_BRUME, NIVEAU_EAU + c.hauteur, y0 + j * PAS_DE_LA_BRUME);
        colors.push(lin[0], lin[1], lin[2], alpha[id]);
        sommet.set(id, v);
      }
      return v;
    };
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const coins = [j * (nx + 1) + i, j * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i + 1, (j + 1) * (nx + 1) + i];
        if (coins.every((id) => alpha[id] <= 0)) continue;
        const [p, q, r, s] = [indice(i, j), indice(i + 1, j), indice(i + 1, j + 1), indice(i, j + 1)];
        // Vus d'en haut (la normale vers le ciel).
        indices.push(p, r, q, p, s, r);
      }
  });
  const out: BancsDeBrume = { positions: Float32Array.from(positions), colors: Float32Array.from(colors), indices: Uint32Array.from(indices) };
  cache.set(a, out);
  return out;
}

/**
 * Les nappes des sommets des Îles du Ciel (sous-lot R4b-3e ; fiche du 3e, §4 et §6) : une seule couche plate sous chaque
 * île, sous son sol (`mistPatches`), qui s'efface vers ses bords et se fond dans le plancher de nuages. Jamais des
 * couches étagées comme au 5e. Un disque de `pans` pans par île, deux anneaux : environ 300 triangles en tout (sept îles
 * depuis le Refuge des carnets, LV2-5 : quatorze pans au lieu de seize, 294 triangles).
 */
export const NAPPES_3E = { couleur: 0xe6ecf0, opacite: 0.5, pans: 14, anneau: 0.6 } as const;

const nappesCache = new Map<ArchipelagoId, BancsDeBrume | null>();

/** Les nappes des sommets d'un archipel (Archipéo), dans le format des bancs (un appel de dessin), ou `null`. */
export function nappesDesSommets(a: ArchipelagoId): BancsDeBrume | null {
  const connu = nappesCache.get(a);
  if (connu !== undefined) return connu;
  const patches = mistPatches(a);
  if (!patches.length) {
    nappesCache.set(a, null);
    return null;
  }
  const N = NAPPES_3E;
  const lin = rgb(N.couleur).map((v) => lineaire(v / 255));
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (const m of patches) {
    const sommet = (x: number, z: number, alpha: number) => {
      positions.push(x, m.z, z);
      colors.push(lin[0], lin[1], lin[2], alpha);
      return positions.length / 3 - 1;
    };
    const centre = sommet(m.x, m.y, N.opacite);
    const anneau = (k: number, alpha: number) =>
      Array.from({ length: N.pans }, (_, i) => {
        const a = (i / N.pans) * Math.PI * 2;
        return sommet(m.x + (Math.cos(a) * m.w * k) / 2, m.y + (Math.sin(a) * m.h * k) / 2, alpha);
      });
    const dedans = anneau(N.anneau, N.opacite);
    const dehors = anneau(1, 0);
    for (let i = 0; i < N.pans; i++) {
      const j = (i + 1) % N.pans;
      // Vus d'en haut (la normale vers le ciel).
      indices.push(centre, dedans[j], dedans[i]);
      indices.push(dedans[i], dedans[j], dehors[j], dedans[i], dehors[j], dehors[i]);
    }
  }
  const out: BancsDeBrume = { positions: Float32Array.from(positions), colors: Float32Array.from(colors), indices: Uint32Array.from(indices) };
  nappesCache.set(a, out);
  return out;
}

/** La brume d'Archipéo d'un archipel, celle que dessine three/brume.ts : ses bancs (5e), sinon ses nappes (3e). */
export function brumeDArchipeo(a: ArchipelagoId): BancsDeBrume | null {
  return bancsDeBrume(a) ?? nappesDesSommets(a);
}

/** Les triangles de la brume d'Archipéo d'un archipel (0 s'il n'en a pas). */
export function trianglesDeLaBrume(a: ArchipelagoId): number {
  return (brumeDArchipeo(a)?.indices.length ?? 0) / 3;
}

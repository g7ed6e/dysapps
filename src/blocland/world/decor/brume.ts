// Les bancs de brume des Îles Brumeuses (sous-lot R4b-5e ; intention du directeur artistique, design/archipeo/
// intentions/5e-iles-brumeuses.md §2 et §6) : deux ou trois couches étagées, translucides, sur la mer libre seulement,
// toujours sous le sol des îles. Code pur, sans Three.js : un maillage à couleurs par sommet, avec leur opacité, que
// three/brume.ts dessine en un appel et fait respirer selon la règle commune (`respirationDeLaBrume`, ./fumee.ts).
//
// - La mer libre est celle de l'habillage de la mer (`merLibre`, ../terrain.ts) : jamais sur une île, un îlot, un
//   ouvrage, le quai ou les places de la baleine ; en plus, jamais sur la route du navire, droit vers le large depuis
//   le quai (../voyage.ts, `vehiclePath`).
// - Une grille lâche : chaque sommet a son opacité (nulle hors de la mer libre), modulée par un bruit lent qui fait les
//   bancs ; seuls les carrés où un sommet au moins est visible sont tracés.
import { getArchipelago } from '../archipelago';
import { dockBox } from '../harbour';
import { lineaire, NIVEAU_EAU } from '../landMesh';
import { smoothNoise, type ArchipelagoId } from '../map';
import type { Couleur } from '../palette';
import { rgb } from './pinceau';
import { merLibre, worldBounds } from '../terrain';

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
 * plus. Toutes sous le sol des îles (à 3 blocs dans les Îles Brumeuses).
 */
export const COUCHES_5E: readonly CoucheDeBrume[] = [
  { hauteur: 0.35, couleur: 0xc5d9eb, opacite: 0.55, couvre: 0.75 },
  { hauteur: 0.95, couleur: 0xd5e2e7, opacite: 0.45, couvre: 0.5 },
  { hauteur: 1.6, couleur: 0xe5ebe3, opacite: 0.4, couvre: 0.3 },
];

/** Les bancs de brume des archipels qui en ont. */
export const BANCS_DE_BRUME: Readonly<Partial<Record<ArchipelagoId, readonly CoucheDeBrume[]>>> = { '5e': COUCHES_5E };

/** Le pas de la grille, en cases, et la marge autour de l'archipel (celle de l'habillage de la mer). */
export const PAS_DE_LA_BRUME = 7;
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

/** La mer libre du 5e, moins la route du navire. */
function libre(a: ArchipelagoId): (x: number, y: number) => boolean {
  const mer = merLibre(a);
  const quai = dockBox(getArchipelago(a).port);
  return (x, y) => {
    if (x >= quai.x0 - ROUTE_DU_NAVIRE.marge && x <= quai.x1 + ROUTE_DU_NAVIRE.marge && y <= quai.y1 && y >= quai.y0 - ROUTE_DU_NAVIRE.large) return false;
    return mer(x, y);
  };
}

/**
 * L'opacité d'une couche en un point : nulle hors de la mer libre, pleine au cœur d'un banc ; elle s'éteint au large,
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
  if (cache.has(a)) return cache.get(a)!;
  const couches = BANCS_DE_BRUME[a];
  if (!couches) {
    cache.set(a, null);
    return null;
  }
  const b = worldBounds(a);
  const estLibre = libre(a);
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

/** Les triangles des bancs de brume d'un archipel (0 s'il n'en a pas). */
export function trianglesDeLaBrume(a: ArchipelagoId): number {
  return (bancsDeBrume(a)?.indices.length ?? 0) / 3;
}

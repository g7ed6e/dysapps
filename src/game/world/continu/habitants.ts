// Les habitants des scénettes en modèles 3D (choix du mainteneur, 18 octobre 2026) : un modèle texturé par lieu, tiré du
// concept de l'habitant (TRELLIS, réduit à 17 000 triangles, 22 500 pour la saunière et le chef de gare), rangé dans
// docs/univers/archipeo/personnages/modeles/6e-habitant-<lieu>/habitant.glb. Code pur, sans DOM ni Three.js : le nom du
// fichier, sa mise à la place du pion (sa hauteur, ses pieds, son cap) et le registre des modèles montrés, que le décor de
// près consulte (./scenette.ts : sans modèle, le pion dessiné en code ; avec, le décor sans son corps). Ce qui charge le
// fichier et le dessine est dans la vue (../../importedCharacters.ts, `loadHabitant` ; ../../three/archipeo/habitantModels.ts).
import { levelOfPlace, type PlaceId } from './levelPlan';
import { isBuiltPlace5e } from './plan5e';
import type { PlaceId as PlaceId6e } from './plan6e';

/** La hauteur de l'habitant d'une scénette, en unités du monde (celle du pion dessiné en code, et de son modèle). */
export const HABITANT_HEIGHT = 1.4;

/**
 * La demi-largeur de chaque modèle (bras un peu écartés) et sa demi-profondeur (un sac, une longue-vue au dos), au plus,
 * depuis ses pieds, au centième près : la boîte de l'habitant dans les tests de chevauchement. Un test les relit dans les
 * fichiers.
 */
export const HABITANT_HALVES: Readonly<Record<PlaceId6e, { x: number; z: number }>> = {
  phare: { x: 0.32, z: 0.18 },
  quais: { x: 0.32, z: 0.19 },
  filets: { x: 0.36, z: 0.22 },
  ecluses: { x: 0.3, z: 0.18 },
  saltworks: { x: 0.38, z: 0.21 },
  engine: { x: 0.3, z: 0.14 },
  shipyard: { x: 0.3, z: 0.18 },
  lookout: { x: 0.28, z: 0.28 },
  archives: { x: 0.34, z: 0.16 },
  printworks: { x: 0.45, z: 0.25 },
  mangrove: { x: 0.38, z: 0.16 },
  ruins: { x: 0.28, z: 0.15 },
  observatory: { x: 0.26, z: 0.2 },
  commons: { x: 0.33, z: 0.31 },
  beacons: { x: 0.31, z: 0.18 },
  ferry: { x: 0.36, z: 0.16 },
};

/** Le dossier du modèle de l'habitant d'un lieu (docs/univers/archipeo/personnages/modeles/<nom>/), préfixé de son niveau. */
export const habitantModelName = (place: PlaceId): string => `${levelOfPlace(place)}-habitant-${place}`;

/**
 * L'habitant de ce lieu se montre-t-il en modèle 3D (sinon, son pion dessiné en code) ? Au 6e, tous ; au 5e, celui de
 * chaque lieu construit (choix du mainteneur, 19 octobre 2026 : les quatorze fichiers sont là ; ils entrent lieu par
 * lieu, avec leur scénette, ./plan5e.ts, `BUILT_PLACES_5E`) : la fontainière de la Montée et le boulanger du Hameau (lot
 * 5), le marchand des Radeaux (lot 6), la cordière de la Croisée (lot 7), le tailleur de pierre des Instants (lot 8),
 * le souffleur de verre de l'Étuve (lot 10). Deux scénettes ne s'ouvrent jamais ensemble : aucun triangle de plus.
 */
export const hasHabitantModel = (place: PlaceId): boolean => levelOfPlace(place) === '6e' || isBuiltPlace5e(place);

/** Le fichier du modèle, dans son dossier : une seule version, l'habitant ne se voit que de près, dans sa scénette. */
export const HABITANT_FILE = 'habitant.glb';

/**
 * Les triangles d'un modèle d'habitant, au plus (le budget les compte à la place du pion) : 17 000, et 22 500 pour la
 * saunière et le chef de gare, dont la tête garde plus de triangles (seize.md, « Réduction »). Un test les relit dans les
 * fichiers.
 */
export const HABITANT_TRIANGLES = 22_500;

/** Les triangles d'un modèle d'habitant du 5e, au plus : 8 000 (le plafond du directeur artistique ; un test les relit). */
export const HABITANT_TRIANGLES_5E = 8_000;

/**
 * Les quarts de tour qui tournent un fichier face à la caméra de la scénette (vers +z, le sud), comme le pion : les
 * seize regardent déjà vers +z (la face avant de glTF), aucun.
 */
const QUARTER_TURNS = 0;

/** La part basse du modèle (les jambes et les pieds) sur laquelle il est centré : un outil porté de biais ne le décale pas. */
const FEET_SHARE = 0.25;

/** La mise en place d'un fichier : retrancher `center`, multiplier par `scale`, tourner de `yaw` autour de y. */
export interface HabitantFit {
  center: { x: number; y: number; z: number };
  scale: number;
  yaw: number;
}

/** Un modèle montré : sa mise en place, et ses sommets mis en place (les pieds en 0, à l'origine). */
export interface HabitantModel {
  fit: HabitantFit;
  /** Trois nombres par sommet, dans le repère de la scénette, les pieds de l'habitant à l'origine. */
  positions: Float32Array;
}

/**
 * La mise en place d'un fichier (ses sommets, trois nombres chacun) : à la hauteur de l'habitant, ses pieds en 0, centré
 * sur ses jambes, le visage vers +z.
 */
export function habitantFit(positions: Float32Array): HabitantFit {
  let [y0, y1] = [Infinity, -Infinity];
  for (let i = 1; i < positions.length; i += 3) [y0, y1] = [Math.min(y0, positions[i]), Math.max(y1, positions[i])];
  if (!(y1 > y0)) throw new Error('Modèle sans hauteur');
  let [x0, x1, z0, z1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    if (positions[i + 1] > y0 + FEET_SHARE * (y1 - y0)) continue;
    [x0, x1, z0, z1] = [Math.min(x0, positions[i]), Math.max(x1, positions[i]), Math.min(z0, positions[i + 2]), Math.max(z1, positions[i + 2])];
  }
  return { center: { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2 }, scale: HABITANT_HEIGHT / (y1 - y0), yaw: (QUARTER_TURNS * Math.PI) / 2 };
}

/** Les sommets d'un fichier mis en place (un nouveau tableau). */
function fittedPositions(positions: Float32Array, fit: HabitantFit): Float32Array {
  const [c, s] = [Math.cos(fit.yaw), Math.sin(fit.yaw)];
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = (positions[i] - fit.center.x) * fit.scale;
    const z = (positions[i + 2] - fit.center.z) * fit.scale;
    out[i] = x * c + z * s;
    out[i + 1] = (positions[i + 1] - fit.center.y) * fit.scale;
    out[i + 2] = -x * s + z * c;
  }
  return out;
}

const shown = new Map<PlaceId, HabitantModel>();

/** Le modèle de l'habitant d'un lieu, s'il est montré dans sa scénette (ne pas modifier ses tableaux). */
export function loadedHabitant(place: PlaceId): HabitantModel | null {
  return shown.get(place) ?? null;
}

/**
 * Le modèle de l'habitant d'un lieu sera montré (la vue l'appelle à l'entrée de la scénette, son image prête) : le décor
 * de près se fait sans le corps du pion, et ce que l'habitant tient se règle sur le modèle.
 */
export function registerHabitant(place: PlaceId, positions: Float32Array): HabitantModel {
  const fit = habitantFit(positions);
  const model = { fit, positions: fittedPositions(positions, fit) };
  shown.set(place, model);
  return model;
}

/** Le modèle de l'habitant d'un lieu n'est plus montré : le pion revient (la vue, à l'entrée d'une scénette sans modèle prêt). */
export function forgetHabitant(place: PlaceId): void {
  shown.delete(place);
}

/** Oublie tous les modèles (les tests, la fin de la vue). */
export function forgetHabitants(): void {
  shown.clear();
}

/**
 * La main de l'habitant tournée vers Kéo (à l'ouest, −x), depuis ses pieds : le point le plus à l'ouest entre le tiers et
 * la moitié de sa hauteur, là où pendent ses mains. La corde de la cloche du Phare y part.
 */
export function habitantWestHand(model: HabitantModel): { x: number; y: number; z: number } {
  const p = model.positions;
  let best = -1;
  for (let i = 0; i < p.length; i += 3) {
    const y = p[i + 1];
    if (y < 0.33 * HABITANT_HEIGHT || y > 0.5 * HABITANT_HEIGHT) continue;
    if (best < 0 || p[i] < p[best]) best = i;
  }
  if (best < 0) return { x: 0, y: 0.45 * HABITANT_HEIGHT, z: 0 };
  return { x: p[best], y: p[best + 1], z: p[best + 2] };
}

/** Le point le plus à l'est (+x) du modèle entre deux hauteurs (en part de sa hauteur) : là où un objet tenu se pose contre lui. */
export function habitantEastSide(model: HabitantModel, from: number, to: number): number {
  const p = model.positions;
  let east = 0;
  for (let i = 0; i < p.length; i += 3) {
    const y = p[i + 1];
    if (y >= from * HABITANT_HEIGHT && y <= to * HABITANT_HEIGHT) east = Math.max(east, p[i]);
  }
  return east;
}

/** La boîte du modèle depuis ses pieds : ses demi-largeurs en x (vers Kéo et à l'opposé) et en z. */
export function habitantBox(model: HabitantModel): { west: number; east: number; back: number; front: number } {
  const p = model.positions;
  const box = { west: 0, east: 0, back: 0, front: 0 };
  for (let i = 0; i < p.length; i += 3) {
    box.west = Math.max(box.west, -p[i]);
    box.east = Math.max(box.east, p[i]);
    box.back = Math.max(box.back, -p[i + 2]);
    box.front = Math.max(box.front, p[i + 2]);
  }
  return box;
}

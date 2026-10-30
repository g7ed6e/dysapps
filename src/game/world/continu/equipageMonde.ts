// L'équipage dans le monde ouvert du 6e (GD-27, lot 5, piste B « ils restent là où ils ont aidé », choisie par le
// directeur artistique avec le référent dys, 30 octobre 2026 ; GD-23, lot 4) : après avoir guidé une scénette, Zia ou
// Malo se tient près de l'habitant du PREMIER lieu rallumé qu'il a guidé (l'ordre du journal des parties posées,
// `world.log` ; un repère entièrement fixe, qui ne part jamais), un demi-pas en retrait, à la gauche de l'habitant (le
// côté opposé à son outil), à sa taille d'ado. Il y fait son geste à son tour avec l'habitant (./gestes.ts, `gesteSlot`),
// et dit une ligne fixe au toucher (docs/contenu/monde-ouvert.md, « L’équipage »). Code pur : où il se tient, sa ligne,
// son coût ; ce qui le dessine est dans la vue (../../three/archipeo/worldEquipageModels.ts).
import type { BodyFrame } from './corps';
import { EQUIPIER_HEIGHT, guideOf, type Equipier } from './equipage';
import { habitantFit } from './habitants';
import type { PlaceId } from './levelPlan';
import PHRASES from './mondeOuvert.json';
import type { PlaceId as PlaceId6e } from './plan6e';
import { groundUnderFeet, hasWorldHabitant, worldHabitantAt, worldHabitantHeight, worldHabitantScale, worldHabitantYaw } from './worldHabitants';

/** Les équipiers qui ont un modèle dans le monde ouvert (GD-23, lot 1 : Zia et Malo). */
export const EQUIPIERS: readonly Equipier[] = ['zia', 'malo'];

/** Le rôle de chaque équipier, en tête de sa ligne (GD-23 ; jamais son prénom dans une phrase lue). */
export const EQUIPIER_ROLE: Readonly<Record<Equipier, string>> = { zia: 'La mécanicienne', malo: 'L’archiviste' };

/** Le fichier de la version de loin d'un équipier, dans son dossier (docs/univers/archipeo/personnages/modeles/6e-equipage-<nom>/). */
export const EQUIPIER_FAR_FILE = 'equipier-loin.glb';
/** Les triangles de la version de loin, au plus (la chaîne des habitants, `habitant_loin.py`, à 1 500 ; un test les relit). */
export const EQUIPIER_FAR_TRIANGLES = 1500;

/**
 * Où l'équipier se tient par rapport à l'habitant, en part de la hauteur de l'habitant : à sa gauche (le côté opposé à
 * son outil, référent dys), un demi-pas en retrait pour n'être jamais devant lui (directeur artistique).
 */
export const EQUIPIER_OFFSET = { left: 0.52, back: 0.11 } as const;
/**
 * La place propre à un lieu, en part de la hauteur de l'habitant, quand sa gauche est prise (vérifié en captures, à
 * l'arrivée et de près) : `side`, vers sa droite si positif (au-delà de son outil), `back`, le retrait. Aux Quais, le
 * hangar cachait l'équipier à gauche, et devant il paraissait devant l'habitant (retrait d'un quart de pas) ; aux
 * Écluses, le mur du sas le prenait (directeur artistique, référent dys, consultant d'Archipéo, 30 octobre 2026).
 */
export const EQUIPIER_SPOT_OF: Readonly<Partial<Record<PlaceId6e, { side: number; back: number }>>> = {
  quais: { side: 0.8, back: 0.25 },
  ecluses: { side: 0.5, back: 0.4 },
};

/** Un équipier à un lieu du monde. */
export interface EquipierInWorld {
  equipier: Equipier;
  place: PlaceId6e;
}

/** Le lieu de chaque équipier, ou aucun (il n'a encore guidé aucun lieu rallumé). */
export type EquipierPlaces = Readonly<Partial<Record<Equipier, PlaceId6e>>>;

/** Le rang, dans le journal, de la partie qui a rallumé le lieu (la dernière de ses parties posée) ; −1 si le journal ne l'a plus (plus ancienne que ses cent lignes). */
function litAt(parts: readonly string[], log: readonly { part: string }[]): number {
  const mine = new Set(parts);
  let at = -1;
  for (const [i, e] of log.entries()) if (mine.has(e.part)) at = i;
  return at;
}

/**
 * Le lieu de chaque équipier : celui retenu dans la sauvegarde (`kept`, world/equipageSaved.ts) s'il est rallumé ; sinon,
 * parmi les lieux rallumés (`relit`) qu'il guide, le premier rallumé selon le journal
 * (`world.log`, dans l'ordre des poses ; `partsOf`, les parties de la construction d'un lieu, que la page connaît) ; un
 * lieu dont le journal a perdu la trace passe pour le plus ancien ; à égalité, l'ordre de `relit` (celui du niveau).
 * Calculé depuis la sauvegarde à chaque lecture : l'équipier ne bouge que si un lieu plus ancien reparaît, ce qui
 * n'arrive qu'au chargement, jamais sous les yeux de l'élève.
 */
export function equipierPlaces(relit: readonly PlaceId[], log: readonly { part: string }[], partsOf: (place: PlaceId) => readonly string[], kept: Readonly<Partial<Record<Equipier, string>>> = {}): EquipierPlaces {
  const out: Partial<Record<Equipier, PlaceId6e>> = {};
  const best: Partial<Record<Equipier, number>> = {};
  for (const place of relit) {
    const e = guideOf(place);
    if (!e || !hasWorldHabitant(place)) continue;
    // Le lieu retenu dans la sauvegarde (`world.equipage`), s'il est encore rallumé, l'emporte : un repère fixe, même
    // quand le journal a perdu les lignes qui le départageaient.
    if (kept[e] === place) {
      out[e] = place as PlaceId6e;
      best[e] = -Infinity;
      continue;
    }
    const at = litAt(partsOf(place), log);
    const b = best[e];
    if (b === undefined || at < b) {
      out[e] = place as PlaceId6e;
      best[e] = at;
    }
  }
  return out;
}

/** Les équipiers à leur lieu, dans l'ordre de `EQUIPIERS`, sans ceux qui n'en ont pas. */
export const equipageInWorld = (places: EquipierPlaces): EquipierInWorld[] => EQUIPIERS.flatMap((e) => {
  const place = places[e];
  return place ? [{ equipier: e, place }] : [];
});

/** La hauteur d'un équipier dans le monde, à sa place près de l'habitant d'un lieu : sa taille d'ado, à l'échelle du monde. */
export const equipierWorldHeight = (place: PlaceId): number => EQUIPIER_HEIGHT * worldHabitantScale(place as never);

/**
 * Le repère d'un équipier près de l'habitant de `place` : ses pieds à la gauche de l'habitant (ou à la place propre au
 * lieu, `EQUIPIER_SPOT_OF`), un peu en retrait, au sol ;
 * son cap, celui de l'habitant (vers qui arrive) ; sa hauteur, celle d'un ado. Ou rien (le lieu n'a pas d'habitant).
 */
export function equipierFrame(place: PlaceId, ground: (x: number, z: number) => number): BodyFrame | null {
  const at = worldHabitantAt(place, ground);
  if (!at || !hasWorldHabitant(place)) return null;
  const yaw = worldHabitantYaw(place);
  const h = worldHabitantHeight(place);
  // Devant (vers qui arrive) et la droite de l'habitant (le côté de son outil) : la gauche en est l'opposé.
  const f = { x: Math.sin(yaw), z: Math.cos(yaw) };
  const r = { x: -Math.cos(yaw), z: Math.sin(yaw) };
  const spot = EQUIPIER_SPOT_OF[place as PlaceId6e] ?? { side: -EQUIPIER_OFFSET.left, back: EQUIPIER_OFFSET.back };
  const x = at.x + r.x * spot.side * h - f.x * spot.back * h;
  const z = at.z + r.z * spot.side * h - f.z * spot.back * h;
  // Au sol, au plus haut du pas (sur une pente, le sol à facettes coupait ses cuisses aux Écluses : directeur artistique,
  // troisième passe), jamais plus bas que l'habitant (sur un quai ou un seuil, le sol dessiné à côté peut être l'eau).
  return { at: { x, y: Math.max(groundUnderFeet(x, z, ground), at.y), z }, yaw, height: equipierWorldHeight(place) };
}

/**
 * Les sommets de la version de loin d'un équipier (ceux de son fichier, trois nombres chacun) mis dans son repère : ses
 * pieds en `frame.at`, à `frame.height`, tourné de `frame.yaw` (le visage vers +z au cap nul). Un nouveau tableau.
 */
export function placeEquipier(positions: Float32Array, frame: BodyFrame): Float32Array {
  const fit = habitantFit(positions, frame.height);
  const yaw = frame.yaw + fit.yaw;
  const [c, s] = [Math.cos(yaw), Math.sin(yaw)];
  const out = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    const x = (positions[i] - fit.center.x) * fit.scale;
    const z = (positions[i + 2] - fit.center.z) * fit.scale;
    out[i] = frame.at.x + x * c + z * s;
    out[i + 1] = frame.at.y + (positions[i + 1] - fit.center.y) * fit.scale;
    out[i + 2] = frame.at.z - x * s + z * c;
  }
  return out;
}

/** La ligne fixe d'un équipier au toucher (docs/contenu/monde-ouvert.md, « L’équipage » ; dix mots au plus, jamais changée). */
export const equipierLine = (e: Equipier): string => (e === 'zia' ? PHRASES.equipageZia : PHRASES.equipageMalo);

/** Le poste « équipage » du budget du 6e hors scénette : les deux versions de loin, au pire toutes deux montrées, un maillage, un appel. */
export const equipageCost = (): { triangles: number; calls: number } => ({ triangles: EQUIPIERS.length * EQUIPIER_FAR_TRIANGLES, calls: 1 });

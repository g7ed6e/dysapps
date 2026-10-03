// Le modèle du monde (docs/conception/separation-jeu-rendu.md, étape J2) : ce qui existe dans un archipel et son état,
// en identifiants, sans une seule case. WorldPage le lit au lieu de décider lui-même ; une disposition (la grille
// aujourd'hui, le réseau d'Archipéo demain) dit ensuite où dessiner chaque chose. Et les décisions que prend le jeu
// quand l'élève touche le monde : jouer une borne, ouvrir l'île d'un ouvrage, aller vers une île, voyager.
import { BIOMES, missionsJouables, type BiomeId } from '../biomes';
import { guardianStatus } from '../boss';
import type { GameState } from '../engine';
import { canLaunch, levelFor, nextFillable } from '../engine';
import { pickExercise, questProgress } from '../exercises';
import {
  BRIDGES,
  archipelagoOf,
  buildBridge,
  getArchipelago,
  getBridge,
  isBiomeUnlocked,
  islandsOf,
  launchedCount,
  type ArchipelagoId,
  type MotsDesGardiens,
  type NomsArchipels,
} from './archipelago';
import { nextDestination, type Destination } from './destination';
import { islandState, type IslandStateDef } from './islandState';
import { monumentsOf } from './monuments';
import { stageBuildingAt, stageTo } from './vehicle';
import type { VoyageLeg } from './voyage';

/** Une île de l'archipel. */
export interface IleDuModele {
  id: BiomeId;
  nom: string;
  ouverte: boolean;
  /** Fermée, À explorer, En chantier, Restaurée (Bâtie dans Blocland) : le mot vient de textes.etatsDIle. */
  etat: IslandStateDef;
}

/** Une borne de mission : à faire (`'new'`), les étoiles gagnées, ou fermée (`'locked'`). */
export interface BorneDuModele {
  /** « île:mission ». */
  id: string;
  ile: BiomeId;
  mission: string;
  etat: 'new' | 'locked' | number;
}

export interface ModeleDuMonde {
  archipel: ArchipelagoId;
  iles: IleDuModele[];
  bornes: BorneDuModele[];
  /** La prochaine destination (celle de « Reprendre l'aventure »). */
  destination: Destination;
}

/** Les missions d'une île, dans l'ordre de ses bornes. */
export function missionsDe(ile: BiomeId): string[] {
  const biome = BIOMES.find((b) => b.id === ile);
  return biome ? missionsJouables(biome).map((x) => x.id) : [];
}

/** L'état d'une borne : fermée si son île l'est ou s'il n'y a rien à jouer, sinon à faire ou ses étoiles. */
export function etatDeBorne(state: GameState, ile: BiomeId, mission: string): BorneDuModele['etat'] {
  if (!isBiomeUnlocked(ile, state.world.links)) return 'locked';
  const def = pickExercise(ile, mission, levelFor(state, mission), state.progress);
  if (!def) return 'locked';
  const progress = questProgress(ile, mission, state.progress);
  return progress ? progress.stars : 'new';
}

/** Les îles d'un archipel, ouvertes ou non, et leur état (il ne dépend que de la progression et du village). */
export function ilesDuModele(state: Pick<GameState, 'progress' | 'world'>, a: ArchipelagoId): IleDuModele[] {
  return islandsOf(a).map((b) => ({ id: b.id, nom: b.name, ouverte: isBiomeUnlocked(b.id, state.world.links), etat: islandState(state, b.id) }));
}

/**
 * Tout ce qui existe dans un archipel, et son état ; `noms` et `mots` : les noms des archipels et les mots des Gardiens
 * de l'univers affiché (la destination).
 */
export function modeleDuMonde(state: GameState, a: ArchipelagoId, noms: NomsArchipels, mots: MotsDesGardiens): ModeleDuMonde {
  const iles = islandsOf(a);
  return {
    archipel: a,
    iles: ilesDuModele(state, a),
    bornes: iles.flatMap((b) => missionsDe(b.id).map((mission) => ({ id: `${b.id}:${mission}`, ile: b.id, mission, etat: etatDeBorne(state, b.id, mission) }))),
    destination: nextDestination(state, noms, mots),
  };
}

/**
 * L'état des objets du monde qui portent un signe (affordance-blocland.md §8), au-delà des bornes : ce que la vue ne
 * peut pas déduire des cubes. Un objet absent de ces listes porte le cube de pierre (« pas encore »).
 */
export interface EtatsDesObjets {
  /** Les Gardiens dont le défi est prêt (le losange d'or) ; un Gardien pas encore vaincu, hors de cette liste : la pierre. */
  gardiensPrets: BiomeId[];
  /** Le Bloc-Navire attend l'élève : un bloc qu'il a en poche à poser sur l'étape en chantier, ou le départ possible. */
  navirePret: boolean;
  /**
   * Les chantiers en fantôme dont l'élève a les blocs : les ouvrages qu'il peut construire tout de suite, et les
   * monuments où il peut poser au moins un bloc (identifiants des ouvrages et des monuments).
   */
  chantiersPrets: string[];
}

/** L'état des objets du monde qui portent un signe, dans l'archipel `a` (lu de la sauvegarde, rien n'y est ajouté). */
export function etatsDesObjets(state: GameState, a: ArchipelagoId): EtatsDesObjets {
  const iles = islandsOf(a);
  const ici = new Set(iles.map((b) => b.id));
  const links = state.world.links;
  const etape = stageBuildingAt(getArchipelago(a).port, links);
  const monde = { progress: state.progress, plans: state.world.parts };
  return {
    gardiensPrets: iles.filter((b) => guardianStatus(b, state.progress, links) === 'ready').map((b) => b.id),
    navirePret: Boolean(etape && (nextFillable(state, etape) || canLaunch(state, etape).ok)),
    chantiersPrets: [
      ...BRIDGES.filter((b) => ici.has(b.from) && buildBridge(b.id, links, state.stock, monde).ok).map((b) => b.id),
      ...monumentsOf(a)
        .filter((m) => nextFillable(state, m))
        .map((m) => m.id),
    ],
  };
}

// ---- Les décisions

/** Une borne touchée : jouer sa mission si elle est jouable, sinon ouvrir son île (qui explique pourquoi). */
export function borneTouchee(bornes: BorneDuModele[], ile: BiomeId, mission: string): 'jouer' | 'ile' {
  const b = bornes.find((m) => m.ile === ile && m.mission === mission);
  return b && b.etat !== 'locked' ? 'jouer' : 'ile';
}

/** Un ouvrage touché : l'île ouverte qu'il touche (celle de départ si aucune ne l'est), `null` s'il n'existe pas. */
export function ileDeLOuvrage(id: string, bridges: string[]): BiomeId | null {
  const def = getBridge(id);
  if (!def) return null;
  if (isBiomeUnlocked(def.from, bridges)) return def.from;
  if (isBiomeUnlocked(def.to, bridges)) return def.to;
  return def.from;
}

/**
 * Où va le jeu quand on demande une île, depuis l'archipel `a` : une île fermée d'un autre archipel, on cadre le port
 * (le chantier du navire) ; une île ouverte d'un autre archipel, on y voyage ; sinon on reste dans l'archipel.
 */
export function capVers(ile: BiomeId, a: ArchipelagoId, bridges: string[]): 'port' | 'voyage' | 'archipel' {
  if (archipelagoOf(ile).classe === a) return 'archipel';
  return isBiomeUnlocked(ile, bridges) ? 'voyage' : 'port';
}

// ---- Le voyage du Bloc-Navire

/**
 * Le voyage en cours : vers quel archipel, depuis lequel, retour ou premier voyage, écran fixe (`panel`, avec « Réduire
 * les animations ») ou cinématique, le temps (départ ou arrivée), l'étape du navire, l'île demandée, et s'il marche
 * d'abord jusqu'au port (`approach`). `seq` change à chaque temps.
 */
export interface Voyage {
  to: ArchipelagoId;
  from: ArchipelagoId;
  back: boolean;
  mode: 'panel' | 'cinema';
  leg: VoyageLeg;
  seq: number;
  stage: 1 | 2 | 3;
  dest: BiomeId;
  approach: boolean;
}

/** L'étape du navire qui voyage : celle qui mène là-bas ; pour un retour, la plus grande déjà partie. */
export function etapeDuVoyage(to: ArchipelagoId, back: boolean, bridges: string[]): 1 | 2 | 3 {
  return (back ? Math.max(1, launchedCount(bridges)) : (stageTo(to)?.stage ?? 1)) as 1 | 2 | 3;
}

/** Un voyage qui commence : l'écran fixe, ou la cinématique (en marchant d'abord jusqu'au port s'il le faut). */
export function nouveauVoyage(
  p: { to: ArchipelagoId; from: ArchipelagoId; back: boolean; dest: BiomeId; bridges: string[]; reduceMotion: boolean; approach: boolean },
  avant: Voyage | null,
): Voyage {
  const trip = { to: p.to, from: p.from, back: p.back, dest: p.dest, stage: etapeDuVoyage(p.to, p.back, p.bridges), leg: 'depart' as const };
  if (p.reduceMotion) return { ...trip, mode: 'panel', seq: 0, approach: false };
  return { ...trip, mode: 'cinema', seq: p.approach ? (avant?.seq ?? 0) : (avant?.seq ?? 0) + 1, approach: p.approach };
}

/** Le bonhomme est arrivé au port : il embarque, le départ commence. */
export function embarquer(v: Voyage | null): Voyage | null {
  return v && v.approach ? { ...v, approach: false, seq: v.seq + 1 } : v;
}

/** Sous le voile, l'archipel a changé : l'arrivée commence. */
export function versLArrivee(v: Voyage | null): Voyage | null {
  return v ? { ...v, leg: 'arrivee', seq: v.seq + 1 } : v;
}

/**
 * Ce qu'il faut faire à la fin d'un temps de la cinématique (ou sur un toucher, une touche) : embarquer tout de suite
 * s'il marche encore vers le port, changer d'archipel après le départ, arriver après l'arrivée ; rien hors cinématique.
 */
export function finDuTemps(v: Voyage | null): 'embarquer' | 'changer-d-archipel' | 'arriver' | null {
  if (!v || v.mode !== 'cinema') return null;
  if (v.approach) return 'embarquer';
  return v.leg === 'depart' ? 'changer-d-archipel' : 'arriver';
}

/** Ce que la vue du monde joue du voyage : la cinématique, une fois le bonhomme au port ; rien sinon. */
export function voyageAJouer(v: Voyage | null): { seq: number; leg: VoyageLeg; stage: 1 | 2 | 3; back: boolean } | null {
  return v?.mode === 'cinema' && !v.approach ? { seq: v.seq, leg: v.leg, stage: v.stage, back: v.back } : null;
}

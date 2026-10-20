// Ce qu'un lieu du rivage nord (GD-20, point 8, lot L7) ou du large (lot L9) apporte au monde continu : son modèle (la
// ruine et ses trois étapes), sa scénette (le sol, l'habitant, le cadre), l'objet qui porte ses réponses, son décor de C
// et son témoin, ses traces. Chaque lieu le tient dans son fichier (lookout.ts, archives.ts, printworks.ts, beacons.ts,
// ferry.ts) ; places.ts, scenette.ts et questionScene.ts le lisent ici, au lieu d'en ajouter le dessin chez eux. Types
// seulement.
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { Reaction } from './questionScene';

/** Un volume du lieu : la ruine, ou l'étape et la rangée où il se pose, et la rangée qui l'enlève (`until`). */
export type AddPiece = (stage: Stage | 'ruine', row: number, draw: (b: FacetBuilder) => void, until?: { stage: Stage; row: number }) => void;

/** Le sol sous un point du lieu (dans son repère), depuis le sol de son centre ; le niveau de l'eau. */
export interface SiteGround {
  at(lx: number, lz: number): number;
  /** Le plus haut et le plus bas du sol sous un volume de rayon `r`. */
  foot(lx: number, lz: number, r: number): { top: number; low: number };
  water: number;
}

/** Une sphère en facettes (une tête), comme les habitants des autres lieux (scenette.ts). */
export type Sphere = (b: FacetBuilder, c: Vec3, r: number, sides: number, rings: number, color: number) => void;

/** L'objet qui porte une réponse : sa taille à l'échelle 1, ce qui est dessous la rangée, et l'objet lui-même. */
interface AnswerArt {
  size: { height: number; half: number };
  /** Sous la rangée, de `mid - span / 2` à `mid + span / 2`, son dessus en `y`, posé sur le sol (`ground`). */
  base(b: FacetBuilder, mid: number, y: number, z: number, span: number, s: number, ground: number): void;
  /**
   * L'objet de la réponse `i` sur `count`, au sol en `at`, à l'échelle `s` ; `picked` : une réponse tentée (sa forme le
   * dit, jamais sa couleur seule) ; `marked` : l'objet marqué que la réaction complète (`replaces`), sans ce qu'elle
   * apporte (la malle sans son couvercle, qui se rabat).
   */
  object(b: FacetBuilder, at: Vec3, s: number, i: number, count: number, picked: boolean, marked?: boolean): void;
  /**
   * En R, après une bonne réponse seulement (la scène `restMark`, lot L9) : ce que reçoit l'objet de la bonne réponse,
   * posé en `at`, à l'échelle `s` (le voyant qui monte sur la bouée), et qui reste jusqu'à l'item suivant.
   */
  mark?(at: Vec3, s: number): Reaction;
  /** L'objet marqué perd ce que la réaction lui apporte (`marked`) : le couvercle de la malle, qui se rabat. */
  replaces?: true;
}

/**
 * Une trace : sa place depuis le centre du lieu, la hauteur que la caméra garde au retour, son dessin ; `stage` : l'étape
 * qui la porte, si elle n'est pas celle du lieu (`PlaceArt.traceStage`) : au Hameau (GD-22, lot 5), chaque trace se montre
 * avec l'étape de sa mission.
 */
interface TraceArt {
  at: Vec2;
  lift: number;
  stage?: Stage;
  /** Dessinée dans le monde, `c` : le centre du lieu à son sol. */
  draw(b: FacetBuilder, c: Vec3): void;
}

export interface PlaceArt {
  /** Le rôle de l'habitant, en tête du panneau (sans prénom). */
  role: string;
  /** Le lieu, dans son repère (le centre au sol en 0, le nord vers −z) ; `door` : sa porte, depuis le centre. */
  model(add: AddPiece, ground: SiteGround, door: Vec2): void;
  /** L'étape qui porte les traces (celles qui n'ont pas la leur, `TraceArt.stage`), et sur laquelle se joue la scénette. */
  traceStage: Stage;
  /** La place de la scène depuis le centre du lieu, sa demi-largeur et sa demi-profondeur ; `fine` : un sol fin. */
  sceneSpot: { dx: number; dz: number; half: [number, number]; fine?: true };
  /**
   * La scénette : le sol de Kéo et de l'habitant au-dessus de la scène (`rise`), leurs places, ce que la caméra cadre,
   * son angle sous l'horizon (comme les autres lieux, scenette.ts).
   */
  site: {
    rise: number;
    keo: { dx: number; dz: number; scale: number; yaw: number };
    habitant: { dx: number; dz: number };
    subject: { halfWidth: number; bottom: number; top: number; depth: number };
    pitch: number;
    /** Le cap de départ de la caméra, autour du point visé (scenette.ts, `ScenetteSite.start`) ; absent : de face. */
    start?: number;
  };
  /**
   * Le décor de près : le sol de la scène (`floor`) et l'habitant, ses pieds en `at` ; sans `body`, le sol seul (son
   * modèle 3D prend sa place, ./habitants.ts, et ce que le pion tient à la main part avec lui).
   */
  decor(b: FacetBuilder, floor: Vec3, at: Vec3, sphere: Sphere, body?: boolean): void;
  /** L'objet qui porte les réponses (les missions en R), ou rien (toutes en C). */
  answer: AnswerArt | null;
  /** Le décor des missions en R, au repos (rien de l'item ne s'y montre), posé sur la scène en `o`. */
  rest?(b: FacetBuilder, o: Vec3): void;
  /** Le décor des missions en C et son objet témoin : `done`, une bonne réponse vient d'être donnée. */
  column?(b: FacetBuilder, o: Vec3, done: boolean): Reaction | null;
  /** Une trace par mission. */
  traces: Readonly<Record<string, TraceArt>>;
  /** Où Kéo se tient au retour, depuis le centre du lieu. */
  exit: Vec2;
  /** Le lieu s'efface le temps de sa scénette (la station des Balises serait entre la caméra et la cale, lot L9a). */
  hideInScenette?: true;
}

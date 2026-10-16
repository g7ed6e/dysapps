// Ce qu'un lieu du rivage nord apporte au monde continu (GD-20, point 8, lot L7) : son modèle (la ruine et ses trois
// étapes), sa scénette (le sol, l'habitant, le cadre), l'objet qui porte ses réponses, son décor de C et son témoin, ses
// traces. Chaque lieu le tient dans son fichier (lookout.ts, archives.ts, printworks.ts) ; places.ts, scenette.ts et
// questionScene.ts le lisent ici, au lieu d'en ajouter le dessin chez eux. Types seulement.
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
   * dit, jamais sa couleur seule).
   */
  object(b: FacetBuilder, at: Vec3, s: number, i: number, count: number, picked: boolean): void;
}

/** Une trace : sa place depuis le centre du lieu, la hauteur que la caméra garde au retour, son dessin. */
interface TraceArt {
  at: Vec2;
  lift: number;
  /** Dessinée dans le monde, `c` : le centre du lieu à son sol. */
  draw(b: FacetBuilder, c: Vec3): void;
}

export interface PlaceArt {
  /** Le rôle de l'habitant, en tête du panneau (sans prénom). */
  role: string;
  /** Le lieu, dans son repère (le centre au sol en 0, le nord vers −z) ; `door` : sa porte, depuis le centre. */
  model(add: AddPiece, ground: SiteGround, door: Vec2): void;
  /** L'étape qui porte les traces. */
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
  };
  /** Le décor de près : le sol de la scène (`floor`) et l'habitant, ses pieds en `at`. */
  decor(b: FacetBuilder, floor: Vec3, at: Vec3, sphere: Sphere): void;
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
}

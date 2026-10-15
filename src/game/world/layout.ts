// Les types de la séparation du jeu et du rendu (docs/conception/separation-jeu-rendu.md, étape J0). La disposition en
// grille (./grid.ts, étape J3) les réalise. Le jeu parle d'entités (une île, une borne, un ouvrage…) ; une disposition dit où elles sont : en grille
// (le monde en cases d'aujourd'hui, pour la 3D) ou en réseau (Archipéo : les îles sont des lieux, reliés par
// des liaisons). Une vue reçoit des entités et une disposition, et renvoie des intentions.
import type { BiomeId } from '../biomes';

/** Un point, en cases. */
export interface Point {
  x: number;
  y: number;
  z: number;
}

/** Ce qui existe dans un archipel, désigné par son identifiant (jamais par une case du monde). */
export type Entite =
  | { genre: 'ile'; id: BiomeId }
  /** Une borne de mission : « île:mission ». */
  | { genre: 'borne'; id: string }
  /** Un lieu du village (l'école, la salle des trophées) sur son île. */
  | { genre: 'lieu'; id: string; ile: BiomeId }
  /** Un ouvrage (pont, bac, escalier…) ou un voyage de la Nef. */
  | { genre: 'ouvrage'; id: string }
  /** Un plan : un bâtiment d'île, une étape du navire ou un monument. */
  | { genre: 'plan'; id: string }
  | { genre: 'navire'; port: BiomeId }
  | { genre: 'creature'; id: BiomeId }
  | { genre: 'gardien'; id: BiomeId }
  | { genre: 'bonhomme' };

/** Une place dans le monde : une île, et un point dans le repère de cette île. */
export interface Ancrage {
  ile: BiomeId;
  local: Point;
}

/** Un trajet du bonhomme : ses étapes et sa durée (ms). */
export interface Trajet {
  etapes: Ancrage[];
  duree: number;
}

/** Une étendue du monde, en cases (bornes hautes exclues). */
export interface Etendue {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Où sont les entités : la grille d'aujourd'hui, ou le réseau d'Archipéo. Jamais ce qu'elles valent. */
export interface Disposition {
  genre: 'grille' | 'reseau';
  /** La place d'une entité, ou `null` si elle n'est pas dans cet archipel (ou pas encore placée par cette disposition). */
  placeDe(e: Entite): Ancrage | null;
  /** Où le bonhomme se tient sur une île. */
  seTenir(ile: BiomeId): Ancrage;
  /** Le point du monde où dessiner un ancrage (une matrice par île, calculée une fois). */
  versMonde(a: Ancrage): Point;
  /** Le trajet du bonhomme d'une entité à une autre, ou `null` s'il n'y a pas de chemin ouvert. */
  trajet(depuis: Entite, vers: Entite): Trajet | null;
  /** La forme d'un ouvrage entre deux îles, dans le monde. */
  liaison(ouvrage: string): Point[];
  /** Ce que la caméra cadre autour d'une île. */
  cadrage(ile: BiomeId): Etendue;
  /** Tout l'archipel (la Carte). */
  etendue(): Etendue;
  /** L'île sous un point du monde (le toucher), ou `null`. */
  ileEn(p: Point): BiomeId | null;
}

/** Ce qu'une vue renvoie : un geste traduit en intention ; le jeu décide. */
/**
 * Ce dont parle une fiche (lot 2 de « Toucher le monde ») : une borne (« île:mission »), un Gardien, la Nef, un
 * ouvrage, une créature, une île pâle. La vue fait sauter son signe à l'ouverture et garde l'objet hors de la fiche.
 */
export type ObjetDeLaFiche =
  | { genre: 'borne'; id: string }
  | { genre: 'gardien'; id: BiomeId }
  | { genre: 'navire'; port: BiomeId }
  | { genre: 'ouvrage'; id: string }
  | { genre: 'creature'; id: BiomeId }
  | { genre: 'ile'; id: BiomeId };

export type Intention =
  /**
   * Une île touchée (ou choisie au clavier). Touchée sur le sol : `sol`, la case touchée (le bonhomme y va) ; s'il était
   * en route, `enRoute`, là où il en est (le nouveau trajet part de là).
   */
  | { genre: 'ile'; id: BiomeId; sol?: Ancrage; enRoute?: Ancrage }
  | { genre: 'borne'; ile: BiomeId; mission: string }
  /** Un lieu du village (l'école, la salle des trophées) ou un monument (« monument:<id> »). */
  | { genre: 'lieu'; id: string; ile: BiomeId }
  /** Un ouvrage ; dans le mode « Aménager », touché en `point` (en cases du monde) : le bout le plus proche se choisit. */
  | { genre: 'ouvrage'; id: string; point?: { x: number; y: number } }
  /** Dans le mode « Aménager » (GD-9), la mer touchée en `point`, en cases du monde : elle relâche le choix. */
  | { genre: 'mer'; point: { x: number; y: number } }
  | { genre: 'creature'; id: BiomeId; gardien: boolean }
  | { genre: 'navire'; port: BiomeId }
  /**
   * En chantier, une face touchée sur l'île `ile` (ou sur le navire amarré à son port) : le bloc touché et la case
   * voisine, devant la face, en cases du plan de l'île (celles de la sauvegarde). Sur le terrain, `sol` : le bloc touché,
   * dans le repère de l'île (s'il n'est pas une case d'un plan, le bonhomme y va, comme pour `ile`), et `enRoute`.
   */
  | { genre: 'face'; ile: BiomeId; case: Point; voisine: Point; sol?: Ancrage; enRoute?: Ancrage }
  | { genre: 'fin-du-voyage' }
  | { genre: 'voyage-saute' }
  /** Un toucher dans le vide pendant un trajet : le bonhomme est arrivé tout de suite (la page ouvre le panneau qui l'attendait). */
  | { genre: 'arrivee' };

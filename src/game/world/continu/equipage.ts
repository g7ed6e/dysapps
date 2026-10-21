// L'équipage dans les scénettes (GD-23, « Le monde habité », lot 1, choix du mainteneur du 21 octobre 2026 : Zia et Malo,
// douze scénettes) : l'équipier qui guide un lieu se tient à côté de Kéo dans sa scénette, immobile comme l'habitant, sans
// réplique ni geste. Le partage des lieux suit les matières de la fiche du 6e (§ 6) : Zia, la mécanicienne, les maths, la
// technologie et la physique-chimie ; Malo, l'archiviste, le français et l'anglais (jusqu'à l'arrivée de la radio) ; Kéo
// reste seul aux Ruines, à l'Observatoire, à la Mangrove et à la Halle. Un modèle texturé par équipier, tiré de son modèle
// à squelette (sa pose de repos), rangé dans docs/univers/archipeo/personnages/modeles/6e-equipage-<nom>/equipier.glb.
// Code pur, sans DOM ni Three.js : qui guide quel lieu, son fichier, sa taille. Sa place dans la scénette est dans
// ./scenette.ts (`scenetteGuide`) ; ce qui charge le fichier et le dessine, dans la vue
// (../../importedCharacters.ts, `loadEquipier` ; ../../three/archipeo/equipierModels.ts).
import type { PlaceId } from './levelPlan';
import type { PlaceId as PlaceId6e } from './plan6e';

/** Les équipiers qui guident un lieu au 6e. */
export type Equipier = 'zia' | 'malo';

/** Le guide de chaque lieu du 6e qui en a un (fiche du 6e, § 6). */
const GUIDES: Readonly<Partial<Record<PlaceId6e, Equipier>>> = {
  // Zia : les maths (les Quais, les Écluses, la Saline), la physique-chimie (la Turbine), la technologie (le Chantier naval).
  quais: 'zia',
  ecluses: 'zia',
  saltworks: 'zia',
  engine: 'zia',
  shipyard: 'zia',
  // Malo : le français (le Phare, l'Imprimerie, les Archives, les Filets, la Vigie), l'anglais (les Balises, la Gare maritime).
  phare: 'malo',
  printworks: 'malo',
  archives: 'malo',
  filets: 'malo',
  lookout: 'malo',
  beacons: 'malo',
  ferry: 'malo',
};

/** L'équipier qui guide ce lieu, ou `null` (Kéo seul, et tous les lieux du 5e pour l'instant). */
export const guideOf = (place: PlaceId): Equipier | null => (Object.hasOwn(GUIDES, place) ? (GUIDES[place as PlaceId6e] ?? null) : null);

/** Le dossier du modèle d'un équipier (docs/univers/archipeo/personnages/modeles/<nom>/), dans sa tenue du 6e. */
export const equipierModelName = (e: Equipier): string => `6e-equipage-${e}`;

/** Le fichier du modèle, dans son dossier. */
export const EQUIPIER_FILE = 'equipier.glb';

/**
 * La hauteur d'un équipier dans la scénette : celle de Kéo, du même âge (deux blocs à l'échelle de Kéo dans la scénette,
 * 0,6 ; un test le vérifie dans chaque scénette guidée).
 */
export const EQUIPIER_HEIGHT = 1.2;

/**
 * Les triangles d'un modèle d'équipier, au plus : Zia 11 279, Malo 9 336 (leurs modèles à squelette, tels quels). Le
 * budget les compte dans la scénette ; un test les relit dans les fichiers.
 */
export const EQUIPIER_TRIANGLES = 11_300;

/**
 * La demi-largeur et la demi-profondeur de chaque modèle à sa hauteur de scénette, depuis ses pieds, au centième près
 * (les bras un peu écartés ; la clé au dos de Zia, la sacoche de Malo) : sa boîte dans les tests de chevauchement. Un
 * test les relit dans les fichiers.
 */
export const EQUIPIER_HALVES: Readonly<Record<Equipier, { x: number; z: number }>> = {
  zia: { x: 0.3, z: 0.2 },
  malo: { x: 0.32, z: 0.14 },
};

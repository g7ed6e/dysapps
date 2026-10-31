// La parole du lieu et la raison du lieu (GD-27, lot 2) : ce que l'habitant d'un lieu dit quand on le touche hors de sa
// scénette (une ligne de dix mots au plus, écrite dans la bulle et lue, qui tourne à chaque toucher entre son métier, son
// lieu et l'état du lieu), et le cadre et la suite de chaque mission jouée dans la scénette (le cadre à l'entrée, avant la
// première bulle ; la suite au bilan, après le résultat et la partie posée). Tout s'écrit dans docs/contenu/<île>.md,
// sous « ## Au lieu · Archipéo » (« ### L’habitant », « ### Les missions »), que `npm run contenu` range dans
// ./paroles.json (lecteur : scripts/contenu/aulieu.mjs, qui vérifie les dix mots, le point final, les mots interdits et
// les verbes figurés). Code pur : la rotation est tenue par la page, qui ne la sauvegarde jamais.
import PAROLES from './paroles.json';
import { placeById, type PlaceId } from './levelPlan';

/** L'état du lieu, pour la ligne d'état : en ruine, en chantier (une partie posée au moins), rallumé. */
export type PlaceMood = 'ruine' | 'chantier' | 'rallume';

/** Les lignes d'un habitant, par registre (deux à quatre chacune). */
interface HabitantLines {
  readonly metier: readonly string[];
  readonly lieu: readonly string[];
  readonly ruine: readonly string[];
  readonly chantier: readonly string[];
  readonly rallume: readonly string[];
}

/** Le cadre et la suite d'une mission. */
export interface MissionWords {
  readonly frame: string;
  readonly follow: string;
}

/**
 * L'épreuve hors des murs (GD-27, lot 6) : le niveau d'une mission joué sur place, aux abords du lieu, la phrase de
 * l'habitant avant la marche (« Va voir les animaux de la rive. ») et la consigne sur place (huit mots au plus).
 */
export interface SurPlace {
  readonly mission: string;
  readonly level: number;
  readonly go: string;
  readonly instruction: string;
}

interface Paroles {
  readonly lines?: HabitantLines;
  readonly missions?: Readonly<Record<string, MissionWords>>;
  readonly surPlace?: SurPlace;
}

const BY_ISLAND: Readonly<Record<string, Paroles>> = (PAROLES as { archipeo?: Record<string, Paroles> }).archipeo ?? {};

/** La parole écrite pour un lieu, ou rien. */
export const parolesOf = (place: PlaceId): Paroles | null => BY_ISLAND[placeById(place).island] ?? null;

/** Les îles qui ont une parole écrite (les tests vérifient qu'elles sont celles des lieux à scénette). */
export const ISLANDS_WITH_PAROLES: readonly string[] = Object.keys(BY_ISLAND);

/**
 * Les lignes qu'un habitant peut dire dans l'état `mood` de son lieu, dans l'ordre de la rotation : un registre après
 * l'autre (le métier, le lieu, l'état), pour que deux touchers de suite ne disent pas la même chose.
 */
export function habitantLines(place: PlaceId, mood: PlaceMood): readonly string[] {
  const lines = parolesOf(place)?.lines;
  if (!lines) return [];
  const registers = [lines.metier, lines.lieu, lines[mood]];
  const out: string[] = [];
  for (let i = 0; i < Math.max(...registers.map((r) => r.length)); i++) for (const r of registers) if (r[i] !== undefined) out.push(r[i]);
  return out;
}

/** La ligne du `n`-ième toucher (depuis 0) de l'habitant de `place`, son lieu dans l'état `mood` ; rien sans parole écrite. */
export function habitantLine(place: PlaceId, mood: PlaceMood, n: number): string | null {
  const lines = habitantLines(place, mood);
  return lines.length ? lines[((n % lines.length) + lines.length) % lines.length] : null;
}

/** Le cadre et la suite d'une mission de `place`, ou rien. */
export const missionWords = (place: PlaceId, mission: string): MissionWords | null => parolesOf(place)?.missions?.[mission] ?? null;

/** Ce qu'une île joue sur place, ou rien. */
export const surPlaceOfIsland = (island: string): SurPlace | null => BY_ISLAND[island]?.surPlace ?? null;

/** Ce qu'un lieu joue sur place (GD-27, lot 6), ou rien. */
export const surPlaceOf = (place: PlaceId): SurPlace | null => parolesOf(place)?.surPlace ?? null;

/** Les îles qui jouent un niveau sur place. */
export const ISLANDS_WITH_SUR_PLACE: readonly string[] = Object.keys(BY_ISLAND).filter((island) => BY_ISLAND[island].surPlace);

/** L'exercice (`<île>-<mission>-<niveau>`) qu'un lieu joue sur place : ses jumeaux ont leur scène à trois objets. */
export function playsSurPlace(place: PlaceId, exerciseId: string): boolean {
  const s = surPlaceOf(place);
  return s !== null && exerciseId === `${placeById(place).island}-${s.mission}-${s.level}`;
}

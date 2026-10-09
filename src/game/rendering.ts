// Le rendu du monde suit l'univers choisi dans Réglages › Univers (lot 6, src/core/universe.ts) : le monde en blocs pour
// Blocland, l'univers par défaut, le rendu d'Archipéo pour Archipéo. Un changement d'univers se voit au retour au village.
// Pour les fils de rendu seulement, le serveur de développement (`npm run dev`, les captures et les mesures) lit aussi
// l'adresse, avant le `#` (la navigation ne change que la route, le drapeau tient donc toute la session) :
// `?rendu=archipeo` ou `?rendu=blocs` l'emporte sur l'univers ; `?style=a|b|c`, avec le rendu d'Archipéo, peint les
// cubes d'une des trois options de style du lot R1 (world/style.ts). L'application publiée les ignore : aucune adresse
// ne fait passer un appareil d'élève à Archipéo (décisions 8 et 10 de docs/univers/univers.md).
// `?mesures` affiche en plus, dans la vue 3D, les appels de dessin, les triangles et les images par seconde, pour mesurer
// sur une tablette ; `?mesures=auto` fait seul le tour des vues sur une partie toute construite, en mémoire (la vraie
// partie n'est pas touchée), et donne un tableau à copier (./AutoMeasure.tsx).
import { DEFAULT_SETTINGS, reglagesCourants, sanitizeSettings, SETTINGS_KEY, type Settings } from '../core/settings';
import { loadJSON, STORAGE_PREFIX } from '../core/storage';
import { universAffiche } from '../core/universe';
import { STYLES, type StyleSurface } from './world/style';

export type Rendu = 'blocs' | 'archipeo';

/** Le réglage qui choisit le rendu : l'univers. */
export type ChoixUnivers = Pick<Settings, 'univers'>;

const SANS_REGLAGE: ChoixUnivers = {};

/** L'adresse ne compte que sur le serveur de développement, jamais dans l'application publiée. */
const ADRESSE_LUE = import.meta.env.DEV;

const params = (href: string) => new URL(href, 'http://localhost/').searchParams;

/** Le rendu du monde : celui de l'univers ; sur le serveur de développement, `?rendu=archipeo|blocs` l'emporte. */
export function renduDepuis(href: string, choix: ChoixUnivers = SANS_REGLAGE, adresse = ADRESSE_LUE): Rendu {
  const drapeau = adresse ? params(href).get('rendu') : null;
  if (drapeau === 'archipeo' || drapeau === 'blocs') return drapeau;
  return universAffiche(choix.univers) === 'archipeo' ? 'archipeo' : 'blocs';
}

/** L'option de style de surface (`?style=a|b|c`, serveur de développement seulement), avec le rendu d'Archipéo. */
export function styleDepuis(href: string, choix: ChoixUnivers = SANS_REGLAGE, adresse = ADRESSE_LUE): StyleSurface | null {
  if (!adresse || renduDepuis(href, choix, adresse) !== 'archipeo') return null;
  const s = params(href).get('style');
  return STYLES.find((x) => x === s) ?? null;
}

/** Vrai si l'adresse demande le compteur de mesures (`?mesures`). */
export function mesuresDepuis(href: string): boolean {
  const p = params(href);
  return p.has('mesures') && p.get('mesures') !== '0';
}

/** Vrai si l'adresse demande la mesure automatique (`?mesures=auto`). */
export function mesuresAutoDepuis(href: string): boolean {
  return params(href).get('mesures') === 'auto';
}

/** L'adresse qui lance la mesure automatique depuis la page `href` (le bouton des Réglages) : `?mesures=auto`, au départ. */
export function adresseDeLaMesure(href: string): string {
  const url = new URL(href);
  url.searchParams.set('mesures', 'auto');
  url.hash = '#/';
  return url.href;
}

/** L'adresse qui rend la vraie partie après la mesure : sans `?mesures`, sur les Réglages, d'où on l'a lancée. */
export function adresseSansMesure(href: string): string {
  const url = new URL(href);
  url.searchParams.delete('mesures');
  url.hash = '#/reglages';
  return url.href;
}

const here = () => (typeof window === 'undefined' ? '' : window.location.href);

let lu: { brut: string | null; choix: ChoixUnivers } | null = null;
/**
 * Les réglages du rendu : ceux que `SettingsProvider` tient en mémoire (`reglagesCourants`), sans relire le stockage ;
 * le monde ne lit son rendu qu'à son ouverture (les Réglages sont une autre page), un changement d'univers se voit donc
 * au retour au village, jamais au milieu d'une mission. Sinon (hors de l'application, dans un test), ceux enregistrés sur
 * l'appareil, relus à chaque appel et décodés seulement quand ils ont changé : la 3D en demande à chaque mise à jour des
 * cubes.
 */
function reglages(): ChoixUnivers {
  const courants = reglagesCourants();
  if (courants) return courants;
  if (typeof window === 'undefined') return SANS_REGLAGE;
  let brut: string | null = null;
  try {
    brut = localStorage.getItem(`${STORAGE_PREFIX}${SETTINGS_KEY}`);
  } catch {
    return SANS_REGLAGE;
  }
  if (lu?.brut !== brut) lu = { brut, choix: sanitizeSettings(loadJSON(SETTINGS_KEY, DEFAULT_SETTINGS)) };
  return lu.choix;
}

/** Le rendu du monde de cette page. */
export const renduDuMonde = (): Rendu => renduDepuis(here(), reglages());

/** L'option de style de surface de cette page (lot R1), ou `null`. */
export const styleDuMonde = (): StyleSurface | null => styleDepuis(here(), reglages());

/** Le compteur de mesures est-il demandé sur cette page ? */
export const mesuresDemandees = (): boolean => mesuresDepuis(here());

/** La mesure automatique est-elle demandée sur cette page ? */
export const mesuresAutomatiques = (): boolean => mesuresAutoDepuis(here());

// Le drapeau de développement de la migration vers Archipéo : `?rendu=archipeo` dans l'adresse, avant le `#`
// (`/?rendu=archipeo#/aventure`), choisit le rendu en construction (lots R0 à R7), invisible des élèves ; sans lui, le
// monde reste en blocs. Il devient le rendu de tous au lot 6, et le drapeau disparaît avec lui. `?mesures` affiche en
// plus, dans la vue 3D, les appels de dessin, les triangles et les images par seconde, pour mesurer sur une tablette.
// Avant le `#` seulement : la navigation ne change que la route, le drapeau tient donc toute la session.
// `?style=a|b|c`, avec `?rendu=archipeo` seulement, peint les cubes d'une des trois options de style du lot R1
// (world/style.ts), pour les comparer en captures ; sans lui, le rendu Archipéo garde les textures des blocs.
// Les mêmes choix se font aussi dans les Réglages, section « Expérimental » (réglages `renduArchipeo` et
// `styleArchipeo`, éteints par défaut, enregistrés sur l'appareil) ; l'adresse l'emporte sur eux. Le réglage « Univers »
// du lot 6 (docs/conception/univers.md, étape U3) les remplacera.
import { DEFAULT_SETTINGS, sanitizeSettings, SETTINGS_KEY, type Settings } from '../core/settings';
import { loadJSON, STORAGE_PREFIX } from '../core/storage';
import { STYLES, type StyleSurface } from './world/style';

export type Rendu = 'blocs' | 'archipeo';

/** Les réglages expérimentaux du rendu. */
export type ChoixExperimentaux = Pick<Settings, 'renduArchipeo' | 'styleArchipeo'>;

const SANS_REGLAGE: ChoixExperimentaux = { renduArchipeo: false, styleArchipeo: 'textures' };

const params = (href: string) => new URL(href, 'http://localhost/').searchParams;

/** Le rendu du monde : `archipeo` avec `?rendu=archipeo` ou le réglage expérimental, sinon le monde en blocs. */
export function renduDepuis(href: string, choix: ChoixExperimentaux = SANS_REGLAGE): Rendu {
  return params(href).get('rendu') === 'archipeo' || choix.renduArchipeo ? 'archipeo' : 'blocs';
}

/** L'option de style de surface (`?style=a|b|c`, sinon le réglage), seulement avec le rendu Archipéo. */
export function styleDepuis(href: string, choix: ChoixExperimentaux = SANS_REGLAGE): StyleSurface | null {
  if (renduDepuis(href, choix) !== 'archipeo') return null;
  const s = params(href).get('style') ?? choix.styleArchipeo;
  return STYLES.find((x) => x === s) ?? null;
}

/** Vrai si l'adresse demande le compteur de mesures (`?mesures`). */
export function mesuresDepuis(href: string): boolean {
  const p = params(href);
  return p.has('mesures') && p.get('mesures') !== '0';
}

const here = () => (typeof window === 'undefined' ? '' : window.location.href);

let lu: { brut: string | null; choix: ChoixExperimentaux } | null = null;

/**
 * Les réglages expérimentaux enregistrés sur l'appareil (le monde les relit à son ouverture : les Réglages sont une autre
 * page). Relus à chaque appel, décodés seulement quand ils ont changé : la 3D en demande à chaque mise à jour des cubes.
 */
function reglages(): ChoixExperimentaux {
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

// Le drapeau de développement de la migration vers Archipéo : `?rendu=archipeo` dans l'adresse, avant le `#`
// (`/?rendu=archipeo#/aventure`), choisit le rendu en construction (lots R0 à R7), invisible des élèves ; sans lui, le
// monde reste en blocs. Il devient le rendu de tous au lot 6, et le drapeau disparaît avec lui. `?mesures` affiche en
// plus, dans la vue 3D, les appels de dessin, les triangles et les images par seconde, pour mesurer sur une tablette.
// Avant le `#` seulement : la navigation ne change que la route, le drapeau tient donc toute la session.
// `?style=a|b|c`, avec `?rendu=archipeo` seulement, peint les cubes d'une des trois options de style du lot R1
// (world/style.ts), pour les comparer en captures ; sans lui, le rendu Archipéo garde les textures des blocs.
import { STYLES, type StyleSurface } from './world/style';

export type Rendu = 'blocs' | 'archipeo';

const params = (href: string) => new URL(href, 'http://localhost/').searchParams;

/** Le rendu du monde demandé par l'adresse : `archipeo` seulement avec `?rendu=archipeo`. */
export function renduDepuis(href: string): Rendu {
  return params(href).get('rendu') === 'archipeo' ? 'archipeo' : 'blocs';
}

/** L'option de style de surface demandée (`?style=a|b|c`), seulement avec `?rendu=archipeo`. */
export function styleDepuis(href: string): StyleSurface | null {
  if (renduDepuis(href) !== 'archipeo') return null;
  const s = params(href).get('style');
  return STYLES.find((x) => x === s) ?? null;
}

/** Vrai si l'adresse demande le compteur de mesures (`?mesures`). */
export function mesuresDepuis(href: string): boolean {
  const p = params(href);
  return p.has('mesures') && p.get('mesures') !== '0';
}

const here = () => (typeof window === 'undefined' ? '' : window.location.href);

/** Le rendu du monde de cette page. */
export const renduDuMonde = (): Rendu => renduDepuis(here());

/** L'option de style de surface de cette page (lot R1), ou `null`. */
export const styleDuMonde = (): StyleSurface | null => styleDepuis(here());

/** Le compteur de mesures est-il demandé sur cette page ? */
export const mesuresDemandees = (): boolean => mesuresDepuis(here());

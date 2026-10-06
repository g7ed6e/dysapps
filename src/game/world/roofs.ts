// Les toits d'Archipéo (lot R5 de la piste Rendu, docs/univers/archipeo/cadrage.md) : décision du directeur
// artistique du 28 septembre 2026. Le bloc `toit` ne garde plus son rouge unique : chaque île couvre son bâtiment
// d'ardoise, dans la teinte de son archipel, ou de terre cuite pour quelques îles choisies (une sur quatre ou cinq).
// Code pur, sans Three.js : la construction (./construction.ts) le lit.
import { mixColor } from './daylight';
import { DELAVE } from './decor/brush';
import type { ArchipelagoId } from './map';
import { ambianceDe, type Couleur, type Faces } from './palette';

/** Les deux couvertures d'un toit. */
export type Couverture = 'ardoise' | 'terre-cuite';

/**
 * Les îles couvertes de terre cuite : 6e la Ferme, la Mine, la Pointe des paysages (HG-2 : ses toits de ville, jamais
 * voisine de la Mine ; la Fouille des siècles, sa voisine, reste d'ardoise) et le Hangar des inventions (DA, SC-2 ; la
 * Tour du lecteur et le Volcan des décimaux, ses voisins, sont d'ardoise, et il n'est pas voisin de la Pointe), 5e le
 * Comptoir, 4e le Théâtre, 3e le Belvédère. Les îles de la LV2 restent d'ardoise et sont hors de ce compte : le Relais
 * des voyageurs (5e), voisin du Comptoir (jamais deux voisins en terre cuite), le Jardin des heures (4e, DA LV2-4), voisin
 * du Théâtre, d'ardoise #3E3636, et le Refuge des carnets (3e, DA LV2-5), d'ardoise enneigée. Les îles
 * d'histoire-géographie de 5e à 3e (HG-3, DA) : en terre cuite le Delta des ressources (5e), l'Imprimerie des révolutions
 * (4e) et la Vallée des territoires (3e) ; d'ardoise le Bourg des chroniques et l'Escale des échanges, d'ardoise
 * enneigée le Kiosque des témoins. Chaque archipel des 5e à 3e garde ainsi deux îles de terre cuite, jamais voisines :
 * au 5e, le Relais et le Bourg séparent le Comptoir du Delta ; au 4e, l'Escale sépare l'Imprimerie du Théâtre (deux sur
 * dix) ; au 3e, le Belvédère et la Vallée sont aux deux bouts de l'archipel.
 */
export const TERRE_CUITE_SUR: readonly string[] = [
  'french-6e-grammar-spelling',
  'french-6e-letter-confusion',
  'geography-6e-living',
  'technology-6e-objects',
  'english-5e-vocabulary',
  'geography-5e-resources',
  'english-4e-comprehension',
  'history-4e-revolutions',
  'maths-3e-geometry',
  'geography-3e-france',
];

/** La terre cuite, la même dans les quatre archipels. */
const TERRE_CUITE: Couleur = 0xc0764a;

/**
 * L'ardoise de chaque archipel : son dessus et ses rives (les côtés). Aux Îles du Ciel, le dessus est enneigé (le crème
 * Brume) et les rives gardent l'ardoise.
 */
export const ARDOISES: Record<ArchipelagoId, { dessus: Couleur; rives: Couleur }> = {
  '6e': { dessus: 0x2e505e, rives: 0x2e505e },
  '5e': { dessus: 0x224c5f, rives: 0x224c5f },
  '4e': { dessus: 0x3e3636, rives: 0x3e3636 },
  // Les rives du 3e, un cran plus sombres que l'ardoise du 6e : en gris, les murs de bardeau du refuge s'en détachent
  // (consultant Archipéo, LV2-5).
  '3e': { dessus: 0xe5ebe3, rives: 0x1c3440 },
};

/** Les côtés d'un toit, un peu plus sombres que son dessus : le plancher d'ombre des pentes (fiche de famille §3). */
const COTE_DU_TOIT = 0.85;

/** La couverture du toit d'une île (le `tag` du cube). Une île inconnue est couverte d'ardoise. */
export function toitDe(ile: string | undefined): Couverture {
  return ile && TERRE_CUITE_SUR.includes(ile) ? 'terre-cuite' : 'ardoise';
}

const assombrir = (c: Couleur, k: number): Couleur => {
  const ch = (s: number) => Math.round(((c >> s) & 255) * k);
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
};

/**
 * Les couleurs d'un cube de toit, de jour : la couverture de son île, sous le voile de l'archipel (comme toutes les
 * matières), délavée si l'île est fermée.
 */
export function couleursDuToit(a: ArchipelagoId, ile: string | undefined, muted = false): Faces {
  const ardoise = ARDOISES[a];
  const [dessus, cote] =
    toitDe(ile) === 'terre-cuite'
      ? [TERRE_CUITE, assombrir(TERRE_CUITE, COTE_DU_TOIT)]
      : ardoise.dessus === ardoise.rives
        ? [ardoise.dessus, assombrir(ardoise.rives, COTE_DU_TOIT)]
        : [ardoise.dessus, ardoise.rives];
  const [teinte, force] = ambianceDe(a).voile;
  const peint = (c: Couleur) => {
    const v = mixColor(c, teinte, force);
    return muted ? mixColor(v, DELAVE[0], DELAVE[1]) : v;
  };
  return { dessus: peint(dessus), cote: peint(cote) };
}

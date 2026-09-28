// Les toits d'Archipéo (lot R5 de la piste Rendu, docs/conception/cadrage-archipeo.md) : décision du directeur
// artistique du 28 septembre 2026. Le bloc `toit` ne garde plus son rouge unique : chaque île couvre son bâtiment
// d'ardoise, dans la teinte de son archipel, ou de terre cuite pour quelques îles choisies (une sur quatre ou cinq).
// Code pur, sans Three.js : la construction (./construction.ts) le lit, la 2D peinte le lira au lot R7.
import { mixColor } from './daylight';
import { DELAVE } from './decor/pinceau';
import type { ArchipelagoId } from './map';
import { ambianceDe, type Couleur, type Faces } from './palette';

/** Les deux couvertures d'un toit. */
export type Couverture = 'ardoise' | 'terre-cuite';

/**
 * Les îles couvertes de terre cuite : 6e la Ferme et la Mine, 5e le Comptoir, 4e le Théâtre, 3e le Belvédère. Le Relais
 * des voyageurs (LV2, 5e), voisin du Comptoir, reste d'ardoise : jamais deux voisins en terre cuite.
 */
export const TERRE_CUITE_SUR: readonly string[] = ['ferme', 'mine', 'comptoir', 'theatre', 'belvedere'];

/** La terre cuite, la même dans les quatre archipels. */
export const TERRE_CUITE: Couleur = 0xc0764a;

/**
 * L'ardoise de chaque archipel : son dessus et ses rives (les côtés). Aux Îles du Ciel, le dessus est enneigé (le crème
 * Brume) et les rives gardent l'ardoise.
 */
export const ARDOISES: Record<ArchipelagoId, { dessus: Couleur; rives: Couleur }> = {
  '6e': { dessus: 0x2e505e, rives: 0x2e505e },
  '5e': { dessus: 0x224c5f, rives: 0x224c5f },
  '4e': { dessus: 0x3e3636, rives: 0x3e3636 },
  '3e': { dessus: 0xe5ebe3, rives: 0x2e505e },
};

/** Les côtés d'un toit, un peu plus sombres que son dessus : le plancher d'ombre des pentes (fiche de famille §3). */
export const COTE_DU_TOIT = 0.85;

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

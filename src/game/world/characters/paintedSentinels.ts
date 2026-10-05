// Les Gardiens d'Archipéo en sentinelles de pierre (lot R6), un par île : le registre des statues (un fichier par
// archipel, ./statues/) et leurs modèles, calculés une fois. À côté des Gardiens en cubes (./gardiens.ts), qui gardent
// l'emprise au sol tant que la grille les lit.
import type { BiomeId } from '../../biomes';
import { STATUES_6E } from './statues/6e';
import { STATUES_5E } from './statues/5e';
import { STATUES_4E } from './statues/4e';
import { STATUES_3E } from './statues/3e';
import { EPAISSEUR_DES_VEINES_DANS_LE_MONDE, sentinelleEnFacettes, type Statue } from './sentinel';
import type { FacettesDePersonnage } from './painted';

export const STATUES = { ...STATUES_6E, ...STATUES_5E, ...STATUES_4E, ...STATUES_3E } as Record<BiomeId, Statue>;

const cache = new Map<BiomeId, FacettesDePersonnage>();

/** La sentinelle d'une île en facettes, éteinte (calculée une fois ; ne pas modifier les tableaux rendus). */
export function sentinellePeinte(id: BiomeId): FacettesDePersonnage {
  let f = cache.get(id);
  if (!f) {
    const s = STATUES[id];
    if (!s) throw new Error(`Pas de sentinelle pour ${id}`);
    f = sentinelleEnFacettes(s);
    cache.set(id, f);
  }
  return f;
}

const auDefi = new Map<BiomeId, FacettesDePersonnage>();

/**
 * La sentinelle d'une île telle que le défi la montre : la même que dans le monde, sauf une statue longue (`tour`), qui
 * s'y tourne pour se montrer de profil à la caméra du défi (calculée une fois).
 */
export function sentinelleAuDefi(id: BiomeId): FacettesDePersonnage {
  const s = STATUES[id];
  if (!s?.tour) return sentinellePeinte(id);
  let f = auDefi.get(id);
  if (!f) {
    f = sentinelleEnFacettes(s, { ou: 'defi' });
    auDefi.set(id, f);
  }
  return f;
}

const cacheDuMonde = new Map<BiomeId, FacettesDePersonnage>();

/**
 * La sentinelle d'une île telle que le monde la pose (DA-5) : le même modèle, ses veines élargies pour qu'elles restent
 * aussi épaisses une fois la statue ramenée à `ECHELLE_DANS_LE_MONDE` (../merges.ts). Calculée une fois.
 */
export function sentinelleDuMonde(id: BiomeId): FacettesDePersonnage {
  let f = cacheDuMonde.get(id);
  if (!f) {
    const s = STATUES[id];
    if (!s) throw new Error(`Pas de sentinelle pour ${id}`);
    f = sentinelleEnFacettes(s, { veines: EPAISSEUR_DES_VEINES_DANS_LE_MONDE });
    cacheDuMonde.set(id, f);
  }
  return f;
}

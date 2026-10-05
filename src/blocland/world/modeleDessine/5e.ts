// Le modelé dessiné des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-5e (docs/univers/archipeo/cadrage.md §6). Une île absente garde son relief de marche.
//
// L'intention du directeur artistique (docs/univers/archipeo/intentions/5e-iles-brumeuses.md §3) : des crêtes de roche en
// gradins sur l'anneau du fond (au nord, là où regarde la caméra), derrière le cœur, jamais devant ; le Marché (le port)
// et le Marais restent bas, le creux de la ligne. Des marches de 2 à 3 blocs, chacune en retrait d'une case sur la
// précédente. Ni le cœur, ni la première rangée de l'anneau, ni les abords d'un ouvrage ne bougent : la marche, les
// bornes, les plans et le chemin restent où ils sont, et un gradin ne cache jamais une case où l'on marche.
import type { BiomeId } from '../../biomes';
import { BRIDGES } from '../archipelago';
import { archipelagoOfIsland } from '../archipels';
import { bornesDuCoeur, islandDef, landCells } from '../map';
import { smooth } from '../../../core/math';
import { cellHash } from '../../../core/random';
import { bridgePath, origineDe } from '../terrain';
import type { Modele } from './types';

/**
 * Un sommet d'une crête : sa place le long de l'île (x, en repère d'île), sa hauteur et sa demi-largeur (en cases).
 * `pans` (le Glacier, revue d'ensemble du DA, DA-3) : une masse cassée, chaque pan à son retrait (la demi-largeur du côté
 * des x petits, puis des x grands), des marches de 2 et 3 blocs en alternance, et des bords de gradins qui avancent
 * ou reculent d'une rangée à l'autre au lieu de suivre une courbe.
 */
interface Sommet {
  x: number;
  h: number;
  l: number;
  pans?: [number, number];
}

/** La hauteur d'une marche (2 à 3 blocs : 2,5 arrondi) et la distance gardée aux ouvrages (en cases). */
export const MARCHE_DES_GRADINS = 2.5;
const ABORDS = 3;

/**
 * Les crêtes de la fiche : Glacier 11 et 8 (il garde ses deux sommets), Carrefour 8, Manoir 9, Comptoir 7. Le Relais
 * des voyageurs (LV2, venu après la fiche) ferme la ligne à l'est d'une crête basse, 6, sur son flanc droit : le toit
 * d'ardoise de l'auberge se lit encore sur le ciel, et la ligne des crêtes ne finit pas à plat.
 */
export const CRETES_5E: Partial<Record<BiomeId, Sommet[]>> = {
  'maths-5e-signed-numbers': [
    { x: 4, h: 11, l: 7, pans: [5, 8] },
    { x: 13, h: 8, l: 5, pans: [6, 4] },
  ],
  'french-5e-homophones': [{ x: 9, h: 8, l: 9 }],
  'english-5e-grammar': [{ x: 7, h: 9, l: 8 }],
  'english-5e-vocabulary': [{ x: 5, h: 7, l: 7 }],
  'lv2-5e-introductions': [{ x: 13, h: 6, l: 7 }],
};


/** Les paliers d'une masse cassée : des marches de 2 et 3 blocs en alternance (2, 5, 7, 10…), jusqu'à `h`. */
function paliers(h: number): number[] {
  const out = [0];
  for (let k = 0; out[out.length - 1] < h; k++) out.push(out[out.length - 1] + (k % 2 ? 3 : 2));
  return out;
}

/** La matière des gradins : la roche nue de la palette de l'archipel (./types.ts, « sol: »). */
export const ROCHE_NUE = 'sol:roche';
/** La neige du sol du Glacier se peint en roche claire et froide (la neige de la palette du 5e), jamais en blanc. */
export const NEIGE_DU_SOL = 'sol:neige';

/** Le modelé d'une île à crêtes : la hauteur voulue de chaque case de l'anneau du fond, en marches. */
function crete(id: BiomeId, sommets: Sommet[]): Modele {
  const o = origineDe(id);
  const cases = landCells(islandDef(id)).map((c) => ({ x: c.x - o.x, y: c.y - o.y }));
  const fond = Math.max(...cases.map((c) => c.y));
  // Le bord du fond du cœur (borne exclue), en repère d'île.
  const bordDuCoeur = bornesDuCoeur(islandDef(id)).y1;
  // Les abords des ouvrages de l'île, et des liaisons du port qui la longent (GD-7) : leurs cases, en repère d'île.
  const abords: { x: number; y: number }[] = [];
  for (const b of BRIDGES) if ((b.from === id || b.to === id || b.etoile) && archipelagoOfIsland(b.from) === '5e') for (const c of bridgePath(b)) abords.push({ x: c.x - o.x, y: c.y - o.y });
  const pres = (x: number, y: number) => abords.some((c) => Math.abs(c.x - x) <= ABORDS && Math.abs(c.y - y) <= ABORDS);
  const casse = sommets.some((s) => s.pans);
  // Les paliers de chaque sommet, calculés une fois.
  const paliersDe = new Map(sommets.map((s) => [s, paliers(s.h)]));
  return {
    hauteur(x, y, h) {
      // Le cœur et la première rangée de l'anneau du fond ne bougent pas.
      const dy = y - bordDuCoeur;
      if (dy < 1 || pres(x, y)) return h;
      // Monte du bord du cœur jusqu'au fond de l'île, où la crête tombe en falaise dans la mer.
      const fy = smooth(Math.min(1, dy / Math.max(1, (fond - bordDuCoeur) * 0.75)));
      if (casse) {
        // Une masse cassée : chaque sommet a son retrait de chaque côté ; la hauteur descend au palier (2 ou 3 blocs)
        // sous elle, un bord de gradin avançant ou reculant d'une rangée à l'autre (± un demi-palier).
        let voulue = 0;
        for (const s of sommets) {
          const l = s.pans ? (x < s.x ? s.pans[0] : s.pans[1]) : s.l;
          const v = s.h * Math.max(0, 1 - (Math.abs(x - s.x) / l) ** 2) * fy;
          if (v <= 0) continue;
          // Le sommet garde sa hauteur (le plus haut pic porte la calotte).
          if (v >= s.h - 1.5) {
            voulue = Math.max(voulue, Math.round(v));
            continue;
          }
          // Un hasard entier par rangée et par colonne (`cellHash`) : le même bord sur tout appareil.
          const j = s.pans ? 1.4 * (cellHash(y, s.x) - 0.5) + 1.2 * (cellHash(s.h, x) - 0.5) : 0;
          let palier = 0;
          for (const q of paliersDe.get(s) ?? []) if (q <= v + j && q < s.h) palier = q;
          voulue = Math.max(voulue, palier);
        }
        return Math.max(h, voulue);
      }
      let v = 0;
      for (const s of sommets) v = Math.max(v, s.h * Math.max(0, 1 - (Math.abs(x - s.x) / s.l) ** 2));
      v *= fy;
      const sommet = sommets.some((s) => v >= s.h - 0.5 && Math.abs(x - s.x) < s.l);
      const voulue = sommet ? Math.round(v) : Math.round(Math.floor(v / MARCHE_DES_GRADINS) * MARCHE_DES_GRADINS);
      return Math.max(h, voulue);
    },
    // Les gradins sont de roche nue, au Glacier aussi : la seule glace blanche est la calotte de son plus haut pic. Les
    // crêtes des autres îles prennent la même roche de l'archipel (revue d'ensemble, DA-3 bis : une matière, une couleur).
    dessus(_x, _y, dh, matiere) {
      if (casse) return dh >= 2 ? ROCHE_NUE : matiere === 'nuage' ? NEIGE_DU_SOL : matiere;
      return dh >= 3 ? ROCHE_NUE : matiere;
    },
    // Au Glacier, les flancs des gradins sont de roche nue, eux aussi.
    ...(casse ? { flanc: ROCHE_NUE } : {}),
  };
}

export const MODELES_5E: Partial<Record<BiomeId, Modele>> = Object.fromEntries(
  (Object.entries(CRETES_5E) as [BiomeId, Sommet[]][]).map(([id, s]) => [id, crete(id, s)]),
);

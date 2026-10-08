// Le modelé dessiné des Îles du Ciel (3e), île par île, en repère d'île (./types.ts). Ce fichier appartient au sous-lot
// R4b-3e (docs/univers/archipeo/cadrage.md §6). Une île absente garde son relief de marche.
//
// L'intention du directeur artistique (docs/univers/archipeo/intentions/3e-iles-du-ciel.md §3) : l'Observatoire des textes,
// juste derrière le grand phare, reçoit trois gradins réguliers sur l'anneau du fond (2 blocs chacun, en retrait de
// 1,5 case, neige sur celui du haut) ; le Belvédère perd ses deux pics, jumeaux de ceux du Glacier et de la Falaise, pour
// un dôme bas en gradins de 6 blocs. L'île du Phare n'a pas de gradins (son anneau ne fait que 3 cases : ses gradins sont
// le socle du phare) ; les autres îles restent basses et arrondies. Comme au 5e, ni le cœur, ni la première rangée de
// l'anneau, ni les abords d'un ouvrage, ni le carré du Gardien (GD-11) ne bougent : la marche, les bornes, les plans,
// le chemin et le Gardien restent où ils sont.
import type { BiomeId } from '../../biomes';
import { bornesDuCoeur, islandDef, landCells, startingIsland } from '../map';
import { bridgesOf } from '../archipelago';
import { guardianCells, origineDe } from '../terrain';
import { amorcesDOrigine, amorcesVersLesIlesVenues, casesDeLOuvrage } from '../terrain/links';
import type { Modele } from './types';

/** La hauteur d'un gradin (en blocs), son retrait sur le précédent (en cases), et la distance gardée aux ouvrages. */
export const GRADINS_3E = { marche: 2, retrait: 1.5, gradins: 3 } as const;
const ABORDS = 3;

/** Le dôme du Belvédère : son centre (en repère d'île, entre ses deux anciens pics), ses demi-axes et sa hauteur. */
export const DOME_DU_BELVEDERE = { x: 8.5, y: 20, rx: 10, ry: 4, h: 6 } as const;

/** Les cases de l'île (en repère d'île) et un test « près d'un ouvrage » (à `ABORDS` cases). */
function repere(id: BiomeId) {
  const o = origineDe(id);
  const cases = landCells(islandDef(id)).map((c) => ({ x: c.x - o.x, y: c.y - o.y }));
  const abords: { x: number; y: number }[] = [];
  abords.push(...amorcesDOrigine(id));
  // Et celles des liaisons vers les îles d'histoire-géographie (HG-3), venues après la fiche.
  abords.push(...amorcesVersLesIlesVenues(id));
  // Et toutes ses liaisons tracées sur la carte de départ : depuis GD-11, sans les îlots des Gardiens, certaines s'y
  // tracent autrement.
  const coeur = startingIsland(id).core;
  for (const b of bridgesOf(id)) for (const c of casesDeLOuvrage(b, [], startingIsland)) abords.push({ x: c.x - coeur.x, y: c.y - coeur.y });
  // Le carré du Gardien (GD-11) et une case autour : il se tient sur un sol qui ne bouge pas.
  const gardien = new Set<string>();
  for (const c of guardianCells(id)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) gardien.add(`${c.x - o.x + dx},${c.y - o.y + dy}`);
  const pres = (x: number, y: number) => gardien.has(`${x},${y}`) || abords.some((c) => Math.abs(c.x - x) <= ABORDS && Math.abs(c.y - y) <= ABORDS);
  // Le bord du fond du cœur (borne exclue), en repère d'île : la première rangée derrière le cœur.
  const fond = bornesDuCoeur(islandDef(id)).y1;
  return { cases, pres, fond };
}

/**
 * Les gradins de l'Observatoire des textes : chaque gradin recule de 1,5 case sur le précédent, depuis la première
 * rangée derrière le cœur et depuis les deux flancs de l'île ; le plus haut est enneigé.
 */
function gradinsDesTextes(): Modele {
  const { cases, pres, fond } = repere('french-3e-close-reading');
  const G = GRADINS_3E;
  // Les bords de chaque rangée, pour le retrait sur les flancs.
  const bords = new Map<number, [number, number]>();
  for (const c of cases) {
    const b = bords.get(c.y);
    bords.set(c.y, b ? [Math.min(b[0], c.x), Math.max(b[1], c.x)] : [c.x, c.x]);
  }
  const niveau = (x: number, y: number) => {
    const dy = y - fond;
    const [x0, x1] = bords.get(y) ?? [x, x];
    const cote = Math.min(x - x0, x1 - x);
    const k = (d: number) => Math.floor(d / G.retrait) + 1;
    return Math.min(G.gradins, k(dy - 1), k(cote));
  };
  return {
    hauteur(x, y, h) {
      if (y - fond < 1 || pres(x, y)) return h;
      return Math.max(h, G.marche * niveau(x, y));
    },
    dessus(x, y, dh, matiere) {
      if (y - fond < 1 || pres(x, y)) return matiere;
      const n = niveau(x, y);
      return n >= G.gradins ? 'neige' : n >= 1 && dh >= G.marche ? 'roche' : matiere;
    },
  };
}

/**
 * Le dôme du Belvédère : à la place de ses deux pics, un dôme bas en gradins de 2 blocs, 6 au sommet, enneigé en haut,
 * de roche dessous. Seul l'anneau du fond bouge ; ailleurs, l'île garde ses collines basses.
 */
function domeDuBelvedere(): Modele {
  const { pres, fond } = repere('maths-3e-geometry');
  const D = DOME_DU_BELVEDERE;
  const dome = (x: number, y: number) => {
    const d = ((x - D.x) / D.rx) ** 2 + ((y - D.y) / D.ry) ** 2;
    return Math.floor((D.h * Math.max(0, 1 - d)) / GRADINS_3E.marche + 0.5) * GRADINS_3E.marche;
  };
  return {
    hauteur(x, y, h) {
      if (y - fond < 1 || pres(x, y)) return h;
      // Un pic (plus haut que les collines, 2 blocs au plus) redescend sur le dôme ; ailleurs, le dôme monte le sol.
      return h > 2 ? Math.max(2, dome(x, y)) : Math.max(h, dome(x, y));
    },
    dessus(x, y, dh, matiere) {
      if (y - fond < 1 || pres(x, y)) return matiere;
      if (dh >= D.h) return 'neige';
      return matiere === 'neige' ? 'roche' : matiere;
    },
  };
}

export const MODELES_3E: Partial<Record<BiomeId, Modele>> = { 'french-3e-close-reading': gradinsDesTextes(), 'maths-3e-geometry': domeDuBelvedere() };

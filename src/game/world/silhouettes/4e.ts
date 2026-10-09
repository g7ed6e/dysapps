// Le relief de marche des Anciens Ateliers (4e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../drawnModel/4e.ts (U2).
// La forme de chaque île (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026), un seul champ,
// `forme` : choisie à la main d'après son sujet ou son nom (docs/gameplay/propositions/archives/GD-12.md), tournée pour garder la
// mer entre voisines. Changer la forme d'une île, c'est changer ce champ, puis récrire sa côte dans la carte de départ
// (`ext`, ../map.ts : map.test.ts dit laquelle). Une seule forme longue aux Monts de Feu (directeur artistique,
// 9 octobre 2026) : le lagon du Bassin, ouvert devant par sa passe. Le trait des formes y est court (`short`, 5 cases au
// lieu de 7), sauf là où il porte quelque chose (le quai de l'Atelier, les pics de la Forge et de la Falaise) : le sol
// d'Archipéo y a peu de marge (../budget.ts).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_4E = {
  // La Forge : un seul pic au fond de l'île, sur une goutte dont la pointe file vers le fond.
  'maths-4e-powers': { pics: [{ x: 9, y: 19, h: 7, r: 5 }], forme: { forme: 'goutte', vers: 'fond' } },
  // L'Atelier, le port : un croissant ouvert devant, sur son quai.
  'maths-4e-algebra': { pics: [], forme: { forme: 'croissant', vers: 'devant', quai: true } },
  // La Falaise : deux pics au fond de l'île, le plus haut à gauche, sur un haricot creusé devant (son dos au fond, sous
  // les pics).
  'french-4e-agreement': {
    pics: [
      { x: 5, y: 21, h: 9, r: 6 },
      { x: 12, y: 20, h: 6, r: 4 },
    ],
    forme: { forme: 'haricot', vers: 'devant' },
  },
  'french-4e-vocabulary': { pics: [], forme: { forme: 'galet', vers: 'devant', short: true } },
  'english-4e-comprehension': { pics: [], forme: { forme: 'croissant', vers: 'fond', short: true } },
  'english-4e-grammar': { pics: [], forme: { forme: 'presquile', vers: 'droite', short: true } },
  // Le Jardin des heures (LV2) : une île plate, au bout est de la crête, sans pic (aucune verticale à côté de la grue).
  'lv2-4e-daily-life': { pics: [], forme: { forme: 'trefle', vers: 'devant', short: true } },
  // Histoire-géographie (HG-3) : des îles plates, sans pic.
  'history-4e-revolutions': { pics: [], forme: { forme: 'haricot', vers: 'fond', short: true } },
  'geography-4e-globalization': { pics: [], forme: { forme: 'cacahuete', vers: 'devant', short: true } },
  // Sciences (SC-3) : des îles plates, sans pic.
  'life-earth-sciences-4e-cells-evolution': { pics: [], forme: { forme: 'goutte', vers: 'devant', short: true } },
  'physics-chemistry-4e-signals-circuits': { pics: [], forme: { forme: 'presquile', vers: 'devant', short: true } },
  // Le Bassin des maquettes : un lagon, la mer elle-même dans un anneau de terre, sa passe devant.
  'technology-4e-modeling': { pics: [], forme: { forme: 'lagon', vers: 'devant' } },
} satisfies Partial<Record<BiomeId, Silhouette>>;

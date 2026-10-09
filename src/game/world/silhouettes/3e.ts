// Le relief de marche des Îles du Ciel (3e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../drawnModel/3e.ts (U2).
// La forme de chaque île (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026), un seul champ,
// `forme` : choisie à la main d'après son sujet ou son nom (docs/gameplay/propositions/archives/GD-12.md), tournée pour garder la
// mer entre voisines. Changer la forme d'une île, c'est changer ce champ, puis récrire sa côte dans la carte de départ
// (`ext`, ../map.ts : map.test.ts dit laquelle). Deux formes plus marquées (directeur artistique, 9 octobre 2026) : le
// crochet du Tremplin et le moulinet de la Ruche. Dans le ciel, chaque case de terre coûte ses dessous et ses parois au
// sol d'Archipéo : le trait des formes y est court (`short`, 5 cases au lieu de 7), sauf là où il porte quelque chose
// (le quai du Phare, les pics du Belvédère, le lac du Refuge) et sur les deux formes marquées (../budget.ts, le sol).
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_3E = {
  // Le Belvédère : deux pics au fond de l'île, le plus haut à gauche, sur une goutte dont la pointe file vers le fond.
  'maths-3e-geometry': {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
    forme: { forme: 'goutte', vers: 'fond' },
  },
  // Le Phare : un croissant, ses cornes vers le devant autour du quai ; le grand phare se tient sur la côte est.
  'maths-3e-functions': { pics: [], forme: { forme: 'croissant', vers: 'devant', quai: true } },
  // L'Observatoire des données : un galet, la coupole.
  'maths-3e-statistics': { pics: [], forme: { forme: 'galet', vers: 'devant', short: true } },
  // L'Observatoire des textes : un haricot, le creux à gauche ; la lecture qui creuse le bord.
  'french-3e-close-reading': { pics: [], forme: { forme: 'haricot', vers: 'gauche', short: true } },
  // Le Studio des ondes : un trèfle, les ondes qui partent en trois directions.
  'english-3e-comprehension': { pics: [], forme: { forme: 'trefle', vers: 'devant', short: true } },
  // Le Château des hypothèses : une cacahuète, deux lobes, deux possibles (si… alors).
  'english-3e-grammar': { pics: [], forme: { forme: 'cacahuete', vers: 'devant', short: true } },
  // Le Refuge des carnets (LV2) : une île basse et arrondie, à l'est du Château, sans pic (rien de vertical à côté du
  // phare) ; son lac d'altitude est dessiné à part (../map.ts, `LACS`). Une cacahuète vers le fond : ses deux lobes
  // laissent de l'herbe tout autour du lac (la goutte n'en laissait plus à sa pointe).
  'lv2-3e-travel': { pics: [], forme: { forme: 'cacahuete', vers: 'fond' } },
  // Histoire-géographie (HG-3) : des îles plates, sans pic. Le Kiosque des témoins en galet (le kiosque rond), le Plateau
  // des territoires en trèfle (des régions côte à côte).
  'history-3e-twentieth-century': { pics: [], forme: { forme: 'galet', vers: 'devant', short: true } },
  'geography-3e-france': { pics: [], forme: { forme: 'trefle', vers: 'devant', short: true } },
  // Sciences (SC-3) : des îles plates, sans pic. Le Verger de la santé en croissant ouvert devant, le verger à l'abri (le
  // haricot du cadrage n'arrondissait qu'un coin de son cœur et coûtait plus de terre au sol d'Archipéo).
  'life-earth-sciences-3e-human-body': { pics: [], forme: { forme: 'croissant', vers: 'devant', short: true } },
  // Le Tremplin des forces : un crochet vers l'est, la piste d'élan ; la Ruche des réseaux : un moulinet, ses quatre bras.
  'physics-chemistry-3e-motion-energy': { pics: [], forme: { forme: 'crochet', vers: 'droite' } },
  'technology-3e-digital': { pics: [], forme: { forme: 'moulinet', vers: 'devant' } },
  // EMC (EMC-2) : le Forum des débats en trèfle, des voix qui partent en trois directions. Latin-grec (LCA-2) : le
  // Bosquet des sages en galet, un bois rond. Plats, sans pic, le trait court (`short`) comme les autres îles du ciel.
  'civics-3e-democratic-life': { pics: [], forme: { forme: 'trefle', vers: 'devant', short: true } },
  'lca-3e-ideas': { pics: [], forme: { forme: 'galet', vers: 'devant', short: true } },
} satisfies Partial<Record<BiomeId, Silhouette>>;

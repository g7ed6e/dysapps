// Le relief de marche des Îles Brumeuses (5e), île par île, en repère d'île (./types.ts). Il est commun à Blocland : le
// changer change ses îles et ses empreintes. Un gradin propre à Archipéo s'écrit dans ../drawnModel/5e.ts (U2).
// La forme de chaque île (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026), un seul champ,
// `forme` : choisie à la main d'après son sujet ou son nom (docs/gameplay/propositions/archives/GD-12.md), tournée pour garder la
// mer entre voisines. Changer la forme d'une île, c'est changer ce champ, puis récrire sa côte dans la carte de départ
// (`ext`, ../map.ts : map.test.ts dit laquelle). Deux formes plus marquées (mainteneur, 9 octobre 2026, « Les quatre ») :
// le fer du Comptoir et le moulinet du Carrefour.
import type { BiomeId } from '../../biomes';
import type { Silhouette } from './types';

export const SILHOUETTES_5E = {
  // Le Glacier : deux pics au fond de l'île, le plus haut à gauche, sur un galet, le front du glacier devant. (La goutte
  // du cadrage, pointe au fond, réduisait le fond de l'île à une langue que longent les liaisons : les gradins d'Archipéo
  // n'y montaient plus ; le haricot, plus large, ne laissait plus de place au Glacier tourné.)
  'maths-5e-signed-numbers': {
    pics: [
      { x: 5, y: 20, h: 9, r: 6 },
      { x: 12, y: 19, h: 6, r: 4 },
    ],
    forme: { forme: 'galet', vers: 'devant' },
  },
  // Le Marché des proportions, île-école et port : un croissant ouvert devant, le port du marché.
  'maths-5e-proportionality': { pics: [], forme: { forme: 'croissant', vers: 'devant', quai: true } },
  // Le Carrefour des homophones : un moulinet, quatre routes qui partent de ses quatre coins (le trèfle du cadrage
  // n'en avait que trois).
  'french-5e-homophones': { pics: [], forme: { forme: 'moulinet', vers: 'devant' } },
  // Le Marais des temps : un haricot, la lagune dans le creux.
  'french-5e-conjugation': { pics: [], forme: { forme: 'haricot', vers: 'devant' } },
  // Le Comptoir : un fer à cheval ouvert devant, la rade fermée où l'on commerce, face au large.
  'english-5e-vocabulary': { pics: [], forme: { forme: 'fer', vers: 'devant' } },
  // Le Manoir du passé : un haricot, l'anse sombre derrière le manoir.
  'english-5e-grammar': { pics: [], forme: { forme: 'haricot', vers: 'fond' } },
  // Le Relais des voyageurs (LV2) : une cacahuète, deux étapes et le relais au col ; son relief dessiné est dans
  // ../drawnModel/5e.ts.
  'lv2-5e-introductions': { pics: [], forme: { forme: 'cacahuete', vers: 'devant' } },
  // Histoire-géographie (HG-3) : des îles plates, sans pic. Le Bourg des chroniques, un galet, l'enceinte ronde ; le
  // Delta des ressources, un trèfle, les bras du delta.
  'history-5e-middle-ages': { pics: [], forme: { forme: 'galet', vers: 'devant' } },
  'geography-5e-resources': { pics: [], forme: { forme: 'trefle', vers: 'devant' } },
  // Sciences (SC-3) : des îles plates, sans pic. La Prairie des climats, un galet, la prairie ouverte ; la Saline des
  // mélanges, un croissant ouvert à gauche, les bassins de sel dans la baie ; la Menuiserie des objets, une
  // presqu'île, le ponton où sèche le bois.
  'life-earth-sciences-5e-active-planet': { pics: [], forme: { forme: 'galet', vers: 'devant' } },
  'physics-chemistry-5e-matter-universe': { pics: [], forme: { forme: 'croissant', vers: 'gauche' } },
  'technology-5e-design': { pics: [], forme: { forme: 'presquile', vers: 'devant' } },
  // L'EMC (EMC-2) et le latin-grec (LCA-2), des îles plates, sans pic, aux formes que GD-12 a gardées pour leurs places
  // (map.test.ts) : le Fournil des partages, un trèfle ouvert devant, trois lobes autour du fournil, comme un pain qu'on
  // partage ; la Grotte des légendes, un galet court ouvert devant, le rocher rond de la grotte (propositions de
  // l'artiste technique 3D, à trancher par le directeur artistique).
  'civics-5e-equality-solidarity': { pics: [], forme: { forme: 'trefle', vers: 'devant' } },
  'lca-5e-legends': { pics: [], forme: { forme: 'galet', vers: 'devant', short: true } },
} satisfies Partial<Record<BiomeId, Silhouette>>;

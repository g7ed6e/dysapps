// Créatures originales de Blocland, dessinées en cubes.
import type { BiomeId } from './biomes';
import { VoxelScene, type VoxelCube } from './Voxel';

type Layer = string[];

/**
 * Construit des cubes à partir de couches ASCII (une couche par hauteur z, de bas en haut).
 * Chaque caractère est une clé de `palette` ; « . » = vide. Ligne = y, colonne = x.
 */
export function fromLayers(layers: Layer[], palette: Record<string, string | { color: string; top?: string }>): VoxelCube[] {
  const cubes: VoxelCube[] = [];
  layers.forEach((layer, z) => {
    layer.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.' || ch === ' ') return;
        const p = palette[ch];
        if (!p) return;
        cubes.push(typeof p === 'string' ? { x, y, z, color: p } : { x, y, z, ...p });
      });
    });
  });
  return cubes;
}

// Mousso : un golem de mousse trapu, ventre de pierre, deux grands yeux, un sourire clair, une fleur sur la tête.
// Couches de bas en haut ; ligne = y (le visage côté y = 0, face à la caméra), colonne = x.
const MOUSSO = fromLayers(
  [
    ['.....', '.M.M.', '.M.M.', '.....'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.SSS.', 'MGGGM', 'MGGGM', '.GGG.'],
    ['.GgG.', 'MGGGM', 'GGGGG', '.GGG.'],
    ['.KGK.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.WGW.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.....', '.GGG.', '.GgG.', '.....'],
    ['.....', '..F..', '.....', '.....'],
  ],
  { G: '#5e9b4a', M: '#4c7a3b', g: '#8fd070', S: '#8c8c8c', W: '#f6f1e6', K: '#1f1a16', F: '#e07aa0' },
);

const TUNEL = fromLayers(
  [
    ['.BBB.', 'BBBBB', 'BBBBB', '.BBB.'],
    ['.BBB.', 'BbbbB', 'BbbbB', '.BBB.'],
    ['..N..', '.BEB.', '.BBB.', '.....'],
  ],
  { B: '#7a5236', b: '#a06f4c', N: '#e8a3b8', E: '#1f1a16' },
);

const ROUXEL = fromLayers(
  [
    ['.OOO..', 'OOOOO.', 'OOOOO.', '.OOO..', '..OT..'],
    ['.OOO..', 'OWWWO.', 'OWWWO.', '.OOO..', '...T..'],
    ['O.O...', '.OOO..', '.OEO..', '......', '......'],
    ['O.O...', '..N...', '......', '......', '......'],
  ],
  { O: '#d9772e', W: '#f4e6d4', T: '#f4e6d4', E: '#1f1a16', N: '#1f1a16' },
);

const BLOQUETTE = fromLayers(
  [
    ['.WWWW.', 'WWKKWW', 'WKWWKW', 'WWWWWW', '.WWWW.'],
    ['.WWWW.', 'WWWWWW', 'WKWWWW', 'WWWWKW', '.WWWW.'],
    ['..WW..', '.WWWW.', '.WEEW.', '.PPPP.', '......'],
    ['.H..H.', '......', '......', '......', '......'],
  ],
  { W: '#f6f1e6', K: '#2a2622', E: '#1f1a16', P: '#f0b8c4', H: '#8a5a26' },
);

const GRIMOIRE = fromLayers(
  [
    ['.SSS.', 'SSSSS', 'SSSSS', '.SSS.'],
    ['.SSS.', 'SsssS', 'SsssS', '.SSS.'],
    ['S...S', 'SYSYS', 'SSSSS', '.SBS.'],
    ['S...S', '.....', '.....', '.....'],
  ],
  { S: '#8c93a0', s: '#b3b9c4', Y: '#f5d63d', B: '#e0a33a' },
);

// Coco : une coccinelle ronde, rouge à points noirs, tête noire et deux antennes.
const COCO = fromLayers(
  [
    ['.RRR.', 'RRRRR', 'RRRRR', '.RRR.'],
    ['.KKK.', 'RKRKR', 'RRRRR', '.RKR.'],
    ['.KEK.', '.RRR.', '.RRR.', '.....'],
    ['.A.A.', '.....', '.....', '.....'],
  ],
  { R: '#d8402e', K: '#1f1a16', E: '#f6f1e6', A: '#1f1a16' },
);

// Nénu : une grenouille verte accroupie, gros yeux dorés au-dessus de la tête, ventre clair.
const NENU = fromLayers(
  [
    ['.VVV.', 'VVVVV', 'VVVVV', '.VVV.'],
    ['.VvV.', 'VvvvV', 'VVVVV', '.....'],
    ['Y.V.Y', '.VVV.', '.....', '.....'],
  ],
  { V: '#4f9e3f', v: '#c8e6a0', Y: '#f5d63d' },
);

// Lavi : une salamandre orange à taches jaunes, longue queue, deux yeux noirs.
const LAVI = fromLayers(
  [
    ['.OOO.', 'OOOOO', 'OYOYO', 'OOOOO', '.OOO.', '..O..', '..O..'],
    ['.EOE.', '.OYO.', '.OOO.', '.....', '.....', '.....', '.....'],
  ],
  { O: '#e8742e', Y: '#f5d63d', E: '#1f1a16' },
);

// Frimas : un pingouin dodu, dos noir, ventre blanc, bec et pattes orange.
const FRIMAS = fromLayers(
  [
    ['.OOO.', '.....', '.....', '.....'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.'],
    ['.WWW.', 'KWWWK', 'KKKKK', '.KKK.'],
    ['.KKK.', 'KKKKK', '.KKK.', '.....'],
    ['.EKE.', '..O..', '.....', '.....'],
  ],
  { O: '#f28c28', W: '#f6f1e6', K: '#1f1a16', E: '#f6f1e6' },
);

// Bazar : un raton laveur gris, masque noir sur les yeux, queue rayée.
const BAZAR = fromLayers(
  [
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.', '..T..', '..t..', '..T..'],
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.', '.....', '.....', '.....'],
    ['G.G.G', '.KKK.', '.GGG.', '.....', '.....', '.....', '.....'],
    ['.....', '.EKE.', '.....', '.....', '.....', '.....', '.....'],
  ],
  { G: '#8c8c8c', K: '#1f1a16', E: '#f6f1e6', T: '#1f1a16', t: '#c2c2c2' },
);

// Sema : un caméléon vert pomme, queue enroulée, gros yeux ronds qui regardent chacun d'un côté.
const SEMA = fromLayers(
  [
    ['.VVVV.', 'VVVVVV', '.VVVV.', '..VV..', '..V...', '.VV...'],
    ['.VvvV.', 'VvvvvV', '.VVVV.', '......', '......', '......'],
    ['E.VV.E', '.VVVV.', '......', '......', '......', '......'],
  ],
  { V: '#7cc24a', v: '#b6e08a', E: '#f5d63d' },
);

// Kroa : un triton vert sombre, ventre orange, crête sur le dos.
const KROA = fromLayers(
  [
    ['.TTT.', 'TTTTT', 'TOOOT', 'TTTTT', '.TTT.', '..T..', '..T..'],
    ['.EKE.', '.TCT.', '.TCT.', '.TCT.', '.....', '.....', '.....'],
  ],
  { T: '#3f6b3a', O: '#f28c28', E: '#f5d63d', K: '#1f1a16', C: '#f28c28' },
);

// Braise : un golem trapu de fonte sombre, cœur de braise orange, marteau.
const BRAISE = fromLayers(
  [
    ['.FFF.', 'FFFFF', 'FFFFF', '.FFF.'],
    ['.FFF.', 'FFOFF', 'FFFFF', '.FFF.'],
    ['..F.M', '.FFF.', '.FFF.', '.....'],
    ['....M', '.FEF.', '.....', '.....'],
    ['....M', '.....', '.....', '.....'],
  ],
  { F: '#4a4a52', O: '#f28c28', E: '#f5d63d', M: '#8a6a3c' },
);

// Ixe : un petit robot cubique crème, écran bleu, antenne.
const IXE = fromLayers(
  [
    ['.CCC.', 'CCCCC', 'CCCCC', '.CCC.'],
    ['.CCC.', 'CBBBC', 'CCCCC', '.CCC.'],
    ['.CCC.', 'CBXBC', 'CCCCC', '.....'],
    ['..A..', '.....', '.....', '.....'],
  ],
  { C: '#f4f1e4', B: '#3b82f6', X: '#1f1a16', A: '#d8402e' },
);

// Cléa : une chèvre blanche aux cornes courbes, barbichette, sabots noirs.
const CLEA = fromLayers(
  [
    ['.K.K.', '.....', '.K.K.', '.....'],
    ['.WWW.', 'WWWWW', 'WWWWW', '.WWW.'],
    ['.WWW.', 'WWWWW', 'WWWWW', '.WWW.'],
    ['.WBW.', '.WWW.', '.....', '.....'],
    ['.EWE.', '.....', '.....', '.....'],
    ['H...H', '.....', '.....', '.....'],
  ],
  { W: '#f6f1e6', K: '#1f1a16', B: '#d8c9b0', E: '#1f1a16', H: '#8a6a3c' },
);

// Plume : une pie noire et blanche, longue queue, bec noir, un objet doré dans le bec.
const PLUME = fromLayers(
  [
    ['.KKK.', 'KWWWK', 'KKKKK', '.KKK.', '..K..', '..K..'],
    ['.KKK.', 'KWWWK', 'KKKKK', '.....', '.....', '.....'],
    ['.OKE.', '.KKK.', '.....', '.....', '.....', '.....'],
  ],
  { K: '#1f1a16', W: '#f6f1e6', E: '#f5d63d', O: '#f2c944' },
);

// Théo : un héron gris-bleu sur ses longues pattes, bec jaune, huppe noire.
const THEO = fromLayers(
  [
    ['..P.P', '.....', '.....', '.....'],
    ['..P.P', '.....', '.....', '.....'],
    ['.GGGG', 'GGGGG', '.GGG.', '.....'],
    ['..G..', '.....', '.....', '.....'],
    ['Y.GK.', '.....', '.....', '.....'],
  ],
  { G: '#8c9bb0', P: '#e8a33a', Y: '#f5d63d', K: '#1f1a16' },
);

// Stat : une chouette mauve, grands yeux ronds, lunettes d'astronome.
const STAT = fromLayers(
  [
    ['.MMM.', 'MMMMM', 'MMMMM', '.MMM.'],
    ['.MMM.', 'MmmmM', 'MMMMM', '.MMM.'],
    ['.EYE.', 'MMMMM', '.MMM.', '.....'],
    ['M...M', '.....', '.....', '.....'],
  ],
  { M: '#7a6aa0', m: '#c9b8e8', E: '#f6f1e6', Y: '#f5d63d' },
);

// Fi : une lampe de phare vivante, socle doré, verre lumineux, un œil.
const FI = fromLayers(
  [
    ['.DDD.', 'DDDDD', '.DDD.', '.....'],
    ['..D..', '.DDD.', '..D..', '.....'],
    ['.LLL.', 'LLLLL', '.LLL.', '.....'],
    ['.LEL.', 'LLLLL', '.LLL.', '.....'],
    ['..D..', '.DDD.', '..D..', '.....'],
  ],
  { D: '#e0b842', L: '#fff4c2', E: '#1f1a16' },
);

// Astra : une luciole au corps sombre et à l'abdomen lumineux, ailes claires.
const ASTRA = fromLayers(
  [
    ['.KKK.', 'KKKKK', '.LLL.', '.LLL.'],
    ['W.K.W', 'WKKKW', '..L..', '.....'],
    ['.EKE.', '.....', '.....', '.....'],
  ],
  { K: '#2a2622', L: '#fff4a0', W: '#e6f2f8', E: '#f5d63d' },
);

export const CREATURE_CUBES: Record<BiomeId, VoxelCube[]> = {
  foret: MOUSSO,
  mine: TUNEL,
  carriere: ROUXEL,
  ferme: BLOQUETTE,
  tour: GRIMOIRE,
  plaine: COCO,
  riviere: NENU,
  volcan: LAVI,
  glacier: FRIMAS,
  marche: BAZAR,
  carrefour: SEMA,
  marais: KROA,
  forge: BRAISE,
  atelier: IXE,
  falaise: CLEA,
  cabinet: PLUME,
  belvedere: THEO,
  donnees: STAT,
  phare: FI,
  textes: ASTRA,
};

interface Props {
  biome: BiomeId;
  /** Nom lisible par les lecteurs d'écran (sinon décoratif). */
  label?: string;
  className?: string;
}

export function Creature({ biome, label, className }: Props) {
  return <VoxelScene cubes={CREATURE_CUBES[biome]} s={14} pad={6} className={`creature ${className ?? ''}`.trim()} label={label} />;
}

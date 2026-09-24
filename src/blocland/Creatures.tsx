// Créatures originales de Blocland, dessinées en cubes.
import type { BiomeId } from './biomes';
import { VoxelScene, type VoxelCube } from './Voxel';

type Layer = string[];

/**
 * Construit des cubes à partir de couches ASCII (une couche par hauteur z, de bas en haut).
 * Chaque caractère est une clé de `palette` ; « . » = vide. Ligne = y, colonne = x.
 */
function fromLayers(layers: Layer[], palette: Record<string, string | { color: string; top?: string }>): VoxelCube[] {
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

const MOUSSO = fromLayers(
  [
    ['.GGG.', 'GGGGG', 'GGGGG', '.GGG.'],
    ['.GGG.', 'GMMMG', 'GMMMG', '.GGG.'],
    ['..G..', '.GGG.', '.GGG.', '..G..'],
    ['.....', '.gEg.', '.ggg.', '.....'],
    ['.....', '.ggg.', '.....', '.....'],
  ],
  { G: '#5e9b4a', g: '#7fbf63', M: '#4c7a3b', E: '#1f2a1a' },
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

export const CREATURE_CUBES: Record<BiomeId, VoxelCube[]> = {
  foret: MOUSSO,
  mine: TUNEL,
  carriere: ROUXEL,
  ferme: BLOQUETTE,
  tour: GRIMOIRE,
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

// Le bonhomme : l'avatar de l'élève. Un personnage en blocs aux proportions classiques (tête cubique de 8, corps
// 8 × 12 × 4, bras et jambes 4 × 12 × 4, en « pixels » d'un seizième de bloc : deux blocs de haut). Dessin original :
// cheveux châtains, chemise verte, pantalon bleu, chaussures brunes. Chaque membre est une pièce qui pivote.
import type { VoxelCube } from './Voxel';

export const AVATAR_SCALE = 1 / 16;

const HAIR = '#5a3a1e';
const SKIN = '#f1c9a5';
const SKIN_DARK = '#d9a982';
const EYE_WHITE = '#ffffff';
const EYE = '#2f5fb5';
const MOUTH = '#a0522d';
const SHIRT = '#3f9b5a';
const SHIRT_DARK = '#2f7a45';
const PANTS = '#3b5ea8';
const PANTS_DARK = '#2c4a86';
const SHOE = '#4a3320';

export interface AvatarPart {
  name: 'tete' | 'corps' | 'bras-gauche' | 'bras-droit' | 'jambe-gauche' | 'jambe-droite';
  cubes: VoxelCube[];
  /** Le point autour duquel la pièce pivote (coordonnées du bonhomme). */
  pivot: { x: number; y: number; z: number };
}

function box(x0: number, y0: number, z0: number, w: number, d: number, h: number, color: (x: number, y: number, z: number) => string | null): VoxelCube[] {
  const out: VoxelCube[] = [];
  for (let x = x0; x < x0 + w; x++)
    for (let y = y0; y < y0 + d; y++)
      for (let z = z0; z < z0 + h; z++) {
        // Seule la surface compte (l'intérieur ne se voit jamais) : on allège.
        const surface = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + d - 1 || z === z0 || z === z0 + h - 1;
        if (!surface) continue;
        const c = color(x - x0, y - y0, z - z0);
        if (c) out.push({ x, y, z, color: c });
      }
  return out;
}

/** La tête : 8 × 8 × 8, le visage devant (y = 0), cheveux dessus et derrière. */
const head = box(4, 0, 24, 8, 8, 8, (x, y, z) => {
  if (z >= 6) return HAIR; // le dessus et la frange
  if (y >= 6 && z >= 2) return HAIR; // l'arrière de la tête
  if (y === 0) {
    // Le visage.
    if (z === 3 && (x === 1 || x === 6)) return EYE_WHITE;
    if (z === 3 && (x === 2 || x === 5)) return EYE;
    if (z === 1 && x >= 3 && x <= 4) return MOUTH;
    if (z === 5 && x >= 1 && x <= 6) return HAIR; // la frange descend un peu
  }
  if (y === 7) return HAIR;
  return z === 0 ? SKIN_DARK : SKIN;
});

/** Le corps : 8 × 4 × 12, chemise verte à col sombre, ceinture. */
const body = box(4, 2, 12, 8, 4, 12, (_x, _y, z) => (z === 0 ? PANTS_DARK : z === 11 ? SHIRT_DARK : SHIRT));

const arm = (x0: number, right: boolean): VoxelCube[] =>
  box(x0, 2, 12, 4, 4, 12, (x, _y, z) => {
    if (z >= 8) return right ? SHIRT : SHIRT_DARK; // la manche
    return z === 0 ? SKIN_DARK : x === 0 || x === 3 ? SKIN_DARK : SKIN;
  });

const leg = (x0: number): VoxelCube[] => box(x0, 2, 0, 4, 4, 12, (_x, _y, z) => (z <= 1 ? SHOE : z === 11 ? PANTS_DARK : PANTS));

export const AVATAR_PARTS: AvatarPart[] = [
  { name: 'tete', cubes: head, pivot: { x: 8, y: 4, z: 24 } },
  { name: 'corps', cubes: body, pivot: { x: 8, y: 4, z: 12 } },
  { name: 'bras-gauche', cubes: arm(0, false), pivot: { x: 2, y: 4, z: 22 } },
  { name: 'bras-droit', cubes: arm(12, true), pivot: { x: 14, y: 4, z: 22 } },
  { name: 'jambe-gauche', cubes: leg(4), pivot: { x: 6, y: 4, z: 12 } },
  { name: 'jambe-droite', cubes: leg(8), pivot: { x: 10, y: 4, z: 12 } },
];

/** Tous les cubes, pour la vue simple et les tests. 16 de large, 8 de profond, 32 de haut. */
export const AVATAR_CUBES: VoxelCube[] = AVATAR_PARTS.flatMap((p) => p.cubes);

/** Où le bonhomme se tient sur une île, en coordonnées relatives au cœur (à côté de la créature, loin des plans). */
export const AVATAR_HOME = { x: 1, y: 1 };

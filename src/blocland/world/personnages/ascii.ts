// Les modèles des personnages en cubes, décrits par couches ASCII. Module pur : ni React, ni Three.js.

/** Un cube d'un modèle, en repère propre (visage côté y = 0). Les vues le lisent comme un cube du monde. */
export interface CubeDeModele {
  x: number;
  y: number;
  z: number;
  /** Couleur de base ; les faces du dessus et de droite sont dérivées par la vue. */
  color: string;
  /** Couleur explicite du dessus. */
  top?: string;
}

type Layer = string[];

/**
 * Construit des cubes à partir de couches ASCII (une couche par hauteur z, de bas en haut).
 * Chaque caractère est une clé de `palette` ; « . » = vide. Ligne = y, colonne = x.
 */
export function fromLayers(layers: Layer[], palette: Record<string, string | { color: string; top?: string }>): CubeDeModele[] {
  const cubes: CubeDeModele[] = [];
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

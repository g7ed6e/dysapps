// Les genres de décor rangés en objets : le décor les dessine en formes, pas en cubes (./decorMesh.ts).
// (Le genre d'un décor se lit dans ./decor.ts, avec la grille : la marche en a besoin.)
export { kindOf } from './decor';

/** Les genres de décor rangés en objets ; les autres restent des cubes. */
export const PROP_KINDS = ['arbre', 'sapin', 'buisson', 'fleur', 'champignon', 'rocher', 'souche', 'roseau', 'cristal'] as const;

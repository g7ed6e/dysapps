// Le maillage de la pose en vague (GD-6, Blocland, ./wave.ts) : les cubes de la vague ajoutés à la fin des maillages
// du terrain, un par matériau. Calcul pur, sans Three.js ; à part de ./wave.ts pour que le mailleur reste dans le
// paquet de la 3D, chargé à la demande.
import type { VoxelCube } from './cube';
import { buildMesh, type MeshGroup, type MeshOptions } from './mesher';
import type { PlanDeLaVague } from './wave';

/** La part de la vague dans un groupe de faces du terrain : ses sommets et ses indices, à la fin du groupe. */
export interface QueueDeLaVague {
  /** Le premier sommet de la vague dans le groupe ; ceux d'avant sont le terrain, qui ne bouge pas. */
  premierSommet: number;
  /** Le nombre d'indices du terrain, avant ceux de la vague. */
  premierIndice: number;
  /** Le rang (dans l'ordre de la vague) du cube de chaque sommet de la vague. */
  rangDuSommet: number[];
  /**
   * Le nombre d'indices de la vague à dessiner quand les `n + 1` premiers cubes de l'ordre sont partis (`n` de 0 à tous
   * moins un) : un cube pas encore parti n'est pas dessiné.
   */
  indicesJusquA: number[];
}

export interface GroupeAvecLaVague {
  groupe: MeshGroup;
  /** La vague dans ce groupe, ou rien (un matériau que la partie n'a pas). */
  vague: QueueDeLaVague | null;
}

/**
 * Le maillage du terrain pendant la vague : le terrain sans la partie (une géométrie par matériau, faces visibles
 * seulement), et les cubes de la vague ajoutés à la fin du groupe de leur matériau. La vague partage les maillages du
 * terrain : pas un appel de dessin de plus pour un matériau que le terrain a déjà ; un matériau que seule la partie
 * porte (absent du terrain sans elle) ouvre un groupe de plus, donc un appel de dessin de plus pendant la vague. Chaque cube de la vague garde ses faces de côté et du
 * dessus, puisqu'il descend seul ; le dessous, que la caméra ne voit jamais (elle regarde d'en haut), n'est pas dessiné.
 * `options` : celles du terrain (les dessous sous l'eau, Blocland). Les cubes partis sont les premiers de la vague dans chaque groupe : la 3D n'en dessine que le début (`indicesJusquA`).
 */
export function maillageAvecLaVague(terrain: readonly VoxelCube[], cubes: readonly VoxelCube[], plan: PlanDeLaVague, options: MeshOptions = {}): GroupeAvecLaVague[] {
  const groupes = new Map<string, GroupeAvecLaVague>();
  for (const groupe of buildMesh([...terrain], [], options)) groupes.set(groupe.key, { groupe, vague: null });
  plan.ordre.forEach((c, rang) => {
    for (const g of buildMesh([cubes[c]])) {
      if (g.face === 'bottom') continue;
      let v = groupes.get(g.key);
      // Un matériau absent du terrain : un groupe neuf, un appel de dessin de plus le temps de la vague.
      if (!v) {
        v = { groupe: { ...g, positions: [], normals: [], uvs: [], indices: [] }, vague: null };
        groupes.set(g.key, v);
      }
      const q = (v.vague ??= { premierSommet: v.groupe.positions.length / 3, premierIndice: v.groupe.indices.length, rangDuSommet: [], indicesJusquA: [] });
      const base = v.groupe.positions.length / 3;
      v.groupe.positions.push(...g.positions);
      v.groupe.normals.push(...g.normals);
      v.groupe.uvs.push(...g.uvs);
      for (const i of g.indices) v.groupe.indices.push(base + i);
      for (let s = 0; s < g.positions.length / 3; s++) q.rangDuSommet.push(rang);
    }
    for (const v of groupes.values()) if (v.vague) v.vague.indicesJusquA[rang] = v.groupe.indices.length - v.vague.premierIndice;
  });
  // Un matériau qui n'arrive qu'avec un cube plus haut : rien à dessiner avant lui.
  for (const v of groupes.values()) if (v.vague) for (let r = 0; r < plan.ordre.length; r++) v.vague.indicesJusquA[r] ??= 0;
  return [...groupes.values()];
}

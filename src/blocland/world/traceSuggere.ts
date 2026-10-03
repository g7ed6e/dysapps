// Le tracé renforcé de l'ouvrage que désigne la flèche de la Carte (GD-7, PR 2, décision du directeur artistique) : la
// liaison suggérée reste un fantôme, en pointillé, mais ses tirets sont plus épais et plus foncés que ceux des autres
// fantômes, pour qu'elle se lise de bout en bout jusqu'à la rive d'arrivée, sur l'eau bleue. C'est le même élément mis
// en avant que la flèche, pas un second : il n'existe qu'avec elle, sur la Carte. Calcul pur (sans Three.js), lu par la
// 3D (three/traceSuggere.ts) et la 2D (pixel/WorldCanvas2D.tsx).
import type { Cell } from './paths';

/** Un tiret sur deux cases, puis une case vide ; la dernière case (la rive d'arrivée) est toujours dessinée. */
const TIRET = 2;
const VIDE = 1;

/** Les cases dessinées du tracé (`trace`, de bout en bout) : deux cases sur trois, et toujours la dernière. */
export function casesDesTirets(trace: readonly Cell[]): Cell[] {
  return trace.filter((_, i) => i % (TIRET + VIDE) < TIRET || i === trace.length - 1);
}

/**
 * La forme d'un tiret, en cases : un liseré clair, plus large qu'une case (`lisere`, 1,5), une plaque posée juste
 * au-dessus du tablier ou de l'eau, et dessus un cœur foncé en pavé (`coeur`, 0,9) ; le liseré le détache de l'eau
 * bleue, le cœur le rend plus foncé que les fantômes (bleu clair translucide). Hauteurs au-dessus de la case (`z + 1` :
 * le dessus du tablier). Le liseré n'a que son dessus (la Carte voit d'en haut) : 2 triangles, le cœur 10.
 */
export const TIRET_SUGGERE = {
  lisere: { large: 1.5, bas: 1.05, haut: 1.05, couleur: '#eef6ff' },
  coeur: { large: 0.9, bas: 1.05, haut: 1.5, couleur: '#14335c' },
} as const;

/** Les deux couches d'un tiret, de dessous à dessus : le liseré clair, puis le cœur foncé (une constante : rien à allouer par image). */
export const COUCHES_DU_TIRET = [TIRET_SUGGERE.lisere, TIRET_SUGGERE.coeur] as const;

/** La géométrie du tracé : plaques et pavés sans dessous, en triangles (positions x, hauteur, y), et leur couleur (0 liseré, 1 cœur). */
export interface FormeDuTrace {
  positions: Float32Array;
  normals: Float32Array;
  /** Par sommet : 0 le liseré, 1 le cœur. */
  parties: Uint8Array;
  triangles: number;
}

/**
 * Les faces visibles d'un pavé (sans dessous), centré en (cx, cy), de `large` de côté, de `bas` à `haut` : les cinq, ou
 * le dessus seul pour une plaque (`bas` = `haut`).
 */
function pave(out: number[], nrm: number[], cx: number, cy: number, large: number, bas: number, haut: number): void {
  const x0 = cx - large / 2;
  const x1 = cx + large / 2;
  const z0 = cy - large / 2;
  const z1 = cy + large / 2;
  // Chaque face : quatre coins (dans le sens qui la tourne vers dehors), sa normale.
  const faces: [number[][], number[]][] = [
    [[[x0, haut, z0], [x0, haut, z1], [x1, haut, z1], [x1, haut, z0]], [0, 1, 0]],
    [[[x0, bas, z1], [x1, bas, z1], [x1, haut, z1], [x0, haut, z1]], [0, 0, 1]],
    [[[x1, bas, z0], [x0, bas, z0], [x0, haut, z0], [x1, haut, z0]], [0, 0, -1]],
    [[[x1, bas, z1], [x1, bas, z0], [x1, haut, z0], [x1, haut, z1]], [1, 0, 0]],
    [[[x0, bas, z0], [x0, bas, z1], [x0, haut, z1], [x0, haut, z0]], [-1, 0, 0]],
  ];
  for (const [c, n] of bas === haut ? faces.slice(0, 1) : faces)
    for (const k of [0, 1, 2, 0, 2, 3]) {
      out.push(...c[k]);
      nrm.push(...n);
    }
}

/** La forme du tracé renforcé de la liaison `trace` (de bout en bout), dans le repère de la scène 3D (x, hauteur, y). */
export function formeDuTrace(trace: readonly Cell[]): FormeDuTrace {
  return formeDesTirets(casesDesTirets(trace));
}

/** La forme des tirets déjà choisis (`casesDesTirets`, que la vue calcule une fois par liaison). */
export function formeDesTirets(tirets: readonly Cell[]): FormeDuTrace {
  const pos: number[] = [];
  const nrm: number[] = [];
  const parties: number[] = [];
  for (const c of tirets) {
    for (const [k, p] of COUCHES_DU_TIRET.entries()) {
      const avant = pos.length;
      pave(pos, nrm, c.x + 0.5, c.y + 0.5, p.large, c.z + p.bas, c.z + p.haut);
      for (let i = avant; i < pos.length; i += 3) parties.push(k);
    }
  }
  return { positions: Float32Array.from(pos), normals: Float32Array.from(nrm), parties: Uint8Array.from(parties), triangles: pos.length / 9 };
}

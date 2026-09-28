// Les formes que partagent plusieurs sentinelles : le dragon assis (Volcan, Phare, Château), dessiné dans un repère
// posé sur le socle (`base`) et à l'échelle `e`, pour tenir dans les huit blocs.
import { pointe } from '../gabarit';
import { devant, facette, fuseau, pose, type Anneau, type Peindre, type Trace, type V3 } from '../peint';
import { orbites, tube, veineSur, type Atelier } from '../sentinelle';

/** Un repère sur le socle : relevé de `base`, agrandi de `e` (sans déformer), décalé de `z`. */
export const surLeSocle = (T: Trace, base: number, e: number, z = 0): Trace => pose(T, (p) => [p[0] * e, base + p[1] * e, z + p[2] * e]);

// ---------- Le dragon assis ----------

const CORPS_DU_DRAGON: Anneau[] = [
  [0, 1.2, 1.0, 0.2],
  [1.0, 1.35, 1.1, 0.2],
  [3.2, 1.0, 0.8, 0.1],
  [4.3, 0.6, 0.55, 0],
];
const TETE_DU_DRAGON: Anneau[] = [
  [4.1, 0.5, 0.5, -0.1],
  [5.3, 0.56, 0.5, -0.38],
  [5.9, 0.38, 0.34, -0.32],
];
/** La hauteur du dragon assis, à l'échelle 1 (le bout des cornes). */
export const HAUTEUR_DU_DRAGON = 7;

/** Un dragon assis, sept blocs de haut à l'échelle 1 : ses ailes repliées sur le dos, ou déployées (dessinées à part). */
export function dragonAssis(T: Trace, a: Atelier, ailes: 'repliees' | 'deployees'): void {
  fuseau(T, CORPS_DU_DRAGON, 6, a.moussue((k, j) => k === 0 && j % 2 === 0), { bas: false });
  fuseau(T, TETE_DU_DRAGON, 5, a.pierre, { bas: false });
  for (const s of [-1, 1]) {
    pointe(T, [s * 0.25, 5.75, -0.3], 0.11, 1.3455, a.pierre, [0.35, 0, -s * 0.15], 3);
    if (ailes === 'repliees') pointe(T, [s * 0.85, 1.8, 0.75], 0.55, 3.2, a.pierre, [0.25, 0, -s * 0.12], 4, 0.1);
  }
  tube(
    T,
    [
      [0.7, 0.2, 1.1],
      [1.5, 0.14, 0.3],
      [1.35, 0.1, -0.75],
    ],
    [0.32, 0.2, 0],
    3,
    a.pierre,
  );
  orbites(T, a, 0, 5.12, devant(TETE_DU_DRAGON, 5, 5.12).z, 0.2, 0.12);
}

/** Le ventre du dragon : trois chevrons de braise. */
export function ventreDuDragon(T: Trace, pe: Peindre): void {
  for (const y of [1.25, 1.95, 2.65])
    veineSur(
      T,
      CORPS_DU_DRAGON,
      6,
      [
        [-0.48, y + 0.16],
        [0, y - 0.1],
        [0.48, y + 0.16],
      ],
      0.1,
      pe,
    );
}

/** Les ailes déployées du dragon, en plaques minces (deux faces), du dos vers le haut et le dehors. */
export function ailesDeployees(T: Trace, pe: Peindre): void {
  for (const s of [-1, 1]) {
    const pts: V3[] = [
      [s * 0.5, 2.2, 0.8],
      [s * 2.0, 2.9, 0.8],
      [s * 2.35, 4.9, 0.8],
      [s * 1.3, 4.3, 0.8],
      [s * 0.5, 3.9, 0.8],
    ];
    facette(T, pts, [s * 1.3, 3.6, 2], pe);
    facette(
      T,
      pts.map(([x, y, z]): V3 => [x, y, z + 0.06]),
      [s * 1.3, 3.6, -1],
      pe,
    );
  }
}

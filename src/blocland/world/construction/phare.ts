// Le phare de Grimoire (6e, décision 16) : chaque étape finie de son plan laisse la place à une pièce du phare de
// référence (world/decor/phare.ts).
import { type ArchipelagoId, islandDef } from '../map';
import { COULEURS_DU_PHARE, PHARES, type PieceDuPhare, type PoseDuPhare } from '../decor/phare';
import { type Couleur, couleurDeMatiere } from '../palette';
import type { Cell } from '../view';
import type { VoxelCube } from '../../Voxel';
import { decalageDesPlans, getPlan, planCells } from '../plans';
import { cle } from './genres';

/**
 * Le phare de Grimoire (décision 16 du cadrage) : le plan « Le phare de Grimoire » (les murs) donne, une fois fini, le
 * fût du phare de référence et ses bandes (world/decor/phare.ts) ; le plan suivant (le toit) donne la galerie, la
 * lanterne et le cône. Tant qu'une étape n'est pas finie, ses cases posées restent des blocs taillés, en crème (le fût)
 * au lieu du verre provisoire.
 */
const PHARE_DE_GRIMOIRE = {
  archipel: '6e',
  ile: 'french-6e-reading',
  etapes: [
    { plan: 'french-6e-reading-1', pieces: ['anneau', 'fut'] },
    { plan: 'french-6e-reading-2', pieces: ['galerie', 'lanterne', 'toit'] },
  ],
} as const satisfies { archipel: ArchipelagoId; ile: string; etapes: readonly { plan: string; pieces: readonly PieceDuPhare[] }[] };

/** Le crème des cases posées du phare, tant que leur étape n'est pas finie. */
export const CREME_DU_PHARE: Couleur = COULEURS_DU_PHARE.fut;

/** Le phare de Grimoire dans un monde : les cases que le modèle remplace, celles encore en chantier, et sa pose. */
export interface PhareDeGrimoire {
  /** Les cases des étapes finies (clés `x,y,z`), que le modèle remplace. */
  remplacees: Set<string>;
  /** Les cases des étapes pas encore finies. */
  enCours: Set<string>;
  /** Les cases remplacées, pour le toucher. */
  cellules: Cell[];
  /** Où poser le modèle, et ses pièces (vides tant qu'aucune étape n'est finie). */
  pose: PoseDuPhare;
}

/**
 * Le phare de Grimoire, s'il est dans ce monde : ses étapes, finies ou non, lues sur les cubes (une étape est finie
 * quand toutes ses cases sont posées). Posé au centre de l'emprise de la tour (ses murs), pied au sol. `null` hors du
 * 6e ou tant que la tour n'a aucune case dans le monde (une île fermée ne montre pas ses plans ; l'île de la Tour
 * n'existe qu'au 6e).
 */
export function phareDeGrimoire(cubes: VoxelCube[], a: ArchipelagoId = PHARE_DE_GRIMOIRE.archipel): PhareDeGrimoire | null {
  const P = PHARE_DE_GRIMOIRE;
  if (a !== P.archipel) return null;
  const tour = new Map<string, VoxelCube>();
  for (const c of cubes) if (c.tag === P.ile && !c.quest) tour.set(cle(c.x, c.y, c.z), c);
  if (!tour.size) return null;
  const def = islandDef(P.ile);
  const remplacees = new Set<string>();
  const enCours = new Set<string>();
  const cellules: Cell[] = [];
  const pieces = new Set<PieceDuPhare>();
  let emprise: Cell[] | null = null;
  let muted = false;
  for (const e of P.etapes) {
    const plan = getPlan(e.plan);
    if (!plan) continue;
    const d = decalageDesPlans(plan);
    const cases = planCells(plan).map((c) => ({ x: def.core.x + c.x + d.x, y: def.core.y + c.y + d.y, z: def.altitude + c.z + d.z + 1 }));
    emprise ??= cases;
    const posees = cases.map((c) => tour.get(cle(c.x, c.y, c.z)));
    // Une étape pas encore dans le monde (la précédente n'est pas finie) : les suivantes non plus.
    if (posees.some((c) => !c)) break;
    muted ||= posees.some((c) => c?.muted);
    const finie = posees.every((c) => !c?.ghost);
    for (const c of cases) (finie ? remplacees : enCours).add(cle(c.x, c.y, c.z));
    if (finie) {
      cellules.push(...cases);
      for (const p of e.pieces) pieces.add(p);
    }
  }
  if (!emprise || (!remplacees.size && !enCours.size)) return null;
  return { remplacees, enCours, cellules, pose: poseDuPhare(a, emprise, pieces, muted) };
}

/** La pose du phare du 6e sur l'emprise de sa tour : au centre, pied au sol, sans socle. */
function poseDuPhare(a: ArchipelagoId, emprise: Cell[], pieces: Set<PieceDuPhare>, muted: boolean): PoseDuPhare {
  const xs = emprise.map((c) => c.x);
  const ys = emprise.map((c) => c.y);
  const pied = Math.min(...emprise.map((c) => c.z));
  const { H, r, emprise: cote } = PHARES['6e'];
  return {
    cx: (Math.min(...xs) + Math.max(...xs) + 1) / 2,
    cz: (Math.min(...ys) + Math.max(...ys) + 1) / 2,
    pied,
    y: pied,
    H,
    r,
    emprise: cote,
    // Huit pans : deux faces à plat vers la caméra (face au sud et à l'est).
    rot: Math.PI / 8,
    pierre: couleurDeMatiere(a, 'pierre'),
    verre: couleurDeMatiere(a, 'verre'),
    muted,
    pieces,
  };
}

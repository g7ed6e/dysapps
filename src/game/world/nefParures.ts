// Les trois parures de l'aéronef au repos du 3e (GD-25, règle des parures, décision du mainteneur du 23 octobre 2026) :
// elles se posent comme les trois temps de la Nef de GD-21. La figure de proue coûte 6 marbres, le pavois 10 quartz ;
// les feux ne se paient pas : ils arrivent avec deux lieux du 3e restaurés (ou deux Gardiens du 3e rallumés dans la
// grille), toujours après les deux premières. Un plan à part, `nef-parures`, rangé avec les autres dans `world.parts` :
// les cases de la figure de proue en bas (z = 0), celles du pavois au-dessus (z = 1) ; rien n'est écrit pour les feux.
// Ni XP, ni coffre, ni succès : la récompense, c'est la Nef complète. Les parures n'existent que dans le monde ouvert
// du 3e : la grille et Blocland ne les montrent pas. Code pur.
import type { BiomeId, BlockId } from '../biomes';
import { beatenGuardians } from './vehicle';
import type { PlanCell, PlanDef } from './plans';

/** L'identifiant du plan des parures dans la sauvegarde. Il ne change jamais. */
export const NEF_PARURES_ID = 'nef-parures';

/** Le bloc de la figure de proue (le marbre, gagné au Belvédère et au Grenier) et celui du pavois (le quartz, à l'Abri). */
const MARBRE: BlockId = 'maths-3e-geometry';
const QUARTZ: BlockId = 'maths-3e-statistics';

/** Ce que coûte chaque parure payée. */
const PARURES_COST = { proue: 6, pavois: 10 } as const;

/** Le port du 3e : le lieu du plan, qui ne se pose nulle part dans la grille. */
const PORT_3E: BiomeId = 'maths-3e-functions';

const row = (n: number, z: number, block: BlockId): PlanCell[] => Array.from({ length: n }, (_, x) => ({ x, y: 0, z, block }));

/**
 * Le plan des parures : la figure de proue en bas (z = 0), puis le pavois (z = 1). Ne jamais changer le nombre ni la
 * place de ses 16 cases : à la lecture de la sauvegarde, une clé hors du plan est jetée sans remboursement (les blocs
 * posés seraient perdus). Le test des parures fige ce nombre et ces clés.
 */
export const NEF_PARURES_PLAN: PlanDef = {
  id: NEF_PARURES_ID,
  biome: PORT_3E,
  name: 'Les parures de la Nef',
  origin: { x: 0, y: 0 },
  zone: 'nef',
  cells: [...row(PARURES_COST.proue, 0, MARBRE), ...row(PARURES_COST.pavois, 1, QUARTZ)],
  reward: { xp: 0, chest: {} },
  done: 'La Nef est complète.',
};

/** Le plan des parures, s'il porte cet identifiant (la lecture de la sauvegarde). */
export const getParures = (id: string): PlanDef | undefined => (id === NEF_PARURES_ID ? NEF_PARURES_PLAN : undefined);

/**
 * Les lieux restaurés (ou Gardiens du 3e rallumés dans la grille) qu'attendent les feux : autant que la grille demande de
 * Gardiens pour la dernière forme de la Nef (`navire-reacteur`).
 */
export const PARURES_GUARDIANS = 2;

/** Où en sont les parures : 0, aucune ; 1, la figure de proue ; 2, le pavois aussi ; 3, les feux aussi (la Nef complète). */
export type ParuresLook = 0 | 1 | 2 | 3;

type Progress = Record<string, { stars: number }>;

/** Les feux sont arrivés : assez de lieux du 3e restaurés, ou de Gardiens du 3e rallumés ; `missing`, les lieux qu'il reste à achever. */
export function paruresFeux(progress: Progress, achieved: number): { kit: boolean; missing: number } {
  const kit = achieved >= PARURES_GUARDIANS || beatenGuardians('3e', progress) >= PARURES_GUARDIANS;
  return { kit, missing: kit ? 0 : PARURES_GUARDIANS - achieved };
}

const keysAt = (z: number) => NEF_PARURES_PLAN.cells.filter((c) => c.z === z).map((c) => `${c.x},${c.y},${c.z}`);
const PROUE_KEYS = keysAt(0);
const PAVOIS_KEYS = keysAt(1);

/**
 * Les parures posées, déduites des cases : la figure de proue quand toutes ses cases le sont, le pavois quand toutes
 * les cases le sont, les feux en plus quand ils sont arrivés. Jamais une parure avant celle qui la précède.
 */
export function paruresLook(parts: Readonly<Record<string, readonly string[]>>, progress: Progress, achieved: number): ParuresLook {
  const done = new Set(parts[NEF_PARURES_ID] ?? []);
  if (!PROUE_KEYS.every((k) => done.has(k))) return 0;
  if (!PAVOIS_KEYS.every((k) => done.has(k))) return 1;
  return paruresFeux(progress, achieved).kit ? 3 : 2;
}

/**
 * Les cases qu'on peut poser maintenant, dans l'ordre : celles de la figure de proue tant qu'il en reste une, puis
 * celles du pavois. « Poser » ne pose jamais le pavois avant la tête, même sans un seul marbre.
 */
export function paruresOpenCells(parts: Readonly<Record<string, readonly string[]>>): PlanCell[] {
  const done = new Set(parts[NEF_PARURES_ID] ?? []);
  const key = (c: PlanCell) => `${c.x},${c.y},${c.z}`;
  const proue = NEF_PARURES_PLAN.cells.filter((c) => c.z === 0 && !done.has(key(c)));
  return proue.length ? proue : NEF_PARURES_PLAN.cells.filter((c) => c.z === 1 && !done.has(key(c)));
}

/** Le nom de chaque parure, dans l'ordre de la pose (les mots de la fiche). */
export const PARURE_NAMES = ['La figure de proue', 'Les plaques bleues', 'Les feux'] as const;

/** Ce que dit la fiche après la pose de chaque parure. */
export const PARURE_POSED = ['La figure de proue est posée.', 'Les plaques bleues sont posées.', 'Les feux sont posés.'] as const;

/** Ce que dit la fiche quand les trois parures sont posées. */
export const NEF_COMPLETE = 'La Nef est complète.';

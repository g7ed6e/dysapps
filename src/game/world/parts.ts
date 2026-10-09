/**
 * Les parties du bâtiment d'un lieu (GD-6) : une par mission du lieu, posées toutes seules, dans l'ordre du dessin, à la
 * première fois que l'élève termine chacune de ses missions. Une partie n'est pas un nouveau dessin : c'est un ensemble
 * de cases des trois plans du bâtiment (`plans.ts`), qui restent l'unité de la sauvegarde (`world.parts`, une liste de
 * cases posées par plan) et du dessin. Rien de neuf n'est donc enregistré, et un monde identique se dessine à l'identique.
 *
 * - 3 missions : une partie par plan.
 * - 2 missions : le premier plan, puis les deux autres ensemble.
 * - 4 missions : le premier plan en deux, par la hauteur (« Le bas du four de Rouxel », puis « Le haut… »), puis les
 *   deux autres.
 * - 5 missions (GD-14) : le premier plan en trois, par la hauteur (« Le bas… », « Le milieu… », « Le haut… »), puis les
 *   deux autres.
 * Le lieu de la LV2 compte les missions d'une seule langue (les deux langues en ont autant).
 */
import { BIOMES, type BiomeDef, type BiomeId } from '../biomes';
import { isPlanDone, planCells, plansFor, type PlanDef } from './plans';

export interface Partie {
  biome: BiomeId;
  /** Son rang dans le bâtiment, de 1 à `total`. */
  rang: number;
  total: number;
  /** Son nom, tiré de ceux des plans (`docs/contenu/<lieu>.md`, « ## Les plans »). */
  nom: string;
  /** Les cases qu'elle pose, plan par plan (clés de `planCells`). */
  cases: { plan: PlanDef; keys: string[] }[];
}

/** Un lieu a au plus cinq parties, comme il a au plus cinq missions (GD-14). */
const PARTIES_MAX = 5;

/** Les missions d'un lieu qui comptent pour son bâtiment : sur le lieu de la LV2, celles d'une seule langue. */
function missionsDuBatiment(biome: Pick<BiomeDef, 'exercises'>): number {
  const langue = biome.exercises.find((x) => x.lv2 !== undefined)?.lv2;
  return langue === undefined ? biome.exercises.length : biome.exercises.filter((x) => x.lv2 === langue).length;
}

/** Le nombre de parties du bâtiment d'un lieu : autant que de missions, de 2 à 5 (0 sans bâtiment). */
export function nombreDeParties(biome: Pick<BiomeDef, 'id' | 'exercises'>): number {
  if (plansFor(biome.id).length < 3) return 0;
  return Math.max(2, Math.min(PARTIES_MAX, missionsDuBatiment(biome)));
}

/** Un nom en milieu de phrase, après deux-points : sa minuscule (« Partie posée : le toit de la cabane »). */
export const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** La phrase de la pose dans le monde (GD-6) : « Partie posée : le toit de la cabane. », une par partie. */
export const phraseDesPartiesPosees = (posees: readonly Partie[]) => posees.map((p) => `Partie posée : ${minuscule(p.nom)}.`).join(' ');

/** « Le four de Rouxel » → « du four de Rouxel » : le complément de « le bas », « le haut » (l'article contracté). */
function complement(nom: string): string {
  const m = /^(Le|La|Les|L’|L')\s?(.*)$/.exec(nom);
  if (!m) return `de ${nom}`;
  const [, article, reste] = m;
  if (article === 'Le') return `du ${reste}`;
  if (article === 'Les') return `des ${reste}`;
  if (article === 'La') return `de la ${reste}`;
  return `de l’${reste}`;
}

/**
 * Deux noms réunis (le lieu à deux missions) : « Le toit de la forge » et « La cour de la forge » donnent « Le toit et la
 * cour de la forge » quand ils finissent par le même complément, sinon les deux noms entiers.
 */
function ensemble(a: string, b: string): string {
  const fin = / (de la|du|de l’|de l'|des|de) .+$/;
  const ca = fin.exec(a)?.[0];
  if (ca && b.endsWith(ca)) return `${a.slice(0, -ca.length)} et ${minuscule(b.slice(0, -ca.length))}${ca}`;
  return `${a} et ${minuscule(b)}`;
}

/** Le premier plan coupé en deux par la hauteur : les rangées du bas jusqu'à la moitié des cases au moins, puis le reste. */
function enDeux(plan: PlanDef): [string[], string[]] {
  const cells = planCells(plan);
  const hauteurs = [...new Set(cells.map((c) => c.z))].sort((a, b) => a - b);
  let seuil = hauteurs[hauteurs.length - 1];
  for (const z of hauteurs) {
    if (cells.filter((c) => c.z <= z).length * 2 >= cells.length) {
      seuil = z;
      break;
    }
  }
  const bas = cells.filter((c) => c.z <= seuil).map((c) => c.key);
  const haut = cells.filter((c) => c.z > seuil).map((c) => c.key);
  // Un plan d'une seule rangée se coupe au milieu de ses cases.
  if (!haut.length) {
    const tout = cells.map((c) => c.key);
    const m = Math.ceil(tout.length / 2);
    return [tout.slice(0, m), tout.slice(m)];
  }
  return [bas, haut];
}

/** Le premier plan coupé en trois par la hauteur : chaque morceau prend les rangées jusqu'au tiers, puis aux deux tiers des cases au moins. */
function enTrois(plan: PlanDef): [string[], string[], string[]] {
  const cells = planCells(plan);
  const hauteurs = [...new Set(cells.map((c) => c.z))].sort((a, b) => a - b);
  const seuil = (part: number) => hauteurs.find((z) => cells.filter((c) => c.z <= z).length * 3 >= cells.length * part) ?? hauteurs[hauteurs.length - 1];
  const [s1, s2] = [seuil(1), seuil(2)];
  const bas = cells.filter((c) => c.z <= s1).map((c) => c.key);
  const milieu = cells.filter((c) => c.z > s1 && c.z <= s2).map((c) => c.key);
  const haut = cells.filter((c) => c.z > s2).map((c) => c.key);
  // Trop peu de rangées pour trois morceaux : les cases se coupent en trois, dans l'ordre du dessin.
  if (!milieu.length || !haut.length) {
    const tout = cells.map((c) => c.key);
    const a = Math.ceil(tout.length / 3);
    const b = Math.ceil((tout.length * 2) / 3);
    return [tout.slice(0, a), tout.slice(a, b), tout.slice(b)];
  }
  return [bas, milieu, haut];
}

const CACHE = new Map<BiomeId, Partie[]>();

/** Les parties du bâtiment d'un lieu, dans l'ordre où elles se posent. */
export function partiesDe(id: BiomeId): Partie[] {
  const cached = CACHE.get(id);
  if (cached) return cached;
  const biome = BIOMES.find((b) => b.id === id);
  const plans = plansFor(id);
  const n = biome ? nombreDeParties(biome) : 0;
  const tout = (plan: PlanDef) => ({ plan, keys: planCells(plan).map((c) => c.key) });
  let parties: Omit<Partie, 'biome' | 'rang' | 'total'>[] = [];
  if (n === 2) {
    parties = [
      { nom: plans[0].name, cases: [tout(plans[0])] },
      { nom: ensemble(plans[1].name, plans[2].name), cases: [tout(plans[1]), tout(plans[2])] },
    ];
  } else if (n === 3) {
    parties = plans.slice(0, 3).map((p) => ({ nom: p.name, cases: [tout(p)] }));
  } else if (n === 4) {
    const [bas, haut] = enDeux(plans[0]);
    parties = [
      { nom: `Le bas ${complement(plans[0].name)}`, cases: [{ plan: plans[0], keys: bas }] },
      { nom: `Le haut ${complement(plans[0].name)}`, cases: [{ plan: plans[0], keys: haut }] },
      { nom: plans[1].name, cases: [tout(plans[1])] },
      { nom: plans[2].name, cases: [tout(plans[2])] },
    ];
  } else if (n === 5) {
    const [bas, milieu, haut] = enTrois(plans[0]);
    parties = [
      { nom: `Le bas ${complement(plans[0].name)}`, cases: [{ plan: plans[0], keys: bas }] },
      { nom: `Le milieu ${complement(plans[0].name)}`, cases: [{ plan: plans[0], keys: milieu }] },
      { nom: `Le haut ${complement(plans[0].name)}`, cases: [{ plan: plans[0], keys: haut }] },
      { nom: plans[1].name, cases: [tout(plans[1])] },
      { nom: plans[2].name, cases: [tout(plans[2])] },
    ];
  }
  const out = parties.map((p, i) => ({ ...p, biome: id, rang: i + 1, total: parties.length }));
  CACHE.set(id, out);
  return out;
}

/** Une partie est posée quand toutes ses cases le sont (posées par une mission, ou à la main avant GD-6). */
export function partiePosee(partie: Partie, parts: Record<string, string[]>): boolean {
  return partie.cases.every(({ plan, keys }) => {
    const done = new Set(parts[plan.id] ?? []);
    return keys.every((k) => done.has(k));
  });
}

/** Les parties posées d'un lieu. */
export function partiesPosees(id: BiomeId, parts: Record<string, string[]>): number {
  return partiesDe(id).filter((p) => partiePosee(p, parts)).length;
}

/** La prochaine partie à poser d'un lieu, ou `null` si le bâtiment est fini. */
export function prochainePartie(id: BiomeId, parts: Record<string, string[]>): Partie | null {
  return partiesDe(id).find((p) => !partiePosee(p, parts)) ?? null;
}

/** La première partie d'un lieu est-elle posée ? (la condition de l'escalier taillé) */
export function premierePartiePosee(id: BiomeId, parts: Record<string, string[]>): boolean {
  const first = partiesDe(id)[0];
  return Boolean(first) && partiePosee(first, parts);
}

export interface PoseDesParties {
  parts: Record<string, string[]>;
  /** Les parties posées à l'instant, dans l'ordre. */
  posees: Partie[];
  /** Les plans que ces parties ont terminés (leur XP, leur réplique, une ligne du journal). */
  plansFinis: PlanDef[];
}

/**
 * Pose les parties qu'un lieu doit avoir : autant que de missions terminées (`terminees`), dans l'ordre du dessin, en
 * comptant celles déjà posées. Sans effet si le compte y est (une mission rejouée, une sauvegarde déjà à jour).
 */
export function poserLesParties(id: BiomeId, parts: Record<string, string[]>, terminees: number): PoseDesParties {
  const parties = partiesDe(id);
  const voulues = Math.min(parties.length, terminees);
  let posees = parties.filter((p) => partiePosee(p, parts)).length;
  if (posees >= voulues) return { parts, posees: [], plansFinis: [] };
  const avant = plansFor(id).filter((p) => isPlanDone(p, parts));
  const next = { ...parts };
  const nouvelles: Partie[] = [];
  for (const p of parties) {
    if (posees >= voulues) break;
    if (partiePosee(p, next)) continue;
    for (const { plan, keys } of p.cases) {
      const done = next[plan.id] ?? [];
      const have = new Set(done);
      // Les cases gardent l'ordre du plan : celles déjà posées d'abord, puis les nouvelles.
      next[plan.id] = [...done, ...keys.filter((k) => !have.has(k))];
    }
    nouvelles.push(p);
    posees += 1;
  }
  const plansFinis = plansFor(id).filter((p) => !avant.includes(p) && isPlanDone(p, next));
  return { parts: next, posees: nouvelles, plansFinis };
}

/**
 * Les missions terminées d'un lieu, au moins une fois, quels que soient le niveau, les étoiles et les jokers : celles
 * dont un exercice a une partie enregistrée. Un exercice s'appelle `<lieu>-<mission>-<suite>` ; la mission la plus longue
 * qui convient gagne (`word` ne prend pas `word-classes`), comme le lieu le plus long.
 */
export function missionsTerminees(progress: Record<string, { attempts: number }>, id: BiomeId): number {
  const biome = BIOMES.find((b) => b.id === id);
  if (!biome) return 0;
  const longer = BIOMES.filter((b) => b.id.length > id.length && b.id.startsWith(`${id}-`)).map((b) => `${b.id}-`);
  const types = biome.exercises.map((x) => x.id).sort((a, b) => b.length - a.length);
  const done = new Set<string>();
  for (const [ex, p] of Object.entries(progress)) {
    if (!(p.attempts > 0) || !ex.startsWith(`${id}-`) || longer.some((l) => ex.startsWith(l))) continue;
    const rest = ex.slice(id.length + 1);
    const type = types.find((t) => rest.startsWith(`${t}-`));
    if (type) done.add(type);
  }
  return done.size;
}

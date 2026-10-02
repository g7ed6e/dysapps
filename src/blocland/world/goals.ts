// Le prochain objectif d'une île, un seul, avec sa jauge : ce qu'il manque pour le plan en cours, pour l'ouvrage le
// moins cher, ou pour le Bloc-Navire. Code pur, partagé par le panneau d'île. Les noms des archipels viennent de
// l'appelant (`noms` : ceux de l'univers affiché, GD-1).
import { blockCount, getBiome, type BiomeId, type BlockId } from '../biomes';
import type { GameState } from '../engine';
import { canLaunch, currentPlan, planStatus } from '../engine';
import {
  KIND_NAME,
  archipelagoOf,
  buildableBridges,
  conditionMet,
  isArchipelagoReached,
  otherEnd,
  pathTo,
  payableBlocks,
  previousArchipelago,
  reachableIslands,
  remainingVoyages,
  type MotsDesGardiens,
  type NomsArchipels,
} from './archipelago';
import { VEHICLE_NAME, beatenGuardians, stageAt, stageTo } from './vehicle';

/** « le pont vers la Mine », « l'escalier taillé vers le Carrefour ». */
function ouvrageName(kind: keyof typeof KIND_NAME, to: string): string {
  const name = KIND_NAME[kind].toLowerCase();
  return `${/^[aeiouy]/.test(name) ? 'l’' : 'le '}${name}${to ? ` vers ${to}` : ' '}`;
}

/** Le prochain objectif d'une île : une phrase, et une jauge (`have` sur `need`) quand il se compte. */
export interface Goal {
  text: string;
  have: number;
  need: number;
  /** Tout est là pour le faire tout de suite (la jauge, pleine, n'a plus rien à dire). */
  ready?: boolean;
}

/** Ce qu'il manque d'un plan, en blocs : « 16 blocs de bois », « 10 briques et 3 blocs de verre ». */
function missingBlocks(state: GameState, missing: [BlockId, number][]) {
  const left = missing.map(([b, n]) => [b, Math.max(0, n - (state.stock[b] ?? 0))] as const).filter(([, n]) => n > 0);
  const need = missing.reduce((sum, [, n]) => sum + n, 0);
  const have = missing.reduce((sum, [b, n]) => sum + Math.min(n, state.stock[b] ?? 0), 0);
  const words = left
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([b, n]) => blockCount(b, n));
  return { text: words.join(' et '), have, need, ready: left.length === 0 };
}

/**
 * Le prochain objectif d'une île, **un seul** : deux objectifs à la fois (du bois pour la cabane, des blocs pour un
 * pont) mélangeaient deux comptes. Ordre : le Bloc-Navire prêt à partir ; ce qu'on peut faire tout de suite (poser les
 * blocs d'un plan, construire un ouvrage, poser les blocs du navire) ; sinon l'objectif le plus proche (le moins de
 * blocs à gagner), le plan en cas d'égalité. `null` s'il n'y a rien à dire (île fermée, tout construit).
 */
export function nextGoalInfo(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens): Goal | null {
  const stage = stageAt(island);
  const launch = stage ? canLaunch(state, stage) : null;
  if (stage && launch?.ok) return { text: `${cap(VEHICLE_NAME)} est prêt : embarque vers les ${noms[stage.to]} !`, have: 1, need: 1, ready: true };
  type Candidate = Goal & { ready: boolean };
  const candidates: Candidate[] = [];
  const current = currentPlan(state, island);
  if (current && !current.allDone) {
    const status = planStatus(state, current.plan);
    const missing = Object.entries(status.missing).filter(([, n]) => (n ?? 0) > 0) as [BlockId, number][];
    if (missing.length) {
      const m = missingBlocks(state, missing);
      candidates.push({
        text: m.ready ? `Tu as tout pour finir ${current.plan.name} : pose tes blocs` : `Encore ${m.text} pour ${current.plan.name}`,
        have: m.have,
        need: m.need,
        ready: m.ready,
      });
    }
  }
  const world = { progress: state.progress, plans: state.world.parts };
  const bridges = buildableBridges(state.world.links, island, world).filter((b) => conditionMet(b, state.world.links, world));
  if (bridges.length) {
    const cheapest = bridges.reduce((a, b) => (b.cost < a.cost ? b : a));
    const to = getBiome(otherEnd(cheapest, island))?.name ?? cheapest.to;
    const have = Math.min(cheapest.cost, payableBlocks(state.stock));
    const left = cheapest.cost - have;
    const what = ouvrageName(cheapest.kind, to);
    candidates.push({
      text: left > 0 ? `Encore ${left} bloc${left > 1 ? 's' : ''} pour ${what}` : `Tu peux construire ${what}`,
      have,
      need: cheapest.cost,
      ready: left === 0,
    });
  }
  // Le chantier du Bloc-Navire (sur un port, tant que son voyage n'est pas fait).
  if (stage && launch && !launch.ok && launch.reason !== 'construit' && launch.reason !== 'loin') {
    if (launch.reason === 'gardiens') {
      const left = launch.missing;
      candidates.push({
        text: `${cap(mots.navireGardiensManquants(left, noms[stage.from]))} pour ${stage.short}`,
        have: Math.max(0, stage.guardians - left),
        need: stage.guardians,
        ready: false,
      });
    } else {
      const status = planStatus(state, stage);
      const missing = Object.entries(status.missing).filter(([, n]) => (n ?? 0) > 0) as [BlockId, number][];
      const m = missingBlocks(state, missing);
      candidates.push({
        text: m.ready ? `Tu as tout pour ${VEHICLE_NAME} : pose tes blocs` : `Encore ${m.text} pour ${VEHICLE_NAME}`,
        have: m.have,
        need: m.need,
        ready: m.ready,
      });
    }
  }
  if (!candidates.length) return null;
  const pick = candidates.find((c) => c.ready) ?? candidates.reduce((a, b) => (b.need - b.have < a.need - a.have ? b : a));
  return { text: `${cap(pick.text)}.`, have: pick.have, need: pick.need, ready: pick.ready };
}

/** La phrase du prochain objectif seule (voir `nextGoalInfo`). */
export function nextGoal(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens): string | null {
  return nextGoalInfo(state, island, noms, mots)?.text ?? null;
}

/**
 * Ce que dit la créature d'une île fermée : l'ouvrage précis qui mène ici (depuis quelle île, combien de blocs,
 * quelle condition), ou l'île à ouvrir d'abord quand on est encore trop loin.
 */
export function lockedHint(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens): string {
  const bridges = state.world.links;
  const open = reachableIslands(bridges);
  const world = { progress: state.progress, plans: state.world.parts };
  // Une île d'un autre archipel : il faut le Bloc-Navire.
  const archipelago = archipelagoOf(island);
  if (!isArchipelagoReached(archipelago.classe, bridges)) {
    const left = remainingVoyages(island, bridges);
    const stage = stageTo(left[0].toClasse)!;
    const port = getBiome(stage.biome)?.name ?? stage.biome;
    const head = `Pas si vite ! Mon île est dans les ${noms[archipelago.classe]}`;
    if (left.length > 1) return `${head}. Va d’abord jusqu’aux ${noms[previousArchipelago(archipelago.classe)!.classe]} avec ${VEHICLE_NAME}.`;
    const travel = archipelago.travel === 'mer' ? 'de la mer' : archipelago.travel === 'airs' ? 'des airs' : 'du ciel';
    const launch = canLaunch(state, stage);
    if (launch.ok) return `${head}, de l’autre côté ${travel}. ${cap(VEHICLE_NAME)} est prêt sur ${port} : embarque !`;
    if (launch.reason === 'gardiens') {
      const k = stage.guardians - beatenGuardians(stage.from, state.progress);
      return `${head}, de l’autre côté ${travel}. ${cap(VEHICLE_NAME)} attend sur ${port} : ${mots.navireGardiensManquants(k, noms[stage.from])}, puis embarque.`;
    }
    const status = planStatus(state, stage);
    const n = status.total - status.done;
    return `${head}, de l’autre côté ${travel}. Finis ${VEHICLE_NAME} sur ${port} : encore ${n} bloc${n > 1 ? 's' : ''}.`;
  }
  const here = buildableBridges(bridges, island, world);
  if (here.length) {
    const b = here.reduce((a, c) => (c.cost < a.cost ? c : a));
    const from = getBiome(otherEnd(b, island))?.name ?? '';
    const cond = conditionMet(b, bridges, world) ? '' : ` ${conditionTextShort(b, mots.ouvrageGardien)}`;
    return `Pas si vite ! Pour venir ici, construis ${ouvrageName(b.kind, '')}depuis ${from} : ${b.cost} blocs.${cond}`;
  }
  // Trop loin : la première île fermée sur le chemin est celle à ouvrir d'abord.
  const path = pathTo(island);
  const next = path.map((b) => (open.has(b.from) ? b.to : b.from)).find((id) => !open.has(id));
  const name = next && next !== island ? getBiome(next)?.name : undefined;
  return name
    ? `Pas si vite ! Ouvre d’abord ${name} : de là, un ouvrage mène jusqu’ici.`
    : 'Pas si vite ! Construis d’abord un chemin jusqu’à mon île, puis reviens me voir.';
}

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// `gardien` : la phrase de l'univers (un Gardien vaincu dans Blocland, rallumé dans Archipéo).
function conditionTextShort(b: { kind: keyof typeof KIND_NAME }, gardien: string): string {
  return b.kind === 'escalier' ? 'Il faut aussi un premier plan terminé de l’autre côté.' : b.kind === 'tunnel' || b.kind === 'col' ? gardien : '';
}

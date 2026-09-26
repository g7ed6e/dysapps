// Le prochain objectif d'une île, en une phrase : ce qu'il manque pour le plan en cours, ou pour l'ouvrage le
// moins cher que l'on peut payer. Code pur, partagé par le panneau d'île.
import { BLOCKS, getBiome, type BiomeId } from '../biomes';
import type { BloclandState } from '../engine';
import { currentPlan, planStatus } from '../engine';
import { KIND_NAME, buildableBridges, conditionMet, otherEnd, pathTo, payableBlocks, reachableIslands } from './archipelago';

/** « le pont vers la Mine », « l'escalier taillé vers le Carrefour ». */
function ouvrageName(kind: keyof typeof KIND_NAME, to: string): string {
  const name = KIND_NAME[kind].toLowerCase();
  return `${/^[aeiouy]/.test(name) ? 'l’' : 'le '}${name}${to ? ` vers ${to}` : ' '}`;
}

/**
 * La phrase du prochain objectif, ou `null` s'il n'y a rien à dire (île fermée, tout construit).
 * Exemples : « Encore 13 bois pour la cabane de Mousso, ou 3 blocs pour le pont vers Mine des lettres. »
 */
export function nextGoal(state: BloclandState, island: BiomeId): string | null {
  const parts: string[] = [];
  const current = currentPlan(state, island);
  if (current && !current.allDone) {
    const status = planStatus(state, current.plan);
    const missing = Object.entries(status.missing).filter(([, n]) => (n ?? 0) > 0) as [keyof typeof BLOCKS, number][];
    const have = missing.filter(([b, n]) => (state.inventory[b] ?? 0) >= n);
    if (missing.length && have.length === missing.length) parts.push(`Tu as tout pour finir ${current.plan.name} : pose tes blocs`);
    else if (missing.length) {
      const [block, n] = missing.reduce((a, b) => (b[1] - (state.inventory[b[0]] ?? 0) > a[1] - (state.inventory[a[0]] ?? 0) ? b : a));
      const left = n - (state.inventory[block] ?? 0);
      parts.push(`Encore ${left} ${BLOCKS[block].name.toLowerCase()} pour ${current.plan.name}`);
    }
  }
  const world = { progress: state.progress, plans: state.village.plans };
  const bridges = buildableBridges(state.village.bridges, island, world).filter((b) => conditionMet(b, state.village.bridges, world));
  if (bridges.length) {
    const cheapest = bridges.reduce((a, b) => (b.cost < a.cost ? b : a));
    const to = getBiome(otherEnd(cheapest, island))?.name ?? cheapest.to;
    const left = cheapest.cost - payableBlocks(state.inventory);
    const what = ouvrageName(cheapest.kind, to);
    parts.push(left > 0 ? `${left} bloc${left > 1 ? 's' : ''} pour ${what}` : `tu peux construire ${what}`);
  }
  if (!parts.length) return null;
  const text = parts.length === 2 ? `${parts[0]}, ou ${parts[1]}` : parts[0];
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

/**
 * Ce que dit la créature d'une île fermée : l'ouvrage précis qui mène ici (depuis quelle île, combien de blocs,
 * quelle condition), ou l'île à ouvrir d'abord quand on est encore trop loin.
 */
export function lockedHint(state: BloclandState, island: BiomeId): string {
  const bridges = state.village.bridges;
  const open = reachableIslands(bridges);
  const world = { progress: state.progress, plans: state.village.plans };
  const here = buildableBridges(bridges, island, world);
  if (here.length) {
    const b = here.reduce((a, c) => (c.cost < a.cost ? c : a));
    const from = getBiome(otherEnd(b, island))?.name ?? '';
    const cond = conditionMet(b, bridges, world) ? '' : ` ${conditionTextShort(b)}`;
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

function conditionTextShort(b: { kind: keyof typeof KIND_NAME }): string {
  return b.kind === 'escalier'
    ? 'Il faut aussi un premier plan terminé de l’autre côté.'
    : b.kind === 'tunnel' || b.kind === 'col'
      ? 'Il faut aussi avoir vaincu le Gardien de l’autre côté.'
      : '';
}

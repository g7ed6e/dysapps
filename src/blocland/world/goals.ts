// Le prochain objectif d'une île, en une phrase : ce qu'il manque pour le plan en cours, ou pour l'ouvrage le
// moins cher que l'on peut payer. Code pur, partagé par le panneau d'île.
import { BLOCKS, getBiome, type BiomeId } from '../biomes';
import type { BloclandState } from '../engine';
import { currentPlan, planStatus } from '../engine';
import { KIND_NAME, buildableBridges, conditionMet, otherEnd, payableBlocks } from './archipelago';

/** « le pont vers la Mine », « l'escalier taillé vers le Carrefour ». */
function ouvrageName(kind: keyof typeof KIND_NAME, to: string): string {
  const name = KIND_NAME[kind].toLowerCase();
  return `${/^[aeiouy]/.test(name) ? 'l’' : 'le '}${name} vers ${to}`;
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

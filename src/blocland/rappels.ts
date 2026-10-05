// La créature qui se souvient (GD-4, étape 1, décidée le 2 octobre 2026 ; lot du 3 octobre 2026) : quand une mission
// de son île a des questions à revoir aujourd'hui (la répétition espacée, ./review.ts, inchangée), la créature fait
// signe dans le monde et, à l'arrivée sur son île, propose de reprendre : « Reprendre » lance les révisions dues de
// l'île, « Plus tard » ne coûte rien et la fait taire jusqu'à la visite suivante. Ce « Plus tard » est retenu le temps
// de la visite (`sessionStorage`, sinon le temps de la page), jamais dans la sauvegarde.
import { useCallback, useSyncExternalStore } from 'react';
import { getBiome, missionsJouables, type BiomeId } from './biomes';
import { todayISO, type SpacedItem } from './engine';
import { questsToReview, type ReviewQuest } from './review';
import { islandsOf, type ArchipelagoId } from './world/archipelago';
import type { SigneDeCreature } from './world/view';
import type { Lv2Choice } from '../core/settings';
import { signeDeLaCreature } from './world/commandes';
import type { GameState } from './engine';

/** Le paramètre d'adresse d'une révision lancée par la créature : à la fin, on revient sur son île. */
export const PARAM_REVISION = 'revision';

/** Parmi les révisions dues (`questsToReview`), celles d'une île, une par mission jouable (la LV2 des Réglages). */
function revisionsDeLIleParmi(dues: readonly ReviewQuest[], biome: BiomeId, lv2?: Lv2Choice): ReviewQuest[] {
  const b = getBiome(biome);
  if (!b) return [];
  const jouables = new Set(missionsJouables(b, lv2).map((m) => m.id));
  return dues.filter((q) => q.biome === biome && jouables.has(q.type));
}

/** Les révisions dues aujourd'hui sur une île ouverte, une par mission jouable (la LV2 des Réglages), dans l'ordre du catalogue. */
export function revisionsDeLIle(spaced: SpacedItem[], links: string[], biome: BiomeId, lv2?: Lv2Choice, today = todayISO()): ReviewQuest[] {
  return revisionsDeLIleParmi(questsToReview(spaced, links, today), biome, lv2);
}

/** L'adresse d'une révision lancée depuis la créature : la mission, qui met les questions dues en tête, puis l'île. */
export function cheminDeRevision(q: Pick<ReviewQuest, 'path'>): string {
  return `${q.path}?${PARAM_REVISION}=1`;
}

/**
 * Les créatures qui font signe dans un archipel : celles dont l'île a des révisions dues, sauf après « Plus tard »
 * pendant la visite. Chacune avec l'icône de la notion de son île.
 */
export function creaturesQuiFontSigne(
  spaced: SpacedItem[],
  links: string[],
  archipel: ArchipelagoId,
  remises: ReadonlySet<BiomeId>,
  lv2?: Lv2Choice,
  today = todayISO(),
): SigneDeCreature[] {
  return signesParmi(questsToReview(spaced, links, today), archipel, remises, lv2);
}

/** Les créatures qui font signe dans un archipel, parmi des révisions dues déjà calculées (une fois pour toute la Carte). */
export function signesParmi(dues: readonly ReviewQuest[], archipel: ArchipelagoId, remises: ReadonlySet<BiomeId>, lv2?: Lv2Choice): SigneDeCreature[] {
  return islandsOf(archipel)
    .filter((b) => !remises.has(b.id) && revisionsDeLIleParmi(dues, b.id, lv2).length > 0)
    .map((b) => ({ id: b.id, icone: b.icon }));
}

/**
 * Un seul signe par créature (affordance-blocland.md §8 ; GD-7, PR 3) : parmi les créatures d'un archipel, celle dont la
 * commande est prête et suggérée (`suggeree` : la commande de la prochaine destination) montre le bloc demandé ; les
 * autres gardent leur signe des révisions (`revisions`, déjà calculé), ou rien.
 */
export function signesDesCreatures(
  state: Pick<GameState, 'stock' | 'world'>,
  archipel: ArchipelagoId,
  revisions: readonly SigneDeCreature[],
  suggeree: string | undefined,
): SigneDeCreature[] {
  return islandsOf(archipel).flatMap((b): SigneDeCreature[] => {
    const revision = revisions.find((r) => r.id === b.id);
    const signe = signeDeLaCreature(state, b.id, { revisions: Boolean(revision), suggeree });
    if (!signe) return [];
    return [signe.genre === 'commande' ? { id: b.id, icone: 'blocks', bloc: signe.bloc } : revision!];
  });
}

// ---- « Plus tard », le temps de la visite

const CLE = 'dysapps:revisions-plus-tard';
let enMemoire: BiomeId[] = [];
let instantane: ReadonlySet<BiomeId> | null = null;
const abonnes = new Set<() => void>();

function lire(): BiomeId[] {
  try {
    const brut = sessionStorage.getItem(CLE);
    const liste = brut ? (JSON.parse(brut) as unknown) : [];
    // Une valeur abîmée ou une île inconnue ne cache rien.
    return Array.isArray(liste) ? liste.filter((x): x is BiomeId => typeof x === 'string' && Boolean(getBiome(x))) : [];
  } catch {
    return enMemoire;
  }
}

/** Les îles dont la créature a entendu « Plus tard » pendant la visite. */
export function remisesAPlusTard(): ReadonlySet<BiomeId> {
  instantane ??= new Set(lire());
  return instantane;
}

/** « Plus tard » : la créature de cette île ne propose plus rien, et ne fait plus signe, jusqu'à la visite suivante. */
export function remettreAPlusTard(id: BiomeId): void {
  const liste = [...new Set([...lire(), id])];
  enMemoire = liste;
  try {
    sessionStorage.setItem(CLE, JSON.stringify(liste));
  } catch {
    // Stockage indisponible : la mémoire de la page suffit.
  }
  instantane = null;
  abonnes.forEach((f) => f());
}

/** Pour les tests : oublie les « Plus tard » de la visite. */
export function oublierLesRemises(): void {
  enMemoire = [];
  try {
    sessionStorage.removeItem(CLE);
  } catch {
    // Rien à oublier.
  }
  instantane = null;
  abonnes.forEach((f) => f());
}

function abonner(f: () => void) {
  abonnes.add(f);
  return () => void abonnes.delete(f);
}

/** Les « Plus tard » de la visite, partagés par le monde (le signe) et le panneau de l'île (la proposition). */
export function usePlusTard(): { remises: ReadonlySet<BiomeId>; remettre: (id: BiomeId) => void } {
  const remises = useSyncExternalStore(abonner, remisesAPlusTard, remisesAPlusTard);
  const remettre = useCallback((id: BiomeId) => remettreAPlusTard(id), []);
  return { remises, remettre };
}

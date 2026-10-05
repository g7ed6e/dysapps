// Les commandes des habitants (GD-7, points 4 et 5 ; PR 3) : la créature d'une île de français, de maths ou d'anglais
// demande quelques blocs d'une autre île de l'archipel (ou le bloc assemblé de l'archipel) ; livrée, la commande pose
// une petite construction chez elle (./petitesConstructions.ts). Mot neutre : une « demande » ; dans Blocland, une
// « commande » (la « demande » y est la mission depuis GD-5). Code pur, sans React ni coordonnées du monde.
//
// Les commandes et leurs phrases viennent de docs/contenu/<lieu>.md (« ## Les demandes »), que `npm run contenu` écrit
// dans requests.json. La règle d'arrivée est celle du directeur artistique (3 octobre 2026, GD-7, « Les précisions de
// la PR 3 ») :
// - qui peut commander : la créature d'une île ouverte où l'élève a réussi au moins une mission, quand l'île qui donne
//   le bloc demandé est ouverte (bloc assemblé : les îles de sa recette) et que sa commande n'est pas encore livrée ;
//   une créature, une commande, une seule fois ; Grimoire, en plus, quand « La lanterne du phare » est bâtie ;
// - quand : la première d'un archipel après son premier ouvrage construit (`SEUIL_DE_LA_PREMIERE_COMMANDE`), puis à
//   la fin d'une mission réussie, d'un ouvrage construit ou d'une livraison, jamais pendant une consigne, une au plus ;
// - laquelle : la première dans l'ordre de docs/contenu/archipel.md parmi celles qui peuvent commander ;
// - combien : trois ouvertes au plus par archipel ; celles d'un archipel quitté restent et ne bloquent pas le suivant ;
// - l'ordre de la liste : l'ordre d'arrivée, la plus ancienne en tête.
//
// La sauvegarde : `world.requests`, facultatif, la liste ordonnée des commandes arrivées et pas encore livrées (l'ordre
// d'arrivée ne se déduit pas du reste : une commande ne doit jamais disparaître parce qu'une autre île devient
// éligible). Une commande livrée sort de la liste ; ce qui la dit livrée, ce sont les cases de sa petite construction
// dans `world.parts`, sans champ nouveau.
import { frenchTypography } from '../../core/typographie';
import { BIOMES, blockCount, blockName, type BiomeId, type BlockId } from '../biomes';
import type { GameState, World } from '../engine';
import { archipelagoOf, getBridge, isBiomeUnlocked, type ArchipelagoId } from './archipelago';
import { recetteDe } from './assemblage';
import { missionsTerminees } from './parties';
import { casesDeLaPetiteConstruction, estPosee } from './petitesConstructions';
import { getPlan, isPlanDone } from './plans';
import REQUESTS from './requests.json';

/** Les phrases d'une commande dans un univers (jetons `{objet}`, `{blocs}`, `{à}` : voir `texteDeLaCommande`). */
export interface PhrasesDeCommande {
  /** La petite construction, avec son article (« le puits »). */
  name: string;
  /** La demande : le besoin, puis le lieu et le geste. */
  ask: string;
  /** Les blocs sont là. */
  ready: string;
  /** La petite construction est posée. */
  done: string;
}

export interface Commande {
  /** `<lieu>-request-<n>`, qui ne change jamais. */
  id: string;
  /** L'île de la créature qui commande. */
  biome: BiomeId;
  /** Le bloc demandé. */
  block: BlockId;
  /** Combien (2 à 4). */
  count: number;
  /** La petite construction qu'elle pose (`<lieu>-fixture-<n>`), clé de `world.parts`. */
  fixture: string;
  /** La commande n'arrive qu'une fois ce plan de l'île bâti (Grimoire, après « La lanterne du phare »). */
  afterPlan?: string;
  /** Les phrases de la commande, les mêmes dans Blocland et dans Archipéo. */
  blocland: PhrasesDeCommande;
}

/** Toutes les commandes, dans l'ordre de docs/contenu/archipel.md. */
export const COMMANDES: readonly Commande[] = REQUESTS as Commande[];

export function getCommande(id: string): Commande | undefined {
  return COMMANDES.find((c) => c.id === id);
}

/** La commande de la créature d'une île (une au plus). */
export function commandeDeLIle(biome: BiomeId): Commande | undefined {
  return COMMANDES.find((c) => c.biome === biome);
}

/** L'archipel d'une commande : celui de l'île de sa créature. */
export const archipelDeLaCommande = (c: Pick<Commande, 'biome'>): ArchipelagoId => archipelagoOf(c.biome).classe;

/** Trois commandes ouvertes au plus par archipel (GD-7, point 5). */
export const MAX_COMMANDES_OUVERTES = 3;

/**
 * Ce qui fait arriver la première commande d'un archipel : son premier ouvrage construit (`premier-ouvrage`, décidé par
 * le mainteneur le 3 octobre 2026), ou sa première mission réussie (`premiere-mission`, l'autre choix proposé). Une
 * seule constante à changer.
 */
export type SeuilDeLaPremiereCommande = 'premier-ouvrage' | 'premiere-mission';
export const SEUIL_DE_LA_PREMIERE_COMMANDE: SeuilDeLaPremiereCommande = 'premier-ouvrage';

/** L'élève a réussi au moins une mission de l'île (comme les parties du bâtiment, GD-6). */
const aJoueSurLIle = (progress: GameState['progress'], biome: BiomeId) => missionsTerminees(progress, biome) > 0;

/** Les commandes d'un archipel peuvent-elles arriver ? (`seuil` : `SEUIL_DE_LA_PREMIERE_COMMANDE`) */
export function seuilAtteint(
  state: Pick<GameState, 'progress' | 'world'>,
  a: ArchipelagoId,
  seuil: SeuilDeLaPremiereCommande = SEUIL_DE_LA_PREMIERE_COMMANDE,
): boolean {
  if (seuil === 'premiere-mission') return BIOMES.some((b) => b.classe === a && aJoueSurLIle(state.progress, b.id));
  // Un ouvrage payé : les liaisons gratuites (le couple de départ, déjà relié) ne comptent pas.
  return state.world.links.some((id) => {
    const b = getBridge(id);
    return Boolean(b && b.cost > 0 && archipelagoOf(b.from).classe === a);
  });
}

/** Les îles qui donnent le bloc demandé : son île, ou celles de la recette d'un bloc assemblé. */
export function ilesQuiDonnent(bloc: BlockId): BiomeId[] {
  const recette = recetteDe(bloc);
  const blocs = recette ? recette.ingredients.map((i) => i.bloc) : [bloc];
  return blocs.flatMap((b) => BIOMES.filter((x) => x.block === b).map((x) => x.id));
}

/** La commande est livrée : sa petite construction est posée. */
export function estLivree(world: Pick<World, 'parts'>, c: Commande): boolean {
  return estPosee(world.parts, c.fixture);
}

/** Les identifiants des commandes arrivées et pas encore livrées, dans l'ordre d'arrivée. */
export const commandesArrivees = (world: Pick<World, 'requests'>): readonly string[] => world.requests ?? [];

/** La créature de cette commande peut-elle commander maintenant (conditions a à d, et le plan de Grimoire) ? */
export function peutCommander(state: Pick<GameState, 'progress' | 'world'>, c: Commande): boolean {
  const { links, parts } = state.world;
  if (commandesArrivees(state.world).includes(c.id) || estLivree(state.world, c)) return false;
  if (!isBiomeUnlocked(c.biome, links) || !aJoueSurLIle(state.progress, c.biome)) return false;
  if (!ilesQuiDonnent(c.block).every((id) => isBiomeUnlocked(id, links))) return false;
  if (c.afterPlan) {
    const plan = getPlan(c.afterPlan);
    if (!plan || !isPlanDone(plan, parts)) return false;
  }
  return true;
}

/** Les commandes ouvertes d'un archipel, dans l'ordre d'arrivée (la plus ancienne en tête). */
export function commandesOuvertes(world: Pick<World, 'requests'>, a: ArchipelagoId): Commande[] {
  return commandesArrivees(world)
    .map(getCommande)
    .filter((c): c is Commande => Boolean(c) && archipelDeLaCommande(c!) === a);
}

/** Les blocs sont dans l'inventaire. */
export function estPrete(state: Pick<GameState, 'stock'>, c: Commande): boolean {
  return (state.stock[c.block] ?? 0) >= c.count;
}

/** La seule commande mise en avant d'un archipel : la plus ancienne des prêtes (GD-7, point 5). */
export function commandeMiseEnAvant(state: Pick<GameState, 'stock' | 'world'>, a: ArchipelagoId): Commande | undefined {
  return commandesOuvertes(state.world, a).find((c) => estPrete(state, c));
}

/**
 * À la fin d'une mission réussie, d'un ouvrage construit ou d'une livraison dans l'archipel `a` : une commande au plus
 * arrive, la première de l'ordre de docs/contenu/archipel.md parmi celles qui peuvent commander, tant que l'archipel en
 * a moins de trois ouvertes et que son seuil est atteint. Jamais pendant une consigne : l'appelant ne l'appelle qu'à ces
 * trois moments. `arrivee` : la commande arrivée, sinon `null` (et l'état est rendu tel quel).
 */
export function faireArriverUneCommande<S extends Pick<GameState, 'progress' | 'world'>>(
  state: S,
  a: ArchipelagoId,
  seuil: SeuilDeLaPremiereCommande = SEUIL_DE_LA_PREMIERE_COMMANDE,
): { state: S; arrivee: Commande | null } {
  if (!seuilAtteint(state, a, seuil) || commandesOuvertes(state.world, a).length >= MAX_COMMANDES_OUVERTES) return { state, arrivee: null };
  const arrivee = COMMANDES.find((c) => archipelDeLaCommande(c) === a && peutCommander(state, c));
  if (!arrivee) return { state, arrivee: null };
  return { state: { ...state, world: { ...state.world, requests: [...commandesArrivees(state.world), arrivee.id] } }, arrivee };
}

export type Livraison<S> = { ok: true; state: S; commande: Commande } | { ok: false; state: S; reason: 'pas-ouverte' | 'blocs'; manque?: number };

/**
 * Livrer : les blocs sortent de l'inventaire, la petite construction se pose (toutes ses cases dans `world.parts`) et la
 * commande sort de la liste. Ni coffre ni XP : une petite construction n'est pas un plan. Sans assez de blocs, rien ne
 * change (l'interface ne propose « Livrer » que quand la commande est prête).
 */
export function livrerLaCommande<S extends Pick<GameState, 'stock' | 'world'>>(state: S, id: string): Livraison<S> {
  const c = getCommande(id);
  const cases = c && casesDeLaPetiteConstruction(c.fixture);
  if (!c || !cases || !commandesArrivees(state.world).includes(id)) return { ok: false, state, reason: 'pas-ouverte' };
  const have = state.stock[c.block] ?? 0;
  if (have < c.count) return { ok: false, state, reason: 'blocs', manque: c.count - have };
  const requests = commandesArrivees(state.world).filter((x) => x !== id);
  const { requests: _avant, ...world } = state.world;
  void _avant;
  return {
    ok: true,
    commande: c,
    state: {
      ...state,
      stock: { ...state.stock, [c.block]: have - c.count },
      world: { ...world, parts: { ...state.world.parts, [c.fixture]: cases.map((k) => k.key) }, ...(requests.length ? { requests } : {}) },
    },
  };
}

/**
 * Une phrase d'une commande, ses jetons remplacés : `{objet}` par le nombre et le nom du bloc de Mes blocs (« 4
 * briques »), `{blocs}` par le même nom sans nombre (« briques »), `{à}` par le lieu où l'on assemble (`lieu`, « à la
 * Fabrique »). L'objet porte ainsi le même nom partout. Une espace insécable avant « ! ? : ; ».
 */
export function texteDeLaCommande(c: Commande, phrase: 'ask' | 'ready' | 'done', lieu: string): string {
  return frenchTypography(c.blocland[phrase].replaceAll('{objet}', blockCount(c.block, c.count)).replaceAll('{blocs}', blockName(c.block, c.count)).replaceAll('{à}', lieu));
}

/**
 * Le signe d'une créature (affordance-blocland.md §8 et 9 ; arbitrage du directeur artistique) : un seul, la plaque.
 * La commande d'abord, si elle est prête ET suggérée (`suggeree` : la commande de la prochaine destination), avec le
 * bloc demandé ; sinon la plaque des révisions (`revisions` : la créature a des révisions dues aujourd'hui, et pas de
 * « Plus tard ») ; sinon rien. Prête mais pas suggérée : pas de signe de commande.
 */
export type SigneDeLaCreature = { genre: 'commande'; bloc: BlockId; commande: string } | { genre: 'revision' };

export function signeDeLaCreature(
  state: Pick<GameState, 'stock' | 'world'>,
  ile: BiomeId,
  { revisions, suggeree }: { revisions: boolean; suggeree?: string },
): SigneDeLaCreature | null {
  const c = commandeDeLIle(ile);
  if (c && c.id === suggeree && commandesArrivees(state.world).includes(c.id) && estPrete(state, c))
    return { genre: 'commande', bloc: c.block, commande: c.id };
  return revisions ? { genre: 'revision' } : null;
}

/**
 * Le jeu sans les commandes : pour un univers qui ne les montre pas (sans `commandes` dans ses textes), ni liste, ni
 * suggestion, ni petite construction dessinée. La sauvegarde, elle, ne change pas.
 */
export function sansCommandes<S extends Pick<GameState, 'world'>>(state: S): S {
  const fixtures = new Set(COMMANDES.map((c) => c.fixture));
  const aRetirer = state.world.requests !== undefined || Object.keys(state.world.parts).some((id) => fixtures.has(id));
  if (!aRetirer) return state;
  const { requests: _r, ...world } = state.world;
  void _r;
  return { ...state, world: { ...world, parts: Object.fromEntries(Object.entries(state.world.parts).filter(([id]) => !fixtures.has(id))) } };
}

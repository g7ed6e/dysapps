// La commande d'un habitant, vue par le monde ouvert (GD-20, point 4, lot L1 « Livrer ») : le seul fichier qui lise à la
// fois les commandes de la grille (world/requests.ts : leur bloc, leur nombre, leur livraison, la même sauvegarde) et
// le monde continu (ses lieux, ses rôles, ses aménagements, les phrases de ses habitants). Le code pur du monde continu
// ne lit pas les commandes (isolation.test.ts) : il reçoit d'ici ses jetons tout faits.
//
// - La ligne de l'habitant, en tête du panneau de son lieu : la commande prête (« Livre 3 blocs de terre au Phare. »,
//   « Livrer »), sinon ce qui manque (« Il me faut 3 blocs de terre. C’est pour le potager. Joue une mission aux
//   Filets. », « Y aller », vers le lieu de la ressource, ou vers le lieu où l'on assemble pour un bloc assemblé, son nom
//   entier, celui de docs/contenu/assemblage.md). Les révisions dues (« Reprendre ») passent entre les deux : la page les
//   lit (`useResidentReminder`).
// - La remise : la consigne, la phrase de fin, l'aménagement qui se pose et son nombre d'éléments.
// - La commande prête que la suggestion porte, et son rang dans la suggestion (`suggestionOf`).
// - Les pastilles des habitants : la suggérée, puis une par commande prête, puis l'étape d'entraide, puis par lieu qui
//   a des révisions dues, trois au plus.
// - L'entraide (lot L2) : la quête ouverte du 6e (world/stories.ts, la même sauvegarde), son étape dans son lieu
//   (« Donne 2 blocs de bois aux Quais. », « Donner » ; « Apporte la lanterne au Phare. », « Apporter » ; ce qui manque
//   pour donner, la forme « demande »), sa remise (la caisse de « Donner », l'objet d'« Apporter »), et sa place dans la
//   suggestion, juste après la commande prête.
// Sans React ni Three.js : testé sous jsdom.
import { BIOMES, BLOCKS, blockCount, blockName, type BiomeId, type BlockId } from '../../biomes';
import type { GameState } from '../../engine/state';
import { recetteDe } from '../../world/assembly';
import { MATTE_GLASS, amenagementById } from '../../world/continu/amenagements';
import { placeById, placeOfIsland, type LevelPlan, type PlaceId } from '../../world/continu/levelPlan';
import { ENTRAIDE_PHRASES, HABITANT_PHRASES, filled, type PhraseTokens, type RemiseKind } from '../../world/continu/remise';
import { scenetteOf } from '../../world/continu/scenette';
import { COMMANDES, archipelDeLaCommande, commandeDeLIle, commandesArrivees, commandesOuvertes, estLivree, estPrete, getCommande, type Commande } from '../../world/requests';
import { STORY_XP, canTapStep, openStoryOf, type Story, type StoryStep } from '../../world/stories';
import type { RemisePlay } from './scene';

/** Où mène « Y aller » d'une commande à qui il manque des blocs : un lieu, ou le lieu de l'Escale où l'on assemble. */
export type HabitantGo = { place: PlaceId } | { port: 'chantier' };

/** La ligne de l'habitant d'un lieu, pour sa commande. */
export type HabitantLine =
  | { kind: 'livrer'; commande: string; role: string; text: string }
  | { kind: 'manque'; commande: string; role: string; text: string; go: HabitantGo };

/** Ce que les jetons valent pour une commande ; `auLieu`, le lieu de la phrase. */
export function tokensOf(c: Commande, auLieu: string): PhraseTokens {
  return { objet: blockCount(c.block, c.count), blocs: blockName(c.block, c.count), nom: c.blocland.name, auLieu };
}

/** Le lieu de l'habitant d'une commande (celui de l'île de sa créature). */
export const placeOfCommande = (c: Pick<Commande, 'biome'>): PlaceId | null => placeOfIsland(c.biome)?.id ?? null;

/** Le lieu qui donne le bloc d'une commande, ou, pour un bloc assemblé, le lieu de l'Escale où l'on assemble. */
export function sourceOf(c: Pick<Commande, 'block'>): HabitantGo | null {
  if (recetteDe(c.block)) return { port: 'chantier' };
  const island = BIOMES.find((b) => b.block === c.block)?.id;
  const place = island ? placeOfIsland(island) : undefined;
  return place ? { place: place.id } : null;
}

/**
 * La ligne de l'habitant de `place`, pour sa commande arrivée et pas encore livrée : prête, « Livrer » ; sinon ce qui
 * manque et « Y aller ». `assemblyAt` : le lieu où l'on assemble, dans sa forme « à », en entier (« à l’Entrepôt des
 * matériaux », `lieuDAssemblage`, écrit dans docs/contenu/assemblage.md).
 */
export function habitantLineOf(state: Pick<GameState, 'stock' | 'world'>, place: PlaceId, assemblyAt: string): HabitantLine | null {
  // Les îles des lieux sont celles du jeu (plan6e.ts, vérifié par son test).
  const c = commandeDeLIle(placeById(place).island as BiomeId);
  if (!c || !commandesArrivees(state.world).includes(c.id) || estLivree(state.world, c)) return null;
  const role = scenetteOf(place).role;
  if (estPrete(state, c)) return { kind: 'livrer', commande: c.id, role, text: filled(HABITANT_PHRASES.ready, tokensOf(c, placeById(place).at)) };
  const go = sourceOf(c);
  if (!go) return null;
  const at = 'port' in go ? assemblyAt : placeById(go.place).at;
  return { kind: 'manque', commande: c.id, role, text: filled('port' in go ? HABITANT_PHRASES.askAssembled : HABITANT_PHRASES.ask, tokensOf(c, at)), go };
}

/** La remise : la livraison d'une commande, ou une étape d'entraide faite d'un geste (« Donner », « Apporter »). */
export interface RemiseRequest {
  kind: RemiseKind;
  /** La commande livrée, ou la quête d'entraide dont l'étape se fait. */
  id: string;
  place: PlaceId;
  /** Ce que la scène pose : l'aménagement d'une commande, la caisse et ses blocs, l'objet apporté. */
  play: RemisePlay;
  /** Ses éléments : un par ressource livrée ou donnée ; un seul pour l'objet apporté. */
  elements: number;
  role: string;
  /** « Tu livres 3 blocs de terre pour le potager. », « Tu donnes 2 blocs de bois pour la lanterne. » */
  consigne: string;
  /** « Le potager est en place. » ; après « Donner », l'étape suivante (« Apporte la lanterne au Phare. »). */
  done: string;
  /** L'icône de la consigne et de « Vue simple » : le bloc livré ou donné, l'objet apporté. */
  block: BlockId;
  /** L'XP annoncée après la phrase de fin : celle d'une entraide finie (« Apporter »). */
  xp?: number;
}

/** La remise d'une commande du 6e qui a son aménagement dans le monde ouvert, sinon rien. */
export function remiseOf(id: string): RemiseRequest | null {
  const c = getCommande(id);
  const a = c && amenagementById(c.fixture);
  const place = c && placeOfCommande(c);
  if (!c || !a || !place || a.place !== place) return null;
  const t = tokensOf(c, placeById(place).at);
  return {
    kind: 'livrer',
    id: c.id,
    place,
    play: { place, amenagement: a.id },
    elements: a.elements.length,
    role: scenetteOf(place).role,
    consigne: filled(HABITANT_PHRASES.remise, t),
    done: filled(HABITANT_PHRASES.done, t),
    block: c.block,
  };
}

/**
 * Les commandes et l'entraide du niveau du plan se font-elles dans le monde ouvert (une de ses commandes au moins y a
 * son aménagement, et sa remise dans la scénette de son lieu) ? Au 6e, oui. Au 5e, pas encore : ses commandes et ses
 * quêtes sont écrites pour la grille (docs/contenu/, « Les demandes » ; docs/contenu/quetes.md), mais leurs aménagements
 * et leur remise ne sont pas dessinés dans le monde ouvert ; ses habitants n'y ont que leurs révisions dues.
 */
export function hasOpenWorldErrands(plan: LevelPlan): boolean {
  return COMMANDES.some((c) => archipelDeLaCommande(c) === plan.level && remiseOf(c.id) !== null);
}

/** L'entraide ouverte d'un niveau : sa quête, l'étape en cours, son rang, et le lieu du monde ouvert où elle se fait. */
export interface EntraideStep {
  story: Story;
  step: StoryStep;
  index: number;
  place: PlaceId;
}

/** L'entraide ouverte du niveau du plan, si son étape se fait dans un lieu du monde ouvert, sinon rien. */
export function entraideOf(plan: LevelPlan, state: Pick<GameState, 'world'>): EntraideStep | null {
  const o = openStoryOf(state.world, plan.level);
  const place = o && placeOfIsland(o.step.place)?.id;
  return o && place ? { ...o, place } : null;
}

/** La phrase d'une étape d'entraide, à son lieu (« Joue une mission aux Quais. », « Donne 2 blocs de bois aux Quais. »). */
export function stepPhrase(story: Pick<Story, 'name'>, step: StoryStep): string {
  const place = placeOfIsland(step.place);
  const auLieu = place?.at ?? '';
  if (step.kind === 'give') return filled(ENTRAIDE_PHRASES.stepGive, { objet: blockCount(step.block, step.count), auLieu });
  if (step.kind === 'bring') return filled(ENTRAIDE_PHRASES.stepBring, { nom: story.name, auLieu });
  return filled(ENTRAIDE_PHRASES.stepMission, { auLieu });
}

/** La ligne d'entraide de l'habitant d'un lieu : son étape à faire d'un geste, ou ce qui manque pour donner. */
export type EntraideLine =
  | { kind: 'donner' | 'apporter'; story: string; role: string; text: string }
  | { kind: 'manque'; story: string; role: string; text: string; go: HabitantGo };

/**
 * La ligne d'entraide de l'habitant de `place`, quand l'étape en cours se fait chez lui d'un geste : « Donner » (assez
 * de blocs dans le stock), « Apporter » ; sinon, pour donner, ce qui manque et « Y aller » (la forme « demande », pour
 * l'objet de l'entraide). Rien pour une étape « mission » : la liste des missions du lieu est juste en dessous, et la
 * suggestion la porte.
 */
export function entraideLineOf(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, place: PlaceId, assemblyAt: string): EntraideLine | null {
  const e = entraideOf(plan, state);
  if (!e || e.place !== place || e.step.kind === 'mission') return null;
  const role = scenetteOf(place).role;
  if (canTapStep(state, e.step)) return { kind: e.step.kind === 'give' ? 'donner' : 'apporter', story: e.story.id, role, text: stepPhrase(e.story, e.step) };
  if (e.step.kind !== 'give') return null;
  const go = sourceOf(e.step);
  if (!go) return null;
  const at = 'port' in go ? assemblyAt : placeById(go.place).at;
  const t = { objet: blockCount(e.step.block, e.step.count), blocs: blockName(e.step.block, e.step.count), nom: e.story.name, auLieu: at };
  return { kind: 'manque', story: e.story.id, role, text: filled('port' in go ? HABITANT_PHRASES.askAssembled : HABITANT_PHRASES.ask, t), go };
}

/** Les deux faces d'un bloc, en nombres, pour la 3D (son dessus, son côté). */
const facesOf = (block: BlockId) => ({ dessus: parseInt(BLOCKS[block].top.slice(1), 16), cote: parseInt(BLOCKS[block].side.slice(1), 16) });

/**
 * La remise d'une étape d'entraide faite d'un geste, telle qu'elle se présente maintenant : « Donner », la caisse et
 * ses blocs, la fin qui dit l'étape suivante ; « Apporter », l'objet qui passe de la main de Kéo à sa place, la fin
 * « posée », puis l'XP de l'entraide finie. Rien si l'étape ne peut pas se faire maintenant.
 */
export function entraideRemiseOf(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, id: string): RemiseRequest | null {
  const e = entraideOf(plan, state);
  if (!e || e.story.id !== id || !canTapStep(state, e.step)) return null;
  const role = scenetteOf(e.place).role;
  if (e.step.kind === 'give') {
    const following = e.story.steps[e.index + 1];
    const objet = blockCount(e.step.block, e.step.count);
    return {
      kind: 'donner',
      id,
      place: e.place,
      play: { place: e.place, caisse: { count: e.step.count, block: facesOf(e.step.block) } },
      elements: e.step.count,
      role,
      consigne: filled(ENTRAIDE_PHRASES.giveRemise, { objet, nom: e.story.name }),
      done: following ? stepPhrase(e.story, following) : filled(HABITANT_PHRASES.done, { nom: e.story.name }),
      block: e.step.block,
    };
  }
  const a = amenagementById(e.story.fixture);
  if (!a || a.place !== e.place) return null;
  return {
    kind: 'apporter',
    id,
    place: e.place,
    play: { place: e.place, amenagement: a.id, carry: true },
    elements: a.elements.length,
    role,
    consigne: filled(ENTRAIDE_PHRASES.bringRemise, { nom: e.story.name }),
    done: filled(HABITANT_PHRASES.done, { nom: e.story.name }),
    block: e.story.item,
    xp: STORY_XP,
  };
}

/** La pastille d'un habitant, au-dessus de son lieu : sa commande prête, son étape d'entraide, ou ses révisions dues. */
export interface HabitantSign {
  place: PlaceId;
  kind: 'commande' | 'entraide' | 'revision';
  /** Son icône : le bloc demandé pour une commande, l'objet pour l'entraide (rien pour des révisions : la notion). */
  block?: BlockId;
  /** La seule mise en avant : celle de la suggestion. */
  suggested: boolean;
  /** Ce que lit le lecteur d'écran (« Commande, blocs de terre, au Phare », « Entraide, la lanterne, au Phare »). */
  label: string;
}

/** Une couleur du monde continu (0xrrggbb) en couleur d'icône (« #rrggbb »). */
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/**
 * L'icône de l'objet d'une entraide tant qu'il n'est pas posé (consultant d'Archipéo, avis sur les lots L2 et L3) : la
 * lanterne éteinte, son verre mat sur les côtés et son chapeau de fer sombre, et non le jaune du bloc de la grille (la
 * lueur de la nuit, qui la dirait déjà allumée). Une fois posée, la pastille et la ligne s'en vont : le jaune ne se
 * montre plus qu'à la fin de la remise. Les autres objets gardent leur bloc.
 */
const UNLIT: Partial<Record<BlockId, { top: string; side: string }>> = { lantern: { top: '#4a4f55', side: hex(MATTE_GLASS.cote) } };

/** Les couleurs de l'icône de l'objet d'une entraide pas encore posé. */
export function entraideIcon(block: BlockId): { top: string; side: string } {
  return UNLIT[block] ?? { top: BLOCKS[block].top, side: BLOCKS[block].side };
}

/** Trois pastilles au plus à la fois (avis UX, point 3 : jamais un monde couvert de signes). */
export const MAX_SIGNS = 3;

/**
 * Les commandes prêtes du niveau du plan dans les lieux ouverts : celle du lieu où se tient Kéo (`here`) d'abord, puis `first`,
 * puis dans l'ordre d'arrivée.
 */
function readyInOpen(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, open: (place: PlaceId) => boolean, first?: string, here?: PlaceId | null): { c: Commande; place: PlaceId }[] {
  const rank = (c: Commande) => (here && placeOfCommande(c) === here ? 2 : c.id === first ? 1 : 0);
  const ready = commandesOuvertes(state.world, plan.level).filter((c) => estPrete(state, c));
  ready.sort((a, b) => rank(b) - rank(a));
  return ready.flatMap((c) => {
    const place = placeOfCommande(c);
    return place && open(place) ? [{ c, place }] : [];
  });
}

/** La commande prête que la suggestion peut porter : son lieu, et la phrase « prête » de son habitant. */
export interface ReadyCommande {
  commande: string;
  place: PlaceId;
  /** « Livre 3 blocs de terre au Phare. » */
  text: string;
}

/**
 * La commande prête que la suggestion porte, dans un lieu ouvert : celle de l'habitant chez qui se tient Kéo (`here`),
 * sinon celle de la prochaine destination du jeu (`first`) si elle est prête, sinon la première arrivée ; rien s'il n'y
 * en a pas.
 */
export function readyCommande(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, open: (place: PlaceId) => boolean, first?: string, here?: PlaceId | null): ReadyCommande | null {
  const [r] = readyInOpen(plan, state, open, first, here);
  return r ? { commande: r.c.id, place: r.place, text: filled(HABITANT_PHRASES.ready, tokensOf(r.c, placeById(r.place).at)) } : null;
}

/** Ce que la suggestion porte chez un habitant : sa commande prête, ou l'étape d'entraide (`mission` : jouer chez lui). */
export interface SuggestedAction {
  kind: 'livrer' | 'donner' | 'apporter' | 'mission';
  /** La commande, ou la quête d'entraide. */
  id: string;
  place: PlaceId;
  /** La phrase de la bulle (« Livre 3 blocs de terre au Phare. », « Apporte la lanterne au Phare. »). */
  text: string;
}

/**
 * L'étape d'entraide que la suggestion peut porter, dans un lieu ouvert : une mission à jouer chez l'habitant, ou un
 * geste qui peut se faire maintenant. Pas ce qui manque pour donner : comme une commande pas prête, elle attend, et la
 * prochaine mission garde la suggestion.
 */
export function entraideSuggestion(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, open: (place: PlaceId) => boolean): SuggestedAction | null {
  const e = entraideOf(plan, state);
  if (!e || !open(e.place)) return null;
  if (e.step.kind !== 'mission' && !canTapStep(state, e.step)) return null;
  const kind = e.step.kind === 'mission' ? 'mission' : e.step.kind === 'give' ? 'donner' : 'apporter';
  return { kind, id: e.story.id, place: e.place, text: stepPhrase(e.story, e.step) };
}

/**
 * Ce que la suggestion porte chez un habitant (GD-20, « Une seule prochaine action mise en avant », l'ordre de index.md) :
 * rien tant que Kéo se tient dans un lieu où il reste une mission jamais jouée (`hereToPlay`) ; sinon la commande prête ;
 * sinon l'étape d'entraide, juste après elle ; sinon rien (la prochaine mission garde la suggestion).
 */
export function suggestedAction(ready: ReadyCommande | null, step: SuggestedAction | null, hereToPlay: boolean): SuggestedAction | null {
  if (hereToPlay) return null;
  if (ready) return { kind: 'livrer', id: ready.commande, place: ready.place, text: ready.text };
  return step;
}

/**
 * Les pastilles des habitants des lieux ouverts (`open` ; la page en ôte le lieu où se tient Kéo, dont la ligne du
 * panneau et la bulle portent déjà l'information) : celle que porte la suggestion d'abord (`suggested`, la seule pleine),
 * puis les commandes prêtes dans l'ordre d'arrivée, puis l'étape d'entraide qui se fait d'un geste (« Donner » avec assez
 * de blocs, « Apporter » ; son icône, l'objet), puis les lieux qui ont des révisions dues (`revisions`, sans « Plus
 * tard ») dans l'ordre des lieux ; un lieu n'a qu'une pastille ; trois au plus. `titre` : le mot de l'entraide dans
 * l'univers (`quetes.titre`, jamais « quête »). Un niveau sans commande ni entraide dans le monde ouvert
 * (`hasOpenWorldErrands`, le 5e) n'a que les pastilles des révisions.
 */
export function habitantSigns(
  plan: LevelPlan,
  state: Pick<GameState, 'stock' | 'world'>,
  { open, revisions, suggested, titre = 'Entraide' }: { open: (place: PlaceId) => boolean; revisions: (place: PlaceId) => boolean; suggested?: string; titre?: string },
): HabitantSign[] {
  const out: HabitantSign[] = [];
  // Sans commande ni entraide dans le monde ouvert (le 5e), les révisions dues seules.
  const errands = hasOpenWorldErrands(plan);
  const e = errands ? entraideOf(plan, state) : null;
  const entraide: HabitantSign | null =
    e && e.step.kind !== 'mission' && open(e.place) && canTapStep(state, e.step)
      ? { place: e.place, kind: 'entraide', block: e.story.item, suggested: e.story.id === suggested, label: `${titre}, ${e.story.name}, ${placeById(e.place).at}` }
      : null;
  if (entraide?.suggested) out.push(entraide);
  for (const { c, place } of errands ? readyInOpen(plan, state, open, suggested) : []) {
    if (out.some((s) => s.place === place)) continue;
    out.push({ place, kind: 'commande', block: c.block, suggested: c.id === suggested, label: `Commande, ${blockName(c.block, c.count)}, ${placeById(place).at}` });
  }
  if (entraide && !entraide.suggested && !out.some((s) => s.place === entraide.place)) out.push(entraide);
  for (const p of plan.places) {
    if (!open(p.id) || !revisions(p.id) || out.some((s) => s.place === p.id)) continue;
    out.push({ place: p.id, kind: 'revision', suggested: false, label: `Révisions, ${p.at}` });
  }
  return out.slice(0, MAX_SIGNS);
}

/** Les commandes ouvertes du niveau du plan, dans l'ordre d'arrivée, chacune avec la ligne de son habitant (la liste « Commandes »). */
export function commandLines(plan: LevelPlan, state: Pick<GameState, 'stock' | 'world'>, assemblyAt: string): { place: PlaceId; line: HabitantLine }[] {
  return commandesOuvertes(state.world, plan.level).flatMap((c) => {
    const place = placeOfCommande(c);
    const line = place && habitantLineOf(state, place, assemblyAt);
    return place && line ? [{ place, line }] : [];
  });
}

/**
 * L'entraide en tête de la liste « Commandes » : sa quête, sa phrase (l'étape à son lieu, ou ce qui manque pour donner)
 * et où mène son « Y aller » ; rien sans entraide ouverte dans un lieu ouvert.
 */
export function entraideListLine(
  plan: LevelPlan,
  state: Pick<GameState, 'stock' | 'world'>,
  open: (place: PlaceId) => boolean,
  assemblyAt: string,
): { story: Story; index: number; place: PlaceId; role: string; text: string; go: HabitantGo } | null {
  const e = entraideOf(plan, state);
  if (!e || !open(e.place)) return null;
  const line = entraideLineOf(plan, state, e.place, assemblyAt);
  const base = { story: e.story, index: e.index, place: e.place, role: scenetteOf(e.place).role };
  if (line?.kind === 'manque') return { ...base, text: line.text, go: line.go };
  return { ...base, text: stepPhrase(e.story, e.step), go: { place: e.place } };
}

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
// - Les pastilles des habitants : une par commande prête, puis par lieu qui a des révisions dues, trois au plus.
// Sans React ni Three.js : testé sous jsdom.
import { BIOMES, blockCount, blockName, type BiomeId, type BlockId } from '../../biomes';
import type { GameState } from '../../engine/state';
import { recetteDe } from '../../world/assembly';
import { amenagementById } from '../../world/continu/amenagements';
import { PLACES, placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { HABITANT_PHRASES, filled, type PhraseTokens } from '../../world/continu/remise';
import { scenetteOf } from '../../world/continu/scenette';
import { commandeDeLIle, commandesArrivees, commandesOuvertes, estLivree, estPrete, getCommande, type Commande } from '../../world/requests';

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

/** La remise d'une commande : son lieu, l'aménagement qui s'y pose, ses éléments, le rôle, la consigne, la fin. */
export interface RemiseRequest {
  commande: string;
  place: PlaceId;
  /** L'aménagement (l'identifiant de la petite construction, sa sauvegarde). */
  amenagement: string;
  /** Ses éléments : un par ressource livrée. */
  elements: number;
  role: string;
  /** « Tu livres 3 blocs de terre pour le potager. » */
  consigne: string;
  /** « Le potager est en place. » */
  done: string;
  /** Le bloc livré (l'icône de la consigne, et la pastille). */
  block: BlockId;
}

/** La remise d'une commande du 6e qui a son aménagement dans le monde ouvert, sinon rien. */
export function remiseOf(id: string): RemiseRequest | null {
  const c = getCommande(id);
  const a = c && amenagementById(c.fixture);
  const place = c && placeOfCommande(c);
  if (!c || !a || !place || a.place !== place) return null;
  const t = tokensOf(c, placeById(place).at);
  return { commande: c.id, place, amenagement: a.id, elements: a.elements.length, role: scenetteOf(place).role, consigne: filled(HABITANT_PHRASES.remise, t), done: filled(HABITANT_PHRASES.done, t), block: c.block };
}

/** La pastille d'un habitant, au-dessus de son lieu : sa commande prête, ou ses révisions dues. */
export interface HabitantSign {
  place: PlaceId;
  kind: 'commande' | 'revision';
  /** Le bloc demandé, pour une commande (son icône). */
  block?: BlockId;
  /** La seule mise en avant : la commande de la prochaine destination. */
  suggested: boolean;
  /** Ce que lit le lecteur d'écran (« Commande, blocs de terre, au Phare »). */
  label: string;
}

/** Trois pastilles au plus à la fois (avis UX, point 3 : jamais un monde couvert de signes). */
export const MAX_SIGNS = 3;

/**
 * Les commandes prêtes du 6e dans les lieux ouverts : celle du lieu où se tient Kéo (`here`) d'abord, puis `first`,
 * puis dans l'ordre d'arrivée.
 */
function readyInOpen(state: Pick<GameState, 'stock' | 'world'>, open: (place: PlaceId) => boolean, first?: string, here?: PlaceId | null): { c: Commande; place: PlaceId }[] {
  const rank = (c: Commande) => (here && placeOfCommande(c) === here ? 2 : c.id === first ? 1 : 0);
  const ready = commandesOuvertes(state.world, '6e').filter((c) => estPrete(state, c));
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
export function readyCommande(state: Pick<GameState, 'stock' | 'world'>, open: (place: PlaceId) => boolean, first?: string, here?: PlaceId | null): ReadyCommande | null {
  const [r] = readyInOpen(state, open, first, here);
  return r ? { commande: r.c.id, place: r.place, text: filled(HABITANT_PHRASES.ready, tokensOf(r.c, placeById(r.place).at)) } : null;
}

/**
 * Le rang de la commande prête dans la suggestion (GD-20, « Une seule prochaine action mise en avant », l'ordre de
 * index.md) : le passage prêt à partir (pas encore dans le monde ouvert) ; sinon le lieu où se tient Kéo, tant qu'il y
 * reste une mission jamais jouée (`hereToPlay`) ; sinon la commande prête ; sinon la prochaine mission. Rend la commande
 * quand c'est elle que la suggestion porte, sinon rien (la prochaine mission garde la suggestion).
 */
export function suggestedCommande(ready: ReadyCommande | null, hereToPlay: boolean): ReadyCommande | null {
  return ready && !hereToPlay ? ready : null;
}

/**
 * Les pastilles des habitants des lieux ouverts (`open` ; la page en ôte le lieu où se tient Kéo, dont la ligne du
 * panneau et la bulle portent déjà l'information) : la commande suggérée d'abord (`suggested`, celle que porte la
 * suggestion, la seule pleine), puis les autres commandes prêtes dans l'ordre d'arrivée, puis les lieux qui ont des
 * révisions dues (`revisions`, sans « Plus tard ») dans l'ordre des lieux ; un lieu n'a qu'une pastille ; trois au plus.
 */
export function habitantSigns(state: Pick<GameState, 'stock' | 'world'>, { open, revisions, suggested }: { open: (place: PlaceId) => boolean; revisions: (place: PlaceId) => boolean; suggested?: string }): HabitantSign[] {
  const out: HabitantSign[] = [];
  for (const { c, place } of readyInOpen(state, open, suggested)) {
    if (out.some((s) => s.place === place)) continue;
    out.push({ place, kind: 'commande', block: c.block, suggested: c.id === suggested, label: `Commande, ${blockName(c.block, c.count)}, ${placeById(place).at}` });
  }
  for (const p of PLACES) {
    if (!open(p.id) || !revisions(p.id) || out.some((s) => s.place === p.id)) continue;
    out.push({ place: p.id, kind: 'revision', suggested: false, label: `Révisions, ${p.at}` });
  }
  return out.slice(0, MAX_SIGNS);
}

/** Les commandes ouvertes du 6e, dans l'ordre d'arrivée, chacune avec la ligne de son habitant (la liste « Commandes »). */
export function commandLines(state: Pick<GameState, 'stock' | 'world'>, assemblyAt: string): { place: PlaceId; line: HabitantLine }[] {
  return commandesOuvertes(state.world, '6e').flatMap((c) => {
    const place = placeOfCommande(c);
    const line = place && habitantLineOf(state, place, assemblyAt);
    return place && line ? [{ place, line }] : [];
  });
}

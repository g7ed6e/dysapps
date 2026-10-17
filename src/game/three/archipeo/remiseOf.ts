// La commande d'un habitant, vue par le monde ouvert (GD-20, point 4, lot L1 « Livrer ») : le seul fichier qui lise à la
// fois les commandes de la grille (world/requests.ts : leur bloc, leur nombre, leur livraison, la même sauvegarde) et
// le monde continu (ses lieux, ses rôles, ses aménagements, les phrases de ses habitants). Le code pur du monde continu
// ne lit pas les commandes (isolation.test.ts) : il reçoit d'ici ses jetons tout faits.
//
// - La ligne de l'habitant, en tête du panneau de son lieu : la commande prête (« Livre les 3 pierres au Phare. »,
//   « Livrer »), sinon ce qui manque (« Il me faut 3 pierres pour le potager. Joue une mission aux Filets. », « Y aller »,
//   vers le lieu de la ressource, ou vers le lieu où l'on assemble pour un bloc assemblé). Les révisions dues
//   (« Reprendre ») passent entre les deux : la page les lit (`useResidentReminder`).
// - La remise : la consigne, la phrase de fin, l'aménagement qui se pose et son nombre d'éléments.
// - Les pastilles des habitants : une par commande prête, puis par lieu qui a des révisions dues, trois au plus.
// Sans React ni Three.js : testé sous jsdom.
import { BIOMES, blockCount, blockName, type BiomeId, type BlockId } from '../../biomes';
import type { GameState } from '../../engine/state';
import { recetteDe } from '../../world/assembly';
import { amenagementById } from '../../world/continu/amenagements';
import { PLACES, placeById, placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { HABITANT_PHRASES, atForm, filled, type PhraseTokens } from '../../world/continu/remise';
import { scenetteOf } from '../../world/continu/scenette';
import { commandeDeLIle, commandesArrivees, commandesOuvertes, estLivree, estPrete, getCommande, type Commande } from '../../world/requests';

/** Où mène « Y aller » d'une commande à qui il manque des blocs : un lieu, ou le lieu de l'Escale où l'on assemble. */
export type HabitantGo = { place: PlaceId } | { port: 'chantier' };

/** La ligne de l'habitant d'un lieu, pour sa commande. */
export type HabitantLine =
  | { kind: 'livrer'; commande: string; role: string; text: string }
  | { kind: 'manque'; commande: string; role: string; text: string; go: HabitantGo };

/** Ce que les jetons valent pour une commande ; `auLieu`, le lieu de la phrase. */
function tokensOf(c: Commande, auLieu: string): PhraseTokens {
  return { objet: blockCount(c.block, c.count), blocs: blockName(c.block, c.count), nom: c.blocland.name, genre: c.genre ?? 'm', auLieu };
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
 * manque et « Y aller ». `assembly` : le nom du lieu où l'on assemble, avec son article (« Le Chantier de l’Escale »).
 */
export function habitantLineOf(state: Pick<GameState, 'stock' | 'world'>, place: PlaceId, assembly: string): HabitantLine | null {
  // Les îles des lieux sont celles du jeu (plan6e.ts, vérifié par son test).
  const c = commandeDeLIle(placeById(place).island as BiomeId);
  if (!c || !commandesArrivees(state.world).includes(c.id) || estLivree(state.world, c)) return null;
  const role = scenetteOf(place).role;
  if (estPrete(state, c)) return { kind: 'livrer', commande: c.id, role, text: filled(HABITANT_PHRASES.ready, tokensOf(c, placeById(place).at)) };
  const go = sourceOf(c);
  if (!go) return null;
  const at = 'port' in go ? atForm(assembly) : placeById(go.place).at;
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
  /** « Tu livres 3 pierres pour le potager. » */
  consigne: string;
  /** « Le potager est posé. » */
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
  /** Ce que lit le lecteur d'écran (« Commande, pierres, au Phare »). */
  label: string;
}

/** Trois pastilles au plus à la fois (avis UX, point 3 : jamais un monde couvert de signes). */
export const MAX_SIGNS = 3;

/**
 * Les pastilles des habitants des lieux ouverts (`open`) : la commande suggérée d'abord (`suggested`, celle de la
 * prochaine destination), puis les autres commandes prêtes dans l'ordre d'arrivée, puis les lieux qui ont des révisions
 * dues (`revisions`, sans « Plus tard ») dans l'ordre des lieux ; un lieu n'a qu'une pastille ; trois au plus.
 */
export function habitantSigns(state: Pick<GameState, 'stock' | 'world'>, { open, revisions, suggested }: { open: (place: PlaceId) => boolean; revisions: (place: PlaceId) => boolean; suggested?: string }): HabitantSign[] {
  const out: HabitantSign[] = [];
  const ready = commandesOuvertes(state.world, '6e').filter((c) => estPrete(state, c));
  ready.sort((a, b) => Number(b.id === suggested) - Number(a.id === suggested));
  for (const c of ready) {
    const place = placeOfCommande(c);
    if (!place || !open(place) || out.some((s) => s.place === place)) continue;
    out.push({ place, kind: 'commande', block: c.block, suggested: c.id === suggested, label: `Commande, ${blockName(c.block, c.count)}, ${placeById(place).at}` });
  }
  for (const p of PLACES) {
    if (!open(p.id) || !revisions(p.id) || out.some((s) => s.place === p.id)) continue;
    out.push({ place: p.id, kind: 'revision', suggested: false, label: `Révisions, ${p.at}` });
  }
  return out.slice(0, MAX_SIGNS);
}

/** Les commandes ouvertes du 6e, dans l'ordre d'arrivée, chacune avec la ligne de son habitant (la liste « Commandes »). */
export function commandLines(state: Pick<GameState, 'stock' | 'world'>, assembly: string): { place: PlaceId; line: HabitantLine }[] {
  return commandesOuvertes(state.world, '6e').flatMap((c) => {
    const place = placeOfCommande(c);
    const line = place && habitantLineOf(state, place, assembly);
    return place && line ? [{ place, line }] : [];
  });
}

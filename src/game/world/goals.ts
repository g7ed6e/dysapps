// Le prochain objectif d'une île, un seul, avec sa jauge : ce qu'il manque pour l'ouvrage suggéré (celui qui ouvre une
// île de la matière la moins jouée, GD-7), ou pour le Bloc-Navire (le bâtiment de l'île se pose tout seul, une partie par
// mission réussie : GD-6). Code pur, partagé par le panneau d'île et la prochaine destination. Les noms des archipels
// viennent de l'appelant (`noms` : ceux de l'univers affiché, GD-1).
import { thePlace } from './placeArticle';
import { BIOMES, blockCount, getBiome, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { LV2_LABELS, lv2Courante, type Lv2Choice } from '../../core/settings';
import type { GameState } from '../engine';
import { canLaunch, planStatus } from '../engine';
import {
  BRIDGES,
  KIND_NAME,
  archipelagoOf,
  buildableBridges,
  conditionMet,
  isArchipelagoReached,
  otherEnd,
  linkKind,
  linkLength,
  nearestDeparture,
  remainingPath,
  payableBlocks,
  previousArchipelago,
  reachableIslands,
  remainingVoyages,
  type ArchipelagoId,
  type BridgeDef,
  type MotsDesGardiens,
  type NomsArchipels,
} from './archipelago';
import { missionsTerminees } from './parts';
import { VEHICLE_NAME, beatenGuardians, stageAt, stageTo } from './vehicle';

type Matiere = BiomeDef['subject'];

/**
 * L'ordre des matières à égalité : celui de docs/contenu/archipel.md (français, maths, anglais, histoire-géographie, SVT,
 * physique-chimie, technologie, puis la LV2).
 */
const ORDRE_DES_MATIERES: Matiere[] = ['french', 'maths', 'english', 'history-geography', 'life-earth-sciences', 'physics-chemistry', 'technology', 'lv2'];

/** Les matières dont on mesure la part jouée (toutes sauf la LV2, à part : on peut ne pas l'avoir). */
const MATIERES_COMPTEES = ['french', 'maths', 'english', 'history-geography', 'life-earth-sciences', 'physics-chemistry', 'technology'] as const;

/**
 * Combien chaque matière est jouée dans une classe (GD-7, mesure choisie par le mainteneur le 3 octobre 2026) : les
 * missions réussies au moins une fois sur ses îles (`missionsTerminees` : ni le défi du Gardien, ni le portail, ni le
 * mode bâtisseur), divisées par le nombre de ses îles dans la classe, pour qu'une matière n'ait pas l'air moins jouée
 * parce qu'elle a moins d'îles. La LV2 n'est pas comptée : ses îles passent après les autres. Jamais la réussite (les
 * étoiles) : une matière moins réussie n'est pas montrée du doigt.
 */
export function partJouee(progress: Record<string, { attempts: number }>, classe: ArchipelagoId): Record<Exclude<Matiere, 'lv2'>, number> {
  const part = { french: 0, maths: 0, english: 0, 'history-geography': 0, 'life-earth-sciences': 0, 'physics-chemistry': 0, technology: 0 };
  // Un seul passage sur la progression (une sauvegarde pleine compte des centaines d'exercices) : chaque île de la
  // classe ne relit que les siens (`missionsTerminees` départage ensuite les lieux dont le nom en prolonge un autre).
  const iles = BIOMES.filter((b) => b.classe === classe && b.subject !== 'lv2');
  const parIle = new Map<BiomeId, Record<string, { attempts: number }>>(iles.map((b) => [b.id, {}]));
  const marque = `-${classe}-`;
  for (const ex in progress) {
    if (!ex.includes(marque)) continue;
    const p = progress[ex];
    for (const b of iles) {
      const siens = parIle.get(b.id);
      if (siens && ex.startsWith(`${b.id}-`)) siens[ex] = p;
    }
  }
  for (const matiere of MATIERES_COMPTEES) {
    const deLaMatiere = iles.filter((b) => b.subject === matiere);
    if (deLaMatiere.length) part[matiere] = deLaMatiere.reduce((n, b) => n + missionsTerminees(parIle.get(b.id) ?? {}, b.id), 0) / deLaMatiere.length;
  }
  return part;
}

/**
 * Les parts jouées, calculées une fois par sauvegarde : la progression ne se modifie jamais en place (chaque mission
 * jouée en fait une nouvelle, `engine.ts`), elle sert donc de clé. Sans ce cache, la prochaine destination refaisait
 * `partJouee` pour chaque île de l'archipel (GD-7, relecture de la PR 2).
 */
const PARTS = new WeakMap<object, Map<ArchipelagoId, ReturnType<typeof partJouee>>>();
function partsDe(progress: Record<string, { attempts: number }>, classe: ArchipelagoId): ReturnType<typeof partJouee> {
  let parClasse = PARTS.get(progress);
  if (!parClasse) PARTS.set(progress, (parClasse = new Map()));
  let parts = parClasse.get(classe);
  if (!parts) parClasse.set(classe, (parts = partJouee(progress, classe)));
  return parts;
}

/**
 * Les îles ouvertes, calculées une fois par liste d'ouvrages construits (elle ne se modifie jamais en place : construire
 * en fait une nouvelle, `buildBridge`) : la prochaine destination demande l'objectif de chaque île. Ne pas modifier le
 * résultat.
 */
const OUVERTES = new WeakMap<readonly string[], Set<BiomeId>>();
function ouvertes(state: GameState): Set<BiomeId> {
  let open = OUVERTES.get(state.world.links);
  if (!open) OUVERTES.set(state.world.links, (open = reachableIslands(state.world.links)));
  return open;
}

/** L'île où mène un ouvrage : celle qui est fermée (celle qu'il ouvre), sinon celle d'en face depuis `depuis`. */
function arriveeDe(b: BridgeDef, open: Set<BiomeId>, depuis?: BiomeId): BiomeId {
  if (!open.has(b.to)) return b.to;
  if (!open.has(b.from)) return b.from;
  return depuis ? otherEnd(b, depuis) : b.to;
}

/**
 * Les ouvrages proposés, le suggéré d'abord (GD-7, point 3) ; le même tri pour la prochaine destination et pour le seul
 * « Construire » principal du panneau d'une île. D'abord ceux qui ouvrent une île ; les îles de LV2 après les autres
 * (elles restent en bout de chemin) ; puis ceux qu'on peut payer ; puis l'île de la matière la moins jouée (`partJouee`) ;
 * à égalité, l'ordre des matières, puis la plus courte (GD-9 : toutes coûtent le même prix), puis l'ordre de `BRIDGES`. Déduit de la sauvegarde seule, sans
 * hasard ni horloge : la suggestion ne change pas tant que l'élève n'a rien fait.
 */
export function ouvragesParSuggestion(state: GameState, ouvrages: BridgeDef[], depuis?: BiomeId, open = ouvertes(state)): BridgeDef[] {
  const have = payableBlocks(state.stock);
  const cle = (b: BridgeDef) => {
    const arrivee = getBiome(arriveeDe(b, open, depuis));
    const matiere = arrivee?.subject ?? 'lv2';
    const part = matiere === 'lv2' ? 0 : partsDe(state.progress, archipelagoOf(b.from).classe)[matiere];
    return [
      arrivee && !open.has(arrivee.id) ? 0 : 1,
      matiere === 'lv2' ? 1 : 0,
      have >= b.cost ? 0 : 1,
      part,
      ORDRE_DES_MATIERES.indexOf(matiere),
      linkLength(b, state.world.links) ?? Number.MAX_SAFE_INTEGER,
      BRIDGES.indexOf(b),
    ];
  };
  // Chaque ouvrage avec sa clé, calculée une fois ; trié par clés.
  return ouvrages
    .map((b) => ({ b, k: cle(b) }))
    .sort((x, y) => {
      const i = x.k.findIndex((v, n) => v !== y.k[n]);
      return i < 0 ? 0 : x.k[i] - y.k[i];
    })
    .map(({ b }) => b);
}

/**
 * « de français », « de maths », « d'anglais », « d'histoire-géo », « de SVT », « de physique-chimie », « de technologie »,
 * « d'espagnol » : la matière d'une île, dans « une île de… ».
 */
function deLaMatiere(matiere: Matiere, lv2: Lv2Choice): string {
  const mot = { french: 'français', maths: 'maths', english: 'anglais', 'history-geography': 'histoire-géo', 'life-earth-sciences': 'SVT', 'physics-chemistry': 'physique-chimie', technology: 'technologie', lv2: LV2_LABELS[lv2].toLowerCase() }[matiere];
  return /^[aeiouyh]/.test(mot) ? `d’${mot}` : `de ${mot}`;
}

/**
 * L'objectif d'un ouvrage vu d'une île qu'il touche : ce qu'il manque, ou qu'on peut le construire, puis, dans une
 * seconde phrase (une idée par phrase), la raison quand il ouvre une île (« Il ouvre une île d'anglais. ») : la matière,
 * jamais une notion ni une note. Le texte finit sans point : l'appelant le pose.
 */
function objectifDOuvrage(state: GameState, b: BridgeDef, depuis: BiomeId, lv2: Lv2Choice, open = ouvertes(state)): Goal & { ready: boolean; ouvrage: string } {
  const arrivee = getBiome(otherEnd(b, depuis));
  const what = ouvrageName(linkKind(b, state.world.links), arrivee?.name ?? b.to);
  const raison = arrivee && !open.has(arrivee.id) ? `. Il ouvre une île ${deLaMatiere(arrivee.subject, lv2)}` : '';
  const have = Math.min(b.cost, payableBlocks(state.stock));
  const left = b.cost - have;
  return {
    text: `${left > 0 ? `Encore ${left} bloc${left > 1 ? 's' : ''} pour ${what}` : `Tu peux poser ${what}`}${raison}`,
    have,
    need: b.cost,
    ready: left === 0,
    ouvrage: b.id,
  };
}

/**
 * L'ouvrage suggéré dans un archipel (GD-7) : parmi ceux qu'on peut construire depuis une île ouverte et qui ouvrent une
 * île, le premier de `ouvragesParSuggestion` ; l'île d'où il part, et son objectif (la phrase et la jauge). `null` quand
 * plus aucun ouvrage n'ouvre d'île.
 */
export function ouvrageSuggere(state: GameState, classe: ArchipelagoId, lv2: Lv2Choice = lv2Courante()): { ile: BiomeId; goal: Goal } | null {
  const suggere = ouvrageSuggereDef(state, classe, lv2);
  if (!suggere) return null;
  const goal = objectifDOuvrage(state, suggere.b, suggere.ile, lv2);
  return { ile: suggere.ile, goal: { ...goal, text: `${cap(goal.text)}.` } };
}

/**
 * L'ouvrage suggéré d'un archipel et l'île d'où il part (voir `ouvrageSuggere`), calculé une fois par état de la partie
 * (l'état ne se modifie jamais en place) : `nextGoalInfo` le demande pour chaque île quand la prochaine destination les
 * passe toutes en revue.
 */
const SUGGERES = new WeakMap<GameState, Map<string, { b: BridgeDef; ile: BiomeId } | null>>();
function ouvrageSuggereDef(state: GameState, classe: ArchipelagoId, lv2: Lv2Choice): { b: BridgeDef; ile: BiomeId } | null {
  let parCle = SUGGERES.get(state);
  if (!parCle) SUGGERES.set(state, (parCle = new Map()));
  const cle = `${classe}:${lv2}`;
  let suggere = parCle.get(cle);
  if (suggere === undefined) parCle.set(cle, (suggere = chercherLOuvrageSuggere(state, classe, lv2)));
  return suggere;
}

function chercherLOuvrageSuggere(state: GameState, classe: ArchipelagoId, lv2: Lv2Choice): { b: BridgeDef; ile: BiomeId } | null {
  const open = ouvertes(state);
  const world = { progress: state.progress, plans: state.world.parts };
  const ouvrages = buildableBridges(state.world.links, undefined, world, lv2, open).filter(
    (b) => archipelagoOf(b.from).classe === classe && conditionMet(b, state.world.links, world, open) && (!open.has(b.from) || !open.has(b.to)),
  );
  const b = ouvragesParSuggestion(state, ouvrages, undefined, open)[0];
  if (!b) return null;
  return { b, ile: open.has(b.from) ? b.from : b.to };
}

/** « le pont vers la Mine », « l'escalier taillé vers le Carrefour » : le nom d'un ouvrage, le même partout ; `to`, le nom du lieu, sans article. */
export function ouvrageName(kind: keyof typeof KIND_NAME, to: string): string {
  const name = KIND_NAME[kind].toLowerCase();
  return `${/^[aeiouy]/.test(name) ? 'l’' : 'le '}${name}${to ? ` vers ${thePlace(to)}` : ' '}`;
}

/** Le prochain objectif d'une île : une phrase, et une jauge (`have` sur `need`) quand il se compte. */
export interface Goal {
  text: string;
  have: number;
  need: number;
  /** Tout est là pour le faire tout de suite (la jauge, pleine, n'a plus rien à dire). */
  ready?: boolean;
  /** L'objectif est un ouvrage : son identifiant (le pli Ouvrages en fait le seul bouton principal). */
  ouvrage?: string;
}

/** Ce qu'il manque au Bloc-Navire, en blocs : « 16 blocs de bois », « 10 briques et 3 blocs de verre ». */
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
 * Le prochain objectif d'une île, **un seul** : deux objectifs à la fois (des blocs pour un pont, d'autres pour le
 * navire) mélangeaient deux comptes. Ordre : le Bloc-Navire prêt à partir ; ce qu'on peut faire tout de suite
 * (construire un ouvrage, poser les blocs du navire) ; sur l'île d'où part l'ouvrage suggéré de l'archipel
 * (`ouvrageSuggere`), cet ouvrage, même si le navire demande moins de blocs : la prochaine destination et le panneau de
 * l'île disent la même chose (GD-7, une seule source) ; sinon l'objectif le plus proche (le moins de blocs à gagner),
 * l'ouvrage en cas d'égalité. L'ouvrage est le suggéré de l'île (`ouvragesParSuggestion`). `null` s'il n'y a rien à
 * dire (île fermée, tout construit).
 */
export function nextGoalInfo(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens, lv2: Lv2Choice = lv2Courante()): Goal | null {
  const stage = stageAt(island);
  const launch = stage ? canLaunch(state, stage) : null;
  if (stage && launch?.ok) return { text: `${cap(VEHICLE_NAME)} est prêt : embarque vers les ${noms[stage.to]} !`, have: 1, need: 1, ready: true };
  type Candidate = Goal & { ready: boolean };
  const candidates: Candidate[] = [];
  const world = { progress: state.progress, plans: state.world.parts };
  const open = ouvertes(state);
  const bridges = buildableBridges(state.world.links, island, world, lv2, open).filter((b) => conditionMet(b, state.world.links, world, open));
  // L'ouvrage suggéré de l'archipel quand il part d'ici ; sinon le suggéré de l'île, par le même tri (GD-7).
  const suggere = bridges.length ? ouvrageSuggereDef(state, archipelagoOf(island).classe, lv2) : null;
  const dIci = suggere?.ile === island ? suggere.b : null;
  const ouvrage = bridges.length ? objectifDOuvrage(state, dIci ?? ouvragesParSuggestion(state, bridges, island, open)[0], island, lv2, open) : null;
  if (ouvrage) candidates.push(ouvrage);
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
  const pick =
    candidates.find((c) => c.ready) ??
    (dIci && ouvrage ? ouvrage : candidates.reduce((a, b) => (b.need - b.have < a.need - a.have ? b : a)));
  return { text: `${cap(pick.text)}.`, have: pick.have, need: pick.need, ready: pick.ready, ...(pick.ouvrage ? { ouvrage: pick.ouvrage } : {}) };
}

/** La phrase du prochain objectif seule (voir `nextGoalInfo`). */
export function nextGoal(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens, lv2: Lv2Choice = lv2Courante()): string | null {
  return nextGoalInfo(state, island, noms, mots, lv2)?.text ?? null;
}

/**
 * Ce que dit la créature d'une île fermée : l'ouvrage précis qui mène ici (depuis quelle île, combien de blocs,
 * quelle condition), ou l'île à ouvrir d'abord quand on est encore trop loin.
 */
export function lockedHint(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens): string {
  const bridges = state.world.links;
  const world = { progress: state.progress, plans: state.world.parts };
  // Une île d'un autre archipel : il faut le Bloc-Navire.
  const archipelago = archipelagoOf(island);
  if (!isArchipelagoReached(archipelago.classe, bridges)) {
    const left = remainingVoyages(island, bridges);
    const stage = stageTo(left[0].toClasse)!;
    const port = thePlace(getBiome(stage.biome)?.name ?? stage.biome);
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
  // La liaison depuis le lieu relié le plus proche (GD-9) : le même départ que « Relier » et le fantôme du monde.
  const b = nearestDeparture(island, bridges);
  if (b) {
    const from = getBiome(otherEnd(b, island))?.name ?? '';
    const kind = linkKind(b, bridges);
    const cond = conditionMet(b, bridges, world) ? '' : ` ${conditionTextShort(kind, from)}`;
    return `Pas si vite ! Pour venir ici, pose ${ouvrageName(kind, '')}depuis ${thePlace(from)} : ${b.cost} blocs.${cond}`;
  }
  return noDirectLinkHint(island, bridges);
}

/**
 * Ce que dit un lieu fermé qu'aucune liaison directe n'atteint (GD-9) : l'île à relier d'abord, sur le plus court
 * chemin (« Relie d'abord X. De là, un ouvrage mène ici. »), sinon qu'aucun passage n'y mène pour l'instant. La fiche
 * de l'île pâle (`lockedHint`) et son panneau (le pli « Relier ») disent la même phrase.
 */
export function noDirectLinkHint(island: BiomeId, bridges: string[]): string {
  const premiere = remainingPath(island, bridges)[0];
  const open = reachableIslands(bridges);
  const avant = premiere ? (open.has(premiere.from) ? premiere.to : premiere.from) : null;
  return avant && avant !== island ? relieDAbord(getBiome(avant)?.name ?? avant) : AUCUNE_LIAISON;
}

/** Ce que dit la fiche d'un lieu fermé quand aucun chemin d'ouvrages ne tient jusqu'à lui (GD-9). */
export const AUCUNE_LIAISON = 'Pas de passage jusqu’ici pour l’instant.';

/** Ce que dit la fiche d'un lieu fermé qu'on atteint en reliant d'abord une autre île (GD-9). */
const relieDAbord = (ile: string) => `Relie d’abord ${thePlace(ile)}. De là, un ouvrage mène ici.`;

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

// L'escalier demande une mission réussie sur l'île de départ, qui y pose la première partie de son bâtiment (GD-6) ;
// aucun ouvrage ne demande un Gardien (GD-7).
function conditionTextShort(kind: keyof typeof KIND_NAME, from: string): string {
  return kind === 'escalier' ? `Réussis aussi une mission sur ${thePlace(from)}.` : '';
}

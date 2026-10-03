// Le prochain objectif d'une île, un seul, avec sa jauge : ce qu'il manque pour l'ouvrage suggéré (celui qui ouvre une
// île de la matière la moins jouée, GD-7), ou pour le Bloc-Navire (le bâtiment de l'île se pose tout seul, une partie par
// mission réussie : GD-6). Code pur, partagé par le panneau d'île et la prochaine destination. Les noms des archipels
// viennent de l'appelant (`noms` : ceux de l'univers affiché, GD-1).
import { BIOMES, blockCount, getBiome, type BiomeDef, type BiomeId, type BlockId } from '../biomes';
import { LV2_LABELS, lv2Courante } from '../../core/settings';
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
  pathTo,
  payableBlocks,
  previousArchipelago,
  reachableIslands,
  remainingVoyages,
  type ArchipelagoId,
  type BridgeDef,
  type MotsDesGardiens,
  type NomsArchipels,
} from './archipelago';
import { missionsTerminees } from './parties';
import { VEHICLE_NAME, beatenGuardians, stageAt, stageTo } from './vehicle';

type Matiere = BiomeDef['subject'];

/** L'ordre des matières à égalité : celui de docs/contenu/archipel.md (français, maths, anglais, puis la LV2). */
const ORDRE_DES_MATIERES: Matiere[] = ['french', 'maths', 'english', 'lv2'];

/**
 * Combien chaque matière est jouée dans une classe (GD-7, mesure choisie par le mainteneur le 3 octobre 2026) : les
 * missions réussies au moins une fois sur ses îles (`missionsTerminees` : ni le défi du Gardien, ni le portail, ni le
 * mode bâtisseur), divisées par le nombre de ses îles dans la classe, pour qu'une matière n'ait pas l'air moins jouée
 * parce qu'elle a moins d'îles. La LV2 n'est pas comptée : ses îles passent après les autres. Jamais la réussite (les
 * étoiles) : une matière moins réussie n'est pas montrée du doigt.
 */
export function partJouee(progress: Record<string, { attempts: number }>, classe: ArchipelagoId): Record<Exclude<Matiere, 'lv2'>, number> {
  const part = { french: 0, maths: 0, english: 0 };
  for (const matiere of ['french', 'maths', 'english'] as const) {
    const iles = BIOMES.filter((b) => b.classe === classe && b.subject === matiere);
    if (iles.length) part[matiere] = iles.reduce((n, b) => n + missionsTerminees(progress, b.id), 0) / iles.length;
  }
  return part;
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
 * à égalité, l'ordre des matières, puis le moins cher, puis l'ordre de `BRIDGES`. Déduit de la sauvegarde seule, sans
 * hasard ni horloge : la suggestion ne change pas tant que l'élève n'a rien fait.
 */
export function ouvragesParSuggestion(state: GameState, ouvrages: BridgeDef[], depuis?: BiomeId): BridgeDef[] {
  const open = reachableIslands(state.world.links);
  const have = payableBlocks(state.stock);
  const parts = new Map<ArchipelagoId, ReturnType<typeof partJouee>>();
  const cle = (b: BridgeDef) => {
    const arrivee = getBiome(arriveeDe(b, open, depuis));
    const matiere = arrivee?.subject ?? 'lv2';
    const classe = archipelagoOf(b.from).classe;
    if (!parts.has(classe)) parts.set(classe, partJouee(state.progress, classe));
    const part = matiere === 'lv2' ? 0 : parts.get(classe)![matiere];
    return [
      arrivee && !open.has(arrivee.id) ? 0 : 1,
      matiere === 'lv2' ? 1 : 0,
      have >= b.cost ? 0 : 1,
      part,
      ORDRE_DES_MATIERES.indexOf(matiere),
      b.cost,
      BRIDGES.indexOf(b),
    ];
  };
  const cles = new Map(ouvrages.map((b) => [b, cle(b)]));
  return [...ouvrages].sort((a, b) => {
    const x = cles.get(a)!;
    const y = cles.get(b)!;
    const i = x.findIndex((v, k) => v !== y[k]);
    return i < 0 ? 0 : x[i] - y[i];
  });
}

/** « de français », « de maths », « d'anglais », « d'espagnol » : la matière d'une île, dans « une île de… ». */
function deLaMatiere(matiere: Matiere): string {
  const mot = { french: 'français', maths: 'maths', english: 'anglais', lv2: LV2_LABELS[lv2Courante()].toLowerCase() }[matiere];
  return /^[aeiouy]/.test(mot) ? `d’${mot}` : `de ${mot}`;
}

/**
 * L'objectif d'un ouvrage vu d'une île qu'il touche : ce qu'il manque, ou qu'on peut le construire, et la raison quand il
 * ouvre une île (« il ouvre une île d'anglais ») : la matière, jamais une notion ni une note.
 */
function objectifDOuvrage(state: GameState, b: BridgeDef, depuis: BiomeId): Goal & { ready: boolean; ouvrage: string } {
  const open = reachableIslands(state.world.links);
  const arrivee = getBiome(otherEnd(b, depuis));
  const what = ouvrageName(b.kind, arrivee?.name ?? b.to);
  const raison = arrivee && !open.has(arrivee.id) ? ` : il ouvre une île ${deLaMatiere(arrivee.subject)}` : '';
  const have = Math.min(b.cost, payableBlocks(state.stock));
  const left = b.cost - have;
  return {
    text: `${left > 0 ? `Encore ${left} bloc${left > 1 ? 's' : ''} pour ${what}` : `Tu peux construire ${what}`}${raison}`,
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
export function ouvrageSuggere(state: GameState, classe: ArchipelagoId): { ile: BiomeId; goal: Goal } | null {
  const open = reachableIslands(state.world.links);
  const world = { progress: state.progress, plans: state.world.parts };
  const ouvrages = buildableBridges(state.world.links, undefined, world).filter(
    (b) => archipelagoOf(b.from).classe === classe && conditionMet(b, state.world.links, world) && (!open.has(b.from) || !open.has(b.to)),
  );
  const b = ouvragesParSuggestion(state, ouvrages)[0];
  if (!b) return null;
  const ile = open.has(b.from) ? b.from : b.to;
  const goal = objectifDOuvrage(state, b, ile);
  return { ile, goal: { ...goal, text: `${cap(goal.text)}.` } };
}

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
 * (construire un ouvrage, poser les blocs du navire) ; sinon l'objectif le plus proche (le moins de blocs à gagner),
 * l'ouvrage en cas d'égalité. L'ouvrage est le suggéré de l'île (`ouvragesParSuggestion`). `null` s'il n'y a rien à
 * dire (île fermée, tout construit).
 */
export function nextGoalInfo(state: GameState, island: BiomeId, noms: NomsArchipels, mots: MotsDesGardiens): Goal | null {
  const stage = stageAt(island);
  const launch = stage ? canLaunch(state, stage) : null;
  if (stage && launch?.ok) return { text: `${cap(VEHICLE_NAME)} est prêt : embarque vers les ${noms[stage.to]} !`, have: 1, need: 1, ready: true };
  type Candidate = Goal & { ready: boolean };
  const candidates: Candidate[] = [];
  const world = { progress: state.progress, plans: state.world.parts };
  const bridges = buildableBridges(state.world.links, island, world).filter((b) => conditionMet(b, state.world.links, world));
  // L'ouvrage suggéré de l'île, par le même tri que la prochaine destination (GD-7).
  if (bridges.length) candidates.push(objectifDOuvrage(state, ouvragesParSuggestion(state, bridges, island)[0], island));
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
  return { text: `${cap(pick.text)}.`, have: pick.have, need: pick.need, ready: pick.ready, ...(pick.ouvrage ? { ouvrage: pick.ouvrage } : {}) };
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
    const cond = conditionMet(b, bridges, world) ? '' : ` ${conditionTextShort(b, from)}`;
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

// L'escalier demande une mission réussie sur l'île de départ, qui y pose la première partie de son bâtiment (GD-6) ;
// aucun ouvrage ne demande un Gardien (GD-7).
function conditionTextShort(b: { kind: keyof typeof KIND_NAME }, from: string): string {
  return b.kind === 'escalier' ? `Réussis aussi une mission sur ${from}.` : '';
}

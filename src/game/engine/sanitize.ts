// La lecture d'une sauvegarde : une partie d'avant les mots neutres se lit traduite (core/migration.ts), puis chaque
// champ est vérifié et complété ; une vieille sauvegarde (plans v1, ponts, Bloc-Navire…) est remise au format du jour.
import { GAME_VERSION, translateGame } from '../../core/migration';
import { isMovedPlace } from '../../core/movedChallenges';
import { MOVED_EXERCISES } from '../../core/movedIds';
import { isBossBeaten } from '../bossCore';
import { type BiomeDef, type BiomeId, BIOMES, type BlockId, BLOCKS, getBiome } from '../biomes';
import { getPlan, planCells } from '../world/plans';
import { getStage, stageFor } from '../world/vehicle';
import { getMonument } from '../world/monuments';
import { casesDeLaPetiteConstruction, estPosee } from '../world/fixtures';
import { formerVehicleStage } from '../world/formerVehicle';
import { planV1 } from '../world/plansV1';
import { bridgesFromLegacyProgress, getBridge, getVoyage, grantAccess, isBiomeUnlocked, legacyReachable } from '../world/archipelago';
import { lireTirage, recetteDe, type TirageAssemblage } from '../world/assembly';
import { archipelDeLaCommande, getCommande, MAX_COMMANDES_OUVERTES } from '../world/requests';
import { getStory, isStoryDone } from '../world/stories';
import { PROJECT_BANKS } from '../world/projects';
import { pairOfJoinId, sanitizeLayout } from '../world/savedLayout';
import type { DrawKey, ExerciseProgress, GameState, LogEntry, SpacedItem, TypeStats } from './state';
import { INTERVALS } from './learning';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Le plus de clés lues pour une construction qui réunit (GD-9) : sa plus grande forme tient en moins de 300 cases (un
 * côté de lieu de large, quelques cases de long) ; au-delà, la sauvegarde est abîmée et le reste est ignoré.
 */
const MAX_JOIN_KEYS = 512;

/** Le lieu d'un exercice : celui dont l'identifiant le préfixe (`french-6e-phonology-…`, les lieux contiennent des tirets). */
const placeOf = (exerciseId: string): BiomeDef | undefined => BIOMES.find((b) => exerciseId.startsWith(`${b.id}-`));

let arrivedCache: ReadonlySet<string> | undefined;

/**
 * Les exercices arrivés d'un autre lieu avec les programmes de 2025-2026 (core/movedIds.ts) : leurs étoiles les ont
 * suivis, mais n'ouvrent pas leur nouveau lieu (décision proposée par le directeur artistique, 7 octobre 2026). Il
 * s'ouvre par les liaisons et le passage, comme les autres : sans cela, une étoile de 5e arrivée à la Forge donnerait
 * aussi le voyage vers la 4e et l'étape du Bloc-Navire, sans défi. Un exercice déplacé dans son propre lieu (le Marais)
 * compte encore. La table est calculée à la première lecture : les lieux (`BIOMES`) sont alors chargés, quel que soit
 * l'ordre des imports.
 */
function arrivedFromAnotherPlace(): ReadonlySet<string> {
  arrivedCache ??= new Set(
    Object.entries(MOVED_EXERCISES)
      .filter(([from, to]) => placeOf(from)?.id !== placeOf(to)?.id)
      .map(([, to]) => to),
  );
  return arrivedCache;
}

const num = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

export function sanitizeState(input: unknown): GameState {
  // Une partie d'avant les mots neutres (2 octobre 2026) se lit traduite : la suite ne connaît que les nouveaux noms.
  const translated = translateGame(input);
  const raw = isRecord(translated) ? translated : {};
  const progress: Record<string, ExerciseProgress> = {};
  if (isRecord(raw.progress)) {
    for (const [id, p] of Object.entries(raw.progress)) {
      if (!isRecord(p)) continue;
      progress[id] = {
        stars: Math.max(0, Math.min(3, Math.round(num(p.stars)))) as 0 | 1 | 2 | 3,
        attempts: Math.max(0, Math.round(num(p.attempts))),
        best: Math.max(0, Math.min(1, num(p.best))),
      };
    }
  }
  const spaced: SpacedItem[] = Array.isArray(raw.spaced)
    ? raw.spaced
        .filter((s): s is Record<string, unknown> => isRecord(s) && typeof s.itemId === 'string' && typeof s.due === 'string')
        .map((s) => ({
          itemId: s.itemId as string,
          due: s.due as string,
          stage: Math.max(0, Math.min(INTERVALS.length - 1, Math.round(num(s.stage)))),
          streak: Math.max(0, Math.round(num(s.streak))),
        }))
    : [];
  const stock: Partial<Record<BlockId, number>> = {};
  if (isRecord(raw.stock)) {
    for (const [id, n] of Object.entries(raw.stock)) if (id in BLOCKS) stock[id as BlockId] = Math.max(0, Math.round(num(n)));
  }
  const st = isRecord(raw.streak) ? raw.streak : {};
  const types: Record<string, TypeStats> = {};
  if (isRecord(raw.types)) {
    for (const [id, t] of Object.entries(raw.types)) {
      if (!isRecord(t)) continue;
      types[id] = { level: Math.max(1, Math.round(num(t.level, 1))), recent: Array.isArray(t.recent) ? t.recent.map((x) => num(x)).slice(-2) : [] };
    }
  }
  const fluency: Record<string, number[]> = {};
  if (isRecord(raw.fluency)) {
    for (const [id, arr] of Object.entries(raw.fluency))
      if (Array.isArray(arr))
        fluency[id] = arr
          .map((x) => num(x))
          .filter((x) => x > 0)
          .slice(-10);
  }
  // Ancien chantier (grille 8 × 8, avant le village) : les blocs reviennent dans l'inventaire.
  if (Array.isArray(raw.build)) {
    for (const c of raw.build) {
      if (isRecord(c) && typeof c.block === 'string' && c.block in BLOCKS) stock[c.block as BlockId] = (stock[c.block as BlockId] ?? 0) + 1;
    }
  }
  const world = isRecord(raw.world) ? raw.world : {};
  // Ancienne zone libre (tapis jaune) : les blocs posés reviennent aussi dans l'inventaire.
  if (isRecord(world.placed)) {
    for (const cells of Object.values(world.placed)) {
      if (!Array.isArray(cells)) continue;
      for (const c of cells) {
        if (isRecord(c) && typeof c.block === 'string' && c.block in BLOCKS) stock[c.block as BlockId] = (stock[c.block as BlockId] ?? 0) + 1;
      }
    }
  }
  // Les plans des îles et les étapes du Bloc-Navire se rangent au même endroit.
  const anyPlan = (id: string) => getPlan(id) ?? getStage(id) ?? getMonument(id);
  const parts: Record<string, string[]> = {};
  // Les sauvegardes d'avant le nouveau dessin des bâtiments (plansV1.ts) : on les reconnaît à une case posée hors du
  // nouveau dessin (aucun ancien plan n'y est tout entier). Un plan terminé avec l'ancien dessin reste terminé, et son
  // coffre, déjà ouvert, donne ce que le nouveau donne en plus ; sinon, les blocs posés hors du nouveau dessin reviennent
  // dans l'inventaire.
  if (isRecord(world.parts)) {
    for (const [id, keys] of Object.entries(world.parts)) {
      // La petite construction d'une commande livrée (GD-7) : son identifiant prouve la livraison, pas le dessin de sa
      // forme. Une liste de clés non vide se relit posée avec la forme d'aujourd'hui, même si la forme a changé depuis
      // (retouches du directeur artistique) ; une liste vide ou illisible, pas posée.
      const petite = casesDeLaPetiteConstruction(id);
      if (petite) {
        if (Array.isArray(keys) && keys.some((k) => typeof k === 'string')) parts[id] = petite.map((c) => c.key);
        continue;
      }
      // La construction qui réunit deux lieux (GD-9) : sa forme dépend de la place de la paire, lue plus tard ; ses clés
      // (dans le repère de la paire) se gardent telles qu'elles sont écrites : rien de posé ne se perd.
      // Les clés lues sont plafonnées (`MAX_JOIN_KEYS`) : une sauvegarde abîmée ne gonfle pas la partie.
      if (pairOfJoinId(id)) {
        const lues = Array.isArray(keys) ? keys.slice(0, MAX_JOIN_KEYS) : [];
        const posees = [...new Set(lues.filter((k): k is string => typeof k === 'string' && k.length <= 24 && /^-?\d{1,4},-?\d{1,4},-?\d{1,4}$/.test(k)))];
        if (posees.length) parts[id] = posees;
        continue;
      }
      const plan = anyPlan(id);
      if (!plan || !Array.isArray(keys)) continue;
      const cells = planCells(plan);
      const valid = new Set(cells.map((c) => c.key));
      const saved = [...new Set(keys.filter((k): k is string => typeof k === 'string'))];
      // Une étape du Bloc-Navire d'avant la Nef (GD-15), reconnue à une case posée hors du nouveau dessin : finie, elle
      // le reste ; commencée, ses blocs reviennent tous dans l'inventaire (la nouvelle forme se pose de zéro).
      const navire = formerVehicleStage(id);
      if (navire && saved.some((k) => !valid.has(k) && navire.has(k))) {
        if ([...navire.keys()].every((k) => saved.includes(k))) parts[id] = cells.map((c) => c.key);
        else
          for (const k of saved) {
            const b = navire.get(k);
            if (b) stock[b] = (stock[b] ?? 0) + 1;
          }
        continue;
      }
      const old = saved.some((k) => !valid.has(k)) ? planV1(id) : undefined;
      if (old && [...old.blocks.keys()].every((k) => saved.includes(k))) {
        parts[id] = cells.map((c) => c.key);
        for (const [b, n] of Object.entries(plan.reward.chest)) {
          const more = (n ?? 0) - (old.chest[b as BlockId] ?? 0);
          if (more > 0) stock[b as BlockId] = (stock[b as BlockId] ?? 0) + more;
        }
        continue;
      }
      if (old)
        for (const k of saved) {
          const b = old.blocks.get(k);
          if (b && !valid.has(k)) stock[b] = (stock[b] ?? 0) + 1;
        }
      const list = saved.filter((k) => valid.has(k));
      if (list.length) parts[id] = list;
    }
  }
  const log: LogEntry[] = Array.isArray(world.log)
    ? world.log
        .filter((e): e is Record<string, unknown> => isRecord(e) && typeof e.day === 'string' && typeof e.part === 'string' && Boolean(anyPlan(e.part as string) ?? pairOfJoinId(e.part as string)))
        .map((e) => ({ day: e.day as string, part: e.part as string }))
        .slice(-100)
    : [];
  // Ouvrages et voyages : liste d'identifiants connus ; une sauvegarde d'avant les ponts reçoit ceux des îles déjà ouvertes.
  // Une sauvegarde du continent d'avant les archipels (escaliers, tunnels entre classes) garde toutes ses îles ouvertes :
  // les voyages et le chemin qui y mènent sont offerts.
  const rawIds = Array.isArray(world.links) ? world.links.filter((id): id is string => typeof id === 'string') : null;
  let links = rawIds ? [...new Set(rawIds.filter((id) => Boolean(getBridge(id) ?? getVoyage(id))))] : bridgesFromLegacyProgress(progress);
  if (rawIds && rawIds.some((id) => !getBridge(id) && !getVoyage(id))) links = grantAccess(links, legacyReachable(rawIds));
  // Une île où l'on a déjà joué ou vaincu le Gardien reste ouverte, quoi qu'il arrive aux ouvrages ; un exercice arrivé
  // d'un autre lieu n'ouvre pas le sien (`arrivedFromAnotherPlace`).
  const arrived = arrivedFromAnotherPlace();
  const played = new Set<BiomeId>();
  for (const [id, p] of Object.entries(progress)) {
    if (p.stars < 1 || arrived.has(id)) continue;
    const biome = placeOf(id);
    if (biome) played.add(biome.id);
  }
  links = grantAccess(links, played);
  // Un voyage fait : son étape du Bloc-Navire est forcément complète (on la dessine entière).
  for (const id of links) {
    const stage = stageFor(id);
    if (stage && (parts[stage.id]?.length ?? 0) < stage.cells.length) parts[stage.id] = planCells(stage).map((c) => c.key);
  }
  // Le bonhomme : sur une île ouverte, sinon on l'oublie (il repart de la Forêt).
  const place = typeof world.place === 'string' && getBiome(world.place) && isBiomeUnlocked(world.place as BiomeId, links) ? (world.place as BiomeId) : undefined;
  // Le tirage des questions d'assemblage : seulement pour un bloc qui a sa recette ou une banque de projets (GD-10), et
  // seulement s'il y en a un.
  const assemblyDraw: Partial<Record<DrawKey, TirageAssemblage>> = {};
  if (isRecord(raw.assemblyDraw)) {
    for (const [bloc, t] of Object.entries(raw.assemblyDraw)) {
      const connu = (Object.hasOwn(BLOCKS, bloc) && recetteDe(bloc as BlockId)) || PROJECT_BANKS.includes(bloc as DrawKey);
      const lu = connu ? lireTirage(t) : undefined;
      if (lu) assemblyDraw[bloc as DrawKey] = lu;
    }
  }
  // La disposition des régions (GD-9) : sa forme seulement ; invalide, la région revient à la carte de départ.
  const layout = sanitizeLayout(world.layout);
  // Les commandes arrivées (GD-7) : connues, sans doublon, pas encore livrées, dans l'ordre d'arrivée, trois au plus par
  // archipel ; absentes d'une sauvegarde d'avant les commandes, qui ne perd rien.
  const requests: string[] = [];
  if (Array.isArray(world.requests))
    for (const id of world.requests) {
      const c = typeof id === 'string' ? getCommande(id) : undefined;
      if (!c || requests.includes(c.id) || estPosee(parts, c.fixture)) continue;
      if (requests.filter((r) => archipelDeLaCommande(getCommande(r)!) === archipelDeLaCommande(c)).length >= MAX_COMMANDES_OUVERTES) continue;
      requests.push(c.id);
    }
  // Les quêtes ouvertes (GD-10) : connues, pas finies, une par région, à une étape qui existe ; absentes d'une
  // sauvegarde d'avant les quêtes, qui ne perd rien.
  const stories: { id: string; step: number }[] = [];
  if (Array.isArray(world.stories))
    for (const o of world.stories) {
      const story = isRecord(o) && typeof o.id === 'string' ? getStory(o.id) : undefined;
      const step = story && typeof o.step === 'number' && Number.isInteger(o.step) ? o.step : -1;
      if (!story || step < 0 || step >= story.steps.length || isStoryDone({ parts }, story)) continue;
      if (stories.some((x) => getStory(x.id)!.region === story.region)) continue;
      stories.push({ id: story.id, step });
    }
  // Les défis restés ouverts après le déplacement (core/movedChallenges.ts) : des lieux touchés par le déplacement, sans
  // doublon, dont le défi n'est pas encore réussi ; une fois le Gardien rallumé, le lieu n'a plus rien à y faire.
  const challengesKeptOpen: BiomeId[] = [];
  if (Array.isArray(world.challengesKeptOpen))
    for (const id of world.challengesKeptOpen) {
      if (typeof id !== 'string' || !isMovedPlace(id) || challengesKeptOpen.includes(id) || isBossBeaten(id, progress)) continue;
      challengesKeptOpen.push(id);
    }
  return {
    version: GAME_VERSION,
    progress,
    spaced,
    stock,
    streak: { current: Math.max(0, Math.round(num(st.current))), lastDay: typeof st.lastDay === 'string' ? st.lastDay : null, cracked: Boolean(st.cracked) },
    types,
    chests: Math.max(0, Math.round(num(raw.chests))),
    fluency,
    world: { parts, log, links, ...(place ? { place } : {}), ...(requests.length ? { requests } : {}), ...(stories.length ? { stories } : {}), ...(layout ? { layout } : {}), ...(challengesKeptOpen.length ? { challengesKeptOpen } : {}) },
    ...(Object.keys(assemblyDraw).length ? { assemblyDraw } : {}),
  };
}

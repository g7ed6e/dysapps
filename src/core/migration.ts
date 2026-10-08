// La sauvegarde aux mots neutres (décision du mainteneur, 2 octobre 2026) : ses clés et ses champs sont en anglais, sans
// mot d'univers. Une sauvegarde d'avant est traduite au chargement, sans rien perdre : la traduction est écrite, relue,
// et seulement alors l'ancienne clé est effacée. Logique pure, sauf `migrateStorage`, qui lit et écrit l'appareil.
import { sauvegardeGelee, STORAGE_PREFIX, tryRemove, trySaveJSON } from './storage';
import {
  translateAssemblyKey,
  translateExerciseId,
  translateItemId,
  translateLinkId,
  translateMissionId,
  translatePartId,
  translatePath,
  translatePlaceId,
  translateResourceId,
} from './legacyIds';
import { challengesOpenBeforeMove } from './movedChallenges';
import { RETIRED_ITEMS, STARS_KEPT_IN_MISSION, movedExerciseId, movedItemId } from './movedIds';

/**
 * Le format de la partie (`dysapps:game`) : 2 depuis les champs neutres, 3 depuis les identifiants neutres (lieux,
 * ressources, parties, missions, exercices), 4 depuis les exercices déplacés par les programmes de 2025-2026
 * (movedIds.ts). Une partie sans numéro est d'avant.
 *
 * Limite connue du format 4 : un onglet resté ouvert sur le code d'avant relit une partie au format 4 sans la
 * comprendre. Sa propre lecture (sanitize d'avant) ouvre les lieux où sont arrivés des exercices déplacés (ses étoiles
 * comptent pour un lieu fermé) et perd `challengesKeptOpen`, qu'il ne connaît pas. S'il enregistre (au format 3),
 * les lieux ouverts le restent, et la migration, qui repasse à la lecture suivante, ne retrouve plus les défis gardés
 * ouverts sur une progression déjà déplacée. Les étoiles et la file de révision ne se perdent pas : `moveExercises`
 * réunit les deux identifiants. La mise à jour est proposée, jamais imposée (docs/conception/deploiement.md).
 */
export const GAME_VERSION = 4;
/** Le format des identifiants neutres : une partie à ce format, ou à un format plus récent, ne repasse pas par legacyIds. */
const NEUTRAL_IDS_VERSION = 3;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Renomme un champ ; s'il existe déjà sous le nouveau nom, le nouveau a priorité et l'ancien disparaît. */
function renameField(o: Record<string, unknown>, from: string, to: string): void {
  if (!Object.hasOwn(o, from)) return;
  if (!Object.hasOwn(o, to)) o[to] = o[from];
  delete o[from];
}

function renameFields(o: Record<string, unknown>, names: Record<string, string>): void {
  for (const [from, to] of Object.entries(names)) renameField(o, from, to);
}

/** Les champs de la partie, puis ceux du monde et de son journal. Ce qui n'est pas nommé ici passe tel quel. */
const GAME_FIELDS = {
  inventory: 'stock',
  fluence: 'fluency',
  assemblageTirage: 'assemblyDraw',
  village: 'world',
};
const WORLD_FIELDS = {
  plans: 'parts',
  bridges: 'links',
  at: 'place',
  journal: 'log',
};
const LOG_FIELDS = { plan: 'part' };
const PROGRESS_FIELDS = {
  plansCompleted: 'structuresCompleted',
  bossesBeaten: 'challengesWon',
  voyages: 'passages',
  monumentsCompleted: 'landmarksCompleted',
};
/** Les valeurs des réglages qui changent de mot ; les autres (polices, univers, langues) restent. */
const SETTINGS_VALUES: Record<string, Record<string, string>> = {
  startIn: { village: 'world' },
  theme: { creme: 'cream', nuit: 'night', clair: 'light' },
  worldView: { liste: 'list' },
  worldLight: { reelle: 'real', jour: 'day' },
  lv2: { aucune: 'none' },
};

/** Les clés d'un objet traduites par `f` ; deux anciennes clés qui donnent la même gardent la première. */
function mapKeys(v: unknown, f: (k: string) => string): unknown {
  if (!isRecord(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    const t = f(k);
    // Une clé `__proto__` (fichier abîmé ou fabriqué) changerait le prototype de l'objet : elle est laissée de côté.
    if (t === '__proto__') continue;
    if (!Object.hasOwn(out, t)) out[t] = x;
  }
  return out;
}

const mapStrings = (v: unknown, f: (s: string) => string): unknown =>
  Array.isArray(v) ? v.map((x: unknown) => (typeof x === 'string' ? f(x) : x)) : v;

/** Le tirage des questions d'un bloc assemblé : ses listes de questions. */
function translateDraw(v: unknown): unknown {
  if (!isRecord(v)) return v;
  const out = { ...v };
  for (const list of ['posees', 'recentes', 'ratees']) out[list] = mapStrings(out[list], translateAssemblyKey);
  return out;
}

/**
 * Les identifiants d'avant (noms français des îles, des blocs, des plans, des quêtes : `foret`, `bois`,
 * `foret-chasse-son-an`) aux identifiants neutres (`french-6e-phonology`…), dans une partie aux champs neutres. Les
 * étoiles, le stock, la file de révision, les niveaux, les parties posées et les liaisons gardent tout ce qu'ils avaient.
 */
function translateIds(game: Record<string, unknown>): void {
  game.progress = mapKeys(game.progress, translateExerciseId);
  game.fluency = mapKeys(game.fluency, translateExerciseId);
  game.types = mapKeys(game.types, translateMissionId);
  game.stock = mapKeys(game.stock, translateResourceId);
  if (Array.isArray(game.spaced))
    game.spaced = game.spaced.map((s: unknown) =>
      isRecord(s) && typeof s.itemId === 'string' ? { ...s, itemId: translateItemId(s.itemId) } : s,
    );
  if (isRecord(game.assemblyDraw)) {
    const draws = mapKeys(game.assemblyDraw, translateResourceId) as Record<string, unknown>;
    for (const k of Object.keys(draws)) draws[k] = translateDraw(draws[k]);
    game.assemblyDraw = draws;
  }
  // Les plus anciennes formes (le chantier 8 × 8, la zone libre) : leurs blocs reviennent au stock à la lecture.
  const blocks = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map((c: unknown) => (isRecord(c) && typeof c.block === 'string' ? { ...c, block: translateResourceId(c.block) } : c))
      : v;
  game.build = blocks(game.build);
  if (isRecord(game.world)) {
    const world = game.world;
    if (isRecord(world.placed)) world.placed = Object.fromEntries(Object.entries(world.placed).map(([k, v]) => [k, blocks(v)]));
    world.parts = mapKeys(world.parts, translatePartId);
    world.links = mapStrings(world.links, translateLinkId);
    if (typeof world.place === 'string') world.place = translatePlaceId(world.place);
    if (Array.isArray(world.log))
      world.log = world.log.map((e: unknown) => (isRecord(e) && typeof e.part === 'string' ? { ...e, part: translatePartId(e.part) } : e));
  }
}

/** Deux progressions d'un même exercice réunies : les meilleures étoiles, le meilleur score, les parties cumulées. */
function mergeProgress(a: unknown, b: unknown): unknown {
  if (!isRecord(a) || !isRecord(b)) return isRecord(a) ? a : b;
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return { ...a, stars: Math.max(n(a.stars), n(b.stars)), attempts: n(a.attempts) + n(b.attempts), best: Math.max(n(a.best), n(b.best)) };
}

/**
 * Les exercices déplacés par les programmes de 2025-2026 (format 4, movedIds.ts) : leurs étoiles et leur file de
 * révision passent au nouvel identifiant, sans rien perdre ; une mission qui perd un niveau garde ses étoiles
 * (STARS_KEPT_IN_MISSION) ; un item retiré (RETIRED_ITEMS) quitte la file. Si le nouvel identifiant a déjà une
 * progression (un onglet resté ouvert sur la version d'avant), les deux se réunissent. Les niveaux adaptés (`types`) ne
 * bougent pas : les missions déplacées gardent leur type (`subtracting`), les autres repartent du niveau 1, qui est leur
 * premier niveau. Le stock, les parties posées et les liaisons ne dépendent pas des exercices : ils restent tels quels.
 */
function moveExercises(game: Record<string, unknown>): void {
  if (isRecord(game.progress)) {
    const out: Record<string, unknown> = {};
    for (const [id, p] of Object.entries(game.progress)) {
      const to = movedExerciseId(id);
      if (to === '__proto__') continue;
      out[to] = Object.hasOwn(out, to) ? mergeProgress(out[to], p) : p;
    }
    // Une mission qui perd un niveau garde ses étoiles dans un niveau qui reste (STARS_KEPT_IN_MISSION).
    for (const [from, keep] of Object.entries(STARS_KEPT_IN_MISSION)) {
      const p = game.progress[from];
      const stars = isRecord(p) && Number.isFinite(Number(p.stars)) ? Number(p.stars) : 0;
      if (stars <= 0) continue;
      const kept = out[keep];
      const best = Number((p as { best?: unknown }).best) || 0;
      out[keep] = isRecord(kept)
        ? { ...kept, stars: Math.max(Number(kept.stars) || 0, stars), best: Math.max(Number(kept.best) || 0, best) }
        : { stars, attempts: 0, best };
    }
    game.progress = out;
  }
  if (Array.isArray(game.spaced)) {
    const seen = new Set<string>();
    game.spaced = game.spaced.flatMap((s: unknown) => {
      if (!isRecord(s) || typeof s.itemId !== 'string') return [s];
      // Un item retiré par le lot n'a plus d'écran : il quitte la file.
      if (RETIRED_ITEMS.has(s.itemId)) return [];
      const itemId = movedItemId(s.itemId);
      // Un même item deux fois (déjà déplacé par un autre onglet) : la première entrée reste.
      if (seen.has(itemId)) return [];
      seen.add(itemId);
      return [{ ...s, itemId }];
    });
  }
}

/**
 * Les défis ouverts avant le déplacement (format 4, movedChallenges.ts) : lus sur la progression d'avant, ils restent
 * ouverts jusqu'à ce qu'ils soient réussis. La liste des lieux va dans le monde (`challengesKeptOpen`), seulement s'il
 * y en a ; une partie neuve n'en a jamais.
 */
function keepChallengesOpen(game: Record<string, unknown>): void {
  if (!isRecord(game.progress)) return;
  const open = challengesOpenBeforeMove(game.progress);
  if (!open.length) return;
  const world = isRecord(game.world) ? game.world : {};
  const before = Array.isArray(world.challengesKeptOpen) ? world.challengesKeptOpen.filter((id): id is string => typeof id === 'string') : [];
  game.world = { ...world, challengesKeptOpen: [...new Set([...before, ...open])] };
}

/** Le numéro de format d'une partie, 0 si elle n'en a pas. */
const versionOf = (game: Record<string, unknown>): number => (typeof game.version === 'number' ? game.version : 0);

/**
 * La partie aux mots neutres : ses champs, puis, si elle est d'avant le format 3, ses identifiants, puis, d'avant le
 * format 4, ses défis ouverts (`keepChallengesOpen`) et ses exercices déplacés. Les données inconnues (anciennes
 * formes comme `build` ou `placed`) passent telles quelles.
 */
export function translateGame(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const out: Record<string, unknown> = { ...input };
  renameFields(out, GAME_FIELDS);
  if (isRecord(out.world)) {
    const world: Record<string, unknown> = { ...out.world };
    renameFields(world, WORLD_FIELDS);
    if (Array.isArray(world.log))
      world.log = world.log.map((e: unknown) => {
        if (!isRecord(e)) return e;
        const entry = { ...e };
        renameFields(entry, LOG_FIELDS);
        return entry;
      });
    out.world = world;
  }
  const version = versionOf(out);
  if (version < NEUTRAL_IDS_VERSION) translateIds(out);
  if (version < GAME_VERSION) {
    keepChallengesOpen(out);
    moveExercises(out);
  }
  return out;
}

/** Les Gardiens déjà vus rallumés, par lieu. */
const translateGuardiansSeen = (v: unknown): unknown => mapKeys(v, translatePlaceId);

/**
 * « Ma dernière mission » : l'adresse de la dernière page ouverte, sous les mots neutres. Une mission déplacée
 * (movedIds.ts) garde ici son adresse d'avant : `lastPlace` la suit à la lecture, avec le libellé de sa nouvelle place.
 */
function translateResume(v: unknown): unknown {
  return isRecord(v) && typeof v.path === 'string' ? { ...v, path: translatePath(v.path) } : v;
}

/** La progression (XP, compteurs, succès) aux mots neutres. */
export function translateProgress(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const out = { ...input };
  renameFields(out, PROGRESS_FIELDS);
  return out;
}

/** Les réglages aux mots neutres : seules des valeurs changent, jamais une clé. */
export function translateSettings(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const out = { ...input };
  for (const [field, values] of Object.entries(SETTINGS_VALUES)) {
    const v = out[field];
    if (typeof v === 'string' && Object.hasOwn(values, v)) out[field] = values[v];
  }
  return out;
}

/** Un message déjà dit (`{ dit }`) aux mots neutres (`{ said }`). */
function translateSaid(input: unknown): unknown {
  if (!isRecord(input)) return input;
  const out = { ...input };
  renameField(out, 'dit', 'said');
  return out;
}

const withVersion = (v: unknown): unknown => {
  const t = translateGame(v);
  return isRecord(t) ? { ...t, version: GAME_VERSION } : t;
};
const same = (v: unknown) => v;

/** Les clés qui changent de nom (sans le préfixe `dysapps:`), avec la traduction de ce qu'elles rangent. */
export const KEY_MOVES: readonly {
  from: string;
  to: string;
  translate: (v: unknown) => unknown;
}[] = [
  { from: 'blocland', to: 'game', translate: withVersion },
  { from: 'reprise', to: 'resume', translate: translateResume },
  { from: 'tutos', to: 'tutorials', translate: same },
  { from: 'baleine', to: 'guide-messages', translate: same },
  {
    from: 'rallumage',
    to: 'guardians-seen',
    translate: translateGuardiansSeen,
  },
  { from: 'noms-archipels', to: 'region-names', translate: translateSaid },
  { from: 'univers-message', to: 'universe-message', translate: translateSaid },
];

/** Une partie déjà au format courant ne se retraduit pas (elle est lue à chaque chargement). */
const gameInPlace = (v: unknown): unknown => (isRecord(v) && v.version === GAME_VERSION ? v : withVersion(v));

/**
 * Les clés qui gardent leur nom, mais dont le contenu se traduit sur place. `region-names` et `universe-message` y
 * reviennent après KEY_MOVES : leur nom a déjà changé, mais un ancien champ `dit` peut y être resté.
 */
const IN_PLACE: readonly { key: string; translate: (v: unknown) => unknown }[] = [
  { key: 'game', translate: gameInPlace },
  { key: 'progress', translate: translateProgress },
  { key: 'settings', translate: translateSettings },
  { key: 'resume', translate: translateResume },
  { key: 'guardians-seen', translate: translateGuardiansSeen },
  { key: 'region-names', translate: translateSaid },
  { key: 'universe-message', translate: translateSaid },
];

/** La valeur JSON rangée sous une clé, `undefined` si elle est absente ou illisible. */
function read(key: string): { raw: string; value: unknown } | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return undefined;
    return { raw, value: JSON.parse(raw) as unknown };
  } catch {
    return undefined;
  }
}

/** Écrit puis relit : vrai seulement si l'appareil a bien gardé la valeur. */
function writeChecked(key: string, value: unknown): boolean {
  if (!trySaveJSON(key, value)) return false;
  return read(key)?.raw === JSON.stringify(value);
}

/**
 * Traduit la sauvegarde de l'appareil aux mots neutres, avant le premier rendu (src/main.tsx) et après la restauration
 * d'un fichier. Pour chaque ancienne clé : sa traduction est écrite sous la nouvelle, relue, puis seulement l'ancienne est
 * effacée ; une écriture refusée (stockage plein) laisse l'ancienne, qui sera traduite au prochain chargement. Si la
 * nouvelle clé existe déjà, l'ancienne a priorité : elle vient d'un onglet resté sur la version d'avant, qui a joué
 * après la migration (ou d'une migration interrompue, et sa traduction est alors la même). Une sauvegarde gelée n'est
 * pas touchée. Idempotent.
 */
export function migrateStorage(): void {
  if (sauvegardeGelee()) return;
  for (const { from, to, translate } of KEY_MOVES) {
    const old = read(from);
    if (old === undefined) continue;
    if (writeChecked(to, translate(old.value))) tryRemove(from);
  }
  for (const { key, translate } of IN_PLACE) {
    const cur = read(key);
    if (cur === undefined) continue;
    const next = translate(cur.value);
    if (JSON.stringify(next) !== cur.raw) writeChecked(key, next);
  }
}

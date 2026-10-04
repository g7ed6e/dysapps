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

/**
 * Le format de la partie (`dysapps:game`) : 2 depuis les champs neutres, 3 depuis les identifiants neutres (lieux,
 * ressources, parties, missions, exercices). Une partie sans numéro est d'avant.
 */
export const GAME_VERSION = 3;

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

/**
 * La partie aux mots neutres : ses champs, puis, si elle est d'avant le format 3, ses identifiants. Les données
 * inconnues (anciennes formes comme `build` ou `placed`) passent telles quelles.
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
  if (out.version !== GAME_VERSION) translateIds(out);
  return out;
}

/** Les Gardiens déjà vus rallumés, par lieu. */
export const translateGuardiansSeen = (v: unknown): unknown => mapKeys(v, translatePlaceId);

/** « Ma dernière mission » : l'adresse de la dernière page ouverte. */
export function translateResume(v: unknown): unknown {
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
export function translateSaid(input: unknown): unknown {
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

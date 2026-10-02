// La sauvegarde aux mots neutres (décision du mainteneur, 2 octobre 2026) : ses clés et ses champs sont en anglais, sans
// mot d'univers. Une sauvegarde d'avant est traduite au chargement, sans rien perdre : la traduction est écrite, relue,
// et seulement alors l'ancienne clé est effacée. Logique pure, sauf `migrateStorage`, qui lit et écrit l'appareil.
import { sauvegardeGelee, STORAGE_PREFIX, tryRemove, trySaveJSON } from './storage';

/** Le format de la partie (`dysapps:game`) : 2 depuis les mots neutres. Une partie sans numéro est d'avant. */
export const GAME_VERSION = 2;

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
const GAME_FIELDS = { inventory: 'stock', fluence: 'fluency', assemblageTirage: 'assemblyDraw', village: 'world' };
const WORLD_FIELDS = { plans: 'parts', bridges: 'links', at: 'place', journal: 'log' };
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

/** La partie aux mots neutres. Les données inconnues (anciennes formes comme `build` ou `placed`) passent telles quelles. */
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
  return out;
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
export const KEY_MOVES: readonly { from: string; to: string; translate: (v: unknown) => unknown }[] = [
  { from: 'blocland', to: 'game', translate: withVersion },
  { from: 'reprise', to: 'resume', translate: same },
  { from: 'tutos', to: 'tutorials', translate: same },
  { from: 'baleine', to: 'guide-messages', translate: same },
  { from: 'rallumage', to: 'guardians-seen', translate: same },
  { from: 'noms-archipels', to: 'region-names', translate: translateSaid },
  { from: 'univers-message', to: 'universe-message', translate: translateSaid },
];

/** Les clés qui gardent leur nom, mais dont le contenu se traduit sur place. */
const IN_PLACE: readonly { key: string; translate: (v: unknown) => unknown }[] = [
  { key: 'game', translate: withVersion },
  { key: 'progress', translate: translateProgress },
  { key: 'settings', translate: translateSettings },
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
 * nouvelle clé existe déjà, elle a priorité et l'ancienne, restée d'une migration interrompue, est effacée. Une
 * sauvegarde gelée n'est pas touchée. Idempotent.
 */
export function migrateStorage(): void {
  if (sauvegardeGelee()) return;
  for (const { from, to, translate } of KEY_MOVES) {
    const old = read(from);
    if (old === undefined) continue;
    if (read(to) !== undefined) {
      tryRemove(from);
      continue;
    }
    if (writeChecked(to, translate(old.value))) tryRemove(from);
  }
  for (const { key, translate } of IN_PLACE) {
    const cur = read(key);
    if (cur === undefined) continue;
    const next = translate(cur.value);
    if (JSON.stringify(next) !== cur.raw) writeChecked(key, next);
  }
}

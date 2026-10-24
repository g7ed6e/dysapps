// Le geste « ranger » (GD-20, point 8 : trois gestes, toucher, marquer puis valider, ranger ; condition ferme : toucher
// l'objet, puis le panier, aucun glissement obligatoire). L'état d'une manche, pur et testé à part (avis d'architecture de
// l'expert frontend, lot L4) : l'objet tenu, et le panier de chaque objet rangé. Les paniers ont des identifiants
// quelconques (aux Filets, les catégories du contenu : `singulier`, `pluriel`), pour servir aux lieux suivants. Rien
// ne se perd : un objet rangé se reprend jusqu'à « Valider ».

/** Une manche en cours : l'objet tenu (sa clé, ou rien), et le panier de chaque objet rangé. */
export interface Rangement {
  held: string | null;
  placed: Readonly<Record<string, string>>;
}

/** Rien de tenu, rien de rangé : le début d'une manche. */
export const EMPTY_RANGEMENT: Rangement = { held: null, placed: {} };

/** Sans l'objet `key` parmi les rangés. */
function without(placed: Readonly<Record<string, string>>, key: string): Record<string, string> {
  const rest: Record<string, string> = {};
  for (const [k, bin] of Object.entries(placed)) if (k !== key) rest[k] = bin;
  return rest;
}

/**
 * Prendre l'objet `key` : il est tenu ; s'il était rangé, il sort de son panier (on le reprend). Le toucher alors qu'on
 * le tient le repose (`cancel`).
 */
export function take(s: Rangement, key: string): Rangement {
  if (s.held === key) return cancel(s);
  return { held: key, placed: Object.hasOwn(s.placed, key) ? without(s.placed, key) : s.placed };
}

/** Ranger l'objet tenu dans le panier `bin` ; sans objet tenu, rien ne change. */
export function drop(s: Rangement, bin: string): Rangement {
  if (s.held === null) return s;
  return { held: null, placed: { ...s.placed, [s.held]: bin } };
}

/** Reposer l'objet tenu (le toucher de nouveau, Échap) : il revient sur le filet, rien ne se perd. */
export function cancel(s: Rangement): Rangement {
  return s.held === null ? s : { held: null, placed: s.placed };
}

/** Tout reprendre : une nouvelle manche. */
export const reset = (): Rangement => EMPTY_RANGEMENT;

/** Tous les objets `keys` sont-ils rangés ? (« Valider » attend les quatre rangées, comme l'écran de la grille.) */
export const complete = (s: Rangement, keys: readonly string[]): boolean => keys.every((k) => Object.hasOwn(s.placed, k));

/** Le panier où l'objet `key` est rangé, ou `null`. */
export const binOf = (s: Rangement, key: string): string | null => (Object.hasOwn(s.placed, key) ? s.placed[key] : null);

/**
 * Le dernier objet rangé dans le panier `bin`, ou `null` : `placed` garde l'ordre des dépôts (un objet repris en sort, il
 * revient en dernier quand on le range de nouveau), sauf pour une clé faite de chiffres, que les objets JavaScript
 * rangent avant les autres.
 */
export function lastIn(s: Rangement, bin: string): string | null {
  const keys = Object.keys(s.placed).filter((k) => s.placed[k] === bin);
  return keys.length > 0 ? keys[keys.length - 1] : null;
}

/** La correction d'une manche : un objet est juste quand son panier est sa réponse (comme l'Enclos de la grille). */
export function rangementResults(s: Rangement, items: readonly { key: string; answer: unknown }[]): { key: string; correct: boolean }[] {
  return items.map((it) => ({ key: it.key, correct: binOf(s, it.key) === it.answer }));
}

/**
 * Les places de la rangée du geste « ranger » : les paniers aux deux bouts (la première moitié à gauche, le reste à
 * droite ; directeur artistique, lot L4), les objets entre eux, dans leur ordre.
 */
export function sortSlots(objects: number, bins: number): { objects: number[]; bins: number[]; count: number } {
  const left = Math.ceil(bins / 2);
  return {
    objects: Array.from({ length: objects }, (_, i) => left + i),
    bins: Array.from({ length: bins }, (_, j) => (j < left ? j : objects + j)),
    count: objects + bins,
  };
}

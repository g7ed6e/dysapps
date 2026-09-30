// Écarter les étiquettes des îles pour qu'aucune n'en cache une autre (la Carte en montre une dizaine, sur deux lignes).
// Calcul pur, en pixels d'écran, partagé par la vue 3D et la vue 2D : chaque étiquette essaie sa place, puis des places
// voisines de plus en plus loin (dessous, dessus, de côté), et garde la première libre ; sinon la moins recouverte.

export interface LabelBox {
  /** Centre voulu de l'étiquette (au-dessus de son île). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelOffset {
  dx: number;
  dy: number;
}

/** Les décalages essayés, en fractions de la hauteur (dy) et de la largeur (dx) de l'étiquette, du plus proche au plus loin. */
const TRIES: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (const fy of [0, 0.55, -0.55, 1.1, -1.1, 1.65, -1.65, 2.2, -2.2, 2.75, -2.75]) for (const fx of [0, 0.3, -0.3, 0.6, -0.6]) out.push([fx, fy]);
  return out.sort((a, b) => Math.hypot(a[0] * 1.6, a[1]) - Math.hypot(b[0] * 1.6, b[1]));
})();

function overlap(a: LabelBox, b: LabelBox, gap: number): number {
  const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + gap;
  const oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2) + gap;
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

/** L'aire de l'étiquette qui sortirait du cadre. */
function outside(a: LabelBox, bounds: { w: number; h: number }): number {
  const inX = Math.max(0, Math.min(a.x + a.w / 2, bounds.w) - Math.max(a.x - a.w / 2, 0));
  const inY = Math.max(0, Math.min(a.y + a.h / 2, bounds.h) - Math.max(a.y - a.h / 2, 0));
  return a.w * a.h - inX * inY;
}

/** Un placement glouton, dans l'ordre donné : chaque étiquette prend la place libre la plus proche. */
function greedy(boxes: LabelBox[], order: number[], gap: number, bounds: { w: number; h: number } | undefined, obstacles: LabelBox[]): { out: LabelOffset[]; residue: number } {
  const placed: LabelBox[] = [...obstacles];
  const out: LabelOffset[] = new Array(boxes.length);
  let residue = 0;
  for (const i of order) {
    const given = boxes[i];
    // Au bord de l'écran, l'étiquette rentre d'abord tout entière dans le cadre (le décalage rendu inclut ce retrait).
    const b = bounds ? { ...given, x: clamp(given.x, given.w / 2 + gap, bounds.w - given.w / 2 - gap), y: clamp(given.y, given.h / 2 + gap, bounds.h - given.h / 2 - gap) } : given;
    let best: LabelOffset = { dx: 0, dy: 0 };
    let bestCost = Infinity;
    for (const [fx, fy] of TRIES) {
      const t = { dx: fx * b.w, dy: fy * b.h };
      const at = { x: b.x + t.dx, y: b.y + t.dy, w: b.w, h: b.h };
      let cost = 0;
      for (const p of placed) cost += overlap(at, p, gap);
      if (bounds) cost += outside(at, bounds) * 3;
      if (cost < bestCost) {
        best = t;
        bestCost = cost;
        if (cost === 0) break;
      }
    }
    residue += bestCost;
    placed.push({ x: b.x + best.dx, y: b.y + best.dy, w: b.w, h: b.h });
    out[i] = { dx: b.x - given.x + best.dx, dy: b.y - given.y + best.dy };
  }
  return { out, residue };
}

/**
 * Le décalage de chaque étiquette (même ordre que `boxes`). Plusieurs ordres de placement sont essayés (tel quel, de
 * haut en bas, de bas en haut, de gauche à droite, de droite à gauche, et les mêmes les plus lourdes d'abord) ; on garde celui qui laisse le moins de
 * recouvrement, puis qui éloigne le moins les étiquettes de leur île. `weights` : ce que coûte d'écarter chacune (une
 * île fermée pèse moins : c'est elle qui s'écarte). Le calcul est fait pour le cadrage où la caméra arrive, pas image
 * par image : les étiquettes ne sautent pas pendant qu'elle glisse. `gap` : l'écart minimal. `bounds` : le cadre de
 * l'écran (moins la barre du bas), dont aucune étiquette ne sort si elle peut l'éviter. `obstacles` : ce qu'aucune
 * étiquette ne doit cacher (sur la Carte, la flèche de la destination et le fanion du bonhomme).
 */
export function layoutLabels(boxes: LabelBox[], gap = 4, bounds?: { w: number; h: number }, weights?: number[], obstacles: LabelBox[] = []): LabelOffset[] {
  const ids = boxes.map((_, i) => i);
  const byWeight = (o: number[]) => (weights ? [...o].sort((a, b) => weights[b] - weights[a]) : o);
  const base = [
    ids,
    [...ids].sort((a, b) => boxes[a].y - boxes[b].y),
    [...ids].sort((a, b) => boxes[b].y - boxes[a].y),
    [...ids].sort((a, b) => boxes[a].x - boxes[b].x),
    [...ids].sort((a, b) => boxes[b].x - boxes[a].x),
  ];
  const orders = weights ? [...base, ...base.map(byWeight)] : base;
  let best: LabelOffset[] = boxes.map(() => ({ dx: 0, dy: 0 }));
  let bestCost = Infinity;
  for (const order of orders) {
    const { out, residue } = greedy(boxes, order, gap, bounds, obstacles);
    const moved = out.reduce((sum, o, i) => sum + (weights?.[i] ?? 1) * Math.hypot(o.dx, o.dy), 0);
    const cost = residue * 100 + moved;
    if (cost < bestCost) {
      best = out;
      bestCost = cost;
    }
  }
  return best;
}

/**
 * Deux repères de la Carte trop proches (la flèche de la destination et le fanion du bonhomme, sur la même île) : le
 * décalage à donner au premier pour qu'il s'écarte du second, toujours de côté (les deux pointent vers le bas, l'un
 * au-dessus de l'autre ils se confondraient). L'écart vertical compte triple ; en deçà de `min`, la flèche glisse
 * juste assez à gauche ou à droite (du côté où elle est déjà) : pas de saut quand le bonhomme bouge.
 */
export function separateMark(mark: { x: number; y: number }, from: { x: number; y: number }, min: number): LabelOffset {
  const dx = mark.x - from.x;
  const dy = (mark.y - from.y) * 3;
  if (Math.abs(dy) >= min) return { dx: 0, dy: 0 };
  const need = Math.sqrt(min * min - dy * dy);
  if (Math.abs(dx) >= need) return { dx: 0, dy: 0 };
  const side = dx < 0 ? -1 : 1;
  return { dx: from.x + side * need - mark.x, dy: 0 };
}

/**
 * Les boutons posés en haut à droite de la scène (la pause, et sous elle l'archipel où l'on est), en pixels CSS depuis le
 * coin : aucune étiquette ne passe dessous (cadrage-archipeo §7, référent dys, LV2-5).
 */
export const BOUTONS_DU_HAUT = { w: 104, h: 132 } as const;

/**
 * Hors de la Carte, les étiquettes qu'on montre : celles qui tiennent entières dans le cadre et ne passent sous aucun
 * bouton (`reserves`, des boîtes centrées). Une étiquette coupée par le bord ou cachée sous un bouton se tait plutôt que
 * de se lire à moitié : c'est l'île lointaine qui perd son nom, jamais un bouton qui se cache.
 */
export function etiquettesVisibles(boxes: LabelBox[], bounds: { w: number; h: number }, reserves: LabelBox[] = []): boolean[] {
  // Au pixel près : la projection donne des centres fractionnaires, et l'aire hors cadre d'une étiquette entière n'est
  // alors pas un zéro exact (arrondi du calcul en virgule flottante).
  return boxes.map((b) => outside(b, bounds) < 1 && reserves.every((r) => overlap(b, r, 0) < 1));
}

/** Où se pose une étiquette hors de la Carte : montrée ou non, et son écart à l'écran (en pixels CSS). */
export interface PlaceHorsCarte extends LabelOffset {
  visible: boolean;
}

/**
 * Hors de la Carte, comme `etiquettesVisibles`, mais deux étiquettes ne se taisent jamais : celle de l'île de la flèche
 * « Commence ici » et celle de l'île du bonhomme (`tenues` : le point de l'île à l'écran, ou `null` pour une autre
 * étiquette). Coupée par le bord ou sous un bouton, une étiquette tenue rentre dans le cadre, au plus près, comme sur la
 * Carte ; elle ne se cache que si son île elle-même est hors de l'écran (référent dys, LV2-5).
 */
export function etiquettesHorsCarte(
  boxes: LabelBox[],
  bounds: { w: number; h: number },
  reserves: LabelBox[],
  tenues: ({ x: number; y: number } | null)[],
): PlaceHorsCarte[] {
  const libre = (b: LabelBox) => outside(b, bounds) < 1 && reserves.every((r) => overlap(b, r, 0) < 1);
  return boxes.map((b, i) => {
    const ile = tenues[i];
    if (!ile) return { visible: libre(b), dx: 0, dy: 0 };
    if (ile.x < 0 || ile.x > bounds.w || ile.y < 0 || ile.y > bounds.h) return { visible: false, dx: 0, dy: 0 };
    if (libre(b)) return { visible: true, dx: 0, dy: 0 };
    const dans = (x: number, y: number): LabelBox => ({
      ...b,
      x: clamp(x, b.w / 2, bounds.w - b.w / 2),
      y: clamp(y, b.h / 2, bounds.h - b.h / 2),
    });
    // Les places essayées : rentrée dans le cadre, puis de part et d'autre de chaque bouton qu'elle toucherait.
    const places = [dans(b.x, b.y)];
    const gap = 4;
    for (const r of reserves) {
      const p = places[0];
      places.push(
        dans(p.x, r.y + r.h / 2 + b.h / 2 + gap),
        dans(p.x, r.y - r.h / 2 - b.h / 2 - gap),
        dans(r.x - r.w / 2 - b.w / 2 - gap, p.y),
        dans(r.x + r.w / 2 + b.w / 2 + gap, p.y),
      );
    }
    const loin = (p: LabelBox) => Math.hypot(p.x - b.x, p.y - b.y);
    const bonnes = places.filter(libre).sort((p, q) => loin(p) - loin(q));
    // Aucune place libre (un écran minuscule) : elle reste montrée, rentrée dans le cadre.
    const p = bonnes[0] ?? places[0];
    return { visible: true, dx: p.x - b.x, dy: p.y - b.y };
  });
}

/** La boîte des boutons du haut, dans un cadre de largeur `w`. */
export function boutonsDuHaut(w: number): LabelBox {
  return { x: w - BOUTONS_DU_HAUT.w / 2, y: BOUTONS_DU_HAUT.h / 2, w: BOUTONS_DU_HAUT.w, h: BOUTONS_DU_HAUT.h };
}

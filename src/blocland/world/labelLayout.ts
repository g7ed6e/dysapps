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
 * Hors de la Carte (où les étiquettes restent au-dessus de leur île sans s'écarter les unes des autres) : le décalage
 * des seules étiquettes qui couvrent un obstacle (Archipéo : la colonne d'un grand repère, le grand phare des Îles du
 * Ciel, DA-17). Chacune prend la place voisine la plus proche qui ne couvre plus aucun obstacle, sans se poser sur une
 * autre étiquette ni sortir du cadre si elle peut l'éviter ; les autres ne bougent pas. Avec `bounds`, une étiquette
 * coupée par le bord du cadre (son centre dedans) y rentre d'abord tout entière ; celle d'une île hors du cadre y reste.
 */
export function ecarterDesObstacles(boxes: LabelBox[], obstacles: LabelBox[], gap = 4, bounds?: { w: number; h: number }): LabelOffset[] {
  const rentree = (b: LabelBox): LabelBox =>
    bounds && b.x >= 0 && b.x <= bounds.w && b.y >= 0 && b.y <= bounds.h
      ? { ...b, x: clamp(b.x, b.w / 2 + gap, bounds.w - b.w / 2 - gap), y: clamp(b.y, b.h / 2 + gap, bounds.h - b.h / 2 - gap) }
      : b;
  const placed = boxes.map(rentree);
  return boxes.map((given, i) => {
    const b = placed[i];
    const retrait = { dx: b.x - given.x, dy: b.y - given.y };
    if (!obstacles.some((o) => overlap(b, o, gap) > 0)) return retrait;
    let best: LabelOffset = { dx: 0, dy: 0 };
    let bestCost = Infinity;
    for (const [fx, fy] of TRIES) {
      const t = { dx: fx * b.w, dy: fy * b.h };
      const at = { x: b.x + t.dx, y: b.y + t.dy, w: b.w, h: b.h };
      let cost = 0;
      for (const o of obstacles) cost += overlap(at, o, gap) * 100;
      placed.forEach((p, j) => {
        if (j !== i) cost += overlap(at, p, gap);
      });
      if (bounds) cost += outside(at, bounds) * 3;
      if (cost < bestCost) {
        best = t;
        bestCost = cost;
        if (cost === 0) break;
      }
    }
    placed[i] = { x: b.x + best.dx, y: b.y + best.dy, w: b.w, h: b.h };
    return { dx: retrait.dx + best.dx, dy: retrait.dy + best.dy };
  });
}

/**
 * Une étiquette se montre entière ou pas du tout (DA-10) : posée avec son décalage, elle se cache si l'interface
 * (`zones`) en couvre un morceau ou si elle déborde du cadre ; sinon elle se lit en entier.
 */
export function entiere(box: LabelBox, o: LabelOffset, zones: LabelBox[], bounds: { w: number; h: number }): boolean {
  const at = { x: box.x + o.dx, y: box.y + o.dy, w: box.w, h: box.h };
  return outside(at, bounds) < 1 && !zones.some((z) => overlap(at, z, 0) > 0);
}

/**
 * Une étiquette écartée qui s'éloigne de son île de plus que cela (en hauteurs d'étiquette, en plus de la distance où elle
 * flotte d'ordinaire au-dessus d'elle) ne désigne plus l'île.
 */
const ECART_MAX = 1.5;

/**
 * Les étiquettes à montrer : entières (voir `entiere`), près de leur île, sans se couvrir l'une l'autre. Une étiquette
 * dont l'île (`iles`, à l'écran ; sinon sa place voulue) est sous l'interface ou hors du cadre, ou que l'écart éloigne
 * de son île de plus d'`ECART_MAX` hauteurs, ne se montre pas : un nom loin de son île ne désigne rien. Quand deux se
 * chevauchent encore après l'écart, la plus lourde (`weights` : la prochaine destination, puis une île ouverte, puis une
 * île fermée), puis la première, reste. Une étiquette écartée plus près d'une autre île que de la sienne ne se montre
 * pas non plus.
 */
export function montrees(boxes: LabelBox[], offsets: LabelOffset[], zones: LabelBox[], bounds: { w: number; h: number }, weights?: number[], iles?: { x: number; y: number }[]): boolean[] {
  const ordre = boxes.map((_, i) => i).sort((a, b) => (weights ? weights[b] - weights[a] : 0) || a - b);
  const vues: LabelBox[] = [];
  const out = boxes.map(() => false);
  for (const i of ordre) {
    const b = boxes[i];
    const o = offsets[i];
    const ile = { ...(iles?.[i] ?? b), w: 1, h: 1 };
    if (outside(ile, bounds) > 0 || zones.some((z) => overlap(ile, z, 0) > 0)) continue;
    const at = { ...b, x: b.x + o.dx, y: b.y + o.dy };
    const loin = (r: LabelBox, p: { x: number; y: number } = ile) => distanceA(r, p);
    if (loin(at) > loin(b) + ECART_MAX * b.h || !entiere(b, o, zones, bounds) || vues.some((v) => overlap(at, v, 0) > 0)) continue;
    // Écartée, elle ne se pose jamais plus près d'une autre île que de la sienne : on lirait le nom sur la mauvaise île.
    if ((o.dx || o.dy) && iles?.some((p, j) => j !== i && loin(at, p) < loin(at) && loin(b, p) >= loin(b))) continue;
    out[i] = true;
    vues.push(at);
  }
  return out;
}

/**
 * Le placement des étiquettes d'une vue (3D ou 2D, DA-10) : celles dont l'île est sous l'interface ou hors du cadre ne
 * se montreront pas, et sont retirées avant l'écart pour ne pas pousser les autres ; les autres s'écartent de
 * l'interface (`zones`) et des `obstacles` (la flèche et le fanion de la Carte, les grands repères d'Archipéo) : avec
 * `carte`, les unes des autres aussi (voir `layoutLabels`) ; sans, seules celles posées dessus ou coupées par le bord
 * bougent (voir `ecarterDesObstacles`). Puis `montrees` dit lesquelles se montrent (`bulles` : les bulles passagères,
 * qui cachent sans pousser) ; celles qu'il écarte essaient encore les places simples autour de leur île.
 */
export function placerEtiquettes(
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  vue: { zones: LabelBox[]; bulles: LabelBox[]; obstacles: LabelBox[]; bounds: { w: number; h: number }; gap: number },
  carte: { weights: number[] } | null,
  tenues: number[] = [],
): { offsets: LabelOffset[]; visibles: boolean[] } {
  const { zones, bulles, obstacles, bounds, gap } = vue;
  // Hors de la Carte, les étiquettes tenues (l'île « Commence ici », l'île du bonhomme) pèsent plus que les autres : elles
  // se montrent d'abord, et prennent leur place simple à un nom plus léger (référent dys, LV2-5).
  const poidsHors = !carte && tenues.length ? boxes.map((_, i) => (tenues.includes(i) ? 2 : 1)) : undefined;
  const w = carte?.weights ?? poidsHors;
  const gardees = boxes.map((_, i) => i).filter((i) => {
    const ile = { ...iles[i], w: 1, h: 1 };
    return outside(ile, bounds) === 0 && !zones.some((z) => overlap(ile, z, 0) > 0);
  });
  const sous = gardees.map((i) => boxes[i]);
  const placees = carte
    ? layoutLabels(sous, gap, bounds, gardees.map((i) => carte.weights[i]), [...obstacles, ...zones])
    : ecarterDesObstacles(sous, [...obstacles, ...zones], gap, bounds);
  const offsets: LabelOffset[] = boxes.map(() => ({ dx: 0, dy: 0 }));
  gardees.forEach((i, k) => (offsets[i] = placees[k]));
  const couvert = [...zones, ...bulles];
  const visibles = montrees(boxes, offsets, couvert, bounds, w, iles);
  // Avant de renoncer à un nom dont l'île se voit : les places simples autour d'elle, dessus, dessous, à gauche, à
  // droite (DA-31), sans trait de rappel ni place plus loin. La plus lourde d'abord ; une place prise n'en change pas
  // tant que le cadrage ne bouge pas (le calcul ne dépend que de lui). Sur la Carte, le nom de la destination ne se
  // retire jamais pour un autre : il prend sa place simple, et le nom plus léger qui l'occupait cherche la sienne.
  const poids = (i: number) => (w ? w[i] : 1);
  const lourd = w ? Math.max(1, ...gardees.map(poids)) : Infinity;
  const destination = carte && lourd > 1 ? gardees.find((i) => poids(i) >= lourd) : undefined;
  const garde = destination === undefined ? null : gardeDeLaDestination(iles[destination], obstacles);
  const vues = new Map<number, LabelBox>();
  boxes.forEach((b, i) => {
    if (!visibles[i]) return;
    const at = { ...b, x: b.x + offsets[i].dx, y: b.y + offsets[i].dy };
    // Un autre nom posé sur l'île de destination ou contre sa flèche s'y lirait : il cherche une autre place.
    if (garde && poids(i) < lourd && overlap(at, garde, 0) > 0) visibles[i] = false;
    else vues.set(i, at);
  });
  const autour = gardees.filter((i) => !visibles[i]).sort((a, b) => poids(b) - poids(a) || a - b);
  // La boucle finit : seuls les noms du poids le plus lourd chassent, et seulement des noms strictement plus légers,
  // qui ne chassent pas ; un nom qui chasse n'est donc jamais remis dans la file.
  for (let i = autour.shift(); i !== undefined; i = autour.shift()) {
    const b = boxes[i];
    const ile = iles[i];
    const chasse = poids(i) >= lourd && lourd > 1;
    // Dessus et dessous passent un repère posé sur l'île (la flèche de la destination, le fanion) plutôt que d'y renoncer.
    const passe = (y: number, sens: 1 | -1) => {
      const gene = obstacles.filter((v) => overlap({ ...b, x: ile.x, y }, v, gap) > 0);
      if (!gene.length) return y;
      return sens < 0 ? Math.min(...gene.map((v) => v.y - v.h / 2)) - b.h / 2 - gap : Math.max(...gene.map((v) => v.y + v.h / 2)) + b.h / 2 + gap;
    };
    const places = [
      { x: ile.x, y: passe(ile.y - b.h / 2 - gap, -1) },
      { x: ile.x, y: passe(ile.y + b.h / 2 + gap, 1) },
      { x: ile.x - b.w / 2 - gap, y: ile.y },
      { x: ile.x + b.w / 2 + gap, y: ile.y },
    ];
    // La destination essaie d'abord les places libres, puis celles qu'un nom plus léger occupe.
    for (const pousser of chasse ? [false, true] : [false]) {
      const p = places.find((p, k) => {
        const at = { ...b, x: p.x, y: p.y };
        if (!entiere(b, { dx: p.x - b.x, dy: p.y - b.y }, couvert, bounds) || obstacles.some((v) => overlap(at, v, gap) > 0)) return false;
        if ([...vues].some(([j, v]) => overlap(at, v, gap) > 0 && !(pousser && poids(j) < poids(i)))) return false;
        if (garde && !chasse && overlap(at, garde, gap) > 0) return false;
        // Posé sur la flèche, le nom de la destination se lit sur son île, même au-dessus d'une île voisine.
        if (chasse && k === 0) return true;
        return !iles.some((q, j) => j !== i && distanceA(at, q) < distanceA(at, ile));
      });
      if (!p) continue;
      const at = { ...b, x: p.x, y: p.y };
      for (const [j, v] of [...vues]) {
        if (overlap(at, v, gap) <= 0) continue;
        vues.delete(j);
        visibles[j] = false;
        offsets[j] = { dx: 0, dy: 0 };
        autour.push(j);
      }
      offsets[i] = { dx: p.x - b.x, dy: p.y - b.y };
      visibles[i] = true;
      vues.set(i, at);
      break;
    }
  }
  // Une étiquette tenue dont l'île se voit ne se tait jamais : sans place simple libre, elle garde la place que lui donne
  // l'écart (rentrée dans le cadre, hors de l'interface), et les noms plus légers qu'elle couvre se taisent. Elle ne se
  // pose jamais sur un obstacle (un grand repère d'Archipéo, la flèche ou le fanion) : là, le repère l'emporte. Deux
  // étiquettes tenues ne se couvrent jamais : celle déjà montrée garde sa place, l'autre se tait (DA-10).
  for (const i of tenues) {
    if (visibles[i] || !gardees.includes(i) || !entiere(boxes[i], offsets[i], couvert, bounds)) continue;
    const at = { ...boxes[i], x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy };
    if (obstacles.some((v) => overlap(at, v, 0) > 0)) continue;
    if ([...vues].some(([j, v]) => tenues.includes(j) && overlap(at, v, 0) > 0)) continue;
    for (const [j, v] of [...vues]) {
      if (tenues.includes(j) || overlap(at, v, 0) <= 0) continue;
      vues.delete(j);
      visibles[j] = false;
    }
    visibles[i] = true;
    vues.set(i, at);
  }
  return { offsets, visibles };
}

/**
 * Sur la Carte, la garde de la destination : son île (à l'écran, le point sous son nom) et la flèche posée au-dessus,
 * où seul son nom se pose (DA-31). Les repères pris en compte sont ceux qui descendent vers l'île, à moins de trois
 * hauteurs au-dessus d'elle ; la garde descend de 32 px sous l'île, et fait au moins 72 px de large.
 */
function gardeDeLaDestination(ile: { x: number; y: number }, obstacles: LabelBox[]): LabelBox {
  const fleches = obstacles.filter((v) => v.y <= ile.y && ile.y - v.y < 3 * v.h && Math.abs(v.x - ile.x) < v.w / 2 + 36);
  const x0 = Math.min(ile.x - 36, ...fleches.map((v) => v.x - v.w / 2));
  const x1 = Math.max(ile.x + 36, ...fleches.map((v) => v.x + v.w / 2));
  const y0 = Math.min(ile.y, ...fleches.map((v) => v.y - v.h / 2));
  const y1 = ile.y + 32;
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/** La distance d'un point à une étiquette (nulle s'il est dessous). */
function distanceA(r: LabelBox, p: { x: number; y: number }): number {
  return Math.hypot(Math.max(0, Math.abs(p.x - r.x) - r.w / 2), Math.max(0, Math.abs(p.y - r.y) - r.h / 2));
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

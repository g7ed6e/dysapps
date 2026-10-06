// Écarter les étiquettes des îles pour qu'aucune n'en cache une autre (la Carte en montre une dizaine, sur deux lignes).
// Calcul pur, en pixels d'écran, pour la vue 3D : chaque étiquette essaie sa place, puis des places
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

/**
 * Ce que coûte de couvrir un obstacle souple (le tracé de l'ouvrage suggéré, GD-7), par pixel couvert, quand une
 * étiquette ou un obstacle dur coûte 1 : une étiquette s'en écarte si une place proche est libre, mais le couvre plutôt
 * que d'en couvrir une autre.
 */
const SOUPLE = 0.25;

/** Un placement glouton, dans l'ordre donné : chaque étiquette prend la place libre la plus proche. */
function greedy(
  boxes: LabelBox[],
  order: number[],
  gap: number,
  bounds: { w: number; h: number } | undefined,
  obstacles: LabelBox[],
  souples: LabelBox[] = [],
): { out: LabelOffset[]; residue: number } {
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
      for (const p of souples) cost += overlap(at, p, 0) * SOUPLE;
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
 * étiquette ne doit cacher (sur la Carte, la flèche de la destination et le fanion du bonhomme). `souples` : ce qu'une
 * étiquette évite si elle peut, sans que cela l'éloigne plus que ce que coûte d'en couvrir une autre (`SOUPLE`).
 */
export function layoutLabels(boxes: LabelBox[], gap = 4, bounds?: { w: number; h: number }, weights?: number[], obstacles: LabelBox[] = [], souples: LabelBox[] = []): LabelOffset[] {
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
    const { out, residue } = greedy(boxes, order, gap, bounds, obstacles, souples);
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
 * Le nom passe avant le signe : `placer` pose les étiquettes (`boxes`, avec le bloc de leur île) ; si des noms se taisent
 * faute de place, ceux qui ont une forme plus étroite (`etroites[i]`, la largeur sans le bloc) la reprennent et le
 * placement se refait. Ce second placement l'emporte s'il montre au moins un nom de plus. `sansSigne[i]` : l'étiquette
 * `i` se montre sans son bloc.
 */
export function replierLesSignes<R extends { visibles: boolean[] }>(
  boxes: LabelBox[],
  etroites: readonly (number | undefined)[],
  placer: (boxes: LabelBox[]) => R,
): R & { sansSigne: boolean[] } {
  const large = placer(boxes);
  const aReplier = boxes.map((_, i) => !large.visibles[i] && etroites[i] !== undefined);
  if (!aReplier.some(Boolean)) return { ...large, sansSigne: boxes.map(() => false) };
  const repliees = placer(boxes.map((b, i) => (aReplier[i] ? { ...b, w: etroites[i]! } : b)));
  const vues = (r: R) => r.visibles.filter(Boolean).length;
  return vues(repliees) > vues(large) ? { ...repliees, sansSigne: aReplier } : { ...large, sansSigne: boxes.map(() => false) };
}

/**
 * Le placement des étiquettes d'une vue (DA-10) : celles dont l'île est sous l'interface ou hors du cadre ne
 * se montreront pas, et sont retirées avant l'écart pour ne pas pousser les autres ; les autres s'écartent de
 * l'interface (`zones`) et des `obstacles` (la flèche et le fanion de la Carte, les grands repères d'Archipéo) : avec
 * `carte`, les unes des autres aussi (voir `layoutLabels`) ; sans, seules celles posées dessus ou coupées par le bord
 * bougent (voir `ecarterDesObstacles`). Puis `montrees` dit lesquelles se montrent (`bulles` : les bulles passagères,
 * qui cachent sans pousser) ; celles qu'il écarte essaient encore les places simples autour de leur île. `dures` : des
 * obstacles qu'aucune étiquette ne couvre jamais, même faute d'autre place (elle se tait plutôt) : la flèche d'un
 * ouvrage (GD-7). Sur la Carte, deux préférences qui ne taisent jamais un nom (GD-7) : `souples`, des obstacles
 * qu'une étiquette évite si elle peut (le tracé de l'ouvrage suggéré), et `carte.arrivee`, l'île d'arrivée de cet
 * ouvrage, dont le nom pèse alors autant que celui de la destination pour se poser au bout du tracé. Si les deux
 * ensemble taisent un nom qui se montrait sans elles, le tracé seul est essayé, puis rien. `carte.destination` :
 * l'indice de la prochaine destination (sinon, la plus lourde), seule à avoir sa garde.
 */
export function placerEtiquettes(
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  vue: VueDesEtiquettes,
  carte: CarteDesEtiquettes | null,
  tenues: number[] = [],
): { offsets: LabelOffset[]; visibles: boolean[] } {
  const souples = carte ? (vue.souples ?? []) : [];
  const arrivee = carte?.arrivee;
  const lourde = carte && arrivee !== undefined && carte.weights[arrivee] !== undefined ? carte.weights.map((p, i) => (i === arrivee ? Math.max(p, ...carte.weights) : p)) : null;
  if (!carte || (!souples.length && !lourde)) return placerSansSouples(boxes, iles, vue, carte, tenues, []);
  const essais: [CarteDesEtiquettes, LabelBox[]][] = [];
  if (lourde) essais.push([{ ...carte, weights: lourde }, souples]);
  if (souples.length) essais.push([carte, souples]);
  let sans: { offsets: LabelOffset[]; visibles: boolean[] } | null = null;
  for (const [c, s] of essais) {
    const r = placerSansSouples(boxes, iles, vue, c, tenues, s);
    // Tous les noms se montrent : rien n'en a tu aucun.
    if (r.visibles.every(Boolean)) return r;
    // Ni le tracé ni l'arrivée ne taisent un nom : s'ils en taisent un qui se montrait sans eux, l'essai suivant.
    const base = (sans ??= placerSansSouples(boxes, iles, vue, carte, tenues, []));
    if (!base.visibles.some((v, i) => v && !r.visibles[i])) return r;
  }
  return sans ?? placerSansSouples(boxes, iles, vue, carte, tenues, []);
}

/** Ce que reçoit le placement des étiquettes d'une vue (voir `placerEtiquettes`). */
export interface VueDesEtiquettes {
  zones: LabelBox[];
  bulles: LabelBox[];
  obstacles: LabelBox[];
  bounds: { w: number; h: number };
  gap: number;
  /** Sur la Carte, les obstacles souples : le tracé de l'ouvrage suggéré (GD-7). */
  souples?: LabelBox[];
  /** Les obstacles durs, qu'aucune étiquette ne couvre jamais : les poignées du mode « Modifier le plan » (GD-9). */
  dures?: LabelBox[];
}

/**
 * Sur la Carte, le poids de chaque étiquette ; l'indice de la prochaine destination (sinon, la plus lourde) ; et celui
 * de l'île d'arrivée de l'ouvrage suggéré (GD-7), qui pèse autant que la destination tant que cela ne tait aucun nom.
 */
export interface CarteDesEtiquettes {
  weights: number[];
  destination?: number;
  arrivee?: number;
}

function placerSansSouples(
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  vue: VueDesEtiquettes,
  carte: CarteDesEtiquettes | null,
  tenues: number[],
  souples: LabelBox[],
): { offsets: LabelOffset[]; visibles: boolean[] } {
  const { zones, bulles, bounds, gap, dures = [] } = vue;
  // Les obstacles durs (la flèche d'un ouvrage, GD-7) sont aussi des obstacles : les étiquettes s'en écartent d'abord.
  // Mais ce ne sont pas des repères posés sur l'île de destination (`reperes`) : son nom ne passe pas par-dessus pour
  // s'y lire, il prend une autre place.
  const obstacles = dures.length ? [...vue.obstacles, ...dures] : vue.obstacles;
  const reperes = vue.obstacles;
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
    ? layoutLabels(sous, gap, bounds, gardees.map((i) => carte.weights[i]), [...obstacles, ...zones], souples)
    : ecarterDesObstacles(sous, [...obstacles, ...zones], gap, bounds);
  const offsets: LabelOffset[] = boxes.map(() => ({ dx: 0, dy: 0 }));
  gardees.forEach((i, k) => (offsets[i] = placees[k]));
  const couvert = [...zones, ...bulles];
  const visibles = montrees(boxes, offsets, couvert, bounds, w, iles);
  // Une étiquette que l'écart laisse sur un obstacle dur ne s'y montre pas : elle cherche plus bas une autre place (les
  // places simples autour de son île, puis la dernière chance de la Carte), qui évitent les obstacles.
  if (dures.length)
    boxes.forEach((b, i) => {
      if (visibles[i] && dures.some((v) => overlap({ ...b, x: b.x + offsets[i].dx, y: b.y + offsets[i].dy }, v, 0) > 0)) visibles[i] = false;
    });
  // Avant de renoncer à un nom dont l'île se voit : les places simples autour d'elle, dessus, dessous, à gauche, à
  // droite (DA-31), sans trait de rappel ni place plus loin. La plus lourde d'abord ; une place prise n'en change pas
  // tant que le cadrage ne bouge pas (le calcul ne dépend que de lui). Sur la Carte, le nom de la destination ne se
  // retire jamais pour un autre : il prend sa place simple, et le nom plus léger qui l'occupait cherche la sienne.
  const poids = (i: number) => (w ? w[i] : 1);
  const lourd = w ? Math.max(1, ...gardees.map(poids)) : Infinity;
  const destination = carte && lourd > 1 ? (carte.destination !== undefined && gardees.includes(carte.destination) ? carte.destination : gardees.find((i) => poids(i) >= lourd)) : undefined;
  const garde = destination === undefined ? null : gardeDeLaDestination(iles[destination], reperes);
  const vues = new Map<number, LabelBox>();
  boxes.forEach((b, i) => {
    if (!visibles[i]) return;
    const at = { ...b, x: b.x + offsets[i].dx, y: b.y + offsets[i].dy };
    // Un autre nom posé sur l'île de destination ou contre sa flèche s'y lirait : il cherche une autre place.
    if (garde && i !== destination && overlap(at, garde, 0) > 0) visibles[i] = false;
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
      const gene = reperes.filter((v) => overlap({ ...b, x: ile.x, y }, v, gap) > 0);
      if (!gene.length) return y;
      return sens < 0 ? Math.min(...gene.map((v) => v.y - v.h / 2)) - b.h / 2 - gap : Math.max(...gene.map((v) => v.y + v.h / 2)) + b.h / 2 + gap;
    };
    const places = [
      { x: ile.x, y: passe(ile.y - b.h / 2 - gap, -1) },
      { x: ile.x, y: passe(ile.y + b.h / 2 + gap, 1) },
      { x: ile.x - b.w / 2 - gap, y: ile.y },
      { x: ile.x + b.w / 2 + gap, y: ile.y },
    ];
    // La destination essaie d'abord les places libres, puis celles qu'un nom plus léger occupe ; chacune, d'abord hors
    // du tracé suggéré (souple), puis dessus.
    const essais = (chasse ? [false, true] : [false]).flatMap((pousser) => (souples.length ? [true, false] : [false]).map((eviter) => ({ pousser, eviter })));
    for (const { pousser, eviter } of essais) {
      const p = places.find((p, k) => {
        const at = { ...b, x: p.x, y: p.y };
        if (!entiere(b, { dx: p.x - b.x, dy: p.y - b.y }, couvert, bounds) || obstacles.some((v) => overlap(at, v, gap) > 0)) return false;
        if (eviter && souples.some((v) => overlap(at, v, 0) > 0)) return false;
        if ([...vues].some(([j, v]) => overlap(at, v, gap) > 0 && !(pousser && poids(j) < poids(i)))) return false;
        if (garde && i !== destination && overlap(at, garde, gap) > 0) return false;
        // Posé sur la flèche, le nom de la destination se lit sur son île, même au-dessus d'une île voisine.
        if (chasse && (destination === undefined || i === destination) && k === 0) return true;
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
  // Sur la Carte, chaque île qui se voit garde son nom (référent dys, 01/10/2026) : un nom encore tu cherche une place
  // près de son île, quitte à pousser un seul nom voisin, plus léger ou de même poids, vers une autre place libre près
  // de la sienne (jamais celui de la destination).
  if (carte) {
    const autreQueLaDestination = (j: number) => j !== destination;
    // Un autre nom ne se pose ni sur l'île de destination ni contre sa flèche (voir plus haut).
    const horsDeLaGarde = (i: number, at: LabelBox) => !garde || i === destination || overlap(at, garde, gap) <= 0;
    // Le nom de la destination se lit au-dessus de sa flèche (DA-31) : posé dessous par l'écart, il y remonte si la place
    // est libre, ou si les noms qui l'occupent trouvent une autre place.
    let dessus: { i: number; at: LabelBox } | null = null;
    if (destination !== undefined && visibles[destination] && offsets[destination].dy > 0) {
      const b = boxes[destination];
      const ile = iles[destination];
      const fleches = reperes.filter((v) => overlap({ ...b, x: ile.x, y: ile.y - b.h / 2 - gap }, v, gap) > 0);
      const at = { ...b, x: ile.x, y: Math.min(ile.y, ...fleches.map((v) => v.y - v.h / 2)) - b.h / 2 - gap };
      if (entiere(b, { dx: at.x - b.x, dy: at.y - b.y }, couvert, bounds) && !obstacles.some((v) => overlap(at, v, gap) > 0)) dessus = { i: destination, at };
    }
    reparerLaCarte(boxes, iles, offsets, visibles, vues, { couvert, obstacles, bounds, gap }, poids, horsDeLaGarde, autreQueLaDestination, dessus);
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

/** Sur la Carte, combien de noms un nom tu peut pousser en chaîne pour trouver sa place (voir `reparerLaCarte`). */
const POUSSEES_MAX = 2;

/** Les places essayées autour d'une étiquette (décalages de `TRIES`), rentrées dans le cadre, de la plus proche à la plus loin. */
function placesAutour(b: LabelBox, bounds: { w: number; h: number }, gap: number): LabelBox[] {
  const x = clamp(b.x, b.w / 2 + gap, bounds.w - b.w / 2 - gap);
  const y = clamp(b.y, b.h / 2 + gap, bounds.h - b.h / 2 - gap);
  return TRIES.map(([fx, fy]) => ({ x: x + fx * b.w, y: y + fy * b.h, w: b.w, h: b.h }));
}

/**
 * Sur la Carte, la dernière chance des noms tus (voir `placerEtiquettes`) : chacun, le plus lourd d'abord, essaie les
 * places autour de sa place voulue ; une place se prend si le nom y est entier, hors de l'interface et des repères,
 * pas plus loin de son île que d'`ECART_MAX` hauteurs de plus, pas plus près d'une autre île que de la sienne, et
 * libre. Sinon, une place qu'un ou deux noms (`poussable`, pas plus lourds) occupent se prend si chacun trouve, lui, une autre
 * place qui tient aux mêmes conditions (deux noms au plus à chaque pas, `POUSSEES_MAX` pas en chaîne). `libre` : une
 * condition de plus (la garde de la destination). `voulue` : une place à donner d'abord à un nom déjà montré (le nom de
 * la destination au-dessus de sa flèche), aux mêmes conditions de poussée. Modifie `offsets`, `visibles` et `vues`.
 */
function reparerLaCarte(
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  offsets: LabelOffset[],
  visibles: boolean[],
  vues: Map<number, LabelBox>,
  vue: { couvert: LabelBox[]; obstacles: LabelBox[]; bounds: { w: number; h: number }; gap: number },
  poids: (i: number) => number,
  libre: (i: number, at: LabelBox) => boolean,
  poussable: (j: number) => boolean,
  voulue: { i: number; at: LabelBox } | null = null,
): void {
  const { couvert, obstacles, bounds, gap } = vue;
  const ileVue = (i: number) => {
    const p = { ...iles[i], w: 1, h: 1 };
    return outside(p, bounds) === 0 && !couvert.some((z) => overlap(p, z, 0) > 0);
  };
  /** La place `at` tient-elle pour le nom `i`, sans compter les autres noms ? */
  const tient = (i: number, at: LabelBox) => {
    const b = boxes[i];
    const ile = iles[i];
    if (!entiere(b, { dx: at.x - b.x, dy: at.y - b.y }, couvert, bounds)) return false;
    if (obstacles.some((v) => overlap(at, v, gap) > 0) || !libre(i, at)) return false;
    const d = distanceA(at, ile);
    if (d > distanceA(b, ile) + ECART_MAX * b.h) return false;
    return !iles.some((q, j) => j !== i && distanceA(at, q) < d);
  };
  const genes = (at: LabelBox, sauf: number[]) => [...vues].filter(([j, v]) => !sauf.includes(j) && overlap(at, v, gap) > 0).map(([j]) => j);
  const poser = (i: number, at: LabelBox) => {
    offsets[i] = { dx: at.x - boxes[i].x, dy: at.y - boxes[i].y };
    visibles[i] = true;
    vues.set(i, at);
  };
  /**
   * Une place pour le nom `j` qui ne touche pas `pris` (les places déjà promises) : libre, ou occupée par un ou deux
   * noms poussables, pas plus lourds, qui trouvent chacun une autre place (`reste` : la profondeur de la chaîne).
   * `chaine` : les noms qui quittent déjà leur place (elle ne compte plus).
   */
  const deplacer = (j: number, pris: LabelBox[], chaine: number[], reste: number, places?: LabelBox[]): [number, LabelBox][] | null => {
    for (const q of places ?? placesAutour(boxes[j], bounds, gap)) {
      if (pris.some((p) => overlap(q, p, gap) > 0) || (!places && !tient(j, q))) continue;
      const g = genes(q, [...chaine, j]);
      if (!g.length) return [[j, q]];
      if (reste <= 0 || g.length > 2 || g.some((k) => !poussable(k) || poids(k) > poids(j))) continue;
      const suite: [number, LabelBox][] = [[j, q]];
      const promis = [...pris, q];
      const partis = [...chaine, j, ...g];
      const tous = g.every((k) => {
        const r = deplacer(k, promis, partis, reste - 1);
        if (r) {
          suite.push(...r);
          promis.push(...r.map(([, at]) => at));
        }
        return r !== null;
      });
      if (tous) return suite;
    }
    return null;
  };
  if (voulue) for (const [j, at] of deplacer(voulue.i, [], [], POUSSEES_MAX, [voulue.at]) ?? []) poser(j, at);
  const tus = boxes.map((_, i) => i).filter((i) => !visibles[i] && ileVue(i)).sort((a, b) => poids(b) - poids(a) || a - b);
  for (const i of tus) for (const [j, at] of deplacer(i, [], [], POUSSEES_MAX) ?? []) poser(j, at);
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

/** Combien de cases du tracé une boîte d'obstacle souple couvre (voir `boitesDuTrace`). */
const CASES_PAR_BOITE = 3;

/**
 * Le tracé de l'ouvrage suggéré (GD-7) en obstacles souples pour les étiquettes : `points`, ses cases à l'écran, de
 * bout en bout. Une boîte toutes les trois cases (une liaison de 96 cases en fait 32), qui les couvre avec une marge
 * de trois quarts de case (le liseré d'un tiret est large d'une case et demie) ; la taille d'une case à l'écran est
 * l'écart moyen entre deux cases voisines.
 */
export function boitesDuTrace(points: readonly { x: number; y: number }[]): LabelBox[] {
  if (!points.length) return [];
  let pas = 0;
  for (let i = 1; i < points.length; i++) pas += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  const marge = Math.max(3, (points.length > 1 ? pas / (points.length - 1) : 0) * 0.75);
  const out: LabelBox[] = [];
  for (let i = 0; i < points.length; i += CASES_PAR_BOITE) {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let k = i; k < Math.min(points.length, i + CASES_PAR_BOITE); k++) {
      x0 = Math.min(x0, points[k].x);
      x1 = Math.max(x1, points[k].x);
      y0 = Math.min(y0, points[k].y);
      y1 = Math.max(y1, points[k].y);
    }
    out.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + 2 * marge, h: y1 - y0 + 2 * marge });
  }
  return out;
}

/** Sur la Carte, combien de places la flèche d'un ouvrage essaie au plus le long de sa liaison (voir `placerAvecLaFlecheDOuvrage`). */
export const PLACES_DE_LA_FLECHE_MAX = 8;

/**
 * Sur la Carte, la flèche d'un ouvrage (GD-7) et les étiquettes : `fleches`, sa boîte à l'écran à chacune de ses places
 * sur la liaison (de la voulue, côté île de départ, à la dernière permise vers l'arrivée ; terrain.ts,
 * `placesDeLaFleche`). La flèche est un obstacle dur (`placerEtiquettes`, `dures`) : aucune étiquette ne se pose sur
 * elle. Elle reste à sa place voulue (la première) tant qu'aucune étiquette n'y bouge ni ne s'y tait à cause d'elle
 * (comparé au placement sans la flèche, le tracé suggéré compris : le tracé seul ne la fait pas glisser) ; sinon elle
 * prend la première place libre suivante, dans le cadre et hors de l'interface ; sinon la première où autant de noms
 * se montrent, celui de la destination compris (des étiquettes s'écartent) ; sinon la voulue, et c'est l'étiquette qui
 * se déplace ou se tait, jamais la flèche hors de sa liaison. Seules les `PLACES_DE_LA_FLECHE_MAX` premières places
 * s'essaient. Rend l'indice de la place prise (`fleche`) et le placement des étiquettes. Le calcul (un placement par
 * place essayée, neuf au plus avec celui sans la flèche ; avec un tracé souple, chacun en trois essais au plus :
 * l'arrivée lourde avec le tracé, le tracé seul, puis sans tracé) se fait une fois par cadrage, pas image par image.
 */
export function placerAvecLaFlecheDOuvrage(
  toutes: LabelBox[],
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  vue: VueDesEtiquettes,
  carte: CarteDesEtiquettes,
): { fleche: number; offsets: LabelOffset[]; visibles: boolean[] } {
  const fleches = toutes.slice(0, PLACES_DE_LA_FLECHE_MAX);
  const { zones, bounds } = vue;
  const avec = (k: number) => ({ fleche: k, ...placerEtiquettes(boxes, iles, { ...vue, dures: fleches[k] ? [...(vue.dures ?? []), fleches[k]] : (vue.dures ?? []) }, carte) });
  if (!fleches.length) return avec(0);
  const dansLeCadre = (f: LabelBox) => outside(f, bounds) < 1 && !zones.some((z) => overlap(f, z, 0) > 0);
  const sans = placerEtiquettes(boxes, iles, vue, carte);
  const rienNeBouge = (r: { offsets: LabelOffset[]; visibles: boolean[] }) =>
    r.visibles.every((v, i) => v === sans.visibles[i] && (!v || Math.hypot(r.offsets[i].dx - sans.offsets[i].dx, r.offsets[i].dy - sans.offsets[i].dy) < 0.5));
  // Autant de noms montrés qu'avant (pas forcément les mêmes : la flèche peut en déplacer un vers une place libérée), et
  // celui de la destination (le plus lourd) s'il se montrait.
  const montres = (v: boolean[]) => v.filter(Boolean).length;
  const lourd = Math.max(...carte.weights);
  const aucunNeSeTait = (r: { visibles: boolean[] }) =>
    montres(r.visibles) >= montres(sans.visibles) && r.visibles.every((v, i) => v || !sans.visibles[i] || carte.weights[i] < lourd || lourd <= 1);
  let secours: ReturnType<typeof avec> | null = null;
  let voulue: ReturnType<typeof avec> | null = null;
  for (let k = 0; k < fleches.length; k++) {
    if (!dansLeCadre(fleches[k])) continue;
    const r = avec(k);
    if (rienNeBouge(r)) return r;
    if (!secours && aucunNeSeTait(r)) secours = r;
    if (k === 0) voulue = r;
  }
  return secours ?? voulue ?? avec(0);
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

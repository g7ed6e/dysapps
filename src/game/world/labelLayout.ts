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

/**
 * Les décalages essayés, en fractions de la hauteur (dy) et de la largeur (dx) de l'étiquette, du plus proche au plus loin.
 * De côté, par pas de 0,15 largeur : au pas de 0,3, la Forêt des sons se taisait sur la Carte du 6e dans une police
 * 10 % plus large, ses voisines (la Fouille des siècles, la Pointe des paysages) serrées sous le panneau sans place
 * entre deux crans (HG-2, 6 octobre 2026).
 */
const TRIES: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (const fy of [0, 0.55, -0.55, 1.1, -1.1, 1.65, -1.65, 2.2, -2.2, 2.75, -2.75]) for (const fx of [0, 0.15, -0.15, 0.3, -0.3, 0.45, -0.45, 0.6, -0.6]) out.push([fx, fy]);
  return out.sort((a, b) => Math.hypot(a[0] * 1.6, a[1]) - Math.hypot(b[0] * 1.6, b[1]));
})();

function overlap(a: LabelBox, b: LabelBox, gap: number): number {
  const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + gap;
  const oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2) + gap;
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

/**
 * Le rectangle à l'écran qui couvre des points (les coins d'une zone du monde projetés), en boîte d'étiquette (son centre,
 * sa taille).
 */
export function boiteDesPoints(points: readonly { x: number; y: number }[]): LabelBox {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
}

/** Une étiquette (sa boîte à l'écran) recoupe-t-elle une zone à l'écran ? Pendant un glissé du choix, elle s'estompe. */
export function recoupe(etiquette: LabelBox, zone: LabelBox): boolean {
  return overlap(etiquette, zone, 0) > 0;
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
 * Le point d'une île (une boîte d'un pixel) sort-il du cadre ? À l'arrondi près : `outside` d'une boîte d'un pixel
 * entièrement dedans peut valoir 1e-13 (la Compréhension, au 3e, se taisait ainsi sur la Carte, HG-3).
 */
function horsDuCadre(p: LabelBox, bounds: { w: number; h: number }): boolean {
  return outside(p, bounds) > 1e-6;
}

/**
 * L'île `i` se voit-elle sur la Carte : son centre dans le cadre et sous aucune zone de l'interface ni bulle (`couvert`) ?
 * Le seul filtre des noms qu'on compte, pour le placement, la recherche et l'île touchée.
 */
function ileVue(iles: readonly { x: number; y: number }[], vue: { couvert: readonly LabelBox[]; bounds: { w: number; h: number } }): (i: number) => boolean {
  return (i) => {
    const p = { ...iles[i], w: 1, h: 1 };
    return !horsDuCadre(p, vue.bounds) && !vue.couvert.some((z) => overlap(p, z, 0) > 0);
  };
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
 * Sur la Carte, l'écart du dernier recours (`placerSansSouples`) : quand des noms se taisent encore après la recherche
 * complète, les noms peuvent s'éloigner de leur île d'autant de hauteurs d'étiquette (au lieu d'`ECART_MAX`), jamais plus
 * près d'une autre île que de la sienne. Au 6e, en portrait 800 × 1280 en OpenDyslexic 32 px, seize îles dans une bande
 * de 550 px de large pour des noms de 250 à 400 px : cinq et six noms se taisaient depuis le Préau des délégués (EMC-2) ;
 * deux et trois avec ce recours (référent dys, 9 octobre 2026). À 2 hauteurs, aucun de moins (mesuré).
 */
const ECART_DU_DERNIER_RECOURS = 2.25;

/** Au dernier recours, combien de crans d'une demi-étiquette un nom qui ne se tait jamais essaie au-dessus et au-dessous de son île. */
const LEVELS_OF_THE_LAST_RESORT = 4;

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
    if (horsDuCadre(ile, bounds) || zones.some((z) => overlap(ile, z, 0) > 0)) continue;
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
  if (carte && vue.recherche === undefined) vue = { ...vue, recherche: rechercheDuCadrage() };
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
  /**
   * Sur la Carte, la recherche complète partagée par tous les placements d'un même cadrage (`RechercheDuCadrage`) ;
   * sans elle, chaque appel de `placerEtiquettes` ou de `placerAvecLaFlecheDOuvrage` en prend une neuve ; `null` : le
   * placement simple seul, sans recherche complète (voir `placerDAbordSimplement`).
   */
  recherche?: RechercheDuCadrage | null;
}

/**
 * Sur la Carte, le poids de chaque étiquette ; l'indice de la prochaine destination (sinon, la plus lourde) ; et celui
 * de l'île d'arrivée de l'ouvrage suggéré (GD-7), qui pèse autant que la destination tant que cela ne tait aucun nom.
 */
export interface CarteDesEtiquettes {
  weights: number[];
  destination?: number;
  arrivee?: number;
  /** L'indice de l'île où se tient le bonhomme : comme celui de la destination, son nom ne se tait jamais (DA, HG-3). */
  avatarIsland?: number;
  /**
   * L'indice de l'île touchée (sur la Carte, l'île fermée choisie ; ailleurs, celle dont la fiche est ouverte) : son nom
   * ne se tait jamais non plus (référent dys, 9 octobre 2026).
   */
  selected?: number;
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
    return !horsDuCadre(ile, bounds) && !zones.some((z) => overlap(ile, z, 0) > 0);
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
  // Sur la Carte, de même, une étiquette que l'écart laisse sur la bulle de la destination ou le médaillon du bonhomme
  // (l'écart les évite sans l'exiger : la Vallée du vivant se posait sous le médaillon au 6e en OpenDyslexic, DA, HG-3).
  const interdits = carte ? obstacles : dures;
  if (interdits.length)
    boxes.forEach((b, i) => {
      if (visibles[i] && interdits.some((v) => overlap({ ...b, x: b.x + offsets[i].dx, y: b.y + offsets[i].dy }, v, 0) > 0)) visibles[i] = false;
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
    // Un autre nom posé sur l'île de destination ou contre sa flèche s'y lirait : il cherche une autre place. Sur la
    // Carte, de même, un nom que l'écart laisse plus près d'une autre île que de la sienne, vu de son milieu (GD-12).
    if (garde && i !== destination && overlap(at, garde, 0) > 0) visibles[i] = false;
    else if (carte && onAnotherIsland(at, i, iles)) visibles[i] = false;
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
    reparerLaCarte(boxes, iles, offsets, visibles, vues, { couvert, obstacles, bounds, gap, recherche: vue.recherche === undefined ? rechercheDuCadrage() : vue.recherche }, poids, horsDeLaGarde, autreQueLaDestination, dessus);
    // Trois noms ne se taisent jamais sur la Carte : celui de la prochaine destination, celui de l'île où se tient le
    // bonhomme (`carte.avatarIsland`, DA, HG-3) et celui de l'île touchée (`carte.selected`, référent dys, 9 octobre
    // 2026), dans cet ordre : si la place manque, l'île touchée cède, jamais la destination ni le bonhomme.
    const neverHidden = [...new Set([destination, carte.avatarIsland, carte.selected])].filter((i): i is number => i !== undefined && gardees.includes(i));
    if (neverHidden.some((i) => !visibles[i])) {
      // Les noms qu'ils font taire cherchent encore une place près de leur île, sans pousser ceux-là.
      const repair = (o: LabelOffset[], v: boolean[], m: Map<number, LabelBox>, covered: number[]) => reparerLaCarte(boxes, iles, o, v, m, { couvert, obstacles, bounds, gap, recherche: null }, poids, horsDeLaGarde, (j) => !neverHidden.includes(j), null, covered);
      showAtAllCosts(neverHidden, boxes, iles, { offsets, visibles, vues }, { couvert, obstacles, bounds, gap }, horsDeLaGarde, repair);
    }
    // Mieux vaut taire un nom que le poser sur une autre île, où on le lirait (directeur artistique, GD-12) : un nom
    // encore posé plus près d'une autre île que de la sienne, vu de son milieu, se tait, sauf ceux qui ne se taisent
    // jamais (glissés au bord de l'écran, ils se lisent à l'aplomb de leur île, `showAtAllCosts`).
    // (Retirer l'entrée lue pendant le parcours d'une Map ne saute aucune des suivantes.)
    for (const [i, at] of vues)
      if (!neverHidden.includes(i) && onAnotherIsland(at, i, iles)) {
        vues.delete(i);
        visibles[i] = false;
        offsets[i] = { dx: 0, dy: 0 };
      }
    // Le dernier recours (référent dys, 9 octobre 2026) : après la recherche complète (jamais au placement simple, qui
    // ne la lancerait plus, et laisserait loin de leur île des noms qu'elle aurait posés près d'elle), si des noms se
    // taisent encore, la même réparation se refait avec un écart plus large (`ECART_DU_DERNIER_RECOURS`), toujours chaque
    // nom plus près de son île que d'une autre, sous ses propres plafonds d'essais (`dernierRecours`). Un nom montré ne
    // quitte sa place que pour en faire à un nom tu, s'il en trouve une autre (la recherche essaie d'abord la place de
    // chacun) ; celui de la destination garde la sienne.
    const encoreTus = gardees.filter((i) => !visibles[i]);
    if (vue.recherche && encoreTus.length) {
      const recherche = (vue.recherche.dernierRecours ??= rechercheDuCadrage());
      reparerLaCarte(boxes, iles, offsets, visibles, vues, { couvert, obstacles, bounds, gap, recherche, ecart: ECART_DU_DERNIER_RECOURS }, poids, horsDeLaGarde, autreQueLaDestination, null, encoreTus);
    }
    // Un nom qui ne se tait jamais et se tait encore (l'île touchée au bord de la Carte, sa place sous le nom du
    // bonhomme) : ses places au dernier recours, plus loin et à plusieurs crans au-dessus et au-dessous de son île.
    if (neverHidden.some((i) => !visibles[i])) {
      const repair = (o: LabelOffset[], v: boolean[], m: Map<number, LabelBox>, covered: number[]) => reparerLaCarte(boxes, iles, o, v, m, { couvert, obstacles, bounds, gap, recherche: null, ecart: ECART_DU_DERNIER_RECOURS }, poids, horsDeLaGarde, (j) => !neverHidden.includes(j), null, covered);
      showAtAllCosts(neverHidden, boxes, iles, { offsets, visibles, vues }, { couvert, obstacles, bounds, gap }, horsDeLaGarde, repair, { ecart: ECART_DU_DERNIER_RECOURS, levels: LEVELS_OF_THE_LAST_RESORT, yieldLater: true });
    }
    return { offsets, visibles };
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

/** Sur la Carte, combien de places un nom qui ne se tait jamais essaie au plus pour se montrer (`showAtAllCosts`). */
const KEPT_NAME_PLACES = 8;

/**
 * Sur la Carte, les noms qui ne se taisent jamais tant que leur île se voit (`kept` : la prochaine destination, l'île
 * du bonhomme, puis l'île touchée ; DA, HG-3 ; référent dys, 9 octobre 2026). Un tel nom encore tu essaie les places simples autour de son île (dessus, dessous, de
 * côté ; dessus et dessous passent le médaillon ou la bulle posés sur l'île : sa place de plus, sous son île, consultant
 * UX UI), puis celles de la dernière chance (`TRIES_FINS`), puis dessus et dessous glissés de côté pour tenir dans le
 * cadre (la distance à l'île comptée sans le repère passé) : entière, hors de l'interface et des repères (la bulle, le
 * médaillon, la flèche d'un ouvrage), pas plus loin de son île que d'`ECART_MAX` hauteurs de plus, pas plus près d'une
 * autre île que de la sienne (vu de son milieu ; glissé de côté, vu de l'aplomb de son île), hors de la garde de la destination (`isFree`), sans couvrir un
 * autre nom gardé (sauf `yieldLater`, voir plus bas). Les noms montrés qu'elle couvre se taisent, puis cherchent une autre place (`repair`) ; parmi les
 * `KEPT_NAME_PLACES` places qui en font taire le moins, celle qui montre le plus de noms à la fin l'emporte. Sans aucune
 * place qui tienne, il se tait. Au dernier recours (`ecart`, `levels`), l'écart permis s'élargit, et dessus et dessous
 * s'essaient aussi plus haut et plus bas, par demi-étiquettes (`levels` crans), glissés de côté s'il le faut : un nom au
 * bord de la Carte peut alors passer au-dessus du nom voisin qui couvre sa place. Modifie `state`.
 */
function showAtAllCosts(
  kept: number[],
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  state: { offsets: LabelOffset[]; visibles: boolean[]; vues: Map<number, LabelBox> },
  vue: { couvert: LabelBox[]; obstacles: LabelBox[]; bounds: { w: number; h: number }; gap: number },
  isFree: (i: number, at: LabelBox) => boolean,
  repair: (offsets: LabelOffset[], visibles: boolean[], vues: Map<number, LabelBox>, covered: number[]) => void,
  { ecart = ECART_MAX, levels = 0, yieldLater = false }: { ecart?: number; levels?: number; yieldLater?: boolean } = {},
): void {
  const { couvert, obstacles, bounds, gap } = vue;
  for (const i of kept) {
    if (state.visibles[i]) continue;
    const b = boxes[i];
    const ile = iles[i];
    // Dessus et dessous passent un repère posé sur l'île (le médaillon du bonhomme, la bulle) plutôt que d'y renoncer.
    const pass = (y: number, side: 1 | -1) => {
      const inTheWay = obstacles.filter((v) => overlap({ ...b, x: ile.x, y }, v, gap) > 0);
      if (!inTheWay.length) return y;
      return side < 0 ? Math.min(...inTheWay.map((v) => v.y - v.h / 2)) - b.h / 2 - gap : Math.max(...inTheWay.map((v) => v.y + v.h / 2)) + b.h / 2 + gap;
    };
    // Dessus, puis dessous ; au dernier recours, aussi plus haut et plus bas, par demi-étiquettes.
    const step = b.h / 2 + gap;
    const natural: { y: number; side: 1 | -1 }[] = [];
    for (let k = 0; k <= levels; k++) natural.push({ y: ile.y - b.h / 2 - gap - k * step, side: -1 }, { y: ile.y + b.h / 2 + gap + k * step, side: 1 });
    const vertical = natural.map((n) => ({ ...b, x: ile.x, y: pass(n.y, n.side) }));
    const simple = [...vertical.slice(0, 2), { ...b, x: ile.x - b.w / 2 - gap, y: ile.y }, { ...b, x: ile.x + b.w / 2 + gap, y: ile.y }, ...vertical.slice(2)];
    // Une île au bord de l'écran : dessus et dessous, le nom glissé de côté pour y tenir entier, en dernier ; sa distance
    // à l'île se compte sans la hauteur du repère qu'il passe (la bulle de la destination est plus haute qu'`ECART_MAX` ;
    // la Ruche des réseaux, au bord gauche de la Carte du 3e en OpenDyslexic, le bonhomme dessus : consultant UX UI, SC-3).
    // (La distance au-delà du cran voulu n'est pas « passée » : seul le repère passé l'est.)
    const slid = vertical
      .map((s, k) => ({ at: { ...s, x: clamp(s.x, b.w / 2 + gap, bounds.w - b.w / 2 - gap) }, passed: Math.abs(s.y - natural[k].y), glisse: true }))
      .filter((s) => s.at.x !== ile.x);
    const candidates: { at: LabelBox; covered: number[]; keptCovered: boolean }[] = [];
    for (const { at, passed, glisse } of [...[...simple, ...placesAutour(b, bounds, gap)].map((at) => ({ at, passed: 0, glisse: false })), ...slid]) {
      if (!entiere(b, { dx: at.x - b.x, dy: at.y - b.y }, couvert, bounds) || obstacles.some((v) => overlap(at, v, gap) > 0) || !isFree(i, at)) continue;
      if (distanceA(at, ile) - passed > distanceA(b, ile) + ecart * b.h) continue;
      // Glissé au bord de l'écran, le nom se lit juste au-dessus ou au-dessous de son île (sous le médaillon) : il désigne
      // l'île sous lui à l'aplomb de la sienne, pas celle sous son milieu, qu'une île au bord n'atteint plus (au
      // téléphone, au 6e, la Fouille des siècles et la Vallée du vivant ; référent dys, consultant UX UI, GD-11).
      const half = glisse ? { ...at, x: ile.x, w: 0 } : milieu(at);
      const d = distanceA(half, ile);
      if (iles.some((q, j) => j !== i && distanceA(half, q) < d)) continue;
      const covered = [...state.vues].filter(([, v]) => overlap(at, v, gap) > 0).map(([j]) => j);
      const keptCovered = covered.some((j) => kept.includes(j));
      // Avec `yieldLater`, une place sur un nom gardé après lui (`kept` va du plus prioritaire au moins) se prend aussi,
      // en dernier ; ce nom cherche ensuite une autre place, et se tait s'il n'en trouve pas. Jamais sur un nom gardé
      // avant lui.
      if (!keptCovered || (yieldLater && !covered.some((j) => kept.indexOf(j) !== -1 && kept.indexOf(j) < kept.indexOf(i)))) candidates.push({ at, covered, keptCovered });
    }
    // Le tri est stable : à autant de noms couverts, la place la plus proche (les places simples d'abord). Une place sur
    // un nom gardé ne s'essaie que s'il n'y en a aucune autre.
    candidates.sort((p, q) => p.covered.length - q.covered.length);
    const pool = candidates.some((c) => !c.keptCovered) ? candidates.filter((c) => !c.keptCovered) : candidates;
    let best: { offsets: LabelOffset[]; visibles: boolean[]; vues: Map<number, LabelBox>; n: number } | null = null;
    for (const { at, covered, keptCovered } of pool.slice(0, KEPT_NAME_PLACES)) {
      const offsets = state.offsets.map((o) => ({ ...o }));
      const visibles = [...state.visibles];
      const vues = new Map(state.vues);
      for (const j of covered) {
        vues.delete(j);
        visibles[j] = false;
        offsets[j] = { dx: 0, dy: 0 };
      }
      offsets[i] = { dx: at.x - b.x, dy: at.y - b.y };
      visibles[i] = true;
      vues.set(i, at);
      if (covered.length) repair(offsets, visibles, vues, covered);
      if (keptCovered) {
        // Le nom gardé qu'elle couvre cherche sa place à son tour ; sans place, celle-ci ne se prend que s'il vient après
        // lui (l'île touchée cède à la destination et au bonhomme), jamais si un nom gardé avant lui se tait.
        showAtAllCosts(kept, boxes, iles, { offsets, visibles, vues }, vue, isFree, repair, { ecart, levels });
        if (kept.some((j) => kept.indexOf(j) <= kept.indexOf(i) && (state.visibles[j] || j === i) && !visibles[j])) continue;
      }
      const n = visibles.filter(Boolean).length;
      if (!best || n > best.n) best = { offsets, visibles, vues, n };
      // Rien ne s'est tu : aucune place ne fera mieux.
      if (!covered.length) break;
    }
    if (!best) continue;
    best.offsets.forEach((o, k) => (state.offsets[k] = o));
    best.visibles.forEach((v, k) => (state.visibles[k] = v));
    state.vues.clear();
    for (const [k, v] of best.vues) state.vues.set(k, v);
  }
}

/** Sur la Carte, combien de noms un nom tu peut pousser en chaîne pour trouver sa place (voir `reparerLaCarte`). */
const POUSSEES_MAX = 2;

/**
 * Les décalages de la dernière chance de la Carte (`reparerLaCarte`) : ceux de `TRIES`, et entre eux des pas plus fins en
 * hauteur (0,1 hauteur), près de la place voulue. Au 6e, la Pointe des paysages, au bord de la Carte, n'a de place
 * qu'entre le nom de la Fouille des siècles, monté d'un cran, et la bulle de l'ouvrage qui les sépare de la Carrière :
 * une bande de quelques pixels, qu'aucun cran de 0,55 hauteur ne touche (HG-2, 6 octobre 2026).
 */
const TRIES_FINS: [number, number][] = (() => {
  const out: [number, number][] = [...TRIES];
  for (const fy of [0.1, -0.1, 0.2, -0.2, 0.3, -0.3, 0.4, -0.4]) for (const fx of [0, 0.15, -0.15, 0.3, -0.3]) out.push([fx, fy]);
  return out.sort((a, b) => Math.hypot(a[0] * 1.6, a[1]) - Math.hypot(b[0] * 1.6, b[1]));
})();

/**
 * Les décalages de la recherche complète de la Carte (`chercherToutesLesPlaces`) : ceux de `TRIES_FINS`, et des pas de
 * 0,1 hauteur jusqu'à 1,5 hauteur. Aux Anciens Ateliers, le nom de l'Escale n'a de place qu'entre le panneau et la
 * flèche de l'ouvrage posée sur son île : une bande de 71 px pour un nom de 61 (HG-3, 6 octobre 2026).
 */
const TRIES_DE_LA_RECHERCHE: [number, number][] = (() => {
  const out: [number, number][] = [...TRIES_FINS];
  for (let k = 6; k <= 15; k++) {
    if (k === 11) continue;
    for (const fy of [k / 10, -k / 10]) for (const fx of [0, 0.15, -0.15, 0.3, -0.3]) out.push([fx, fy]);
  }
  return out.sort((a, b) => Math.hypot(a[0] * 1.6, a[1]) - Math.hypot(b[0] * 1.6, b[1]));
})();

/** Les places essayées autour d'une étiquette (décalages `essais`, `TRIES_FINS` par défaut), rentrées dans le cadre, de la plus proche à la plus loin. */
function placesAutour(b: LabelBox, bounds: { w: number; h: number }, gap: number, essais: [number, number][] = TRIES_FINS): LabelBox[] {
  const x = clamp(b.x, b.w / 2 + gap, bounds.w - b.w / 2 - gap);
  const y = clamp(b.y, b.h / 2 + gap, bounds.h - b.h / 2 - gap);
  return essais.map(([fx, fy]) => ({ x: x + fx * b.w, y: y + fy * b.h, w: b.w, h: b.h }));
}

/**
 * Le milieu d'une étiquette, la moitié de sa largeur : un nom désigne l'île qui est sous son milieu, pas celle qui
 * touche son bord. Deux îles voisines sous un nom large (la Pointe des paysages et la Fouille des siècles, au 6e) sont
 * toutes deux sous l'étiquette ; c'est l'île sous son milieu qu'elle nomme.
 */
function milieu(r: LabelBox): LabelBox {
  return { ...r, w: r.w / 2 };
}

/**
 * Le nom `i`, posé en `at`, est-il plus près d'une autre île que de la sienne, vu de son milieu (`milieu`) ? Deux îles
 * toutes deux sous le milieu d'un nom large sont à la même distance de lui : c'est alors celle qui est le plus près du
 * centre du nom, de côté, qu'il désigne. Sans cela, sur la Carte en OpenDyslexic 32 px, un nom de 400 px se centrait
 * au-dessus de la voisine dont le nom s'était tu (au 3e, le Kiosque des témoins au-dessus du Verger de la santé ; au 4e,
 * debout, le Jardin des heures entre son île et la Falaise des accords : GD-12, relecture du 9 octobre 2026).
 */
function onAnotherIsland(at: LabelBox, i: number, iles: readonly { x: number; y: number }[]): boolean {
  const m = milieu(at);
  const d = distanceA(m, iles[i]);
  const cote = Math.abs(iles[i].x - at.x);
  return iles.some((q, j) => {
    if (j === i) return false;
    const e = distanceA(m, q);
    return e < d || (e === d && Math.abs(q.x - at.x) < cote);
  });
}

/**
 * Sur la Carte, la dernière chance des noms tus (voir `placerEtiquettes`) : chacun, le plus lourd d'abord, essaie les
 * places autour de sa place voulue (`TRIES_FINS`) ; une place se prend si le nom y est entier, hors de l'interface et
 * des repères, pas plus loin de son île que d'`ECART_MAX` hauteurs de plus, pas plus près d'une autre île que de la
 * sienne vu de son milieu (`milieu`), et libre. Sinon, une place qu'un ou deux noms (`poussable`, pas plus lourds) occupent se prend si chacun trouve, lui, une autre
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
  vue: { couvert: LabelBox[]; obstacles: LabelBox[]; bounds: { w: number; h: number }; gap: number; recherche: RechercheDuCadrage | null; ecart?: number },
  poids: (i: number) => number,
  libre: (i: number, at: LabelBox) => boolean,
  poussable: (j: number) => boolean,
  voulue: { i: number; at: LabelBox } | null = null,
  only?: readonly number[],
): void {
  const { couvert, obstacles, bounds, gap, recherche } = vue;
  // L'écart permis, en hauteurs d'étiquette : `ECART_MAX`, sauf au dernier recours (`ECART_DU_DERNIER_RECOURS`).
  const ecart = vue.ecart ?? ECART_MAX;
  const seVoit = ileVue(iles, { couvert, bounds });
  /**
   * La place `at` tient-elle pour le nom `i`, sans compter les autres noms ni les repères : entière, hors de
   * l'interface, près de son île, pas plus près d'une autre ?
   */
  const tientSeule = (i: number, at: LabelBox) => {
    const b = boxes[i];
    const ile = iles[i];
    if (!entiere(b, { dx: at.x - b.x, dy: at.y - b.y }, couvert, bounds)) return false;
    if (distanceA(at, ile) > distanceA(b, ile) + ecart * b.h) return false;
    // Pas plus près d'une autre île que de la sienne, vu du milieu du nom (voir `milieu`, `onAnotherIsland`).
    return !onAnotherIsland(at, i, iles);
  };
  /** La place `at` est-elle hors des repères, et libre pour le nom `i` (la garde de la destination) ? */
  const horsDesReperes = (i: number, at: LabelBox) => !obstacles.some((v) => overlap(at, v, gap) > 0) && libre(i, at);
  /** La place `at` tient-elle pour le nom `i`, sans compter les autres noms ? */
  const tient = (i: number, at: LabelBox) => tientSeule(i, at) && horsDesReperes(i, at);
  /** Les noms montrés que la place `at` couvre, hors de `chaine` et de `j` (sans copier `vues` : `deplacer` l'appelle des milliers de fois). */
  const genes = (at: LabelBox, chaine: readonly number[], j: number) => {
    const g: number[] = [];
    for (const [k, v] of vues) if (k !== j && !chaine.includes(k) && overlap(at, v, gap) > 0) g.push(k);
    return g;
  };
  /**
   * Les places autour du nom `j` qui tiennent (`tient`), vérifiées une fois par réparation : elles ne dépendent ni des
   * autres noms ni des places promises. Au 6e, en OpenDyslexic 32 px, un nom sans place relançait `deplacer` 25 000 fois
   * par ouverture de la Carte, chaque fois avec toutes ses places à vérifier (GD-12, 8 octobre 2026). Le cache suppose
   * que `libre` (la garde de la destination, lue par `tient`) ne lit aucun état qui change pendant la réparation : s'il
   * venait à lire les noms déjà posés ou les places promises, ce cache rendrait des places qui ne tiennent plus.
   */
  const fitCache = new Map<number, LabelBox[]>();
  const placesThatFit = (j: number) => {
    let l = fitCache.get(j);
    if (!l) fitCache.set(j, (l = placesAutour(boxes[j], bounds, gap).filter((q) => tient(j, q))));
    return l;
  };
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
    for (const q of places ?? placesThatFit(j)) {
      if (pris.some((p) => overlap(q, p, gap) > 0)) continue;
      const g = genes(q, chaine, j);
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
  const tus = (only ?? boxes.map((_, i) => i)).filter((i) => !visibles[i] && seVoit(i)).sort((a, b) => poids(b) - poids(a) || a - b);
  for (const i of tus) for (const [j, at] of deplacer(i, [], [], POUSSEES_MAX) ?? []) poser(j, at);
  // Le placement simple seul (`placerDAbordSimplement`) : pas de recherche complète.
  if (recherche) chercherToutesLesPlaces({ boxes, iles, vues, ileVue: seVoit, tientSeule, horsDesReperes, bounds, gap, poussable, voulue, poser, recherche, autour: { couvert, obstacles }, ecart });
}

/**
 * Combien de places la recherche complète de la Carte essaie au plus pendant tout le placement d'un cadrage (voir
 * `chercherToutesLesPlaces`, `RechercheDuCadrage`) : la flèche d'un ouvrage, le tracé suggéré et les noms repliés sans
 * leur bloc refont le placement jusqu'à une trentaine de fois, chacun avec sa recherche.
 */
const ESSAIS_DE_LA_RECHERCHE = 2_000;

/** Combien de places la recherche complète essaie au plus par nom, à chaque essai (voir `chercherToutesLesPlaces`). */
const RETOURS_PAR_NOM = 4;

/**
 * Combien de places la recherche d'un nom tu de moins essaie au plus par nom, pour chaque nom laissé de côté (voir
 * `chercherToutesLesPlaces`) : au 3e, en OpenDyslexic 32 px, elle trouve en 15 essais. À 40, le premier nom laissé de
 * côté, sans solution, y dépensait 440 essais à chaque placement, et le plafond du cadrage (`ESSAIS_D_UN_NOM_DE_MOINS`)
 * s'épuisait avant le placement qui trouve.
 */
const RETOURS_D_UN_NOM_DE_MOINS = 10;

/**
 * Combien de places la recherche d'un nom tu de moins essaie au plus pendant tout le placement d'un cadrage, à part de
 * `ESSAIS_DE_LA_RECHERCHE` (voir `RechercheDuCadrage`) : sans ce plafond, elle se relançait à chaque placement du
 * cadrage et dépensait jusqu'à 25 000 essais de plus au 6e en OpenDyslexic 32 px, une centaine de millisecondes sur un
 * poste, quatre à cinq fois plus sur la tablette de référence (expert frontend, SC-3).
 */
const ESSAIS_D_UN_NOM_DE_MOINS = 1_000;

/**
 * Ce que la recherche complète de la Carte (`chercherToutesLesPlaces`) dépense pendant le placement d'un cadrage, à
 * partager entre tous les placements de ce cadrage (`VueDesEtiquettes.recherche`) : `essais`, les places essayées, sous
 * un seul plafond (`ESSAIS_DE_LA_RECHERCHE`) ; `essaisDUnNomDeMoins`, celles de la recherche d'un nom tu de moins, sous le
 * sien (`ESSAIS_D_UN_NOM_DE_MOINS`) ; `places`, les places dont on a vérifié qu'elles tiennent (`tientSeule`) ; `deja`, ce que
 * chaque recherche déjà faite a trouvé (`null` : rien), pour ne pas la refaire sur les mêmes boîtes ; `autour`, les
 * places de chaque nom qui tiennent (hors repères), pour ne pas les vérifier deux fois. Au 6e, la recherche
 * se lançait onze fois par ouverture de la Carte et vérifiait 52 000 places (HG-3, expert frontend, 6 octobre 2026).
 * Une recherche est à ne jamais partager entre deux cadrages ni deux cartes : ses places ne valent que pour les boîtes
 * d'un cadrage.
 */
export interface RechercheDuCadrage {
  essais: number;
  /** Les places essayées par la recherche d'un nom tu de moins, sous son plafond (`ESSAIS_D_UN_NOM_DE_MOINS`). */
  essaisDUnNomDeMoins: number;
  places: number;
  readonly deja: Map<string, readonly (readonly [number, LabelBox])[] | null>;
  /** Ce que chaque recherche d'un nom tu de moins a trouvé (`null` : rien), par nom laissé de côté et par boîtes. */
  readonly unNomDeMoins: Map<string, readonly (readonly [number, LabelBox])[] | null>;
  /** Les places autour de chaque nom qui tiennent (sans les repères), déjà vérifiées dans ce cadrage. */
  readonly autour: Map<string, LabelBox[]>;
  /** La recherche du dernier recours (`ECART_DU_DERNIER_RECOURS`), sous ses propres plafonds, ouverte au premier besoin. */
  dernierRecours?: RechercheDuCadrage;
}

/** Une recherche neuve, pour le placement d'un cadrage (voir `RechercheDuCadrage`). */
function rechercheDuCadrage(): RechercheDuCadrage {
  return { essais: 0, essaisDUnNomDeMoins: 0, places: 0, deja: new Map(), unNomDeMoins: new Map(), autour: new Map() };
}

/**
 * Sur la Carte, le placement simple d'abord (DA, 6 octobre 2026) : `placer` sans recherche complète (`recherche` à
 * `null`), comme avant HG-3 ; la recherche complète (`chercherToutesLesPlaces`) ne se lance que si ce placement tait un
 * nom dont l'île se voit, ou en pose un plus près d'une autre île que de la sienne (vu de son milieu). Au 6e, depuis
 * les îles de sciences (SC-2, les îles déplacées), la Mine des lettres et la Ferme des accords passent par la recherche
 * complète, qui les remet sur leur île : le DA lève sa règle « au 6e, chaque nom garde sa place d'avant HG-3 » ; au 6e
 * comme ailleurs, chaque nom sur son île et aucun tu, le placement simple d'abord (mapLabels.test.ts). `etroites` : la
 * largeur de chaque étiquette repliée sans son bloc
 * (`replierLesSignes`), pour juger la place d'un nom replié à sa largeur.
 */
export function placerDAbordSimplement<R extends { offsets: LabelOffset[]; visibles: boolean[]; sansSigne?: boolean[] }>(
  boxes: LabelBox[],
  iles: { x: number; y: number }[],
  vue: { zones: LabelBox[]; bulles: LabelBox[]; bounds: { w: number; h: number } },
  placer: (recherche: RechercheDuCadrage | null) => R,
  etroites: readonly (number | undefined)[] = [],
): R {
  const simple = placer(null);
  const seVoit = ileVue(iles, { couvert: [...vue.zones, ...vue.bulles], bounds: vue.bounds });
  const aReprendre = boxes.some((b, i) => {
    if (!seVoit(i)) return false;
    if (!simple.visibles[i]) return true;
    const w = simple.sansSigne?.[i] && etroites[i] !== undefined ? etroites[i]! : b.w;
    return onAnotherIsland({ ...b, w, x: b.x + simple.offsets[i].dx, y: b.y + simple.offsets[i].dy }, i, iles);
  });
  return aReprendre ? placer(rechercheDuCadrage()) : simple;
}

/** Combien de noms de plus que la Carte sans lui le nom de l'île touchée peut taire (référent dys, 9 octobre 2026). */
const TAIRE_POUR_L_ILE_TOUCHEE = 1;

/**
 * Sur la Carte, l'île touchée (`CarteDesEtiquettes.selected`) ne garde son nom que s'il fait taire au plus
 * `TAIRE_POUR_L_ILE_TOUCHEE` nom de plus, parmi les îles qui se voient, que la Carte sans lui (où rien n'est touché) ;
 * sinon il cède, et la Carte est celle où rien n'est touché ; de même s'il se tait malgré tout en taisant plus de noms
 * qu'elle (référent dys, 9 octobre 2026 : au 6e, en portrait 800 × 1280 en OpenDyslexic 32 px, la Ferme des accords
 * touchée en taisait deux). `placer(false)` place les noms avec l'île touchée, `placer(true)` sans elle ; la Carte sans
 * lui ne se calcule que si celle avec lui tait plus d'un autre nom ou tait le sien.
 */
export function avecLIleTouchee<R extends { visibles: boolean[] }>(
  iles: { x: number; y: number }[],
  vue: { zones: LabelBox[]; bulles: LabelBox[]; bounds: { w: number; h: number } },
  touchee: number | undefined,
  placer: (sansLui: boolean) => R,
): R {
  const avec = placer(false);
  if (touchee === undefined || touchee < 0) return avec;
  const seVoit = ileVue(iles, { couvert: [...vue.zones, ...vue.bulles], bounds: vue.bounds });
  const seVoient = iles.map((_, i) => i).filter((i) => i !== touchee && seVoit(i));
  const tus = (v: boolean[]) => seVoient.filter((i) => !v[i]).length;
  const nAvec = tus(avec.visibles);
  const montre = avec.visibles[touchee];
  if (montre && nAvec <= TAIRE_POUR_L_ILE_TOUCHEE) return avec;
  const sans = placer(true);
  return nAvec <= tus(sans.visibles) + (montre ? TAIRE_POUR_L_ILE_TOUCHEE : 0) ? avec : sans;
}

/** Ce que reçoit la recherche complète de la Carte (voir `chercherToutesLesPlaces`). */
interface DemandeDeRecherche {
  boxes: LabelBox[];
  iles: { x: number; y: number }[];
  /** Les noms montrés, à leur place. */
  vues: Map<number, LabelBox>;
  ileVue: (i: number) => boolean;
  /** La place tient-elle pour ce nom, sans compter les autres noms ni les repères (voir `reparerLaCarte`) ? */
  tientSeule: (i: number, at: LabelBox) => boolean;
  /** La place est-elle hors des repères, et libre pour ce nom ? */
  horsDesReperes: (i: number, at: LabelBox) => boolean;
  bounds: { w: number; h: number };
  gap: number;
  poussable: (j: number) => boolean;
  voulue: { i: number; at: LabelBox } | null;
  poser: (i: number, at: LabelBox) => void;
  recherche: RechercheDuCadrage;
  /** Ce qui, hors des boîtes, change ce qui tient : l'interface, les repères (dont la flèche de la destination). */
  autour: { couvert: LabelBox[]; obstacles: LabelBox[] };
  /** L'écart permis aux noms, en hauteurs d'étiquette (voir `reparerLaCarte`) : il change ce qui tient, et les clés des caches. */
  ecart: number;
}

/**
 * Sur la Carte, le dernier recours de `reparerLaCarte` : quand un nom dont l'île se voit se tait encore, qu'un nom
 * montré se lit plus près d'une autre île que de la sienne (vu de son milieu, `milieu`), ou que le nom de la destination
 * n'a pas pu remonter au-dessus de sa flèche (`voulue`), toutes les places de tous les noms se cherchent ensemble : chaque
 * nom parmi sa place actuelle (si elle tient) et les places autour de la sienne qui tiennent (`tient`), sans en couvrir
 * un autre ; le nom de la destination garde la sienne (ou prend `voulue`). Les noms aux places les plus rares se posent
 * d'abord, chacun à la plus proche ; au plus `ESSAIS_DE_LA_RECHERCHE` places essayées pour tout le cadrage. La recherche
 * ne change rien si elle ne trouve pas de quoi montrer tous les noms ; elle s'arrête tout de suite si un nom (autre que
 * celui de la destination) n'a aucune place qui tient. Les places de chaque nom se vérifient une fois par recherche, et
 * une recherche déjà faite sur les mêmes boîtes ne se refait pas (`RechercheDuCadrage`). Les Anciens Ateliers et les
 * Îles du Ciel, avec leurs îles d'histoire-géographie (HG-3), serrent neuf noms dans la bande sous le panneau : les
 * poussées de deux noms ne suffisent plus (6 octobre 2026).
 */
function chercherToutesLesPlaces(d: DemandeDeRecherche): void {
  const { boxes, iles, vues, tientSeule, horsDesReperes, bounds, gap, poussable, voulue, poser, recherche } = d;
  let noms = boxes.map((_, i) => i).filter(d.ileVue);
  const surSonIle = (i: number, at: LabelBox) => !onAnotherIsland(at, i, iles);
  const tus = noms.filter((i) => !vues.has(i));
  const ailleurs = noms.some((i) => poussable(i) && vues.has(i) && !surSonIle(i, vues.get(i)!));
  // Le nom de la destination n'est pas à la place voulue (comparée par ses coordonnées : `poser` la pose telle quelle).
  const montree = voulue ? vues.get(voulue.i) : undefined;
  const enBas = voulue !== null && (!montree || montree.x !== voulue.at.x || montree.y !== voulue.at.y);
  if (!tus.length && !ailleurs && !enBas) return;
  // La même recherche, déjà faite dans ce cadrage : son résultat (les places, ou rien).
  const cle = JSON.stringify([boxes, iles, [...vues], voulue, d.autour, noms.filter((i) => !poussable(i)), bounds, gap, d.ecart]);
  // (Une clé de quelques kilo-octets : bien moins cher que les milliers de places qu'elle évite de vérifier.)
  const deja = recherche.deja.get(cle);
  const appliquer = (r: readonly (readonly [number, LabelBox])[] | null) => {
    recherche.deja.set(cle, r);
    if (r) for (const [i, at] of r) poser(i, at);
  };
  if (deja !== undefined) return appliquer(deja);
  // Les places de chaque nom, vérifiées une seule fois : sa place actuelle si elle tient, puis celles autour. Celles
  // autour, sans les repères, ne dépendent que de sa boîte, des îles et de l'interface : les autres recherches du cadrage
  // (la flèche de l'ouvrage à une autre place, un autre tracé suggéré) les reprennent, et n'en retirent que celles que
  // couvre un repère.
  const tient = (i: number, at: LabelBox) => (recherche.places++, tientSeule(i, at)) && horsDesReperes(i, at);
  const commun = JSON.stringify([iles, d.autour.couvert, bounds, gap]);
  const autourDe = new Map<number, LabelBox[]>();
  const placesAutourDe = (i: number) => {
    let l = autourDe.get(i);
    if (l) return l;
    const k = `${i} ${d.ecart} ${JSON.stringify(boxes[i])} ${commun}`;
    let seules = recherche.autour.get(k);
    if (!seules) {
      seules = placesAutour(boxes[i], bounds, gap, TRIES_DE_LA_RECHERCHE).filter((at) => (recherche.places++, tientSeule(i, at)));
      recherche.autour.set(k, seules);
    }
    autourDe.set(i, (l = seules.filter((at) => horsDesReperes(i, at))));
    return l;
  };
  const toutes = new Map<number, LabelBox[]>();
  const placesDe = (i: number) => {
    let l = toutes.get(i);
    if (!l) {
      const ici = vues.get(i);
      toutes.set(i, (l = ici && tient(i, ici) ? [ici, ...placesAutourDe(i)] : placesAutourDe(i)));
    }
    return l;
  };
  // Le nom de la destination (le seul qu'on ne pousse pas) garde sa place, ou prend celle au-dessus de sa flèche.
  const destination = noms.find((i) => !poussable(i));
  const fixables = new Set([destination, voulue?.i]);
  // Un nom montré sans aucune place qui tient (ni la sienne, ni une autre) : aucun essai ne les posera tous. Un nom tu
  // sans aucune place reste tu, et la recherche pose les autres (au 3e, en OpenDyslexic 10 % plus large, la Géométrie
  // n'a aucune place : le Kiosque des témoins retrouve la sienne, HG-3).
  if (noms.some((i) => vues.has(i) && !fixables.has(i) && !placesDe(i).length)) return appliquer(null);
  const sansPlace = new Set(tus.filter((i) => !fixables.has(i) && !placesDe(i).length));
  if (sansPlace.size) {
    noms = noms.filter((i) => !sansPlace.has(i));
    // Plus rien à gagner : aucun autre nom tu, aucun mal placé, la destination à sa place.
    if (!noms.some((i) => !vues.has(i)) && !ailleurs && !enBas) return appliquer(null);
  }
  // Les places, à plat : chacune par son indice, ses bords dans des tableaux de nombres (le retour en arrière en compare
  // des milliers).
  const toutesLesPlaces: LabelBox[] = [];
  const bords: number[] = [];
  const indices = new Map<LabelBox, number>();
  const indiceDe = (at: LabelBox) => {
    let k = indices.get(at);
    if (k === undefined) {
      indices.set(at, (k = toutesLesPlaces.length));
      toutesLesPlaces.push(at);
      bords.push(at.x - at.w / 2, at.x + at.w / 2, at.y - at.h / 2, at.y + at.h / 2);
    }
    return k;
  };
  // Comme `overlap(a, b, gap) > 0`.
  const secouvrent = (a: number, b: number) =>
    Math.min(bords[4 * a + 1], bords[4 * b + 1]) - Math.max(bords[4 * a], bords[4 * b]) + gap > 0 &&
    Math.min(bords[4 * a + 3], bords[4 * b + 3]) - Math.max(bords[4 * a + 2], bords[4 * b + 2]) + gap > 0;
  /**
   * Une place pour chaque nom, parmi les siennes (`fixes`, sinon `placesDe`), en `retours` places essayées au plus par
   * nom, et sous le plafond du cadrage de son compteur (`compteur` : `essais`, ou `essaisDUnNomDeMoins`) : les places
   * trouvées, ou `null`.
   */
  const essayer = (fixes: Map<number, LabelBox[]>, retours: number, compteur: 'essais' | 'essaisDUnNomDeMoins' = 'essais'): Map<number, LabelBox> | null => {
    const places = new Map(noms.map((i) => [i, (fixes.get(i) ?? placesDe(i)).map(indiceDe)]));
    if ([...places.values()].some((l) => !l.length)) return null;
    const out = new Map<number, LabelBox>();
    const plafond = Math.min(compteur === 'essais' ? ESSAIS_DE_LA_RECHERCHE : ESSAIS_D_UN_NOM_DE_MOINS, recherche[compteur] + retours * noms.length);
    // Les places encore libres de chaque nom à poser : chaque nom posé retire celles qu'il couvre.
    const poserLeSuivant = (restes: Map<number, number[]>): boolean => {
      // Le nom qui a le moins de places encore libres se pose d'abord ; un nom sans place libre : on revient en arrière.
      let suivant: number | undefined;
      for (const [i, l] of restes) {
        if (!l.length) return false;
        if (suivant === undefined || l.length < restes.get(suivant)!.length) suivant = i;
      }
      if (suivant === undefined) return true;
      for (const at of restes.get(suivant)!) {
        if (recherche[compteur] >= plafond) return false;
        recherche[compteur]++;
        const suite = new Map<number, number[]>();
        for (const [i, l] of restes) if (i !== suivant) suite.set(i, l.filter((q) => !secouvrent(at, q)));
        out.set(suivant, toutesLesPlaces[at]);
        if (poserLeSuivant(suite)) return true;
        out.delete(suivant);
      }
      return false;
    };
    return poserLeSuivant(places) ? out : null;
  };
  const ici = destination === undefined ? undefined : vues.get(destination);
  // D'abord toutes les places à la fois, celles que les essais suivants préfèrent comprises (la place voulue du nom de
  // la destination, sa place actuelle) : si aucune façon de poser tous les noms n'existe, aucun essai plus étroit n'en
  // trouvera. Au 6e, une recherche sur deux échouait ainsi, après des centaines d'essais (HG-3, expert frontend).
  const large = new Map<number, LabelBox[]>();
  const ajouter = (i: number, at: LabelBox) => {
    const l = large.get(i) ?? placesDe(i);
    if (!l.includes(at)) large.set(i, [at, ...l]);
  };
  if (voulue) ajouter(voulue.i, voulue.at);
  if (destination !== undefined && ici) ajouter(destination, ici);
  const une = essayer(large, Infinity);
  if (!une) {
    // Rien qui montre tous les noms : un nom tu de moins vaut mieux que rien (référent dys, SC-3 : au 3e, en OpenDyslexic
    // 32 px, le Kiosque des témoins, le Plateau des territoires et l'Observatoire des données se taisaient ensemble,
    // faute d'une place pour les trois). Chaque nom tu, celui qui a le moins de places d'abord, est laissé de côté à son
    // tour ; les autres se cherchent une place ensemble, celles sous leur île d'abord (la Carte laisse de la place en bas,
    // sous les îles, et la recherche par la plus proche s'y perdait en centaines de milliers d'essais), en
    // `RETOURS_D_UN_NOM_DE_MOINS` places essayées au plus par nom, sous son propre plafond pour tout le cadrage
    // (`ESSAIS_D_UN_NOM_DE_MOINS`, à part de celui de la recherche large : les placements suivants du même cadrage gardent
    // leurs essais). Seulement quand deux noms au moins se taisent (laisser de côté le seul nom tu ne montrerait rien de
    // plus), et quand la recherche large a fini sans trouver : arrêtée par son plafond, elle n'a pas montré qu'aucune
    // solution n'existe (expert frontend, SC-3). Sinon, rien ne change, et l'échec est retenu.
    if (recherche.essais >= ESSAIS_DE_LA_RECHERCHE) return appliquer(null);
    const parSesPlaces = (i: number, j: number) => placesDe(i).length - placesDe(j).length || i - j;
    const tusALaisser = tus.filter((i) => !fixables.has(i)).sort(parSesPlaces);
    if (tusALaisser.length < 2) return appliquer(null);
    // Puis, si aucun nom tu laissé de côté ne laisse poser les autres, chaque nom montré à son tour (le nom de la
    // destination jamais) : au 5e, vers le Glacier des relatifs, cinq noms se taisaient faute d'une place pour le Delta
    // des ressources (une seule) ; laisser de côté la Prairie des climats, montrée, les pose tous, et le dernier recours
    // la remet (consultant UX UI et référent dys, 9 octobre 2026). Sous le même plafond (`ESSAIS_D_UN_NOM_DE_MOINS`).
    const montresALaisser = noms.filter((i) => vues.has(i) && !fixables.has(i) && poussable(i)).sort(parSesPlaces);
    const aLaisser = [...tusALaisser, ...montresALaisser];
    const tous = noms;
    let trouvees: Map<number, LabelBox> | null = null;
    // Ce que la recherche sans ce nom a déjà donné dans ce cadrage, quelle que soit la place actuelle des autres noms :
    // les places qu'elle trouve tiennent sans eux (même boîtes, mêmes îles, même interface, mêmes repères). Les
    // placements d'un cadrage la relançaient sur les mêmes boîtes, une quinzaine de fois au 3e en OpenDyslexic 32 px.
    // Un échec gardé ne regarde pas la place actuelle des autres noms : il peut cacher une solution, et taire au pire
    // un nom de plus.
    const commeAvant = JSON.stringify([tous, tous.filter((i) => !poussable(i)), boxes, iles, voulue, ici, d.autour, bounds, gap, d.ecart]);
    for (const k of aLaisser) {
      const cleSansLui = `${k} ${commeAvant}`;
      const dejaSansLui = recherche.unNomDeMoins.get(cleSansLui);
      if (dejaSansLui !== undefined) {
        trouvees = dejaSansLui && new Map(dejaSansLui);
        if (trouvees) break;
        continue;
      }
      if (recherche.essaisDUnNomDeMoins >= ESSAIS_D_UN_NOM_DE_MOINS) break;
      noms = tous.filter((i) => i !== k);
      const parLeBas = new Map(noms.map((i) => [i, [...(large.get(i) ?? placesDe(i))].sort((p, q) => q.y - p.y)]));
      trouvees = essayer(parLeBas, RETOURS_D_UN_NOM_DE_MOINS, 'essaisDUnNomDeMoins');
      recherche.unNomDeMoins.set(cleSansLui, trouvees && [...trouvees]);
      if (trouvees) break;
    }
    noms = tous;
    return appliquer(trouvees ? [...trouvees] : null);
  }
  const contraintes: Map<number, LabelBox[]>[] = [];
  if (voulue) contraintes.push(new Map([[voulue.i, [voulue.at]]]));
  if (destination !== undefined && ici) {
    contraintes.push(new Map([[destination, [ici]]]));
    // Sinon, une autre place au-dessus de son île (DA-31), toujours hors de sa flèche.
    const dessus = placesAutourDe(destination).filter((at) => at.y + at.h / 2 <= iles[destination].y);
    if (dessus.length) contraintes.push(new Map([[destination, dessus]]));
  }
  // Chacune en quelques places essayées par nom (`RETOURS_PAR_NOM`) : la recherche large a déjà trouvé une solution, qui
  // reste si aucune préférée ne se trouve vite (plutôt le nom de la destination sous son île qu'un autre nom tu).
  for (const fixes of contraintes) {
    const trouvees = essayer(fixes, RETOURS_PAR_NOM);
    if (trouvees) return appliquer([...trouvees]);
  }
  return appliquer([...une]);
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
  if (vue.recherche === undefined) vue = { ...vue, recherche: rechercheDuCadrage() };
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

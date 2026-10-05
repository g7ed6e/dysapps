// Les tracés des liaisons (GD-9, L2) : l'élève pose ses liaisons, c'est le jeu qui les trace, droites ou en L à un
// seul coude sur l'eau, jamais en biais, d'une arrivée d'un lieu (`landing` : sur sa côte, au pas de la grille, une par
// côté ; au point de départ, autant qu'il y a de pas sur ses côtés) à une arrivée de l'autre. Une liaison part droit
// vers le large, au moins deux cases, avant de tourner ; elle passe à deux cases au moins de toute emprise, ne coupe
// aucun lieu, aucun écueil, aucune autre liaison. Courte (un pont), elle fait 36 cases au plus ; longue (un bac), 96.
// Code pur, sans Three.js : il trace les liaisons posées, dans l'ordre où elles l'ont été, puis dit si une liaison de
// plus tiendrait, et le geste « Aménager » s'en servira (`spotPossible`).
import { BIOMES, type BiomeId } from '../biomes';
import { ARCHIPELAGOS, type BridgeDef } from './archipelago';
import { decorate, LANDMARK_OF, landmark } from './decor';
import { frameOf, LINK_GAP, tooSmallGaps, footprintOf } from './footprint';
import { type ArchipelagoId, bornesDuCoeur, CORE, isLand, isLandInWorld, isthmusOf, type IslandDef, landCells, landscape, margesDuCoeur, noise, reliefHeight, tirage, toWorld } from './map';
import { LOW } from './paths';
import { type Side, SIDES, STEP, type Quarts, turnDirection, TOWARDS_SEA } from './placement';

/** La longueur d'une liaison courte (un pont, un sentier entre deux voisins), en cases sur l'eau. */
export const SHORT_LENGTH = 36;

/** La longueur d'une liaison longue (un bac, une liaison du point de départ). */
export const LONG_LENGTH = 96;

/** Une liaison part droit vers le large d'au moins tant de cases avant son coude. */
export const OFFSHORE_BEFORE_BEND = 2;

/** Les lieux du point de départ d'une région (au 6e, la Forêt et la Plaine) : ils ont un point d'attache à chaque pas. */
export function startingPlaces(a: ArchipelagoId): readonly BiomeId[] {
  const def = ARCHIPELAGOS.find((x) => x.classe === a)!;
  return def.starts.includes(def.port) ? def.starts : [...def.starts, def.port];
}

/** Deux lieux réunis (un isthme sur la carte de départ) : leur liaison est un sentier sur la terre, qui ne se trace pas ici. */
export function linkBetweenJoined(b: BridgeDef): boolean {
  return isthmusOf(b.from) === b.to;
}

// ---------- Les arrivées et les points d'attache ----------

/** Une arrivée possible d'un lieu, dans son repère (le lieu pas tourné) : sa case de côte, au pas, sur un côté. */
export interface LocalLanding {
  cote: Side;
  /** Sa place le long du côté, en pas depuis l'origine du cœur. */
  pas: number;
  x: number;
  y: number;
}

/** Une arrivée dans le monde, le lieu posé et tourné : sa case de côte, la direction du large, et le côté qu'elle prend. */
export interface Anchor {
  lieu: BiomeId;
  /** Le côté du lieu dans son repère (avant rotation) et la place en pas : ce que garde la disposition. */
  cote: Side;
  pas: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const landingsCache = new Map<string, readonly LocalLanding[]>();

/**
 * Les cases du lieu où se tient un décor haut (un arbre, un rocher, un repère, une cascade), dans son repère : une liaison
 * n'arrive jamais à côté (le bonhomme en descend sur le sol libre, et le décor reste celui de la naissance du lieu).
 */
function tallDecor(def: IslandDef): Set<string> {
  const out = new Set<string>(landmarkBase(def));
  const ajouter = (x: number, y: number) => out.add(`${x - def.core.x},${y - def.core.y}`);
  for (const c of [...landscape(def), ...margesDuCoeur(def)]) {
    if (!c.decor || LOW.has(c.decor)) continue;
    const t = tirage(def, c.x, c.y);
    decorate((x, y) => ajouter(x, y), c.decor, c.x, c.y, noise(def.seed + 5, t.x, t.y));
  }
  return out;
}

const basesCache = new Map<BiomeId, ReadonlySet<string>>();

/**
 * Les repères dont le socle ferme le passage aux liaisons : le grand phare des Îles du Ciel (DA, 5 octobre 2026). Les
 * autres repères ne sont pas dans la demande : l'aiguille de glace fermerait la liaison du Glacier au Carrefour sur la
 * carte de départ, qu'ils gardent.
 */
const CLOSED_BASES: ReadonlySet<string> = new Set(['grand-phare']);

/**
 * Le repère d'un lieu (`CLOSED_BASES`) et une case autour, dans son repère : le socle de 3 × 3 du grand phare
 * d'Archipéo déborde d'une case la tour de Blocland. Aucune liaison n'y arrive, n'y passe, ni ne part de dessous (DA,
 * 5 octobre 2026). Tiré une fois : le repère suit le dessin du lieu.
 */
function landmarkBase(def: IslandDef): ReadonlySet<string> {
  const connu = basesCache.get(def.id);
  if (connu) return connu;
  const out = new Set<string>();
  const repere = LANDMARK_OF[def.id];
  if (repere && CLOSED_BASES.has(repere)) landmark(def, landscape(def), (x, y) => {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(`${x + dx - def.core.x},${y + dy - def.core.y}`);
  });
  basesCache.set(def.id, out);
  return out;
}

/**
 * Les cases d'un lieu où le bonhomme marche depuis son cœur, dans son repère : de proche en proche (diagonales
 * comprises), une marche d'un bloc au plus, ni eau ni lave. Une liaison n'arrive que là : derrière une falaise ou un
 * sommet, on ne redescendrait pas dans le lieu.
 */
function walkableCells(def: IslandDef, haut: ReadonlySet<string>): Set<string> {
  const sol = new Map<string, number>();
  for (const c of landscape(def)) {
    const k = `${c.x - def.core.x},${c.y - def.core.y}`;
    if (c.ground !== 'eau' && c.ground !== 'lave' && !haut.has(k)) sol.set(k, reliefHeight(def, c.x, c.y));
  }
  for (const c of landCells(def)) {
    const k = `${c.x - def.core.x},${c.y - def.core.y}`;
    if (!sol.has(k) && !haut.has(k) && isLand(def, c.x, c.y)) sol.set(k, reliefHeight(def, c.x, c.y));
  }
  const vus = new Set<string>();
  const file: { x: number; y: number }[] = [];
  for (let x = 0; x < CORE; x++)
    for (let y = 0; y < CORE; y++) {
      const k = `${x},${y}`;
      if (sol.has(k) && !vus.has(k)) {
        vus.add(k);
        file.push({ x, y });
      }
    }
  for (let i = 0; i < file.length; i++) {
    const { x, y } = file[i];
    const h = sol.get(`${x},${y}`)!;
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        if (!dx && !dy) continue;
        const k = `${x + dx},${y + dy}`;
        const n = sol.get(k);
        if (n === undefined || vus.has(k) || Math.abs(n - h) > 1) continue;
        vus.add(k);
        file.push({ x: x + dx, y: y + dy });
      }
  }
  return vus;
}

const walkableCache = new Map<string, Set<string>>();

/**
 * Le décalage, dans le repère d'un lieu tourné de `q` quarts, des lignes de la grille du monde (au pas de `STEP` depuis
 * l'origine de son cœur) : un demi-tour envoie la case x du repère en 15 − x (`turnCell`), si bien qu'une ligne
 * au pas du monde tombe, dans le repère, sur x ≡ 3 (mod 4) plutôt que sur x ≡ 0. `colonnes` : les lignes de x constant
 * du repère (côtés devant et derrière) ; `rangees` : celles de y constant (côtés gauche et droit).
 */
export function lineOffset(q: Quarts): { colonnes: number; rangees: number } {
  return { colonnes: q === 1 || q === 2 ? STEP - 1 : 0, rangees: q === 2 || q === 3 ? STEP - 1 : 0 };
}

/**
 * Les arrivées possibles d'un lieu, dans son repère (le lieu pas tourné), calculées une fois par orientation : elles ne
 * dépendent que de son dessin. Sur chaque côté, à chaque pas de la grille du monde (`lineOffset`) : la case de
 * côte la plus au large de la colonne (ou de la rangée), si elle a de la terre ; jamais sous un décor haut (elle et la
 * suivante vers l'intérieur), ni devant les bornes (la bande de devant, sur toute la largeur du cœur). `pas` : le rang
 * de sa ligne, en pas.
 */
export function possibleLandings(def: IslandDef): readonly LocalLanding[] {
  const cleDuLieu = `${def.id}:${def.quarts}`;
  const connues = landingsCache.get(cleDuLieu);
  if (connues) return connues;
  const decalage = lineOffset(def.quarts);
  const terre = new Set(landCells(def).filter((c) => isLand(def, c.x, c.y)).map((c) => `${c.x - def.core.x},${c.y - def.core.y}`));
  const haut = tallDecor(def);
  const coeur = bornesDuCoeur(def);
  const out: LocalLanding[] = [];
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const k of terre) {
    const [x, y] = k.split(',').map(Number);
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  // Libre : ni la case d'arrivée ni la suivante vers l'intérieur ne portent un décor haut (tronc ou feuillage) :
  // le bonhomme descend de la liaison et entre tout droit dans le lieu.
  let marche = walkableCache.get(def.id);
  if (!marche) walkableCache.set(def.id, (marche = walkableCells(def, haut)));
  const ouLonMarche = marche;
  const libre = (x: number, y: number, dx: number, dy: number) => {
    for (let k = 0; k <= 1; k++) if (haut.has(`${x - k * dx},${y - k * dy}`)) return false;
    // Le bonhomme doit pouvoir gagner le cœur du lieu à pied depuis son arrivée.
    return ouLonMarche.has(`${x},${y}`);
  };
  for (const cote of SIDES) {
    const { dx, dy } = TOWARDS_SEA[cote];
    const vertical = dy !== 0;
    const [debut, fin] = vertical ? [x0, x1] : [y0, y1];
    const d = vertical ? decalage.colonnes : decalage.rangees;
    for (let p = Math.ceil((debut - d) / STEP) * STEP + d; p <= fin; p += STEP) {
      // Devant le cœur, la bande des bornes : aucune arrivée.
      if (cote === 'devant' && p >= coeur.x0 && p < coeur.x1) continue;
      // La case de côte la plus au large sur cette ligne.
      let best: { x: number; y: number } | null = null;
      for (const k of terre) {
        const [x, y] = k.split(',').map(Number);
        if ((vertical ? x : y) !== p) continue;
        if (!best || (vertical ? (y - best.y) * dy > 0 : (x - best.x) * dx > 0)) best = { x, y };
      }
      if (!best || !libre(best.x, best.y, dx, dy)) continue;
      out.push({ cote, pas: (p - d) / STEP, x: best.x, y: best.y });
    }
  }
  const figees = Object.freeze(out);
  landingsCache.set(cleDuLieu, figees);
  return figees;
}

/** Une arrivée possible d'un lieu dans le monde, le lieu posé et tourné. */
export function anchorInWorld(def: IslandDef, a: LocalLanding): Anchor {
  const p = toWorld(def, a.x, a.y);
  const d = turnDirection(TOWARDS_SEA[a.cote].dx, TOWARDS_SEA[a.cote].dy, def.quarts);
  return { lieu: def.id, cote: a.cote, pas: a.pas, x: p.x, y: p.y, dx: d.dx, dy: d.dy };
}

// ---------- Les tracés ----------

/** Le tracé d'une liaison : ses cases sur l'eau, d'une arrivée à l'autre (arrivées exclues), et son coude. */
export interface LinkRoute {
  id: string;
  cases: readonly { x: number; y: number }[];
  /** L'indice de la case du coude dans `cases`, ou −1 pour une liaison droite. */
  coude: number;
  depuis: Anchor;
  vers: Anchor;
}

/** Le chemin droit ou en L d'une arrivée à une autre, ou `null` s'il n'y en a pas (jamais en biais, jamais en Z). */
export function pathBetween(f: Anchor, t: Anchor): { cases: { x: number; y: number }[]; coude: number } | null {
  const cases: { x: number; y: number }[] = [];
  // Droite : les deux arrivées se font face, sur la même ligne.
  if (f.dx === -t.dx && f.dy === -t.dy) {
    const n = f.dx !== 0 ? (t.x - f.x) * f.dx : (t.y - f.y) * f.dy;
    if (f.dx !== 0 ? f.y !== t.y : f.x !== t.x) return null;
    if (n < 2) return null;
    for (let i = 1; i < n; i++) cases.push({ x: f.x + f.dx * i, y: f.y + f.dy * i });
    return { cases, coude: -1 };
  }
  // En L : les deux directions sont perpendiculaires ; le coude est au croisement des deux lignes.
  if (f.dx * t.dx + f.dy * t.dy !== 0) return null;
  const c = f.dx !== 0 ? { x: t.x, y: f.y } : { x: f.x, y: t.y };
  const a = f.dx !== 0 ? (c.x - f.x) * f.dx : (c.y - f.y) * f.dy;
  const b = t.dx !== 0 ? (c.x - t.x) * t.dx : (c.y - t.y) * t.dy;
  if (a < OFFSHORE_BEFORE_BEND + 1 || b < OFFSHORE_BEFORE_BEND + 1) return null;
  for (let i = 1; i <= a; i++) cases.push({ x: f.x + f.dx * i, y: f.y + f.dy * i });
  const coude = cases.length - 1;
  for (let i = b - 1; i >= 1; i--) cases.push({ x: t.x + t.dx * i, y: t.y + t.dy * i });
  return { cases, coude };
}

/** Le traceur marque chaque lieu d'un bit d'un entier de 32 bits (`1 << rang`) : au plus 31 lieux par région. */
export const MAX_ISLANDS_PER_REGION = 31;

/** Une grille de cases sur le cadre de la région. */
class Grid {
  readonly w: number;
  readonly h: number;
  readonly x0: number;
  readonly y0: number;
  /** Ce qu'aucune liaison ne touche : la terre, les îlots, les écueils, les autres liaisons (et leur abord). */
  readonly dur: Uint8Array;
  /** Les lieux dont la terre est à moins de `LINK_GAP` cases : un bit par lieu (son rang dans la région). */
  readonly pres: Uint32Array;
  constructor(a: ArchipelagoId) {
    const c = frameOf(a);
    this.x0 = c.x0;
    this.y0 = c.y0;
    this.w = c.x1 - c.x0;
    this.h = c.y1 - c.y0;
    this.dur = new Uint8Array(this.w * this.h);
    this.pres = new Uint32Array(this.w * this.h);
  }
  i(x: number, y: number): number {
    const lx = x - this.x0;
    const ly = y - this.y0;
    return lx < 0 || ly < 0 || lx >= this.w || ly >= this.h ? -1 : ly * this.w + lx;
  }
  /** Marque un rectangle élargi de `marge` cases. */
  rectangle(r: { x0: number; y0: number; x1: number; y1: number }, marge: number, f: (i: number) => void): void {
    for (let x = r.x0 - marge; x < r.x1 + marge; x++)
      for (let y = r.y0 - marge; y < r.y1 + marge; y++) {
        const i = this.i(x, y);
        if (i >= 0) f(i);
      }
  }
}

/** Ce qu'on donne au traceur : les lieux de la région à leur place, et les écueils de la mer (cases « x,y »). */
export interface RegionPlans {
  lieux: readonly IslandDef[];
  ecueils?: Iterable<string>;
  /** Les arrivées choisies par lieu (la disposition) ; sans elles, le traceur choisit, une par côté. */
  arrivees?: ReadonlyMap<BiomeId, readonly { cote: Side; pas: number }[]>;
}

/**
 * Le traceur d'une région : la grille de ce qu'une liaison ne touche pas (la terre et les îlots de chaque lieu, son
 * quai, les écueils, et les liaisons déjà posées, avec leur abord), et les arrivées libres de chaque lieu. `poser` trace
 * une liaison et la garde ; `essayer` dit seulement le tracé qu'elle prendrait. Chaque fois, le chemin valable le plus
 * court parmi les arrivées encore libres de ses deux bouts (une par côté d'un lieu ; au point de départ, chaque point
 * d'attache une fois), droit avant un L, puis le premier dans l'ordre ; `null` : elle ne tient pas.
 */
export class RegionRouter {
  private readonly g: Grid;
  private readonly rang: Map<BiomeId, number>;
  private readonly possibles = new Map<BiomeId, Anchor[]>();
  private readonly depart: Set<BiomeId>;
  private readonly prises = new Set<string>();
  private readonly cotesPris = new Set<string>();

  constructor(a: ArchipelagoId, plans: RegionPlans) {
    const lieux = plans.lieux;
    // Un bit par lieu dans `Grid.pres` (un entier de 32 bits, signé par `1 << rang`) : 31 lieux au plus par région.
    if (lieux.length > MAX_ISLANDS_PER_REGION) throw new Error(`Le traceur tient ${MAX_ISLANDS_PER_REGION} lieux par région au plus (${a} en a ${lieux.length}).`);
    this.rang = new Map(lieux.map((d, i) => [d.id, i]));
    const g = new Grid(a);
    this.g = g;
    // Ce qui est dur : la terre de chaque lieu, ses îlots et son quai (et leur abord), les écueils (et leur abord).
    for (const d of lieux)
      for (const p of footprintOf(d.id, d)) {
        if (p.genre === 'terre') {
          const bit = 1 << this.rang.get(d.id)!;
          g.rectangle(p, LINK_GAP - 1, (i) => (g.pres[i] |= bit));
          g.rectangle(p, 0, (i) => {
            const x = g.x0 + (i % g.w);
            const y = g.y0 + Math.floor(i / g.w);
            if (isLandInWorld(d, x, y)) g.dur[i] = 1;
          });
        } else g.rectangle(p, LINK_GAP - 1, (i) => (g.dur[i] = 1));
      }
    // Le repère d'un lieu et son socle : aucune liaison n'y passe.
    for (const d of lieux)
      for (const k of landmarkBase(d)) {
        const [lx, ly] = k.split(',').map(Number);
        const p = toWorld(d, lx, ly);
        const i = g.i(p.x, p.y);
        if (i >= 0) g.dur[i] = 1;
      }
    for (const k of plans.ecueils ?? []) {
      const [x, y] = k.split(',').map(Number);
      g.rectangle({ x0: x, y0: y, x1: x + 1, y1: y + 1 }, 1, (i) => (g.dur[i] = 1));
    }
    this.depart = new Set(startingPlaces(a));
    for (const d of lieux) {
      const choisies = plans.arrivees?.get(d.id);
      const locales = possibleLandings(d).filter((l) => !choisies || choisies.some((c) => c.cote === l.cote && c.pas === l.pas));
      this.possibles.set(d.id, locales.map((l) => anchorInWorld(d, l)));
    }
  }

  private cle(c: Anchor): string {
    return `${c.lieu}|${c.cote}|${c.pas}`;
  }

  private libre(c: Anchor): boolean {
    return !this.prises.has(this.cle(c)) && (this.depart.has(c.lieu) || !this.cotesPris.has(`${c.lieu}|${c.cote}`));
  }

  /** Le tracé que prendrait une liaison de `max` cases au plus, sans la poser ; `null` si elle ne tient pas. */
  essayer(b: BridgeDef, max: number): LinkRoute | null {
    const ra = this.rang.get(b.from);
    const rb = this.rang.get(b.to);
    if (ra === undefined || rb === undefined) return null;
    const bitA = 1 << ra;
    const bitB = 1 << rb;
    let best: LinkRoute | null = null;
    for (const f of this.possibles.get(b.from)!) {
      if (!this.libre(f)) continue;
      for (const t of this.possibles.get(b.to)!) {
        if (!this.libre(t)) continue;
        const ch = pathBetween(f, t);
        if (!ch || ch.cases.length > max || (best && ch.cases.length >= best.cases.length)) continue;
        if (!freePath(this.g, ch, bitA, bitB)) continue;
        best = { id: b.id, cases: ch.cases, coude: ch.coude, depuis: f, vers: t };
      }
    }
    return best;
  }

  /** Trace une liaison et la garde (ses arrivées prises, son chemin et son abord durs pour les suivantes). */
  poser(b: BridgeDef, max: number): LinkRoute | null {
    const best = this.essayer(b, max);
    if (!best) return null;
    this.prises.add(this.cle(best.depuis));
    this.prises.add(this.cle(best.vers));
    this.cotesPris.add(`${best.depuis.lieu}|${best.depuis.cote}`);
    this.cotesPris.add(`${best.vers.lieu}|${best.vers.cote}`);
    for (const c of best.cases) this.g.rectangle({ x0: c.x, y0: c.y, x1: c.x + 1, y1: c.y + 1 }, LINK_GAP - 1, (i) => (this.g.dur[i] = 1));
    return best;
  }
}

/**
 * Trace les liaisons posées d'une région, dans l'ordre où elles l'ont été (`liaisons`, sans celles des lieux réunis),
 * chacune `max(b)` cases au plus. `null` : la liaison ne tient pas (une liaison à reposer, GD-9).
 */
export function routeRegion(
  a: ArchipelagoId,
  plans: RegionPlans,
  liaisons: readonly BridgeDef[],
  max: (b: BridgeDef) => number,
): Map<string, LinkRoute | null> {
  const t = new RegionRouter(a, plans);
  const out = new Map<string, LinkRoute | null>();
  for (const b of liaisons) if (!linkBetweenJoined(b)) out.set(b.id, t.poser(b, max(b)));
  return out;
}

/**
 * Le chemin tient-il ? Dans le cadre, sur l'eau, loin des îlots, des écueils et des autres liaisons ; loin de la terre
 * des autres lieux ; près de la terre d'un de ses bouts seulement au départ de ce bout, avant le coude, et plus jamais
 * ensuite ; son coude au large des deux.
 */
function freePath(g: Grid, ch: { cases: { x: number; y: number }[]; coude: number }, bitA: number, bitB: number): boolean {
  const n = ch.cases.length;
  const idx: number[] = [];
  for (const c of ch.cases) {
    const i = g.i(c.x, c.y);
    if (i < 0 || g.dur[i]) return false;
    if (g.pres[i] & ~(bitA | bitB)) return false;
    idx.push(i);
  }
  // Le départ de chaque bout : un préfixe (depuis son arrivée) près de sa terre, puis plus jamais.
  const fin = ch.coude < 0 ? n : ch.coude;
  let k = 0;
  while (k < n && g.pres[idx[k]] & bitA) k++;
  if (k > fin && ch.coude >= 0) return false;
  for (let j = k; j < n; j++) if (g.pres[idx[j]] & bitA) return false;
  let m = n - 1;
  while (m >= 0 && g.pres[idx[m]] & bitB) m--;
  if (ch.coude >= 0 && m < ch.coude) return false;
  for (let j = m; j >= 0; j--) if (g.pres[idx[j]] & bitB) return false;
  return true;
}

/**
 * Une place est-elle possible pour le lieu `id` dans la disposition `lieux` (le lieu à sa nouvelle place) ? Son emprise
 * tient dans le cadre, à `GAP_BETWEEN_PLACES` cases d'eau des autres, et les liaisons posées (`liaisons`, dans leur
 * ordre) se tracent toutes encore. Code pur : le geste « Aménager » le lira.
 */
export function spotPossible(
  a: ArchipelagoId,
  lieux: readonly IslandDef[],
  id: BiomeId,
  liaisons: readonly BridgeDef[] = [],
  max: (b: BridgeDef) => number = () => LONG_LENGTH,
): boolean {
  if (tooSmallGaps(a, lieux).some((e) => e.place === id || e.other === id)) return false;
  for (const t of routeRegion(a, { lieux }, liaisons, max).values()) if (!t) return false;
  return true;
}

/** Les lieux d'une région, dans l'ordre des données. */
export function placesOf(a: ArchipelagoId): BiomeId[] {
  return BIOMES.filter((b) => b.classe === a).map((b) => b.id);
}

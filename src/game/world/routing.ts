// Les tracés des liaisons (GD-9, L2) : c'est le jeu qui trace chaque liaison, droite ou en L à un seul coude sur l'eau
// (une liaison longue, si rien d'autre ne passe, en Z ou en U à deux coudes), jamais en biais, d'une arrivée d'un lieu
// (`landing` : sur sa côte, au pas de la grille, une par côté) à une arrivée de l'autre, ou à un point d'attache du point de départ (à chaque pas sur ses quatre côtés). Une liaison part droit
// vers le large, au moins deux cases, avant de tourner ; elle passe à deux cases au moins de toute emprise, ne coupe
// aucun lieu, aucun écueil, aucune autre liaison. Courte, elle fait 36 cases au plus ; longue (le bac, les liaisons du
// point de départ), 96. Code pur, sans Three.js : la même règle trace la carte de départ et dira, au geste « Aménager »,
// si une place est possible (`placePossible`).
import { BIOMES, type BiomeId } from '../biomes';
import { ARCHIPELAGOS, type BridgeDef, BRIDGES } from './archipelago';
import { decorate } from './decor';
import { cadreDe, distanceAuRectangle, ECART_DES_LIAISONS, ECART_ENTRE_LES_LIEUX, ecartEntre, empriseDuLieu, type PartDEmprise } from './footprint';
import { type ArchipelagoId, archipelagoOfIsland, bornesDuCoeur, isLand, isLandDuMonde, isthmusOf, type IslandDef, landCells, landscape, margesDuCoeur, noise, tirage, versLeMonde } from './map';
import { LOW } from './paths';
import { type Cote, COTES, PAS, type Quarts, tournerLaDirection, VERS_LE_LARGE } from './placement';

/** La longueur d'une liaison courte (un pont, un sentier entre deux voisins), en cases sur l'eau. */
export const LONGUEUR_COURTE = 36;

/** La longueur d'une liaison longue (un bac, une liaison du point de départ). */
export const LONGUEUR_LONGUE = 96;

/** Une liaison part droit vers le large d'au moins tant de cases avant son coude. */
export const AU_LARGE_AVANT_LE_COUDE = 2;

/** Les lieux du point de départ d'une région : ceux d'où partent les liaisons en étoile (au 6e, la Forêt et la Plaine). */
export function lieuxDuDepart(a: ArchipelagoId): readonly BiomeId[] {
  const def = ARCHIPELAGOS.find((x) => x.classe === a)!;
  return def.starts.includes(def.port) ? def.starts : [...def.starts, def.port];
}

/** Une liaison du point de départ : elle touche un lieu du point de départ. */
export function liaisonDuDepart(b: BridgeDef): boolean {
  const a = archipelagoOfIsland(b.from);
  const depart = lieuxDuDepart(a);
  return depart.includes(b.from) || depart.includes(b.to);
}

/** Deux lieux réunis (un isthme sur la carte de départ) : leur liaison est un sentier sur la terre, qui ne se trace pas ici. */
export function liaisonEntreReunis(b: BridgeDef): boolean {
  return isthmusOf(b.from) === b.to;
}

/** La longueur la plus grande d'une liaison : longue pour un bac et pour une liaison du point de départ, courte sinon. */
export function longueurMax(b: BridgeDef): number {
  return b.kind === 'bac' || liaisonDuDepart(b) ? LONGUEUR_LONGUE : LONGUEUR_COURTE;
}

// ---------- Les arrivées et les points d'attache ----------

/** Une arrivée possible d'un lieu, dans son repère (le lieu pas tourné) : sa case de côte, au pas, sur un côté. */
export interface ArriveeLocale {
  cote: Cote;
  /** Sa place le long du côté, en pas depuis l'origine du cœur. */
  pas: number;
  x: number;
  y: number;
}

/** Une arrivée dans le monde, le lieu posé et tourné : sa case de côte, la direction du large, et le côté qu'elle prend. */
export interface Accroche {
  lieu: BiomeId;
  /** Le côté du lieu dans son repère (avant rotation) et la place en pas : ce que garde la disposition. */
  cote: Cote;
  pas: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

const candidatsLocaux = new Map<string, readonly ArriveeLocale[]>();

/**
 * Les cases du lieu où se tient un décor haut (un arbre, un rocher, un repère, une cascade), dans son repère : une liaison
 * n'arrive jamais à côté (le bonhomme en descend sur le sol libre, et le décor reste celui de la naissance du lieu).
 */
function decorHaut(def: IslandDef): Set<string> {
  const out = new Set<string>();
  const ajouter = (x: number, y: number) => out.add(`${x - def.core.x},${y - def.core.y}`);
  for (const c of [...landscape(def), ...margesDuCoeur(def)]) {
    if (!c.decor || LOW.has(c.decor)) continue;
    const t = tirage(def, c.x, c.y);
    decorate((x, y) => ajouter(x, y), c.decor, c.x, c.y, noise(def.seed + 5, t.x, t.y));
  }
  return out;
}

/**
 * Le décalage, dans le repère d'un lieu tourné de `q` quarts, des lignes de la grille du monde (au pas de `PAS` depuis
 * l'origine de son cœur) : un demi-tour envoie la case x du repère en 15 − x (`tournerLaCase`), si bien qu'une ligne
 * au pas du monde tombe, dans le repère, sur x ≡ 3 (mod 4) plutôt que sur x ≡ 0. `colonnes` : les lignes de x constant
 * du repère (côtés devant et derrière) ; `rangees` : celles de y constant (côtés gauche et droit).
 */
export function decalageDesLignes(q: Quarts): { colonnes: number; rangees: number } {
  return { colonnes: q === 1 || q === 2 ? PAS - 1 : 0, rangees: q === 2 || q === 3 ? PAS - 1 : 0 };
}

/**
 * Les arrivées possibles d'un lieu, dans son repère (le lieu pas tourné), calculées une fois par orientation : elles ne
 * dépendent que de son dessin. Sur chaque côté, à chaque pas de la grille du monde (`decalageDesLignes`) : la case de
 * côte la plus au large de la colonne (ou de la rangée), si elle a de la terre ; jamais à côté d'un décor haut, ni
 * devant les bornes (la bande de devant, sur toute la largeur du cœur). `pas` : le rang de sa ligne, en pas.
 */
export function arriveesPossibles(def: IslandDef): readonly ArriveeLocale[] {
  const cleDuLieu = `${def.id}:${def.quarts}`;
  const connues = candidatsLocaux.get(cleDuLieu);
  if (connues) return connues;
  const decalage = decalageDesLignes(def.quarts);
  const terre = new Set(landCells(def).filter((c) => isLand(def, c.x, c.y)).map((c) => `${c.x - def.core.x},${c.y - def.core.y}`));
  const haut = decorHaut(def);
  const coeur = bornesDuCoeur(def);
  const out: ArriveeLocale[] = [];
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
  const libre = (x: number, y: number) => {
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (haut.has(`${x + dx},${y + dy}`)) return false;
    return true;
  };
  for (const cote of COTES) {
    const { dx, dy } = VERS_LE_LARGE[cote];
    const vertical = dy !== 0;
    const [debut, fin] = vertical ? [x0, x1] : [y0, y1];
    const d = vertical ? decalage.colonnes : decalage.rangees;
    for (let p = Math.ceil((debut - d) / PAS) * PAS + d; p <= fin; p += PAS) {
      // Devant le cœur, la bande des bornes : aucune arrivée.
      if (cote === 'devant' && p >= coeur.x0 && p < coeur.x1) continue;
      // La case de côte la plus au large sur cette ligne.
      let best: { x: number; y: number } | null = null;
      for (const k of terre) {
        const [x, y] = k.split(',').map(Number);
        if ((vertical ? x : y) !== p) continue;
        if (!best || (vertical ? (y - best.y) * dy > 0 : (x - best.x) * dx > 0)) best = { x, y };
      }
      if (!best || !libre(best.x, best.y)) continue;
      out.push({ cote, pas: (p - d) / PAS, x: best.x, y: best.y });
    }
  }
  const figees = Object.freeze(out);
  candidatsLocaux.set(cleDuLieu, figees);
  return figees;
}

/** Une arrivée possible d'un lieu dans le monde, le lieu posé et tourné. */
export function accrocheDansLeMonde(def: IslandDef, a: ArriveeLocale): Accroche {
  const p = versLeMonde(def, a.x, a.y);
  const d = tournerLaDirection(VERS_LE_LARGE[a.cote].dx, VERS_LE_LARGE[a.cote].dy, def.quarts);
  return { lieu: def.id, cote: a.cote, pas: a.pas, x: p.x, y: p.y, dx: d.dx, dy: d.dy };
}

// ---------- Les tracés ----------

/** Un chemin sur l'eau : ses cases, d'une arrivée à l'autre (arrivées exclues), et l'indice de chacun de ses coudes. */
export interface Chemin {
  cases: { x: number; y: number }[];
  /** Les indices des cases de ses coudes dans `cases`, dans l'ordre : aucun pour un chemin droit. */
  coudes: number[];
}

/** Le tracé d'une liaison : son chemin, et les deux arrivées qu'il relie. */
export interface TraceDeLiaison {
  id: string;
  cases: readonly { x: number; y: number }[];
  coudes: readonly number[];
  depuis: Accroche;
  vers: Accroche;
}

/** Les cases d'une ligne droite de `p` (exclu) dans le sens (dx, dy), `n` cases. */
function ligne(out: { x: number; y: number }[], p: { x: number; y: number }, dx: number, dy: number, n: number): { x: number; y: number } {
  let x = p.x;
  let y = p.y;
  for (let i = 0; i < n; i++) {
    x += dx;
    y += dy;
    out.push({ x, y });
  }
  return { x, y };
}

/** Le chemin droit ou en L d'une arrivée à une autre, ou `null` s'il n'y en a pas (jamais en biais). */
export function cheminEntre(f: Accroche, t: Accroche): Chemin | null {
  const cases: { x: number; y: number }[] = [];
  // Droite : les deux arrivées se font face, sur la même ligne.
  if (f.dx === -t.dx && f.dy === -t.dy) {
    const n = f.dx !== 0 ? (t.x - f.x) * f.dx : (t.y - f.y) * f.dy;
    if (f.dx !== 0 ? f.y !== t.y : f.x !== t.x) return null;
    if (n < 2) return null;
    ligne(cases, f, f.dx, f.dy, n - 1);
    return { cases, coudes: [] };
  }
  // En L : les deux directions sont perpendiculaires ; le coude est au croisement des deux lignes.
  if (f.dx * t.dx + f.dy * t.dy !== 0) return null;
  const c = f.dx !== 0 ? { x: t.x, y: f.y } : { x: f.x, y: t.y };
  const a = f.dx !== 0 ? (c.x - f.x) * f.dx : (c.y - f.y) * f.dy;
  const b = t.dx !== 0 ? (c.x - t.x) * t.dx : (c.y - t.y) * t.dy;
  if (a < AU_LARGE_AVANT_LE_COUDE + 1 || b < AU_LARGE_AVANT_LE_COUDE + 1) return null;
  ligne(cases, f, f.dx, f.dy, a);
  const coude = cases.length - 1;
  ligne(cases, c, -t.dx, -t.dy, b - 1);
  return { cases, coudes: [coude] };
}

/**
 * Les chemins à deux coudes d'une arrivée à une autre (une liaison longue, `LONGUEUR_LONGUE`), du plus court au plus
 * long, `max` cases au plus : en Z quand les arrivées se font face sur deux lignes voisines (le tronçon du milieu, de
 * travers, au milieu du bras de mer d'abord), en U quand elles regardent du même côté (le tronçon du milieu au large des
 * deux). Chaque tronçon part au moins `AU_LARGE_AVANT_LE_COUDE` cases au large ; jamais en biais.
 */
export function* cheminsADeuxCoudes(f: Accroche, t: Accroche, max: number): Generator<Chemin> {
  const m = AU_LARGE_AVANT_LE_COUDE + 1;
  // La position le long de la direction de départ, et de travers.
  const le = (p: { x: number; y: number }) => p.x * f.dx + p.y * f.dy;
  const [px, py] = [-f.dy, f.dx];
  const travers = (t.x - f.x) * px + (t.y - f.y) * py;
  if (travers === 0) return;
  const [sx, sy] = travers > 0 ? [px, py] : [-px, -py];
  const large = Math.abs(travers);
  const chemin = (a: number, b: number): Chemin => {
    const cases: { x: number; y: number }[] = [];
    const c1 = ligne(cases, f, f.dx, f.dy, a);
    const i1 = cases.length - 1;
    const c2 = ligne(cases, c1, sx, sy, large);
    const i2 = cases.length - 1;
    ligne(cases, c2, -t.dx, -t.dy, b - 1);
    return { cases, coudes: [i1, i2] };
  };
  if (f.dx === -t.dx && f.dy === -t.dy) {
    // En Z : n cases d'une côte à l'autre le long du départ ; le tronçon du milieu à a cases du départ.
    const n = le(t) - le(f);
    if (n < 2 * m || n + large - 1 > max) return;
    const milieu = Math.round(n / 2);
    for (let d = 0; d <= n; d++)
      for (const a of d === 0 ? [milieu] : [milieu - d, milieu + d]) if (a >= m && n - a >= m) yield chemin(a, n - a);
    return;
  }
  if (f.dx === t.dx && f.dy === t.dy) {
    // En U : le tronçon du milieu au large des deux arrivées, de plus en plus loin.
    const debut = Math.max(le(f), le(t)) + m;
    for (let l = debut; ; l++) {
      const a = l - le(f);
      const b = l - le(t);
      if (a + b + large - 1 > max) return;
      yield chemin(a, b);
    }
  }
}

/** Une grille de cases sur le cadre de la région. */
class Grille {
  readonly w: number;
  readonly h: number;
  readonly x0: number;
  readonly y0: number;
  /** Ce qu'aucune liaison ne touche : la terre, les îlots, les écueils, les autres liaisons (et leur abord). */
  readonly dur: Uint8Array;
  /** Les lieux dont la terre est à moins de `ECART_DES_LIAISONS` cases : un bit par lieu (son rang dans la région). */
  readonly pres: Uint32Array;
  constructor(a: ArchipelagoId) {
    const c = cadreDe(a);
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
export interface PlansDeLaRegion {
  lieux: readonly IslandDef[];
  ecueils?: ReadonlySet<string>;
  /** Les arrivées choisies par lieu (la disposition) ; sans elles, le traceur choisit, une par côté. */
  arrivees?: ReadonlyMap<BiomeId, readonly { cote: Cote; pas: number }[]>;
}

/**
 * Trace toutes les liaisons d'une région (`BRIDGES`, sauf celles des lieux réunis, sur leur isthme), les liaisons du
 * point de départ d'abord, puis les raccourcis, dans l'ordre des données : chacune prend, parmi les arrivées encore
 * libres de ses deux bouts (une par côté d'un lieu, une liaison par arrivée ; au point de départ, chaque point d'attache
 * une fois), le chemin valable le plus court (droit avant un L, puis le premier dans l'ordre). `null` : la liaison ne
 * tient pas (une liaison à reposer, GD-9).
 */
export function tracerLaRegion(a: ArchipelagoId, plans: PlansDeLaRegion): Map<string, TraceDeLiaison | null> {
  const lieux = plans.lieux;
  const rang = new Map(lieux.map((d, i) => [d.id, i]));
  const g = new Grille(a);
  const emprises = new Map<BiomeId, PartDEmprise[]>(lieux.map((d) => [d.id, empriseDuLieu(d.id, d)]));
  // Ce qui est dur : la terre de chaque lieu, ses îlots et son quai (et leur abord), les écueils (et leur abord).
  for (const d of lieux) {
    for (const p of emprises.get(d.id)!) {
      if (p.genre === 'terre') {
        const bit = 1 << rang.get(d.id)!;
        g.rectangle(p, ECART_DES_LIAISONS - 1, (i) => (g.pres[i] |= bit));
        g.rectangle(p, 0, (i) => {
          const x = g.x0 + (i % g.w);
          const y = g.y0 + Math.floor(i / g.w);
          if (isLandDuMonde(d, x, y)) g.dur[i] = 1;
        });
      } else g.rectangle(p, ECART_DES_LIAISONS - 1, (i) => (g.dur[i] = 1));
    }
  }
  for (const k of plans.ecueils ?? []) {
    const [x, y] = k.split(',').map(Number);
    g.rectangle({ x0: x, y0: y, x1: x + 1, y1: y + 1 }, 1, (i) => (g.dur[i] = 1));
  }
  const depart = new Set(lieuxDuDepart(a));
  const parId = new Map(lieux.map((d) => [d.id, d]));
  // Les arrivées possibles de chaque lieu dans le monde ; celles prises, et les côtés pris (hors du point de départ).
  const possibles = new Map<BiomeId, Accroche[]>();
  for (const d of lieux) {
    const choisies = plans.arrivees?.get(d.id);
    const locales = arriveesPossibles(d).filter((l) => !choisies || choisies.some((c) => c.cote === l.cote && c.pas === l.pas));
    possibles.set(d.id, locales.map((l) => accrocheDansLeMonde(d, l)));
  }
  const prises = new Set<string>();
  const cotesPris = new Set<string>();
  const cle = (c: Accroche) => `${c.lieu}|${c.cote}|${c.pas}`;
  const libre = (c: Accroche) => !prises.has(cle(c)) && (depart.has(c.lieu) || !cotesPris.has(`${c.lieu}|${c.cote}`));
  const liaisons = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a && parId.has(b.from) && parId.has(b.to) && !liaisonEntreReunis(b));
  const ordre = [...liaisons.filter(liaisonDuDepart), ...liaisons.filter((b) => !liaisonDuDepart(b))];
  const out = new Map<string, TraceDeLiaison | null>();
  for (const b of ordre) {
    const bitA = 1 << rang.get(b.from)!;
    const bitB = 1 << rang.get(b.to)!;
    const max = longueurMax(b);
    let best: TraceDeLiaison | null = null;
    const deuxCoudes = max === LONGUEUR_LONGUE;
    for (const f of possibles.get(b.from)!) {
      if (!libre(f)) continue;
      for (const t of possibles.get(b.to)!) {
        if (!libre(t)) continue;
        const ch = cheminEntre(f, t);
        if (ch && ch.cases.length <= max && (!best || ch.cases.length < best.cases.length) && cheminLibre(g, ch, bitA, bitB)) {
          best = { id: b.id, cases: ch.cases, coudes: ch.coudes, depuis: f, vers: t };
          continue;
        }
        if (!deuxCoudes || ch) continue;
        // Une liaison longue qui ne passe ni droite ni en L : en Z ou en U, la première qui tient.
        for (const z of cheminsADeuxCoudes(f, t, best ? Math.min(max, best.cases.length - 1) : max))
          if (cheminLibre(g, z, bitA, bitB)) {
            best = { id: b.id, cases: z.cases, coudes: z.coudes, depuis: f, vers: t };
            break;
          }
      }
    }
    out.set(b.id, best);
    if (!best) continue;
    prises.add(cle(best.depuis));
    prises.add(cle(best.vers));
    cotesPris.add(`${best.depuis.lieu}|${best.depuis.cote}`);
    cotesPris.add(`${best.vers.lieu}|${best.vers.cote}`);
    // La liaison et son abord deviennent durs pour les suivantes.
    for (const c of best.cases) g.rectangle({ x0: c.x, y0: c.y, x1: c.x + 1, y1: c.y + 1 }, ECART_DES_LIAISONS - 1, (i) => (g.dur[i] = 1));
  }
  return out;
}

/**
 * Le chemin tient-il ? Dans le cadre, sur l'eau, loin des îlots, des écueils et des autres liaisons ; loin de la terre
 * des autres lieux ; près de la terre d'un de ses bouts seulement au départ de ce bout, avant le coude, et plus jamais
 * ensuite ; son coude au large des deux.
 */
function cheminLibre(g: Grille, ch: Chemin, bitA: number, bitB: number): boolean {
  const n = ch.cases.length;
  const idx: number[] = [];
  for (const c of ch.cases) {
    const i = g.i(c.x, c.y);
    if (i < 0 || g.dur[i]) return false;
    if (g.pres[i] & ~(bitA | bitB)) return false;
    idx.push(i);
  }
  const premier = ch.coudes.length ? ch.coudes[0] : n;
  const dernier = ch.coudes.length ? ch.coudes[ch.coudes.length - 1] : -1;
  // Le départ de chaque bout : un préfixe (depuis son arrivée) près de sa terre, avant le premier coude, puis plus jamais.
  let k = 0;
  while (k < n && g.pres[idx[k]] & bitA) k++;
  if (k > premier && ch.coudes.length) return false;
  for (let j = k; j < n; j++) if (g.pres[idx[j]] & bitA) return false;
  let m = n - 1;
  while (m >= 0 && g.pres[idx[m]] & bitB) m--;
  if (ch.coudes.length && m < dernier) return false;
  for (let j = m; j >= 0; j--) if (g.pres[idx[j]] & bitB) return false;
  return true;
}

/**
 * Une place est-elle possible pour le lieu `id` dans la disposition `lieux` (le lieu à sa nouvelle place) ? Son emprise
 * tient dans le cadre, à `ECART_ENTRE_LES_LIEUX` cases d'eau des autres ; sa liaison au point de départ se trace (pour le
 * lieu de LV2, sans liaison directe au point de départ, l'une de ses liaisons) ; et elle ne bloque aucune liaison qui se
 * traçait avant (`avant` : les tracés de la disposition d'avant le geste). Code pur : le geste « Aménager » le lira.
 */
export function placePossible(a: ArchipelagoId, lieux: readonly IslandDef[], id: BiomeId, avant?: ReadonlyMap<string, TraceDeLiaison | null>): boolean {
  if (ecartsTropPetits(a, lieux).some((e) => e.startsWith(`${id} `) || e.includes(` et ${id} `))) return false;
  const traces = tracerLaRegion(a, { lieux });
  const siennes = [...traces.keys()].map((k) => BRIDGES.find((b) => b.id === k)!).filter((b) => b.from === id || b.to === id);
  const auDepart = siennes.filter(liaisonDuDepart);
  if (auDepart.length ? auDepart.some((b) => !traces.get(b.id)) : siennes.length > 0 && !siennes.some((b) => traces.get(b.id))) return false;
  if (avant) for (const [k, t] of avant) if (t && !traces.get(k)) return false;
  return true;
}

// ---------- Les emprises ----------

/**
 * Les écarts trop petits d'une disposition : deux parts d'emprise de deux lieux qui ne sont pas réunis à moins de
 * `ECART_ENTRE_LES_LIEUX` cases d'eau, ou une part hors du cadre. Vide : la disposition tient.
 */
export function ecartsTropPetits(a: ArchipelagoId, lieux: readonly IslandDef[]): string[] {
  const out: string[] = [];
  const c = cadreDe(a);
  const parts = lieux.map((d) => empriseDuLieu(d.id, d));
  parts.forEach((ps, i) => {
    for (const p of ps) if (p.x0 < c.x0 || p.y0 < c.y0 || p.x1 > c.x1 || p.y1 > c.y1) out.push(`${p.lieu} (${p.genre}) hors du cadre`);
    for (let j = i + 1; j < parts.length; j++) {
      if (isthmusOf(lieux[i].id) === lieux[j].id) continue;
      for (const p of ps) for (const q of parts[j]) if (ecartEntre(p, q) < ECART_ENTRE_LES_LIEUX) out.push(`${p.lieu} (${p.genre}) et ${q.lieu} (${q.genre}) : ${ecartEntre(p, q)}`);
    }
  });
  return out;
}

/** Les lieux d'une région, dans l'ordre des données. */
export function lieuxDe(a: ArchipelagoId): BiomeId[] {
  return BIOMES.filter((b) => b.classe === a).map((b) => b.id);
}

/** La distance d'une case à une part d'emprise (pour les tests et le geste). */
export { distanceAuRectangle };

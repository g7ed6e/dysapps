// Les ouvrages entre les îles (ponts, rampes, bacs), leurs abords, et les chemins du bonhomme qui les empruntent.
import { type BiomeId, BLOC, BLOCKS, getBiome } from '../../biomes';
import { type BridgeDef, type BridgeKind, bridgesOf, LINKS_BEFORE_GD9, bridgeState, otherEnd } from '../archipelago';
import { coeurDe, CORE, inCoeurDOrigine, inCore, isLand, islandDef, type IslandDef, startingIsland, margesDuCoeur } from '../map';
import { groundLevelAt } from '../ground';
import { type Cell, type WalkGround, walkPath } from '../paths';
import type { VoxelCube } from '../cube';
import { TRUNK } from '../decor';
import { DOCK_DX, dockCells, dockOrigin, VEHICLE_DECK } from '../harbor';
import { avatarHome, cleDeCube, origineDe } from './base';
import { layoutCache } from '../placement';
import { placedLinksOfPlace, linkRoute, soleRoute } from '../linkGeometry';
import { linkBetweenJoined } from '../routing';
import { joinOf } from '../join';
import { archipelagoOfIsland } from '../map';

const STEP = '#8f8f8f';

/**
 * Les ports d'attache d'une île (étape J5) : là où chacune de ses liaisons posées la touche, la première case de l'ouvrage de
 * son côté, dans le repère de l'île. Une côte dessinée par île (R4b) les lit pour laisser l'ouvrage aborder.
 */
export function portsDAttache(id: BiomeId, links: readonly string[]): { ouvrage: string; local: { x: number; y: number; z: number } }[] {
  const o = origineDe(id);
  return placedLinksOfPlace(id, links).map((def) => {
    const path = bridgePath(def, links);
    const c = def.from === id ? path[0] : path[path.length - 1];
    return { ouvrage: def.id, local: { x: c.x - o.x, y: c.y - o.y, z: c.z - o.z } };
  });
}

/** Une case d'un ouvrage : sa place, son altitude, si elle monte, et son sens. */
export interface CaseDOuvrage {
  x: number;
  y: number;
  z: number;
  climbing: boolean;
  dx: number;
  dy: number;
  /** Le coude d'une liaison en L (GD-9) : un bac y pose un cube plein, où la corde tourne. */
  coude?: boolean;
}

/**
 * Le tracé d'une liaison, ses cases sur l'eau d'une arrivée à l'autre (GD-9) : celui que le jeu lui donne, droit ou en
 * L à un seul coude, les liaisons posées de la partie tracées dans leur ordre (`linkRoute`) ; une liaison posée
 * que le traceur ne refait pas garde son tracé d'origine (`traceDOrigine`) ; entre deux lieux réunis, un sentier sur leur
 * isthme. Une liaison qui ne tiendrait pas n'a pas de cases. Chaque case a son altitude (interpolée).
 */
export function bridgePath(def: BridgeDef, links: readonly string[]): CaseDOuvrage[] {
  return casesDeLOuvrage(def, links).map((c) => ({ x: c.x, y: c.y, z: c.z, climbing: c.climbing, dx: c.dx, dy: c.dy, ...(c.coude ? { coude: true } : {}) }));
}

/**
 * Le tracé d'origine d'une liaison d'avant GD-9, de bord de terre à bord de terre, sur la ligne qui joint les deux
 * cœurs : deux îles l'une devant l'autre, l'ouvrage part du côté droit du cœur, descend jusqu'au bord de l'île de
 * devant, fait un coude, puis y entre ; une liaison du port en contour passe par ses points de passage (`via`). Un
 * sentier suit la terre, de bord de cœur à bord de cœur.
 */
function traceDOrigine(def: BridgeDef, a: IslandDef, b: IslandDef, sentier: boolean): { x: number; y: number; troncon: number }[] {
  const vertical = Math.abs(b.core.y - a.core.y) >= Math.abs(b.core.x - a.core.x);
  const anchor = (d: IslandDef) => {
    const c = coeurDe(d);
    return { x: vertical ? c.x1 - 1 : (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 };
  };
  const ca = anchor(a);
  const cb = anchor(b);
  const points = [ca];
  if (def.via) points.push(...def.via);
  else if (vertical && ca.x !== cb.x) {
    const front = a.core.y < b.core.y ? a : b;
    const jog = coeurDe(front).y1 + front.ext.back + 1;
    points.push({ x: ca.x, y: jog }, { x: cb.x, y: jog });
  }
  points.push(cb);
  const cells: { x: number; y: number; troncon: number }[] = [];
  const seen = new Set<string>();
  for (let s = 0; s + 1 < points.length; s++) {
    const p = points[s];
    const q = points[s + 1];
    const steps = Math.max(1, Math.abs(q.x - p.x), Math.abs(q.y - p.y));
    for (let i = 0; i <= steps; i++) {
      const x = Math.floor(p.x + ((q.x - p.x) * i) / steps);
      const y = Math.floor(p.y + ((q.y - p.y) * i) / steps);
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cells.push({ x, y, troncon: s });
    }
  }
  let first = cells.findIndex((c) => (sentier ? !inCore(a, c.x, c.y) : !isLand(a, c.x, c.y)));
  let last = cells.length - 1;
  while (last > 0 && (sentier ? inCore(b, cells[last].x, cells[last].y) : isLand(b, cells[last].x, cells[last].y))) last--;
  if (first < 0 || first > last) {
    first = 0;
    last = cells.length - 1;
  }
  return cells.slice(first, last + 1);
}

/**
 * Les cases d'un ouvrage (`bridgePath`), chacune avec son tronçon (avant ou après son coude, 0 depuis l'île `from`) et
 * son coude marqué. La flèche de la Carte reste sur le premier tronçon depuis l'île de départ (`placesDeLaFleche`).
 * `lieu` : `startingIsland` pour le sentier d'un isthme sur la carte de départ (`amorcesDuDessin`).
 */
export function casesDeLOuvrage(
  def: BridgeDef,
  links: readonly string[],
  lieu: (id: BiomeId) => IslandDef = islandDef,
): { x: number; y: number; z: number; climbing: boolean; dx: number; dy: number; troncon: number; coude?: boolean }[] {
  const a = lieu(def.from);
  const b = lieu(def.to);
  let span: { x: number; y: number; troncon: number; coude?: boolean }[];
  const sentier = linkBetweenJoined(def);
  if (sentier) span = traceDOrigine(def, a, b, true);
  else {
    const estPosee = def.cost === 0 || links.includes(def.id);
    // Une liaison posée que le traceur ne refait pas (une sauvegarde d'avant GD-9) : le tracé qu'elle prendrait seule
    // sur la disposition du moment, et, à défaut, son tracé d'origine.
    const trace = linkRoute(def, links) ?? (estPosee ? soleRoute(def) : null);
    if (trace) span = trace.cases.map((c, i) => ({ x: c.x, y: c.y, troncon: trace.coude >= 0 && i > trace.coude ? 1 : 0, ...(i === trace.coude ? { coude: true } : {}) }));
    else if (estPosee) span = traceDOrigine(def, a, b, false);
    else return [];
  }
  let prevZ = a.altitude;
  return span.map((c, i) => {
    const z = sentier ? groundLevelAt(c.x, c.y) : Math.round(a.altitude + ((b.altitude - a.altitude) * (i + 1)) / (span.length + 1));
    const climbing = z !== prevZ;
    prevZ = z;
    const next = span[Math.min(i + 1, span.length - 1)];
    const prev = span[Math.max(i - 1, 0)];
    return { x: c.x, y: c.y, z, climbing, dx: Math.sign(next.x - prev.x), dy: Math.sign(next.y - prev.y), troncon: c.troncon, ...(c.coude ? { coude: true } : {}) };
  });
}

/** Les sentiers des isthmes de la carte de départ, mémorisés : elle ne change pas. */
const tracesDeDepart = new Map<string, readonly Readonly<{ x: number; y: number; dx: number; dy: number }>[]>();

/**
 * Les amorces des liaisons d'un lieu, figées avec son dessin (GD-9) : les cases du sentier de son isthme, s'il est
 * réuni, tracé sur la carte de départ, dans le repère du lieu (relatives à l'origine de son cœur, avant rotation). Le
 * décor qui laisse libres les pierres de gué et le sol libre de la créature les lisent. Les autres liaisons ne changent
 * rien au dessin : le jeu les fait aborder là où la côte est libre (`possibleLandings`, ../routing.ts).
 */
export function amorcesDuDessin(id: BiomeId): { ouvrage: BridgeDef; depart: boolean; cases: readonly Readonly<{ x: number; y: number; dx: number; dy: number }>[] }[] {
  const o = startingIsland(id).core;
  return bridgesOf(id)
    .filter(linkBetweenJoined)
    .map((b) => {
      let cases = tracesDeDepart.get(b.id);
      if (!cases) {
        cases = casesDeLOuvrage(b, [], startingIsland).map((c) => ({ x: c.x, y: c.y, dx: c.dx, dy: c.dy }));
        tracesDeDepart.set(b.id, cases);
      }
      return { ouvrage: b, depart: b.from === id, cases: cases.map((c) => ({ x: c.x - o.x, y: c.y - o.y, dx: c.dx, dy: c.dy })) };
    });
}

/** Les tracés de départ des liaisons vers les îles d'histoire-géographie, mémorisés : la carte de départ ne change pas. */
const tracesVersLesIlesVenues = new Map<string, readonly Readonly<{ x: number; y: number }>[]>();

/**
 * Les abords des liaisons d'un lieu vers les îles d'histoire-géographie (HG-2, HG-3), venues après GD-9, tracées sur la
 * carte de départ, dans le repère du lieu : le modelé dessiné d'Archipéo, en pause, les garde bas lui aussi (la liaison du
 * Relais des voyageurs au Bourg des chroniques longe la crête du Relais, celle de l'Observatoire des textes au Kiosque
 * des témoins ses gradins ; drawnModel/3e.ts, 5e.ts). Rien du monde de Blocland ne les lit.
 */
export function amorcesVersLesIlesVenues(id: BiomeId): { x: number; y: number }[] {
  const o = startingIsland(id).core;
  return bridgesOf(id)
    .filter((b) => getBiome(otherEnd(b, id))?.subject === 'history-geography')
    .flatMap((b) => {
      let cases = tracesVersLesIlesVenues.get(b.id);
      if (!cases) {
        cases = casesDeLOuvrage(b, [], startingIsland).map((c) => ({ x: c.x, y: c.y }));
        tracesVersLesIlesVenues.set(b.id, cases);
      }
      return cases.map((c) => ({ x: c.x - o.x, y: c.y - o.y }));
    });
}

/**
 * Les abords des liaisons d'avant GD-9 d'un lieu (et des liaisons du port qui le longeaient, avec `etoile`), tracées à
 * la main sur la carte de départ, dans le repère du lieu : le modelé dessiné d'Archipéo, en pause, les garde bas
 * (drawnModel/3e.ts, 5e.ts). Rien du monde de Blocland ne les lit.
 */
export function amorcesDOrigine(id: BiomeId, etoile = false): { x: number; y: number }[] {
  const o = startingIsland(id).core;
  return LINKS_BEFORE_GD9.filter((b) => b.from === id || b.to === id || (etoile && b.etoile)).flatMap((b) =>
    traceDOrigine(b, startingIsland(b.from), startingIsland(b.to), b.kind === 'sentier').map((c) => ({ x: c.x - o.x, y: c.y - o.y, a: archipelagoOfIsland(b.from) })),
  ).filter((c) => c.a === archipelagoOfIsland(id)).map(({ x, y }) => ({ x, y }));
}

/** Une case d'une liaison, et le tronçon de son tracé où elle est (`casesDeLOuvrage`). */
export interface CaseDeLiaison extends Cell {
  troncon: number;
}

/**
 * L'indice de la dernière case du premier tronçon d'une liaison (`cases`, depuis l'île de départ), avant son premier
 * coude. Un décalage d'une seule case entre deux tronçons de même sens (le pas de côté d'un pont presque droit, quand ses
 * deux ancrages ne sont pas alignés) n'est pas un coude : le tracé y continue tout droit.
 */
export function premierCoude(cases: readonly CaseDeLiaison[]): number {
  const fin = (debut: number) => {
    let i = debut;
    while (i + 1 < cases.length && cases[i + 1].troncon === cases[debut].troncon) i++;
    return i;
  };
  const sens = (a: number, b: number) => `${Math.sign(cases[b].x - cases[a].x)},${Math.sign(cases[b].y - cases[a].y)}`;
  let coude = fin(0);
  if (coude === 0) return 0;
  const premier = sens(0, coude);
  // Un pas de côté d'une case, puis un tronçon dans le même sens que le premier : le tracé continue.
  while (coude + 2 < cases.length && fin(coude + 1) === coude + 1) {
    const suite = fin(coude + 2);
    if (suite === coude + 2 || sens(coude + 2, suite) !== premier) break;
    coude = suite;
  }
  return coude;
}

/** La flèche d'un ouvrage se pose à tant de cases de la première case d'eau, vers l'arrivée. */
const FLECHE_APRES_LA_RIVE = 3;

/**
 * Les places de la flèche d'un ouvrage sur sa liaison (`cases`, de l'île de départ à l'île d'arrivée), de la voulue à
 * la dernière permise (décision du directeur artistique, GD-7, PR 2) : la première case d'eau du tracé, puis
 * `FLECHE_APRES_LA_RIVE` cases plus loin ; jamais au-delà du milieu de la liaison ni hors du premier tronçon (le premier
 * coude d'un ouvrage en contour) ; jamais sur une case de terre (`terre`, n'importe quelle île). Les suivantes : celles où
 * elle glisse vers l'arrivée quand une étiquette occupe sa place, aux mêmes limites. Sans aucune case d'eau (un sentier,
 * posé sur l'isthme), les cases du tracé comptent toutes. Vide pour une liaison sans case.
 */
export function placesDeLaFleche(cases: readonly CaseDeLiaison[], terre: (x: number, y: number) => boolean): Cell[] {
  if (!cases.length) return [];
  const eau = cases.some((c) => !terre(c.x, c.y)) ? (c: Cell) => !terre(c.x, c.y) : () => true;
  const milieu = Math.floor((cases.length - 1) / 2);
  const limite = Math.min(milieu, premierCoude(cases));
  const rive = cases.findIndex(eau);
  const cell = (c: CaseDeLiaison): Cell => ({ x: c.x, y: c.y, z: c.z });
  // La rive au-delà de la limite (une liaison qui longe une terre) : la flèche se pose sur la première case d'eau.
  if (rive > limite) return [cell(cases[rive])];
  const places = cases.slice(Math.min(rive + FLECHE_APRES_LA_RIVE, limite), limite + 1).filter(eau);
  return (places.length ? places : [cases[rive]]).map(cell);
}

/**
 * Au-delà de ce nombre de cases, un ouvrage est une longue traversée (GD-7) : un bac n'a plus qu'un poteau toutes les
 * quatre cases (`bridge`), et la caméra ne suit plus le bonhomme qui le prend, elle cadre son départ et son arrivée
 * (`cadreDeTraversee`).
 */
export const BAC_LONG = 36;

/**
 * Un ouvrage entre deux îles, selon sa nature : pont de planches (marches quand il monte), bac (poteaux et radeau
 * au fil de l'eau), escalier taillé dans la pierre, tunnel (galerie voûtée, lanternes), col (escalier à garde-fou).
 * Fantôme tant qu'il n'est pas construit.
 */
export function bridge(def: BridgeDef, kind: BridgeKind, path: readonly CaseDOuvrage[], cubes: VoxelCube[], ghost: boolean, occupied: Set<string>): void {
  const onPath = new Set(path.map((c) => `${c.x},${c.y}`));
  // Un cube d'ouvrage ne remplace jamais un cube du terrain (un buisson sur l'isthme, par exemple).
  const add = (x: number, y: number, z: number, color: string, texture: string, top?: string) => {
    const key = `${x},${y},${z}`;
    if (occupied.has(key)) return;
    occupied.add(key);
    cubes.push({ x, y, z, color, top, texture, tag: def.to, bridge: def.id, ghost: ghost || undefined });
  };
  // À côté du passage (pilier, garde-fou, poteau) : jamais sur une case du tracé, où le bonhomme marche.
  const beside = (x: number, y: number, z: number, color: string, texture: string) => {
    if (onPath.has(`${x},${y}`)) return;
    add(x, y, z, color, texture);
  };
  const n = path.length;
  path.forEach((c, i) => {
    // Perpendiculaire au tracé (pour les arches et le garde-fou).
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    switch (kind) {
      case 'sentier':
        // Des pierres de gué une case sur deux, posées sur le sol de l'isthme.
        if (i % 2 === 0) add(c.x, c.y, c.z + 1, BLOCKS[BLOC.galet].side, 'galet');
        break;
      case 'pont':
        add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS[BLOC.escalier].top : undefined);
        break;
      case 'bac': {
        // Un radeau de trois planches au milieu, des poteaux de bois qui tiennent la corde de halage : toutes les trois
        // cases, toutes les quatre sur un long bac (GD-7, `BAC_LONG`).
        const mid = Math.abs(i - (n - 1) / 2) <= 1;
        // Au coude d'une liaison en L (GD-9), un cube plein de planches : la corde y tourne.
        if (c.coude) add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, 'planches');
        else if (mid) {
          add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, 'planches');
          if (i === Math.floor((n - 1) / 2)) add(c.x + px, c.y + py, c.z, BLOCKS[BLOC.bois].side, 'planches');
        } else if (i % (n > BAC_LONG ? 4 : 3) === 0 || i === n - 1) add(c.x, c.y, c.z, TRUNK, 'tronc');
        break;
      }
      case 'escalier':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        break;
      case 'col':
        add(c.x, c.y, c.z, STEP, c.climbing ? 'marche' : 'pierre');
        if (i % 2 === 0) beside(c.x + px, c.y + py, c.z + 1, BLOCKS[BLOC.barriere].side, 'barriere');
        break;
      case 'tunnel': {
        add(c.x, c.y, c.z, BLOCKS[BLOC.bois].side, c.climbing ? 'escalier' : 'planches', c.climbing ? BLOCKS[BLOC.escalier].top : undefined);
        // Une arche de pierre toutes les trois cases, une lanterne au sommet d'une arche sur deux.
        if (i % 3 === 1 && i < n - 1) {
          // Assez haute pour que le bonhomme (deux blocs) passe dessous : piliers de trois, clé de voûte au quatrième.
          for (const side of [-1, 1]) for (let up = 1; up <= 3; up++) beside(c.x + side * px, c.y + side * py, c.z + up, BLOCKS[BLOC.pierre].side, 'pierre');
          const lit = ((i - 1) / 3) % 2 === 0;
          add(c.x, c.y, c.z + 4, lit ? BLOCKS[BLOC.lanterne].side : BLOCKS[BLOC.pierre].side, lit ? 'lanterne' : 'pierre');
        }
        break;
      }
    }
  });
  // Une lanterne sur un poteau à chaque bout, à côté du passage (le bonhomme ne la traverse pas) : la nuit, les
  // chemins se devinent de loin.
  for (const c of [path[0], path[n - 1]]) {
    if (!c) continue;
    const px = c.dy !== 0 ? 1 : 0;
    const py = c.dy !== 0 ? 0 : 1;
    const base = kind === 'sentier' ? c.z + 1 : c.z;
    beside(c.x + px, c.y + py, base, TRUNK, 'tronc');
    beside(c.x + px, c.y + py, base + 1, BLOCKS[BLOC.lanterne].side, 'lanterne');
  }
}

const sentiersCache = new Map<BiomeId, Set<number>>();

/**
 * Les cases des sentiers (pierres de gué) d'un lieu et leurs voisines (x, y du lieu posé, avant rotation) : le décor des
 * isthmes les laisse libres (feuillages compris). Figées avec le dessin du lieu (`amorcesDuDessin`).
 */
export function nearSentier(def: IslandDef, x: number, y: number): boolean {
  let cases = sentiersCache.get(def.id);
  if (!cases) {
    cases = new Set();
    for (const a of amorcesDuDessin(def.id)) for (const c of a.cases) cases.add(cleDeCube(c.x, c.y));
    sentiersCache.set(def.id, cases);
  }
  if (!cases.size) return false;
  const lx = x - def.core.x;
  const ly = y - def.core.y;
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (cases.has(cleDeCube(lx + dx, ly + dy))) return true;
  return false;
}

/**
 * Les abords des ouvrages d'une île dans les marges de son cœur (`margesDuCoeur`) : de l'amorce de chaque ouvrage au
 * cœur d'origine, la case du passage et ses voisines. Le décor des marges les laisse libres : le bonhomme y va tout
 * droit du cœur à l'ouvrage. Vide pour une île sans marges. Mémorisé (les ouvrages et les marges ne bougent pas).
 */
const abordsCache = layoutCache<BiomeId, ReadonlySet<string>>();

export function abordsDansLesMarges(def: IslandDef): ReadonlySet<string> {
  const connus = abordsCache.get(def.id);
  if (connus) return connus;
  const out = new Set<string>();
  abordsCache.set(def.id, out);
  if (!margesDuCoeur(def).length) return out;
  for (const { cases, depart } of amorcesDuDessin(def.id)) {
    if (!cases.length) continue;
    const fin = depart ? cases[0] : cases[cases.length - 1];
    const bout = { ...fin, x: def.core.x + fin.x, y: def.core.y + fin.y };
    // Vers l'intérieur de l'île : à rebours du tracé à son départ, dans son sens à son arrivée.
    const [sx, sy] = depart ? [-bout.dx, -bout.dy] : [bout.dx, bout.dy];
    if (!sx && !sy) continue;
    for (let k = 0, x = bout.x, y = bout.y; k <= CORE && !inCoeurDOrigine(def, x, y); k++, x += sx, y += sy)
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(`${x + dx},${y + dy}`);
  }
  return out;
}

/**
 * Le pied des ouvrages d'une île, partout sur l'île (pas seulement dans les marges) : le bout de chaque ouvrage et ses
 * huit voisines. Le décor haut de la côte (arbre, sapin, rocher…) n'y pose rien, feuillage compris : le bonhomme
 * descend toujours d'un ouvrage sur le sol libre (un sapin bouchait la sortie du pont de la Plaine des nombres, et le
 * bonhomme passait au travers, 04/10/2026). En clés numériques (`cleDeCube`), mémorisé (les ouvrages ne bougent pas).
 */
const piedsCache = layoutCache<BiomeId, ReadonlySet<number>>();

export function piedsDesOuvrages(def: IslandDef): ReadonlySet<number> {
  const connus = piedsCache.get(def.id);
  if (connus) return connus;
  const out = new Set<number>();
  piedsCache.set(def.id, out);
  for (const { cases, depart } of amorcesDuDessin(def.id)) {
    if (!cases.length) continue;
    const fin = depart ? cases[0] : cases[cases.length - 1];
    const bout = { x: def.core.x + fin.x, y: def.core.y + fin.y };
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) out.add(cleDeCube(bout.x + dx, bout.y + dy));
  }
  return out;
}

/** Les cases où marche le bonhomme sur un ouvrage, dans le sens de `from` à l'autre bout (exportée pour les tests). */
export function tablier(def: BridgeDef, from: BiomeId, links: readonly string[]): { x: number; y: number; z: number }[] {
  // Sur un ouvrage on marche sur le tablier (z + 1) ; sur un sentier, de pierre de gué en pierre de gué (la pierre est
  // posée sur le sol en z + 1, on marche dessus : z + 2).
  const deck =
    linkBetweenJoined(def)
      ? bridgePath(def, links)
          .map((c, i) => ({ x: c.x, y: c.y, z: c.z + 2, stone: i % 2 === 0 }))
          .filter((c) => c.stone)
          .map(({ x, y, z }) => ({ x, y, z }))
      : bridgePath(def, links).map((c) => ({ x: c.x, y: c.y, z: c.z + 1 }));
  if (def.from !== from) deck.reverse();
  return deck;
}

/**
 * L'itinéraire du bonhomme d'une île à une autre, en marchant sur les ouvrages construits (le plus court chemin en
 * cases, GD-7 : un long bac du port ne sert que s'il raccourcit vraiment), ou `null` s'il n'y en a pas. Une suite de
 * points (x, y, z du sol sous ses pieds). Une île traversée n'est pas un détour par sa place : il va d'un ouvrage au
 * suivant. Avec la grille de marche (`ground`), il suit le sol et contourne arbres, bornes, maisons et créatures ; sans
 * elle, il va en ligne droite. Il s'arrête à sa place sur l'île d'arrivée, ou en `end` (la case du sol qu'on a touchée) ;
 * il part de sa place, ou de `start`.
 */
export function avatarRoute(
  from: BiomeId,
  to: BiomeId,
  bridges: string[],
  ground?: WalkGround,
  /**
   * `end` : là où il s'arrête sur l'île d'arrivée (la case touchée), plutôt qu'à sa place ; `start` : là d'où il part sur
   * l'île de départ (là où l'élève l'a envoyé), plutôt que de sa place.
   */
  { end, start }: { end?: { x: number; y: number; z: number }; start?: { x: number; y: number; z: number } } = {},
): { x: number; y: number; z: number }[] | null {
  if (from === to) return [end ?? avatarHome(from)];
  const depart = start ?? avatarHome(from);
  const arrivee = end ?? avatarHome(to);
  // À peu près le plus court chemin en cases (Dijkstra sur les îles) : sur une île, à vol d'oiseau du bout d'un ouvrage
  // au début du suivant (la marche réelle contourne parfois une borne ou un arbre) ; sur un ouvrage, sa longueur. Une
  // île est atteinte au bout d'un ouvrage : c'est de là qu'on repart.
  type Etape = { cout: number; at: { x: number; y: number; z: number }; via: BridgeDef | null; deck: { x: number; y: number; z: number }[] };
  const best = new Map<BiomeId, Etape>([[from, { cout: 0, at: depart, via: null, deck: [] }]]);
  const done = new Set<BiomeId>();
  for (;;) {
    let here: BiomeId | null = null;
    let e: Etape | null = null;
    for (const [id, etape] of best)
      if (!done.has(id) && (e === null || etape.cout < e.cout)) {
        here = id;
        e = etape;
      }
    if (here === null || e === null || here === to) break;
    done.add(here);
    for (const b of bridgesOf(here)) {
      if (bridgeState(b, bridges) !== 'built') continue;
      const there = otherEnd(b, here);
      if (done.has(there)) continue;
      const deck = tablier(b, here, bridges);
      if (!deck.length) continue;
      const bout = deck[deck.length - 1];
      // Sur l'île d'arrivée, le pas jusqu'à sa place (ou la case touchée) compte : deux ouvrages n'y abordent pas au même endroit.
      const fin = there === to ? Math.hypot(arrivee.x - bout.x, arrivee.y - bout.y) : 0;
      const cout = e.cout + Math.hypot(deck[0].x - e.at.x, deck[0].y - e.at.y) + routeLengths(deck)[deck.length - 1] + fin;
      const connu = best.get(there);
      if (!connu || cout < connu.cout) best.set(there, { cout, at: deck[deck.length - 1], via: b, deck });
    }
    // Deux lieux réunis (GD-9, point 10) : on passe sur la construction qui les réunit, par son milieu.
    const j = joinOf(here);
    if (j) {
      const there = j.pair[0] === here ? j.pair[1] : j.pair[0];
      if (!done.has(there) && j.shape.deck.length) {
        const deck = j.pair[0] === here ? [...j.shape.deck] : [...j.shape.deck].reverse();
        const bout = deck[deck.length - 1];
        const fin = there === to ? Math.hypot(arrivee.x - bout.x, arrivee.y - bout.y) : 0;
        const cout = e.cout + Math.hypot(deck[0].x - e.at.x, deck[0].y - e.at.y) + routeLengths(deck)[deck.length - 1] + fin;
        const connu = best.get(there);
        const via: BridgeDef = { id: `${j.plan.id}`, from: j.pair[0], to: j.pair[1], cost: 0 };
        if (!connu || cout < connu.cout) best.set(there, { cout, at: bout, via, deck });
      }
    }
  }
  if (!best.has(to)) return null;
  const hops: { x: number; y: number; z: number }[][] = [];
  for (let at = to, e = best.get(at); e?.via; e = best.get(at)) {
    hops.unshift(e.deck);
    at = otherEnd(e.via, at);
  }
  const route: { x: number; y: number; z: number }[] = [depart];
  // Sur une île : de là où il est jusqu'au point suivant, à pied (ou tout droit, sans grille).
  const walkTo = (next: { x: number; y: number; z: number }) => {
    const here = route[route.length - 1];
    const path = ground ? walkPath(ground, here, next) : null;
    route.push(...(path ? path.slice(1) : [next]));
  };
  for (const deck of hops) {
    walkTo(deck[0]);
    route.push(...deck.slice(1));
  }
  walkTo(arrivee);
  return route;
}

/**
 * Le chemin du bonhomme de son île jusqu'au pont du Bloc-Navire : le long de la rangée de devant (sous les bornes),
 * puis la jetée planche par planche, puis le bastingage et le pont. À rebours, c'est le débarquement.
 */
export function boardingRoute(port: BiomeId): { x: number; y: number; z: number }[] {
  const def = islandDef(port);
  const home = avatarHome(port);
  const o = dockOrigin(port);
  const top = def.altitude + 1;
  const route = [home, { x: def.core.x + 1, y: def.core.y, z: top }, { x: def.core.x + DOCK_DX, y: def.core.y, z: top }];
  for (const c of dockCells(port)) {
    route.push({ x: c.x, y: c.y, z: c.z + 1 });
    if (c.y === o.y + VEHICLE_DECK.y) break;
  }
  // Le bastingage (une case au-dessus du plancher), puis le pont.
  route.push({ x: o.x, y: o.y + VEHICLE_DECK.y, z: o.z + 2 }, { x: o.x + VEHICLE_DECK.x, y: o.y + VEHICLE_DECK.y, z: o.z + 1 });
  return route;
}

/** Distance à plat parcourue depuis le départ, à chaque point d'un itinéraire (la dernière est sa longueur). */
export function routeLengths(route: { x: number; y: number }[]): number[] {
  const cum = [0];
  for (let i = 1; i < route.length; i++) cum.push(cum[i - 1] + Math.hypot(route[i].x - route[i - 1].x, route[i].y - route[i - 1].y));
  return cum;
}

/**
 * Le point d'un itinéraire à une distance donnée du départ : on avance au même pas quelle que soit la longueur des
 * segments (une case de pont, une pierre de gué sur deux, ou toute une île d'un coup).
 */
export function routeAt(route: { x: number; y: number; z: number }[], cum: number[], d: number): { x: number; y: number; z: number } {
  const last = route.length - 1;
  if (last <= 0 || d >= cum[last]) return { ...route[last] };
  let i = 0;
  while (i < last - 1 && cum[i + 1] <= d) i++;
  const span = cum[i + 1] - cum[i];
  const f = span > 0 ? Math.max(0, d - cum[i]) / span : 1;
  const a = route[i];
  const b = route[i + 1];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f };
}

// La simulation du monde, commune aux vues : la marche du bonhomme, la promenade des créatures, le temps du
// voyage, les touches du clavier et ce que fait un toucher sur le sol. Code pur : les vues ne font que dessiner ce que
// ces fonctions calculent, à chaque image. Les temps sont en millisecondes (horloge de la page : `performance.now()`).
import type { BiomeId } from '../biomes';
import type { PlaceId, VoxelCube } from './cube';
import { islandsOf, type ArchipelagoId } from './archipelago';
import { BAC_LONG, type CadreDeCases, CREATURE_STEPS, boardingRoute, cadreDeTraversee, routeAt, routeLengths } from './terrain';
import { WALK_SPEED, dureeDeMarche, grilleDe } from './grid';
import { legTiming, type LegTiming, type VoyageLeg } from './voyage';
import type { Bonhomme, Cell, CreaturePlacement } from './view';

/** Accélère au début, ralentit à la fin. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// ---- Le bonhomme

// La vitesse du bonhomme et la durée d'un trajet viennent de la disposition en grille (./grid.ts).
export { WALK_SPEED };

/** Un trajet du bonhomme : l'itinéraire, ses distances cumulées (calculées une fois), son départ et sa durée. */
export interface Walk {
  route: Cell[];
  cum: number[];
  start: number;
  duration: number;
  /** Sur l'île où il est, vers une case touchée : la caméra ne le suit pas. */
  flanerie?: boolean;
  /** Le but vient d'un toucher sur le sol : un rond le montre jusqu'à l'arrivée. */
  vise?: boolean;
  /**
   * Une longue traversée (GD-7, `cadreDeTraversee`) : le cadre fixe de la caméra, du départ à l'arrivée ; elle ne suit
   * pas le bonhomme.
   */
  cadre?: CadreDeCases;
}

export function startWalk(route: Cell[], start: number, duration: number): Walk {
  return { route, cum: routeLengths(route), start, duration: Math.max(1, duration) };
}

/**
 * Le trajet demandé par la vue (`avatar`) : un seul point, il se tient là ; plusieurs, il marche. Six cases par
 * seconde, quelle que soit la longueur ; le premier placement (`seq` 0) est immédiat. Dans l'archipel `archipel`, un
 * trajet qui prend une longue traversée reçoit le cadre fixe de la caméra (`cadre`).
 */
export function avatarWalk(avatar: Bonhomme<Cell>, now: number, archipel?: ArchipelagoId): Walk | null {
  if (!avatar.route.length) return null;
  const route = avatar.route.length < 2 ? [avatar.route[0], avatar.route[0]] : avatar.route;
  const walk = startWalk(route, now, avatar.seq === 0 ? 0 : walkDuration(route));
  if (avatar.flanerie) walk.flanerie = true;
  if (avatar.vise) walk.vise = true;
  const cadre = archipel ? cadreDuTrajet(avatar, archipel) : null;
  if (cadre) walk.cadre = cadre;
  return walk;
}

/** Le cadre fixe d'un trajet qui prend une longue traversée (hors flânerie et premier placement), sinon `null`. */
function cadreDuTrajet(avatar: Bonhomme<Cell>, archipel: ArchipelagoId): CadreDeCases | null {
  const { route } = avatar;
  return avatar.seq !== 0 && !avatar.flanerie && route.length > BAC_LONG ? cadreDeTraversee(archipel, route) : null;
}

/** Le bonhomme est encore en route. */
export function enRoute(walk: Walk | null, now: number): walk is Walk {
  return walk !== null && now - walk.start < walk.duration;
}

/** Le temps d'un trajet du bonhomme : six cases par seconde, quelle que soit sa longueur. */
export function walkDuration(route: Cell[]): number {
  return dureeDeMarche(route);
}

export interface WalkPose extends Cell {
  /** Encore en route. */
  moving: boolean;
  /** Là où il regarde (un point un peu plus loin sur l'itinéraire), ou `null` s'il ne bouge pas assez pour le dire. */
  facing: { dx: number; dy: number } | null;
}

/** Où en est le bonhomme sur son trajet : au prorata de la distance (même pas sur une île que sur un pont). */
export function walkPose(walk: Walk, now: number, reduceMotion = false): WalkPose {
  const { route, cum, start, duration } = walk;
  const k = reduceMotion ? 1 : Math.min(1, (now - start) / duration);
  const d = k * cum[cum.length - 1];
  const at = routeAt(route, cum, d);
  // Un point un peu plus loin : les tracés en escalier alternent pas droits et pas en diagonale, on ne veut pas qu'il
  // se tortille à chaque case.
  const ahead = routeAt(route, cum, d + 1.5);
  const dx = ahead.x - at.x;
  const dy = ahead.y - at.y;
  return { ...at, moving: k < 1, facing: Math.hypot(dx, dy) > 0.05 ? { dx, dy } : null };
}

/**
 * Un toucher dans le vide pendant un trajet fait arriver le bonhomme tout de suite ; vrai s'il était en route. (Un
 * toucher sur le sol change son but : la page lui donne un nouveau trajet.)
 */
export function finishWalk(walk: Walk | null, now: number): boolean {
  if (!enRoute(walk, now)) return false;
  walk.start = now - walk.duration;
  return true;
}

// ---- Le voyage du Bloc-Navire

/** Le voyage en cours : son temps (départ ou arrivée), son début, où l'on en est. */
export interface VoyageRun {
  leg: VoyageLeg;
  stage: 1 | 2 | 3;
  timing: LegTiming;
  start: number;
  ended: boolean;
  disembarked: boolean;
  /** Dernière écume semée à la poupe (ms). */
  lastFoam: number;
}

export function startVoyage(voyage: { leg: VoyageLeg; stage: 1 | 2 | 3; back: boolean }, now: number): VoyageRun {
  return { leg: voyage.leg, stage: voyage.stage, timing: legTiming(voyage.leg, voyage.back), start: now, ended: false, disembarked: false, lastFoam: 0 };
}

/** La marche qui ouvre le départ : du bonhomme jusqu'au pont du navire. */
export function boardingWalk(port: BiomeId, run: VoyageRun, now: number): Walk | null {
  return run.leg === 'depart' ? startWalk(boardingRoute(port), now, run.timing.walk) : null;
}

export interface VoyageFrame {
  /** Position du navire sur sa trajectoire (`vehiclePath`) : 0 à quai, 1 au loin. */
  k: number;
  /** Le bonhomme est à bord (on le dessine sur le pont). */
  aboard: boolean;
  /** Le navire est en route (ni à quai, ni au loin). */
  underway: boolean;
  /** Avance du voyage, de 0 à 1, dans le sens de la marche (pour le cadrage). */
  progress: number;
  /** Le navire vient d'accoster : le bonhomme débarque maintenant (une seule fois). */
  disembark: Walk | null;
  /** Le temps du voyage vient de s'achever (une seule fois). */
  end: boolean;
}

/** Où en est le voyage ; retient le débarquement et la fin, pour ne les annoncer qu'une fois. */
export function voyageFrame(run: VoyageRun, port: BiomeId, now: number): VoyageFrame {
  const elapsed = now - run.start;
  const { walk: walkMs, sail: sailMs } = run.timing;
  let k: number;
  let disembark: Walk | null = null;
  if (run.leg === 'depart') k = Math.max(0, Math.min(1, (elapsed - walkMs) / sailMs));
  else {
    k = 1 - Math.max(0, Math.min(1, elapsed / sailMs));
    // Accosté : le bonhomme débarque (le chemin d'embarquement à rebours).
    if (elapsed >= sailMs && !run.disembarked) {
      run.disembarked = true;
      disembark = startWalk([...boardingRoute(port)].reverse(), now, walkMs);
    }
  }
  const aboard = run.leg === 'depart' ? elapsed >= walkMs : !run.disembarked;
  let end = false;
  if (elapsed >= walkMs + sailMs && !run.ended) {
    run.ended = true;
    end = true;
  }
  return { k, aboard, underway: k > 0 && k < 1, progress: run.leg === 'depart' ? k : 1 - k, disembark, end };
}

// ---- Les créatures

/** Une créature qui se promène : un pas de temps en temps autour de sa place ; un Gardien ne bouge pas. */
export interface Stroll {
  id: BiomeId;
  kind: 'creature' | 'guardian';
  still: boolean;
  steps: [number, number][];
  origin: Cell;
  from: [number, number];
  to: [number, number];
  /** Début du pas en cours (0 : au repos). */
  start: number;
  duration: number;
  /** Prochain départ (ms). */
  next: number;
  phase: number;
}

export function startStrolls(creatures: CreaturePlacement[], now: number): Stroll[] {
  return creatures.map((c, i) => ({
    id: c.id,
    kind: c.kind ?? 'creature',
    still: Boolean(c.still) || (c.steps?.length ?? 2) < 2,
    steps: c.steps ?? CREATURE_STEPS,
    origin: c.origin,
    from: [0, 0],
    to: [0, 0],
    start: 0,
    duration: 0,
    next: now + 2000 + i * 1500,
    phase: i * 1.3,
  }));
}

/**
 * Où est la créature, relativement à sa place, et de combien elle sautille (`bob`, en blocs) : un pas de 1,8 s en
 * douceur, puis trois à huit secondes de repos. `t` : le temps de l'animation, en secondes.
 */
export function strollAt(s: Stroll, now: number, t: number, random: () => number = Math.random): { dx: number; dy: number; bob: number } {
  if (!s.still && now >= s.next && s.start === 0) {
    const step = s.steps[Math.floor(random() * s.steps.length)];
    s.from = s.to;
    s.to = step;
    s.start = now;
    s.duration = 1800;
  }
  let dx = s.to[0];
  let dy = s.to[1];
  if (s.start) {
    const k = ease(Math.min(1, (now - s.start) / s.duration));
    dx = s.from[0] + (s.to[0] - s.from[0]) * k;
    dy = s.from[1] + (s.to[1] - s.from[1]) * k;
    if (k >= 1) {
      s.start = 0;
      s.next = now + 3000 + random() * 5000;
    }
  }
  const bob = s.start ? Math.abs(Math.sin(t * 8)) * 0.12 : Math.sin(t * 1.6 + s.phase) * 0.04;
  return { dx, dy, bob };
}

// ---- Le clavier

/** Les flèches : la direction sur la grille (x vers l'est, y vers le nord de l'écran). */
export const ARROW_DIRS: Record<string, [number, number]> = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };

/** L'île voisine dans une direction : la plus proche, et la mieux alignée ; `null` s'il n'y en a pas. */
export function islandInDirection(a: ArchipelagoId, from: { x: number; y: number }, dir: [number, number]): BiomeId | null {
  let best: { id: BiomeId; score: number } | null = null;
  const g = grilleDe(a);
  for (const b of islandsOf(a)) {
    const c = g.versMonde(g.placeDe({ genre: 'ile', id: b.id })!);
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) continue;
    const along = (dx * dir[0] + dy * dir[1]) / dist;
    if (along < 0.5) continue;
    const score = dist / along;
    if (!best || score < best.score) best = { id: b.id, score };
  }
  return best?.id ?? null;
}

// ---- Toucher le sol

/** Les cubes marqués du terrain, par case : pour savoir quel ouvrage ou quelle borne de mission on touche. */
export function cubeTags(cubes: VoxelCube[]): { bridges: Map<string, string>; quests: Map<string, string>; places: Map<string, PlaceId> } {
  const bridges = new Map<string, string>();
  const quests = new Map<string, string>();
  const places = new Map<string, PlaceId>();
  for (const c of cubes) {
    if (c.bridge) bridges.set(`${c.x},${c.y},${c.z}`, c.bridge);
    if (c.quest) quests.set(`${c.x},${c.y},${c.z}`, c.quest);
    if (c.place) places.set(`${c.x},${c.y},${c.z}`, c.place);
  }
  return { bridges, quests, places };
}

export type GroundTap =
  | { kind: 'quest'; biome: BiomeId; typeId: string }
  | { kind: 'place'; place: PlaceId; island: BiomeId }
  | { kind: 'bridge'; id: string }
  | { kind: 'face'; cell: Cell; next: Cell }
  /** Le sol d'une île : l'île, et la colonne touchée (le bonhomme y va). */
  | { kind: 'island'; id: BiomeId; cell: Cell };

/**
 * Ce que fait un toucher sur le terrain : la borne de mission touchée, sinon l'ouvrage (plutôt que l'île la plus proche),
 * sinon en chantier la face (le bloc et la case devant), sinon l'île sous le doigt. `cell` : le bloc touché, `next` :
 * la case devant la face, `ground` : le point touché sur la grille ; `can` : ce que la page sait faire.
 */
export function groundTap(
  a: ArchipelagoId,
  hit: { cell: Cell; next: Cell; ground: { x: number; y: number } },
  tags: { bridges: Map<string, string>; quests: Map<string, string>; places?: Map<string, PlaceId> },
  can: { quest: boolean; bridge: boolean; build: boolean; place?: boolean },
): GroundTap {
  const key = `${hit.cell.x},${hit.cell.y},${hit.cell.z}`;
  const quest = tags.quests.get(key);
  if (quest && can.quest) {
    const [biome, typeId] = quest.split(':');
    return { kind: 'quest', biome: biome as BiomeId, typeId };
  }
  const place = tags.places?.get(key);
  if (place && can.place) return { kind: 'place', place, island: grilleDe(a).ileEn({ ...hit.ground, z: 0 }) };
  const bridge = tags.bridges.get(key);
  if (bridge && can.bridge) return { kind: 'bridge', id: bridge };
  if (can.build) return { kind: 'face', cell: hit.cell, next: hit.next };
  return { kind: 'island', id: grilleDe(a).ileEn({ ...hit.ground, z: 0 }), cell: hit.cell };
}

/**
 * Après un toucher, la vue revient-elle à son cadrage (le décalage d'un glissé s'efface) ? Oui sur une cible (une
 * créature, le navire, une borne, un lieu, un ouvrage) : l'application reprend la main. Non sur le sol (une face en
 * chantier, ou le sol d'une île) : on pose bloc après bloc là où l'on regarde, ou le bonhomme y va sans que la vue
 * bouge ; si le toucher mène sur une autre île, c'est son nouveau cadrage qui efface le décalage.
 */
export function recentrerApres(tap: GroundTap | null, cible: boolean): boolean {
  if (cible) return true;
  return tap !== null && tap.kind !== 'face' && tap.kind !== 'island';
}

/** Un objet sous le doigt, le long du rayon : le décor en primitives, ou autre chose (cube, sol, créature). */
export interface Touche {
  /** Un élément du décor d'Archipéo (feuillage, rocher, repère). */
  decor: boolean;
  /** Sa distance au long du rayon. */
  distance: number;
  /** Une cible : une borne, un lieu, un ouvrage, une face à construire, une créature, le navire. */
  cible: boolean;
}

/**
 * Ce que retient un toucher parmi ce qu'il traverse : le plus proche, sauf si c'est du décor (un feuillage déborde de
 * sa case) et qu'une cible est derrière, sous le doigt : la cible gagne. Le décor ne gagne que s'il n'y a rien de
 * touchable derrière lui. L'indice dans `touches`, ou −1 s'il n'y a rien.
 */
export function toucheRetenue(touches: Touche[]): number {
  if (!touches.length) return -1;
  const ordre = touches.map((t, i) => ({ t, i })).sort((p, q) => p.t.distance - q.t.distance);
  const premier = ordre[0];
  if (!premier.t.decor) return premier.i;
  const cible = ordre.find(({ t }) => !t.decor && t.cible);
  return cible ? cible.i : premier.i;
}

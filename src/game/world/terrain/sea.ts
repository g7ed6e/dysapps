// Le large : les baleines, le décor de la mer et les nappes de brume.
import { type ArchipelagoId, archipelagoOfIsland, DANS_LE_CIEL, islandDef, landBox, landCells, startingIsland, mapOf } from '../map';
import { BIOMES } from '../../biomes';
import { dockBox } from '../harbor';
import { BRIDGES, getArchipelago } from '../archipelago';
import { footprintOf, monumentIslet } from '../footprint';
import { linkBetweenJoined, LONG_LENGTH, RegionRouter } from '../routing';
import { MONUMENT_ISLET, monumentsOf } from '../monuments';
import type { VoxelCube } from '../cube';
import { semerLaMer } from '../decor';
import { bossIsletOrigin, ISLET_H, ISLET_W, rectangleDeLIlot } from './islets';
import { bridgePath } from './links';
import { placedLinksOf } from '../linkGeometry';
import { bornesDeDepart, worldBounds } from './view';
import { chosenGuardian, layoutCache, type Rectangle } from '../placement';

/**
 * Les baleines replacées à la main, quand la clairière choisie par `whaleSpots` se cache derrière une île dans la vue
 * de l'archipel depuis le port (DA, 01/10/2026 : au 5e, celle de 91, 345 nageait derrière le Marché et seul son souffle
 * se voyait). `de` : la clairière choisie ; `vers` : la nouvelle, en eau libre ; le rond y garde trois cases de toute
 * terre, îlot ou ponton (`r` = éloignement − 3, comme ailleurs). Vérifié par terrain.test.ts et three/whales.test.ts.
 *
 * Depuis GD-9, les lieux se déplacent et les clairières suivent : celle du 5e, calée sur la clairière de 91, 345, ne
 * l'est plus. Au 6e, la clairière de 3, 109 passe d'un pas vers l'ouest (DA, 5 octobre 2026 : depuis la vue du port,
 * une côte cachait le bord de son rond) ; elle ne l'est que tant que la clairière choisie est celle-là. Depuis les îles
 * de sciences (SC-2), le Hangar des inventions au coin de devant, à l'ouest, une clairière s'ouvre derrière la Tour du
 * lecteur, qui la cache tout entière depuis le port : en -12, 73 au village tout construit, en -9, 76 sans liaison (les
 * liaisons posées la déplacent). Elle passe à 47, 85, au même rang, dans la passe entre la Ferme et la Forêt. Au 5e,
 * depuis le cadre élargi de 24 cases (HG-3), la clairière de 29, 345 se cache derrière les îles de l'ouest : la baleine
 * nage en 97, 313, au nord du port : la seule clairière (un rond de 4 cases) qui s'y voit entière.
 */
export const BALEINES_REPLACEES: Readonly<Partial<Record<ArchipelagoId, readonly { de: { x: number; y: number }; vers: { x: number; y: number } }[]>>> = {
  '6e': [
    { de: { x: 3, y: 109 }, vers: { x: -1, y: 109 } },
    { de: { x: -9, y: 76 }, vers: { x: 47, y: 85 } },
    { de: { x: -12, y: 73 }, vers: { x: 47, y: 85 } },
  ],
  '5e': [{ de: { x: 29, y: 345 }, vers: { x: 97, y: 313 } }],
};

/**
 * La distance d'un point à la case la plus proche de `cells` (cases entières), la même qu'en les parcourant toutes,
 * mais en ne regardant que les anneaux de cases autour du point, du plus proche au plus loin : rien sur l'anneau à
 * k cases n'est à moins de k − ½, on s'arrête dès qu'on a trouvé mieux. Les parcourir toutes, pour chaque clairière
 * possible, prenait plus d'une seconde au 6e (le test du passage de la baleine dépassait son délai en CI).
 */
function distanceToNearest(cells: readonly { x: number; y: number }[]): (x: number, y: number) => number {
  if (!cells.length) return () => Infinity;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cells) {
    // Une case non entière ne s'écrirait pas dans la grille : les clairières grandiraient sans bruit.
    if (!Number.isInteger(c.x) || !Number.isInteger(c.y)) throw new Error(`case non entière : ${c.x}, ${c.y}`);
    x0 = Math.min(x0, c.x);
    y0 = Math.min(y0, c.y);
    x1 = Math.max(x1, c.x);
    y1 = Math.max(y1, c.y);
  }
  const w = x1 - x0 + 1;
  const filled = new Uint8Array(w * (y1 - y0 + 1));
  for (const c of cells) filled[(c.y - y0) * w + (c.x - x0)] = 1;
  return (x, y) => {
    const cx = Math.round(x);
    const cy = Math.round(y);
    const far = Math.max(Math.abs(cx - x0), Math.abs(cx - x1), Math.abs(cy - y0), Math.abs(cy - y1));
    let best = Infinity;
    for (let k = 0; k <= far && best > k - 0.5; k++)
      for (let dx = -k; dx <= k; dx++) {
        const px = cx + dx;
        if (px < x0 || px > x1) continue;
        // Sur les bords de l'anneau, toute la colonne ; ailleurs, ses deux bouts.
        const step = Math.abs(dx) === k ? 1 : 2 * k;
        for (let dy = -k; dy <= k; dy += step) {
          const py = cy + dy;
          if (py < y0 || py > y1 || !filled[(py - y0) * w + (px - x0)]) continue;
          const d = Math.hypot(px - x, py - y);
          if (d < best) best = d;
        }
      }
    return best;
  };
}

const whaleCache = layoutCache<string, { x: number; y: number; r: number }[]>();

/**
 * Les clairières des baleines : au large des lieux à leur place, des îlots, du quai, des écueils et des liaisons posées
 * (GD-9 : elles changent quand on pose une liaison ou qu'on déplace un lieu).
 */
export function whaleSpots(a: ArchipelagoId, links: readonly string[]): { x: number; y: number; r: number }[] {
  const posees = placedLinksOf(a, links);
  const cleDesBaleines = `${a}|${posees.map((br) => br.id).join(',')}`;
  const known = whaleCache.get(cleDesBaleines);
  if (known) return known;
  // Les Îles du Ciel n'ont pas de mer : pas de baleines.
  if (DANS_LE_CIEL[a]) {
    whaleCache.set(cleDesBaleines, []);
    return [];
  }
  const land: { x: number; y: number }[] = [];
  for (const def of mapOf(a)) {
    for (const c of landCells(def)) land.push(c);
    const o = bossIsletOrigin(BIOMES.findIndex((b) => b.id === def.id));
    for (let x = 0; x < ISLET_W; x++) for (let y = 0; y < ISLET_H; y++) land.push({ x: o.x + x, y: o.y + y });
  }
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0; x <= dock.x1; x++) for (let y = dock.y0; y <= dock.y1; y++) land.push({ x, y });
  // Une baleine ne fait surface ni sur une liaison posée, ni sur un écueil.
  for (const br of posees) land.push(...bridgePath(br, links));
  for (const c of seaDecor(a)) land.push(c);
  const b = worldBounds(a);
  const clearance = distanceToNearest(land);
  // Les baleines préfèrent le large : on note chaque clairière par sa largeur et son éloignement du centre.
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const candidates: { x: number; y: number; r: number; score: number }[] = [];
  for (let x = b.minX + 8; x <= b.maxX - 8; x += 3)
    for (let y = b.minY + 8; y <= b.maxY - 8; y += 3) {
      const r = clearance(x, y) - 3;
      candidates.push({ x, y, r, score: Math.min(r, 9) + Math.hypot(x - cx, y - cy) * 0.12 });
    }
  candidates.sort((p, q) => q.score - p.score);
  // Une baleine ne plonge pas sur l'îlot d'un monument (à deux cases près, comme `monumentBlocked`).
  const surUnMonument = (x: number, y: number, r: number) =>
    monumentsOf(a).some((m) => {
      const ilot = monumentIslet(m);
      const px = Math.max(ilot.x, Math.min(x, ilot.x + MONUMENT_ISLET - 1));
      const py = Math.max(ilot.y, Math.min(y, ilot.y + MONUMENT_ISLET - 1));
      return Math.hypot(px - x, py - y) < r + 2;
    });
  const spots: { x: number; y: number; r: number }[] = [];
  for (const c of candidates) {
    if (c.r < 4) continue;
    if (surUnMonument(c.x, c.y, Math.min(c.r, 9))) continue;
    if (spots.some((s) => Math.hypot(s.x - c.x, s.y - c.y) < s.r + c.r + 20)) continue;
    spots.push({ x: c.x, y: c.y, r: Math.min(c.r, 9) });
    if (spots.length === 4) break;
  }
  for (const { de, vers } of BALEINES_REPLACEES[a] ?? []) {
    const i = spots.findIndex((s) => s.x === de.x && s.y === de.y);
    if (i >= 0) spots[i] = { x: vers.x, y: vers.y, r: Math.min(clearance(vers.x, vers.y) - 3, 9) };
  }
  // Dans un ordre qui ne dépend que de leur place (d'ouest en est, puis de l'avant vers l'arrière) : chaque baleine garde son rythme
  // (`three/offshore.ts` le tire de son rang) quand une île grandit et que les notes des clairières changent.
  spots.sort((p, q) => p.x - q.x || p.y - q.y);
  whaleCache.set(cleDesBaleines, spots);
  return spots;
}

const seaCache = new Map<ArchipelagoId, VoxelCube[]>();

/**
 * L'habillage de la mer : des rochers qui affleurent (galet et pierre, un à quatre cubes) et des bancs de sable au
 * ras de l'eau, semés une fois pour toutes sur l'étendue de la carte de départ (GD-9), au hasard (bruit fixe), dans l'eau libre de
 * la carte de départ, à cinq cases au moins de toute terre, de tout îlot, du quai, et hors des couloirs des liaisons. Ce sont les écueils : ils ne bougent
 * pas quand un lieu bouge, et aucune liaison ne passe dessus (`ecueilsDe`). Plus denses au large.
 */
export function seaDecor(a: ArchipelagoId): VoxelCube[] {
  const known = seaCache.get(a);
  if (known) return known;
  // Les Îles du Ciel : des nuages à la place de la mer, rien à semer.
  if (DANS_LE_CIEL[a]) {
    seaCache.set(a, []);
    return [];
  }
  const solid = new Set<string>();
  for (const id of mapOf(a).map((d) => d.id)) {
    const def = startingIsland(id);
    for (const c of landCells(def)) solid.add(`${c.x},${c.y}`);
    const r = rectangleDeLIlot(def);
    for (let x = r.x0; x < r.x1; x++) for (let y = r.y0; y < r.y1; y++) solid.add(`${x},${y}`);
  }
  const dock = dockBox(getArchipelago(a).port);
  for (let x = dock.x0 - 1; x <= dock.x1 + 1; x++) for (let y = dock.y0 - 1; y <= dock.y1 + 1; y++) solid.add(`${x},${y}`);
  // Les îlots des monuments.
  for (const m of monumentsOf(a)) {
    const o = monumentIslet(m, startingIsland(m.biome));
    for (let x = 0; x < MONUMENT_ISLET; x++) for (let y = 0; y < MONUMENT_ISLET; y++) solid.add(`${o.x + x},${o.y + y}`);
  }
  // Les couloirs des liaisons (GD-9) : le tracé de chaque liaison seule sur la carte de départ. Aucun écueil n'y
  // affleure, à deux cases près : la mer ne barre jamais d'avance une liaison que l'élève voudrait poser.
  const couloirs = new Set<string>();
  const traceur = new RegionRouter(a, { lieux: mapOf(a).map((d) => startingIsland(d.id)) });
  for (const l of BRIDGES)
    if (archipelagoOfIsland(l.from) === a && !linkBetweenJoined(l)) for (const c of traceur.essayer(l, LONG_LENGTH)?.cases ?? []) couloirs.add(`${c.x},${c.y}`);
  const b = bornesDeDepart(a);
  const free = (x: number, y: number) => {
    for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (solid.has(`${x + dx},${y + dy}`)) return false;
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (couloirs.has(`${x + dx},${y + dy}`)) return false;
    return true;
  };
  const cubes = semerLaMer(a, b, free);
  seaCache.set(a, cubes);
  return cubes;
}

const ecueilsCache = new Map<ArchipelagoId, ReadonlySet<string>>();

/** Les cases des écueils d'une région (« x,y ») : l'habillage de la mer (`seaDecor`), qu'aucune liaison ne coupe. */
export function ecueilsDe(a: ArchipelagoId): ReadonlySet<string> {
  let e = ecueilsCache.get(a);
  if (!e) ecueilsCache.set(a, (e = new Set(seaDecor(a).map((c) => `${c.x},${c.y}`))));
  return e;
}

/**
 * La marge d'eau autour de l'emprise d'un lieu où ses écueils sont cachés aussi : un rocher collé à la côte se lirait
 * comme un morceau du lieu.
 */
const MARGE_DES_ECUEILS = 1;

/**
 * Les écueils d'une région qui restent à l'air, des lieux étant posés sur l'emprise `parts` (GD-9, mainteneur, 5 octobre
 * 2026, « Cacher ») : une île posée sur des écueils les cache sous elle (sa terre, l'îlot de son Gardien, ses îlots, à
 * `MARGE_DES_ECUEILS` près) ; ils reviennent quand elle repart. La mer semée ne change pas.
 */
export function reefsOutside(a: ArchipelagoId, parts: readonly Rectangle[]): Set<string> {
  const m = MARGE_DES_ECUEILS;
  const out = new Set<string>();
  for (const k of ecueilsDe(a)) {
    const [x, y] = k.split(',').map(Number);
    if (!parts.some((p) => x >= p.x0 - m && x < p.x1 + m && y >= p.y0 - m && y < p.y1 + m)) out.add(k);
  }
  return out;
}

const visiblesCache = layoutCache<ArchipelagoId, ReadonlySet<string>>();

/** Les écueils à l'air d'une région, ses lieux et leurs Gardiens à leur place du moment (`reefsOutside`). */
export function visibleReefs(a: ArchipelagoId): ReadonlySet<string> {
  let v = visiblesCache.get(a);
  if (!v) {
    const parts = mapOf(a).flatMap((d) => footprintOf(d.id, islandDef(d.id), chosenGuardian(d.id)));
    visiblesCache.set(a, (v = reefsOutside(a, parts)));
  }
  return v;
}

/** L'habillage de la mer tel qu'il se dessine : sans les écueils qu'un lieu posé cache sous lui (`visibleReefs`). */
export function seaDecorShown(a: ArchipelagoId): VoxelCube[] {
  const v = visibleReefs(a);
  const toutes = seaDecor(a);
  return v.size === ecueilsDe(a).size ? toutes : toutes.filter((c) => v.has(`${c.x},${c.y}`));
}

/** Les nappes de brume des sommets (îles à 9) : centre, étendue et hauteur, en coordonnées de grille. */
export function mistPatches(a: ArchipelagoId): { x: number; y: number; z: number; w: number; h: number }[] {
  return mapOf(a)
    .filter((d) => d.altitude >= 9)
    .map((d) => {
      const b = landBox(d);
      return { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, z: d.altitude - 1.5, w: b.x1 - b.x0 + 8, h: b.y1 - b.y0 + 8 };
    });
}

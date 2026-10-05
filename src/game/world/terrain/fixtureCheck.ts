// Le calcul de la place d'une petite construction (GD-7), que seul le test appelle pour vérifier la place écrite.
import { type BiomeId, BIOMES, type BlockId, BLOCKS } from '../../biomes';
import { casesDeLaPetiteConstruction } from '../fixtures';
import { islandDef } from '../map';
import { ARCHIPELAGOS, BRIDGES } from '../archipelago';
import { planCells, plansFor } from '../plans';
import { DOCK_DX, shoreY } from '../harbour';
import { type ProjectionDeLaVue, projectionDeLaVueDeLIle, versLaCamera, VUE_DE_L_ILE_PANNEAU_OUVERT } from './view';
import { creatureDuMonde, creatureSpot, solLibre } from './creatures';
import { cacheUneBorne, questStations, rangeeDevantLesBornes } from './markers';
import { AVATAR_HOME, groundHeight, origineDe } from './base';
import { cacheUnLieu, lieuxVus } from './village';
import { boardingRoute } from './links';
import { cubesDeLIle } from '../terrain';

/** Jusqu'où, en cases, la petite construction cherche sa place autour de la créature. */
const PORTEE_DE_LA_PETITE_CONSTRUCTION = 8;

/**
 * Le rayon qui part du point (x, y, z) (repère de l'île, z en hauteur) vers la caméra de l'île (`camera`, même repère)
 * touche-t-il une case de `pleines` (clés « x,y,z ») avant de passer au-dessus de `plafond` ?
 */
function rayonArrete(pleines: ReadonlySet<string>, camera: { x: number; y: number; z: number }, x: number, y: number, z: number, plafond: number): boolean {
  const dx = camera.x - x;
  const dy = camera.y - y;
  const dz = camera.z - z;
  const l = Math.hypot(dx, dy, dz) || 1;
  for (let t = 0.2; t < l && z + (dz / l) * t <= plafond; t += 0.2) {
    if (pleines.has(`${Math.floor(x + (dx / l) * t)},${Math.floor(y + (dy / l) * t)},${Math.floor(z + (dz / l) * t)}`)) return true;
  }
  return false;
}

/** Un rectangle à l'écran, en pixels CSS. */
interface CadreALEcran {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Le rectangle à l'écran de cubes (coins `x, y, z` de leur case, coordonnées du monde) dans la vue de l'île panneau ouvert. */
function cadreALEcran(projeter: ProjectionDeLaVue, cubes: readonly { x: number; y: number; z: number }[]): CadreALEcran {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of cubes)
    for (let i = 0; i < 8; i++) {
      const [sx, sy] = projeter(c.x + (i & 1), c.y + ((i >> 1) & 1), c.z + ((i >> 2) & 1));
      r.x0 = Math.min(r.x0, sx);
      r.x1 = Math.max(r.x1, sx);
      r.y0 = Math.min(r.y0, sy);
      r.y1 = Math.max(r.y1, sy);
    }
  return r;
}

/** La silhouette à l'écran de cubes (coins `x, y, z` de leur case, coordonnées du monde) : l'enveloppe de leurs coins. */
function silhouette(projeter: ProjectionDeLaVue, cubes: readonly { x: number; y: number; z: number }[]): [number, number][] {
  const pts: [number, number][] = [];
  for (const c of cubes) for (let i = 0; i < 8; i++) pts.push(projeter(c.x + (i & 1), c.y + ((i >> 1) & 1), c.z + ((i >> 2) & 1)));
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const tour = (p: [number, number], q: [number, number], r: [number, number]) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const bas: [number, number][] = [];
  const haut: [number, number][] = [];
  for (const p of pts) {
    while (bas.length >= 2 && tour(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop();
    bas.push(p);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    while (haut.length >= 2 && tour(haut[haut.length - 2], haut[haut.length - 1], pts[i]) <= 0) haut.pop();
    haut.push(pts[i]);
  }
  return [...bas.slice(0, -1), ...haut.slice(0, -1)];
}

/**
 * L'écart, en pixels, entre deux silhouettes convexes (le plus grand vide le long des normales de leurs côtés) ; négatif
 * quand elles se recouvrent.
 */
function ecartEntre(a: readonly [number, number][], b: readonly [number, number][]): number {
  let ecart = -Infinity;
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i];
      const [x1, y1] = poly[(i + 1) % poly.length];
      const l = Math.hypot(x1 - x0, y1 - y0) || 1;
      const [nx, ny] = [(y1 - y0) / l, (x0 - x1) / l];
      let [aMin, aMax, bMin, bMax] = [Infinity, -Infinity, Infinity, -Infinity];
      for (const [x, y] of a) {
        const d = x * nx + y * ny;
        aMin = Math.min(aMin, d);
        aMax = Math.max(aMax, d);
      }
      for (const [x, y] of b) {
        const d = x * nx + y * ny;
        bMin = Math.min(bMin, d);
        bMax = Math.max(bMax, d);
      }
      ecart = Math.max(ecart, bMin - aMax, aMin - bMax);
    }
  return ecart;
}

/**
 * Le calcul de la place d'une petite construction (GD-7, PR 3), à côté de la créature, lisible dans la vue de l'île
 * panneau ouvert (`VUE_DE_L_ILE_PANNEAU_OUVERT`). Lent (des dizaines de millisecondes) : seul le test l'appelle, pour
 * vérifier la table de `placeDeLaPetiteConstruction`. Une place convient quand :
 * - chaque case de la forme est sur le sol libre de l'île (`solLibre` : ni décor, ni borne et son pourtour, ni lieu ou
 *   la case devant sa porte, ni zone des plans, ni ouvrage et ses abords, ni colline, ni eau), hors de la rangée nue
 *   devant les bornes d'une île-école, du chemin du bonhomme vers le navire et de la cale sur l'île-port, à une case au
 *   moins de la créature et de ses pas (elle s'y promène sans la toucher) ;
 * - aucun de ses cubes ne cache, dans la vue de l'île, une borne (`cacheUneBorne`), un lieu du village (`cacheUnLieu`)
 *   ou la créature (le rayon de chaque cube de la créature vers la caméra ne la traverse pas) ;
 * - le dessus de chaque colonne de la forme se voit de la caméra : aucun cube de l'île tout construite (ses plans
 *   bâtis), ni la créature à sa place ou à l'un de ses pas, ni le bonhomme chez lui, ne s'y met devant ; et le bonhomme
 *   ne cache aucun de ses cubes (jamais derrière lui) ;
 * - elle se lit entière dans la vue de l'île panneau ouvert : à une case au moins (à l'écran) du bord du panneau et des
 *   autres bords, au-dessus des boutons du bas, hors de Pause et de l'archipel.
 * Puis, par ordre de préférence (une préférence ne tombe que si aucune place ne la tient) : jamais devant la rangée
 * des bornes (le passage du bonhomme) ; à l'écran, rien d'elle sur la silhouette d'une borne, puis une demi-case au
 * moins entre elles (une case nue entre elle et toute borne) ; les cubes posés au sol ne sont pas du bloc du sol de leur
 * case (sinon ils s'y fondent) ; le moins possible de ses cubes cachés en partie (milieu et coins de chacun) ; une case
 * nue autour d'elle (ni mur, ni tronc, ni borne au-dessus du sol), pour que sa silhouette se détache. Parmi les places
 * qui restent, la plus proche de la créature, en préférant le côté au devant : une forme posée entre la caméra et la
 * créature compte deux cases de plus par case d'avance. `null` si rien ne la tient.
 */
export function calculerLaPlaceDeLaPetiteConstruction(id: BiomeId, fixture: string): { x: number; y: number } | null {
  const examen = examenDeLaPetiteConstruction(id, fixture);
  if (!examen) return null;
  // Les préférences, de la plus forte à la plus faible : derrière la rangée des bornes, puis jamais sur une borne à
  // l'écran, puis une case (à l'écran) entre elle et toute borne, puis sur un autre sol, puis entière (le moins de points
  // cachés), puis dégagée ; à préférences égales, la plus proche (la première trouvée à score égal).
  const rang = (p: ExamenDUnePlace) => [p.derriere ? 0 : 1, p.libre ? 0 : 1, p.ecartee ? 0 : 1, p.sol ? 0 : 1, p.caches, p.degagee ? 0 : 1, p.score];
  const avant = (a: number[], b: number[]) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  };
  let best: ExamenDUnePlace | null = null;
  for (const [ox, oy] of examen.candidates()) {
    const p = examen.examiner(ox, oy);
    if (p && (!best || avant(rang(p), rang(best)))) best = p;
  }
  return best ? { x: best.x, y: best.y } : null;
}

/** Ce que vaut une place qui tient les règles (voir `calculerLaPlaceDeLaPetiteConstruction`). */
export interface ExamenDUnePlace {
  x: number;
  y: number;
  /** La distance à la créature, plus le prix d'être devant elle ou près d'une borne à l'écran. */
  score: number;
  /** Derrière la rangée des bornes. */
  derriere: boolean;
  /** Rien d'elle sur la silhouette d'une borne (son socle, son ardoise, le repère au-dessus), à l'écran. */
  libre: boolean;
  /** Une demi-case au moins, à l'écran, entre elle et toute borne. */
  ecartee: boolean;
  /** Ses cubes posés au sol ne sont pas du bloc du sol de leur case. */
  sol: boolean;
  /** Une case nue autour d'elle. */
  degagee: boolean;
  /** Le nombre de points cachés de ses cubes (milieu et huit coins de chacun). */
  caches: number;
  /**
   * Chacun de ses cubes : son bloc, combien de ses neuf points (milieu et coins) se voient devant l'île tout construite, la
   * créature et le bonhomme, et s'il se fond dans le sol de sa case.
   */
  cubes: { x: number; y: number; z: number; block: BlockId; vus: number; commeLeSol: boolean }[];
}

/**
 * Le calcul des places d'une petite construction autour de la créature : les places à essayer (`candidates`), et ce que
 * vaut chacune (`examiner`, `null` si elle ne tient pas les règles). Seuls le test et `calculerLaPlaceDeLaPetiteConstruction`
 * s'en servent.
 */
export function examenDeLaPetiteConstruction(
  id: BiomeId,
  fixture: string,
): { candidates: () => Iterable<[number, number]>; examiner: (ox: number, oy: number) => ExamenDUnePlace | null } | null {
  const cases = casesDeLaPetiteConstruction(fixture) ?? [];
  const pied = [...new Map(cases.map((c) => [`${c.x},${c.y}`, { x: c.x, y: c.y }])).values()];
  if (!pied.length) return null;
  const dessus = pied.map((p) => ({ ...p, z: Math.max(...cases.filter((c) => c.x === p.x && c.y === p.y).map((c) => c.z)) + 1 }));
  const spot = creatureSpot(id);
  const free = solLibre(id);
  const creature = creatureDuMonde(id);
  const vers = versLaCamera(id);
  const index = BIOMES.findIndex((b) => b.id === id);
  const def = islandDef(id);
  const bornes = questStations(id).map((st) => ({ x: st.x, y: st.y, base: groundHeight(index, st.x, st.y) }));
  const lieux = lieuxVus(id);
  // Hors de la rangée nue devant les bornes (île-école) et du chemin du bonhomme vers le navire (île-port).
  const interdites = new Set<string>();
  for (const k of rangeeDevantLesBornes(id)) {
    const [x, y] = k.split(',').map(Number);
    interdites.add(`${x - def.core.x},${y - def.core.y}`);
  }
  for (const a of ARCHIPELAGOS)
    if (a.port === id) {
      const route = boardingRoute(id);
      for (let i = 1; i < route.length; i++) {
        const [p, q] = [route[i - 1], route[i]];
        const n = Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y), 1);
        for (let t = 0; t <= n; t++)
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
              interdites.add(`${Math.round(p.x + ((q.x - p.x) * t) / n) - def.core.x + dx},${Math.round(p.y + ((q.y - p.y) * t) / n) - def.core.y + dy}`);
      }
    }
  // Jamais devant la rangée des bornes : c'est par là que le bonhomme arrive et passe d'une borne à l'autre.
  const devant = Math.min(...questStations(id).map((st) => st.y), Infinity);
  const aCote = new Set<string>();
  for (const [sx, sy] of [[0, 0], ...spot.steps])
    for (const c of creature) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) aCote.add(`${spot.x + sx + c.x + dx},${spot.y + sy + c.y + dy}`);
  // L'île tout construite, sans créature (elle est animée à part) et sans petite construction posée : ce qui peut se
  // mettre devant la forme.
  const plans = Object.fromEntries(plansFor(id).map((p) => [p.id, planCells(p).map((c) => c.key)]));
  // Sur l'île-port, sans les objets du quai : ce sont eux qui évitent la petite construction (`quaySpots`).
  const quai = `${id}/`;
  const ile = cubesDeLIle(id, {}, { parts: plans, log: [], links: BRIDGES.map((b) => b.id) }, false).filter((c) => !c.decor?.startsWith(quai));
  const pleines = new Set(ile.map((c) => `${c.x},${c.y},${c.z}`));
  // Le bloc du sol de chaque case (le cube à z = 0).
  const sol = new Map<string, string | undefined>();
  for (const c of ile) if (c.z === 0) sol.set(`${c.x},${c.y}`, c.texture ?? c.color);
  // … les lieux du village d'une île-école dans toute leur emprise et leur hauteur (la salle des trophées grandit avec
  // les succès : sa place réservée compte pleine) …
  for (const l of lieux) for (let z = 1; z <= 12; z++) pleines.add(`${l.x},${l.y},${l.base + z}`);
  // … et la créature, à sa place et à chacun de ses pas : elle ne se tient jamais devant la forme.
  for (const [sx, sy] of [[0, 0], ...spot.steps]) for (const c of creature) pleines.add(`${spot.x + sx + c.x},${spot.y + sy + c.y},${c.z + 1}`);
  // Le bonhomme, chez lui sur l'île (deux cubes de haut) : jamais devant la forme.
  const bonhomme = new Set<string>();
  const solDuBonhomme = groundHeight(index, AVATAR_HOME.x, AVATAR_HOME.y);
  for (const z of [1, 2]) bonhomme.add(`${AVATAR_HOME.x},${AVATAR_HOME.y},${solDuBonhomme + z}`);
  for (const k of bonhomme) pleines.add(k);
  const plafond = Math.max(...ile.map((c) => c.z), ...creature.map((c) => c.z + 1)) + 1;
  // La caméra de la vue de l'île panneau ouvert, dans le repère de l'île : les rayons vont vers elle (en perspective).
  const o = origineDe(id);
  const { projeter, cube, oeil } = projectionDeLaVueDeLIle(id);
  const camera = { x: oeil.x - o.x, y: oeil.y - o.y, z: oeil.z - o.z };
  const V = VUE_DE_L_ILE_PANNEAU_OUVERT;
  // Les bornes à l'écran (le socle, l'ardoise et le haut doré) : de préférence, la forme ne touche la silhouette d'aucune,
  // et une demi-case au moins (à l'écran) l'en sépare.
  const bornesALEcran = bornes.map((b) => silhouette(projeter, [1, 2, 3].map((z) => ({ x: o.x + b.x, y: o.y + b.y, z: o.z + b.base + z }))));
  const cadreDeLaForme = (ox: number, oy: number) => cadreALEcran(projeter, cases.map((c) => ({ x: o.x + ox + c.x, y: o.y + oy + c.y, z: o.z + c.z + 1 })));
  // Le plus petit écart, en pixels, entre un cube de la forme et une borne (négatif s'ils se recouvrent à l'écran).
  const ecartAuxBornes = (ox: number, oy: number) => {
    let min = Infinity;
    for (const c of cases) {
      const s = silhouette(projeter, [{ x: o.x + ox + c.x, y: o.y + oy + c.y, z: o.z + c.z + 1 }]);
      for (const b of bornesALEcran) min = Math.min(min, ecartEntre(s, b));
    }
    return min;
  };
  const dansLaVue = (r: CadreALEcran) => {
    if (r.x0 < cube || r.y0 < cube || r.x1 > V.largeur - cube || r.y1 > V.hauteur - V.bas - cube) return false;
    return !(r.x1 > V.largeur - V.boutons.largeur - cube && r.y0 < V.boutons.hauteur + cube);
  };
  // Sur l'île-port, la cale devant la barque amarrée reste nue (`quaySpots`). Les objets du quai (la barque, les caisses,
  // les fanions, le foyer), eux, évitent la petite construction, posée ou non (`quaySpots` lit sa place écrite) : ils ne
  // bougent jamais quand elle se pose.
  if (ARCHIPELAGOS.some((a) => a.port === id)) {
    const S = shoreY(id) - def.core.y;
    for (let x = DOCK_DX - 4; x < DOCK_DX; x++) for (let y = S; y <= S + 1; y++) interdites.add(`${x},${y}`);
  }
  const elle = creature.map((c) => ({ x: spot.x + c.x + 0.5, y: spot.y + c.y + 0.5, z: c.z + 1.5 }));
  // Vers la caméra, à plat : une forme dont le centre est de ce côté de la créature se tient devant elle.
  const plat = Math.hypot(vers[0], vers[1]) || 1;
  const [ux, uy] = [vers[0] / plat, vers[1] / plat];
  const cx = elle.reduce((n, e) => n + e.x, 0) / elle.length;
  const cy = elle.reduce((n, e) => n + e.y, 0) / elle.length;
  const px = pied.reduce((n, p) => n + p.x + 0.5, 0) / pied.length;
  const py = pied.reduce((n, p) => n + p.y + 0.5, 0) / pied.length;
  const largeur = Math.max(...pied.map((p) => p.x)) + 1;
  const profondeur = Math.max(...pied.map((p) => p.y)) + 1;

  // Une case libre autour de la forme : rien de posé au-dessus du sol (un mur, un tronc, une borne), pour que sa
  // silhouette se détache.
  const autour = new Set<string>();
  for (const p of pied) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) autour.add(`${p.x + dx},${p.y + dy}`);
  const degagee = (ox: number, oy: number) =>
    [...autour].every((k) => {
      const [x, y] = k.split(',').map(Number);
      for (let z = 1; z <= 4; z++) if (pleines.has(`${ox + x},${oy + y},${z}`)) return false;
      return true;
    });
  // Les cubes posés au sol ne sont pas du bloc du sol de leur case.
  const commeLeSol = (b: BlockId, x: number, y: number) => sol.get(`${x},${y}`) === (BLOCKS[b].texture ?? BLOCKS[b].side);
  // Des points d'un cube : son milieu et, un peu en retrait, ses huit coins ; il se voit entier quand chacun se voit (un
  // poteau devant lui en cache une partie).
  const pointsVus: readonly (readonly [number, number, number])[] = [[0.5, 0.5, 0.5], ...[0.15, 0.85].flatMap((u) => [0.15, 0.85].flatMap((v) => [0.15, 0.85].map((w) => [u, v, w] as const)))];
  const R = PORTEE_DE_LA_PETITE_CONSTRUCTION;
  function* candidates(): Iterable<[number, number]> {
    for (let ox = spot.x - R - largeur; ox <= spot.x + R; ox++) for (let oy = spot.y - R - profondeur; oy <= spot.y + R; oy++) yield [ox, oy];
  }
  const examiner = (ox: number, oy: number): ExamenDUnePlace | null => {
    const distance = Math.min(...pied.flatMap((p) => elle.map((e) => Math.abs(ox + p.x + 0.5 - e.x) + Math.abs(oy + p.y + 0.5 - e.y))));
    if (distance > R) return null;
    if (!pied.every((p) => free(ox + p.x, oy + p.y) && !aCote.has(`${ox + p.x},${oy + p.y}`) && !interdites.has(`${ox + p.x},${oy + p.y}`))) return null;
    if (cases.some((c) => cacheUneBorne(bornes, vers, ox + c.x, oy + c.y, c.z + 1) || cacheUnLieu(lieux, vers, ox + c.x, oy + c.y, c.z + 1))) return null;
    const forme = new Set(cases.map((c) => `${ox + c.x},${oy + c.y},${c.z + 1}`));
    if (elle.some((e) => rayonArrete(forme, camera, e.x, e.y, e.z, 4))) return null;
    if (dessus.some((d) => rayonArrete(pleines, camera, ox + d.x + 0.5, oy + d.y + 0.5, d.z + 1.02, plafond))) return null;
    if (cases.some((c) => rayonArrete(bonhomme, camera, ox + c.x + 0.5, oy + c.y + 0.5, c.z + 1.5, plafond))) return null;
    if (!dansLaVue(cadreDeLaForme(ox, oy))) return null;
    const ecart = ecartAuxBornes(ox, oy);
    const avance = (ox + px - cx) * ux + (oy + py - cy) * uy;
    const cubes = cases.map((c) => ({
      x: c.x,
      y: c.y,
      z: c.z,
      block: c.block,
      vus: pointsVus.filter(([u, v, w]) => !rayonArrete(pleines, camera, ox + c.x + u, oy + c.y + v, c.z + 1 + w, plafond)).length,
      commeLeSol: c.z === 0 && commeLeSol(c.block, ox + c.x, oy + c.y),
    }));
    return {
      x: ox,
      y: oy,
      // Trop près d'une borne à l'écran : d'autant plus loin dans l'ordre qu'elle s'en approche.
      score: distance + 2 * Math.max(0, avance - 1) + (4 * Math.max(0, cube / 2 - ecart)) / cube,
      derriere: pied.every((p) => oy + p.y >= devant),
      libre: ecart > 0,
      ecartee: ecart >= cube / 2,
      sol: cubes.every((c) => !c.commeLeSol),
      degagee: degagee(ox, oy),
      caches: cubes.reduce((n, c) => n + pointsVus.length - c.vus, 0),
      cubes,
    };
  };
  return { candidates, examiner };
}

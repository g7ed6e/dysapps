// La redistribution « Trois bandes » des quatre îles-écoles (choix du mainteneur, 02/10/2026) : devant, les bornes
// seules, au pas de 4 ; au milieu, le village (la salle des trophées, l'école) ; au fond, la zone des plans (6 × 6) et le
// lieu où l'on assemble. Le plateau s'arrête à la colonne 11. Les clés de sauvegarde des plans ne changent pas.
import { BIOMES, BLOC } from '../biomes';
import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { ARCHIPELAGOS } from './archipelago';
import { toutConstruit } from './budget';
import { PLAN_ZONE, PLANS_AU_FOND, ZONES_AGRANDIES, decalageDesPlans, planCells, plansFor, zoneDesPlans } from './plans';
import {
  cacheUneBorne,
  cubesDeLIle,
  FIN_DU_PLATEAU_DES_ECOLES,
  groundHeight,
  PLACES_DES_BORNES_DES_ECOLES,
  placeDoor,
  placesDesBornes,
  questStations,
  VILLAGE_PLACES,
  versLaCamera,
  type BorneVue,
  worldCubes,
} from './terrain';
import { islandDef } from './map';

const ECOLES = ARCHIPELAGOS.map((a) => a.school);
const indexDe = (id: string) => BIOMES.findIndex((b) => b.id === id);

it('les îles-écoles sont celles dont la zone des plans est agrandie', () => {
  expect(Object.keys(ZONES_AGRANDIES).sort()).toEqual([...ECOLES].sort());
  for (const b of BIOMES) if (!ECOLES.includes(b.id)) expect(zoneDesPlans(b.id), b.id).toBe(PLAN_ZONE);
});

it('devant : les bornes seules, au pas de 4, centrées sur la visée ; au milieu, l’école ; au fond, la Halle', () => {
  expect(PLACES_DES_BORNES_DES_ECOLES).toEqual([0, 4, 8, 12, 16]);
  for (const id of ECOLES) {
    const bornes = questStations(id);
    // Trois missions aux places du milieu ; quatre penchent d'une place à gauche ; cinq les prennent toutes (GD-14).
    expect(bornes.map((b) => [b.x, b.y]), id).toEqual(placesDesBornes(bornes.length)?.map((x) => [x, 1]));
    // L'école quitte le devant : sa porte en (14, 2), une case libre entre elle et le bord droit du cœur (x = 17).
    const def = islandDef(id);
    const porte = (lieu: 'school' | 'assembly') => {
      const p = placeDoor(lieu, id)!;
      return [p.x - def.core.x, p.y - def.core.y];
    };
    expect(VILLAGE_PLACES['school'].at).toEqual({ x: 12, y: 3 });
    expect(porte('school'), id).toEqual([14, 2]);
    expect(VILLAGE_PLACES.assembly.at).toEqual({ x: 15, y: 11 });
    expect(porte('assembly'), id).toEqual([16, 10]);
    // Aucun lieu sur la rangée des bornes ni sur la rangée de devant elle.
    const cubes = cubesDeLIle(id, {}, undefined, false);
    expect(cubes.filter((c) => c.place && c.y <= 2), id).toEqual([]);
  }
  // Les autres îles gardent leurs bornes au pas de 3.
  expect(questStations('french-6e-grammar-spelling').map((b) => b.x)).toEqual(questStations('french-6e-grammar-spelling').map((_, i) => 3 + 3 * i));
});

it('le plateau des îles-écoles s’arrête à la colonne 11 ; ailleurs, le relief ne change pas', () => {
  for (const id of ECOLES)
    for (let x = FIN_DU_PLATEAU_DES_ECOLES; x < 18; x++) for (let y = -2; y < 18; y++) expect(groundHeight(indexDe(id), x, y), `${id} ${x},${y}`).toBe(0);
  // Le plateau tient encore aux colonnes 9 à 11.
  for (const id of ECOLES) expect(groundHeight(indexDe(id), 10, 7), id).toBe(1);
  // Une île qui n'est pas une école garde son plateau jusqu'à la colonne 13.
  expect(groundHeight(indexDe('french-6e-grammar-spelling'), 13, 7)).toBe(1);
});

/** Le rayon parti de `o` vers la caméra (`d`, rayons parallèles comme `cacheUneBorne`) coupe-t-il le cube (x, y, z) ? */
function coupe(o: readonly number[], d: readonly number[], c: { x: number; y: number; z: number }): boolean {
  let t0 = 1e-6;
  let t1 = Infinity;
  const lo = [c.x, c.y, c.z];
  for (let j = 0; j < 3; j++) {
    if (Math.abs(d[j]) < 1e-9) {
      if (o[j] < lo[j] || o[j] > lo[j] + 1) return false;
      continue;
    }
    const a = (lo[j] - o[j]) / d[j];
    const b = (lo[j] + 1 - o[j]) / d[j];
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  }
  return t0 <= t1;
}

/** La salle des trophées à sa plus grande : plus de succès qu'elle n'a de places. */
const SALLE_PLEINE = Array.from({ length: 60 }, () => BLOC.or);
/** Tous les succès gagnés, un trophée chacun (la salle telle qu'un élève peut la remplir). */
const TOUS_LES_SUCCES = BADGES.map((b) => trophyBlock(b.id));

/** La première rangée (y, repère de l'île) où se dessine une case d'un plan de la zone des plans. */
const premiereRangee = (id: (typeof ECOLES)[number]) =>
  Math.min(...plansFor(id).flatMap((p) => planCells(p).map((c) => c.y + decalageDesPlans(p).y)));

/**
 * Les cubes des lieux du village d'une île-école, la salle des trophées à sa plus grande, tout construit : calculés une
 * fois par île et par lieu où l'on assemble (les îles agrandies par GD-11 ont plus de cubes à tirer).
 */
const lieuxCaches = new Map<string, ReturnType<typeof cubesDeLIle>>();
function lieuxDe(id: (typeof ECOLES)[number], atelier: 'fabrique' | 'halle'): ReturnType<typeof cubesDeLIle> {
  const cle = `${id} ${atelier}`;
  let lieux = lieuxCaches.get(cle);
  if (!lieux) {
    const tout = toutConstruit();
    lieux = cubesDeLIle(id, tout.progress, tout.world, false, SALLE_PLEINE, new Set(), false, atelier).filter((c) => c.place);
    lieuxCaches.set(cle, lieux);
  }
  return lieux;
}

/**
 * Les points d'une case de la première rangée où se pose un plan cachés par un lieu, vus de la caméra de l'île : la case
 * porte comme une borne (deux cubes sur le sol, `cacheUneBorne`), ses points pris aux mêmes places, sans marge. Par lieu
 * et par colonne de la zone (« lieu@x » : nombre de points cachés, sur 45).
 */
function pointsCaches(
  id: (typeof ECOLES)[number],
  atelier: 'fabrique' | 'halle',
  sauf: (c: { place?: string; z: number; texture?: string }) => boolean = () => false,
): Record<string, number> {
  const lieux = lieuxDe(id, atelier).filter((c) => !sauf(c));
  expect(lieux.length).toBeGreaterThan(0);
  const vers = versLaCamera(id);
  const zone = zoneDesPlans(id);
  const y = premiereRangee(id);
  const out: Record<string, number> = {};
  for (let x = zone.x; x < zone.x + zone.w; x++)
    for (const u of [0.05, 0.5, 0.95])
      for (const v of [0.05, 0.5, 0.95])
        for (const w of [1.05, 1.5, 2, 2.5, 2.95]) {
          const c = lieux.find((c) => coupe([x + u, y + v, w], vers, c));
          if (c) out[`${c.place}@${x}`] = (out[`${c.place}@${x}`] ?? 0) + 1;
        }
  return out;
}

/** Les bornes d'une île-école, vues comme `cacheUneBorne` les voit (repère de l'île). */
const bornesVues = (id: (typeof ECOLES)[number]): BorneVue[] =>
  questStations(id).map((b) => ({ x: b.x, y: b.y, base: groundHeight(indexDe(id), b.x, b.y) }));

it('rien devant les bornes : ni un lieu du village ni le décor (table, étal, arbres, objets du quai) n’en cache une, partie vierge ou tout construit, la salle à sa plus grande', () => {
  const tout = toutConstruit();
  for (const id of ECOLES) {
    const vers = versLaCamera(id);
    const bornes = bornesVues(id);
    for (const [partie, cubes] of [
      ['vierge', cubesDeLIle(id, {}, undefined, false)],
      ['tout construit', cubesDeLIle(id, tout.progress, tout.world, false, SALLE_PLEINE)],
    ] as const) {
      const cachent = cubes.filter((c) => !c.sol && !c.quest && cacheUneBorne(bornes, vers, c.x, c.y, c.z));
      expect(cachent.map((c) => `${c.place ?? c.decor ?? c.texture} ${c.x},${c.y},${c.z}`), `${id}, ${partie}`).toEqual([]);
    }
  }
});

it('les colonnes des bornes d’une île-école selon son nombre de missions : au milieu, penchées d’une place à gauche si le nombre est pair', () => {
  expect(placesDesBornes(1)).toEqual([8]);
  expect(placesDesBornes(2)).toEqual([4, 8]);
  expect(placesDesBornes(3)).toEqual([4, 8, 12]);
  expect(placesDesBornes(4)).toEqual([0, 4, 8, 12]);
  expect(placesDesBornes(5)).toEqual([0, 4, 8, 12, 16]);
  expect(placesDesBornes(6)).toBeNull();
});

/** Ce que le toit de l'école peut cacher d'une case de la première rangée où se pose un plan, au plus (points sur 45). */
const SEUIL_DU_TOIT = 6;

/**
 * Tranché par le directeur artistique (02/10/2026), accepté : à l'Atelier, même une rangée plus au fond, la cloche
 * d'or du clocheton de l'école (son cube le plus haut, z = 7 ; le toit seul reste sous le seuil) cache le bas des cases 11
 * et 12 de la première rangée de plans. Ces cases seules dépassent le seuil, et seulement par la cloche.
 */
const AU_DELA_DU_SEUIL: Partial<Record<(typeof ECOLES)[number], readonly string[]>> = { 'maths-4e-algebra': ['school@11', 'school@12'] };
const PLAFOND_DE_LA_CLOCHE = 12;
const laCloche = (c: { place?: string; z: number; texture?: string }) => c.place === 'school' && c.texture === 'or';

it(`la première rangée où se pose un plan : l’école en cache au plus ${SEUIL_DU_TOIT} points sur 45 par case, aucun autre lieu rien`, () => {
  // Décision du directeur artistique (02/10/2026) : à la Forêt et au Phare, le toit de l'école mord le bord avant du sol
  // (accepté) ; au Marché et à l'Atelier, dont la caméra pivote vers le milieu de leur archipel, les plans se posent une
  // rangée plus au fond (`PLANS_AU_FOND`).
  for (const atelier of ['fabrique', 'halle'] as const)
    for (const id of ECOLES) {
      const r = pointsCaches(id, atelier);
      expect(Object.keys(r).filter((k) => !k.startsWith('school@')), `${id} (${atelier})`).toEqual([]);
      const ouverts = AU_DELA_DU_SEUIL[id] ?? [];
      for (const [k, n] of Object.entries(r)) expect(n, `${id} (${atelier}) ${k}`).toBeLessThanOrEqual(ouverts.includes(k) ? PLAFOND_DE_LA_CLOCHE : SEUIL_DU_TOIT);
      // Sans la cloche, toutes les cases tiennent le seuil : le reste de l'école (le toit) ne le dépasse nulle part.
      for (const [k, n] of Object.entries(pointsCaches(id, atelier, laCloche))) expect(n, `${id} (${atelier}) ${k}, sans la cloche`).toBeLessThanOrEqual(SEUIL_DU_TOIT);
    }
});

it('au Marché et à l’Atelier, les plans se dessinent une rangée plus au fond (y 11 à 15) ; la rangée y = 10 reste une allée nue', () => {
  expect(Object.keys(PLANS_AU_FOND).sort()).toEqual(['maths-4e-algebra', 'maths-5e-proportionality']);
  const tout = toutConstruit();
  for (const id of ECOLES) {
    const fond = id === 'maths-5e-proportionality' || id === 'maths-4e-algebra';
    const zone = zoneDesPlans(id);
    for (const plan of plansFor(id)) expect(decalageDesPlans(plan), plan.id).toEqual({ x: 0, y: fond ? 1 : 0, z: 0 });
    expect(premiereRangee(id), id).toBe(fond ? zone.y + 1 : zone.y);
    // Tout construit, chaque case posée se dessine à sa clé décalée, dans la zone ; rien que le sol sur la rangée avant.
    const cubes = cubesDeLIle(id, tout.progress, tout.world, false);
    const ici = new Set(cubes.filter((c) => !c.sol && !c.ghost).map((c) => `${c.x},${c.y},${c.z}`));
    for (const plan of plansFor(id)) {
      const d = decalageDesPlans(plan);
      for (const c of planCells(plan)) {
        expect(ici.has(`${c.x + d.x},${c.y + d.y},${c.z + d.z + 1}`), `${plan.id} ${c.key}`).toBe(true);
        expect(c.y + d.y, `${plan.id} ${c.key}`).toBeLessThan(zone.y + zone.h);
      }
    }
    if (fond)
      expect(cubes.filter((c) => !c.sol && c.y === zone.y && c.x >= zone.x && c.x < zone.x + zone.w).map((c) => `${c.x},${c.z}`), id).toEqual([]);
  }
  // Le Bloc-Navire et les monuments gardent leur ancre (`ancreDuQuai`, `monumentAnchor`).
  expect(decalageDesPlans({ biome: 'maths-5e-proportionality', zone: 'port' })).toEqual({ x: 0, y: 0, z: 0 });
  expect(decalageDesPlans({ biome: 'maths-4e-algebra', zone: 'monument' })).toEqual({ x: 0, y: 0, z: 0 });
});

it('une sauvegarde d’avant la redistribution (plans posés dans la zone de 6 × 5) reste valide, case pour case', () => {
  // Des clés relevées sur main avant ce lot (d1340b0) : la première et la dernière case de chaque plan des îles-écoles.
  const avant: Record<string, string[]> = {
    'french-6e-phonology-1': ['9,12,0', '12,14,2'],
    'french-6e-phonology-2': ['10,12,0', '11,14,4'],
    'french-6e-phonology-3': ['8,10,0', '12,11,0'],
    'maths-5e-proportionality-1': ['9,14,0', '11,12,0'],
    'maths-5e-proportionality-2': ['10,12,1', '13,11,2'],
    'maths-5e-proportionality-3': ['8,10,0', '12,11,0'],
    'maths-4e-algebra-1': ['9,12,0', '12,14,2'],
    'maths-4e-algebra-2': ['10,12,0', '11,14,4'],
    'maths-4e-algebra-3': ['8,10,0', '12,11,0'],
    'maths-3e-functions-1': ['10,12,0', '12,14,3'],
    'maths-3e-functions-2': ['11,12,0', '11,14,5'],
    'maths-3e-functions-3': ['8,10,0', '9,11,0'],
  };
  const etat = sanitizeState({ ...EMPTY_STATE, world: { ...EMPTY_STATE.world, parts: avant } });
  expect(etat.world.parts).toEqual(avant);
  // Et chaque plan des îles-écoles tient toujours dans l'ancienne zone : la rangée gagnée (y = 15) est libre.
  for (const id of ECOLES)
    for (const plan of plansFor(id))
      for (const c of planCells(plan)) expect(c.y >= PLAN_ZONE.y && c.y < PLAN_ZONE.y + PLAN_ZONE.h, `${plan.id} ${c.key}`).toBe(true);
});

/**
 * Point à suivre (02/10/2026), d'avant ce lot, exception validée par le consultant de Blocland pour ce lot : sur l'île du Phare, la petite tour du phare
 * du décor du cœur (layout (9, 3), cœur (11, 6), six cubes) cache, de sa lanterne, deux trophées du bout de la salle.
 */
const DECOR_QUI_CACHE_UN_TROPHEE: Partial<Record<(typeof ECOLES)[number], string>> = { 'maths-3e-functions': 'la tour du phare du cœur' };

it('le décor ne cache aucun trophée de la salle à sa plus grande, vue de la caméra de l’île', () => {
  // L'arbre du plateau de la Forêt cachait le trophée du bout de la salle (relecture du référent dys, 02/10/2026) ; l'étal
  // du Marché, glissé d'une case vers la gauche, en cachait un aussi.
  const tout = toutConstruit();
  for (const id of ECOLES.filter((i) => !DECOR_QUI_CACHE_UN_TROPHEE[i])) {
    const vers = versLaCamera(id);
    const sans = new Set(cubesDeLIle(id, tout.progress, tout.world, false).map((c) => `${c.x},${c.y},${c.z}`));
    const avec = cubesDeLIle(id, tout.progress, tout.world, false, TOUS_LES_SUCCES);
    const trophees = avec.filter((c) => c.place === 'trophies' && !sans.has(`${c.x},${c.y},${c.z}`));
    expect(trophees.length, id).toBeGreaterThan(0);
    const decor = avec.filter((c) => !c.sol && !c.place && !c.quest);
    const caches = trophees.filter((t) => decor.some((c) => coupe([t.x + 0.5, t.y + 0.5, t.z + 0.5], vers, c)));
    expect(caches.map((t) => `${t.x},${t.y},${t.z}`), id).toEqual([]);
  }
});

it('devant la porte d’un lieu du village, et une case autour, rien n’est posé (ni décor ni objet du quai)', () => {
  // Les caisses du quai s'empilaient devant la porte de l'école du Marché (relecture du consultant de Blocland, 02/10/2026).
  const tout = toutConstruit();
  for (const a of ARCHIPELAGOS) {
    const id = a.school;
    const def = islandDef(id);
    // Le monde entier, pour les objets du quai (le Marché et l'Atelier sont des ports), ramené au repère du cœur.
    const cubes = worldCubes(a.classe, tout.progress, tout.world, false).map((c) => ({ ...c, x: c.x - def.core.x, y: c.y - def.core.y }));
    for (const lieu of ['school', 'trophies', 'assembly'] as const) {
      const p = placeDoor(lieu, id)!;
      const [px, py] = [p.x - def.core.x, p.y - def.core.y];
      const devant = cubes.filter((c) => !c.sol && !c.place && !c.bridge && Math.abs(c.x - px) <= 1 && Math.abs(c.y - py) <= 1);
      expect(devant.map((c) => `${c.decor ?? c.texture} ${c.x},${c.y},${c.z}`), `${id}, ${lieu}`).toEqual([]);
    }
  }
});

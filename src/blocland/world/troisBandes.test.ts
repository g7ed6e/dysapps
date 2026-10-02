// La redistribution « Trois bandes » des quatre îles-écoles (choix du mainteneur, 02/10/2026) : devant, les bornes
// seules, au pas de 4 ; au milieu, le village (la salle des trophées, l'école) ; au fond, la zone des plans (6 × 6) et le
// lieu où l'on assemble. Le plateau s'arrête à la colonne 11. Les clés de sauvegarde des plans ne changent pas.
import { BIOMES } from '../biomes';
import { EMPTY_STATE, sanitizeState } from '../engine';
import { ARCHIPELAGOS } from './archipelago';
import { toutConstruit } from './budget';
import { PLAN_ZONE, ZONES_AGRANDIES, planCells, plansFor, zoneDesPlans } from './plans';
import {
  cacheUneBorne,
  cubesDeLIle,
  FIN_DU_PLATEAU_DES_ECOLES,
  groundHeight,
  PLACES_DES_BORNES_DES_ECOLES,
  placeDoor,
  questStations,
  VILLAGE_PLACES,
  versLaCamera,
  type BorneVue,
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
    expect(bornes.map((b) => [b.x, b.y]), id).toEqual([
      [4, 1],
      [8, 1],
      [12, 1],
    ]);
    // L'école quitte le devant : sa porte en (14, 2), une case libre entre elle et le bord droit du cœur (x = 17).
    const def = islandDef(id);
    const porte = (lieu: 'ecole' | 'assemblage') => {
      const p = placeDoor(lieu, id)!;
      return [p.x - def.core.x, p.y - def.core.y];
    };
    expect(VILLAGE_PLACES.ecole.at).toEqual({ x: 12, y: 3 });
    expect(porte('ecole'), id).toEqual([14, 2]);
    expect(VILLAGE_PLACES.assemblage.at).toEqual({ x: 15, y: 11 });
    expect(porte('assemblage'), id).toEqual([16, 10]);
    // Aucun lieu sur la rangée des bornes ni sur la rangée de devant elle.
    const cubes = cubesDeLIle(id, {}, undefined, false);
    expect(cubes.filter((c) => c.place && c.y <= 2), id).toEqual([]);
  }
  // Les autres îles gardent leurs bornes au pas de 3.
  expect(questStations('ferme').map((b) => b.x)).toEqual(questStations('ferme').map((_, i) => 3 + 3 * i));
});

it('le plateau des îles-écoles s’arrête à la colonne 11 ; ailleurs, le relief ne change pas', () => {
  for (const id of ECOLES)
    for (let x = FIN_DU_PLATEAU_DES_ECOLES; x < 18; x++) for (let y = -2; y < 18; y++) expect(groundHeight(indexDe(id), x, y), `${id} ${x},${y}`).toBe(0);
  // Le plateau tient encore aux colonnes 9 à 11.
  for (const id of ECOLES) expect(groundHeight(indexDe(id), 10, 7), id).toBe(1);
  // Une île qui n'est pas une école garde son plateau jusqu'à la colonne 13.
  expect(groundHeight(indexDe('ferme'), 13, 7)).toBe(1);
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

/**
 * Les points d'une case du rang avant de la zone des plans cachés par un lieu, vus de la caméra de l'île : la case porte
 * comme une borne (deux cubes sur le sol, `cacheUneBorne`), ses points pris aux mêmes places, sans marge. Par lieu et
 * par colonne de la zone (« lieu@x » : nombre de points cachés, sur 45).
 */
function pointsCaches(id: (typeof ECOLES)[number], atelier: 'fabrique' | 'halle'): Record<string, number> {
  // La salle des trophées à sa plus grande (tous les succès), tout construit.
  const tout = toutConstruit();
  const trophees = Array.from({ length: 60 }, () => 'or' as const);
  const lieux = cubesDeLIle(id, tout.progress, tout.village, false, trophees, new Set(), false, atelier).filter((c) => c.place);
  expect(lieux.length).toBeGreaterThan(0);
  const vers = versLaCamera(id);
  const zone = zoneDesPlans(id);
  const out: Record<string, number> = {};
  for (let x = zone.x; x < zone.x + zone.w; x++)
    for (const u of [0.05, 0.5, 0.95])
      for (const v of [0.05, 0.5, 0.95])
        for (const w of [1.05, 1.5, 2, 2.5, 2.95]) {
          const c = lieux.find((c) => coupe([x + u, zone.y + v, w], vers, c));
          if (c) out[`${c.place}@${x}`] = (out[`${c.place}@${x}`] ?? 0) + 1;
        }
  return out;
}

it('aucun lieu du village ne cache une borne', () => {
  for (const id of ECOLES) {
    const vers = versLaCamera(id);
    const bornes: BorneVue[] = questStations(id).map((b) => ({ x: b.x, y: b.y, base: groundHeight(indexDe(id), b.x, b.y) }));
    const lieux = cubesDeLIle(id, {}, undefined, false).filter((c) => c.place);
    expect(lieux.filter((c) => cacheUneBorne(bornes, vers, c.x, c.y, c.z)).map((c) => `${c.place} ${c.x},${c.y},${c.z}`), id).toEqual([]);
  }
});

it('le rang avant de la zone des plans : ni la salle des trophées ni le lieu où l’on assemble n’en cachent rien ; ce que l’école en cache est relevé', () => {
  // Ce que l'école, au milieu à droite, cache du rang avant de la zone des plans (points sur 45 par case) : sur la Forêt et
  // le Phare, le bord avant du sol seulement ; au Marché et à l'Atelier, dont la caméra pivote vers le milieu de leur
  // archipel (presque de face à l'Atelier), le bas des cases du milieu, sous le toit de l'école. Le concept demande « aucune
  // case cachée » (point ouvert, à trancher par le directeur artistique sur captures) : ce relevé ne doit pas grandir.
  const ecole: Record<string, Record<string, number>> = {
    foret: { 'ecole@8': 2, 'ecole@9': 6, 'ecole@10': 3, 'ecole@11': 3, 'ecole@12': 3, 'ecole@13': 3 },
    marche: { 'ecole@9': 7, 'ecole@10': 21, 'ecole@11': 19, 'ecole@12': 9, 'ecole@13': 9 },
    atelier: { 'ecole@10': 11, 'ecole@11': 21, 'ecole@12': 33, 'ecole@13': 20 },
    phare: { 'ecole@8': 2, 'ecole@9': 6, 'ecole@10': 3, 'ecole@11': 3, 'ecole@12': 3, 'ecole@13': 3 },
  };
  for (const atelier of ['fabrique', 'halle'] as const) for (const id of ECOLES) expect(pointsCaches(id, atelier), `${id} (${atelier})`).toEqual(ecole[id]);
});

it('une sauvegarde d’avant la redistribution (plans posés dans la zone de 6 × 5) reste valide, case pour case', () => {
  // Des clés relevées sur main avant ce lot (d1340b0) : la première et la dernière case de chaque plan des îles-écoles.
  const avant: Record<string, string[]> = {
    'foret-cabane': ['9,12,0', '12,14,2'],
    'foret-toit': ['10,12,0', '11,14,4'],
    'foret-cour': ['8,10,0', '12,11,0'],
    'marche-echoppe': ['9,14,0', '11,12,0'],
    'marche-toit': ['10,12,1', '13,11,2'],
    'marche-etal': ['8,10,0', '12,11,0'],
    'atelier-bureau': ['9,12,0', '12,14,2'],
    'atelier-toit': ['10,12,0', '11,14,4'],
    'atelier-terrasse': ['8,10,0', '12,11,0'],
    'phare-lanterne': ['10,12,0', '12,14,3'],
    'phare-toit': ['11,12,0', '11,14,5'],
    'phare-jetee': ['8,10,0', '9,11,0'],
  };
  const etat = sanitizeState({ ...EMPTY_STATE, village: { ...EMPTY_STATE.village, plans: avant } });
  expect(etat.village.plans).toEqual(avant);
  // Et chaque plan des îles-écoles tient toujours dans l'ancienne zone : la rangée gagnée (y = 15) est libre.
  for (const id of ECOLES)
    for (const plan of plansFor(id))
      for (const c of planCells(plan)) expect(c.y >= PLAN_ZONE.y && c.y < PLAN_ZONE.y + PLAN_ZONE.h, `${plan.id} ${c.key}`).toBe(true);
});

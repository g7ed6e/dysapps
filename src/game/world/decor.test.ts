import type { VoxelCube } from './cube';
import { getArchipelago } from './archipelago';
import { toutConstruit } from './budget';
import { BIOMES } from '../biomes';
import { DECOR_BATI, REPERES, TRIANGLE_DU_BELVEDERE, decorPose, kindOf } from './decor';
import { zoneDesPlans } from './plans';
import { champDuSol, landMesh, poseDuDecor, signatureDuChamp } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { walkGround } from './paths';
import { type BorneVue, cacheUneBorne, creaturePlacements, cubesDeLIle, groundHeight, LAYOUT_PAD, questStations, seaDecor, versLaCamera, worldCubes } from './terrain';

const parties = (a: ArchipelagoId) => {
  const { progress, world: village } = toutConstruit();
  return [worldCubes(a, {}), worldCubes(a, progress, village, false)];
};
const bati = (c: VoxelCube) => Boolean(c.decor) && DECOR_BATI.has(kindOf(c.decor!));

it('les repères, les cascades et l’habillage de la mer ont un nom de décor, un par élément', () => {
  const vus = new Set<string>();
  for (const a of ARCHIPELAGO_IDS) {
    for (const c of seaDecor(a)) {
      expect(c.decor, `${c.x},${c.y}`).toMatch(/^mer\/(ecueil|banc)@-?\d+,-?\d+$/);
      expect(decorPose(c.decor)).toBe(false);
    }
    for (const c of worldCubes(a, {})) if (bati(c)) vus.add(kindOf(c.decor!));
  }
  // Chaque genre de repère existe quelque part. Plus aucune cascade dans le monde depuis les formes des Îles du Ciel
  // (GD-12, 9 octobre 2026) : une île qui a sa forme n'a ni mare ni lac sur sa côte, d'où l'eau débordait.
  for (const k of [...REPERES, 'ecueil', 'banc']) expect(vus.has(k), k).toBe(true);
  expect(vus.has('cascade')).toBe(false);
  // Le décor posé (un arbre, un objet du quai) reste du décor posé.
  expect(decorPose('foret/cœur:arbre@8,2')).toBe(true);
  expect(decorPose('phare/barque@3,4')).toBe(true);
  expect(decorPose('volcan/haut-fourneau@3,4')).toBe(false);
  expect(decorPose(undefined)).toBe(false);
});

it('nommer le décor bâti ne fait bouger aucun des quatre archipels : sol, pente, marche, décor', () => {
  // Les mêmes mondes, avec et sans les noms du décor bâti : tout ce qui lit les noms de décor rend la même chose.
  const sansNom = (cubes: VoxelCube[]) => cubes.map((c) => (bati(c) ? { ...c, decor: undefined } : c));
  for (const a of ARCHIPELAGO_IDS)
    for (const cubes of parties(a)) {
      const avant = sansNom(cubes);
      expect(avant.filter((c, i) => c !== cubes[i]).length, a).toBeGreaterThan(0);
      // La pente du rendu Archipéo (un décor nommé s'abaisserait avec elle, voir landMesh.ts) : le même champ, le même maillage.
      const champ = (list: VoxelCube[]) => champDuSol(a, list.filter((c) => c.sol), list.filter((c) => !c.sol));
      const [p, q] = [champ(cubes), champ(avant)];
      expect(signatureDuChamp(p), a).toBe(signatureDuChamp(q));
      expect(p.colonnes.map((c) => c.coins)).toEqual(q.colonnes.map((c) => c.coins));
      expect([...p.decorsAbaisses]).toEqual([...q.decorsAbaisses]);
      expect(landMesh(p).sol.positions).toEqual(landMesh(q).sol.positions);
      const autres = (list: VoxelCube[]) => list.filter((c) => !c.sol).map((c) => [c.x, c.y, c.z]);
      expect(autres(poseDuDecor(p, cubes.filter((c) => !c.sol)))).toEqual(autres(poseDuDecor(q, avant.filter((c) => !c.sol))));
      // La marche du bonhomme et des créatures.
      const creatures = creaturePlacements(a, toutConstruit().world.links);
      expect([...walkGround(cubes, creatures).feet]).toEqual([...walkGround(avant, creatures).feet]);
    }
}, 120_000);

it('les objets du quai gardent leurs cases : aucun décor bâti ne couvre le sol nu de l’île-port', () => {
  // Les places du quai (quaySpots dans terrain.ts) refusent une case dont le cube du dessus est un décor posé à même le
  // sol ; un décor bâti n'est jamais à ce niveau-là, son nom ne peut donc pas y retirer une case.
  for (const a of ARCHIPELAGO_IDS) {
    const port = getArchipelago(a).port;
    for (const cubes of parties(a)) {
      const sol = new Map<string, number>();
      for (const c of cubes) if (c.sol && c.tag === port) sol.set(`${c.x},${c.y}`, Math.max(sol.get(`${c.x},${c.y}`) ?? -Infinity, c.z));
      for (const c of cubes) if (bati(c) && c.tag === port) expect(c.z, `${a} ${c.decor}`).not.toBe(sol.get(`${c.x},${c.y}`));
    }
  }
  // Et les objets du quai, tout construit, sont là où ils étaient avant les noms (barque, caisses, fanions, foyer) ; à la
  // Plaine, la barque de la grève et le foyer laissent sa place à la boutique de Coco (GD-7, PR 3, retouche du directeur
  // artistique : les objets du quai réservent celle de la petite construction de l'île-port). Depuis GD-11, les îles-ports
  // ont grandi et changé de place : les mêmes objets, à de nouvelles cases ; à la Plaine, de nouveau avec sa forme (GD-12),
  // puis avec sa corne jusqu'à sept cases et son coin de plage (8 octobre 2026) ; au Marché, avec son croissant et son quai
  // (GD-12, 9 octobre 2026).
  const quai = ARCHIPELAGO_IDS.map((a) =>
    [...new Set(parties(a)[1].filter((c) => c.decor && c.tag === getArchipelago(a).port && !bati(c) && !/arbre|sapin|buisson|fleur|rocher|roseau|souche|champignon|cristal/.test(kindOf(c.decor))).map((c) => c.decor))].sort(),
  );
  expect(quai).toMatchInlineSnapshot(`
    [
      [
        "maths-6e-calculation/barque@75,22",
        "maths-6e-calculation/barque@77,10",
        "maths-6e-calculation/caisse@81,14",
        "maths-6e-calculation/fanion@75,15",
        "maths-6e-calculation/fanion@83,16",
        "maths-6e-calculation/foyer@83,21",
      ],
      [
        "maths-5e-proportionality/barque@77,320",
        "maths-5e-proportionality/barque@82,306",
        "maths-5e-proportionality/caisse@86,310",
        "maths-5e-proportionality/fanion@80,310",
        "maths-5e-proportionality/fanion@89,310",
        "maths-5e-proportionality/foyer@91,315",
      ],
      [
        "maths-4e-algebra/barque@70,635",
        "maths-4e-algebra/barque@75,621",
        "maths-4e-algebra/caisse@79,625",
        "maths-4e-algebra/fanion@73,625",
        "maths-4e-algebra/fanion@82,625",
        "maths-4e-algebra/foyer@83,630",
      ],
      [
        "maths-3e-functions/caisse@75,905",
        "maths-3e-functions/fanion@69,905",
        "maths-3e-functions/fanion@78,905",
        "maths-3e-functions/foyer@79,907",
      ],
    ]
  `);
}, 30_000);

// Le Belvédère de Thalès (GD-14, DA et consultant Blocland) : le kiosque de marbre du décor cachait le kiosque de Théo que
// bâtit le plan ; un triangle 3-4-5 de marbre posé au sol, d'un bloc de haut, le remplace.
it('le Belvédère : un triangle 3-4-5 de marbre d’un bloc de haut, qui ne cache ni une borne ni une case des plans, et ne se pose sur aucune', () => {
  const id = 'maths-3e-geometry';
  const index = BIOMES.findIndex((b) => b.id === id);
  const sol = (x: number, y: number) => groundHeight(index, x, y);
  const cases = new Set(TRIANGLE_DU_BELVEDERE.map(([x, y]) => `${x + LAYOUT_PAD.x},${y + LAYOUT_PAD.y}`));
  // Un côté de 3 cases, l'autre de 4, le grand côté en marches : 3 + 4 cases, une marche de moins que la diagonale.
  expect(TRIANGLE_DU_BELVEDERE.filter(([, y]) => y === 0).length).toBe(3);
  expect(TRIANGLE_DU_BELVEDERE.filter(([x]) => x === 7).length).toBe(4);
  const cubes = cubesDeLIle(id, {}, undefined, false).filter((c) => !c.sol && !c.quest && !c.place && cases.has(`${c.x},${c.y}`));
  expect(cubes.length).toBe(TRIANGLE_DU_BELVEDERE.length);
  for (const c of cubes) {
    expect(c.z, `${c.x},${c.y}`).toBe(sol(c.x, c.y) + 1);
  }
  const vers = versLaCamera(id);
  const bornes: BorneVue[] = questStations(id).map((b) => ({ x: b.x, y: b.y, base: sol(b.x, b.y) }));
  for (const b of bornes) expect(cases.has(`${b.x},${b.y}`), `borne ${b.x},${b.y}`).toBe(false);
  // Les cases des plans portent comme une borne (deux cubes sur le sol) : aucune n'est cachée par le triangle.
  const z = zoneDesPlans(id);
  const plans: BorneVue[] = [];
  for (let x = z.x; x < z.x + z.w; x++) for (let y = z.y; y < z.y + z.h; y++) plans.push({ x, y, base: sol(x, y) });
  for (const c of cubes) {
    expect(cacheUneBorne(bornes, vers, c.x, c.y, c.z), `borne, ${c.x},${c.y}`).toBe(false);
    expect(cacheUneBorne(plans, vers, c.x, c.y, c.z), `plan, ${c.x},${c.y}`).toBe(false);
  }
});

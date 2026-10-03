import type { VoxelCube } from './cube';
import { surfaceOf } from '../pixel/surface';
import { getArchipelago } from './archipelago';
import { toutConstruit } from './budget';
import { DECOR_BATI, REPERES } from './decor';
import { champDuSol, landMesh, poseDuDecor, signatureDuChamp } from './landMesh';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from './map';
import { walkGround } from './paths';
import { decorPose, kindOf, propsOf } from './props';
import { creaturePlacements, seaDecor, worldCubes } from './terrain';

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
  // Chaque genre de repère existe quelque part, et les cascades des îles en altitude aussi.
  for (const k of [...REPERES, 'cascade', 'ecueil', 'banc']) expect(vus.has(k), k).toBe(true);
  // Le décor posé (un arbre, un objet du quai) reste du décor posé.
  expect(decorPose('foret/cœur:arbre@8,2')).toBe(true);
  expect(decorPose('phare/barque@3,4')).toBe(true);
  expect(decorPose('volcan/haut-fourneau@3,4')).toBe(false);
  expect(decorPose(undefined)).toBe(false);
});

it('nommer le décor bâti ne fait bouger aucun des quatre archipels : sol, pente, marche, 2D, décor rangé', () => {
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
      // La vue 2D : son sol vu de dessus et ses sprites.
      expect([...surfaceOf(cubes)]).toEqual([...surfaceOf(avant)]);
      const [r, s] = [propsOf(cubes), propsOf(avant)];
      expect(r.props).toEqual(s.props);
      expect(r.stations).toEqual(s.stations);
      expect(r.terrain.length).toBe(s.terrain.length);
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
  // artistique : les objets du quai réservent celle de la petite construction de l'île-port).
  const quai = ARCHIPELAGO_IDS.map((a) =>
    [...new Set(parties(a)[1].filter((c) => c.decor && c.tag === getArchipelago(a).port && !bati(c) && !/arbre|sapin|buisson|fleur|rocher|roseau|souche|champignon|cristal/.test(kindOf(c.decor))).map((c) => c.decor))].sort(),
  );
  expect(quai).toMatchInlineSnapshot(`
    [
      [
        "maths-6e-calculation/barque@75,12",
        "maths-6e-calculation/barque@76,22",
        "maths-6e-calculation/caisse@79,16",
        "maths-6e-calculation/fanion@73,16",
        "maths-6e-calculation/fanion@80,18",
        "maths-6e-calculation/foyer@70,22",
      ],
      [
        "maths-5e-proportionality/barque@80,310",
        "maths-5e-proportionality/barque@87,314",
        "maths-5e-proportionality/caisse@87,317",
        "maths-5e-proportionality/fanion@71,314",
        "maths-5e-proportionality/fanion@87,319",
        "maths-5e-proportionality/foyer@90,317",
      ],
      [
        "maths-4e-algebra/barque@70,635",
        "maths-4e-algebra/barque@73,624",
        "maths-4e-algebra/caisse@77,628",
        "maths-4e-algebra/fanion@65,628",
        "maths-4e-algebra/fanion@81,628",
        "maths-4e-algebra/foyer@80,630",
      ],
      [
        "maths-3e-functions/caisse@66,908",
        "maths-3e-functions/fanion@64,908",
        "maths-3e-functions/fanion@77,908",
        "maths-3e-functions/foyer@76,910",
      ],
    ]
  `);
}, 30_000);

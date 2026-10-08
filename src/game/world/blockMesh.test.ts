import { describe, expect, it } from 'vitest';
import type { VoxelCube } from './cube';
import { blockRegions, buildBlockMesh, buildRegionMesh, chunkFaceCount, GRAIN_LAYER, LAYER_COUNT, layerContent, layerOf, linearRgb, type BlockChunk, type BlockMeshOptions } from './blockMesh';
import { buildMesh, faceCount } from './mesher';
import { TEXTURE_KINDS } from './pixels';
import { toutConstruit } from './budget';
import { worldCubes } from './terrain';
import { hiddenBottomLevel } from './sea';

/** Un point d'une face : sa position, sa normale, ses uv ramenées dans la case (la texture se répète), son allure. */
interface Echantillon {
  p: number[];
  n: number[];
  uv: number[];
  layer: number;
  color: number[];
  glow: number[];
  pass: string;
}

const fract = (v: number) => v - Math.floor(v);

/** Des points au-dedans de chaque quadrilatère (ses quarts), avec leurs uv interpolées. */
function echantillons(chunks: BlockChunk[]): Echantillon[] {
  const out: Echantillon[] = [];
  for (const g of chunks)
    for (let f = 0; f < g.indices.length / 6; f++) {
      const s = g.indices.slice(f * 6, f * 6 + 6);
      const [i0, i1, , , i2, i3] = [s[0], s[1], s[2], s[3], s[4], s[5]];
      const v = (i: number) => g.positions.slice(i * 3, i * 3 + 3);
      const t = (i: number) => g.uvs.slice(i * 2, i * 2 + 2);
      const [P0, P1, P2, P3] = [v(i0), v(i1), v(i2), v(i3)];
      const [T0, T1, T2, T3] = [t(i0), t(i1), t(i2), t(i3)];
      // Un quadrilatère plan et rectangle : P = P0 + s (P1 − P0) + r (P3 − P0), de même pour les uv.
      expect(P2.map((c, k) => c - P1[k] - P3[k] + P0[k]).every((c) => Math.abs(c) < 1e-9)).toBe(true);
      expect(T2.map((c, k) => c - T1[k] - T3[k] + T0[k]).every((c) => Math.abs(c) < 1e-9)).toBe(true);
      const l1 = Math.round(Math.hypot(...P1.map((c, k) => c - P0[k])));
      const l3 = Math.round(Math.hypot(...P3.map((c, k) => c - P0[k])));
      for (let a = 0; a < l1; a++)
        for (let b = 0; b < l3; b++)
          for (const [da, db] of [
            [0.25, 0.25],
            [0.75, 0.3],
            [0.4, 0.8],
          ]) {
            const sa = (a + da) / l1;
            const sb = (b + db) / l3;
            out.push({
              p: P0.map((c, k) => c + sa * (P1[k] - c) + sb * (P3[k] - c)),
              n: g.normals.slice(i0 * 3, i0 * 3 + 3),
              uv: T0.map((c, k) => fract(c + sa * (T1[k] - c) + sb * (T3[k] - c))),
              layer: g.layers[i0],
              color: g.colors.slice(i0 * 3, i0 * 3 + 3),
              glow: g.glows.slice(i0 * 3, i0 * 3 + 3),
              pass: g.pass,
            });
          }
    }
  return out;
}

const cle = (e: Echantillon) => `${e.pass}|${e.n.join(',')}|${e.p.map((c) => c.toFixed(4)).join(',')}`;

/** Les faces fondues dessinent, point par point, la même image que les faces une à une. */
function memeImage(cubes: VoxelCube[], options: BlockMeshOptions = {}) {
  const unes = buildBlockMesh(cubes, options);
  const fondues = buildBlockMesh(cubes, { ...options, fondre: true });
  // Deux cubes à la même place (rare) donnent deux faces au même point : l'une ou l'autre convient.
  const attendu = new Map<string, Echantillon[]>();
  const tous = echantillons(unes);
  for (const e of tous) attendu.set(cle(e), [...(attendu.get(cle(e)) ?? []), e]);
  const vu = echantillons(fondues);
  expect(tous.length).toBeGreaterThan(0);
  expect(vu.length).toBe(tous.length);
  const pareil = (e: Echantillon, a: Echantillon) =>
    e.layer === a.layer &&
    e.color.join() === a.color.join() &&
    e.glow.join() === a.glow.join() &&
    [0, 1].every((k) => Math.abs(e.uv[k] - a.uv[k]) < 1e-6 || Math.abs(Math.abs(e.uv[k] - a.uv[k]) - 1) < 1e-6);
  for (const e of vu) expect((attendu.get(cle(e)) ?? []).some((a) => pareil(e, a)), cle(e)).toBe(true);
  return { unes, fondues };
}

describe('le maillage des blocs en une seule texture', () => {
  it('donne une couche à chaque face de chaque sorte, normale et délavée, et le grain à la couche 0', () => {
    const vues = new Set<number>([GRAIN_LAYER]);
    for (const kind of TEXTURE_KINDS)
      for (const face of ['side', 'top', 'bottom'] as const)
        for (const muted of [false, true]) {
          const l = layerOf(kind, face, muted);
          expect(layerContent(l)).toEqual({ kind, face, muted });
          vues.add(l);
        }
    expect(vues.size).toBe(LAYER_COUNT);
    expect(Math.max(...vues)).toBe(LAYER_COUNT - 1);
  });

  it('lit les couleurs comme Three.js, en linéaire', () => {
    expect(linearRgb('#ffffff')).toEqual([1, 1, 1]);
    expect(linearRgb('#fff')).toEqual([1, 1, 1]);
    expect(linearRgb('#000')).toEqual([0, 0, 0]);
    expect(linearRgb('#808080')[0]).toBeCloseTo(0.2158605, 6);
  });

  it('garde les faces visibles du mailleur, une à une, sans rien fondre', () => {
    const cubes: VoxelCube[] = [
      { x: 0, y: 0, z: 0, color: '#fff', texture: 'herbe' },
      { x: 1, y: 0, z: 0, color: '#fff', texture: 'herbe' },
      { x: 0, y: 0, z: 1, color: '#c33' },
      { x: 3, y: 0, z: 0, color: '#fff', texture: 'verre' },
      { x: 5, y: 0, z: 0, color: '#fff', texture: 'pierre', ghost: true },
    ];
    expect(chunkFaceCount(buildBlockMesh(cubes))).toBe(faceCount(buildMesh(cubes)));
    const passes = new Set(buildBlockMesh(cubes).map((g) => g.pass));
    expect(passes).toEqual(new Set(['opaque', 'glass', 'ghost']));
  });

  it('fond un mur de 4 × 3 cubes en une seule face par côté, la même image', () => {
    const cubes: VoxelCube[] = [];
    for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) cubes.push({ x, y: 0, z, color: '#fff', texture: 'brique' });
    const { fondues } = memeImage(cubes);
    expect(chunkFaceCount(fondues)).toBe(6);
  });

  it('ne fond ni deux textures, ni deux couleurs, ni une île verrouillée avec une ouverte', () => {
    const cubes: VoxelCube[] = [
      { x: 0, y: 0, z: 0, color: '#fff', texture: 'herbe' },
      { x: 1, y: 0, z: 0, color: '#fff', texture: 'terre' },
      { x: 2, y: 0, z: 0, color: '#fff', texture: 'terre', muted: true },
      { x: 3, y: 0, z: 0, color: '#c33' },
      { x: 4, y: 0, z: 0, color: '#3c3' },
    ];
    const { fondues } = memeImage(cubes);
    // Rien de voisin n'a la même allure : les 4 faces de long de chaque cube, et les 2 bouts.
    expect(chunkFaceCount(fondues)).toBe(5 * 4 + 2);
  });

  it('coupe les faces aux bords des morceaux du monde', () => {
    const cubes: VoxelCube[] = [];
    for (let x = 0; x < 40; x++) cubes.push({ x, y: 0, z: 0, color: '#fff', texture: 'pierre' });
    const fondues = buildBlockMesh(cubes, { fondre: true, morceau: 32 });
    expect(new Set(fondues.map((g) => g.key))).toEqual(new Set(['0,0:opaque', '1,0:opaque']));
  });

  it('dessine les Premiers Rivages tout construits avec la même image, en bien moins de faces', () => {
    const { progress, world } = toutConstruit();
    const cubes = worldCubes('6e', progress, world, false);
    const options = { hiddenBottomsUpTo: hiddenBottomLevel('6e') };
    // Point par point, sur un coin de 48 × 48 cases (l'école, ses voisines et leurs ponts) ; tout l'archipel, en faces.
    memeImage(
      cubes.filter((c) => c.x >= 0 && c.x < 48 && c.y >= 0 && c.y < 48),
      options,
    );
    const unes = buildBlockMesh(cubes, options);
    expect(chunkFaceCount(unes)).toBe(faceCount(buildMesh(cubes, [], options)));
    expect(chunkFaceCount(buildBlockMesh(cubes, { ...options, fondre: true }))).toBeLessThan(chunkFaceCount(unes) / 2);
  });

  it('refait le monde région par région : les mêmes faces, et une pose ne change que la région qu’elle touche', () => {
    const { progress, world } = toutConstruit();
    const cubes = worldCubes('6e', progress, world, false);
    const options = { hiddenBottomsUpTo: hiddenBottomLevel('6e') };
    const regions = blockRegions(cubes);
    for (const fondre of [false, true]) {
      const parRegion = [...regions.values()].flatMap((r) => buildRegionMesh(r, { ...options, fondre }));
      const entier = buildBlockMesh(cubes, { ...options, fondre });
      const compte = (chunks: BlockChunk[]) => new Map(chunks.map((g) => [g.key, g.indices.length]));
      expect(compte(parRegion)).toEqual(compte(entier));
    }
    // Un cube posé au bord d'une région : elle change, et sa voisine aussi (le cube cache une de ses faces) ; pas les autres.
    const bord = cubes.find((c) => c.x % 32 === 31 && c.y % 32 > 0 && c.y % 32 < 31 && regions.has(`${Math.floor(c.x / 32) + 1},${Math.floor(c.y / 32)}`))!;
    const r = regions.get(`${Math.floor(bord.x / 32)},${Math.floor(bord.y / 32)}`)!;
    const apres = blockRegions([...cubes, { ...bord, z: bord.z + 1 }]);
    const changees = [...apres.values()].filter((x) => regions.get(x.key)?.signature !== x.signature).map((x) => x.key);
    expect(changees.sort()).toEqual([r.key, `${r.rx + 1},${r.ry}`].sort());
  });
});

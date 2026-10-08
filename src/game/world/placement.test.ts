// Le dessin lié au lieu et sa rotation (GD-9, L1) : un lieu déplacé garde exactement son dessin, et un lieu tourné
// d'un quart de tour tourne d'un bloc, bornes, bâtiments, Gardien, créature et vue compris, dans les
// quatre orientations.
import { afterEach, describe, expect, it } from 'vitest';
import type { BiomeId } from '../biomes';
import { toutConstruit } from './budget';
import { coeurDe, graineDuDessin, islandDef, isLand, isLandInWorld, landBox, landscape, startingIsland } from './map';
import {
  turnedSide,
  SIDES,
  unturnCell,
  ORIENTATIONS,
  placeIslands,
  type Quarts,
  turnCell,
  turnDirection,
  turnModel,
  turnPoint,
  turnRectangle,
} from './placement';
import { grilleDe } from './grid';
import { avatarHome, creaturePlacements, guardianCenter, cubesDeLIle, guardianPlacements, placeDoor, questStations, versLaCamera, viewYaw, worldCubes } from './terrain';
import type { VoxelCube } from './cube';

afterEach(() => placeIslands(null));

/** Pose un lieu à `dx`, `dy` cases de sa place de départ, tourné de `q` quarts de tour. */
function poser(id: BiomeId, dx: number, dy: number, q: Quarts): void {
  const d = startingIsland(id);
  placeIslands(new Map([[id, { x: d.core.x + dx, y: d.core.y + dy, quarts: q }]]));
}

/** Un cube, son nom de décor (qui porte sa case du monde) ramené dans le repère du lieu (`graineDuDessin`, la disposition du moment). */
const sansNomBrut = (c: VoxelCube): VoxelCube => ({ ...c, decor: c.decor === undefined ? undefined : graineDuDessin(c.decor) });

/** Le même, en texte. */
const sansNom = (c: VoxelCube) => JSON.stringify(sansNomBrut(c));

/** Les cubes d'un lieu dans son repère, tout construit. */
function cubesDu(id: BiomeId): VoxelCube[] {
  const { progress, world } = toutConstruit();
  return cubesDeLIle(id, progress, world, true);
}

describe('un quart de tour', () => {
  it('quatre quarts de tour reviennent au départ, et le cœur (16 ou 20 de côté) tourne sur lui-même', () => {
    for (const [debut, fin] of [
      [0, 16],
      [-2, 18],
    ])
      for (let x = debut; x < fin; x++)
        for (let y = debut; y < fin; y++)
          for (const q of ORIENTATIONS) {
            const t = turnCell(x, y, q);
            expect(t.x >= debut && t.x < fin && t.y >= debut && t.y < fin).toBe(true);
            expect(unturnCell(t.x, t.y, q)).toEqual({ x, y });
            let p = { x, y };
            for (let i = 0; i < 4; i++) p = turnCell(p.x, p.y, 1);
            expect(p).toEqual({ x, y });
          }
  });

  it('le devant passe à gauche, une case et son milieu tournent de même', () => {
    expect(turnedSide('devant', 1)).toBe('gauche');
    expect(SIDES.map((c) => turnedSide(c, 2))).toEqual(['derriere', 'gauche', 'devant', 'droite']);
    expect(turnDirection(0, -1, 1)).toEqual({ dx: -1, dy: 0 });
    for (const q of ORIENTATIONS) {
      const c = turnCell(3, 5, q);
      expect(turnPoint(3.5, 5.5, q)).toEqual({ x: c.x + 0.5, y: c.y + 0.5 });
    }
  });

  it('un rectangle échange sa largeur et sa profondeur à chaque quart', () => {
    const r = { x0: -4, y0: -3, x1: 22, y1: 19 };
    for (const q of ORIENTATIONS) {
      const t = turnRectangle(r, q);
      const [w, d] = q % 2 ? [r.y1 - r.y0, r.x1 - r.x0] : [r.x1 - r.x0, r.y1 - r.y0];
      expect([t.x1 - t.x0, t.y1 - t.y0]).toEqual([w, d]);
    }
  });

  it('un modèle tourne sur lui-même, de x et y depuis 0', () => {
    const m = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ];
    expect(turnModel(m, 1)).toEqual([
      { x: 0, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);
    expect(turnModel(turnModel(m, 2), 2)).toEqual(m);
  });
});

describe('le dessin lié au lieu (GD-9, L1)', () => {
  // Un lieu ordinaire, un lieu-école (cœur de 20, village), une île en altitude (cascades), un lieu au lac dessiné.
  const LIEUX: BiomeId[] = ['maths-6e-fractions', 'french-6e-phonology', 'french-4e-agreement', 'lv2-3e-travel'];

  it.each(LIEUX)('%s déplacé garde exactement son dessin (sa côte, son relief, son décor, son îlot)', (id) => {
    const avant = cubesDu(id).map(sansNom).sort();
    const paysage = landscape(islandDef(id)).map((c) => ({ ...c, x: c.x - islandDef(id).core.x, y: c.y - islandDef(id).core.y }));
    poser(id, 40, -24, 0);
    expect(cubesDu(id).map(sansNom).sort()).toEqual(avant);
    const def = islandDef(id);
    expect(landscape(def).map((c) => ({ ...c, x: c.x - def.core.x, y: c.y - def.core.y }))).toEqual(paysage);
    expect(isLand(def, def.core.x + 8, def.core.y + 8)).toBe(true);
  });

  it('le lieu déplacé est à sa nouvelle place dans le monde de son archipel', () => {
    const id: BiomeId = 'maths-6e-fractions';
    const { progress, world } = toutConstruit();
    const avant = worldCubes('6e', progress, world, false).filter((c) => c.tag === id && !c.bridge);
    poser(id, 4, 8, 0);
    const apres = new Set(worldCubes('6e', progress, world, false).filter((c) => c.tag === id && !c.bridge).map((c) => `${c.x},${c.y},${c.z},${c.color}`));
    for (const c of avant) expect(apres.has(`${c.x + 4},${c.y + 8},${c.z},${c.color}`)).toBe(true);
  });
});

describe('un lieu tourné (GD-9, L1), dans les quatre orientations', () => {
  /** Un lieu-école (bornes, école, salle des succès, lieu d'assemblage) et un lieu ordinaire. */
  const LIEUX: BiomeId[] = ['french-6e-phonology', 'maths-6e-fractions'];

  for (const id of LIEUX)
    for (const q of [1, 2, 3] as Quarts[])
      it(`${id}, ${q} quart(s) de tour`, () => {
        const def0 = islandDef(id);
        const a = '6e';
        const { progress, world } = toutConstruit();
        // Tout, à l'orientation 0.
        const cubes0 = cubesDu(id);
        const box0 = landBox(def0);
        const home0 = avatarHome(id);
        const carre0 = guardianCenter(id);
        const portes0 = (['school', 'trophies', 'assembly'] as const).map((p) => placeDoor(p, id));
        const gardien0 = guardianPlacements(a, progress, world.links).find((g) => g.id === id)!;
        const creature0 = creaturePlacements(a, world.links).find((c) => c.id === id)!;
        const yaw0 = viewYaw(id);
        const vers0 = versLaCamera(id);
        const cellsOf = (p: { origin: { x: number; y: number; z: number }; cubes: { x: number; y: number; z: number }[] }) =>
          p.cubes.map((c) => `${p.origin.x + c.x},${p.origin.y + c.y},${p.origin.z + c.z}`).sort();
        const tourne = (x: number, y: number) => {
          const t = turnCell(x - def0.core.x, y - def0.core.y, q);
          return { x: def0.core.x + t.x, y: def0.core.y + t.y };
        };

        // Les cubes attendus : les mêmes, tournés d'un bloc autour du milieu du cœur (bornes, bâtiments, Gardien
        // compris), leur nom de décor dans le repère du lieu.
        const attendus = cubes0.map((c) => JSON.stringify({ ...sansNomBrut(c), ...turnCell(c.x, c.y, q) })).sort();

        poser(id, 0, 0, q);
        const def = islandDef(id);
        expect(def.quarts).toBe(q);
        expect(cubesDu(id).map((c) => JSON.stringify(sansNomBrut(c))).sort()).toEqual(attendus);
        // Le cœur ne bouge pas ; l'emprise échange sa largeur et sa profondeur.
        expect(coeurDe(def)).toEqual(coeurDe(def0));
        const box = landBox(def);
        expect([box.x1 - box.x0, box.y1 - box.y0]).toEqual(q % 2 ? [box0.y1 - box0.y0, box0.x1 - box0.x0] : [box0.x1 - box0.x0, box0.y1 - box0.y0]);
        // La terre se lit tournée dans le monde.
        expect(isLandInWorld(def, tourne(def0.core.x + 8, def0.core.y - 1).x, tourne(def0.core.x + 8, def0.core.y - 1).y)).toBe(isLand(def0, def0.core.x + 8, def0.core.y - 1));
        // La place du bonhomme, les portes, le carré du Gardien, le Gardien, la créature.
        expect(avatarHome(id)).toEqual({ ...tourne(home0.x, home0.y), z: home0.z });
        (['school', 'trophies', 'assembly'] as const).forEach((p, i) => {
          const avant = portes0[i];
          expect(placeDoor(p, id)).toEqual(avant && { ...tourne(avant.x, avant.y), z: avant.z });
        });
        const carre = guardianCenter(id);
        expect({ x: carre.x, y: carre.y }).toEqual(tourne(carre0.x, carre0.y));
        const gardien = guardianPlacements(a, progress, world.links).find((g) => g.id === id)!;
        expect(cellsOf(gardien)).toEqual(cellsOf(gardien0).map((k) => {
          const [x, y, z] = k.split(',').map(Number);
          const t = tourne(x, y);
          return `${t.x},${t.y},${z}`;
        }).sort());
        const creature = creaturePlacements(a, world.links).find((c) => c.id === id)!;
        expect(cellsOf(creature)).toEqual(cellsOf(creature0).map((k) => {
          const [x, y, z] = k.split(',').map(Number);
          const t = tourne(x, y);
          return `${t.x},${t.y},${z}`;
        }).sort());
        // Les bornes : leur ancrage dans la grille tombe sur leurs cubes tournés.
        const quetes = worldCubes(a, progress, world, false).filter((c) => c.quest?.startsWith(`${id}:`));
        const grille = grilleDe(a);
        for (const st of questStations(id)) {
          const p = grille.versMonde(grille.placeDe({ genre: 'borne', id: `${id}:${st.typeId}` })!);
          expect(quetes.some((c) => c.x === p.x && c.y === p.y && c.quest === `${id}:${st.typeId}`)).toBe(true);
        }
        // La vue du lieu tourne avec lui.
        expect(viewYaw(id)).toBeCloseTo(yaw0 + (q * Math.PI) / 2, 9);
        const d = turnDirection(vers0[0], vers0[1], q);
        const vers = versLaCamera(id);
        expect(vers[0]).toBeCloseTo(d.dx, 9);
        expect(vers[1]).toBeCloseTo(d.dy, 9);
        expect(vers[2]).toBeCloseTo(vers0[2], 9);
      });
});

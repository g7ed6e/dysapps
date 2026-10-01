// Chaque île dans son repère (docs/conception/separation-jeu-rendu.md, étape J5) : une île naît en cases depuis le coin
// de son cœur, à son altitude, et la grille la pose dans le monde. Rien ne change dans le monde (les empreintes de J0 le
// gardent) : ces tests disent ce que vaut le repère d'une île.
import { BRIDGES, bridgesOf, islandsOf } from './archipelago';
import { ARCHIPELAGO_IDS } from './archipels';
import { toutConstruit } from './budget';
import { dispositionEnGrille } from './grille';
import { planCells, plansFor } from './plans';
import { bridgePath, cubesDeLIle, origineDe, portsDAttache, questStations, worldCubes } from './terrain';

const { progress, village } = toutConstruit();

describe('Chaque île dans son repère', () => {
  it('le monde commence par ses îles, chacune née dans son repère et posée à son origine', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const monde = worldCubes(a, progress, village, true, []);
      const voisins = new Set<number>();
      const iles = islandsOf(a).flatMap((b) => {
        const o = origineDe(b.id);
        return cubesDeLIle(b.id, progress, village, true, [], voisins).map((c) => ({ ...c, x: c.x + o.x, y: c.y + o.y, z: c.z + o.z }));
      });
      expect(monde.slice(0, iles.length)).toEqual(iles);
    }
  });

  it('une case de plan (x, y, z) est, dans le repère de son île, le cube (x, y, z + 1)', () => {
    const b = islandsOf('6e')[0];
    const cubes = cubesDeLIle(b.id, progress, village, false);
    const plan = plansFor(b.id)[0];
    for (const c of planCells(plan)) expect(cubes.some((k) => k.x === c.x && k.y === c.y && k.z === c.z + 1)).toBe(true);
  });

  it('une case de plan touchée revient à son île (versIle prend l’île la plus proche)', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const g = dispositionEnGrille(a);
      for (const b of islandsOf(a)) {
        const o = origineDe(b.id);
        for (const plan of plansFor(b.id))
          for (const c of planCells(plan)) expect(g.versIle({ x: o.x + c.x, y: o.y + c.y, z: o.z + c.z + 1 }).ile).toBe(b.id);
      }
    }
  });

  it('un ancrage est dans le repère de son île, et versIle est l’inverse de versMonde', () => {
    for (const a of ARCHIPELAGO_IDS) {
      const g = dispositionEnGrille(a);
      for (const b of islandsOf(a)) {
        for (const st of questStations(b.id))
          expect(g.placeDe({ genre: 'borne', id: `${b.id}:${st.typeId}` })).toEqual({ ile: b.id, local: { x: st.x, y: st.y, z: 0 } });
        const home = g.seTenir(b.id);
        expect(g.versIle(g.versMonde(home))).toEqual(home);
        expect(g.versIle(g.versMonde(home), b.id)).toEqual(home);
      }
    }
  });

  it('les ports d’attache : la case où chaque ouvrage touche l’île, dans son repère', () => {
    for (const def of BRIDGES) {
      const path = bridgePath(def);
      for (const [id, bout] of [
        [def.from, path[0]],
        [def.to, path[path.length - 1]],
      ] as const) {
        const port = portsDAttache(id).find((p) => p.ouvrage === def.id)!;
        const o = origineDe(id);
        expect({ x: port.local.x + o.x, y: port.local.y + o.y, z: port.local.z + o.z }).toEqual({ x: bout.x, y: bout.y, z: bout.z });
      }
    }
    for (const a of ARCHIPELAGO_IDS) for (const b of islandsOf(a)) expect(portsDAttache(b.id).length).toBe(bridgesOf(b.id).length);
  });
});

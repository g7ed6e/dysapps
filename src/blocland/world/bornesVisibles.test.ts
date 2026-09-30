// Les bornes de mission dans la vue d'une île, rendu Archipéo : le décor y est dessiné en primitives (world/decorMesh.ts),
// un peu plus large que ses cubes, et les fumées débordent de leurs cases. Aucun de leurs triangles ne se dresse entre
// une borne et la caméra (la règle de world/terrain.ts, `cacheUneBorne`, vérifiée pour Blocland par terrain.test.ts).
import { BIOMES } from '../biomes';
import { toutConstruit } from './budget';
import { sansToursDuCoeur } from './construction';
import type { FacettesDuDecor } from './decor/pinceau';
import { maillageDuDecor, rangerLeDecor } from './decorMesh';
import { champDuSol } from './landMesh';
import { ARCHIPELAGO_IDS } from './map';
import { modelerLeSol } from './modeleDessine';
import { islandCenter, origineDe, questStations, VUE_DE_L_ILE, versLaCamera, viewYaw, worldCubes } from './terrain';

/** Distance du rayon (origine `o`, direction `d`) au triangle `i` de `p`, ou −1 s'il ne le coupe pas (Möller–Trumbore). */
function coupe(o: number[], d: number[], p: Float32Array, i: number): number {
  const e1 = [p[i + 3] - p[i], p[i + 4] - p[i + 1], p[i + 5] - p[i + 2]];
  const e2 = [p[i + 6] - p[i], p[i + 7] - p[i + 1], p[i + 8] - p[i + 2]];
  const h = [d[1] * e2[2] - d[2] * e2[1], d[2] * e2[0] - d[0] * e2[2], d[0] * e2[1] - d[1] * e2[0]];
  const det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2];
  if (Math.abs(det) < 1e-9) return -1;
  const s = [o[0] - p[i], o[1] - p[i + 1], o[2] - p[i + 2]];
  const u = (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]) / det;
  if (u < 0 || u > 1) return -1;
  const q = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
  const v = (d[0] * q[0] + d[1] * q[1] + d[2] * q[2]) / det;
  if (v < 0 || u + v > 1) return -1;
  const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) / det;
  return t > 1e-4 ? t : -1;
}

it('rendu Archipéo : aucun triangle du décor (arbres, rochers, repères, lueurs, fumées au repos) ne cache une borne, partie vierge ou tout construit', () => {
  const tout = toutConstruit();
  for (const a of ARCHIPELAGO_IDS)
    for (const partie of [{ progress: {}, village: { plans: {}, journal: [], bridges: [] } }, tout]) {
      // Comme la vue 3D d'Archipéo (three/cubes.ts) : sans les tours du cœur, le décor en primitives sur le sol modelé.
      const cubes = sansToursDuCoeur(worldCubes(a, partie.progress, partie.village, false, [], true));
      const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
      const champ = champDuSol(a, modelerLeSol(a, cubes.filter((c) => c.sol), reste), reste);
      const m = maillageDuDecor(a, champ, elements);
      const facettes: [string, FacettesDuDecor][] = [
        ['décor', m.decor],
        ['lueurs', m.lueurs],
        ['fumées', m.fumees.facettes],
      ];
      for (const b of BIOMES.filter((x) => x.classe === a)) {
        const o = origineDe(b.id);
        const socles = new Map(cubes.filter((c) => c.quest?.startsWith(`${b.id}:`)).map((c) => [`${c.x},${c.y}`, c.z]));
        // La caméra de la vue de l'île (three/camera.ts), sans le glissement vers un grand repère : de loin (rayons
        // parallèles, comme `cacheUneBorne`) et de sa place, à 30 cases du centre de l'île.
        const vers = versLaCamera(b.id);
        const c = islandCenter(b.id);
        const yaw = -viewYaw(b.id);
        const { dx, dy, up } = VUE_DE_L_ILE;
        const camera = [c.x + 30 * (dx * Math.cos(yaw) - dy * Math.sin(yaw)), c.z + 1 + 30 * up, c.y + 30 * (dx * Math.sin(yaw) + dy * Math.cos(yaw))];
        const cachent: string[] = [];
        for (const st of questStations(b.id)) {
          const bx = o.x + st.x;
          const by = o.y + st.y;
          const base = socles.get(`${bx},${by}`)! - 1;
          // Seuls les triangles proches de la borne et au-dessus de son sol peuvent la cacher.
          const proches = facettes.map(([nom, f]) => {
            const t: number[] = [];
            for (let i = 0; i < f.elements.length; i++) {
              const p = f.positions;
              const k = i * 9;
              const xs = [p[k], p[k + 3], p[k + 6]];
              const ys = [p[k + 1], p[k + 4], p[k + 7]];
              const zs = [p[k + 2], p[k + 5], p[k + 8]];
              if (Math.max(...ys) > base + 1 && Math.max(...xs) > bx - 14 && Math.min(...xs) < bx + 15 && Math.max(...zs) > by - 14 && Math.min(...zs) < by + 15) t.push(i);
            }
            return { nom, f, t };
          });
          for (const u of [0.1, 0.5, 0.9])
            for (const v of [0.1, 0.5, 0.9])
              for (const w of [1.1, 1.5, 2, 2.5, 2.9]) {
                // Repère Three : X = x, Y = hauteur, Z = y.
                const org = [bx + u, base + w, by + v];
                const loin = [camera[0] - org[0], camera[1] - org[1], camera[2] - org[2]];
                const l = Math.hypot(...loin);
                for (const d of [[vers[0], vers[2], vers[1]], loin.map((x) => x / l)])
                  for (const { nom, f, t } of proches)
                    for (const i of t)
                      if (coupe(org, d, f.positions, i * 9) > 0) {
                        cachent.push(`${nom} ${nom === 'fumées' ? '' : m.elements[f.elements[i]]?.genre} devant la borne ${st.typeId}`);
                        break;
                      }
              }
        }
        expect([...new Set(cachent)], `${a}, ${b.id}`).toEqual([]);
      }
    }
}, 120_000);

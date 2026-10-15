// La construction des lieux du monde continu (GD-20, lot 1) : la maison de chaque lieu, posée sur la terre, hors des
// chemins, du lieu et des traces des scénettes ; ses trois étapes, coupées en tranches qui se suivent, de bas en haut ;
// la caméra de la pose. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { CAMERA_FOV, FOLLOW } from './camera';
import { constructionFacets, houseAt, houseCenter, houseFocus, houseFootprint, poseView, POSE_DROP, POSE_SECONDS, WHOLE, type PartShape, type Stage } from './construction';
import { boundsOf } from './facets';
import { distance } from './geometry';
import { networkSamples } from './paths';
import { PLACES } from './plan6e';
import { modelOfPlace } from './places';
import { filetsBasketAt, loadedBoat, sceneSpot } from './questionScene';
import { buildHeightField, heightAt, heightOnMesh } from './terrain';

const field = buildHeightField();
const ground = (x: number, z: number) => heightOnMesh(field, x, z);
const slice = (stage: Stage, from: number, to: number): PartShape => [{ stage, from, to }];

describe('La maison de chaque lieu', () => {
  const paths = networkSamples(0.5);

  it('posée sur la terre, à plat, hors des chemins, à côté du lieu, sans toucher sa scénette ni ses traces', () => {
    for (const p of PLACES) {
      const foot = houseFootprint(p.id);
      const heights = foot.map((q) => heightAt(q));
      // Sur la terre, et presque à plat (le socle rattrape la pente).
      expect(Math.min(...heights)).toBeGreaterThan(0.15);
      expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1.6);
      // Hors des chemins : Kéo n'y passe jamais au travers.
      for (const q of foot) expect(Math.min(...paths.map((s) => distance(s, q)))).toBeGreaterThan(1);
      // Hors de la maquette du lieu, mais assez près pour se lire avec lui.
      const { min, max } = boundsOf(modelOfPlace(p.id).facets);
      const reach = Math.max(-min[0], max[0], -min[2], max[2]);
      const c = houseCenter(p.id);
      expect(distance(c, p.center)).toBeGreaterThan(reach + 3);
      expect(distance(c, p.center)).toBeLessThan(14);
      // Loin du sol de la scénette et des traces (le panier des Filets, la barque des Quais).
      for (const q of foot) expect(distance(q, sceneSpot(p.id))).toBeGreaterThan(3);
      if (p.id === 'filets') for (const q of foot) expect(distance(q, filetsBasketAt())).toBeGreaterThan(2);
      if (p.id === 'quais') for (const q of foot) expect(distance(q, loadedBoat().at)).toBeGreaterThan(3);
    }
  });

  it('un toucher sur la maison mène à son lieu', () => {
    for (const p of PLACES) expect(houseAt(houseCenter(p.id))).toBe(p.id);
    expect(houseAt({ x: 1000, z: 1000 })).toBeNull();
  });

  it('rien avant la première partie ; la construction entière, légère', () => {
    for (const p of PLACES) {
      expect(constructionFacets(p.id, [], ground).triangles).toBe(0);
      const whole = constructionFacets(p.id, [WHOLE], ground).triangles;
      expect(whole).toBeGreaterThan(150);
      expect(whole).toBeLessThan(600);
    }
  });

  it('chaque étape, coupée en deux ou en trois rangées, se pose une fois : rien de dessiné deux fois, rien d’oublié', () => {
    for (const p of PLACES)
      for (const stage of [0, 1, 2] as const) {
        const whole = constructionFacets(p.id, [slice(stage, 0, 1)], ground).triangles;
        expect(whole).toBeGreaterThan(0);
        for (const m of [2, 3]) {
          const cut = Array.from({ length: m }, (_, k) => constructionFacets(p.id, [slice(stage, k / m, (k + 1) / m)], ground).triangles);
          expect(cut.reduce((s, n) => s + n, 0)).toBe(whole);
          // Le corps se coupe en rangées qui ont chacune leurs volumes.
          if (stage === 0) for (const n of cut) expect(n).toBeGreaterThan(0);
        }
      }
  });

  it('les rangées se posent de bas en haut : la première tranche du corps est la plus basse', () => {
    for (const p of PLACES) {
      const low = boundsOf(constructionFacets(p.id, [slice(0, 0, 1 / 3)], ground));
      const high = boundsOf(constructionFacets(p.id, [slice(0, 2 / 3, 1)], ground));
      expect(high.max[1]).toBeGreaterThan(low.max[1]);
      // Le toit est plus haut que les murs.
      const roof = boundsOf(constructionFacets(p.id, [slice(1, 0.5, 1)], ground));
      expect(roof.max[1]).toBeGreaterThan(high.max[1]);
    }
  });
});

describe('La pose d’une partie', () => {
  it('la caméra de la pose regarde la maison du sud, tournée vers le nord, au champ de la caméra qui suit', () => {
    for (const p of PLACES) {
      const pose = poseView(p.id, ground, { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: CAMERA_FOV, lens: 1 });
      const f = houseFocus(p.id, ground);
      expect(pose.fov).toBe(FOLLOW.fov);
      expect(pose.lens).toBe(0);
      expect(pose.position.x).toBe(f.x);
      expect(pose.position.z).toBeGreaterThan(f.z);
      expect(pose.position.y).toBeGreaterThan(f.y);
      // Assez haute pour ne pas être sous le sol entre elle et la maison.
      for (let t = 0; t <= 1; t += 0.1) {
        const x = pose.position.x + (pose.target.x - pose.position.x) * t;
        const z = pose.position.z + (pose.target.z - pose.position.z) * t;
        const y = pose.position.y + (pose.target.y - pose.position.y) * t;
        expect(y).toBeGreaterThan(ground(x, z));
      }
    }
  });

  it('courte : quelques secondes en tout, une descente de moins d’une seconde', () => {
    const total = POSE_SECONDS.rise + POSE_SECONDS.drop + POSE_SECONDS.look + POSE_SECONDS.back;
    expect(total).toBeLessThanOrEqual(4);
    expect(POSE_SECONDS.drop).toBeLessThan(1);
    expect(POSE_SECONDS.still).toBeLessThanOrEqual(2);
    expect(POSE_DROP).toBeGreaterThan(0);
  });
});

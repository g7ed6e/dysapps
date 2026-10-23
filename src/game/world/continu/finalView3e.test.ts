// La vue finale du 3e (GD-25 ; relecture du Cirque, correction 1) : lente, sans à-coup, de jour ; elle s'élève au-dessus
// du Cirque, montre au sud-ouest les trois archipels rallumés, puis au nord la lumière du port des Ferrailleurs, Kéo dans
// l'image sans jamais en toucher le bord ; avec « Réduire les animations », l'image fixe, la dernière.
import { describe, expect, it } from 'vitest';
import type { CameraPose } from './camera';
import { FAR_ARCHIPELAGOS_3E, FINAL_NORTH_LIGHT_3E, FINAL_POSES_3E, FINAL_VIEW_3E, FINAL_VIEW_SECONDS_3E, farArchipelagos3e, finalViewPose3e } from './finalView3e';
import { distance, type Vec3 } from './geometry';
import { levelWorld } from './levelWorld';
import { PEAK_3E, PLACES_3E } from './plan3e';
import { landDistance3e } from './terrain3e';

const blank = (): CameraPose => ({ position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 0, lens: 0 });

/** La caméra qui suit Kéo à la porte du Fanal, au départ de la vue. */
const fanal = PLACES_3E.find((p) => p.id === 'fanal')!.center;
const FROM: CameraPose = { position: { x: fanal.x, y: 9, z: fanal.z + 24 }, target: { x: fanal.x, y: 7, z: fanal.z + 14 }, fov: 56, lens: 0 };
const KEO: Vec3 = { x: fanal.x, y: 2.7, z: fanal.z + 9 };

/** L'angle d'un point sous l'axe du regard, en degrés (positif : sous lui), et à sa droite. */
function angles(p: CameraPose, q: Vec3): { right: number; down: number } {
  const f = { x: p.target.x - p.position.x, y: p.target.y - p.position.y, z: p.target.z - p.position.z };
  const fl = Math.hypot(f.x, f.y, f.z);
  const fx = f.x / fl, fy = f.y / fl, fz = f.z / fl;
  // La droite de l'écran : avant × haut ; le haut de l'écran : droite × avant.
  let rx = -fz, rz = fx;
  const rl = Math.hypot(rx, rz);
  rx /= rl;
  rz /= rl;
  const ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;
  const d = { x: q.x - p.position.x, y: q.y - p.position.y, z: q.z - p.position.z };
  const ahead = d.x * fx + d.y * fy + d.z * fz;
  return { right: (Math.atan2(d.x * rx + d.z * rz, ahead) * 180) / Math.PI, down: (-Math.atan2(d.x * ux + d.y * uy + d.z * uz, ahead) * 180) / Math.PI };
}

/** La pente du regard sous l'horizon, en degrés. */
const pitch = (p: CameraPose): number => (Math.atan2(p.position.y - p.target.y, Math.hypot(p.target.x - p.position.x, p.target.z - p.position.z)) * 180) / Math.PI;

/** Le demi-champ horizontal de la tablette (1024 × 768) et du téléphone en paysage (844 × 390), le champ vertical étant de 56°. */
const HALF_V = 28;
const halfH = (ratio: number) => (Math.atan(Math.tan((HALF_V * Math.PI) / 180) * ratio) * 180) / Math.PI;

describe('La vue finale du 3e', () => {
  it('se joue au Fanal restauré, une fois l’allumage fini ; elle dure moins de 25 secondes, l’image fixe 8', () => {
    const v = levelWorld('3e').finalView!;
    expect(v.place).toBe('fanal');
    expect(v.seconds).toBe(FINAL_VIEW_SECONDS_3E);
    expect(v.seconds).toBeLessThan(25);
    expect(v.still).toBe(FINAL_VIEW_3E.still);
    for (const l of ['6e', '5e', '4e'] as const) expect(levelWorld(l).finalView).toBeUndefined();
  });

  it('part de la caméra qui suit, sans saut, et monte lentement, sans à-coup', () => {
    const p = finalViewPose3e(0, FROM, blank());
    expect(p.position).toEqual(FROM.position);
    expect(p.target).toEqual(FROM.target);
    // À chaque dixième de seconde, la caméra se déplace de moins de 1,3 unité (au plus 13 unités par seconde, Kéo en
    // mesure 2,4), et elle ne redescend jamais pendant la montée.
    let last = finalViewPose3e(0, FROM, blank());
    for (let t = 0.1; t <= FINAL_VIEW_SECONDS_3E; t += 0.1) {
      const now = finalViewPose3e(t, FROM, blank());
      expect(Math.hypot(now.position.x - last.position.x, now.position.y - last.position.y, now.position.z - last.position.z), `${t}`).toBeLessThan(1.3);
      if (t <= FINAL_VIEW_3E.rise) expect(now.position.y).toBeGreaterThanOrEqual(last.position.y - 1e-9);
      // Le regard ne plonge jamais vers les nuages : quelques degrés sous l'horizon, jamais plus de 20.
      expect(pitch(now), `${t}`).toBeLessThan(20);
      last = now;
    }
  });

  it('s’élève au-dessus du Cirque : au-dessus de la terre, bien plus haut que la caméra qui suit, jamais dans le pic', () => {
    for (const k of ['southWest', 'north'] as const) {
      const p = FINAL_POSES_3E[k].position;
      expect(landDistance3e(p)).toBeGreaterThan(20);
      expect(p.y).toBeGreaterThan(FROM.position.y + 15);
      expect(distance(p, PEAK_3E.at)).toBeGreaterThan(PEAK_3E.radius);
    }
  });

  it('montre au sud-ouest les trois archipels, entiers dans l’image, de la tablette au téléphone', () => {
    const p = finalViewPose3e(FINAL_VIEW_3E.rise + 0.5, FROM, blank());
    const half = halfH(1024 / 768);
    for (const a of Object.values(FAR_ARCHIPELAGOS_3E)) {
      expect(a.x).toBeLessThan(p.position.x);
      expect(a.z).toBeGreaterThan(p.position.z);
      const s = angles(p, { x: a.x, y: 10, z: a.z });
      expect(Math.abs(s.right)).toBeLessThan(half - 6);
      expect(Math.abs(s.down)).toBeLessThan(HALF_V - 6);
      // Loin sur la mer de nuages, au-delà des rives.
      expect(landDistance3e(a)).toBeLessThan(-60);
    }
  });

  it('finit au nord : la lumière du port et le Fanal dans l’image, Kéo dans le tiers bas, jamais au bord', () => {
    for (const still of [false, true]) {
      const p = still ? finalViewPose3e(0, FROM, blank(), true) : finalViewPose3e(FINAL_VIEW_SECONDS_3E - 0.1, FROM, blank());
      for (const ratio of [1024 / 768, 844 / 390]) {
        const half = halfH(ratio);
        const light = angles(p, FINAL_NORTH_LIGHT_3E);
        expect(Math.abs(light.right)).toBeLessThan(half - 8);
        expect(light.down).toBeLessThan(0);
        const top = angles(p, { x: fanal.x, y: 22, z: fanal.z - 1 });
        expect(Math.abs(top.right)).toBeLessThan(half - 8);
        // Le Fanal et le port ne se couvrent pas : plus de 10° entre eux.
        expect(Math.abs(top.right - light.right)).toBeGreaterThan(10);
        const keo = angles(p, KEO);
        expect(Math.abs(keo.right)).toBeLessThan(half - 8);
        expect(keo.down).toBeGreaterThan(0);
        expect(keo.down).toBeLessThan(HALF_V - 6);
      }
    }
  });

  it('les archipels : trois repères au loin, peu de triangles, rien de presque noir, la lumière d’ocre à chacun', () => {
    const f = farArchipelagos3e();
    expect(f.triangles).toBeLessThan(300);
    for (let i = 0; i < f.colors.length; i += 3) expect(Math.max(f.colors[i], f.colors[i + 1], f.colors[i + 2])).toBeGreaterThan(0.1);
  });
});

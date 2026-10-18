// Les abords de la Halle : rien de haut tout près du point visé, ni entre la caméra de face et la scène ; la maison du
// couvreur derrière la Halle, dans la moitié droite du cadre de face (leur poids : ./surroundings.test.ts). Sans Three.js.
import { describe, expect, it } from 'vitest';
import { COMMONS_SURROUNDINGS, RING } from './commonsSurroundings';
import { screenOf } from './camera';
import { questionLayout } from './questionScene';
import { scenetteHabitant, scenetteKeo, scenetteLayout, scenettePose, scenetteSurroundings } from './scenette';

const keo = scenetteKeo('commons').at;
const couvreur = scenetteHabitant('commons');
// Le point visé : entre Kéo et le couvreur, un rien au sud de leur ligne ; le sol de la scène, sous leurs pieds.
const target = { x: (keo.x + couvreur.x) / 2, z: keo.z };
const floorY = keo.y;

describe('les abords de la Halle', () => {
  const f = scenetteSurroundings('commons');

  it('ne dressent rien au-dessus du genou de Kéo tout près du point visé', () => {
    const p = f.positions;
    for (let k = 0; k < p.length; k += 3) {
      if (Math.hypot(p[k] - target.x, p[k + 2] - target.z) > RING) continue;
      expect(p[k + 1]).toBeLessThan(floorY + 1);
    }
  });

  it('ne dressent rien entre la caméra de face et la scène, hors du panneau de consigne', () => {
    // La bande que la caméra de face regarde au sud de la scène : de la gauche de Kéo (le bord du panneau) au-delà du
    // couvreur ; tout ce qui y est reste au ras du sol.
    const p = f.positions;
    for (let k = 0; k < p.length; k += 3) {
      const [x, y, z] = [p[k], p[k + 1], p[k + 2]];
      if (z > keo.z + 0.5 && z < keo.z + 16 && x > keo.x - 0.5 && x < couvreur.x + 2.5) expect(y).toBeLessThan(floorY + 0.3);
    }
  });

  it('posent la maison du couvreur dans la moitié droite du cadre de face, l’échelle à l’écart du couvreur', () => {
    const H = COMMONS_SURROUNDINGS.house;
    expect(H.dz).toBeLessThan(-10);
    const [w, h] = [1024, 768];
    const base = questionLayout({ count: 3 }, w, h);
    const stage = scenetteLayout({ count: 3, column: true }, w, h, base).scenette!.stage;
    const { pose, shift } = scenettePose('commons', stage, w, h);
    const screenX = (x: number, y: number, z: number) => screenOf(pose, { x, y, z }, w, h).x - shift.x;
    const o = { x: target.x, z: keo.z - 0.6 };
    const front = o.z + H.dz + H.depth / 2;
    // La maison entière entre le milieu de la scène et le bord droit de l'écran.
    const mid = (stage.left + stage.right) / 2;
    for (const u of [-H.width / 2, H.width / 2]) {
      const x = screenX(o.x + H.dx + u, floorY + 1, front);
      expect(x).toBeGreaterThan(mid);
      expect(x).toBeLessThan(w);
    }
    // L'échelle ne se dresse pas derrière la tête du couvreur : à plus de 30 pixels de lui.
    const ladder = screenX(o.x + H.dx + H.ladder, floorY + 1.5, front + 0.75);
    expect(Math.abs(ladder - screenX(couvreur.x, couvreur.y + 1.5, couvreur.z))).toBeGreaterThan(30);
  });
});

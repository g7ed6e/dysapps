// La caméra qui suit et la rangée du bas (« Y aller » et sa bulle), à tous les niveaux : les pieds de Kéo restent
// au-dessus, jusqu'à 60 % de l'écran, et le regard levé vers le haut d'un lieu (le Phare) en tient compte. Sans Three.js.
import { describe, expect, it } from 'vitest';
import { followPose, keepFeetAbove, lookUp, screenOf } from './camera';

const W = 1024;
const H = 768;
const feet = { x: 0, y: 0, z: 0 };

describe('La caméra et la bulle d’arrivée au plus grand texte (consultant UX UI, piste « Remonter Kéo dans l’image »)', () => {
  it('les pieds de Kéo au-dessus de la rangée du bas, bulle comprise, jusqu’à 60 % de l’écran', () => {
    // 120 : « Y aller » et une bulle d'une ligne ; 416 : la bulle de deux lignes, interligne et espacements au plus grand.
    for (const room of [120, 300, 416]) {
      const pose = followPose(feet, 0, undefined, 0);
      keepFeetAbove(pose, feet, room, H);
      expect(screenOf(pose, feet, W, H).y, `${room}`).toBeLessThanOrEqual(H - room + 1e-6);
    }
    // Au-delà, la garde s'arrête à 60 % : le regard ne plonge pas sans fin.
    const pose = followPose(feet, 0, undefined, 0);
    keepFeetAbove(pose, feet, 700, H);
    expect(screenOf(pose, feet, W, H).y).toBeCloseTo(H * 0.4, 0);
  });

  it('le regard levé vers un haut de lieu garde Kéo au-dessus de la rangée mesurée, avant de plonger', () => {
    const top = { x: 0, y: 16, z: -6 };
    for (const room of [0, 160, 300]) {
      const pose = followPose(feet, 0, undefined, 0);
      lookUp(pose, top, feet, 1, H, undefined, room);
      const before = { ...pose.target };
      keepFeetAbove(pose, feet, room, H);
      // `lookUp` a déjà fait la place : `keepFeetAbove` n'a plus rien à changer.
      expect(pose.target.y, `${room}`).toBeCloseTo(before.y, 6);
      expect(screenOf(pose, feet, W, H).y, `${room}`).toBeLessThanOrEqual(H - Math.max(78, room) + 1e-6);
    }
  });
});

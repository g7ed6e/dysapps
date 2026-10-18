// Les pastilles des habitants à l'écran (GD-20, point 4, lots L1 et L2) : à 844 × 390, la pastille d'un lieu hors champ
// mordait la marque du même lieu et la colonne des boutons (consultant UX UI, avis sur les lots L2 et L3) ; elle se pose
// à côté, sans rien toucher, et ne bouge pas quand sa place est libre.
import { describe, expect, it } from 'vitest';
import { clearSign, type SignArea } from './HabitantSigns';

/** 844 × 390 : la colonne des accès directs (la zone que la marque évite), Réglages, et la marque « Le Phare » au bord. */
const area = (markShown = true): SignArea => ({
  width: 844,
  height: 390,
  obstacles: [
    { left: 0, top: 0, width: 80, height: 212, below: true },
    { left: 776, top: 12, width: 56, height: 56 },
  ],
  mark: { left: 125, top: 28, width: 184, height: 58, shown: markShown },
});
const SIZE = 48;
const touches = (c: { x: number; y: number }, o: { left: number; top: number; width: number; height: number }) =>
  c.x - SIZE / 2 < o.left + o.width && o.left < c.x + SIZE / 2 && c.y - SIZE / 2 < o.top + o.height && o.top < c.y + SIZE / 2;

describe('La place d’une pastille', () => {
  it('libre, elle ne bouge pas', () => {
    expect(clearSign(500, 200, area())).toBeNull();
  });

  it('sur la marque et le coin de la colonne (844 × 390) : posée sous la marque, sans toucher la marque, la colonne ni un bouton, et dans l’écran', () => {
    const a = area();
    const c = clearSign(113, 25, a)!;
    expect(c).not.toBeNull();
    for (const o of [...a.obstacles, a.mark]) expect(touches(c, o), JSON.stringify(o)).toBe(false);
    // Juste sous la marque, à son bord gauche.
    expect(c.x - SIZE / 2).toBe(a.mark.left);
    expect(c.y - SIZE / 2).toBe(a.mark.top + a.mark.height + 8);
    expect(c.x - SIZE / 2).toBeGreaterThanOrEqual(0);
    expect(c.y - SIZE / 2).toBeGreaterThanOrEqual(0);
    expect(c.x + SIZE / 2).toBeLessThanOrEqual(844);
    expect(c.y + SIZE / 2).toBeLessThanOrEqual(390);
  });

  it('sans marque, seule la colonne compte', () => {
    expect(clearSign(300, 25, area(false))).toBeNull();
    const c = clearSign(60, 60, area(false))!;
    expect(touches(c, area(false).obstacles[0])).toBe(false);
  });
});

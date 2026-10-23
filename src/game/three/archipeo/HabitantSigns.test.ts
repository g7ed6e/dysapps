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

describe('Quatre pastilles ensemble (trois habitants et la Nef, GD-25 ; consultant UX UI, lot 2 des restes du 3e)', () => {
  /** 844 × 390 : la colonne, Réglages, la colonne de droite (le nord, tourner), la Carte et « Y aller ». */
  const phone = (): SignArea => ({
    width: 844,
    height: 390,
    obstacles: [
      { left: 0, top: 0, width: 80, height: 212, below: true },
      { left: 776, top: 12, width: 56, height: 56 },
      { left: 776, top: 84, width: 56, height: 184 },
      { left: 12, top: 308, width: 84, height: 66 },
      { left: 384, top: 318, width: 168, height: 56 },
    ],
    mark: { left: 427, top: 8, width: 136, height: 50, shown: true },
  });
  const rectOf = (c: { x: number; y: number }) => ({ left: c.x - SIZE / 2, top: c.y - SIZE / 2, width: SIZE, height: SIZE });

  /** Pose les pastilles dans l'ordre (les habitants, puis la Nef), comme `placeSigns`. */
  function place(points: readonly { x: number; y: number }[], a: SignArea) {
    const placed: { left: number; top: number; width: number; height: number }[] = [];
    for (const p of points) placed.push(rectOf(clearSign(p.x, p.y, a, placed) ?? p));
    return placed;
  }

  it('serrées au même endroit, ou sur la marque et « Y aller » : aucune ne mord une autre, la marque ni un bouton, toutes dans l’écran', () => {
    const a = phone();
    const cases = [
      // Les quatre au même point, au milieu de l'écran.
      [{ x: 400, y: 180 }, { x: 400, y: 180 }, { x: 400, y: 180 }, { x: 400, y: 180 }],
      // À quelques pixels l'une de l'autre, la Nef par-dessus un habitant.
      [{ x: 300, y: 140 }, { x: 330, y: 150 }, { x: 360, y: 140 }, { x: 315, y: 160 }],
      // Sous la marque, au bord de la colonne de droite et sur « Y aller ».
      [{ x: 450, y: 60 }, { x: 470, y: 70 }, { x: 760, y: 120 }, { x: 460, y: 330 }],
    ];
    for (const points of cases) {
      const placed = place(points, a);
      for (let i = 0; i < placed.length; i++) {
        const c = { x: placed[i].left + SIZE / 2, y: placed[i].top + SIZE / 2 };
        for (const o of [...a.obstacles, a.mark]) expect(touches(c, o), `${i} ${JSON.stringify(o)}`).toBe(false);
        for (let j = 0; j < i; j++) expect(touches(c, placed[j]), `${i} sur ${j}`).toBe(false);
        expect(placed[i].left).toBeGreaterThanOrEqual(0);
        expect(placed[i].top).toBeGreaterThanOrEqual(0);
        expect(placed[i].left + SIZE).toBeLessThanOrEqual(844);
        expect(placed[i].top + SIZE).toBeLessThanOrEqual(390);
      }
    }
  });

  it('écartées, aucune ne bouge', () => {
    const a = phone();
    const points = [{ x: 200, y: 250 }, { x: 300, y: 150 }, { x: 600, y: 200 }, { x: 680, y: 120 }];
    const placed: ReturnType<typeof rectOf>[] = [];
    for (const p of points) {
      expect(clearSign(p.x, p.y, a, placed)).toBeNull();
      placed.push(rectOf(p));
    }
  });
});

import { describe, expect, it } from 'vitest';
import { ecarterDesObstacles, layoutLabels, separateMark, type LabelBox } from './labelLayout';
import { drawIslandLabel, measureIslandLabel } from './labelCanvas';

const overlaps = (a: LabelBox, b: LabelBox) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

describe('layoutLabels', () => {
  it('laisse à leur place les étiquettes qui ne se touchent pas', () => {
    const out = layoutLabels([
      { x: 100, y: 100, w: 80, h: 40 },
      { x: 300, y: 100, w: 80, h: 40 },
    ]);
    expect(out).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
    ]);
  });

  it("écarte les étiquettes qui se chevauchent, la première gardant sa place", () => {
    const boxes: LabelBox[] = [
      { x: 200, y: 200, w: 160, h: 60 },
      { x: 230, y: 210, w: 160, h: 60 },
      { x: 180, y: 190, w: 140, h: 60 },
    ];
    const out = layoutLabels(boxes);
    expect(out[0]).toEqual({ dx: 0, dy: 0 });
    const placed = boxes.map((b, i) => ({ ...b, x: b.x + out[i].dx, y: b.y + out[i].dy }));
    for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) expect(overlaps(placed[i], placed[j])).toBe(false);
  });

  it("fait rentrer dans l'écran une étiquette qui déborde", () => {
    const [o] = layoutLabels([{ x: 380, y: 10, w: 100, h: 40 }], 4, { w: 400, h: 300 });
    expect(380 + o.dx + 50).toBeLessThanOrEqual(400);
    expect(10 + o.dy - 20).toBeGreaterThanOrEqual(0);
  });
});

describe('les repères de la Carte', () => {
  it("n'écarte pas la flèche d'un fanion lointain", () => {
    expect(separateMark({ x: 100, y: 100 }, { x: 300, y: 100 }, 56)).toEqual({ dx: 0, dy: 0 });
  });

  it("écarte de côté la flèche posée sur le fanion (même île)", () => {
    const o = separateMark({ x: 100, y: 100 }, { x: 100, y: 104 }, 56);
    expect(Math.abs(o.dx)).toBeGreaterThanOrEqual(50);
    expect(o.dy).toBe(0);
  });

  it('ne pose aucune étiquette sur un obstacle (la flèche, le fanion)', () => {
    const arrow: LabelBox = { x: 200, y: 200, w: 40, h: 48 };
    const [o] = layoutLabels([{ x: 200, y: 210, w: 160, h: 60 }], 4, undefined, undefined, [arrow]);
    expect(overlaps({ x: 200 + o.dx, y: 210 + o.dy, w: 160, h: 60 }, arrow)).toBe(false);
  });
});

/** Un faux contexte 2D : chaque caractère mesure une demi-taille de police, les tracés sont notés. */
function fakeCtx() {
  const texts: string[] = [];
  let font = '700 10px Arial';
  const noop = () => {};
  const ctx = {
    get font() {
      return font;
    },
    set font(f: string) {
      font = f;
    },
    measureText: (t: string) => ({ width: t.length * Number(/(\d+)px/.exec(font)![1]) * 0.5 }),
    fillText: (t: string) => texts.push(t),
    save: noop,
    restore: noop,
    fillRect: noop,
    beginPath: noop,
    arc: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    translate: noop,
    rotate: noop,
  } as unknown as CanvasRenderingContext2D;
  return { ctx, texts };
}

describe("l'étiquette d'une île", () => {
  it("s'agrandit d'une ligne avec l'état, qui s'écrit en mot", () => {
    const { ctx, texts } = fakeCtx();
    const one = measureIslandLabel(ctx, 'Forêt des sons', 40);
    const two = measureIslandLabel(ctx, 'Forêt des sons', 40, { id: 'en-chantier', name: 'En chantier' });
    expect(two.h).toBeGreaterThan(one.h * 1.6);
    drawIslandLabel(ctx, 'Forêt des sons', 100, 100, 40, { id: 'en-chantier', name: 'En chantier' });
    expect(texts).toEqual(['Forêt des sons', 'En chantier']);
  });

  it("s'élargit si le mot de l'état est plus long que le nom", () => {
    const { ctx } = fakeCtx();
    const plain = measureIslandLabel(ctx, 'Mine', 40);
    const withState = measureIslandLabel(ctx, 'Mine', 40, { id: 'a-explorer', name: 'À explorer' });
    expect(withState.w).toBeGreaterThan(plain.w);
  });
});

describe('ecarterDesObstacles', () => {
  const phare: LabelBox = { x: 370, y: 230, w: 30, h: 200 };

  it('ne bouge pas les étiquettes qui ne couvrent aucun obstacle', () => {
    const boxes: LabelBox[] = [
      { x: 540, y: 227, w: 200, h: 32 },
      { x: 800, y: 140, w: 200, h: 32 },
    ];
    expect(ecarterDesObstacles(boxes, [phare], 6)).toEqual([
      { dx: 0, dy: 0 },
      { dx: 0, dy: 0 },
    ]);
  });

  it('écarte de la colonne d’un grand repère l’étiquette qui la touche, au plus près, sans la poser sur une autre', () => {
    const boxes: LabelBox[] = [
      { x: 393, y: 118, w: 240, h: 32 },
      { x: 560, y: 150, w: 200, h: 32 },
    ];
    const out = ecarterDesObstacles(boxes, [phare], 6, { w: 1024, h: 616 });
    expect(out[1]).toEqual({ dx: 0, dy: 0 });
    const moved = { ...boxes[0], x: boxes[0].x + out[0].dx, y: boxes[0].y + out[0].dy };
    expect(overlaps(moved, phare)).toBe(false);
    expect(overlaps(moved, boxes[1])).toBe(false);
    // Au-dessus de son île : elle ne descend pas plus bas que nécessaire.
    expect(Math.hypot(out[0].dx, out[0].dy)).toBeLessThan(160);
  });

  it('fait rentrer dans le cadre une étiquette coupée par son bord, pas celle d’une île hors du cadre', () => {
    const bounds = { w: 1024, h: 616 };
    const out = ecarterDesObstacles(
      [
        { x: 1000, y: 245, w: 200, h: 32 },
        { x: 1300, y: 245, w: 200, h: 32 },
      ],
      [phare],
      6,
      bounds,
    );
    expect(out[0]).toEqual({ dx: 1024 - 100 - 6 - 1000, dy: 0 });
    expect(out[1]).toEqual({ dx: 0, dy: 0 });
  });
});

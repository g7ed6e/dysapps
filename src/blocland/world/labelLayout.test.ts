import { describe, expect, it } from 'vitest';
import { ecarterDesObstacles, entiere, layoutLabels, montrees, placerEtiquettes, separateMark, type LabelBox } from './labelLayout';
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

describe('étiquettes entières ou absentes (DA-10)', () => {
  const cadre = { w: 1024, h: 768 };
  // Le panneau « Prochaine destination » de la Carte, en haut à gauche (capture 3e-carte).
  const panneau: LabelBox = { x: 480, y: 197, w: 680, h: 208 };

  it('écarte de la Carte l’étiquette posée sous le panneau, et la montre entière', () => {
    const boxes: LabelBox[] = [
      { x: 580, y: 312, w: 254, h: 50 },
      { x: 603, y: 450, w: 216, h: 50 },
    ];
    const out = layoutLabels(boxes, 6, cadre, [1, 1], [panneau]);
    const moved = { ...boxes[0], x: boxes[0].x + out[0].dx, y: boxes[0].y + out[0].dy };
    expect(overlaps(moved, panneau)).toBe(false);
    expect(entiere(boxes[0], out[0], [panneau], cadre)).toBe(true);
    expect(entiere(boxes[1], out[1], [panneau], cadre)).toBe(true);
  });

  it('cache l’étiquette que l’interface couvre en partie, ou que coupe le bord du cadre', () => {
    const zero = { dx: 0, dy: 0 };
    expect(entiere({ x: 580, y: 312, w: 254, h: 50 }, zero, [panneau], cadre)).toBe(false);
    expect(entiere({ x: 1000, y: 400, w: 200, h: 32 }, zero, [], cadre)).toBe(false);
    expect(entiere({ x: 800, y: 400, w: 200, h: 32 }, zero, [panneau], cadre)).toBe(true);
    // Collée au bord sans le passer : entière.
    expect(entiere({ x: 924, y: 400, w: 200, h: 32 }, zero, [], cadre)).toBe(true);
  });

  it('hors de la Carte, seule l’étiquette posée sur l’interface s’en écarte', () => {
    const menu: LabelBox = { x: 985, y: 117, w: 50, h: 50 };
    const out = ecarterDesObstacles(
      [
        { x: 950, y: 120, w: 150, h: 32 },
        { x: 400, y: 400, w: 150, h: 32 },
      ],
      [menu],
      6,
      cadre,
    );
    expect(out[1]).toEqual({ dx: 0, dy: 0 });
    expect(entiere({ x: 950, y: 120, w: 150, h: 32 }, out[0], [menu], cadre)).toBe(true);
  });

  it('de deux étiquettes qui se couvrent encore, montre celle de l’île ouverte, puis la première', () => {
    const zero = { dx: 0, dy: 0 };
    const boxes: LabelBox[] = [
      { x: 300, y: 300, w: 200, h: 40 },
      { x: 320, y: 320, w: 200, h: 40 },
      { x: 700, y: 300, w: 200, h: 40 },
    ];
    expect(montrees(boxes, [zero, zero, zero], [], cadre)).toEqual([true, false, true]);
    expect(montrees(boxes, [zero, zero, zero], [], cadre, [0.5, 1, 1])).toEqual([false, true, true]);
  });

  it('cache l’étiquette dont l’île est sous l’interface, ou qui a dû s’écarter trop loin de son île', () => {
    const b: LabelBox = { x: 580, y: 250, w: 254, h: 50 };
    // L'île sous le panneau : même descendue sous lui, l'étiquette ne désigne rien.
    expect(montrees([b], [{ dx: 0, dy: 60 }], [panneau], cadre)).toEqual([false]);
    // Loin de son île (plus d'une hauteur et demie entre l'étiquette et l'île) : cachée ; tout près, même décalée : montrée.
    const libre: LabelBox = { x: 580, y: 450, w: 254, h: 50 };
    const ile = [{ x: 580, y: 470 }];
    expect(montrees([libre], [{ dx: 0, dy: 60 }], [], cadre, undefined, ile)).toEqual([true]);
    expect(montrees([libre], [{ dx: 0, dy: -120 }], [], cadre, undefined, ile)).toEqual([false]);
    expect(montrees([libre], [{ dx: 150, dy: 0 }], [], cadre, undefined, ile)).toEqual([true]);
    expect(montrees([libre], [{ dx: 300, dy: 0 }], [], cadre, undefined, ile)).toEqual([false]);
  });

  it('garde l’étiquette de la prochaine destination quand deux se couvrent encore', () => {
    const zero = { dx: 0, dy: 0 };
    const boxes: LabelBox[] = [
      { x: 300, y: 300, w: 200, h: 40 },
      { x: 320, y: 320, w: 200, h: 40 },
    ];
    expect(montrees(boxes, [zero, zero], [], cadre, [1, 2])).toEqual([false, true]);
  });

  it('cache l’étiquette écartée plus près d’une autre île que de la sienne', () => {
    const b: LabelBox = { x: 300, y: 300, w: 200, h: 40 };
    const iles = [{ x: 300, y: 330 }, { x: 300, y: 420 }];
    const autre: LabelBox = { x: 300, y: 390, w: 200, h: 40 };
    expect(montrees([b, autre], [{ dx: 0, dy: 90 }, { dx: 0, dy: 0 }], [], cadre, undefined, iles)).toEqual([false, true]);
    // Écartée mais toujours plus près de la sienne : montrée.
    expect(montrees([b], [{ dx: 0, dy: 30 }], [], cadre, undefined, iles)).toEqual([true]);
  });

  it('retire avant l’écart l’étiquette dont l’île est sous le panneau : elle ne pousse pas les autres', () => {
    const sous: LabelBox = { x: 480, y: 250, w: 254, h: 50 };
    const libre: LabelBox = { x: 480, y: 360, w: 254, h: 50 };
    const { offsets, visibles } = placerEtiquettes([sous, libre], [{ x: 480, y: 270 }, { x: 480, y: 380 }], { zones: [panneau], bulles: [], obstacles: [], bounds: cadre, gap: 6 }, { weights: [1, 1] });
    expect(visibles).toEqual([false, true]);
    expect(offsets[1]).toEqual({ dx: 0, dy: 0 });
  });
});

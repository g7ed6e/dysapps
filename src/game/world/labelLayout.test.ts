import { describe, expect, it } from 'vitest';
import { boitesDuTrace, ecarterDesObstacles, PLACES_DE_LA_FLECHE_MAX, placerAvecLaFlecheDOuvrage, entiere, layoutLabels, montrees, placerEtiquettes, replierLesSignes, separateMark, type LabelBox } from './labelLayout';
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

  it('avant de renoncer à un nom, essaie les places simples autour de son île : dessus, dessous, à gauche, à droite (DA-31)', () => {
    // L'étiquette posée par l'écart sur une autre étiquette, trop loin : elle trouve place juste sous son île.
    const pose: LabelBox = { x: 500, y: 500, w: 200, h: 40 };
    const gene: LabelBox = { x: 500, y: 420, w: 200, h: 40 };
    const { offsets, visibles } = placerEtiquettes([gene, pose], [{ x: 500, y: 440 }, { x: 500, y: 520 }], { zones: [], bulles: [], obstacles: [], bounds: cadre, gap: 6 }, null);
    expect(visibles).toEqual([true, true]);
    expect(offsets[1]).toEqual({ dx: 0, dy: 0 });
    // Posée sur une autre, plus lourde (la première) : le dessus de son île est pris, elle passe juste dessous.
    const r = placerEtiquettes(
      [gene, { x: 500, y: 425, w: 200, h: 40 }],
      [{ x: 500, y: 440 }, { x: 500, y: 445 }],
      { zones: [], bulles: [], obstacles: [], bounds: cadre, gap: 6 },
      null,
    );
    expect(r.visibles).toEqual([true, true]);
    expect(r.offsets[1]).toEqual({ dx: 0, dy: 445 + 20 + 6 - 425 });
  });
  it('sur la Carte, ne retire jamais le nom de la destination : il prend sa place simple et pousse un nom plus léger (DA-31)', () => {
    // Une bulle cache le nom de la destination et le dessus de son île ; le dessous est pris par un nom plus léger.
    const bulle: LabelBox = { x: 500, y: 340, w: 400, h: 60 };
    const boxes: LabelBox[] = [
      { x: 500, y: 430, w: 200, h: 40 },
      { x: 500, y: 370, w: 200, h: 40 },
    ];
    const iles = [{ x: 500, y: 470 }, { x: 500, y: 400 }];
    const r = placerEtiquettes(boxes, iles, { zones: [], bulles: [bulle], obstacles: [], bounds: cadre, gap: 6 }, { weights: [1, 2] });
    expect(r.visibles).toEqual([true, true]);
    expect(r.offsets[1]).toEqual({ dx: 0, dy: 400 + 26 - 370 });
    expect(r.offsets[0]).toEqual({ dx: 0, dy: 470 + 26 - 430 });
  });
  it('sur la Carte, le nom de la destination se pose sur sa flèche même au-dessus d’une île voisine (DA-31)', () => {
    // Une bulle cache sa place ; juste au-dessus de la flèche, une île voisine : le nom s'y pose quand même, sur la
    // flèche qui le relie à son île, plutôt que dessous.
    const bulle: LabelBox = { x: 500, y: 270, w: 400, h: 40 };
    const fleche: LabelBox = { x: 500, y: 376, w: 36, h: 48 };
    const boxes: LabelBox[] = [{ x: 850, y: 650, w: 200, h: 40 }, { x: 500, y: 270, w: 200, h: 40 }];
    const iles = [{ x: 500, y: 330 }, { x: 500, y: 400 }];
    const r = placerEtiquettes(boxes, iles, { zones: [], bulles: [bulle], obstacles: [fleche], bounds: cadre, gap: 6 }, { weights: [1, 2] });
    expect(r.visibles[1]).toBe(true);
    expect(r.offsets[1]).toEqual({ dx: 0, dy: 352 - 20 - 6 - 270 });
  });
  it('sur la Carte, un autre nom ne se pose jamais sur l’île de destination ni contre sa flèche (DA-31)', () => {
    // Le nom de la Falaise, juste sous la flèche de la destination : il passe sous sa propre île, plus bas.
    const fleche: LabelBox = { x: 500, y: 376, w: 36, h: 48 };
    const boxes: LabelBox[] = [{ x: 500, y: 420, w: 200, h: 40 }, { x: 500, y: 340, w: 200, h: 40 }];
    const iles = [{ x: 500, y: 440 }, { x: 500, y: 400 }];
    const r = placerEtiquettes(boxes, iles, { zones: [], bulles: [], obstacles: [fleche], bounds: cadre, gap: 6 }, { weights: [1, 2] });
    expect(r.visibles).toEqual([true, true]);
    const falaise = boxes[0].y + r.offsets[0].dy;
    expect(falaise - boxes[0].h / 2).toBeGreaterThanOrEqual(400 + 32 + 6);
    // Sans place libre hors de la garde (le bas du cadre), il se cache.
    const bas = placerEtiquettes(boxes, iles, { zones: [], bulles: [], obstacles: [fleche], bounds: { w: 1024, h: 470 }, gap: 6 }, { weights: [1, 2] });
    expect(bas.visibles).toEqual([false, true]);
  });
});

describe('hors de la Carte, les étiquettes tenues (« Commence ici », le bonhomme ; référent dys, LV2-5)', () => {
  const cadre = { w: 1000, h: 600 };
  const zones = [{ x: 500, y: 570, w: 1000, h: 60 }];
  const vue = { zones, bulles: [], obstacles: [], bounds: cadre, gap: 6 };
  // Cinq noms serrés au-dessus de cinq îles voisines : sans rien de plus, le troisième se tait.
  const boxes: LabelBox[] = [100, 110, 120, 150, 60].map((y, i) => ({ x: [470, 500, 530, 500, 500][i], y, w: 220, h: 37 }));
  const iles = boxes.map((b) => ({ x: b.x, y: b.y + 25 }));

  it('une étiquette tenue dont l’île se voit se montre, entière, là où une autre se tairait', () => {
    expect(placerEtiquettes(boxes, iles, vue, null).visibles[2]).toBe(false);
    const { offsets, visibles } = placerEtiquettes(boxes, iles, vue, null, [2]);
    expect(visibles[2]).toBe(true);
    expect(entiere(boxes[2], offsets[2], zones, cadre)).toBe(true);
    // Aucune étiquette montrée ne la couvre.
    const at = (i: number) => ({ ...boxes[i], x: boxes[i].x + offsets[i].dx, y: boxes[i].y + offsets[i].dy });
    for (let i = 0; i < boxes.length; i++) if (i !== 2 && visibles[i]) expect(overlaps(at(i), at(2)), `étiquette ${i}`).toBe(false);
  });

  it('deux étiquettes tenues ne se couvrent jamais : l’une garde sa place, l’autre se tait', () => {
    // Deux îles côte à côte, chacune tenue, dont les noms ne trouvent qu'une place commune.
    // Un cadre étroit où seule la place de départ tient : sans règle, les deux se montrent l'une sur l'autre.
    const serres: LabelBox[] = [{ x: 120, y: 30, w: 220, h: 37 }, { x: 130, y: 34, w: 220, h: 37 }];
    const deux = serres.map((b) => ({ x: b.x, y: b.y + 25 }));
    const etroit = { zones: [], bulles: [], obstacles: [], bounds: { w: 240, h: 90 }, gap: 6 };
    for (const tenues of [[0, 1], [1, 0]]) {
      const { offsets, visibles } = placerEtiquettes(serres, deux, etroit, null, tenues);
      expect(visibles[0] || visibles[1], `${tenues}`).toBe(true);
      const at = (i: number) => ({ ...serres[i], x: serres[i].x + offsets[i].dx, y: serres[i].y + offsets[i].dy });
      expect(visibles[0] && visibles[1] && overlaps(at(0), at(1)), `${tenues}`).toBe(false);
    }
  });

  it('elle se tait si son île est hors de l’écran ou sous l’interface', () => {
    const loin = placerEtiquettes([{ x: 60, y: 200, w: 220, h: 37 }], [{ x: -40, y: 225 }], vue, null, [0]);
    expect(loin.visibles[0]).toBe(false);
    const dessous = placerEtiquettes([{ x: 500, y: 540, w: 220, h: 37 }], [{ x: 500, y: 575 }], vue, null, [0]);
    expect(dessous.visibles[0]).toBe(false);
  });
});

describe('une étiquette tenue ne se pose pas sur un grand repère', () => {
  it('forcée, elle cède la place à un obstacle qu’elle couvrirait', () => {
    const cadre = { w: 1000, h: 600 };
    const boxes: LabelBox[] = [100, 110, 120, 150, 60].map((y, i) => ({ x: [470, 500, 530, 500, 500][i], y, w: 220, h: 37 }));
    const iles = boxes.map((b) => ({ x: b.x, y: b.y + 25 }));
    // Une colonne de repère partout autour du troisième nom, sauf sur son île : aucune place ne l'évite.
    const colonne = { x: 530, y: 60, w: 1000, h: 110 };
    const { offsets, visibles } = placerEtiquettes(boxes, iles, { zones: [], bulles: [], obstacles: [colonne], bounds: cadre, gap: 6 }, null, [2]);
    const at = { ...boxes[2], x: boxes[2].x + offsets[2].dx, y: boxes[2].y + offsets[2].dy };
    if (visibles[2]) expect(overlaps(at, colonne)).toBe(false);
  });
});

describe('la flèche d’un ouvrage sur la Carte (GD-7)', () => {
  const cadre = { w: 400, h: 300 };
  const fleche = (x: number): LabelBox => ({ x, y: 150, w: 38, h: 48 });

  it('prend la première de ses places où aucune étiquette ne bouge, sinon où aucune ne se tait, sinon la voulue', () => {
    const vue = { zones: [] as LabelBox[], bulles: [], obstacles: [], bounds: cadre, gap: 6 };
    const etiquette: LabelBox = { x: 100, y: 150, w: 120, h: 50 };
    const ile = { x: 100, y: 170 };
    const prise = (fleches: LabelBox[], boxes = [etiquette], iles = [ile], v = vue) => placerAvecLaFlecheDOuvrage(fleches, boxes, iles, v, { weights: boxes.map(() => 1) }).fleche;
    // La voulue est libre : elle y reste.
    expect(prise([fleche(300), fleche(320)])).toBe(0);
    // Une étiquette sur la voulue (elle devrait s'écarter) : la flèche glisse vers l'arrivée, sur la première libre.
    expect(prise([fleche(100), fleche(150), fleche(200)])).toBe(2);
    // Partout l'étiquette doit s'écarter, sans se taire : la voulue.
    expect(prise([fleche(100), fleche(120)])).toBe(0);
    // Une place sous l'interface n'est pas libre ; une étiquette dont l'île ne se voit pas ne gêne pas.
    expect(prise([fleche(300), fleche(350)], [], [], { ...vue, zones: [{ x: 300, y: 150, w: 60, h: 60 }] })).toBe(1);
    expect(prise([fleche(100)], [etiquette], [{ x: -5, y: -5 }])).toBe(0);
    // Un cadre bas : à la voulue, l'étiquette ne trouve aucune place et se tairait ; plus loin, elle garde la sienne.
    const bas = { ...vue, bounds: { w: 390, h: 80 } };
    const large: LabelBox = { x: 195, y: 40, w: 300, h: 60 };
    const f = (x: number): LabelBox => ({ x, y: 40, w: 38, h: 48 });
    expect(prise([f(195), f(215), f(370)], [large], [{ x: 195, y: 60 }], bas)).toBe(2);
    // Un nom que l'interface pousse déjà (la barre du bas) : sa place voulue ne touche pas la flèche, celle qu'il prend si ;
    // la flèche glisse jusqu'à ce qu'il garde la sienne (le téléphone, la Forêt sous la flèche du pont de l'Horloge).
    const barre = { ...vue, bounds: { w: 390, h: 300 }, zones: [{ x: 195, y: 285, w: 390, h: 30 }] };
    const pointe = (y: number): LabelBox => ({ x: 195, y: y - 24, w: 38, h: 48 });
    expect(prise([pointe(200), pointe(185), pointe(170)], [{ x: 195, y: 250, w: 170, h: 60 }], [{ x: 195, y: 255 }], barre)).toBe(2);
  });

  it('n’essaie que ses huit premières places : au-delà, la voulue, et c’est l’étiquette qui s’écarte', () => {
    const vue = { zones: [] as LabelBox[], bulles: [], obstacles: [], bounds: { w: 600, h: 300 }, gap: 6 };
    const etiquette: LabelBox = { x: 200, y: 150, w: 360, h: 50 };
    // Dix places, toutes sous l'étiquette sauf la dernière, libre : elle n'est pas essayée.
    const places = Array.from({ length: 10 }, (_, k) => fleche(k < 9 ? 40 + k * 30 : 500));
    expect(PLACES_DE_LA_FLECHE_MAX).toBe(8);
    expect(placerAvecLaFlecheDOuvrage(places, [etiquette], [{ x: 200, y: 170 }], vue, { weights: [1] }).fleche).toBe(0);
    // Parmi les huit premières, la libre se prend.
    const huit = [...places.slice(0, 7), fleche(500)];
    expect(placerAvecLaFlecheDOuvrage(huit, [etiquette], [{ x: 200, y: 170 }], vue, { weights: [1] }).fleche).toBe(7);
  });

  it('le tracé suggéré est un obstacle souple : une étiquette s’en écarte si elle peut, ne se tait jamais pour lui, et il ne fait pas glisser la flèche', () => {
    // Un tracé horizontal, de 60 à 340, à la hauteur de l'étiquette de l'île d'arrivée.
    const points = Array.from({ length: 29 }, (_, k) => ({ x: 60 + k * 10, y: 150 }));
    const souples = boitesDuTrace(points);
    // Trois cases par boîte, une marge de trois quarts de case.
    expect(souples).toHaveLength(10);
    expect(souples[0]).toEqual({ x: 70, y: 150, w: 35, h: 15 });
    const etiquette: LabelBox = { x: 200, y: 150, w: 120, h: 30 };
    const ile = { x: 200, y: 165 };
    const vue = { zones: [] as LabelBox[], bulles: [], obstacles: [], souples, bounds: cadre, gap: 6 };
    const carte = { weights: [1] };
    const libre = placerEtiquettes([etiquette], [ile], vue, carte);
    const at = { ...etiquette, x: etiquette.x + libre.offsets[0].dx, y: etiquette.y + libre.offsets[0].dy };
    expect(libre.visibles[0]).toBe(true);
    expect(souples.some((v) => overlaps(at, v))).toBe(false);
    // Un cadre si bas que rien n'évite le tracé : l'étiquette se montre quand même, dessus.
    const bas = { ...vue, bounds: { w: 400, h: 44 } };
    const serre = placerEtiquettes([{ ...etiquette, y: 22 }], [{ x: 200, y: 30 }], { ...bas, souples: boitesDuTrace(points.map((p) => ({ ...p, y: 22 }))) }, carte);
    expect(serre.visibles[0]).toBe(true);
    // La flèche, loin de l'étiquette : elle reste à sa place voulue, même si l'étiquette s'écarte du tracé.
    expect(placerAvecLaFlecheDOuvrage([fleche(60), fleche(90)], [etiquette], [ile], vue, carte).fleche).toBe(0);
  });

  it('l’île d’arrivée pèse comme celle de départ, tant que cela ne tait aucun nom', () => {
    const vue = { zones: [] as LabelBox[], bulles: [], obstacles: [], bounds: cadre, gap: 6 };
    // L'arrivée (indice 1, fermée) et une île ouverte (indice 2) se chevauchent ; la destination (0) est loin.
    const boxes: LabelBox[] = [
      { x: 80, y: 60, w: 100, h: 30 },
      { x: 250, y: 150, w: 120, h: 30 },
      { x: 270, y: 155, w: 120, h: 30 },
    ];
    const iles = boxes.map((b) => ({ x: b.x, y: b.y + 15 }));
    const weights = [2, 0.5, 1];
    // Sans elle, le nom fermé, plus léger, s'écarte ; avec elle, il garde sa place et l'autre s'écarte, tous montrés.
    expect(placerEtiquettes(boxes, iles, vue, { weights, destination: 0 }).offsets[1]).not.toEqual({ dx: 0, dy: 0 });
    const r = placerEtiquettes(boxes, iles, vue, { weights, destination: 0, arrivee: 1 });
    expect(r.visibles).toEqual([true, true, true]);
    expect(r.offsets[1]).toEqual({ dx: 0, dy: 0 });
    // Un cadre trop bas pour deux rangées : l'arrivée qui garde sa place tairait l'autre nom ; on ne la fait pas peser.
    const bas = { ...vue, bounds: { w: 400, h: 50 }, souples: [{ x: 250, y: 25, w: 300, h: 8 }] };
    const serres: LabelBox[] = [
      { x: 60, y: 20, w: 100, h: 30 },
      { x: 250, y: 25, w: 140, h: 30 },
      { x: 262, y: 25, w: 140, h: 30 },
    ];
    const pres = serres.map((b) => ({ x: b.x, y: b.y + 10 }));
    const sans = placerEtiquettes(serres, pres, { ...bas, souples: [] }, { weights, destination: 0 });
    const avec = placerEtiquettes(serres, pres, bas, { weights, destination: 0, arrivee: 1 });
    expect(sans.visibles.some((v, i) => v && !avec.visibles[i])).toBe(false);
  });

  it('aucune étiquette ne se pose sur elle, même faute de place : elle se déplace ou se tait', () => {
    // Un cadre bas (la bande libre d'un téléphone au grand texte) : une étiquette aussi large que lui, la flèche dessous.
    // Simple obstacle, l'étiquette resterait dessus (sortir du cadre coûterait plus) ; obstacle dur, jamais.
    const etroit = { w: 390, h: 80 };
    const boxes: LabelBox[] = [{ x: 195, y: 40, w: 370, h: 60 }];
    const iles = boxes.map((b) => ({ x: b.x, y: b.y + 20 }));
    const dure: LabelBox = { x: 195, y: 40, w: 38, h: 48 };
    const simple = placerEtiquettes(boxes, iles, { zones: [], bulles: [], obstacles: [dure], bounds: etroit, gap: 6 }, { weights: [1] });
    expect(simple.visibles[0] && overlaps({ ...boxes[0], x: boxes[0].x + simple.offsets[0].dx, y: boxes[0].y + simple.offsets[0].dy }, dure)).toBe(true);
    const { offsets, visibles } = placerEtiquettes(boxes, iles, { zones: [], bulles: [], obstacles: [], dures: [dure], bounds: etroit, gap: 6 }, { weights: [1] });
    boxes.forEach((b, i) => {
      if (!visibles[i]) return;
      const at = { ...b, x: b.x + offsets[i].dx, y: b.y + offsets[i].dy };
      expect(Math.abs(at.x - dure.x) < (at.w + dure.w) / 2 && Math.abs(at.y - dure.y) < (at.h + dure.h) / 2, `étiquette ${i}`).toBe(false);
    });
  });
});

describe('replierLesSignes', () => {
  // Un placement factice : une étiquette se montre si elle tient dans 100 px.
  const placer = (boxes: LabelBox[]) => ({ visibles: boxes.map((b) => b.w <= 100) });
  const box = (w: number): LabelBox => ({ x: 0, y: 0, w, h: 20 });

  it('garde le bloc quand tous les noms se montrent', () => {
    const r = replierLesSignes([box(90), box(80)], [70, 60], placer);
    expect(r.visibles).toEqual([true, true]);
    expect(r.sansSigne).toEqual([false, false]);
  });

  it('retire le bloc d’un nom qui se tait faute de place, si sans lui il se montre', () => {
    const r = replierLesSignes([box(90), box(120), box(130)], [70, 95, undefined], placer);
    expect(r.visibles).toEqual([true, true, false]);
    expect(r.sansSigne).toEqual([false, true, false]);
  });

  it('garde le bloc si le retirer ne montre aucun nom de plus', () => {
    const r = replierLesSignes([box(150)], [130], placer);
    expect(r.visibles).toEqual([false]);
    expect(r.sansSigne).toEqual([false]);
  });
});

import { drawIslandLabel, measureIslandLabel } from './labelCanvas';
import { BLOCKS } from '../biomes';

it('dans Blocland, l’étiquette d’une île porte avant son nom le bloc qu’elle rapporte, aux couleurs de Mes blocs', () => {
  const remplis: string[] = [];
  const textes: { t: string; x: number }[] = [];
  let font = '700 10px Arial';
  const noop = () => {};
  const ctx: { fillStyle: string; [k: string]: unknown } = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    get font() {
      return font;
    },
    set font(f: string) {
      font = f;
    },
    measureText: (t: string) => ({ width: t.length * Number(/(\d+)px/.exec(font)![1]) * 0.5 }),
    fillText(t: string, x: number) {
      textes.push({ t, x });
    },
    fill() {
      remplis.push(this.fillStyle);
    },
    save: noop,
    restore: noop,
    fillRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    stroke: noop,
  };
  const c = ctx as unknown as CanvasRenderingContext2D;
  const seul = measureIslandLabel(c, 'Forêt des sons', 40);
  const avecBloc = measureIslandLabel(c, 'Forêt des sons', 40, undefined, 'french-6e-phonology');
  // Le bloc et son écart : un peu plus large que les lettres sont hautes, jamais plus de deux fois.
  expect(avecBloc.w - seul.w).toBeGreaterThan(40);
  expect(avecBloc.w - seul.w).toBeLessThan(80);
  expect(avecBloc.h).toBe(seul.h);
  drawIslandLabel(c, 'Forêt des sons', 200, 100, 40, undefined, 'french-6e-phonology');
  // Le cube : ses trois faces, le côté aux couleurs du bois de Mes blocs (le bloc de la Forêt des sons) ; puis le nom, à sa droite.
  expect(remplis).toHaveLength(3);
  expect(remplis).toContain(BLOCKS['french-6e-phonology'].side);
  const nom = textes.find((t) => t.t === 'Forêt des sons')!;
  expect(nom.x).toBeGreaterThan(200 - avecBloc.w / 2 + 40);
});

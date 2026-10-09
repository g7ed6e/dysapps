// Un solide en perspective cavalière (voir index.ts).

import type { ReactNode } from 'react';
import { fmt, isAsk, Label, middle, plus, type Point, pts, r1, RightMark, size, spoken, times, type Value } from './tools';

type SolidKind = 'cubes' | 'cube' | 'cylinder' | 'cone' | 'prism-pyramid';

/** Profondeur de la perspective cavalière, pour une arête de 1 vers l'arrière. */
const DEPTH: Point = [0.5, -0.35];

/** Un pavé de petits cubes (longueur, largeur, couches) en perspective cavalière, chaque petit cube visible. */
function CubeBox({ origin, box: [l, w, h], c }: { origin: Point; box: number[]; c: number }) {
  const d = times(DEPTH, c);
  const at = (x: number, y: number, z: number): Point => plus(plus(origin, [x * c, -y * c]), times(d, z));
  const seg = (a: Point, b: Point, key: string) => <line key={key} x1={r1(a[0])} y1={r1(a[1])} x2={r1(b[0])} y2={r1(b[1])} className="geo-cube-line" />;
  const range = (n: number) => Array.from({ length: Math.max(0, n - 1) }, (_, i) => i + 1);
  return (
    <g>
      <polygon points={pts([at(0, 0, 0), at(l, 0, 0), at(l, h, 0), at(0, h, 0)])} className="geo-face geo-front" />
      <polygon points={pts([at(0, h, 0), at(l, h, 0), at(l, h, w), at(0, h, w)])} className="geo-face geo-top" />
      <polygon points={pts([at(l, 0, 0), at(l, 0, w), at(l, h, w), at(l, h, 0)])} className="geo-face geo-side" />
      {range(l).map((i) => [seg(at(i, 0, 0), at(i, h, 0), `fx${i}`), seg(at(i, h, 0), at(i, h, w), `tx${i}`)])}
      {range(h).map((j) => [seg(at(0, j, 0), at(l, j, 0), `fy${j}`), seg(at(l, j, 0), at(l, j, w), `sy${j}`)])}
      {range(w).map((k) => [seg(at(0, h, k), at(l, h, k), `tz${k}`), seg(at(l, 0, k), at(l, h, k), `sz${k}`)])}
    </g>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

/** Ce que dit un solide, sans son volume ni le nom qu'une question demanderait. */
function solidLabel(solid: SolidKind, values: Value[], boxes: number[][], volume?: Value) {
  const asked = volume === undefined ? '' : ` ; son volume est ${spoken(volume)}`;
  const layers = ([l, w, h]: number[]) => `${plural(h, 'couche')} de ${l} cubes sur ${w}`;
  if (solid === 'cubes')
    return boxes.length === 1
      ? `Un pavé fait de petits cubes : ${layers(boxes[0])}.`
      : `${boxes.length === 2 ? 'Deux' : boxes.length} boîtes remplies de petits cubes. ${boxes.map((b, i) => `Boîte ${String.fromCharCode(65 + i)} : ${layers(b)}.`).join(' ')}`;
  if (solid === 'cube') return `Un cube : ses arêtes mesurent ${spoken(values[0], ' cm')}.`;
  if (solid === 'cylinder')
    return values.length
      ? `Un solide à deux bases en disque et une face courbe : rayon ${spoken(values[0])}, hauteur ${spoken(values[1])}${asked}.`
      : `Un solide : deux bases en disque, l’une en haut, l’autre en bas, et une face courbe${asked}.`;
  if (solid === 'cone') return `Un solide à une base en disque et un sommet : rayon ${spoken(values[0])}, hauteur ${spoken(values[1])}, la hauteur en pointillé${asked}.`;
  return `Un prisme droit et une pyramide côte à côte, de même base et de même hauteur ${spoken(values[0])}.`;
}

/**
 * Un solide en perspective : des pavés de petits cubes (un ou deux, nommés A et B), un cube aux arêtes de 1 cm, un
 * solide à deux bases en disque (le cylindre), un cône, un prisme droit à côté d'une pyramide de même base et de même
 * hauteur. Les arêtes cachées sont en pointillé ; aucun total, aucune formule.
 */
export function SolidFigure({ solid, values = [], boxes = [], volume }: { solid: SolidKind; values?: Value[]; boxes?: number[][]; volume?: Value }) {
  const label = solidLabel(solid, values, boxes, volume);
  const volumeText = (at: Point) => volume !== undefined && <Label at={at} text={`volume = ${fmt(volume)}`} ask={isAsk(volume)} />;
  let body: ReactNode;
  if (solid === 'cubes') {
    const gap = 50;
    const widths = boxes.map(([l, w]) => l + w * DEPTH[0]);
    const heights = boxes.map(([, w, h]) => h - w * DEPTH[1]);
    const c = Math.min(40, (290 - gap * (boxes.length - 1)) / widths.reduce((s, v) => s + v, 0), (boxes.length > 1 ? 140 : 165) / Math.max(...heights));
    const total = widths.reduce((s, v) => s + v * c, 0) + gap * (boxes.length - 1);
    let x = (320 - total) / 2;
    const base = boxes.length > 1 ? 165 : 185;
    body = boxes.map((b, i) => {
      const origin: Point = [x, base];
      x += widths[i] * c + gap;
      return (
        <g key={i}>
          <CubeBox origin={origin} box={b} c={c} />
          {boxes.length > 1 && <Label at={[origin[0] + (b[0] * c) / 2, base + 22]} text={String.fromCharCode(65 + i)} name />}
        </g>
      );
    });
  } else if (solid === 'cube') {
    const c = 100;
    const [o, d] = [[95, 175] as Point, times(DEPTH, c)];
    const text = `${fmt(values[0] ?? 1)} cm`;
    body = (
      <>
        <CubeBox origin={o} box={[1, 1, 1]} c={c} />
        <Label at={[o[0] + c / 2, o[1] + 22]} text={text} />
        <Label at={[o[0] - 10, o[1] - c / 2]} text={text} anchor="end" />
        <Label at={plus(plus(o, [c + 18, 2]), times(d, 0.5))} text={text} anchor="start" />
      </>
    );
  } else if (solid === 'cylinder' || solid === 'cone') {
    const given = values.length > 0;
    const s = Math.min(85 / size(values[0], 3), 125 / size(values[1], 4));
    const rx = given ? size(values[0], 3) * s : 70;
    const tall = given ? size(values[1], 4) * s : 120;
    const ry = Math.max(12, rx * 0.28);
    const [cx, top] = [150, 100 - tall / 2 + (solid === 'cylinder' ? ry / 2 : 0)];
    const bottom = top + tall;
    const [left, right] = [cx - rx, cx + rx];
    const back = `M ${r1(left)} ${r1(bottom)} A ${r1(rx)} ${r1(ry)} 0 0 1 ${r1(right)} ${r1(bottom)}`;
    const height = solid === 'cylinder' ? <Label at={[right + 12, (top + bottom) / 2]} text={fmt(values[1])} ask={isAsk(values[1])} anchor="start" /> : null;
    body =
      solid === 'cylinder' ? (
        <>
          <path d={`M ${r1(left)} ${r1(top)} L ${r1(left)} ${r1(bottom)} A ${r1(rx)} ${r1(ry)} 0 0 0 ${r1(right)} ${r1(bottom)} L ${r1(right)} ${r1(top)} Z`} className="geo-face geo-front" />
          <path d={back} className="geo-dash" />
          <ellipse cx={cx} cy={r1(top)} rx={r1(rx)} ry={r1(ry)} className="geo-face geo-top" />
          {given && (
            <>
              <line x1={cx} y1={r1(top)} x2={r1(right)} y2={r1(top)} className="geo-line geo-thin" />
              <circle cx={cx} cy={r1(top)} r="3.5" className="geo-point" />
              <Label at={[cx + rx / 2, top - ry - 12]} text={fmt(values[0])} ask={isAsk(values[0])} />
              {height}
            </>
          )}
          {volumeText([cx, bottom + ry + 18])}
        </>
      ) : (
        <>
          <path d={`M ${cx} ${r1(top)} L ${r1(left)} ${r1(bottom)} A ${r1(rx)} ${r1(ry)} 0 0 0 ${r1(right)} ${r1(bottom)} Z`} className="geo-face geo-front" />
          <path d={back} className="geo-dash" />
          <line x1={cx} y1={r1(top)} x2={cx} y2={r1(bottom)} className="geo-dash" />
          <RightMark v={[cx, bottom]} a={[right, bottom]} b={[cx, top]} side={11} />
          <line x1={cx} y1={r1(bottom)} x2={r1(right)} y2={r1(bottom)} className="geo-line geo-thin" />
          <circle cx={cx} cy={r1(bottom)} r="3.5" className="geo-point" />
          {/* Le rayon coté sous la base, hors de l'ellipse et de l'angle droit. */}
          <Label at={[cx + rx / 2, bottom + ry + 16]} text={fmt(values[0])} ask={isAsk(values[0])} />
          <Label at={[cx - 8, (top + bottom) / 2 + 10]} text={fmt(values[1])} ask={isAsk(values[1])} anchor="end" />
          {volume !== undefined && <Label at={[right + 12, top + tall * 0.3]} text={`volume = ${fmt(volume)}`} ask={isAsk(volume)} anchor="start" />}
        </>
      );
  } else {
    // Un prisme droit (à base carrée) et une pyramide de même base et de même hauteur, côte à côte. La hauteur de la
    // pyramide (en pointillé, à l'intérieur) est cotée à sa droite, sur un trait de cote, hors des arêtes.
    const [a, tall, ground] = [70, 105, 170];
    const d = times(DEPTH, a);
    const height = values[0] ?? 'h';
    const solids = [34, 166].map((x0, i) => {
      const [F1, F2] = [[x0, ground], [x0 + a, ground]] as Point[];
      const [B1, B2] = [plus(F1, d), plus(F2, d)];
      const up = (P: Point): Point => [P[0], P[1] - tall];
      const hidden = (P: Point, Q: Point, key: string) => <line key={key} x1={r1(P[0])} y1={r1(P[1])} x2={r1(Q[0])} y2={r1(Q[1])} className="geo-dash geo-thin" />;
      const caption = <Label at={[x0 + a / 2 + d[0] / 2, ground + 24]} text={i === 0 ? 'prisme droit' : 'pyramide'} />;
      if (i === 0)
        return (
          <g key="prism">
            <polygon points={pts([F1, F2, up(F2), up(F1)])} className="geo-face geo-front" />
            <polygon points={pts([F2, B2, up(B2), up(F2)])} className="geo-face geo-side" />
            <polygon points={pts([up(F1), up(F2), up(B2), up(B1)])} className="geo-face geo-top" />
            {hidden(F1, B1, 'h1')}
            {hidden(B1, B2, 'h2')}
            {hidden(B1, up(B1), 'h3')}
            <Label at={[F1[0] - 10, ground - tall / 2]} text={fmt(height)} ask={isAsk(height)} anchor="end" />
            {caption}
          </g>
        );
      const center = middle(F1, B2);
      const apex = up(center);
      const x = B2[0] + 14;
      return (
        <g key="pyramid">
          <polygon points={pts([F1, F2, apex])} className="geo-face geo-front" />
          <polygon points={pts([F2, B2, apex])} className="geo-face geo-side" />
          {hidden(F1, B1, 'h1')}
          {hidden(B1, B2, 'h2')}
          {hidden(B1, apex, 'h3')}
          {hidden(apex, center, 'h4')}
          <line x1={r1(x)} y1={r1(apex[1])} x2={r1(x)} y2={r1(center[1])} className="geo-line geo-thin" />
          <line x1={r1(x - 5)} y1={r1(apex[1])} x2={r1(x + 5)} y2={r1(apex[1])} className="geo-line geo-thin" />
          <line x1={r1(x - 5)} y1={r1(center[1])} x2={r1(x + 5)} y2={r1(center[1])} className="geo-line geo-thin" />
          <Label at={[x + 8, (apex[1] + center[1]) / 2]} text={fmt(height)} ask={isAsk(height)} anchor="start" />
          {caption}
        </g>
      );
    });
    body = <>{solids}</>;
  }
  return (
    <figure className="geometry solid-figure">
      <svg viewBox="0 0 320 210" role="img" aria-label={label}>
        {body}
      </svg>
    </figure>
  );
}

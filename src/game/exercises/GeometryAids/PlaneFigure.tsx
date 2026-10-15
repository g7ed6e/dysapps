// Une figure plane cotée (voir index.ts).

import type { ReactNode } from 'react';
import { EqualTick, fit, fmt, isAsk, Label, list, middle, minus, plus, type Point, polar, proportion, pts, r1, RightMark, size, spoken, times, unit, type Value } from './tools';

type PlaneShape = 'rectangle' | 'square' | 'parallelogram' | 'triangle' | 'disc' | 'circle' | 'bisector' | 'split';

const PLANE_NAMES: Record<Exclude<PlaneShape, 'bisector' | 'split'>, string> = {
  rectangle: 'Rectangle',
  square: 'Carré',
  parallelogram: 'Parallélogramme',
  triangle: 'Triangle',
  disc: 'Disque',
  circle: 'Cercle',
};

/** Ce que dit une figure plane, sans la valeur cherchée. */
function planeLabel(shape: PlaneShape, values: Value[], area?: Value, diameter?: Value, widths: Value[] = [], areas: Value[] = []) {
  const [p, q, r] = values;
  if (shape === 'bisector') {
    const say = (name: string, v: Value) => (isAsk(v) ? `la longueur ${name} est à trouver` : `la longueur ${name} vaut ${fmt(v)}`);
    return `Le segment AB et sa médiatrice, qui le coupe en son milieu à angle droit. Le point M est sur la médiatrice : ${say('MA', p)}, ${say('MB', q)}.`;
  }
  if (shape === 'split') {
    const parts = areas.every(isAsk) ? 'l’aire de chaque part est à trouver' : `aires des parts : ${list(areas.map((v) => spoken(v)))}`;
    return `Un rectangle de hauteur ${spoken(p)}, partagé en ${widths.length} parts de largeurs ${list(widths.map((v) => spoken(v)))} ; ${parts}.`;
  }
  const dims = {
    rectangle: `de longueur ${spoken(p)} et de largeur ${spoken(q)}`,
    square: `de côté ${spoken(p)}, ses quatre côtés égaux marqués`,
    parallelogram: `de base ${spoken(p)} et de hauteur ${spoken(q)}, la hauteur en pointillé${r === undefined ? '' : `, côté penché ${spoken(r)}`}`,
    triangle: `de base ${spoken(p)} et de hauteur ${spoken(q)}, la hauteur en pointillé`,
    disc: `de rayon ${spoken(p)}`,
    circle: `de rayon ${spoken(p)}`,
  }[shape];
  const asked = area !== undefined ? ` ; son aire est ${spoken(area)}` : diameter !== undefined ? ` ; un diamètre est tracé, sa longueur est ${spoken(diameter)}` : '';
  return `${PLANE_NAMES[shape]} ${dims}${asked}.`;
}

/**
 * Une figure plane cotée, chaque longueur écrite une seule fois : rectangle (longueur, largeur), carré (un seul côté coté,
 * avec les marques d'égalité), parallélogramme (base, hauteur, côté penché au besoin), triangle (base, hauteur), disque
 * et cercle (rayon), médiatrice d'un segment (MA, MB), rectangle partagé (hauteur, largeurs et aires des parts). La
 * hauteur est en pointillé, avec un angle droit ; l'aire cherchée s'écrit dans la figure, le diamètre cherché sur lui.
 */
export function PlaneFigure({
  shape,
  values,
  area,
  diameter,
  widths = [],
  areas = [],
}: {
  shape: PlaneShape;
  values: Value[];
  area?: Value;
  diameter?: Value;
  widths?: Value[];
  areas?: Value[];
}) {
  const label = planeLabel(shape, values, area, diameter, widths, areas);
  const [p, q, r] = values;
  const areaText = (at: Point) => area !== undefined && <Label at={at} text={`aire = ${fmt(area)}`} ask={isAsk(area)} />;
  let body: ReactNode;
  if (shape === 'rectangle' || shape === 'square') {
    const [w, h] = shape === 'square' ? [1, 1] : proportion(size(p, 5), size(q, 3));
    const at = fit(w, h);
    const [P0, P1, P2, P3] = [at([0, 0]), at([w, 0]), at([w, h]), at([0, h])];
    body = (
      <>
        <polygon points={pts([P0, P1, P2, P3])} className="geo-shape" />
        <RightMark v={P0} a={P1} b={P3} />
        {shape === 'square' && [P0, P1, P2, P3].map((P, i, all) => <EqualTick key={i} a={P} b={all[(i + 1) % 4]} />)}
        <Label at={[middle(P0, P1)[0], P0[1] + (shape === 'square' ? 30 : 24)]} text={fmt(p)} ask={isAsk(p)} />
        {shape === 'rectangle' && <Label at={[P0[0] - 12, middle(P0, P3)[1]]} text={fmt(q)} ask={isAsk(q)} anchor="end" />}
        {areaText(middle(P0, P2))}
      </>
    );
  } else if (shape === 'parallelogram' || shape === 'triangle') {
    const [b, h] = proportion(size(p, 5), size(q, 3));
    // Le côté penché donne le décalage du haut (Pythagore) ; sans lui, un décalage d'un tiers de la base.
    const s = size(r, 0);
    const offset = shape === 'triangle' ? 0.3 * b : s > size(q, 3) && b === size(p, 5) && h === size(q, 3) ? Math.sqrt(s * s - h * h) : 0.35 * b;
    const width = shape === 'triangle' ? b : b + offset;
    const at = fit(width, h, { x: 40, y: 16, w: 250, h: 150 });
    const corners = shape === 'triangle' ? [at([0, 0]), at([b, 0]), at([offset, h])] : [at([0, 0]), at([b, 0]), at([b + offset, h]), at([offset, h])];
    const top = corners[corners.length - 1];
    const foot = at([offset, 0]);
    body = (
      <>
        <polygon points={pts(corners)} className="geo-shape" />
        <line x1={r1(top[0])} y1={r1(top[1])} x2={r1(foot[0])} y2={r1(foot[1])} className="geo-dash" />
        <RightMark v={foot} a={corners[1]} b={top} />
        <Label at={[middle(corners[0], corners[1])[0], corners[0][1] + 24]} text={fmt(p)} ask={isAsk(p)} />
        {/* La hauteur à droite du pointillé (dans le haut du parallélogramme, loin du côté penché et de l'aire). */}
        <Label at={[foot[0] + 10, shape === 'triangle' ? middle(foot, top)[1] : top[1] + 0.28 * (foot[1] - top[1])]} text={fmt(q)} ask={isAsk(q)} anchor="start" />
        {shape === 'parallelogram' && r !== undefined && <Label at={[middle(corners[0], top)[0] - 12, middle(corners[0], top)[1]]} text={fmt(r)} ask={isAsk(r)} anchor="end" />}
        {/* L'aire entre la hauteur en pointillé et le côté de droite. */}
        {areaText(shape === 'triangle' ? at([0.56 * b, 0.22 * h]) : at([(1.3 * offset + b) / 2, h * 0.3]))}
      </>
    );
  } else if (shape === 'disc' || shape === 'circle') {
    const c: Point = [160, 105];
    const radius = 78;
    const end = shape === 'disc' ? polar(c, 0, radius) : polar(c, 125, radius);
    const along = unit(minus(end, c));
    const labelAt = plus(middle(c, end), times([along[1], -along[0]], shape === 'disc' ? 16 : -16));
    body = (
      <>
        <circle cx={c[0]} cy={c[1]} r={radius} className={shape === 'disc' ? 'geo-shape' : 'geo-shape geo-outline'} />
        {diameter !== undefined && (
          <>
            <line x1={c[0] - radius} y1={c[1]} x2={c[0] + radius} y2={c[1]} className={isAsk(diameter) ? 'geo-line ask' : 'geo-line'} />
            <Label at={[c[0], c[1] + 30]} text={`diamètre = ${fmt(diameter)}`} ask={isAsk(diameter)} />
          </>
        )}
        <line x1={c[0]} y1={c[1]} x2={r1(end[0])} y2={r1(end[1])} className="geo-line" />
        <circle cx={c[0]} cy={c[1]} r="4" className="geo-point" />
        <Label at={labelAt} text={fmt(p)} ask={isAsk(p)} />
        {areaText([c[0], c[1] - 42])}
      </>
    );
  } else if (shape === 'bisector') {
    const [A, B, I, M] = [[70, 150], [250, 150], [160, 150], [160, 40]] as Point[];
    body = (
      <>
        <line x1="160" y1="190" x2="160" y2="16" className="geo-line geo-thin" />
        <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} className="geo-line" />
        <EqualTick a={A} b={I} />
        <EqualTick a={I} b={B} />
        <RightMark v={I} a={B} b={M} />
        <line x1={M[0]} y1={M[1]} x2={A[0]} y2={A[1]} className="geo-dash" />
        <line x1={M[0]} y1={M[1]} x2={B[0]} y2={B[1]} className="geo-dash" />
        {[A, B, M].map((P, i) => (
          <circle key={i} cx={P[0]} cy={P[1]} r="4" className="geo-point" />
        ))}
        <Label at={[A[0] - 14, A[1] + 4]} text="A" anchor="end" name />
        <Label at={[B[0] + 14, B[1] + 4]} text="B" anchor="start" name />
        <Label at={[M[0] + 12, M[1] - 12]} text="M" anchor="start" name />
        <Label at={[middle(M, A)[0] - 12, middle(M, A)[1] - 8]} text={fmt(p)} ask={isAsk(p)} anchor="end" />
        <Label at={[middle(M, B)[0] + 12, middle(M, B)[1] - 8]} text={fmt(q)} ask={isAsk(q)} anchor="start" />
      </>
    );
  } else {
    // Rectangle partagé : des parts à l'échelle quand toutes les cotes sont des nombres, sinon des parts égales.
    const numeric = [p, ...widths].every((v) => typeof v === 'number' && v > 0);
    const parts = widths.map((v) => (numeric ? size(v, 1) : 1));
    const total = parts.reduce((s, v) => s + v, 0);
    const [w, h] = numeric ? proportion(total, size(p, 1)) : [total, 0.55 * total];
    const k = w / total;
    const at = fit(w, h, { x: 60, y: 20, w: 220, h: 140 });
    const edges = parts.reduce<number[]>((acc, v) => [...acc, acc[acc.length - 1] + v * k], [0]);
    const partWidth = (i: number) => at([edges[i + 1], 0])[0] - at([edges[i], 0])[0];
    body = (
      <>
        <polygon points={pts([at([0, 0]), at([w, 0]), at([w, h]), at([0, h])])} className="geo-shape" />
        {edges.slice(1, -1).map((x, i) => {
          const [a, b] = [at([x, 0]), at([x, h])];
          return <line key={i} x1={r1(a[0])} y1={r1(a[1])} x2={r1(b[0])} y2={r1(b[1])} className="geo-line" />;
        })}
        <Label at={[at([0, 0])[0] - 12, at([0, h / 2])[1]]} text={fmt(p)} ask={isAsk(p)} anchor="end" />
        {widths.map((v, i) => (
          <Label key={`w${i}`} at={[at([(edges[i] + edges[i + 1]) / 2, 0])[0], at([0, 0])[1] + 24]} text={fmt(v)} ask={isAsk(v)} />
        ))}
        {areas.map((v, i) => (
          <Label key={`a${i}`} at={at([(edges[i] + edges[i + 1]) / 2, h / 2])} text={partWidth(i) >= 100 ? `aire = ${fmt(v)}` : fmt(v)} ask={isAsk(v)} />
        ))}
      </>
    );
  }
  return (
    <figure className="geometry plane-figure">
      <svg viewBox="0 0 320 214" role="img" aria-label={label}>
        {body}
      </svg>
    </figure>
  );
}

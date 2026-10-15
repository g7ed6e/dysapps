// Un triangle tracé avec ses vrais angles (voir index.ts).

import { AngleMark, EqualTick, fit, fmt, isAsk, list, type Point, pts, rad, type Value } from './tools';

type TriangleMarks = 'isosceles' | 'equilateral';

/**
 * Les trois angles d'un triangle, en degrés, à partir de ceux donnés (« ? » pour un angle à trouver) : le dernier se
 * calcule (la somme fait 180°) ; dans un triangle isocèle, les deux derniers (la base) sont égaux ; dans un triangle
 * équilatéral, tous valent 60°. `null` si les angles donnés ne font pas un triangle.
 */
export function triangleAngles(values: Value[], marks?: TriangleMarks): [number, number, number] | null {
  if (values.length !== 3) return null;
  const n = values.map((v) => (typeof v === 'number' ? v : undefined));
  if (marks === 'equilateral') return n.every((v) => v === undefined || v === 60) ? [60, 60, 60] : null;
  if (marks === 'isosceles') {
    n[1] ??= n[2];
    n[2] ??= n[1];
    if (n[0] !== undefined && n[1] === undefined) n[1] = n[2] = (180 - n[0]) / 2;
    if (n[1] !== n[2]) return null;
  }
  const missing = n.filter((v) => v === undefined).length;
  const known = n.reduce<number>((s, v) => s + (v ?? 0), 0);
  const solved = n.map((v) => v ?? (missing === 1 ? 180 - known : NaN));
  if (solved.some((v) => !(v > 0)) || Math.abs(solved[0] + solved[1] + solved[2] - 180) > 1e-6) return null;
  return [solved[0], solved[1], solved[2]];
}

const TRIANGLE_NAMES = { isosceles: 'Triangle isocèle, ses deux côtés égaux marqués', equilateral: 'Triangle équilatéral, ses trois côtés égaux marqués' };
const COUNT_WORDS = ['', 'un angle', 'deux angles', 'trois angles'];

/**
 * Un triangle tracé avec ses vrais angles : le premier en haut, les deux autres à la base. Chaque angle porte sa mesure
 * (un petit carré pour un angle droit), ou « ? » ; un angle à trouver est calculé pour le tracé, jamais écrit. Isocèle :
 * les deux côtés du sommet portent une marque d'égalité ; équilatéral : les trois.
 */
export function TriangleAngles({ angles, marks }: { angles: Value[]; marks?: TriangleMarks }) {
  const solved = triangleAngles(angles, marks);
  if (!solved) return null;
  const [a, b, c] = solved.map(rad);
  // B en (0, 0), C en (1, 0), A au-dessus (loi des sinus : AB = sin C / sin A).
  const ab = Math.sin(c) / Math.sin(a);
  const apex: Point = [ab * Math.cos(b), ab * Math.sin(b)];
  const minX = Math.min(0, apex[0]);
  const maxX = Math.max(1, apex[0]);
  const place = fit(maxX - minX, apex[1], { x: 40, y: 30, w: 240, h: 170 });
  const at = ([x, y]: Point) => place([x - minX, y]);
  const [A, B, C] = [at(apex), at([0, 0]), at([1, 0])];
  const knownWords = angles.filter((v) => !isAsk(v)).map((v) => (v === 90 ? 'un angle droit' : `un angle de ${fmt(v)}°`));
  const unknown = angles.filter(isAsk).length;
  const words = [...knownWords, ...(unknown ? [`${COUNT_WORDS[unknown]} à trouver`] : [])];
  const label = `${marks ? TRIANGLE_NAMES[marks] : 'Triangle'} : ${list(words)}.`;
  return (
    <figure className="geometry triangle-angles">
      <svg viewBox="0 0 320 230" role="img" aria-label={label}>
        <polygon points={pts([A, B, C])} className="geo-shape" />
        {marks && <EqualTick a={A} b={B} />}
        {marks && <EqualTick a={A} b={C} />}
        {marks === 'equilateral' && <EqualTick a={B} b={C} />}
        <AngleMark vertex={A} from={B} to={C} value={angles[0]} />
        <AngleMark vertex={B} from={C} to={A} value={angles[1]} />
        <AngleMark vertex={C} from={A} to={B} value={angles[2]} />
      </svg>
    </figure>
  );
}

// Une figure et son image sur un quadrillage (voir index.ts).

import { AngleMark, arcPath, Arrow, ASK, degrees, fmt, isAsk, Label, length, minus, plus, type Point, pts, r1, rad, size, spoken, times, unit, type Value } from './tools';

type TransformKind = 'translation' | 'reflection' | 'point-reflection' | 'rotation' | 'dilation';

/** L'angle en `v` (en degrés) entre les directions de `a` et de `b`. */
function angleAt(v: Point, a: Point, b: Point) {
  const [u, t] = [minus(a, v), minus(b, v)];
  return (Math.acos(Math.min(1, Math.max(-1, (u[0] * t[0] + u[1] * t[1]) / (length(u) * length(t))))) * 180) / Math.PI;
}

/**
 * Un triangle aux sommets sur le quadrillage (de 0 à `w`, de 0 à `h`) dont le premier angle est le plus proche de `angle`
 * degrés (à 1,5° près du meilleur), sans angle de moins de 25° : l'angle marqué a l'air de sa mesure. Parmi ceux-là, le
 * plus profond (le sommet marqué le plus loin du côté opposé) : sa mesure s'écrit dans l'angle.
 */
export function gridTriangle(angle: number, w = 4, h = 3): [Point, Point, Point] {
  const grid: Point[] = [];
  for (let x = 0; x <= w; x++) for (let y = 0; y <= h; y++) grid.push([x, y]);
  const candidates: { triangle: [Point, Point, Point]; gap: number; depth: number }[] = [];
  for (const v of grid)
    for (let j = 0; j < grid.length; j++)
      for (let k = j + 1; k < grid.length; k++) {
        const [q, r] = [grid[j], grid[k]];
        const cross = (q[0] - v[0]) * (r[1] - v[1]) - (q[1] - v[1]) * (r[0] - v[0]);
        if (cross === 0) continue;
        if (Math.min(angleAt(v, q, r), angleAt(q, v, r), angleAt(r, v, q)) < 25) continue;
        candidates.push({ triangle: [v, q, r], gap: Math.abs(angleAt(v, q, r) - angle), depth: Math.abs(cross) / length(minus(r, q)) });
      }
  const closest = Math.min(...candidates.map((c) => c.gap));
  let best = candidates[0];
  for (const c of candidates) if (c.gap <= closest + 1.5 && c.depth > best.depth + 1e-9) best = c;
  return best.triangle;
}

/** La figure de départ, sur le quadrillage : un drapeau (son mât et sa toile), un rectangle (une aire), un triangle (un angle). */
function startShape(angles?: Value[], areas?: Value[], small = false): { outline: Point[]; pole?: [Point, Point]; name: string } {
  if (angles) return { outline: gridTriangle(size(angles[0], 50), small ? 3 : 4, small ? 2 : 4), name: 'un triangle' };
  if (areas)
    return {
      outline: [
        [0, 0],
        [4, 0],
        [4, 3],
        [0, 3],
      ],
      name: 'un rectangle',
    };
  return {
    outline: [
      [0, 4],
      [2, 3],
      [0, 2],
    ],
    pole: [
      [0, 0],
      [0, 4],
    ],
    name: 'un drapeau',
  };
}

/**
 * Une figure et son image sur un quadrillage, leurs sommets sur des points du quadrillage. Selon la transformation, on
 * voit une flèche (translation), l'axe (symétrie axiale), le centre O (symétrie centrale, rotation, homothétie), un arc
 * d'un sommet à son image (rotation ; symétrie centrale avec `arc`, marqué « ? ») ou les demi-droites issues de O
 * (homothétie). L'angle de la rotation et le rapport de l'homothétie (`amount`) ne s'écrivent jamais. Avec `angles`, un
 * angle du triangle et celui de son image ; avec `areas`, l'aire du rectangle et celle de son image, chacune dans sa
 * figure, de part et d'autre de l'axe. La description lue ne nomme pas la transformation (une question peut la demander).
 */
export function TransformationFigure({
  transform,
  amount = transform === 'dilation' ? 2 : 90,
  angles,
  areas,
  arc,
}: {
  transform: TransformKind;
  amount?: number;
  angles?: Value[];
  areas?: Value[];
  arc?: Value;
}) {
  const shape = startShape(angles, areas, transform === 'dilation');
  const all = shape.pole ? [...shape.outline, ...shape.pole] : shape.outline;
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  let map: (p: Point) => Point;
  let center: Point | undefined;
  let axis: number | undefined;
  let rotationFrom: Point | undefined;
  if (transform === 'translation') {
    const v: Point = [maxX + 3, 1];
    map = (p) => plus(p, v);
  } else if (transform === 'reflection') {
    axis = maxX + 1;
    const x0 = axis;
    map = ([x, y]) => [2 * x0 - x, y];
  } else if (transform === 'point-reflection') {
    const o: Point = [maxX + 2, Math.round((minY + maxY) / 2)];
    center = o;
    map = (p) => minus(times(o, 2), p);
  } else if (transform === 'rotation') {
    const layout = rotationLayout(shape.outline, angles ? all.slice(1) : all, amount);
    center = layout.o;
    rotationFrom = layout.from;
    map = (p) => rotate(p, layout.o, amount);
  } else {
    const k = amount;
    const o = dilationCenter(shape.outline, k);
    center = o;
    map = (p) => plus(o, times(minus(p, o), k));
  }
  const image = { outline: shape.outline.map(map), pole: shape.pole && ([map(shape.pole[0]), map(shape.pole[1])] as [Point, Point]) };
  // L'arc d'un sommet à son image autour du centre : le sommet le plus loin du centre (l'arc passe hors des figures).
  // Avec un angle marqué, l'arc part d'un autre sommet : sa fin ne touche jamais l'angle cherché (lu « 90° », le piège).
  const arcFrom = rotationFrom ?? (center && transform === 'point-reflection' && arc !== undefined ? closestVertex(all, center) : undefined);
  const everything = [...all, ...image.outline, ...(image.pole ?? []), ...(center ? [center] : [])];
  if (arcFrom && center) everything.push(...arcPoints(center, arcFrom, transform === 'rotation' ? amount : 180));
  const xs = everything.map((p) => p[0]);
  const ys = everything.map((p) => p[1]);
  // Une case de marge autour des figures.
  const pad = 1;
  const [gx0, gx1] = [Math.floor(Math.min(...xs)) - pad, Math.ceil(Math.max(...xs)) + pad];
  const [gy0, gy1] = [Math.floor(Math.min(...ys)) - pad, Math.ceil(Math.max(...ys)) + pad];
  const cell = gridCell(gx1 - gx0, gy1 - gy0);
  const margin = 10;
  const W = (gx1 - gx0) * cell + 2 * margin;
  const H = (gy1 - gy0) * cell + 2 * margin;
  const at = ([x, y]: Point): Point => [margin + (x - gx0) * cell, margin + (gy1 - y) * cell];
  const outline = (ps: Point[]) => pts(ps.map(at));
  const pole = (p?: [Point, Point]) => p && <line x1={r1(at(p[0])[0])} y1={r1(at(p[0])[1])} x2={r1(at(p[1])[0])} y2={r1(at(p[1])[1])} className="geo-line" />;
  const inside = (ps: Point[]) => at(times(ps.reduce(plus, [0, 0] as Point), 1 / ps.length));
  const what = shape.name.replace(/^un /, '');
  const description = {
    translation: `Sur un quadrillage, ${shape.name} et son image, plus loin, tournée du même côté ; une flèche va de l’un à l’autre.`,
    reflection: `Sur un quadrillage, une droite ; d’un côté ${shape.name}, de l’autre côté son image, retournée.`,
    'point-reflection': `Sur un quadrillage, ${shape.name}, le point O, et l’image du ${what} de l’autre côté de O${arc !== undefined ? ` ; un arc va d’un point du ${what} à son image, autour de O, son angle est ${spoken(arc)}` : ''}.`,
    rotation: `Sur un quadrillage, ${shape.name} et son image, tournée autour du point O ; un arc en pointillé va d’un sommet à son image.`,
    dilation: `Sur un quadrillage, ${shape.name} et son image, plus grande, tracée depuis le point O.`,
  }[transform];
  const extra = angles
    ? ` Un angle marqué du ${what} : ${spoken(angles[0], isAsk(angles[0]) ? '' : '°')} ; l’angle qui lui correspond sur l’image : ${spoken(angles[1] ?? ASK, isAsk(angles[1] ?? ASK) ? '' : '°')}.`
    : areas
      ? ` Aire du ${what} : ${spoken(areas[0])} ; aire de son image : ${spoken(areas[1] ?? ASK)}.`
      : '';
  return (
    <figure className="geometry transformation-figure">
      <svg viewBox={`0 0 ${r1(W)} ${r1(H)}`} role="img" aria-label={description + extra}>
        {Array.from({ length: gx1 - gx0 + 1 }, (_, i) => (
          <line key={`gx${i}`} x1={r1(at([gx0 + i, 0])[0])} y1={margin} x2={r1(at([gx0 + i, 0])[0])} y2={r1(H - margin)} className="geo-grid" />
        ))}
        {Array.from({ length: gy1 - gy0 + 1 }, (_, i) => (
          <line key={`gy${i}`} x1={margin} y1={r1(at([0, gy0 + i])[1])} x2={r1(W - margin)} y2={r1(at([0, gy0 + i])[1])} className="geo-grid" />
        ))}
        {axis !== undefined && <line x1={r1(at([axis, 0])[0])} y1={margin} x2={r1(at([axis, 0])[0])} y2={r1(H - margin)} className="geo-axis" />}
        {transform === 'dilation' && center && shape.outline.map((p, i) => <line key={`ray${i}`} x1={r1(at(center)[0])} y1={r1(at(center)[1])} x2={r1(at(map(p))[0])} y2={r1(at(map(p))[1])} className="geo-dash geo-thin" />)}
        <polygon points={outline(shape.outline)} className="geo-shape" />
        {pole(shape.pole)}
        <polygon points={outline(image.outline)} className="geo-shape geo-image" />
        {pole(image.pole)}
        {transform === 'translation' && <Arrow a={at(all[0])} b={at(map(all[0]))} className="geo-line geo-thin" />}
        {arcFrom && center && <ArcAround center={center} from={arcFrom} amount={transform === 'rotation' ? amount : 180} at={at} label={arc} />}
        {center && (
          <>
            <circle cx={r1(at(center)[0])} cy={r1(at(center)[1])} r="5" className="geo-point" />
            {/* Le nom du centre, du côté où il n'y a ni figure ni demi-droite. */}
            <Label at={plus(at(center), transform === 'rotation' ? [12, 14] : [-12, 14])} text="O" anchor={transform === 'rotation' ? 'start' : 'end'} name />
          </>
        )}
        {angles && (
          <>
            <AngleMark vertex={at(shape.outline[0])} from={at(shape.outline[1])} to={at(shape.outline[2])} value={angles[0]} />
            <AngleMark vertex={at(image.outline[0])} from={at(image.outline[1])} to={at(image.outline[2])} value={angles[1] ?? ASK} />
          </>
        )}
        {areas && (
          <>
            <Label at={inside(shape.outline)} text={`aire = ${fmt(areas[0])}`} ask={isAsk(areas[0])} />
            <Label at={inside(image.outline)} text={`aire = ${fmt(areas[1] ?? ASK)}`} ask={isAsk(areas[1] ?? ASK)} />
          </>
        )}
      </svg>
    </figure>
  );
}

/**
 * La taille d'une case pour un quadrillage de `w` sur `h` cases : un dessin d'au plus 330 de large et 360 de haut, pour
 * que le texte (21) reste à 18 px au moins sur un téléphone, et qu'une mesure tienne dans son angle.
 */
const gridCell = (w: number, h: number) => Math.min(34, 310 / w, 340 / h);

/** Les bornes d'un ensemble de points : [xmin, xmax, ymin, ymax]. */
function bounds(ps: Point[]): [number, number, number, number] {
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}

/**
 * Le centre d'une homothétie de rapport `k`, sur le quadrillage : l'image ne recouvre pas la figure (une case d'écart au
 * moins), la droite qui passe par O et par le sommet marqué n'entre pas dans son angle (elle ne barre pas sa mesure, ni
 * sur la figure ni sur l'image), et le dessin a les plus grandes cases possibles.
 */
function dilationCenter(outline: Point[], k: number): Point {
  const [x0, x1, y0, y1] = bounds(outline);
  const [v, a, b] = outline;
  const opening = angleAt(v, a, b);
  let best: { o: Point; cell: number; distance: number } | undefined;
  for (let ox = -8; ox <= 8; ox++)
    for (let oy = -8; oy <= 8; oy++) {
      const o: Point = [ox, oy];
      const image = outline.map((p) => plus(o, times(minus(p, o), k)));
      const [ix0, ix1, iy0, iy1] = bounds(image);
      if (!(ix0 >= x1 + 1 || ix1 <= x0 - 1 || iy0 >= y1 + 1 || iy1 <= y0 - 1)) continue;
      const d = minus(v, o);
      const crosses = [d, times(d, -1)].some((dir) => Math.abs(angleAt(v, a, plus(v, dir)) + angleAt(v, plus(v, dir), b) - opening) < 1e-6);
      if (crosses) continue;
      const [gx0, gx1, gy0, gy1] = bounds([...outline, ...image, o]);
      const cell = gridCell(gx1 - gx0 + 2, gy1 - gy0 + 2);
      const distance = length(minus(o, v));
      if (!best || cell > best.cell + 1e-9 || (Math.abs(cell - best.cell) < 1e-9 && distance < best.distance)) best = { o, cell, distance };
    }
  return best ? best.o : [x0 - 4, y0];
}

/** Le sommet d'où part l'arc d'un demi-tour : le plus proche du centre. */
function closestVertex(points: Point[], center: Point): Point {
  return [...points].sort((a, b) => length(minus(a, center)) - length(minus(b, center)))[0];
}

/** L'image de `p` par la rotation de centre `o`, de `amount` degrés (un multiple de 90, sens inverse des aiguilles). */
function rotate(p: Point, o: Point, amount: number): Point {
  let [x, y] = minus(p, o);
  for (let i = 0; i < (((Math.round(amount / 90) % 4) + 4) % 4); i++) [x, y] = [-y, x];
  return plus(o, [x, y]);
}

/** Le point `p` est-il dans le polygone convexe `polygon` (bords compris, à un dixième de case près) ? */
function insideConvex(p: Point, polygon: Point[]): boolean {
  const signs = polygon.map((a, i) => {
    const b = polygon[(i + 1) % polygon.length];
    return ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / (length(minus(b, a)) || 1);
  });
  return signs.every((v) => v >= -0.1) || signs.every((v) => v <= 0.1);
}

/**
 * Le centre O d'une rotation et le sommet d'où part son arc, sur le quadrillage : l'image ne recouvre pas la figure (une
 * case d'écart au moins), l'arc passe hors des deux figures et part d'un des sommets `from` (pas de l'angle marqué), et le
 * dessin a les plus grandes cases possibles.
 */
function rotationLayout(outline: Point[], from: Point[], amount: number): { o: Point; from: Point } {
  const [x0, x1, y0, y1] = bounds(outline);
  let best: { o: Point; from: Point; cell: number; radius: number } | undefined;
  for (let ox = x0 - 4; ox <= x1 + 4; ox++)
    for (let oy = y0 - 4; oy <= y1 + 4; oy++) {
      const o: Point = [ox, oy];
      const image = outline.map((p) => rotate(p, o, amount));
      const [ix0, ix1, iy0, iy1] = bounds(image);
      if (!(ix0 >= x1 + 1 || ix1 <= x0 - 1 || iy0 >= y1 + 1 || iy1 <= y0 - 1)) continue;
      for (const start of from) {
        const arc = arcPoints(o, start, amount, 32);
        if (arc.slice(2, -2).some((p) => insideConvex(p, outline) || insideConvex(p, image))) continue;
        const [gx0, gx1, gy0, gy1] = bounds([...outline, ...image, o, ...arc]);
        const cell = gridCell(gx1 - gx0 + 2, gy1 - gy0 + 2);
        const radius = length(minus(start, o));
        if (!best || cell > best.cell + 1e-9 || (Math.abs(cell - best.cell) < 1e-9 && radius < best.radius)) best = { o, from: start, cell, radius };
      }
    }
  return best ?? { o: [x1 + 1, y0], from: from[0] };
}

/** Le sens et l'angle de l'arc d'un sommet à son image : `amount` degrés ; un demi-tour passe par le bas, hors des figures. */
function arcSweep(center: Point, from: Point, amount: number) {
  const v = minus(from, center);
  const start = Math.atan2(v[1], v[0]);
  const lowCcw = Math.sin(start + Math.PI / 2) <= Math.sin(start - Math.PI / 2);
  return { start, r: length(v), sweep: rad(amount === 180 && !lowCcw ? -180 : amount) };
}

/** Des points de l'arc (pour que le quadrillage le contienne). */
function arcPoints(center: Point, from: Point, amount: number, steps = 8): Point[] {
  const { start, r, sweep } = arcSweep(center, from, amount);
  return Array.from({ length: steps + 1 }, (_, i) => plus(center, [r * Math.cos(start + (sweep * i) / steps), r * Math.sin(start + (sweep * i) / steps)]));
}

/**
 * L'arc d'un sommet à son image, autour du centre, de `amount` degrés (sens inverse des aiguilles d'une montre) ; un
 * demi-tour passe par le bas. Avec `label`, l'arc porte sa mesure (« ? ») au milieu.
 */
function ArcAround({ center, from, amount, at, label }: { center: Point; from: Point; amount: number; at: (p: Point) => Point; label?: Value }) {
  const { start, r, sweep } = arcSweep(center, from, amount);
  const endPoint: Point = plus(center, [r * Math.cos(start + sweep), r * Math.sin(start + sweep)]);
  const mid = at(plus(center, [r * Math.cos(start + sweep / 2), r * Math.sin(start + sweep / 2)]));
  const outward = unit(minus(mid, at(center)));
  return (
    <g>
      <path d={arcPath(at(center), at(from), at(endPoint), sweep < 0, Math.abs(sweep) > Math.PI)} className={label !== undefined && isAsk(label) ? 'geo-arc geo-dash ask' : 'geo-arc geo-dash'} />
      {label !== undefined && <Label at={plus(mid, times(outward, 16))} text={degrees(label)} ask={isAsk(label)} />}
    </g>
  );
}

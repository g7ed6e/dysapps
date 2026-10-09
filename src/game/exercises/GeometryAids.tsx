// Figures de géométrie des îles de maths : un triangle et ses angles, un angle, une figure plane cotée, un solide, une
// figure et son image sur un quadrillage, un repère. Dessinées à partir de données (la ligne « figure » du contenu, voir
// scripts/contenu/format.mjs), elles montrent ce que dit l'énoncé, jamais ce que la question demande de déduire : la
// valeur cherchée s'écrit « ? », en couleur, et la description lue dit seulement qu'elle est à trouver. Les figures sont
// tracées à l'échelle (un angle de 40° a l'air d'un angle de 40°), d'un trait épais, sur un fond uni.

import type { ReactNode } from 'react';

/** Une cote : un nombre, ou un texte (« ? » pour la valeur cherchée, une lettre comme « r » ou « 7a »). */
type Value = number | string;
type Point = [number, number];

const ASK = '?';
const isAsk = (v: Value) => v === ASK;

/** 2.5 → « 2,5 », −3 → « −3 » (le vrai signe moins) ; un texte reste tel quel. */
const fmt = (v: Value) => (typeof v === 'number' ? (v < 0 ? `−${-v}` : String(v)).replace('.', ',') : v);
/** Un angle écrit : « 40° », ou « ? ». */
const degrees = (v: Value) => (typeof v === 'number' ? `${fmt(v)}°` : v);
/** Une valeur lue : « ? » devient « à trouver », jamais la réponse. */
const spoken = (v: Value, unit = '') => (isAsk(v) ? 'à trouver' : `${fmt(v)}${unit}`);
/** « a », « a et b », « a, b et c ». */
const list = (words: string[]) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} et ${words.at(-1)}`);
/** Un nombre positif pour le tracé, ou `fallback` quand la cote est un texte (« ? », une lettre). */
const size = (v: Value | undefined, fallback: number) => (typeof v === 'number' && v > 0 ? v : fallback);

// ---------- Géométrie à l'écran (y descend) ----------

const r1 = (v: number) => Math.round(v * 10) / 10;
const pts = (ps: Point[]) => ps.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
const plus = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
const minus = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
const times = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
const length = (a: Point) => Math.hypot(a[0], a[1]);
const unit = (a: Point): Point => times(a, 1 / (length(a) || 1));
const middle = (a: Point, b: Point): Point => times(plus(a, b), 0.5);
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Le point à `r` de `o` dans la direction `deg` (en degrés, sens inverse des aiguilles d'une montre, 0 vers la droite). */
const polar = (o: Point, deg: number, r: number): Point => [o[0] + r * Math.cos(rad(deg)), o[1] - r * Math.sin(rad(deg))];
/** Le chemin d'un arc de cercle de centre `o`, de `a` à `b`, dans le sens des aiguilles d'une montre ou non. */
const arcPath = (o: Point, a: Point, b: Point, clockwise: boolean, large = false) => {
  const r = r1(length(minus(a, o)));
  return `M ${r1(a[0])} ${r1(a[1])} A ${r} ${r} 0 ${large ? 1 : 0} ${clockwise ? 1 : 0} ${r1(b[0])} ${r1(b[1])}`;
};

/** Un texte de la figure, centré sur `at` ; la valeur cherchée ressort en couleur. */
function Label({ at, text, ask = false, anchor = 'middle', name = false }: { at: Point; text: string; ask?: boolean; anchor?: 'start' | 'middle' | 'end'; name?: boolean }) {
  const className = ['geo-text', name && 'geo-name', ask && 'ask'].filter(Boolean).join(' ');
  return (
    <text x={r1(at[0])} y={r1(at[1] + 6)} textAnchor={anchor} className={className}>
      {text}
    </text>
  );
}

/** Le petit carré d'un angle droit, au sommet `v`, entre les directions de `a` et de `b`. */
function RightMark({ v, a, b, side = 14, className = 'geo-right' }: { v: Point; a: Point; b: Point; side?: number; className?: string }) {
  const u = times(unit(minus(a, v)), side);
  const w = times(unit(minus(b, v)), side);
  return <polyline points={pts([plus(v, u), plus(plus(v, u), w), plus(v, w)])} className={className} />;
}

/** La marque d'égalité d'un côté : un petit trait en travers, en son milieu. */
function EqualTick({ a, b }: { a: Point; b: Point }) {
  const m = middle(a, b);
  const n = times(unit([a[1] - b[1], b[0] - a[0]]), 9);
  return <line x1={r1(m[0] - n[0])} y1={r1(m[1] - n[1])} x2={r1(m[0] + n[0])} y2={r1(m[1] + n[1])} className="geo-tick" />;
}

/**
 * Un angle marqué au sommet `vertex`, entre les directions de `from` et de `to` : un arc (un petit carré pour 90) et sa
 * mesure, dans l'angle, assez loin du sommet pour tenir entre les côtés ; `outside` l'écrit hors de la figure, derrière
 * le sommet (une petite figure sur un quadrillage).
 */
function AngleMark({ vertex, from, to, value, radius = 24, outside = false }: { vertex: Point; from: Point; to: Point; value: Value; radius?: number; outside?: boolean }) {
  const u = unit(minus(from, vertex));
  const v = unit(minus(to, vertex));
  const theta = Math.acos(Math.min(1, Math.max(-1, u[0] * v[0] + u[1] * v[1])));
  const bisector = unit(plus(u, v));
  const text = degrees(value);
  const half = text.length * 5.5;
  const distance = outside ? -(16 + half) : Math.max(radius + 22, (half + 6) / Math.tan(theta / 2));
  const clockwise = u[0] * v[1] - u[1] * v[0] > 0;
  const mark =
    value === 90 ? (
      <RightMark v={vertex} a={from} b={to} side={16} />
    ) : (
      <path d={arcPath(vertex, plus(vertex, times(u, radius)), plus(vertex, times(v, radius)), clockwise)} className={isAsk(value) ? 'geo-arc ask' : 'geo-arc'} />
    );
  return (
    <g>
      {mark}
      <Label at={plus(vertex, times(bisector, distance))} text={text} ask={isAsk(value)} />
    </g>
  );
}

/** Une flèche de `a` à `b`, sa pointe dessinée (sans marqueur SVG ni identifiant). */
function Arrow({ a, b, className = 'geo-line' }: { a: Point; b: Point; className?: string }) {
  const d = unit(minus(b, a));
  const n: Point = [-d[1], d[0]];
  const base = minus(b, times(d, 12));
  return (
    <g>
      <line x1={r1(a[0])} y1={r1(a[1])} x2={r1(base[0])} y2={r1(base[1])} className={className} />
      <polygon points={pts([b, plus(base, times(n, 6)), minus(base, times(n, 6))])} className="geo-arrowhead" />
    </g>
  );
}

/** Le cadre du dessin d'une figure de `w` sur `h` (unités, y vers le haut), à l'échelle, au centre de `box`. */
function fit(w: number, h: number, box = { x: 70, y: 24, w: 190, h: 140 }) {
  const s = Math.min(box.w / w, box.h / h);
  const ox = box.x + (box.w - w * s) / 2;
  const oy = box.y + (box.h + h * s) / 2;
  return ([x, y]: Point): Point => [ox + x * s, oy - y * s];
}

/** Les proportions d'une figure, bornées : une longueur jamais plus de trois fois l'autre (la figure reste lisible). */
function proportion(w: number, h: number): [number, number] {
  if (h > 3 * w) return [h / 3, h];
  if (w > 3 * h) return [w, w / 3];
  return [w, h];
}

// ---------- Triangle et ses angles ----------

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

// ---------- Un angle ----------

type AngleLayout = 'single' | 'straight' | 'crossed';

/**
 * Un angle en un point. `single` : l'angle seul, à côté d'un angle droit en pointillé pour comparer. `straight` : deux
 * angles côte à côte, sur une droite (un angle plat). `crossed` : deux droites qui se coupent, la mesure sur un angle et
 * « ? » sur l'angle opposé par le sommet ; les deux autres angles ne portent rien.
 */
export function AngleFigure({ layout, values }: { layout: AngleLayout; values: Value[] }) {
  const [first, second = ASK] = values;
  if (layout === 'single') {
    const theta = size(first, 60);
    const vertex: Point = theta > 90 ? [170, 165] : [70, 165];
    const end = polar(vertex, theta, 140);
    const right = polar(vertex, 0, 140);
    const square = polar(vertex, 90, 125);
    return (
      <figure className="geometry angle-figure">
        <svg viewBox="0 0 320 200" role="img" aria-label={`${isAsk(first) ? 'Un angle à trouver' : `Un angle de ${fmt(first)}°`}, à côté d’un angle droit en pointillé, pour comparer.`}>
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(square[0])} y2={r1(square[1])} className="geo-dash" />
          <RightMark v={vertex} a={right} b={square} side={18} className="geo-right geo-dash" />
          <Label at={[square[0] + 8, square[1] - 4]} text="angle droit" anchor="start" />
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(right[0])} y2={r1(right[1])} className="geo-line" />
          <line x1={vertex[0]} y1={vertex[1]} x2={r1(end[0])} y2={r1(end[1])} className="geo-line" />
          <AngleMark vertex={vertex} from={right} to={end} value={first} radius={34} />
        </svg>
      </figure>
    );
  }
  const center: Point = layout === 'straight' ? [160, 160] : [160, 105];
  // L'angle qui se trace : la mesure donnée, ou ce qui reste de 180° (angle plat) ; opposés par le sommet, ils sont égaux.
  const theta = typeof first === 'number' ? first : layout === 'straight' ? 180 - size(second, 120) : size(second, 60);
  const reach = layout === 'straight' ? 140 : 130;
  const [east, west, ray] = [polar(center, 0, reach), polar(center, 180, reach), polar(center, theta, layout === 'straight' ? reach : 95)];
  const oblique = layout === 'straight' ? reach : 95;
  const opposite = polar(center, theta + 180, oblique);
  const measure = (v: Value) => (isAsk(v) ? 'est à trouver' : `mesure ${fmt(v)}°`);
  const label =
    layout === 'straight'
      ? `Une droite et une demi-droite partant d’un de ses points : deux angles côte à côte, qui forment un angle plat. L’un ${measure(first)}, l’autre ${measure(second)}.`
      : `Deux droites qui se coupent. Un angle ${measure(first)} ; l’angle opposé par le sommet ${measure(second)} ; les deux autres angles ne sont pas marqués.`;
  return (
    <figure className="geometry angle-figure">
      <svg viewBox={layout === 'straight' ? '0 0 320 200' : '0 0 320 210'} role="img" aria-label={label}>
        <line x1={r1(west[0])} y1={r1(west[1])} x2={r1(east[0])} y2={r1(east[1])} className="geo-line" />
        {layout === 'straight' ? (
          <line x1={center[0]} y1={center[1]} x2={r1(ray[0])} y2={r1(ray[1])} className="geo-line" />
        ) : (
          <line x1={r1(opposite[0])} y1={r1(opposite[1])} x2={r1(ray[0])} y2={r1(ray[1])} className="geo-line" />
        )}
        <circle cx={center[0]} cy={center[1]} r="4" className="geo-point" />
        <AngleMark vertex={center} from={east} to={ray} value={first} radius={30} />
        {layout === 'straight' ? (
          <AngleMark vertex={center} from={ray} to={west} value={second} radius={30} />
        ) : (
          <AngleMark vertex={center} from={west} to={opposite} value={second} radius={30} />
        )}
      </svg>
    </figure>
  );
}

// ---------- Figure plane cotée ----------

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
    const say = (name: string, v: Value) => (isAsk(v) ? `${name} à trouver` : `${name} = ${fmt(v)}`);
    return `Le segment [AB] et sa médiatrice, qui le coupe en son milieu à angle droit. Le point M est sur la médiatrice : ${say('MA', p)}, ${say('MB', q)}.`;
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
    const at = fit(width, h, { x: 50, y: 18, w: 230, h: 150 });
    const corners = shape === 'triangle' ? [at([0, 0]), at([b, 0]), at([offset, h])] : [at([0, 0]), at([b, 0]), at([b + offset, h]), at([offset, h])];
    const top = corners.at(-1) as Point;
    const foot = at([offset, 0]);
    body = (
      <>
        <polygon points={pts(corners)} className="geo-shape" />
        <line x1={r1(top[0])} y1={r1(top[1])} x2={r1(foot[0])} y2={r1(foot[1])} className="geo-dash" />
        <RightMark v={foot} a={corners[1]} b={top} />
        <Label at={[middle(corners[0], corners[1])[0], corners[0][1] + 24]} text={fmt(p)} ask={isAsk(p)} />
        <Label at={[foot[0] + (shape === 'triangle' ? 10 : -10), middle(foot, top)[1]]} text={fmt(q)} ask={isAsk(q)} anchor={shape === 'triangle' ? 'start' : 'end'} />
        {shape === 'parallelogram' && r !== undefined && <Label at={[middle(corners[0], top)[0] - 12, middle(corners[0], top)[1]]} text={fmt(r)} ask={isAsk(r)} anchor="end" />}
        {/* L'aire entre la hauteur en pointillé et le côté de droite. */}
        {areaText(shape === 'triangle' ? at([0.56 * b, 0.22 * h]) : at([(1.5 * offset + b) / 2, h / 2]))}
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
      <svg viewBox="0 0 320 200" role="img" aria-label={label}>
        {body}
      </svg>
    </figure>
  );
}

// ---------- Solide ----------

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
  if (solid === 'cone') return `Un cône de rayon ${spoken(values[0])} et de hauteur ${spoken(values[1])}, la hauteur en pointillé${asked}.`;
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
          <Label at={[cx + rx / 2, bottom + 11]} text={fmt(values[0])} ask={isAsk(values[0])} />
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

// ---------- Figure et son image sur un quadrillage ----------

type TransformKind = 'translation' | 'reflection' | 'point-reflection' | 'rotation' | 'dilation';

/**
 * Un triangle aux sommets sur le quadrillage (de 0 à `w`, de 0 à `h`) dont le premier sommet, plus haut que les deux
 * autres, a l'angle le plus proche de `angle` degrés, sans angle de moins de 25° : l'angle marqué a l'air de sa mesure,
 * et sa mesure s'écrit au-dessus de lui, hors de la figure.
 */
export function gridTriangle(angle: number, w = 4, h = 3): [Point, Point, Point] {
  const grid: Point[] = [];
  for (let x = 0; x <= w; x++) for (let y = 0; y <= h; y++) grid.push([x, y]);
  const at = (v: Point, a: Point, b: Point) => {
    const [u, t] = [minus(a, v), minus(b, v)];
    return (Math.acos((u[0] * t[0] + u[1] * t[1]) / (length(u) * length(t))) * 180) / Math.PI;
  };
  let best: [Point, Point, Point] = [
    [1, h],
    [0, 0],
    [w, 0],
  ];
  let gap = Infinity;
  for (const top of grid)
    for (let j = 0; j < grid.length; j++)
      for (let k = j + 1; k < grid.length; k++) {
        const [q, r] = [grid[j], grid[k]];
        if (q[1] >= top[1] || r[1] >= top[1] || (q[0] - top[0]) * (r[1] - top[1]) - (q[1] - top[1]) * (r[0] - top[0]) === 0) continue;
        const angles = [at(top, q, r), at(q, top, r), at(r, top, q)];
        if (Math.min(...angles) < 25 || Math.abs(angles[0] - angle) >= gap - 1e-9) continue;
        gap = Math.abs(angles[0] - angle);
        best = [top, q, r];
      }
  return best;
}

/** La figure de départ, sur le quadrillage : un drapeau (son mât et sa toile), un rectangle (une aire), un triangle (un angle). */
function startShape(angles?: Value[], areas?: Value[], small = false): { outline: Point[]; pole?: [Point, Point]; name: string } {
  if (angles) return { outline: gridTriangle(size(angles[0], 50), small ? 3 : 4, 3), name: 'un triangle' };
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
    const o: Point = [maxX + 1, minY];
    center = o;
    const turns = (((Math.round(amount / 90) % 4) + 4) % 4) as 0 | 1 | 2 | 3;
    map = (p) => {
      let [x, y] = minus(p, o);
      for (let i = 0; i < turns; i++) [x, y] = [-y, x];
      return plus(o, [x, y]);
    };
  } else {
    // Homothétie : le centre assez loin à gauche pour que l'image ne recouvre pas la figure.
    const k = amount;
    const o: Point = [-Math.floor(maxX / (k - 1)) - 1, minY];
    center = o;
    map = (p) => plus(o, times(minus(p, o), k));
  }
  const image = { outline: shape.outline.map(map), pole: shape.pole && ([map(shape.pole[0]), map(shape.pole[1])] as [Point, Point]) };
  // L'arc d'un sommet à son image autour du centre : le sommet le plus loin du centre (l'arc passe hors des figures).
  const arcFrom = center && (transform === 'rotation' || (transform === 'point-reflection' && arc !== undefined)) ? pickArcVertex(all, center, transform) : undefined;
  const everything = [...all, ...image.outline, ...(image.pole ?? []), ...(center ? [center] : [])];
  if (arcFrom && center) everything.push(...arcPoints(center, arcFrom, transform === 'rotation' ? amount : 180));
  const xs = everything.map((p) => p[0]);
  const ys = everything.map((p) => p[1]);
  // Une case de marge autour des figures ; deux avec des angles, dont la mesure s'écrit hors du triangle.
  const pad = angles ? 2 : 1;
  const [gx0, gx1] = [Math.floor(Math.min(...xs)) - pad, Math.ceil(Math.max(...xs)) + pad];
  const [gy0, gy1] = [Math.floor(Math.min(...ys)) - pad, Math.ceil(Math.max(...ys)) + pad];
  const cell = Math.min(30, 300 / (gx1 - gx0), 280 / (gy1 - gy0));
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
            <AngleMark vertex={at(shape.outline[0])} from={at(shape.outline[1])} to={at(shape.outline[2])} value={angles[0]} radius={14} outside />
            <AngleMark vertex={at(image.outline[0])} from={at(image.outline[1])} to={at(image.outline[2])} value={angles[1] ?? ASK} radius={18} outside />
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

/** Le sommet d'où part l'arc : pour une rotation, le plus loin du centre ; pour un demi-tour, le plus proche de lui. */
function pickArcVertex(points: Point[], center: Point, transform: TransformKind): Point {
  const sorted = [...points].sort((a, b) => length(minus(a, center)) - length(minus(b, center)));
  return transform === 'rotation' ? (sorted.at(-1) as Point) : sorted[0];
}

/** Le sens et l'angle de l'arc d'un sommet à son image : `amount` degrés ; un demi-tour passe par le bas, hors des figures. */
function arcSweep(center: Point, from: Point, amount: number) {
  const v = minus(from, center);
  const start = Math.atan2(v[1], v[0]);
  const lowCcw = Math.sin(start + Math.PI / 2) <= Math.sin(start - Math.PI / 2);
  return { start, r: length(v), sweep: rad(amount === 180 && !lowCcw ? -180 : amount) };
}

/** Des points de l'arc (pour que le quadrillage le contienne). */
function arcPoints(center: Point, from: Point, amount: number): Point[] {
  const { start, r, sweep } = arcSweep(center, from, amount);
  return Array.from({ length: 9 }, (_, i) => plus(center, [r * Math.cos(start + (sweep * i) / 8), r * Math.sin(start + (sweep * i) / 8)]));
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

// ---------- Repère ----------

interface PlanePoint {
  name: string;
  x: number;
  y: number;
}

/** Les bornes du repère, sur les deux axes : avec −4 à 4, un point du 4 ou du −4 tomberait sur le bord. */
const PLANE_RANGE = 6;

/**
 * Un repère de −6 à 6 sur les deux axes, une graduation par unité, les nombres dans les marges (comme le graphique) et
 * les axes nommés « axe des abscisses » et « axe des ordonnées ». Vide, ses demi-axes portent « + » et « − » ; sinon,
 * les points sont placés et nommés, sans pointillés vers les axes. La description lue nomme les points, jamais leurs
 * coordonnées (les lire est souvent la question).
 */
export function CoordinatePlane({ points = [] }: { points?: PlanePoint[] }) {
  const n = PLANE_RANGE;
  const cell = 26;
  const [left, top, right, bottom] = [36, 40, 30, 58];
  const span = 2 * n * cell;
  const X = (v: number) => left + (v + n) * cell;
  const Y = (v: number) => top + (n - v) * cell;
  const values = Array.from({ length: 2 * n + 1 }, (_, i) => i - n);
  const names = points.map((p) => p.name);
  const placed = names.length === 0 ? '' : names.length === 1 ? ` Le point ${names[0]} est placé.` : ` Les points ${list(names)} sont placés.`;
  const signs = points.length === 0 ? ' Chaque demi-axe porte son signe : « + » à droite et en haut, « − » à gauche et en bas.' : '';
  const label = `Repère gradué de −6 à 6 sur les deux axes, une graduation par unité : l’axe des abscisses, horizontal, et l’axe des ordonnées, vertical.${signs}${placed}`;
  const W = left + span + right;
  const H = top + span + bottom;
  return (
    <figure className="geometry coordinate-plane">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {values.map((v) => (
          <g key={`g${v}`}>
            <line x1={X(v)} y1={Y(n)} x2={X(v)} y2={Y(-n)} className="geo-grid" />
            <line x1={X(-n)} y1={Y(v)} x2={X(n)} y2={Y(v)} className="geo-grid" />
          </g>
        ))}
        <Arrow a={[X(-n), Y(0)]} b={[X(n) + 18, Y(0)]} className="geo-line geo-thin" />
        <Arrow a={[X(0), Y(-n)]} b={[X(0), Y(n) - 18]} className="geo-line geo-thin" />
        {values.map((v) => (
          <g key={`t${v}`}>
            <line x1={X(v)} y1={Y(0) - 5} x2={X(v)} y2={Y(0) + 5} className="geo-right" />
            <line x1={X(0) - 5} y1={Y(v)} x2={X(0) + 5} y2={Y(v)} className="geo-right" />
            <text x={X(v)} y={Y(-n) + 24} textAnchor="middle" className="geo-text geo-tick-label">
              {fmt(v)}
            </text>
            <text x={X(-n) - 8} y={Y(v) + 6} textAnchor="end" className="geo-text geo-tick-label">
              {fmt(v)}
            </text>
          </g>
        ))}
        <Label at={[X(n), Y(-n) + 44]} text="axe des abscisses" anchor="end" name />
        <Label at={[X(0) + 10, top - 26]} text="axe des ordonnées" anchor="start" name />
        {points.length === 0 && (
          <>
            {(
              [
                [X(n - 0.6), Y(0) - 18, '+'],
                [X(-n + 0.6), Y(0) - 18, '−'],
                [X(0) + 18, Y(n - 0.6), '+'],
                [X(0) + 18, Y(-n + 0.6), '−'],
              ] as const
            ).map(([x, y, sign]) => (
              <text key={`${x},${y}`} x={x} y={y + 9} textAnchor="middle" className="geo-text geo-name geo-sign">
                {sign}
              </text>
            ))}
          </>
        )}
        {points.map((p) => (
          <g key={p.name}>
            <circle cx={X(p.x)} cy={Y(p.y)} r="6" className="geo-plot-point" />
            <Label at={[X(p.x) + 10, Y(p.y) - 14]} text={p.name} anchor="start" name />
          </g>
        ))}
      </svg>
    </figure>
  );
}

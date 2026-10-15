// Les outils communs des figures de géométrie : écrire une cote (virgule, signe moins, « ? »), calculer à l'écran
// (y descend), et les petits éléments dessinés partout (texte, angle droit, marque d'égalité, angle marqué, flèche).

/** Une cote : un nombre, ou un texte (« ? » pour la valeur cherchée, une lettre comme « r » ou « 7a »). */
export type Value = number | string;
export type Point = [number, number];

export const ASK = '?';
export const isAsk = (v: Value) => v === ASK;

/** 2.5 → « 2,5 », −3 → « −3 » (le vrai signe moins) ; un texte reste tel quel. */
export const fmt = (v: Value) => (typeof v === 'number' ? (v < 0 ? `−${-v}` : String(v)).replace('.', ',') : v);
/** Un angle écrit : « 40° », ou « ? ». */
export const degrees = (v: Value) => (typeof v === 'number' ? `${fmt(v)}°` : v);
/** Une valeur lue : « ? » devient « à trouver », jamais la réponse. */
export const spoken = (v: Value, unit = '') => (isAsk(v) ? 'à trouver' : `${fmt(v)}${unit}`);
/** « a », « a et b », « a, b et c ». */
export const list = (words: string[]) => (words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} et ${words.at(-1)}`);
/** Un nombre positif pour le tracé, ou `fallback` quand la cote est un texte (« ? », une lettre). */
export const size = (v: Value | undefined, fallback: number) => (typeof v === 'number' && v > 0 ? v : fallback);

// ---------- Géométrie à l'écran (y descend) ----------

export const r1 = (v: number) => Math.round(v * 10) / 10;
export const pts = (ps: Point[]) => ps.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
export const plus = (a: Point, b: Point): Point => [a[0] + b[0], a[1] + b[1]];
export const minus = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];
export const times = (a: Point, k: number): Point => [a[0] * k, a[1] * k];
export const length = (a: Point) => Math.hypot(a[0], a[1]);
export const unit = (a: Point): Point => times(a, 1 / (length(a) || 1));
export const middle = (a: Point, b: Point): Point => times(plus(a, b), 0.5);
export const rad = (deg: number) => (deg * Math.PI) / 180;
/** Le point à `r` de `o` dans la direction `deg` (en degrés, sens inverse des aiguilles d'une montre, 0 vers la droite). */
export const polar = (o: Point, deg: number, r: number): Point => [o[0] + r * Math.cos(rad(deg)), o[1] - r * Math.sin(rad(deg))];
/** Le chemin d'un arc de cercle de centre `o`, de `a` à `b`, dans le sens des aiguilles d'une montre ou non. */
export const arcPath = (o: Point, a: Point, b: Point, clockwise: boolean, large = false) => {
  const r = r1(length(minus(a, o)));
  return `M ${r1(a[0])} ${r1(a[1])} A ${r} ${r} 0 ${large ? 1 : 0} ${clockwise ? 1 : 0} ${r1(b[0])} ${r1(b[1])}`;
};

/** Un texte de la figure, centré sur `at` ; la valeur cherchée ressort en couleur. */
export function Label({ at, text, ask = false, anchor = 'middle', name = false }: { at: Point; text: string; ask?: boolean; anchor?: 'start' | 'middle' | 'end'; name?: boolean }) {
  const className = ['geo-text', name && 'geo-name', ask && 'ask'].filter(Boolean).join(' ');
  return (
    <text x={r1(at[0])} y={r1(at[1] + 7)} textAnchor={anchor} className={className}>
      {text}
    </text>
  );
}

/** Le petit carré d'un angle droit, au sommet `v`, entre les directions de `a` et de `b`. */
export function RightMark({ v, a, b, side = 14, className = 'geo-right' }: { v: Point; a: Point; b: Point; side?: number; className?: string }) {
  const u = times(unit(minus(a, v)), side);
  const w = times(unit(minus(b, v)), side);
  return <polyline points={pts([plus(v, u), plus(plus(v, u), w), plus(v, w)])} className={className} />;
}

/** La marque d'égalité d'un côté : un petit trait en travers, en son milieu. */
export function EqualTick({ a, b }: { a: Point; b: Point }) {
  const m = middle(a, b);
  const n = times(unit([a[1] - b[1], b[0] - a[0]]), 9);
  return <line x1={r1(m[0] - n[0])} y1={r1(m[1] - n[1])} x2={r1(m[0] + n[0])} y2={r1(m[1] + n[1])} className="geo-tick" />;
}

/** La demi-largeur et la demi-hauteur d'un texte des figures (21 px, police de l'application). */
const textHalf = (text: string): Point => [text.length * 6.5 + 2, 9];

/** Au plus cette distance du sommet à l'étiquette d'un angle : au-delà (un angle très fermé), elle s'écrit derrière le sommet. */
const MAX_LABEL_DISTANCE = 100;

/**
 * Un angle marqué au sommet `vertex`, entre les directions de `from` et de `to` : un arc (un petit carré pour 90) et sa
 * mesure, dans l'angle, au-delà de l'arc et assez loin du sommet pour tenir entre les côtés (au moins `minDistance`, et
 * `spread` de plus pour l'écarter des traits). Un angle trop fermé pour la loger a sa mesure derrière le sommet, hors de
 * l'angle, à côté de lui.
 */
export function AngleMark({
  vertex,
  from,
  to,
  value,
  radius = 24,
  minDistance = 0,
  spread = 0,
}: {
  vertex: Point;
  from: Point;
  to: Point;
  value: Value;
  radius?: number;
  minDistance?: number;
  spread?: number;
}) {
  const u = unit(minus(from, vertex));
  const v = unit(minus(to, vertex));
  const theta = Math.acos(Math.min(1, Math.max(-1, u[0] * v[0] + u[1] * v[1])));
  const bisector = unit(plus(u, v));
  const text = degrees(value);
  // Le texte est une boîte : son étendue le long de la bissectrice, et en travers d'elle.
  const [hw, hh] = textHalf(text);
  const along = hw * Math.abs(bisector[0]) + hh * Math.abs(bisector[1]);
  const across = hw * Math.abs(bisector[1]) + hh * Math.abs(bisector[0]);
  const inside = Math.max(minDistance, radius + 6 + along, along + (across + 5) / Math.tan(theta / 2)) + spread;
  const distance = inside <= MAX_LABEL_DISTANCE ? inside : -(along + 12);
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
export function Arrow({ a, b, className = 'geo-line' }: { a: Point; b: Point; className?: string }) {
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
export function fit(w: number, h: number, box = { x: 70, y: 24, w: 190, h: 140 }) {
  const s = Math.min(box.w / w, box.h / h);
  const ox = box.x + (box.w - w * s) / 2;
  const oy = box.y + (box.h + h * s) / 2;
  return ([x, y]: Point): Point => [ox + x * s, oy - y * s];
}

/** Les proportions d'une figure, bornées : une longueur jamais plus de trois fois l'autre (la figure reste lisible). */
export function proportion(w: number, h: number): [number, number] {
  if (h > 3 * w) return [h / 3, h];
  if (w > 3 * h) return [w, w / 3];
  return [w, h];
}

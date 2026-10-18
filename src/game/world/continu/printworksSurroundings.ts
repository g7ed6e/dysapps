/**
 * Les abords de la scénette de l'Imprimerie (reprise lieu par lieu, d'après le concept du 18 octobre 2026) : ce que
 * l'imprimeur a monté dans la cour, autour du sol de terre battue où se tiennent Kéo et lui, fini de chaque côté puisque
 * la caméra tourne (« caméra libre »). La caméra s'ouvre un peu depuis le sud-ouest (scenette.ts, `PRINTWORKS_START`) et la
 * scène est décalée à l'est du lieu (printworks.ts, `SCENE_SHIFT`) : l'atelier du lieu passe à gauche, sous le panneau, et
 * la moitié droite du cadre montre, au nord-est, l'atelier ouvert sous sa charpente (la ferme de devant à nu, le toit
 * d'ardoise en réparation et son échelle), la presse dedans et une caisse de feuilles ; entre la scène et l'atelier du
 * lieu, la grande corde où sèchent les feuilles (crème, plus petites que celles des réponses et ombrées comme le reste :
 * rien ne s'y lit) ; le chemin de terre qui va de la scène à l'atelier ouvert, les caisses et le tonneau. Le sentier qui
 * arrive à la porte du lieu est de la même terre, raccordé au sol de la scène. Tout autour, des buissons, des rochers de
 * pierre chaude et des touffes ; à l’ouest, la pile de planches. Rien de haut entre la caméra de face et Kéo, l'imprimeur et
 * la rangée des feuilles. Des aplats francs, une couleur par facette ; aucun appel de plus (le décor de près).
 */
import type { FacetBuilder } from './facets';
import { shadowColor } from './flora';
import type { Vec3 } from './geometry';
import { pathSand } from './paths';
import { standingPress } from './printworks';
import { SHADOW_DIR } from './sky';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, NATURE, STONE, TIMBER, barrel, groundAt as groundOf, plankStack, rock as stone, tuft, type P3, type RockTones } from './surroundingsKit';
import { buildHeightField, heightOnMesh } from './terrain';

/** Les couleurs propres aux abords de l'Imprimerie (le reste vient du kit). */
const C = {
  /** La terre battue du chemin et du sentier : celle du sol de la scène (printworks.ts, `earth`). */
  earth: 0xcfa978,
  /** L'atelier ouvert : l'enduit crème, les colombages et la charpente, l'ardoise en deux tons, le faîtage. */
  wall: 0xf0e6d0,
  timber: 0x9a6e45,
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  ridge: 0x40608c,
  /** Le voligeage à nu, les liteaux neufs et l'échelle de bois clair (la réparation). */
  bare: 0xb98f5c,
  lath: 0xe6c88f,
  /** La fenêtre du pignon est : un gris-bleu, jamais un trou noir. */
  glass: 0x6f8c99,
  /** Les feuilles qui sèchent : un crème chaud, ombré (le papier blanc sans ombre reste aux réponses, printworks.ts). */
  sheet: 0xf0e6cf,
  sheetBack: 0xe4d8bd,
  rope: 0xc9a36a,
  /** Les caisses : les planches, leur cerclage plus sombre. */
  crate: 0xc08c55,
  crateBand: 0x8a6440,
} as const;

/** Les buissons : un rocher du kit, en deux verts de buisson (flora.ts) et un dessus plus clair. */
const BUSH: RockTones = { light: 0x55b083, shade: 0x3f9a74, top: 0x6cc092 };

/** Le sol en un point (le terrain, jamais sous l'eau). */
const groundAt = (x: number, z: number): number => groundOf(x, z, 0, 0);

/**
 * L'atelier ouvert, dans le repère du sol de la scène (x à l'est, z au sud) : son milieu, son cap (la ferme ouverte vers
 * la caméra de départ), sa largeur le long de la ferme, sa profondeur, la hauteur de ses murs, la hauteur de son faîtage
 * au-dessus d'eux. Au nord-est de la scène, à l'est de l'atelier du lieu (sa plaque d'ardoise tombée comprise), sur la
 * cour encore plate.
 */
const SHED = { x: 4.9, z: -6.8, yaw: -0.3, width: 3.0, depth: 2.4, wall: 2.1, rise: 1.15 } as const;

/** La corde de séchage : ses deux poteaux (x, z), la hauteur de la corde, le creux au milieu, le nombre de feuilles. */
const LINE = { a: { x: -0.9, z: -2.8 }, b: { x: 2.4, z: -2.4 }, height: 2.05, sag: 0.12, sheets: 6 } as const;

/** Le chemin de terre de la scène à l'atelier ouvert : ses points (x, z), sa largeur. */
const TRACK = { points: [[3.3, -1.4], [3.7, -3.0], [4.2, -4.3], [4.5, -5.3]] as const, width: 1.0 } as const;

export function printworksSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  const X = (dx: number) => floor.x + dx;
  const Z = (dz: number) => floor.z + dz;
  earthPath(b, floor);
  track(b, floor);
  openShed(b, X(SHED.x), Z(SHED.z));
  dryingLine(b, floor);
  for (const [dx, dz, stacked] of CRATES) crate(b, X(dx), Z(dz), stacked);
  barrel(b, X(-1.6), groundAt(X(-1.6), Z(-3.2)), Z(-3.2));
  plankStack(b, X(-7.5), groundAt(X(-7.5), Z(-3.0)) + 0.02, Z(-3.0), [3, 2, 2], 2.2);
  for (const [i, [dx, dz, r]] of BUSHES.entries()) {
    const y = groundAt(X(dx), Z(dz));
    shadow(b, X(dx), y, Z(dz), r);
    stone(b, { x: X(dx), y: y + 0.05, z: Z(dz) }, r, r * 1.1, i + 70, BUSH);
  }
  for (const [i, [dx, dz, r]] of ROCKS.entries()) {
    const y = groundAt(X(dx), Z(dz));
    shadow(b, X(dx), y, Z(dz), r);
    stone(b, { x: X(dx), y: y + 0.05, z: Z(dz) }, r, r * 0.8, i + 40);
  }
  for (const [i, [dx, dz, s]] of TUFTS.entries()) tuft(b, { x: X(dx), y: groundAt(X(dx), Z(dz)), z: Z(dz) }, i + 90, GREEN_TUFT, s);
}

/** Les caisses : x, z, et si une seconde caisse, chargée de feuilles, est posée dessus. */
const CRATES: readonly (readonly [number, number, boolean])[] = [
  [6.4, -4.9, true],
  [3.3, -4.3, false],
];

/** Les buissons : x, z, rayon. */
const BUSHES: readonly (readonly [number, number, number])[] = [
  [7.1, -3.4, 0.55],
  [7.6, -8.4, 0.7],
  [-6.6, 2.0, 0.6],
  [5.6, 6.2, 0.5],
  [-8.6, 4.4, 0.55],
];

/** Les rochers de pierre chaude : x, z, rayon. */
const ROCKS: readonly (readonly [number, number, number])[] = [
  [7.6, -1.6, 0.5],
  [-6.6, -0.6, 0.55],
  [-5.2, 3.4, 0.4],
  [6.0, 4.4, 0.45],
  [8.6, -6.2, 0.6],
];

/** Les touffes d'herbe : x, z, taille. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [6.2, -2.6, 1],
  [7.9, -4.4, 0.9],
  [6.9, -6.0, 1],
  [5.7, -3.9, 0.8],
  [5.1, -1.2, 0.9],
  [-5.9, 1.2, 1],
  [-7.2, -2.0, 0.9],
  [-4.4, 4.4, 0.9],
  [4.6, 5.0, 1],
  [1.2, 5.8, 0.9],
  [8.4, -0.4, 1],
  [6.4, 2.6, 0.9],
];

/**
 * Le sentier qui arrive à la porte du lieu (directeur artistique : un chemin de terre) : son sable repeint de la terre
 * battue du sol de la scène, sur sa liaison et au nœud de la porte ; puis, du nœud au bord sud du sol de la scène, une
 * bande de la même terre, à ras du sol (le sol de la scène se raccorde au chemin).
 */
function earthPath(b: FacetBuilder, f: Vec3): void {
  const field = buildHeightField();
  const ground = (x: number, z: number) => heightOnMesh(field, x, z);
  pathSand(b, ground, [['imp-1', 'printworks']], ['printworks'], { color: C.earth, lift: 0.012 });
  const x0 = f.x - 1.7,
    x1 = f.x - 0.7,
    z0 = f.z + 1.5,
    z1 = f.z + 3.3;
  const y = (x: number, z: number) => groundAt(x, z) + 0.03;
  b.quad([x0, y(x0, z1), z1], [x1, y(x1, z1), z1], [x1, y(x1, z0), z0], [x0, y(x0, z0), z0], C.earth);
}

/** Le chemin de terre de la scène à l'atelier ouvert : une bande à ras du sol, d'un point à l'autre. */
function track(b: FacetBuilder, f: Vec3): void {
  const pts = TRACK.points.map(([dx, dz]) => ({ x: f.x + dx, z: f.z + dz }));
  const half = TRACK.width / 2;
  // Les bords à chaque point : perpendiculaires à la direction moyenne.
  const edges = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)],
      c = pts[Math.min(pts.length - 1, i + 1)];
    const dx = c.x - a.x,
      dz = c.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l,
      nz = dx / l;
    const at = (s: number): P3 => {
      const x = p.x + s * nx * half,
        z = p.z + s * nz * half;
      return [x, groundAt(x, z) + 0.035, z];
    };
    return [at(-1), at(1)] as const;
  });
  for (let i = 0; i + 1 < edges.length; i++) up(b, edges[i][0], edges[i][1], edges[i + 1][1], edges[i + 1][0], C.earth);
}

/** Un quadrilatère tourné vers le ciel, quel que soit l'ordre de ses sommets. */
function up(b: FacetBuilder, p: P3, q: P3, r: P3, s: P3, color: number): void {
  const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
  if (ny >= 0) b.quad(p, q, r, s, color);
  else b.quad(p, s, r, q, color);
}

/**
 * L'atelier ouvert, en (x, z) dans le monde : sur un socle de pierre chaude, son plancher ; ouvert sur sa face de devant
 * et sur son flanc ouest (vers la scène) ; au revers, un mur de planches en bas, d'enduit en haut, et son pignon ; à
 * l'est, un mur d'enduit, sa fenêtre. Quatre poteaux, deux sablières, la ferme de devant à nu (entrait, arbalétriers,
 * poinçon, deux contrefiches), deux aisseliers ; le toit d'ardoise à deux pans, le faîtage dans la profondeur ; sur le pan
 * est, le devant déposé (le voligeage à nu, trois liteaux neufs) et l'échelle posée dessus. Dedans, la presse à bras et
 * une caisse de feuilles.
 */
function openShed(b: FacetBuilder, x: number, z: number): void {
  const { yaw, width: W, depth: D, wall, rise } = SHED;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const at = (u: number, w: number) => ({ x: x + u * c + w * s, z: z - u * s + w * c });
  // Le plancher : un rien au-dessus du sol du devant et du milieu (le revers, plus haut, s'enfonce sous les murs).
  let low = Infinity,
    high = -Infinity;
  for (const [u, w] of [[-W / 2, D / 2], [W / 2, D / 2], [0, 0], [-W / 2, -D / 2]]) {
    const p = at(u, w);
    const g = groundAt(p.x, p.z);
    low = Math.min(low, g);
    high = Math.max(high, g);
  }
  const floor = high + 0.25;
  const L = (u: number, v: number, w: number): P3 => {
    const p = at(u, w);
    return [p.x, floor + v, p.z];
  };
  const V = (u: number, v: number, w: number) => {
    const [px, py, pz] = L(u, v, w);
    return { x: px, y: py, z: pz };
  };
  shadow(b, x, low, z, 2.0);
  b.box({ x, y: low - 0.25, z, yaw }, [W + 0.3, floor - low + 0.25, D + 0.3], STONE.side, TIMBER.plank);
  // Les murs : au revers (planches en bas, enduit en haut), à l'est (enduit, planches en bas, sa fenêtre et son appui).
  const back = at(0, -D / 2 + 0.06);
  b.box({ x: back.x, y: floor, z: back.z, yaw }, [W, 0.9, 0.12], TIMBER.plankSide, TIMBER.plank);
  b.box({ x: back.x, y: floor + 0.9, z: back.z, yaw }, [W, wall - 0.9, 0.1], C.wall);
  const east = at(W / 2 - 0.06, 0);
  b.box({ x: east.x, y: floor, z: east.z, yaw }, [0.12, 0.9, D], TIMBER.plankSide, TIMBER.plank);
  b.box({ x: east.x, y: floor + 0.9, z: east.z, yaw }, [0.1, wall - 0.9, D], C.wall);
  const win = at(W / 2 + 0.01, 0.1);
  b.box({ x: win.x, y: floor + 1.1, z: win.z, yaw }, [0.06, 0.6, 0.8], C.glass);
  b.box({ x: win.x, y: floor + 1.02, z: win.z, yaw }, [0.14, 0.08, 1.0], C.timber);
  // Le pignon du revers, d'enduit, ses deux faces.
  const g0 = L(-W / 2, wall, -D / 2 + 0.06),
    g1 = L(W / 2, wall, -D / 2 + 0.06),
    g2 = L(0, wall + rise, -D / 2 + 0.06);
  b.triangle(g0, g1, g2, C.wall);
  b.triangle(g1, g0, g2, C.wall);
  // Les poteaux, les sablières, la ferme de devant et ses aisseliers.
  for (const [su, sw] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
    const p = at(su * (W / 2 - 0.09), sw * (D / 2 - 0.09));
    b.box({ x: p.x, y: floor, z: p.z, yaw }, [0.18, wall, 0.18], C.timber);
  }
  for (const su of [-1, 1]) b.beam(V(su * (W / 2 - 0.09), wall, -D / 2 - 0.1), V(su * (W / 2 - 0.09), wall, D / 2 + 0.1), 0.16, C.timber);
  const wf = D / 2 - 0.09;
  b.beam(V(-W / 2 - 0.1, wall - 0.05, wf), V(W / 2 + 0.1, wall - 0.05, wf), 0.18, C.timber);
  for (const su of [-1, 1]) {
    b.beam(V(su * (W / 2 + 0.25), wall - 0.15, wf), V(0, wall + rise - 0.02, wf), 0.15, C.timber);
    b.beam(V(0, wall + 0.1, wf), V(su * W * 0.24, wall + rise * 0.52, wf), 0.1, C.timber);
    b.beam(V(su * (W / 2 - 0.09), wall - 0.55, wf), V(su * (W / 2 - 0.6), wall - 0.05, wf), 0.1, C.timber);
  }
  b.beam(V(0, wall, wf), V(0, wall + rise - 0.05, wf), 0.14, C.timber);
  roof(b, L, V);
  // Dedans : la presse, face au devant, à l'ouest du milieu ; une caisse de feuilles dans le coin est du revers.
  const press = at(-0.5, -0.25);
  standingPress(b, { x: press.x, y: floor, z: press.z }, yaw);
  const box = at(0.85, -0.55);
  crate(b, box.x, box.z, false, floor);
}

/**
 * Le toit de l'atelier ouvert, dans son repère (`L` : u le long de la ferme, v au-dessus du plancher, w vers le devant) :
 * deux pans d'ardoise de l'égout au faîtage, leur dessous de bois, les rives de l'égout ; le faîtage ; sur le pan est, le
 * devant déposé, le voligeage à nu, trois liteaux, et l'échelle posée dessus.
 */
function roof(b: FacetBuilder, L: (u: number, v: number, w: number) => P3, V: (u: number, v: number, w: number) => Vec3): void {
  const { width: W, depth: D, wall, rise } = SHED;
  const ue = W / 2 + 0.28,
    ve = wall - 0.26,
    vr = wall + rise + 0.06;
  const wb = -D / 2 - 0.35,
    wf = D / 2 + 0.4;
  // Un point d'un pan : `t` de l'égout (0) au faîtage (1), `w` dans la profondeur ; `side` −1 à l'ouest, +1 à l'est.
  const pt = (side: number, t: number, w: number, lift = 0): P3 => L(side * ue * (1 - t), ve + t * (vr - ve) + lift, w);
  const pan = (side: number, t0: number, t1: number, w0: number, w1: number, color: number, lift = 0) => up(b, pt(side, t0, w0, lift), pt(side, t1, w0, lift), pt(side, t1, w1, lift), pt(side, t0, w1, lift), color);
  const under = (side: number) => {
    // Le dessous, vu d'en bas : l'ordre inverse d'un pan vu d'en haut.
    const p = [pt(side, 0, wf, -0.05), pt(side, 1, wf, -0.05), pt(side, 1, wb, -0.05), pt(side, 0, wb, -0.05)];
    const ny = (p[1][2] - p[0][2]) * (p[2][0] - p[0][0]) - (p[1][0] - p[0][0]) * (p[2][2] - p[0][2]);
    if (ny < 0) b.quad(p[0], p[1], p[2], p[3], TIMBER.plankSide);
    else b.quad(p[0], p[3], p[2], p[1], TIMBER.plankSide);
  };
  // Le pan ouest, entier, en deux bandes d'ardoise.
  pan(-1, 0, 0.5, wb, wf, C.slate);
  pan(-1, 0.5, 1, wb, wf, C.slateLight);
  under(-1);
  // Le pan est : l'ardoise sur le revers, le devant déposé.
  const wm = wf - 1.25;
  pan(1, 0, 0.5, wb, wm, C.slate);
  pan(1, 0.5, 1, wb, wm, C.slateLight);
  pan(1, 0, 1, wm, wf, C.bare);
  under(1);
  for (const t of [0.22, 0.5, 0.78]) {
    const a = pt(1, t, wm + 0.05, 0.05),
      c2 = pt(1, t, wf - 0.05, 0.05);
    b.beam({ x: a[0], y: a[1], z: a[2] }, { x: c2[0], y: c2[1], z: c2[2] }, 0.06, C.lath);
  }
  // Les rives de l'égout et le faîtage.
  for (const side of [-1, 1]) b.beam(V(side * ue, ve - 0.04, wb), V(side * ue, ve - 0.04, wf), 0.1, C.ridge);
  b.beam(V(0, vr + 0.02, wb - 0.05), V(0, vr + 0.02, wf + 0.05), 0.16, C.ridge);
  // L'échelle, posée sur le pan est, du bas de l'égout jusque sous le faîtage, sur le voligeage à nu.
  const wl = wf - 0.65;
  const rail = (dw: number) => b.beam(toV(pt(1, -0.08, wl + dw, 0.12)), toV(pt(1, 0.86, wl + dw, 0.12)), 0.06, C.lath);
  rail(-0.22);
  rail(0.22);
  for (const t of [0.15, 0.42, 0.69]) b.beam(toV(pt(1, t, wl - 0.24, 0.14)), toV(pt(1, t, wl + 0.24, 0.14)), 0.05, C.lath);
}

const toV = (p: P3): Vec3 => ({ x: p[0], y: p[1], z: p[2] });

/**
 * La grande corde de séchage, de biais devant l'atelier du lieu : deux poteaux de formes différentes (un carré et sa
 * jambe de force, un rond coiffé d'une cheville), la corde un peu creuse au milieu, et ses feuilles crème pendues côte à
 * côte, de tailles un peu inégales, immobiles, rien d'écrit dessus.
 */
function dryingLine(b: FacetBuilder, f: Vec3): void {
  const a = { x: f.x + LINE.a.x, z: f.z + LINE.a.z },
    c = { x: f.x + LINE.b.x, z: f.z + LINE.b.z };
  const ga = groundAt(a.x, a.z),
    gc = groundAt(c.x, c.z);
  const top = Math.max(ga, gc) + LINE.height;
  b.box({ x: a.x, y: ga - 0.2, z: a.z }, [0.16, top + 0.08 - ga + 0.2, 0.16], C.timber);
  b.beam({ x: a.x - 0.45, y: ga, z: a.z + 0.25 }, { x: a.x - 0.04, y: ga + 0.9, z: a.z + 0.02 }, 0.08, C.timber);
  b.prism({ x: c.x, y: gc - 0.2, z: c.z }, 0.07, 0.06, top + 0.14 - gc + 0.2, 6, TIMBER.stave);
  b.box({ x: c.x, y: top + 0.14, z: c.z, yaw: 0.4 }, [0.12, 0.07, 0.12], C.timber);
  const mid = { x: (a.x + c.x) / 2, y: top - LINE.sag, z: (a.z + c.z) / 2 };
  b.beam({ x: a.x, y: top, z: a.z }, mid, 0.03, C.rope);
  b.beam(mid, { x: c.x, y: top, z: c.z }, 0.03, C.rope);
  // La hauteur de la corde à `t` (de 0 en `a` à 1 en `c`) : creuse au milieu.
  const ropeY = (t: number) => top - LINE.sag * (1 - Math.abs(2 * t - 1));
  const len = Math.hypot(c.x - a.x, c.z - a.z);
  const dx = (c.x - a.x) / len,
    dz = (c.z - a.z) / len;
  const yaw = Math.atan2(-dz, dx);
  for (let k = 0; k < LINE.sheets; k++) {
    const t = (k + 0.75) / (LINE.sheets + 0.5);
    const w = 0.36 + 0.06 * ((k * 5) % 3),
      h = 0.42 + 0.05 * ((k * 7) % 3);
    const p = { x: a.x + dx * len * t, z: a.z + dz * len * t };
    const y = ropeY(t) - 0.02;
    const outline: [number, number][] = [
      [-w / 2, -h],
      [w / 2, -h],
      [w / 2, 0],
      [-w / 2, 0],
    ];
    b.plate({ x: p.x, y, z: p.z, yaw }, outline, C.sheet);
    b.plate({ x: p.x, y, z: p.z, yaw: yaw + Math.PI }, outline, C.sheet);
  }
}

/**
 * Une caisse de bois posée en (x, z) (sur le sol, ou sur `on`) : son corps, son cerclage plus sombre ; `stacked` : une
 * seconde caisse dessus, de biais, et sur elle une pile de feuilles crème.
 */
function crate(b: FacetBuilder, x: number, z: number, stacked: boolean, on?: number): void {
  const y = on ?? groundAt(x, z);
  b.box({ x, y, z, yaw: 0.2 }, [0.62, 0.5, 0.5], C.crate, TIMBER.plank);
  b.box({ x, y: y + 0.2, z, yaw: 0.2 }, [0.66, 0.08, 0.54], C.crateBand);
  if (!stacked) {
    b.box({ x, y: y + 0.5, z, yaw: 0.1 }, [0.42, 0.12, 0.32], C.sheetBack, C.sheet);
    return;
  }
  b.box({ x: x + 0.05, y: y + 0.5, z, yaw: -0.15 }, [0.56, 0.42, 0.46], C.crate, TIMBER.plank);
  b.box({ x: x + 0.05, y: y + 0.92, z, yaw: -0.05 }, [0.4, 0.1, 0.3], C.sheetBack, C.sheet);
}

/** Une ombre peinte à l'opposé du soleil (sept triangles, l'herbe assombrie), son bord côté soleil au pied. */
function shadow(b: FacetBuilder, x: number, y: number, z: number, radius: number): void {
  const n = 7;
  const long = radius * 1.6;
  const cx = x + SHADOW_DIR.x * (long - radius),
    cz = z + SHADOW_DIR.z * (long - radius);
  const color = shadowColor(NATURE.grass);
  const c: P3 = [cx, y + 0.04, cz];
  const rim = Array.from({ length: n }, (_, k): P3 => {
    const u = long * Math.cos((2 * Math.PI * k) / n);
    const v = radius * Math.sin((2 * Math.PI * k) / n);
    return [cx + u * SHADOW_DIR.x - v * SHADOW_DIR.z, y + 0.04, cz + u * SHADOW_DIR.z + v * SHADOW_DIR.x];
  });
  for (let k = 0; k < n; k++) b.triangle(c, rim[(k + 1) % n], rim[k], color);
}

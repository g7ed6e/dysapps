// Les Instants (GD-22, lot 8 ; intention du directeur artistique du 20 octobre 2026, planche de rendu de près validée par
// le mainteneur) : « une chaussée de pierres levées à travers le marais, qui se perd dans la brume ». Le cœur, sans figure,
// est la chaussée : une file de pierres dressées, en alternance haute et basse, et le chemin de dalles de pierre entre
// elles, posés sur l'eau calme d'un marais ouvert. Elle part du débarcadère de planches de la rive est, où Kéo arrive (sa
// porte est dans l'axe), et court vers le nord-ouest (37° à l'ouest du nord) : à l'arrivée de « Y aller », la caméra
// tournée sur son axe (`doorView`) la voit partir du bas de l'image et filer droit vers la brume du grand chenal ; la
// scénette, elle, reste tournée vers le nord. À droite, l'abri du tailleur sur son îlot ; au bout, au-delà des dernières
// pierres, quatre pierres en silhouette dans la brume du chenal.
// Les seuls signes : un demi-soleil à cinq rayons droits sur une ligne plate, gravé en creux (plus sombre que la face),
// levant sur la face tournée vers l'arrivée, couchant sur la face tournée vers le bout.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. La première pierre penche, intacte, avec dans sa face le
// creux rond aux broches de fer nues (le cadran parti, avant comme après) ; deux pierres penchent nettement, une est
// cassée en deux (trois blocs dans l'eau), cinq sont couchées, à demi enfoncées, dont une le soleil vers le ciel ; les
// dalles sont inclinées, à demi noyées, avec des vides ; un linteau tombé dans l'eau. L'abri : l'auvent de roseaux à moitié
// affaissé, le muret cassé, l'établi debout, son bloc à demi taillé, le maillet et le ciseau posés à plat ; sa lanterne
// allumée à son poteau (le tailleur vit là : la seule lumière de la ruine, fixe). Le corps, en deux parties : la première
// pierre redressée et les pierres de la rive est, la moitié est des dalles ; puis les autres pierres et la seconde moitié.
// Le haut, en deux parties : les deux arches (deux paires de pierres, chacune sous un linteau gris à la bande de racines
// en vert-de-gris) ; puis la lanterne pendue sous la première, qui s'allume avec elle. Les abords : l'abri refait, la pile
// de blocs équarris, un petit débarcadère de pierre. Une trace par mission, chacune avec sa partie (`stage`, `row` :
// 2+2+1). Rien ne bouge, rien à lire dans la 3D. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder, type Facets } from './facets';
import { insidePolygon, type Vec2, type Vec3 } from './geometry';
import type { MistSpot } from './mist5e';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/**
 * Les couleurs des Instants : la pierre grise des Passeurs en grandes facettes (la famille du dôme du Hameau, tirée vers
 * le gris), le motif plus sombre que la face (le creux), le creux du cadran (brun-gris, jamais presque noir), les dalles en
 * deux tons, l'eau du marais (celle des rives du 5e), la vase des bords, l'herbe sèche de l'îlot, le roseau doré des
 * Roselières, le bois neuf et le bois gris, l'auvent de roseaux, le vert-de-gris de la bande des linteaux ; la seule
 * lumière, l'ocre des lanternes. Les pierres en silhouette, d'un gris pâle, presque celui de la brume.
 */
const C = {
  stone: 0xa39e90,
  stoneShade: 0x8b877b,
  motif: 0x6a645a,
  hollow: 0x5b554c,
  iron: 0x6f6a60,
  slab: 0xa8a395,
  slabAlt: 0x9c978a,
  slabSide: 0x837e72,
  water: COLORS_5E.waterShallow,
  // La vase des bords, entre celle des rives du 5e et la mousse du sol : la pente se fond dans le sol de la forêt.
  mud: 0x606b55,
  grass: 0x8a8558,
  grassShade: 0x76724c,
  reed: 0xc6a55e,
  reedShade: 0xa5874b,
  newWood: 0xa68672,
  plank: COLORS_5E.plank,
  plankAlt: 0x8f7352,
  plankShade: COLORS_5E.plankShade,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  // L'auvent de roseaux, nettement plus clair que le bois de l'établi et des poteaux (retouche du lot 8).
  thatch: 0xd6bd7c,
  thatchShade: 0xbca163,
  lantern: COLORS_5E.lantern,
  lanternOff: 0xbfc4b8,
  bronze: 0xb8954f,
  rope: 0xd8c49a,
  verdigris: 0x6f9a8a,
  ghost: 0xb7b9b1,
  ghostShade: 0xa8aaa3,
  // Les galets de la question : ronds, d'un gris beige plus clair que la pierre taillée.
  pebble: 0xbab3a4,
  pebbleTop: 0xcbc5b7,
  // Le tailleur, en pion (son modèle 3D prend sa place, ./habitants.ts) : blouse grise, tablier de cuir, pantalon brun.
  smock: 0xa9a496,
  leather: 0x8a6446,
  trousers: 0x6b4f3a,
  boots: 0x55595a,
  head: 0xe3b48a,
} as const;

// ---------- Le repère de la chaussée ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'instants')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/**
 * La chaussée, dans le repère du lieu : son départ (`E0`, au bord nord du débarcadère), le sens où elle file (`U`, vers le
 * nord-ouest, 37° à l'ouest du nord, et le grand chenal), et sa droite (`R`, regardée depuis le débarcadère). La porte du lieu est dans son
 * axe, cinq unités avant le départ.
 */
const E0: Vec2 = { x: 0.2, z: 3.4 };
const U: Vec2 = { x: -0.6, z: -0.8 };
const R: Vec2 = { x: 0.8, z: -0.6 };

/** Un point de la chaussée (`s` le long d'elle depuis son départ, `t` vers sa droite), dans le repère du lieu. */
export const onCauseway = (s: number, t: number): Vec2 => ({ x: E0.x + U.x * s + R.x * t, z: E0.z + U.z * s + R.z * t });

/**
 * Le cap du repère de la face (le dessin de la chaussée, ./facets.ts, `Placement.yaw`) : x vers la droite (`R`), z vers le
 * débarcadère (−`U`), y en haut. Un point (s, t) de la chaussée y est en (x = t, z = −s).
 */
const FACE_YAW = Math.atan2(-U.x, -U.z);

/** Pose des facettes dessinées dans un repère (bascule autour de x, quart de tour, déplacement), normales comprises. */
function posed(f: Facets, at: { x: number; y: number; z: number; yaw: number; pitch?: number }): Facets {
  const cy = Math.cos(at.yaw),
    sy = Math.sin(at.yaw),
    cp = Math.cos(at.pitch ?? 0),
    sp = Math.sin(at.pitch ?? 0);
  const p = f.positions,
    n = f.normals;
  for (let i = 0; i < p.length; i += 3) {
    for (const [arr, move] of [
      [p, true],
      [n, false],
    ] as const) {
      const px = arr[i],
        py = arr[i + 1],
        pz = arr[i + 2];
      const y1 = py * cp - pz * sp;
      const z1 = py * sp + pz * cp;
      arr[i] = (move ? at.x : 0) + px * cy + z1 * sy;
      arr[i + 1] = (move ? at.y : 0) + y1;
      arr[i + 2] = (move ? at.z : 0) - px * sy + z1 * cy;
    }
  }
  return f;
}

/** Dessine dans un repère tourné de `yaw` (et basculé de `pitch`) posé en `at`, puis l'ajoute. */
function drawPosed(b: FacetBuilder, at: { x: number; y: number; z: number; yaw: number; pitch?: number }, draw: (l: FacetBuilder) => void): void {
  const l = new FacetBuilder();
  draw(l);
  b.append(posed(l.build(), at));
}

/** Dessine dans le repère de la face de la chaussée (x = t, z = −s), posé à son départ ; `y0` : la hauteur de son zéro. */
const inFace = (b: FacetBuilder, y0: number, draw: (l: FacetBuilder) => void): void => drawPosed(b, { x: E0.x, y: y0, z: E0.z, yaw: FACE_YAW }, draw);

// ---------- Le marais ----------

/**
 * L'eau du marais, autour de la chaussée (s, t), dans le sens où on la parcourt depuis le débarcadère : sous la moitié
 * nord du débarcadère, le long de l'îlot de l'abri (la rive droite, où court le muret des abords), jusqu'au bord du grand
 * chenal, puis la rive gauche, ouverte. Une seule nappe plate (le terrain du 5e n'a pas de marais ici : on ne touche pas
 * à son relief) ; sa vase descend jusqu'au sol tout autour.
 */
const MARSH: readonly (readonly [number, number])[] = [
  [-2.4, -3.6],
  [-2.4, 2.4],
  [-0.2, 3.4],
  [3.5, 3.9],
  [9.5, 3.9],
  [12, 5.2],
  [17, 6],
  [24, 5.6],
  [28.5, 3.6],
  [29.6, -0.4],
  [28.4, -4.4],
  [22, -8.6],
  [14, -9.4],
  [7, -8.8],
  [1.5, -6.6],
];

/** Le milieu de la nappe (le pied de son éventail), d'où chaque sommet se voit. */
const MARSH_MID = [13, -1.5] as const;

/** L'îlot de l'abri, sur la rive droite (s, t) : sa rive (le bord de l'eau, de `MARSH`), puis son tour au sec. */
const ISLET: readonly (readonly [number, number])[] = [
  [-0.2, 3.4],
  [3.5, 3.9],
  [9.5, 3.9],
  [12, 5.2],
  [17, 6],
  [17, 9.4],
  [9, 9.4],
  [2, 9.8],
  [-3.6, 9.2],
  [-4.4, 5],
  [-2.4, 2.4],
];
/** Les côtés de l'îlot qui bordent l'eau (les premiers) : une lèvre de berge, pas de vase. */
const ISLET_SHORE = 4;
const ISLET_MID = [5, 6.6] as const;

/** Les deux polygones, (s, t) en (x, z), pour savoir où pousse une touffe. */
const MARSH_V: Vec2[] = MARSH.map(([s, t]) => ({ x: s, z: t }));
const ISLET_V: Vec2[] = ISLET.map(([s, t]) => ({ x: s, z: t }));

/** La vase des bords : jusqu'où elle descend au-delà de l'eau (ou de l'îlot), jusqu'au sol. */
const MUD_REACH = 2.6;

/** Le plus haut du sol sous un polygone (s, t) : ses sommets et des points au-dedans. */
function highestUnder(poly: readonly (readonly [number, number])[], mid: readonly [number, number], at: (lx: number, lz: number) => number): number {
  let top = -Infinity;
  for (const [s, t] of poly)
    for (const k of [0, 0.35, 0.7, 1]) {
      const p = onCauseway(mid[0] + (s - mid[0]) * k, mid[1] + (t - mid[1]) * k);
      top = Math.max(top, at(p.x, p.z));
    }
  return top;
}

/** Le niveau de l'eau du marais au-dessus du sol du centre : à peine au-dessus du plus haut sol qu'elle couvre. */
const MARSH_LEVEL = highestUnder(MARSH, MARSH_MID, localGround) + 0.04;

/** Le dessus de l'îlot, un cran au-dessus de l'eau. */
const ISLET_TOP = MARSH_LEVEL + 0.1;

/** Le dessus des dalles posées, et des planches du débarcadère, au-dessus de l'eau. */
const SLAB_TOP = MARSH_LEVEL + 0.16;
export const DECK_TOP = MARSH_LEVEL + 0.14;

/**
 * Une nappe plate en éventail (le polygone `poly` à la hauteur `y`, dans le repère de la face), et sa vase : de chaque
 * bord, jusqu'au sol à `MUD_REACH` au-delà (sauf les `lip` premiers côtés, une lèvre droite de `lipDown`).
 */
function sheet(b: FacetBuilder, poly: readonly (readonly [number, number])[], mid: readonly [number, number], y: number, color: number, ground: (s: number, t: number) => number, lip = 0, lipDown = 0): void {
  const up = (a: readonly [number, number, number], c: readonly [number, number, number], d: readonly [number, number, number], col: number) => {
    // Le repère de la face garde l'orientation : un triangle qui regarde vers le bas est retourné.
    const n = (c[2] - a[2]) * (d[0] - a[0]) - (c[0] - a[0]) * (d[2] - a[2]);
    if (n >= 0) b.triangle(a, c, d, col);
    else b.triangle(a, d, c, col);
  };
  const P = (s: number, t: number, h: number) => [t, h, -s] as const;
  const m = P(mid[0], mid[1], y);
  const n = poly.length;
  for (let k = 0; k < n; k++) {
    const [s0, t0] = poly[k];
    const [s1, t1] = poly[(k + 1) % n];
    up(m, P(s0, t0, y), P(s1, t1, y), color);
    // Le bord : vers l'extérieur, depuis le milieu.
    const out = (s: number, t: number) => {
      const ds = s - mid[0],
        dt = t - mid[1];
      const l = Math.hypot(ds, dt) || 1;
      return [s + (ds / l) * MUD_REACH, t + (dt / l) * MUD_REACH] as const;
    };
    if (k < lip) {
      const a = P(s0, t0, y),
        c = P(s1, t1, y),
        d = P(s1, t1, y - lipDown),
        e = P(s0, t0, y - lipDown);
      // La lèvre regarde l'eau, vers le milieu de la nappe du marais : ses deux faces, elle est mince.
      b.quad(a, c, d, e, C.grassShade);
      b.quad(a, e, d, c, C.grassShade);
      continue;
    }
    const [os0, ot0] = out(s0, t0);
    const [os1, ot1] = out(s1, t1);
    const a = P(s0, t0, y),
      c = P(s1, t1, y),
      d = P(os1, ot1, ground(os1, ot1) - 0.05),
      e = P(os0, ot0, ground(os0, ot0) - 0.05);
    up(a, c, d, C.mud);
    up(a, d, e, C.mud);
  }
}

// ---------- Les pierres ----------

/**
 * Une pierre : sa demi-largeur (le long de `R`), son épaisseur (le long de `U`), sa hauteur hors de l'eau. Un bloc épais
 * (directeur artistique, retouche du lot 8 : l'épaisseur près des quatre cinquièmes de la largeur, jamais une stèle
 * mince), les hautes au moins trois fois plus hautes que larges, les basses trapues : l'alternance se lit de loin.
 */
interface Stone {
  s: number;
  t: number;
  w: number;
  d: number;
  h: number;
}

/**
 * Le profil d'une pierre, vu de sa face, de 0 à `h` : cinq pans, son sommet cassé d'un seul biais, jamais un pignon centré
 * (une pierre tombale). La haute descend vers la gauche d'un cinquième de sa hauteur (`cut`), la basse vers la droite,
 * plus fort ; `mirror` : le biais retourné (les pierres de droite des arches, leur haut côté chemin, sous le linteau).
 */
function stoneOutline(w: number, h: number, tall: boolean, cut = 0.2, mirror = false): (readonly [number, number])[] {
  const outline: (readonly [number, number])[] = tall
    ? [
        [-w, 0],
        [w, 0],
        [w, h * (1 - cut * 0.35)],
        [w * 0.6, h],
        [-w, h * (1 - cut)],
      ]
    : [
        [-w, 0],
        [w, 0],
        [w, h * 0.72],
        [-w * 0.7, h],
        [-w, h * 0.95],
      ];
  // Retourné, le profil garde son sens de tour (l'extrusion le veut dans le sens inverse des aiguilles d'une montre).
  return mirror ? outline.map(([x, y]) => [-x, y] as const).reverse() : outline;
}

/** Le demi-soleil à cinq rayons droits sur sa ligne plate, gravé (plus sombre que la face), à l'échelle `k`. Quinze triangles. */
function halfSun(b: FacetBuilder, at: { x: number; y: number; z: number; yaw?: number }, k: number): void {
  const q = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => [x * k, y * k] as const);
  b.plate(at, q([[-0.48, -0.035], [0.48, -0.035], [0.48, 0.035], [-0.48, 0.035]]), C.motif);
  b.plate(at, q([[-0.22, 0.035], [0.22, 0.035], [0.156, 0.191], [0, 0.255], [-0.156, 0.191]]), C.motif);
  for (const deg of [25, 57.5, 90, 122.5, 155]) {
    const a = (deg * Math.PI) / 180;
    const dx = Math.cos(a),
      dy = Math.sin(a);
    const hw = 0.03;
    const p0 = [0.31 * dx, 0.035 + 0.31 * dy],
      p1 = [0.53 * dx, 0.035 + 0.53 * dy];
    b.plate(
      at,
      q([
        [p0[0] + dy * hw, p0[1] - dx * hw],
        [p1[0] + dy * hw, p1[1] - dx * hw],
        [p1[0] - dy * hw, p1[1] + dx * hw],
        [p0[0] - dy * hw, p0[1] + dx * hw],
      ]),
      C.motif,
    );
  }
}

/** Le creux rond du cadran parti, et ses trois broches de fer nues, sur la face (z = `z`), centré en (0, `y`). */
function socket(b: FacetBuilder, y: number, z: number): void {
  const r = 0.27;
  b.plate({ x: 0, y, z }, Array.from({ length: 8 }, (_, i) => [r * Math.cos((Math.PI * i) / 4 + Math.PI / 8), r * Math.sin((Math.PI * i) / 4 + Math.PI / 8)] as const), C.hollow);
  for (const a of [Math.PI / 2, Math.PI / 2 + (2 * Math.PI) / 3, Math.PI / 2 + (4 * Math.PI) / 3]) b.prism({ x: 0.15 * Math.cos(a), y: y + 0.15 * Math.sin(a), z, pitch: Math.PI / 2 }, 0.035, 0, 0.15, 3, C.iron);
}

/** Ce que porte une pierre : le soleil levant (face vers l'arrivée), le creux du cadran, le soleil couchant (face vers le bout). */
interface Marks {
  rising?: boolean;
  socket?: boolean;
  setting?: boolean;
}

/**
 * Une pierre levée, dans le repère de sa face (sa face avant vers +z, l'arrivée ; sa base en y = 0, posée sur l'eau, son
 * pied enfoncé de `sink`), et ce qu'elle porte ; `cut` et `mirror` : son biais (`stoneOutline`). Seize triangles, et
 * quinze par soleil.
 */
function stone(b: FacetBuilder, st: Pick<Stone, 'w' | 'd' | 'h'> & { cut?: number; mirror?: boolean }, marks: Marks, sink: number, face: number = C.stone, side: number = C.stoneShade): void {
  const tall = st.h > 2.2;
  const outline = stoneOutline(st.w, st.h + sink, tall, st.cut, st.mirror);
  b.extrude({ x: 0, y: -sink, z: -st.d / 2 }, outline, st.d, side, face);
  const front = st.d / 2 + 0.015;
  const k = Math.min(1, st.w / 0.55);
  // Sur la première pierre, le soleil levant au-dessus des outils posés à son pied (jamais un portique), le creux du
  // cadran au-dessus de lui.
  if (marks.socket) socket(b, st.h * 0.7, front);
  if (marks.rising) halfSun(b, { x: 0, y: marks.socket ? st.h * 0.42 : st.h * 0.5, z: front }, k);
  if (marks.setting) halfSun(b, { x: 0, y: st.h * 0.5, z: -front, yaw: Math.PI }, k);
}

/**
 * La file des pierres levées, du débarcadère vers le chenal, sur la gauche des dalles, en alternance haute et basse : les
 * trois de la rive est (le corps, 1 sur 2, avec la première), puis les six autres (2 sur 2), les dernières hors de la
 * brume.
 */
const FILE: readonly (Stone & Marks)[] = [
  { s: 1.5, t: -2.15, w: 0.5, d: 0.8, h: 3.4, rising: true, socket: true },
  { s: 4.6, t: -2.15, w: 0.5, d: 0.8, h: 1.7 },
  { s: 7.7, t: -2.15, w: 0.45, d: 0.72, h: 3.1, rising: true },
  { s: 10.6, t: -2.15, w: 0.5, d: 0.8, h: 1.6 },
  { s: 14.6, t: -2.15, w: 0.45, d: 0.72, h: 3.0 },
  { s: 17.4, t: -2.15, w: 0.5, d: 0.8, h: 1.7, rising: true },
  { s: 21.6, t: -2.15, w: 0.45, d: 0.72, h: 3.0, setting: true },
  { s: 24.5, t: -2.15, w: 0.5, d: 0.8, h: 1.6 },
  { s: 27.3, t: -2.15, w: 0.45, d: 0.72, h: 2.9, setting: true },
];
/** Les pierres que pose le corps 1 sur 2 (les premières de `FILE`). */
const FIRST_PART = 3;

/** Les deux arches au milieu de la chaussée : leur place, l'écart de leurs pierres de part et d'autre, leur hauteur. */
const ARCHES = { at: [12.6, 19.5], t: 1.85, h: 2.75, w: 0.42, d: 0.68, cut: 0.1 } as const;
/** Le linteau : sa longueur (en travers), sa hauteur, sa profondeur. */
const LINTEL = { len: 4.7, h: 0.5, d: 0.6 } as const;

/**
 * Les pierres en silhouette, au-delà des dernières, dans la brume du chenal (avant comme après) : on les aperçoit depuis
 * le pont des Roselières avant d'ouvrir le lieu.
 */
const GHOSTS: readonly Stone[] = [
  { s: 32, t: -2.15, w: 0.45, d: 0.72, h: 2.9 },
  { s: 35.5, t: -2.15, w: 0.5, d: 0.8, h: 1.7 },
  { s: 39, t: -2.15, w: 0.45, d: 0.72, h: 2.8 },
  { s: 42.5, t: -2.15, w: 0.5, d: 0.8, h: 1.6 },
];

/**
 * Les nappes de brume du bout de la chaussée, dans le monde (la brume des failles les dessine, ./mist5e.ts) : au-delà
 * des dernières pierres posées, sur le chenal ; elles ne couvrent ni le chemin de dalles ni la prochaine pierre.
 */
export const INSTANTS_MIST: readonly MistSpot[] = [
  [37, -1, 5.5],
  [43, 0.5, 6],
  [49, -1.5, 6],
].map(([s, t, radius]) => {
  const p = onCauseway(s, t);
  return { at: { x: CENTER.x + p.x, z: CENTER.z + p.z }, radius };
});

/** Les pierres de la file, en silhouette et des arches (un test relit leurs proportions). */
export const INSTANTS_STONES = { file: FILE, ghosts: GHOSTS, arch: { w: ARCHES.w, d: ARCHES.d, h: ARCHES.h } } as const;

/** La dernière pierre posée et le bord de la première nappe, le long de la chaussée (un test les relit). */
export const LAST_STONE_S = FILE[FILE.length - 1].s;
export const MIST_NEAR_S = 37 - 5.5;

// ---------- Les dalles ----------

/** La demi-largeur du chemin de dalles, et la longueur de la chaussée posée (jusqu'aux dernières pierres). */
const PATH_HALF = 1.2;
const PATH_END = 27.8;
const SLABS = 16;

/**
 * Une dalle posée, dans le repère de la face : son dessus (deux tons, un sur deux) et ses deux flancs le long du chemin,
 * ses bords un peu irréguliers ; ses bouts se touchent presque (un joint étroit).
 */
function slab(b: FacetBuilder, k: number): void {
  const len = PATH_END / SLABS;
  const s0 = k * len + 0.04,
    s1 = (k + 1) * len - 0.04;
  const j = (n: number) => 0.12 * (Math.sin(k * 3.1 + n * 1.7) * 0.5);
  const top = SLAB_TOP - MARSH_LEVEL,
    low = -0.06;
  const L0 = [-PATH_HALF + j(1), s0] as const,
    L1 = [-PATH_HALF + j(2), s1] as const,
    R1 = [PATH_HALF + j(3), s1] as const,
    R0 = [PATH_HALF + j(4), s0] as const;
  const P = (p: readonly [number, number], y: number) => [p[0], y, -p[1]] as const;
  b.quad(P(L0, top), P(R0, top), P(R1, top), P(L1, top), k % 2 ? C.slabAlt : C.slab);
  b.quad(P(L0, low), P(L0, top), P(L1, top), P(L1, low), C.slabSide);
  b.quad(P(R0, top), P(R0, low), P(R1, low), P(R1, top), C.slabSide);
}

/**
 * Les dalles de la ruine : inclinées, à demi noyées, avec des vides (s, décalage en travers, bascule, cap) ; la moitié est
 * part avec le corps 1 sur 2, l'ouest avec le 2 sur 2.
 */
const FALLEN_SLABS: readonly (readonly [number, number, number, number])[] = [
  [0.9, 0.1, 0.12, 0.05],
  [2.7, -0.2, -0.18, -0.12],
  [5.9, 0.25, 0.22, 0.2],
  [7.8, -0.1, -0.1, -0.08],
  [11.3, 0.15, 0.2, 0.15],
  [14.9, -0.25, -0.16, 0.1],
  [16.7, 0.1, 0.12, -0.2],
  [20.1, 0.2, -0.2, 0.06],
  [23.4, -0.15, 0.18, -0.1],
  [25.2, 0.05, -0.12, 0.18],
];

// ---------- Les roseaux ----------

/**
 * Une touffe de roseaux droits : quatre tiges en pointe, chacune penchée vers son propre côté (jamais croisées), de deux
 * tons, de hauteur `h`. Douze triangles.
 */
export function reeds(b: FacetBuilder, at: Vec3, seed: number, h = 1.3): void {
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.6 * Math.sin(seed * 1.9 + k);
    const dx = Math.cos(a),
      dz = Math.sin(a);
    const hk = h * (0.8 + 0.25 * Math.abs(Math.sin(seed * 2.3 + k * 1.1)));
    b.prism({ x: at.x + 0.16 * dx, y: at.y - 0.1, z: at.z + 0.16 * dz, yaw: Math.atan2(dx, dz), pitch: 0.13 }, 0.07, 0, hk, 3, k % 2 ? C.reedShade : C.reed);
  }
}

/** Les touffes de roseaux (s, t, hauteur), sur l'îlot, sur les bords du marais et au bout, où elles cachent la rive du chenal. */
const REEDS: readonly (readonly [number, number, number])[] = [
  [6, 5.4, 1.4],
  [11.5, 6.6, 1.5],
  [15, 7.4, 1.3],
  [-3.2, 7.6, 1.2],
  [3.5, -7.4, 1.4],
  [9, -9.2, 1.5],
  [17, -9.6, 1.3],
  [24.5, -7.4, 1.5],
  [28.6, -4.8, 1.6],
  [30, 0.6, 1.6],
  [28.8, 4.4, 1.5],
  [22, 6.6, 1.4],
];

/** L'îlot du gué, sur la gauche : son milieu, ses deux touffes. */
const FORD_ISLET = { s: 11, t: -7.6 } as const;

// ---------- Le débarcadère, l'abri ----------

/** Le débarcadère de planches de la rive est (s, t) : de la porte jusqu'au départ des dalles, ses planches le long de l'axe. */
const DECK = { s0: -4.6, s1: 0.2, t0: -2.4, t1: 3.2, planks: 4 } as const;

/** L'abri du tailleur, sur son îlot : son milieu (repère du lieu), son cap (sa face ouverte vers le sud), sa largeur, sa profondeur. */
const SHELTER = { x: 5.6, z: 0.8, yaw: -0.14, w: 4, d: 2.4, front: 2.35, back: 1.15 } as const;

/** Un point du repère de l'abri (`lx` en largeur, `lz` vers sa face ouverte), dans le repère du lieu. */
function inShelter(lx: number, lz: number): Vec2 {
  const c = Math.cos(SHELTER.yaw),
    s = Math.sin(SHELTER.yaw);
  return { x: SHELTER.x + lx * c + lz * s, z: SHELTER.z - lx * s + lz * c };
}

/**
 * Une lanterne pendue (sa corde, sa vitre, éteinte ou d'ocre sans ombre, son chapeau de bronze), à l'échelle `s`.
 * Vingt triangles.
 */
function lantern(b: FacetBuilder, at: Vec3, lit: boolean, s = 1): void {
  const y = at.y - 0.22 - 0.36 * s;
  b.band({ x: at.x, y: y + 0.36 * s, z: at.z }, 0.025, 0.22, 3, C.rope);
  b.box({ x: at.x, y, z: at.z }, [0.26 * s, 0.36 * s, 0.26 * s], lit ? C.lantern : C.lanternOff);
  b.prism({ x: at.x, y: y + 0.36 * s, z: at.z, yaw: Math.PI / 4 }, 0.24 * s, 0, 0.16 * s, 4, C.bronze);
}

/** Le bas d'un pieu : un peu sous le sol. */
const footOf = (ground: SiteGround, p: Vec2): number => ground.at(p.x, p.z) - 0.35;

/** Le maillet posé (à plat, `lying`, ou debout la tête au sol), dans le repère `at` (son cap). */
function mallet(b: FacetBuilder, at: Vec3 & { yaw: number }, lying: boolean): void {
  const c = Math.cos(at.yaw),
    s = Math.sin(at.yaw);
  if (lying) {
    b.box({ x: at.x, y: at.y, z: at.z, yaw: at.yaw }, [0.36, 0.2, 0.2], C.newWood, C.newShade);
    b.beam({ x: at.x + 0.15 * c, y: at.y + 0.08, z: at.z - 0.15 * s }, { x: at.x + 0.62 * c, y: at.y + 0.08, z: at.z - 0.62 * s }, 0.07, C.newShade);
    return;
  }
  // Debout, la tête au sol, le manche contre la pierre : une tête massive, deux fois la largeur du ciseau et plus.
  b.box({ x: at.x, y: at.y, z: at.z, yaw: at.yaw }, [0.5, 0.34, 0.34], C.newWood, C.newShade);
  b.beam({ x: at.x, y: at.y + 0.32, z: at.z }, { x: at.x + 0.08 * s, y: at.y + 0.9, z: at.z + 0.08 * c }, 0.08, C.newShade);
}

/** Le ciseau de tailleur : une tige de fer et sa tête plate (à plat, ou debout, la tête en haut). */
function chisel(b: FacetBuilder, at: Vec3 & { yaw: number }, lying: boolean): void {
  const c = Math.cos(at.yaw),
    s = Math.sin(at.yaw);
  if (lying) {
    b.beam({ x: at.x, y: at.y + 0.03, z: at.z }, { x: at.x + 0.5 * c, y: at.y + 0.03, z: at.z - 0.5 * s }, 0.05, C.iron);
    return;
  }
  b.beam({ x: at.x, y: at.y - 0.02, z: at.z }, { x: at.x + 0.06 * s, y: at.y + 0.78, z: at.z + 0.06 * c }, 0.06, C.iron);
  b.box({ x: at.x + 0.06 * s, y: at.y + 0.72, z: at.z + 0.06 * c, yaw: at.yaw }, [0.11, 0.12, 0.09], C.newWood);
}

/** L'auvent : sa tranche (une botte de roseaux, jamais une planche), ses dents au bord avant, leur longueur. */
const THATCH = { thick: 0.4, teeth: 5, tooth: 0.3 } as const;

/**
 * L'auvent de roseaux, à un seul pan, épais (ses deux faces se voient : de face, on le voit par-dessous) : de son bord
 * `from` (en largeur, depuis le milieu de l'abri) sur `width` vers la gauche, haut devant sur les poteaux, bas derrière
 * sur le muret ; `drop` : son bord avant descendu d'autant (la moitié affaissée de la ruine, sans dents : elles seraient
 * dans le sol). Le bord avant tenu porte cinq dents de roseaux qui pendent, vues des deux côtés. Douze triangles, et dix
 * pour les dents.
 */
function thatch(b: FacetBuilder, from: number, width: number, drop: number): void {
  const S = SHELTER;
  const half = S.d / 2 + 0.3;
  const o = inShelter(from, 0);
  b.extrude(
    { x: o.x, y: ISLET_TOP, z: o.z, yaw: S.yaw - Math.PI / 2 },
    [
      [-half, S.back - 0.1],
      [half, S.front + drop],
      [half, S.front + drop + THATCH.thick],
      [-half, S.back - 0.1 + THATCH.thick],
    ],
    width,
    C.thatchShade,
    C.thatch,
  );
  if (drop !== 0) return;
  const y = ISLET_TOP + S.front + 0.02;
  const step = width / THATCH.teeth;
  for (let k = 0; k < THATCH.teeth; k++) {
    const a = inShelter(from - step * k, half),
      c = inShelter(from - step * (k + 1), half),
      m = inShelter(from - step * (k + 0.5), half);
    // Les dents un peu inégales : des roseaux, pas une frise.
    const tip = [m.x, y - THATCH.tooth * (0.8 + 0.2 * ((k * 7) % 3)), m.z] as const;
    const A = [a.x, y, a.z] as const,
      B = [c.x, y, c.z] as const;
    b.triangle(A, tip, B, C.thatchShade);
    b.triangle(A, B, tip, C.thatchShade);
  }
}

/** L'établi sous l'auvent (toujours là) : son plateau, son panneau, le bloc à demi taillé dessus. */
const BENCH = { lx: 0.2, lz: -0.45, top: 0.85 } as const;

/** Les volumes des Instants, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu. */
function model(add: AddPiece, ground: SiteGround, _door: Vec2): void {
  const gs = (s: number, t: number) => {
    const p = onCauseway(s, t);
    return ground.at(p.x, p.z);
  };
  const W = MARSH_LEVEL;
  const F = (draw: (l: FacetBuilder) => void) => (b: FacetBuilder) => inFace(b, W, draw);
  // Le sol sous un point de la face, depuis le zéro de la face (l'eau du marais).
  const gf = (s: number, t: number) => gs(s, t) - W;

  // Toujours là : l'eau du marais, l'îlot de l'abri, l'îlot du gué, les roseaux, les pierres en silhouette dans la brume.
  add(
    'ruine',
    0,
    F((l) => {
      sheet(l, MARSH, MARSH_MID, 0, C.water, gf);
      sheet(l, ISLET, ISLET_MID, ISLET_TOP - W, C.grass, gf, ISLET_SHORE, ISLET_TOP - W + 0.08);
      l.prism({ x: FORD_ISLET.t, y: -0.3, z: -FORD_ISLET.s, yaw: 0.4 }, 1.4, 1.05, 0.42, 6, C.grassShade, C.grass);
    }),
  );
  add(
    'ruine',
    0,
    F((l) => {
      // Dans l'eau, leur pied à sa surface ; sur l'îlot, sur son dessus ; ailleurs, sur le sol.
      const foot = (s: number, t: number) => (insidePolygon({ x: s, z: t }, ISLET_V) ? ISLET_TOP - W : insidePolygon({ x: s, z: t }, MARSH_V) ? 0 : gf(s, t));
      REEDS.forEach(([s, t, h], i) => reeds(l, { x: t, y: foot(s, t), z: -s }, i + 3, h));
      reeds(l, { x: FORD_ISLET.t - 0.5, y: 0.12, z: -FORD_ISLET.s - 0.3 }, 31, 1.2);
      reeds(l, { x: FORD_ISLET.t + 0.4, y: 0.12, z: -FORD_ISLET.s + 0.5 }, 37, 1.1);
    }),
  );
  add(
    'ruine',
    0,
    F((l) => {
      for (const g of GHOSTS) {
        // Sur l'eau du chenal (le niveau 0 du monde) ou sur la rive : leur pied descend jusqu'au fond.
        const base = Math.min(gf(g.s, g.t), ground.water - W);
        drawPosed(l, { x: g.t, y: base, z: -g.s, yaw: 0 }, (q) => stone(q, g, {}, 0.6, C.ghost, C.ghostShade));
      }
    }),
  );
  // Le débarcadère de planches de la rive est : quatre planches le long de l'axe, ses pieux du côté de l'eau.
  add(
    'ruine',
    0,
    F((l) => {
      const D = DECK;
      const w = (D.t1 - D.t0) / D.planks;
      for (let k = 0; k < D.planks; k++) l.box({ x: D.t0 + w * (k + 0.5), y: DECK_TOP - W - 0.14, z: -(D.s0 + D.s1) / 2 }, [w - 0.06, 0.14, D.s1 - D.s0], C.plankShade, k % 2 ? C.plankAlt : C.plank);
      for (const t of [D.t0 + 0.3, (D.t0 + D.t1) / 2, D.t1 - 0.3]) {
        const foot = gf(D.s1 - 0.3, t) - 0.35;
        l.band({ x: t, y: foot, z: -(D.s1 - 0.3) }, 0.13, DECK_TOP - W - 0.14 - foot, 4, C.newShade);
      }
    }),
  );
  // L'abri, toujours là : ses deux poteaux, l'établi et son bloc à demi taillé, la lanterne allumée à son poteau de droite
  // (le tailleur vit là : la seule lumière de la ruine, fixe).
  add('ruine', 0, (b) => {
    const S = SHELTER;
    for (const sx of [-1, 1]) {
      const p = inShelter(sx * (S.w / 2 - 0.15), S.d / 2 - 0.1);
      b.beam({ x: p.x, y: footOf(ground, p), z: p.z }, { x: p.x, y: ISLET_TOP + S.front, z: p.z }, 0.16, C.newShade);
    }
    const bench = inShelter(BENCH.lx, BENCH.lz);
    const y = ISLET_TOP;
    b.box({ x: bench.x, y: y + BENCH.top - 0.1, z: bench.z, yaw: S.yaw }, [2.2, 0.1, 0.7], C.newShade, C.newWood);
    const panel = inShelter(BENCH.lx, BENCH.lz + 0.28);
    b.box({ x: panel.x, y: y - 0.1, z: panel.z, yaw: S.yaw }, [2, BENCH.top - 0.1, 0.08], C.newShade);
    const block = inShelter(BENCH.lx + 0.45, BENCH.lz);
    b.box({ x: block.x, y: y + BENCH.top, z: block.z, yaw: S.yaw + 0.3 }, [0.5, 0.36, 0.42], C.stoneShade, C.stone);
    const post = inShelter(S.w / 2 - 0.15, S.d / 2 - 0.1);
    const tip = inShelter(S.w / 2 + 0.35, S.d / 2 + 0.25);
    b.beam({ x: post.x, y: y + S.front - 0.3, z: post.z }, { x: tip.x, y: y + S.front - 0.3, z: tip.z }, 0.08, C.newShade);
    lantern(b, { x: tip.x, y: y + S.front - 0.34, z: tip.z }, true);
  });

  // La ruine de la chaussée. Le corps 1 sur 2 la relève à l'est (la première pierre, les deux suivantes, les dalles de la
  // moitié est), le 2 sur 2 à l'ouest.
  const east = { stage: 0 as Stage, row: 0 };
  const west = { stage: 0 as Stage, row: 0.5 };
  const lean = (st: Stone, pitch: number, marks: Marks = {}) =>
    F((l) => drawPosed(l, { x: st.t, y: Math.min(0, gf(st.s, st.t)), z: -st.s, yaw: 0, pitch }, (q) => stone(q, st, marks, 0.6)));
  // Couchée, à demi enfoncée, sa face (et son soleil s'il en a un) vers le ciel ; son sommet vers le bout ou vers la rive.
  const lying = (st: Stone, yaw: number, marks: Marks = {}) =>
    F((l) => drawPosed(l, { x: st.t - 0.3, y: -st.d * 0.45, z: -st.s, yaw, pitch: -Math.PI / 2 + 0.08 }, (q) => stone(q, st, marks, 0)));
  // La première pierre penche, intacte, son creux et son soleil levant dans sa face.
  add('ruine', 0, lean(FILE[0], -0.3, { rising: true, socket: true }), east);
  add('ruine', 0, lying(FILE[1], 0.5), east);
  add('ruine', 0, lean(FILE[2], 0.45, { rising: true }), east);
  add(
    'ruine',
    0,
    F((l) => {
      for (const [s, dt, pitch, yaw] of FALLEN_SLABS.filter(([s]) => s < PATH_END / 2))
        l.box({ x: dt, y: -0.32, z: -s, yaw, pitch }, [1.9, 0.42, 1.35], C.stoneShade, C.slabAlt);
    }),
    east,
  );
  // À l'ouest : une couchée, une cassée en deux (son moignon, trois blocs dans l'eau), une qui penche nettement, deux
  // couchées dont l'une montre son soleil couchant au ciel, la dernière couchée.
  add('ruine', 0, lying(FILE[3], -0.7), west);
  add(
    'ruine',
    0,
    F((l) => {
      const st = FILE[4];
      drawPosed(l, { x: st.t, y: Math.min(0, gf(st.s, st.t)), z: -st.s, yaw: 0 }, (q) => stone(q, { ...st, h: 1.1 }, {}, 0.6));
      for (const [ds, dt, size, yaw] of [
        [0.9, -1.3, 0.62, 0.4],
        [-0.6, -1.7, 0.5, 1.2],
        [1.6, -0.5, 0.44, 2.1],
      ] as const)
        l.box({ x: st.t + dt, y: -0.3, z: -(st.s + ds), yaw, pitch: 0.25 }, [size * 1.2, size + 0.15, size], C.stoneShade, C.stone);
    }),
    west,
  );
  add('ruine', 0, lean(FILE[5], -0.42, { rising: true }), west);
  add('ruine', 0, lying(FILE[6], 2.6), west);
  add('ruine', 0, lying(FILE[7], 0.3, { rising: true }), west);
  add('ruine', 0, lying(FILE[8], -2.4), west);
  add(
    'ruine',
    0,
    F((l) => {
      for (const [s, dt, pitch, yaw] of FALLEN_SLABS.filter(([s]) => s >= PATH_END / 2))
        l.box({ x: dt, y: -0.32, z: -s, yaw, pitch }, [1.9, 0.42, 1.35], C.stoneShade, C.slabAlt);
    }),
    west,
  );
  // Un linteau tombé dans l'eau, près de la seconde arche, sa bande de racines encore lisible ; le haut le relève.
  add(
    'ruine',
    0,
    F((l) => {
      drawPosed(l, { x: 2.6, y: -0.28, z: -ARCHES.at[1] + 0.4, yaw: 0.35, pitch: 0.12 }, (q) => {
        q.box({ x: 0, y: 0, z: 0 }, [LINTEL.len * 0.8, LINTEL.h, LINTEL.d], C.stoneShade, C.stone);
        rootBand(q, LINTEL.h * 0.5, LINTEL.d / 2 + 0.015, LINTEL.len * 0.8);
      });
    }),
    { stage: 1, row: 0 },
  );

  // La ruine de l'abri : l'auvent à moitié affaissé (la moitié de droite tient encore), le muret cassé et un bloc tombé ;
  // le maillet et le ciseau posés à plat sur l'établi (le corps 1 sur 2 les porte au pied de la première pierre).
  add(
    'ruine',
    0,
    (b) => {
      const S = SHELTER;
      const y = ISLET_TOP;
      // La moitié de droite tient sur son poteau ; celle de gauche a glissé, son bord avant au sol.
      thatch(b, S.w / 2 + 0.3, S.w / 2 + 0.2, 0);
      thatch(b, -0.1, S.w / 2 + 0.2, -(S.front - 0.25));
      const wall = inShelter(0.6, -S.d / 2 + 0.2);
      b.box({ x: wall.x, y: y - 0.3, z: wall.z, yaw: S.yaw }, [S.w * 0.6, 1.0, 0.4], C.stoneShade, C.stone);
      const fell = inShelter(-1.4, -S.d / 2 - 0.4);
      b.box({ x: fell.x, y: y - 0.15, z: fell.z, yaw: S.yaw + 0.6, pitch: 0.3 }, [0.6, 0.42, 0.4], C.stoneShade, C.stone);
    },
    { stage: 2, row: 0 },
  );
  add(
    'ruine',
    0,
    (b) => {
      const y = ISLET_TOP + BENCH.top;
      const m = inShelter(BENCH.lx - 0.7, BENCH.lz + 0.05);
      mallet(b, { x: m.x, y, z: m.z, yaw: SHELTER.yaw + 0.25 }, true);
      const c = inShelter(BENCH.lx - 0.2, BENCH.lz + 0.2);
      chisel(b, { x: c.x, y, z: c.z, yaw: SHELTER.yaw - 0.15 }, true);
    },
    east,
  );

  // Le corps, 1 sur 2 : la première pierre redressée, les deux suivantes de la rive est, la moitié est des dalles.
  add(
    0,
    0,
    F((l) => {
      for (const st of FILE.slice(0, FIRST_PART)) drawPosed(l, { x: st.t, y: Math.min(0, gf(st.s, st.t)), z: -st.s, yaw: 0 }, (q) => stone(q, st, st, 0.6));
      for (let k = 0; k < SLABS / 2; k++) slab(l, k);
    }),
  );
  // Le corps, 2 sur 2 : les pierres du milieu et les dernières, hors de la brume ; la seconde moitié des dalles.
  add(
    0,
    0.5,
    F((l) => {
      for (const st of FILE.slice(FIRST_PART)) drawPosed(l, { x: st.t, y: Math.min(0, gf(st.s, st.t)), z: -st.s, yaw: 0 }, (q) => stone(q, st, st, 0.6));
      for (let k = SLABS / 2; k < SLABS; k++) slab(l, k);
    }),
  );
  // Le haut, 1 sur 2 : les deux arches, deux paires de pierres sous un linteau gris des Passeurs à la bande de racines en
  // vert-de-gris (le soleil couchant sur la face ouest de leur pierre de gauche).
  add(
    1,
    0,
    F((l) => {
      for (const s of ARCHES.at) {
        for (const side of [-1, 1]) {
          const t = side * ARCHES.t;
          // Leur biais monte vers le chemin : le linteau porte sur le haut de chaque pierre.
          drawPosed(l, { x: t, y: Math.min(0, gf(s, t)), z: -s, yaw: 0 }, (q) => stone(q, { w: ARCHES.w, d: ARCHES.d, h: ARCHES.h, cut: ARCHES.cut, mirror: side > 0 }, { setting: side < 0 }, 0.6));
        }
        l.box({ x: 0, y: ARCHES.h - 0.02, z: -s }, [LINTEL.len, LINTEL.h, LINTEL.d], C.stoneShade, C.stone);
        rootBand(l, ARCHES.h - 0.02 + LINTEL.h * 0.5, -s + LINTEL.d / 2 + 0.015, LINTEL.len);
        drawPosed(l, { x: 0, y: 0, z: -s, yaw: Math.PI }, (q) => rootBand(q, ARCHES.h - 0.02 + LINTEL.h * 0.5, LINTEL.d / 2 + 0.015, LINTEL.len));
      }
    }),
  );
  // Le haut, 2 sur 2 : la lanterne pendue sous la première arche, allumée dès qu'elle est posée (jamais à une réussite).
  add(
    1,
    0.5,
    F((l) => lantern(l, { x: 0, y: ARCHES.h - 0.02, z: -ARCHES.at[0] }, true, 1.15)),
  );
  // Les abords : l'abri refait (l'auvent de roseaux entier, le muret), la pile de blocs équarris, le petit débarcadère de
  // pierre au bord de l'îlot.
  add(2, 0, (b) => {
    const S = SHELTER;
    const y = ISLET_TOP;
    thatch(b, S.w / 2 + 0.3, S.w + 0.6, 0);
    const wall = inShelter(0, -S.d / 2 + 0.2);
    b.box({ x: wall.x, y: y - 0.3, z: wall.z, yaw: S.yaw }, [S.w, S.back + 0.3, 0.4], C.stoneShade, C.stone);
    const pile = inShelter(S.w / 2 + 1.1, -0.3);
    for (const [dy, dx, yaw] of [
      [0, -0.35, 0.1],
      [0, 0.35, -0.08],
      [0.42, 0, 0.3],
    ] as const)
      b.box({ x: pile.x + dx, y: y + dy - 0.02, z: pile.z, yaw: S.yaw + yaw }, [0.62, 0.42, 0.5], C.stoneShade, C.stone);
  });
  add(
    2,
    0.5,
    F((l) => l.box({ x: 3.7, y: ISLET_TOP - W - 0.32, z: -0.6, yaw: 0.05 }, [1.3, 0.34, 1.9], C.slabSide, C.slab)),
  );
}

/**
 * La bande de racines entrelacées d'un linteau, sur sa face (z = `z`), à la hauteur `y` : quatre losanges de vert-de-gris
 * qui se chevauchent, un haut, un bas (sans lettre ni chiffre). Huit triangles.
 */
function rootBand(b: FacetBuilder, y: number, z: number, len: number): void {
  const n = 4;
  const w = (len * 0.86) / n;
  for (let i = 0; i < n; i++) {
    const x = -len * 0.43 + w * (i + 0.5);
    const dy = i % 2 ? 0.04 : -0.04;
    b.plate({ x, y: y + dy, z }, [[-w * 0.62, 0], [0, -0.13], [w * 0.62, 0], [0, 0.13]], C.verdigris);
  }
}

// ---------- Les traces ----------

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
function inWorld(b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void {
  drawPosed(b, { x: c.x, y: c.y, z: c.z, yaw: 0 }, draw);
}

/**
 * Le maillet et le ciseau du tailleur (Rives du passé), debout côte à côte contre le pied de la première pierre, du côté
 * de l'arrivée, un écart entre eux, jamais croisés ; de la taille d'outils lus à la caméra du lieu. Plus bas que le soleil
 * levant gravé (`stone`) : ils ne dessinent pas de portique avec lui, et rien ne se touche.
 */
function tools(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    inFace(l, MARSH_LEVEL, (q) => {
      const st = FILE[0];
      const z = -st.s + st.d / 2 + 0.32;
      mallet(q, { x: st.t - 0.3, y: SLAB_TOP - MARSH_LEVEL - 0.1, z, yaw: 0 }, false);
      chisel(q, { x: st.t + 0.34, y: SLAB_TOP - MARSH_LEVEL - 0.1, z: z - 0.04, yaw: 0 }, false);
      // Leur appui : une dalle basse au pied de la pierre, hors de l'eau.
      q.box({ x: st.t, y: -0.2, z: z + 0.05 }, [1.3, SLAB_TOP - MARSH_LEVEL + 0.1, 0.8], C.slabSide, C.slab);
    }),
  );
}

/** Le fagot de roseaux liés et le bloc équarri sur ses deux rouleaux (Brume du futur), sur l'îlot, au bord de l'eau. */
const FAGOT = { s: 12.6, t: 6.4 } as const;

function fagot(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    inFace(l, MARSH_LEVEL, (q) => {
      const y = ISLET_TOP - MARSH_LEVEL;
      const x = FAGOT.t,
        z = -FAGOT.s;
      // Le fagot, couché le long de la rive, et son lien.
      q.prism({ x: x - 0.9, y: y + 0.24, z: z - 0.9, pitch: Math.PI / 2 }, 0.24, 0.24, 1.8, 6, C.reedShade, C.reed);
      q.band({ x: x - 0.9, y: y + 0.24, z: z - 0.06, pitch: Math.PI / 2 }, 0.255, 0.12, 6, C.rope);
      // Le bloc équarri sur deux rouleaux.
      for (const dz of [-0.35, 0.35]) q.prism({ x: x + 0.15, y: y + 0.11, z: z + dz, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.11, 0.11, 1.3, 5, C.newShade, C.newWood);
      q.box({ x: x + 0.8, y: y + 0.21, z }, [0.85, 0.6, 0.8], C.stoneShade, C.stone);
    }),
  );
}

/**
 * La dalle grise dressée au bord de l'eau (Reflets), à facettes, ni pâle ni polie, sur la rive de l'îlot : un bloc épais
 * (`thick`), sa grande face tournée vers l'arrivée (la caméra de « Y aller » la voit de face, jamais de profil), son bord
 * haut cassé d'un seul biais, sans pointe.
 */
const STANDING_SLAB = { s: 10.6, t: 4.9, thick: 0.5, yaw: -0.08 } as const;

function standingSlab(b: FacetBuilder, c: Vec3): void {
  const S = STANDING_SLAB;
  inWorld(b, c, (l) =>
    inFace(l, MARSH_LEVEL, (q) =>
      drawPosed(q, { x: S.t, y: ISLET_TOP - MARSH_LEVEL - 0.3, z: -S.s, yaw: S.yaw }, (r) =>
        r.extrude({ x: 0, y: 0, z: -S.thick / 2 }, [[-0.6, 0], [0.62, 0], [0.62, 1.3], [-0.38, 1.72], [-0.6, 1.64]], S.thick, C.stoneShade, C.slabAlt),
      ),
    ),
  );
}

/** Les trois dalles plates du gué (Gué des temps), en file, du bord des dalles à l'îlot de gauche, à travers l'eau. */
const FORD: readonly (readonly [number, number])[] = [
  [11, -3.3],
  [11.15, -4.7],
  [11.05, -6.1],
];

function ford(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    inFace(l, MARSH_LEVEL, (q) => {
      FORD.forEach(([s, t], i) => q.box({ x: t, y: -0.18, z: -s, yaw: 0.2 * (i - 1) }, [1.0, 0.3, 0.9], C.slabSide, i % 2 ? C.slabAlt : C.slab));
    }),
  );
}

/**
 * Le muret de pierres sèches le long de la rive de l'îlot (La phrase et ses fonctions) : des pierres de formes et de tailles
 * différentes, bien ajustées, à joints irréguliers, en deux assises qui ne s'alignent pas (jamais des rangs de briques).
 */
const WALL: readonly (readonly [number, number, number, number, number])[] = [
  // s, longueur, hauteur, assise (0 en bas, 1 en haut), décalage en travers
  [3.9, 1.3, 0.42, 0, 0],
  [5.15, 1.05, 0.5, 0, 0.04],
  [6.35, 1.4, 0.38, 0, -0.03],
  [7.75, 1.2, 0.46, 0, 0.02],
  [8.95, 1.1, 0.4, 0, 0],
  [4.4, 1.0, 0.3, 1, 0],
  [5.6, 1.3, 0.24, 1, 0.03],
  [7.05, 0.9, 0.32, 1, -0.02],
  [8.4, 1.4, 0.26, 1, 0],
];

function wall(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) =>
    inFace(l, MARSH_LEVEL, (q) => {
      const base = ISLET_TOP - MARSH_LEVEL - 0.15;
      for (const [s, len, h, course, dt] of WALL) {
        const y = course ? base + 0.15 + 0.38 : base;
        q.box({ x: 4.25 + dt, y, z: -s, yaw: 0.04 * (s % 2) }, [0.55, h + (course ? 0 : 0.15), len - 0.04], C.stoneShade, course ? C.slab : C.stone);
      }
    }),
  );
}

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : sur le débarcadère, l'abri derrière à droite, la première pierre à gauche. */
const SCENE_SPOT = { dx: 2.6, dz: 5.0, half: [3.4, 1.1] as [number, number] } as const;

/**
 * La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme, comme questionScene.ts,
 * `sceneSpot`) : les planches du débarcadère. Le décor de près n'ajoute pas de plancher : c'est le sien.
 */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return DECK_TOP - top;
})();

/** Le tailleur en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, pantalon brun, blouse grise, tablier de cuir. */
function mason(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) {
    b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.13, 0.2, 6, C.boots);
    b.prism({ x: at.x + side * 0.12, y: at.y + 0.2, z: at.z }, 0.12, 0.12, 0.32, 6, C.trousers);
  }
  b.prism({ x: at.x, y: at.y + 0.5, z: at.z }, 0.28, 0.26, 0.48, 8, C.smock);
  b.box({ x: at.x, y: at.y + 0.3, z: at.z + 0.24 }, [0.46, 0.6, 0.06], C.leather);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.5, z: at.z + 0.05 }, 0.12, C.smock);
}

/** La planche de l'établi des réponses : la hauteur de ses tréteaux, à l'échelle 1 ; un galet choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.2 } as const;

/** Un galet rond à l'échelle `s` : deux troncs de cône à sept pans, aplatis (rond, jamais équarri). Quarante-deux triangles. */
function pebble(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.24 * s, 0.3 * s, 0.08 * s, 7, C.pebble, C.pebble);
  b.prism({ x: at.x, y: at.y + 0.08 * s, z: at.z, yaw: 0.45 }, 0.3 * s, 0.17 * s, 0.11 * s, 7, C.pebble, C.pebbleTop);
}

/** Où se pose la trace de chaque mission, depuis le centre du lieu (la caméra du retour en garde la place). */
const TRACE_SPOTS = {
  'past-tenses': onCauseway(FILE[0].s - 0.6, FILE[0].t),
  'future-tense': onCauseway(FAGOT.s, FAGOT.t),
  'tense-recognition': onCauseway(STANDING_SLAB.s, STANDING_SLAB.t),
  'tense-choice': onCauseway(FORD[1][0], FORD[1][1]),
  'sentence-grammar': onCauseway(6.5, 4.25),
} as const;

export const INSTANTS: PlaceArt = {
  role: 'Le tailleur de pierre',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 2+2+1) et se montre dès que sa
  // mission est réussie et que sa partie est posée.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -2.3, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.3, dz: 0.3 },
    subject: { halfWidth: 3.4, bottom: -0.5, top: 3.2, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  // Le décor de près : le plancher est celui du débarcadère, la pierre gravée derrière est la première pierre du lieu ; la
  // touffe de roseaux qui cadre est aux abords (./instantsSurroundings.ts). Il reste le tailleur en pion, sans son modèle.
  decor(b, _floor, at, sphere, body = true) {
    if (body) mason(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + 0.25, half: 0.32 },
    // Une planche de l'établi sur deux tréteaux, sous la rangée des galets.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.7 * s], C.newShade, C.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.6 * s], C.newShade);
      }
    },
    // Un galet rond posé sur la planche ; choisi, il se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      pebble(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les cinq missions en R : le débarcadère seul, rien de l'item ; les galets portent les réponses.
  rest() {},
  traces: {
    'past-tenses': { at: TRACE_SPOTS['past-tenses'], lift: 1, stage: 0, row: 0, draw: tools },
    'future-tense': { at: TRACE_SPOTS['future-tense'], lift: 1, stage: 0, row: 0.5, draw: fagot },
    'tense-recognition': { at: TRACE_SPOTS['tense-recognition'], lift: 1.5, stage: 1, row: 0, draw: standingSlab },
    'tense-choice': { at: TRACE_SPOTS['tense-choice'], lift: 1, stage: 1, row: 0.5, draw: ford },
    'sentence-grammar': { at: TRACE_SPOTS['sentence-grammar'], lift: 1, stage: 2, draw: wall },
  },
  // Kéo au retour : sur le chemin, à l'est de la porte, face à la chaussée.
  exit: { x: 4.4, z: 8.6 },
  // « Y aller » : la caméra derrière Kéo, sur l'axe de la chaussée (37° à l'ouest du nord) ; elle part du bas de l'image
  // et file droit vers la brume, entière, l'abri et sa lanterne à droite.
  doorView: FACE_YAW,
};

/** La lanterne de l'abri et celle de l'arche (un test les compte) ; le plus haut du lieu (les pierres des arches et leur linteau). */
export const INSTANTS_TOP = ARCHES.h + LINTEL.h;

/** La plate-forme de la scène, ses planches au niveau de celles du débarcadère (un test le vérifie). */
export const INSTANTS_DECK = { spot: SCENE_SPOT, deckTop: DECK_TOP, heightAtCenter: H0 } as const;

/**
 * Les abords de la scénette des Marais salants (reprise lieu par lieu, d'après le concept du 18 octobre 2026) : une
 * saline qui travaille tout autour du bassin où se tiennent Kéo et la saunière, finie de chaque côté puisque la caméra
 * tourne (« caméra libre »). Au nord, le muret du bassin de l'item et ses petits cônes de sel ; au sud, au premier plan
 * comme dans le concept (directeur artistique, deuxième passe : de biais, les bassins du nord-est se lisaient comme du
 * sable, au bord du cadre), deux rangs de bassins d'eau pâle (le Lagon éclairci) entre des diguettes brunes qui portent
 * des cônes de sel, l'un des bassins asséché et craquelé ; de face, le premier rang sous les pieds de Kéo et de la
 * saunière, au-dessus de la rangée des sacs ; de dos, les deux rangs derrière eux, la cabane au-delà. À l'est, le chenal
 * qui descend à la mer et sa petite vanne de bois ; au sud-ouest, la cabane de bois au toit bleu, sa pile de planches, la
 * brouette chargée, un tas de sel, les dunes ; le sentier qui arrive de l'ouest, de sable tassé, plus foncé que le sel (le
 * blanc reste au sel seul), coupé par une dune et des touffes. Partout, des touffes d'herbe sèche et quelques rochers ;
 * pas de sapin (consultant Archipéo : ./flora.ts n'en fait pousser aucun autour du lieu). Rien de haut entre la caméra de
 * face et la scène (la rangée des réponses, Kéo, la saunière, la jauge et la vanne de l'item) : les bassins sont à ras de
 * sol, ce qui est haut se tient derrière la caméra de face ou hors de son champ. Des aplats francs, une couleur par
 * facette ; aucun appel de plus (le décor de près).
 */
import type { FacetBuilder } from './facets';
import { shadowColor, FLORA_COLORS } from './flora';
import type { Vec3 } from './geometry';
import { SHADOW_DIR } from './sky';
import type { SurroundingsState } from './surroundings';
import { DRY_TUFT, NATURE, SALT, groundAt as groundOf, heap, rock as stone, tuft, type P3 } from './surroundingsKit';
import { pathSand } from './paths';
import { placeById } from './plan6e';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

/** Les couleurs des abords : celles du lieu (places.ts, questionScene.ts) et quelques valeurs propres à la saline. */
const C = {
  /** L'argile des murets, son dessus (les murets du lieu). */
  clay: 0xb59a72,
  clayTop: 0xc7ad83,
  /**
   * L'eau des bassins de récolte : pâle, le Lagon éclairci (directeur artistique, deuxième passe : presque blanche, elle
   * se lisait comme du sable ; le blanc reste au sel), son reflet plus clair.
   */
  brine: 0x9edbd1,
  brineGlint: 0xc9ece5,
  /** Les diguettes brunes entre les bassins de récolte, leur dessus. */
  dyke: 0x8f6b48,
  dykeTop: 0xa47e57,
  /** Le sable tassé du sentier qui arrive à la porte du lieu : plus foncé que le sel et que le sable du sentier ailleurs. */
  tamped: 0xc9ad80,
  /** Le reflet sur l'eau du bassin de l'item (scenette.ts, `pan`), plus clair. */
  panGlint: 0xa6e4da,
  /** Le chenal, l'eau de mer qui entre : le Lagon éclairci (directeur artistique ; avant, un bleu qui virait à l'ardoise). */
  channel: 0x55c2b4,
  /** Le bassin asséché : le fond et ses plaques craquelées. */
  crackFloor: 0xb39470,
  crackPlate: 0xdcc6a0,
  /** Le bois : planches de la cabane, poteaux, planches neuves, bois sombre (jamais presque noir). */
  planks: 0xc98e55,
  plankShade: 0xb98049,
  post: 0x8a6440,
  door: 0x7a5538,
  newWood: 0xd9ad72,
  /** Le toit bleu de la cabane, et son faîtage. */
  roof: 0x4f7fa3,
  ridge: 0x6f9cc0,
  /** La brouette : sa caisse, sa roue. */
  tray: 0xb5793f,
  trayTop: 0xc98d50,
  wheel: 0x5f6a70,
  /** Les dunes de sable pâle (la lumière dorée les chauffe). */
  dune: NATURE.dune,
  /** La vase claire de la grève (terrain.ts, `GREVE`), pour l'ombre peinte. */
  mud: 0xc8c2aa,
} as const;

/** Le sol en un point (le terrain, jamais sous l'eau). */
const groundAt = (x: number, z: number): number => groundOf(x, z, 0, 0);

/**
 * Les rangs de bassins de récolte, dans le repère du sol de la scène (x à l'est, z au sud) : leurs bords en z, les
 * diguettes en travers en x (de l'ouest à l'est) ; `dry`, le rang du bassin asséché. Au sud de la scène, au premier plan
 * (le premier rang à l'est du sentier qui arrive de l'ouest, le second plus au sud, au-delà de la place où la rangée des
 * sacs se pose de face) ; la cabane au-delà.
 */
const SALINE_ROWS = [
  { z0: 1.9, z1: 3.9, xs: [-1.4, 0.75, 2.9, 5.0], dry: -1 },
  { z0: 5.8, z1: 8.7, xs: [-5.8, -3.1, -0.4, 2.2], dry: 1 },
] as const;

/** Les diguettes : leur largeur, leur haut et celui de l'eau au-dessus du sol. */
const LEVEE = { width: 0.3, top: 0.3, water: 0.14 } as const;

export function saltworksSurroundings(b: FacetBuilder, floor: Vec3, state: SurroundingsState): void {
  const X = (dx: number) => floor.x + dx;
  const Z = (dz: number) => floor.z + dz;
  // Le sol de la grève sous la scène : le muret de Kéo s'élève de 0,35 au-dessus (scenette.ts, `SALT_PAN.rise`).
  const g0 = floor.y - 0.35;
  itemPanEdge(b, floor, g0);
  // Le haut posé, le corps l'est aussi : l'eau est dans les six bassins du lieu, qui prennent leurs reflets.
  if (state.posed) placePoolGlints(b);
  for (const row of SALINE_ROWS) salineRow(b, row.xs.map(X), Z(row.z0), Z(row.z1), row.dry);
  channel(b, floor, g0);
  tampedPath(b);
  // Les cônes de sel sur les murets et les diguettes (au nord du bassin de l'item, entre les bassins de récolte) ; les
  // gros tas, sur la grève.
  for (const [dx, dz, r] of SMALL_CONES) heap(b, X(dx), groundAt(X(dx), Z(dz)) + LEVEE.top, Z(dz), r, 5);
  for (const [dx, dz, r] of BIG_HEAPS) {
    const y = groundAt(X(dx), Z(dz));
    shadow(b, X(dx), y, Z(dz), r * 1.05);
    heap(b, X(dx), y + 0.08, Z(dz), r, 9);
  }
  cabin(b, X(-6.0), Z(11.0));
  plankPile(b, X(-3.6), Z(12.3));
  wheelbarrow(b, X(1.6), Z(12.6), 0.5);
  palm(b, X(-8.4), Z(9.4), 1.1, 0.6);
  palm(b, X(5.4), Z(-11.6), 1.0, 2.4);
  for (const [dx, dz, r, h, yaw] of DUNES) dune(b, X(dx), Z(dz), r, h, yaw);
  for (const [i, [dx, dz, r]] of ROCKS.entries()) rock(b, X(dx), Z(dz), r, i);
  for (const [i, [dx, dz, s]] of TUFTS.entries()) tuft(b, { x: X(dx), y: groundAt(X(dx), Z(dz)), z: Z(dz) }, i + 50, DRY_TUFT, s * 1.2);
}

/** Les petits cônes de sel, sur les murets et les diguettes : x, z depuis le sol de la scène, rayon. */
const SMALL_CONES: readonly (readonly [number, number, number])[] = [
  [-2.2, -2.12, 0.22],
  [4.3, -2.12, 0.2],
  [0.75, 3.3, 0.2],
  [2.9, 3.4, 0.2],
  [5.0, 3.5, 0.2],
  [-3.1, 6.4, 0.22],
  [-0.4, 6.6, 0.18],
  [-5.8, 7.2, 0.2],
];

/** Les gros tas de sel, posés sur la grève : x, z, rayon. */
const BIG_HEAPS: readonly (readonly [number, number, number])[] = [
  [8.9, -5.0, 0.48],
  [4.8, 5.4, 0.72],
];

/** Les dunes : x, z, rayon, hauteur, orientation de la crête. */
const DUNES: readonly (readonly [number, number, number, number, number])[] = [
  [-6.5, 17, 3.6, 1.7, 0.4],
  [-1.2, 19.5, 2.6, 1.1, -0.3],
  [-11.5, 11, 3, 1.4, 1.2],
  [3.2, -15.8, 3, 1.3, 0.2],
  [-2.6, -17.6, 2.8, 1.3, -0.5],
  [-9.4, -4.6, 2.4, 0.9, 0.8],
  // En travers du sentier, au nord du coude de l'ouest : vu de l'est, il ne file plus d'un trait jusqu'à l'horizon.
  [-7.6, -12.5, 2.6, 1.1, 0.3],
];

/** Les rochers : x, z, rayon. */
const ROCKS: readonly (readonly [number, number, number])[] = [
  [-6.6, 11.6, 0.55],
  [-3.4, 12.6, 0.35],
  [7.8, 2.6, 0.5],
  [-11.2, -6.5, 0.45],
  [1.6, -14.2, 0.4],
];

/** Les touffes d'herbe sèche : x, z, taille. */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [-9.6, 6.0, 1],
  [6.6, 4.2, 0.8],
  [-8.8, 3.0, 1],
  [-11.0, -1.0, 0.9],
  [-11.0, -9.5, 1],
  [-3.8, -13.5, 0.9],
  [8.2, -9.6, 0.8],
  [8.9, -7.2, 0.8],
  [-8.4, 13.2, 1],
  [-5.2, 3.6, 0.9],
  // Le long du sentier qui arrive à la porte du lieu depuis l'ouest (vu en enfilade, de l'est, il se lisait comme un pan
  // dressé) : quelques touffes sur ses bords le posent au sol.
  [-4.8, 2.7, 0.9],
  [-6.0, 1.6, 1],
  [-8.4, 2.9, 0.9],
  // Sur le sentier même, vers le nord : il se coupe en tronçons.
  [-9.2, -2.2, 1.1],
  [-8.3, -7.6, 1.1],
];

/**
 * Le bord nord du bassin de l'item : un muret d'argile un peu plus bas que celui de Kéo (le bassin se lit fermé, plus
 * une bande d'eau ouverte), et deux reflets clairs sur l'eau, loin de la jauge et de la vanne de l'item (au milieu).
 */
function itemPanEdge(b: FacetBuilder, f: Vec3, g0: number): void {
  const z = f.z - 1.8 - LEVEE.width / 2 - 0.02;
  b.box({ x: f.x, y: g0 - 0.1, z }, [12.4 + LEVEE.width, f.y - 0.05 - (g0 - 0.1), LEVEE.width], C.clay, C.clayTop);
  const y = f.y - 0.15 + 0.01;
  glint(b, f.x - 5.5, f.x - 2.1, f.z - 1.25, f.z - 0.75, y, 0.5, C.panGlint);
  glint(b, f.x + 3.4, f.x + 5.7, f.z - 1.5, f.z - 1.1, y, 0.4, C.panGlint);
}

/**
 * La grille des bassins du lieu (places.ts, `SALTWORKS`, dans son repère, qui n'est pas tourné) : les milieux de ses
 * colonnes et de ses rangs, la taille d'un bassin, le haut de son eau au-dessus du sol du lieu.
 */
const PLACE_POOLS = { cols: [-3.4, -0.6, 2.2], rows: [0, 2.3], w: 2.8, d: 2.3, water: 0.12 } as const;

/** Les reflets sur l'eau des six bassins du lieu (DA : « des dalles plates sans reflet ») : un en biais par bassin. */
function placePoolGlints(b: FacetBuilder): void {
  const c = placeById('saltworks').center;
  const y = standingHeight(heightAt(c)) + PLACE_POOLS.water + 0.01;
  const P = PLACE_POOLS;
  for (const [i, dx] of P.cols.entries())
    for (const dz of P.rows) {
      const x0 = c.x + dx - P.w / 2 + 0.45 + 0.2 * i,
        z0 = c.z + dz - P.d / 2 + 0.55;
      glint(b, x0, x0 + 1.3, z0, z0 + 0.32, y, 0.45, C.panGlint);
    }
}

/**
 * Un rang de bassins de récolte, de `z0` à `z1`, entre les diguettes en travers en `xs` : l'eau pâle de chaque bassin, à
 * plat (les diguettes en cachent les bords), un reflet en biais ; le bassin `dry` asséché, son fond brun et ses plaques
 * craquelées ; les diguettes brunes, les deux longues et celles en travers, du plus bas du sol sous le rang jusqu'un peu
 * au-dessus du plus haut.
 */
function salineRow(b: FacetBuilder, xs: readonly number[], z0: number, z1: number, dry: number): void {
  const x0 = xs[0],
    x1 = xs[xs.length - 1];
  let low = Infinity,
    high = -Infinity;
  for (const x of xs)
    for (const z of [z0, (z0 + z1) / 2, z1]) {
      const h = groundAt(x, z);
      low = Math.min(low, h);
      high = Math.max(high, h);
    }
  const foot = low - 0.15;
  const w = LEVEE.width;
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i],
      c = xs[i + 1];
    const y = high + (i === dry ? 0.06 : LEVEE.water);
    b.quad([a, y, z1], [c, y, z1], [c, y, z0], [a, y, z0], i === dry ? C.crackFloor : C.brine);
    if (i === dry) cracks(b, a + w / 2, c - w / 2, z0 + w / 2, z1 - w / 2, y + 0.02);
    else glint(b, a + 0.4, c - 0.7, z0 + 0.5, z0 + 0.85, y + 0.01, 0.5, C.brineGlint);
  }
  const top = high + LEVEE.top - foot;
  for (const z of [z0, z1]) b.box({ x: (x0 + x1) / 2, y: foot, z }, [x1 - x0 + w, top, w], C.dyke, C.dykeTop);
  for (const x of xs) b.box({ x, y: foot, z: (z0 + z1) / 2 }, [w, top, z1 - z0 - w], C.dyke, C.dykeTop);
}

/** Les plaques craquelées d'un bassin asséché, au-dessus de son fond : 3 × 4 quadrilatères irréguliers, des fentes entre eux. */
function cracks(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, y: number): void {
  const nx = 3,
    nz = 4,
    gap = 0.06;
  const jitter = (i: number, k: number, t: number) => Math.sin(i * 12.9898 + k * 78.233 + t * 37.719) * 0.12;
  const at = (i: number, k: number): [number, number] => {
    const inside = i > 0 && i < nx && k > 0 && k < nz;
    return [x0 + ((x1 - x0) * i) / nx + (inside ? jitter(i, k, 1) : 0), z0 + ((z1 - z0) * k) / nz + (inside ? jitter(i, k, 2) : 0)];
  };
  for (let i = 0; i < nx; i++)
    for (let k = 0; k < nz; k++) {
      const corners = [at(i, k), at(i, k + 1), at(i + 1, k + 1), at(i + 1, k)];
      const mx = corners.reduce((s, c) => s + c[0], 0) / 4,
        mz = corners.reduce((s, c) => s + c[1], 0) / 4;
      const p = corners.map(([u, v]): P3 => {
        const l = Math.hypot(u - mx, v - mz) || 1;
        return [u - ((u - mx) / l) * gap, y, v - ((v - mz) / l) * gap];
      });
      b.quad(p[0], p[1], p[2], p[3], C.crackPlate);
    }
}

/**
 * Le sentier qui arrive à la porte du lieu, de l'ouest, puis du nord (directeur artistique, deuxième passe : vu de l'est,
 * une bande presque blanche jusqu'à l'horizon) : son sable repeint en sable tassé, plus foncé que le sel, sur ses deux
 * liaisons et au coude.
 */
function tampedPath(b: FacetBuilder): void {
  const field = buildHeightField();
  const ground = (x: number, z: number) => heightOnMesh(field, x, z);
  pathSand(b, ground, [['sel-7', 'saltworks'], ['sel-6', 'sel-7']], ['sel-7'], { color: C.tamped, lift: 0.012 });
}

/**
 * Un reflet sur une eau calme : un quadrilatère clair en biais (décalé de `skew` unités en x de son bord sud à son bord
 * nord), un rien au-dessus de l'eau.
 */
function glint(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, y: number, skew: number, color: number): void {
  b.quad([x0 + skew, y, z0], [x0, y, z1], [x1, y, z1], [x1 + skew, y, z0], color);
}

/**
 * Le chenal de l'est : l'eau de mer qui descend du bout du bassin de l'item jusqu'à la mer, entre deux berges d'argile,
 * et la petite vanne de bois qui la retient au bout du bassin (deux poteaux, la planche, la traverse, sa poignée).
 */
function channel(b: FacetBuilder, f: Vec3, g0: number): void {
  const x0 = f.x + 6.2,
    x1 = f.x + 9.2;
  const z0 = f.z - 1.8,
    z1 = f.z;
  const wy = 0.08;
  b.box({ x: (x0 + x1) / 2, y: -0.4, z: (z0 + z1) / 2 }, [x1 - x0, wy + 0.4, z1 - z0], C.clay, C.channel);
  for (const z of [z0 - 0.16, z1 + 0.16]) b.box({ x: (x0 + x1) / 2 - 0.3, y: -0.4, z }, [x1 - x0 - 0.6, g0 + 0.15 + 0.4, 0.32], C.clay, C.clayTop);
  // La vanne reste basse (sous le haut des sacs de la rangée, quand la caméra la voit de l'est, devant elle).
  const vx = x0 + 0.25,
    vz = (z0 + z1) / 2;
  for (const z of [z0 + 0.05, z1 - 0.05]) b.box({ x: vx, y: wy, z }, [0.16, f.y + 0.3 - wy, 0.16], C.post);
  b.box({ x: vx, y: wy, z: vz }, [0.08, f.y - 0.12 - wy, z1 - z0 - 0.1], C.newWood, C.planks);
  b.box({ x: vx, y: f.y + 0.18, z: vz }, [0.2, 0.12, z1 - z0 + 0.2], C.post);
  b.beam({ x: vx - 0.05, y: f.y + 0.3, z: vz - 0.2 }, { x: vx - 0.05, y: f.y + 0.3, z: vz + 0.2 }, 0.07, C.door);
}

/** Une ombre peinte à l'opposé du soleil (sept triangles, la vase assombrie), son bord côté soleil au pied. */
function shadow(b: FacetBuilder, x: number, y: number, z: number, radius: number): void {
  const n = 7;
  const long = radius * 1.6;
  const cx = x + SHADOW_DIR.x * (long - radius),
    cz = z + SHADOW_DIR.z * (long - radius);
  const color = shadowColor(C.mud);
  const c: P3 = [cx, y + 0.04, cz];
  const rim = Array.from({ length: n }, (_, k): P3 => {
    const u = long * Math.cos((2 * Math.PI * k) / n);
    const v = radius * Math.sin((2 * Math.PI * k) / n);
    return [cx + u * SHADOW_DIR.x - v * SHADOW_DIR.z, y + 0.04, cz + u * SHADOW_DIR.z + v * SHADOW_DIR.x];
  });
  for (let k = 0; k < n; k++) b.triangle(c, rim[(k + 1) % n], rim[k], color);
}

/**
 * La cabane de la saunière, au sud : de planches sur un soubassement, ses quatre poteaux d'angle, sa porte et sa
 * fenêtre vers le nord (vers la scène, vue de dos), son toit bleu à deux pans et son faîtage plus clair.
 */
function cabin(b: FacetBuilder, x: number, z: number): void {
  const y = groundAt(x, z);
  const L = 2.8,
    D = 2.1,
    H = 1.55;
  shadow(b, x, y, z, 1.7);
  b.box({ x, y: y - 0.1, z }, [L + 0.2, 0.22, D + 0.2], C.clay, C.clayTop);
  b.box({ x, y: y + 0.12, z }, [L, H, D], C.planks, C.plankShade);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box({ x: x + sx * (L / 2), y: y + 0.12, z: z + sz * (D / 2) }, [0.16, H + 0.02, 0.16], C.post);
  b.box({ x: x - 0.45, y: y + 0.12, z: z - D / 2 - 0.02 }, [0.62, 1.12, 0.06], C.door);
  b.box({ x: x + 0.7, y: y + 0.72, z: z - D / 2 - 0.02 }, [0.5, 0.42, 0.06], C.door, C.newWood);
  b.box({ x: x + 0.7, y: y + 0.66, z: z - D / 2 - 0.06 }, [0.62, 0.06, 0.1], C.newWood);
  b.gableRoof({ x, y: y + 0.12 + H, z }, L + 0.6, D + 0.7, 0.95, C.roof, C.planks);
  b.box({ x, y: y + 0.12 + H + 0.9, z }, [L + 0.66, 0.1, 0.18], C.ridge);
}

/** La pile de planches neuves, contre la cabane : quatre planches croisées deux à deux, sur deux cales. */
function plankPile(b: FacetBuilder, x: number, z: number): void {
  const y = groundAt(x, z);
  for (const dz of [-0.35, 0.35]) b.box({ x, y, z: z + dz }, [1.5, 0.1, 0.14], C.post);
  for (let k = 0; k < 4; k++) b.box({ x: x + (k % 2 ? 0.06 : -0.05), y: y + 0.1 + k * 0.1, z, yaw: k % 2 ? 0.08 : -0.05 }, [1.7, 0.09, 0.95], C.planks, k % 2 ? C.newWood : C.planks);
}

/** La brouette chargée de sel, sa roue au nord-est, ses brancards vers le sud-ouest, posée sur ses deux pieds. */
function wheelbarrow(b: FacetBuilder, x: number, z: number, yaw: number): void {
  const y = groundAt(x, z);
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  // Un point du repère de la brouette (u vers la roue, v en travers), à la hauteur h.
  const p = (u: number, v: number, h: number) => ({ x: x + u * s + v * c, y: y + h, z: z + u * c - v * s });
  shadow(b, x, y, z, 0.7);
  const tray: readonly (readonly [number, number])[] = [
    [-0.55, 0.62],
    [-0.3, 0.3],
    [0.32, 0.3],
    [0.6, 0.66],
  ];
  // La caisse : un profil en trapèze épaissi, en travers ; tournée pour que la roue soit devant.
  b.extrude({ ...p(0, 0.36, 0), yaw: yaw - Math.PI / 2 }, tray.map(([u, h]) => [u, h] as [number, number]), 0.72, C.tray, C.trayTop);
  heap(b, p(0.02, 0, 0).x, y + 0.6, p(0.02, 0, 0).z, 0.32, 6, SALT);
  b.drum({ ...p(0.72, -0.05, 0.22), yaw: yaw + Math.PI / 2, pitch: Math.PI / 2 }, 0.22, 0.1, 8, C.wheel, C.post);
  for (const v of [-0.3, 0.3]) {
    b.beam(p(0.72, v * 0.5, 0.22), p(-1.05, v, 0.55), 0.06, C.post);
    b.beam(p(-0.3, v, 0.3), p(-0.32, v, 0), 0.06, C.post);
  }
}

/** Un palmier de l'archipel (flora.ts) : un tronc penché en deux tronçons, cinq palmes en V vues d'en haut. */
function palm(b: FacetBuilder, x: number, z: number, s: number, yaw: number): void {
  const y = groundAt(x, z);
  shadow(b, x, y, z, 0.7 * s);
  const lean = { x: Math.cos(yaw) * 0.35 * s, z: Math.sin(yaw) * 0.35 * s };
  const mid: P3 = [x + 0.6 * lean.x, y + 1.3 * s, z + 0.6 * lean.z];
  const top: P3 = [x + 2 * lean.x, y + 2.5 * s, z + 2 * lean.z];
  b.beam({ x, y, z }, { x: mid[0], y: mid[1], z: mid[2] }, 0.24 * s, FLORA_COLORS.trunk);
  b.beam({ x: mid[0], y: mid[1], z: mid[2] }, { x: top[0], y: top[1], z: top[2] }, 0.2 * s, FLORA_COLORS.trunk);
  for (let k = 0; k < 5; k++) {
    const a = yaw + (2 * Math.PI * k) / 5;
    const ca = Math.cos(a),
      sa = Math.sin(a);
    const len = 1.35 * s;
    const tip: P3 = [top[0] + ca * len, top[1] - 0.55 * s, top[2] + sa * len];
    const m: P3 = [top[0] + ca * len * 0.5, top[1] + 0.12 * s, top[2] + sa * len * 0.5];
    const w = 0.32 * s;
    const left: P3 = [m[0] - sa * w, m[1] - 0.08 * s, m[2] + ca * w];
    const right: P3 = [m[0] + sa * w, m[1] - 0.08 * s, m[2] - ca * w];
    upward(b, top, m, left, FLORA_COLORS.palm);
    upward(b, top, right, m, FLORA_COLORS.palm);
    upward(b, m, tip, left, FLORA_COLORS.bush);
    upward(b, m, right, tip, FLORA_COLORS.bush);
  }
}

/** Un triangle tourné vers le ciel, quel que soit l'ordre de ses sommets. */
function upward(b: FacetBuilder, p: P3, q: P3, r: P3, color: number): void {
  const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
  if (ny >= 0) b.triangle(p, q, r, color);
  else b.triangle(p, r, q, color);
}

/**
 * Une dune : une crête (deux sommets) au-dessus d'un pied à six points, un pan au vent plus long que le pan sous le vent ;
 * les facettes prennent la lumière chacune la sienne. Son pied s'enfonce un peu sous le sol.
 */
function dune(b: FacetBuilder, x: number, z: number, r: number, h: number, yaw: number): void {
  const y = groundAt(x, z) - 0.12;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const at = (u: number, v: number, hh: number): P3 => [x + u * c + v * s, y + hh, z - u * s + v * c];
  const ridge = [at(-0.35 * r, 0.15 * r, h), at(0.4 * r, 0.1 * r, h * 0.85)];
  const foot = [at(-r, 0, 0), at(-0.4 * r, -0.85 * r, 0), at(0.55 * r, -0.8 * r, 0), at(r, 0.05, 0), at(0.45 * r, 0.6 * r, 0), at(-0.45 * r, 0.6 * r, 0)];
  // Le pan au vent (vers −v) : du pied à la crête ; le pan sous le vent (vers +v), plus raide.
  upward(b, foot[0], foot[1], ridge[0], C.dune);
  upward(b, foot[1], foot[2], ridge[0], C.dune);
  upward(b, foot[2], ridge[1], ridge[0], C.dune);
  upward(b, foot[2], foot[3], ridge[1], C.dune);
  upward(b, foot[3], foot[4], ridge[1], C.dune);
  upward(b, foot[4], ridge[0], ridge[1], C.dune);
  upward(b, foot[4], foot[5], ridge[0], C.dune);
  upward(b, foot[5], foot[0], ridge[0], C.dune);
}

/** Un rocher à facettes du kit commun, son ombre peinte au pied. */
function rock(b: FacetBuilder, x: number, z: number, r: number, seed: number): void {
  const y = groundAt(x, z);
  shadow(b, x, y, z, r);
  stone(b, { x, y: y + 0.05, z }, r, r * 0.85, seed + 30);
}

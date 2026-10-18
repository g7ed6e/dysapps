/**
 * Les abords de la scénette de la Halle (d'après les concepts du 18 octobre 2026, « scenettes-6e-maison-commune ») : au
 * nord-est, derrière la Halle, la maison à colombages du couvreur au toit d'ardoise bleue en réparation (le kit commun,
 * ./surroundingsKit.ts), sur sa petite place pavée : son échelle appuyée à l'égout, une pile d'ardoises neuves à son pied,
 * deux paquets d'ardoises sur son toit et une guirlande de fanions en travers de sa façade ; plus loin, deux maisons du
 * village. Au sud-ouest, l'étal du marché tourné vers la Halle, un banc, des pins et des buissons ronds ; à l'est, la
 * réserve du chantier (ardoises, tonneaux, planches). Fini tout autour, puisque la caméra tourne à deux doigts : de face,
 * la maison, l'échelle et la guirlande dans la moitié droite du cadre, au-dessus des piliers, l'école de l'Escale au
 * fond ; de côté, la réserve du chantier et la maison du village de l'ouest ; de dos, l'étal et les pins devant la mer.
 *
 * Rien de haut entre la caméra de face et la scène, ni tout près du point visé (à moins de `RING` de lui) : seules les
 * touffes y restent, sous le genou de Kéo. Rien de détaillé derrière la tête du couvreur ni derrière la borne-fontaine
 * (l'étal, d'abord prévu à côté de la maison, lui faisait concurrence). Aplats francs, une couleur par facette, jamais
 * presque noir ; la pierre chaude du kit. Code pur, sans Three.js.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { SurroundingsState } from './surroundings';
import { NATURE, STONE, TIMBER, barrel, groundAt, jitter, plankStack, rock, timberHouse, tuft, type P3, type RockTones } from './surroundingsKit';

const C = {
  /** L'ardoise neuve de la pile : deux bleus de l'ardoise du toit, la tranche plus claire. */
  slate: 0x4f6f9e,
  slateLight: 0x6283b3,
  slateEdge: 0x86a0c4,
  /** L'échelle de bois clair. */
  ladder: 0xc08c55,
  /** La place de la maison : des dalles pâles, leur tranche (celle des dalles des scènes). */
  square: 0xdcc6a0,
  pavingSide: 0xb0926a,
  /** La guirlande : sa cordelette et ses fanions (Sable, Lagon, terre cuite, crème, bleu béret). */
  cord: 0x8f7a5c,
  flags: [0xdaa66a, 0x5fb3a8, 0xd9805f, 0xf2e6c4, 0x4f7fa3] as const,
  /** L'étal : son bois, sa toile rayée crème et sable, ses cagettes, ses fruits. */
  stall: 0xa57a4f,
  stallTop: 0xc9a26e,
  awning: 0xf2e6c4,
  awningStripe: 0xe0b878,
  crate: 0xc08c55,
  fruit: [0xe39a4a, 0x8cbf5a, 0xd9725a] as const,
  /** Le banc : ses lattes, ses pieds. */
  bench: 0xb08658,
  benchTop: 0xc9a26e,
  /** Les pins (ceux de la flore, près) et leur tronc. */
  pine: 0x2f7d62,
  pineLight: 0x3c9270,
  trunk: 0x7a5538,
} as const;

/** Les buissons ronds : deux verts de la flore et un dessus clair. */
const BUSH: RockTones = { light: 0x55b083, shade: 0x3f9a74, top: 0x6cc092 };

/**
 * Où sont les abords, depuis le sol de la scène (`floor`, le milieu de la dalle, entre Kéo et le couvreur ; le centre de
 * la Halle est 4,4 plus au nord) : la maison du couvreur (son milieu, sa largeur, sa profondeur, la hauteur de ses murs,
 * la pente de son toit, l'écart de son échelle et de sa pile d'ardoises au milieu de sa façade), l'étal, les deux maisons
 * du village (leur cap), la réserve du chantier, le banc.
 */
export const COMMONS_SURROUNDINGS = {
  house: { dx: 4.4, dz: -12.8, width: 4.4, depth: 3.0, wall: 2.4, slope: 0.9, ladder: -1.2, pile: 0.85 },
  stall: { dx: -5.4, dz: 9.4 },
  village: [
    { dx: -12.5, dz: -4.5, yaw: Math.PI / 2, width: 3.4, depth: 2.6, wall: 1.9 },
    { dx: -8.5, dz: -21.5, yaw: 0.25, width: 3.6, depth: 2.6, wall: 2.0 },
  ],
  yard: { dx: 9.4, dz: 3.2 },
  bench: { dx: -6.8, dz: 4.6 },
} as const;

/**
 * La distance au point visé en deçà de laquelle rien ne dépasse le genou de Kéo (un mètre au-dessus du sol de la scène) :
 * quand la caméra tourne, rien de haut ne se dresse contre Kéo, le couvreur ou la borne-fontaine.
 */
export const RING = 8.2;

export function commonsSurroundings(b: FacetBuilder, floor: Vec3, _state: SurroundingsState): void {
  house(b, floor);
  stall(b, floor);
  village(b, floor);
  yard(b, floor);
  southSide(b, floor);
}

/** Le sol en un point, un rien enfoncé : un pied posé ne flotte jamais. */
const footAt = (x: number, z: number, sink = 0.08): number => groundAt(x, z, sink);

/**
 * La maison du couvreur, au nord-est derrière la Halle (le kit commun) : sur sa place pavée, la façade au sud, son toit
 * d'ardoise en réparation (un morceau à nu et ses liteaux neufs) et sa cheminée ; l'échelle appuyée à l'égout ; contre
 * son coin ouest, la pile d'ardoises neuves ; sur le toit, à côté du morceau à nu, deux paquets d'ardoises ; la
 * guirlande en travers de la façade.
 */
function house(b: FacetBuilder, f: Vec3): void {
  const H = COMMONS_SURROUNDINGS.house;
  const x = f.x + H.dx,
    z = f.z + H.dz;
  // La place de la maison : un aplat de dalles pâles, un peu plus large qu'elle, au ras du sol.
  const sq = { w: H.width + 4.2, d: H.depth + 3.4 };
  let low = Infinity;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) low = Math.min(low, footAt(x + (sx * sq.w) / 2, z + 0.6 + (sz * sq.d) / 2, 0.1));
  b.box({ x, y: low, z: z + 0.6 }, [sq.w, groundAt(x, z) + 0.06 - low, sq.d], C.pavingSide, C.square);
  const floorY = timberHouse(b, { x, z, width: H.width, depth: H.depth, wall: H.wall, slope: H.slope, repair: true, chimney: true });
  const front = z + H.depth / 2;
  const eave = floorY + H.wall - H.slope * 0.45;
  // L'échelle, à gauche de la porte, appuyée à l'égout au bord du morceau à nu (de face, loin derrière le couvreur, qui
  // est devant le milieu de la maison) : deux montants, cinq barreaux.
  const lx = x + H.ladder;
  const footZ = front + 1.0,
    topZ = front + 0.5;
  const foot = groundAt(lx, footZ) + 0.02;
  const top = eave + 0.3;
  for (const side of [-0.2, 0.2]) b.beam({ x: lx + side, y: foot, z: footZ }, { x: lx + side, y: top, z: topZ }, 0.08, C.ladder);
  for (let k = 1; k <= 5; k++) {
    const t = k / 6;
    const y = foot + (top - foot) * t,
      rz = footZ + (topZ - footZ) * t;
    b.beam({ x: lx - 0.2, y, z: rz }, { x: lx + 0.2, y, z: rz }, 0.06, C.ladder);
  }
  // La pile d'ardoises neuves, devant la façade, à droite de la fenêtre : quatre paquets un peu décalés.
  const px = x + H.pile,
    pz = front + 0.45;
  let py = footAt(px, pz, 0.02);
  for (let k = 0; k < 4; k++) {
    const h = 0.14;
    b.box({ x: px + (jitter(k + 3) - 0.5) * 0.12, y: py, z: pz + (jitter(k + 7) - 0.5) * 0.1, yaw: (jitter(k) - 0.5) * 0.3 }, [0.62, h, 0.42], k % 2 ? C.slateLight : C.slate, C.slateEdge);
    py += h;
  }
  // Deux paquets d'ardoises posés sur le pan de la façade, à droite du morceau à nu, dans la pente du toit : (écart
  // au milieu de la maison, rang de l'égout au faîtage).
  const over = 0.45;
  const run = H.depth / 2 + over;
  const yEave = floorY + H.wall - H.slope * over,
    yRidge = floorY + H.wall + (H.slope * H.depth) / 2;
  for (const [u, t] of [
    [0.95, 0.4],
    [1.6, 0.62],
  ] as const)
    b.box({ x: x + u, y: yEave + (yRidge - yEave) * t + 0.02, z: z + run * (1 - t), pitch: Math.atan(H.slope) }, [0.5, 0.12, 0.34], C.slateLight, C.slateEdge);
  garland(b, x, floorY + H.wall - 0.2, front + 0.08, H.width / 2 + 0.1);
}

/**
 * La guirlande de fanions, tendue en travers de la façade sous l'égout, d'un coin à l'autre (le concept) : une
 * cordelette en trois travées qui pend un peu, des fanions en triangle, vus des deux côtés.
 */
function garland(b: FacetBuilder, x: number, y: number, z: number, half: number): void {
  const point = (t: number): P3 => [x - half + 2 * half * t, y - 0.45 * Math.sin(Math.PI * t), z + 0.04 * Math.sin(Math.PI * t)];
  const n = 3;
  for (let k = 0; k < n; k++) {
    const [ax, ay, az] = point(k / n),
      [cx, cy, cz] = point((k + 1) / n);
    b.beam({ x: ax, y: ay, z: az }, { x: cx, y: cy, z: cz }, 0.035, C.cord);
  }
  const flags = 9;
  for (let k = 0; k < flags; k++) {
    const a = point((k + 0.2) / flags),
      c = point((k + 0.8) / flags);
    const m: P3 = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2 - 0.3, (a[2] + c[2]) / 2 + 0.02];
    const color = C.flags[k % C.flags.length];
    b.triangle(a, m, c, color);
    b.triangle(c, m, a, color);
  }
}

/**
 * L'étal du marché, au sud-ouest de la scène, tourné vers la Halle : quatre poteaux, un comptoir et ses cagettes de
 * fruits, une toile rayée crème et sable qui descend vers le nord, son lambrequin découpé. De face, il reste sous le
 * panneau (derrière la borne-fontaine, il lui faisait concurrence) ; de dos, il est dans la moitié droite du cadre.
 */
function stall(b: FacetBuilder, f: Vec3): void {
  const S = COMMONS_SURROUNDINGS.stall;
  const x = f.x + S.dx,
    z = f.z + S.dz;
  const y = footAt(x, z);
  const W = 1.8,
    D = 1.0;
  // Le devant, au nord : ses poteaux plus bas, le comptoir de ce côté.
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) b.box({ x: x + (sx * W) / 2, y, z: z + (sz * D) / 2 }, [0.1, sz < 0 ? 1.75 : 2.05, 0.1], C.stall);
  b.box({ x, y: y + 0.2, z: z - 0.1 }, [W, 0.62, D * 0.7], C.stall, C.stallTop);
  // Les cagettes et leurs fruits, sur le comptoir.
  for (const [k, dx] of [-0.55, 0, 0.55].entries()) {
    b.box({ x: x + dx, y: y + 0.82, z: z - 0.1 }, [0.46, 0.14, 0.42], C.crate);
    b.prism({ x: x + dx, y: y + 0.96, z: z - 0.1 }, 0.17, 0.06, 0.1, 5, C.fruit[k]);
  }
  // La toile, du haut (au sud) au bas (devant, au nord), en quatre bandes ; le lambrequin, des dents en triangle, vues
  // des deux côtés.
  const yBack = y + 2.05,
    yFront = y + 1.75;
  const x0 = x - W / 2 - 0.15,
    x1 = x + W / 2 + 0.15;
  const zBack = z + D / 2 + 0.15,
    zFront = z - D / 2 - 0.3;
  for (let k = 0; k < 4; k++) {
    const a0 = x0 + ((x1 - x0) * k) / 4,
      a1 = x0 + ((x1 - x0) * (k + 1)) / 4;
    b.quad([a1, yFront, zFront], [a0, yFront, zFront], [a0, yBack, zBack], [a1, yBack, zBack], k % 2 ? C.awningStripe : C.awning);
  }
  for (let k = 0; k < 5; k++) {
    const a0 = x0 + ((x1 - x0) * k) / 5,
      a1 = x0 + ((x1 - x0) * (k + 1)) / 5;
    const tip: P3 = [(a0 + a1) / 2, yFront - 0.22, zFront];
    const color = k % 2 ? C.awningStripe : C.awning;
    b.triangle([a0, yFront, zFront], tip, [a1, yFront, zFront], color);
    b.triangle([a1, yFront, zFront], tip, [a0, yFront, zFront], color);
  }
}

/** Les deux maisons du village : à l'ouest de la Halle (vue de côté), au nord-ouest au loin (vue de face, à gauche). */
function village(b: FacetBuilder, f: Vec3): void {
  for (const [k, V] of COMMONS_SURROUNDINGS.village.entries()) {
    timberHouse(b, { x: f.x + V.dx, z: f.z + V.dz, yaw: V.yaw, width: V.width, depth: V.depth, wall: V.wall, slope: 0.8, chimney: k === 0, door: 0x4f7fa3 });
  }
}

/**
 * La réserve du chantier, à l'est de la Halle (vue de côté) : une pile de planches sur ses cales, deux tonneaux, des
 * paquets d'ardoises sur une palette.
 */
function yard(b: FacetBuilder, f: Vec3): void {
  const Y = COMMONS_SURROUNDINGS.yard;
  const x = f.x + Y.dx,
    z = f.z + Y.dz;
  const y = groundAt(x, z) + 0.1;
  for (const dz of [-0.8, 0.8]) b.box({ x, y: footAt(x, z + dz), z: z + dz }, [1.0, y - footAt(x, z + dz), 0.16], NATURE.pile);
  plankStack(b, x, y, z, [3, 2], 2.2);
  for (const [dx, dz] of [
    [1.1, -1.4],
    [1.6, -0.7],
  ])
    barrel(b, x + dx, groundAt(x + dx, z + dz) - 0.04, z + dz);
  // La palette et ses paquets d'ardoises.
  const px = x - 1.4,
    pz = z - 1.6;
  const py = footAt(px, pz, 0.02);
  b.box({ x: px, y: py, z: pz }, [1.0, 0.12, 0.8], TIMBER.plankSide, TIMBER.plank);
  for (const [k, [dx, dz]] of [
    [-0.22, -0.16],
    [0.22, -0.16],
    [0, 0.18],
  ].entries())
    b.box({ x: px + dx, y: py + 0.12, z: pz + dz, yaw: 0.1 * k }, [0.4, 0.22 + 0.06 * k, 0.32], k === 1 ? C.slate : C.slateLight, C.slateEdge);
}

/** Les pins : (dx, dz, taille) depuis le sol de la scène. */
const PINES: readonly (readonly [number, number, number])[] = [
  [-7.8, 11.6, 1.25],
  [7.2, -17.2, 1.2],
  [-8.8, 7.6, 1.0],
  [10.6, -9.6, 1.15],
  [-13.8, 1.6, 1.2],
  [12.8, 8.8, 1.1],
];

/** Les buissons ronds : (dx, dz, rayon). */
const BUSHES: readonly (readonly [number, number, number])[] = [
  [-6.6, 7.6, 0.55],
  [-2.2, 9.6, 0.45],
  [5.4, 8.8, 0.5],
  [8.6, -14.2, 0.55],
  [3.6, -16.4, 0.45],
  [-10.6, -7.6, 0.5],
];

/** Les touffes d'herbe : (dx, dz). */
const TUFTS: readonly (readonly [number, number])[] = [
  [-7.8, 2.4],
  [7.9, 6.6],
  [-4.6, 7.6],
  [2.6, 7.8],
  [6.2, -12.4],
];

/**
 * Le côté sud, vu de dos devant la mer : le banc près de l'étal, les pins et les buissons ronds, quelques touffes et deux
 * rochers.
 */
function southSide(b: FacetBuilder, f: Vec3): void {
  const B = COMMONS_SURROUNDINGS.bench;
  const bx = f.x + B.dx,
    bz = f.z + B.dz;
  const by = f.y - 0.1;
  for (const dx of [-0.6, 0.6]) b.box({ x: bx + dx, y: by, z: bz }, [0.1, 0.4, 0.36], C.bench);
  b.box({ x: bx, y: by + 0.4, z: bz }, [1.6, 0.08, 0.42], C.bench, C.benchTop);
  b.box({ x: bx, y: by + 0.48, z: bz + 0.2 }, [1.6, 0.34, 0.07], C.bench, C.benchTop);
  for (const [dx, dz, s] of PINES) {
    const x = f.x + dx,
      z = f.z + dz;
    const y = footAt(x, z, 0.05);
    b.prism({ x, y, z }, 0.13 * s, 0.11 * s, 0.6 * s, 4, C.trunk);
    b.prism({ x, y: y + 0.45 * s, z, yaw: dx }, 1.0 * s, 0, 1.35 * s, 5, C.pine);
    b.prism({ x, y: y + 1.15 * s, z, yaw: dx + 0.6 }, 0.78 * s, 0, 1.15 * s, 5, C.pineLight);
    b.prism({ x, y: y + 1.8 * s, z, yaw: dx }, 0.52 * s, 0, 1.0 * s, 5, C.pine);
  }
  for (const [k, [dx, dz, r]] of BUSHES.entries()) {
    const x = f.x + dx,
      z = f.z + dz;
    rock(b, { x, y: footAt(x, z, 0.02), z }, r, r * 1.5, 40 + k, BUSH);
  }
  for (const [k, [dx, dz]] of TUFTS.entries()) {
    const x = f.x + dx,
      z = f.z + dz;
    tuft(b, { x, y: footAt(x, z, 0.02), z }, 60 + k);
  }
  rock(b, { x: f.x + 7.6, y: footAt(f.x + 7.6, f.z + 1.0), z: f.z + 1.0 }, 0.45, 0.4, 7, { light: STONE.boulder, shade: STONE.boulderShade, top: STONE.top });
  rock(b, { x: f.x - 8.4, y: footAt(f.x - 8.4, f.z + 5.0), z: f.z + 5.0 }, 0.6, 0.5, 9, { light: STONE.boulder, shade: STONE.boulderShade, top: STONE.top });
}

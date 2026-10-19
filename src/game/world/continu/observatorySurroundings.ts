/**
 * Les abords de la scénette de l'Observatoire (reprise lieu par lieu, d'après la deuxième passe du directeur artistique
 * du 18 octobre 2026, sans concept dessiné) : le belvédère sur son tertre, fini tout autour puisque la caméra tourne
 * (« caméra libre »). Dans la moitié droite du cadre de face (la gauche est sous le panneau), derrière la tour, au
 * nord-nord-est : un échafaudage de bois clair contre le tambour, deux planchers, son escalier qui monte de l'est, et sur le
 * plancher du haut une caisse et une toile roulée du chantier (ni lunette : le lieu est un belvédère de géographie, relecture
 * du 19 octobre 2026) ; plus loin, un ruisseau qui descend de la
 * colline de l'est jusqu'au bras de mer de l'ouest, passé par un petit pont de bois à quatre lanternes (le fer et le
 * verre Sable des ponts des terres), sur un sentier qui part du chemin de la porte, longe le tertre à l'est et monte
 * rejoindre le chemin de la colline : il mène quelque part. Le pied de la tour est habillé : touffes d'herbe, blocs
 * d'enduit tombés, une pile de planches et un tonneau du chantier, deux buissons. Au sud, le sable du sentier de la
 * porte monte sur le talus jusqu'à la dalle de la scène, et des dalles éparses la fondent dans l'herbe à chaque bout. De dos, sur
 * la mer, au sud, une barque à l'ancre. Rien de haut entre la caméra de face et la scène : ce qui est haut se tient
 * derrière le tambour ou loin. Sur la terrasse dallée, quand elle est posée (`posed`), tout ce qu'elle porte monte de
 * son épaisseur ; le compte de triangles ne change pas d'un état à l'autre. Aplats francs, une couleur par facette, rien
 * de presque noir ; aucun appel de plus (le décor de près). Code pur.
 */
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import { COLORS_6E, placeById } from './plan6e';
import { OBSERVATORY } from './places';
import type { SurroundingsState } from './surroundings';
import { GREEN_TUFT, STONE, TIMBER, barque, barqueFloor, barrel, groundAt as groundOf, jitter, plankStack, rock, tuft, type P3 } from './surroundingsKit';
import { buildHeightField, heightOnMesh, standingHeight, type HeightField } from './terrain';

/** Le sol tel que le monde le dessine (le maillage du terrain, pas sa formule) : les rubans s'y posent sans s'y enfoncer. */
const meshGround = (field: HeightField, x: number, z: number): number => heightOnMesh(field, x, z);

/** Les couleurs des abords : celles du lieu (places.ts) et quelques valeurs propres à l'Observatoire. */
const C = {
  /** Le bois clair de l'échafaudage, ses planchers (le bois neuf du kit). */
  pole: 0xc9a06a,
  poleShade: 0xb08658,
  deck: TIMBER.plank,
  deckSide: TIMBER.plankSide,
  /** Sur le plancher du haut : la caisse (le bois du kit, son couvercle) et la toile roulée, écrue, ses liens de chanvre. */
  crate: TIMBER.stave,
  crateLid: TIMBER.lid,
  canvas: 0xe8dcc0,
  canvasEnd: 0xd6c8a8,
  cord: 0x9c8462,
  /** L'enduit usé des blocs tombés (places.ts, `wornPlaster`), et son dessus. */
  plaster: 0xc4ad8e,
  plasterTop: 0xb59f82,
  /** Le ruisseau : l'eau (le Lagon éclairci, comme le chenal des Marais salants), ses berges de terre et d'herbe. */
  brook: 0x55c2b4,
  bank: 0x8f9a5c,
  /** Le petit pont : son tablier, ses garde-corps, le fer et le verre Sable de ses lanternes (bridges.ts). */
  plank: 0xc6955f,
  plankSide: 0xa9784a,
  rail: 0x8a5f3a,
  iron: 0x66727a,
  glass: 0xdaa66a,
  /** Les dalles éparses et la marche de la scène (scenette.ts, `observatoryPaving`). */
  slab: 0xd6b98e,
  slabSide: 0xc2a47a,
  /** Les buissons (flora.ts). */
  bush: 0x3f9a74,
  bushLight: 0x55b083,
} as const;

/** L'échafaudage, depuis le centre du lieu : l'angle de ses trois cadres (de l'est vers le nord), ses rayons, ses planchers. */
export const OBSERVATORY_SCAFFOLD = { angles: [-56, -92], inner: 3.75, outer: 4.55, decks: [1.8, 3.4], top: 4.2 } as const;

/**
 * Le ruisseau, depuis le centre du lieu : de sa source, sur la colline au nord-est, jusqu'au bras de mer de l'ouest ; sa
 * demi-largeur et celle de ses berges.
 */
const BROOK = {
  line: [
    [15, -15],
    [11.5, -11.2],
    [8, -9.0],
    [5, -8.6],
    [1.5, -9.6],
    [-2, -10.6],
    [-7, -10.1],
    [-12, -9.2],
    [-17, -8.6],
    [-21, -8.2],
  ],
  half: 0.75,
  bank: 0.4,
} as const;

/** Le sentier de l'est : du chemin de la porte au pont, puis jusqu'au chemin de la colline (depuis le centre du lieu). */
const TRAIL = {
  line: [
    [6.0, 7.7],
    [7.3, 4.4],
    [7.6, 0.2],
    [6.8, -4.2],
    [5.0, -7.25],
  ],
  beyond: [
    [5.0, -9.95],
    [5.6, -13.5],
    [7.0, -17.0],
    [8.1, -20.4],
  ],
  half: 0.65,
} as const;

/** Le petit pont du ruisseau : son milieu, sa longueur (le long du sentier), sa largeur, la hauteur de ses lanternes. */
const FOOTBRIDGE = { x: 5.0, z: -8.6, length: 2.7, width: 1.15, lantern: 1.25 } as const;

export function observatorySurroundings(b: FacetBuilder, floor: Vec3, state: SurroundingsState): void {
  const c = placeById('observatory').center;
  const X = (dx: number) => c.x + dx;
  const Z = (dz: number) => c.z + dz;
  // Le sol en un point, et, sur la terrasse quand elle est posée, son dessus.
  const T = OBSERVATORY.terrace;
  const terrace = T.r * Math.cos(Math.PI / T.sides) - 0.05;
  const ground = (dx: number, dz: number) => groundOf(X(dx), Z(dz), 0, 0) + (state.posed && Math.hypot(dx, dz) < terrace ? T.top : 0);
  scaffold(b, X, Z, ground);
  towerFoot(b, X, Z, ground);
  doorStep(b, floor, c);
  brook(b, X, Z);
  trail(b, X, Z, TRAIL.line);
  trail(b, X, Z, TRAIL.beyond);
  footbridge(b, X, Z);
  // De dos, sur la mer au sud : une barque à l'ancre, sa lanterne éteinte, sans mât.
  const boat = { x: X(-5), y: 0, z: Z(23) };
  barque(b, boat, 2.6, 1.15, { mast: false });
  barqueFloor(b, boat, 2.6, 1.15);
  for (const [i, [dx, dz, r]] of ROCKS.entries()) rock(b, { x: X(dx), y: groundOf(X(dx), Z(dz), 0, 0) + 0.05, z: Z(dz) }, r, r * 0.8, i + 70);
  for (const [i, [dx, dz, s]] of TUFTS.entries()) tuft(b, { x: X(dx), y: ground(dx, dz), z: Z(dz) }, i + 90, GREEN_TUFT, s);
}

/** Les rochers clairs : au bord du tertre, à la source du ruisseau, sur la pelouse de l'ouest (x, z depuis le centre, rayon). */
const ROCKS: readonly (readonly [number, number, number])[] = [
  [15.6, -15.8, 0.7],
  [14.0, -16.2, 0.45],
  [9.4, 9.6, 0.5],
  [-6.8, 9.2, 0.55],
  // Sur la pelouse de l'ouest, vue de l'est, entre la dalle et le bras de mer : bas, jamais devant la caméra de l'ouest.
  [-10.5, 5.5, 0.6],
  [-13.0, 1.2, 0.45],
];

/**
 * Les touffes d'herbe : au pied du tambour (dehors, hors de la dalle de la scène et de la porte), le long des dalles
 * éparses, du sentier et du ruisseau (x, z depuis le centre, taille).
 */
const TUFTS: readonly (readonly [number, number, number])[] = [
  [3.35, 0.15, 1],
  [3.3, -1.2, 0.9],
  [2.9, 2.6, 0.8],
  [1.2, -3.5, 0.9],
  [-3.4, 1.4, 1],
  [-3.5, -1.2, 0.9],
  [-1.6, -3.3, 0.8],
  [5.2, 5.8, 1],
  [-5.3, 5.6, 1],
  [6.4, 2.4, 0.9],
  [8.6, -6.6, 1.1],
  [6.4, -11.2, 1],
  [9.0, -12.4, 0.9],
  [-9.6, 6.4, 1],
  [-11.2, 4.6, 0.9],
  [-12.2, 1.9, 1],
  [-9.6, 0.6, 0.9],
];

type Axis = (d: number) => number;
type Ground = (dx: number, dz: number) => number;

/** Un point à l'angle `deg` (de l'est vers le sud, comme places.ts) et au rayon `r`, depuis le centre du lieu. */
const polar = (deg: number, r: number) => ({ x: r * Math.cos((deg * Math.PI) / 180), z: r * Math.sin((deg * Math.PI) / 180) });

/** Le quart de tour qui tourne la face +z d'un volume vers l'angle `deg` (le dehors, places.ts). */
const facing = (deg: number) => Math.atan2(Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180));

/**
 * L'échafaudage du nord-nord-est, contre le tambour (entre la table d'orientation et le tas des côtes tombées ; vu de
 * face, derrière la tour, un peu à droite, il laisse au pont la place du bord du cadre) : deux cadres de deux poteaux,
 * leurs traverses sous chaque plancher, les deux planchers de planches de la travée, le garde-corps du haut, une écharpe
 * sur la face du dehors ; l'escalier qui monte de l'est au premier plancher, ses deux limons et ses six marches ; sur le
 * plancher du haut, une caisse et une toile roulée.
 */
function scaffold(b: FacetBuilder, X: Axis, Z: Axis, ground: Ground): void {
  const S = OBSERVATORY_SCAFFOLD;
  const mid = (S.inner + S.outer) / 2;
  const foot = (deg: number) => {
    const p = polar(deg, mid);
    return ground(p.x, p.z);
  };
  for (const deg of S.angles) {
    const y0 = foot(deg);
    for (const r of [S.inner, S.outer]) {
      const p = polar(deg, r);
      b.box({ x: X(p.x), y: y0 - 0.1, z: Z(p.z), yaw: facing(deg) }, [0.12, S.top + 0.1, 0.12], C.pole, C.poleShade);
    }
    const m = polar(deg, mid);
    for (const h of S.decks) b.box({ x: X(m.x), y: y0 + h - 0.16, z: Z(m.z), yaw: facing(deg) }, [0.1, 0.1, S.outer - S.inner + 0.2], C.poleShade);
  }
  for (let k = 0; k + 1 < S.angles.length; k++) {
    const a0 = S.angles[k],
      a1 = S.angles[k + 1];
    const deg = (a0 + a1) / 2;
    const y0 = Math.min(foot(a0), foot(a1));
    const chord = 2 * mid * Math.sin(((a0 - a1) * Math.PI) / 360) + 0.1;
    const m = polar(deg, mid);
    for (const h of S.decks) b.box({ x: X(m.x), y: y0 + h - 0.06, z: Z(m.z), yaw: facing(deg) }, [chord, 0.08, S.outer - S.inner + 0.15], C.deckSide, C.deck);
    // Le garde-corps du haut, sur le dehors ; l'écharpe de la travée, du pied d'un cadre au plancher du haut de l'autre.
    const o = polar(deg, S.outer + 0.02);
    b.box({ x: X(o.x), y: y0 + S.decks[1] + 0.75, z: Z(o.z), yaw: facing(deg) }, [chord, 0.08, 0.08], C.pole);
    const p = polar(a0, S.outer + 0.08),
      q = polar(a1, S.outer + 0.08);
    b.beam({ x: X(p.x), y: y0 + 0.1, z: Z(p.z) }, { x: X(q.x), y: y0 + S.decks[1] - 0.1, z: Z(q.z) }, 0.08, C.poleShade);
  }
  // L'escalier, à l'est : il part du sol au sud-est du premier cadre et monte vers lui, le long du tambour (vu de face,
  // en biais à droite de la tour).
  const first = S.angles[0];
  const top = foot(first) + S.decks[0];
  const steps = 6;
  const from = first + 26;
  const end = first + 2;
  for (const r of [S.inner + 0.08, S.outer - 0.08]) {
    const p = polar(from, r),
      q = polar(end, r);
    b.beam({ x: X(p.x), y: foot(from), z: Z(p.z) }, { x: X(q.x), y: top, z: Z(q.z) }, 0.09, C.poleShade);
  }
  for (let k = 0; k < steps; k++) {
    const t = (k + 0.5) / steps;
    const deg = from + (end - from) * t;
    const p = polar(deg, mid);
    const y = foot(from) + (top - foot(from)) * t;
    b.box({ x: X(p.x), y: y - 0.02, z: Z(p.z), yaw: facing(deg) }, [0.3, 0.06, S.outer - S.inner - 0.1], C.deckSide, C.deck);
  }
  // Sur le plancher du haut, au milieu de la travée : la caisse et la toile roulée du chantier (bas, rien vers le ciel).
  const deg = (S.angles[0] + S.angles[1]) / 2;
  const at = polar(deg, mid);
  deckLoad(b, { x: X(at.x), y: Math.min(foot(S.angles[0]), foot(S.angles[1])) + S.decks[1] + 0.02, z: Z(at.z) }, facing(deg));
}

/**
 * Ce que porte le plancher du haut, son milieu en `at`, tourné de `yaw` (le long du tambour) : une caisse de bois au
 * couvercle clair, et à côté une toile écrue roulée, couchée, deux liens de chanvre. Une soixantaine de triangles.
 */
function deckLoad(b: FacetBuilder, at: Vec3, yaw: number): void {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  // Le long de la travée (l'axe x du repère tourné) : la caisse d'un côté, la toile de l'autre.
  const along = (t: number) => ({ x: at.x + t * c, z: at.z - t * s });
  const box = along(-0.35);
  b.box({ x: box.x, y: at.y, z: box.z, yaw }, [0.5, 0.42, 0.42], C.crate, C.crateLid);
  const roll = along(0.35);
  // La toile : un rouleau couché en travers du plancher (son axe, l'axe z du repère tourné), deux liens de chanvre.
  const r = 0.13,
    len = 0.66;
  const across = (t: number) => ({ x: roll.x + t * s, y: at.y + r, z: roll.z + t * c, yaw, pitch: Math.PI / 2 });
  b.drum(across(-len / 2), r, len, 7, C.canvas, C.canvasEnd);
  for (const t of [-0.2, 0.16]) b.band(across(t), r + 0.012, 0.05, 7, C.cord);
}

/**
 * Le pied de la tour, habillé : des blocs d'enduit tombés contre le mur, une pile de planches et un tonneau du chantier,
 * deux buissons bas au nord-ouest ; les touffes sont posées avec les autres.
 */
function towerFoot(b: FacetBuilder, X: Axis, Z: Axis, ground: Ground): void {
  for (const [dx, dz, s, yaw] of BLOCKS) b.box({ x: X(dx), y: ground(dx, dz) - 0.04, z: Z(dz), yaw }, [s, s * 0.7, s * 0.8], C.plaster, C.plasterTop);
  // La pile, le long du tambour, à l'ouest ; le tonneau à l'est, au pied de l'escalier de l'échafaudage. La placette
  // (une commande, amenagements.ts, à l'est de la porte) garde sa place libre.
  plankStack(b, X(-4.4), ground(-4.4, 2.3), Z(2.3), [3, 2], 1.5);
  barrel(b, X(4.05), ground(4.05, -0.75), Z(-0.75));
  for (const [dx, dz, r] of BUSHES) {
    const y = ground(dx, dz);
    b.prism({ x: X(dx), y: y - 0.05, z: Z(dz), yaw: jitter(dx) * 2 }, r, r * 0.7, r * 0.55, 6, C.bush, C.bushLight);
    b.prism({ x: X(dx), y: y + r * 0.5, z: Z(dz), yaw: jitter(dz) * 2 }, r * 0.7, 0, r * 0.45, 6, C.bushLight);
  }
}

/** Les blocs d'enduit tombés au pied du tambour : x, z depuis le centre, taille, cap. */
const BLOCKS: readonly (readonly [number, number, number, number])[] = [
  [3.5, -0.2, 0.36, 0.3],
  [3.6, 0.5, 0.26, 1.1],
  [-3.6, 0.9, 0.32, 0.7],
  [-3.4, -2.3, 0.28, 0.2],
];

/** Les buissons bas : x, z depuis le centre, rayon. */
const BUSHES: readonly (readonly [number, number, number])[] = [
  [-4.4, -3.9, 0.55],
  [-5.6, -3.1, 0.42],
];

/**
 * La dalle de la scène raccordée au chemin : le sable du sentier de la porte (le nœud du réseau, au sud) monte sur le
 * talus jusqu'au bord de la dalle, sans liseré (vu de face, deux traits bruns s'y lisaient comme des pieds de table) ;
 * des dalles éparses à chaque bout de la dalle la fondent dans l'herbe.
 */
function doorStep(b: FacetBuilder, floor: Vec3, c: { x: number; z: number }): void {
  const g = (x: number, z: number) => groundOf(x, z, 0, 0);
  // Le bord sud de la dalle et le pied de son talus (scenette.ts, `OBSERVATORY_PAVING`).
  const edge = floor.z + 0.32 + 2.35 / 2;
  const foot = edge + 0.55;
  const w = 0.75,
    x = floor.x,
    lift = 0.065;
  const yFoot = g(x, foot) + lift;
  const node = c.z + 7.6;
  b.quad([x - w, floor.y + 0.01, edge], [x - w, yFoot, foot], [x + w, yFoot, foot], [x + w, floor.y + 0.01, edge], COLORS_6E.path);
  b.quad([x - w, yFoot, foot], [x - w, g(x, node) + lift, node], [x + w, g(x, node) + lift, node], [x + w, yFoot, foot], COLORS_6E.path);
  for (const [dx, dz, sw, d, yaw] of SLABS) {
    const px = floor.x + dx,
      pz = floor.z + dz;
    b.box({ x: px, y: g(px, pz) - 0.06, z: pz, yaw }, [sw, 0.14, d], C.slabSide, C.slab);
  }
}

/** Les dalles éparses, depuis le point de la scène : x, z, largeur, profondeur, cap. */
const SLABS: readonly (readonly [number, number, number, number, number])[] = [
  [5.45, 0.6, 0.8, 0.6, 0.2],
  [6.2, -0.2, 0.6, 0.5, -0.3],
  [5.9, 1.45, 0.55, 0.45, 0.5],
  [-5.45, 0.5, 0.75, 0.6, -0.2],
  [-6.15, 1.3, 0.55, 0.5, 0.4],
];

/**
 * Un sentier de sable, comme les chemins du réseau (paths.ts) : le sable au milieu, le liseré brun de chaque côté, un
 * morceau tous les 1,6 au plus, posé sur le sol de sa ligne ; `line`, depuis le centre du lieu.
 */
function trail(b: FacetBuilder, X: Axis, Z: Axis, line: readonly (readonly [number, number])[]): void {
  const field = buildHeightField();
  const w = TRAIL.half,
    edge = 0.14,
    lift = 0.07;
  for (let k = 0; k + 1 < line.length; k++) {
    const [ax, az] = line[k],
      [bx, bz] = line[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 1.6));
    const dx = (bx - ax) / len,
      dz = (bz - az) / len;
    for (let i = 0; i < n; i++) {
      const p = { x: X(ax + (bx - ax) * (i / n)), z: Z(az + (bz - az) * (i / n)) };
      const q = { x: X(ax + (bx - ax) * ((i + 1) / n)), z: Z(az + (bz - az) * ((i + 1) / n)) };
      const yp = standingHeight(meshGround(field, p.x, p.z)) + lift,
        yq = standingHeight(meshGround(field, q.x, q.z)) + lift;
      // À gauche du sens de marche : (dz, −dx), à `o` de la ligne.
      const at = (v: { x: number; z: number }, y: number, o: number): P3 => [v.x + dz * o, y, v.z - dx * o];
      const i0 = w - edge;
      b.quad(at(p, yp, i0), at(p, yp, -i0), at(q, yq, -i0), at(q, yq, i0), COLORS_6E.path);
      b.quad(at(p, yp - 0.01, w), at(p, yp - 0.01, i0), at(q, yq - 0.01, i0), at(q, yq - 0.01, w), COLORS_6E.pathEdge);
      b.quad(at(p, yp - 0.01, -i0), at(p, yp - 0.01, -w), at(q, yq - 0.01, -w), at(q, yq - 0.01, -i0), COLORS_6E.pathEdge);
    }
  }
}

/**
 * Le ruisseau : l'eau claire un rien sous le sol de sa ligne, entre deux berges de terre herbue qui descendent vers elle,
 * un morceau tous les 2,2 au plus ; à sa source, deux rochers (posés avec les autres).
 */
function brook(b: FacetBuilder, X: Axis, Z: Axis): void {
  const field = buildHeightField();
  const line = BROOK.line;
  const w = BROOK.half,
    bw = BROOK.bank;
  for (let k = 0; k + 1 < line.length; k++) {
    const [ax, az] = line[k],
      [bx, bz] = line[k + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.ceil(len / 2.2));
    const dx = (bx - ax) / len,
      dz = (bz - az) / len;
    for (let i = 0; i < n; i++) {
      const p = { x: X(ax + (bx - ax) * (i / n)), z: Z(az + (bz - az) * (i / n)) };
      const q = { x: X(ax + (bx - ax) * ((i + 1) / n)), z: Z(az + (bz - az) * ((i + 1) / n)) };
      // Un rien au-dessus du sol dessiné ; le bas du ruisseau ne passe jamais sous la mer : il la rejoint à fleur d'eau.
      const yp = Math.max(0.02, meshGround(field, p.x, p.z) + 0.03),
        yq = Math.max(0.02, meshGround(field, q.x, q.z) + 0.03);
      const at = (v: { x: number; z: number }, y: number, o: number): P3 => [v.x + dz * o, y, v.z - dx * o];
      b.quad(at(p, yp, w), at(p, yp, -w), at(q, yq, -w), at(q, yq, w), C.brook);
      b.quad(at(p, yp + 0.12, w + bw), at(p, yp, w), at(q, yq, w), at(q, yq + 0.12, w + bw), C.bank);
      b.quad(at(p, yp, -w), at(p, yp + 0.12, -w - bw), at(q, yq + 0.12, -w - bw), at(q, yq, -w), C.bank);
    }
  }
}

/**
 * Le petit pont du ruisseau, sur le sentier de l'est : son tablier de planches en dos d'âne (deux pans), posé sur deux
 * culées de pierre ; un garde-corps de chaque côté, d'une lanterne à l'autre ; aux quatre coins, une lanterne des ponts
 * des terres (bridges.ts) en plus petit : un mât de fer, son socle, le verre Sable et son chapeau en pointe.
 */
function footbridge(b: FacetBuilder, X: Axis, Z: Axis): void {
  const F = FOOTBRIDGE;
  const x = X(F.x),
    z0 = Z(F.z - F.length / 2),
    z1 = Z(F.z + F.length / 2);
  const y0 = Math.max(groundOf(x, z0, 0, 0), groundOf(x, z1, 0, 0)) + 0.12;
  const crown = y0 + 0.3;
  const zm = (z0 + z1) / 2;
  // Les culées, puis les deux pans du tablier, leurs flancs ; le dessus en planches claires.
  for (const z of [z0, z1]) b.box({ x, y: groundOf(x, z, 0, 0) - 0.2, z }, [F.width + 0.3, y0 - groundOf(x, z, 0, 0) + 0.2, 0.6], STONE.side, STONE.top);
  for (const [za, zb] of [
    [z0, zm],
    [zm, z1],
  ]) {
    const ya = za === zm ? crown : y0,
      yb = zb === zm ? crown : y0;
    // Le dessus vers le ciel, les flancs vers le dehors (le sens des sommets fait la face vue).
    const hw = F.width / 2;
    b.quad([x - hw, ya, za], [x - hw, yb, zb], [x + hw, yb, zb], [x + hw, ya, za], C.plank);
    b.quad([x + hw, ya, za], [x + hw, yb, zb], [x + hw, yb - 0.14, zb], [x + hw, ya - 0.14, za], C.plankSide);
    b.quad([x - hw, ya - 0.14, za], [x - hw, yb - 0.14, zb], [x - hw, yb, zb], [x - hw, ya, za], C.plankSide);
  }
  for (const side of [-1, 1]) {
    const px = x + side * (F.width / 2 + 0.05);
    b.beam({ x: px, y: y0 + 0.7, z: z0 }, { x: px, y: crown + 0.7, z: zm }, 0.07, C.rail);
    b.beam({ x: px, y: crown + 0.7, z: zm }, { x: px, y: y0 + 0.7, z: z1 }, 0.07, C.rail);
    for (const z of [z0, z1]) {
      const h = F.lantern;
      b.box({ x: px, y: y0 - 0.1, z }, [0.1, h + 0.1, 0.1], C.iron);
      b.box({ x: px, y: y0 + h, z }, [0.26, 0.05, 0.26], C.iron);
      b.box({ x: px, y: y0 + h + 0.05, z }, [0.2, 0.24, 0.2], C.glass);
      b.prism({ x: px, y: y0 + h + 0.29, z, yaw: Math.PI / 4 }, 0.2, 0, 0.2, 4, C.iron);
    }
  }
}

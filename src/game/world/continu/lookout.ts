// La Vigie (GD-20, point 8, lot L7, directeur artistique) : une tour de guet ronde sur le plateau de la falaise, son fût
// de pierre claire, sa chambre de guet en encorbellement, son toit conique d'ardoise et son mât court ; sa porte au sud.
// Avant : la ruine du temps (le fût écroulé à mi-hauteur, ses fenêtres vides, ses pierres au pied, le mât brisé couché
// dans l'herbe), délavée, jamais sombre. Le corps : le fût relevé en trois rangs, ses fenêtres, sa porte haute. Le haut :
// la chambre de guet, puis le toit et le mât (l'étape qui porte les traces). Les abords : le dallage de la porte, en deux
// rangées, qui enlèvent les pierres tombées puis le mât brisé. Le muret côté vide de la rampe est dessiné avec les chemins (la rampe elle-même est dans le terrain,
// terrain.ts). La scénette : le guetteur, sa longue-vue repliée en main ; les vitraux des phrases sur leur banc ; le volet de la fenêtre basse, l'objet témoin des
// missions en C. Rien à lire dans la 3D : les vitraux sont en aplats, sans motif. Code pur.
import type { Vec2, Vec3 } from './geometry';
import { FacetBuilder, type Facets, type Placement } from './facets';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { LOOKOUT_RAMP, placeById } from './plan6e';
import { buildHeightField, heightAt, heightOnMesh, standingHeight } from './terrain';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (comme places.ts). */
const SINK = -0.8;

const C = {
  // La pierre de la Vigie (directeur artistique, décisions L7) : distincte du calcaire des Archives (#D8CBB0) et de la
  // roche de la falaise ; son ombre pour l'encadrement de la porte, les consoles et les appuis.
  stone: 0xc2ae88,
  stoneShade: 0xa8936e,
  slate: 0x4d6a82,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  // Le creux d'une fenêtre ou d'une porte vide : une ombre brune, jamais noire (comme les niches des Archives).
  recess: 0x5e4e3c,
  shutter: 0x438b82,
  // Les vitraux : trois aplats opaques, sans motif.
  lagoon: 0x178078,
  sand: 0xdaa66a,
  mist: 0xe5ebe3,
  paving: 0xcdbf9f,
  pavingSide: 0x9f927a,
  wall: 0xa8987a,
  wallTop: 0xbfae8c,
  // La boule horaire : une terre cuite franche, qui se lit sur le ciel.
  ball: 0xb5653f,
  // La ruine : délavée, d'un ton moyen, jamais sombre.
  worn: 0xb0a690,
  wornTop: 0xa39a85,
  wornWood: 0x9f9279,
  wornSlate: 0x8f9ca6,
  // Le guetteur (directeur artistique) : caban Nuit océan, écharpe ocre (Sable, elle se perdait sur le caban), pantalon brun, longue-vue de cuivre.
  coat: 0x142b38,
  scarf: 0xc8923a,
  trousers: 0x5a4632,
  hair: 0x6b4a32,
  head: 0xe3c08a,
  copper: 0xc07a3e,
} as const;

/**
 * La tour, dans le repère du lieu : son rayon au pied (`r0`) et en haut du fût (`r1`, à `top`), douze pans tournés pour
 * qu'un pan plat regarde le sud (la porte et la fenêtre basse s'y posent) ; les trois rangs du fût ; la chambre de guet
 * (son encorbellement de `top` à `room`, ses murs jusqu'à `eave`, son rayon) ; le toit et le mât.
 */
export const LOOKOUT_TOWER = {
  r0: 2.1,
  r1: 1.95,
  top: 7,
  sides: 12,
  rings: [0, 2.6, 4.8, 7],
  stump: 2.8,
  room: 7.5,
  eave: 9,
  roomR: 2.5,
  roofR: 2.9,
  apex: 11.7,
  mast: 13.4,
} as const;

/** La porte au sud, la fenêtre basse au-dessus d'elle (celle du volet) et l'encadrement de pierre qui les porte. */
const LOOKOUT_DOOR = { width: 0.9, height: 1.5, frame: 1.8, frameHeight: 2.95, frameDepth: 0.16 } as const;
const LOOKOUT_WINDOW = { bottom: 1.95, width: 0.5, height: 0.7 } as const;

/** Le volet coulissant de la fenêtre basse : sa taille, son écart au mur, et sa course vers l'est quand il s'ouvre. */
const LOOKOUT_SHUTTER = { width: 0.62, height: 0.8, depth: 0.06, gap: 0.035, slide: 0.56 } as const;

/** La porte haute et son balcon (Étages du sens), sur le pan ouest-sud-ouest, à mi-hauteur. */
const LOOKOUT_BALCONY = { angle: 150, floor: 3.6, depth: 0.8, width: 1.5 } as const;

/** La boule horaire (Les temps du récit), hissée au mât : son milieu, son rayon. */
const TIME_BALL = { y: 12.6, r: 0.32 } as const;

/** Le rayon du fût à la hauteur `y`. */
const towerRadius = (y: number) => LOOKOUT_TOWER.r0 + ((LOOKOUT_TOWER.r1 - LOOKOUT_TOWER.r0) * y) / LOOKOUT_TOWER.top;

/** La distance du centre au milieu d'un pan plat, pour un rayon (aux sommets) `r`. */
const apothem = (r: number) => r * Math.cos(Math.PI / LOOKOUT_TOWER.sides);

/** Le quart de tour qui met un pan plat face au sud. */
const TOWER_YAW = Math.PI / LOOKOUT_TOWER.sides;

/**
 * Un volume posé contre le pan de la tour qui regarde l'angle `deg` (0 : l'est, 90 : le sud, 180 : l'ouest), à `d` du
 * centre, en `y` ; décalé de `along` le long du pan (vers l'est, au sud). Son z local sort du mur.
 */
function onFace(deg: number, d: number, y: number, along = 0): Placement {
  const a = (deg * Math.PI) / 180;
  return { x: d * Math.cos(a) + along * Math.sin(a), y, z: d * Math.sin(a) - along * Math.cos(a), yaw: Math.PI / 2 - a };
}

/** Une fenêtre en plein cintre, en aplat (le plan x, y du repère, sa face vers +z), de son appui `y0` : rectangle et arc. */
function archOutline(w: number, y0: number, h: number): { rect: [number, number][]; arch: [number, number][] } {
  const r = w / 2;
  const spring = y0 + h - r;
  return {
    rect: [
      [-r, y0],
      [r, y0],
      [r, spring],
      [-r, spring],
    ],
    arch: Array.from({ length: 7 }, (_, k) => [r * Math.cos((Math.PI * k) / 6), spring + r * Math.sin((Math.PI * k) / 6)] as [number, number]),
  };
}

/** Une ouverture en plein cintre, vide, en aplat contre un pan (son creux brun, jamais noir). */
function opening(b: FacetBuilder, at: Placement, w: number, h: number, color: number = C.recess): void {
  const { rect, arch } = archOutline(w, 0, h);
  b.plate(at, rect, color);
  b.plate(at, arch, color);
}

/**
 * Les trois aplats d'un vitrail, en plein cintre, de largeur `w` et de hauteur `h` depuis `at` : le bas Bleu lagon, le
 * milieu Sable, l'arc Brume, séparés par un filet du fond (le plomb). Sans motif : ni point, ni signe, ni flèche.
 */
function glassPanes(b: FacetBuilder, at: Placement, w: number, h: number): void {
  const lead = 0.07 * w;
  const r = w / 2 - lead;
  const spring = h - w / 2;
  const mid = lead + (spring - 2 * lead) * 0.5;
  b.plate(at, [[-r, lead], [r, lead], [r, mid - lead / 2], [-r, mid - lead / 2]], C.lagoon);
  b.plate(at, [[-r, mid + lead / 2], [r, mid + lead / 2], [r, spring - lead], [-r, spring - lead]], C.sand);
  b.plate(at, Array.from({ length: 7 }, (_, k) => [r * Math.cos((Math.PI * k) / 6), spring + r * Math.sin((Math.PI * k) / 6)] as [number, number]), C.mist);
}

/** Les fenêtres de la chambre de guet, face au sud-est, au sud et au sud-ouest : leur appui, leur taille. */
const ROOM_WINDOWS = { angles: [60, 90, 120], y: 7.85, width: 0.62, height: 0.95 } as const;

/** Les fenêtres du fût (des jours étroits), aux deux rangs du haut, sur les pans qui se voient du sud. */
const SHAFT_WINDOWS: readonly (readonly [number, number])[] = [
  [60, 3.3],
  [120, 5.6],
  [30, 5.7],
];

/** Un pan de muret entre deux points du sol (son pied enfoncé, son dessus à `h` au-dessus du sol), d'épaisseur `w`. */
function wallRun(b: FacetBuilder, p: Vec3, q: Vec3, lowP: number, lowQ: number, h: number, w: number): void {
  const dx = q.x - p.x,
    dz = q.z - p.z;
  const l = Math.hypot(dx, dz) || 1;
  const nx = (-dz / l) * (w / 2),
    nz = (dx / l) * (w / 2);
  const P = (o: Vec3, s: number, y: number) => [o.x + s * nx, y, o.z + s * nz] as const;
  const [pl, pr, ql, qr] = [P(p, 1, lowP), P(p, -1, lowP), P(q, 1, lowQ), P(q, -1, lowQ)];
  const [pL, pR, qL, qR] = [P(p, 1, p.y + h), P(p, -1, p.y + h), P(q, 1, q.y + h), P(q, -1, q.y + h)];
  b.quad(pL, qL, qR, pR, C.wallTop);
  b.quad(pl, ql, qL, pL, C.wall);
  b.quad(qr, pr, pR, qR, C.wall);
  b.quad(ql, qr, qR, qL, C.wall);
  b.quad(pr, pl, pL, pR, C.wall);
}

/** Le muret de la rampe : de cette part de sa longueur à celle-ci (le haut, au flanc de la falaise), à cet écart de sa ligne, côté vide. */
const RAMP_WALL = { from: 0.6, to: 0.97, lateral: 1.45, run: 2.3, gap: 0.3, height: 0.55, width: 0.38 } as const;

/** La tour de la Vigie, ses étapes et ses abords (le modèle du lieu). */
function model(add: AddPiece, ground: SiteGround, door: Vec2): void {
  const T = LOOKOUT_TOWER;
  const D = LOOKOUT_DOOR;
  const W = LOOKOUT_WINDOW;
  const tower = (y: number): Placement => ({ x: 0, y, z: 0, yaw: TOWER_YAW });
  // La ruine : le moignon du fût, écroulé à mi-hauteur, son haut ébréché (des blocs à des hauteurs inégales, à
  // l'intérieur du fût qui le relèvera), sa porte et ses fenêtres vides.
  add('ruine', 0, (b) => {
    b.prism(tower(SINK), towerRadius(0) - 0.05, towerRadius(T.stump) - 0.05, T.stump - SINK, T.sides, C.worn, C.wornTop);
    for (const [x, z, w, h, yaw] of [
      [-0.9, -0.6, 1.0, 0.75, 0.3],
      [-0.2, -1.1, 0.8, 0.45, -0.4],
      [0.9, -0.5, 0.7, 0.3, 0.7],
    ] as const)
      b.box({ x, y: T.stump - 0.1, z, yaw }, [w, h, 0.7], C.worn, C.wornTop);
    const a = apothem(towerRadius(1) - 0.05) + 0.01;
    opening(b, onFace(90, a, 0), D.width, D.height + 0.2);
    opening(b, onFace(90, a, W.bottom), W.width, W.height);
    opening(b, onFace(130, apothem(towerRadius(2) - 0.05) + 0.01, 1.6), 0.3, 0.7);
  });
  // Les pierres tombées du fût, au pied, à l'ouest et au nord (hors de la scène, du dallage et du chemin, à l'est) : la
  // première rangée des abords les enlève, pour que l'étape du dallage se voie (directeur artistique, relecture de L7).
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, w, h, d, yaw] of [
        [-3.3, 0.6, 0.8, 0.5, 0.6, 0.5],
        [-3.0, -1.5, 0.6, 0.4, 0.7, -0.3],
        [-1.3, -3.1, 0.9, 0.45, 0.55, 0.9],
        [1.6, -3.0, 0.5, 0.35, 0.45, 0.2],
        [-2.2, 2.6, 0.5, 0.3, 0.4, 1.1],
      ] as const) {
        const g = ground.foot(x, z, 0.4);
        b.box({ x, y: g.low - 0.15, z, yaw }, [w, g.top - g.low + h + 0.15, d], C.worn, C.wornTop);
      }
    },
    { stage: 2, row: 0 },
  );
  // Le mât brisé, couché dans l'herbe au nord-ouest, et deux ardoises tombées : la seconde rangée des abords les enlève.
  add(
    'ruine',
    0,
    (b) => {
      const p = { x: -2.6, z: -3.3 },
        q = { x: 0.4, z: -4.5 };
      b.beam({ x: p.x, y: ground.at(p.x, p.z) + 0.08, z: p.z }, { x: q.x, y: ground.at(q.x, q.z) + 0.08, z: q.z }, 0.16, C.wornWood);
      for (const [x, z, yaw] of [
        [-3.6, -2.4, 0.4],
        [0.9, -3.6, -0.6],
      ] as const)
        b.box({ x, y: ground.at(x, z) - 0.02, z, yaw }, [0.5, 0.06, 0.35], C.wornSlate);
    },
    { stage: 2, row: 0.5 },
  );
  // Le corps : le fût, en trois rangs, un peu plus large que le moignon qu'il habille. Au premier, la porte au sud dans
  // son encadrement de pierre, et la fenêtre basse au-dessus (celle du volet, l'objet témoin).
  for (let k = 0; k < 3; k++) {
    const y0 = T.rings[k],
      y1 = T.rings[k + 1];
    add(0, [0, 0.34, 0.67][k], (b) => {
      b.prism(tower(k === 0 ? SINK : y0), towerRadius(k === 0 ? SINK : y0), towerRadius(y1), y1 - (k === 0 ? SINK : y0), T.sides, C.stone);
      // Un cordon de pierre à la base des deux rangs du haut : le fût se lit en assises.
      if (k > 0) b.band(tower(y0 - 0.06), towerRadius(y0) + 0.05, 0.14, T.sides, C.stoneShade);
      if (k === 0) {
        const a = apothem(towerRadius(1));
        b.box(onFace(90, a, SINK), [D.frame, D.frameHeight - SINK, D.frameDepth], C.stoneShade, C.stone);
        const front = a + D.frameDepth / 2;
        b.box(onFace(90, front, 0), [D.width, D.height, 0.06], C.wood);
        b.box(onFace(90, front, D.height), [D.width + 0.2, 0.12, 0.1], C.stoneShade);
        opening(b, onFace(90, front + 0.01, W.bottom), W.width, W.height);
        b.box(onFace(90, front, W.bottom - 0.1), [W.width + 0.2, 0.1, 0.12], C.stoneShade);
        // Un seuil de pierre devant la porte.
        b.box(onFace(90, front + 0.25, SINK), [D.width + 0.4, 0.06 - SINK, 0.5], C.stoneShade, C.paving);
      }
      for (const [deg, y] of SHAFT_WINDOWS)
        if (y >= y0 && y < y1) {
          const d = apothem(towerRadius(y + 0.4)) + 0.01;
          opening(b, onFace(deg, d, y), 0.32, 0.8);
          b.box(onFace(deg, d, y - 0.08), [0.48, 0.08, 0.12], C.stoneShade);
        }
      if (k === 1) {
        // La porte haute, à mi-hauteur, sur le pan ouest-sud-ouest, et les deux consoles de pierre de son balcon (le bois
        // du balcon est une trace, Étages du sens ; les consoles restent, nues, sans elle).
        const B = LOOKOUT_BALCONY;
        const d = apothem(towerRadius(B.floor + 0.6));
        opening(b, onFace(B.angle, d + 0.01, B.floor), 0.7, 1.35);
        b.box(onFace(B.angle, d + 0.01, B.floor), [0.7, 1.15, 0.04], C.wood);
        for (const s of [-1, 1]) b.box(onFace(B.angle, d + B.depth / 2, B.floor - 0.32, s * 0.45), [0.2, 0.32, B.depth], C.stoneShade, C.stone);
      }
    });
  }
  // Le haut : l'encorbellement (le fût qui s'évase sous la chambre de guet) et ses consoles, la chambre de guet et ses
  // trois fenêtres vides (les vitraux s'y reposent, une trace), l'avant-toit d'ardoise.
  add(1, 0, (b) => {
    b.prism(tower(T.top), towerRadius(T.top), T.roomR, T.room - T.top, T.sides, C.stoneShade, C.stone);
    for (let k = 0; k < 7; k++) {
      const deg = 0 + 30 * k;
      b.box(onFace(deg, apothem(T.r1) + 0.12, T.top - 0.45), [0.26, 0.5, 0.28], C.stoneShade);
    }
    b.prism(tower(T.room), T.roomR, T.roomR, T.eave - T.room, T.sides, C.stone);
    const d = apothem(T.roomR) + 0.01;
    for (const deg of ROOM_WINDOWS.angles) {
      opening(b, onFace(deg, d, ROOM_WINDOWS.y), ROOM_WINDOWS.width, ROOM_WINDOWS.height);
      b.box(onFace(deg, d, ROOM_WINDOWS.y - 0.1), [ROOM_WINDOWS.width + 0.2, 0.1, 0.14], C.stoneShade);
    }
    b.drum(tower(T.eave), T.roofR, 0.12, T.sides, C.slate);
  });
  // Le toit conique d'ardoise, et le mât court qui le coiffe, sa pomme de bois.
  add(1, 0.5, (b) => {
    b.prism(tower(T.eave + 0.12), T.roofR - 0.05, 0, T.apex - T.eave - 0.12, T.sides, C.slate);
    b.beam({ x: 0, y: T.apex - 0.3, z: 0 }, { x: 0, y: T.mast, z: 0 }, 0.12, C.darkWood);
    b.prism({ x: 0, y: T.mast, z: 0 }, 0.12, 0.05, 0.14, 6, C.darkWood);
  });
  // Les abords : le dallage, de la porte du lieu (où arrive le chemin, plan6e.ts) au seuil de la tour, en dalles inégales.
  // Deux rangées : les dalles du seuil, puis celles qui vont jusqu'au chemin.
  const paving = (from: number, until: number) => (b: FacetBuilder) => {
    const start = apothem(towerRadius(0)) + D.frameDepth + 0.5;
    const n = 5;
    const step = (door.z - start) / n;
    for (let k = from; k < until; k++) {
      const z = start + (k + 0.5) * step;
      const x = door.x * ((z - start) / (door.z - start)) + (k % 2 ? 0.08 : -0.06);
      const g = ground.foot(x, z, 0.6);
      b.box({ x, y: g.low - 0.2, z, yaw: k % 2 ? 0.05 : -0.04 }, [1.35 - 0.1 * (k % 2), g.top - g.low + 0.24, step - 0.12], C.pavingSide, C.paving);
    }
  };
  add(2, 0, paving(0, 2));
  add(2, 0.5, paving(2, 5));
}

/**
 * Le muret côté vide de la rampe, en haut, là où elle longe le flanc de la falaise : des pans de pierre sèche, bas, qui
 * suivent sa pente (posés sur le sol dessiné, celui des tuiles, et sur celui du plan : jamais en l'air). Dans le monde,
 * avec les chemins (paths.ts), pas dans le lieu : loin de la tour, il élargirait le cadre de sa pose (construction.ts).
 */
export function lookoutRampWall(b: FacetBuilder): void {
  const field = buildHeightField();
  const { from, to } = LOOKOUT_RAMP;
  const [dx, dz] = [to.x - from.x, to.z - from.z];
  const L = Math.hypot(dx, dz);
  // Le côté vide : à gauche de la montée (vers le nord-est), loin du plateau.
  const [nx, nz] = [-dz / L, dx / L];
  const R = RAMP_WALL;
  const point = (t: number): Vec3 => {
    const x = from.x + dx * t + nx * R.lateral,
      z = from.z + dz * t + nz * R.lateral;
    return { x, y: Math.max(standingHeight(heightAt({ x, z })), heightOnMesh(field, x, z)), z };
  };
  const low = (p: Vec3) => standingHeight(Math.min(heightAt(p), heightOnMesh(field, p.x, p.z))) - 0.5;
  for (let s = R.from * L; s + R.run <= R.to * L; s += R.run + R.gap) {
    const p = point(s / L),
      q = point((s + R.run) / L);
    wallRun(b, p, q, low(p), low(q), R.height, R.width);
  }
}

/** Le dallage de la scène : sa demi-largeur et sa profondeur. */
const SCENE_FLOOR = { half: 5, depth: 2.8 } as const;

/**
 * Le sol de la scène et le guetteur, immobile : son pantalon brun sous le caban Nuit océan (le bas du corps sombre),
 * l'écharpe ocre au cou et son pan sur la poitrine, la tête et les cheveux ; le bras droit baissé, sa longue-vue de
 * cuivre repliée à la main. Il ne dit rien.
 */
function decor(b: FacetBuilder, floor: Vec3, at: Vec3, sphere: Sphere): void {
  const F = SCENE_FLOOR;
  let low = floor.y;
  for (let x = -F.half; x <= F.half + 1e-6; x += F.half / 2)
    for (let z = -F.depth / 2; z <= F.depth / 2 + 1e-6; z += F.depth / 2) low = Math.min(low, standingHeight(heightAt({ x: floor.x + x, z: floor.z + z })));
  const depth = floor.y - low + 0.3;
  b.box({ x: floor.x, y: floor.y - depth, z: floor.z }, [2 * F.half, depth, F.depth], C.pavingSide, C.paving);
  for (const dx of [-F.half / 2, F.half / 2]) b.box({ x: floor.x + dx, y: floor.y, z: floor.z }, [0.05, 0.01, F.depth], C.pavingSide);
  b.prism(at, 0.27, 0.26, 0.46, 10, C.trousers);
  b.prism({ x: at.x, y: at.y + 0.38, z: at.z }, 0.4, 0.28, 0.56, 10, C.coat);
  b.prism({ x: at.x, y: at.y + 0.8, z: at.z }, 0.33, 0.27, 0.17, 10, C.scarf);
  b.box({ x: at.x + 0.12, y: at.y + 0.34, z: at.z + 0.35, pitch: 0.12 }, [0.15, 0.5, 0.05], C.scarf);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  sphere(b, { x: at.x, y: at.y + 1.17, z: at.z - 0.04 }, 0.245, 8, 4, C.hair);
  // Le bras droit (vers l'ouest, vers la tour et Kéo), baissé ; la longue-vue repliée, deux tubes de cuivre, debout dans
  // la main.
  const hand = { x: at.x - 0.4, y: at.y + 0.5, z: at.z + 0.18 };
  b.beam({ x: at.x - 0.24, y: at.y + 0.82, z: at.z + 0.04 }, hand, 0.14, C.coat);
  b.drum({ x: hand.x, y: hand.y - 0.26, z: hand.z }, 0.075, 0.3, 8, C.copper);
  b.drum({ x: hand.x, y: hand.y + 0.04, z: hand.z }, 0.055, 0.12, 6, C.copper);
}

/** Le pied de la tour, dans le monde (le sol de son centre). */
function towerFoot(): Vec3 {
  const c = placeById('lookout').center;
  return { x: c.x, y: standingHeight(heightAt(c)), z: c.z };
}

/** Le volet de la fenêtre basse, à l'échelle 1, son bas au milieu en 0, sa face vers le sud. */
function shutterFacets(): Facets {
  const S = LOOKOUT_SHUTTER;
  const b = new FacetBuilder();
  b.box({ x: 0, y: 0, z: 0 }, [S.width, S.height, S.depth], C.shutter);
  // Deux traverses du même vert, en relief : le volet se lit comme un volet de bois, pas comme une plaque.
  for (const y of [0.12, S.height - 0.2]) b.box({ x: 0, y, z: S.depth / 2 }, [S.width - 0.06, 0.08, 0.03], C.shutter);
  return b.build();
}

/** Où se tient le volet fermé, devant la fenêtre basse, dans le monde. */
function shutterClosed(): Vec3 {
  const f = towerFoot();
  const S = LOOKOUT_SHUTTER;
  return { x: f.x, y: f.y + LOOKOUT_WINDOW.bottom, z: f.z + apothem(towerRadius(1)) + LOOKOUT_DOOR.frameDepth / 2 + S.gap };
}

/** Le volet fermé, posé dans la scène (le C au repos, et le R). */
function closedShutter(b: FacetBuilder): void {
  const p = shutterClosed();
  const f = shutterFacets();
  const at = new Float32Array(f.positions.length);
  for (let k = 0; k < at.length; k += 3) {
    at[k] = f.positions[k] + p.x;
    at[k + 1] = f.positions[k + 1] + p.y;
    at[k + 2] = f.positions[k + 2] + p.z;
  }
  b.append({ ...f, positions: at });
}

/** Une boule en facettes (la boule horaire), en `c`, de rayon `r`. */
function ball(b: FacetBuilder, c: Vec3, r: number, sides: number, rings: number, color: number): void {
  const at = (i: number, k: number) => {
    const phi = (Math.PI * i) / rings;
    const theta = (2 * Math.PI * k) / sides;
    return [c.x + r * Math.sin(phi) * Math.cos(theta), c.y + r * Math.cos(phi), c.z + r * Math.sin(phi) * Math.sin(theta)] as const;
  };
  for (let i = 0; i < rings; i++)
    for (let k = 0; k < sides; k++) {
      const [a, bb, cc, d] = [at(i, k), at(i, k + 1), at(i + 1, k + 1), at(i + 1, k)];
      if (i === 0) b.triangle(a, cc, d, color);
      else if (i === rings - 1) b.triangle(a, bb, d, color);
      else b.quad(a, bb, cc, d, color);
    }
}

/** Le vitrail d'une réponse, à l'échelle 1 : son pied, son châssis d'ardoise en plein cintre, ses trois aplats. */
const PANEL = { width: 0.64, foot: 0.1, height: 1.0, depth: 0.08, tipped: -0.32 } as const;

/**
 * Un vitrail de réponse, debout sur le banc, à l'échelle `s` : tous les mêmes, rien ne dit la réponse (l'étiquette est
 * dans la page). `tilt` : penché en arrière (vers le nord), autour de son pied : sa forme dit qu'il est choisi.
 */
function answerPanel(b: FacetBuilder, at: Vec3, s: number, tilt: number): void {
  const P = PANEL;
  const cy = Math.cos(tilt),
    sy = Math.sin(tilt);
  const place = (y: number, z = 0): Placement => ({ x: at.x, y: at.y + (y * cy - z * sy) * s, z: at.z + (y * sy + z * cy) * s, pitch: tilt });
  const scaled = (o: [number, number][]) => o.map(([x, y]) => [x * s, y * s] as [number, number]);
  // Deux pieds courts, en travers, qui le tiennent debout sur le banc.
  for (const side of [-1, 1]) b.box({ ...place(0), x: at.x + side * (P.width / 2 - 0.06) * s }, [0.1 * s, P.foot * s, 0.34 * s], C.darkWood);
  // Le châssis de bois sombre : le bas droit, puis l'arc en plein cintre (épaissi) ; les aplats sur sa face.
  const { arch } = archOutline(P.width, 0, P.height - P.foot);
  b.box(place(P.foot, 0), [P.width * s, (P.height - P.foot - P.width / 2) * s, P.depth * s], C.darkWood);
  b.extrude(place(P.foot, -P.depth / 2), scaled(arch), P.depth * s, C.darkWood);
  glassPanes(b, place(P.foot, P.depth / 2 + 0.005), P.width * s, (P.height - P.foot) * s);
}

/** Les traces de la Vigie : leur place depuis le centre du lieu, la hauteur que la caméra garde au retour. */
const LOOKOUT_TRACE_SPOTS = {
  'sentence-order': { at: { x: 0, z: 2.6 }, lift: 8.2 },
  comprehension: { at: { x: -2.3, z: 1.3 }, lift: 3.9 },
  'tense-values': { at: { x: 0, z: 0 }, lift: TIME_BALL.y },
  fluency: { at: { x: -2.9, z: 1.7 }, lift: 2 },
} as const;

/** Un volume de trace contre un pan de la tour, posé dans le monde depuis le centre du lieu à son sol (`c`). */
const inWorld = (c: Vec3, p: Placement): Placement => ({ ...p, x: c.x + p.x, y: c.y + p.y, z: c.z + p.z });

export const LOOKOUT: PlaceArt = {
  role: 'Le guetteur',
  model,
  traceStage: 1,
  sceneSpot: { dx: 0, dz: 4.4, half: [4.6, 1.4], fine: true },
  site: {
    rise: 0.15,
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.2, depth: 0.3 },
    pitch: (18 * Math.PI) / 180,
  },
  decor,
  answer: {
    size: { height: PANEL.height, half: 0.4 },
    // Le banc de bois sous la rangée des vitraux : une planche sur deux tréteaux, posés sur le sol.
    base(b, mid, y, z, span, s, ground) {
      const t = 0.1 * s;
      b.box({ x: mid, y: y - t, z }, [span, t, 0.5 * s], C.darkWood, C.wood);
      const legs = Math.max(0.05, y - t - ground + 0.1);
      for (const side of [-1, 1]) b.box({ x: mid + side * (span / 2 - 0.15 * s), y: y - t - legs, z }, [0.1 * s, legs, 0.42 * s], C.darkWood);
    },
    object(b, at, s, _i, _count, picked) {
      answerPanel(b, at, s, picked ? PANEL.tipped : 0);
    },
  },
  // Les missions en R (les vitraux) : la tour seule, le volet fermé ; rien ne bouge.
  rest(b) {
    closedShutter(b);
  },
  // Les missions en C : le volet de la fenêtre basse, fermé ; après une bonne réponse, il glisse vers l'est et découvre
  // la fenêtre, puis reste ouvert jusqu'à l'item suivant (d'un coup avec « Réduire les animations », la vue le pose).
  column(b, _o, done) {
    if (!done) {
      closedShutter(b);
      return null;
    }
    const from = shutterClosed();
    return { facets: shutterFacets(), from, to: { ...from, x: from.x + LOOKOUT_SHUTTER.slide }, arc: 0, stay: true };
  },
  traces: {
    // Les trois vitraux reposés aux fenêtres de la chambre de guet (Vitraux des phrases), en aplats, sans motif.
    'sentence-order': {
      ...LOOKOUT_TRACE_SPOTS['sentence-order'],
      draw(b, c) {
        const d = apothem(LOOKOUT_TOWER.roomR) + 0.02;
        for (const deg of ROOM_WINDOWS.angles) glassPanes(b, inWorld(c, onFace(deg, d, ROOM_WINDOWS.y)), ROOM_WINDOWS.width, ROOM_WINDOWS.height);
      },
    },
    // Le balcon de bois à mi-hauteur (Étages du sens), sur ses deux consoles, devant la porte haute : son plancher, ses
    // trois poteaux, sa main courante, ouverte au milieu (l'échelle y arrive).
    comprehension: {
      ...LOOKOUT_TRACE_SPOTS.comprehension,
      draw(b, c) {
        const B = LOOKOUT_BALCONY;
        const d = apothem(towerRadius(B.floor + 0.6));
        b.box(inWorld(c, onFace(B.angle, d + B.depth / 2, B.floor)), [B.width, 0.1, B.depth], C.darkWood, C.wood);
        const front = d + B.depth - 0.06;
        for (const along of [-B.width / 2 + 0.05, B.width / 2 - 0.05]) {
          b.box(inWorld(c, onFace(B.angle, front, B.floor + 0.1, along)), [0.08, 0.7, 0.08], C.darkWood);
          b.box(inWorld(c, onFace(B.angle, d + B.depth / 2, B.floor + 0.72, along)), [0.08, 0.08, B.depth], C.wood);
        }
        // La main courante de devant, en deux : entre ses deux bouts, l'échelle passe (Ascension).
        const [s0, s1] = [0.36, B.width / 2 - 0.05];
        for (const side of [-1, 1]) {
          b.box(inWorld(c, onFace(B.angle, front, B.floor + 0.72, (side * (s0 + s1)) / 2)), [s1 - s0 + 0.08, 0.08, 0.08], C.wood);
          b.box(inWorld(c, onFace(B.angle, front, B.floor + 0.1, side * s0)), [0.08, 0.7, 0.08], C.darkWood);
        }
      },
    },
    // La boule horaire hissée au mât (Les temps du récit) : une boule pleine, sans cadran ni chiffre, immobile.
    'tense-values': {
      ...LOOKOUT_TRACE_SPOTS['tense-values'],
      draw(b, c) {
        ball(b, { x: c.x, y: c.y + TIME_BALL.y, z: c.z }, TIME_BALL.r, 10, 6, C.ball);
      },
    },
    // L'échelle refaite jusqu'au balcon (Ascension) : deux montants, sept barreaux, son pied dans l'herbe, son haut
    // appuyé au bout des consoles.
    fluency: {
      ...LOOKOUT_TRACE_SPOTS.fluency,
      draw(b, c) {
        const B = LOOKOUT_BALCONY;
        const d = apothem(towerRadius(B.floor)) + B.depth + 0.07;
        const a = (B.angle * Math.PI) / 180;
        const [ux, uz] = [Math.cos(a), Math.sin(a)];
        const [tx, tz] = [Math.sin(a), -Math.cos(a)];
        const footD = d + 1.0;
        const footY = standingHeight(heightAt({ x: c.x + ux * footD, z: c.z + uz * footD })) - c.y - 0.1;
        const topY = B.floor + 0.75;
        const at = (dist: number, y: number, side: number) => ({ x: c.x + ux * dist + tx * side * 0.24, y: c.y + y, z: c.z + uz * dist + tz * side * 0.24 });
        // La pente : le haut contre les consoles (à `d` du centre, à la hauteur du plancher), un peu au-dessus.
        const slope = (footD - d) / (B.floor - footY);
        const distAt = (y: number) => footD - (y - footY) * slope;
        for (const side of [-1, 1]) b.beam(at(footD, footY, side), at(distAt(topY), topY, side), 0.08, C.wood);
        for (let k = 1; k <= 7; k++) {
          const y = footY + ((topY - 0.15 - footY) * k) / 7;
          b.beam(at(distAt(y), y, -1), at(distAt(y), y, 1), 0.05, C.darkWood);
        }
      },
    },
  },
  exit: { x: -2.4, z: 7.9 },
};

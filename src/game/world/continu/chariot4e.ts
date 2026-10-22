// Le Chariot (lot 3 du monde ouvert du 4e, le Bastion, GD-24 ; intention du directeur artistique du 22 octobre 2026,
// planche `selection-bastion-v1` validée par le mainteneur le même jour, rangée 4) : « le bassin d'essai des Passeurs, au
// bord du bassin à flot : on y faisait glisser des coques en petit, tirées par un chariot, avant de les construire en
// grand ». Le deuxième lieu fini du Bastion, sur le gabarit de l'Étalon et du Gabarit (./etalon4e.ts, ./gabarit4e.ts), au
// ras du sol : un long bassin de pierre grise d'ouest en est, posé sur le sol comme une cuve basse (le sol du 4e ne se
// creuse pas), ses deux rails sur ses bords ; le chariot, un portique bas sur quatre petites roues qui enjambe le bassin,
// sa passerelle et sa main courante ; le treuil de halage au bout est, sous son auvent de tôle ; la cale d'essai au bout
// ouest, vers le bassin à flot ; les maquettes sur leurs tréteaux au sud-ouest, des coques lisses comme de longs bols
// fermés (ni voile, ni mât, ni banc) ; l'appentis de l'ingénieure au sud-est, près de la porte. À la poupe de la grande
// maquette, le signe de l'absence du 4e : la ferrure vide à deux chevilles nues (l'hélice est sur le Rafiot), la même
// avant et après, jamais une étape.
//
// La ruine (intention, « La ruine ») : le bassin vide et sec, le fond fendu, quelques touffes, deux blocs du bord tombés
// dedans ; ses rails de fer rouillé, l'un tordu vers le bout est ; le chariot de fer rouillé sorti de ses rails, penché,
// une roue dans le bassin sec ; le tambour du treuil couché à côté de son bâti tombé, le câble lâche dans l'herbe ; les
// poteaux de l'auvent debout, nus, la tôle tombée à leur pied ; la cale aux rails soulevés ; un tréteau couché et une
// petite coque penchée. Une seule lumière, la lanterne de l'appentis. Quatre parties (2 + 1 + 1) : le corps en deux (le
// bassin recalé et en eau ; le chariot sur ses rails et le treuil redressé), le haut (l'auvent et sa lanterne), les abords
// (la cale, les maquettes, la cour, la lanterne du chemin). Une trace par mission, avec sa partie. Rien à lire, rien de
// croisé, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { FacetBuilder, drawPosed } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { groundPlane4e, inWorld, lantern, localGround4e, once, quadOut, sheet, wallRun } from './place4eKit';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_4E, PATH_NODES_4E, PLACES_4E } from './plan4e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

type P3 = readonly [number, number, number];

/**
 * Les couleurs du Chariot : la pierre grise des Passeurs, le fond du bassin et sa fente ; l'eau du bassin d'essai, plate et
 * sombre, jamais plus claire (`#24506A`) ; la rouille de la ruine seulement ; le fer restauré bruni sombre, la tôle de
 * l'auvent et du porte-voix ; le fer éteint de la ferrure vide ; le bois gris de la ruine, le bois neuf brun ; la coque
 * des maquettes, un bois clair et lisse ; les touffes, un vert olive sec ; le dallage de la cour et ses joints.
 */
const C = {
  stone: COLORS_4E.stone,
  stoneSun: COLORS_4E.stoneSun,
  stoneShade: COLORS_4E.stoneShade,
  floor: 0x8a837c,
  crack: 0x5e5752,
  water: 0x24506a,
  rust: COLORS_4E.rust,
  rustShade: COLORS_4E.rustShade,
  rustDull: 0x6a483e,
  rustDullTop: 0x74524a,
  iron: 0x5c504c,
  ironTop: 0x6c5e58,
  wood: COLORS_4E.wood,
  woodShade: COLORS_4E.woodShade,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  hull: 0xc2ad92,
  hullShade: 0xa8927a,
  leather: 0x6e5040,
  leaf: 0x8a8a4c,
  paving: 0xb0a598,
  joint: 0x8a8078,
  // L'ingénieure, en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise.
  boots: 0x55595a,
  apron: 0x5e6462,
  shirt: 0x9a8e7a,
  head: 0xd9a47c,
} as const;

// ---------- Le repère du lieu ----------

const CENTER: Vec2 = PLACES_4E.find((p) => p.id === 'chariot')!.center;

/** Le sol du 4e sous un point du repère du lieu, depuis le sol de son centre. */
const localGround = localGround4e(CENTER);

const toLocal = (p: Vec2): Vec2 => ({ x: p.x - CENTER.x, z: p.z - CENTER.z });

/** Le pas de la porte, au bout de son chemin (`bas-2`), depuis le centre. */
const DOOR_AT: Vec2 = toLocal(PATH_NODES_4E.find((p) => p.id === 'chariot')!.at);

/**
 * Le bassin d'essai, d'ouest en est (16 sur 4,4, comme au lot 1) : ses bords (x d'ouest en est, z du nord au sud),
 * l'épaisseur de son rebord, le haut du rebord, le dessus du fond, le niveau de l'eau, au-dessus du pied du lieu ; la
 * brèche du rebord sud (deux blocs tombés dans le bassin, que le corps 1 remet).
 */
const BASIN = { x0: -13, x1: 3, z0: -5, z1: -0.6, rim: 0.5, top: 0.75, floor: 0.08, water: 0.55, gap: [-9, -6.6] } as const;

/** Le milieu du bassin en travers, et la place des deux rails (sur le milieu du rebord). */
const MID_Z = (BASIN.z0 + BASIN.z1) / 2;
const RAILS = [BASIN.z0 + BASIN.rim / 2, BASIN.z1 - BASIN.rim / 2] as const;

/**
 * Le chariot, un portique bas qui enjambe le bassin : sa place restaurée (x, le long du bassin), le demi-écart de ses
 * roues le long du bassin, le rayon des roues, la hauteur de sa passerelle au-dessus des rails.
 */
const GANTRY = { x: -4, half: 0.5, wheel: 0.2, deck: 1.75 } as const;

/** Le treuil de halage, au bout est : son milieu, le rayon et la longueur de son tambour, la hauteur de son axe. */
const WINCH = { x: 4.9, z: MID_Z, r: 0.34, length: 0.9, axle: 0.8 } as const;

/** L'auvent du treuil : ses poteaux (x à l'ouest et à l'est, z au nord et au sud), leur haut à l'ouest et à l'est. */
const AWNING = { x0: 3.9, x1: 6.2, z0: -4.4, z1: -1.2, low: 2.55, high: 3.0, over: 0.3 } as const;

/** La cale d'essai, au bout ouest, vers le bassin à flot : ses rails de bois, du bout du bassin à leur pied. */
const SLIP = { x0: BASIN.x0 - 0.1, x1: -17.6, rails: [-3.7, -1.9], top: 0.6, foot: -0.2 } as const;

/** Les maquettes, au sud-ouest : la grande sur ses deux tréteaux (toujours là), les deux petites des abords. */
const MODELS = { big: { x: -7.6, z: 2.8, length: 3.0, beam: 0.9, depth: 0.5, rest: 0.75 }, small: { x: -10.6, z: 3.4, length: 2.0, beam: 0.62, depth: 0.36, rest: 0.6 } } as const;

/**
 * L'appentis de l'ingénieure, au sud-est du bassin, près de la porte : ses bords, le haut de ses poteaux du fond et de son
 * devant, le haut de son mur de planches du fond. Un auvent ouvert et bas, comme sur la planche (correction des captures du
 * 22 octobre 2026 : son mur du fond, haut et plein, cachait le chariot et l'eau depuis la porte) : un mur à mi-hauteur,
 * quatre poteaux, et le lieu se voit au travers.
 */
const SHED = { x0: 1.4, x1: 3.4, z0: 2.6, z1: 4.6, back: 1.9, front: 1.6, wall: 0.9 } as const;

/** L'établi, contre le mur du fond de l'appentis : son milieu, sa longueur (le long du mur), sa hauteur. */
const BENCH = { x: SHED.x1 - 0.45, z: (SHED.z0 + SHED.z1) / 2, length: 1.8, h: 0.85 } as const;

/** La lanterne de l'appentis (la seule allumée de la ruine) ; celle de l'auvent (le haut) ; celle du chemin (les abords). */
const LANTERN_SHED = { x: SHED.x0, z: SHED.z1, y: SHED.front - 0.15 } as const;
const LANTERN_AWNING = { x: AWNING.x0, z: AWNING.z1 } as const;
const PATH_LANTERN = { x: 1.4, z: 6.0, h: 1.35 } as const;

/** La cour dallée des abords, devant l'appentis, au sud du bassin (dans le sens inverse des aiguilles d'une montre vu d'en haut). */
const YARD: readonly Vec2[] = [
  { x: -5.4, z: 4.4 },
  { x: 0.8, z: 4.4 },
  { x: 0.8, z: -0.1 },
  { x: -5.4, z: -0.1 },
];

/**
 * Le plan du sol, ajusté sous le bassin, la cale, les maquettes, l'appentis et la cour (aux moindres carrés), relevé juste
 * assez pour ne jamais passer sous le sol.
 * Calculé au premier usage (./place4eKit.ts).
 */
const planeY = groundPlane4e(localGround, [-18, 7], [-6, 6]);


/** Le pied du lieu : le plan sous son centre. */
const G = once(() => planeY(0, 0));

// ---------- La vue ----------

/**
 * Le cap de la caméra de « Y aller » (intention : de la porte vers le nord-ouest) : le bassin en travers de l'image, le
 * chariot au milieu, le treuil à droite, la cale à gauche, au-delà le bassin à flot et le pont ; les maquettes à gauche
 * devant, l'appentis à droite devant ; le cratère du volcan bien à gauche du centre. La caméra regarde vers
 * −(sin cap, cos cap).
 */
const DOOR_VIEW = Math.PI / 4;

/**
 * La vue d'arrivée (`doorFrame`) : le lieu est bas et à plat, la caméra des Fabriques (−3, à hauteur de Kéo) le voyait
 * en rasant et le bassin ne se lisait plus (captures du 22 octobre 2026). Elle reste plus basse que la caméra qui suit,
 * d'un cran seulement, un peu reculée : le regard plonge assez pour que l'eau et le chariot se lisent.
 */
const DOOR_FRAME = { height: -1, back: 1.3 } as const;

/** Le point du nom sur la Carte, depuis le centre du lieu : au-dessus du treuil, jamais sur le bassin. */
const MAP_POINT: Vec3 = {
  x: WINCH.x + 0.3,
  get y() {
    return G() + AWNING.high + 1.4;
  },
  z: WINCH.z,
};

// ---------- Les petits volumes ----------

/**
 * Une coque de maquette, lisse comme un long bol fermé (ni banc, ni étrave dressée, ni hublot) : son pont en ovale
 * pointu, sa quille en trois points ; posée en `at` (le milieu de son pont), le long de `yaw`, penchée de `pitch`.
 */
function hull(b: FacetBuilder, at: Vec3, length: number, beam: number, depth: number, yaw: number, top: number, side: number, pitch = 0): void {
  drawPosed(b, { ...at, yaw, pitch }, (l) => {
    const half = length / 2;
    const rim: P3[] = [];
    const N = 8;
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      // L'ovale pointu : plus étroit aux bouts.
      rim.push([Math.sin(a) * (beam / 2) * Math.abs(Math.sin(a)) ** 0.2, 0, Math.cos(a) * half]);
    }
    const keel: P3[] = [
      [0, -depth * 0.55, half * 0.75],
      [0, -depth, 0],
      [0, -depth * 0.55, -half * 0.75],
    ];
    const deck: P3 = [0, 0, 0];
    for (let k = 0; k < N; k++) l.triangle(deck, rim[k], rim[(k + 1) % N], top);
    const keelOf = (k: number) => {
      const z = rim[k][2];
      return z > half * 0.4 ? keel[0] : z < -half * 0.4 ? keel[2] : keel[1];
    };
    // Les flancs : de chaque bord du pont à la quille (un triangle là où les deux bouts tombent sur le même point).
    for (let k = 0; k < N; k++) {
      const m = (k + 1) % N;
      const a = keelOf(k),
        c = keelOf(m);
      const out: P3 = [rim[k][0] + rim[m][0], -0.4, rim[k][2] + rim[m][2]];
      if (a === c) {
        const n = triangleNormal(rim[k], rim[m], a);
        if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) l.triangle(rim[k], rim[m], a, side);
        else l.triangle(rim[m], rim[k], a, side);
      } else quadOut(l, rim[k], rim[m], c, a, out, side);
    }
  });
}

/** La normale (non normée) d'un triangle. */
function triangleNormal(a: P3, b: P3, c: P3): P3 {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
}

/** Un tréteau bas, sans croix : deux pieds pleins, une traverse ; le long de `yaw`, couché si `lying`. */
function trestle(b: FacetBuilder, x: number, z: number, h: number, color: number, top: number, yaw = 0): void {
  const y = planeY(x, z);
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw);
  for (const s of [-0.38, 0.38]) b.box({ x: x + s * sy, y: y - 0.1, z: z + s * cy, yaw }, [0.36, h + 0.1 - 0.08, 0.08], color);
  b.box({ x, y: y + h - 0.08, z, yaw }, [0.3, 0.08, 0.92], color, top);
}

/**
 * Le chariot, dans son repère (y = 0 sous ses roues, z en travers du bassin, d'un rail à l'autre) : quatre petites
 * roues, quatre pieds, deux longerons, deux traverses ; restauré, la passerelle de planches et la main courante côté
 * caméra (à l'est).
 */
function gantry(l: FacetBuilder, metal: number, metalTop: number, whole: boolean): void {
  const w = (RAILS[1] - RAILS[0]) / 2;
  const r = GANTRY.wheel;
  const D = GANTRY.deck;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      l.drum({ x: sx * GANTRY.half - 0.05, y: r, z: sz * w, yaw: Math.PI / 2, pitch: Math.PI / 2 }, r, 0.1, 6, metal, metalTop);
      l.box({ x: sx * GANTRY.half, y: r, z: sz * w }, [0.16, D - r - 0.2, 0.16], metal, metalTop);
    }
  for (const sx of [-1, 1]) l.box({ x: sx * GANTRY.half, y: D - 0.22, z: 0 }, [0.16, 0.22, 2 * w + 0.3], metal, metalTop);
  for (const sz of [-1, 1]) l.box({ x: 0, y: D - 0.36, z: sz * w }, [2 * GANTRY.half + 0.16, 0.14, 0.14], metal, metalTop);
  if (!whole) return;
  l.box({ x: 0, y: D, z: 0 }, [2 * GANTRY.half + 0.2, 0.06, 2 * w + 0.2], C.newShade, C.newWood);
  const hx = GANTRY.half + 0.04;
  for (const z of [-w, 0, w]) l.box({ x: hx, y: D + 0.06, z }, [0.06, 0.86, 0.06], metal);
  l.box({ x: hx, y: D + 0.9, z: 0 }, [0.07, 0.07, 2 * w + 0.1], metal, metalTop);
}

/** Le tambour du treuil, couché le long de son axe (en travers du bassin, ou le long de `yaw`). */
function winchDrum(b: FacetBuilder, x: number, y: number, z: number, yaw: number, color: number, face: number): void {
  b.drum({ x, y, z, yaw, pitch: Math.PI / 2 }, WINCH.r, WINCH.length, 8, color, face);
}

// ---------- Le modèle ----------

function model(add: AddPiece, _ground: SiteGround, _door: Vec2): void {
  const B = BASIN;
  const corps1 = { stage: 0 as Stage, row: 0 };
  const corps2 = { stage: 0 as Stage, row: 0.5 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : le bassin (son fond, son rebord, sauf la brèche du sud) ; les poteaux nus de l'auvent ; la grande
  // maquette sur ses tréteaux et, à sa poupe, le signe de l'absence ; l'appentis, son établi, son rabot et sa lanterne, la
  // seule allumée.
  add('ruine', 0, (b) => {
    const rimTop = (x: number, z: number) => planeY(x, z) + B.top;
    b.box({ x: (B.x0 + B.x1) / 2, y: G() + SINK, z: MID_Z }, [B.x1 - B.x0 - 2 * B.rim + 0.02, B.floor - SINK, B.z1 - B.z0 - 2 * B.rim + 0.02], C.stoneShade, C.floor);
    const run = (alongX: boolean, at: number, from: number, to: number) => wallRun(b, alongX, at, from, to, B.rim, G() + SINK, alongX ? rimTop(from, at) : rimTop(at, from), alongX ? rimTop(to, at) : rimTop(at, to), C.stoneShade, C.stoneSun);
    run(true, RAILS[0], B.x0, B.x1);
    run(true, RAILS[1], B.x0, B.gap[0]);
    run(true, RAILS[1], B.gap[1], B.x1);
    run(false, B.x0 + B.rim / 2, B.z0 + B.rim, B.z1 - B.rim);
    run(false, B.x1 - B.rim / 2, B.z0 + B.rim, B.z1 - B.rim);
    // Les poteaux de l'auvent, debout, nus.
    for (const x of [AWNING.x0, AWNING.x1])
      for (const z of [AWNING.z0, AWNING.z1]) {
        const top = x === AWNING.x0 ? AWNING.low : AWNING.high;
        b.box({ x, y: planeY(x, z) + SINK, z }, [0.18, G() + top - planeY(x, z) - SINK, 0.18], C.woodShade, C.wood);
      }
    bigModel(b);
    shed(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : le fond fendu et ses touffes ; deux blocs du rebord tombés dans le bassin ; les rails rouillés,
  // celui du sud tordu vers le bout est.
  add(
    'ruine',
    0,
    (b) => {
      const f = G() + B.floor + 0.012;
      const crack: Vec2[] = [
        { x: -11.6, z: -3.6 },
        { x: -9.4, z: -2.6 },
        { x: -7.0, z: -3.1 },
        { x: -4.2, z: -2.2 },
      ];
      for (let k = 0; k < crack.length - 1; k++) {
        const a = crack[k],
          c = crack[k + 1];
        quadOut(b, [a.x, f, a.z - 0.06], [c.x, f, c.z - 0.06], [c.x, f, c.z + 0.06], [a.x, f, a.z + 0.06], [0, 1, 0], C.crack);
      }
      for (const [x, z] of [
        [-10.4, -3.9],
        [-5.6, -1.6],
        [-1.2, -4.0],
        [1.4, -2.2],
      ] as const)
        b.prism({ x, y: G() + B.floor, z }, 0.22, 0, 0.32, 5, C.leaf);
      for (const [x, z, yaw, tilt] of [
        [-8.3, -1.7, 0.4, 0.3],
        [-7.2, -2.5, 1.2, -0.2],
      ] as const)
        b.box({ x, y: G() + B.floor - 0.05, z, yaw, pitch: tilt }, [1.1, 0.5, 0.5], C.stoneShade, C.stone);
      const y = G() + B.top;
      b.box({ x: (B.x0 + B.x1) / 2, y, z: RAILS[0] }, [B.x1 - B.x0, 0.1, 0.12], C.rustShade, C.rust);
      b.box({ x: (B.x0 - 1) / 2, y, z: RAILS[1] }, [-1 - B.x0, 0.1, 0.12], C.rustShade, C.rust);
      b.beam({ x: -1, y: y + 0.05, z: RAILS[1] }, { x: B.x1 + 0.2, y: y + 0.7, z: RAILS[1] + 0.6 }, 0.11, C.rust);
    },
    corps1,
  );
  // Le corps 2 la relève : le chariot sorti de ses rails, penché, ses roues du nord dans le bassin sec, celles du sud sur
  // le rebord ; le tambour du treuil couché à côté de son bâti tombé ; le câble lâche dans l'herbe.
  add(
    'ruine',
    0,
    (b) => {
      const tilt = -0.2;
      const w = (RAILS[1] - RAILS[0]) / 2;
      drawPosed(b, { x: -1.6, y: G() + B.floor + w * Math.sin(-tilt) - 0.08, z: (RAILS[1] + 0.25 + B.z0 + B.rim + 0.1) / 2, yaw: 0.1, pitch: tilt }, (l) => gantry(l, C.rustShade, C.rust, false));
      const g = planeY(WINCH.x, WINCH.z);
      winchDrum(b, WINCH.x + 0.8, g + WINCH.r - 0.04, WINCH.z + 0.9, Math.PI / 2 + 0.4, C.woodShade, C.wood);
      for (const [dx, dz, yaw] of [
        [-0.2, -0.7, 0.3],
        [0.5, -1.4, -0.5],
      ] as const)
        b.box({ x: WINCH.x + dx, y: g - 0.02, z: WINCH.z + dz, yaw }, [0.7, 0.14, 1.15], C.woodShade, C.wood);
      const cable: Vec3[] = [
        { x: WINCH.x + 0.4, y: g + 0.04, z: WINCH.z + 1.3 },
        { x: WINCH.x - 0.4, y: g + 0.04, z: WINCH.z + 1.9 },
        { x: WINCH.x - 1.1, y: g + 0.04, z: WINCH.z + 1.6 },
        { x: WINCH.x - 1.6, y: g + 0.04, z: WINCH.z + 2.2 },
      ];
      for (let k = 0; k < cable.length - 1; k++) b.beam(cable[k], cable[k + 1], 0.05, C.woodShade);
    },
    corps2,
  );
  // Le haut la relève : la tôle de l'auvent tombée au pied de ses poteaux.
  add(
    'ruine',
    0,
    (b) => {
      const y = planeY(5.4, 0.2);
      sheet(
        b,
        [
          [4.3, y + 0.04, -0.4],
          [6.6, y + 0.04, -0.1],
          [6.5, y + 0.6, 0.9],
          [4.2, y + 0.6, 0.6],
        ],
        0.06,
        C.rust,
        C.rustShade,
      );
    },
    haut,
  );
  // Les abords la relèvent : les rails de la cale soulevés ; un tréteau couché et une petite coque penchée dans l'herbe.
  add(
    'ruine',
    0,
    (b) => {
      const S = SLIP;
      b.beam({ x: S.x0 - 0.2, y: G() + 0.25, z: S.rails[0] }, { x: S.x1 + 0.4, y: planeY(S.x1, S.rails[0]) + 1.0, z: S.rails[0] + 0.2 }, 0.18, C.woodShade);
      b.beam({ x: S.x0 - 0.5, y: planeY(S.x0, S.rails[1]) + 0.08, z: S.rails[1] + 0.2 }, { x: S.x1 + 0.2, y: planeY(S.x1, S.rails[1]) + 0.08, z: S.rails[1] + 1.1 }, 0.18, C.woodShade);
      const M = MODELS.small;
      const y = planeY(M.x, M.z);
      b.box({ x: M.x + 0.6, y: y - 0.04, z: M.z + 0.2, yaw: 0.5 }, [0.92, 0.12, 0.36], C.woodShade, C.wood);
      hull(b, { x: M.x - 0.4, y: y + M.depth * 0.5, z: M.z - 0.1 }, M.length, M.beam, M.depth, Math.PI / 2 + 0.3, C.hull, C.hullShade, 0.35);
    },
    abords,
  );

  // ---- Le corps 1 sur 2 : le rebord recalé (la brèche refermée), les deux rails droits de fer bruni ; le bassin en eau
  // d'un coup, une eau plate, sombre, immobile.
  add(0, 0, (b) => {
    const top = (x: number) => planeY(x, RAILS[1]) + B.top;
    wallRun(b, true, RAILS[1], B.gap[0], B.gap[1], B.rim, G() + SINK, top(B.gap[0]), top(B.gap[1]), C.stoneShade, C.stoneSun);
    for (const z of RAILS) b.box({ x: (B.x0 + B.x1) / 2, y: G() + B.top, z }, [B.x1 - B.x0, 0.1, 0.12], C.iron, C.ironTop);
    const y = G() + B.water;
    const [x0, x1, z0, z1] = [B.x0 + B.rim, B.x1 - B.rim, B.z0 + B.rim, B.z1 - B.rim];
    quadOut(b, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [0, 1, 0], C.water);
  });
  // ---- Le corps 2 sur 2 : le chariot remis sur ses rails, sa passerelle et sa main courante ; son bras court qui tient
  // une petite maquette nue, immobile sur l'eau ; le treuil redressé sur son socle, le câble tendu jusqu'au chariot.
  add(0, 0.5, (b) => {
    drawPosed(b, { x: GANTRY.x, y: G() + B.top + 0.1, z: MID_Z, yaw: 0 }, (l) => gantry(l, C.iron, C.ironTop, true));
    const deck = G() + B.top + 0.1 + GANTRY.deck;
    b.box({ x: GANTRY.x - 0.2, y: G() + B.water + 0.1, z: MID_Z }, [0.08, deck - 0.3 - (G() + B.water + 0.1), 0.08], C.iron);
    hull(b, { x: GANTRY.x - 0.2, y: G() + B.water + 0.12, z: MID_Z }, 1.2, 0.4, 0.22, Math.PI / 2, C.hull, C.hullShade);
    const g = planeY(WINCH.x, WINCH.z);
    b.box({ x: WINCH.x, y: g - 0.2, z: WINCH.z }, [1.0, 0.36, 1.4], C.stoneShade, C.stoneSun);
    for (const s of [-1, 1]) b.box({ x: WINCH.x, y: g + 0.1, z: WINCH.z + s * (WINCH.length / 2 + 0.1) }, [0.7, WINCH.axle + 0.3, 0.14], C.newShade, C.newWood);
    winchDrum(b, WINCH.x, g + 0.1 + WINCH.axle, WINCH.z - WINCH.length / 2, 0, C.newShade, C.newWood);
    b.beam({ x: WINCH.x - WINCH.r, y: g + 0.1 + WINCH.axle + 0.1, z: WINCH.z }, { x: GANTRY.x + GANTRY.half + 0.1, y: deck - 0.3, z: WINCH.z }, 0.04, C.iron);
  });
  // ---- Le haut : l'auvent de tôle à un pan, au-dessus du treuil ; sa lanterne, allumée dès sa pose.
  add(1, 0, (b) => {
    const A = AWNING;
    sheet(
      b,
      [
        [A.x0 - A.over, G() + A.low - 0.03, A.z1 + A.over],
        [A.x1 + A.over, G() + A.high + 0.03, A.z1 + A.over],
        [A.x1 + A.over, G() + A.high + 0.03, A.z0 - A.over],
        [A.x0 - A.over, G() + A.low - 0.03, A.z0 - A.over],
      ],
      0.07,
      C.ironTop,
      C.iron,
    );
    const L = LANTERN_AWNING;
    b.box({ x: L.x - 0.2, y: G() + A.low - 0.45, z: L.z }, [0.4, 0.07, 0.07], C.iron);
    lantern(b, { x: L.x - 0.38, y: G() + A.low - 0.45, z: L.z }, true);
  });
  // ---- Les abords : la cale refaite (deux rails de bois droits sur trois traverses) ; les tréteaux relevés et les deux
  // petites maquettes dessus (la grande toujours sans hélice) ; la cour dallée ; la lanterne du chemin.
  add(2, 0, (b) => {
    const S = SLIP;
    const yAt = (x: number) => G() + S.top + ((x - S.x0) / (S.x1 - S.x0)) * (S.foot - S.top);
    for (const z of S.rails) b.beam({ x: S.x0, y: yAt(S.x0), z }, { x: S.x1, y: yAt(S.x1), z }, 0.18, C.newShade);
    for (const x of [-14.0, -15.6, -17.1]) b.box({ x, y: yAt(x) - 0.2, z: (S.rails[0] + S.rails[1]) / 2 }, [0.2, 0.12, 2.4], C.newShade, C.newWood);
    const M = MODELS.small;
    for (const dx of [-0.6, 0.6]) trestle(b, M.x + dx, M.z, M.rest, C.newShade, C.newWood);
    hull(b, { x: M.x, y: planeY(M.x, M.z) + M.rest + 0.66 * M.depth, z: M.z }, M.length, M.beam, M.depth, Math.PI / 2, C.hull, C.hullShade);
    yard(b);
    const p = PATH_LANTERN;
    const py = planeY(p.x, p.z);
    b.box({ x: p.x, y: py - 0.3, z: p.z }, [0.12, p.h + 0.3, 0.12], C.iron);
    lantern(b, { x: p.x, y: py + p.h + 0.02, z: p.z }, true, 0.85);
  });
}

/**
 * La grande maquette, toujours là, sur ses deux tréteaux, le long du bassin ; à sa poupe (à l'est, face à la caméra
 * d'arrivée), le signe de l'absence du 4e : la ferrure vide, deux chevilles nues (l'hélice est sur le Rafiot).
 */
function bigModel(b: FacetBuilder): void {
  const M = MODELS.big;
  for (const dx of [-0.8, 0.8]) trestle(b, M.x + dx, M.z, M.rest, C.woodShade, C.wood);
  // Sur ses tréteaux : la quille, sous eux, est à environ quatre cinquièmes du creux.
  const y = planeY(M.x, M.z) + M.rest + 0.8 * M.depth;
  hull(b, { x: M.x, y, z: M.z }, M.length, M.beam, M.depth, Math.PI / 2, C.hull, C.hullShade);
  const sx = M.x + M.length / 2 - 0.02;
  b.box({ x: sx + 0.04, y: y - 0.14, z: M.z }, [0.12, 0.12, 0.42], C.rustDull, C.rustDullTop);
  for (const dz of [-0.11, 0.11]) b.box({ x: sx + 0.14, y: y - 0.11, z: M.z + dz }, [0.14, 0.06, 0.06], C.iron);
}

/**
 * L'appentis de l'ingénieure, au sud-est du bassin : un mur de planches à mi-hauteur au fond (à l'est), quatre poteaux,
 * un toit de planches à un pan ; l'établi contre le fond, un rabot dessus ; sa lanterne au poteau du sud, la seule allumée de la
 * ruine.
 */
function shed(b: FacetBuilder): void {
  const S = SHED;
  const g = planeY(S.x1, (S.z0 + S.z1) / 2);
  b.box({ x: S.x1 - 0.06, y: g + SINK, z: (S.z0 + S.z1) / 2 }, [0.12, G() + S.wall - g - SINK, S.z1 - S.z0], C.woodShade, C.wood);
  for (const [x, top] of [
    [S.x0, S.front],
    [S.x1, S.back],
  ] as const)
    for (const z of [S.z0, S.z1]) {
      const h = planeY(x, z);
      b.box({ x, y: h + SINK, z }, [0.16, G() + top - h - SINK, 0.16], C.woodShade, C.wood);
    }
  sheet(
    b,
    [
      [S.x0 - 0.3, G() + S.front, S.z1 + 0.3],
      [S.x1 + 0.1, G() + S.back, S.z1 + 0.3],
      [S.x1 + 0.1, G() + S.back, S.z0 - 0.3],
      [S.x0 - 0.3, G() + S.front, S.z0 - 0.3],
    ],
    0.08,
    C.wood,
    C.woodShade,
  );
  const K = BENCH;
  const by = planeY(K.x, K.z);
  b.box({ x: K.x, y: by - 0.1, z: K.z }, [0.6, K.h + 0.1, K.length], C.woodShade, C.wood);
  b.box({ x: K.x - 0.05, y: by + K.h, z: K.z + 0.5, yaw: 0.2 }, [0.12, 0.1, 0.36], C.newShade, C.newWood);
  const L = LANTERN_SHED;
  b.box({ x: L.x - 0.2, y: G() + L.y + 0.02, z: L.z }, [0.4, 0.07, 0.07], C.woodShade);
  lantern(b, { x: L.x - 0.38, y: G() + L.y, z: L.z }, true);
}

/** La cour : la dalle qui suit le plan, son bord, et ses joints en rangs (jamais sur le chemin). */
function yard(b: FacetBuilder): void {
  const top = YARD.map(({ x, z }) => [x, planeY(x, z) + 0.02, z] as P3);
  for (let k = 1; k < top.length - 1; k++) b.triangle(top[0], top[k], top[k + 1], C.paving);
  const cx = YARD.reduce((s, p) => s + p.x, 0) / YARD.length,
    cz = YARD.reduce((s, p) => s + p.z, 0) / YARD.length;
  for (let k = 0; k < top.length; k++) {
    const m = (k + 1) % top.length;
    const out: P3 = [(top[k][0] + top[m][0]) / 2 - cx, 0, (top[k][2] + top[m][2]) / 2 - cz];
    quadOut(b, [top[k][0], top[k][1] - 0.4, top[k][2]], [top[m][0], top[m][1] - 0.4, top[m][2]], top[m], top[k], out, C.stoneShade);
  }
  const line = (a: Vec2, c: Vec2) => {
    const len = Math.hypot(c.x - a.x, c.z - a.z) || 1;
    const nx = ((c.z - a.z) / len) * 0.04,
      nz = (-(c.x - a.x) / len) * 0.04;
    const p = (q: Vec2, s: number): P3 => [q.x + nx * s, planeY(q.x, q.z) + 0.032, q.z + nz * s];
    quadOut(b, p(a, 1), p(c, 1), p(c, -1), p(a, -1), [0, 1, 0], C.joint);
  };
  line({ x: -5.1, z: 2.1 }, { x: 0.5, z: 2.1 });
  for (const x of [-3.3, -1.2]) line({ x, z: 0.2 }, { x, z: 4.1 });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, « Les parties et les traces ») ; aucune sur le chemin. */
const TRACE_SPOTS = {
  belt: { x: BENCH.x, z: BENCH.z - BENCH.length / 2 + 0.25 },
  horn: { x: GANTRY.x + GANTRY.half + 0.12, z: RAILS[1] - 0.5 },
  bucket: { x: AWNING.x1, z: AWNING.z1 + 0.2 },
  toolbox: { x: -0.4, z: 4.9 },
} as const;

/** Une courroie de cuir roulée sur le bout de l'établi (jamais pendue) (La chaîne d'énergie). */
function belt(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.belt;
    const y = planeY(BENCH.x, BENCH.z) + BENCH.h;
    l.band({ x, y, z }, 0.2, 0.09, 8, C.leather);
    l.band({ x, y, z }, 0.12, 0.09, 6, C.leather);
  });
}

/** Un porte-voix : un simple cône de tôle sombre, pendu à un crochet du chariot, côté caméra (La chaîne d'information). */
function horn(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.horn;
    const y = G() + BASIN.top + 0.1 + GANTRY.deck - 0.36;
    l.box({ x, y: y - 0.16, z }, [0.04, 0.16, 0.04], C.iron);
    l.prism({ x, y: y - 0.62, z, yaw: Math.PI / 2, pitch: 0.35 }, 0.16, 0.04, 0.46, 6, C.iron, C.ironTop);
  });
}

/**
 * Un seau de bois cerclé de fer et son écope, posés au pied d'un poteau de l'auvent (Lire une simulation ; relecture du
 * contenu du Bastion, retouche 1, point 13 : les trois petites maquettes rappelaient la créature de l'île). Rien à lire.
 */
function bucket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.bucket;
    const y = planeY(x, z);
    const bx = x - 0.45;
    l.prism({ x: bx, y: y - 0.04, z }, 0.22, 0.27, 0.5, 8, C.newShade, C.newWood);
    l.band({ x: bx, y: y + 0.3, z }, 0.265, 0.05, 8, C.iron);
    // L'écope : une petite pelle creuse de bois, son manche appuyé contre le seau.
    l.box({ x: bx - 0.42, y: y - 0.02, z: z + 0.12, yaw: 0.4 }, [0.26, 0.08, 0.2], C.newShade, C.newWood);
    l.beam({ x: bx - 0.3, y: y + 0.04, z: z + 0.06 }, { x: bx - 0.2, y: y + 0.42, z }, 0.05, C.newShade);
  });
}

/** Une caisse à outils ouverte, une clé et un marteau debout côte à côte dedans, au bord de la cour (Dépanner). */
function toolbox(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.toolbox;
    const y = planeY(x, z);
    l.box({ x, y: y - 0.05, z }, [0.7, 0.08, 0.34], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.box({ x, y: y - 0.05, z: z + s * 0.16 }, [0.7, 0.32, 0.03], C.newShade, C.newWood);
    for (const s of [-1, 1]) l.box({ x: x + s * 0.34, y: y - 0.05, z }, [0.03, 0.32, 0.32], C.newShade, C.newWood);
    l.box({ x: x - 0.12, y: y + 0.02, z }, [0.05, 0.5, 0.05], C.iron, C.ironTop);
    l.box({ x: x - 0.12, y: y + 0.5, z }, [0.16, 0.06, 0.06], C.iron, C.ironTop);
    l.box({ x: x + 0.14, y: y + 0.02, z }, [0.05, 0.46, 0.05], C.newShade, C.newWood);
    l.box({ x: x + 0.14, y: y + 0.46, z }, [0.24, 0.09, 0.09], C.iron, C.ironTop);
  });
}

/**
 * Les quatre traces, une par mission, chacune avec sa partie (le corps en deux, puis le haut, puis les abords) ; des
 * objets du bassin d'essai, jamais la notion ; aucune ne se répète d'un lieu à l'autre.
 */
const TRACES = {
  'energy-chain': { at: TRACE_SPOTS.belt, lift: 1, stage: 0, row: 0, draw: belt },
  'information-chain': { at: TRACE_SPOTS.horn, lift: 1, stage: 0, row: 0.5, draw: horn },
  simulation: { at: TRACE_SPOTS.bucket, lift: 1, stage: 1, row: 0, draw: bucket },
  troubleshooting: { at: TRACE_SPOTS.toolbox, lift: 1, stage: 2, row: 0, draw: toolbox },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

// ---------- La scénette ----------

/**
 * Le cap de départ de la caméra de la scénette (intention : vers le nord-est) : le bout est du bassin, le treuil sous son
 * auvent ; le volcan hors du cadre. Elle regarde vers −(sin cap, cos cap).
 */
const SCENE_START = -Math.PI / 4;

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'ingénieure). */
const SCENE_RIGHT = { x: Math.cos(SCENE_START), z: -Math.sin(SCENE_START) } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur la cour, devant l'appentis, au sud-est du bassin. */
const SCENE_SPOT = { dx: -2.2, dz: 2.4, half: [2.6, 1.2] as [number, number] } as const;

/** L'écart de Kéo et de l'ingénieure au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous elle) : le dessus du plan du sol. */
const sceneRise = once(() => {
  const [hx, hz] = SCENE_SPOT.half;
  let top = -Infinity;
  for (let i = -3; i <= 3; i++) for (let k = -2; k <= 2; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / 3) * hx, SCENE_SPOT.dz + (k / 2) * hz));
  return Math.max(0, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz) + 0.02 - top);
});

/** L'ingénieure en pion (son modèle 3D prend sa place, ./habitants.ts) : bottes, tablier, chemise. */
function engineer(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.18, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.16, z: at.z }, 0.28, 0.24, 0.48, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.62, z: at.z }, 0.26, 0.23, 0.38, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.28, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.34, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Les poulies des réponses : leur rayon, la hauteur de leur axe, à l'échelle 1 ; une poulie choisie se soulève d'un cran. */
const PULLEY = { r: 0.28, axle: 0.5, lift: 0.3 } as const;

export const CHARIOT: PlaceArt = {
  role: 'L’ingénieure',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 2+1+1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRise();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Basse : la cour est plate, rien ne la cache.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la cour, l'appentis, l'établi et le rebord sont au lieu ; les abords (./chariotSurroundings.ts)
  // ajoutent ce qui cadre. Il reste l'ingénieure en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) engineer(b, at, sphere);
  },
  answer: {
    size: { height: PULLEY.axle + PULLEY.r + PULLEY.lift + 0.2, half: PULLEY.r },
    facing: true,
    // Le rebord du bassin : une longue pierre basse, où les poulies sont posées.
    base(b, mid, y, z, span, s, ground) {
      const foot = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: foot, z: z + 0.25 * s }, [span + 0.8, y + 0.08 * s - foot, 0.4 * s], C.stoneShade, C.stoneSun);
    },
    // Une poulie de bois à chape de fer bruni, toutes de la même taille ; choisie, elle se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      const y = at.y + (picked ? PULLEY.lift : 0) * s;
      const r = PULLEY.r * s;
      b.drum({ x: at.x, y: y + PULLEY.axle * s, z: at.z - 0.06 * s, pitch: Math.PI / 2 }, r, 0.12 * s, 8, C.newShade, C.newWood);
      for (const dz of [-0.1, 0.1]) b.box({ x: at.x, y: y + (PULLEY.axle - 0.06) * s, z: at.z + dz * s }, [0.06 * s, r + 0.18 * s, 0.03 * s], C.iron, C.ironTop);
      b.box({ x: at.x, y: y + PULLEY.axle * s + r + 0.06 * s, z: at.z }, [0.08 * s, 0.08 * s, 0.24 * s], C.iron, C.ironTop);
      b.box({ x: at.x, y: y - 0.05 * s, z: at.z }, [0.3 * s, PULLEY.axle * s - r + 0.05 * s, 0.18 * s], C.stoneShade, C.stoneSun);
    },
  },
  // Les quatre missions en R : la cour seule, rien de l'item ; les poulies portent les réponses.
  rest() {},
  traces: TRACES,
  // Kéo au retour : au pas de la porte, tourné vers le bassin.
  exit: { x: DOOR_AT.x - 0.7, z: DOOR_AT.z - 0.7 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan du Chariot, pour les tests et ses abords : le bassin, le chariot, le treuil, l'auvent, la cale, la caméra. */
export const CHARIOT_LAYOUT = {
  basin: BASIN,
  rails: RAILS,
  gantry: GANTRY,
  winch: WINCH,
  awning: AWNING,
  slip: SLIP,
  models: MODELS,
  shed: SHED,
  yard: YARD,
  planeY,
  get base() {
    return G();
  },
  pathLantern: PATH_LANTERN,
  door: DOOR_AT,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
  colors: { water: C.water },
} as const;

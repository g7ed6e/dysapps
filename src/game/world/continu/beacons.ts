// Les Balises (GD-20, point 8, lot L9a, directeur artistique) : à terre, sur la lèvre sud de la passe, une station de
// baliseur basse au toit de tuiles, sa cale de pierre qui descend au nord vers l'eau de la passe (arrêtée au bord du
// chenal de la Nef, plan6e.ts, `NEF_CHANNEL`), et ses cinq mâts en chapelet dans la mer, vers l'ouest, chacun sur une
// roche qui affleure, un voyant en boule à sa tête (ni cône, ni croix, ni lumière). Avant : la ruine démontée (les
// perches couchées en tas sur la grève, leurs pieds seuls sur les roches, la station sans toit, deux bouées échouées sur
// le flanc), délavée, jamais sombre. Le corps : les murs, le toit, la cale dégagée. Le haut : les cinq mâts et leurs
// voyants (la silhouette arrive). Les abords : le ponton court au bout de la cale, le muret, le chemin de la porte (ils
// portent les traces). L'habitant, « le pilote du chenal », immobile ; les réponses, trois bouées pareilles qui flottent
// au pied de la cale, immobiles, sans numéro ni lettre ni pavillon ; la bouée de la bonne réponse reçoit son voyant. Rien
// d'écrit. Code pur (placeArt.ts).
import { FacetBuilder, type Facets, type Placement } from './facets';
import type { Vec2, Vec3 } from './geometry';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { BEACON_MASTS, COLORS_6E, placeById } from './plan6e';
import { heightAt, standingHeight } from './terrain';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant (places.ts, `SINK`). */
const SINK = -0.8;

const C = {
  // Les perches (directeur artistique, #5A4632), les roches (la roche du monde), les voyants ocre (#C8923A).
  pole: 0x5a4632,
  rock: COLORS_6E.rock,
  rockTop: 0xab9576,
  ball: 0xc8923a,
  // La station : le crépi (#D9CDB4) et son ombre, les tuiles terre cuite (#A4553A) et leur second ton.
  plaster: 0xd9cdb4,
  plasterShade: 0xc2b598,
  tile: 0xa4553a,
  tileShade: 0x8e4a33,
  door: 0x7a5538,
  // Le creux d'une fenêtre : une ombre brune, jamais noire (comme les niches des Archives).
  recess: 0x5e4e3c,
  // La cale : la pierre des Écluses, et son ombre.
  stone: 0xb9b2a3,
  stoneShade: 0x9a9488,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  path: COLORS_6E.path,
  // La ruine : délavée, d'un ton moyen, jamais sombre.
  worn: 0xbdb3a0,
  wornTop: 0xaea591,
  wornPole: 0x9a8b78,
  // Les bouées (#DAA66A, bande Nuit océan #142B38).
  buoy: 0xdaa66a,
  buoyShade: 0xc4925a,
  night: 0x142b38,
  // La grève du parc à bouées : le sable mouillé du rivage, et son flanc.
  shingle: COLORS_6E.wetSand,
  shingleShade: 0xb39a69,
  // Le pilote (directeur artistique) : ciré jaune (#E3B23C), pantalon Nuit océan, bonnet Bleu lagon (#178078), filin
  // de chanvre lové sur l'épaule.
  oilskin: 0xe3b23c,
  oilskinShade: 0xc99d33,
  cap: 0x178078,
  head: 0xe3c08a,
  rope: 0xd8c49a,
  // Les traces : l'ancre et la chaîne (fer clair, jamais noir), le canot (bois), l'antenne (bois sombre, fil clair).
  iron: 0x6f7c84,
  ironLight: 0x8a979e,
  hull: 0xc98e55,
  hullShade: 0xb98049,
  wire: 0xe5ebe3,
} as const;

/**
 * La station de baliseur, dans le repère du lieu : son milieu (x, z), sa largeur (le long de x), sa profondeur, la
 * hauteur de ses murs et de son faîtage ; basse, sans tour (plus basse que la Vigie, jamais un phare).
 */
const BEACON_HOUSE = { x: 0, z: 0, w: 4.4, d: 3.2, wall: 1.9, ridge: 1.15, eave: 0.3 } as const;

/** La cale : son axe (x), sa largeur, son départ (le mur nord de la station) et son bout, au bord du chenal (y 660). */
export const BEACON_SLIP = { x: -0.6, w: 2.4, from: -1.7, to: -11.35 } as const;

/** Le ponton court au bout de la cale : sa largeur, sa profondeur, la hauteur de son plancher au-dessus du sol. */
const PONTOON = { w: 2.6, d: 1.3, lift: 0.35 } as const;

/** Un mât : sa hauteur au-dessus de sa roche, la section de la perche, le rayon de son voyant ; la roche (rayon, saillie). */
export const MAST = { height: 5.2, pole: 0.16, ball: 0.36, rock: 1.1, rise: 0.35 } as const;

/** Les mâts, dans le repère du lieu (depuis son centre), d'est en ouest. */
function mastSpots(): Vec2[] {
  const c = placeById('beacons').center;
  return BEACON_MASTS.map((m) => ({ x: m.x - c.x, z: m.z - c.z }));
}

/** Une boule en facettes (un voyant), en `c`, de rayon `r` : six côtés, trois rangs (24 triangles). */
function ball(b: FacetBuilder, c: Vec3, r: number, color: number, sides = 6, rings = 3): void {
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

/** La roche d'un mât, qui affleure : son pied sous l'eau, son dessus juste au-dessus (`water` : le niveau de l'eau). */
function mastRock(b: FacetBuilder, m: Vec2, water: number, k: number): void {
  b.prism({ x: m.x, y: water - 1.4, z: m.z, yaw: 0.6 * k }, MAST.rock * 1.25, MAST.rock * 0.8, 1.4 + MAST.rise, 5, C.rock, C.rockTop);
}

/** Les volumes de la station, du corps aux abords (le modèle du lieu). */
function model(add: AddPiece, ground: SiteGround, door: Vec2): void {
  const H = BEACON_HOUSE;
  const S = BEACON_SLIP;
  const water = ground.water;
  const masts = mastSpots();
  // Les roches des mâts, toujours là (le large ne se démonte pas).
  add('ruine', 0, (b) => masts.forEach((m, k) => mastRock(b, m, water, k)));
  // La ruine de la station : ses murs à mi-hauteur, sans toit, ébréchés ; les murs neufs les habillent.
  add(
    'ruine',
    0,
    (b) => {
      b.box({ x: H.x, y: SINK, z: H.z }, [H.w - 0.1, 1.1 - SINK, H.d - 0.1], C.worn, C.wornTop);
      b.box({ x: H.x - 1.2, y: 1.1, z: H.z - 0.6 }, [1.6, 0.45, 0.4], C.worn, C.wornTop);
    },
    { stage: 0, row: 0 },
  );
  // Les pieds des mâts, seuls sur leurs roches, cassés à des hauteurs inégales ; les mâts relevés les remplacent.
  const stumps = (from: number, to: number) => (b: FacetBuilder) => {
    for (let k = from; k < to; k++) {
      const m = masts[k];
      const top = water + MAST.rise;
      b.beam({ x: m.x, y: top - 0.1, z: m.z }, { x: m.x + 0.05, y: top + 0.5 + 0.25 * (k % 2), z: m.z }, MAST.pole + 0.02, C.wornPole);
    }
  };
  add('ruine', 0, stumps(0, 3), { stage: 1, row: 0 });
  add('ruine', 0, stumps(3, 5), { stage: 1, row: 0.5 });
  // Les perches couchées en tas sur la grève de la côte ouest, loin de la cale : un tas par rangée de mâts relevés.
  const pile = (list: readonly (readonly [number, number, number, number])[]) => (b: FacetBuilder) => {
    for (const [x, z, yaw, len] of list) {
      const g = Math.max(ground.at(x, z), water + 0.3);
      b.beam({ x: x - (Math.cos(yaw) * len) / 2, y: g + 0.1, z: z - (Math.sin(yaw) * len) / 2 }, { x: x + (Math.cos(yaw) * len) / 2, y: g + 0.18, z: z + (Math.sin(yaw) * len) / 2 }, MAST.pole + 0.02, C.wornPole);
    }
  };
  add(
    'ruine',
    0,
    pile([
      [-10.6, -1.6, 0.25, 4.6],
      [-10.3, -1.2, 0.1, 4.2],
      [-10.8, -1.0, -0.12, 3.8],
    ]),
    { stage: 1, row: 0 },
  );
  add(
    'ruine',
    0,
    pile([
      [-10.2, 0.4, -0.3, 4.4],
      [-10.5, 0.7, -0.15, 3.6],
    ]),
    { stage: 1, row: 0.5 },
  );
  // Deux bouées échouées sur le flanc, sur la grève au pied de la cale ; les abords les relèvent.
  add(
    'ruine',
    0,
    (b) => {
      for (const [x, z, yaw] of [
        [-3.4, -9.6, 0.5],
        [2.2, -10.2, -0.9],
      ] as const) {
        const y = ground.at(x, z) + 0.28;
        b.drum({ x, y, z, yaw, pitch: Math.PI / 2 }, 0.3, 0.62, 6, C.worn, C.wornTop);
        b.band({ x: x + Math.sin(yaw) * 0.25, y: y + 0.01, z: z + Math.cos(yaw) * 0.25, yaw, pitch: Math.PI / 2 }, 0.31, 0.12, 6, C.wornPole);
      }
    },
    { stage: 2, row: 0 },
  );
  // Le corps : les murs de crépi, la porte au sud, une fenêtre de chaque côté.
  add(0, 0, (b) => {
    b.box({ x: H.x, y: SINK, z: H.z }, [H.w, H.wall - SINK, H.d], C.plasterShade, C.plaster);
    b.box({ x: H.x, y: 0, z: H.z + H.d / 2 + 0.03 }, [0.9, 1.45, 0.06], C.door);
    for (const dx of [-1.35, 1.35]) b.plate({ x: H.x + dx, y: 0.85, z: H.z + H.d / 2 + 0.01 }, [[-0.3, 0], [0.3, 0], [0.3, 0.6], [-0.3, 0.6]], C.recess);
    b.plate({ x: H.x - H.w / 2 - 0.01, y: 0.85, z: H.z, yaw: -Math.PI / 2 }, [[-0.3, 0], [0.3, 0], [0.3, 0.6], [-0.3, 0.6]], C.recess);
  });
  // Le toit de tuiles à deux pans, son faîtage le long de la station (est-ouest), un rang de tuiles plus sombre au bas.
  add(0, 0.34, (b) => {
    b.gableRoof({ x: H.x, y: H.wall, z: H.z }, H.w + 2 * H.eave, H.d + 2 * H.eave, H.ridge, C.tile, C.plaster);
    for (const side of [-1, 1]) b.box({ x: H.x, y: H.wall - 0.05, z: H.z + side * (H.d / 2 + H.eave - 0.12) }, [H.w + 2 * H.eave, 0.1, 0.24], C.tileShade);
  });
  // La cale dégagée : des dalles de pierre qui descendent du mur nord de la station jusqu'à la grève ; le ponton des
  // abords la prolonge jusqu'au bord du chenal.
  add(0, 0.67, (b) => {
    const n = 4;
    const step = (S.from - S.to - PONTOON.d) / n;
    for (let k = 0; k < n; k++) {
      const z = S.from - (k + 0.5) * step;
      const g = ground.foot(S.x, z, S.w / 2);
      b.box({ x: S.x, y: g.low - 0.3, z }, [S.w, g.top - g.low + 0.38, step - 0.08], C.stoneShade, C.stone);
    }
  });
  // Le haut : les cinq mâts relevés et leurs voyants, en deux rangées (les trois de l'est, puis les deux du large).
  const mastsUp = (from: number, to: number) => (b: FacetBuilder) => {
    for (let k = from; k < to; k++) {
      const m = masts[k];
      const foot = water + MAST.rise;
      b.beam({ x: m.x, y: foot - 0.2, z: m.z }, { x: m.x, y: foot + MAST.height, z: m.z }, MAST.pole, C.pole);
      ball(b, { x: m.x, y: foot + MAST.height + MAST.ball * 0.8, z: m.z }, MAST.ball, C.ball);
    }
  };
  add(1, 0, mastsUp(0, 3));
  add(1, 0.5, mastsUp(3, 5));
  // Les abords : le ponton court au bout de la cale, sur quatre pieux, son bord nord au bord du chenal (jamais dedans).
  add(2, 0, (b) => {
    const z = S.to + PONTOON.d / 2;
    const g = ground.foot(S.x, z, PONTOON.w / 2);
    const top = g.top + PONTOON.lift;
    b.box({ x: S.x, y: top - 0.1, z }, [PONTOON.w, 0.1, PONTOON.d], C.darkWood, C.wood);
    for (const dx of [-1, 1]) for (const dz of [-0.45, 0.45]) b.box({ x: S.x + dx * (PONTOON.w / 2 - 0.15), y: g.low - 0.5, z: z + dz }, [0.16, top - g.low + 0.5, 0.16], C.darkWood);
  });
  // Le muret, de part et d'autre de la cale, au pied de la station : des pierres sèches, bas.
  add(2, 0.34, (b) => {
    for (const side of [-1, 1])
      for (const [z, len, h] of [
        [-3.2, 2.2, 0.5],
        [-5.6, 2.0, 0.42],
      ] as const) {
        const x = S.x + side * (S.w / 2 + 0.35);
        const g = ground.foot(x, z, len / 2);
        b.box({ x, y: g.low - 0.2, z }, [0.34, g.top - g.low + h + 0.2, len], C.stoneShade, C.stone);
      }
  });
  // Le chemin de sable, de la porte de la station à la porte du lieu, où arrive le chemin (plan6e.ts) : en dalles qui
  // suivent le sol (la porte est au sud-ouest, plus bas que le replat de la station).
  add(2, 0.67, (b) => {
    const z0 = H.z + H.d / 2 + 0.1;
    const len = Math.hypot(door.x, door.z - z0);
    if (door.z <= z0) return;
    const yaw = Math.atan2(door.x, door.z - z0);
    const n = Math.max(1, Math.ceil(len / 1.6));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      const x = door.x * t,
        z = z0 + (door.z - z0) * t;
      const g = ground.foot(x, z, 0.6);
      b.box({ x, y: g.low - 0.3, z, yaw }, [1.2, g.top - g.low + 0.35, len / n + 0.06], C.stoneShade, C.path);
    }
  });
}

/** Le sol (à sa hauteur où l'on se tient) en un point du lieu, depuis son centre, dans le monde. */
function groundOf(c: Vec3, dx: number, dz: number): Vec3 {
  const x = c.x + dx,
    z = c.z + dz;
  return { x, y: standingHeight(heightAt({ x, z })), z };
}

/** Une bouée, à l'échelle 1, son pied au milieu en 0 : son corps, sa bande, sa tige ; la hauteur du haut de sa tige. */
const BUOY = { r0: 0.34, r1: 0.25, body: 0.6, sunk: 0.18, band: 0.12, rod: 0.42, tipped: 0.32 } as const;

/** Le milieu du voyant au haut de la tige d'une bouée, au-dessus de son pied, à l'échelle 1. */
const BUOY_TOP = BUOY.body - BUOY.sunk + BUOY.rod;

/**
 * Une bouée de réponse, à l'échelle `s`, son pied (la surface de l'eau) en `at` : un corps Sable en tronc de cône, sa
 * bande Nuit océan, sa tige de bois ; toutes les mêmes, sans numéro, ni lettre, ni pavillon. `tilt` : penchée en
 * arrière (vers le nord) sur son pied : sa forme dit qu'elle est choisie.
 */
function buoy(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const B = BUOY;
  const [cp, sp] = [Math.cos(tilt), Math.sin(tilt)];
  // Un point de la bouée (en haut `oy` depuis son pied), penché avec elle.
  const put = (oy: number, yaw = 0): Placement => ({ x: at.x, y: at.y + oy * s * cp, z: at.z - oy * s * sp, yaw, pitch: -tilt });
  b.prism(put(-B.sunk), B.r0 * s, B.r1 * s, B.body * s, 8, C.buoy, C.buoyShade);
  const bandAt = B.body * 0.45 - B.sunk;
  b.band(put(bandAt), (B.r0 - ((B.r0 - B.r1) * (bandAt + B.sunk)) / B.body + 0.012) * s, B.band * s, 8, C.night);
  const rodFoot = put(B.body - B.sunk);
  const rodTop = put(BUOY_TOP);
  b.beam({ x: rodFoot.x, y: rodFoot.y, z: rodFoot.z }, { x: rodTop.x, y: rodTop.y, z: rodTop.z }, 0.07 * s, C.pole);
}

/** Le voyant d'une bouée, à l'échelle `s`, centré en 0 : la même boule que celle des mâts. */
function buoyBall(s: number): Facets {
  const b = new FacetBuilder();
  ball(b, { x: 0, y: 0, z: 0 }, 0.17 * s, C.ball);
  return b.build();
}

/** La course du voyant qui monte sur la tige, en part de la tige. */
const BALL_RISE = 0.6;

/** Le chevalet d'une bouée (relecture de L9) : un tréteau bas, son plateau, ses deux paires de pieds écartés. */
const TRESTLE = { h: 0.34, w: 0.82, d: 0.46, top: 0.06, foot: 0.24, leg: 0.06 } as const;

/**
 * Un chevalet, à l'échelle `s`, ses pieds en `at` (le sol de la rangée) : le parc à bouées du baliseur, les bouées sorties
 * de l'eau à remettre en mer. Un tréteau (jamais un berceau : le ber du canot est la trace de Hello) ; son plateau en
 * haut, où la bouée se pose. Rend le dessus du plateau.
 */
function trestle(b: FacetBuilder, at: Vec3, s: number): Vec3 {
  const T = TRESTLE;
  const top = at.y + T.h * s;
  b.box({ x: at.x, y: top - T.top * s, z: at.z }, [T.w * s, T.top * s, T.d * s], C.darkWood, C.wood);
  for (const side of [-1, 1]) {
    const x = at.x + side * (T.w / 2 - 0.08) * s;
    for (const dz of [-1, 1]) b.beam({ x, y: top - T.top * s, z: at.z + dz * 0.06 * s }, { x, y: at.y - 0.04, z: at.z + dz * T.foot * s }, T.leg * s, C.darkWood);
  }
  return { x: at.x, y: top, z: at.z };
}

/** Une bouée debout sur son chevalet, le chevalet posé en `at`. */
function buoyOnTrestle(b: FacetBuilder, at: Vec3, s: number, tilt = 0): void {
  const top = trestle(b, at, s);
  buoy(b, { x: top.x, y: top.y + BUOY.sunk * s, z: top.z }, s, tilt);
}

/** La grève sous les chevalets : une bande de sable, du sol jusqu'au pied des tréteaux (`top`). */
function shingle(b: FacetBuilder, mid: number, top: number, z: number, span: number, depth: number, ground: number): void {
  const low = Math.min(ground, top) - 0.2;
  b.box({ x: mid, y: low, z }, [span + 0.2, top - low, depth], C.shingleShade, C.shingle);
}

/** Le pilote du chenal, immobile, le visage nu (rien n'y est dessiné : ni sourire, ni moue) ; il ne dit rien. */
function pilote(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  // Le pantalon Nuit océan (le bas sombre), deux jambes sous les hanches.
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.13, 0.14, 0.5, 6, C.night);
  // Le ciré jaune (le haut clair), long jusqu'aux cuisses, son col.
  b.prism({ x: at.x, y: at.y + 0.42, z: at.z }, 0.36, 0.28, 0.52, 10, C.oilskin, C.oilskinShade);
  b.prism({ x: at.x, y: at.y + 0.92, z: at.z }, 0.2, 0.17, 0.08, 8, C.oilskinShade);
  sphere(b, { x: at.x, y: at.y + 1.13, z: at.z }, 0.23, 8, 6, C.head);
  // Le bonnet Bleu lagon : une calotte posée haut, le visage nu devant.
  sphere(b, { x: at.x, y: at.y + 1.2, z: at.z - 0.03 }, 0.24, 8, 3, C.cap);
  // Les bras le long du corps.
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.88, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.46, z: at.z + 0.04 }, 0.14, C.oilskin);
  // Le filin lové sur l'épaule gauche (vers l'est) : deux anneaux entiers, couchés de biais sur l'épaule.
  for (const [dy, r] of [
    [0, 0.26],
    [0.05, 0.22],
  ] as const)
    b.band({ x: at.x + 0.2, y: at.y + 0.78 + dy, z: at.z + 0.02, yaw: 0.3, pitch: 1.1 }, r, 0.06, 10, C.rope);
}

/** Le sol de la scène : la cale, sa demi-largeur et sa profondeur. */
const SCENE_FLOOR = { half: 4.8, depth: 2.6 } as const;

/** Le milieu de la scène, depuis le centre du lieu : sur la cale, face à l'eau de la passe. */
const SCENE_SPOT = { dx: BEACON_SLIP.x, dz: -7.4 } as const;

/** La scénette : le sol de la scène au-dessus du point de la scène, et l'écart du témoin vers la caméra. */
const SCENE_RISE = 0.12;
const WITNESS_FRONT = 0.55;

/** Où se pose la trace de chaque mission, depuis le centre du lieu ; aucune plus haute que les mâts. */
export const BEACONS_TRACE_SPOTS = {
  hello: { x: -3.3, z: -9.2 },
  numbers: { x: 3.05, z: 0.3 },
  'first-listening': { x: 0, z: 0 },
  signs: { x: 2.9, z: 3.4 },
  'famous-people': { x: BEACON_SLIP.x + 0.95, z: BEACON_SLIP.to + 0.35 },
} as const;

/** Le canot du baliseur (Hello), sur son ber, au pied de la cale : une coque de bois, deux banquettes, le ber dessous. */
function dinghy(b: FacetBuilder, g: Vec3): void {
  const yaw = 0.35;
  b.box({ x: g.x, y: g.y - 0.2, z: g.z, yaw }, [0.5, 0.42, 1.9], C.darkWood);
  const y = g.y + 0.22;
  b.extrude({ x: g.x - 0.6 * Math.cos(yaw), y, z: g.z + 0.6 * Math.sin(yaw), yaw: yaw + Math.PI / 2 }, [[-1.1, 0.55], [-1.2, 0.05], [-0.3, -0.12], [0.9, -0.08], [1.25, 0.55]], 1.2, C.hullShade, C.hull);
  b.box({ x: g.x, y: y + 0.4, z: g.z, yaw }, [1.0, 0.06, 0.25], C.wood);
}

/** L'ancre à jas (Numbers), couchée contre le mur est de la station : la verge, le jas en travers, les deux bras. */
function anchor(b: FacetBuilder, g: Vec3): void {
  const y = g.y + 0.1;
  b.beam({ x: g.x, y, z: g.z - 0.9 }, { x: g.x, y, z: g.z + 0.9 }, 0.12, C.iron);
  b.beam({ x: g.x - 0.6, y: y + 0.02, z: g.z - 0.75 }, { x: g.x + 0.6, y: y + 0.02, z: g.z - 0.75 }, 0.1, C.iron);
  for (const side of [-1, 1]) b.beam({ x: g.x, y, z: g.z + 0.9 }, { x: g.x + side * 0.55, y, z: g.z + 0.45 }, 0.11, C.ironLight);
}

/** L'antenne (Ears) : un fil tendu entre deux mâts minces, aux deux bouts du faîtage, bien plus bas que les mâts. */
function antenna(b: FacetBuilder, c: Vec3): void {
  const H = BEACON_HOUSE;
  const top = c.y + H.wall + H.ridge + 1.1;
  const ends = [-1, 1].map((side) => ({ x: c.x + H.x + side * (H.w / 2 - 0.1), z: c.z + H.z }));
  for (const e of ends) b.beam({ x: e.x, y: c.y + H.wall + H.ridge - 0.2, z: e.z }, { x: e.x, y: top, z: e.z }, 0.07, C.pole);
  b.beam({ x: ends[0].x, y: top - 0.08, z: ends[0].z }, { x: ends[1].x, y: top - 0.08, z: ends[1].z }, 0.025, C.wire);
}

/** La chaîne lovée en trois tours entiers sur une palette (Signs) : la palette, trois anneaux de fer posés l'un sur l'autre. */
function coiledChain(b: FacetBuilder, g: Vec3): void {
  b.box({ x: g.x, y: g.y - 0.05, z: g.z, yaw: 0.2 }, [1.1, 0.16, 1.1], C.darkWood, C.wood);
  for (const [k, r] of [
    [0, 0.4],
    [1, 0.34],
    [2, 0.28],
  ] as const)
    b.band({ x: g.x, y: g.y + 0.11 + 0.08 * k, z: g.z, yaw: 0.3 * k }, r, 0.08, 8, k % 2 ? C.ironLight : C.iron);
}

/** Le perchoir de la sterne, vide (Famous people), au bout du ponton : un poteau et sa barre en travers. */
function perch(b: FacetBuilder, g: Vec3): void {
  b.beam({ x: g.x, y: g.y, z: g.z }, { x: g.x, y: g.y + 1.25, z: g.z }, 0.09, C.darkWood);
  b.beam({ x: g.x - 0.3, y: g.y + 1.2, z: g.z }, { x: g.x + 0.3, y: g.y + 1.2, z: g.z }, 0.06, C.wood);
}

/** Le plancher du ponton, au-dessus du centre du lieu (son dessus, comme le modèle le pose). */
function pontoonTop(): number {
  const c = placeById('beacons').center;
  const h0 = standingHeight(heightAt(c));
  const S = BEACON_SLIP;
  let top = -Infinity;
  for (const dx of [-PONTOON.w / 2, 0, PONTOON.w / 2]) for (const dz of [0, PONTOON.d / 2, PONTOON.d]) top = Math.max(top, standingHeight(heightAt({ x: c.x + S.x + dx, z: c.z + S.to + dz })) - h0);
  return top + PONTOON.lift;
}

export const BEACONS: PlaceArt = {
  role: 'Le pilote du chenal',
  model,
  traceStage: 2,
  // La scène : sur la cale, face à l'eau de la passe ; la station derrière la caméra (elle s'efface le temps de la
  // scénette), les mâts hors du cadre, à l'ouest (aucun dans le cadre : Numbers n'en compte aucun).
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: [4.6, 1.3], fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -2.6, dz: 0.25, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 2.6, dz: 0.25 },
    subject: { halfWidth: 3.7, bottom: -0.4, top: 3.0, depth: 0.3 },
    pitch: (18 * Math.PI) / 180,
  },
  // Le sol de la scène : les dalles de la cale, sur toute sa largeur, jusqu'au sol sous elle ; le pilote.
  decor(b, floor, at, sphere, body = true) {
    const F = SCENE_FLOOR;
    let low = floor.y;
    for (let dx = -F.half; dx <= F.half + 1e-6; dx += F.half / 2) for (const dz of [-F.depth / 2, 0, F.depth / 2]) low = Math.min(low, standingHeight(heightAt({ x: floor.x + dx, z: floor.z + dz })));
    const depth = floor.y - low + 0.3;
    b.box({ x: floor.x, y: floor.y - depth, z: floor.z }, [2 * F.half, depth, F.depth], C.stoneShade, C.stone);
    for (const dx of [-F.half / 2, F.half / 2]) b.box({ x: floor.x + dx, y: floor.y, z: floor.z }, [0.05, 0.01, F.depth], C.stoneShade);
    // Son modèle porte le filin sur l'épaule, comme le pion.
    if (body) pilote(b, at, sphere);
  },
  answer: {
    size: { height: TRESTLE.h + BUOY_TOP + BUOY.sunk + 0.3, half: TRESTLE.w / 2 + 0.04 },
    // Le parc à bouées, devant la cale (relecture de L9 : jamais d'eau posée sur l'herbe) : une bande de grève, et sur
    // elle, sous chaque bouée, son chevalet (dessiné avec la bouée).
    base(b, mid, y, z, span, s, ground) {
      shingle(b, mid, y, z, span, 1.0 * s, ground);
    },
    object(b, at, s, _i, _count, picked) {
      buoyOnTrestle(b, at, s, picked ? BUOY.tipped : 0);
    },
    // Après une bonne réponse, la bouée touchée reçoit son voyant : la boule monte sur sa tige, en un geste court (d'un coup
    // avec « Réduire les animations », la vue la pose), et reste jusqu'à l'item suivant.
    mark(at, s) {
      const top = { x: at.x, y: at.y + (TRESTLE.h + BUOY_TOP + BUOY.sunk + 0.15) * s, z: at.z };
      return { facets: buoyBall(s), from: { ...top, y: top.y - BALL_RISE * BUOY.rod * s }, to: top, arc: 0, stay: true };
    },
  },
  // Les missions en R : la cale seule, rien de l'item ; les bouées portent les réponses.
  rest() {},
  // Les missions en C : une seule bouée sur son chevalet, au milieu du plan des personnages (comme le témoin de la
  // Turbine) ; après une bonne réponse seulement, elle reçoit son voyant (le même geste qu'en R), qui reste jusqu'à
  // l'item suivant. Rien ne la borde : ce n'est pas une réponse à toucher.
  column(b, o, done) {
    const at = { x: o.x, y: o.y + SCENE_RISE, z: o.z + WITNESS_FRONT };
    buoyOnTrestle(b, at, 1);
    if (!done) return null;
    return BEACONS.answer!.mark!(at, 1);
  },
  traces: {
    hello: {
      at: BEACONS_TRACE_SPOTS.hello,
      lift: 0.6,
      draw: (b, c) => {
        const o = BEACONS_TRACE_SPOTS.hello;
        dinghy(b, groundOf(c, o.x, o.z));
      },
    },
    numbers: {
      at: BEACONS_TRACE_SPOTS.numbers,
      lift: 0.2,
      draw: (b, c) => {
        const o = BEACONS_TRACE_SPOTS.numbers;
        anchor(b, groundOf(c, o.x, o.z));
      },
    },
    'first-listening': { at: BEACONS_TRACE_SPOTS['first-listening'], lift: BEACON_HOUSE.wall + BEACON_HOUSE.ridge + 0.6, draw: (b, c) => antenna(b, c) },
    signs: {
      at: BEACONS_TRACE_SPOTS.signs,
      lift: 0.3,
      draw: (b, c) => {
        const o = BEACONS_TRACE_SPOTS.signs;
        coiledChain(b, groundOf(c, o.x, o.z));
      },
    },
    'famous-people': {
      at: BEACONS_TRACE_SPOTS['famous-people'],
      lift: 1,
      draw: (b, c) => {
        const o = BEACONS_TRACE_SPOTS['famous-people'];
        perch(b, { x: c.x + o.x, y: c.y + pontoonTop(), z: c.z + o.z });
      },
    },
  },
  // Kéo au retour : à l'est de la porte, sur l'herbe, hors du chemin.
  exit: { x: 1.6, z: 6.8 },
  hideInScenette: true,
};

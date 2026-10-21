// L'Oracle (GD-22, lot 13b ; intention du directeur artistique du 20 octobre 2026, partie 13b, J à Q, planche
// `selection-donjon-oracle` validée par le mainteneur, rangées 3 et 4) : « une grotte où les Passeurs ont peint les récits
// des premières cités ». Le cœur, sans figure : la paroi peinte au fond d'un large abri sous roche, et son bassin d'eau
// calme. Autour : la paroi de roche grise moussue, basse (4,5 au plus, la même pierre que le piton du Donjon : de la
// porte, la tour se voit au-dessus d'elle), la bouche en arche à facettes (6 de large, 3,4 de haut, 5 de profondeur), le
// porche de bois à l'entrée de la bouche, le cercle des conteurs et le parvis devant. Le fond de l'abri est clair, jamais
// un trou sombre. La paroi peinte : de grands panneaux d'aplats (terre de sienne, vert-de-gris, bleu fumé, crème) sur le
// fond et les deux retours, une frise de losanges sur le fond et de lignes ondulées sur les retours ; ni lettre, ni chiffre,
// ni figure, ni motif propre à Rome ou à la Grèce. Le signe de l'absence (le miroir parti) : sur la face de la paroi, à
// droite de la bouche, l'empreinte de la pièce prise, son trou rond brun sombre dans son tiers haut et ses quatre goujons
// de fer aux coins (la solution de l'Auberge et du Donjon) ; il ne change jamais.
//
// La ruine : tout est là, tombé ou cassé, jamais un chantier. Les panneaux pâlis, trois grands éclats d'enduit peint
// tombés, appuyés ou à terre ; le bassin sec, fendu ; le porche tombé en avant devant la bouche (les deux montants couchés
// à plat, parallèles, le linteau en trois morceaux au bout, rien de debout ni de croisé) ; le cercle des six sièges, quatre debout, deux
// couchés sur le côté, autour de son disque de dalles fendu. Une seule lumière, celle du conteur, sur sa perche à droite
// de la bouche. Trois parties, celles de l'option choisie (le corps, le haut, les abords ; en grec, tant que l'alphabet
// attend sa police, le haut et les abords ensemble : ./parts.ts) ; une trace par rang de mission, la même pour le latin
// et le grec (`la-<rang>`, `gr-<rang>`, comme l'Auberge pour l'espagnol et l'allemand) : la natte et le tabouret (le
// corps), le coffre ouvert et ses rouleaux (le haut), la cruche (les abords). La grotte ne dit jamais l'option. Rien ne
// bouge, rien à lire dans la 3D, rien de croisé. Code pur (placeArt.ts).
import type { Stage } from './construction';
import { DONJON_LAYOUT } from './donjon5e';
import { drawPosed, FacetBuilder } from './facets';
import { dryBush } from './fumerolles5e';
import type { Vec2, Vec3 } from './geometry';
import { lowRock } from './monteeSurroundings';
import { RIBBON_LIFT } from './paths';
import { CAUSEWAY_5E } from './paths5e';
import type { AddPiece, PlaceArt, SiteGround, Sphere } from './placeArt';
import { COLORS_5E, PATH_NODES_5E, PLACES_5E } from './plan5e';
import { standingHeight } from './terrain';
import { heightAt5e } from './terrain5e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter (places.ts). */
const SINK = -0.8;

/**
 * Les couleurs de l'Oracle : la pierre grise moussue du plateau (la paroi, comme le piton du Donjon), la pierre claire du
 * dedans de l'abri (le fond, les retours, le plafond : un abri clair, jamais un trou sombre), le sol de l'abri ; les
 * panneaux peints, ravivés et pâlis (des aplats sourds, jamais saturés au soleil : un test calcule leur couleur rendue) ;
 * l'eau calme du bassin, mate ; les dalles chaudes du parvis et du disque, et leurs joints ; le bois des Passeurs, le fer,
 * le bronze des seules ferrures, le vert-de-gris des racines du linteau ; le dedans du trou, brun très sombre, jamais
 * noir. La seule lumière, l'ocre des lanternes.
 */
const C = {
  stone: COLORS_5E.stone,
  stoneSun: COLORS_5E.stoneSun,
  stoneShade: COLORS_5E.stoneShade,
  moss: COLORS_5E.plateauMoss,
  /** Le dedans de l'abri : le fond et les retours sous la peinture. */
  inner: 0xc2bbab,
  /**
   * Le plafond, plus clair que le fond : tourné vers le bas, il ne reçoit que le ciel renvoyé et se rend un cran plus
   * sombre que lui (#837B5A environ sous la lumière du 5e ; #B4AE9F se rendait en olive sombre, #625C3E, vu de dos).
   */
  ceiling: 0xe0d8c6,
  floor: 0xc4b9a2,
  floorSide: 0xa69c88,
  // Les panneaux ravivés : terre de sienne, vert-de-gris, bleu fumé, crème.
  sienna: 0x9a887a,
  verdigrisPaint: 0x7fa094,
  smoke: 0x7f91a0,
  cream: 0xdcd2bc,
  // Les mêmes, pâlis (la ruine) : à mi-chemin du dedans clair de l'abri.
  siennaPale: 0xb6a89c,
  verdigrisPale: 0xa3b0a8,
  smokePale: 0xa6adb2,
  creamPale: 0xd3cdbf,
  water: COLORS_5E.waterShallow,
  /** Le fond du bassin sec, et sa fente. */
  dryBed: 0x9e9888,
  crack: 0x5f635d,
  slab: CAUSEWAY_5E.slab,
  slabShade: 0xb3ab9a,
  slabWorn: 0xbcb4a2,
  line: CAUSEWAY_5E.line,
  newWood: 0xa68672,
  newShade: 0x8c766a,
  wornWood: 0x9f9279,
  wornShade: 0x86775f,
  verdigris: 0x6f9a8a,
  iron: 0x6f6a60,
  bronze: 0xb8954f,
  inside: 0x3a312c,
  /** L'empreinte du miroir pris, sur la paroi : la teinte de la roche, à peine moins passée. */
  markStone: 0x939890,
  lantern: COLORS_5E.lantern,
  // Les traces : le roseau de la natte et ses brins, le bois du tabouret et du coffre, la peau des rouleaux et leur
  // cordelette, la terre claire de la cruche (jamais le grès gris-brun de la jarre des Terrasses), son bouchon.
  reed: 0xb7a27a,
  reedLine: 0x9c8862,
  hide: 0xd6c4a2,
  cord: 0x7a6650,
  clay: 0xd9c6a5,
  clayShade: 0xc2ae8c,
  cork: 0x8c766a,
  // Le conteur, en pion (son modèle 3D prend sa place, ./habitants.ts) : manteau bleu foncé, écharpe sourde, cheveux blancs.
  boots: 0x4a3f36,
  coat: 0x2f4a66,
  scarf: 0xb8693e,
  skin: 0xd9a77f,
  hair: 0xe8e4da,
  // Les lampes à huile des réponses : l'argile gris-brun, éteintes, jamais d'ocre.
  lamp: 0x8c7a66,
  lampTop: 0x9a8874,
} as const;

// ---------- Le repère du lieu ----------

/** Le centre du lieu et le sol sous lui, dans le monde. */
const CENTER: Vec2 = PLACES_5E.find((p) => p.id === 'oracle')!.center;
const H0 = standingHeight(heightAt5e(CENTER));

/** Le sol du 5e sous un point du repère du lieu, depuis le sol de son centre (comme `SiteGround.at`). */
const localGround = (lx: number, lz: number): number => standingHeight(heightAt5e({ x: CENTER.x + lx, z: CENTER.z + lz })) - H0;

/** La porte du lieu (le nœud du chemin), depuis son centre : au sud-est, au bout de la chaussée d'`aig-2`. */
const DOOR_AT: Vec2 = (() => {
  const n = PATH_NODES_5E.find((p) => p.id === 'oracle')!.at;
  return { x: n.x - CENTER.x, z: n.z - CENTER.z };
})();

/**
 * L'abri sous roche, dans la paroi : sa bouche de `x0` à `x1`, dans la face de la paroi (`z1`) ; son fond en `z0` (5 de
 * profondeur) ; ses retours droits jusqu'à `spring` (au-dessus de la frise peinte), puis l'arche à facettes jusqu'à
 * `high` (3,4) : deux pans de chaque côté, le premier jusqu'à `knee` (en retrait de `knee[0]`, à la hauteur `knee[1]`),
 * le second jusqu'au haut, à `chamfer` du retour, qui se lisent du cap. Hauteurs depuis le sol de l'abri, au droit de
 * la bouche.
 */
const ABRI = { x0: -3, x1: 3, z0: -6, z1: -1, spring: 2.4, knee: [0.7, 2.98], high: 3.4, chamfer: 2.1 } as const;

/**
 * Le parvis de dalles, devant la paroi : de `x0` à `x1`, de `z0` (au pied de la paroi) à `z1`, son bord sud, juste au nord
 * de la porte du lieu : la chaussée d'`aig-2` y arrive par l'est et devient sa dalle. Le sol de l'abri le prolonge sous la
 * roche, au même plan.
 */
const PARVIS = { x0: -7.6, x1: 6.8, z0: -1.0, z1: DOOR_AT.z - 0.4 } as const;

/**
 * Le dessus du parvis (comme la cour du Donjon : « dans une cour, la chaussée devient la dalle sans marche ») : un plan qui
 * passe par le disque de la chaussée au bord sud du parvis, droit au nord de la porte (le plateau y est bombé : un plan
 * ajusté au sol puis levé laisserait une marche), et qui suit la pente du plateau sous lui et sous l'abri au plus près,
 * sans jamais passer sous lui (`clear`). Ses pentes `kx` et `kz`, cherchées sur une grille, puis affinées ; `y` en
 * x = z = 0.
 */
const PARVIS_PLANE = (() => {
  const clear = 0.01;
  const pts: [number, number, number][] = [];
  for (let x = PARVIS.x0; x <= PARVIS.x1 + 1e-6; x += 0.8) for (let z = ABRI.z0; z <= PARVIS.z1 + 1e-6; z += 0.6) pts.push([x, z, localGround(x, z)]);
  const pin = { x: DOOR_AT.x, z: PARVIS.z1, y: localGround(DOOR_AT.x, DOOR_AT.z) + RIBBON_LIFT };
  // L'écart au sol le plus grand, ou l'infini si le plan passe sous lui quelque part.
  const worst = (kx: number, kz: number) => {
    let hi = -Infinity;
    for (const [x, z, g] of pts) {
      const d = pin.y + kx * (x - pin.x) + kz * (z - pin.z) - g;
      if (d < clear) return Infinity;
      hi = Math.max(hi, d);
    }
    return hi;
  };
  let best = { kx: 0, kz: 0, e: Infinity };
  for (const [center, span, step] of [
    [{ kx: 0, kz: 0 }, 0.1, 0.004],
    [null, 0.004, 0.0005],
  ] as const) {
    const c = center ?? best;
    for (let kx = c.kx - span; kx <= c.kx + span + 1e-9; kx += step)
      for (let kz = c.kz - span; kz <= c.kz + span + 1e-9; kz += step) {
        const e = worst(kx, kz);
        if (e < best.e) best = { kx, kz, e };
      }
  }
  return { y: pin.y - best.kx * pin.x - best.kz * pin.z, kx: best.kx, kz: best.kz };
})();

/** Le dessus du parvis et du sol de l'abri en (`x`, `z`), depuis le sol du centre du lieu. */
const parvisAt = (x: number, z: number): number => PARVIS_PLANE.y + PARVIS_PLANE.kx * x + PARVIS_PLANE.kz * z;

/** Le sol de l'abri, au droit de la bouche : le repère des hauteurs de la paroi. */
const AY = parvisAt(0, ABRI.z1);

/**
 * La paroi de roche, quatre masses à facettes autour de l'abri (le flanc ouest, le flanc est, la voûte, le revers) : les
 * coins de chacune au sol, dans le sens inverse des aiguilles d'une montre vu du ciel, en partant du sud-ouest, et leur
 * dessus, depuis le sol de l'abri ; 4,5 au plus, la voûte la plus haute, la paroi qui s'abaisse vers le nord et vers ses
 * bouts (de la cour du Donjon, on la voit basse, en contrebas). Une roche, pas un mur (relecture du directeur artistique
 * du 21 octobre 2026) : chaque face penche vers l'arrière et se casse une fois en hauteur (`lean` : le retrait de son
 * dessus vers le milieu de la masse ; le pli, à mi-hauteur, en retire le cinquième), et la crête au-dessus de la bouche
 * monte et descend (deux coins de plus sur la face de la voûte). Les coins posés sur le bord de l'abri ne penchent pas
 * (`lean` nul) : le côté de chaque flanc qui le borde (`inner`) est le retour peint, dessiné à part, droit.
 */
const WALL_TOP = 4.5;
const ROCKS = {
  west: { corners: [[-7.9, -2.6], [-6.0, -1.5], [ABRI.x0, ABRI.z1], [ABRI.x0, -8], [-5.6, -7.8], [-7.6, -6.0]], tops: [2.6, 3.7, 4.3, 3.0, 2.0, 1.4], lean: [0.8, 1.2, 0, 0, 0.6, 0.6], inner: 2 },
  east: { corners: [[ABRI.x1, ABRI.z1], [5.9, -1.3], [7.9, -2.5], [7.5, -6.0], [5.8, -7.6], [ABRI.x1, -8]], tops: [4.4, 3.9, 2.8, 1.5, 1.9, 3.1], lean: [0, 1.2, 0.8, 0.6, 0.6, 0], inner: 5 },
  vault: {
    corners: [[ABRI.x0, ABRI.z1], [-0.9, ABRI.z1], [1.2, ABRI.z1], [ABRI.x1, ABRI.z1], [ABRI.x1, ABRI.z0], [ABRI.x0, ABRI.z0]],
    tops: [4.0, WALL_TOP, 3.85, 4.3, 3.6, 3.7],
    lean: [0.35, 0.6, 0.5, 0.35, 0, 0],
  },
  back: { corners: [[ABRI.x0, ABRI.z0], [ABRI.x1, ABRI.z0], [ABRI.x1, -8], [ABRI.x0, -8]], tops: [ABRI.high, ABRI.high, 2.6, 2.7], lean: [0, 0, 0.5, 0.5] },
} as const;

/** Les faces de la paroi tournées vers le parvis, de part et d'autre de la bouche : leurs deux bouts au sol. */
const FRONTS = {
  west: [ROCKS.west.corners[0], ROCKS.west.corners[1], ROCKS.west.corners[2]],
  east: [ROCKS.east.corners[0], ROCKS.east.corners[1], ROCKS.east.corners[2]],
} as const;

/**
 * La peinture : la frise en haut (de `band0` à `band1`), les panneaux dessous (depuis `panel0`), tous sous la naissance de
 * l'arche ; les panneaux du fond (bords en x) et de chaque retour (bords en z, du fond vers la bouche), chacun sa couleur ;
 * les losanges de la frise du fond (`diamond`, leur demi-diagonale, leur pas), l'onde des retours (`wave`, son pas, son
 * amplitude, son épaisseur).
 */
const PAINT = {
  panel0: 0.25,
  band0: 1.95,
  band1: 2.35,
  back: [-3, -1.6, -0.1, 1.4, 3],
  backColors: ['sienna', 'verdigris', 'cream', 'smoke'],
  sides: [-6, -3.5, -1],
  westColors: ['smoke', 'sienna'],
  eastColors: ['sienna', 'verdigris'],
  diamond: { half: 0.14, step: 0.74 },
  wave: { step: 0.625, amp: 0.07, thick: 0.06 },
} as const;
type Paint = (typeof PAINT.backColors)[number];
const LIVELY: Record<Paint, number> = { sienna: C.sienna, verdigris: C.verdigrisPaint, smoke: C.smoke, cream: C.cream };
const PALE: Record<Paint, number> = { sienna: C.siennaPale, verdigris: C.verdigrisPale, smoke: C.smokePale, cream: C.creamPale };

/** Le bassin rond, de pierre, à hauteur de genou, dans l'abri au pied du fond : son milieu, ses rayons, sa hauteur ; l'eau. */
const BASIN = { x: -1.6, z: -4.85, r0: 0.6, r1: 0.82, h: 0.5, water: 0.4, sides: 8 } as const;

/**
 * Le porche de bois, à l'entrée de la bouche, sans estrade ni marche ni jambe de force : deux montants droits (`x` de part
 * et d'autre, plantés au sol du seuil en `z`, leur section, leur hauteur), le linteau de 6,4 de large à la bande de
 * racines ; la lanterne pendue sous le linteau, à l'est du milieu.
 */
const PORCH = { x: 2.75, z: -0.5, post: 0.3, h: 3.3, lintel: 0.36, span: 6.4, depth: 0.3, lanternX: 1.3 } as const;

/**
 * Le porche tombé de la ruine, en avant de la bouche : les deux montants couchés du nord au sud (leur `x`, leur biais), de
 * section `post`, leur milieu en `postZ` ; le linteau en trois morceaux au bout (milieu, longueur, biais, bande de racines).
 */
const FALLEN_PORCH = {
  post: 0.36,
  postZ: 1.75,
  posts: [
    [-1.0, 0.04],
    [2.3, -0.05],
  ],
  lintel: [
    [-0.25, 3.9, 1.6, 0.07, false],
    [1.45, 3.95, 1.4, -0.09, true],
    [2.95, 4.1, 1.2, 0.16, false],
  ],
} as const;

/**
 * Le cercle des conteurs, au sud-ouest du parvis, à l'écart de la chaussée qui arrive de l'est : six sièges de pierre bas,
 * au dessus plat, en fer à cheval ouvert au sud (leurs angles depuis le nord, en degrés) autour d'un disque de dalles ;
 * dans la ruine, deux sièges couchés sur le côté (`fallen`).
 */
const CIRCLE = { x: -4.0, z: 3.3, r: 2.3, disc: 1.45, seats: [-100, -60, -20, 20, 60, 100], seat: [0.75, 0.42, 0.5], fallen: [1, 4] } as const;

/** La perche du conteur, à droite de la bouche, et sa lanterne (`lantern` : son échelle). */
const PERCH = { x: 3.75, z: -0.45, h: 2.3, arm: 0.42, lantern: 1.45 } as const;

/**
 * Le signe de l'absence, sur la face de la paroi à droite de la bouche, plus loin que la perche (`u` : sa part de la
 * face, du bord de la bouche vers l'est), sous le pli de la face ; comme au Donjon (`PILLAR`, ./donjon5e.ts) et à
 * l'Auberge : l'empreinte de la pièce prise, un aplat debout (`mark` × `markH`, son milieu à `y`), étroit et de la teinte
 * de la paroi (de loin, seul le trou est sombre : jamais deux yeux sur un ovale clair), le trou rond (rayon `r`) dans son
 * tiers haut (`hole` au-dessus du milieu de l'aplat), les quatre goujons de fer (`stud`) aux quatre coins, à `inset` du
 * bord, les mêmes qu'au Donjon.
 */
const MARK = { u: 0.72, y: 1.45, mark: 0.28, markH: 0.56, r: 0.075, hole: 0.13, inset: 0.04, stud: 0.06 } as const;

/** La lanterne sur piquet en tête du parvis, à l'est, du côté où arrive la chaussée. */
const PARVIS_LANTERN = { x: 5.4, z: 5.6, h: 1.45 } as const;

/** Le recul de la caméra à la porte, en part de sa distance à Kéo (`PlaceArt.arrivalView`) : comme le Donjon. */
const ARRIVAL_BACK = 1.4;

/**
 * Le cap de la caméra à la porte (`PlaceArt.doorView`) : la porte est à 3 à l'est de la bouche ; au cap nord, en 390 × 844,
 * le pied ouest de la bouche sortait du cadre. Tournée de 0,2 (11°) vers l'ouest, presque de face, elle garde la bouche
 * entière, la tour du Donjon au-dessus et Kéo au milieu.
 */
const DOOR_VIEW = 0.2;

/**
 * Le haut de la tour du Donjon, depuis le centre de l'Oracle et le sol sous lui (sa face sud, au-dessus de la bouche) : le
 * regard de « Y aller » à l'Oracle se lève jusqu'à elle (intention, N : « la tour du Donjon au-dessus de la paroi, dans le
 * tiers haut de l'image »). Le haut du parapet restauré : la tour en ruine, coupée plus bas, a plus de ciel au-dessus.
 */
const DONJON_TOWER_TOP = (() => {
  const d = PLACES_5E.find((p) => p.id === 'donjon')!.center;
  const T = DONJON_LAYOUT.tower;
  return {
    look: { x: d.x + T.x - CENTER.x, z: d.z + T.z + T.half + T.over - CENTER.z },
    top: DONJON_LAYOUT.heightAtCenter + DONJON_LAYOUT.courTop + T.top - H0,
  };
})();

/**
 * Les trois éclats d'enduit peint de la ruine, tombés de la paroi peinte : grands (près d'un pas de large), de contour
 * irrégulier (jamais un rectangle : une tablette se lirait comme un écrit), dans les couleurs pâlies des panneaux ; l'un
 * appuyé contre le bassin, l'un contre le pied du fond, le dernier à terre, un bord soulevé. Leur pied à `x`, `z` ; tournés
 * de `yaw` (0 : face au sud) ; basculés de `pitch` (0 : debout ; −π/2 : à plat) ; leur contour, du pied vers le haut.
 */
const SHARDS = [
  { x: -0.4, z: -4.7, yaw: Math.PI / 2 - 0.25, pitch: -0.62, paint: 'sienna', outline: [[-0.44, 0], [0.32, 0.03], [0.52, 0.3], [0.38, 0.68], [-0.06, 0.8], [-0.5, 0.44]] },
  { x: 1.45, z: -5.6, yaw: -0.55, pitch: -0.36, paint: 'verdigris', outline: [[-0.5, 0.02], [0.4, 0], [0.54, 0.46], [0.22, 0.86], [-0.32, 0.74], [-0.57, 0.36]] },
  { x: 0.55, z: -3.85, yaw: 0.6, pitch: -Math.PI / 2 + 0.28, paint: 'smoke', outline: [[-0.42, 0], [0.46, 0.06], [0.58, 0.5], [0.1, 0.74], [-0.48, 0.46]] },
] as const satisfies readonly { x: number; z: number; yaw: number; pitch: number; paint: Paint; outline: readonly (readonly [number, number])[] }[];

// ---------- Les petits volumes ----------

type Point = readonly [number, number, number];

/** Une masse de roche : ses coins au sol, leur dessus et leur retrait (`ROCKS`). */
interface Rock {
  readonly corners: readonly (readonly number[])[];
  readonly tops: readonly number[];
  readonly lean: readonly number[];
}

/** Le pli d'une face de roche, en part de sa hauteur depuis son pied, coin par coin : jamais à la même hauteur partout. */
const foldOf = (k: number): number => (k % 2 ? 0.62 : 0.54);

/**
 * Les trois anneaux d'une masse de roche, depuis le sol de l'abri : son pied (`bottom`), son pli (à `foldOf` de sa
 * hauteur, retiré du cinquième de `lean`) et son dessus (retiré de `lean`), chaque coin retiré vers le milieu de la masse
 * vu du ciel.
 */
function rockRings(rock: Rock, bottom: number): { lo: Point[]; mid: Point[]; hi: Point[] } {
  const n = rock.corners.length;
  const cx = rock.corners.reduce((a, [x]) => a + x, 0) / n;
  const cz = rock.corners.reduce((a, [, z]) => a + z, 0) / n;
  const toward = (k: number, d: number): [number, number] => {
    const [x, z] = rock.corners[k];
    const l = Math.hypot(cx - x, cz - z) || 1;
    return [x + ((cx - x) / l) * d, z + ((cz - z) / l) * d];
  };
  const lo = rock.corners.map(([x, z]): Point => [x, AY + bottom, z]);
  const mid = rock.corners.map((_, k): Point => {
    const [x, z] = toward(k, rock.lean[k] * 0.2);
    return [x, AY + bottom + (rock.tops[k] - bottom) * foldOf(k), z];
  });
  const hi = rock.corners.map((_, k): Point => {
    const [x, z] = toward(k, rock.lean[k]);
    return [x, AY + rock.tops[k], z];
  });
  return { lo, mid, hi };
}

/**
 * Une masse de roche à facettes : ses coins au sol (un polygone convexe, dans le sens inverse des aiguilles d'une montre
 * vu du ciel, en partant du sud-ouest), leur dessus et leur retrait (`rockRings`) ; chaque flanc penche et se casse une
 * fois en hauteur, ses facettes alternent la pierre au soleil et la pierre à l'ombre (jamais un seul ton par face) ; le
 * premier flanc, vers le parvis, tout de `south` s'il est donné (le fond de l'abri) ; son dessus de `top` (en éventail
 * depuis un sommet levé au milieu au-delà de quatre coins : une croupe à facettes), son dessous de `under` s'il se voit
 * (la voûte de l'abri) ; `skip` : les flancs cachés ou dessinés à part (le retour peint).
 */
function rockMass(b: FacetBuilder, rock: Rock, bottom: number, colors: { top: number; south?: number; under?: number; skip?: readonly number[] }): void {
  const n = rock.corners.length;
  const { lo, mid, hi } = rockRings(rock, bottom);
  if (n === 4) b.quad(hi[0], hi[1], hi[2], hi[3], colors.top);
  else {
    const apex: Point = [hi.reduce((s, p) => s + p[0], 0) / n, AY + rock.tops.reduce((s, t) => s + t, 0) / n + 0.35, hi.reduce((s, p) => s + p[2], 0) / n];
    for (let k = 0; k < n; k++) b.triangle(apex, hi[k], hi[(k + 1) % n], colors.top);
  }
  if (colors.under !== undefined) for (let k = 1; k < n - 1; k++) b.triangle(lo[0], lo[k + 1], lo[k], colors.under);
  for (let k = 0; k < n; k++) {
    if (colors.skip?.includes(k)) continue;
    const m = (k + 1) % n;
    const odd = k % 2 === 1;
    const plain = k === 0 ? colors.south : undefined;
    // Le pied : au soleil ou à l'ombre, puis la pierre ; le haut, penché : l'inverse. Une face sur deux, l'alternance tourne.
    b.triangle(lo[k], lo[m], mid[m], plain ?? (odd ? C.stoneShade : C.stoneSun));
    b.triangle(lo[k], mid[m], mid[k], plain ?? C.stone);
    b.triangle(mid[k], mid[m], hi[m], plain ?? (odd ? C.stoneSun : C.stoneShade));
    b.triangle(mid[k], hi[m], hi[k], plain ?? C.stone);
  }
}

/** Un aplat rectangulaire sur une face verticale : tourné vers le sud (`yaw` 0), l'est (π/2), l'ouest (−π/2). */
function facePlate(b: FacetBuilder, at: Vec3, yaw: number, w: number, h: number, color: number): void {
  b.plate(
    { ...at, yaw },
    [
      [-w / 2, 0],
      [w / 2, 0],
      [w / 2, h],
      [-w / 2, h],
    ],
    color,
  );
}

/**
 * Une lanterne pendue (sa vitre, un pavé : dix triangles ; son chapeau de bronze en pointe), allumée, à l'échelle `k`
 * (celle du conteur, plus grande : de « Y aller », elle tire l'œil vers la bouche avant la tour du Donjon).
 */
function lantern(b: FacetBuilder, top: Vec3, k = 1): void {
  b.box({ x: top.x, y: top.y - 0.34 * k, z: top.z }, [0.24 * k, 0.3 * k, 0.24 * k], C.lantern);
  b.prism({ x: top.x, y: top.y - 0.04 * k, z: top.z, yaw: Math.PI / 4 }, 0.21 * k, 0, 0.16 * k, 4, C.bronze);
}

/**
 * Une dalle sur le plan du parvis, de `x0` à `x1` et de `z0` à `z1` : son dessus `dy` plus haut que le plan, ses flancs
 * jusque sous le sol. Dix triangles.
 */
function slab(b: FacetBuilder, x0: number, x1: number, z0: number, z1: number, dy: number, side: number, top: number): void {
  const v = (x: number, z: number, up: boolean) => [x, parvisAt(x, z) + (up ? dy : SINK), z] as const;
  b.quad(v(x0, z1, true), v(x1, z1, true), v(x1, z0, true), v(x0, z0, true), top);
  b.quad(v(x0, z1, false), v(x1, z1, false), v(x1, z1, true), v(x0, z1, true), side);
  b.quad(v(x1, z0, false), v(x0, z0, false), v(x0, z0, true), v(x1, z0, true), side);
  b.quad(v(x1, z1, false), v(x1, z0, false), v(x1, z0, true), v(x1, z1, true), side);
  b.quad(v(x0, z0, false), v(x0, z1, false), v(x0, z1, true), v(x0, z0, true), side);
}

/** Un joint sur le parvis, large de 0,06 : en long, de `x0` à `x1` (`z0` = `z1`), ou en travers, du sud (`z0`) au nord (`z1`). */
function parvisJoint(b: FacetBuilder, x0: number, z0: number, x1: number, z1: number): void {
  const v = (x: number, z: number) => [x, parvisAt(x, z) + 0.012, z] as const;
  if (z0 === z1) b.quad(v(x0, z0 + 0.03), v(x1, z0 + 0.03), v(x1, z0 - 0.03), v(x0, z0 - 0.03), C.line);
  else b.quad(v(x0 - 0.03, z0), v(x0 + 0.03, z0), v(x1 + 0.03, z1), v(x1 - 0.03, z1), C.line);
}

/**
 * La paroi : les quatre masses de roche autour de l'abri, la face sud de la voûte au-dessus de la bouche, l'arche à deux
 * pans de chaque côté ; le dedans de l'abri en pierre claire (le fond, les retours, le plafond), jamais un trou sombre.
 */
function wall(b: FacetBuilder): void {
  const R = ROCKS;
  // Les deux flancs ; leur côté vers l'abri est son retour, en pierre claire jusqu'au plafond, en roche au-dessus.
  rockMass(b, R.west, SINK, { top: C.moss, skip: [R.west.inner] });
  rockMass(b, R.east, SINK, { top: C.moss, skip: [R.east.inner] });
  const inner = (x: number, zA: number, zB: number, tA: number, tB: number) => {
    const [cA, cB] = [Math.min(tA, ABRI.high), Math.min(tB, ABRI.high)];
    b.quad([x, AY + SINK, zA], [x, AY + SINK, zB], [x, AY + cB, zB], [x, AY + cA, zA], C.inner);
    if (tA > ABRI.high || tB > ABRI.high) b.quad([x, AY + cA, zA], [x, AY + cB, zB], [x, AY + Math.max(tB, cB), zB], [x, AY + Math.max(tA, cA), zA], C.stoneShade);
  };
  inner(ABRI.x0, ABRI.z1, -8, R.west.tops[R.west.inner], R.west.tops[R.west.inner + 1]);
  inner(ABRI.x1, -8, ABRI.z1, R.east.tops[R.east.inner], R.east.tops[0]);
  // La voûte, posée sur les retours : son dessous est le plafond de l'abri.
  rockMass(b, R.vault, ABRI.high, { top: C.moss, under: C.ceiling });
  // Le revers, derrière le fond : sa face sud est le fond de l'abri.
  rockMass(b, R.back, SINK, { top: C.moss, south: C.inner, skip: [1, 3] });
  // L'arche, de la naissance au haut de la bouche, sur toute la profondeur de l'abri : deux pans de chaque côté (le
  // profil, depuis le coin du retour sous le haut, dans le sens inverse des aiguilles d'une montre vu du sud) ; leur
  // dessous clair comme le plafond, leur face de roche : le contour de la bouche se lit du cap.
  const A = ABRI;
  const [kx, ky] = A.knee;
  b.extrude({ x: 0, y: AY, z: A.z0 }, [[A.x0, A.high], [A.x0, A.spring], [A.x0 + kx, ky], [A.x0 + A.chamfer, A.high]], A.z1 - A.z0, C.ceiling, C.stone);
  b.extrude({ x: 0, y: AY, z: A.z0 }, [[A.x1, A.high], [A.x1 - A.chamfer, A.high], [A.x1 - kx, ky], [A.x1, A.spring]], A.z1 - A.z0, C.ceiling, C.stone);
  // Le sol de l'abri, au plan du parvis.
  slab(b, A.x0, A.x1, A.z0, A.z1, 0, C.floorSide, C.floor);
}

/**
 * La paroi peinte, ravivée ou pâlie : les panneaux du fond et des deux retours, la frise crème au-dessus, ses losanges au
 * fond et son onde sur les retours. Aucune lettre, aucun chiffre, aucune figure.
 */
function paintings(b: FacetBuilder, palette: Record<Paint, number>): void {
  const P = PAINT;
  const y0 = AY + P.panel0;
  const h = P.band0 - P.panel0;
  // Le fond, tourné vers le sud.
  const zb = ABRI.z0 + 0.012;
  for (let k = 0; k < P.backColors.length; k++) facePlate(b, { x: (P.back[k] + P.back[k + 1]) / 2, y: y0, z: zb }, 0, P.back[k + 1] - P.back[k] - 0.06, h, palette[P.backColors[k]]);
  facePlate(b, { x: 0, y: AY + P.band0, z: zb }, 0, ABRI.x1 - ABRI.x0 - 0.06, P.band1 - P.band0, palette.cream);
  const yd = AY + (P.band0 + P.band1) / 2;
  const n = Math.floor((ABRI.x1 - ABRI.x0 - 0.4) / P.diamond.step);
  for (let k = 0; k <= n; k++) {
    const x = -(n * P.diamond.step) / 2 + k * P.diamond.step;
    const d = P.diamond.half;
    b.plate({ x, y: yd, z: zb + 0.006 }, [[0, -d], [d, 0], [0, d], [-d, 0]], palette.sienna);
  }
  // Les retours : l'ouest tourné vers l'est, l'est vers l'ouest ; leurs panneaux du fond vers la bouche.
  for (const [x, yaw, colors] of [
    [ABRI.x0 + 0.012, Math.PI / 2, P.westColors],
    [ABRI.x1 - 0.012, -Math.PI / 2, P.eastColors],
  ] as const) {
    for (let k = 0; k < colors.length; k++) facePlate(b, { x, y: y0, z: (P.sides[k] + P.sides[k + 1]) / 2 }, yaw, P.sides[k + 1] - P.sides[k] - 0.06, h, palette[colors[k]]);
    facePlate(b, { x, y: AY + P.band0, z: (ABRI.z0 + ABRI.z1) / 2 }, yaw, ABRI.z1 - ABRI.z0 - 0.06, P.band1 - P.band0, palette.cream);
    // L'onde : une ligne brisée douce, d'un bout à l'autre du retour.
    const W = P.wave;
    const xs = x + (yaw > 0 ? 0.006 : -0.006);
    const steps = Math.round((ABRI.z1 - ABRI.z0 - 0.3) / W.step);
    const at = (k: number) => [ABRI.z0 + 0.15 + k * W.step, yd + (k % 2 ? W.amp : -W.amp)] as const;
    for (let k = 0; k < steps; k++) {
      const [za, ya] = at(k);
      const [zc, yc] = at(k + 1);
      const t = W.thick / 2;
      // Vu de l'abri : la droite est vers le fond (−z) sur le retour ouest, vers la bouche (+z) sur le retour est.
      if (yaw > 0) b.quad([xs, yc - t, zc], [xs, ya - t, za], [xs, ya + t, za], [xs, yc + t, zc], palette.verdigris);
      else b.quad([xs, ya - t, za], [xs, yc - t, zc], [xs, yc + t, zc], [xs, ya + t, za], palette.verdigris);
    }
  }
}

/** Le bassin rond, de pierre : son bord, son dedans et son fond ; sec dans la ruine (le fond nu et la fente), plein ensuite. */
function basin(b: FacetBuilder): void {
  const B = BASIN;
  const y = parvisAt(B.x, B.z);
  b.band({ x: B.x, y: y + SINK, z: B.z }, B.r1, B.h - SINK, B.sides, C.stone);
  b.annulus({ x: B.x, y: y + B.h, z: B.z }, B.r0, B.r1, 0, B.sides, C.stone, C.stoneSun, false);
  // Le dedans, tourné vers le milieu : un cerclage retourné.
  const ring = (r: number, h: number): Point[] => Array.from({ length: B.sides }, (_, k) => [B.x + r * Math.cos((2 * Math.PI * k) / B.sides), y + h, B.z + r * Math.sin((2 * Math.PI * k) / B.sides)]);
  const lo = ring(B.r0, 0.12);
  const hi = ring(B.r0, B.h);
  for (let k = 0; k < B.sides; k++) {
    const n = (k + 1) % B.sides;
    b.quad(lo[k], lo[n], hi[n], hi[k], C.stoneShade);
  }
  b.plate({ x: B.x, y: y + 0.12, z: B.z, pitch: -Math.PI / 2 }, Array.from({ length: B.sides }, (_, k) => [B.r0 * Math.cos((2 * Math.PI * k) / B.sides), B.r0 * Math.sin((2 * Math.PI * k) / B.sides)] as const), C.dryBed);
}

/** Les rayons d'une pièce au sol, autour de la verticale : pour placer les sièges tournés vers le milieu du cercle. */
const seatAt = (deg: number): { x: number; z: number; yaw: number } => {
  const a = (deg * Math.PI) / 180;
  return { x: CIRCLE.x + CIRCLE.r * Math.sin(a), z: CIRCLE.z - CIRCLE.r * Math.cos(a), yaw: -a };
};

/**
 * Le cercle des conteurs : six sièges de pierre bas, distincts, au dessus plat, en fer à cheval ouvert au sud, autour du
 * disque de dalles (jamais de rayons ni de cercles concentriques) ; `worn` : deux sièges couchés sur le côté, le disque
 * usé et fendu d'une seule fente, hors du milieu.
 */
function circle(b: FacetBuilder, worn: boolean): void {
  const K = CIRCLE;
  const [w, h, d] = K.seat;
  K.seats.forEach((deg, i) => {
    const s = seatAt(deg);
    const y = parvisAt(s.x, s.z);
    if (worn && (K.fallen as readonly number[]).includes(i)) {
      // Couché sur le côté, un peu plus loin du milieu : son dessus regarde le dehors.
      const a = (deg * Math.PI) / 180;
      b.box({ x: s.x + 0.35 * Math.sin(a), y: y - 0.1, z: s.z - 0.35 * Math.cos(a), yaw: s.yaw + 0.25 }, [w, d, h], C.stoneShade, C.stone);
    } else b.box({ x: s.x, y: y + SINK, z: s.z, yaw: s.yaw }, [w, h - SINK, d], C.stone, C.stoneSun);
  });
  const y = parvisAt(K.x, K.z);
  b.prism({ x: K.x, y: y + SINK, z: K.z, yaw: 0.2 }, K.disc, K.disc, 0.06 - SINK + (worn ? -0.03 : 0.02), 10, C.slabShade, worn ? C.slabWorn : C.slab);
  if (!worn) return;
  // La fente : une seule, en biais, d'un bord du disque vers l'autre, à l'écart du milieu (jamais un rayon).
  const top = y + 0.06 - 0.03 + 0.012;
  b.quad([K.x - 1.1, top, K.z + 0.55], [K.x + 0.9, top, K.z + 0.95], [K.x + 0.9, top, K.z + 0.89], [K.x - 1.1, top, K.z + 0.49], C.crack);
}

/** Le signe de l'absence, sur la face de la paroi à droite de la bouche : l'empreinte, son trou dans son tiers haut, ses goujons aux coins. */
function mirrorMark(b: FacetBuilder): void {
  const M = MARK;
  const [[ax, az], [bx, bz]] = [FRONTS.east[0], FRONTS.east[1]];
  // La face de la paroi, tournée vers le sud et un peu vers l'est : la normale de l'aplat.
  const yaw = Math.atan2(az - bz, bx - ax);
  const [nx, nz] = [Math.sin(yaw), Math.cos(yaw)];
  // Sous le pli, la face penche : l'aplat suit sa pente (du pied au pli, à sa place `u`), un peu en avant d'elle.
  const { lo, mid } = rockRings(ROCKS.east, SINK);
  const at = (r: Point[]) => r[0].map((v, i) => v + (r[1][i] - v) * M.u);
  const [foot, fold] = [at(lo), at(mid)];
  const y = AY + M.y;
  const t = (y - foot[1]) / (fold[1] - foot[1]);
  const back = (foot[0] - fold[0]) * nx + (foot[2] - fold[2]) * nz;
  const x = foot[0] + (fold[0] - foot[0]) * t + nx * 0.02;
  const z = foot[2] + (fold[2] - foot[2]) * t + nz * 0.02;
  drawPosed(b, { x, y, z, yaw, pitch: -Math.atan2(back, fold[1] - foot[1]) }, (l) => {
    l.plate(
      { x: 0, y: 0, z: 0 },
      [
        [-M.mark / 2, -M.markH / 2],
        [M.mark / 2, -M.markH / 2],
        [M.mark / 2, M.markH / 2],
        [-M.mark / 2, M.markH / 2],
      ],
      C.markStone,
    );
    const hole = Array.from({ length: 8 }, (_, k) => [M.r * Math.cos((Math.PI * k) / 4), M.hole + M.r * Math.sin((Math.PI * k) / 4)] as const);
    l.plate({ x: 0, y: 0, z: 0.004 }, hole, C.inside);
    const dx = M.mark / 2 - M.inset;
    const dy = M.markH / 2 - M.inset;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) l.box({ x: sx * dx, y: sy * dy - M.stud / 2, z: 0.036 }, [M.stud, M.stud, 0.08], C.iron);
  });
}

/** Le motif des racines en vert-de-gris, sur la bande du linteau seulement : une onde, sans lettre ni chiffre. */
function roots(b: FacetBuilder, x0: number, x1: number, y: number, z: number): void {
  const n = 6;
  const pts = Array.from({ length: n + 1 }, (_, k) => [x0 + ((x1 - x0) * k) / n, y + (k % 2 ? 0.05 : -0.05)] as const);
  for (let k = 0; k < n; k++) {
    const [ax, ay] = pts[k];
    const [cx, cy] = pts[k + 1];
    b.quad([ax, ay - 0.035, z], [cx, cy - 0.035, z], [cx, cy + 0.035, z], [ax, ay + 0.035, z], C.verdigris);
  }
}

// ---------- Le modèle ----------

/**
 * Les volumes de l'Oracle, de la ruine aux abords (le modèle du lieu). `ground` : le sol sous un point du lieu ; sa porte
 * est au sud-est, au bout de la chaussée d'`aig-2`.
 */
function model(add: AddPiece, ground: SiteGround): void {
  const at = (x: number, z: number) => ground.at(x, z);
  const corps = { stage: 0 as Stage, row: 0 };
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };

  // Toujours là : la paroi et l'abri, le bassin (son eau vient avec le corps), le signe de l'absence ; la perche du
  // conteur et sa lanterne allumée dès la ruine (la seule) ; un buisson sec et un rocher qui cadre.
  add('ruine', 0, (b) => {
    wall(b);
    basin(b);
    mirrorMark(b);
    const py = parvisAt(PERCH.x, PERCH.z);
    b.box({ x: PERCH.x, y: py - 0.4, z: PERCH.z }, [0.1, PERCH.h + 0.4, 0.1], C.newShade);
    const tip = { x: PERCH.x - PERCH.arm, y: py + PERCH.h - 0.05, z: PERCH.z };
    b.beam({ x: PERCH.x, y: tip.y, z: PERCH.z }, tip, 0.08, C.newShade);
    lantern(b, { ...tip, y: tip.y - 0.04 }, PERCH.lantern);
    dryBush(b, -9.6, at(-9.6, -0.6), -0.6, 0.75, 0.6);
    lowRock(b, { x: -7.2, y: at(-7.2, 9.2), z: 9.2 }, 1.05, 0.5, 29);
  });

  // ---- La ruine ----
  // Le corps la relève : les panneaux pâlis, trois grands éclats d'enduit peint tombés, la fente du bassin sec.
  add(
    'ruine',
    0,
    (b) => {
      paintings(b, PALE);
      for (const F of SHARDS)
        drawPosed(b, { x: F.x, y: parvisAt(F.x, F.z) - 0.02, z: F.z, yaw: F.yaw, pitch: F.pitch }, (l) => l.extrude({ x: 0, y: 0, z: -0.05 }, F.outline, 0.05, C.creamPale, PALE[F.paint]));
      // La fente du bassin : d'un bord à l'autre de la margelle, au sud-est.
      const B = BASIN;
      const y = parvisAt(B.x, B.z) + B.h + 0.006;
      const a = 0.7;
      const [c, s] = [Math.cos(a), Math.sin(a)];
      b.quad([B.x + c * B.r0 - s * 0.03, y, B.z + s * B.r0 + c * 0.03], [B.x + c * B.r1 - s * 0.03, y, B.z + s * B.r1 + c * 0.03], [B.x + c * B.r1 + s * 0.03, y, B.z + s * B.r1 - c * 0.03], [B.x + c * B.r0 + s * 0.03, y, B.z + s * B.r0 - c * 0.03], C.crack);
    },
    corps,
  );
  // Le haut la relève : le porche tombé en avant, devant la bouche ; les deux montants couchés à plat, longs, de section
  // carrée, parallèles et écartés, leur pied au seuil ; au bout, le linteau en trois morceaux détachés, couchés en
  // travers, celui du milieu montrant un bout de sa bande de racines. Rien de debout, rien de croisé.
  add(
    'ruine',
    0,
    (b) => {
      const R = FALLEN_PORCH;
      for (const [x, yaw] of R.posts) b.box({ x, y: parvisAt(x, R.postZ) - 0.1, z: R.postZ, yaw }, [R.post, R.post, PORCH.h], C.wornShade, C.wornWood);
      for (const [x, z, len, yaw, band] of R.lintel)
        drawPosed(b, { x, y: parvisAt(x, z) - 0.1, z, yaw }, (l) => {
          l.box({ x: 0, y: 0, z: 0 }, [len, PORCH.lintel, PORCH.depth], C.wornShade, C.wornWood);
          if (band) roots(l, -len / 2 + 0.2, len / 2 - 0.2, PORCH.lintel / 2, PORCH.depth / 2 + 0.006);
        });
    },
    haut,
  );
  // Les abords la relèvent : le cercle, quatre sièges debout, deux couchés, le disque fendu.
  add('ruine', 0, (b) => circle(b, true), abords);

  // ---- Le corps : les panneaux du fond et des deux retours, ravivés ; le bassin réparé, l'eau calme dedans, mate, sans
  // reflet ni ride. Rien sur la face de la roche (des joints en long s'y lisaient comme les assises d'un mur).
  add(0, 0, (b) => {
    paintings(b, LIVELY);
    const B = BASIN;
    const y = parvisAt(B.x, B.z) + B.water;
    b.plate({ x: B.x, y, z: B.z, pitch: -Math.PI / 2 }, Array.from({ length: B.sides }, (_, k) => [B.r0 * Math.cos((2 * Math.PI * k) / B.sides), B.r0 * Math.sin((2 * Math.PI * k) / B.sides)] as const), C.water);
  });
  // Le haut : le porche, à l'entrée de la bouche, sans estrade : deux montants de bois droits plantés au sol du seuil, le
  // linteau à la bande de racines ; la lanterne pendue sous le linteau, allumée dès qu'elle est posée.
  add(1, 0, (b) => {
    const P = PORCH;
    for (const side of [-1, 1]) {
      const x = side * P.x;
      b.box({ x, y: parvisAt(x, P.z) + SINK, z: P.z }, [P.post, P.h - SINK, P.post], C.newShade, C.newWood);
    }
    const y = parvisAt(0, P.z) + P.h;
    b.box({ x: 0, y, z: P.z }, [P.span, P.lintel, P.depth], C.newShade, C.newWood);
    roots(b, -P.span / 2 + 0.3, P.span / 2 - 0.3, y + P.lintel / 2, P.z + P.depth / 2 + 0.006);
    b.box({ x: P.lanternX, y: y - 0.12, z: P.z }, [0.07, 0.12, 0.07], C.iron);
    lantern(b, { x: P.lanternX, y: y - 0.1, z: P.z });
  });
  // Les abords : le cercle entier, six sièges debout, le disque entier ; le parvis de dalles chaudes ; la lanterne sur
  // piquet en tête du parvis, allumée dès qu'elle est posée.
  add(2, 0, (b) => {
    circle(b, false);
    slab(b, PARVIS.x0, PARVIS.x1, PARVIS.z0, PARVIS.z1, 0, C.slabShade, C.slab);
    const rows = [PARVIS.z0, 1.4, 3.8, PARVIS.z1];
    for (const z of rows.slice(1, -1)) parvisJoint(b, PARVIS.x0, z, PARVIS.x1, z);
    for (let r = 0; r < rows.length - 1; r++) for (let x = PARVIS.x0 + 1.5 + (r % 2) * 1.5; x < PARVIS.x1 - 0.5; x += 3) parvisJoint(b, x, rows[r + 1], x, rows[r]);
    const L = PARVIS_LANTERN;
    b.box({ x: L.x, y: at(L.x, L.z) - 0.3, z: L.z }, [0.1, L.h + 0.3, 0.1], C.newShade);
    lantern(b, { x: L.x, y: at(L.x, L.z) + L.h + 0.02, z: L.z });
  });
}

// ---------- Les traces ----------

/** Dessine dans le repère du lieu, puis pose le dessin au centre du lieu (`c`), dans le monde. */
const inWorld = (b: FacetBuilder, c: Vec3, draw: (l: FacetBuilder) => void): void => drawPosed(b, { ...c, yaw: 0 }, draw);

/** Où se pose la trace de chaque rang de mission, depuis le centre du lieu. */
const TRACE_SPOTS = {
  // La natte, sur le sol de l'abri, entre Kéo et le conteur, derrière eux ; le tabouret à son bout est.
  mat: { x: -0.25, z: -3.55 },
  stool: { x: 0.75, z: -3.3 },
  // Le coffre, ouvert contre le fond, à droite du bassin (assez loin du fond pour son couvercle renversé).
  chest: { x: 1.0, z: -5.0 },
  // La cruche, au pied du siège du cercle le plus près de la bouche, côté parvis.
  jug: (() => {
    const s = seatAt(CIRCLE.seats[3]);
    return { x: s.x + 0.15, z: s.z + 0.7 };
  })(),
} as const;

/** La natte et le tabouret (la fondation) : une natte de roseau étendue, trois brins en long ; un tabouret à trois pieds. */
function mat(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const M = TRACE_SPOTS.mat;
    const y = parvisAt(M.x, M.z);
    l.box({ x: M.x, y, z: M.z }, [1.5, 0.03, 0.95], C.reedLine, C.reed);
    for (const dz of [-0.24, 0, 0.24]) l.plate({ x: M.x, y: y + 0.034, z: M.z + dz, pitch: -Math.PI / 2 }, [[-0.7, -0.02], [0.7, -0.02], [0.7, 0.02], [-0.7, 0.02]], C.reedLine);
    const S = TRACE_SPOTS.stool;
    const sy = parvisAt(S.x, S.z);
    l.drum({ x: S.x, y: sy + 0.42, z: S.z }, 0.22, 0.06, 7, C.newShade, C.newWood);
    // Trois pieds droits, écartés vers le dehors, chacun dans son plan : jamais croisés.
    for (let k = 0; k < 3; k++) {
      const a = (2 * Math.PI * k) / 3 + 0.3;
      const [dx, dz] = [Math.cos(a), Math.sin(a)];
      l.beam({ x: S.x + 0.13 * dx, y: sy + 0.43, z: S.z + 0.13 * dz }, { x: S.x + 0.24 * dx, y: sy - 0.05, z: S.z + 0.24 * dz }, 0.05, C.newShade);
    }
  });
}

/** Un rouleau de peau couché, le long de x : un prisme à six pans de rayon `r`, d'une seule couleur, sans marque. */
function scroll(l: FacetBuilder, x: number, y: number, z: number, len: number, r: number): void {
  const ring = (u: number): Point[] => Array.from({ length: 6 }, (_, k) => [x + u, y + r * Math.sin((Math.PI * k) / 3), z + r * Math.cos((Math.PI * k) / 3)]);
  const a = ring(-len / 2);
  const e = ring(len / 2);
  for (let k = 0; k < 6; k++) {
    const n = (k + 1) % 6;
    l.quad(a[k], a[n], e[n], e[k], C.hide);
  }
  for (let k = 1; k < 5; k++) {
    l.triangle(e[0], e[k], e[k + 1], C.hide);
    l.triangle(a[0], a[k + 1], a[k], C.hide);
  }
}

/**
 * Le couvercle du coffre, fermé : son profil bombé, depuis la charnière (à l'arrière du coffre, en haut), vers l'avant
 * (`f`) et vers le haut (`u`) ; ouvert, il bascule de `CHEST_OPEN` en arrière autour de la charnière.
 */
const CHEST_LID: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.56, 0],
  [0.56, 0.06],
  [0.46, 0.14],
  [0.28, 0.18],
  [0.1, 0.14],
  [0, 0.06],
];
const CHEST_OPEN = (130 * Math.PI) / 180;
/** Le coffre, tourné vers l'ouest : de la scénette, on voit le bout bombé du couvercle et le bout des trois rouleaux. */
const CHEST_YAW = 0.45;

/**
 * Le coffre (les dieux et les héros) : un coffre de bois ouvert contre le fond, son couvercle bombé renversé en arrière,
 * en biais ; trois rouleaux de peau couchés côte à côte dedans, du devant vers l'arrière, leur moitié haute au-dessus du
 * bord : de la caméra de la scénette, trois bouts ronds couleur peau, sans marque.
 */
function chest(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.chest;
    drawPosed(l, { x: S.x, y: parvisAt(S.x, S.z), z: S.z, yaw: CHEST_YAW }, (m) => {
      m.box({ x: 0, y: 0, z: 0 }, [1.0, 0.44, 0.56], C.newShade, C.inside);
      // Le couvercle, autour de la charnière (l'arrière du coffre, en haut) : le profil tourné vers l'arrière, puis tiré
      // le long du coffre (le repère tourné d'un quart : son x local va vers l'arrière, son z local le long du coffre).
      const [co, si] = [Math.cos(CHEST_OPEN), Math.sin(CHEST_OPEN)];
      const lid = CHEST_LID.map(([f, u]) => [-(f * co - u * si), f * si + u * co] as const).reverse();
      m.extrude({ x: -0.5, y: 0.44, z: -0.28, yaw: Math.PI / 2 }, lid, 1.0, C.newShade, C.newWood);
      for (const dx of [-0.3, 0, 0.3]) drawPosed(m, { x: dx, y: 0.45, z: 0, yaw: Math.PI / 2 }, (q) => scroll(q, 0, 0, 0, 0.5, 0.09));
      for (const dx of [-0.34, 0.34]) facePlate(m, { x: dx, y: 0.06, z: 0.285 }, 0, 0.08, 0.32, C.bronze);
    });
  });
}

/** Le profil de la cruche, du pied au col : (hauteur, rayon). Haute comme une hanche. */
const JUG: readonly (readonly [number, number])[] = [
  [0, 0.17],
  [0.14, 0.27],
  [0.46, 0.33],
  [0.72, 0.21],
  [0.86, 0.11],
  [0.96, 0.12],
];

/** La cruche (les cas latins, l'alphabet grec) : d'argile claire, une seule anse, bouchée, au pied d'un siège. */
function jug(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const S = TRACE_SPOTS.jug;
    const y = parvisAt(S.x, S.z);
    const sides = 8;
    const ring = (k: number): Point[] => Array.from({ length: sides }, (_, i) => [S.x + JUG[k][1] * Math.cos((2 * Math.PI * i) / sides), y + JUG[k][0], S.z + JUG[k][1] * Math.sin((2 * Math.PI * i) / sides)]);
    for (let k = 0; k < JUG.length - 1; k++) {
      const lo = ring(k);
      const hi = ring(k + 1);
      for (let i = 0; i < sides; i++) {
        const n = (i + 1) % sides;
        l.quad(lo[n], lo[i], hi[i], hi[n], k < 2 ? C.clayShade : C.clay);
      }
    }
    // Le bouchon, et l'anse unique, au nord-ouest : du col à l'épaule, en deux segments.
    l.prism({ x: S.x, y: y + 0.94, z: S.z }, 0.13, 0.1, 0.08, 6, C.cork);
    const a = -2.2;
    const [dx, dz] = [Math.cos(a), Math.sin(a)];
    const top = { x: S.x + 0.12 * dx, y: y + 0.84, z: S.z + 0.12 * dz };
    const out = { x: S.x + 0.34 * dx, y: y + 0.74, z: S.z + 0.34 * dz };
    const low = { x: S.x + 0.3 * dx, y: y + 0.5, z: S.z + 0.3 * dz };
    l.beam(top, out, 0.05, C.clayShade);
    l.beam(out, low, 0.05, C.clayShade);
  });
}

/** Les trois traces, une par rang de mission, chacune avec sa partie : la même pour le latin et le grec. */
const RANKS = {
  founding: { at: TRACE_SPOTS.mat, lift: 1, stage: 0 as Stage, draw: mat },
  gods: { at: TRACE_SPOTS.chest, lift: 1.1, stage: 1 as Stage, draw: chest },
  third: { at: TRACE_SPOTS.jug, lift: 1, stage: 2 as Stage, draw: jug },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/** Les missions de chaque rang, en latin et en grec (docs/contenu/lca-5e-legends.md). */
export const ORACLE_RANKS = {
  founding: ['la-founding', 'gr-founding'],
  gods: ['la-gods', 'gr-gods'],
  third: ['la-cases', 'gr-alphabet'],
} as const satisfies Record<keyof typeof RANKS, readonly [string, string]>;

// ---------- La scénette ----------

/** Le milieu de la scène, depuis le centre du lieu : dans l'abri, devant le fond peint, sous la voûte. */
const SCENE_SPOT = { dx: 0, dz: -2.0, half: [2.6, 0.8] as [number, number] } as const;

/** La hauteur du sol de la scène au-dessus de son point (le plus haut du sol sous sa plate-forme) : le sol de l'abri. */
const SCENE_RISE = (() => {
  const [hx, hz] = SCENE_SPOT.half;
  const nx = Math.ceil(hx),
    nz = Math.ceil(hz);
  let top = localGround(SCENE_SPOT.dx, SCENE_SPOT.dz);
  for (let i = -nx; i <= nx; i++) for (let k = -nz; k <= nz; k++) top = Math.max(top, localGround(SCENE_SPOT.dx + (i / nx) * hx, SCENE_SPOT.dz + (k / nz) * hz));
  return parvisAt(SCENE_SPOT.dx, SCENE_SPOT.dz) - top;
})();

/** Le conteur en pion (son modèle 3D prend sa place, ./habitants.ts) : manteau bleu foncé, écharpe sourde, cheveux blancs. */
function storyteller(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.12, y: at.y, z: at.z }, 0.11, 0.11, 0.2, 6, C.boots);
  b.prism({ x: at.x, y: at.y + 0.2, z: at.z }, 0.32, 0.25, 0.75, 8, C.coat);
  b.prism({ x: at.x, y: at.y + 0.9, z: at.z }, 0.2, 0.18, 0.1, 8, C.scarf);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.skin);
  b.prism({ x: at.x, y: at.y + 1.16, z: at.z - 0.03 }, 0.22, 0.12, 0.2, 8, C.hair);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.3, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.36, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.coat);
}

/**
 * La banquette de pierre des réponses : sa hauteur, à l'échelle 1, un cran au-dessus du sol ; une pierre plus claire que
 * le sol et que les lampes (ses flancs, son dessus) ; une lampe choisie se soulève d'un cran.
 */
const BENCH = { height: 0.56, lift: 0.2, side: 0xbab5a6, top: 0xd6cfbe } as const;

/**
 * Une lampe à huile vue du ciel : un corps rond qui se pince en un bec court vers l'est (une goutte, convexe), de
 * l'arrière (le rond) à la pointe du bec.
 */
const LAMP_OUTLINE: readonly (readonly [number, number])[] = [
  ...Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI / 2 + (k * Math.PI) / 6;
    return [0.15 * Math.cos(a), 0.15 * Math.sin(a)] as const;
  }),
  [0.12, -0.11],
  [0.31, -0.03],
  [0.31, 0.03],
  [0.12, 0.11],
];

/**
 * Une lampe à huile d'argile gris-brun, éteinte, à l'échelle `s` : un corps aplati, une galette, qui se pince en un bec
 * court vers l'est ; dessus, un petit dôme. Jamais d'ocre.
 */
function oilLamp(b: FacetBuilder, at: Vec3, s: number): void {
  drawPosed(b, { x: at.x, y: at.y, z: at.z, yaw: 0, pitch: -Math.PI / 2 }, (l) =>
    l.extrude(
      { x: 0, y: 0, z: 0 },
      LAMP_OUTLINE.map(([x, y]) => [x * s, y * s] as const),
      0.07 * s,
      C.lamp,
      C.lampTop,
    ),
  );
  b.prism({ x: at.x - 0.01 * s, y: at.y + 0.07 * s, z: at.z }, 0.11 * s, 0.06 * s, 0.04 * s, 7, C.lamp, C.lampTop);
}

export const ORACLE: PlaceArt = {
  role: 'Le conteur',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a la sienne (`stage`) : elle se montre quand sa mission est
  // réussie et que son étape est posée. En grec, à deux parties, le haut et les abords se posent ensemble, leurs traces
  // aussi.
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    rise: SCENE_RISE,
    keo: { dx: -1.9, dz: 0.3, scale: 0.6, yaw: Math.PI - 0.4 },
    habitant: { dx: 1.9, dz: 0.3 },
    subject: { halfWidth: 2.9, bottom: -0.5, top: 3.0, depth: 0.3 },
    pitch: (14 * Math.PI) / 180,
  },
  // Le décor de près : la grotte elle-même (le fond peint, le bassin, un montant du porche, les deux retours qui
  // cadrent) ; le plancher est le sol de l'abri. Il reste le conteur en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) storyteller(b, at, sphere);
  },
  answer: {
    size: { height: BENCH.height + BENCH.lift + 0.15, half: 0.3 },
    // Une banquette de pierre claire, un cran au-dessus du sol, sous la rangée des lampes.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BENCH.height * s;
      const foot = Math.min(ground, y) - 0.3;
      b.box({ x: mid, y: foot, z }, [span + 0.5, top - foot, 0.55 * s], BENCH.side, BENCH.top);
    },
    // Une lampe posée sur la banquette ; choisie, elle se soulève d'un cran (sa place le dit, jamais sa couleur seule).
    object(b, at, s, _i, _count, picked) {
      oilLamp(b, { x: at.x, y: at.y + (BENCH.height + (picked ? BENCH.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les missions en R : l'abri seul, rien de l'item ; les lampes portent les réponses.
  rest() {},
  traces: Object.fromEntries((Object.keys(ORACLE_RANKS) as (keyof typeof ORACLE_RANKS)[]).flatMap((rank) => ORACLE_RANKS[rank].map((m) => [m, RANKS[rank]]))),
  // Kéo au retour : sur la chaussée, à l'arrivée sur le parvis, face à la bouche.
  exit: { x: DOOR_AT.x + 0.4, z: DOOR_AT.z + 0.8 },
  // « Y aller » arrive presque de face (la porte du lieu est au sud-est de la bouche), tourné de 0,2 vers l'ouest. De la
  // porte, la caméra qui suit ne montre pas la tour du Donjon au-dessus de la paroi : arrêté là, elle recule de 1,4 fois
  // sa distance, sans monter, et lève le regard jusqu'au haut de la tour, au-dessus de la bouche (un test vérifie le cadre).
  doorView: DOOR_VIEW,
  arrivalView: { look: DONJON_TOWER_TOP.look, back: ARRIVAL_BACK, top: DONJON_TOWER_TOP.top },
  // La natte, le coffre et la cruche restent dans le monde le temps de la scénette (comme au Donjon : l'élève y voit ce
  // qu'il a déjà fait) ; elle ne dessine aucune réussite à leur place.
  keepsTracesInScenette: true,
};

/** Le plan de l'Oracle, pour les tests : l'abri, la paroi, le parvis, le bassin, le porche, le cercle, la perche, le signe. */
export const ORACLE_LAYOUT = {
  abri: ABRI,
  abriFloor: AY,
  wallTop: WALL_TOP,
  rocks: ROCKS,
  fronts: FRONTS,
  parvis: PARVIS,
  parvisAt,
  basin: BASIN,
  porch: PORCH,
  circle: CIRCLE,
  perch: PERCH,
  mark: MARK,
  paint: { lively: LIVELY, pale: PALE },
  door: DOOR_AT,
  scene: SCENE_SPOT,
  traces: TRACE_SPOTS,
  heightAtCenter: H0,
  donjonTower: DONJON_TOWER_TOP,
} as const;

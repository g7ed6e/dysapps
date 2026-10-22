// La Veillée (les Coteaux du 4e, GD-24 ; intention du directeur artistique du 22 octobre 2026, § 6) : « la tonnelle où
// les mineurs mangeaient ensemble le soir, tous à la même table ». Sur le gabarit de l'Étalon (./etalon4e.ts), avec le kit
// commun des Coteaux (./place4eKit.ts). Un lieu bas et vert, sans verticale : la tonnelle de six poteaux (trois sur deux,
// d'est en ouest), ses traverses et son treillage couvert de vigne, haute de 2,6 et que rien ne dépasse ; dessous, la
// grande table et ses deux bancs ; au bout ouest, hors de la tonnelle, le trépied de fer (trois pieds qui se rejoignent,
// un crochet, rien de pointu vers le haut) et, à son crochet, le signe de l'absence du 4e : la chape vide et ses deux
// goujons nus (la marmite, prise par les Ferrailleurs), avant comme après ; le garde-manger, un seul meuble de bois,
// contre le côté nord ; l'enseigne, un pictogramme de marmite sombre sans mot, sur un poteau plus bas que la tonnelle, à
// l'entrée est.
//
// La ruine : quatre poteaux debout sur six, celui de l'angle sud-est cassé à mi-hauteur, celui du milieu nord couché le
// long de la table ; le treillage affaissé sur ce coin, la vigne sèche qui pend en partie ; la table fendue en long, un
// banc debout, l'autre couché sur le côté ; le garde-manger, sa porte pendue à un gond, ses étagères vides ; le trépied
// d'un brun éteint ; l'enseigne pendue à un seul anneau, de travers. Une seule lumière, la lanterne de l'épicier, sous la
// tonnelle au nord-ouest. Cinq parties (3 + 1 + 1) : le corps en trois rangées (le sol, la table et les bancs ; les six
// poteaux ; le garde-manger et le trépied), le haut (le treillage, la vigne verte, la lanterne de l'angle sud-est), les
// abords (le muret bas ouvert à l'est, l'enseigne raccrochée, le chemin de dalles vers la mer, la lanterne de l'entrée).
// Lieu d'option (comme l'Auberge au 5e) : une trace par rang de mission, la même pour les deux langues ; la tonnelle ne
// dit jamais la langue. Aucune lueur, rien d'orange, rien à lire, rien qui bouge. Code pur (placeArt.ts).
import type { Stage } from './construction';
import type { FacetBuilder } from './facets';
import type { Vec3 } from './geometry';
import type { AddPiece, PlaceArt, Sphere } from './placeArt';
import { C4E, SINK, capOf, emptyMount, groundPlane4e, inWorld, lantern, once, postLantern, quadOut, sceneRight, sceneRise, site4e, wallRun, type P3 } from './place4eKit';

/**
 * Les couleurs propres à la Veillée, en plus des matières des Passeurs (`C4E`) : la vigne, un cran plus franche que les
 * verts brûlés des Coteaux, jamais vive, et son ombre ; la vigne sèche de la ruine ; le dedans sombre du garde-manger et
 * le pictogramme de la marmite (brun très sombre, jamais noir) ; le grès gris (`C4E`) des pots, de la cruche et des assiettes
 * (jamais la terre cuite) ; la miche brune ; les pommes vert pâle.
 */
const C = {
  vine: 0x7a8a50,
  vineShade: 0x6a784a,
  dry: 0x8c8458,
  hollow: 0x4a423e,
  bread: 0x8a6a4a,
  apple: 0xb4c08a,
  // L'épicier, en pion (son modèle 3D prend sa place, ./habitants.ts) : souliers, tablier de toile, chemise.
  shoes: 0x5a504a,
  apron: 0xb8aa8c,
  shirt: 0x7e8a8e,
  head: 0xe3b48a,
} as const;

// ---------- Le repère du lieu ----------

const SITE = site4e('veillee');

/** Le plan du sol, ajusté sous la tonnelle, le trépied et le muret : les Coteaux sont plats ici (à 0,2 près). */
const planeY = groundPlane4e(SITE.ground, [-8, 6], [-4, 4]);

/**
 * La tonnelle : ses poteaux (x d'ouest en est, z du nord au sud), leur section, leur haut ; ses traverses (leur
 * section) ; le treillage et la vigne au-dessus, jusqu'à 2,6 au plus ; le débord du treillage au-delà des poteaux.
 */
const TONNELLE = { xs: [-4, 0, 4], zs: [-2.2, 2.2], post: 0.22, h: 2.2, beam: 0.14, top: 2.6, over: 0.45 } as const;

/** Le sol de la tonnelle, plat : le dessus de sa terre battue. */
const floorY = once(() => Math.max(...[-4.4, 4.4].flatMap((x) => [-2.6, 2.6].map((z) => planeY(x, z)))) + 0.04);

/** La grande table (d'ouest en est) : sa longueur, sa largeur, son dessus ; les deux bancs, de part et d'autre. */
const TABLE = { len: 5.2, w: 1.0, h: 0.74, t: 0.08, bench: { z: 0.95, len: 4.8, w: 0.32, h: 0.44 } } as const;

/** Le trépied, au bout ouest de la table, hors de la tonnelle : son milieu, l'écart de ses pieds, son sommet. */
const TREPIED = { x: -6.3, z: 0.3, spread: 0.55, h: 1.55 } as const;

/** Le garde-manger, contre le côté nord, entre les poteaux de l'ouest et du milieu : son milieu, sa largeur, sa profondeur, sa hauteur. */
const GARDE = { x: -2, z: -2.85, w: 1.6, d: 0.55, h: 1.7 } as const;

/** Le muret bas de pierre grise (les abords), autour de la tonnelle, ouvert à l'est : ses côtés, sa hauteur, son épaisseur, l'entrée. */
const MURET = { x0: -7.6, x1: 5.2, z: 3.5, h: 0.6, t: 0.35, gate: 1.5 } as const;

/** L'enseigne, à l'entrée est, au sud : son poteau (plus bas que la tonnelle), son bras vers le nord, son panneau. */
const ENSEIGNE = { x: 5.55, z: 2.1, h: 2.0, arm: 0.55, w: 0.6, board: 0.5 } as const;

/** La lanterne du chemin (les abords), à l'entrée est, au nord : jamais au même endroit que celle de l'angle sud-est. */
const PATH_LANTERN = { x: 5.55, z: -2.0, h: 1.3 } as const;

/** Le chemin de dalles vers la mer (les abords) : du coin sud-ouest de la tonnelle jusqu'au muret ouest. */
const DALLES = [
  { x: -4.9, z: 2.75 },
  { x: -5.8, z: 2.6 },
  { x: -6.7, z: 2.8 },
] as const;

// ---------- La vue ----------

/** Le cap d'arrivée (intention, « Les caps ») : 310°, de la porte au sud-est, la tonnelle de trois quarts, le large au-delà. */
const DOOR_VIEW = capOf(310);

/** La vue d'arrivée basse, à hauteur de Kéo (comme aux Fabriques). */
const DOOR_FRAME = { height: -3, back: 1.3 } as const;

/** Le point du nom sur la Carte, au-dessus de la vigne, le même en ruine et restauré. */
const MAP_POINT: Vec3 = {
  x: 0,
  get y() {
    return floorY() + TONNELLE.top + 1.5;
  },
  z: 0,
};

// ---------- La tonnelle ----------

/** Un poteau de bois, de son pied (sous le sol) à `top`. */
function post(b: FacetBuilder, x: number, z: number, top: number, side: number, cap: number): void {
  const s = TONNELLE.post;
  b.box({ x, y: SINK, z }, [s, top - SINK, s], side, cap);
}

/** Les traverses de la tonnelle : deux d'ouest en est, trois du nord au sud, au haut des poteaux. */
function beams(b: FacetBuilder, color: number): void {
  const T = TONNELLE,
    y = floorY() + T.h;
  const [x0, , x1] = T.xs,
    [z0, z1] = T.zs;
  for (const z of T.zs) b.beam({ x: x0 - T.over, y, z }, { x: x1 + T.over, y, z }, T.beam, color);
  for (const x of T.xs) b.beam({ x, y: y + T.beam, z: z0 - T.over }, { x, y: y + T.beam, z: z1 + T.over }, T.beam, color);
}

/** Les lattes du treillage, d'ouest en est, posées sur les traverses, entre `x0` et `x1`, de `z0` à `z1`. */
function slats(b: FacetBuilder, x0: number, x1: number, zs: readonly number[], color: number): void {
  const y = floorY() + TONNELLE.h + 1.5 * TONNELLE.beam;
  for (const z of zs) b.box({ x: (x0 + x1) / 2, y, z }, [x1 - x0, 0.05, 0.08], color);
}

/** Des pans de vigne à plat sur le treillage, chacun de travers (`yaw`), et des grappes de feuilles qui pendent au bord. */
function vinePatches(b: FacetBuilder, patches: readonly (readonly [number, number, number, number, number])[], color: number, under: number): void {
  const y = floorY() + TONNELLE.h + 1.5 * TONNELLE.beam + 0.05;
  for (const [x, z, w, d, yaw] of patches) b.box({ x, y, z, yaw }, [w, 0.08, d], under, color);
}

/**
 * La vigne verte en touffes (retouche 2 : en pans pleins, elle se lisait comme un toit) : dans chaque pan (son milieu, sa
 * longueur, sa largeur, son biais), des touffes de feuilles à facettes, trois sur deux, une laissée vide à tour de rôle
 * pour que le treillage se voie ; chaque touffe, une pointe basse au-dessus des lattes (le soleil sur ses facettes) et
 * une pointe sous elles, plus sombre. Jamais au-dessus du haut de la tonnelle.
 */
function vineTufts(b: FacetBuilder, patches: readonly (readonly [number, number, number, number, number])[]): void {
  const y = floorY() + TONNELLE.h + 1.5 * TONNELLE.beam + 0.05;
  const up = TONNELLE.top - (y - floorY()) - 0.01;
  patches.forEach(([x, z, w, d, yaw], p) => {
    const cos = Math.cos(yaw),
      sin = Math.sin(yaw);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        if ((p + i + 2 * j) % 6 === 2) continue;
        const u = ((i + 0.5) / 3 - 0.5) * w * 0.8 + 0.12 * (((i + j + p) % 3) - 1),
          v = ((j + 0.5) / 2 - 0.5) * d * 0.75;
        const r = Math.min(w / 3, d / 2) * (0.55 + 0.1 * ((i * 2 + j + p) % 3));
        const at = { x: x + u * cos + v * sin, z: z - u * sin + v * cos, yaw: yaw + 0.7 * (i + j) };
        b.prism({ ...at, y }, r, 0, up, 5, C.vine);
        b.prism({ ...at, y, pitch: Math.PI }, r * 0.85, 0, 0.16, 5, C.vineShade);
      }
  });
}

/**
 * Le pan de treillage tombé (la ruine), entre ses quatre coins (le haut, puis le bas) : quatre lattes dans la pente et
 * deux en travers, à claire-voie.
 */
function fallenTrellis(b: FacetBuilder, a: P3, c: P3, d: P3, e: P3): void {
  const at = (p: P3, q: P3, t: number) => ({ x: p[0] + (q[0] - p[0]) * t, y: p[1] + (q[1] - p[1]) * t, z: p[2] + (q[2] - p[2]) * t });
  for (const t of [0.08, 0.38, 0.66, 0.94]) b.beam(at(a, c, t), at(e, d, t), 0.07, C4E.wood);
  for (const t of [0.3, 0.72]) b.beam(at(a, e, t), at(c, d, t), 0.06, C4E.woodShade);
}

/** La lanterne de l'épicier, pendue sous la traverse de l'ouest, au nord : seule allumée dans la ruine. */
function grocerLantern(b: FacetBuilder): void {
  lantern(b, { x: TONNELLE.xs[0], y: floorY() + TONNELLE.h - TONNELLE.beam / 2, z: -1.3 }, true);
}

// ---------- La table, les bancs ----------

/** La table entière sur ses deux tréteaux (le corps), ou fendue en long, la moitié nord affaissée (la ruine). */
function table(b: FacetBuilder, whole: boolean): void {
  const T = TABLE;
  for (const x of [-T.len / 2 + 0.5, T.len / 2 - 0.5]) b.box({ x, y: floorY() - 0.1, z: 0 }, [0.12, T.h - T.t + 0.1, T.w - 0.2], whole ? C4E.newShade : C4E.woodShade);
  if (whole) {
    b.box({ x: 0, y: floorY() + T.h - T.t, z: 0 }, [T.len, T.t, T.w], C4E.newShade, C4E.newWood);
    return;
  }
  b.box({ x: 0, y: floorY() + T.h - T.t, z: T.w / 4 + 0.02 }, [T.len, T.t, T.w / 2 - 0.04], C4E.woodShade, C4E.wood);
  b.box({ x: 0, y: floorY() + T.h - T.t - 0.06, z: -T.w / 4 - 0.02, pitch: 0.12 }, [T.len, T.t, T.w / 2 - 0.04], C4E.woodShade, C4E.wood);
}

/** Un banc debout, son siège et ses deux pieds pleins. */
function bench(b: FacetBuilder, z: number, side: number, top: number): void {
  const B = TABLE.bench;
  for (const x of [-B.len / 2 + 0.4, B.len / 2 - 0.4]) b.box({ x, y: floorY() - 0.1, z }, [0.1, B.h - 0.06 + 0.1, B.w - 0.04], side);
  b.box({ x: 0, y: floorY() + B.h - 0.06, z }, [B.len, 0.06, B.w], side, top);
}

// ---------- Le garde-manger ----------

/**
 * Le garde-manger : son corps de bois, toujours là, le dedans sombre et ses trois étagères vu par sa face sud, ouverte ;
 * sa porte pendue à un gond (la ruine) ou droite, ouverte à plat contre son flanc est (le corps).
 */
function larder(b: FacetBuilder): void {
  const G = GARDE;
  b.box({ x: G.x, y: floorY() - 0.1, z: G.z }, [G.w, G.h + 0.1, G.d], C4E.woodShade, C4E.wood);
  const z = G.z + G.d / 2 + 0.01;
  quadOut(b, [G.x - G.w / 2 + 0.1, floorY() + 0.1, z], [G.x + G.w / 2 - 0.1, floorY() + 0.1, z], [G.x + G.w / 2 - 0.1, floorY() + G.h - 0.1, z], [G.x - G.w / 2 + 0.1, floorY() + G.h - 0.1, z], [0, 0, 1], C.hollow);
}

/** Les étagères du garde-manger, de bois, à trois hauteurs. */
function shelves(b: FacetBuilder, color: number): void {
  const G = GARDE;
  for (const y of [0.45, 0.9, 1.3]) b.box({ x: G.x, y: floorY() + y, z: G.z + G.d / 2 - 0.08 }, [G.w - 0.2, 0.04, 0.2], color);
}

/** La porte du garde-manger : pendue à son gond du bas, de travers (la ruine) ; droite, ouverte contre le flanc est (le corps). */
function larderDoor(b: FacetBuilder, whole: boolean): void {
  const G = GARDE;
  if (whole) {
    b.box({ x: G.x + G.w / 2 + 0.03, y: floorY() + 0.1, z: G.z + G.d / 2 + (G.w - 0.2) / 2 - 0.02, yaw: Math.PI / 2 }, [G.w - 0.2, G.h - 0.2, 0.05], C4E.newShade, C4E.newWood);
    return;
  }
  b.box({ x: G.x + G.w / 2 + 0.35, y: floorY() + 0.05, z: G.z + G.d / 2 + 0.55, yaw: Math.PI / 2 + 0.5, pitch: -0.35 }, [G.w - 0.2, G.h - 0.3, 0.05], C4E.woodShade, C4E.wood);
}

/** Des pots de grès gris sans étiquette, sur les trois étagères. */
function larderPots(b: FacetBuilder): void {
  const G = GARDE;
  for (const [y, xs] of [
    [0.49, [-0.5, -0.15, 0.25]],
    [0.94, [-0.35, 0.1, 0.5]],
    [1.34, [-0.45, 0.35]],
  ] as const)
    for (const dx of xs) b.prism({ x: G.x + dx, y: floorY() + y, z: G.z + G.d / 2 - 0.08 }, 0.08, 0.07, 0.2, 5, C4E.stoneware, C4E.stonewareTop);
}

// ---------- Le trépied ----------

/**
 * Le trépied : trois pieds de fer qui se rejoignent sous un chapeau plat (rien de pointu vers le haut), un crochet, et à
 * ce crochet la chape vide et ses deux goujons nus, le signe de l'absence (toujours là, à part).
 */
function trepied(b: FacetBuilder, color: number): void {
  const T = TREPIED;
  const g = planeY(T.x, T.z);
  const apex = { x: T.x, y: g + T.h, z: T.z };
  for (let k = 0; k < 3; k++) {
    const a = Math.PI / 6 + (k * 2 * Math.PI) / 3;
    b.beam({ x: T.x + Math.cos(a) * T.spread, y: g - 0.1, z: T.z + Math.sin(a) * T.spread }, apex, 0.07, color);
  }
  b.box({ x: T.x, y: apex.y - 0.04, z: T.z }, [0.18, 0.08, 0.18], color);
  b.beam({ x: T.x, y: apex.y - 0.04, z: T.z }, { x: T.x, y: apex.y - 0.22, z: T.z }, 0.04, color);
}

/** La chape vide au crochet du trépied, ses deux goujons nus : avant comme après, jamais une étape. */
function absence(b: FacetBuilder): void {
  const T = TREPIED;
  emptyMount(b, { x: T.x, y: planeY(T.x, T.z) + T.h - 0.74, z: T.z }, Math.PI / 2);
}

// ---------- L'enseigne ----------

/** Un point du panneau de l'enseigne pendu sous `pivot`, basculé de `tilt` dans son plan (y vers le bas, `v` le long du bras). */
function onBoard(pivot: Vec3, tilt: number, v: number, down: number, x: number): P3 {
  const c = Math.cos(tilt),
    s = Math.sin(tilt);
  return [pivot.x + x, pivot.y - down * c + v * s, pivot.z + v * c + down * s];
}

/**
 * L'enseigne : son poteau et son bras (toujours là) ; le panneau, pendu sous le bras, et sur ses deux faces le
 * pictogramme sombre de la marmite (son ventre, son couvercle, ses deux anses), sans un mot. `tilt` : de travers, pendu à
 * un seul anneau (la ruine) ; nul, droit (les abords).
 */
function signBoard(b: FacetBuilder, tilt: number): void {
  const E = ENSEIGNE;
  const g = planeY(E.x, E.z);
  const pivot: Vec3 = { x: E.x, y: g + E.h - 0.12, z: E.z - E.arm + E.w / 2 + (tilt ? -E.w / 2 + 0.06 : 0) };
  // Le panneau : un pavé mince, d'est en ouest, pendu sous son anneau (le coin nord en ruine, le milieu sinon).
  const at = (v: number, d: number) => onBoard(pivot, tilt, v, d, 0);
  const off = tilt ? E.w / 2 - 0.06 : 0;
  const [bx, by, bz] = at(off, E.board + 0.06);
  b.box({ x: bx, y: by, z: bz, pitch: tilt }, [0.05, E.board, E.w], C4E.newShade, C4E.newWood);
  // Le pictogramme : un ventre arrondi en trapèze, un couvercle, deux anses, sur chaque face.
  for (const side of [-1, 1]) {
    const x = side * 0.035;
    const p = (v: number, d: number) => onBoard(pivot, tilt, off + v, d, x);
    const out: P3 = [side, 0, 0];
    quadOut(b, p(-0.17, 0.22), p(0.17, 0.22), p(0.13, 0.46), p(-0.13, 0.46), out, C.hollow);
    quadOut(b, p(-0.12, 0.15), p(0.12, 0.15), p(0.12, 0.2), p(-0.12, 0.2), out, C.hollow);
    for (const s of [-1, 1]) quadOut(b, p(s * 0.17, 0.25), p(s * 0.24, 0.25), p(s * 0.24, 0.31), p(s * 0.17, 0.31), out, C.hollow);
  }
  // L'anneau (ou les deux) qui le tient au bras.
  for (const v of tilt ? [off] : [-E.w / 2 + 0.08, E.w / 2 - 0.08]) {
    const [x, y, z] = onBoard(pivot, tilt, v, 0, 0);
    b.beam({ x, y: pivot.y + 0.1, z: tilt ? z : pivot.z + v }, { x, y, z }, 0.03, C4E.iron);
  }
}

/** Le poteau de l'enseigne et son bras, vers le nord : plus bas que la tonnelle. */
function signPost(b: FacetBuilder): void {
  const E = ENSEIGNE;
  const g = planeY(E.x, E.z);
  b.box({ x: E.x, y: SINK, z: E.z }, [0.16, g + E.h - SINK, 0.16], C4E.woodShade, C4E.wood);
  b.beam({ x: E.x, y: g + E.h - 0.08, z: E.z }, { x: E.x, y: g + E.h - 0.08, z: E.z - E.arm - E.w / 2 }, 0.08, C4E.woodShade);
}

// ---------- Le muret ----------

/** Le muret bas de pierre grise, autour de la tonnelle et du trépied, ouvert à l'est. */
function muret(b: FacetBuilder): void {
  const M = MURET;
  const y0 = SINK,
    top = floorY() + M.h - 0.1;
  for (const z of [-M.z, M.z]) wallRun(b, true, z, M.x0, M.x1, M.t, y0, top, top, C4E.stoneShade, C4E.stoneSun);
  wallRun(b, false, M.x0, -M.z + M.t / 2, M.z - M.t / 2, M.t, y0, top, top, C4E.stoneShade, C4E.stoneSun);
  for (const s of [-1, 1]) wallRun(b, false, M.x1, s * (M.z - M.t / 2), s * M.gate, M.t, y0, top, top, C4E.stoneShade, C4E.stoneSun);
}

// ---------- Le modèle ----------

function model(add: AddPiece): void {
  const corps = [0, 1 / 3, 2 / 3].map((row) => ({ stage: 0 as Stage, row }));
  const haut = { stage: 1 as Stage, row: 0 };
  const abords = { stage: 2 as Stage, row: 0 };
  const T = TONNELLE;
  const [xw, xm, xe] = T.xs,
    [zn, zs] = T.zs;

  // Toujours là : la lanterne de l'épicier (la seule allumée de la ruine) ; le corps du garde-manger ; la chape vide au
  // crochet du trépied ; le poteau de l'enseigne et son bras.
  add('ruine', 0, (b) => {
    grocerLantern(b);
    larder(b);
    absence(b);
    signPost(b);
  });

  // ---- La ruine ----
  // Le corps 1 la relève : la table fendue, le banc nord debout, le banc sud couché sur le côté, parallèle à la table.
  add(
    'ruine',
    0,
    (b) => {
      table(b, false);
      bench(b, -TABLE.bench.z, C4E.woodShade, C4E.wood);
      const B = TABLE.bench;
      b.box({ x: 0.2, y: floorY(), z: B.z + 0.35, yaw: 0.04 }, [B.len, B.w, B.h - 0.06], C4E.woodShade, C4E.wood);
    },
    corps[0],
  );
  // Le corps 2 la relève : quatre poteaux debout et leurs traverses (celles qui tiennent encore), celui du sud-est cassé
  // à mi-hauteur, celui du milieu nord couché le long de la table.
  add(
    'ruine',
    0,
    (b) => {
      const top = floorY() + T.h;
      for (const [x, z] of [
        [xw, zn],
        [xw, zs],
        [xm, zs],
        [xe, zn],
      ] as const)
        post(b, x, z, top, C4E.woodShade, C4E.wood);
      post(b, xe, zs, floorY() + 1.15, C4E.woodShade, C4E.wood);
      b.box({ x: 0.3, y: floorY(), z: -1.55, yaw: Math.PI / 2 + 0.05 }, [T.post, T.post, T.h + 0.3], C4E.woodShade, C4E.wood);
      // Les traverses qui tiennent : le long du sud (de l'ouest au milieu), à l'ouest, et la traverse de l'ouest au nord.
      const y = top;
      b.beam({ x: xw - T.over, y, z: zs }, { x: xm + 0.3, y, z: zs }, T.beam, C4E.woodShade);
      b.beam({ x: xw - T.over, y, z: zn }, { x: xm - 0.4, y: y - 0.25, z: zn }, T.beam, C4E.woodShade);
      b.beam({ x: xw, y: y + T.beam, z: zn - T.over }, { x: xw, y: y + T.beam, z: zs + T.over }, T.beam, C4E.woodShade);
    },
    corps[1],
  );
  // Le haut la relève : les lattes et la vigne sèche du coin debout, ce qui en pend, et le pan de treillage affaissé sur
  // le coin sud-est.
  add(
    'ruine',
    0,
    (b) => {
      const top = floorY() + T.h;
      // Le treillage affaissé : du haut du poteau nord-est jusqu'au sol, au coin sud-est ; des lattes à claire-voie, et
      // non un pan plein (retouche 2 : plein, il se lisait comme une bâche).
      const g = planeY(xe + 0.4, zs + 0.2);
      fallenTrellis(b, [xm + 0.6, top, zn + 0.6], [xe + 0.2, top, zn], [xe + 0.6, g + 0.15, zs + 0.3], [xm + 1.6, floorY() + 0.9, zs - 0.2]);
      slats(b, xw - T.over, xm - 0.2, [-1.4, -0.4, 0.6, 1.6], C4E.wood);
      // La vigne sèche, à plat sur le coin debout, et ce qui pend au bord sud (jamais jusqu'au chemin).
      vinePatches(
        b,
        [
          [-2.6, -0.8, 2.4, 1.4, 0.15],
          [-1.4, 1.2, 1.8, 1.1, -0.2],
        ],
        C.dry,
        C.dry,
      );
      for (const x of [-3.2, -1.8]) b.box({ x, y: top - 1.0, z: zs + 0.08 }, [0.35, 1.0, 0.06], C.dry);
    },
    haut,
  );
  // Le corps 3 la relève : la porte du garde-manger pendue à un gond, ses étagères vides ; le trépied d'un brun éteint.
  add(
    'ruine',
    0,
    (b) => {
      larderDoor(b, false);
      shelves(b, C4E.woodShade);
      trepied(b, C4E.rustDull);
    },
    corps[2],
  );
  // Les abords la relèvent : l'enseigne pendue de travers à un seul anneau ; deux pierres du muret tombées.
  add(
    'ruine',
    0,
    (b) => {
      signBoard(b, 0.45);
      for (const [x, z, yaw] of [
        [-7.0, -3.9, 0.4],
        [-3.0, 4.0, 1.3],
      ] as const)
        b.box({ x, y: planeY(x, z) - 0.12, z, yaw, pitch: 0.2 }, [0.55, 0.35, 0.4], C4E.stoneShade, C4E.stone);
    },
    abords,
  );

  // ---- Le corps 1 sur 3 : le sol de terre noire battue et ses dalles ; la table réparée ; les deux bancs debout.
  add(0, 0, (b) => {
    b.box({ x: 0, y: SINK, z: 0 }, [2 * (xe + T.over), floorY() - 0.02 - SINK, 2 * (zs + T.over)], C4E.earth, C4E.earthTop);
    for (const [x, z] of [
      [-3.2, -1.5],
      [3.1, 1.6],
      [3.3, -1.4],
    ] as const)
      b.box({ x, y: floorY() - 0.06, z, yaw: x * 0.2 }, [0.7, 0.07, 0.6], C4E.joint, C4E.paving);
    table(b, true);
    for (const z of [-TABLE.bench.z, TABLE.bench.z]) bench(b, z, C4E.newShade, C4E.newWood);
  });
  // ---- Le corps 2 sur 3 : les six poteaux debout et leurs traverses.
  add(0, 1 / 3, (b) => {
    for (const x of T.xs) for (const z of T.zs) post(b, x, z, floorY() + T.h, C4E.newShade, C4E.newWood);
    beams(b, C4E.newShade);
  });
  // ---- Le corps 3 sur 3 : le garde-manger réparé, sa porte droite, ses étagères garnies de pots sans étiquette ; le
  // trépied redressé, de fer bruni.
  add(0, 2 / 3, (b) => {
    larderDoor(b, true);
    shelves(b, C4E.newShade);
    larderPots(b);
    trepied(b, C4E.iron);
  });
  // ---- Le haut : le treillage refait et la vigne verte dessus ; la lanterne de la tonnelle, à l'angle sud-est (le coin
  // qui était tombé), qui s'allume.
  add(1, 0, (b) => {
    slats(b, xw - T.over, xe + T.over, [-2.0, -1.0, 0, 1.0, 2.0], C4E.newWood);
    vineTufts(b, [
      [-3.0, -1.3, 2.8, 1.7, 0.12],
      [-0.4, -1.5, 2.6, 1.5, -0.1],
      [2.4, -1.1, 3.0, 1.9, 0.08],
      [-2.4, 1.3, 2.9, 1.6, -0.15],
      [0.6, 1.0, 2.4, 1.8, 0.2],
      [3.0, 1.6, 2.2, 1.4, -0.05],
    ]);
    // Quelques grappes de feuilles qui pendent au bord, hautes au-dessus de la tête : des pointes à facettes, tête en bas.
    for (const [x, z] of [
      [-2.8, zn - 0.45],
      [1.4, zn - 0.45],
      [-0.6, zs + 0.45],
      [2.6, zs + 0.45],
    ] as const)
      b.prism({ x, y: floorY() + T.h + 0.05, z, yaw: x, pitch: Math.PI }, 0.28, 0, 0.5, 4, C.vineShade);
    // La lanterne du haut, pendue sous la traverse sud, tout près du poteau sud-est, vers le dedans.
    lantern(b, { x: xe - 0.5, y: floorY() + T.h - T.beam / 2, z: zs }, true);
  });
  // ---- Les abords : le muret bas ouvert à l'est ; l'enseigne raccrochée droite à son poteau ; le court chemin de dalles
  // vers la mer ; la lanterne du chemin, à l'entrée est.
  add(2, 0, (b) => {
    muret(b);
    signBoard(b, 0);
    for (const [k, d] of DALLES.entries()) b.box({ x: d.x, y: planeY(d.x, d.z) - 0.06, z: d.z, yaw: 0.25 * k - 0.2 }, [0.75, 0.1, 0.65], C4E.joint, C4E.paving);
    const p = PATH_LANTERN;
    postLantern(b, p.x, planeY(p.x, p.z), p.z, p.h, true);
  });
}

// ---------- Les traces ----------

/** Où se pose chaque trace, depuis le centre du lieu (intention, § 6) ; aucune sur le chemin. */
const TRACE_SPOTS = {
  time: { x: TABLE.len / 2 - 0.35, z: 0.15 },
  'my-day': { x: 0.9, z: -0.1 },
  timetable: { x: -1.2, z: TABLE.bench.z },
  'ser-estar': { x: TONNELLE.xs[1] + 0.45, z: TONNELLE.zs[0] + 0.35 },
  signs: { x: -2.2, z: MURET.z },
} as const;

/** Une cruche de grès gris au bout est de la table (le temps, l'heure). */
function jug(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.time;
    const y = floorY() + TABLE.h;
    l.prism({ x, y, z }, 0.13, 0.1, 0.3, 6, C4E.stoneware, C4E.stonewareTop);
    l.beam({ x: x + 0.12, y: y + 0.24, z }, { x: x + 0.18, y: y + 0.1, z }, 0.04, C4E.stoneware);
  });
}

/** Une planche à pain et sa miche ronde, brune, sur la table (ma journée). */
function breadBoard(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS['my-day'];
    const y = floorY() + TABLE.h;
    l.box({ x, y, z, yaw: 0.2 }, [0.55, 0.04, 0.35], C4E.newShade, C4E.newWood);
    l.prism({ x, y: y + 0.04, z }, 0.15, 0.1, 0.12, 6, C.bread);
  });
}

/** Une pile d'assiettes de grès gris, sur le banc sud (l'emploi du temps). */
function plates(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.timetable;
    l.prism({ x, y: floorY() + TABLE.bench.h, z }, 0.15, 0.15, 0.12, 6, C4E.stoneware, C4E.stonewareTop);
  });
}

/** Un tonnelet couché sur son chevalet, contre le poteau du milieu nord (être, les verbes de mode). */
function keg(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS['ser-estar'];
    for (const dx of [-0.16, 0.16]) l.box({ x: x + dx, y: floorY(), z }, [0.06, 0.3, 0.36], C4E.newShade);
    l.prism({ x: x - 0.22, y: floorY() + 0.42, z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, 0.17, 0.17, 0.44, 7, C4E.newShade, C4E.newWood);
  });
}

/** Un panier à anse plein de pommes vert pâle, sur le muret sud (les panneaux, les consignes). */
function appleBasket(b: FacetBuilder, c: Vec3): void {
  inWorld(b, c, (l) => {
    const { x, z } = TRACE_SPOTS.signs;
    const y = floorY() + MURET.h - 0.1;
    l.prism({ x, y, z }, 0.18, 0.22, 0.18, 6, C4E.canvasShade, C.apple);
    l.beam({ x: x - 0.18, y: y + 0.18, z }, { x, y: y + 0.42, z }, 0.03, C4E.canvasShade);
    l.beam({ x, y: y + 0.42, z }, { x: x + 0.18, y: y + 0.18, z }, 0.03, C4E.canvasShade);
  });
}

/**
 * Les cinq traces, une par rang de mission, chacune avec sa partie (le corps en trois rangées, puis le haut, puis les
 * abords) ; la mission de même rang des deux langues porte la même, dessinée une fois.
 */
const RANKS = {
  time: { at: TRACE_SPOTS.time, lift: 1.4, stage: 0, row: 0, draw: jug },
  'my-day': { at: TRACE_SPOTS['my-day'], lift: 1.4, stage: 0, row: 1 / 3, draw: breadBoard },
  timetable: { at: TRACE_SPOTS.timetable, lift: 1, stage: 0, row: 2 / 3, draw: plates },
  'ser-estar': { at: TRACE_SPOTS['ser-estar'], lift: 1, stage: 1, row: 0, draw: keg },
  signs: { at: TRACE_SPOTS.signs, lift: 1.2, stage: 2, row: 0, draw: appleBasket },
} as const satisfies Record<string, PlaceArt['traces'][string]>;

/**
 * Les missions de chaque rang, dans l'ordre de l'île, en espagnol puis en allemand : au rang 4, « ser y estar » et les
 * verbes de mode ne portent pas le même nom, d'où les paires écrites une à une.
 */
export const VEILLEE_RANKS = [
  ['time', 'es-time', 'de-time'],
  ['my-day', 'es-my-day', 'de-my-day'],
  ['timetable', 'es-timetable', 'de-timetable'],
  ['ser-estar', 'es-ser-estar', 'de-modals'],
  ['signs', 'es-signs', 'de-signs'],
] as const;

// ---------- La scénette ----------

/** Le cap de départ de la scénette (intention, § 6) : au sud-ouest, vers la mer, gardé (le repli au sud serait le contre-jour). */
const SCENE_START = capOf(225);

/** Le sens de la droite de l'écran au départ de la scénette (de Kéo vers l'épicier). */
const SCENE_RIGHT = sceneRight(SCENE_START);

/**
 * Le milieu de la scène, depuis le centre du lieu : dehors, au nord-est du muret, dans l'axe de la tonnelle vue en
 * diagonale (retouche 1 : sous la tonnelle, la caméra qui regarde au sud-ouest était prise dans les poutres et le
 * treillage). La caméra se tient au nord-est, hors de la tonnelle et du muret : derrière Kéo et l'épicier, la tonnelle
 * et sa vigne au milieu, sa table, le garde-manger, le trépied au fond, la mer au-delà.
 */
const SCENE_SPOT = { dx: 6.5, dz: -6.5, half: [1.6, 1.6] as [number, number] } as const;

/** L'écart de Kéo et de l'épicier au milieu de la scène. */
const SCENE_HALF = 2.1;

/** La hauteur du sol de la scène au-dessus de son point : la terre, au plan du lieu. */
const sceneRiseOf = once(() => sceneRise(SITE.ground, SCENE_SPOT, planeY(SCENE_SPOT.dx, SCENE_SPOT.dz)));

/** L'épicier en pion (son modèle 3D prend sa place, ./habitants.ts) : souliers, tablier de toile, chemise. */
function grocer(b: FacetBuilder, at: Vec3, sphere: Sphere): void {
  for (const side of [-1, 1]) b.prism({ x: at.x + side * 0.11, y: at.y, z: at.z }, 0.12, 0.12, 0.16, 6, C.shoes);
  b.prism({ x: at.x, y: at.y + 0.14, z: at.z }, 0.31, 0.25, 0.44, 8, C.apron);
  b.prism({ x: at.x, y: at.y + 0.56, z: at.z }, 0.27, 0.24, 0.42, 8, C.shirt);
  sphere(b, { x: at.x, y: at.y + 1.12, z: at.z }, 0.2, 8, 6, C.head);
  for (const side of [-1, 1]) b.beam({ x: at.x + side * 0.29, y: at.y + 0.94, z: at.z }, { x: at.x + side * 0.35, y: at.y + 0.52, z: at.z + 0.05 }, 0.12, C.shirt);
}

/** Le bout de table des bols, sur ses deux pieds : sa hauteur, à l'échelle 1 ; un bol choisi se soulève d'un cran. */
const BOARD = { height: 0.55, lift: 0.3, bowl: 0.16 } as const;

/** Un bol de bois, tous pareils (une forme par réponse se lirait comme un indice) : ni assiette, ni cruche. */
function bowl(b: FacetBuilder, at: Vec3, s: number): void {
  b.prism({ x: at.x, y: at.y, z: at.z }, 0.11 * s, 0.2 * s, 0.16 * s, 7, C4E.newShade, C.hollow);
}

export const VEILLEE: PlaceArt = {
  role: 'L’épicier',
  model,
  // L'étape la plus basse qui porte une trace ; chaque trace a sa partie (`stage`, `row` : 3 + 1 + 1).
  traceStage: 0,
  sceneSpot: { dx: SCENE_SPOT.dx, dz: SCENE_SPOT.dz, half: SCENE_SPOT.half, fine: true },
  site: {
    get rise() {
      return sceneRiseOf();
    },
    keo: { dx: -SCENE_RIGHT.x * SCENE_HALF, dz: -SCENE_RIGHT.z * SCENE_HALF, scale: 0.6, yaw: Math.PI - 0.4 + SCENE_START },
    habitant: { dx: SCENE_RIGHT.x * SCENE_HALF, dz: SCENE_RIGHT.z * SCENE_HALF },
    subject: { halfWidth: 3.0, bottom: -0.5, top: 2.9, depth: 0.3 },
    // Comme aux autres lieux des Coteaux : la caméra, dehors, voit la vigne de la tonnelle au-delà de l'épicier.
    pitch: (12 * Math.PI) / 180,
    start: SCENE_START,
  },
  // Le décor de près : la tonnelle, la table et le trépied sont au lieu, derrière la scène ; les abords
  // (./veilleeSurroundings.ts) ajoutent ce qui cadre. Il reste l'épicier en pion.
  decor(b, _floor, at, sphere, body = true) {
    if (body) grocer(b, at, sphere);
  },
  answer: {
    size: { height: BOARD.height + BOARD.lift + BOARD.bowl, half: 0.3 },
    facing: true,
    // Un bout de table de bois sur deux pieds, sous le rang des bols.
    base(b, mid, y, z, span, s, ground) {
      const top = y + BOARD.height * s;
      b.box({ x: mid, y: top - 0.08 * s, z }, [span + 0.7, 0.08 * s, 0.6 * s], C4E.newShade, C4E.newWood);
      for (const side of [-1, 1]) {
        const x = mid + side * (span / 2 + 0.1);
        const foot = Math.min(ground, y) - 0.3;
        b.box({ x, y: foot, z }, [0.12, top - 0.08 * s - foot, 0.45 * s], C4E.newShade);
      }
    },
    // Un bol de bois, tous pareils ; choisi, il se soulève d'un cran (sa place le dit).
    object(b, at, s, _i, _count, picked) {
      bowl(b, { x: at.x, y: at.y + (BOARD.height + (picked ? BOARD.lift : 0)) * s, z: at.z }, s);
    },
  },
  // Les dix missions : la terre battue seule, rien de l'item ; les bols portent les réponses.
  rest() {},
  traces: Object.fromEntries(VEILLEE_RANKS.flatMap(([rank, es, de]) => [es, de].map((m) => [m, RANKS[rank]]))),
  // Kéo au retour : au pas de la porte, tourné vers la tonnelle.
  exit: { x: SITE.door.x - 0.5, z: SITE.door.z - 0.4 },
  doorView: DOOR_VIEW,
  doorFrame: DOOR_FRAME,
  mapPoint: MAP_POINT,
};

/** Le plan de la Veillée, pour les tests et ses abords : la tonnelle, la table, le trépied, le garde-manger, le muret, la caméra. */
export const VEILLEE_LAYOUT = {
  tonnelle: TONNELLE,
  get floor() {
    return floorY();
  },
  table: TABLE,
  trepied: TREPIED,
  garde: GARDE,
  muret: MURET,
  enseigne: ENSEIGNE,
  pathLantern: PATH_LANTERN,
  planeY,
  door: SITE.door,
  doorFrame: DOOR_FRAME,
  doorView: DOOR_VIEW,
  mapPoint: MAP_POINT,
  scene: SCENE_SPOT,
  sceneStart: SCENE_START,
  traceSpots: TRACE_SPOTS,
} as const;


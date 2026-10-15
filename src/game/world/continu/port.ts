// L'Escale, le lieu de départ du monde continu (GD-20, lot 2) : le Port, dessiné par le code en volumes simples, en
// aplats francs (le low poly d'Archipéo), dans le repère du Port (plan6e.ts, `PORT`). Rien ne s'y rebâtit : l'école, la
// galerie des succès et le lieu d'assemblage sont debout dès le départ ; la construction du lieu de départ reste celle
// du Phare. Le Port est intact mais endormi (quai vide), et suit l'état de la région, un ajout par degré : une lanterne
// au quai, puis des habitants, puis des barques (la Nef viendra au lot 5, son poste d'amarrage reste libre à l'ouest du
// quai). L'école a trois portes, chacune dans l'un de trois états (fermée, ouverte avec sa lanterne, pavoisée) ; la
// galerie, un socle de pierre par place et un trophée par succès ; le lieu d'assemblage, son établi, sa grue, son
// râtelier dont la pile montre le stock. Aucun texte, aucun chiffre (rien à lire dans la 3D) ; les emblèmes des matières
// et les trophées se distinguent par leur forme, l'accent de couleur ne porte jamais seul le sens. Tout est réuni dans
// le maillage des lieux : aucun appel de plus. Code pur.
import { FacetBuilder, placeFacets, type Facets } from './facets';
import type { Vec2, Vec3 } from './geometry';
import { PORT, PORT_PAVING, PORT_QUAY_SPOT, PORT_SUBJECTS, portLevel, type PortSpot, type PortSubject } from './plan6e';

/** L'état d'une porte de l'école : fermée (aucune mission jouée), ouverte et sa lanterne allumée, pavoisée (toutes jouées). */
export type DoorState = 'closed' | 'lit' | 'flags';

/** L'accent d'un trophée : la famille de son succès (l'or des exploits, le cristal des rôles, le quartz, la lentille, le marbre). */
export type TrophyAccent = 'gold' | 'crystal' | 'quartz' | 'lens' | 'marble';

/** L'état de la région (`regionState`), en degrés : 0 abandonnée, 1 réactivée, 2 en reconstruction, 3 en développement, 4 ouverte. */
export type RegionDegree = 0 | 1 | 2 | 3 | 4;

/** Ce que montre le Port : ce que la page tire de la sauvegarde, rien de plus. */
export interface PortState {
  doors: Readonly<Record<PortSubject, DoorState>>;
  /** Un accent par succès gagné, dans l'ordre de la liste des succès. */
  trophies: readonly TrophyAccent[];
  degree: RegionDegree;
  /** Les blocs assemblés de la région en poche : la pile du râtelier. */
  pile: number;
  /** La recette sur l'établi : la couleur de chaque bloc à donner (deux de l'un, un de l'autre), et celle du bloc assemblé. */
  recipe: { pieces: readonly number[]; made: number };
}

/** Le Port pendant la scénette d'assemblage : la pile d'avant, l'établi vide (les pièces sont dans le maillage de la scénette). */
export interface PortShown {
  assembling: boolean;
}

const C = {
  stone: 0xd2cab8,
  stoneSide: 0xb9b2a3,
  coping: 0xe2dccd,
  plinth: 0xa9a191,
  white: 0xf2eee4,
  wall: 0xe9dcc0,
  frame: 0xc7bea9,
  // L'ardoise bleue de l'école (directeur artistique) : un gris-bleu franc, jamais presque noir.
  slate: 0x5b7c99,
  tile: 0xb0583a,
  shingle: 0x8a6440,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  newWood: 0xc8955a,
  door: 0x7a5538,
  // L'intérieur d'une porte ouverte : un brun chaud, moyen, jamais sombre.
  inside: 0x9c8a70,
  socle: 0xd8d1c2,
  // La matière des trophées : une pierre claire, la même pour tous.
  trophy: 0xece4d0,
  bollard: 0x6f8089,
  // La lanterne allumée : la couleur de la lampe du monde (places.ts, `LAMP_COLOR`), que la vue dessine sans ombre.
  lamp: 0xffd36b,
  habitant: [0x8c9f7a, 0xb5866a, 0x7f93a8],
  skin: 0xd9b38c,
} as const;

/** L'accent de chaque matière (emblème, fanions) : jamais seul pour dire la matière, la forme le dit. */
const SUBJECT_ACCENT: Readonly<Record<PortSubject, number>> = { french: 0x3f78b5, maths: 0xc8553d, english: 0x3f9a6b };

/** L'accent de chaque famille de trophées, sur la plaque sous le trophée. */
const TROPHY_ACCENT: Readonly<Record<TrophyAccent, number>> = { gold: 0xd9a92e, crystal: 0x8fc3d9, quartz: 0xc98fb0, lens: 0x4fa3a0, marble: 0xf4f1ea };

/** Sous le sol : les pieds des volumes s'enfoncent d'autant. */
const SINK = -0.8;
/** Sous l'eau : le pied du quai et du pavage, sous le fond du lagon. */
const DEEP = -1.8;
/** Le dessus des socles des bâtiments : la pierre de la place devant leurs façades. */
const FACADE_Z = 6.5;
const BACK_Z = 1.5;
const PLINTH = portLevel(FACADE_Z);

/** La galerie des succès : sa largeur d'arcade, son bord est (elle s'allonge vers le quai), ses arcades au départ et au plus. */
const GALLERY = { east: 16, arcade: 3, base: 2, most: 4 } as const;
/** Les places : six par arcade, trois devant, trois sur le gradin du fond. */
export const PORT_TROPHY_SLOTS = GALLERY.most * 6;
/** Les places sous le toit au départ, puis par travée (GD-3 : 12, puis une travée au 13e et au 19e succès). */
const SLOTS_AT_START = GALLERY.base * 6;
const SLOTS_PER_BAY = 6;

/** L'école : son milieu, sa largeur, la hauteur de ses murs ; le milieu de chaque porte, dans l'ordre des matières. */
const SCHOOL = { x: 22.5, width: 10, wall: 5.2, doors: [19.3, 22.5, 25.7] } as const;
/** Une porte : sa largeur, sa hauteur sous l'arc. */
const DOOR = { width: 2.2, height: 2.6, arch: 0.45 } as const;
/** Le lieu d'assemblage : son milieu, ses dimensions, son établi, son râtelier, sa grue. */
const HALL = { x: 32.5, width: 7, posts: 3.6 } as const;
const BENCH = { x: 32.5, z: 4.6, top: 0.85 } as const;
const RACK = { x: 30.2, z0: 2.9, z1: 5.3, top: 0.7 } as const;
/** Les madriers montrés sur le râtelier, au plus : deux par rang, cinq rangs. */
const PILE_MOST = 10;
const PIECE = { size: [0.6, 0.3, 0.5] as const, gap: 0.75 } as const;
const MADRIER = { size: [0.32, 0.24, 2.6] as const } as const;

/** Le pied d'une porte de l'école (le milieu du seuil, sur la façade). */
const doorX = (s: PortSubject) => SCHOOL.doors[PORT_SUBJECTS.indexOf(s)];

/** Le nombre d'arcades de la galerie pour `n` trophées : deux, puis une de plus au 13e et au 19e. */
export function galleryArcades(n: number): number {
  return GALLERY.base + Math.min(GALLERY.most - GALLERY.base, Math.max(0, Math.ceil((Math.min(n, PORT_TROPHY_SLOTS) - SLOTS_AT_START) / SLOTS_PER_BAY)));
}

/** La place du trophée `i` dans le repère du Port : l'arcade (de l'est vers le quai), le rang (devant, puis le gradin), la colonne. */
export function trophySlot(i: number): { x: number; y: number; z: number } {
  const arcade = Math.floor(i / 6);
  const row = Math.floor((i % 6) / 3);
  const col = i % 3;
  const mid = GALLERY.east - GALLERY.arcade * (arcade + 0.5);
  return { x: mid + (col - 1) * 0.85, y: PLINTH + (row ? 1.0 : 0.6), z: row ? 3.3 : 5.0 };
}

/** Un dessus de pierre qui suit la pente du Port (`portLevel`), du bord `z0` au bord `z1`, et ses flancs jusqu'à `bottom`. */
function paving(b: FacetBuilder, r: { x0: number; x1: number; z0: number; z1: number }, bottom: number): void {
  const cut = Math.min(r.z1, Math.max(r.z0, 1));
  const zs = [r.z0, ...(cut > r.z0 && cut < r.z1 ? [cut] : []), r.z1];
  for (let k = 0; k + 1 < zs.length; k++) {
    const a = zs[k],
      c = zs[k + 1];
    b.quad([r.x0, portLevel(a), a], [r.x0, portLevel(c), c], [r.x1, portLevel(c), c], [r.x1, portLevel(a), a], C.stone);
    // Les flancs est et ouest.
    b.quad([r.x0, bottom, a], [r.x0, bottom, c], [r.x0, portLevel(c), c], [r.x0, portLevel(a), a], C.stoneSide);
    b.quad([r.x1, bottom, c], [r.x1, bottom, a], [r.x1, portLevel(a), a], [r.x1, portLevel(c), c], C.stoneSide);
  }
  b.quad([r.x1, bottom, r.z0], [r.x0, bottom, r.z0], [r.x0, portLevel(r.z0), r.z0], [r.x1, portLevel(r.z0), r.z0], C.stoneSide);
  b.quad([r.x0, bottom, r.z1], [r.x1, bottom, r.z1], [r.x1, portLevel(r.z1), r.z1], [r.x0, portLevel(r.z1), r.z1], C.stoneSide);
}

/** Le quai et la place : la pierre, le chaperon clair du quai, trois bittes d'amarrage sur son flanc est. */
function quayAndSquare(b: FacetBuilder): void {
  const { quay, square } = PORT_PAVING;
  paving(b, quay, DEEP);
  paving(b, square, SINK);
  const top = portLevel(quay.z0);
  b.box({ x: 0, y: top, z: quay.z0 + 0.15 }, [quay.x1 - quay.x0, 0.12, 0.3], C.coping);
  for (const z of [-7.5, -4.5, -1.5]) b.prism({ x: quay.x1 - 0.35, y: top, z }, 0.2, 0.17, 0.45, 6, C.bollard);
}

/** Le socle d'un bâtiment, du dessous du sol au niveau de la place devant sa façade. */
function plinth(b: FacetBuilder, x0: number, x1: number): void {
  b.box({ x: (x0 + x1) / 2, y: SINK, z: (BACK_Z + FACADE_Z) / 2 }, [x1 - x0, PLINTH - SINK, FACADE_Z - BACK_Z], C.plinth, C.stone);
}

/** Un arc surbaissé entre deux points de même hauteur, en trois pièces (les reins et la clé). */
function arch(b: FacetBuilder, x0: number, x1: number, y: number, z: number, rise: number, t: number, color: number): void {
  const w = x1 - x0;
  const p = [
    { x: x0, y, z },
    { x: x0 + 0.22 * w, y: y + rise, z },
    { x: x1 - 0.22 * w, y: y + rise, z },
    { x: x1, y, z },
  ];
  for (let k = 0; k < 3; k++) b.beam(p[k], p[k + 1], t, color);
}

/**
 * La galerie des succès : longue et basse, à arcades, ouverte au sud ; ses socles se voient depuis la place. Une
 * travée de plus l'allonge d'une arcade vers le quai, entière, d'un coup ; rien ne monte sur son toit. Un socle vide
 * reste une pierre nue.
 */
function gallery(b: FacetBuilder, trophies: readonly TrophyAccent[]): void {
  const n = galleryArcades(trophies.length);
  const x1 = GALLERY.east;
  const x0 = x1 - n * GALLERY.arcade;
  plinth(b, x0 - 0.2, x1 + 0.2);
  const top = PLINTH + 2.2;
  b.box({ x: (x0 + x1) / 2, y: PLINTH, z: BACK_Z + 0.45 }, [x1 - x0, 3.0, 0.4], C.wall);
  for (let k = 0; k <= n; k++) b.box({ x: x1 - k * GALLERY.arcade, y: PLINTH, z: FACADE_Z - 0.3 }, [0.45, 2.2, 0.45], C.white);
  for (let k = 0; k < n; k++) arch(b, x1 - (k + 1) * GALLERY.arcade + 0.2, x1 - k * GALLERY.arcade - 0.2, top - 0.1, FACADE_Z - 0.3, 0.45, 0.3, C.white);
  b.box({ x: (x0 + x1) / 2, y: top + 0.45, z: FACADE_Z - 0.3 }, [x1 - x0 + 0.45, 0.4, 0.5], C.frame);
  b.box({ x: (x0 + x1) / 2, y: PLINTH + 3.0, z: (BACK_Z + FACADE_Z) / 2 }, [x1 - x0 + 0.7, 0.28, FACADE_Z - BACK_Z + 0.5], C.tile, C.tile);
  // Les socles : trois devant, trois sur le gradin du fond, par arcade.
  for (let i = 0; i < n * 6; i++) {
    const s = trophySlot(i);
    b.box({ x: s.x, y: PLINTH, z: s.z }, [0.55, s.y - PLINTH, 0.55], C.socle);
  }
  trophies.slice(0, n * 6).forEach((accent, i) => {
    const s = trophySlot(i);
    b.box({ x: s.x, y: s.y, z: s.z }, [0.46, 0.05, 0.46], TROPHY_ACCENT[accent]);
    b.append(placeFacets(trophyShape(i % TROPHY_SHAPES), { x: s.x, y: s.y + 0.05, z: s.z }));
  });
}

/** Les huit formes de trophées (consultant d'Archipéo), à répéter dans l'ordre de la liste des succès. */
const TROPHY_SHAPES = 8;
const shapes = new Map<number, Facets>();

/**
 * Un trophée, dans son repère (posé sur sa plaque, face au sud) : le coquillage, l'étoile de mer, l'ancre, la barre de
 * gouvernail, la bouée, la perle sur sa demi-coquille, l'hippocampe, le petit phare. Tous de la même pierre claire.
 */
export function trophyShape(kind: number): Facets {
  const known = shapes.get(kind);
  if (known) return known;
  const b = new FacetBuilder();
  const m = C.trophy;
  const v = (x: number, y: number) => ({ x, y, z: 0 });
  switch (kind) {
    case 0: // Le coquillage en spirale : trois tours qui montent en se décalant.
      b.prism({ x: 0, y: 0, z: 0 }, 0.26, 0.21, 0.2, 6, m);
      b.prism({ x: 0.04, y: 0.2, z: 0.03 }, 0.21, 0.14, 0.18, 6, m);
      b.prism({ x: 0.07, y: 0.38, z: 0.05 }, 0.14, 0, 0.26, 6, m);
      break;
    case 1: // L'étoile de mer, debout : cinq branches autour de son cœur.
      for (let k = 0; k < 5; k++) {
        const a = Math.PI / 2 + (2 * Math.PI * k) / 5;
        b.beam(v(0, 0.38), v(0.33 * Math.cos(a), 0.38 + 0.33 * Math.sin(a)), 0.12, m);
      }
      break;
    case 2: // L'ancre : sa verge, son jas, son anneau, ses deux bras.
      b.beam(v(0, 0.06), v(0, 0.74), 0.09, m);
      b.beam(v(-0.2, 0.6), v(0.2, 0.6), 0.08, m);
      b.prism({ x: 0, y: 0.74, z: -0.03, pitch: Math.PI / 2 }, 0.09, 0.09, 0.06, 6, m);
      b.beam(v(0, 0.1), v(-0.25, 0.3), 0.09, m);
      b.beam(v(0, 0.1), v(0.25, 0.3), 0.09, m);
      break;
    case 3: // La barre de gouvernail : un disque et huit poignées (quatre rayons qui le traversent).
      b.drum({ x: 0, y: 0.44, z: -0.04, pitch: Math.PI / 2 }, 0.26, 0.08, 8, m);
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 4;
        b.beam(v(-0.4 * Math.cos(a), 0.44 - 0.4 * Math.sin(a)), v(0.4 * Math.cos(a), 0.44 + 0.4 * Math.sin(a)), 0.06, m);
      }
      break;
    case 4: // La bouée : un anneau épais, en six pièces.
      for (let k = 0; k < 6; k++) {
        const a = (2 * Math.PI * k) / 6,
          c = (2 * Math.PI * (k + 1)) / 6;
        b.beam(v(0.25 * Math.cos(a), 0.4 + 0.25 * Math.sin(a)), v(0.25 * Math.cos(c), 0.4 + 0.25 * Math.sin(c)), 0.14, m);
      }
      break;
    case 5: // La perle sur sa demi-coquille : la coquille debout derrière, la perle devant.
      b.prism({ x: 0, y: 0, z: 0 }, 0.3, 0.26, 0.08, 8, m);
      b.prism({ x: 0, y: 0.06, z: -0.12, pitch: -Math.PI / 2.6 }, 0.3, 0.06, 0.08, 8, m);
      b.prism({ x: 0, y: 0.08, z: 0.04 }, 0.13, 0.13, 0.12, 6, m);
      b.prism({ x: 0, y: 0.2, z: 0.04 }, 0.13, 0, 0.12, 6, m);
      break;
    case 6: // L'hippocampe : quatre segments courbes, sa tête et son museau, sa queue enroulée.
      b.beam(v(0.12, 0.08), v(0, 0.05), 0.1, m);
      b.beam(v(0, 0.05), v(-0.1, 0.25), 0.14, m);
      b.beam(v(-0.1, 0.25), v(0, 0.45), 0.15, m);
      b.beam(v(0, 0.45), v(0.08, 0.62), 0.13, m);
      b.beam(v(0.08, 0.62), v(0.27, 0.6), 0.08, m);
      break;
    default: // Le petit phare : sa tour, sa lanterne, son toit.
      b.prism({ x: 0, y: 0, z: 0 }, 0.2, 0.14, 0.55, 6, m);
      b.prism({ x: 0, y: 0.55, z: 0 }, 0.12, 0.12, 0.13, 6, m);
      b.prism({ x: 0, y: 0.68, z: 0 }, 0.16, 0, 0.14, 6, m);
  }
  const f = b.build();
  shapes.set(kind, f);
  return f;
}

/**
 * L'emblème d'une matière, en relief sur son cartouche rond (le même pour les trois), au-dessus du linteau de sa porte,
 * dans son repère (le cartouche face au sud) : le livre ouvert sur sa plume (large et bas), le compas ouvert (en A), la
 * rose des vents à quatre branches (en étoile).
 */
function emblem(b: FacetBuilder, s: PortSubject, x: number, y: number, z: number): void {
  b.drum({ x, y, z, pitch: Math.PI / 2 }, 0.58, 0.1, 10, C.frame, C.coping);
  const a = SUBJECT_ACCENT[s];
  const f = z + 0.1;
  if (s === 'french') {
    b.beam({ x: x - 0.34, y: y - 0.3, z: f + 0.02 }, { x: x + 0.36, y: y + 0.28, z: f + 0.02 }, 0.05, C.door);
    for (const side of [-1, 1]) b.box({ x: x + side * 0.16, y: y - 0.2, z: f + 0.05, yaw: side * 0.45 }, [0.32, 0.4, 0.05], a);
  } else if (s === 'maths') {
    b.beam({ x, y: y + 0.32, z: f }, { x: x - 0.24, y: y - 0.36, z: f }, 0.07, a);
    b.beam({ x, y: y + 0.32, z: f }, { x: x + 0.24, y: y - 0.36, z: f }, 0.07, a);
    b.prism({ x, y: y + 0.32, z: f - 0.02, pitch: Math.PI / 2 }, 0.08, 0.08, 0.1, 6, C.coping);
  } else {
    // Quatre losanges, chacun en pointe de diamant : deux faces vers la caméra, de part et d'autre de son arête.
    for (let k = 0; k < 4; k++) {
      const ang = (k * Math.PI) / 2;
      const dx = Math.cos(ang),
        dy = Math.sin(ang);
      const tip: [number, number, number] = [x + 0.44 * dx, y + 0.44 * dy, f];
      const base: [number, number, number] = [x, y, f];
      const mid: [number, number, number] = [x + 0.2 * dx, y + 0.2 * dy, f + 0.09];
      const l: [number, number, number] = [x + 0.2 * dx - 0.11 * dy, y + 0.2 * dy + 0.11 * dx, f];
      const r: [number, number, number] = [x + 0.2 * dx + 0.11 * dy, y + 0.2 * dy - 0.11 * dx, f];
      b.triangle(base, mid, l, a);
      b.triangle(mid, tip, l, a);
      b.triangle(base, r, mid, a);
      b.triangle(mid, r, tip, a);
    }
  }
}

/**
 * L'école : le plus haut des trois, large et symétrique, trois grandes arches égales, un toit d'ardoise bleue. Chaque
 * porte : fermée (son vantail), ouverte (le vantail rabattu, l'intérieur) avec sa lanterne allumée à côté, puis
 * pavoisée (une guirlande de fanions unis au-dessus de l'arche) ; aucun compteur.
 */
function school(b: FacetBuilder, doors: PortState['doors']): void {
  const x0 = SCHOOL.x - SCHOOL.width / 2,
    x1 = SCHOOL.x + SCHOOL.width / 2;
  plinth(b, x0 - 0.2, x1 + 0.2);
  b.box({ x: SCHOOL.x, y: PLINTH, z: (BACK_Z + FACADE_Z - 0.2) / 2 + 0.05 }, [SCHOOL.width, SCHOOL.wall, FACADE_Z - BACK_Z - 0.2], C.white, C.wall);
  b.gableRoof({ x: SCHOOL.x, y: PLINTH + SCHOOL.wall, z: (BACK_Z + FACADE_Z) / 2 }, SCHOOL.width + 0.8, FACADE_Z - BACK_Z + 1, 2.6, C.slate, C.white);
  const front = FACADE_Z - 0.2;
  for (const s of PORT_SUBJECTS) {
    const x = doorX(s);
    const state = doors[s];
    const w = DOOR.width / 2;
    // La marche, l'encadrement de pierre et son arc.
    b.box({ x, y: PLINTH, z: front + 0.35 }, [DOOR.width + 0.6, 0.18, 0.5], C.frame, C.coping);
    for (const side of [-1, 1]) b.box({ x: x + side * (w + 0.15), y: PLINTH, z: front + 0.08 }, [0.3, DOOR.height, 0.16], C.frame);
    arch(b, x - w - 0.15, x + w + 0.15, PLINTH + DOOR.height, front + 0.08, DOOR.arch, 0.3, C.frame);
    if (state === 'closed') b.box({ x, y: PLINTH, z: front + 0.02 }, [DOOR.width, DOOR.height + DOOR.arch * 0.6, 0.08], C.door);
    else {
      // Ouverte : l'intérieur au fond de l'arche, les deux vantaux rabattus contre l'embrasure.
      b.box({ x, y: PLINTH, z: front - 0.05 }, [DOOR.width, DOOR.height + DOOR.arch * 0.6, 0.06], C.inside);
      for (const side of [-1, 1]) b.box({ x: x + side * (w - 0.05), y: PLINTH, z: front + 0.45 }, [0.08, DOOR.height, 0.55], C.door);
      // La lanterne allumée, sur sa potence, à droite de l'arche.
      const lx = x + w + 0.55;
      b.beam({ x: lx - 0.25, y: PLINTH + 2.35, z: front }, { x: lx, y: PLINTH + 2.35, z: front + 0.3 }, 0.06, C.bollard);
      b.box({ x: lx, y: PLINTH + 1.95, z: front + 0.3 }, [0.22, 0.32, 0.22], C.lamp);
      b.prism({ x: lx, y: PLINTH + 2.27, z: front + 0.3 }, 0.17, 0, 0.14, 4, C.bollard);
    }
    if (state === 'flags') {
      // Une guirlande de fanions unis, tendue sous le cartouche ; les fanions vus des deux côtés.
      const y = PLINTH + DOOR.height + DOOR.arch + 0.4;
      const z = front + 0.3;
      b.beam({ x: x - w - 0.3, y, z }, { x, y: y - 0.2, z }, 0.03, C.darkWood);
      b.beam({ x, y: y - 0.2, z }, { x: x + w + 0.3, y, z }, 0.03, C.darkWood);
      for (let k = 0; k < 5; k++) {
        const u = (k + 0.5) / 5;
        const fx = x - w - 0.3 + u * (DOOR.width + 0.6);
        const fy = y - 0.2 * (1 - Math.abs(2 * u - 1));
        const tri: [[number, number, number], [number, number, number], [number, number, number]] = [
          [fx - 0.16, fy, z],
          [fx + 0.16, fy, z],
          [fx, fy - 0.36, z],
        ];
        b.triangle(tri[0], tri[2], tri[1], SUBJECT_ACCENT[s]);
        b.triangle(tri[0], tri[1], tri[2], SUBJECT_ACCENT[s]);
      }
    }
    emblem(b, s, x, PLINTH + DOOR.height + DOOR.arch + 1.15, front + 0.05);
  }
}

/**
 * Le lieu d'assemblage : une halle de charpente ouverte sur six poteaux, un toit à deux pentes, l'établi au milieu et
 * sur lui la recette (deux pièces de l'un, une de l'autre), une petite grue de bois, et le râtelier dont la pile montre
 * le stock (dix madriers au plus).
 */
function hall(b: FacetBuilder, state: PortState, shown: PortShown): void {
  const x0 = HALL.x - HALL.width / 2,
    x1 = HALL.x + HALL.width / 2;
  plinth(b, x0 - 0.2, x1 + 0.2);
  const top = PLINTH + HALL.posts;
  for (const x of [x0 + 0.3, HALL.x, x1 - 0.3]) for (const z of [BACK_Z + 0.5, FACADE_Z - 0.5]) b.box({ x, y: PLINTH, z }, [0.35, HALL.posts, 0.35], C.wood);
  for (const z of [BACK_Z + 0.5, FACADE_Z - 0.5]) b.box({ x: HALL.x, y: top - 0.3, z }, [HALL.width - 0.4, 0.3, 0.3], C.darkWood);
  b.gableRoof({ x: HALL.x, y: top, z: (BACK_Z + FACADE_Z) / 2 }, HALL.width + 0.6, FACADE_Z - BACK_Z + 0.9, 1.7, C.shingle, C.wood);
  // L'établi.
  const bench = PLINTH + BENCH.top;
  b.box({ x: BENCH.x, y: bench - 0.15, z: BENCH.z }, [2.6, 0.15, 1.0], C.darkWood, C.newWood);
  for (const dx of [-1.1, 1.1]) for (const dz of [-0.35, 0.35]) b.box({ x: BENCH.x + dx, y: PLINTH, z: BENCH.z + dz }, [0.14, BENCH.top - 0.15, 0.14], C.darkWood);
  if (!shown.assembling) b.append(benchPieces(state.recipe.pieces, { x: BENCH.x, y: bench, z: BENCH.z }));
  // La grue, à l'est de l'établi : son mât, sa flèche au-dessus de lui, sa corde et son crochet.
  const crane = { x: x1 - 0.9, z: 3.0 };
  b.box({ x: crane.x, y: PLINTH, z: crane.z }, [0.24, 3.0, 0.24], C.wood);
  b.beam({ x: crane.x, y: PLINTH + 2.9, z: crane.z }, { x: BENCH.x + 0.6, y: PLINTH + 2.9, z: BENCH.z - 0.2 }, 0.16, C.wood);
  b.beam({ x: BENCH.x + 0.6, y: PLINTH + 2.9, z: BENCH.z - 0.2 }, { x: BENCH.x + 0.6, y: PLINTH + 2.05, z: BENCH.z - 0.2 }, 0.04, C.darkWood);
  b.box({ x: BENCH.x + 0.6, y: PLINTH + 1.85, z: BENCH.z - 0.2 }, [0.16, 0.2, 0.16], C.bollard);
  // Le râtelier : deux tréteaux, la pile des madriers couchés en travers.
  for (const z of [RACK.z0, RACK.z1]) {
    for (const dx of [-0.45, 0.45]) b.box({ x: RACK.x + dx, y: PLINTH, z }, [0.14, RACK.top, 0.14], C.darkWood);
    b.box({ x: RACK.x, y: PLINTH + RACK.top - 0.14, z }, [1.1, 0.14, 0.2], C.darkWood);
  }
  const pile = Math.min(PILE_MOST, Math.max(0, state.pile - (shown.assembling ? 1 : 0)));
  for (let k = 0; k < pile; k++) {
    const p = rackSlotLocal(k);
    b.box({ x: p.x, y: p.y, z: p.z }, MADRIER.size, darker(state.recipe.made), state.recipe.made);
  }
}

/** La place du madrier `k` sur le râtelier, dans le repère du Port : deux par rang, de bas en haut. */
function rackSlotLocal(k: number): Vec3 {
  return { x: RACK.x + (k % 2 ? 0.2 : -0.2), y: PLINTH + RACK.top + Math.floor(k / 2) * MADRIER.size[1], z: (RACK.z0 + RACK.z1) / 2 };
}

/** Une couleur un peu plus sombre (les flancs d'un bloc, comme `side` de ses deux couleurs). */
function darker(color: number): number {
  const r = (color >> 16) & 0xff,
    g = (color >> 8) & 0xff,
    bl = color & 0xff;
  return (Math.round(r * 0.82) << 16) | (Math.round(g * 0.82) << 8) | Math.round(bl * 0.82);
}

/** Les pièces de la recette sur l'établi, en rang, autour de `at` (le dessus de l'établi), dans le repère du Port. */
function benchPieces(colors: readonly number[], at: Vec3): Facets {
  const b = new FacetBuilder();
  colors.forEach((c, i) => b.box({ x: at.x + (i - (colors.length - 1) / 2) * PIECE.gap, y: at.y, z: at.z }, PIECE.size, darker(c), c));
  return b.build();
}

/** Ce que l'état de la région ajoute au Port, un ajout par degré : la lanterne du quai, des habitants, des barques. */
function wakes(b: FacetBuilder, degree: RegionDegree): void {
  const { quay } = PORT_PAVING;
  const top = portLevel(quay.z0);
  if (degree >= 1) {
    const at = { x: quay.x1 - 0.5, z: quay.z0 + 0.6 };
    b.box({ x: at.x, y: top, z: at.z }, [0.18, 2.2, 0.18], C.bollard);
    b.box({ x: at.x, y: top + 2.2, z: at.z }, [0.36, 0.42, 0.36], C.lamp);
    b.prism({ x: at.x, y: top + 2.62, z: at.z }, 0.3, 0, 0.22, 4, C.bollard);
  }
  if (degree >= 2)
    // Trois habitants sur la place, au bord sud, loin des portes et du chemin.
    [5.5, 15, 30].forEach((x, i) => {
      const z = 11.6;
      const y = portLevel(z);
      b.prism({ x, y, z }, 0.36, 0.26, 1.35, 6, C.habitant[i]);
      b.prism({ x, y: y + 1.35, z }, 0.2, 0.22, 0.28, 6, C.skin);
      b.prism({ x, y: y + 1.63, z }, 0.22, 0, 0.18, 6, C.habitant[i]);
    });
  if (degree >= 3)
    // Deux barques amarrées le long du quai, à l'est (l'ouest reste à la Nef).
    for (const z of [-6.8, -3.2]) {
      const x = quay.x1 + 1.0;
      b.box({ x, y: -0.3, z }, [1.1, 0.7, 2.6], C.wood, C.darkWood);
      b.box({ x, y: 0.2, z }, [0.8, 0.1, 0.25], C.newWood);
    }
}

/** Le Port entier, dans son repère. */
function portLocal(state: PortState, shown: PortShown): Facets {
  const b = new FacetBuilder();
  quayAndSquare(b);
  gallery(b, state.trophies);
  school(b, state.doors);
  hall(b, state, shown);
  wakes(b, state.degree);
  return b.build();
}

/** Le Port posé dans le monde. */
export function portFacets(state: PortState, shown: PortShown = { assembling: false }): Facets {
  return placeFacets(portLocal(state, shown), { x: PORT.origin.x, y: 0, z: PORT.origin.z, yaw: PORT.yaw });
}

/** Le Port au plus chargé : toutes ses places prises, ses portes pavoisées, ses barques, sa pile pleine (le budget). */
export const PORT_WORST: PortState = {
  doors: { french: 'flags', maths: 'flags', english: 'flags' },
  trophies: Array.from({ length: PORT_TROPHY_SLOTS }, () => 'gold'),
  degree: 4,
  pile: PILE_MOST,
  recipe: { pieces: [0xc29a5f, 0xc29a5f, 0xd98a5a], made: 0xdcba86 },
};

/** Un point du repère du Port dans le monde, à la hauteur `y`. */
const world3 = (x: number, y: number, z: number): Vec3 => {
  const p = PORT.toWorld(x, z);
  return { x: p.x, y, z: p.z };
};

/**
 * Ce qu'on touche au Port, d'un toucher dans le monde (`p`, le point touché, au sol ou sur un bâtiment) : une porte de
 * l'école (toute la largeur de son tiers de façade), la galerie, le lieu d'assemblage (des zones larges, jamais un
 * détail à viser), ou le reste du Port (sa fiche) ; rien hors du Port.
 */
export function portTouch(p: Vec2): PortSpot | 'fiche' | null {
  const l = PORT.toLocal(p);
  const inFront = l.z >= BACK_Z - 0.5 && l.z <= FACADE_Z + 2;
  if (inFront && Math.abs(l.x - SCHOOL.x) <= SCHOOL.width / 2 + 0.3) {
    let best: PortSubject = PORT_SUBJECTS[0];
    for (const s of PORT_SUBJECTS) if (Math.abs(l.x - doorX(s)) < Math.abs(l.x - doorX(best))) best = s;
    return best;
  }
  if (inFront && l.x >= GALLERY.east - GALLERY.most * GALLERY.arcade - 0.3 && l.x <= GALLERY.east + 0.3) return 'succes';
  if (inFront && Math.abs(l.x - HALL.x) <= HALL.width / 2 + 0.3) return 'chantier';
  const { quay, square } = PORT_PAVING;
  const near = (r: { x0: number; x1: number; z0: number; z1: number }) => l.x >= r.x0 - 1 && l.x <= r.x1 + 1 && l.z >= r.z0 - 1 && l.z <= r.z1 + 1;
  return near(quay) || near(square) || (l.z >= BACK_Z - 0.5 && l.z <= FACADE_Z && l.x >= square.x0 && l.x <= square.x1) ? 'fiche' : null;
}

/** Le cap de Kéo à un endroit du Port : face à sa façade, ou, au quai, face à la caméra. */
export function portHeading(spot: PortSpot): number {
  return spot === 'quai' ? Math.PI : PORT.yaw;
}

/** Ce que la caméra garde en vue pendant le panneau d'un endroit : le haut de sa porte, la galerie, l'établi, Kéo au quai. */
export function portSubject(spot: PortSpot, trophies = 0): Vec3 {
  if (spot === 'quai') return world3(PORT_QUAY_SPOT[0], portLevel(PORT_QUAY_SPOT[1]) + 1.2, PORT_QUAY_SPOT[1]);
  if (spot === 'succes') {
    const n = galleryArcades(trophies);
    return world3(GALLERY.east - (n * GALLERY.arcade) / 2, PLINTH + 1.3, 4.5);
  }
  if (spot === 'chantier') return world3(HALL.x, PLINTH + 1.4, 4.5);
  return world3(doorX(spot), PLINTH + 2.0, FACADE_Z);
}

/** Sur la Carte, le point de l'Escale : au-dessus du toit de l'école. */
export const PORT_MAP_POINT: Vec3 = world3(SCHOOL.x, PLINTH + SCHOOL.wall + 3.4, (BACK_Z + FACADE_Z) / 2);

/**
 * La scénette d'assemblage (pure) : les pièces de la recette sur l'établi, puis le bloc assemblé, à poser dans le
 * monde ; d'où il part (l'établi) et où il arrive (la place suivante du râtelier, `k` = la pile d'avant).
 */
export function assemblyScene(state: PortState): { pieces: Facets; made: Facets; from: Vec3; to: Vec3 } {
  const bench = { x: 0, y: 0, z: 0 };
  const madrier = new FacetBuilder();
  madrier.box({ x: 0, y: 0, z: 0, yaw: Math.PI / 2 }, MADRIER.size, darker(state.recipe.made), state.recipe.made);
  // Les pièces et le madrier, dans le repère de l'établi, tournés comme le Port (la vue les déplace en bloc).
  const turn = (f: Facets) => placeFacets(f, { x: 0, y: 0, z: 0, yaw: PORT.yaw });
  const slot = rackSlotLocal(Math.min(PILE_MOST - 1, Math.max(0, state.pile - 1)));
  // Le madrier part couché le long de l'établi, et arrive couché en travers du râtelier : un quart de tour en route.
  return {
    pieces: turn(benchPieces(state.recipe.pieces, bench)),
    made: turn(madrier.build()),
    from: world3(BENCH.x, PLINTH + BENCH.top, BENCH.z),
    to: world3(slot.x, slot.y, slot.z),
  };
}

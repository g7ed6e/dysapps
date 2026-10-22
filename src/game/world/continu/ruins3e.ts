// Les lieux du 3e en ruines simples (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses ») : à leur place,
// une silhouette lisible pour chacun, sans les finir ; leurs étapes viennent avec leur lot, un lieu par lot, et un lieu
// construit quittera ce fichier. Chaque ruine est dessinée dans le repère de son lieu (y = 0 au sol, sous le centre ; x
// vers l'est, z vers le sud), en quelques volumes de 4 à 6 aplats de la palette froide du 3e (./plan3e.ts,
// `COLORS_3E`) : le granit bleuté des Passeurs, l'ardoise, le bois gris, le bronze des ferrures, l'émail cobalt de la
// Coupole ; rien de presque noir, rien à lire (fiche, § 6 bis : ni chiffre, ni mot, ni légende). Les signatures sont
// celles de la fiche (§ 7), à grands traits : le phare éteint du Fanal, la coupole
// cobalt, le grand mât des Ondes… Code pur.
import type { FacetBuilder } from './facets';
import { COLORS_3E, type BuiltPlace3e, type PlaceId3e } from './plan3e';

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente. */
const SINK = -0.8;

const C = {
  granite: COLORS_3E.granite,
  graniteSun: COLORS_3E.graniteSun,
  graniteShade: COLORS_3E.graniteShade,
  slate: COLORS_3E.slate,
  slateTop: COLORS_3E.slateTop,
  wood: COLORS_3E.wood,
  woodShade: COLORS_3E.woodShade,
  bronze: COLORS_3E.bronze,
  cobalt: COLORS_3E.cobalt,
  snow: COLORS_3E.snow,
  pine: COLORS_3E.pine,
  pineShade: COLORS_3E.pineShade,
  // La pierre blanche des murs (l'Abri, la Coupole) : claire, un peu grise, jamais éblouissante.
  white: 0xdcd8cc,
  // Le verre d'une lanterne ou d'une fenêtre brisée : un gris-bleu clair, mat (jamais un reflet).
  glass: 0xa9bccc,
  // Les plantes du Jardin : un vert froid.
  leaf: 0x7f9a5c,
} as const;

/** Un tas de blocs tombés : trois pavés de travers. */
function rubble(b: FacetBuilder, x: number, z: number, s: number, color: number = C.graniteShade, top: number = C.granite): void {
  b.box({ x, y: SINK, z, yaw: 0.4 }, [s, s * 0.7 - SINK, s * 0.8], color, top);
  b.box({ x: x + s * 0.8, y: SINK, z: z + s * 0.3, yaw: 1.1 }, [s * 0.6, s * 0.45 - SINK, s * 0.6], color, top);
  b.box({ x: x - s * 0.5, y: SINK, z: z + s * 0.7, yaw: 2.3 }, [s * 0.5, s * 0.35 - SINK, s * 0.7], color, top);
}

/** Un poteau de bois, cassé ou non. */
const post = (b: FacetBuilder, x: number, z: number, h: number, w = 0.5): void => b.box({ x, y: SINK, z }, [w, h - SINK, w], C.woodShade, C.wood);

/** Le Fanal : le phare de granit éteint, sur son socle fendu en deux gradins ; sa lanterne aux vitres manquantes. */
function fanal(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [14, 2.4 - SINK, 11], C.graniteShade, C.granite);
  b.box({ x: 0, y: 2.4, z: -0.5 }, [9, 2.2, 7.5], C.graniteShade, C.graniteSun);
  b.prism({ x: 0, y: 4.6, z: -0.5 }, 2.6, 2, 13, 8, C.granite, C.graniteSun);
  b.prism({ x: 0, y: 17.6, z: -0.5 }, 1.9, 1.9, 2, 8, C.glass, C.slate);
  b.prism({ x: 0, y: 19.6, z: -0.5 }, 2.1, 0.4, 1.4, 8, C.slate, C.slateTop);
  rubble(b, 6, 4, 1.3);
}

/** La Rampe : le plan incliné de pierre, ses murets pleins ; le traîneau de pierre couché ; le cabestan de bois. */
function rampe(b: FacetBuilder): void {
  b.box({ x: 0, y: 0, z: 0, pitch: -0.18 }, [4.4, 0.6, 16], C.graniteShade, C.graniteSun);
  for (const s of [-1, 1]) b.box({ x: s * 2.6, y: 0, z: 0, pitch: -0.18 }, [0.7, 1.6, 16], C.graniteShade, C.granite);
  b.box({ x: -0.5, y: 0.6, z: 5, yaw: 0.5 }, [2, 1, 2.6], C.granite, C.graniteSun);
  b.drum({ x: 5, y: SINK, z: -5 }, 0.9, 1.6 - SINK, 8, C.wood, C.woodShade);
}

/** Le Standard : le petit poste de pierre, son toit tombé ; trois poteaux, l'un penché ; un tableau couché. */
function standard(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [5, 3 - SINK, 4], C.graniteShade, C.granite);
  b.box({ x: 3.6, y: SINK, z: 2, yaw: 0.4, pitch: 0.5 }, [3.4, 0.3 - SINK, 3], C.slate, C.slateTop);
  post(b, -4, 3, 5.5, 0.35);
  post(b, -7, 4, 5.5, 0.35);
  b.beam({ x: -10, y: 0, z: 5 }, { x: -9.5, y: 4.6, z: 6.8 }, 0.35, C.wood);
  b.box({ x: 1, y: SINK, z: 3.5, yaw: 0.2 }, [2.4, 0.6 - SINK, 1.4], C.woodShade, C.wood);
}

/** Le Kiosque : le kiosque rond, ses poteaux debout, sa coupole basse tombée de travers ; la boîte aux lettres. */
function kiosque(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK, z: 0 }, 4.2, 4.2, 0.6 - SINK, 10, C.graniteShade, C.graniteSun);
  for (let k = 0; k < 6; k++) {
    const a = (2 * Math.PI * k) / 6;
    post(b, Math.cos(a) * 3.6, Math.sin(a) * 3.6, k === 4 ? 1.4 : 3.4, 0.35);
  }
  b.prism({ x: 1, y: 0.6, z: 5.6, pitch: 0.35 }, 3.4, 0.6, 1.4, 10, C.slate, C.slateTop);
  b.box({ x: -6, y: SINK, z: -2 }, [0.8, 1.4 - SINK, 0.6], C.cobalt);
}

/** La Maquette : la halle de bois ouverte, la moitié de son toit tombée ; dessous, le grand relief en masses ; la table. */
function maquette(b: FacetBuilder): void {
  for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4]] as const) post(b, x, z, 4.4);
  b.box({ x: -3, y: 4.4, z: 0 }, [6.6, 0.3, 9], C.woodShade, C.slateTop);
  b.box({ x: 0, y: SINK, z: 0 }, [8, 1 - SINK, 5], C.woodShade, C.leaf);
  b.box({ x: -1.5, y: 1, z: -0.5 }, [2.4, 0.6, 1.8], C.graniteSun);
  b.box({ x: 3, y: SINK, z: 4, yaw: 0.3, pitch: 0.4 }, [2.6, 0.8 - SINK, 1.4], C.woodShade, C.wood);
}

/** La Tribune : des gradins de pierre en demi-cercle, deux tombés ; l'auvent de la cloche, la cloche au sol. */
function tribune(b: FacetBuilder): void {
  // Les gradins : trois rangs de blocs en demi-cercle, ouverts vers le nord ; deux blocs du haut manquent.
  for (let k = 0; k < 3; k++)
    for (let j = 0; j < 5; j++) {
      if (k === 2 && (j === 1 || j === 4)) continue;
      const a = (Math.PI * (j + 0.5)) / 5;
      const r = 5 + k * 2;
      b.box({ x: Math.cos(a) * r, y: SINK, z: 1 + Math.sin(a) * r, yaw: Math.PI / 2 - a }, [2, 0.6 + k * 0.7 - SINK, 3.2 + k * 1.2], C.graniteShade, C.granite);
    }
  for (const x of [-1.5, 1.5]) post(b, x, -1, 3.6, 0.4);
  b.gableRoof({ x: 0, y: 3.6, z: -1 }, 4, 2, 1, C.slateTop, C.wood);
  b.prism({ x: 2.6, y: SINK, z: 1, pitch: 1.4 }, 0.9, 0.5, 1.4, 8, C.bronze);
}

/** La Douane : la maison de pierre basse ; la barrière de bois rompue ; une pile de malles. */
function douane(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: -1.5 }, [7, 2.8 - SINK, 5], C.graniteShade, C.granite);
  b.gableRoof({ x: 0, y: 2.8, z: -1.5 }, 7.4, 5.4, 1.6, C.slateTop, C.granite);
  post(b, 5, 3, 1.4);
  b.beam({ x: 5, y: 1.2, z: 3 }, { x: 8.5, y: 0, z: 4.4 }, 0.3, C.wood);
  b.box({ x: -4.5, y: SINK, z: 3, yaw: 0.3 }, [1.6, 1.2 - SINK, 1], C.wood, C.bronze);
}

/** L'Ermitage : un bois de pins ; le banc de pierre en rond ; une colonnade basse, deux colonnes tombées. */
function ermitage(b: FacetBuilder): void {
  for (const [x, z, h] of [[-6, -4, 7], [-3, -6, 8.5], [6, -5, 7.5]] as const) b.prism({ x, y: 0, z }, 1.8, 0, h, 6, C.pineShade, C.pine);
  b.annulus({ x: 0, y: SINK, z: 1.5 }, 2.6, 3.2, 0.9 - SINK, 10, C.graniteShade, C.granite, true);
  for (const x of [-3, -1, 1]) b.prism({ x, y: SINK, z: -2 }, 0.45, 0.4, 2.8 - SINK, 6, C.granite, C.graniteSun);
  b.box({ x: 3.5, y: SINK, z: -1, yaw: 0.5, pitch: Math.PI / 2 }, [0.8, 2.6, 0.8], C.granite, C.graniteSun);
}

/** La Coupole : la salle ronde de pierre blanche, sa coupole d'émail cobalt à moitié ouverte ; une grande table. */
function coupole(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK, z: 0 }, 5, 5, 3.4 - SINK, 10, C.white, C.graniteSun);
  b.prism({ x: 0, y: 3.4, z: 0 }, 4.6, 1.4, 2.6, 10, C.cobalt, C.cobalt);
  rubble(b, 6, 3, 1.2, C.cobalt, C.cobalt);
  b.box({ x: -6.5, y: SINK, z: 2 }, [2.6, 1 - SINK, 1.6], C.woodShade, C.wood);
}

/** La Lutherie : l'atelier de bois à grandes fenêtres, son toit tombé ; l'établi fendu ; des instruments couchés, du plus grand au plus petit. */
function lutherie(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: -1.5 }, [8, 3.4 - SINK, 5], C.woodShade, C.wood);
  b.box({ x: 0, y: 1.2, z: 1.06 }, [5.6, 1.6, 0.1], C.glass);
  b.box({ x: 1, y: 3.4, z: -1.5, pitch: 0.25 }, [8.4, 0.3, 5.6], C.slate, C.slateTop);
  b.box({ x: -5, y: SINK, z: 3, yaw: 0.2 }, [3, 1 - SINK, 1.2], C.woodShade, C.wood);
  [2.4, 1.8, 1.2].forEach((s, k) => b.box({ x: 2 + k * 1.6, y: SINK, z: 3.5 }, [s * 0.5, 0.3 - SINK, s], C.bronze, C.wood));
}

/** Les Ondes : la station de pierre ; le grand mât de bois haubané, debout ; le pavillon d'écoute en cornet, couché. */
function ondes(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [7, 3 - SINK, 5], C.graniteShade, C.granite);
  b.box({ x: 0, y: 3, z: 0 }, [7.4, 0.3, 5.4], C.slate, C.slateTop);
  b.prism({ x: -6, y: SINK, z: -3 }, 0.4, 0.25, 16 - SINK, 6, C.wood);
  for (const [x, z] of [[-9, -5], [-3, -5], [-6, 0.5]] as const) b.beam({ x, y: 0, z }, { x: -6, y: 13, z: -3 }, 0.1, C.woodShade);
  b.prism({ x: 5, y: 0.3, z: 3.5, pitch: Math.PI / 2 - 0.2 }, 1.4, 0.3, 2.6, 8, C.bronze);
}

/** Le Palais : le palais bas et long, son grand escalier ; un toit ouvert ; le gong couché. */
function palais(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: -2 }, [18, 3.6 - SINK, 6], C.white, C.graniteSun);
  b.box({ x: -4.5, y: 3.6, z: -2 }, [9, 0.4, 6.4], C.slate, C.slateTop);
  for (let k = 0; k < 3; k++) b.box({ x: 0, y: SINK, z: 1.6 + k * 0.9 }, [8 - k * 0.6, 0.9 - k * 0.3 - SINK, 1], C.graniteShade, C.granite);
  b.drum({ x: 7, y: SINK, z: 3, pitch: 1.3 }, 1.2, 0.25, 10, C.bronze);
}

/**
 * La ruine de chaque lieu du 3e pas encore construit, dessinée dans son repère : un lieu construit (./plan3e.ts,
 * `BUILT_PLACES_3E`) dessine sa ruine dans son fichier, avec ses étapes (le Belvédère, ./belvedere3e.ts ; le Grenier, ./grenier3e.ts ; l'Abri, ./abri3e.ts ; le Jardin, ./jardin3e.ts).
 */
export const RUINS_3E: Readonly<Record<Exclude<PlaceId3e, BuiltPlace3e>, (b: FacetBuilder) => void>> = {
  fanal,
  rampe,
  standard,
  kiosque,
  maquette,
  tribune,
  douane,
  ermitage,
  coupole,
  lutherie,
  ondes,
  palais,
};

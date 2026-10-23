// Les lieux du 3e en ruines simples (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses ») : à leur place,
// une silhouette lisible pour chacun, sans les finir ; leurs étapes viennent avec leur lot, un lieu par lot, et un lieu
// construit quittera ce fichier. Chaque ruine est dessinée dans le repère de son lieu (y = 0 au sol, sous le centre ; x
// vers l'est, z vers le sud), en quelques volumes de 4 à 6 aplats de la palette froide du 3e (./plan3e.ts,
// `COLORS_3E`) : le granit bleuté des Passeurs, l'ardoise, le bois gris, le bronze des ferrures, l'émail cobalt de la
// Coupole ; rien de presque noir, rien à lire (fiche, § 6 bis : ni chiffre, ni mot, ni légende). Les signatures sont
// celles de la fiche (§ 7), à grands traits : la tour éteinte du Fanal, de pierre claire à deux bandes d'ardoise, la coupole
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
  // La pierre claire du Fanal, celle du Parvis.
  stone: COLORS_3E.parvis,
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

/**
 * La tour du Fanal (relecture des lieux, correction 10, et relecture du Versant, (a) 2) : de pierre claire, du haut du socle
 * (`y0`, rayon `r0`) au pied de la lanterne (`y1`, rayon `r1`), ceinte de deux larges bandes d'ardoise (`bands`, leur bas
 * et leur haut) : elle se lit par sa forme autant que par sa valeur, de partout, même dans le thème Contraste élevé ;
 * jamais de rayures rouges et blanches, jamais de cobalt.
 */
export const FANAL_TOWER_3E = { y0: 4.6, y1: 17.6, r0: 2.6, r1: 2.0, bands: [[8.0, 10.2], [12.6, 14.8]] as const } as const;

/** Le Fanal : sa tour de pierre claire à deux bandes d'ardoise, éteinte, sur son socle de granit fendu en deux gradins ; sa lanterne aux vitres manquantes, sous son toit d'ardoise. */
function fanal(b: FacetBuilder): void {
  b.box({ x: 0, y: SINK, z: 0 }, [14, 2.4 - SINK, 11], C.graniteShade, C.granite);
  b.box({ x: 0, y: 2.4, z: -0.5 }, [9, 2.2, 7.5], C.graniteShade, C.graniteSun);
  const T = FANAL_TOWER_3E;
  const r = (y: number) => T.r0 + ((T.r1 - T.r0) * (y - T.y0)) / (T.y1 - T.y0);
  const cuts = [T.y0, ...T.bands.flat(), T.y1];
  for (let k = 1; k < cuts.length; k++) {
    const band = k % 2 === 0;
    b.prism({ x: 0, y: cuts[k - 1], z: -0.5 }, r(cuts[k - 1]), r(cuts[k]), cuts[k] - cuts[k - 1], 8, band ? C.slate : C.stone, band ? C.slateTop : C.stone);
  }
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

/**
 * La ruine de chaque lieu du 3e pas encore construit, dessinée dans son repère : un lieu construit (./plan3e.ts,
 * `BUILT_PLACES_3E`) dessine sa ruine dans son fichier, avec ses étapes (le Belvédère, ./belvedere3e.ts ; le Grenier, ./grenier3e.ts ; l'Abri, ./abri3e.ts ; le Jardin, ./jardin3e.ts ; le Kiosque, ./kiosque3e.ts ; la Maquette, ./maquette3e.ts ; la Tribune, ./tribune3e.ts ; la Douane, ./douane3e.ts ; l'Ermitage, ./ermitage3e.ts ; le Palais, ./palais3e.ts ; la Coupole, ./coupole3e.ts ; la Lutherie, ./lutherie3e.ts ; les Ondes, ./ondes3e.ts).
 */
export const RUINS_3E: Readonly<Record<Exclude<PlaceId3e, BuiltPlace3e>, (b: FacetBuilder) => void>> = {
  fanal,
  rampe,
  standard,
};

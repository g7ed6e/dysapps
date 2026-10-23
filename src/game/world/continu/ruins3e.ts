// Les lieux du 3e en ruines simples (lot 1 du monde ouvert du 3e, « les Îles du Ciel en grandes masses ») : à leur place,
// une silhouette lisible pour chacun, sans les finir ; leurs étapes viennent avec leur lot, un lieu par lot, et un lieu
// construit quittera ce fichier. Chaque ruine est dessinée dans le repère de son lieu (y = 0 au sol, sous le centre ; x
// vers l'est, z vers le sud), en quelques volumes de 4 à 6 aplats de la palette froide du 3e (./plan3e.ts,
// `COLORS_3E`) : le granit bleuté des Passeurs, l'ardoise, le bois gris, le bronze des ferrures, l'émail cobalt de la
// Coupole ; rien de presque noir, rien à lire (fiche, § 6 bis : ni chiffre, ni mot, ni légende). Les signatures sont
// celles de la fiche (§ 7), à grands traits : le plan incliné de la Rampe, le petit poste du Standard… Code pur.
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
} as const;

/** Un poteau de bois, cassé ou non. */
const post = (b: FacetBuilder, x: number, z: number, h: number, w = 0.5): void => b.box({ x, y: SINK, z }, [w, h - SINK, w], C.woodShade, C.wood);

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
 * `BUILT_PLACES_3E`) dessine sa ruine dans son fichier, avec ses étapes (le Belvédère, ./belvedere3e.ts ; le Grenier, ./grenier3e.ts ; l'Abri, ./abri3e.ts ; le Jardin, ./jardin3e.ts ; le Kiosque, ./kiosque3e.ts ; la Maquette, ./maquette3e.ts ; la Tribune, ./tribune3e.ts ; la Douane, ./douane3e.ts ; l'Ermitage, ./ermitage3e.ts ; le Palais, ./palais3e.ts ; la Coupole, ./coupole3e.ts ; la Lutherie, ./lutherie3e.ts ; les Ondes, ./ondes3e.ts ; le Fanal, ./fanal3e.ts).
 */
export const RUINS_3E: Readonly<Record<Exclude<PlaceId3e, BuiltPlace3e>, (b: FacetBuilder) => void>> = {
  rampe,
  standard,
};

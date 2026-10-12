// Le décor du cœur des îles du 5e d'Archipéo, dessiné (piste 3 « hybride » au 5e, 11 octobre 2026 ; intention du
// directeur artistique du même jour : un cœur se dessine en entier ou reste en cubes, île par île). Même style et mêmes
// règles qu'au 6e (./heartDecor.ts) : les cubes du cœur restent ceux du monde, la construction d'Archipéo remplace
// chaque ensemble complet par un objet lisible (./inTheWorld.ts), de 12 à 150 triangles, le même de près et de loin,
// tourné avec l'île (GD-9) ; rien ne s'allume, rien ne bouge. Restent les formes communes : les rochers de pierre
// (une pierre sur presque chaque île) et l'arbre du Carrefour.
//
// Un objet à retrouver se détache de son sol (au moins 3:1 en luminance, sur une part de sa surface, mesuré sur l'image
// rendue) quand une teinte de sa famille le permet : claire sur un sol sombre (la pierre claire du Manoir, le livre blanc
// du Bourg, le sel crème de la Saline), sombre sur un sol clair (la toile de jute des sacs et les chants de la caisse sur
// la farine, le tuf sur le tuf, la glace sur la glace), jamais par une lueur ni par une teinte assombrie sous 0,05 de
// luminance. Là où rien ne l'atteint (l'herbe brumeuse du 5e), il garde le côté naturel de sa matière et se lit par sa
// silhouette (les planches, les pieds du pupitre, les piquets). Code pur, sans Three.js.
import type { BiomeId } from '../../biomes';
import { LANTERNE_DE_COUR } from '../architecture';
import { type Couleur, type Faces, luminance } from '../palette';
import type { TextureKind } from '../pixels';
import { scaleColor, type Tint, type Workshop } from './workshop';
import { crate, heap, lectern, milestone, OBJECT_COLORS as C, pebble, type Paint, sheaf, signpost, stoneStep, tableOnLegs } from './pieces';
import type { V3 } from '../decor/brush';
import { crystalShards, galleryEntrance, type HeartDecor, type HeartDrawing } from './heartDecor';

/** Le contraste que tient un flanc sombre sur son sol (3:1, un dixième de marge pour l'arrondi). */
const FLANK_CONTRAST = 3.1;

/** La luminance sous laquelle un flanc ne s'assombrit jamais (avis du directeur artistique : pas de flanc presque noir). */
const FLANK_FLOOR = 0.05;

/**
 * La part de sa luminance qu'une couleur garde à l'image sous la lumière et le voile du 5e, mesurée sur les captures du
 * 11 octobre 2026 : de jour, le dessus du sol (la farine, 0,78, rendue à 0,38 ; l'herbe, 0,20, à 0,10), le dessus d'un
 * objet (le livre crème, 0,79, à 0,59 ; la caisse de planches, 0,36, à 0,26), un côté d'objet (le flanc des sacs, 0,16, à
 * 0,09 ; 0,6 par prudence) ; la nuit, le sol comme les côtés (la farine à 0,13, le flanc des sacs à 0,03). Le contraste
 * se compte sur l'image : deux teintes assombries d'autant se rapprochent (le 0,05 de la formule ne baisse pas), et un
 * flanc qui tenait 3:1 en couleurs n'en tenait que 2,6 à l'écran (relevé du référent dys).
 */
export const SCENE_LIGHT = { ground: 0.49, top: 0.7, side: 0.6, night: 0.17 } as const;

/** Le contraste d'un flanc de luminance `f` sur un sol de luminance `g`, sous les parts de lumière `kg` et `kf`. */
const contrastUnder = (g: number, f: number, kg: number, kf: number) => {
  const [a, b] = [kg * g, kf * f];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/**
 * Le flanc d'une teinte `c` (déjà sous le voile de l'archipel : une matière, un rôle, `pe.color`) sur le sol `ground` :
 * la teinte assombrie pas à pas jusqu'à tenir 3:1 sur le dessus du sol à l'image, de jour, et la nuit aussi quand le sol
 * est assez clair pour que ce soit possible sans passer sous `FLANK_FLOOR` de luminance (`SCENE_LIGHT`). Sur un
 * sol clair (la farine, le tuf, la dalle), c'est un ton sombre de la matière ; là où seule une teinte presque noire y
 * arriverait (l'herbe sous la brume du 5e), le flanc garde la teinte telle quelle, le côté naturel de sa matière.
 * `inColours` : compté en couleurs, comme au lot 2 (ce que garde le thermomètre, jugé conforme).
 */
export function flankOn(pe: Paint, c: Couleur, ground: TextureKind, inColours = false): Couleur {
  const g = luminance(pe.material(ground).dessus);
  const L = SCENE_LIGHT;
  const tests: [number, number][] = inColours ? [[1, 1]] : [[L.ground, L.side]];
  if (!inColours && contrastUnder(g, FLANK_FLOOR, L.night, L.night) >= FLANK_CONTRAST + 0.2) tests.push([L.night, L.night]);
  for (let k = 20; k > 0; k--) {
    const f = scaleColor(c, k / 20);
    const l = luminance(f);
    if (l < FLANK_FLOOR) break;
    if (tests.every(([kg, kf]) => contrastUnder(g, l, kg, kf) >= FLANK_CONTRAST)) return f;
  }
  return c;
}

/** Le gris d'ardoise du flanc des congères (intention du directeur artistique), avant de l'assombrir. */
const SLATE_FLANK = 0x4a5e6a;

/** Une matière claire et unie : la dalle des cours, qui se lit sur les sols sombres (le lambris du Manoir). */
const lightStone = (pe: Paint): Faces => ({ dessus: pe.role('yardSlab'), cote: scaleColor(pe.role('yardSlab'), 0.92) });

/** La pierre claire de la tour du Manoir : la dalle des cours, sans ton plus sombre sur ses côtés (ils sont déjà dans l'ombre). */
const paleStone = (pe: Paint): Faces => ({ dessus: pe.role('yardSlab'), cote: pe.role('yardSlab') });

// ---------- Le Manoir du passé (grammaire anglaise) ----------

/** Les hauteurs de la tour du Manoir : le haut du socle, la moulure, le bas et le haut de la corniche, le faîte du toit. */
const CANDLE_TOWER = { base: 0.8, moulding: [1.9, 2.1], cornice: [3.74, 4.06], roof: 4.8 } as const;

/**
 * La tour de lambris (six cases : quatre de lambris, le chapeau noir, la bougie) : un haut socle de pierre claire, le fût
 * de lambris, une moulure et une corniche épaisse claires (elles se lisent sur le sol de lambris, retouche du consultant
 * d'Archipéo du 11 octobre 2026), le toit noir en pyramide, son dé, et la lanterne des cours en guise de bougie, éteinte
 * (un objet du cœur ne s'allume jamais).
 */
const candleTower: HeartDrawing = (at, pe) => {
  const light = paleStone(pe);
  const panel = pe.material('lambris');
  const dark = pe.color(C.tar);
  const T = CANDLE_TOWER;
  at.block(0.5, 0.5, 0.9, 0.9, 0, T.base, light);
  at.block(0.5, 0.5, 0.68, 0.68, T.base, T.cornice[0], panel, { bottom: true, top: true });
  at.block(0.5, 0.5, 0.76, 0.76, T.moulding[0], T.moulding[1], light, { bottom: false });
  at.block(0.5, 0.5, 0.86, 0.86, T.cornice[0], T.cornice[1], light, {});
  at.pyramid(0.5, 0.5, 0.43, 0.43, T.cornice[1], T.roof, dark);
  at.block(0.5, 0.5, 0.3, 0.3, 4.7, 5, dark, { bottom: true });
  at.facets(LANTERNE_DE_COUR, 0, 0, 5, (f) => pe.role(f.role ?? 'lanternFrame'), pe.role('lanternGlass'));
};

/** Le pilier de la grille (deux cases de pierre) : la borne commune, sa tête de dalle claire. */
const gatePillar: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 1.9, pe.material('pierre'), pe.role('yardSlab'));

/**
 * Une pile de planches de (x0, y0) à (x1, y1), posée en z0 : `layers` lits de trois planches épaisses de 0,16, en croix
 * d'un lit à l'autre (le premier le long de x, ou de y si `crossFirst`).
 */
export function boardPile(at: Workshop, x0: number, x1: number, y0: number, y1: number, z0: number, layers: number, board: Faces, crossFirst = false): void {
  const h = 0.16;
  for (let k = 0; k < layers; k++) {
    const z = z0 + k * h;
    for (let i = 0; i < 3; i++) {
      if ((k + (crossFirst ? 1 : 0)) % 2) {
        const w = (x1 - x0) / 3;
        at.box(x0 + i * w + 0.02, x0 + (i + 1) * w - 0.02, y0, y1, z, z + h, board, k + 1 < layers ? { bottom: true, top: true } : undefined);
      } else {
        const w = (y1 - y0) / 3;
        at.box(x0, x1, y0 + i * w + 0.02, y0 + (i + 1) * w - 0.02, z, z + h, board, k + 1 < layers ? { bottom: true, top: true } : undefined);
      }
    }
  }
}

/** Le lambris seul : une pile de deux lits de planches de lambris, sur deux cales de pierre claire. */
const panelPile: HeartDrawing = (at, pe) => {
  const light = lightStone(pe);
  for (const y of [0.24, 0.76]) at.block(0.5, y, 0.86, 0.2, 0, 0.16, light);
  boardPile(at, 0.1, 0.9, 0.12, 0.88, 0.16, 2, pe.material('lambris'));
};

// ---------- Le Bourg des chroniques (histoire, 5e) ----------

/**
 * Le pupitre du copiste (une case de planches, son plateau d'enluminure) : la table de planches sur quatre pieds de
 * planches, le pupitre d'enluminure en pente, le grand livre blanc ouvert dessus : c'est lui qui tient le contraste sur
 * l'herbe, de jour comme de nuit (relevé du référent dys du 11 octobre 2026).
 */
const copyistDesk: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const dark = flankOn(pe, planks.cote, 'herbe');
  tableOnLegs(
    at,
    0.1,
    0.9,
    0.14,
    0.86,
    0.98,
    0.16,
    { dessus: planks.dessus, cote: dark },
    [
      [0.22, 0.26],
      [0.78, 0.26],
      [0.78, 0.74],
      [0.22, 0.74],
    ],
    0.16,
    dark,
  );
  const vellum = pe.material('enluminure');
  lectern(at, pe, 0.16, 0.84, 0.2, 0.8, 0.98, { dessus: vellum.dessus, cote: flankOn(pe, vellum.cote, 'herbe') }, { colour: PAGE_WHITE, margin: 0.1 });
};

/** Le blanc des pages du livre du copiste, plus clair que le crème des objets. */
const PAGE_WHITE = 0xfbf7ee;

// ---------- La Saline des mélanges (physique-chimie, 5e) ----------

/**
 * Le sel crème de la Saline (directeur artistique, 11 octobre 2026), pris tel quel comme une matière (`plain`) : sur
 * l'herbe de jour, 3,6:1 au dessus, 3,2:1 aux côtés à l'image ; à 71 au moins du fantôme Brume en RVB, sans mélange vers
 * le gris.
 */
export const SALT_CREAM = 0xf4d79e;

/**
 * Le tas de sel (trois cases, deux de haut au coin) : un grand tas bas et deux petits, tout en sel crème, dessus et
 * flancs (un tas de sel reste clair : il se détache de l'herbe par sa teinte, sans pied sombre).
 */
const saltHeap: HeartDrawing = (at, pe) => {
  const salt = pe.plain(SALT_CREAM);
  heap(at, 0.85, 0.85, 0, 0.82, 1.3, salt, 8, 0.2);
  heap(at, 1.58, 0.44, 0, 0.34, 0.5, salt, 6, 0.2);
  heap(at, 0.44, 1.56, 0, 0.32, 0.46, salt, 6, 0.7);
};

// ---------- La Menuiserie des objets (technologie, 5e) ----------

/** Le tas de planches (deux au sol, une dessus) : trois lits de planches en croix, leurs chants dans le côté de la planche (`flankOn` : sur l'herbe, rien ne tient 3:1). */
const plankStack: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const board: Faces = { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'herbe') };
  boardPile(at, 0.08, 1.92, 0.12, 0.88, 0, 1, board);
  boardPile(at, 0.1, 0.9, 0.12, 0.88, 0.16, 2, board, true);
};

// ---------- Le Fournil des partages (EMC, 5e) ----------

/** La toile de jute des sacs du Fournil et leur ficelle (directeur artistique, 11 octobre 2026), prises telles quelles. */
export const SACK = { jute: 0x6b5434, string: 0x3a2a22 } as const;

/** Un sac de farine : le sac rond et plat en toile, son col serré, ouvert sur la farine, sa ficelle sombre. */
function flourSack(at: Workshop, pe: Paint, cx: number, cy: number, jute: Couleur, flour: Couleur): void {
  pebble(at, cx, cy, 0, 0.36, 0.7, jute, 6, 0.2);
  at.prism(cx, cy, 0.13, 0.1, 0.7, 0.84, 4, { dessus: flour, cote: jute }, Math.PI / 4);
  at.prism(cx, cy, 0.15, 0.15, 0.7, 0.75, 4, pe.plain(SACK.string), Math.PI / 4, true);
}

/**
 * Les sacs de farine contre la caisse (deux sacs, une caisse de planches) : les sacs tout en toile de jute, dessus
 * compris, la farine au seul col ouvert ; la caisse de planches et son couvercle aux chants sombres (sacs et chants
 * tiennent 3:1 sur le sol de farine du Fournil, à l'image, de jour).
 */
const flourSacks: HeartDrawing = (at, pe) => {
  const flour = pe.material('farine');
  const jute = pe.plain(SACK.jute);
  flourSack(at, pe, 0.5, 0.5, jute, flour.dessus);
  flourSack(at, pe, 1.5, 0.46, jute, flour.dessus);
  const planks = pe.material('planches');
  const board: Faces = { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'farine') };
  crate(at, 0.12, 0.88, 1.12, 1.88, 0, 0.78, board, board);
};

// ---------- La Grotte des légendes (latin-grec, 5e) ----------

/** Le rocher de tuf (deux cases, deux de haut au fond) : l'entrée de galerie, sans boisage, la butte au flanc sombre. */
const tuffCave: HeartDrawing = (at, pe) => {
  const tuff = pe.material('tuf');
  galleryEntrance(at, pe, tuff, { dessus: scaleColor(tuff.dessus, 0.7), cote: flankOn(pe, tuff.cote, 'tuf') }, false);
};

// ---------- Le Glacier des relatifs (maths, 5e) ----------

/**
 * La hauteur du pied sombre d'une congère, sous la neige : assez haut pour se voir d'en haut (à 0,14 case, le pied
 * disparaissait, et la neige se confondait avec la glace du sol : relevé du référent dys du 11 octobre 2026).
 */
const DRIFT_FOOT = 0.26;

/**
 * Une congère au centre (cx, cy), posée en z0, de rayon `r` et haute de `h` : un pied bas au flanc sombre (le gris
 * d'ardoise des congères, assombri jusqu'à tenir 3:1 sur la glace), puis le tas de neige, son dessus de neige.
 */
function snowdrift(at: Workshop, cx: number, cy: number, z0: number, r: number, h: number, snow: Faces, rot: number): void {
  at.prism(cx, cy, r, r * 0.94, z0, z0 + DRIFT_FOOT, 7, snow.cote, rot, true);
  heap(at, cx, cy, z0 + DRIFT_FOOT, r * 0.94, h, snow, 7, rot);
}

/** La neige des congères (intention du directeur artistique : dessus #B3C1C7, flanc #4A5E6A assombri sur la glace). */
const driftSnow = (pe: Paint): Faces => ({ dessus: pe.role('snow'), cote: flankOn(pe, pe.color(SLATE_FLANK), 'glace') });

/** Les trois congères (trois cases en équerre) : une grande dans l'angle, deux petites sur ses ailes. */
const snowdrifts: HeartDrawing = (at, pe, e) => {
  const snow = driftSnow(pe);
  snowdrift(at, 0.82, 0.78, e.ground(0, 0), 0.74, 0.46, snow, 0.2);
  snowdrift(at, 1.58, 0.48, e.ground(1, 0), 0.4, 0.3, snow, 0.9);
  snowdrift(at, 0.46, 1.56, e.ground(0, 1), 0.38, 0.28, snow, 1.6);
};

/** Une congère seule (une case). */
const loneDrift: HeartDrawing = (at, pe) => snowdrift(at, 0.5, 0.5, 0, 0.44, 0.34, driftSnow(pe), 0.5);

/** Les mesures du thermomètre (une case, quatre de haut) : le socle de pierre, le tube de verre, la colonne rouge au tiers bas, l'épi d'or. */
const THERMOMETER = { base: { side: 0.72, upper: 0.56 }, collar: { radius: 0.26, upper: 0.7 }, tube: { radius: 0.17, upper: 3.62 }, finial: 3.98 } as const;

/**
 * Le thermomètre (quatre cases : deux de glace, une de verre, une d'or) : le socle de pierre au flanc sombre, sa bague,
 * le tube de verre uni à huit pans, la colonne rouge mate dans son tiers bas, l'épi d'or au sommet ; sans graduation.
 */
const thermometer: HeartDrawing = (at, pe) => {
  const T = THERMOMETER;
  // Le flanc compté en couleurs, comme au lot 2 : le directeur artistique a jugé le thermomètre conforme.
  const stone: Faces = { dessus: pe.role('yardSlab'), cote: flankOn(pe, pe.role('yardStone'), 'glace', true) };
  at.block(0.5, 0.5, T.base.side, T.base.side, 0, T.base.upper, stone);
  at.prism(0.5, 0.5, T.collar.radius, T.collar.radius, T.base.upper, T.collar.upper, 8, stone);
  const red = T.collar.upper + (T.tube.upper - T.collar.upper) / 3;
  at.prism(0.5, 0.5, T.tube.radius, T.tube.radius, T.collar.upper, red, 8, pe.color(THERMOMETER_RED), Math.PI / 8, true);
  at.prism(0.5, 0.5, T.tube.radius, T.tube.radius, red, T.tube.upper, 8, pe.material('verre'), Math.PI / 8, true);
  at.prism(0.5, 0.5, T.tube.radius + 0.03, 0, T.tube.upper, T.finial, 8, pe.material('or'));
};

/** Le rouge mat de la colonne du thermomètre (intention du directeur artistique). */
const THERMOMETER_RED = 0xb04a3a;

/**
 * La stalagmite de glace (deux cases) : les éclats de la Lagune, en glace, sur un pied de roche au flanc sombre ; leurs
 * pans dans le gris d'ardoise des congères assombri (la glace sur la glace ne se lirait pas), le dessus en glace.
 */
const iceSpike: HeartDrawing = (at, pe, e) => {
  const rock: Faces = { dessus: pe.role('yardStone'), cote: flankOn(pe, pe.role('yardStone'), 'glace') };
  at.prism(0.5, 0.5, 0.46, 0.38, 0, 0.12, 6, rock, 0.3, true);
  crystalShards(at, e, { dessus: pe.material('glace').dessus, cote: flankOn(pe, pe.color(SLATE_FLANK), 'glace') }, rock);
};

// ---------- L'étal (le Marché, le Comptoir) ----------

/**
 * Un étal : sa largeur et sa profondeur, les deux teintes des raies de son auvent, le sol où il se pose, les caisses
 * dessous ; `backPosts` : où se posent, le long de x, les deux poteaux du fond (aux coins, sauf si l'emprise n'y va pas) ;
 * `edge` : la teinte des rives de l'auvent (devant, celle de ses raies, et sur les côtés, l'ombre, sauf si elles se
 * perdent sur le sol) ; `thick` : l'épaisseur de l'auvent (`STALL.thick`, sauf si sa rive doit se voir d'en haut).
 */
interface StallShape {
  width: number;
  depth: number;
  stripes: readonly [Tint, Tint];
  ground: TextureKind;
  crates: readonly (readonly [number, number])[];
  backPosts?: readonly [number, number];
  edge?: Tint;
  thick?: number;
}

/** Les hauteurs de l'étal : le comptoir, l'auvent devant (bas) et au fond (haut), son épaisseur. */
const STALL = { counter: 0.96, front: 2.2, back: 2.84, thick: 0.08, post: 0.2 } as const;

/**
 * L'étal : quatre poteaux, le comptoir de planches devant et sa planche du dessus, leurs côtés posés par `flankOn` sur
 * le sol de l'étal ; l'auvent rayé en appentis qui descend vers l'avant, son dessous et ses rives dans l'ombre, deux
 * caisses dessous.
 */
function stall(at: Workshop, pe: Paint, s: StallShape): void {
  const dark = flankOn(pe, pe.role('yardPost'), s.ground);
  const planks = pe.material('planches');
  const board: Faces = { dessus: planks.dessus, cote: flankOn(pe, planks.cote, s.ground) };
  const [w, d] = [s.width, s.depth];
  const zAt = (y: number) => STALL.front + (y / d) * (STALL.back - STALL.front);
  const p = STALL.post / 2 + 0.08;
  const posts: [number, number][] = [
    [p, p],
    [w - p, p],
    ...(s.backPosts ?? [p, w - p]).map((x): [number, number] => [x, d - p]),
  ];
  const thick = s.thick ?? STALL.thick;
  for (const [x, y] of posts) at.block(x, y, STALL.post, STALL.post, 0, zAt(y) - thick, dark, { bottom: true, top: true });
  at.box(0.24, w - 0.24, 0.16, 0.62, 0, STALL.counter - 0.12, board, { bottom: true, top: true });
  at.box(0.14, w - 0.14, 0.1, 0.7, STALL.counter - 0.12, STALL.counter, board, {});
  for (const [x, y] of s.crates) crate(at, x - 0.3, x + 0.3, y - 0.3, y + 0.3, 0, 0.6, board, { dessus: planks.dessus, cote: dark });
  // L'auvent : une raie par demi-case, son dessus, son dessous ; la rive de devant et les deux flancs.
  const n = Math.round(w * 2);
  const top = (x: number, y: number): V3 => [x, y, zAt(y)];
  const under = (x: number, y: number): V3 => [x, y, zAt(y) - thick];
  for (let k = 0; k < n; k++) {
    const [x0, x1] = [(k * w) / n, ((k + 1) * w) / n];
    at.quad(top(x0, 0), top(x1, 0), top(x1, d), top(x0, d), [w / 2, d / 2, 0], s.stripes[k % 2]);
    at.quad(under(x0, 0), under(x1, 0), under(x1, d), under(x0, d), [w / 2, d / 2, 9], dark);
    at.quad(top(x0, 0), top(x1, 0), under(x1, 0), under(x0, 0), [w / 2, d / 2, STALL.front], s.edge ?? s.stripes[k % 2]);
  }
  for (const x of [0, w]) at.quad(top(x, 0), top(x, d), under(x, d), under(x, 0), [w / 2, d / 2, STALL.front], s.edge ?? dark);
}

// ---------- Le Marché des proportions (maths, 5e) ----------

/** L'étal du Marché (douze cases de trois sur quatre : quatre poteaux, l'auvent, deux caisses) : l'auvent à raies de toile crème et rouge. */
const canvasStall: HeartDrawing = (at, pe) =>
  stall(at, pe, {
    width: 3,
    depth: 4,
    stripes: [pe.color(C.cream), pe.material('toile').cote],
    ground: 'herbe',
    crates: [
      [1.5, 1.5],
      [2.5, 2.5],
    ],
  });

/** Une caisse de planches seule (une case), ses flancs sombres. */
const plankCrate: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const side = flankOn(pe, planks.cote, 'herbe');
  crate(at, 0.14, 0.86, 0.14, 0.86, 0, 0.72, { dessus: planks.dessus, cote: side }, { dessus: planks.dessus, cote: side });
};

/** Le ballot de toile (une case) : le rouleau couché de toile crème, ses deux bouts et ses deux liens rouges. */
const clothBolt: HeartDrawing = (at, pe) => {
  const cream = pe.color(C.cream);
  const red = pe.material('toile').cote;
  const [r, z] = [0.26, 0.27];
  at.roller('x', 0.12, 0.88, 0.5, z, r, 8, cream);
  for (const [x, toward] of [
    [0.12, 'nx'],
    [0.88, 'px'],
  ] as const)
    at.standingDisc([x, 0.5, z], toward, r * 1.08, 8, cream, Math.PI / 8);
  for (const x of [0.3, 0.6]) at.roller('x', x, x + 0.1, 0.5, z, r + 0.02, 8, red);
};

// ---------- Le Carrefour des homophones (français, 5e) ----------

/**
 * Le poteau indicateur (quatre cases de bois, trois panneaux) : la pièce de Sema, son poteau au flanc tenu sur l'herbe (`flankOn`), trois
 * planches-flèches de panneau à trois hauteurs, vers la gauche, la droite et le fond.
 */
const crossroadsSign: HeartDrawing = (at, pe) => {
  const trunk = pe.material('tronc');
  const panel = pe.material('panneau');
  signpost(
    at,
    pe,
    1.5,
    0.5,
    3.88,
    { dessus: trunk.dessus, cote: flankOn(pe, trunk.cote, 'herbe') },
    [
      { axis: 'x', toward: -1, z: 2.5, length: 1.46 },
      { axis: 'x', toward: 1, z: 3.5, length: 1.46 },
      { axis: 'y', toward: 1, z: 1.5, length: 1.4 },
    ],
    { dessus: panel.dessus, cote: panel.cote },
  );
};

/** Le panneau seul (une case) : une planche de panneau épaisse sur deux piquets dans le côté de leur bois (`flankOn` : sur l'herbe, rien ne tient 3:1) ; rien d'écrit. */
const lonePanel: HeartDrawing = (at, pe) => {
  const stake = flankOn(pe, pe.role('yardPost'), 'herbe');
  for (const x of [0.22, 0.78]) at.block(x, 0.5, 0.16, 0.16, 0, 0.92, stake, { bottom: true, top: true });
  for (const x of [0.22, 0.78]) at.pyramid(x, 0.5, 0.08, 0.08, 0.92, 1.0, stake);
  at.box(0.08, 0.92, 0.34, 0.5, 0.44, 0.86, pe.material('panneau'), {});
};

// ---------- Le Marais des temps (conjugaison, 5e) ----------

/** Une flaque : des disques d'eau (la nappe du kit) dans un large liseré clair, qui se lit sur la tourbe. */
function puddle(at: Workshop, pe: Paint, discs: readonly (readonly [number, number, number])[]): void {
  for (const [cx, cy, r] of discs) at.disc(cx, cy, 0.03, r, 8, pe.role('lisere'), Math.PI / 8);
  for (const [cx, cy, r] of discs) at.disc(cx, cy, 0.04, r * 0.72, 8, pe.role('nappe'), Math.PI / 8);
}

/** La grande flaque (trois cases en équerre). */
const bigPuddle: HeartDrawing = (at, pe) =>
  puddle(at, pe, [
    [0.92, 0.82, 0.8],
    [0.5, 1.56, 0.42],
  ]);

/** La flaque longue (deux cases le long de y). */
const longPuddle: HeartDrawing = (at, pe) =>
  puddle(at, pe, [
    [0.5, 0.6, 0.44],
    [0.5, 1.4, 0.44],
  ]);

/** Les mesures des roseaux : quatre tiges (pied, penchant), l'épi d'or plus petit que la case. */
const REEDS: readonly (readonly [number, number, number, number, number])[] = [
  [0.5, 0.48, 0.06, -0.04, 2.1],
  [0.28, 0.34, -0.16, -0.08, 1.7],
  [0.72, 0.36, 0.18, -0.06, 1.85],
  [0.46, 0.72, -0.02, 0.14, 1.55],
];

/**
 * Une touffe de roseaux (trois cases : deux de tige, l'épi) : quatre tiges épaisses en prismes, un peu penchées, chacune
 * coiffée de son épi d'or épais (l'épi tient 3:1 sur la tourbe).
 */
const reeds: HeartDrawing = (at, pe) => {
  const stem = pe.color(REED_GREEN);
  const head = pe.role('paille');
  for (const [x, y, dx, dy, h] of REEDS) {
    const top: V3 = [x + dx, y + dy, h];
    at.beam([x, y, -0.04], top, 0.15, stem);
    const u = 1 / Math.hypot(dx, dy, h);
    at.beam(top, [top[0] + dx * u * 0.5, top[1] + dy * u * 0.5, h + h * u * 0.5], 0.22, head, true);
  }
};

/** Le vert des tiges de roseau (celui du décor). */
const REED_GREEN = 0x8fae4f;

/** La souche (une case) : basse et large, l'écorce brune, le dessus scié clair (il se lit sur la tourbe). */
const stump: HeartDrawing = (at, pe) => at.prism(0.5, 0.5, 0.4, 0.33, 0, 0.36, 7, { dessus: pe.color(SAWN_WOOD), cote: pe.material('tronc').cote }, 0.3);

/** Le bois scié du dessus de la souche. */
export const SAWN_WOOD = 0xe2c999;

// ---------- Le Comptoir (vocabulaire anglais, 5e) ----------

/**
 * L'étal du Comptoir (trois cases de poteaux et d'auvent, une caisse au fond, sur une emprise en T : trois cases devant,
 * une au fond au milieu) : l'auvent à raies de tuile et de terre cuite, épais, ses rives dans la terre cuite (`flankOn` :
 * sur la tuile, aucun flanc ne tient 3:1 au-dessus de 0,05 de luminance, directeur artistique du 11 octobre 2026) ; les deux poteaux du fond rentrés
 * dans la case du fond, à 0,1 case de ses bords (ils débordaient d'une case hors de l'emprise, directeur artistique).
 */
const tileStall: HeartDrawing = (at, pe) => {
  const tile = pe.material('tuile');
  const inset = 0.1 + STALL.post / 2;
  stall(at, pe, {
    width: 3,
    depth: 2,
    stripes: [tile.dessus, scaleColor(tile.cote, 0.82)],
    ground: 'tuile',
    crates: [[1.5, 1.36]],
    backPosts: [1 + inset, 2 - inset],
    edge: flankOn(pe, tile.cote, 'tuile'),
    thick: 0.2,
  });
};

/** La pile de tuiles (une case) : trois lits épais un peu décalés, leurs chants dans la terre cuite (sur le sol de tuile du Comptoir, `flankOn`). */
const tilePile: HeartDrawing = (at, pe) => {
  const tile = pe.material('tuile');
  const t: Faces = { dessus: tile.dessus, cote: flankOn(pe, tile.cote, 'tuile') };
  for (const [k, dx, dy] of [
    [0, 0, 0],
    [1, 0.05, -0.04],
    [2, -0.03, 0.05],
  ])
    at.box(0.16 + dx, 0.84 + dx, 0.2 + dy, 0.8 + dy, k * 0.18, (k + 1) * 0.18, t, k < 2 ? { bottom: true, top: true } : undefined);
};

// ---------- Le Delta des ressources (géographie, 5e) ----------

/**
 * La rizière (deux cases) : le bord de terre (`flankOn`), son rebord, la nappe d'eau (#178078) dedans, deux rangs de
 * touffes de pousses (#4E8F36), sans stries.
 */
const paddy: HeartDrawing = (at, pe) => {
  const earth = pe.material('terre');
  const [x0, x1, y0, y1, h, r] = [0.04, 1.96, 0.08, 0.92, 0.26, 0.12];
  at.box(x0, x1, y0, y1, 0, h, { dessus: earth.dessus, cote: flankOn(pe, earth.cote, 'herbe') }, { bottom: true, top: true });
  const c: V3 = [1, 0.5, h - 1];
  const [i0, i1, j0, j1] = [x0 + r, x1 - r, y0 + r, y1 - r];
  at.quad([x0, y0, h], [x1, y0, h], [i1, j0, h], [i0, j0, h], c, earth.dessus);
  at.quad([x1, y0, h], [x1, y1, h], [i1, j1, h], [i1, j0, h], c, earth.dessus);
  at.quad([x1, y1, h], [x0, y1, h], [i0, j1, h], [i1, j1, h], c, earth.dessus);
  at.quad([x0, y1, h], [x0, y0, h], [i0, j0, h], [i0, j1, h], c, earth.dessus);
  const zw = h - 0.05;
  at.quad([i0, j0, zw], [i1, j0, zw], [i1, j1, zw], [i0, j1, zw], c, pe.role('nappe'));
  const shoot = pe.role('feuille');
  for (const y of [0.36, 0.64]) for (let k = 0; k < 6; k++) at.pyramid(0.3 + k * 0.28, y, 0.09, 0.09, zw, zw + 0.3, shoot);
};

/** Une botte de foin (une gerbe) sur le sol `ground` : la gerbe commune, son pied dans l'ombre (il tient 3:1 sur le sol). */
function hayBundle(at: Workshop, pe: Paint, ground: TextureKind): void {
  const straw = pe.role('paille');
  const head: Faces = { dessus: straw, cote: scaleColor(straw, 0.9) };
  sheaf(at, 0.5, 0.5, 0, 0.96, { dessus: straw, cote: flankOn(pe, scaleColor(straw, 0.84), ground) }, head, pe.color(C.wood));
}

/** La botte de foin du Delta, sur l'herbe. */
const deltaSheaf: HeartDrawing = (at, pe) => hayBundle(at, pe, 'herbe');

// ---------- La Prairie des climats (SVT, 5e) ----------

/**
 * Le rocher à strates (deux cases, deux de haut à droite) : quatre couches décalées, de bas en haut le brun, l'ocre,
 * le gris et le brun, les côtés posés par `flankOn` ; chacune d'un ton franc, aucune strie.
 */
const strataRock: HeartDrawing = (at, pe) => {
  const brown = pe.material('strate');
  const ochre = pe.color(OCHRE);
  const grey = pe.material('pierre');
  const layers: [number, number, number, number, number, number, Faces][] = [
    [0.04, 1.96, 0.1, 0.9, 0, 0.42, { dessus: brown.dessus, cote: flankOn(pe, brown.cote, 'herbe') }],
    [0.16, 1.9, 0.05, 0.84, 0.42, 0.8, { dessus: ochre, cote: scaleColor(ochre, 0.86) }],
    [0.9, 1.98, 0.14, 0.92, 0.8, 1.3, { dessus: grey.dessus, cote: flankOn(pe, grey.cote, 'herbe') }],
    [1.02, 1.86, 0.08, 0.84, 1.3, 1.78, brown],
  ];
  for (const [x0, x1, y0, y1, z0, z1, t] of layers) at.box(x0, x1, y0, y1, z0, z1, t);
};

/** L'ocre d'une couche du rocher à strates. */
const OCHRE = 0xc79a4a;

// ---------- Le Relais des voyageurs (LV2, 5e) ----------

/** Le poteau indicateur de bois (trois cases, deux planches) : la pièce de Sema, deux planches-flèches à deux hauteurs. */
const relaySign: HeartDrawing = (at, pe) => {
  const trunk = pe.material('tronc');
  const planks = pe.material('planches');
  signpost(
    at,
    pe,
    1.5,
    0.5,
    2.86,
    { dessus: trunk.dessus, cote: flankOn(pe, trunk.cote, 'dalle') },
    [
      { axis: 'x', toward: 1, z: 2.5, length: 1.46 },
      { axis: 'x', toward: -1, z: 1.6, length: 1.46 },
    ],
    { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'dalle') },
  );
};

/** Le montoir (une dalle) : deux marches de pierre, leurs côtés sombres (sur le sol de dalle du Relais). */
const mountingBlock: HeartDrawing = (at, pe) => {
  const side = flankOn(pe, pe.role('yardStone'), 'dalle');
  stoneStep(at, pe, 0.1, 0.9, 0.08, 0.92, 0, 0.42, side);
  stoneStep(at, pe, 0.1, 0.9, 0.5, 0.92, 0.42, 0.84, side);
};

/** La botte de foin du Relais, sur la dalle. */
const relaySheaf: HeartDrawing = (at, pe) => hayBundle(at, pe, 'dalle');

/** Le décor du cœur des îles du 5e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const HEART_DECOR_5E: Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>> = {
  'english-5e-grammar': [
    { name: 'tour', columns: [[9, 3]], drawing: candleTower },
    { name: 'pilier', columns: [[7, 2]], drawing: gatePillar },
    { name: 'lambris', columns: [[3, 9]], drawing: panelPile },
  ],
  'history-5e-middle-ages': [{ name: 'pupitre', columns: [[9, 3]], drawing: copyistDesk }],
  'physics-chemistry-5e-matter-universe': [
    {
      name: 'sel',
      columns: [
        [9, 3],
        [10, 3],
        [9, 4],
      ],
      drawing: saltHeap,
    },
  ],
  'technology-5e-design': [
    {
      name: 'planches',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: plankStack,
    },
  ],
  'civics-5e-equality-solidarity': [
    {
      name: 'farine',
      columns: [
        [9, 3],
        [10, 3],
        [9, 4],
      ],
      drawing: flourSacks,
    },
  ],
  'lca-5e-legends': [
    {
      name: 'tuf',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: tuffCave,
    },
  ],
  // Le lot 2 : les cœurs faits des formes nouvelles, chacun entier.
  'maths-5e-signed-numbers': [
    {
      name: 'congeres',
      columns: [
        [8, 2],
        [9, 2],
        [8, 3],
      ],
      drawing: snowdrifts,
    },
    { name: 'congere-est', columns: [[10, 5]], drawing: loneDrift },
    { name: 'congere-ouest', columns: [[3, 9]], drawing: loneDrift },
    { name: 'thermometre', columns: [[10, 3]], drawing: thermometer },
    { name: 'stalagmite', columns: [[1, 10]], drawing: iceSpike },
  ],
  'maths-5e-proportionality': [
    { name: 'etal', columns: [7, 8, 9].flatMap((x) => [2, 3, 4, 5].map((y) => [x, y] as const)), drawing: canvasStall },
    { name: 'caisse', columns: [[3, 9]], drawing: plankCrate },
    { name: 'ballot', columns: [[1, 10]], drawing: clothBolt },
  ],
  'french-5e-homophones': [
    {
      name: 'poteau',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
        [9, 4],
      ],
      drawing: crossroadsSign,
    },
    { name: 'panneau', columns: [[1, 10]], drawing: lonePanel },
  ],
  'french-5e-conjugation': [
    {
      name: 'flaque',
      columns: [
        [8, 2],
        [9, 2],
        [8, 3],
      ],
      drawing: bigPuddle,
    },
    {
      name: 'flaque-longue',
      columns: [
        [10, 4],
        [10, 5],
      ],
      drawing: longPuddle,
    },
    { name: 'roseaux-1', columns: [[7, 4]], drawing: reeds },
    { name: 'roseaux-2', columns: [[9, 5]], drawing: reeds },
    { name: 'roseaux-3', columns: [[3, 9]], drawing: reeds },
    { name: 'souche', columns: [[1, 10]], drawing: stump },
  ],
  'english-5e-vocabulary': [
    {
      name: 'etal',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
        [9, 4],
      ],
      drawing: tileStall,
    },
    { name: 'tuiles', columns: [[3, 9]], drawing: tilePile },
  ],
  'geography-5e-resources': [
    {
      name: 'riziere',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: paddy,
    },
    { name: 'botte', columns: [[3, 9]], drawing: deltaSheaf },
  ],
  'life-earth-sciences-5e-active-planet': [
    {
      name: 'strates',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: strataRock,
    },
  ],
  'lv2-5e-introductions': [
    {
      name: 'poteau',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
      ],
      drawing: relaySign,
    },
    { name: 'montoir', columns: [[11, 5]], drawing: mountingBlock },
    { name: 'botte', columns: [[3, 9]], drawing: relaySheaf },
  ],
};

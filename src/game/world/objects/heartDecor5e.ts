// Le décor du cœur des îles du 5e d'Archipéo, dessiné (piste 3 « hybride » au 5e, 11 octobre 2026 ; intention du
// directeur artistique du même jour : un cœur se dessine en entier ou reste en cubes, île par île). Même style et mêmes
// règles qu'au 6e (./heartDecor.ts) : les cubes du cœur restent ceux du monde, la construction d'Archipéo remplace
// chaque ensemble complet par un objet lisible (./inTheWorld.ts), de 12 à 150 triangles, le même de près et de loin,
// tourné avec l'île (GD-9) ; rien ne s'allume, rien ne bouge. Restent les formes communes : les rochers de pierre
// (une pierre sur presque chaque île) et l'arbre du Carrefour.
//
// Un objet à retrouver se détache de son sol (au moins 3:1 en luminance, sur une part de sa surface), par une teinte
// claire sur un sol sombre (la pierre claire du Manoir, le livre crème du Bourg), sinon par un flanc sombre (le sel, les
// planches et le pupitre sur l'herbe brumeuse, les sacs sur la farine, le tuf sur le tuf), jamais par une lueur.
// Code pur, sans Three.js.
import type { BiomeId } from '../../biomes';
import { apartFromGhost, LANTERNE_DE_COUR } from '../architecture';
import { type Couleur, type Faces, luminance } from '../palette';
import type { TextureKind } from '../pixels';
import { scaleColor, type Workshop } from './workshop';
import { crate, heap, lectern, milestone, OBJECT_COLORS as C, pebble, type Paint, tableOnLegs } from './pieces';
import { galleryEntrance, type HeartDecor, type HeartDrawing } from './heartDecor';

/** Le contraste que tient un flanc sombre sur son sol (3:1, un dixième de marge pour l'arrondi). */
const FLANK_CONTRAST = 3.1;

/**
 * Le flanc d'une teinte sur le sol `ground` : la teinte sous le voile de l'archipel, assombrie pas à pas jusqu'à tenir
 * 3:1 sur le dessus du sol. Sur l'herbe sous la brume du 5e (luminance 0,20), seule une teinte presque noire le tient ;
 * sur un sol clair (la farine, le tuf), un ton sombre de la matière.
 */
function flankOn(pe: Paint, c: Couleur, ground: TextureKind): Couleur {
  const g = luminance(pe.material(ground).dessus);
  for (let k = 20; k > 0; k--) {
    const f = pe.color(scaleColor(c, k / 20));
    const l = luminance(f);
    if ((Math.max(l, g) + 0.05) / (Math.min(l, g) + 0.05) >= FLANK_CONTRAST) return f;
  }
  return pe.color(0);
}

/** Le flanc du sel (le gris d'ardoise des congères, intention du directeur artistique), avant de l'assombrir. */
const SALT_FLANK = 0x4a5e6a;

/** Une matière claire et unie : la dalle des cours, qui se lit sur les sols sombres (le lambris du Manoir). */
const lightStone = (pe: Paint): Faces => ({ dessus: pe.role('yardSlab'), cote: scaleColor(pe.role('yardSlab'), 0.92) });

// ---------- Le Manoir du passé (grammaire anglaise) ----------

/**
 * La tour de lambris (six cases : quatre de lambris, le chapeau noir, la bougie) : un socle de pierre claire, le fût de
 * lambris, une moulure et la corniche claires (elles se lisent sur le sol de lambris), le toit noir en pyramide, son dé,
 * et la lanterne des cours en guise de bougie, éteinte (un objet du cœur ne s'allume jamais).
 */
const candleTower: HeartDrawing = (at, pe) => {
  const light = lightStone(pe);
  const panel = pe.material('lambris');
  const dark = pe.color(C.tar);
  at.block(0.5, 0.5, 0.9, 0.9, 0, 0.5, light);
  at.block(0.5, 0.5, 0.68, 0.68, 0.5, 3.9, panel, { bottom: true, top: true });
  at.block(0.5, 0.5, 0.76, 0.76, 1.9, 2.06, light, { bottom: false });
  at.block(0.5, 0.5, 0.86, 0.86, 3.9, 4.06, light, {});
  at.pyramid(0.5, 0.5, 0.43, 0.43, 4.06, 4.8, dark);
  at.block(0.5, 0.5, 0.3, 0.3, 4.7, 5, dark, { bottom: true });
  at.facets(LANTERNE_DE_COUR, 0, 0, 5, (f) => pe.role(f.role ?? 'lanternFrame'), pe.role('lanternGlass'));
};

/** Le pilier de la grille (deux cases de pierre) : la borne commune, sa tête de dalle claire. */
const gatePillar: HeartDrawing = (at, pe) => milestone(at, pe, 0, 0, 0, 1.9, pe.material('pierre'), pe.role('yardSlab'));

/**
 * Une pile de planches de (x0, y0) à (x1, y1), posée en z0 : `layers` lits de trois planches épaisses de 0,16, en croix
 * d'un lit à l'autre (le premier le long de x, ou de y si `crossFirst`).
 */
function boardPile(at: Workshop, x0: number, x1: number, y0: number, y1: number, z0: number, layers: number, board: Faces, crossFirst = false): void {
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
 * Le pupitre du copiste (une case de planches, son plateau d'enluminure) : la table de planches sur quatre pieds sombres,
 * le pupitre d'enluminure en pente, le livre crème ouvert dessus.
 */
const copyistDesk: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const dark = flankOn(pe, C.tar, 'herbe');
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
  lectern(at, pe, 0.16, 0.84, 0.2, 0.8, 0.98, { dessus: vellum.dessus, cote: flankOn(pe, vellum.cote, 'herbe') });
};

// ---------- La Saline des mélanges (physique-chimie, 5e) ----------

/**
 * Le tas de sel (trois cases, deux de haut au coin) : un grand tas bas et deux petits, le dessus de sel tenu à l'écart du
 * fantôme Brume, le flanc sombre (sur l'herbe, aucun blanc permis ne tient 3:1 : le flanc le tient).
 */
const saltHeap: HeartDrawing = (at, pe) => {
  const salt: Faces = { dessus: apartFromGhost(pe.material('sel').dessus), cote: flankOn(pe, SALT_FLANK, 'herbe') };
  heap(at, 0.85, 0.85, 0, 0.82, 1.3, salt);
  heap(at, 1.58, 0.44, 0, 0.34, 0.5, salt, 6);
  heap(at, 0.44, 1.56, 0, 0.32, 0.46, salt, 6, 0.7);
};

// ---------- La Menuiserie des objets (technologie, 5e) ----------

/** Le tas de planches (deux au sol, une dessus) : trois lits de planches en croix, leurs chants sombres. */
const plankStack: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const board: Faces = { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'herbe') };
  boardPile(at, 0.08, 1.92, 0.12, 0.88, 0, 1, board);
  boardPile(at, 0.1, 0.9, 0.12, 0.88, 0.16, 2, board, true);
};

// ---------- Le Fournil des partages (EMC, 5e) ----------

/** Un sac de farine : le sac rond et plat, son col serré, sa ficelle sombre. */
function flourSack(at: Workshop, pe: Paint, cx: number, cy: number, sack: Faces): void {
  pebble(at, cx, cy, 0, 0.36, 0.7, sack, 6, 0.2);
  at.prism(cx, cy, 0.13, 0.1, 0.7, 0.84, 4, sack, Math.PI / 4);
  at.prism(cx, cy, 0.15, 0.15, 0.7, 0.75, 4, pe.color(C.wood), Math.PI / 4, true);
}

/**
 * Les sacs de farine contre la caisse (deux sacs, une caisse de planches) : le dessus de farine, la toile de jute du
 * flanc assombrie (elle tient 3:1 sur le sol de farine du Fournil), la caisse de planches et son couvercle.
 */
const flourSacks: HeartDrawing = (at, pe) => {
  const flour = pe.material('farine');
  const sack: Faces = { dessus: flour.dessus, cote: flankOn(pe, flour.cote, 'farine') };
  flourSack(at, pe, 0.5, 0.5, sack);
  flourSack(at, pe, 1.5, 0.46, sack);
  const planks = pe.material('planches');
  crate(at, 0.12, 0.88, 1.12, 1.88, 0, 0.78, planks, { dessus: planks.dessus, cote: pe.color(C.lightWood) });
};

// ---------- La Grotte des légendes (latin-grec, 5e) ----------

/** Le rocher de tuf (deux cases, deux de haut au fond) : l'entrée de galerie, sans boisage, la butte au flanc sombre. */
const tuffCave: HeartDrawing = (at, pe) => {
  const tuff = pe.material('tuf');
  galleryEntrance(at, pe, tuff, { dessus: scaleColor(tuff.dessus, 0.7), cote: flankOn(pe, tuff.cote, 'tuf') }, false);
};

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
};

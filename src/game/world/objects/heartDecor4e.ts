// Le décor du cœur des îles du 4e d'Archipéo, dessiné (piste 3 « hybride » au 4e et au 3e, intention du directeur
// artistique du 12 octobre 2026 : un cœur se dessine en entier ou reste en cubes, île par île). Même style et mêmes
// règles qu'au 6e et au 5e (./heartDecor.ts, ./heartDecor5e.ts) : les cubes du cœur restent ceux du monde, la
// construction d'Archipéo remplace chaque ensemble complet par un objet lisible (./inTheWorld.ts), de 12 à 150
// triangles, le même de près et de loin, tourné avec l'île (GD-9) ; rien ne s'allume, rien ne bouge.
//
// Étape 2 : les cœurs que les pièces communes et les modèles du 6e et du 5e couvrent (l'Atelier, la Falaise, le Cabinet,
// l'Imprimerie, l'Escale, la Source, le Bassin, la Porte, le Jardin, la Colonnade). Étape 3 : la Forge, le Théâtre, la
// Gare et la Vigie, faits des formes nouvelles (./silhouettes43.ts : l'enclume, la scène à rideaux, la voie ferrée, la
// longue-vue). Restent les formes communes : les rochers de pierre.
//
// Contraste (docs/rendu/style.md) : une matière claire sur son propre sol (le calque de l'Atelier, le parchemin du
// Cabinet, la fresque de la Colonnade, l'acier de la Forge) garde son dessus et prend un flanc sombre de sa teinte
// (`flankOn`) ; l'ardoise de la Falaise, sombre sur l'ardoise, se lit par le dessus de ses gradins en ardoise fendue
// claire, le velours du Théâtre par sa frise et ses embrasses d'or, le sol de rails de la Gare par le dessus d'acier poli
// de ses rails. Code pur, sans
// Three.js.
import type { BiomeId } from '../../biomes';
import { LANTERNE_DE_COUR } from '../architecture';
import type { Faces } from '../palette';
import type { TextureKind } from '../pixels';
import type { V3 } from '../decor/brush';
import { darker, scaleColor, type Workshop } from './workshop';
import { crate, heap, lectern, OBJECT_COLORS as C, type Paint, pebble, tableOnLegs } from './pieces';
import { boardPile, flankedOn, flankOn, type HeartDecor, type HeartDrawing, layerPile, SAWN_WOOD, stoneBench, streetLamp } from './heartDecor';
import { anvil, curtainStage, FORMS_43, railTrack, spyglass } from './silhouettes43';

/** Les teintes propres au cœur du 4e (intention du directeur artistique) : l'ardoise fendue claire du dessus des gradins de la Falaise. */
const HEART_4E = { splitSlate: 0xaeb5be } as const;

/** Une caisse de planches seule (une case) sur le sol `ground`, ses flancs tenus sur lui (`flankOn`). 20 triangles. */
const plankCrateOn =
  (ground: TextureKind): HeartDrawing =>
  (at, pe) => {
    const planks = pe.material('planches');
    const side = flankOn(pe, planks.cote, ground);
    crate(at, 0.14, 0.86, 0.14, 0.86, 0, 0.72, { dessus: planks.dessus, cote: side }, { dessus: planks.dessus, cote: side });
  };


// ---------- L'Atelier (algèbre, 4e) ----------

/**
 * La table à dessin (trois cases de long : deux pieds de bois, le plateau de planches, le calque) : le plateau sur ses
 * quatre pieds de tronc, la planche à dessin de calque en pente (son flanc sombre sur le sol de calque).
 */
const draftingTable: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const trunk = pe.material('tronc');
  tableOnLegs(
    at,
    0.08,
    0.92,
    0.06,
    2.94,
    1.12,
    0.16,
    { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'calque') },
    [
      [0.22, 0.2],
      [0.78, 0.2],
      [0.78, 2.8],
      [0.22, 2.8],
    ],
    0.16,
    trunk.cote,
  );
  at.ramp(0.14, 0.86, 0.3, 2.7, 1.12, 1.18, 1.5, flankedOn(pe, pe.apart('calque'), 'calque'));
};

/** Les feuilles de calque (une case) : trois lits un peu décalés, leurs chants sombres sur le sol de calque. */
const tracingSheets: HeartDrawing = (at, pe) => layerPile(at, 3, 0.1, flankedOn(pe, pe.apart('calque'), 'calque'));

/** La pile de calques (deux cubes) : cinq lits épais un peu décalés, leurs chants sombres. */
const tracingPile: HeartDrawing = (at, pe) => layerPile(at, 5, 0.19, flankedOn(pe, pe.apart('calque'), 'calque'));

// ---------- La Falaise (accords, 4e) ----------

/** L'ardoise des gradins : le dessus en ardoise fendue claire, les flancs dans l'ardoise (intention du directeur artistique). */
const splitSlate = (pe: Paint): Faces => ({ dessus: pe.color(HEART_4E.splitSlate), cote: pe.material('ardoise').cote });

/**
 * La paroi d'ardoise en escalier (quatre cases, de quatre à une de haut) : un gradin par case, son dessus clair, ses
 * flancs d'ardoise ; un rebord fendu à chaque marche.
 */
const slateWall: HeartDrawing = (at, pe, e) => {
  const t = splitSlate(pe);
  for (let x = 0; x < 4; x++) {
    const cells = e.cells.filter((c) => c.x === x);
    if (!cells.length) continue;
    const z0 = e.ground(x, 0);
    const z1 = Math.max(...cells.map((c) => c.z)) + 1;
    at.box(x, x + 1, 0.08 + x * 0.02, 0.92 - x * 0.02, z0, z1 - 0.1, t, { bottom: true, top: true });
    at.box(x - 0.03, x + 1.03, 0.05 + x * 0.02, 0.95 - x * 0.02, z1 - 0.1, z1, t, { bottom: true });
  }
};

/** Les dalles d'ardoise (une case) : trois lits, le dessus clair, les chants d'ardoise. */
const slateSlabs: HeartDrawing = (at, pe) => layerPile(at, 3, 0.2, splitSlate(pe), 0.1);

// ---------- Le Cabinet (vocabulaire, 4e) ----------

/**
 * Les étagères (trois cases sur trois de haut) : deux joues de planches, le fond, quatre tablettes, et les rouleaux de
 * parchemin couchés dessus ; le bois au flanc sombre sur le parchemin du sol.
 */
const scrollShelves: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const wood = flankedOn(pe, planks, 'parchemin');
  for (const x of [0.04, 2.8]) at.box(x, x + 0.16, 0.12, 0.9, 0, 2.96, wood);
  at.box(0.2, 2.8, 0.78, 0.9, 0, 2.86, wood, { bottom: true, px: true, nx: true });
  for (const z of [0, 0.96, 1.92]) at.box(0.2, 2.8, 0.12, 0.78, z, z + 0.1, wood, { bottom: true, px: true, nx: true, py: true });
  at.box(0, 3, 0.08, 0.94, 2.86, 2.98, wood, {});
  const scroll = flankedOn(pe, pe.apart('parchemin'), 'parchemin');
  for (const [z, xs] of [
    [0.1, [0.75, 1.8]],
    [1.06, [0.9, 1.5, 2.2]],
    [2.02, [1.2]],
  ] as const)
    for (const x of xs) at.roller('y', 0.18, 0.72, x, z + 0.17, 0.17, 6, scroll);
};

/** Le pupitre du copiste (une case de planches, son plateau de parchemin) : la table de planches, le pupitre de parchemin en pente. */
const parchmentDesk: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const dark = flankOn(pe, planks.cote, 'parchemin');
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
  lectern(at, pe, 0.16, 0.84, 0.2, 0.8, 0.98, flankedOn(pe, pe.apart('parchemin'), 'parchemin'), { colour: C.cream, margin: 0.18 });
};

/** Le rouleau de parchemin couché (une case) : le rouleau, ses deux bouts, deux liens de bois. */
const parchmentRoll: HeartDrawing = (at, pe) => {
  const roll = flankedOn(pe, pe.apart('parchemin'), 'parchemin');
  const [r, z] = [0.26, 0.27];
  at.roller('x', 0.12, 0.88, 0.5, z, r, 8, roll);
  for (const [x, toward] of [
    [0.12, 'nx'],
    [0.88, 'px'],
  ] as const)
    at.standingDisc([x, 0.5, z], toward, r * 1.06, 8, roll.cote, Math.PI / 8);
  const tie = pe.material('planches').cote;
  for (const x of [0.3, 0.62]) at.roller('x', x, x + 0.08, 0.5, z, r + 0.02, 8, tie);
};

/** Le tas de planches du Cabinet (une case) : trois lits de planches en croix, leurs chants sombres sur le parchemin. */
const cabinetPlanks: HeartDrawing = (at, pe) => boardPile(at, 0.1, 0.9, 0.12, 0.88, 0, 3, flankedOn(pe, pe.material('planches'), 'parchemin'));

// ---------- L'Imprimerie (histoire, 4e) ----------

/**
 * La presse au repos (deux plaques de fonte) : le marbre de fonte, deux montants, la traverse, la platine, la vis de fer
 * et son barreau.
 */
const press: HeartDrawing = (at, pe) => {
  const iron = pe.material('fonte');
  const steel = pe.color(C.iron);
  at.box(0.08, 0.92, 0.1, 0.9, 0, 0.42, iron);
  for (const x of [0.17, 0.83]) at.block(x, 0.5, 0.14, 0.5, 0.42, 1.72, iron, { bottom: true, top: true });
  at.box(0.06, 0.94, 0.22, 0.78, 1.72, 1.9, iron, {});
  at.box(0.24, 0.76, 0.18, 0.82, 0.84, 1.08, iron, {});
  at.block(0.5, 0.5, 0.1, 0.1, 1.08, 1.72, steel, { bottom: true, top: true });
  at.beam([0.5, 0.14, 1.5], [0.5, 0.86, 1.5], 0.07, steel, true);
};

// ---------- L'Escale (géographie, 4e) ----------

/** Les deux conteneurs côte à côte (deux cases) : chacun sa caisse de conteneur, ses nervures sombres devant et derrière. */
const containers: HeartDrawing = (at, pe) => {
  const box = pe.material('conteneur');
  const rib = darker(box, 0.72).cote;
  for (const k of [0, 1]) {
    at.box(k + 0.04, k + 0.96, 0.08, 0.92, 0, 0.9, box);
    for (const y of [0.078, 0.922])
      for (const x of [k + 0.26, k + 0.5, k + 0.74]) at.quad([x - 0.03, y, 0.06], [x + 0.03, y, 0.06], [x + 0.03, y, 0.84], [x - 0.03, y, 0.84], [x, 0.5, 0.45], rib);
  }
};

// ---------- La Source des espèces (SVT, 4e) ----------

/**
 * La vasque d'eau cerclée de galets (trois sur trois) : la margelle ronde de galet, son dessus, sa paroi intérieure, la
 * nappe et son liseré clair, deux galets posés au bord.
 */
const basin: HeartDrawing = (at, pe) => {
  const pebbleStone = pe.material('galet');
  const n = 10;
  const [r0, r1, ri, zRim, zWater] = [1.42, 1.32, 0.98, 0.62, 0.46];
  at.prism(1.5, 1.5, r0, r1, 0, zRim, n, pebbleStone, Math.PI / n, true);
  at.annulus(1.5, 1.5, zRim, ri, r1, n, pebbleStone.dessus);
  at.innerWall(1.5, 1.5, ri, zWater, zRim, n, pebbleStone.cote);
  at.disc(1.5, 1.5, zWater, ri, n, pe.color(C.edge));
  at.disc(1.5, 1.5, zWater + 0.005, ri * 0.84, n, pe.color(C.water));
  pebble(at, 0.42, 2.5, 0, 0.26, 0.3, pebbleStone, 4, 0.4);
  pebble(at, 2.6, 0.4, 0, 0.22, 0.26, pebbleStone, 4, 0.9);
};

// ---------- Le Bassin (technologie, 4e) ----------

/** La maquette de maison sur sa caisse (une case, trois de haut) : la caisse de planches, la maison de liège, son toit de tuile. */
const modelHouse: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  const side = flankOn(pe, planks.cote, 'herbe');
  crate(at, 0.1, 0.9, 0.1, 0.9, 0, 0.92, { dessus: planks.dessus, cote: side }, { dessus: planks.dessus, cote: side });
  const cork = pe.material('liege');
  at.box(0.24, 0.76, 0.26, 0.74, 0.92, 1.56, cork);
  at.quad([0.42, 0.258, 0.92], [0.58, 0.258, 0.92], [0.58, 0.258, 1.22], [0.42, 0.258, 1.22], [0.5, 0.5, 1.2], C.shadow);
  at.roof(0.18, 0.82, 0.2, 0.8, 1.56, 1.98, 'x', 0.06, pe.material('tuile'), { tint: cork, zFoot: 1.56 });
};

// ---------- La Porte (EMC, 4e) ----------

/** La pile de pavés (trois cubes : deux au sol, un dessus) : chaque pavé un bloc taillé, son dessus chanfreiné. */
const cobbles: HeartDrawing = (at, pe, e) => {
  const stone = pe.material('pave');
  const t: Faces = { dessus: stone.dessus, cote: flankOn(pe, stone.cote, 'pave') };
  for (const c of e.cells) {
    const [cx, cy] = [c.x + 0.5, c.y + 0.5];
    const z = c.z * 0.84;
    const turn = c.z ? 0.12 : 0;
    at.prism(cx, cy, 0.42 * Math.SQRT2, 0.42 * Math.SQRT2, z, z + 0.7, 4, t, Math.PI / 4 + turn, true);
    at.prism(cx, cy, 0.42 * Math.SQRT2, 0.34 * Math.SQRT2, z + 0.7, z + 0.84, 4, t, Math.PI / 4 + turn);
  }
};

// ---------- Le Jardin (allemand ou espagnol, 4e) ----------

/**
 * Le carré potager (quatre sur trois) : le bord d'osier, la terre à plat dedans, deux rangs de touffes de feuilles.
 */
const vegetableSquare: HeartDrawing = (at, pe) => {
  const wicker = pe.material('osier');
  const h = 0.62;
  at.box(0.05, 3.95, 0.05, 0.4, 0, h, wicker);
  at.box(0.05, 3.95, 2.6, 2.95, 0, h, wicker);
  for (const x of [0.05, 3.6]) at.box(x, x + 0.35, 0.4, 2.6, 0, h, wicker, { bottom: true, py: true, ny: true });
  const earth = pe.material('terre');
  at.quad([0.4, 0.4, h - 0.12], [3.6, 0.4, h - 0.12], [3.6, 2.6, h - 0.12], [0.4, 2.6, h - 0.12], [2, 1.5, -1], earth.dessus);
  const leaf: Faces = { dessus: pe.color(C.leaf), cote: pe.color(scaleColor(C.leaf, 0.8)) };
  for (const [x, y] of [
    [1.15, 1.05],
    [2.05, 1.05],
    [2.95, 1.05],
    [1.15, 1.95],
    [2.05, 1.95],
    [2.95, 1.95],
  ])
    heap(at, x, y, h - 0.12, 0.34, 0.42, leaf, 5, 0.3);
};

/**
 * Le poteau-lanterne éteint du Jardin (trois cases : deux de tronc, la tête d'ardoise) : le pied de pierre, le poteau de
 * tronc, la tête de lanterne des cours, ses vitres d'ardoise (éteinte : la nuit, le jardin ne luit pas, DA, LV2-4).
 */
const gardenLamp: HeartDrawing = (at, pe) => {
  const trunk = pe.material('tronc');
  at.block(0.5, 0.5, 0.42, 0.42, 0, 0.16, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });
  at.block(0.5, 0.5, 0.22, 0.22, 0.16, 2, trunk, { bottom: true, top: true });
  at.facets(LANTERNE_DE_COUR, 0, 0, 2, (f) => pe.role(f.role ?? 'lanternFrame'), pe.material('ardoise').cote);
};

/** Le panier d'osier (une case) : le panier évasé à six pans, sa terre sombre dedans, son anse. */
const basket: HeartDrawing = (at, pe) => {
  const wicker = pe.material('osier');
  at.prism(0.5, 0.5, 0.3, 0.38, 0, 0.42, 6, wicker, Math.PI / 6, true);
  at.disc(0.5, 0.5, 0.36, 0.36, 6, pe.material('terre').cote, Math.PI / 6);
  at.beam([0.16, 0.5, 0.42], [0.5, 0.5, 0.74], 0.06, wicker.cote);
  at.beam([0.5, 0.5, 0.74], [0.84, 0.5, 0.42], 0.06, wicker.cote);
};

// ---------- La Colonnade (latin et grec, 4e) ----------

/** Le pan de mur peint (deux cases) : le mur de fresque (son flanc sombre sur le sol de fresque), son chaperon de pierre claire. */
const frescoWall: HeartDrawing = (at, pe) => {
  at.box(0.06, 1.94, 0.3, 0.7, 0, 0.88, flankedOn(pe, pe.apart('fresque'), 'fresque'));
  at.box(0, 2, 0.24, 0.76, 0.88, 1.02, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') }, {});
};

/** Le banc de pierre devant le mur (une case) : la dalle claire sur ses deux pieds de pierre. */
const colonnadeBench: HeartDrawing = (at, pe) => stoneBench(at, { dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });

// ---------- La Forge (puissances, 4e) ----------

/**
 * Un lingot couché (le lingot facetté du trophée, en long) au centre (cx, cy), posé en z0 : un tronc de pyramide de
 * `lx` × `ly`, haut de `h`, son dessus en retrait, le long de x ou de y (`along`). 10 triangles.
 */
function ingotBar(at: Workshop, cx: number, cy: number, z0: number, lx: number, ly: number, h: number, t: Faces, along: 'x' | 'y' = 'x'): void {
  const [ax, ay] = along === 'x' ? [lx / 2, ly / 2] : [ly / 2, lx / 2];
  const [bx, by] = along === 'x' ? [ax - 0.06, ay - 0.05] : [ax - 0.05, ay - 0.06];
  const z1 = z0 + h;
  const lower: V3[] = [
    [cx - ax, cy - ay, z0],
    [cx + ax, cy - ay, z0],
    [cx + ax, cy + ay, z0],
    [cx - ax, cy + ay, z0],
  ];
  const upper: V3[] = [
    [cx - bx, cy - by, z1],
    [cx + bx, cy - by, z1],
    [cx + bx, cy + by, z1],
    [cx - bx, cy + by, z1],
  ];
  const inside: V3 = [cx, cy, z0 + h * 0.3];
  for (let i = 0; i < 4; i++) at.quad(lower[i], lower[(i + 1) % 4], upper[(i + 1) % 4], upper[i], inside, t);
  at.quad(upper[0], upper[1], upper[2], upper[3], inside, t);
}

/** Les mesures de la cheminée de la Forge : le fût, la corniche, la couronne de braise. */
const CHIMNEY = { shaft: 0.66, upper: 3.08, cornice: [0.8, 3.24], crown: [0.7, 3.78] } as const;

/**
 * La cheminée de la Forge (quatre cases : trois de pierre, le sommet) : le fût de pierre, sa corniche de dalle claire,
 * la couronne de braise mate, le conduit sombre au dessus. Sans fumée ni lueur (comme la tour à bougie du Manoir).
 */
const chimney: HeartDrawing = (at, pe) => {
  const K = CHIMNEY;
  at.block(0.5, 0.5, K.shaft, K.shaft, 0, K.upper, flankedOn(pe, pe.material('pierre'), 'acier'), { bottom: true, top: true });
  at.block(0.5, 0.5, K.cornice[0], K.cornice[0], K.upper, K.cornice[1], { dessus: pe.role('yardSlab'), cote: flankOn(pe, pe.role('yardStone'), 'acier') });
  at.block(0.5, 0.5, K.crown[0], K.crown[0], K.cornice[1], K.crown[1], { dessus: pe.color(C.shadow), cote: pe.color(C.ember) });
};

/** L'enclume d'acier sur son billot (une case). */
const forgeAnvil: HeartDrawing = (at, pe) => anvil(at, flankedOn(pe, pe.apart('acier'), 'acier'), { dessus: pe.color(SAWN_WOOD), cote: flankOn(pe, pe.material('tronc').cote, 'acier') });

/** Le lingot d'or (une case) : deux lingots couchés côte à côte, un troisième en travers dessus. */
const goldIngots: HeartDrawing = (at, pe) => {
  const gold = flankedOn(pe, pe.material('or'), 'acier');
  for (const y of [0.32, 0.68]) ingotBar(at, 0.5, y, 0, 0.7, 0.3, 0.2, gold);
  ingotBar(at, 0.5, 0.5, 0.2, 0.62, 0.28, 0.2, gold, 'y');
};

/** Les lingots d'acier (deux cubes) : trois lingots au sol, deux en travers dessus, un en long au sommet. */
const steelIngots: HeartDrawing = (at, pe) => {
  const steel = flankedOn(pe, pe.apart('acier'), 'acier');
  for (const y of [0.22, 0.5, 0.78]) ingotBar(at, 0.5, y, 0, 0.78, 0.26, 0.22, steel);
  for (const x of [0.34, 0.66]) ingotBar(at, x, 0.5, 0.22, 0.74, 0.28, 0.22, steel, 'y');
  ingotBar(at, 0.5, 0.5, 0.44, 0.66, 0.28, 0.22, steel);
};

// ---------- Le Théâtre (compréhension anglaise, 4e) ----------

/** La scène à rideaux (trois cases, quatre de haut aux colonnes) : ses rideaux de velours, sa frise et ses embrasses d'or, son estrade de planches. */
const theatreStage: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  curtainStage(at, pe, pe.material('velours'), { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'velours') });
};

/**
 * Une lanterne de rampe (une case), éteinte : la tête de lanterne des cours posée sur un socle de planches, ses vitres
 * d'ardoise (rien ne s'allume au cœur).
 */
const footlight: HeartDrawing = (at, pe) => {
  const planks = pe.material('planches');
  at.block(0.5, 0.5, 0.56, 0.56, 0, 0.3, { dessus: planks.dessus, cote: flankOn(pe, planks.cote, 'velours') });
  at.facets(LANTERNE_DE_COUR, 0, 0, 0.3, (f) => pe.role(f.role ?? 'lanternFrame'), pe.material('ardoise').cote);
};

/** Le ballot de velours (une case) : le rouleau couché de velours, ses deux bouts, deux embrasses d'or. */
const velvetBolt: HeartDrawing = (at, pe) => {
  const velvet = pe.material('velours');
  const gold = pe.color(FORMS_43.stageGold);
  const [r, z] = [0.27, 0.28];
  at.roller('x', 0.12, 0.88, 0.5, z, r, 8, velvet);
  for (const [x, toward] of [
    [0.12, 'nx'],
    [0.88, 'px'],
  ] as const)
    at.standingDisc([x, 0.5, z], toward, r * 1.06, 8, velvet.cote, Math.PI / 8);
  for (const x of [0.28, 0.6]) at.roller('x', x, x + 0.14, 0.5, z, r + 0.03, 8, gold);
};

// ---------- La Gare (grammaire anglaise, 4e) ----------

/** La voie ferrée (six cases) : ses traverses sombres dans le côté du rail, le dessus des rails d'acier poli, ses deux butoirs. */
const station: HeartDrawing = (at, pe) => railTrack(at, pe, 6, true, pe.material('rail').cote);

/** Le bout de rail posé au sol (une case) : deux traverses et deux rails, sans butoir. */
const railPiece: HeartDrawing = (at, pe) => railTrack(at, pe, 1, false, pe.material('rail').cote);

// ---------- La Vigie (signaux, 4e) ----------

/** La longue-vue de la Vigie (deux cases, trois de haut) : le tube de bobine, le pied de bois. */
const lookout: HeartDrawing = (at, pe) =>
  spyglass(at, 0.5, 0.5, [0.08, 0.5, 1.94], [1.94, 0.5, 2.7], pe.material('bobine'), { dessus: pe.role('yardPost'), cote: scaleColor(pe.role('yardPost'), 0.86) });

/** Le décor du cœur des îles du 4e, ensemble par ensemble (colonnes dans la grille de `DECOR`). */
export const HEART_DECOR_4E: Readonly<Partial<Record<BiomeId, readonly HeartDecor[]>>> = {
  'maths-4e-powers': [
    { name: 'cheminee', columns: [[9, 3]], drawing: chimney },
    { name: 'enclume-1', columns: [[8, 5]], drawing: forgeAnvil },
    { name: 'enclume-2', columns: [[10, 5]], drawing: forgeAnvil },
    { name: 'lingot', columns: [[3, 9]], drawing: goldIngots },
    { name: 'lingots', columns: [[1, 10]], drawing: steelIngots },
  ],
  'english-4e-comprehension': [
    {
      name: 'scene',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
      ],
      drawing: theatreStage,
    },
    { name: 'rampe-1', columns: [[8, 2]], drawing: footlight },
    { name: 'rampe-2', columns: [[10, 2]], drawing: footlight },
    { name: 'velours', columns: [[3, 9]], drawing: velvetBolt },
  ],
  'english-4e-grammar': [
    { name: 'voie', columns: [6, 7, 8, 9, 10, 11].map((x) => [x, 4] as const), drawing: station },
    { name: 'signal', columns: [[12, 3]], drawing: streetLamp },
    { name: 'rail', columns: [[3, 9]], drawing: railPiece },
  ],
  'physics-chemistry-4e-signals-circuits': [
    {
      name: 'longue-vue',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: lookout,
    },
  ],
  'maths-4e-algebra': [
    {
      name: 'table',
      columns: [
        [-3, 5],
        [-3, 6],
        [-3, 7],
      ],
      drawing: draftingTable,
    },
    { name: 'calque', columns: [[8, 4]], drawing: tracingSheets },
    { name: 'pile', columns: [[3, 9]], drawing: tracingPile },
  ],
  'french-4e-agreement': [
    {
      name: 'paroi',
      columns: [
        [7, 2],
        [8, 2],
        [9, 2],
        [10, 2],
      ],
      drawing: slateWall,
    },
    { name: 'ardoise', columns: [[3, 9]], drawing: slateSlabs },
  ],
  'french-4e-vocabulary': [
    {
      name: 'etageres',
      columns: [
        [8, 3],
        [9, 3],
        [10, 3],
      ],
      drawing: scrollShelves,
    },
    { name: 'pupitre', columns: [[8, 5]], drawing: parchmentDesk },
    { name: 'parchemin', columns: [[3, 9]], drawing: parchmentRoll },
    { name: 'planches', columns: [[1, 10]], drawing: cabinetPlanks },
  ],
  'history-4e-revolutions': [
    { name: 'presse', columns: [[3, 9]], drawing: press },
    { name: 'caisse', columns: [[4, 9]], drawing: plankCrateOn('herbe') },
  ],
  'geography-4e-globalization': [
    {
      name: 'conteneurs',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: containers,
    },
    { name: 'caisse', columns: [[3, 9]], drawing: plankCrateOn('herbe') },
  ],
  'life-earth-sciences-4e-cells-evolution': [
    {
      name: 'vasque',
      columns: [8, 9, 10].flatMap((x) => [2, 3, 4].map((y) => [x, y] as const)),
      drawing: basin,
    },
  ],
  'technology-4e-modeling': [{ name: 'maquette', columns: [[9, 3]], drawing: modelHouse }],
  'civics-4e-rights-freedoms': [
    {
      name: 'paves',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: cobbles,
    },
  ],
  'lv2-4e-daily-life': [
    {
      name: 'potager',
      columns: [8, 9, 10, 11].flatMap((x) => [2, 3, 4].map((y) => [x, y] as const)),
      drawing: vegetableSquare,
    },
    { name: 'lanterne', columns: [[6, 3]], drawing: gardenLamp },
    { name: 'panier', columns: [[3, 9]], drawing: basket },
  ],
  'lca-4e-cities': [
    {
      name: 'mur',
      columns: [
        [9, 3],
        [10, 3],
      ],
      drawing: frescoWall,
    },
    { name: 'banc', columns: [[9, 2]], drawing: colonnadeBench },
  ],
};

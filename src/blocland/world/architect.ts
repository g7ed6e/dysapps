// L'architecte du village : le dessin des bâtiments des îles, en trois étapes (les murs, le toit, la cour), calculé à partir
// d'une forme (maison, tour, dôme, échoppe, hutte, kiosque, relais, jardin, refuge) et du bloc de l'île. Les cases sont relatives à la zone des
// plans de l'île (6 × 5 cases, z = 0 : premier bloc sur le sol) ; la façade et la porte sont devant (y bas), la cour aussi.
// Les blocs de finition (toit, porte, lanterne, barrière, escalier) viennent des coffres des étapes précédentes : un coffre
// donne exactement ceux de l'étape suivante (voir plans.ts).
import type { BiomeId, BlockId } from '../biomes';
import { BLOC } from '../biomes';

export interface ArchCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
}

export type Stages = [walls: ArchCell[], roof: ArchCell[], yard: ArchCell[]];

/** La zone des plans : 6 cases de large (x), 5 de profondeur (y). */
const ZW = 6;

type TowerTop = 'phare' | 'horloge' | 'creneaux';

export type BuildingStyle =
  | { kind: 'maison'; w?: 4 | 5; chimney?: 1 | 2 }
  | { kind: 'tour'; top: TowerTop; /** Un étage sur deux dans un autre bloc (les bandes d'un phare). */ stripes?: BlockId }
  | { kind: 'dome'; cap?: BlockId }
  | { kind: 'echoppe' }
  | { kind: 'hutte' }
  | { kind: 'kiosque' }
  | { kind: 'relais' }
  | { kind: 'jardin' }
  | { kind: 'refuge' };

/** La forme du bâtiment de chaque île (son nom, sa récompense et sa réplique sont dans docs/contenu/<île>.md, section « Les plans »). */
export const BUILDING_OF: Record<BiomeId, BuildingStyle> = {
  // Premiers Rivages (6e)
  'french-6e-phonology': { kind: 'maison' },
  'french-6e-letter-confusion': { kind: 'maison', chimney: 2 },
  'french-6e-word-spelling': { kind: 'dome', cap: BLOC.brique },
  'french-6e-grammar-spelling': { kind: 'maison', w: 5 },
  'french-6e-reading': { kind: 'tour', top: 'phare', stripes: BLOC.pierre },
  'maths-6e-calculation': { kind: 'maison' },
  'maths-6e-fractions': { kind: 'hutte' },
  'maths-6e-decimals': { kind: 'hutte' },
  'english-6e-vocabulary': { kind: 'maison' },
  'english-6e-grammar': { kind: 'tour', top: 'horloge' },
  // Îles Brumeuses (5e)
  'maths-5e-signed-numbers': { kind: 'dome' },
  'maths-5e-proportionality': { kind: 'echoppe' },
  'french-5e-homophones': { kind: 'maison' },
  'french-5e-conjugation': { kind: 'hutte' },
  'english-5e-vocabulary': { kind: 'echoppe' },
  'english-5e-grammar': { kind: 'maison', w: 5, chimney: 2 },
  'lv2-5e-introductions': { kind: 'relais' },
  // Anciens Ateliers (4e)
  'maths-4e-algebra': { kind: 'maison' },
  'maths-4e-powers': { kind: 'maison', chimney: 2 },
  'french-4e-agreement': { kind: 'hutte' },
  'french-4e-vocabulary': { kind: 'dome' },
  'english-4e-comprehension': { kind: 'maison', w: 5 },
  'english-4e-grammar': { kind: 'echoppe' },
  'lv2-4e-daily-life': { kind: 'jardin' },
  // Îles du Ciel (3e)
  'maths-3e-functions': { kind: 'tour', top: 'phare' },
  'maths-3e-geometry': { kind: 'kiosque' },
  'maths-3e-statistics': { kind: 'dome' },
  'french-3e-close-reading': { kind: 'tour', top: 'phare' },
  'english-3e-comprehension': { kind: 'maison' },
  'english-3e-grammar': { kind: 'tour', top: 'creneaux' },
  'lv2-3e-travel': { kind: 'refuge' },
};

// ---------- Outils ----------

const clampX = (x: number) => Math.max(0, Math.min(ZW - 1, x));

/** Les cases du tour d'un rectangle (coin x0, y0 ; w × d). */
function ring(x0: number, y0: number, w: number, d: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = x0; x < x0 + w; x++)
    for (let y = y0; y < y0 + d; y++) if (x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + d - 1) out.push([x, y]);
  return out;
}

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Retire les ouvertures (porte, fenêtres) d'une liste de cases. */
function without(cells: ArchCell[], holes: [number, number, number][]): ArchCell[] {
  const h = new Set(holes.map(([x, y, z]) => key(x, y, z)));
  return cells.filter((c) => !h.has(key(c.x, c.y, c.z)));
}

/**
 * La cour, devant le bâtiment : une barrière sur la rangée de devant avec un portillon face à la porte, une lanterne sur
 * chaque poteau du bout, une marche devant la porte et deux jardinières du bloc de l'île.
 */
function yard(b: BlockId, doorX: number, frontY: number): ArchCell[] {
  const out: ArchCell[] = [];
  for (let x = 0; x < ZW; x++) if (x !== doorX) out.push({ x, y: 0, z: 0, block: BLOC.barriere });
  out.push({ x: 0, y: 0, z: 1, block: BLOC.lanterne }, { x: ZW - 1, y: 0, z: 1, block: BLOC.lanterne });
  const step = frontY - 1;
  if (step > 0) out.push({ x: doorX, y: step, z: 0, block: BLOC.escalier });
  else out.push({ x: doorX, y: 0, z: 0, block: BLOC.escalier });
  // Deux jardinières, loin de la porte et du passage.
  const planters = [1, ZW - 2].filter((x) => Math.abs(x - doorX) > 1);
  for (const x of planters.length ? planters : [ZW - 1]) out.push({ x, y: Math.max(1, step), z: 0, block: b });
  return out;
}

// ---------- Les formes ----------

/**
 * La maison : murs de trois blocs, une porte, trois fenêtres éclairées (des lanternes), un toit à deux pans qui déborde
 * sur les côtés, des pignons, une cheminée.
 */
function maison(b: BlockId, w: 4 | 5 = 4, chimney: 1 | 2 = 1): Stages {
  const x0 = w === 5 ? 0 : 1;
  const y0 = 2;
  const d = 3;
  const h = 3;
  const doorX = x0 + 1;
  const windows: [number, number, number][] = [
    [x0 + w - 2, y0, 1],
    [x0, y0 + 1, 1],
    [x0 + w - 1, y0 + 1, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const wallsDone = without(walls, [[doorX, y0, 0], ...windows]);
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: 'lanterne' as BlockId }))];
  // Les deux pans (les rangées de devant et de derrière, au niveau h), le faîte au milieu (h + 1), les pignons.
  const seen = new Set<string>();
  const add = (c: ArchCell) => {
    if (seen.has(key(c.x, c.y, c.z))) return;
    seen.add(key(c.x, c.y, c.z));
    roof.push(c);
  };
  for (let x = clampX(x0 - 1); x <= clampX(x0 + w); x++) {
    add({ x, y: y0, z: h, block: BLOC.toit });
    add({ x, y: y0 + d - 1, z: h, block: BLOC.toit });
    add({ x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  }
  add({ x: x0, y: y0 + 1, z: h, block: b });
  add({ x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  // La cheminée, qui traverse le pan de derrière.
  const cx = x0 + w - 2;
  for (let k = 0; k < chimney; k++) add({ x: cx, y: y0 + d - 1, z: h + 1 + k, block: b });
  return [wallsDone, roof, yard(b, doorX, y0)];
}

/** La tour : trois × trois, quatre étages, une porte et trois fenêtres ; au sommet, une lanterne, un cadran ou des créneaux. */
function tour(b: BlockId, top: TowerTop, stripes?: BlockId): Stages {
  const x0 = 2;
  const y0 = 2;
  const h = 4;
  const doorX = 3;
  const windows: [number, number, number][] = [
    [3, y0, 2],
    [x0, y0 + 1, 2],
    [x0 + 2, y0 + 1, 2],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, 3, 3)) walls.push({ x, y, z, block: stripes && z % 2 === 0 ? stripes : b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: 'lanterne' as BlockId }))];
  const corners = new Set(['2,2', '4,2', '2,4', '4,4']);
  for (const [x, y] of ring(x0, y0, 3, 3)) {
    const corner = corners.has(`${x},${y}`);
    if (top === 'phare') roof.push({ x, y, z: h, block: corner ? b : BLOC.lanterne });
    else if (top === 'horloge') roof.push({ x, y, z: h, block: b });
    else if (corner) roof.push({ x, y, z: h, block: b });
  }
  if (top === 'phare' || top === 'horloge') {
    // Le toit en pointe : une croix de tuiles, le sommet au milieu (sous la limite de hauteur, z = 5).
    for (const [x, y] of [
      [3, 2],
      [2, 3],
      [3, 3],
      [4, 3],
      [3, 4],
    ])
      roof.push({ x, y, z: h + 1, block: BLOC.toit });
  }
  return [without(walls, [[doorX, y0, 0], ...windows]), roof, yard(b, doorX, y0)];
}

/**
 * Le dôme (igloo, four, observatoire) : deux rangs de murs aux coins arrondis, puis une coupole à gradins, une porte, une
 * lanterne au sommet. `cap` : la coupole dans un autre bloc (le four de brique sur le sable de la Carrière).
 */
function dome(b: BlockId, cap: BlockId = b): Stages {
  const x0 = 0;
  const y0 = 1;
  const w = 5;
  const d = 4;
  const doorX = 2;
  const round = (x: number, y: number) => !((x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + d - 1));
  const walls: ArchCell[] = [];
  for (let z = 0; z < 2; z++) for (const [x, y] of ring(x0, y0, w, d)) if (round(x, y)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }];
  // La coupole : le toit arrondi, puis deux gradins plus petits, et la lanterne.
  for (const [x, y] of ring(x0, y0, w, d)) if (round(x, y)) roof.push({ x, y, z: 2, block: cap });
  for (let x = x0 + 1; x < x0 + w - 1; x++) for (let y = y0 + 1; y < y0 + d - 1; y++) roof.push({ x, y, z: 2, block: cap });
  for (let x = x0 + 1; x < x0 + w - 1; x++) for (let y = y0 + 1; y < y0 + d - 1; y++) roof.push({ x, y, z: 3, block: cap });
  roof.push({ x: doorX, y: y0 + 1, z: 4, block: cap }, { x: doorX, y: y0 + 2, z: 4, block: cap });
  roof.push({ x: doorX, y: y0 + 1, z: 5, block: BLOC.lanterne });
  return [without(walls, [[doorX, y0, 0]]), roof, yard(b, doorX, y0)];
}

/** L'échoppe : un mur du fond, deux côtés, deux poteaux et un comptoir ; un auvent rayé à deux couleurs ; deux lanternes. */
function echoppe(b: BlockId): Stages {
  const walls: ArchCell[] = [];
  for (let z = 0; z < 3; z++) {
    for (let x = 1; x <= 4; x++) walls.push({ x, y: 4, z, block: b });
    walls.push({ x: 1, y: 3, z, block: b }, { x: 4, y: 3, z, block: b }, { x: 1, y: 2, z, block: b }, { x: 4, y: 2, z, block: b });
  }
  walls.push({ x: 2, y: 2, z: 0, block: b }, { x: 3, y: 2, z: 0, block: b });
  const roof: ArchCell[] = [
    { x: 2, y: 2, z: 1, block: BLOC.lanterne },
    { x: 3, y: 2, z: 1, block: BLOC.lanterne },
  ];
  // L'auvent : des rayures (tuiles et bloc de l'île, une colonne sur deux), qui débordent devant, un cran plus bas.
  for (let x = 0; x < ZW; x++) {
    const block: BlockId = x % 2 === 0 ? BLOC.toit : b;
    for (let y = 2; y <= 4; y++) roof.push({ x, y, z: 3, block });
    roof.push({ x, y: 1, z: 2, block });
  }
  return [walls, roof, yard(b, 2, 1)];
}

/** La hutte : des murs bas de deux blocs, une porte et une fenêtre, un toit en pointe de tuiles, une lanterne au sommet. */
function hutte(b: BlockId): Stages {
  const x0 = 1;
  const y0 = 2;
  const w = 4;
  const d = 3;
  const doorX = 2;
  const windows: [number, number, number][] = [[x0, y0 + 1, 1]];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 2; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, { x: x0, y: y0 + 1, z: 1, block: BLOC.lanterne }];
  // Le toit déborde d'une case tout autour (un anneau : le dessous est caché), puis se resserre en pointe.
  for (const [x, y] of ring(x0 - 1, y0 - 1, w + 2, d + 1)) roof.push({ x, y, z: 2, block: BLOC.toit });
  for (const [x, y] of ring(x0, y0, w, d)) roof.push({ x, y, z: 3, block: BLOC.toit });
  for (let x = x0 + 1; x < x0 + w - 1; x++) roof.push({ x, y: y0 + 1, z: 4, block: BLOC.toit });
  roof.push({ x: x0 + 1, y: y0 + 1, z: 5, block: BLOC.lanterne });
  // La cour d'une hutte commence sous le débord du toit : la marche à la rangée 0.
  return [without(walls, [[doorX, y0, 0], ...windows]), roof, yard(b, doorX, 1)];
}

/** Le kiosque : quatre colonnes et un plancher, un toit à deux pans, des lanternes aux colonnes. */
function kiosque(b: BlockId): Stages {
  const walls: ArchCell[] = [];
  for (const [x, y] of [
    [1, 2],
    [4, 2],
    [1, 4],
    [4, 4],
  ])
    for (let z = 0; z < 3; z++) walls.push({ x, y, z, block: b });
  for (let x = 2; x <= 3; x++) for (let y = 2; y <= 4; y++) walls.push({ x, y, z: 0, block: b });
  const roof: ArchCell[] = [];
  for (let x = 0; x < ZW; x++) {
    roof.push({ x, y: 2, z: 3, block: BLOC.toit }, { x, y: 4, z: 3, block: BLOC.toit }, { x, y: 3, z: 4, block: BLOC.toit });
  }
  roof.push({ x: 1, y: 3, z: 3, block: b }, { x: 4, y: 3, z: 3, block: b });
  roof.push({ x: 1, y: 3, z: 0, block: BLOC.lanterne }, { x: 4, y: 3, z: 0, block: BLOC.lanterne });
  return [walls, roof, yard(b, 2, 2)];
}

/**
 * Le relais de diligence (le Relais des voyageurs, LV2 5e) : trois plans, trois choses qu'on reconnaît (DA, LV2-2).
 * L'auberge : une maison de quatre sur trois à gauche, une porte, trois fenêtres. L'écurie : le toit à deux pans de
 * l'auberge et sa cheminée haute (le nid de Lina), et, à droite, un appentis ouvert sur deux poteaux, sous un toit plus
 * bas, une mangeoire entre eux. La fontaine : devant l'écurie, un bassin de dalles et sa colonne, et devant l'auberge une
 * barrière à portillon, deux lanternes et une marche. Ni drapeau ni colombage.
 */
function relais(b: BlockId): Stages {
  const x0 = 0;
  const y0 = 2;
  const w = 4;
  const d = 3;
  const h = 3;
  const doorX = 1;
  const windows: [number, number, number][] = [
    [2, y0, 1],
    [x0, y0 + 1, 1],
    [x0 + w - 1, y0 + 1, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: 'lanterne' as BlockId }))];
  // Le toit de l'auberge : deux pans et le faîte, qui débordent d'une case sur l'écurie ; les pignons ; la cheminée.
  for (let x = x0; x <= x0 + w; x++) {
    roof.push({ x, y: y0, z: h, block: BLOC.toit }, { x, y: y0 + d - 1, z: h, block: BLOC.toit }, { x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  }
  roof.push({ x: x0, y: y0 + 1, z: h, block: b }, { x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  for (let z = h + 1; z <= h + 2; z++) roof.push({ x: 1, y: y0 + d - 1, z, block: b });
  // L'écurie : deux poteaux, une mangeoire entre eux, un toit d'un cran plus bas que celui de l'auberge.
  for (let z = 0; z < 2; z++) roof.push({ x: 5, y: y0, z, block: b }, { x: 5, y: y0 + d - 1, z, block: b });
  roof.push({ x: 5, y: y0 + 1, z: 0, block: BLOC.barriere });
  for (let y = y0; y < y0 + d; y++) roof.push({ x: 4, y, z: 2, block: BLOC.toit }, { x: 5, y, z: 2, block: BLOC.toit });
  // La cour : la barrière et son portillon devant la porte, deux lanternes, la marche ; la fontaine devant l'écurie.
  const yard: ArchCell[] = [
    { x: 0, y: 0, z: 0, block: BLOC.barriere },
    { x: 2, y: 0, z: 0, block: BLOC.barriere },
    { x: 0, y: 0, z: 1, block: BLOC.lanterne },
    { x: 2, y: 0, z: 1, block: BLOC.lanterne },
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
  ];
  for (const [x, y] of [
    [3, 0],
    [4, 0],
    [5, 0],
    [3, 1],
    [5, 1],
  ])
    yard.push({ x, y, z: 0, block: b });
  yard.push({ x: 4, y: 1, z: 0, block: b }, { x: 4, y: 1, z: 1, block: b });
  return [without(walls, [[doorX, y0, 0], ...windows]), roof, yard];
}

/**
 * Le jardin (le Jardin des heures, LV2 4e) : trois plans, trois choses qu'on reconnaît (DA, LV2-4). La cuisine : une
 * maison d'osier de quatre sur trois à gauche, une porte, deux fenêtres. La tonnelle : le toit à deux pans de la cuisine
 * et sa cheminée d'ardoise (la soupe de Muscade), et, à droite, un portique à angles droits sur quatre poteaux d'osier,
 * son linteau fermé, une table longue de planches dessous ; ni vigne ni treille. La serre : devant, basse (deux blocs), un soubassement
 * d'osier et des vitres de calque (le verre dépoli de l'Atelier, qui se gagne au 4e) ; devant la cuisine, une barrière
 * à portillon et une marche. Ni drapeau, ni colombage, ni horloge.
 */
function jardin(b: BlockId): Stages {
  const x0 = 0;
  const y0 = 2;
  const w = 4;
  const d = 3;
  const h = 3;
  const doorX = 1;
  // (La fenêtre de devant à côté de la porte : la serre, devant le coin droit, la masquerait.)
  const windows: [number, number, number][] = [
    [2, y0, 1],
    [x0, y0 + 1, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: 'lanterne' as BlockId }))];
  // Le toit de la cuisine : deux pans et le faîte, les pignons d'osier ; la cheminée d'ardoise sur le pan de derrière.
  for (let x = x0; x < x0 + w; x++) {
    roof.push({ x, y: y0, z: h, block: BLOC.toit }, { x, y: y0 + d - 1, z: h, block: BLOC.toit }, { x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  }
  roof.push({ x: x0, y: y0 + 1, z: h, block: b }, { x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  for (let z = h + 1; z <= h + 2; z++) roof.push({ x: 1, y: y0 + d - 1, z, block: BLOC.ardoise });
  // La tonnelle : quatre poteaux de deux blocs, un portique au-dessus, à angles droits, qui court de devant à derrière
  // (le linteau fermé, relu par le consultant Blocland) ; la table longue dessous, en travers, en planches.
  for (const x of [4, 5]) {
    for (const y of [y0, y0 + d - 1]) for (let z = 0; z < 2; z++) roof.push({ x, y, z, block: b });
    for (let y = y0; y < y0 + d; y++) roof.push({ x, y, z: 2, block: b });
    roof.push({ x, y: y0 + 1, z: 0, block: BLOC.bois });
  }
  // La serre, devant la tonnelle : un soubassement d'osier, des vitres de calque ; devant la cuisine, la barrière et son
  // portillon, la marche. Pas de lanterne dans la cour : la nuit, seules les deux fenêtres de la cuisine s'allument (DA,
  // LV2-4 : le jardin sous 3 % de lueur ; avec une lanterne sur le portillon, la vue de l'île en avait 3,02 %).
  const yard: ArchCell[] = [
    { x: 0, y: 0, z: 0, block: BLOC.barriere },
    { x: 2, y: 0, z: 0, block: BLOC.barriere },
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
  ];
  for (let x = 3; x <= 5; x++) for (let y = 0; y <= 1; y++) yard.push({ x, y, z: 0, block: b }, { x, y, z: 1, block: BLOC.calque });
  return [without(walls, [[doorX, y0, 0], ...windows]), roof, yard];
}

/**
 * Le refuge (le Refuge des carnets, LV2 3e) : trois plans, trois choses qu'on reconnaît (DA, LV2-5), en bardeau et en
 * pierre de taille (le bloc du Château voisin, que donne le coffre du premier plan). La poste de Timbre : une maison de
 * trois sur trois à gauche, ses murs de bardeau, un casier à lettres en planches contre la façade, une caisse à côté de
 * la porte. La salle commune : le toit à deux pans de la poste, sa porte et une seule fenêtre (sur le côté ouest), et, à
 * droite, une salle longue et basse ouverte à l'est, sous un toit plus bas qui court de devant à derrière, une grande
 * table de planches entre deux bancs de pierre de taille. Le pigeonnier : devant la salle, quatre blocs de haut, un
 * soubassement de pierre de taille, un trou d'envol et, sous lui, la planche-perchoir ; aucun pigeon ; devant la
 * poste, une barrière à portillon et une marche.
 * Aucune lanterne, allumée ou non : la nuit, en Blocland, rien ne luit au refuge (DA, LV2-5) ; en Archipéo, la seule
 * fenêtre, de verre, peut s'allumer (une au plus). Ni drapeau, ni colombage, ni chalet à balcon, ni cloche.
 */
function refuge(b: BlockId): Stages {
  const x0 = 0;
  const y0 = 2;
  const w = 3;
  const d = 3;
  const h = 3;
  const doorX = 1;
  const windows: [number, number, number][] = [[x0, y0 + 1, 1]];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  // Le casier à lettres, en planches, contre la façade à droite de la porte (deux cases de haut) ; une caisse devant,
  // à l'écart du mur : les trois rangs de bardeau de la façade restent visibles depuis la caméra de l'île (DA LV2-5).
  const poste: ArchCell[] = [
    ...without(walls, [[doorX, y0, 0], ...windows]),
    { x: 2, y: 1, z: 0, block: BLOC.bois },
    { x: 2, y: 1, z: 1, block: BLOC.bois },
    { x: 0, y: 0, z: 0, block: BLOC.bois },
  ];
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: 'verre' as BlockId }))];
  // Le toit de la poste : deux pans et le faîte, les pignons de bardeau.
  for (let x = x0; x < x0 + w; x++) roof.push({ x, y: y0, z: h, block: BLOC.toit }, { x, y: y0 + d - 1, z: h, block: BLOC.toit }, { x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  roof.push({ x: x0, y: y0 + 1, z: h, block: b }, { x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  // La salle commune, de x = 3 à 5, de y = 1 à 4 : longue, basse (deux blocs), adossée à la poste, ouverte à l'est (vers
  // la caméra de l'île) entre ses deux poteaux ; ses murs de devant et de derrière.
  for (let z = 0; z < 2; z++) {
    for (const x of [3, 4]) roof.push({ x, y: 1, z, block: b }, { x, y: 4, z, block: b });
    roof.push({ x: 5, y: 1, z, block: b }, { x: 5, y: 4, z, block: b });
  }
  // La grande table de planches, en long, entre deux bancs de pierre de taille.
  for (const y of [2, 3]) roof.push({ x: 3, y, z: 0, block: BLOC.taille }, { x: 4, y, z: 0, block: BLOC.bois }, { x: 5, y, z: 0, block: BLOC.taille });
  // Son toit, plat et bas, d'un seul rang : il ne cache pas la façade de la poste à la caméra de l'île (DA LV2-5).
  for (let y = 1; y <= 4; y++) roof.push({ x: 3, y, z: 2, block: BLOC.toit }, { x: 4, y, z: 2, block: BLOC.toit }, { x: 5, y, z: 2, block: BLOC.toit });
  // Le pigeonnier, devant la salle, d'un bloc d'épaisseur (le trou d'envol se voit au travers), en pierre claire (DA
  // LV2-5 : pierre claire et ardoise enneigée dans Archipéo ; le même bloc de pierre de taille en Blocland) : un
  // soubassement, un rang dont le milieu est la planche-perchoir, en planches ; au-dessus d'elle, le trou d'envol,
  // (4, 0, 2), laissé vide entre deux blocs de pierre ; un toit plat par-dessus (l'ardoise enneigée du 3e en Archipéo,
  // `toits.ts`). Quatre blocs de haut.
  const yard: ArchCell[] = [
    { x: 2, y: 0, z: 0, block: BLOC.barriere },
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
  ];
  for (const x of [3, 4, 5]) yard.push({ x, y: 0, z: 0, block: BLOC.taille }, { x, y: 0, z: 3, block: BLOC.toit });
  yard.push({ x: 3, y: 0, z: 1, block: BLOC.taille }, { x: 4, y: 0, z: 1, block: BLOC.bois }, { x: 5, y: 0, z: 1, block: BLOC.taille });
  yard.push({ x: 3, y: 0, z: 2, block: BLOC.taille }, { x: 5, y: 0, z: 2, block: BLOC.taille });
  // Tout est tracé ci-dessus comme ailleurs (la façade côté y = 0), puis retourné d'est en ouest (x → 5 - x) : au
  // refuge, la caméra de l'île pivote à fond vers l'ouest et regarde le chantier par son côté est (`viewYaw`). La poste
  // passe ainsi devant, sa fenêtre et ses trois rangs de bardeau face à la caméra, la salle commune derrière elle, et le
  // pigeonnier à droite (DA, retouches LV2-5 : deux rangs de bardeau au moins sous l'avant-toit, vus de l'île).
  const retourne = (cells: ArchCell[]) => cells.map((c) => ({ ...c, x: 5 - c.x }));
  return [retourne(poste), retourne(roof), retourne(yard)];
}

/** Les trois étapes du bâtiment d'une île. */
export function buildingStages(biome: BiomeId, block: BlockId): Stages {
  const style = BUILDING_OF[biome];
  switch (style.kind) {
    case 'maison':
      return maison(block, style.w, style.chimney);
    case 'tour':
      return tour(block, style.top, style.stripes);
    case 'dome':
      return dome(block, style.cap);
    case 'echoppe':
      return echoppe(block);
    case 'hutte':
      return hutte(block);
    case 'kiosque':
      return kiosque(block);
    case 'relais':
      return relais(block);
    case 'jardin':
      return jardin(block);
    case 'refuge':
      return refuge(block);
  }
}

/** Les blocs de finition (ceux qui ne se gagnent sur aucune île) que demande une étape. */
export const FINISH_BLOCKS: BlockId[] = ['roof', 'door', 'lantern', 'fence', 'stairs'];
export function finishNeeds(cells: ArchCell[]): Partial<Record<BlockId, number>> {
  const out: Partial<Record<BlockId, number>> = {};
  for (const c of cells) if (FINISH_BLOCKS.includes(c.block)) out[c.block] = (out[c.block] ?? 0) + 1;
  return out;
}

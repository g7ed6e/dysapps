// L'architecte du village : le dessin des bâtiments des îles, en trois étapes (les murs, le toit, la cour), calculé à partir
// d'une forme (maison, tour, dôme, échoppe, hutte, kiosque, relais, jardin, refuge,
// musée, quartier, logis, moulin, halle, entrepôt, bibliothèque, mairie, serre, laboratoire, atelier, station, chalet, scierie,
// pépinière, pavillon, usine, infirmerie, gymnase, poste, préau, fournil, grotte, loge, colonnade, tribune,
// bosquet) et du bloc de l'île. Les cases sont relatives à la zone des
// plans de l'île (6 × 5 cases, z = 0 : premier bloc sur le sol) ; la façade et la porte sont devant (y bas), la cour aussi.
// Les blocs de finition (toit, porte, lanterne, barrière, escalier) viennent des coffres des étapes précédentes : un coffre
// donne exactement ceux de l'étape suivante (voir plans.ts).
import type { BiomeId, BlockId } from '../biomes';
import { BLOC } from '../biomes';

interface ArchCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
  /** Le bloc de la case dans Archipéo, quand il diffère (voir `PlanCell.archipeo`, world/plans.ts). */
  archipeo?: BlockId;
}

export type Stages = [walls: ArchCell[], roof: ArchCell[], yard: ArchCell[]];

/** La zone des plans : 6 cases de large (x), 5 de profondeur (y). */
const ZW = 6;

type TowerTop = 'phare' | 'horloge' | 'creneaux';

type BuildingStyle =
  | { kind: 'maison'; w?: 4 | 5; chimney?: 1 | 2 }
  | { kind: 'tour'; top: TowerTop; /** Un étage sur deux dans un autre bloc (les bandes d'un phare). */ stripes?: BlockId }
  | { kind: 'dome'; cap?: BlockId }
  | { kind: 'echoppe' }
  | { kind: 'hutte' }
  | { kind: 'kiosque' }
  | { kind: 'relais' }
  | { kind: 'jardin' }
  | { kind: 'refuge' }
  | { kind: 'musee' }
  | { kind: 'quartier' }
  | { kind: 'logis' }
  | { kind: 'moulin' }
  | { kind: 'halle' }
  | { kind: 'entrepot' }
  | { kind: 'bibliotheque' }
  | { kind: 'mairie' }
  | { kind: 'serre' }
  | { kind: 'laboratoire' }
  | { kind: 'atelier' }
  | { kind: 'preau' }
  | { kind: 'fournil' }
  | { kind: 'grotte' }
  | { kind: 'loge' }
  | { kind: 'colonnade' }
  | { kind: 'tribune' }
  | { kind: 'bosquet' }
  | { kind: 'station' }
  | { kind: 'chalet' }
  | { kind: 'scierie' }
  | { kind: 'pepiniere' }
  | { kind: 'pavillon' }
  | { kind: 'usine' }
  | { kind: 'infirmerie' }
  | { kind: 'gymnase' }
  | { kind: 'poste' };

/** La forme du bâtiment de chaque île (son nom, sa récompense et sa réplique sont dans docs/contenu/<île>.md, section « Les plans »). */
const BUILDING_OF: Record<BiomeId, BuildingStyle> = {
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
  'history-6e-antiquity': { kind: 'musee' },
  'geography-6e-living': { kind: 'quartier' },
  'life-earth-sciences-6e-living-world': { kind: 'serre' },
  'physics-chemistry-6e-matter-energy': { kind: 'laboratoire' },
  'technology-6e-objects': { kind: 'atelier' },
  'civics-6e-democratic-society': { kind: 'preau' },
  // Îles Brumeuses (5e)
  'maths-5e-signed-numbers': { kind: 'dome' },
  'maths-5e-proportionality': { kind: 'echoppe' },
  'french-5e-homophones': { kind: 'maison' },
  'french-5e-conjugation': { kind: 'hutte' },
  'english-5e-vocabulary': { kind: 'echoppe' },
  'english-5e-grammar': { kind: 'maison', w: 5, chimney: 2 },
  'lv2-5e-introductions': { kind: 'relais' },
  'history-5e-middle-ages': { kind: 'logis' },
  'geography-5e-resources': { kind: 'moulin' },
  // Sciences 5e (SC-3)
  'life-earth-sciences-5e-active-planet': { kind: 'station' },
  'physics-chemistry-5e-matter-universe': { kind: 'chalet' },
  'technology-5e-design': { kind: 'scierie' },
  // EMC 5e (EMC-2) et latin-grec 5e (LCA-2)
  'civics-5e-equality-solidarity': { kind: 'fournil' },
  'lca-5e-legends': { kind: 'grotte' },
  // EMC 4e (EMC-2) et latin-grec 4e (LCA-2)
  'civics-4e-rights-freedoms': { kind: 'loge' },
  'lca-4e-cities': { kind: 'colonnade' },
  // EMC 3e (EMC-2) et latin-grec 3e (LCA-2)
  'civics-3e-democratic-life': { kind: 'tribune' },
  'lca-3e-ideas': { kind: 'bosquet' },
  // Anciens Ateliers (4e)
  'maths-4e-algebra': { kind: 'maison' },
  'maths-4e-powers': { kind: 'maison', chimney: 2 },
  'french-4e-agreement': { kind: 'hutte' },
  'french-4e-vocabulary': { kind: 'dome' },
  'english-4e-comprehension': { kind: 'maison', w: 5 },
  'english-4e-grammar': { kind: 'echoppe' },
  'lv2-4e-daily-life': { kind: 'jardin' },
  'history-4e-revolutions': { kind: 'halle' },
  'geography-4e-globalization': { kind: 'entrepot' },
  // Sciences 4e (SC-3)
  'life-earth-sciences-4e-cells-evolution': { kind: 'pepiniere' },
  'physics-chemistry-4e-signals-circuits': { kind: 'pavillon' },
  'technology-4e-modeling': { kind: 'usine' },
  // Îles du Ciel (3e)
  'maths-3e-functions': { kind: 'tour', top: 'phare' },
  'maths-3e-geometry': { kind: 'kiosque' },
  'maths-3e-statistics': { kind: 'dome' },
  'french-3e-close-reading': { kind: 'tour', top: 'phare' },
  'english-3e-comprehension': { kind: 'maison' },
  'english-3e-grammar': { kind: 'tour', top: 'creneaux' },
  'lv2-3e-travel': { kind: 'refuge' },
  'history-3e-twentieth-century': { kind: 'bibliotheque' },
  'geography-3e-france': { kind: 'mairie' },
  // Sciences 3e (SC-3)
  'life-earth-sciences-3e-human-body': { kind: 'infirmerie' },
  'physics-chemistry-3e-motion-energy': { kind: 'gymnase' },
  'technology-3e-digital': { kind: 'poste' },
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
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: BLOC.lanterne }))];
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
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: BLOC.lanterne }))];
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
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: BLOC.lanterne }))];
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
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: BLOC.lanterne }))];
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
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...windows.map(([x, y, z]) => ({ x, y, z, block: BLOC.verre }))];
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
  // `roofs.ts`). Quatre blocs de haut.
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

/**
 * Le musée (le musée de Silex, histoire 6e) : trois plans, trois choses qu'on reconnaît (DA, HG-2). Le musée : une salle
 * longue et basse de mosaïque, six sur trois, trois blocs de haut, une porte et deux vitrines sur sa façade longue. Le
 * toit du musée : la porte, les deux vitrines de verre, un toit bas à deux pans de tuiles qui court sur toute sa
 * longueur, ses deux pignons de mosaïque aux bouts. La cour du musée : la barrière et son portillon, deux lanternes, la
 * marche, une jardinière. Ni fronton, ni colonnade, ni aqueduc, aucun monument réel, aucun édifice religieux, pas de
 * strates.
 */
function musee(b: BlockId): Stages {
  const x0 = 0;
  const y0 = 2;
  const w = ZW;
  const d = 3;
  const h = 3;
  const doorX = 2;
  const vitrines: [number, number, number][] = [
    [1, y0, 1],
    [4, y0, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...vitrines.map(([x, y, z]) => ({ x, y, z, block: BLOC.verre }))];
  // Les deux pans (devant et derrière, au niveau h) et le faîte au milieu (h + 1), sur toute la longueur ; les pignons.
  for (let x = x0; x < x0 + w; x++) {
    roof.push({ x, y: y0, z: h, block: BLOC.toit }, { x, y: y0 + d - 1, z: h, block: BLOC.toit }, { x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  }
  roof.push({ x: x0, y: y0 + 1, z: h, block: b }, { x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  return [without(walls, [[doorX, y0, 0], ...vitrines]), roof, yard(b, doorX, y0)];
}

/**
 * Le quartier (le quartier de Boussole, géographie 6e) : trois plans, trois paysages qu'on lit l'un après l'autre (DA,
 * HG-2). Le quartier : une ville serrée, deux maisons de chaume mur contre mur au fond à gauche, l'une de trois blocs,
 * l'autre de deux. Les champs du quartier : les toits à deux pans (de tuiles sur la maison haute ; sur la basse, de chaume
 * dans Blocland, de terre cuite en pente dans Archipéo), les portes et les fenêtres des maisons, et à droite deux
 * rangs de bottes de chaume, une de plus sur le rang du fond ; les maisons s'espacent. Le quai du quartier : devant, un rang de
 * planches, une bitte d'amarrage, deux barrières, une lanterne, et la marche devant la porte. Ni amer ni phare.
 */
function quartier(b: BlockId): Stages {
  const y0 = 2;
  const d = 3;
  const maisons = [
    { x0: 0, h: 3, porte: [0, y0, 0], fenetre: [1, y0, 1], toit: BLOC.toit, archipeo: undefined },
    { x0: 2, h: 2, porte: [3, y0, 0], fenetre: [2, y0, 1], toit: b, archipeo: BLOC.toit },
  ] as const;
  const murs: ArchCell[] = [];
  const champs: ArchCell[] = [];
  for (const m of maisons) {
    for (let z = 0; z < m.h; z++) for (let x = m.x0; x < m.x0 + 2; x++) for (let y = y0; y < y0 + d; y++) murs.push({ x, y, z, block: b });
    champs.push({ x: m.porte[0], y: m.porte[1], z: m.porte[2], block: BLOC.porte }, { x: m.fenetre[0], y: m.fenetre[1], z: m.fenetre[2], block: BLOC.lanterne });
    // Le toit à deux pans de chaque maison : devant et derrière au niveau de son haut, le faîte au milieu, un cran plus
    // haut, sur ses pignons de chaume. La maison haute en tuiles (la terre cuite de la Pointe, `roofs.ts`), la maison
    // basse en chaume dans Blocland (DA, HG-2) : le bloc des murs, déjà dans la scène, sans matériau ni appel de dessin de
    // plus. Dans Archipéo, elle garde un toit de terre cuite en pente (DA, retouches HG-2) : `archipeo`, que seule sa
    // construction lit, en fait un bloc de toit, que le kit dessine en pente.
    for (let x = m.x0; x < m.x0 + 2; x++) {
      const pan = (y: number, z: number): ArchCell => (m.archipeo ? { x, y, z, block: m.toit, archipeo: m.archipeo } : { x, y, z, block: m.toit });
      champs.push(pan(y0, m.h), pan(y0 + d - 1, m.h), { x, y: y0 + 1, z: m.h, block: b }, pan(y0 + 1, m.h + 1));
    }
  }
  const ville = without(
    murs,
    maisons.flatMap((m) => [m.porte, m.fenetre] as [number, number, number][]),
  );
  // Les champs : deux rangs de bottes de chaume, un rang d'herbe entre eux, une botte de plus sur le rang du fond.
  for (const x of [4, 5]) champs.push({ x, y: 1, z: 0, block: b }, { x, y: 3, z: 0, block: b });
  champs.push({ x: 5, y: 3, z: 1, block: b });
  const quai: ArchCell[] = [];
  for (let x = 0; x < ZW; x++) quai.push({ x, y: 0, z: 0, block: BLOC.bois });
  quai.push(
    { x: 0, y: 0, z: 1, block: BLOC.bois },
    { x: 2, y: 0, z: 1, block: BLOC.barriere },
    { x: 3, y: 0, z: 1, block: BLOC.barriere },
    { x: 5, y: 0, z: 1, block: BLOC.lanterne },
    { x: 3, y: 1, z: 0, block: BLOC.escalier },
  );
  return [ville, champs, quai];
}

/**
 * Le toit à deux pans d'un bâtiment de trois rangs de profondeur (de `y0` à `y0 + 2`), de `x0` à `x1` : les deux pans au
 * niveau `h`, le faîte au milieu un cran plus haut, en `bloc` (les tuiles par défaut), et les deux pignons du bloc des
 * murs aux bouts des murs (`murs`, de `mx0` à `mx1`).
 */
function deuxPans(x0: number, x1: number, y0: number, h: number, b: BlockId, mx0: number, mx1: number, bloc: BlockId = BLOC.toit, faite: BlockId = bloc): ArchCell[] {
  const out: ArchCell[] = [];
  for (let x = x0; x <= x1; x++) out.push({ x, y: y0, z: h, block: bloc }, { x, y: y0 + 2, z: h, block: bloc }, { x, y: y0 + 1, z: h + 1, block: faite });
  out.push({ x: mx0, y: y0 + 1, z: h, block: b }, { x: mx1, y: y0 + 1, z: h, block: b });
  return out;
}

/** Des ouvertures (porte, fenêtres éclairées) posées dans les trous des murs. */
function ouvertures(porte: [number, number, number], fenetres: [number, number, number][]): ArchCell[] {
  return [{ x: porte[0], y: porte[1], z: porte[2], block: BLOC.porte }, ...fenetres.map(([x, y, z]) => ({ x, y, z, block: BLOC.lanterne }))];
}

/**
 * Le logis (le logis de Vélin, histoire 5e ; DA, HG-3) : un logis à étage en avancée, ni église ni château. Le logis : le
 * rez-de-chaussée d'enluminure, quatre sur trois, deux blocs de haut, et l'étage, deux blocs de haut, qui avance d'un
 * rang sur la rue. Le toit du logis : la porte, une fenêtre en bas, deux à l'étage sur l'avancée, le toit à deux pans
 * sur l'étage, ses pignons. La cour du logis : la cour de toujours (barrière, portillon, lanternes, marche, jardinière).
 */
function logis(b: BlockId): Stages {
  const doorX = 2;
  const fenetres: [number, number, number][] = [
    [4, 3, 1],
    [2, 1, 2],
    [3, 1, 2],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 2; z++) for (const [x, y] of ring(1, 2, 4, 3)) walls.push({ x, y, z, block: b });
  for (let z = 2; z < 4; z++) for (const [x, y] of ring(1, 1, 4, 3)) walls.push({ x, y, z, block: b });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, ZW - 1, 1, 4, b, 1, 4)];
  return [without(walls, [[doorX, 2, 0], ...fenetres]), roof, yard(b, doorX, 2)];
}

/**
 * Le moulin (le moulin de Sillon, géographie 5e ; DA, HG-3) : un moulin à eau, sa roue fixe. Le moulin : une tour basse de
 * rizière, trois sur trois, trois blocs de haut. Le toit du moulin : la porte, deux fenêtres, le toit à deux pans, et sur
 * son flanc est la roue, un anneau de huit planches debout, à une case du mur, immobile. La cour du moulin : le bief
 * d'eau (du verre) entre le mur et la roue, un rang de rizière devant, la barrière, son portillon, deux lanternes et la marche.
 * Au Delta, la caméra de l'île pivote à fond vers l'est (`viewYaw`, −40°) : l'anneau, sur le flanc est, lui fait face ;
 * rien ne se pose devant lui (le rang de rizière, au bord est, en cachait le bas et le milieu vide : la roue se lisait
 * comme un mur de planches, DA, relecture des planches, HG-3).
 */
function moulin(b: BlockId): Stages {
  const doorX = 1;
  const fenetres: [number, number, number][] = [
    [0, 3, 1],
    [1, 4, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 3; z++) for (const [x, y] of ring(0, 2, 3, 3)) walls.push({ x, y, z, block: b });
  const roue: ArchCell[] = [];
  // Décollée du mur d'une case, la roue se lit comme un anneau : par son milieu vide et autour d'elle, on voit le mur
  // de la tour derrière (DA, relecture des planches : collée, elle faisait façade).
  for (let y = 2; y <= 4; y++) for (let z = 0; z <= 2; z++) if (y !== 3 || z !== 1) roue.push({ x: 4, y, z, block: BLOC.bois });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, 2, 2, 3, b, 0, 2), ...roue];
  const cour: ArchCell[] = [];
  for (let y = 2; y <= 4; y++) cour.push({ x: 3, y, z: 0, block: BLOC.verre });
  // Le rang de rizière, devant, à côté de la marche : jamais entre la roue et la caméra.
  for (let x = 2; x < ZW; x++) cour.push({ x, y: 1, z: 0, block: b });
  for (let x = 0; x < ZW; x++) if (x !== doorX) cour.push({ x, y: 0, z: 0, block: BLOC.barriere });
  cour.push({ x: 0, y: 0, z: 1, block: BLOC.lanterne }, { x: ZW - 1, y: 0, z: 1, block: BLOC.lanterne }, { x: doorX, y: 1, z: 0, block: BLOC.escalier });
  return [without(walls, [[doorX, 2, 0], ...fenetres]), roof, cour];
}

/**
 * La halle (la halle de Typo, histoire 4e ; DA, HG-3) : une halle de fonte à verrière. La halle : une salle longue de
 * fonte, six sur trois, deux blocs de haut. Le toit de la halle : la porte, trois fenêtres, le toit à deux pans sur toute
 * la longueur (de terre cuite dans Archipéo, `roofs.ts`), sa verrière au faîte (un rang de verre) et ses deux pignons de
 * fonte. La cour de la halle : la cour de toujours.
 */
function halle(b: BlockId): Stages {
  const doorX = 2;
  const fenetres: [number, number, number][] = [
    [4, 2, 1],
    [0, 3, 1],
    [5, 3, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 2; z++) for (const [x, y] of ring(0, 2, ZW, 3)) walls.push({ x, y, z, block: b });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, ZW - 1, 2, 2, b, 0, ZW - 1, BLOC.toit, BLOC.verre)];
  return [without(walls, [[doorX, 2, 0], ...fenetres]), roof, yard(b, doorX, 2)];
}

/**
 * L'entrepôt (l'entrepôt de Fret, géographie 4e ; DA, HG-3) : un entrepôt de port et ses conteneurs empilés. L'entrepôt :
 * quatre sur trois, trois blocs de haut, de tôle de conteneur. Le toit de l'entrepôt : la porte, deux fenêtres, un toit
 * bas à deux pans. La cour de l'entrepôt : à droite, les conteneurs empilés (trois au sol, deux dessus), une caisse de
 * planches, la barrière du quai, son portillon, deux lanternes et la marche.
 */
function entrepot(b: BlockId): Stages {
  const doorX = 1;
  const fenetres: [number, number, number][] = [
    [2, 2, 1],
    [0, 3, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 3; z++) for (const [x, y] of ring(0, 2, 4, 3)) walls.push({ x, y, z, block: b });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, 3, 2, 3, b, 0, 3)];
  const cour: ArchCell[] = [];
  for (let y = 2; y <= 4; y++) cour.push({ x: 5, y, z: 0, block: b });
  cour.push({ x: 5, y: 3, z: 1, block: b }, { x: 5, y: 4, z: 1, block: b }, { x: 4, y: 1, z: 0, block: BLOC.bois });
  for (let x = 0; x < ZW; x++) if (x !== doorX) cour.push({ x, y: 0, z: 0, block: BLOC.barriere });
  cour.push({ x: 0, y: 0, z: 1, block: BLOC.lanterne }, { x: ZW - 1, y: 0, z: 1, block: BLOC.lanterne }, { x: doorX, y: 1, z: 0, block: BLOC.escalier });
  return [without(walls, [[doorX, 2, 0], ...fenetres]), roof, cour];
}

/**
 * La bibliothèque (la bibliothèque de Mémo, histoire 3e ; DA, HG-3) : sobre, rien de ludique. La bibliothèque : quatre
 * sur trois, trois blocs de haut, de reliure. Le toit de la bibliothèque : la porte, trois fenêtres, le toit à deux pans,
 * ses pignons. La cour de la bibliothèque : la cour de toujours, calme.
 */
function bibliotheque(b: BlockId): Stages {
  const doorX = 2;
  const fenetres: [number, number, number][] = [
    [3, 2, 1],
    [1, 3, 1],
    [4, 3, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 3; z++) for (const [x, y] of ring(1, 2, 4, 3)) walls.push({ x, y, z, block: b });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, ZW - 1, 2, 3, b, 1, 4)];
  return [without(walls, [[doorX, 2, 0], ...fenetres]), roof, yard(b, doorX, 2)];
}

/**
 * La mairie (la mairie de Jalon, géographie 3e ; DA, HG-3) : symétrique, sans drapeau ni horloge. La mairie : cinq sur
 * trois, trois blocs de haut, de grès rose, la porte au milieu. Le toit de la mairie : la porte, deux fenêtres de part et
 * d'autre, deux sur les flancs, le toit à deux pans, ses pignons. La place de la mairie : symétrique elle aussi, la
 * barrière et son portillon au milieu, deux lanternes aux bouts, la marche, deux jardinières. La façade regarde l'est.
 */
function mairie(b: BlockId): Stages {
  const doorX = 2;
  const fenetres: [number, number, number][] = [
    [1, 2, 1],
    [3, 2, 1],
    [0, 3, 1],
    [4, 3, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < 3; z++) for (const [x, y] of ring(0, 2, 5, 3)) walls.push({ x, y, z, block: b });
  const roof = [...ouvertures([doorX, 2, 0], fenetres), ...deuxPans(0, 4, 2, 3, b, 0, 4)];
  const place: ArchCell[] = [];
  for (const x of [0, 1, 3, 4]) place.push({ x, y: 0, z: 0, block: BLOC.barriere });
  place.push({ x: 0, y: 0, z: 1, block: BLOC.lanterne }, { x: 4, y: 0, z: 1, block: BLOC.lanterne }, { x: doorX, y: 1, z: 0, block: BLOC.escalier });
  place.push({ x: 0, y: 1, z: 0, block: b }, { x: 4, y: 1, z: 0, block: b });
  // Tout est tracé la façade côté y = 0, puis tourné d'un quart de tour : au Plateau, la caméra de l'île pivote à fond
  // vers l'est (`viewYaw`) et voyait le pignon ; la façade, sa porte au milieu, regarde maintenant l'est, vers elle (DA,
  // relecture des planches).
  const versLEst = (cells: ArchCell[]) => cells.map((c) => ({ ...c, x: ZW - 1 - c.y, y: c.x }));
  return [versLEst(without(walls, [[doorX, 2, 0], ...fenetres])), versLEst(roof), versLEst(place)];
}

/**
 * Un toit bas à deux pans sur un bâtiment de `w` cases de large et 3 de profond, posé sur ses murs de `h` blocs : les
 * deux pans devant et derrière (niveau h), le faîte au milieu (h + 1) sur toute la longueur, les deux pignons du bloc
 * des murs aux bouts. Celui du musée, repris par la serre, le laboratoire et l'atelier (SC-2).
 */
function toitADeuxPans(b: BlockId, x0: number, y0: number, w: number, h: number): ArchCell[] {
  const out: ArchCell[] = [];
  for (let x = x0; x < x0 + w; x++) out.push({ x, y: y0, z: h, block: BLOC.toit }, { x, y: y0 + 2, z: h, block: BLOC.toit }, { x, y: y0 + 1, z: h + 1, block: BLOC.toit });
  out.push({ x: x0, y: y0 + 1, z: h, block: b }, { x: x0 + w - 1, y: y0 + 1, z: h, block: b });
  return out;
}

/**
 * La serre (la serre de Fougère, SVT 6e) : trois plans, trois choses qu'on reconnaît (DA, SC-2). La serre : une salle
 * longue de fossile, six sur trois, trois blocs de haut, la porte et trois grandes baies sur sa façade, une baie de
 * chaque côté. Le toit de la serre : la porte, les cinq vitres de verre dans les murs, un toit bas à deux pans du toit de
 * l'univers (jamais de verrière en toit). Le jardin de la serre : la barrière et son portillon, deux lanternes, la marche,
 * deux jardinières.
 */
function serre(b: BlockId): Stages {
  const [x0, y0, w, d, h, doorX] = [0, 2, ZW, 3, 3, 2];
  const vitres: [number, number, number][] = [
    [1, y0, 1],
    [3, y0, 1],
    [4, y0, 1],
    [0, y0 + 1, 1],
    [w - 1, y0 + 1, 1],
  ];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, ...vitres.map(([x, y, z]) => ({ x, y, z, block: BLOC.verre })), ...toitADeuxPans(b, x0, y0, w, h)];
  return [without(walls, [[doorX, y0, 0], ...vitres]), roof, yard(b, doorX, y0)];
}

/**
 * Le laboratoire (le laboratoire de Bulle, physique-chimie 6e) : trois plans (DA, SC-2). Le laboratoire : une salle
 * d'aimant, quatre sur trois, trois blocs de haut, au milieu de la zone, la porte et une fenêtre sur sa façade ; le gris
 * de ses côtés domine. Le toit du laboratoire : la porte, une lampe à la fenêtre (une lanterne), le toit bas à deux
 * pans. La cour du laboratoire : la barrière et son portillon, deux lanternes, la marche, deux jardinières. Ni flamme,
 * ni fumée, ni éolienne.
 */
function laboratoire(b: BlockId): Stages {
  const [x0, y0, w, d, h, doorX] = [1, 2, 4, 3, 3, 2];
  const lampe: [number, number, number] = [3, y0, 1];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [{ x: doorX, y: y0, z: 0, block: BLOC.porte }, { x: lampe[0], y: lampe[1], z: lampe[2], block: BLOC.lanterne }, ...toitADeuxPans(b, x0, y0, w, h)];
  return [without(walls, [[doorX, y0, 0], lampe]), roof, yard(b, doorX, y0)];
}

/**
 * L'atelier (l'atelier de Pince, technologie 6e) : trois plans (DA, SC-2). L'atelier : une salle de carton, cinq sur
 * trois, trois blocs de haut, à gauche de la zone, une porte large (deux cases, deux de haut) sur sa façade. Le toit de
 * l'atelier : les quatre portes de la porte large, une lanterne au mur à côté d'elle, le toit bas à deux pans. La cour
 * de l'atelier : la barrière et son portillon, deux lanternes, la marche, deux jardinières.
 */
function atelier(b: BlockId): Stages {
  const [x0, y0, w, d, h] = [0, 2, 5, 3, 3];
  const porte: [number, number, number][] = [
    [1, y0, 0],
    [2, y0, 0],
    [1, y0, 1],
    [2, y0, 1],
  ];
  const lanterne: [number, number, number] = [3, y0, 1];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, y0, w, d)) walls.push({ x, y, z, block: b });
  const roof: ArchCell[] = [...porte.map(([x, y, z]) => ({ x, y, z, block: BLOC.porte })), { x: lanterne[0], y: lanterne[1], z: lanterne[2], block: BLOC.lanterne }, ...toitADeuxPans(b, x0, y0, w, h)];
  return [without(walls, [...porte, lanterne]), roof, yard(b, 1, y0)];
}

/**
 * Le préau (le préau de Voix, EMC 6e ; proposition de l'artiste technique 3D, à valider par le directeur artistique) :
 * un abri ouvert devant, où l'on se réunit ; aucun drapeau, aucun symbole. Le préau : le mur du fond de craie, six de
 * large, deux blocs de haut, deux retours sur les côtés et deux piliers devant, le banc de bois au fond. Le toit du
 * préau : le toit bas à deux pans sur toute la largeur, posé sur les piliers, et une lanterne au mur du fond, sous le
 * toit. La cour du préau : la barrière ouverte au milieu sur deux cases (ouverte à tous), deux lanternes aux bouts, deux
 * bancs de bois devant les piliers. Sans porte : rien ne ferme le préau.
 */
function preau(b: BlockId): Stages {
  const [y0, h] = [2, 2];
  const lanterne: [number, number, number] = [3, y0 + 2, 1];
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) {
    for (let x = 0; x < ZW; x++) walls.push({ x, y: y0 + 2, z, block: b });
    for (const x of [0, ZW - 1]) walls.push({ x, y: y0 + 1, z, block: b }, { x, y: y0, z, block: b });
  }
  walls.push({ x: 2, y: y0 + 1, z: 0, block: BLOC.bois }, { x: 3, y: y0 + 1, z: 0, block: BLOC.bois });
  const roof: ArchCell[] = [{ x: lanterne[0], y: lanterne[1], z: lanterne[2], block: BLOC.lanterne }, ...toitADeuxPans(b, 0, y0, ZW, h)];
  const cour: ArchCell[] = [...frontFence([2, 3], [0, ZW - 1]), { x: 1, y: 1, z: 0, block: BLOC.bois }, { x: ZW - 2, y: 1, z: 0, block: BLOC.bois }];
  return [without(walls, [lanterne]), roof, cour];
}

/**
 * Le fournil (le fournil de Mie, EMC 5e ; proposition de l'artiste technique 3D, à valider par le directeur artistique) :
 * un fournil de village, aucun drapeau ni symbole, ni cheminée ni fumée. Le fournil : une salle de farine, quatre sur
 * trois, trois blocs de haut, à gauche. Le toit du fournil : la porte, une fenêtre éclairée, le toit à deux pans, et à
 * droite le four à pain, bas, deux blocs sur deux de profond, sa gueule éclairée devant (une lanterne au ras du sol :
 * « la pâte lève au chaud »). La cour du fournil : la table longue où l'on partage le pain (deux planches), la barrière,
 * son portillon, deux lanternes et la marche.
 */
function fournil(b: BlockId): Stages {
  const doorX = 1;
  const windows: [number, number, number][] = [[2, 2, 1]];
  const four: ArchCell[] = [];
  for (const y of [3, 4]) for (let z = 0; z < 2; z++) four.push({ x: 5, y, z, block: b });
  four.push({ x: 5, y: 2, z: 0, block: BLOC.lanterne }, { x: 5, y: 2, z: 1, block: b });
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 3, 2, 3, b, 0, 3), ...four];
  const cour: ArchCell[] = [{ x: 3, y: 1, z: 0, block: BLOC.bois }, { x: 4, y: 1, z: 0, block: BLOC.bois }, { x: doorX, y: 1, z: 0, block: BLOC.escalier }, ...frontFence([doorX], [0, ZW - 1])];
  return [without(room(b, 0, 4, 3), [[doorX, 2, 0], ...windows]), roof, cour];
}

/**
 * La grotte (l'abri de Lyre, latin-grec 5e ; proposition de l'artiste technique 3D, à valider par le directeur
 * artistique) : un abri sous roche, ouvert devant, ni temple ni colonne, aucun dieu ni symbole. L'abri : le rocher du
 * fond en tuf, six de large, deux blocs de haut, ses deux retours sur les côtés, une lanterne au fond (où l'on garde les
 * légendes). Le porche de la grotte : la voûte de tuf au-dessus, en deux gradins, posée sur deux piliers de tuf devant.
 * Le cercle des conteurs : six sièges de tuf en rond devant le porche, au ras du sol, une lanterne sur les deux sièges
 * du bout ; ni barrière ni portillon (une grotte ne se ferme pas).
 */
function grotte(b: BlockId): Stages {
  const y0 = 3;
  const lanterne: [number, number, number] = [3, y0 + 1, 1];
  const abri: ArchCell[] = [];
  for (let z = 0; z < 2; z++) {
    for (let x = 0; x < ZW; x++) abri.push({ x, y: y0 + 1, z, block: b });
    for (const x of [0, ZW - 1]) abri.push({ x, y: y0, z, block: b });
  }
  const porche: ArchCell[] = [{ x: lanterne[0], y: lanterne[1], z: lanterne[2], block: BLOC.lanterne }];
  for (const x of [1, ZW - 2]) for (let z = 0; z < 2; z++) porche.push({ x, y: y0, z, block: b });
  for (let x = 0; x < ZW; x++) for (const y of [y0, y0 + 1]) porche.push({ x, y, z: 2, block: b });
  for (let x = 1; x < ZW - 1; x++) porche.push({ x, y: y0 + 1, z: 3, block: b });
  const cercle: ArchCell[] = [];
  for (const [x, y] of [
    [2, 2],
    [3, 2],
    [1, 1],
    [4, 1],
    [2, 0],
    [3, 0],
  ])
    cercle.push({ x, y, z: 0, block: b });
  cercle.push({ x: 1, y: 1, z: 1, block: BLOC.lanterne }, { x: 4, y: 1, z: 1, block: BLOC.lanterne });
  return [without(abri, [lanterne]), porche, cercle];
}

/**
 * La loge (la loge de Loquet, EMC 4e ; proposition de l'artiste technique 3D, à valider par le directeur artistique) :
 * la loge du portier à côté d'une porte ouverte, qu'aucun vantail ne ferme (la porte des libertés) ; aucun drapeau,
 * aucun symbole, aucune arme, ni grille ni barrière. La loge : une petite salle de pavés, trois sur trois, deux blocs de
 * haut, à gauche, et à droite les deux piliers de la porte, trois blocs de haut, le passage libre entre eux. Le toit de
 * la loge : la porte de la loge, une fenêtre éclairée sur la porte de la ville (le portier veille), le toit à deux pans,
 * et le linteau de pavés sur les deux piliers, une lanterne posée au milieu. La place de la loge : la marche, deux
 * bornes de pavés de part et d'autre du passage, chacune sa lanterne, un banc de planches le long du bord, et le seuil de pavés devant le passage.
 */
function loge(b: BlockId): Stages {
  const doorX = 1;
  const windows: [number, number, number][] = [[2, 3, 1]];
  const piliers: ArchCell[] = [];
  for (const x of [3, 5]) for (let z = 0; z < 3; z++) piliers.push({ x, y: 3, z, block: b });
  const linteau: ArchCell[] = [];
  for (let x = 3; x <= 5; x++) linteau.push({ x, y: 3, z: 3, block: b });
  linteau.push({ x: 4, y: 3, z: 4, block: BLOC.lanterne });
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 2, 2, 2, b, 0, 2), ...linteau];
  const place: ArchCell[] = [
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
    { x: 3, y: 1, z: 0, block: b },
    { x: 3, y: 1, z: 1, block: BLOC.lanterne },
    { x: 5, y: 1, z: 0, block: b },
    { x: 5, y: 1, z: 1, block: BLOC.lanterne },
    { x: 0, y: 0, z: 0, block: BLOC.bois },
    { x: 0, y: 1, z: 0, block: BLOC.bois },
    { x: 4, y: 2, z: 0, block: b },
  ];
  return [without([...room(b, 0, 3, 2), ...piliers], [[doorX, 2, 0], ...windows]), roof, place];
}

/**
 * La colonnade (la maison de Figue, latin-grec 4e ; proposition de l'artiste technique 3D, à valider par le directeur
 * artistique) : une maison de la cité, sa colonnade et sa fontaine ; ni temple, ni fronton, ni statue, aucun dieu. La
 * maison : quatre sur trois, deux blocs de haut, ses murs de fresque, à gauche. La colonnade : le toit à deux pans de la
 * maison, la porte et une fenêtre éclairée, et à droite trois colonnes de pierre de taille, deux blocs de haut, une case
 * sur deux, sous un entablement de pierre de taille de deux cases de large qui rejoint le toit : on y marche à l'ombre.
 * La fontaine : devant la maison, un bassin de pierre de taille, l'eau (du verre) au milieu, et derrière lui le pilier de
 * fresque d'où l'eau coule, une lanterne sur chaque bout du bassin ; la marche devant la porte.
 */
function colonnade(b: BlockId): Stages {
  const doorX = 2;
  const windows: [number, number, number][] = [[0, 2, 1]];
  const portique: ArchCell[] = [];
  for (const y of [0, 2, 4]) for (let z = 0; z < 2; z++) portique.push({ x: 5, y, z, block: BLOC.taille });
  for (const x of [4, 5]) for (let y = 0; y < 5; y++) portique.push({ x, y, z: 2, block: BLOC.taille });
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 3, 2, 2, b, 0, 3), ...portique];
  const fontaine: ArchCell[] = [
    { x: 0, y: 0, z: 0, block: BLOC.taille },
    { x: 1, y: 0, z: 0, block: BLOC.verre },
    { x: 2, y: 0, z: 0, block: BLOC.taille },
    { x: 0, y: 0, z: 1, block: BLOC.lanterne },
    { x: 2, y: 0, z: 1, block: BLOC.lanterne },
    { x: 1, y: 1, z: 0, block: b },
    { x: 1, y: 1, z: 1, block: b },
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
  ];
  return [without(room(b, 0, 4, 2), [[doorX, 2, 0], ...windows]), roof, fontaine];
}

/**
 * La tribune (la tribune de Brio, EMC 3e ; proposition de l'artiste technique 3D, à valider par le directeur artistique) :
 * une estrade couverte, ouverte devant, d'où chacun donne son avis ; ni drapeau, ni emblème, ni pupitre officiel (le
 * pupitre est la commande de Brio). La tribune : l'estrade d'acajou, quatre sur trois, un bloc de haut, son mur du fond,
 * deux blocs de plus, et les deux poteaux de devant. Le toit de la tribune : le toit à deux pans sur les poteaux et le mur,
 * ses pignons d'acajou, une fenêtre éclairée dans le mur du fond. Le parvis : les deux marches qui montent à l'estrade,
 * deux bancs de planches de chaque côté au premier rang, pour écouter, et deux poteaux de barrière, chacun sa lanterne.
 */
function tribune(b: BlockId): Stages {
  const fenetre: [number, number, number] = [2, 4, 2];
  const estrade: ArchCell[] = [];
  for (let x = 1; x <= 4; x++) for (let y = 2; y <= 4; y++) estrade.push({ x, y, z: 0, block: b });
  for (let x = 1; x <= 4; x++) for (let z = 1; z <= 2; z++) estrade.push({ x, y: 4, z, block: b });
  for (const x of [1, 4]) for (let z = 1; z <= 2; z++) estrade.push({ x, y: 2, z, block: b });
  const roof: ArchCell[] = [{ x: fenetre[0], y: fenetre[1], z: fenetre[2], block: BLOC.lanterne }, ...deuxPans(1, 4, 2, 3, b, 1, 4)];
  const parvis: ArchCell[] = [
    { x: 2, y: 1, z: 0, block: BLOC.escalier },
    { x: 3, y: 1, z: 0, block: BLOC.escalier },
    { x: 0, y: 0, z: 0, block: BLOC.bois },
    { x: 1, y: 0, z: 0, block: BLOC.bois },
    { x: 4, y: 0, z: 0, block: BLOC.bois },
    { x: 5, y: 0, z: 0, block: BLOC.bois },
    { x: 0, y: 1, z: 0, block: BLOC.barriere },
    { x: 0, y: 1, z: 1, block: BLOC.lanterne },
    { x: 5, y: 1, z: 0, block: BLOC.barriere },
    { x: 5, y: 1, z: 1, block: BLOC.lanterne },
  ];
  return [without(estrade, [fenetre]), roof, parvis];
}

/**
 * Le bosquet (la bibliothèque de Stylet, latin-grec 3e ; proposition de l'artiste technique 3D, à valider par le
 * directeur artistique) : une bibliothèque, des gradins et une allée de lauriers ; ni temple, ni statue, aucun dieu. La
 * bibliothèque : trois sur trois, deux blocs de haut, de pierre de taille, à gauche, la porte et une fenêtre éclairée sur
 * le côté. Les gradins : le toit à deux pans de la bibliothèque, ses pignons de pierre de taille, et à droite trois
 * gradins de pierre de taille qui montent vers le fond, face au devant, où l'on s'assoit pour écouter. L'allée des
 * lauriers : la marche devant la porte, entre deux rangs de lauriers (le bloc de l'île), un laurier haut à chaque bout,
 * un autre devant les gradins, et une borne de pierre de taille qui porte une lanterne.
 */
function bosquet(b: BlockId): Stages {
  const doorX = 1;
  const windows: [number, number, number][] = [[0, 3, 1]];
  const gradins: ArchCell[] = [];
  for (let x = 3; x <= 5; x++) {
    gradins.push({ x, y: 3, z: 0, block: BLOC.taille });
    for (let z = 0; z < 2; z++) gradins.push({ x, y: 4, z, block: BLOC.taille });
  }
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 2, 2, 2, BLOC.taille, 0, 2), ...gradins];
  const allee: ArchCell[] = [
    { x: doorX, y: 1, z: 0, block: BLOC.escalier },
    { x: 0, y: 0, z: 0, block: b },
    { x: 0, y: 0, z: 1, block: b },
    { x: 0, y: 1, z: 0, block: b },
    { x: 2, y: 0, z: 0, block: b },
    { x: 2, y: 0, z: 1, block: b },
    { x: 2, y: 1, z: 0, block: b },
    { x: 4, y: 1, z: 0, block: b },
    { x: 5, y: 1, z: 0, block: BLOC.taille },
    { x: 5, y: 1, z: 1, block: BLOC.lanterne },
  ];
  return [without(room(BLOC.taille, 0, 3, 2), [[doorX, 2, 0], ...windows]), roof, allee];
}

// ---------- Les bâtiments des îles de sciences de 5e à 3e (SC-3) ----------
// Décision du directeur artistique (6 octobre 2026) : les murs du bloc de l'île, le toit de l'univers (rouge dans Blocland,
// sa couverture dans Archipéo, `roofs.ts`), aucun fronton, aucune pièce nouvelle : les blocs de finition de toujours
// (porte, lanterne, barrière, escalier, verre, planches).

/** Les murs d'une salle de `w` × 3 cases, `h` blocs de haut, coin en `x0`, 2 (la façade sur le rang 2). */
function room(b: BlockId, x0: number, w: number, h: number): ArchCell[] {
  const walls: ArchCell[] = [];
  for (let z = 0; z < h; z++) for (const [x, y] of ring(x0, 2, w, 3)) walls.push({ x, y, z, block: b });
  return walls;
}

/** La barrière de devant (rang 0), sauf aux cases `ouvertes`, et une lanterne sur les poteaux `lanternes`. */
function frontFence(openings: number[], lanterns: number[]): ArchCell[] {
  const out: ArchCell[] = [];
  for (let x = 0; x < ZW; x++) if (!openings.includes(x)) out.push({ x, y: 0, z: 0, block: BLOC.barriere });
  for (const x of lanterns) out.push({ x, y: 0, z: 1, block: BLOC.lanterne });
  return out;
}

/**
 * La station (la station météo d'Humus, SVT 5e ; DA, SC-3). La station : quatre sur trois, trois blocs de haut, de
 * strate. Le toit de la station : la porte, une fenêtre éclairée, le toit à deux pans et, sur son faîte, la lanterne qui
 * relève le ciel la nuit. La haie de la station : la barrière sur le devant et en retour sur les côtés, deux lanternes,
 * la marche, deux jardinières de strate.
 */
function weatherStation(b: BlockId): Stages {
  const doorX = 2;
  const windows: [number, number, number][] = [[3, 2, 1]];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(1, 4, 2, 3, b, 1, 4), { x: 3, y: 3, z: 5, block: BLOC.lanterne }];
  const hedge = [...frontFence([doorX], [0, ZW - 1]), { x: 0, y: 1, z: 0, block: BLOC.barriere }, { x: ZW - 1, y: 1, z: 0, block: BLOC.barriere }];
  hedge.push({ x: doorX, y: 1, z: 0, block: BLOC.escalier }, { x: 0, y: 2, z: 0, block: b }, { x: ZW - 1, y: 2, z: 0, block: b });
  return [without(room(b, 1, 4, 3), [[doorX, 2, 0], ...windows]), roof, hedge];
}

/**
 * Le chalet (le chalet de Perle, physique-chimie 5e ; DA, SC-3) : bas et large. Le chalet : cinq sur trois, deux blocs de
 * haut, de sel. Le toit du chalet : la porte, une fenêtre éclairée, le toit à deux pans qui déborde à l'est. Les bassins
 * du chalet : deux bassins d'eau (du verre) au ras du sol, cernés de sel, de part et d'autre de la marche, la barrière et
 * une lanterne au portillon.
 */
function saltChalet(b: BlockId): Stages {
  const doorX = 3;
  const windows: [number, number, number][] = [[1, 2, 1]];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, ZW - 1, 2, 2, b, 0, 4)];
  const pools: ArchCell[] = [];
  for (const x of [0, 1, 4, 5]) pools.push({ x, y: 1, z: 0, block: BLOC.verre }, { x, y: 0, z: 0, block: b });
  pools.push({ x: doorX, y: 1, z: 0, block: BLOC.escalier }, { x: 2, y: 0, z: 0, block: BLOC.barriere }, { x: 2, y: 0, z: 1, block: BLOC.lanterne });
  return [without(room(b, 0, 5, 2), [[doorX, 2, 0], ...windows]), roof, pools];
}

/**
 * La scierie (la scierie de Rabot, technologie 5e ; DA, SC-3) : un atelier, sans lame ni hache. La scierie : quatre sur
 * trois, trois blocs de haut, de bambou. Le toit de la scierie : la porte, une fenêtre éclairée, le toit à deux pans. La
 * cour de la scierie : à droite, le bois qui sèche (trois planches au sol, la dernière une botte de cannes, deux dessus), la barrière, son portillon, deux
 * lanternes et la marche.
 */
function sawmill(b: BlockId): Stages {
  const doorX = 1;
  const windows: [number, number, number][] = [[2, 2, 1]];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 3, 2, 3, b, 0, 3)];
  const courtyard: ArchCell[] = [];
  // La planche de devant est une botte de cannes de l'île : son dessus se voit, comme celui du composteur d'Humus (la
  // commande de la Prairie), qui ne demande ainsi aucun appel de dessin de plus dans Blocland (budget.test.ts).
  for (let y = 2; y <= 4; y++) courtyard.push({ x: 5, y, z: 0, block: y === 4 ? b : BLOC.bois });
  courtyard.push({ x: 5, y: 2, z: 1, block: BLOC.bois }, { x: 5, y: 3, z: 1, block: BLOC.bois }, { x: doorX, y: 1, z: 0, block: BLOC.escalier }, ...frontFence([doorX], [0, ZW - 1]));
  return [without(room(b, 0, 4, 3), [[doorX, 2, 0], ...windows]), roof, courtyard];
}

/**
 * La pépinière (la pépinière de Nectar, SVT 4e ; DA, SC-3) : longue et basse, sans verrière. La pépinière : six sur trois,
 * deux blocs de haut, de pétale. Le toit de la pépinière : la porte, le toit à deux pans sur toute la longueur (de terre
 * cuite dans Archipéo). Les allées de la pépinière : un rang de pétale de part et d'autre de la marche, la barrière, son
 * portillon, deux lanternes.
 */
function nursery(b: BlockId): Stages {
  const doorX = 2;
  const roof = [...ouvertures([doorX, 2, 0], []), ...deuxPans(0, ZW - 1, 2, 2, b, 0, ZW - 1)];
  const rows: ArchCell[] = [];
  for (let x = 0; x < ZW; x++) if (x !== doorX) rows.push({ x, y: 1, z: 0, block: b });
  rows.push({ x: doorX, y: 1, z: 0, block: BLOC.escalier }, ...frontFence([doorX], [0, ZW - 1]));
  return [without(room(b, 0, ZW, 2), [[doorX, 2, 0]]), roof, rows];
}

/**
 * Le pavillon (le pavillon de Radar, physique-chimie 4e ; DA, SC-3). Le pavillon : quatre sur trois, trois blocs de haut,
 * de bobine. Le toit du pavillon : la porte, une fenêtre éclairée, le toit à deux pans. Le mât du pavillon : à droite, un
 * mât de quatre barrières, sa lanterne au sommet (la nuit, rien ne brille plus que les lanternes ; aucun éclair), la
 * barrière, son portillon, une lanterne et la marche.
 */
function pavilion(b: BlockId): Stages {
  const doorX = 1;
  const windows: [number, number, number][] = [[2, 2, 1]];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(0, 3, 2, 3, b, 0, 3)];
  const mast: ArchCell[] = [];
  for (let z = 0; z < 4; z++) mast.push({ x: 5, y: 3, z, block: BLOC.barriere });
  mast.push({ x: 5, y: 3, z: 4, block: BLOC.lanterne }, { x: doorX, y: 1, z: 0, block: BLOC.escalier }, ...frontFence([doorX], [0]));
  return [without(room(b, 0, 4, 3), [[doorX, 2, 0], ...windows]), roof, mast];
}

/**
 * L'usine (l'usine de Manivelle, technologie 4e ; DA, SC-3) : ni cheminée ni fumée. L'usine : cinq sur trois, trois blocs
 * de haut, de liège. Le toit de l'usine : la porte large (deux cases, deux de haut), le toit à deux pans. La cour de
 * l'usine : deux maquettes posées (deux lièges), la barrière, son portillon large, deux lanternes et la marche.
 */
function factory(b: BlockId): Stages {
  const doors: [number, number, number][] = [
    [1, 2, 0],
    [2, 2, 0],
    [1, 2, 1],
    [2, 2, 1],
  ];
  const roof = [...doors.map(([x, y, z]) => ({ x, y, z, block: BLOC.porte })), ...deuxPans(0, 4, 2, 3, b, 0, 4)];
  const courtyard = [...frontFence([1, 2], [0, ZW - 1]), { x: 1, y: 1, z: 0, block: BLOC.escalier }, { x: 2, y: 1, z: 0, block: BLOC.escalier }, { x: 4, y: 1, z: 0, block: b }, { x: 5, y: 3, z: 0, block: b }];
  return [without(room(b, 0, 5, 3), doors), roof, courtyard];
}

/**
 * L'infirmerie (l'infirmerie d'Olive, SVT 3e ; DA, SC-3) : un lieu de repos, sans croix. L'infirmerie : cinq sur trois,
 * trois blocs de haut, de savon, la porte au milieu. Le toit de l'infirmerie : la porte, une fenêtre éclairée de chaque
 * côté, le toit à deux pans (de terre cuite dans Archipéo). Le jardin de l'infirmerie : la cour de toujours (barrière,
 * portillon, lanternes, marche, jardinières) ; les arbres fruitiers sont au décor de l'île.
 */
function infirmary(b: BlockId): Stages {
  const doorX = 3;
  const windows: [number, number, number][] = [
    [2, 2, 1],
    [4, 2, 1],
  ];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(1, ZW - 1, 2, 3, b, 1, ZW - 1)];
  return [without(room(b, 1, 5, 3), [[doorX, 2, 0], ...windows]), roof, yard(b, doorX, 2)];
}

/**
 * Le gymnase (le gymnase de Virage, physique-chimie 3e ; DA, SC-3). Le gymnase : cinq sur trois, trois blocs de haut, de
 * ressort. Le toit du gymnase : la grande porte (deux cases, deux de haut), le toit à deux pans. La piste du gymnase : à
 * droite, une piste en marches du fond vers le devant (l'élan en haut, le saut, l'atterrissage au sol), la barrière, son
 * portillon large, deux lanternes.
 */
function gym(b: BlockId): Stages {
  const doors: [number, number, number][] = [
    [1, 2, 0],
    [2, 2, 0],
    [1, 2, 1],
    [2, 2, 1],
  ];
  const roof = [...doors.map(([x, y, z]) => ({ x, y, z, block: BLOC.porte })), ...deuxPans(0, 4, 2, 3, b, 0, 4)];
  const track: ArchCell[] = [
    { x: 5, y: 4, z: 0, block: b },
    { x: 5, y: 4, z: 1, block: b },
    { x: 5, y: 3, z: 0, block: b },
    { x: 5, y: 3, z: 1, block: BLOC.escalier },
    { x: 5, y: 2, z: 0, block: BLOC.escalier },
    ...frontFence([1, 2, ZW - 1], [0, 3]),
  ];
  return [without(room(b, 0, 5, 3), doors), roof, track];
}

/**
 * Le poste (le poste de Navette, technologie 3e ; DA, SC-3) : ni écran ni antenne. Le poste : quatre sur trois, trois
 * blocs de haut, de cire. Le toit du poste : la porte, une fenêtre éclairée, le toit à deux pans. Les piquets du poste :
 * quatre piquets (des barrières), reliés deux à deux par un fil de cire au ras du sol, une lanterne sur les deux de devant,
 * et la marche. Aucune corde qui pend.
 */
function outpost(b: BlockId): Stages {
  const doorX = 2;
  const windows: [number, number, number][] = [[3, 2, 1]];
  const roof = [...ouvertures([doorX, 2, 0], windows), ...deuxPans(1, 4, 2, 3, b, 1, 4)];
  const posts: ArchCell[] = [];
  for (const x of [0, ZW - 1]) {
    posts.push({ x, y: 1, z: 0, block: BLOC.barriere }, { x, y: 4, z: 0, block: BLOC.barriere }, { x, y: 2, z: 0, block: b }, { x, y: 3, z: 0, block: b }, { x, y: 1, z: 1, block: BLOC.lanterne });
  }
  posts.push({ x: doorX, y: 1, z: 0, block: BLOC.escalier });
  return [without(room(b, 1, 4, 3), [[doorX, 2, 0], ...windows]), roof, posts];
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
    case 'musee':
      return musee(block);
    case 'quartier':
      return quartier(block);
    case 'logis':
      return logis(block);
    case 'moulin':
      return moulin(block);
    case 'halle':
      return halle(block);
    case 'entrepot':
      return entrepot(block);
    case 'bibliotheque':
      return bibliotheque(block);
    case 'mairie':
      return mairie(block);
    case 'serre':
      return serre(block);
    case 'laboratoire':
      return laboratoire(block);
    case 'atelier':
      return atelier(block);
    case 'preau':
      return preau(block);
    case 'fournil':
      return fournil(block);
    case 'grotte':
      return grotte(block);
    case 'loge':
      return loge(block);
    case 'colonnade':
      return colonnade(block);
    case 'tribune':
      return tribune(block);
    case 'bosquet':
      return bosquet(block);
    case 'station':
      return weatherStation(block);
    case 'chalet':
      return saltChalet(block);
    case 'scierie':
      return sawmill(block);
    case 'pepiniere':
      return nursery(block);
    case 'pavillon':
      return pavilion(block);
    case 'usine':
      return factory(block);
    case 'infirmerie':
      return infirmary(block);
    case 'gymnase':
      return gym(block);
    case 'poste':
      return outpost(block);
  }
}


// Les monuments : de grands ouvrages classés, deux par archipel (et les grands projets neufs : deux de plus en 4e, trois
// en 3e), chacun sur un îlot à lui au large (l'observatoire des
// baleines, le grand moulin…). Ils se construisent comme un plan, bloc par bloc, avec les blocs des îles de l'archipel :
// de quoi employer ceux qui s'accumulent une fois les bâtiments finis. Ils ne ferment rien et n'ouvrent rien ; un
// monument terminé rapporte de l'XP et un succès, et reste dans le monde.
import type { BiomeId, BlockId } from '../biomes';
import type { ArchipelagoId } from './archipelagos';
import type { PlanCell, PlanDef } from './plans';
import { BLOC } from '../biomes';

/** Côté de l'îlot d'un monument (en cases) ; le monument tient dans ses 7 × 7 du milieu. */
export const MONUMENT_ISLET = 9;

export interface MonumentDef extends PlanDef {
  zone: 'monument';
  archipelago: ArchipelagoId;
  /** Ce que c'est, en une phrase (lue dans le panneau). */
  description: string;
  /** Le coin de l'îlot dans le monde (x, y) : placé une fois pour toutes, loin des îles, des ouvrages et des baleines. */
  islet: { x: number; y: number };
  /**
   * L'îlot détaché (carte « Détacher », mainteneur, 9 octobre 2026) : il reste à `islet` quand son lieu bouge ou tourne
   * dans « Modifier le plan », au lieu de le suivre (exception à GD-9). Il compte toujours dans l'emprise de son lieu,
   * à sa place fixe : un obstacle pour les autres lieux, et pour son lieu lui-même (`footprint.ts`).
   */
  detache?: true;
  /**
   * Le bloc qui s'allume quand le monument est fini (toutes ses cases posées, et seulement alors) : ses cubes prennent la
   * lueur des lanternes (`VoxelCube.lit`). Le phare du large : sa lanterne de vitraux (GD-10, « à la fin, le phare
   * s'allume »).
   */
  litWhenDone?: BlockId;
}

// ---------- Outils de dessin ----------

type Put = (x: number, y: number, z: number, block: BlockId) => void;

function drawer(): { cells: PlanCell[]; put: Put; box: (x0: number, y0: number, z0: number, w: number, d: number, h: number, block: BlockId) => void } {
  const seen = new Map<string, number>();
  const cells: PlanCell[] = [];
  // Une case posée deux fois garde le dernier bloc (un détail recouvre le gros œuvre).
  const put: Put = (x, y, z, block) => {
    const k = `${x},${y},${z}`;
    const i = seen.get(k);
    if (i !== undefined) cells[i] = { x, y, z, block };
    else {
      seen.set(k, cells.length);
      cells.push({ x, y, z, block });
    }
  };
  const box = (x0: number, y0: number, z0: number, w: number, d: number, h: number, block: BlockId) => {
    for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) for (let z = z0; z < z0 + h; z++) put(x, y, z, block);
  };
  return { cells, put, box };
}

/** Le tour d'un rectangle. */
function ringOf(x0: number, y0: number, w: number, d: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) if (x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + d - 1) out.push([x, y]);
  return out;
}

/** Un disque (carré aux coins coupés) de côté `n`, centré sur (c, c). */
function disc(c: number, n: number): [number, number][] {
  const r = (n - 1) / 2;
  const out: [number, number][] = [];
  for (let x = c - r; x <= c + r; x++) for (let y = c - r; y <= c + r; y++) if (Math.abs(x - c) + Math.abs(y - c) <= r + Math.floor(r / 2)) out.push([x, y]);
  return out;
}

// ---------- Les dessins (x, y dans 0..6, la façade devant, en y = 0 ; z = 0 : sur l'îlot) ----------

/** L'observatoire des baleines : une plateforme de galets, une tour de brique aux fenêtres de verre, un belvédère de bois et sa longue-vue. */
function observatoire(): PlanCell[] {
  const { cells, put, box } = drawer();
  box(0, 0, 0, 7, 7, 1, BLOC.galet);
  for (let z = 1; z <= 4; z++) for (const [x, y] of ringOf(2, 3, 3, 3)) put(x, y, z, BLOC.brique);
  put(3, 3, 1, BLOC.cabine);
  for (const [x, y] of [
    [3, 3],
    [2, 4],
    [4, 4],
    [3, 5],
  ])
    put(x, y, 3, BLOC.verre);
  box(1, 2, 5, 5, 5, 1, BLOC.bois);
  // Les poteaux du belvédère et le pied de la longue-vue : des poutres assemblées (GD-2).
  for (const [x, y] of [
    [1, 2],
    [5, 2],
    [1, 6],
    [5, 6],
  ])
    put(x, y, 6, BLOC.poutre);
  // La longue-vue, pointée vers le large (et les baleines).
  put(3, 4, 6, BLOC.poutre);
  put(3, 3, 7, BLOC.obsidienne);
  put(3, 2, 7, BLOC.obsidienne);
  put(3, 1, 8, BLOC.obsidienne);
  // Des marches de sable jusqu'à la porte.
  put(3, 2, 1, BLOC.sable);
  put(3, 1, 1, BLOC.sable);
  return cells;
}

/** Le grand moulin : une butte de terre, une tour de brique puis de pierre, un toit de bois, quatre ailes en croix. */
function moulin(): PlanCell[] {
  const { cells, put, box } = drawer();
  box(1, 1, 0, 5, 5, 1, BLOC.terre);
  for (let z = 1; z <= 5; z++) for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, z, z <= 3 ? BLOC.brique : BLOC.pierre);
  put(3, 2, 1, BLOC.cabine);
  put(3, 2, 3, BLOC.verre);
  box(2, 2, 6, 3, 3, 1, BLOC.bois);
  put(3, 3, 7, BLOC.poutre);
  // Les ailes : un moyeu de cadran devant la tour, quatre bras de bois, de la toile de sable au bout de chacun.
  put(3, 1, 5, BLOC.cadran);
  for (const [dx, dz] of [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    // Le pied de chaque aile, au moyeu : une poutre assemblée (GD-2).
    put(3 + dx, 1, 5 + dz, BLOC.poutre);
    put(3 + 2 * dx, 1, 5 + 2 * dz, BLOC.bois);
    put(3 + 2 * dx, 1, 5 + dz, BLOC.sable);
  }
  return cells;
}

/** Le phare du large : un socle de glace, une tour rayée de tuiles et de glace, une galerie de lambris, une lanterne de vitraux. */
function phareLarge(): PlanCell[] {
  const { cells, put, box } = drawer();
  box(1, 1, 0, 5, 5, 1, BLOC.glace);
  for (let z = 1; z <= 7; z++) for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, z, z % 2 === 1 ? BLOC.tuile : BLOC.glace);
  put(3, 2, 1, BLOC.lambris);
  for (const [x, y] of ringOf(1, 1, 5, 5)) put(x, y, 7, BLOC.lambris);
  // La lanterne : des vitraux assemblés (GD-2).
  for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, 8, BLOC.vitrail);
  box(2, 2, 9, 3, 3, 1, BLOC.toile);
  put(3, 3, 10, BLOC.tuile);
  return cells;
}

/** Le kiosque à musique : un plancher rond de lambris, huit poteaux de tourbe, un toit rayé qui monte en pointe. */
function kiosqueMusique(): PlanCell[] {
  const { cells, put } = drawer();
  for (const [x, y] of disc(3, 7)) put(x, y, 0, BLOC.lambris);
  for (const [x, y] of [
    [1, 1],
    [3, 0],
    [5, 1],
    [6, 3],
    [5, 5],
    [3, 6],
    [1, 5],
    [0, 3],
  ])
    for (let z = 1; z <= 3; z++) put(x, y, z, BLOC.tourbe);
  for (const [x, y] of disc(3, 7)) put(x, y, 4, (x + y) % 2 === 0 ? BLOC.toile : BLOC.tuile);
  for (const [x, y] of disc(3, 5)) put(x, y, 5, (x + y) % 2 === 0 ? BLOC.tuile : BLOC.toile);
  // Le lanterneau au sommet du toit : des vitraux assemblés (GD-2).
  for (const [x, y] of disc(3, 3)) put(x, y, 6, BLOC.vitrail);
  put(3, 3, 7, BLOC.vitrail);
  return cells;
}

/** Le viaduc : trois paires de piles d'ardoise, un tablier de rails, une locomotive d'acier à la cabine de velours. */
function viaduc(): PlanCell[] {
  const { cells, put, box } = drawer();
  for (const x of [0, 3, 6]) for (const y of [2, 4]) for (let z = 0; z <= 3; z++) put(x, y, z, BLOC.ardoise);
  // Les arches : une voûte d'ardoise entre deux piles, sous le tablier.
  for (const x of [1, 2, 4, 5]) for (const y of [2, 4]) put(x, y, 3, BLOC.ardoise);
  box(0, 2, 4, 7, 3, 1, BLOC.rail);
  box(1, 3, 5, 3, 1, 2, BLOC.acier);
  // Les roues de la locomotive : des engrenages assemblés (GD-2).
  for (const x of [1, 2, 3]) put(x, 3, 5, BLOC.engrenage);
  put(4, 3, 5, BLOC.velours);
  put(4, 3, 6, BLOC.velours);
  put(1, 3, 7, BLOC.acier);
  // Des garde-corps de calque au bord du tablier.
  for (const x of [0, 6]) for (const y of [2, 4]) put(x, y, 5, BLOC.calque);
  // Le levier de l'aiguillage, un engrenage assemblé (GD-2).
  put(3, 2, 5, BLOC.engrenage);
  return cells;
}

/** L'amphithéâtre : trois gradins de velours sur l'ardoise, une scène de parchemin, deux colonnes de calque et leurs projecteurs d'acier. */
function amphitheatre(): PlanCell[] {
  const { cells, put, box } = drawer();
  for (let t = 0; t < 3; t++) {
    const y = 4 + t;
    for (let x = 0; x < 7; x++) {
      for (let z = 0; z < t; z++) put(x, y, z, BLOC.ardoise);
      put(x, y, t, BLOC.velours);
    }
  }
  box(1, 0, 0, 5, 3, 1, BLOC.parchemin);
  for (const x of [1, 5]) {
    for (let z = 1; z <= 2; z++) put(x, 0, z, BLOC.calque);
    // Le haut des colonnes, leurs projecteurs et la machinerie de la scène : des engrenages assemblés (GD-2).
    put(x, 0, 3, BLOC.engrenage);
    put(x, 0, 4, BLOC.engrenage);
  }
  put(3, 2, 1, BLOC.engrenage);
  return cells;
}

/** L'observatoire des étoiles : un socle de marbre, un tambour de quartz, une coupole de lentilles, une lunette d'antenne, deux prismes à la porte. */
function etoiles(): PlanCell[] {
  const { cells, put } = drawer();
  for (const [x, y] of disc(3, 7)) put(x, y, 0, BLOC.marbre);
  for (let z = 1; z <= 3; z++) for (const [x, y] of ringOf(1, 1, 5, 5)) put(x, y, z, BLOC.quartz);
  put(3, 1, 1, BLOC.taille);
  // Deux miroirs assemblés à la porte (GD-2).
  put(2, 1, 2, BLOC.miroir);
  put(4, 1, 2, BLOC.miroir);
  for (const [x, y] of disc(3, 5)) put(x, y, 4, BLOC.lentille);
  for (const [x, y] of disc(3, 3)) put(x, y, 5, BLOC.lentille);
  // La grande lunette : des miroirs assemblés (GD-2).
  put(3, 3, 6, BLOC.miroir);
  put(3, 2, 6, BLOC.miroir);
  put(3, 1, 7, BLOC.miroir);
  return cells;
}

/** Le temple de marbre : un soubassement de pierre de taille, huit colonnes de marbre, un entablement, un toit de prismes au faîte de miroirs. */
function temple(): PlanCell[] {
  const { cells, put, box } = drawer();
  box(0, 1, 0, 7, 5, 1, BLOC.taille);
  for (const x of [0, 2, 4, 6]) for (const y of [1, 5]) for (let z = 1; z <= 4; z++) put(x, y, z, BLOC.marbre);
  for (const [x, y] of ringOf(0, 1, 7, 5)) put(x, y, 5, BLOC.taille);
  for (const [x, y] of ringOf(0, 1, 7, 5)) put(x, y, 6, BLOC.prisme);
  // Le faîte, qui renvoie le soleil : des miroirs assemblés (GD-2).
  for (let x = 0; x < 7; x++) put(x, 3, 7, BLOC.miroir);
  // L'autel au fond, une antenne qui capte les étoiles.
  put(3, 4, 1, BLOC.quartz);
  put(3, 4, 2, BLOC.antenne);
  return cells;
}

/**
 * Le portique des docks : un quai d'ardoise et ses rails, les chariots et les conteneurs ; quatre jambes d'acier ; une
 * poutre en « Π » et sa flèche tendue vers la mer ; la cabine du grutier, aux vitres de calque, et son treuil. Dessiné
 * en masses pleines, pour peu de faces (le pire cas du 4e, world/budget.ts).
 */
function portique(): PlanCell[] {
  const { cells, put, box } = drawer();
  // Le quai (z0 et z1), en retrait d'une case sur l'avant : la dalle et deux voies de rails ; dessus, les chariots des
  // jambes (roues d'engrenage, GD-2), des rails entre eux et les conteneurs au milieu, en un seul bloc.
  box(0, 1, 0, 7, 6, 1, BLOC.ardoise);
  for (const x of [1, 5]) for (let y = 1; y < 7; y++) put(x, y, 0, BLOC.rail);
  for (const x of [1, 5]) for (const y of [3, 4, 5]) put(x, y, 1, y === 4 ? BLOC.rail : BLOC.engrenage);
  box(2, 3, 1, 3, 3, 1, BLOC.conteneur);
  // Les quatre jambes (z2 et z3).
  for (const x of [1, 5]) for (const y of [3, 5]) for (let z = 2; z <= 3; z++) put(x, y, z, BLOC.acier);
  // La poutre (z4), d'un bord à l'autre, et la flèche qui dépasse du quai d'une case, vers la mer (devant). Rien ne
  // pend dessous.
  box(0, 3, 4, 7, 3, 1, BLOC.acier);
  for (const y of [0, 1, 2]) put(3, y, 4, BLOC.acier);
  // La cabine (z5 et z6) : des vitres de calque devant et sur les côtés, le siège de velours, un toit d'acier ; le
  // treuil derrière elle, un engrenage (GD-2).
  for (const x of [2, 3, 4]) put(x, 3, 5, BLOC.calque);
  put(2, 4, 5, BLOC.calque);
  put(3, 4, 5, BLOC.velours);
  put(4, 4, 5, BLOC.calque);
  box(2, 3, 6, 3, 2, 1, BLOC.acier);
  put(3, 5, 5, BLOC.engrenage);
  return cells;
}

/**
 * La tour des signaux : un pied d'ardoise de 7 × 7, un treillis de 5 × 5 (du liège entre quatre montants d'acier), un
 * fût d'acier de 3 × 3 cerclé d'engrenages, une tête en croix et sa couronne de bobines. Dessinée en masses pleines,
 * pour peu de faces (le pire cas du 4e, world/budget.ts).
 */
function tourSignaux(): PlanCell[] {
  const { cells, put, box } = drawer();
  // Le pied (z0) : une dalle d'ardoise (la fonte, autre gris sombre, ne la touche jamais : HG-3, DA).
  box(0, 0, 0, 7, 7, 1, BLOC.ardoise);
  // Le treillis (z1 et z2) : quatre montants d'acier aux coins, un remplissage de liège plein (pas de damier : un motif
  // à fort contraste, DA).
  box(1, 1, 1, 5, 5, 2, BLOC.liege);
  for (const x of [1, 5]) for (const y of [1, 5]) for (let z = 1; z <= 2; z++) put(x, y, z, BLOC.acier);
  // Le fût (z3 à z5) : plein, cerclé d'engrenages à mi-hauteur (GD-2).
  box(2, 2, 3, 3, 3, 3, BLOC.acier);
  for (const [x, y] of [
    [3, 2],
    [2, 3],
    [4, 3],
    [3, 4],
  ])
    put(x, y, 4, BLOC.engrenage);
  // La tête (z6 et z7) : deux bras en croix, puis une couronne de huit bobines serrée autour du mât (d'un bloc, pour que
  // sa lueur l'enveloppe : ./lanternGlow.ts).
  for (let i = 0; i < 7; i++) {
    put(i, 3, 6, BLOC.acier);
    put(3, i, 6, BLOC.acier);
  }
  for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, 7, BLOC.bobine);
  put(3, 3, 7, BLOC.acier);
  return cells;
}

/**
 * La fusée, sur son pas de tir : un pas de grès et de pierre de taille, un premier étage de marbre à quatre ailerons de
 * reliure, un second étage à hublots de lentille, une coiffe de grès et son antenne. Elle reste au sol.
 */
function fusee(): PlanCell[] {
  const { cells, put, box } = drawer();
  // Le pas de tir (z0).
  box(0, 0, 0, 7, 7, 1, BLOC.taille);
  for (const [x, y] of ringOf(0, 0, 7, 7)) put(x, y, 0, BLOC.gres);
  // Le premier étage (z1 à z3) et ses ailerons ; des miroirs aux coins de la jonction (GD-2).
  box(2, 2, 1, 3, 3, 3, BLOC.marbre);
  for (const [x, y] of [
    [2, 2],
    [4, 2],
    [2, 4],
    [4, 4],
  ])
    put(x, y, 3, BLOC.miroir);
  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    put(3 + 2 * dx, 3 + 2 * dy, 1, BLOC.reliure);
    put(3 + 3 * dx, 3 + 3 * dy, 1, BLOC.reliure);
    put(3 + 2 * dx, 3 + 2 * dy, 2, BLOC.reliure);
  }
  // Le second étage (z4 à z6) : quatre hublots de lentille, une bague de reliure en haut.
  box(2, 2, 4, 3, 3, 3, BLOC.marbre);
  for (const [x, y] of [
    [3, 2],
    [2, 3],
    [4, 3],
    [3, 4],
  ])
    put(x, y, 5, BLOC.lentille);
  for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, 6, BLOC.reliure);
  // La coiffe (z7 à z9).
  box(2, 2, 7, 3, 3, 1, BLOC.gres);
  for (const [x, y] of disc(3, 3)) put(x, y, 8, BLOC.gres);
  put(3, 3, 9, BLOC.antenne);
  return cells;
}

/**
 * Le château d'eau : un pied de pierre de taille et de grès, un fût de marbre, une large cuve de reliure en
 * champignon, un toit de marbre couronné de lanternons de prisme.
 */
function chateauEau(): PlanCell[] {
  const { cells, put, box } = drawer();
  // Le pied (z0 et z1).
  for (const [x, y] of disc(3, 5)) put(x, y, 0, BLOC.taille);
  box(2, 2, 1, 3, 3, 1, BLOC.gres);
  // Le fût (z2 à z4), creux, sa porte de reliure devant.
  for (let z = 2; z <= 4; z++) for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, z, BLOC.marbre);
  put(3, 2, 2, BLOC.reliure);
  // La cuve (z5 et z6) : elle s'élargit, quatre jauges de miroir sur son bord (GD-2).
  for (const [x, y] of disc(3, 5)) put(x, y, 5, BLOC.reliure);
  for (const [x, y] of disc(3, 7)) put(x, y, 6, BLOC.reliure);
  for (const [x, y] of [
    [3, 0],
    [0, 3],
    [6, 3],
    [3, 6],
  ])
    put(x, y, 6, BLOC.miroir);
  // La couronne (z7 à z9) : le toit, puis une couronne de huit lanternons de prisme serrés autour de l'épi d'antenne
  // (d'un bloc, pour que leur lueur les enveloppe : ./lanternGlow.ts).
  for (const [x, y] of disc(3, 5)) put(x, y, 7, BLOC.marbre);
  for (const [x, y] of ringOf(2, 2, 3, 3)) put(x, y, 8, BLOC.prisme);
  put(3, 3, 8, BLOC.antenne);
  put(3, 3, 9, BLOC.antenne);
  return cells;
}

/**
 * La colonne des solides : un cube de marbre, un cylindre de quartz, un tronc de pyramide de pierre de taille aux coins
 * de miroir, une sphère au sommet, dont la ceinture de lentille luit entre deux calottes de quartz. Pleins : un solide
 * creux montre ses faces du dedans, et coûte plus.
 */
function colonneSolides(): PlanCell[] {
  const { cells, put, box } = drawer();
  // Le cube (z0 à z4), 5 × 5 × 5.
  box(1, 1, 0, 5, 5, 5, BLOC.marbre);
  // Le cylindre (z5 et z6).
  for (let z = 5; z <= 6; z++) for (const [x, y] of disc(3, 5)) put(x, y, z, BLOC.quartz);
  // Le tronc de pyramide (z7 et z8) : 5 × 5 puis 3 × 3, des miroirs à ses quatre coins du haut (GD-2).
  box(1, 1, 7, 5, 5, 1, BLOC.taille);
  box(2, 2, 8, 3, 3, 1, BLOC.taille);
  for (const [x, y] of [
    [2, 2],
    [4, 2],
    [2, 4],
    [4, 4],
  ])
    put(x, y, 8, BLOC.miroir);
  // La sphère (z9 à z11) : une calotte de quartz, la ceinture de lentille (ce qui luit), une calotte de quartz.
  for (const [x, y] of disc(3, 3)) put(x, y, 9, BLOC.quartz);
  box(2, 2, 10, 3, 3, 1, BLOC.lentille);
  for (const [x, y] of disc(3, 3)) put(x, y, 11, BLOC.quartz);
  return cells;
}

// ---------- Les monuments ----------

type Fiche = Omit<MonumentDef, 'cells' | 'origin' | 'zone'> & { draw: () => PlanCell[] };

/**
 * Les places des îlots : trouvées une fois (la place libre la plus proche de l'île du monument, voir `monumentIsletFree`
 * dans terrain.ts), puis écrites ici, pour que le dessin du monde n'ait
 * rien à chercher. Un test vérifie qu'elles restent libres (loin des terres, des ouvrages, du port et des
 * baleines).
 */
const FICHES: Fiche[] = [
  {
    id: 'landmark-6e-1',
    biome: 'french-6e-reading',
    archipelago: '6e',
    name: 'L’observatoire des baleines',
    description: 'Une tour de brique sur une plateforme de galets, et au sommet une longue-vue tournée vers le large, là où soufflent les baleines.',
    islet: { x: 22, y: 79 }, // suit la Tour calée sur le pas (GD-9, 05/10/2026) ; recalé avec les îles agrandies (GD-11), puis à droite de la Tour, sur une place libre du pas, avec les formes des îles (GD-12, 08/10/2026)
    reward: { xp: 150, chest: {} },
    done: 'L’observatoire est debout ! D’en haut, on voit les baleines souffler au large.',
    draw: observatoire,
  },
  {
    id: 'landmark-6e-2',
    biome: 'french-6e-grammar-spelling',
    archipelago: '6e',
    name: 'Le grand moulin',
    description: 'Un moulin de brique et de pierre, ses quatre ailes de bois et de toile tournées vers le vent du large.',
    islet: { x: 50, y: 45 }, // suit la Ferme : la Forêt a grandi (01/10/2026), la carte s'est calée sur le pas (GD-9) ; recalé avec les îles agrandies (GD-11), puis avec les formes des îles (GD-12, 08/10/2026) à droite de la Ferme, entre elle et la Forêt : au large de son lobe gauche, il prenait au Hangar et au Volcan presque toutes leurs places où glisser (une ou deux par quart de tour ; onze et cinq au moins depuis, trois cases plus bas que d'abord, pour garder quatre cases d'eau devant la Plaine)
    reward: { xp: 150, chest: {} },
    done: 'Le grand moulin tourne ! Il moud le grain de toutes les îles des Premiers Rivages.',
    draw: moulin,
  },
  {
    id: 'landmark-5e-1',
    biome: 'maths-5e-signed-numbers',
    archipelago: '5e',
    name: 'Le phare du large',
    description: 'Une haute tour rayée de tuiles et de glace, une galerie de lambris et une lanterne de vitraux, pour les navires qui passent.',
    islet: { x: 77, y: 387 }, // au loin, derrière le Marais, entre le Carrefour et la Prairie, détaché du Glacier (GD-12, cartes « Détacher » et « 29 au Manoir », mainteneur, 9 octobre 2026 : tout à l'est de la rangée, où le Manoir garde le plus de places libres, 29 au pire quart de tour) : dans la vue de l'archipel depuis le Glacier, entier, haut dans le cadre, entre les noms du Marais et du Carrefour, sans en porter aucun ; hors de la vue du Glacier. Devant le Glacier (38, 298 ; 46, 304 ; 38, 304), il venait au premier plan, coupé par le bas, sous les boutons ; sa place de main (56, 348), entre le Glacier et le Marais, est prise par le Carrefour agrandi. Si loin, l'îlot qui suivrait le Glacier lui ôterait presque toutes ses places libres : il ne le suit plus (`detache`)
    detache: true,
    reward: { xp: 180, chest: {} },
    done: 'Le phare du large s’allume ! Plus aucun navire ne se perd entre les Collines.',
    draw: phareLarge,
    litWhenDone: BLOC.vitrail,
  },
  {
    id: 'landmark-5e-2',
    biome: 'english-5e-grammar',
    archipelago: '5e',
    name: 'Le kiosque à musique',
    description: 'Un kiosque rond au plancher de lambris, huit poteaux et un toit rayé de toile et de tuiles, pour les fanfares du dimanche.',
    islet: { x: 117, y: 383 }, // derrière le Manoir, à droite, monté au second rang à côté du Marais (GD-12, 9 octobre 2026) ; avant, suit l'île calée sur le pas (GD-9), recalé avec les îles agrandies (GD-11)
    reward: { xp: 180, chest: {} },
    done: 'Le kiosque à musique est fini ! La fanfare des Collines peut jouer.',
    draw: kiosqueMusique,
  },
  {
    id: 'landmark-4e-1',
    biome: 'english-4e-grammar',
    archipelago: '4e',
    name: 'Le viaduc',
    description: 'Des piles et des arches d’ardoise, un tablier de rails, et une locomotive d’acier qui attend le départ.',
    islet: { x: 8, y: 654 }, // suit la Gare, au second rang des Anciens Ateliers redessinés (GD-9, 05/10/2026) ; recalé avec les îles agrandies (GD-11, 08/10/2026) ; plus à l'ouest depuis une forme par île (GD-12, 09/10/2026 : sa place d'avant n'avait plus quatre cases d'eau autour d'elle) ; puis rapproché de la Gare, quatre cases d'eau devant elle (relecture du 9 octobre 2026 : loin devant, tourné d'un demi-tour, il ne laissait à la Gare qu'une place libre)
    reward: { xp: 210, chest: {} },
    done: 'Le viaduc tient bon ! La locomotive siffle au-dessus de la mer.',
    draw: viaduc,
  },
  {
    id: 'landmark-4e-2',
    biome: 'english-4e-comprehension',
    archipelago: '4e',
    name: 'L’amphithéâtre',
    description: 'Trois gradins de velours, une scène de parchemin entre deux colonnes, et des projecteurs pour les grands soirs.',
    islet: { x: 110, y: 650 }, // suit le Théâtre, au second rang des Anciens Ateliers redessinés (GD-9, 05/10/2026) ; recalé avec les îles agrandies (GD-11, 08/10/2026) ; devant le Théâtre, derrière la Falaise, depuis une forme par île (GD-12, 09/10/2026 : sa place d'avant est dans la terre du Théâtre)
    reward: { xp: 210, chest: {} },
    done: 'L’amphithéâtre est prêt ! Tout le monde des Anciens Ateliers viendra au spectacle.',
    draw: amphitheatre,
  },
  {
    id: 'landmark-3e-1',
    biome: 'french-3e-close-reading',
    archipelago: '3e',
    name: 'L’observatoire des étoiles',
    description: 'Un tambour de quartz sous une coupole de lentilles, et une grande lunette pointée vers le ciel.',
    islet: { x: 62, y: 980 }, // suit l'île calée sur le pas (GD-9, 05/10/2026) ; recalé avec les îles agrandies (GD-11, 08/10/2026) ; juste derrière l'Observatoire des textes depuis une forme par île (GD-12, 09/10/2026 : sa place d'avant touchait la côte du Verger)
    reward: { xp: 240, chest: {} },
    done: 'L’observatoire des étoiles est ouvert ! On voit plus loin que les nuages.',
    draw: etoiles,
  },
  {
    id: 'landmark-3e-2',
    biome: 'maths-3e-geometry',
    archipelago: '3e',
    name: 'Le temple de marbre',
    description: 'Huit colonnes de marbre sur un soubassement de pierre de taille, un toit de prismes et un faîte de miroirs qui brillent au soleil.',
    islet: { x: 4, y: 912 }, // suit le Belvédère : le Phare a grandi (01/10/2026), la carte s'est calée sur le pas (GD-9) ; recalé avec les îles agrandies (GD-11, 08/10/2026) ; devant le Belvédère, avancé au premier rang, depuis une forme par île (GD-12, 09/10/2026) ; entre le Studio des ondes et le Belvédère, à côté de sa côte ouest, depuis la relecture du 9 octobre 2026 (devant lui, il coupait sa côte au premier plan de la vue de l'archipel ; plus loin devant, il ne laissait au Belvédère aucune place libre au demi-tour)
    reward: { xp: 240, chest: {} },
    done: 'Le temple de marbre brille au-dessus des nuages. Les Îles du Ciel sont fières de toi.',
    draw: temple,
  },
  // Les grands projets de la 4e et de la 3e (décision du mainteneur, 8 octobre 2026) : cinq monuments neufs, qui se
  // posent pièce par pièce (GD-10, ./projects.ts).
  {
    id: 'landmark-4e-3',
    biome: 'geography-4e-globalization',
    archipelago: '4e',
    name: 'Le portique des docks',
    description: 'Une grande grue de port sur ses rails, ses quatre jambes d’acier, sa poutre tendue vers la mer et la cabine du grutier, au-dessus d’une pile de conteneurs.',
    islet: { x: 94, y: 650 }, // placé le 08/10/2026 avec les îles agrandies (#390), hors des tracés des liaisons ; décalé à l'est de l'Escale le même jour (relecture du directeur artistique) : vu depuis l'Escale, il n'est plus caché derrière son étiquette ; devant l'Escale, à l'est, depuis une forme par île (GD-12, 09/10/2026 : sa place d'avant est au rang du fond, sur une place future)
    reward: { xp: 210, chest: {} },
    done: 'Le portique des docks est debout. La cabine s’allume : les conteneurs peuvent partir vers toutes les îles.',
    draw: portique,
    litWhenDone: BLOC.calque,
  },
  {
    id: 'landmark-4e-4',
    biome: 'physics-chemistry-4e-signals-circuits',
    archipelago: '4e',
    name: 'La tour des signaux',
    description: 'Un pylône d’acier et de liège, large en bas et fin en haut, dont les bobines envoient des messages d’une île à l’autre.',
    islet: { x: 30, y: 711 }, // placé le 08/10/2026 avec les îles agrandies (#390) : la place libre la plus proche de son île, hors des tracés des liaisons ; neuf cases plus à l'est depuis une forme par île (GD-12, 09/10/2026), à côté de la Vigie au coin du fond
    reward: { xp: 210, chest: {} },
    done: 'La tour des signaux est finie. Ses bobines s’allument : les messages passent d’une île à l’autre.',
    draw: tourSignaux,
    litWhenDone: BLOC.bobine,
  },
  {
    id: 'landmark-3e-3',
    biome: 'physics-chemistry-3e-motion-energy',
    archipelago: '3e',
    name: 'La fusée',
    description: 'Une fusée de marbre sur son pas de tir, avec ses ailerons, son second étage à hublots et sa coiffe pointée vers le ciel.',
    islet: { x: 146, y: 1023 }, // placé le 08/10/2026 avec les îles agrandies (#390) : la place libre la plus proche de son île, hors des tracés des liaisons ; suit le Tremplin, passé au rang du fond à l'est, depuis une forme par île (GD-12, 09/10/2026) ; deux cases plus au fond quand le Tremplin a reculé d'un pas (relecture du 9 octobre 2026)
    reward: { xp: 240, chest: {} },
    done: 'La fusée est prête sur son pas de tir. Ses hublots s’allument, tournés vers les étoiles.',
    draw: fusee,
    litWhenDone: BLOC.lentille,
  },
  {
    id: 'landmark-3e-4',
    biome: 'geography-3e-france',
    archipelago: '3e',
    name: 'Le château d’eau',
    description: 'Un fût de marbre qui porte une large cuve, coiffée d’un toit et d’une couronne de lanternons.',
    islet: { x: 162, y: 956 }, // placé le 08/10/2026 avec les îles agrandies (#390) : la place libre la plus proche de son île, hors des tracés des liaisons ; neuf cases plus à l'est depuis une forme par île (GD-12, 09/10/2026 : le trèfle du Plateau la couvrait) ; quatre cases plus à l'est avec le Plateau (relecture du 9 octobre 2026)
    reward: { xp: 240, chest: {} },
    done: 'Le château d’eau est plein. Sa couronne de lanternons s’allume au-dessus des nuages.',
    draw: chateauEau,
    litWhenDone: BLOC.prisme,
  },
  {
    id: 'landmark-3e-5',
    biome: 'maths-3e-geometry',
    archipelago: '3e',
    name: 'La colonne des solides',
    description: 'Un cube, un cylindre et un tronc de pyramide posés l’un sur l’autre, et tout en haut une sphère à la ceinture de lumière.',
    islet: { x: 4, y: 923 }, // placé le 08/10/2026 avec les îles agrandies (#390), hors des tracés des liaisons ; décalé de six cases vers le Phare et de quatre vers le sud le même jour (relecture du directeur artistique) : sur la Carte, l'étiquette du Studio des ondes ne le couvre plus ; devant le Belvédère, à côté du temple, depuis une forme par île (GD-12, 09/10/2026 : sa place d'avant est le cœur du Belvédère) ; derrière le temple, entre le Studio et le Belvédère, depuis la relecture du 9 octobre 2026 (devant le Studio, il coupait sa côte dans la vue de l'archipel depuis lui)
    reward: { xp: 240, chest: {} },
    done: 'La colonne des solides est montée. La ceinture de la sphère s’allume tout en haut.',
    draw: colonneSolides,
    litWhenDone: BLOC.lentille,
  },
];

export const MONUMENTS: MonumentDef[] = FICHES.map(({ draw, ...f }) => ({ ...f, zone: 'monument', origin: { x: f.islet.x + 1, y: f.islet.y + 1 }, cells: draw() }));

export function getMonument(id: string): MonumentDef | undefined {
  return MONUMENTS.find((m) => m.id === id);
}

export function monumentsOf(a: ArchipelagoId): MonumentDef[] {
  return MONUMENTS.filter((m) => m.archipelago === a);
}

/** Les blocs que demande un monument, par type. */
export function monumentNeeds(m: MonumentDef): Partial<Record<BlockId, number>> {
  const out: Partial<Record<BlockId, number>> = {};
  for (const c of m.cells) out[c.block] = (out[c.block] ?? 0) + 1;
  return out;
}

export type { BiomeId };

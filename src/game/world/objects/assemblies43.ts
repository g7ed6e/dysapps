// Les petites constructions du 4e et du 3e d'Archipéo faites des pièces communes (piste 3 « hybride » au 4e et au 3e,
// intention du directeur artistique du 12 octobre 2026 ; même méthode qu'au 6e et au 5e, ./assemblies.ts) : chacune pose,
// sur les cases de sa forme (world/fixtures.ts), les pièces qui lui vont, la matière du bloc livré sur la plus grande
// face de l'objet, dans les couleurs mêmes du bloc (règle GD-7). La même dessinée de près et de loin. Code pur, sans
// Three.js.
//
// Étape 1 : la veilleuse d'Olive (sa vitre allumée la nuit, sans flamme ni halo). Étape 2 : les petites constructions que
// les pièces communes et les modèles du 6e et du 5e couvrent (la machine d'Ixe, le perchoir de Cléa, la banquette de
// Plume, le pupitre du souffleur de Puck, l'auvent de Vapeur, le réverbère de Typo, le treuil de Fret, la jardinière de
// Nectar, l'estrade de Radar, le moteur de Manivelle, le panneau de Loquet ; l'équerre de Théo, le réflecteur de Fi, le
// banc d'Astra, la fontaine de Knight, le pupitre de Mémo, la boîte à livres de Jalon, le pupitre de Brio, le portique
// de Virage). Étape 3 : le wagonnet de Braise, le mât de Stat, le haut-parleur d'Écho et le carillon de Navette, faits des
// formes nouvelles (./silhouettes43.ts).
import { BLOC, type BlockId } from '../../biomes';
import type { Faces } from '../palette';
import { darker, type Workshop } from './workshop';
import { crate, fencePost, lectern, milestone, OBJECT_COLORS as C, type Paint, postLantern, stoneStep } from './pieces';
import { benchOnPosts } from './assemblies';
import { gear } from './heartDecor';
import type { ObjectDrawing } from './silhouettes';

/** Les mesures de la veilleuse d'Olive : le pied de cire, son fût, le savon posé à côté. */
const NIGHT_LIGHT = { foot: { side: 0.8, upper: 0.3 }, shaft: 0.5, soap: { x: 1.5, lx: 0.62, ly: 0.5, upper: 0.36 } } as const;

/**
 * La veilleuse d'Olive (le poteau-lanterne de Grimoire, en cire) : un pied carré et un fût de cire livrée jusqu'à la tête
 * de lanterne des cours, son toit dans les rives du 3e (le rôle `lanternRoof`) ; sa vitre pleine et unie, allumée la nuit
 * comme toutes les lanternes, sans flamme dessinée ni halo (« sans flamme », SC-3) ; le savon posé à son pied.
 */
const nightLight: ObjectDrawing = (at, pe) => {
  const wax = pe.block(BLOC.cire);
  const { foot, shaft, soap } = NIGHT_LIGHT;
  at.block(0.5, 0.5, foot.side, foot.side, 0, foot.upper, wax);
  at.block(0.5, 0.5, shaft, shaft, foot.upper, 2, wax, { bottom: true, top: true });
  postLantern(at, pe, 0, 0, null, 2);
  at.block(soap.x, 0.5, soap.lx, soap.ly, 0, soap.upper, pe.block(BLOC.savon));
};

/** Le pied de pierre des cours (dalle claire dessus, pierre sur les côtés). */
const stoneFaces = (pe: Paint): Faces => ({ dessus: pe.role('yardSlab'), cote: pe.role('yardStone') });

// ---------- Le 4e ----------

/**
 * La machine d'Ixe : la colonne d'engrenage livré (ses quatre grandes faces) et ses deux roues dentées couchées, à deux
 * hauteurs, décalées d'une demi-dent ; de chaque côté, un poteau de barrière des cours et son panneau de calque.
 */
const machine: ObjectDrawing = (at, pe) => {
  const cog = pe.block(BLOC.engrenage);
  const tracing = pe.apart('calque');
  for (const x of [0, 2]) {
    fencePost(at, pe, x, 0, 0);
    at.box(x + 0.1, x + 0.9, 0.36, 0.64, 0.86, 1.9, tracing, { bottom: true });
  }
  at.block(1.5, 0.5, 0.34, 0.34, 0, 2, cog, { bottom: true, top: false });
  gear(at, 1.5, 0.5, 0.46, 0.22, 10, cog, 0, 0.5);
  gear(at, 1.5, 0.5, 0.4, 0.22, 8, cog, Math.PI / 8, 1.45);
};

/**
 * Le perchoir de Cléa : trois marches de une, deux et trois cases (l'escalier de Grimoire), chacune un bloc d'acier
 * livré (ses grandes faces) sur sa colonne de pierre des cours.
 */
const perch: ObjectDrawing = (at, pe) => {
  const steel = pe.block(BLOC.acier);
  for (let k = 0; k < 3; k++) {
    const [x0, x1] = [k + 0.03, k + 0.97];
    if (k > 0) at.box(x0, x1, 0.06, 0.94, 0, k, stoneFaces(pe), { bottom: true, top: true });
    at.box(x0, x1, 0.06, 0.94, k, k + 0.86, steel, { bottom: true });
  }
};

/**
 * La banquette de Plume : l'assise de velours livré (son grand dessus et sa face), ses deux accoudoirs de velours, le
 * dossier de planches (les portes de sa forme) et son chaperon.
 */
const settee: ObjectDrawing = (at, pe) => {
  const velvet = pe.block(BLOC.velours);
  const door = pe.material('porte');
  crate(at, 0.04, 1.96, 0.06, 0.94, 0, 0.62, velvet, darker(velvet));
  for (const x of [0.14, 1.86]) at.block(x, 0.6, 0.2, 1.04, 0.62, 0.9, velvet);
  at.box(0.04, 1.96, 1.12, 1.5, 0, 1.78, door);
  at.box(0, 2, 1.06, 1.56, 1.78, 1.9, { dessus: door.dessus, cote: door.dessus }, {});
};

/**
 * Le pupitre du souffleur de Puck : le poteau de barrière, la colonne de velours, la tablette de parchemin livré en
 * pente le long de ses trois cases (son grand dessus).
 */
const prompterDesk: ObjectDrawing = (at, pe) => {
  fencePost(at, pe, 0, 1, 0);
  at.block(0.5, 1.5, 0.4, 0.4, 0.86, 2, pe.block(BLOC.velours), { bottom: true, top: true });
  at.ramp(0.06, 0.94, 0.04, 2.96, 2, 2.14, 2.44, pe.block(BLOC.parchemin));
};

/**
 * Deux poteaux (l'auvent de Vapeur, le panneau de Loquet) : en x = 0,5 et 2,5, le pied de pierre des cours, le poteau
 * de barrière jusqu'à `zPost`, puis le haut dans `upper` jusqu'à `zTop` (s'il est plus haut).
 */
function twoPosts(at: Workshop, pe: Paint, zPost: number, upper: Faces | null, zTop: number): void {
  for (const x of [0.5, 2.5]) {
    at.block(x, 0.5, 0.4, 0.4, 0, 0.16, stoneFaces(pe));
    at.block(x, 0.5, 0.22, 0.22, 0.16, zPost, pe.role('yardPost'), { bottom: true, top: upper !== null });
    if (upper) at.block(x, 0.5, 0.3, 0.3, zPost, zTop, upper, { bottom: true });
  }
}

/** L'auvent de Vapeur : deux poteaux, leur haut de rail, le toit de calque livré à deux pans (ses grands pans). */
const awning: ObjectDrawing = (at, pe) => {
  twoPosts(at, pe, 1, pe.block(BLOC.rail), 2.05);
  at.roof(0, 3, 0.02, 0.98, 1.95, 2.45, 'x', 0.1, pe.block(BLOC.calque));
};

/**
 * Le réverbère de Typo : le poteau de barrière, le socle et le pilier d'ardoise livrée (ses grandes faces), la tête de
 * lanterne des cours (ses vitres allumées la nuit), la borne d'ardoise à son pied.
 */
const streetLamp: ObjectDrawing = (at, pe) => {
  const slate = pe.block(BLOC.ardoise);
  fencePost(at, pe, 0, 0, 0);
  at.block(1.5, 0.5, 0.62, 0.62, 0, 0.4, slate);
  at.block(1.5, 0.5, 0.36, 0.36, 0.4, 2, slate, { bottom: true });
  postLantern(at, pe, 1, 0, null, 2);
  milestone(at, pe, 2, 0, 0, 0.92, slate);
};

/**
 * Un portique de deux piliers de la matière livrée (`pillar` : leurs grandes faces), sur leur pied de pierre, coiffés ;
 * ce qui passe entre eux (`between`), à mi-hauteur (le treuil de Fret, le portique de Virage).
 */
const gantryOf =
  (pillar: BlockId, between: (at: Workshop, pe: Paint) => void): ObjectDrawing =>
  (at, pe) => {
    const body = pe.block(pillar);
    for (const x of [0.5, 2.5]) {
      at.block(x, 0.5, 0.72, 0.72, 0, 0.16, stoneFaces(pe));
      at.block(x, 0.5, 0.5, 0.5, 0.16, 1.9, body, { bottom: true, top: true });
      at.block(x, 0.5, 0.62, 0.62, 1.9, 2, body);
    }
    between(at, pe);
  };

/** Le treuil de Fret : le portique de fonte livrée, l'axe de fer et le tambour de bois, ses deux joues. */
const winch = gantryOf(BLOC.fonte, (at, pe) => {
  const wood = pe.role('yardPost');
  at.roller('x', 0.75, 2.25, 0.5, 1.5, 0.06, 6, pe.color(C.iron));
  at.roller('x', 1.1, 1.9, 0.5, 1.5, 0.28, 8, wood);
  for (const [x, toward] of [
    [1.1, 'nx'],
    [1.9, 'px'],
  ] as const)
    at.standingDisc([x, 0.5, 1.5], toward, 0.34, 8, pe.role('yardRail'), Math.PI / 8);
});

/**
 * La jardinière de Nectar : le bac de liège livré (ses grandes faces), son rebord, la terre à plat, trois pousses, un
 * poteau de barrière des cours sur chaque bout.
 */
const planter: ObjectDrawing = (at, pe) => {
  const cork = pe.block(BLOC.liege);
  const h = 0.74;
  rimmedTrough(at, 0.05, 2.95, 0.1, 0.9, h, 0.1, cork, pe.material('terre').dessus);
  const leaf = pe.color(C.leaf);
  for (const x of [1.15, 1.5, 1.85]) at.pyramid(x, 0.5, 0.1, 0.1, h - 0.04, h + 0.22, leaf);
  for (const x of [0, 2]) fencePost(at, pe, x, 0, h);
};

/**
 * Un bac de (x0, y0) à (x1, y1), haut de `h` : ses quatre flancs dans sa matière, son rebord large de `r` (le dessus de
 * la matière), le fond à plat dans `inside`, un peu sous le rebord. 18 triangles.
 */
function rimmedTrough(at: Workshop, x0: number, x1: number, y0: number, y1: number, h: number, r: number, body: Faces, inside: number): void {
  at.box(x0, x1, y0, y1, 0, h, body, { bottom: true, top: true });
  const c: [number, number, number] = [(x0 + x1) / 2, (y0 + y1) / 2, h - 1];
  at.quad([x0, y0, h], [x1, y0, h], [x1 - r, y0 + r, h], [x0 + r, y0 + r, h], c, body.dessus);
  at.quad([x1, y0, h], [x1, y1, h], [x1 - r, y1 - r, h], [x1 - r, y0 + r, h], c, body.dessus);
  at.quad([x1, y1, h], [x0, y1, h], [x0 + r, y1 - r, h], [x1 - r, y1 - r, h], c, body.dessus);
  at.quad([x0, y1, h], [x0, y0, h], [x0 + r, y0 + r, h], [x0 + r, y1 - r, h], c, body.dessus);
  const z = h - 0.04;
  at.quad([x0 + r, y0 + r, z], [x1 - r, y0 + r, z], [x1 - r, y1 - r, z], [x0 + r, y1 - r, z], c, inside);
}

/**
 * L'estrade de Radar : le plateau de conteneur livré sur ses deux rangs (son grand dessus et ses faces), quatre nervures
 * sombres devant, la marche de pierre des cours.
 */
const stage: ObjectDrawing = (at, pe) => {
  const box = pe.block(BLOC.conteneur);
  crate(at, 0.05, 1.95, 1.05, 2.95, 0, 0.92, box, darker(box, 0.8));
  const rib = darker(box, 0.72).cote;
  for (const x of [0.42, 0.81, 1.19, 1.58]) at.quad([x - 0.03, 1.046, 0.04], [x + 0.03, 1.046, 0.04], [x + 0.03, 1.046, 0.76], [x - 0.03, 1.046, 0.76], [x, 2, 0.4], rib);
  stoneStep(at, pe, 0.08, 0.92, 0.1, 1, 0, 0.46);
};

/** Une bobine couchée le long de y, centrée en (cx, z) : le rouleau de bobine livrée (sa grande face), ses deux joues de fer. */
function spool(at: Workshop, pe: Paint, cx: number, z: number, r: number): void {
  at.roller('y', 0.15, 0.85, cx, z, r, 8, pe.block(BLOC.bobine));
  const iron = pe.color(C.iron);
  at.standingDisc([cx, 0.15, z], 'ny', r + 0.06, 8, iron, Math.PI / 8);
  at.standingDisc([cx, 0.85, z], 'py', r + 0.06, 8, iron, Math.PI / 8);
}

/** Le moteur de Manivelle : deux bobines au sol aux bouts, la troisième au milieu sur un poteau de barrière des cours. */
const motor: ObjectDrawing = (at, pe) => {
  for (const x of [0.5, 2.5]) spool(at, pe, x, 0.42, 0.34);
  fencePost(at, pe, 1, 0, 0);
  spool(at, pe, 1.5, 1.3, 0.3);
};

/**
 * Le panneau de Loquet : deux poteaux de barrière jusqu'au chaperon, le panneau de pétale livré entre eux (ses deux
 * grandes faces), le chaperon de bois, le petit toit au-dessus de son milieu dans la couverture de l'île. Rien d'écrit.
 */
const noticeBoard: ObjectDrawing = (at, pe) => {
  twoPosts(at, pe, 1.98, null, 1.98);
  at.box(0.12, 2.88, 0.36, 0.64, 0.95, 1.9, pe.block(BLOC.petale), { bottom: false });
  at.box(0.06, 2.94, 0.3, 0.7, 1.9, 1.98, pe.role('yardPost'), {});
  at.roof(0.6, 2.4, 0.1, 0.9, 1.98, 2.5, 'x', 0.08, pe.roof());
};

// ---------- Le 3e ----------

/** L'équerre de Théo : la branche debout de prisme livré (ses grandes faces), la branche couchée de planches (les portes de sa forme). */
const setSquare: ObjectDrawing = (at, pe) => {
  at.box(0.12, 0.88, 0.26, 0.74, 0, 2.92, pe.block(BLOC.prisme));
  at.box(0.88, 2.94, 0.3, 0.7, 0, 0.56, pe.material('porte'));
};

/**
 * Le réflecteur de Fi : le socle de prisme et sa tablette, le miroir livré debout (ses deux grandes faces), dans son
 * cadre de prisme (deux montants et le linteau).
 */
const reflector: ObjectDrawing = (at, pe) => {
  const prism = pe.block(BLOC.prisme);
  at.box(0.04, 1.96, 0.12, 0.88, 0, 0.9, prism, { bottom: true, top: true });
  at.box(0, 2, 0.08, 0.92, 0.9, 1, prism, {});
  at.box(0.2, 1.8, 0.36, 0.64, 1, 2, pe.block(BLOC.miroir), { bottom: true, top: true });
  for (const x of [0.12, 1.88]) at.block(x, 0.5, 0.16, 0.4, 1, 2, prism, { bottom: true, top: true });
  at.box(0, 2, 0.3, 0.7, 2, 2.4, prism, {});
};

/** Le banc d'Astra (l'établi de Pince) : le plateau épais de pierre de taille livrée sur ses deux pieds de barrière. */
const bench: ObjectDrawing = (at, pe) => benchOnPosts(at, pe, pe.block(BLOC.taille), 1.5, 0.5);

/**
 * La fontaine de Knight, sans eau : le muret en U de bois des barrières (ouvert devant), son fond de dalle, la borne de
 * marbre livré au milieu (ses grandes faces).
 */
const fountain: ObjectDrawing = (at, pe) => {
  const wall: Faces = { dessus: pe.role('yardRail'), cote: pe.role('yardPost') };
  at.box(0.06, 0.36, 0.06, 1.94, 0, 0.7, wall);
  at.box(2.64, 2.94, 0.06, 1.94, 0, 0.7, wall);
  at.box(0.36, 2.64, 1.64, 1.94, 0, 0.7, wall, { bottom: true, px: true, nx: true });
  at.box(0.36, 2.64, 0.06, 1.64, 0, 0.12, stoneFaces(pe), { bottom: true, px: true, nx: true, py: true });
  milestone(at, pe, 1, 0, 0.12, 1.9, pe.block(BLOC.marbre));
};

/**
 * Le pupitre de Mémo : le pied de quartz livré (sa grande face devant), le pupitre de quartz en pente et son livre, la
 * marche de pierre des cours devant, la lanterne sur poteau à côté (ses vitres allumées la nuit).
 */
const memoDesk: ObjectDrawing = (at, pe) => {
  const quartz = pe.block(BLOC.quartz);
  at.box(0.05, 1.95, 1.08, 1.92, 0, 0.9, quartz);
  lectern(at, pe, 1.08, 1.92, 1.1, 1.9, 0.9, quartz);
  stoneStep(at, pe, 1.06, 1.94, 0.1, 1, 0, 0.42);
  postLantern(at, pe, 0, 0, 0, 0.3);
};

/**
 * La boîte à livres de Jalon : trois caisses de reliure livrée en rang (leurs grandes faces), la planche posée dessus,
 * la tête de lanterne des cours sur celle du milieu (ses vitres allumées la nuit).
 */
const bookBox: ObjectDrawing = (at, pe) => {
  const binding = pe.block(BLOC.reliure);
  for (let k = 0; k < 3; k++) crate(at, 0.08, 0.92, k + 0.06, k + 0.94, 0, 0.76, binding, darker(binding));
  at.box(0.04, 0.96, 0.04, 2.96, 0.76, 0.86, pe.color(C.lightWood), {});
  postLantern(at, pe, 0, 1, null, 0.86);
};

/**
 * Le pupitre de Brio : le pied de pierre des cours, le fût de bois et ses deux jambes de force, le plateau de savon
 * livré (son grand dessus et sa face). Aucun emblème.
 */
const pulpit: ObjectDrawing = (at, pe) => {
  const wood = pe.role('yardPost');
  at.prism(1.5, 0.5, 0.42, 0.34, 0, 0.2, 6, stoneFaces(pe));
  at.block(1.5, 0.5, 0.3, 0.3, 0.2, 2, wood, { bottom: true, top: true });
  for (const x of [0.62, 2.38]) at.beam([1.5, 0.5, 1.3], [x, 0.5, 1.98], 0.1, wood);
  at.box(0.04, 2.96, 0.1, 0.9, 2, 2.36, pe.block(BLOC.savon), {});
};

/** Le portique de Virage : le portique de grès rose livré, deux barres de bois en travers. */
const portico = gantryOf(BLOC.gres, (at, pe) => {
  const rail = pe.role('yardRail');
  for (const z of [1.3, 1.7]) at.box(0.75, 2.25, 0.42, 0.58, z, z + 0.12, rail, { bottom: false, px: true, nx: true });
});

/** Les petites constructions du 4e et du 3e faites de pièces communes, par identifiant (world/fixtures.ts). */
export const ASSEMBLIES_43: Readonly<Record<string, ObjectDrawing>> = {
  'maths-4e-algebra-fixture-1': machine,
  'french-4e-agreement-fixture-1': perch,
  'french-4e-vocabulary-fixture-1': settee,
  'english-4e-comprehension-fixture-1': prompterDesk,
  'english-4e-grammar-fixture-1': awning,
  'history-4e-revolutions-fixture-1': streetLamp,
  'geography-4e-globalization-fixture-1': winch,
  'life-earth-sciences-4e-cells-evolution-fixture-1': planter,
  'physics-chemistry-4e-signals-circuits-fixture-1': stage,
  'technology-4e-modeling-fixture-1': motor,
  'civics-4e-rights-freedoms-fixture-1': noticeBoard,
  // Le 3e.
  'maths-3e-geometry-fixture-1': setSquare,
  'maths-3e-functions-fixture-1': reflector,
  'french-3e-close-reading-fixture-1': bench,
  'english-3e-grammar-fixture-1': fountain,
  'history-3e-twentieth-century-fixture-1': memoDesk,
  'geography-3e-france-fixture-1': bookBox,
  'civics-3e-democratic-life-fixture-1': pulpit,
  'life-earth-sciences-3e-human-body-fixture-1': nightLight,
  'physics-chemistry-3e-motion-energy-fixture-1': portico,
};

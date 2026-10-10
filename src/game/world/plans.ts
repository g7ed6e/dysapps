// Les plans du village : un bâtiment par île, en trois plans (les murs, le toit, la cour), que les missions de l'île posent
// partie par partie (GD-6, parts.ts). Chaque plan a sa fiche JSON (nom, phrase de fin, XP) ; son dessin vient de
// l'architecte (architect.ts).
import { BIOMES, type BiomeId, type BlockId } from '../biomes';
import { buildingStages } from './architect';
import carriereAbri from './plans/french-6e-word-spelling-2.json';
import carriereCour from './plans/french-6e-word-spelling-3.json';
import carriereFour from './plans/french-6e-word-spelling-1.json';
import fermeEnclos from './plans/french-6e-grammar-spelling-3.json';
import fermeEtable from './plans/french-6e-grammar-spelling-1.json';
import fermeToit from './plans/french-6e-grammar-spelling-2.json';
import foretCabane from './plans/french-6e-phonology-1.json';
import foretCour from './plans/french-6e-phonology-3.json';
import foretToit from './plans/french-6e-phonology-2.json';
import mineCour from './plans/french-6e-letter-confusion-3.json';
import mineForge from './plans/french-6e-letter-confusion-1.json';
import mineToit from './plans/french-6e-letter-confusion-2.json';
import plaineCour from './plans/maths-6e-calculation-3.json';
import plaineNid from './plans/maths-6e-calculation-1.json';
import plaineToit from './plans/maths-6e-calculation-2.json';
import riviereHutte from './plans/maths-6e-fractions-1.json';
import rivierePonton from './plans/maths-6e-fractions-3.json';
import riviereToit from './plans/maths-6e-fractions-2.json';
import volcanAbri from './plans/maths-6e-decimals-1.json';
import volcanTerrasse from './plans/maths-6e-decimals-3.json';
import volcanToit from './plans/maths-6e-decimals-2.json';
import glacierIgloo from './plans/maths-5e-signed-numbers-1.json';
import glacierToit from './plans/maths-5e-signed-numbers-2.json';
import glacierPatinoire from './plans/maths-5e-signed-numbers-3.json';
import marcheEchoppe from './plans/maths-5e-proportionality-1.json';
import marcheToit from './plans/maths-5e-proportionality-2.json';
import marcheEtal from './plans/maths-5e-proportionality-3.json';
import tourLanterne from './plans/french-6e-reading-2.json';
import tourPhare from './plans/french-6e-reading-1.json';
import tourQuai from './plans/french-6e-reading-3.json';
import carrefourCabane from './plans/french-5e-homophones-1.json';
import carrefourToit from './plans/french-5e-homophones-2.json';
import carrefourRondpoint from './plans/french-5e-homophones-3.json';
import maraisHutte from './plans/french-5e-conjugation-1.json';
import maraisToit from './plans/french-5e-conjugation-2.json';
import maraisPonton from './plans/french-5e-conjugation-3.json';
import forgeAtelier from './plans/maths-4e-powers-1.json';
import forgeToit from './plans/maths-4e-powers-2.json';
import forgeCour from './plans/maths-4e-powers-3.json';
import atelierBureau from './plans/maths-4e-algebra-1.json';
import atelierToit from './plans/maths-4e-algebra-2.json';
import atelierTerrasse from './plans/maths-4e-algebra-3.json';
import falaiseBergerie from './plans/french-4e-agreement-1.json';
import falaiseToit from './plans/french-4e-agreement-2.json';
import falaiseEnclos from './plans/french-4e-agreement-3.json';
import cabinetNid from './plans/french-4e-vocabulary-1.json';
import cabinetToit from './plans/french-4e-vocabulary-2.json';
import cabinetPerchoir from './plans/french-4e-vocabulary-3.json';
import belvedereKiosque from './plans/maths-3e-geometry-1.json';
import belvedereToit from './plans/maths-3e-geometry-2.json';
import belvedereTerrasse from './plans/maths-3e-geometry-3.json';
import donneesDome from './plans/maths-3e-statistics-1.json';
import donneesToit from './plans/maths-3e-statistics-2.json';
import donneesTerrasse from './plans/maths-3e-statistics-3.json';
import phareLanterne from './plans/maths-3e-functions-1.json';
import phareToit from './plans/maths-3e-functions-2.json';
import phareJetee from './plans/maths-3e-functions-3.json';
import textesLanterne from './plans/french-3e-close-reading-1.json';
import textesToit from './plans/french-3e-close-reading-2.json';
import textesCoupole from './plans/french-3e-close-reading-3.json';
import baieCabine from './plans/english-6e-vocabulary-1.json';
import baieToit from './plans/english-6e-vocabulary-2.json';
import baieQuai from './plans/english-6e-vocabulary-3.json';
import horlogeTour from './plans/english-6e-grammar-1.json';
import horlogeToit from './plans/english-6e-grammar-2.json';
import horlogeCour from './plans/english-6e-grammar-3.json';
import comptoirBoutique from './plans/english-5e-vocabulary-1.json';
import comptoirToit from './plans/english-5e-vocabulary-2.json';
import comptoirTerrasse from './plans/english-5e-vocabulary-3.json';
import manoirSalon from './plans/english-5e-grammar-1.json';
import manoirToit from './plans/english-5e-grammar-2.json';
import manoirJardin from './plans/english-5e-grammar-3.json';
import relaisAuberge from './plans/lv2-5e-introductions-1.json';
import relaisEcurie from './plans/lv2-5e-introductions-2.json';
import relaisFontaine from './plans/lv2-5e-introductions-3.json';
import jardinCuisine from './plans/lv2-4e-daily-life-1.json';
import jardinTonnelle from './plans/lv2-4e-daily-life-2.json';
import jardinSerre from './plans/lv2-4e-daily-life-3.json';
import theatreLoge from './plans/english-4e-comprehension-1.json';
import theatreToit from './plans/english-4e-comprehension-2.json';
import theatreScene from './plans/english-4e-comprehension-3.json';
import gareAbri from './plans/english-4e-grammar-1.json';
import gareToit from './plans/english-4e-grammar-2.json';
import gareQuai from './plans/english-4e-grammar-3.json';
import studioRegie from './plans/english-3e-comprehension-1.json';
import studioToit from './plans/english-3e-comprehension-2.json';
import studioTerrasse from './plans/english-3e-comprehension-3.json';
import chateauTour from './plans/english-3e-grammar-1.json';
import chateauToit from './plans/english-3e-grammar-2.json';
import chateauRempart from './plans/english-3e-grammar-3.json';
import refugePoste from './plans/lv2-3e-travel-1.json';
import refugeSalle from './plans/lv2-3e-travel-2.json';
import refugePigeonnier from './plans/lv2-3e-travel-3.json';
import fouilleMusee from './plans/history-6e-antiquity-1.json';
import fouilleToit from './plans/history-6e-antiquity-2.json';
import fouilleCour from './plans/history-6e-antiquity-3.json';
import pointeQuartier from './plans/geography-6e-living-1.json';
import pointeChamps from './plans/geography-6e-living-2.json';
import pointeQuai from './plans/geography-6e-living-3.json';
import bourgLogis from './plans/history-5e-middle-ages-1.json';
import bourgToit from './plans/history-5e-middle-ages-2.json';
import bourgCour from './plans/history-5e-middle-ages-3.json';
import deltaMoulin from './plans/geography-5e-resources-1.json';
import deltaToit from './plans/geography-5e-resources-2.json';
import deltaCour from './plans/geography-5e-resources-3.json';
import imprimerieHalle from './plans/history-4e-revolutions-1.json';
import imprimerieToit from './plans/history-4e-revolutions-2.json';
import imprimerieCour from './plans/history-4e-revolutions-3.json';
import escaleEntrepot from './plans/geography-4e-globalization-1.json';
import escaleToit from './plans/geography-4e-globalization-2.json';
import escaleCour from './plans/geography-4e-globalization-3.json';
import kiosqueBibliotheque from './plans/history-3e-twentieth-century-1.json';
import kiosqueToit from './plans/history-3e-twentieth-century-2.json';
import kiosqueCour from './plans/history-3e-twentieth-century-3.json';
import territoiresMairie from './plans/geography-3e-france-1.json';
import territoiresToit from './plans/geography-3e-france-2.json';
import territoiresPlace from './plans/geography-3e-france-3.json';
import valleeSerre from './plans/life-earth-sciences-6e-living-world-1.json';
import valleeToit from './plans/life-earth-sciences-6e-living-world-2.json';
import valleeJardin from './plans/life-earth-sciences-6e-living-world-3.json';
import laboratoireSalle from './plans/physics-chemistry-6e-matter-energy-1.json';
import laboratoireToit from './plans/physics-chemistry-6e-matter-energy-2.json';
import laboratoireCour from './plans/physics-chemistry-6e-matter-energy-3.json';
import hangarAtelier from './plans/technology-6e-objects-1.json';
import hangarToit from './plans/technology-6e-objects-2.json';
import hangarCour from './plans/technology-6e-objects-3.json';
import preauPreau from './plans/civics-6e-democratic-society-1.json';
import preauToit from './plans/civics-6e-democratic-society-2.json';
import preauCour from './plans/civics-6e-democratic-society-3.json';
import fournilFournil from './plans/civics-5e-equality-solidarity-1.json';
import fournilToit from './plans/civics-5e-equality-solidarity-2.json';
import fournilCour from './plans/civics-5e-equality-solidarity-3.json';
import grotteAbri from './plans/lca-5e-legends-1.json';
import grottePorche from './plans/lca-5e-legends-2.json';
import grotteCercle from './plans/lca-5e-legends-3.json';
import porteLoge from './plans/civics-4e-rights-freedoms-1.json';
import porteToit from './plans/civics-4e-rights-freedoms-2.json';
import portePlace from './plans/civics-4e-rights-freedoms-3.json';
import colonnadeMaison from './plans/lca-4e-cities-1.json';
import colonnadeColonnade from './plans/lca-4e-cities-2.json';
import colonnadeFontaine from './plans/lca-4e-cities-3.json';
import forumTribune from './plans/civics-3e-democratic-life-1.json';
import forumToit from './plans/civics-3e-democratic-life-2.json';
import forumParvis from './plans/civics-3e-democratic-life-3.json';
import bosquetBibliotheque from './plans/lca-3e-ideas-1.json';
import bosquetGradins from './plans/lca-3e-ideas-2.json';
import bosquetAllee from './plans/lca-3e-ideas-3.json';
import prairiePlan1 from './plans/life-earth-sciences-5e-active-planet-1.json';
import prairiePlan2 from './plans/life-earth-sciences-5e-active-planet-2.json';
import prairiePlan3 from './plans/life-earth-sciences-5e-active-planet-3.json';
import salinePlan1 from './plans/physics-chemistry-5e-matter-universe-1.json';
import salinePlan2 from './plans/physics-chemistry-5e-matter-universe-2.json';
import salinePlan3 from './plans/physics-chemistry-5e-matter-universe-3.json';
import menuiseriePlan1 from './plans/technology-5e-design-1.json';
import menuiseriePlan2 from './plans/technology-5e-design-2.json';
import menuiseriePlan3 from './plans/technology-5e-design-3.json';
import sourcePlan1 from './plans/life-earth-sciences-4e-cells-evolution-1.json';
import sourcePlan2 from './plans/life-earth-sciences-4e-cells-evolution-2.json';
import sourcePlan3 from './plans/life-earth-sciences-4e-cells-evolution-3.json';
import vigiePlan1 from './plans/physics-chemistry-4e-signals-circuits-1.json';
import vigiePlan2 from './plans/physics-chemistry-4e-signals-circuits-2.json';
import vigiePlan3 from './plans/physics-chemistry-4e-signals-circuits-3.json';
import bassinPlan1 from './plans/technology-4e-modeling-1.json';
import bassinPlan2 from './plans/technology-4e-modeling-2.json';
import bassinPlan3 from './plans/technology-4e-modeling-3.json';
import vergerPlan1 from './plans/life-earth-sciences-3e-human-body-1.json';
import vergerPlan2 from './plans/life-earth-sciences-3e-human-body-2.json';
import vergerPlan3 from './plans/life-earth-sciences-3e-human-body-3.json';
import tremplinPlan1 from './plans/physics-chemistry-3e-motion-energy-1.json';
import tremplinPlan2 from './plans/physics-chemistry-3e-motion-energy-2.json';
import tremplinPlan3 from './plans/physics-chemistry-3e-motion-energy-3.json';
import ruchePlan1 from './plans/technology-3e-digital-1.json';
import ruchePlan2 from './plans/technology-3e-digital-2.json';
import ruchePlan3 from './plans/technology-3e-digital-3.json';

export interface PlanCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
  /**
   * Le bloc de la case dans le rendu Archipéo, quand il n'est pas `block` (world/architect.ts : le toit de terre cuite de
   * la maison basse du quartier, de chaume dans Blocland). Seule la construction d'Archipéo le lit
   * (world/construction/buildings.ts) ; le jeu, les sauvegardes et Blocland ne connaissent que `block`.
   */
  archipeo?: BlockId;
}

export interface PlanDef {
  id: string;
  biome: BiomeId;
  name: string;
  /** Coin du bâtiment dans la zone des plans de l'île. */
  origin: { x: number; y: number };
  cells: PlanCell[];
  /**
   * Ce que le plan donne quand il est terminé : son XP, et un coffre de blocs. Le coffre des plans d'île est vide (GD-6) :
   * seules les étapes du Bloc-Navire en ont un.
   */
  reward: { xp: number; chest: Partial<Record<BlockId, number>> };
  /** Ce que dit la créature quand le plan est terminé. */
  done: string;
  /**
   * Où le plan se pose : dans la zone des plans de l'île (par défaut), sur le quai du port (le Bloc-Navire), ou sur l'îlot
   * d'un monument (`origin` est alors le coin du monument dans le monde), ou entre deux lieux réunis (GD-9, ./join.ts :
   * ses clés sont dans le repère de la paire).
   */
  zone?: 'plans' | 'port' | 'monument' | 'join';
}

/**
 * Zone des plans de chaque île (coordonnées relatives à l'île) : plate, sans décor. Son coin (x, y) est l'origine des
 * plans, donc des clés de sauvegarde (`planCells`) : il ne bouge jamais. Sa taille se lit par île (`zoneDesPlans`).
 */
export const PLAN_ZONE = { x: 8, y: 10, w: 6, h: 5 };

/**
 * La zone des plans des quatre îles-écoles (cœur de 20, `COTE_DU_COEUR`) : une rangée de plus vers le fond, 6 × 6 au
 * lieu de 6 × 5, même coin (redistribution « Trois bandes », choix du mainteneur, 02/10/2026). Agrandie vers +y
 * seulement : aucune clé de sauvegarde ne change.
 */
const ZONE_DES_ILES_ECOLES = Object.freeze({ ...PLAN_ZONE, h: 6 });
export const ZONES_AGRANDIES: Readonly<Partial<Record<BiomeId, Readonly<typeof PLAN_ZONE>>>> = Object.freeze({
  'french-6e-phonology': ZONE_DES_ILES_ECOLES,
  'maths-5e-proportionality': ZONE_DES_ILES_ECOLES,
  'maths-4e-algebra': ZONE_DES_ILES_ECOLES,
  'maths-3e-functions': ZONE_DES_ILES_ECOLES,
});

/** La zone des plans d'une île : `PLAN_ZONE`, ou plus profonde sur une île-école (`ZONES_AGRANDIES`). */
export function zoneDesPlans(id: BiomeId): Readonly<typeof PLAN_ZONE> {
  return ZONES_AGRANDIES[id] ?? PLAN_ZONE;
}

const SANS_DECALAGE = Object.freeze({ x: 0, y: 0, z: 0 });
/**
 * Au Marché et à l'Atelier, les plans se dessinent une rangée plus au fond (y 11 à 15 de la zone de 6 × 6) : vu de leur
 * caméra, le toit de l'école cachait le rang avant de la zone. La rangée y = 10 reste une allée nue (décision du
 * directeur artistique, 02/10/2026). Décalage de rendu seulement, sur le modèle de `decalageDuQuai` : les clés de
 * sauvegarde (`planCells`, depuis `PLAN_ZONE`) ne changent pas.
 */
export const PLANS_AU_FOND: Readonly<Partial<Record<BiomeId, Readonly<{ x: number; y: number; z: number }>>>> = Object.freeze({
  'maths-5e-proportionality': Object.freeze({ x: 0, y: 1, z: 0 }),
  'maths-4e-algebra': Object.freeze({ x: 0, y: 1, z: 0 }),
});

/**
 * Ce qui sépare la clé d'une case d'un plan de la zone des plans (`planCells`, repère de l'île) de la case où elle est
 * dessinée, pointée et posée : (0, 0, 0) partout, sauf au Marché et à l'Atelier (`PLANS_AU_FOND`). Les plans du port
 * et des monuments ont leur propre ancre (`ancreDuQuai`, `monumentAnchor`).
 */
export function decalageDesPlans(plan: Pick<PlanDef, 'biome' | 'zone'>): Readonly<{ x: number; y: number; z: number }> {
  if (plan.zone === 'port' || plan.zone === 'monument' || plan.zone === 'join') return SANS_DECALAGE;
  return PLANS_AU_FOND[plan.biome] ?? SANS_DECALAGE;
}

/** Les fiches des plans (nom, phrase de fin, XP ; produites par `npm run contenu` depuis la section « Les plans » de docs/contenu/<île>.md, dans le même ordre) : dans l'ordre du dessin. */
const PLAN_FILES = [
  foretCabane,
  foretToit,
  foretCour,
  mineForge,
  mineToit,
  mineCour,
  carriereFour,
  carriereAbri,
  carriereCour,
  fermeEtable,
  fermeToit,
  fermeEnclos,
  tourPhare,
  tourLanterne,
  tourQuai,
  plaineNid,
  plaineToit,
  plaineCour,
  riviereHutte,
  riviereToit,
  rivierePonton,
  volcanAbri,
  volcanToit,
  volcanTerrasse,
  glacierIgloo,
  glacierToit,
  glacierPatinoire,
  marcheEchoppe,
  marcheToit,
  marcheEtal,
  carrefourCabane,
  carrefourToit,
  carrefourRondpoint,
  maraisHutte,
  maraisToit,
  maraisPonton,
  forgeAtelier,
  forgeToit,
  forgeCour,
  atelierBureau,
  atelierToit,
  atelierTerrasse,
  falaiseBergerie,
  falaiseToit,
  falaiseEnclos,
  cabinetNid,
  cabinetToit,
  cabinetPerchoir,
  belvedereKiosque,
  belvedereToit,
  belvedereTerrasse,
  donneesDome,
  donneesToit,
  donneesTerrasse,
  phareLanterne,
  phareToit,
  phareJetee,
  textesLanterne,
  textesToit,
  textesCoupole,
  baieCabine,
  baieToit,
  baieQuai,
  horlogeTour,
  horlogeToit,
  horlogeCour,
  comptoirBoutique,
  comptoirToit,
  comptoirTerrasse,
  manoirSalon,
  manoirToit,
  manoirJardin,
  relaisAuberge,
  relaisEcurie,
  relaisFontaine,
  theatreLoge,
  theatreToit,
  theatreScene,
  gareAbri,
  gareToit,
  gareQuai,
  jardinCuisine,
  jardinTonnelle,
  jardinSerre,
  studioRegie,
  studioToit,
  studioTerrasse,
  chateauTour,
  chateauToit,
  chateauRempart,
  refugePoste,
  refugeSalle,
  refugePigeonnier,
  fouilleMusee,
  fouilleToit,
  fouilleCour,
  pointeQuartier,
  pointeChamps,
  pointeQuai,
  bourgLogis,
  bourgToit,
  bourgCour,
  deltaMoulin,
  deltaToit,
  deltaCour,
  imprimerieHalle,
  imprimerieToit,
  imprimerieCour,
  escaleEntrepot,
  escaleToit,
  escaleCour,
  kiosqueBibliotheque,
  kiosqueToit,
  kiosqueCour,
  territoiresMairie,
  territoiresToit,
  territoiresPlace,
  valleeSerre,
  valleeToit,
  valleeJardin,
  laboratoireSalle,
  laboratoireToit,
  laboratoireCour,
  hangarAtelier,
  hangarToit,
  hangarCour,
  preauPreau,
  preauToit,
  preauCour,
  fournilFournil,
  fournilToit,
  fournilCour,
  grotteAbri,
  grottePorche,
  grotteCercle,
  porteLoge,
  porteToit,
  portePlace,
  colonnadeMaison,
  colonnadeColonnade,
  colonnadeFontaine,
  forumTribune,
  forumToit,
  forumParvis,
  bosquetBibliotheque,
  bosquetGradins,
  bosquetAllee,
  prairiePlan1,
  prairiePlan2,
  prairiePlan3,
  salinePlan1,
  salinePlan2,
  salinePlan3,
  menuiseriePlan1,
  menuiseriePlan2,
  menuiseriePlan3,
  sourcePlan1,
  sourcePlan2,
  sourcePlan3,
  vigiePlan1,
  vigiePlan2,
  vigiePlan3,
  bassinPlan1,
  bassinPlan2,
  bassinPlan3,
  vergerPlan1,
  vergerPlan2,
  vergerPlan3,
  tremplinPlan1,
  tremplinPlan2,
  tremplinPlan3,
  ruchePlan1,
  ruchePlan2,
  ruchePlan3,
] as (Omit<PlanDef, 'cells' | 'origin' | 'reward'> & { reward: { xp: number } })[];

/**
 * Les plans des îles : la fiche de chaque plan, et son dessin par l'architecte (world/architect.ts) selon la forme du
 * bâtiment de l'île et son rang (les murs, le toit, la cour). Un plan d'île n'a pas de coffre : ses blocs de finition se
 * posent avec sa partie (GD-6).
 */
export const PLANS: PlanDef[] = (() => {
  const out: PlanDef[] = [];
  for (const island of [...new Set(PLAN_FILES.map((p) => p.biome))]) {
    const files = PLAN_FILES.filter((p) => p.biome === island);
    const block = BIOMES.find((b) => b.id === island)!.block;
    const stages = buildingStages(island, block);
    files.forEach((file, i) => {
      out.push({ ...file, origin: { x: 0, y: 0 }, cells: stages[i] ?? [], reward: { xp: file.reward.xp, chest: {} } });
    });
  }
  // L'ordre des fichiers est gardé (îles dans l'ordre de la liste).
  return PLAN_FILES.map((f) => out.find((p) => p.id === f.id)!);
})();

export function plansFor(biome: BiomeId): PlanDef[] {
  return PLANS.filter((p) => p.biome === biome);
}

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/**
 * Cellules d'un plan en coordonnées relatives à l'île (z = 0 : premier bloc sur le sol). Un plan du port (le Bloc-Navire)
 * est relatif au coin du navire sur le quai, devant l'île, plus bas que le sol quand l'île est en altitude.
 */
export function planCells(plan: PlanDef, cells: PlanCell[] = plan.cells): (PlanCell & { key: string })[] {
  const o = planOrigin(plan);
  return cells.map((c) => {
    const x = o.x + c.x;
    const y = o.y + c.y;
    const z = o.z + c.z;
    return { x, y, z, block: c.block, key: cellKey(x, y, z) };
  });
}

/**
 * L'origine figée des chantiers hors de la zone des plans, relative au cœur de leur île (z relatif au sol). Les clés
 * des cases posées sont enregistrées dans les sauvegardes : elles ne dépendent donc ni de la place du quai ni de celle
 * de l'îlot, que la disposition du monde peut changer. Ce sont les valeurs calculées jusqu'ici depuis le quai
 * (world/harbor.ts) et l'îlot de chaque monument (world/monuments.ts) ; plans.test.ts vérifie qu'elles y sont égales.
 */
export const ORIGINE_DU_QUAI: Partial<Record<BiomeId, { x: number; y: number; z: number }>> = {
  'maths-6e-calculation': { x: 15, y: -14, z: -1 },
  'maths-5e-proportionality': { x: 15, y: -12, z: -4 },
  'maths-4e-algebra': { x: 15, y: -14, z: -7 },
};

/** L'origine figée de chaque monument (son plan), relative au cœur de son île : voir `ORIGINE_DU_QUAI`. */
export const ORIGINE_DES_MONUMENTS: Record<string, { x: number; y: number; z: number }> = {
  'landmark-6e-1': { x: 4, y: 23, z: 0 },
  'landmark-6e-2': { x: 1, y: 24, z: 0 },
  'landmark-5e-1': { x: 23, y: 20, z: 0 },
  'landmark-5e-2': { x: -11, y: -12, z: 0 },
  'landmark-4e-1': { x: 16, y: -13, z: 0 },
  'landmark-4e-2': { x: -2, y: 24, z: 0 },
  'landmark-3e-1': { x: -14, y: 4, z: 0 },
  'landmark-3e-2': { x: -14, y: 6, z: 0 },
  // Les grands projets neufs (8 octobre 2026), figés à leur première place.
  'landmark-4e-3': { x: 25, y: 36, z: 0 },
  'landmark-4e-4': { x: 24, y: 8, z: 0 },
  'landmark-3e-3': { x: -22, y: 20, z: 0 },
  'landmark-3e-4': { x: 28, y: -7, z: 0 },
  'landmark-3e-5': { x: 1, y: -19, z: 0 },
};

/** Le coin d'un plan en coordonnées relatives à l'île (x, y, et z relatif au sol : 0 = premier bloc sur le sol). */
export function planOrigin(plan: PlanDef): { x: number; y: number; z: number } {
  if (plan.zone === 'port') {
    const o = ORIGINE_DU_QUAI[plan.biome];
    if (!o) throw new Error(`Pas de quai sur ${plan.biome}`);
    return { x: o.x + plan.origin.x, y: o.y + plan.origin.y, z: o.z };
  }
  // La construction qui réunit deux lieux (GD-9) : ses cases sont déjà dans le repère de la paire (./join.ts).
  if (plan.zone === 'join') return { x: 0, y: 0, z: 0 };
  if (plan.zone === 'monument') {
    const o = ORIGINE_DES_MONUMENTS[plan.id];
    if (!o) throw new Error(`Monument sans origine : ${plan.id}`);
    return o;
  }
  return { x: PLAN_ZONE.x + plan.origin.x, y: PLAN_ZONE.y + plan.origin.y, z: 0 };
}

/** Un plan est terminé quand toutes ses cellules sont posées. */
export function isPlanDone(plan: PlanDef, done: Record<string, string[]>): boolean {
  const posees = done[plan.id];
  if (!posees || posees.length < plan.cells.length) return false;
  // Terminé quand toutes les cases DU plan sont posées (une réunion garde des clés dans le repère de sa paire, qu'une
  // autre forme ne contient pas : on compte les cases, pas la longueur de la liste).
  const cles = new Set(posees);
  return planCells(plan).every((c) => cles.has(c.key));
}

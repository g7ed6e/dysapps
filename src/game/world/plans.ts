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

export interface PlanCell {
  x: number;
  y: number;
  z: number;
  block: BlockId;
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

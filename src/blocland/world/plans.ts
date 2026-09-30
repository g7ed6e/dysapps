// Les plans du village : un bâtiment en ruine par île, à reconstruire bloc par bloc, en trois plans (les murs, le toit, la
// cour). Chaque plan a sa fiche JSON (nom, phrase de fin, XP, coffre) ; son dessin vient de l'architecte (architect.ts).
import { BIOMES, type BiomeId, type BlockId } from '../biomes';
import { FINISH_BLOCKS, buildingStages, finishNeeds } from './architect';
import carriereAbri from './plans/carriere-abri.json';
import carriereCour from './plans/carriere-cour.json';
import carriereFour from './plans/carriere-four.json';
import fermeEnclos from './plans/ferme-enclos.json';
import fermeEtable from './plans/ferme-etable.json';
import fermeToit from './plans/ferme-toit.json';
import foretCabane from './plans/foret-cabane.json';
import foretCour from './plans/foret-cour.json';
import foretToit from './plans/foret-toit.json';
import mineCour from './plans/mine-cour.json';
import mineForge from './plans/mine-forge.json';
import mineToit from './plans/mine-toit.json';
import plaineCour from './plans/plaine-cour.json';
import plaineNid from './plans/plaine-nid.json';
import plaineToit from './plans/plaine-toit.json';
import riviereHutte from './plans/riviere-hutte.json';
import rivierePonton from './plans/riviere-ponton.json';
import riviereToit from './plans/riviere-toit.json';
import volcanAbri from './plans/volcan-abri.json';
import volcanTerrasse from './plans/volcan-terrasse.json';
import volcanToit from './plans/volcan-toit.json';
import glacierIgloo from './plans/glacier-igloo.json';
import glacierToit from './plans/glacier-toit.json';
import glacierPatinoire from './plans/glacier-patinoire.json';
import marcheEchoppe from './plans/marche-echoppe.json';
import marcheToit from './plans/marche-toit.json';
import marcheEtal from './plans/marche-etal.json';
import tourLanterne from './plans/tour-lanterne.json';
import tourPhare from './plans/tour-phare.json';
import tourQuai from './plans/tour-quai.json';
import carrefourCabane from './plans/carrefour-cabane.json';
import carrefourToit from './plans/carrefour-toit.json';
import carrefourRondpoint from './plans/carrefour-rondpoint.json';
import maraisHutte from './plans/marais-hutte.json';
import maraisToit from './plans/marais-toit.json';
import maraisPonton from './plans/marais-ponton.json';
import forgeAtelier from './plans/forge-atelier.json';
import forgeToit from './plans/forge-toit.json';
import forgeCour from './plans/forge-cour.json';
import atelierBureau from './plans/atelier-bureau.json';
import atelierToit from './plans/atelier-toit.json';
import atelierTerrasse from './plans/atelier-terrasse.json';
import falaiseBergerie from './plans/falaise-bergerie.json';
import falaiseToit from './plans/falaise-toit.json';
import falaiseEnclos from './plans/falaise-enclos.json';
import cabinetNid from './plans/cabinet-nid.json';
import cabinetToit from './plans/cabinet-toit.json';
import cabinetPerchoir from './plans/cabinet-perchoir.json';
import belvedereKiosque from './plans/belvedere-kiosque.json';
import belvedereToit from './plans/belvedere-toit.json';
import belvedereTerrasse from './plans/belvedere-terrasse.json';
import donneesDome from './plans/donnees-dome.json';
import donneesToit from './plans/donnees-toit.json';
import donneesTerrasse from './plans/donnees-terrasse.json';
import phareLanterne from './plans/phare-lanterne.json';
import phareToit from './plans/phare-toit.json';
import phareJetee from './plans/phare-jetee.json';
import textesLanterne from './plans/textes-lanterne.json';
import textesToit from './plans/textes-toit.json';
import textesCoupole from './plans/textes-coupole.json';
import baieCabine from './plans/baie-cabine.json';
import baieToit from './plans/baie-toit.json';
import baieQuai from './plans/baie-quai.json';
import horlogeTour from './plans/horloge-tour.json';
import horlogeToit from './plans/horloge-toit.json';
import horlogeCour from './plans/horloge-cour.json';
import comptoirBoutique from './plans/comptoir-boutique.json';
import comptoirToit from './plans/comptoir-toit.json';
import comptoirTerrasse from './plans/comptoir-terrasse.json';
import manoirSalon from './plans/manoir-salon.json';
import manoirToit from './plans/manoir-toit.json';
import manoirJardin from './plans/manoir-jardin.json';
import relaisAuberge from './plans/relais-auberge.json';
import relaisEcurie from './plans/relais-ecurie.json';
import relaisFontaine from './plans/relais-fontaine.json';
import jardinCuisine from './plans/jardin-cuisine.json';
import jardinTonnelle from './plans/jardin-tonnelle.json';
import jardinSerre from './plans/jardin-serre.json';
import theatreLoge from './plans/theatre-loge.json';
import theatreToit from './plans/theatre-toit.json';
import theatreScene from './plans/theatre-scene.json';
import gareAbri from './plans/gare-abri.json';
import gareToit from './plans/gare-toit.json';
import gareQuai from './plans/gare-quai.json';
import studioRegie from './plans/studio-regie.json';
import studioToit from './plans/studio-toit.json';
import studioTerrasse from './plans/studio-terrasse.json';
import chateauTour from './plans/chateau-tour.json';
import chateauToit from './plans/chateau-toit.json';
import chateauRempart from './plans/chateau-rempart.json';
import refugePoste from './plans/refuge-poste.json';
import refugeSalle from './plans/refuge-salle.json';
import refugePigeonnier from './plans/refuge-pigeonnier.json';

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
  reward: { xp: number; chest: Partial<Record<BlockId, number>> };
  /** Ce que dit la créature quand le plan est terminé. */
  done: string;
  /**
   * Où le plan se pose : dans la zone des plans de l'île (par défaut), sur le quai du port (le Bloc-Navire), ou sur l'îlot
   * d'un monument (`origin` est alors le coin du monument dans le monde).
   */
  zone?: 'plans' | 'port' | 'monument';
}

/** Zone des plans de chaque île (coordonnées relatives à l'île) : plate, sans décor. */
export const PLAN_ZONE = { x: 8, y: 10, w: 6, h: 5 };

/** Les fiches des plans (nom, phrases, XP, coffre ; produites par `npm run contenu` depuis la section « Les plans » de docs/contenu/<île>.md, dans le même ordre) : sur chaque île, le plan suivant se débloque quand le précédent est terminé. */
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
] as Omit<PlanDef, 'cells' | 'origin'>[];

/**
 * Les plans des îles : la fiche de chaque plan, et son dessin par l'architecte (world/architect.ts) selon la forme du
 * bâtiment de l'île et son rang (les murs, le toit, la cour). Le coffre d'un plan garde ses blocs d'îles et ses blocs rares,
 * et donne exactement les blocs de finition de l'étape suivante.
 */
export const PLANS: PlanDef[] = (() => {
  const out: PlanDef[] = [];
  for (const island of [...new Set(PLAN_FILES.map((p) => p.biome))]) {
    const files = PLAN_FILES.filter((p) => p.biome === island);
    const block = BIOMES.find((b) => b.id === island)!.block;
    const stages = buildingStages(island, block);
    files.forEach((file, i) => {
      const keep = Object.fromEntries(Object.entries(file.reward.chest).filter(([b]) => !FINISH_BLOCKS.includes(b as BlockId)));
      const chest = { ...keep, ...(i + 1 < stages.length ? finishNeeds(stages[i + 1]) : {}) };
      out.push({ ...file, origin: { x: 0, y: 0 }, cells: stages[i] ?? [], reward: { ...file.reward, chest } });
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
 * (world/harbour.ts) et l'îlot de chaque monument (world/monuments.ts) ; plans.test.ts vérifie qu'elles y sont égales.
 */
export const ORIGINE_DU_QUAI: Partial<Record<BiomeId, { x: number; y: number; z: number }>> = {
  plaine: { x: 15, y: -14, z: -1 },
  marche: { x: 15, y: -12, z: -4 },
  atelier: { x: 15, y: -14, z: -7 },
};

/** L'origine figée de chaque monument (son plan), relative au cœur de son île : voir `ORIGINE_DU_QUAI`. */
export const ORIGINE_DES_MONUMENTS: Record<string, { x: number; y: number; z: number }> = {
  'monument-observatoire': { x: 4, y: 23, z: 0 },
  'monument-moulin': { x: 1, y: 24, z: 0 },
  'monument-phare-large': { x: 23, y: 20, z: 0 },
  'monument-kiosque': { x: -11, y: -12, z: 0 },
  'monument-viaduc': { x: 16, y: -13, z: 0 },
  'monument-amphitheatre': { x: -2, y: 24, z: 0 },
  'monument-etoiles': { x: -14, y: 4, z: 0 },
  'monument-temple': { x: -14, y: 6, z: 0 },
};

/** Le coin d'un plan en coordonnées relatives à l'île (x, y, et z relatif au sol : 0 = premier bloc sur le sol). */
export function planOrigin(plan: PlanDef): { x: number; y: number; z: number } {
  if (plan.zone === 'port') {
    const o = ORIGINE_DU_QUAI[plan.biome];
    if (!o) throw new Error(`Pas de quai sur ${plan.biome}`);
    return { x: o.x + plan.origin.x, y: o.y + plan.origin.y, z: o.z };
  }
  if (plan.zone === 'monument') {
    const o = ORIGINE_DES_MONUMENTS[plan.id];
    if (!o) throw new Error(`Monument sans origine : ${plan.id}`);
    return o;
  }
  return { x: PLAN_ZONE.x + plan.origin.x, y: PLAN_ZONE.y + plan.origin.y, z: 0 };
}

/** Un plan est terminé quand toutes ses cellules sont posées. */
export function isPlanDone(plan: PlanDef, done: Record<string, string[]>): boolean {
  return (done[plan.id]?.length ?? 0) >= plan.cells.length;
}

/** Le plan en cours d'une île : le premier qui n'est pas terminé, ou `null` si tout est construit. */
export function activePlan(biome: BiomeId, done: Record<string, string[]>): PlanDef | null {
  return plansFor(biome).find((p) => !isPlanDone(p, done)) ?? null;
}

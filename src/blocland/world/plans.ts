// Les plans du village : un bâtiment en ruine par île, à reconstruire bloc par bloc.
// Chaque plan est un fichier JSON (cellules relatives à la zone des plans de l'île).
import type { BiomeId, BlockId } from '../biomes';
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
}

/** Zone des plans de chaque île (coordonnées relatives à l'île) : plate, sans décor. */
export const PLAN_ZONE = { x: 6, y: 7, w: 6, h: 5 };

/** Dans l'ordre : sur chaque île, le plan suivant se débloque quand le précédent est terminé. */
export const PLANS: PlanDef[] = [
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
] as PlanDef[];

export function plansFor(biome: BiomeId): PlanDef[] {
  return PLANS.filter((p) => p.biome === biome);
}

export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

export const cellKey = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Cellules d'un plan en coordonnées relatives à l'île (z = 0 : premier bloc sur le sol). */
export function planCells(plan: PlanDef): (PlanCell & { key: string })[] {
  return plan.cells.map((c) => {
    const x = PLAN_ZONE.x + plan.origin.x + c.x;
    const y = PLAN_ZONE.y + plan.origin.y + c.y;
    return { x, y, z: c.z, block: c.block, key: cellKey(x, y, c.z) };
  });
}

/** Un plan est terminé quand toutes ses cellules sont posées. */
export function isPlanDone(plan: PlanDef, done: Record<string, string[]>): boolean {
  return (done[plan.id]?.length ?? 0) >= plan.cells.length;
}

/** Le plan en cours d'une île : le premier qui n'est pas terminé, ou `null` si tout est construit. */
export function activePlan(biome: BiomeId, done: Record<string, string[]>): PlanDef | null {
  return plansFor(biome).find((p) => !isPlanDone(p, done)) ?? null;
}

// Les petites constructions dessinées d'Archipéo (lot 1 du 6e de la piste 3 « hybride » du directeur artistique, choisie
// par le mainteneur le 11 octobre 2026 ; le style validé sur le puits de Tunel : « Top le style ») : chaque commande et
// chaque objet d'entraide des Premiers Rivages a un dessin du code (aucun fichier importé), low poly en aplats francs,
// qui remplace les cubes de sa forme une fois posée. Les objets à silhouette ont un modèle propre, de près et de loin
// (./objects/silhouettes.ts : le puits, la grue, la boutique, le lavoir, le parasol, la pendule, le tamis, le nichoir) ;
// les autres sont faits des pièces communes (./objects/assemblies.ts : le potager, le bac à eau, le poteau-lanterne,
// la vitrine, la placette, l'étagère à flacons, l'établi, l'urne ; la lanterne de Mousso, le portillon, l'escalier).
// Au 5e (11 octobre 2026), toutes aussi : la cabane, la salière, la tente et le four à pain à silhouette
// (./objects/silhouettes5e.ts), les autres en pièces, le poteau indicateur de Sema compris.
// La matière du bloc livré y reste sur une grande face, dans les couleurs mêmes du bloc (règle GD-7).
//
// La forme, ses cases, sa place et la sauvegarde ne changent pas (./fixtures.ts). La pose non plus : pendant « Livrer »,
// la page retire la petite construction de la construction et la pose en fondu, couche par couche (./fadeMesh.ts) ; la
// vague finie, le monde la rend posée, et le dessin entier prend la place des cubes (au carillon). Blocland garde ses
// cubes : seule la construction d'Archipéo (./construction.ts) lit ce fichier. Code pur, sans Three.js.
import type { VoxelCube } from './cube';
import { type BiomeId, BIOMES } from '../biomes';
import type { ArchipelagoId } from './map';
import type { Cell } from './view';
import type { ImportedMonument } from './monumentModels';
import { casesDeLaPetiteConstructionDansLeMonde, poseDeLaPetiteConstruction } from './terrain/fixture';
import { type FacettesDuDecor, Pinceau } from './decor/brush';
import { Workshop, countingWorkshop } from './objects/workshop';
import { paintFor } from './objects/pieces';
import { type ObjectDrawing, SILHOUETTES } from './objects/silhouettes';
import { SILHOUETTES_5E } from './objects/silhouettes5e';
import { ASSEMBLIES } from './objects/assemblies';

/** Un objet dessiné : son île, son dessin, et s'il a un dessin de loin (les objets à silhouette). */
interface Modele {
  ile: BiomeId;
  /** L'archipel de son île. */
  archipelago: ArchipelagoId;
  dessiner: ObjectDrawing;
  deLoin: boolean;
}

/** L'île et l'archipel d'une petite construction dessinée, d'après son identifiant ; une île inconnue est une erreur. */
function placeOf(id: string): { ile: BiomeId; archipelago: ArchipelagoId } {
  const ile = id.replace(/-fixture-\d+$/, '');
  const biome = BIOMES.find((b) => b.id === ile);
  if (!biome) throw new Error(`Petite construction dessinée sans île : ${id}`);
  return { ile: biome.id, archipelago: biome.classe };
}

/** Les petites constructions qu'Archipéo dessine, par identifiant (au 6e et au 5e). */
const MODELES: Readonly<Record<string, Modele>> = Object.fromEntries([
  ...Object.entries({ ...SILHOUETTES, ...SILHOUETTES_5E }).map(([id, dessiner]) => [id, { ...placeOf(id), dessiner, deLoin: true }] as const),
  ...Object.entries(ASSEMBLIES).map(([id, dessiner]) => [id, { ...placeOf(id), dessiner, deLoin: false }] as const),
]);

/** Les identifiants des petites constructions dessinées (les tests et le budget les parcourent). */
export const PETITES_CONSTRUCTIONS_DESSINEES: readonly string[] = Object.keys(MODELES);

/** A-t-elle un dessin de loin (un objet à silhouette) ? Sinon, le même de près et de loin. */
export function aUnDessinDeLoin(id: string): boolean {
  return MODELES[id]?.deLoin ?? false;
}

/** Le nombre de triangles d'un dessin, de près ou de loin, vitres comprises (le budget : world/budget.ts). */
export function trianglesDuModele(id: string, loin: boolean): number {
  const m = MODELES[id];
  const at = countingWorkshop();
  m.dessiner(at, paintFor(m.archipelago, m.ile, false), loin && m.deLoin);
  return at.triangles;
}

/**
 * Ce que coûte de plus, au pire, une petite construction dessinée d'un archipel vue de près plutôt que de loin (une seule
 * île est de près à la fois) : le budget compte le monde de loin (`pres` nul), puis ajoute cet écart (world/budget.ts).
 */
export function ecartDePres(a: ArchipelagoId): number {
  const ecarts = Object.entries(MODELES)
    .filter(([, m]) => m.archipelago === a)
    .map(([id]) => trianglesDuModele(id, false) - trianglesDuModele(id, true));
  return Math.max(0, ...ecarts);
}

/** Des facettes vides (un objet sans vitre). */
const vide = (): FacettesDuDecor => new Pinceau().fin();

/**
 * Les petites constructions dessinées de ce monde, posées (toutes leurs cases, sans fantôme) : chacune comme un modèle
 * importé (./monumentModels.ts) qui remplace ses cases (le toucher les retrouve), de près sur l'île `pres`, de loin
 * ailleurs ; ses vitres de lanterne dans le feu, allumées la nuit (pas sur une île fermée). Le rendu Archipéo seulement
 * (./construction.ts).
 */
export function petitesConstructionsDessinees(a: ArchipelagoId, cubes: readonly VoxelCube[], pres: BiomeId | null = null): ImportedMonument[] {
  let poses: Map<string, VoxelCube> | null = null;
  const out: ImportedMonument[] = [];
  for (const [id, m] of Object.entries(MODELES)) {
    if (m.archipelago !== a) continue;
    if (!poses) {
      poses = new Map();
      for (const c of cubes) if (c.petiteConstruction && !c.ghost) poses.set(`${c.x},${c.y},${c.z}`, c);
      if (!poses.size) return out;
    }
    const cases = casesDeLaPetiteConstructionDansLeMonde(m.ile, id);
    const pose = poseDeLaPetiteConstruction(m.ile, id);
    const siens = [...cases].map((k) => poses!.get(k));
    if (!pose || !cases.size || siens.some((c) => !c || c.tag !== m.ile)) continue;
    const posees = siens as VoxelCube[];
    const muted = posees.some((c) => c.muted);
    const at = new Workshop(new Pinceau(), muted ? null : new Pinceau(), pose.point);
    m.dessiner(at, paintFor(a, m.ile, muted), m.deLoin && pres !== m.ile);
    const cellules: Cell[] = posees.map((c) => ({ x: c.x, y: c.y, z: c.z }));
    out.push({ id, stage: 1, opaque: at.opaque.fin(), fire: at.fire?.fin() ?? vide(), halo: null, cellules, replaced: new Set(cases) });
  }
  return out;
}

// La disposition en grille (docs/conception/separation-jeu-rendu.md, étape J3) : le monde en cases d'aujourd'hui, pour
// la 3D. Elle enveloppe terrain.ts, paths.ts et monuments.ts sans rien changer à ce qu'ils calculent : la page du
// monde et la simulation demandent où sont les choses à la disposition, plus aux fonctions de la grille.
//
// Depuis l'étape J5, chaque île naît dans son repère (terrain.ts, `cubesDeLIle`) : son origine est le coin de son cœur, à
// son altitude. L'ancrage d'une entité porte son île et un point dans ce repère ; `versMonde` y ajoute l'origine de l'île,
// `versIle` fait l'inverse pour un point du monde (le toucher).
import type { BiomeId } from '../biomes';
import type { VillagePlaceId, VoxelCube } from './cube';
import { getBridge, type ArchipelagoId } from './archipelago';
import type { Ancrage, Disposition, Entite, Etendue, Point, Trajet } from './disposition';
import { caseDArrivee, toucheLEau, type Arrivee } from './arrivee';
import { isLand, islandDef, mapOf } from './map';
import { getMonument } from './monuments';
import { walkGround, walkPath, type Cell, type CreaturePlacement, type WalkGround } from './paths';
import { avatarHome, avatarRoute, bossIsletCenter, bridgePath, casesDeLOuvrage, casesDesLieux, islandAt, islandCenter, monumentCenter, origineDe, placeDoor, placesDeLaFleche, questStations, routeLengths, viewZone, worldBounds } from './terrain';

/**
 * Le bonhomme marche à six cases par seconde, toujours : sur son île comme d'une île à l'autre, sans plafond qui le ferait
 * filer sur un long trajet (04/10/2026). Toucher le vide pendant la marche le fait arriver tout de suite.
 */
export const WALK_SPEED = 6;

/** Le temps d'un trajet du bonhomme : six cases par seconde, quelle que soit sa longueur. */
export function dureeDeMarche(route: Point[]): number {
  if (route.length < 2) return 0;
  return (routeLengths(route)[route.length - 1] / WALK_SPEED) * 1000;
}

/** Les bouts d'un trajet, quand ce ne sont pas les places habituelles : là où il s'arrête, là d'où il part. */
export interface BoutsDuTrajet {
  arrivee?: Point;
  depart?: Point;
}

/** La disposition en grille d'un archipel, et ce que seule la grille sait faire : raccorder deux points à pied. */
export interface DispositionEnGrille extends Disposition {
  genre: 'grille';
  archipel: ArchipelagoId;
  /** En grille, un point est toujours sur une île ou près d'elle : l'île la plus proche. */
  ileEn(p: Point): BiomeId;
  /** Un point du monde dans le repère de l'île la plus proche, ou de l'île `ile` si elle est donnée. */
  versIle(p: Point, ile?: BiomeId): Ancrage;
  /** Le chemin à pied d'un point à un autre sur le sol (autour du décor et des créatures), ou `null`. */
  raccord(depuis: Point, vers: Point): Point[] | null;
  /**
   * Le trajet vers une île ou un lieu ; vers une île, il peut s'arrêter en `arrivee` (la case du sol touchée) plutôt
   * qu'à la place habituelle, et partir de `depart` (là où il se tient sur l'île de départ) plutôt que de sa place.
   */
  trajet(depuis: Entite, vers: Entite, bouts?: BoutsDuTrajet): Trajet | null;
  /**
   * Toucher le sol de l'île `ile` en `touche` : la case où va le bonhomme depuis `depuis` (./arrivee.ts), ou `null` (hors
   * de l'île, rien d'accessible, ou sans grille de marche) : la place habituelle.
   */
  arrivee(ile: BiomeId, touche: { x: number; y: number }, depuis: Point): Arrivee | null;
  /** Le doigt est tombé sur l'eau (ou la lave). */
  surLEau(touche: { x: number; y: number }): boolean;
  /**
   * Les places de la flèche de la Carte sur l'ouvrage `ouvrage` construit depuis l'île `depuis` (sans elle, son île
   * `from`) : la voulue d'abord, puis celles où elle glisse vers l'arrivée (terrain.ts, `placesDeLaFleche`).
   */
  placesDeLaFleche(ouvrage: string, depuis?: BiomeId): Cell[];
}

/** Un point du monde, ancré à l'île `ile` : dans son repère. */
function ancre(ile: BiomeId, p: Point): Ancrage {
  const o = origineDe(ile);
  return { ile, local: { x: p.x - o.x, y: p.y - o.y, z: p.z - o.z } };
}

/**
 * La disposition en grille d'un archipel, sans cubes ni ouvrages (ce qu'elle dit ne dépend alors que de l'archipel : où
 * sont les îles, le repère de chacune), faite une fois et partagée : le clavier, le toucher, les intentions des vues.
 */
const grilles = new Map<ArchipelagoId, DispositionEnGrille>();
export function grilleDe(a: ArchipelagoId): DispositionEnGrille {
  let g = grilles.get(a);
  if (!g) grilles.set(a, (g = dispositionEnGrille(a)));
  return g;
}

/**
 * La disposition en grille de l'archipel `a`. Avec les ouvrages construits (`bridges`), elle trace les trajets ; avec les
 * cubes du monde et les créatures (`sol`), le bonhomme suit le sol et contourne le décor (sinon il va en ligne droite).
 */
export function dispositionEnGrille(
  a: ArchipelagoId,
  bridges: string[] = [],
  sol?: { cubes: VoxelCube[]; creatures: CreaturePlacement[] },
): DispositionEnGrille {
  let ground: WalkGround | undefined;
  const marche = () => (sol ? (ground ??= walkGround(sol.cubes, sol.creatures, casesDesLieux(a))) : undefined);
  const seTenir = (ile: BiomeId) => ancre(ile, avatarHome(ile));
  const versMonde = (x: Ancrage): Point => {
    const o = origineDe(x.ile);
    return { x: x.local.x + o.x, y: x.local.y + o.y, z: x.local.z + o.z };
  };
  const ileEn = (p: Point) => islandAt(a, Math.floor(p.x), Math.floor(p.y));
  const raccord = (depuis: Point, vers: Point) => {
    const g = marche();
    return g ? walkPath(g, depuis, vers) : null;
  };

  function placeDe(e: Entite): Ancrage | null {
    switch (e.genre) {
      case 'ile':
        return ancre(e.id, islandCenter(e.id));
      case 'borne': {
        const [ile, mission] = e.id.split(':') as [BiomeId, string];
        const st = questStations(ile).find((q) => q.typeId === mission);
        if (!st) return null;
        // La borne est posée sur la case (st.x, st.y) du cœur, z : l'altitude de l'île.
        return { ile, local: { x: st.x, y: st.y, z: 0 } };
      }
      case 'lieu': {
        const door = placeDoor(e.id as VillagePlaceId, e.ile);
        return door ? ancre(e.ile, door) : null;
      }
      case 'ouvrage': {
        const def = getBridge(e.id);
        if (!def) return null;
        const path = bridgePath(def);
        return ancre(def.from, path[Math.floor(path.length / 2)]);
      }
      case 'gardien':
        return ancre(e.id, bossIsletCenter(e.id));
      case 'plan': {
        const m = getMonument(e.id);
        return m && m.archipelago === a ? ancre(m.biome, monumentCenter(m)) : null;
      }
      default:
        return null;
    }
  }

  /**
   * De l'île où il se tient (de sa place, ou de `depart`) à une île, ou à la porte d'un lieu : sur les ouvrages
   * construits, puis à pied, jusqu'à sa place, ou jusqu'à `arrivee` sur une île (la case du sol touchée).
   */
  function trajet(depuis: Entite, vers: Entite, { arrivee, depart }: BoutsDuTrajet = {}): Trajet | null {
    if (depuis.genre !== 'ile') return null;
    const cible = vers.genre === 'ile' ? vers.id : vers.genre === 'lieu' ? vers.ile : null;
    if (!cible) return null;
    const chemin = avatarRoute(depuis.id, cible, bridges, marche(), { end: vers.genre === 'ile' ? arrivee : undefined, start: depart });
    if (!chemin) return null;
    const route: Point[] = [...chemin];
    if (vers.genre === 'lieu') {
      const door = placeDoor(vers.id as VillagePlaceId, vers.ile);
      const last = route[route.length - 1];
      const toDoor = door ? (raccord(last, door) ?? [last, door]) : [last];
      route.push(...toDoor.slice(1));
    }
    return { etapes: route.map((p) => ancre(ileEn(p), p)), duree: dureeDeMarche(route) };
  }

  return {
    genre: 'grille',
    archipel: a,
    placeDe,
    seTenir,
    versMonde,
    trajet,
    raccord,
    liaison: (id) => {
      const def = getBridge(id);
      return def ? bridgePath(def).map((c): Cell => ({ x: c.x, y: c.y, z: c.z })) : [];
    },
    cadrage: (ile): Etendue => viewZone(ile),
    etendue: (): Etendue => worldBounds(a),
    ileEn,
    versIle: (p, ile) => ancre(ile ?? ileEn(p), p),
    arrivee: (ile, touche, depuis) => {
      const g = marche();
      return g ? caseDArrivee(g, islandDef(ile), depuis, touche) : null;
    },
    surLEau: (touche) => {
      const g = marche();
      return g ? toucheLEau(g, touche) : false;
    },
    placesDeLaFleche: (id, depuis) => {
      const def = getBridge(id);
      if (!def) return [];
      const cases = casesDeLOuvrage(def);
      // Toutes les îles de l'archipel : une liaison en contour ne pose jamais la flèche sur une terre qu'elle longe.
      const iles = mapOf(a);
      return placesDeLaFleche(depuis === def.to ? [...cases].reverse() : cases, (x, y) => iles.some((d) => isLand(d, x, y)));
    },
  };
}

// La disposition en grille (docs/conception/separation-jeu-rendu.md, étape J3) : le monde en cases d'aujourd'hui, pour
// la 3D et la 2D. Elle enveloppe terrain.ts, paths.ts et monuments.ts sans rien changer à ce qu'ils calculent : la page du
// monde et la simulation demandent où sont les choses à la disposition, plus aux fonctions de la grille.
//
// Jusqu'à l'étape J5, le repère d'une île est celui du monde : l'ancrage d'une entité porte son île, et son point est
// déjà en cases du monde (`versMonde` le rend tel quel). J5 fera naître chaque île dans son repère à elle.
import { BIOMES, type BiomeId } from '../biomes';
import type { VillagePlaceId, VoxelCube } from './cube';
import { getBridge, type ArchipelagoId } from './archipelago';
import type { Ancrage, Disposition, Entite, Etendue, Point, Trajet } from './disposition';
import { getMonument } from './monuments';
import { walkGround, walkPath, type Cell, type CreaturePlacement, type WalkGround } from './paths';
import { avatarHome, avatarRoute, bridgePath, islandAt, islandCenter, islandOrigin, monumentCenter, placeDoor, questStations, routeLengths, viewZone, worldBounds } from './terrain';

/** Le bonhomme marche à six cases par seconde ; au-delà de six secondes, il accélère. */
export const WALK_SPEED = 6;
export const WALK_MAX_MS = 6000;

/** Le temps d'un trajet du bonhomme : six cases par seconde, jamais plus de six secondes. */
export function dureeDeMarche(route: Point[]): number {
  if (route.length < 2) return 0;
  return Math.min(WALK_MAX_MS, (routeLengths(route)[route.length - 1] / WALK_SPEED) * 1000);
}

/** La disposition en grille d'un archipel, et ce que seule la grille sait faire : raccorder deux points à pied. */
export interface DispositionEnGrille extends Disposition {
  genre: 'grille';
  archipel: ArchipelagoId;
  /** En grille, un point est toujours sur une île ou près d'elle : l'île la plus proche. */
  ileEn(p: Point): BiomeId;
  /** Le chemin à pied d'un point à un autre sur le sol (autour du décor et des créatures), ou `null`. */
  raccord(depuis: Point, vers: Point): Point[] | null;
}

const ancre = (ile: BiomeId, p: Point): Ancrage => ({ ile, local: { x: p.x, y: p.y, z: p.z } });

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
  const marche = () => (sol ? (ground ??= walkGround(sol.cubes, sol.creatures)) : undefined);
  const seTenir = (ile: BiomeId) => ancre(ile, avatarHome(ile));
  const versMonde = (x: Ancrage): Point => x.local;
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
        const { ox, oy, oz } = islandOrigin(BIOMES.findIndex((b) => b.id === ile));
        return ancre(ile, { x: ox + st.x, y: oy + st.y, z: oz });
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
      case 'plan': {
        const m = getMonument(e.id);
        return m && m.archipelago === a ? ancre(m.biome, monumentCenter(m)) : null;
      }
      default:
        return null;
    }
  }

  /** De l'île où il se tient à une île, ou à la porte d'un lieu : sur les ouvrages construits, puis à pied. */
  function trajet(depuis: Entite, vers: Entite): Trajet | null {
    if (depuis.genre !== 'ile') return null;
    const cible = vers.genre === 'ile' ? vers.id : vers.genre === 'lieu' ? vers.ile : null;
    if (!cible) return null;
    const chemin = avatarRoute(depuis.id, cible, bridges, marche());
    if (!chemin) return null;
    const route: Point[] = [...chemin];
    if (vers.genre === 'lieu') {
      const door = placeDoor(vers.id as VillagePlaceId, vers.ile);
      const last = route[route.length - 1];
      const toDoor = door ? (raccord(last, door) ?? [last, door]) : [last];
      route.push(...toDoor.slice(1));
    }
    return { etapes: route.map((p) => ancre(islandAt(a, Math.floor(p.x), Math.floor(p.y)), p)), duree: dureeDeMarche(route) };
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
    ileEn: (p) => islandAt(a, Math.floor(p.x), Math.floor(p.y)),
  };
}

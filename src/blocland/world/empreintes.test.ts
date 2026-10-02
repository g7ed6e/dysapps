// Le filet de la séparation du jeu et du rendu (docs/conception/separation-jeu-rendu.md, étape J0) : une empreinte de
// tout ce que la grille calcule aujourd'hui, pour chaque archipel et trois parties (vierge, à mi-parcours, tout
// construit). Les étapes suivantes déplacent ce code sans rien changer à l'image : ces empreintes ne doivent pas bouger.
// Si une empreinte change, c'est que le monde a changé ; un lot qui le veut (un lot de rendu, par exemple) met à jour
// l'instantané avec `npx vitest run -u src/blocland/world/empreintes.test.ts` et le dit dans sa pull request.
import { BIOMES, type BiomeId } from '../biomes';
import { ARCHIPELAGO_IDS, archipelagoOfIsland, type ArchipelagoId } from './map';
import { BRIDGES, getArchipelago, islandsOf, VOYAGES } from './archipelago';
import { toutConstruit } from './budget';
import { champDuSol, landMesh, poseDuDecor, type Facettes } from './landMesh';
import { walkGround } from './paths';
import { PLANS, planCells } from './plans';
import { VEHICLE_STAGES } from './vehicle';
import { MONUMENTS } from './monuments';
import {
  avatarHome,
  avatarRoute,
  boardingRoute,
  bridgePath,
  casesDesLieux,
  creaturePlacements,
  guardianPlacements,
  islandCenter,
  placeDoor,
  questStations,
  vehiclePlacement,
  worldCubes,
} from './terrain';

/** FNV-1a sur 32 bits : une empreinte courte et stable d'un texte. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Empreinte d'une valeur : son JSON, clés dans l'ordre d'écriture. */
const empreinte = (v: unknown) => fnv(JSON.stringify(v));

/** Empreinte d'une liste dont l'ordre ne compte pas (des cubes). */
const empreinteTriee = (list: unknown[]) => fnv(list.map((x) => JSON.stringify(x)).sort().join('\n'));

/** Empreinte de tableaux typés, arrondis au dix-millième (l'image ne bouge pas en deçà). */
const empreinteFacettes = (f: Facettes) =>
  fnv([f.positions, f.normals, f.colors].map((a) => Array.from(a, (x) => Math.round(x * 1e4)).join(',')).join('|') + '|' + f.colonnes.join(','));

type Partie = ReturnType<typeof toutConstruit>;

const vierge = (): Partie => ({ progress: {}, world: { parts: {}, log: [], links: [] } });

/**
 * À mi-parcours dans l'archipel `a` : arrivé par la mer (tous les voyages), la première moitié (dans l'ordre des données)
 * de ses ouvrages et de ses plans, et les missions de la première moitié de ses îles réussies (Gardiens compris).
 */
function miParcours(a: ArchipelagoId): Partie {
  const tout = toutConstruit();
  const moitie = <T,>(list: T[]) => list.slice(0, Math.ceil(list.length / 2));
  const iles = islandsOf(a).map((b) => b.id as string);
  const premieres = moitie(iles);
  const ouvrages = BRIDGES.filter((b) => iles.includes(b.from) || iles.includes(b.to)).map((b) => b.id);
  const plans = PLANS.filter((p) => iles.includes(p.biome)).map((p) => p.id);
  return {
    progress: Object.fromEntries(Object.entries(tout.progress).filter(([id]) => premieres.some((i) => id.startsWith(`${i}-`)))),
    world: {
      parts: Object.fromEntries(Object.entries(tout.world.parts).filter(([id]) => moitie(plans).includes(id))),
      log: [],
      links: [...VOYAGES.map((v) => v.id), ...moitie(ouvrages)],
    },
  };
}

const PARTIES: [string, (a: ArchipelagoId) => Partie][] = [
  ['vierge', vierge],
  ['mi-parcours', miParcours],
  ['tout construit', toutConstruit],
];

/** Ce que la grille calcule d'un archipel pour une partie : les cubes, le sol, les créatures, le navire, les trajets. */
function empreintesDe(a: ArchipelagoId, { progress, world: village }: Partie): Record<string, string> {
  const cubes = worldCubes(a, progress, village, false);
  const creatures = [...creaturePlacements(a, village.links), ...guardianPlacements(a, progress, village.links)];
  const sol = cubes.filter((c) => c.sol);
  const autres = cubes.filter((c) => !c.sol);
  const champ = champDuSol(a, sol, autres);
  const maillage = landMesh(champ);
  const ground = walkGround(cubes, creatures, casesDesLieux(a));
  const iles = islandsOf(a).map((b) => b.id);
  const port = getArchipelago(a).port;
  // Du port vers chaque île, comme le bonhomme qui part du quai : par les ouvrages construits de la partie.
  const routes = iles.map((id) => [id, avatarRoute(port, id, village.links, ground)]);
  return {
    cubes: empreinteTriee(cubes),
    'cubes avec créatures': empreinteTriee(worldCubes(a, progress, village, true)),
    'décor posé sur la pente': empreinteTriee(poseDuDecor(champ, autres)),
    'sol (facettes)': empreinteFacettes(maillage.sol),
    'sol (lave)': empreinteFacettes(maillage.lumineux),
    'créatures et Gardiens': empreinte(creatures),
    navire: empreinte(vehiclePlacement(a, progress, village)),
    'trajets depuis le port': empreinte(routes),
  };
}

describe('Empreintes de la grille (filet de la séparation du jeu et du rendu)', () => {
  for (const a of ARCHIPELAGO_IDS) {
    for (const [nom, partie] of PARTIES) {
      it(`${a}, partie ${nom}`, () => {
        expect(empreintesDe(a, partie(a))).toMatchSnapshot();
      });
    }
  }

  // Coupées par archipel (socle de la piste Rendu) : un lot qui change un archipel ne régénère que ses empreintes.
  for (const a of ARCHIPELAGO_IDS) {
    it(`${a}, la place des îles, des bornes, des lieux et du bonhomme`, () => {
      const places = BIOMES.filter((b) => archipelagoOfIsland(b.id as BiomeId) === a).map((b) => {
        const id = b.id as BiomeId;
        return [id, islandCenter(id), avatarHome(id), questStations(id), placeDoor('school', id), placeDoor('trophies', id), placeDoor('assembly', id)];
      });
      expect(empreinte(places)).toMatchSnapshot();
    });

    it(`${a}, les ouvrages, l’embarquement et les voyages`, () => {
      // Un ouvrage est à l'archipel de son île de départ ; un voyage à celui de son arrivée.
      const ouvrages = BRIDGES.filter((b) => archipelagoOfIsland(b.from) === a).map((b) => [b.id, bridgePath(b)]);
      const embarquement = boardingRoute(getArchipelago(a).port);
      const voyages = VOYAGES.filter((v) => v.toClasse === a);
      expect({ ouvrages: empreinte(ouvrages), embarquement: empreinte(embarquement), voyages: empreinte(voyages) }).toMatchSnapshot();
    });
  }

  // Les clés des cases des plans sont enregistrées dans les sauvegardes : elles ne changent jamais.
  it('les clés des cases de chaque plan (sauvegardes)', () => {
    const cles = Object.fromEntries([...PLANS, ...VEHICLE_STAGES, ...MONUMENTS].map((p) => [p.id, empreinte(planCells(p).map((c) => c.key))]));
    expect(cles).toMatchSnapshot();
  });
});

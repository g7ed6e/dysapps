// La caisse de « Donner » (GD-20, point 4, piste B « La remise », lot L2 ; arbitrages du directeur artistique, point 4,
// « La caisse de Donner ») : à l'étape « donner » de l'entraide, les ressources données descendent l'une après l'autre
// dans une caisse ouverte, aux pieds de l'habitant, du côté de Kéo. Elle n'existe que dans la remise, de près : elle
// ne laisse aucune trace dans le monde ni dans la sauvegarde (la conséquence visible de l'entraide, c'est l'objet
// apporté à la fin). Neutre : du bois des caisses du monde continu, sans plaque, sans marque, sans rien qui rappelle le
// Rafiot ; ouverte, pour qu'on voie les blocs y entrer, et jamais fermée comme une caisse de réponse des Quais (qui
// porte une plaque). Ce fichier la dessine et la place ; la scène la pose comme un aménagement (la caisse d'abord, à
// la place de l'assise, puis un élément par ressource). Code pur.
import type { PlacedAmenagement, WorldBox } from './amenagements';
import { remisePosed } from './amenagements';
import { FacetBuilder, boundsOf, mergeFacets } from './facets';
import type { Vec3 } from './geometry';
import type { PlaceId } from './plan6e';
import { scenetteHabitant, scenetteKeo } from './scenette';

/**
 * Le bois de la caisse : le bois sombre du monde continu (`darkWood` des lieux, places.ts) au dehors. Le côté d'un bloc
 * de bois (#9c7a48) a presque la valeur de ce bois : sur un fond du même brun, deux blocs donnés se perdaient (directeur
 * artistique et consultant d'Archipéo, avis sur les lots L2 et L3). Le dedans (le fond et la face intérieure de la
 * paroi du fond, derrière les blocs) prend donc une ombre du même bois, bien plus sombre (`fond`) ; le haut des parois
 * et une latte en travers de l'avant, un liseré clair (`liseré`, la Brume du monde ouvert), qui détache aussi la caisse
 * de la grande caisse claire du docker. Les blocs gardent leurs couleurs, celles de leur icône.
 */
export const CAISSE_WOOD = { dessus: 0x9a7048, cote: 0x8a6440, fond: 0x3f2d20, liseré: 0xe5ebe3 } as const;

/**
 * La caisse, en unités du monde : largeur (x), profondeur (z), hauteur, épaisseur de ses parois. Basse : les blocs
 * donnés dépassent du bord (on les voit posés, à l'état final aussi).
 */
export const CAISSE = { w: 0.7, d: 0.52, h: 0.17, wall: 0.05 } as const;

/** Un bloc donné, dans la caisse : un cube de ce côté, plus haut que le bord. Quatre au plus, deux par deux. */
const CAISSE_BLOCK = 0.24;

/** Les ressources qu'une étape « donner » demande, au plus (GD-10 : 2 à 4) : la caisse les tient toutes. */
export const CAISSE_MAX = 4;

/**
 * Sa place : depuis l'habitant, vers Kéo, de tant d'unités, et vers la caméra (le sud) de tant : à ses pieds, devant le
 * passage entre eux, jamais sur l'un ni sur l'autre, ni sur la caisse où se tient le docker des Quais (vérifié dans la
 * scène de la remise, aux trois formats).
 */
const SPOT = { towardKeo: 1.7, forward: 0.55 } as const;

/** Les lieux où une étape « donner » se fait au 6e (`quetes.md`) : les Quais, les Archives, le Chantier naval. */
export const CAISSE_PLACES: readonly PlaceId[] = ['quais', 'archives', 'shipyard'];

/** Le milieu du fond de la caisse d'un lieu, sur le sol de la scénette de la remise. */
export function caisseSpot(place: PlaceId): Vec3 {
  const posed = remisePosed(place);
  const h = scenetteHabitant(place, posed);
  const k = scenetteKeo(place, posed).at;
  const len = Math.hypot(k.x - h.x, k.z - h.z) || 1;
  return { x: h.x + ((k.x - h.x) / len) * SPOT.towardKeo, y: h.y, z: h.z + ((k.z - h.z) / len) * SPOT.towardKeo + SPOT.forward };
}

/** La place d'un bloc dans la caisse (deux par deux, en partant du fond gauche), depuis le milieu de son fond. */
function caisseSlot(i: number): { x: number; z: number } {
  const step = CAISSE_BLOCK + 0.02;
  return { x: (i % 2 === 0 ? -1 : 1) * (step / 2), z: (i < 2 ? -1 : 1) * (step / 2) };
}

/**
 * La caisse d'un lieu et les `count` blocs donnés, posés pour la remise : la caisse d'abord (à la place de l'assise d'un
 * aménagement : là dès le début), puis un élément par bloc, dans l'ordre où ils descendent. `block` : les deux faces du
 * bloc donné (son dessus, son côté), celles de son icône.
 */
export function placedCaisse(place: PlaceId, count: number, block: { dessus: number; cote: number }): PlacedAmenagement {
  const at = caisseSpot(place);
  const n = Math.max(0, Math.min(CAISSE_MAX, count));
  const crate = new FacetBuilder();
  const { w, d, h, wall } = CAISSE;
  // Le fond, sombre ; la paroi du fond, sombre (sa face intérieure est derrière les blocs) ; les trois autres parois du
  // bois sombre (l'avant un peu plus bas : les blocs s'y voient de la caméra), leur haut d'un liseré clair ; et une
  // latte claire en travers de l'avant.
  crate.box({ x: at.x, y: at.y, z: at.z }, [w, wall, d], CAISSE_WOOD.fond, CAISSE_WOOD.fond);
  crate.box({ x: at.x, y: at.y, z: at.z - d / 2 + wall / 2 }, [w, h, wall], CAISSE_WOOD.fond, CAISSE_WOOD.liseré);
  crate.box({ x: at.x, y: at.y, z: at.z + d / 2 - wall / 2 }, [w, h * 0.7, wall], CAISSE_WOOD.cote, CAISSE_WOOD.liseré);
  for (const side of [-1, 1]) crate.box({ x: at.x + side * (w / 2 - wall / 2), y: at.y, z: at.z }, [wall, h, d - 2 * wall], CAISSE_WOOD.cote, CAISSE_WOOD.liseré);
  crate.box({ x: at.x, y: at.y + h * 0.25, z: at.z + d / 2 + 0.005 }, [w + 0.01, 0.05, 0.02], CAISSE_WOOD.liseré);
  const cubes = Array.from({ length: n }, (_, i) => {
    const b = new FacetBuilder();
    const s = caisseSlot(i);
    b.box({ x: at.x + s.x, y: at.y + wall, z: at.z + s.z }, [CAISSE_BLOCK, CAISSE_BLOCK, CAISSE_BLOCK], block.cote, block.dessus);
    return b.build();
  });
  const box = crate.build();
  const facets = mergeFacets([box, ...cubes]);
  const elements: { from: number; to: number }[] = [];
  let t = box.triangles;
  for (const [i, c] of cubes.entries()) {
    elements.push({ from: i === 0 ? 0 : t, to: t + c.triangles });
    t += c.triangles;
  }
  const bounds: WorldBox = boundsOf(facets);
  return { facets, elements, base: at.y, box: bounds, assise: { from: 0, to: box.triangles } };
}

/** Les triangles de la caisse pleine (quatre blocs), pour le budget de la remise. */
export function caisseTriangles(): number {
  return placedCaisse('quais', CAISSE_MAX, { dessus: 0, cote: 0 }).facets.triangles;
}

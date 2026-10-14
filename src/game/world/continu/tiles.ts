// La réserve des tuiles du terrain (./terrain.ts) pour la vue : faites à la demande et gardées. De loin, toutes gardées
// (elles sont légères, et faites tout de suite) ; de près, les plus récentes seulement, et jamais plus d'une par image :
// une tuile de près qui manque attend dans une file (`pump`, une par image), sa version de loin tenant sa place
// jusque-là. Ainsi, franchir un anneau ne fait jamais une longue tâche (relecture de l'expert frontend). Code pur.
import { boundsOf, type Facets } from './facets';
import { TERRAIN } from './plan6e';
import { tileFacets, tileRect, type HeightField, type TileDetail } from './terrain';

/** Une tuile prête à copier : ses facettes et sa boîte. */
export interface Tile {
  facets: Facets;
  min: [number, number, number];
  max: [number, number, number];
}

/** Les tuiles de près gardées en mémoire, par défaut (les plus récentes) : de quoi revenir sur ses pas sans rien refaire. */
const NEAR_TILES_KEPT = 24;

export interface TileStore {
  /** La tuile, faite tout de suite si elle manque (de loin, ou de près au départ et après un saut). */
  build(index: number, detail: TileDetail): Tile;
  /** La tuile de près si elle est prête ; sinon `null`, et elle entre dans la file. */
  near(index: number): Tile | null;
  /** Vide la file (les tuiles qui ne sont plus voulues). */
  clearQueue(): void;
  /** Fait la première tuile de la file ; rend son rang, ou `null` si la file est vide. */
  pump(): number | null;
  /** Combien de tuiles attendent. */
  pending(): number;
}

export function createTileStore(field: HeightField, nearKept = NEAR_TILES_KEPT): TileStore {
  const kept: Record<TileDetail, Map<number, Tile>> = { near: new Map(), far: new Map() };
  const queue = new Set<number>();
  const make = (index: number, detail: TileDetail): Tile => {
    const tx = index % TERRAIN.tilesX;
    const tz = Math.floor(index / TERRAIN.tilesX);
    const facets = tileFacets(field, tx, tz, detail);
    const r = tileRect(tx, tz);
    const b = facets.triangles ? boundsOf(facets) : { min: [r.minX, 0, r.minZ] as [number, number, number], max: [r.maxX, 0, r.maxZ] as [number, number, number] };
    return { facets, min: b.min, max: b.max };
  };
  const remember = (index: number, detail: TileDetail, t: Tile) => {
    const map = kept[detail];
    map.delete(index);
    map.set(index, t);
    // On oublie d'abord les tuiles de près qu'on n'a pas revues depuis longtemps.
    if (detail === 'near' && map.size > nearKept) map.delete(map.keys().next().value!);
    return t;
  };
  const build = (index: number, detail: TileDetail): Tile => {
    const t = kept[detail].get(index);
    queue.delete(index);
    return remember(index, detail, t ?? make(index, detail));
  };
  return {
    build,
    near: (index) => {
      const t = kept.near.get(index);
      if (t) return remember(index, 'near', t);
      queue.add(index);
      return null;
    },
    clearQueue: () => queue.clear(),
    pump: () => {
      const next = queue.values().next();
      if (next.done) return null;
      build(next.value, 'near');
      return next.value;
    },
    pending: () => queue.size,
  };
}

// La réserve des tuiles du terrain (./terrain.ts, et ce qui y pousse, ./flora.ts) pour la vue : faites à la demande et gardées. De loin, toutes gardées
// (elles sont légères, et faites tout de suite) ; de près, les plus récentes seulement, et jamais plus d'une par image :
// une tuile de près qui manque attend dans une file (`pump`, une par image), sa version de loin tenant sa place
// jusque-là. Ainsi, franchir un anneau ne fait jamais une longue tâche (relecture de l'expert frontend). Depuis la
// reprise du lot 3, une tuile de la file se fait même en deux images : son sol, puis ce qui y pousse. Code pur.
import { boundsOf, mergeFacets, type Facets } from './facets';
import { TERRAIN } from './plan6e';
import { landTileFacets, landTileFlora, landTileGround } from './flora';
import { tileRect, type HeightField, type TileDetail } from './terrain';

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
  /**
   * Avance la file d'un temps : le sol de la première tuile, ou ce qui pousse sur celle dont le sol est fait ; rend le
   * rang de la tuile finie, ou `null` (la file est vide, ou seul un sol vient d'être fait).
   */
  pump(): number | null;
  /** Combien de tuiles attendent. */
  pending(): number;
}

export function createTileStore(field: HeightField, nearKept = NEAR_TILES_KEPT): TileStore {
  const kept: Record<TileDetail, Map<number, Tile>> = { near: new Map(), far: new Map() };
  const queue = new Set<number>();
  // La tuile dont le sol est fait, en attente de ce qui y pousse (une au plus).
  let half: { index: number; ground: Facets } | null = null;
  const at = (index: number) => [index % TERRAIN.tilesX, Math.floor(index / TERRAIN.tilesX)] as const;
  const make = (index: number, detail: TileDetail, made?: Facets): Tile => {
    const [tx, tz] = at(index);
    const facets = made ?? landTileFacets(field, tx, tz, detail);
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
      if (half) {
        const { index, ground } = half;
        half = null;
        queue.delete(index);
        const [tx, tz] = at(index);
        remember(index, 'near', make(index, 'near', mergeFacets([ground, landTileFlora(field, tx, tz, 'near')])));
        return index;
      }
      const next = queue.values().next();
      if (next.done) return null;
      queue.delete(next.value);
      // Déjà faite entre-temps (un saut) : rien à refaire.
      if (kept.near.has(next.value)) return next.value;
      const [tx, tz] = at(next.value);
      half = { index: next.value, ground: landTileGround(field, tx, tz, 'near') };
      return null;
    },
    pending: () => queue.size + (half ? 1 : 0),
  };
}

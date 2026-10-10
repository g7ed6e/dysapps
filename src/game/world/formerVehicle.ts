// Le Bloc-Navire d'avant la Nef (GD-15, 10 octobre 2026) : les cases de ses trois étapes (clé « x,y,z » du quai de leur
// port, `ORIGINE_DU_QUAI` : bloc). La migration des sauvegardes s'en sert (engine/sanitize.ts) : une étape finie avec
// l'ancien dessin reste finie ; des blocs posés à moitié reviennent dans l'inventaire. Ne pas modifier.
import type { BlockId } from '../biomes';
import { BLOC } from '../biomes';

const AVANT: Record<string, string> = {
  'navire-coque':
    '16,-13,-1:sable 16,-12,-1:sable 16,-11,-1:sable 16,-10,-1:sable 16,-9,-1:sable 16,-8,-1:sable 17,-13,-1:sable 17,-12,-1:sable 17,-11,-1:sable 17,-10,-1:sable 17,-9,-1:sable 17,-8,-1:sable 18,-13,-1:sable 18,-12,-1:sable 18,-11,-1:sable 18,-10,-1:sable 18,-9,-1:sable 18,-8,-1:sable 17,-14,-1:bois 17,-7,-1:bois 15,-13,0:bois 15,-12,0:bois 15,-11,0:bois 15,-10,0:bois 15,-9,0:bois 15,-8,0:bois 19,-13,0:bois 19,-12,0:bois 19,-11,0:bois 19,-10,0:bois 19,-9,0:bois 19,-8,0:bois 16,-8,0:galet 16,-8,1:galet 17,-8,0:galet 17,-8,1:galet 18,-8,0:galet 18,-8,1:galet 15,-14,0:pierre 17,-11,0:bois 17,-11,1:bois 17,-11,2:bois 17,-11,3:bois 17,-11,4:bois 17,-11,5:bois',
  'navire-ballon':
    '16,-10,3:glace 18,-10,3:glace 16,-8,3:glace 18,-8,3:glace 16,-10,4:panneau 16,-9,4:panneau 16,-8,4:panneau 17,-10,4:panneau 17,-9,4:panneau 17,-8,4:panneau 18,-10,4:panneau 18,-9,4:panneau 18,-8,4:panneau 15,-10,5:toile 15,-9,5:toile 15,-8,5:toile 16,-11,5:toile 16,-10,5:toile 16,-9,5:toile 16,-8,5:toile 16,-7,5:toile 17,-11,5:toile 17,-10,5:toile 17,-9,5:toile 17,-8,5:toile 17,-7,5:toile 18,-11,5:toile 18,-10,5:toile 18,-9,5:toile 18,-8,5:toile 18,-7,5:toile 19,-10,5:toile 19,-9,5:toile 19,-8,5:toile',
  'navire-reacteur':
    '15,-11,-8:calque 19,-11,-8:calque 15,-10,-8:calque 19,-10,-8:calque 16,-11,-9:ardoise 18,-11,-9:ardoise 17,-9,-9:ardoise 16,-13,-8:acier 16,-12,-8:acier 16,-11,-8:acier 16,-10,-8:acier 16,-9,-8:acier 16,-8,-8:acier 17,-13,-8:acier 17,-12,-8:acier 17,-11,-8:acier 17,-10,-8:acier 17,-9,-8:acier 17,-8,-8:acier 18,-13,-8:acier 18,-12,-8:acier 18,-11,-8:acier 18,-10,-8:acier 18,-9,-8:acier 18,-8,-8:acier',
};

const cache = new Map<string, Map<string, BlockId>>();
/** Les cases d'une étape du Bloc-Navire d'avant la Nef, ou `undefined`. */
export function formerVehicleStage(id: string): Map<string, BlockId> | undefined {
  const raw = AVANT[id];
  if (!raw) return undefined;
  let v = cache.get(id);
  if (!v) {
    v = new Map(
      raw.split(' ').map((c): [string, BlockId] => {
        const [key, word] = c.split(':');
        return [key, BLOC[word as keyof typeof BLOC]];
      }),
    );
    cache.set(id, v);
  }
  return v;
}

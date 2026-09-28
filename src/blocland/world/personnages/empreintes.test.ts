// Le filet des personnages en facettes (lot R6) : une empreinte du bonhomme et de chaque créature (sommets, normales,
// couleurs, pièces et teintes, table des pièces). Un changement de modèle voulu les régénère avec
// `npx vitest run -u src/blocland/world/personnages/empreintes.test.ts` et le dit dans sa pull request ; ailleurs,
// elles ne doivent pas bouger.
import { BIOMES } from '../../biomes';
import { bonhommePeint } from './bonhomme';
import { creaturePeinte } from './creaturesPeintes';
import type { FacettesDePersonnage } from './peint';

/** FNV-1a sur 32 bits : une empreinte courte et stable d'un texte. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** Empreinte d'un personnage : ses tableaux arrondis au dix-millième (l'image ne bouge pas en deçà), et sa table. */
function empreinte(f: FacettesDePersonnage): string {
  const arrondi = (a: Float32Array) => Array.from(a, (x) => Math.round(x * 1e4)).join(',');
  return fnv([arrondi(f.positions), arrondi(f.normals), arrondi(f.colors), f.pieces.join(','), f.teintes.join(','), JSON.stringify(f.table), JSON.stringify(f.palette)].join('|'));
}

describe('Empreintes des personnages en facettes', () => {
  it('le bonhomme', () => {
    expect({ triangles: bonhommePeint().pieces.length, empreinte: empreinte(bonhommePeint()) }).toMatchSnapshot();
  });

  it('les créatures, île par île', () => {
    const toutes = Object.fromEntries(BIOMES.map((b) => [b.id, `${creaturePeinte(b.id).pieces.length} ${empreinte(creaturePeinte(b.id))}`]));
    expect(toutes).toMatchSnapshot();
  });
});

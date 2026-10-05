// Le filet des personnages en facettes (lot R6) : une empreinte du bonhomme, de chaque créature et de chaque sentinelle (sommets, normales,
// couleurs, pièces et teintes, table des pièces). Un changement de modèle voulu les régénère avec
// `npx vitest run -u src/blocland/world/personnages/empreintes.test.ts` et le dit dans sa pull request ; ailleurs,
// elles ne doivent pas bouger.
import { BIOMES } from '../../biomes';
import { toutConstruit } from '../budget';
import { ARCHIPELAGO_IDS } from '../map';
import { creaturePlacements, guardianPlacements } from '../terrain';
import { bonhommePeint } from './bonhomme';
import { creaturePeinte } from './creaturesPeintes';
import { fusionDesCreatures, fusionDesGardiens, fusionDuBonhomme, trianglesDeLaFusion, type Fusion } from './fusions';
import type { FacettesDePersonnage } from './peint';
import { sentinellePeinte } from './sentinellesPeintes';
import { texteDAvant, versLesIdsDAvant } from '../idsDAvant.testing';

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

/** Empreinte d'une fusion : ses tableaux arrondis au dix-millième, ses os (ou ses lueurs) et ses plages. */
function empreinteDeFusion(f: Fusion, extra: ArrayLike<number>): string {
  const arrondi = (a: Float32Array) => Array.from(a, (x) => Math.round(x * 1e4)).join(',');
  return `${trianglesDeLaFusion(f)} ${fnv([arrondi(f.positions), arrondi(f.normals), arrondi(f.colors), Array.from(extra).join(','), JSON.stringify(versLesIdsDAvant(f.plages))].join('|'))}`;
}

/** Une île sous son identifiant d'avant les mots neutres (../idsDAvant.testing.ts) : les empreintes n'en dépendent pas. */
const ile = (id: string) => texteDAvant(id);

describe('Empreintes des personnages en facettes', () => {
  it('le bonhomme', () => {
    expect({ triangles: bonhommePeint().pieces.length, empreinte: empreinte(bonhommePeint()) }).toMatchSnapshot();
  });

  it('les créatures, île par île', () => {
    const toutes = Object.fromEntries(BIOMES.map((b) => [ile(b.id), `${creaturePeinte(b.id).pieces.length} ${empreinte(creaturePeinte(b.id))}`]));
    expect(toutes).toMatchSnapshot();
  });

  it('les sentinelles, île par île (éteintes)', () => {
    const toutes = Object.fromEntries(BIOMES.map((b) => [ile(b.id), `${sentinellePeinte(b.id).pieces.length} ${empreinte(sentinellePeinte(b.id))}`]));
    expect(toutes).toMatchSnapshot();
  });

  it('les fusions, archipel par archipel (tout construit)', () => {
    const { progress, world: village } = toutConstruit();
    const toutes = Object.fromEntries(
      ARCHIPELAGO_IDS.map((a) => {
        const c = fusionDesCreatures(creaturePlacements(a, village.links));
        const g = fusionDesGardiens(guardianPlacements(a, progress, village.links));
        return [a, { creatures: `${empreinteDeFusion(c, c.os)} ${fnv(JSON.stringify(versLesIdsDAvant(c.squelette)))}`, gardiens: empreinteDeFusion(g, g.lueur) }];
      }),
    );
    const b = fusionDuBonhomme();
    expect({ ...toutes, bonhomme: `${empreinteDeFusion(b, b.os)} ${fnv(JSON.stringify(b.squelette))}` }).toMatchSnapshot();
  });

});

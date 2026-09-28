// Le filet du rendu Archipéo (lot S, le socle de la piste Rendu, docs/conception/cadrage-archipeo.md §6) : une empreinte,
// archipel par archipel, de ce que le rendu calcule sans Three.js et que la grille (./empreintes.test.ts) ne voit pas :
// le relief de chaque île, le décor en primitives et l'ambiance (ciel, lumière, surfaces, eaux). Chaque sous-lot de R4b
// ne change que les empreintes de son archipel ; il les régénère avec
// `npx vitest run -u src/blocland/world/empreintesDuRendu.test.ts` et le dit dans sa pull request. Un lot sans changement
// d'image (le socle, la découpe de la scène) les laisse telles quelles.
import { ARCHIPELAGO_IDS, landscape, mapOf, type ArchipelagoId, type Ground } from './map';
import { toutConstruit } from './budget';
import { champDuSol } from './landMesh';
import { modelerLeSol } from './modeleDessine';
import { maillageDuDecor, rangerLeDecor, type FacettesDuDecor } from './decorMesh';
import { cielDe, couleurDeMatiere, couleurDuSol, eauxDe, MATIERES, SOLS } from './palette';
import type { TextureKind } from './pixels';
import { worldCubes } from './terrain';

/** FNV-1a sur 32 bits, comme ./empreintes.test.ts. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const empreinte = (v: unknown) => fnv(JSON.stringify(v));

/** Tableaux typés arrondis au dix-millième (l'image ne bouge pas en deçà). */
const empreinteDuDecor = (f: FacettesDuDecor) =>
  fnv([f.positions, f.normals, f.colors].map((a) => Array.from(a, (x) => Math.round(x * 1e4)).join(',')).join('|') + '|' + f.elements.join(','));

function empreintesDuRendu(a: ArchipelagoId): Record<string, string> {
  const { progress, village } = toutConstruit();
  const cubes = worldCubes(a, progress, village, false);
  const { elements, reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
  // Le sol tel qu'Archipéo le dessine : le relief de marche, puis le modelé dessiné (U2).
  const sol = modelerLeSol(a, cubes.filter((c) => c.sol), reste);
  const champ = champDuSol(a, sol, reste);
  const decor = maillageDuDecor(a, champ, elements);
  const aplat = maillageDuDecor(a, champ, elements, { style: 'a' });
  return {
    relief: empreinte(mapOf(a).map((d) => [d.id, landscape(d)])),
    'modelé dessiné': empreinte(champ.colonnes.map((c) => [c.x, c.y, c.haut])),
    'décor (primitives)': empreinteDuDecor(decor.decor),
    'décor (lueurs)': empreinteDuDecor(decor.lueurs),
    'décor (style a)': empreinteDuDecor(aplat.decor),
    ambiance: empreinte({
      ciel: [0, 0.5, 1].map((l) => cielDe(a, l)),
      eaux: eauxDe(a),
      sols: (Object.keys(SOLS) as Ground[]).map((g) => [couleurDuSol(a, g, 1), couleurDuSol(a, g, 0)]),
      matieres: (Object.keys(MATIERES) as TextureKind[]).map((m) => [couleurDeMatiere(a, m, 1), couleurDeMatiere(a, m, 0)]),
    }),
  };
}

describe('Empreintes du rendu Archipéo, par archipel (filet du socle)', () => {
  for (const a of ARCHIPELAGO_IDS) {
    it(a, () => {
      expect(empreintesDuRendu(a)).toMatchSnapshot();
    });
  }
});

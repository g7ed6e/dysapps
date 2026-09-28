// Les silhouettes des créatures (lot R6, relecture du directeur artistique du 28/09) : à distance, en noir, deux
// habitants d'un même archipel ne se confondent pas. Chaque créature est projetée à 40 pixels de haut pour le gabarit
// standard (le trapu en fait 35, l'élancé 45 : le gabarit compte), de face et de trois quarts des deux côtés, les pieds
// au même endroit ; deux à deux, leur recouvrement (intersection sur union) reste sous `SEUIL`.
//
// Pourquoi 0,88 : à 40 pixels, une créature couvre 300 à 400 pixels ; un recouvrement sous 0,88 laisse au moins 12 %
// de l'union qui diffère, soit une quarantaine de pixels, l'aire d'une tête (un hexagone d'environ 8 × 8 pixels) ou d'une
// signature franche (queue, carapace, cornes, élytres, outil). Au premier dessin, les créatures du gabarit unique
// allaient jusqu'à 0,96 (Rouxel et Tick) ; les gabarits et les signatures les ramènent sous 0,87.
import { BIOMES, type BiomeId } from '../../biomes';
import { ARCHIPELAGO_IDS } from '../archipels';
import { creaturePeinte, ESPECES } from './creaturesPeintes';
import { projeter, recouvrement } from './projection';

const SEUIL = 0.88;
const VUES = [
  { nom: 'de face', angle: 0 },
  { nom: 'de trois quarts, côté outil', angle: -0.6 },
  { nom: 'de trois quarts, côté main gauche', angle: 0.6 },
];

describe('Les silhouettes des créatures, archipel par archipel', () => {
  for (const a of ARCHIPELAGO_IDS)
    describe(a, () => {
      const ids: BiomeId[] = BIOMES.filter((b) => b.classe === a).map((b) => b.id);
      for (const v of VUES)
        it(`deux à deux, elles diffèrent en noir à 40 pixels, ${v.nom} (recouvrement sous ${SEUIL})`, () => {
          const p = ids.map((id) => projeter(creaturePeinte(id), { angle: v.angle }));
          for (let i = 0; i < ids.length; i++)
            for (let j = i + 1; j < ids.length; j++) expect(recouvrement(p[i], p[j]), `${ESPECES[ids[i]].nom} et ${ESPECES[ids[j]].nom}`).toBeLessThan(SEUIL);
        });
    });

  it('la projection voit ce qu’elle doit voir : une créature se recouvre toute, deux gabarits différents non', () => {
    const tunel = projeter(creaturePeinte('mine'));
    expect(recouvrement(tunel, projeter(creaturePeinte('mine')))).toBe(1);
    // Le gabarit standard fait 40 pixels de haut (outil à part : la perche de Nénu dépasse).
    const lignes = (id: BiomeId) => {
      const p = projeter(creaturePeinte(id));
      const pleines = new Set<number>();
      p.triangle.forEach((t, k) => t >= 0 && pleines.add(Math.floor(k / p.largeur)));
      return pleines.size;
    };
    expect(lignes('volcan')).toBeGreaterThanOrEqual(38);
    expect(lignes('volcan')).toBeLessThanOrEqual(42);
    expect(lignes('mine')).toBeLessThan(lignes('volcan'));
  });
});

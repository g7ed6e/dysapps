// Le mode « Aménager » dans la vue simple (GD-9, point 4) : une ligne par lieu et par Gardien de la région du bonhomme,
// sa place dite en mots ; « Déplacer » le choisit, puis les flèches nommées et « Poser ici » de la barre du mode le
// posent. L'ordre de la liste est celui des lieux de la région, jamais celui de la disposition : une carte aménagée ne
// déplace pas les lignes. Pas de geste ici (rien ne se dessine) : la pose est immédiate, avec son son.
import { useState } from 'react';
import { frenchTypography } from '../components/math/RichText';
import { Icon } from '../components/Icon';
import { useSettings } from '../core/SettingsContext';
import { ArrangeBar, ArrangeButton, ArrangeSentence, useAmenagement } from './Arranging';
import { getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { habillageDuMonde } from './skin';
import { islandsOf } from './world/archipelago';
import type { ArchipelagoId } from './world/archipelagos';
import { isFixedPlace } from './world/arrange';
import { guardianSentence, placeSentence } from './world/placeSentence';

const nomDuLieu = (id: BiomeId) => getBiome(id)?.name ?? id;

/** La vue simple n'a pas de monde : aucun toucher ne vient d'une case. */
const sansMonde = () => ({ x: 0, y: 0, z: 0 });

/** Aménager la région `a` en liste. */
export function ArrangeList({ a }: { a: ArchipelagoId }) {
  const { state, arrange } = useBlocland();
  const { settings, speak } = useSettings();
  const [habillage] = useState(habillageDuMonde);
  const amenagement = useAmenagement({
    world: state.world,
    a,
    arrange,
    nom: nomDuLieu,
    // Rien ne se dessine en liste : la pose se fait d'un coup.
    reduceMotion: true,
    habillage,
    sons: settings.sounds,
    dire: (texte) => {
      if (settings.autoRead) speak(frenchTypography(texte));
    },
    versMonde: sansMonde,
  });
  const { choix } = amenagement;
  const choisi = (genre: 'lieu' | 'gardien', id: BiomeId) => choix?.genre === genre && choix.id === id;
  return (
    <section className="panel arrange-list" aria-labelledby={`amenager-${a}`}>
      <h2 id={`amenager-${a}`} className="section-title">
        <Icon name="amenager" /> Aménager la carte
      </h2>
      <p className="section-intro">Chacun range sa carte à sa façon : « Déplacer », puis les flèches et « Poser ici ». Rien n’est perdu.</p>
      <ArrangeButton amenagement={amenagement} />
      <ArrangeSentence amenagement={amenagement} nom={nomDuLieu} />
      {amenagement.ouvert && (
        <>
          <ul className="arrange-list-items">
            {islandsOf(a).flatMap((b) => {
              const fixe = isFixedPlace(b.id);
              return [
                <li key={b.id} className={choisi('lieu', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <strong>{b.name}</strong> : {fixe ? 'le point de départ de la région, il ne bouge pas.' : `${placeSentence(state.world, b.id, undefined, nomDuLieu)}.`}
                  </p>
                  {!fixe && (
                    <button type="button" className="button" aria-pressed={choisi('lieu', b.id)} aria-label={`Déplacer ${b.name}`} onClick={() => amenagement.intention({ genre: 'ile', id: b.id })}>
                      <Icon name="amenager" /> Déplacer
                    </button>
                  )}
                </li>,
                <li key={`${b.id}-gardien`} className={choisi('gardien', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <strong>Le Gardien de {b.name}</strong> : {guardianSentence(state.world, b.id)}.
                  </p>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={choisi('gardien', b.id)}
                    aria-label={`Déplacer le Gardien de ${b.name}`}
                    onClick={() => amenagement.intention({ genre: 'creature', id: b.id, gardien: true })}
                  >
                    <Icon name="amenager" /> Déplacer
                  </button>
                </li>,
              ];
            })}
          </ul>
          <ArrangeBar amenagement={amenagement} className="arrange-bar-inline" />
        </>
      )}
    </section>
  );
}

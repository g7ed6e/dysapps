// Le mode « Aménager » dans la vue simple (GD-9, point 4) : une ligne par lieu et par Gardien de la région du bonhomme,
// sa place dite en mots ; « Déplacer » le choisit, puis les flèches nommées et « Poser ici » de la barre du mode le
// posent. Sous chaque lieu, dans un pli, une ligne par borne et par arrivée de ses liaisons, qui se déplacent de même.
// « Réunir » est proposé sur la ligne d'un lieu qui a un voisin ouvert à la bonne distance (GD-9, point 10). L'ordre de
// la liste est celui des lieux de la région, jamais celui de la disposition : une carte aménagée ne déplace pas les
// lignes. Pas de geste ici (rien ne se dessine) : la pose est immédiate, avec son son.
import { thePlace, toPlace } from './world/placeArticle';
import { useEffect, useRef, useState } from 'react';
import { frenchTypography } from '../components/math/RichText';
import { Icon } from '../components/Icon';
import { useSettings } from '../core/SettingsContext';
import { useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeJoinQuestion, ArrangeSentence } from './ArrangeBar';
import { getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { habillageDuMonde } from './skin';
import { getBridge, islandsOf } from './world/archipelago';
import type { ArchipelagoId } from './world/archipelagos';
import { currentLandings, isFixedPlace, joinedWith, routesIn } from './world/arrange';
import { type ArrangeChoice, chooseStation, choiceSentence } from './world/arrangeMode';
import { guardianSentence, ofPlace, placeSentence } from './world/placeSentence';
import type { LinkPhrases } from './world/linkWord';
import { startingStations } from './world/terrain/markers';
import type { World } from './engine/state';
import { useTextes } from '../universes';

const nomDuLieu = (id: BiomeId) => getBiome(id)?.name ?? id;

/** La vue simple n'a pas de monde : aucun toucher ne vient d'une case. */
const sansMonde = () => ({ x: 0, y: 0, z: 0 });

/** Les bornes et les arrivées d'un lieu, chacune son choix et son nom, dans l'ordre de ses missions puis de ses liaisons. */
function sesElements(world: World, id: BiomeId, a: ArchipelagoId, mot: LinkPhrases): { cle: string; nom: string; choix: ArrangeChoice }[] {
  const out: { cle: string; nom: string; choix: ArrangeChoice }[] = [];
  const biome = getBiome(id);
  for (const st of startingStations(id)) {
    const c = chooseStation(world, `${id}:${st.typeId}`);
    const titre = biome?.exercises.find((e) => e.id === st.typeId)?.title ?? st.typeId;
    if (c) out.push({ cle: `borne-${st.typeId}`, nom: `La borne « ${titre} »`, choix: c });
  }
  for (const [link, t] of routesIn(world, a)) {
    const b = getBridge(link);
    if (!t || !b || (b.from !== id && b.to !== id)) continue;
    const l = currentLandings(world, link);
    if (!l) continue;
    const end = b.from === id ? 'from' : 'to';
    const autre = end === 'from' ? b.to : b.from;
    out.push({ cle: `arrivee-${link}`, nom: `L’arrivée de ${mot.le} vers ${thePlace(nomDuLieu(autre))}`, choix: { genre: 'arrivee', link, end, landing: l[end] } });
  }
  return out;
}

/** Deux choix sont-ils le même élément (la même borne, la même arrivée) ? */
function memeElement(p: ArrangeChoice | null, q: ArrangeChoice): boolean {
  if (!p || p.genre !== q.genre) return false;
  if (p.genre === 'borne' && q.genre === 'borne') return p.key === q.key;
  if (p.genre === 'arrivee' && q.genre === 'arrivee') return p.link === q.link && p.end === q.end;
  return false;
}

/**
 * Aménager la région `a` en liste. `enPanneau` : dans le panneau « Aménager la carte » du monde (au téléphone en grand
 * texte) ; le mode s'y ouvre tout de suite, sans titre (le panneau a le sien), et ✓ Terminé appelle `onFin`.
 */
export function ArrangeList({ a, enPanneau = false, onFin }: { a: ArchipelagoId; enPanneau?: boolean; onFin?: () => void }) {
  const { state, arrange } = useBlocland();
  const { settings, speak } = useSettings();
  const textes = useTextes();
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
    reunion: textes.reunion,
    liaisons: textes.liaisons,
  });
  const { choix } = amenagement;
  // Dans le panneau : le mode ouvert dès l'arrivée (la liste des ouvrages à reposer d'abord, s'il y en a).
  const ouvert = useRef(false);
  useEffect(() => {
    if (!enPanneau) return;
    if (amenagement.ouvert) ouvert.current = true;
    else if (!ouvert.current) {
      ouvert.current = true;
      if (amenagement.aReposer.length) amenagement.ouvrirLaListe();
      else amenagement.ouvrir();
    } else onFin?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enPanneau, amenagement.ouvert]);
  const choisi = (genre: 'lieu' | 'gardien', id: BiomeId) => choix?.genre === genre && choix.id === id;
  return (
    <section className={enPanneau ? 'arrange-list arrange-list-panneau' : 'panel arrange-list'} aria-labelledby={enPanneau ? undefined : `amenager-${a}`}>
      {!enPanneau && (
        <h2 id={`amenager-${a}`} className="section-title">
          <Icon name="amenager" /> Aménager la carte
        </h2>
      )}
      <p className="section-intro">Chacun range sa carte à sa façon : « Déplacer », puis les flèches et « Poser ici ». Rien n’est perdu.</p>
      {!enPanneau && <ArrangeButton amenagement={amenagement} />}
      <ArrangeSentence amenagement={amenagement} nom={nomDuLieu} questionAilleurs />
      {amenagement.ouvert && (
        <>
          <ul className="arrange-list-items">
            {islandsOf(a).flatMap((b) => {
              const fixe = isFixedPlace(b.id);
              const reuni = joinedWith(state.world, b.id);
              const voisin = amenagement.voisinAReunir(b.id);
              const elements = sesElements(state.world, b.id, a, amenagement.mot);
              return [
                <li key={b.id} className={choisi('lieu', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <strong>{b.name}</strong>
                    {choisi('lieu', b.id) && <span className="arrange-list-mark"> (choisi)</span>} : {fixe ? 'le point de départ de la région, il ne bouge pas.' : `${placeSentence(state.world, b.id, undefined, nomDuLieu)}.`}
                    {reuni && ` Réuni ${toPlace(nomDuLieu(reuni))} : ils bougent ensemble.`}
                  </p>
                  {!fixe && (
                    <button type="button" className="button" aria-pressed={choisi('lieu', b.id)} aria-label={`Déplacer ${b.name}`} onClick={() => amenagement.intention({ genre: 'ile', id: b.id })}>
                      <Icon name="amenager" /> Déplacer
                    </button>
                  )}
                  {voisin && (
                    <button type="button" className="button" aria-pressed={amenagement.question?.id === b.id} aria-label={`Réunir ${b.name}…`} onClick={() => amenagement.demanderReunion(b.id)}>
                      <Icon name="reunir" /> Réunir
                    </button>
                  )}
                  {amenagement.question?.id === b.id && <ArrangeJoinQuestion amenagement={amenagement} nom={nomDuLieu} />}
                  {elements.length > 0 && (
                    <details className="sheet-more arrange-list-more">
                      <summary>Ses bornes et ses arrivées</summary>
                      <ul className="arrange-list-sub">
                        {elements.map((e) => (
                          <li key={e.cle} className={memeElement(choix, e.choix) ? 'arrange-list-chosen' : undefined}>
                            <p>
                              <strong>{e.nom}</strong> : {choiceSentence(state.world, e.choix, nomDuLieu, amenagement.mot)}
                            </p>
                            <button type="button" className="button" aria-pressed={memeElement(choix, e.choix)} aria-label={`Déplacer ${e.nom.charAt(0).toLowerCase()}${e.nom.slice(1)}`} onClick={() => amenagement.choisirDirect(e.choix)}>
                              <Icon name="amenager" /> Déplacer
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>,
                <li key={`${b.id}-gardien`} className={choisi('gardien', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <strong>Le Gardien {ofPlace(b.name)}</strong>
                    {choisi('gardien', b.id) && <span className="arrange-list-mark"> (choisi)</span>} : {guardianSentence(state.world, b.id)}.
                  </p>
                  <button
                    type="button"
                    className="button"
                    aria-pressed={choisi('gardien', b.id)}
                    aria-label={`Déplacer le Gardien ${ofPlace(b.name)}`}
                    onClick={() => amenagement.intention({ genre: 'creature', id: b.id, gardien: true })}
                  >
                    <Icon name="amenager" /> Déplacer
                  </button>
                </li>,
              ];
            })}
          </ul>
          <ArrangeBar amenagement={amenagement} className="arrange-bar-inline" pli={false} />
        </>
      )}
    </section>
  );
}

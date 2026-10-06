// Le mode « Aménager » dans la vue simple (GD-9, point 4) : une ligne par lieu et par Gardien de la région du bonhomme,
// sa place en signes, la même ligne que sur la Carte (piste A : le voisin, la flèche, le nombre, la case ; pour un
// Gardien, son île pour repère ; dite en mots aux lecteurs d'écran), sans phrase ;
// « Déplacer » (quatre flèches) le choisit, puis les flèches et « Poser » de la barre du mode le posent ; « Valider » ou
// « Annuler » ferment le mode, comme sur la Carte (décision du mainteneur, 6 octobre 2026). Sous chaque
// lieu, dans un pli, une ligne par borne et par arrivée de ses liaisons, qui se déplacent de même.
// « Réunir » est proposé sur la ligne d'un lieu qui a un voisin ouvert à la bonne distance (GD-9, point 10). L'ordre de
// la liste est celui des lieux de la région, jamais celui de la disposition : une carte aménagée ne déplace pas les
// lignes. Pas de geste ici (rien ne se dessine) : la pose est immédiate, avec son son.
import { useEffect, useRef, useState } from 'react';
import { frenchTypography } from '../components/math/RichText';
import { Icon, IconButton } from '../components/Icon';
import { useSettings } from '../core/SettingsContext';
import { useAmenagement } from './Arranging';
import { ArrangeBar, ArrangeButton, ArrangeJoinQuestion, ArrangeSentence, MODIFIER_LE_PLAN, PlaceSignsLine } from './ArrangeBar';
import { getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { habillageDuMonde } from './skin';
import { getBridge, islandsOf } from './world/archipelago';
import type { ArchipelagoId } from './world/archipelagos';
import { currentLandings, isFixedPlace, joinedWith, routesIn } from './world/arrange';
import { type ArrangeChoice, chooseStation, choiceSentence } from './world/arrangeMode';
import { agreeWithPlace, thePlace, toPlace } from './world/placeArticle';
import { guardianSigns, ofPlace, placeSigns, placeSignsSentence } from './world/placeSentence';
import type { LinkPhrases } from './world/linkWord';
import { startingStations } from './world/terrain/markers';
import type { World } from './engine/state';
import { useTextes } from '../universes';

const nomDuLieu = (id: BiomeId) => getBiome(id)?.name ?? id;

/** « à la Mine des lettres » : le nom d'un lieu après « réuni ». */
const toPlaceName = (id: BiomeId) => toPlace(nomDuLieu(id));

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
 * Aménager la région `a` en liste. `enPanneau` : dans le panneau « Modifier le plan » du monde (au téléphone en grand
 * texte) ; le mode s'y ouvre tout de suite, sans titre (le panneau a le sien), et « Valider » ou « Annuler » appellent
 * `onFin`. Hors du panneau, « Modifier le plan » l'ouvre. Les lieux se suivent sans phrase d'introduction : chaque ligne
 * dit sa place en signes.
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
    // Dans le panneau, Échap le ferme (après la question ouverte).
    fermerLePanneau: enPanneau ? onFin : undefined,
  });
  const { choix } = amenagement;
  // Dans le panneau : le mode ouvert dès l'arrivée (la liste des ouvrages à reposer d'abord, s'il y en a) ; « Valider »
  // ou « Annuler » (le mode qui se ferme après avoir été ouvert) ferment le panneau. Un effet rejoué (mode strict) ne le ferme pas.
  const etaitOuvert = useRef(false);
  useEffect(() => {
    if (!enPanneau) return;
    if (amenagement.ouvert) etaitOuvert.current = true;
    else if (etaitOuvert.current) onFin?.();
    else if (amenagement.aReposer.length) amenagement.ouvrirLaListe();
    else amenagement.ouvrir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enPanneau, amenagement.ouvert]);
  const choisi = (genre: 'lieu' | 'gardien', id: BiomeId) => choix?.genre === genre && choix.id === id;
  // Dans le panneau, à chaque nouveau choix : il défile jusqu'au début de la ligne choisie, son nom juste sous le titre
  // (qui reste en haut) ; rien de choisi, il revient en haut. Les flèches, qui gardent le même choix, ne le font pas
  // bouger.
  const section = useRef<HTMLElement>(null);
  const cleDuChoix = choix?.genre === 'lieu' || choix?.genre === 'gardien' ? `${choix.genre}:${choix.id}` : choix ? 'autre' : '';
  useEffect(() => {
    if (!enPanneau || cleDuChoix === 'autre') return;
    const panneau = section.current?.closest<HTMLElement>('.island-sheet');
    if (!panneau) return;
    const ligne = cleDuChoix ? section.current?.querySelector<HTMLElement>('.arrange-list-items > .arrange-list-chosen') : null;
    if (!ligne) {
      panneau.scrollTop = 0;
      return;
    }
    const titre = panneau.querySelector<HTMLElement>('.island-sheet-head')?.getBoundingClientRect().height ?? 0;
    panneau.scrollTop += ligne.getBoundingClientRect().top - panneau.getBoundingClientRect().top - panneau.clientTop - titre - 8;
  }, [enPanneau, cleDuChoix]);
  return (
    <section ref={section} className={enPanneau ? 'arrange-list arrange-list-panneau' : 'panel arrange-list'} aria-labelledby={enPanneau ? undefined : `amenager-${a}`}>
      {!enPanneau && (
        <h2 id={`amenager-${a}`} className="section-title">
          <Icon name="amenager" /> {MODIFIER_LE_PLAN}
        </h2>
      )}
      {!enPanneau && !amenagement.ouvert && <ArrangeButton amenagement={amenagement} />}
      <ArrangeSentence amenagement={amenagement} nom={nomDuLieu} questionAilleurs />
      {amenagement.ouvert && (
        <>
          <ul className="arrange-list-items">
            {islandsOf(a).flatMap((b) => {
              const fixe = isFixedPlace(b.id);
              const reuni = joinedWith(state.world, b.id);
              const voisin = amenagement.voisinAReunir(b.id);
              const elements = sesElements(state.world, b.id, a, amenagement.mot);
              const signes = fixe ? null : placeSigns(state.world, b.id, undefined, nomDuLieu);
              // Son Gardien, dans la même ligne de signes : son île pour repère, la flèche, l'écart.
              const gardien = guardianSigns(state.world, b.id, undefined, nomDuLieu);
              // Ce que la ligne dit en mots (lecteurs d'écran) : sa place, ou qu'il est le point de départ ; réuni, à qui.
              const lu = `${b.name} : ${fixe ? 'le point de départ de la région, il ne bouge pas' : signes ? placeSignsSentence(signes) : ''}.${reuni ? ` ${agreeWithPlace(b.name, 'Réuni')} ${toPlaceName(reuni)}.` : ''}`;
              return [
                <li key={b.id} className={choisi('lieu', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <span className="visually-hidden">{lu}</span>
                    <span aria-hidden="true">
                      <strong>{b.name}</strong>
                      {choisi('lieu', b.id) && (
                        <>
                          {' '}
                          <Icon name="check" />
                        </>
                      )}{' '}
                      {fixe ? (
                        <span className="signe">
                          <Icon name="flag" />
                          <Icon name="lock" />
                        </span>
                      ) : (
                        signes && <PlaceSignsLine signes={signes} />
                      )}
                      {reuni && (
                        <>
                          {' '}
                          <span className="signe">
                            <Icon name="reunir" />
                          </span>{' '}
                          {nomDuLieu(reuni)}
                        </>
                      )}
                    </span>
                  </p>
                  {!fixe && (
                    <IconButton icone="amenager" nom={`Déplacer ${b.name}`} mot="Déplacer" aria-pressed={choisi('lieu', b.id)} onClick={() => amenagement.intention({ genre: 'ile', id: b.id })} />
                  )}
                  {voisin && (
                    <IconButton icone="reunir" nom={`Réunir ${b.name}…`} mot="Réunir" aria-pressed={amenagement.question?.id === b.id} onClick={() => amenagement.demanderReunion(b.id)} />
                  )}
                  {amenagement.question?.id === b.id && <ArrangeJoinQuestion amenagement={amenagement} nom={nomDuLieu} />}
                  {elements.length > 0 && (
                    <details className="sheet-more arrange-list-more">
                      {/* Ses bornes et ses arrivées, en signes : un drapeau, un ouvrage, et leur nombre. */}
                      <summary aria-label={`Ses bornes et ses arrivées (${elements.length})`}>
                        <Icon name="flag" /> <Icon name="ouvrage" /> {elements.length}
                      </summary>
                      <ul className="arrange-list-sub">
                        {elements.map((e) => (
                          <li key={e.cle} className={memeElement(choix, e.choix) ? 'arrange-list-chosen' : undefined}>
                            {/* Son nom écrit ; où il se tient, dit aux lecteurs d'écran (aucune phrase écrite). */}
                            <p>
                              <strong>{e.nom}</strong>
                              <span className="visually-hidden"> : {choiceSentence(state.world, e.choix, nomDuLieu, amenagement.mot)}</span>
                            </p>
                            <IconButton
                              icone="amenager"
                              nom={`Déplacer ${e.nom.charAt(0).toLowerCase()}${e.nom.slice(1)}`}
                              mot="Déplacer"
                              aria-pressed={memeElement(choix, e.choix)}
                              onClick={() => amenagement.choisirDirect(e.choix)}
                            />
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>,
                <li key={`${b.id}-gardien`} className={choisi('gardien', b.id) ? 'arrange-list-chosen' : undefined}>
                  <p>
                    <span className="visually-hidden">{`Le Gardien ${ofPlace(b.name)} : ${placeSignsSentence(gardien)}.`}</span>
                    <span aria-hidden="true">
                      <Icon name="shield" />
                      {choisi('gardien', b.id) && (
                        <>
                          {' '}
                          <Icon name="check" />
                        </>
                      )}{' '}
                      <PlaceSignsLine signes={gardien} />
                    </span>
                  </p>
                  <IconButton
                    icone="amenager"
                    nom={`Déplacer le Gardien ${ofPlace(b.name)}`}
                    mot="Déplacer"
                    aria-pressed={choisi('gardien', b.id)}
                    onClick={() => amenagement.intention({ genre: 'creature', id: b.id, gardien: true })}
                  />
                </li>,
              ];
            })}
          </ul>
          <ArrangeBar amenagement={amenagement} className="arrange-bar-inline" croix />
        </>
      )}
    </section>
  );
}

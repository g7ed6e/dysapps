// La section « Commandes » (GD-7, PR 3 ; mot neutre : les demandes), au même endroit et nommée pareil dans le panneau
// d'île (un pli entre le prochain objectif et le bâtiment), la page de l'île en vue simple, le menu (sous « À revoir
// aujourd'hui ») et la Carte en vue simple (sous « Prochaine destination »). Proposition du consultant UX UI validée :
// une ligne par commande ouverte de l'archipel, la plus ancienne en tête, avec l'habitant, l'icône et le nom du bloc
// (ceux de Mes blocs), la phrase, un bouton de lecture et UNE action :
// - prête, dans le panneau de l'île de sa créature : « Livrer », au même endroit et de la même forme que « Construire »
//   dans le pli Ouvrages ;
// - prête, ailleurs : « Y aller », qui ouvre l'île de la créature sur sa ligne (comme `?worksite=` pour un ouvrage) ;
// - pas prête : la phrase, précédée du nom de la créature, dit ce qu'il faut faire (et « Tu en as 1 sur 3. »), et
//   « Y aller » mène à l'île qui donne le bloc (ou au lieu où l'on assemble) ; déjà sur cette île, il mène aux missions
//   et le dit (« Tu y es : joue une mission ici. »), sur la ligne (et dans sa lecture) et sous le titre « Missions »,
//   où le panneau défile ; jamais de « Livrer » grisé.
// Le compte est à côté du titre (« Commandes · 1 prête »). Au menu, la section est un pli, ouvert de lui-même quand une
// commande est prête (directeur artistique, 3 octobre 2026). Après « Livrer », la phrase « … posée chez … ! » prend la
// place de la ligne livrée, à la fin de la vague de pose (tout de suite sans vague), et reçoit le focus ; la ligne
// disparaît à la prochaine ouverture.
// Ignorer une commande, c'est ne pas la livrer : ni bouton, ni relance, ni perte, ni délai.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { moinsDAnimations } from '../core/motion';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, blockCount, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { Creature } from './Creatures';
import { Foldable } from './IslandFold';
import { playDone } from './sound';
import { BlockIcon } from './Voxel';
import { useTextes } from '../universes';
import { ASSEMBLAGE_PATH, recetteDe } from './world/assembly';
import { archipelagoOf, isBiomeUnlocked, type ArchipelagoId } from './world/archipelago';
import { COMMANDES, commandeMiseEnAvant, commandesOuvertes, estLivree, estPrete, getCommande, ilesQuiDonnent, texteDeLaCommande, type Commande } from './world/requests';
import { lienDeLaDestination } from './world/destination';

interface Props {
  /**
   * L'île dont c'est le panneau (ou la page en vue simple) : « Livrer » s'y touche pour la commande de sa créature, et
   * la liste est celle de son archipel. Sans île (le menu, la Carte en vue simple) : la liste de l'archipel du
   * bonhomme, et « Y aller » seulement.
   */
  island?: BiomeId;
  /** La section est un pli (la clé change avec l'île, ou `menu`) ; sans clé, elle s'affiche dépliée. */
  fold?: string;
  /** La ligne à mettre en avant (« Y aller » vers une commande : `?worksite=<commande>`). */
  highlight?: string | null;
  /** Le titre de la section : `h3` dans un panneau, `h2` sur une page. */
  niveau?: 'h2' | 'h3';
  className?: string;
  /**
   * Une commande livrée (le panneau d'île en 3D) : la scène pose la petite construction, avec son geste et son son
   * (« clac » et carillon) ; rend `true` si elle prend le son. Sans elle (vue simple), le carillon tout de suite.
   */
  onLivree?: (c: Commande) => boolean;
  /** La commande dont la petite construction est en train de se poser (la vague) : sa phrase attend la fin. */
  poseEnCours?: string | null;
  /**
   * « Y aller » vers une île (le menu du monde 3D) : ouvre son panneau comme un toucher sur l'île, jamais replié ; sans
   * elle, un simple lien.
   */
  onAller?: (island: BiomeId, commande?: string) => void;
  /**
   * « Y aller » touché sur l'île qui donne déjà le bloc : le panneau (ou la page) pose « Tu y es » sous le titre
   * « Missions » (`<YouAreHere />`), là où il défile.
   */
  onAuxMissions?: () => void;
}

/** « Tu y es : joue une mission ici. », sous le titre « Missions » quand « Y aller » d'une commande y amène. */
export function YouAreHere({ dit }: { dit: boolean }) {
  const texte = useTextes().commandes?.tuYEs;
  return (
    <p className={`commande-ici-missions${dit && texte ? '' : ' vide'}`} role="status" aria-live="polite">
      {dit && texte && (
        <>
          <SpeakButton text={texte} compact />
          <span>
            <Syllabified text={texte} />
          </span>
        </>
      )}
    </p>
  );
}

/**
 * « Livrer » une commande prête : les blocs donnés, la petite construction posée par la scène (`onLivree`, qui rend
 * `true` si elle prend le son), sinon le carillon tout de suite. Rend la phrase « … posée chez … ! », ou `null` si la
 * livraison n'a pas pu se faire. La section Commandes et la fiche d'une créature (lot 2 de « Toucher le monde »).
 */
export function livrerLaCommande(
  c: Commande,
  { deliver, onLivree, sons, lieu }: { deliver: (id: string) => { ok: boolean }; onLivree?: (c: Commande) => boolean; sons: boolean; lieu: string },
): string | null {
  if (!deliver(c.id).ok) return null;
  const sonPris = onLivree?.(c) ?? false;
  if (sons && !sonPris) playDone();
  return texteDeLaCommande(c, 'done', lieu);
}

/** Où mène « Y aller » pour une commande pas encore prête : l'île qui donne le bloc, ou le lieu où l'on assemble (`null`). */
function ileDuBloc(c: Commande, links: string[]): BiomeId | null {
  if (recetteDe(c.block)) return null;
  return ilesQuiDonnent(c.block).find((id) => isBiomeUnlocked(id, links)) ?? ilesQuiDonnent(c.block)[0];
}

export function Requests({ island, fold, highlight = null, niveau = 'h3', className, onLivree, poseEnCours = null, onAller, onAuxMissions }: Props) {
  const { state, deliver } = useBlocland();
  const { settings, speak } = useSettings();
  const textes = useTextes();
  // La commande livrée ici : sa phrase, et sa place dans la liste (elle y prend la place de la ligne).
  const [said, setSaid] = useState<{ id: string; index: number; text: string } | null>(null);
  // « Y aller » touché sur l'île qui donne déjà le bloc : la ligne le dit.
  const [ici, setIci] = useState<string | null>(null);
  // La phrase d'une livraison ne suit pas sur une autre île.
  useEffect(() => {
    setSaid(null);
    setIci(null);
  }, [island]);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!highlight) return;
    // Par `dataset`, jamais dans un sélecteur : `highlight` vient de l'adresse (`?worksite=`).
    const lignes = [...(list.current?.querySelectorAll<HTMLElement>('[data-commande]') ?? [])];
    lignes.find((e) => e.dataset.commande === highlight)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, island]);
  // La phrase « posée » : à la fin de la vague (ou tout de suite sans vague), écrite, lue si la lecture est automatique,
  // et le focus dessus (le bouton « Livrer » est parti avec la ligne).
  const posee = said !== null && poseEnCours !== said.id;
  const dite = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!said) return;
    dite.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [said?.id]);
  useEffect(() => {
    if (posee && said && settings.autoRead) speak(frenchTypography(said.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posee, said?.id]);
  const mots = textes.commandes;
  if (!mots) return null;
  const a: ArchipelagoId = archipelagoOf(island ?? state.world.place ?? 'french-6e-phonology').classe;
  const ouvertes = commandesOuvertes(state.world, a);
  if (!ouvertes.length && !said) return null;

  const lieu = textes.assemblage.a;
  const enAvant = commandeMiseEnAvant(state, a);
  const pretes = ouvertes.filter((c) => estPrete(state, c));
  // La phrase de la première fois, tant qu'aucune commande n'a été livrée.
  const premiereFois = !COMMANDES.some((c) => estLivree(state.world, c));
  // Les lignes : les commandes ouvertes, et la commande livrée ici à sa place d'avant.
  const lignes: Commande[] = [...ouvertes];
  const livree = said && !ouvertes.some((c) => c.id === said.id) ? getCommande(said.id) : undefined;
  if (said && livree) lignes.splice(Math.min(said.index, lignes.length), 0, livree);

  const livrer = (c: Commande) => {
    const index = ouvertes.indexOf(c);
    const text = livrerLaCommande(c, { deliver, onLivree, sons: settings.sounds, lieu });
    if (text) setSaid({ id: c.id, index, text });
  };
  // Déjà sur l'île qui donne le bloc : « Y aller » mène aux missions de l'île, et la ligne le dit.
  const allerAuxMissions = (c: Commande) => {
    setIci(c.id);
    onAuxMissions?.();
    if (settings.autoRead) speak(frenchTypography(mots.tuYEs));
    const missions = island ? document.getElementById(`missions-${island}`) : null;
    missions?.scrollIntoView?.({ block: 'start', behavior: moinsDAnimations() ? 'auto' : 'smooth' });
    missions?.focus({ preventScroll: true });
  };

  const Titre = niveau;
  const id = `commandes-${island ?? 'menu'}`;
  const heading = (
    <Titre id={id} className={niveau === 'h3' ? 'island-sheet-heading' : 'section-title'}>
      <Icon name="blocks" /> {mots.titre}
      {ouvertes.length > 0 && <span className="commandes-compte"> · {mots.compte(ouvertes.length, pretes.length)}</span>}
    </Titre>
  );
  // Ouvert de lui-même sur l'île de la commande prête, ou quand une ligne est mise en avant ; au menu, dès qu'une
  // commande est prête.
  const defaultOpen =
    (island ? pretes.some((c) => c.biome === island) : pretes.length > 0) || ouvertes.some((c) => c.id === highlight) || said !== null;
  return (
    <Foldable fold={fold} name="commandes" heading={heading} defaultOpen={defaultOpen}>
      <section className={`commandes${className ? ` ${className}` : ''}`} aria-labelledby={id}>
        {premiereFois && ouvertes.length > 0 && (
          <p className="commandes-premiere-fois">
            <SpeakButton text={mots.premiereFois} compact />
            <span>
              <Syllabified text={mots.premiereFois} />
            </span>
          </p>
        )}
        <ul ref={list} className="island-actions bridges-list commandes-list" aria-label={mots.liste}>
          {lignes.map((c) => {
            const creature = getBiome(c.biome)!;
            const bloc = BLOCKS[c.block];
            const habitant = (
              <span className="island-quest-icon commande-habitant">
                <Creature biome={c.biome} label={creature.creature.name} className="creature-small" />
              </span>
            );
            const titre = (
              <span className="island-quest-title">
                <BlockIcon top={bloc.top} side={bloc.side} size={24} /> {blockCount(c.block, c.count)}
              </span>
            );
            if (c === livree && said) {
              // La commande livrée : sa phrase, à la fin de la pose, à la place de la ligne ; une coche devant le bloc
              // (une forme en plus du vert).
              return (
                <li key={c.id} data-commande={c.id} className="island-quest bridge-item commande-item commande-livree">
                  {habitant}
                  <span className="island-quest-text">
                    <span className="island-quest-title">
                      <span className="commande-coche">
                        <Icon name="check" />
                      </span>
                      <BlockIcon top={bloc.top} side={bloc.side} size={24} /> {blockCount(c.block, c.count)}
                    </span>
                    <span ref={dite} tabIndex={-1} className="island-quest-desc commande-posee" role="status" aria-live="polite">
                      {posee ? <Syllabified text={said.text} /> : null}
                    </span>
                  </span>
                  {posee && <SpeakButton text={said.text} compact />}
                </li>
              );
            }
            const prete = estPrete(state, c);
            const have = state.stock[c.block] ?? 0;
            const phrase = texteDeLaCommande(c, prete ? 'ready' : 'ask', lieu);
            // Pas prête : le nom de la créature devant (la phrase « prête » le dit déjà), et ce que l'élève a déjà.
            const nom = prete ? null : creature.creature.name;
            const dit = !prete && have > 0 ? `${phrase} ${mots.tuEnAs(have, c.count)}` : phrase;
            const lu = nom ? `${nom} : ${dit}` : dit;
            const ileDonne = prete ? c.biome : ileDuBloc(c, state.world.links);
            const surPlace = !prete && island !== undefined && ileDonne === island;
            const to = prete ? lienDeLaDestination({ island: c.biome, commande: c.id }) : ileDonne ? `/adventure/${ileDonne}` : ASSEMBLAGE_PATH;
            const aller = (e: MouseEvent) => {
              if (!onAller || !ileDonne) return;
              e.preventDefault();
              onAller(ileDonne, prete ? c.id : undefined);
            };
            return (
              <li
                key={c.id}
                data-commande={c.id}
                className={`island-quest bridge-item commande-item${c === enAvant ? ' commande-en-avant' : ''}${highlight === c.id ? ' bridge-highlight' : ''}`}
              >
                {habitant}
                <span className="island-quest-text">
                  {titre}
                  <span className="island-quest-desc">
                    {nom && <strong>{nom} : </strong>}
                    <Syllabified text={dit} />
                    {ici === c.id && surPlace && (
                      <span className="commande-ici">
                        {' '}
                        <Syllabified text={mots.tuYEs} />
                      </span>
                    )}
                  </span>
                </span>
                <SpeakButton text={ici === c.id && surPlace ? `${lu} ${mots.tuYEs}` : lu} compact />
                {prete && island === c.biome ? (
                  <button type="button" className="button primary" onClick={() => livrer(c)}>
                    <Icon name="hammer" /> {mots.livrer}
                  </button>
                ) : surPlace ? (
                  <button type="button" className="button" onClick={() => allerAuxMissions(c)}>
                    <Icon name="play" /> Y aller
                  </button>
                ) : (
                  <Link to={to} className="button" onClick={aller}>
                    <Icon name="play" /> Y aller
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </Foldable>
  );
}

// La section « Commandes » (GD-7, PR 3 ; mot neutre : les demandes), au même endroit et nommée pareil dans le panneau
// d'île (un pli entre le prochain objectif et le bâtiment), la page de l'île en vue simple, le menu (sous « À revoir
// aujourd'hui ») et la Carte en vue simple (sous « Prochaine destination »). Proposition du consultant UX UI validée :
// une ligne par commande ouverte de l'archipel, la plus ancienne en tête, avec l'habitant, l'icône et le nom du bloc
// (ceux de Mes blocs), la phrase, un bouton de lecture et UNE action :
// - prête, dans le panneau de l'île de sa créature : « Livrer », au même endroit et de la même forme que « Construire »
//   dans le pli Ouvrages ;
// - prête, ailleurs : « Y aller », qui ouvre l'île de la créature sur sa ligne (comme `?worksite=` pour un ouvrage) ;
// - pas prête : la phrase dit ce qu'il faut faire, et « Y aller » mène à l'île qui donne le bloc (ou au lieu où l'on
//   assemble) ; jamais de « Livrer » grisé.
// Ignorer une commande, c'est ne pas la livrer : ni bouton, ni relance, ni perte, ni délai.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { BLOCKS, blockCount, getBiome, type BiomeId } from './biomes';
import { useBlocland } from './BloclandContext';
import { Creature } from './Creatures';
import { Foldable } from './IslandFold';
import { playDone } from './sound';
import { BlockIcon } from './Voxel';
import { useTextes } from '../univers';
import { ASSEMBLAGE_PATH, recetteDe } from './world/assemblage';
import { archipelagoOf, isBiomeUnlocked, type ArchipelagoId } from './world/archipelago';
import { COMMANDES, commandeMiseEnAvant, commandesOuvertes, estLivree, estPrete, ilesQuiDonnent, texteDeLaCommande, type Commande } from './world/commandes';
import { lienDeLaDestination } from './world/destination';

interface Props {
  /**
   * L'île dont c'est le panneau (ou la page en vue simple) : « Livrer » s'y touche pour la commande de sa créature, et
   * la liste est celle de son archipel. Sans île (le menu, la Carte en vue simple) : la liste de l'archipel du
   * bonhomme, et « Y aller » seulement.
   */
  island?: BiomeId;
  /** Dans le panneau 3D : la section est un pli (la clé change avec l'île) ; sans clé, elle s'affiche dépliée. */
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
}

/** Où mène « Y aller » pour une commande pas encore prête : l'île qui donne le bloc, ou le lieu où l'on assemble. */
function versLeBloc(c: Commande, links: string[]): string {
  if (recetteDe(c.block)) return ASSEMBLAGE_PATH;
  const ile = ilesQuiDonnent(c.block).find((id) => isBiomeUnlocked(id, links)) ?? ilesQuiDonnent(c.block)[0];
  return `/adventure/${ile}`;
}

export function Commandes({ island, fold, highlight = null, niveau = 'h3', className, onLivree }: Props) {
  const { state, deliver } = useBlocland();
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const [said, setSaid] = useState<string | null>(null);
  // La phrase d'une livraison ne suit pas sur une autre île.
  useEffect(() => setSaid(null), [island]);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!highlight) return;
    list.current?.querySelector<HTMLElement>(`[data-commande="${highlight}"]`)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, island]);
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

  const livrer = (c: Commande) => {
    const r = deliver(c.id);
    if (!r.ok) return;
    const text = texteDeLaCommande(c, 'done', lieu);
    setSaid(text);
    const sonPris = onLivree?.(c) ?? false;
    if (settings.sounds && !sonPris) playDone();
    if (settings.autoRead) speak(frenchTypography(text));
  };

  const Titre = niveau;
  const id = `commandes-${island ?? 'menu'}`;
  const heading = (
    <Titre id={id} className={niveau === 'h3' ? 'island-sheet-heading' : 'section-title'}>
      <Icon name="blocks" /> {mots.titre}
    </Titre>
  );
  // Ouvert de lui-même sur l'île de la commande prête, ou quand une ligne est mise en avant.
  const defaultOpen = pretes.some((c) => c.biome === island) || ouvertes.some((c) => c.id === highlight) || said !== null;
  return (
    <Foldable
      fold={fold}
      name="commandes"
      heading={heading}
      status={ouvertes.length ? mots.enAttente(ouvertes.length, pretes.length) : undefined}
      defaultOpen={defaultOpen}
    >
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
          {ouvertes.map((c) => {
            const creature = getBiome(c.biome)!;
            const prete = estPrete(state, c);
            const have = state.stock[c.block] ?? 0;
            const phrase = texteDeLaCommande(c, prete ? 'ready' : 'ask', lieu);
            const bloc = BLOCKS[c.block];
            const ici = prete && island === c.biome;
            return (
              <li
                key={c.id}
                data-commande={c.id}
                className={`island-quest bridge-item commande-item${c === enAvant ? ' commande-en-avant' : ''}${highlight === c.id ? ' bridge-highlight' : ''}`}
              >
                <span className="island-quest-icon commande-habitant">
                  <Creature biome={c.biome} label={creature.creature.name} className="creature-small" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">
                    <BlockIcon top={bloc.top} side={bloc.side} size={24} /> {blockCount(c.block, c.count)}
                  </span>
                  <span className="island-quest-desc">
                    <Syllabified text={phrase} />
                    {!prete && have > 0 && (
                      <>
                        {' '}
                        (tu en as {have} sur {c.count})
                      </>
                    )}
                  </span>
                </span>
                <SpeakButton text={phrase} compact />
                {ici ? (
                  <button type="button" className="button primary" onClick={() => livrer(c)}>
                    <Icon name="hammer" /> {mots.livrer}
                  </button>
                ) : (
                  <Link
                    to={
                      prete
                        ? lienDeLaDestination({
                            island: c.biome,
                            commande: c.id,
                          })
                        : versLeBloc(c, state.world.links)
                    }
                    className="button"
                  >
                    <Icon name="play" /> Y aller
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
        {said && (
          <p className="bridges-said" role="status" aria-live="polite">
            <Syllabified text={said} />
          </p>
        )}
      </section>
    </Foldable>
  );
}

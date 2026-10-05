import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MENU_PATH } from '../core/paths';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, getBiome, ofBlock } from './biomes';
import {
  ARCHIPELAGOS,
  KIND_NAME,
  archipelagoOf,
  archipelagoTitle,
  buildableBridges,
  isArchipelagoReached,
  isBiomeUnlocked,
  islandsOf,
  remainingVoyages,
} from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { planStatus } from './engine';
import { Creature } from './Creatures';
import { InventoryLink } from './Inventory';
import { SCHOOL_PATH, SCHOOL_TITLE } from './School';
import { MONUMENTS_PATH, MONUMENTS_TITLE } from './Monuments';
import { BlockIcon } from './Voxel';
import { VEHICLE_NAME, stageAt, stageTo } from './world/vehicle';
import { VillageStageLine } from './VillageStageLine';
import { WhaleWordPanel, useWhaleWord } from './WhaleWord';
import { RenommagePanel, useRenommage } from './Renommage';
import { RallumagePanel, useRallumage } from './Rallumage';
import { playBell } from './sound';
import { useSettings } from '../core/SettingsContext';
import { useTextes } from '../univers';
import { ArchipelagoMap } from './ArchipelagoMap';
import { lienDeLaDestination, nextDestination } from './world/destination';
import { sansCommandes } from './world/commandes';
import { islandState } from './world/islandState';
import { SpeakButton } from '../components/SpeakButton';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';
import { signesDesCreatures, signesParmi, usePlusTard } from './rappels';
import { questsToReview } from './review';
import { Commandes } from './Commandes';

/** Ce qu'il faut pour rejoindre un archipel fermé, en une phrase. */
function lockedArchipelagoText(state: ReturnType<typeof useBlocland>['state'], classe: (typeof ARCHIPELAGOS)[number]['classe']): string {
  const port = ARCHIPELAGOS.find((a) => a.classe === classe)!.port;
  const left = remainingVoyages(port, state.world.links);
  const first = stageTo(left[0].toClasse)!;
  const shipyard = getBiome(first.biome)?.name ?? first.biome;
  if (left.length === 1) return `Archipel fermé. Pour y aller, il faut ${VEHICLE_NAME} avec ${first.short} : construis-le au port, sur ${shipyard}.`;
  const steps = left.map((v) => stageTo(v.toClasse)!.short).join(', puis ');
  return `Archipel fermé. Il faut d’abord ${VEHICLE_NAME} avec ${steps}. Commence au port, sur ${shipyard}.`;
}

/** Carte de Blocland en vue simple : les quatre archipels, un par classe, et leurs îles. */
export function BloclandPage() {
  const univers = useUnivers();
  const { state } = useBlocland();
  const at = state.world.place ?? 'french-6e-phonology';
  const here = archipelagoOf(at).classe;
  const textes = useTextes();
  // Les commandes (GD-7) ne se suggèrent que dans un univers qui les montre (`commandes` dans ses textes).
  const destination = nextDestination(textes.commandes ? state : sansCommandes(state), textes.archipels, textes.libelles);
  // La vue simple n'a pas de monde : pas de moment du rallumage, mais son mot et sa cloche, une fois (lot 6).
  const { settings } = useSettings();
  const rallumage = useRallumage(state.progress, here, textes.sentinelles !== null);
  const rallume = rallumage.enAttente[0] ?? null;
  useEffect(() => {
    if (rallume && settings.sounds) playBell();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rallume]);
  // Les nouveaux noms des archipels (GD-1), une fois par appareil : avant le mot des grandes étapes, un panneau à la fois.
  const renommage = useRenommage(!rallume, 1200);
  const whale = useWhaleWord(state, here, !rallume && !renommage.ouvert);
  const destinationText = `Prochaine destination : ${destination.name}. ${destination.text}`;
  // La créature qui se souvient (GD-4, étape 1) : l'icône de la notion sur son île, comme son signe dans le monde.
  const { remises } = usePlusTard();
  // Les révisions dues, calculées une fois pour toute la Carte (pas une fois par île).
  // Un seul signe par créature : sa commande prête et suggérée (GD-7, PR 3 : l'icône du bloc), sinon ses révisions.
  const avecCommandes = Boolean(textes.commandes);
  const fontSigne = useMemo(() => {
    const dues = questsToReview(state.spaced, state.world.links);
    const vu = avecCommandes ? state : sansCommandes(state);
    return new Map(
      ARCHIPELAGOS.flatMap((a) => signesDesCreatures(vu, a.classe, signesParmi(dues, a.classe, remises, settings.lv2), destination.commande)).map((x) => [x.id, x]),
    );
  }, [state, remises, settings.lv2, avecCommandes, destination.commande]);
  return (
    <>
      <Link to={MENU_PATH} className="back-link">
        <Icon name="back" /> Menu
      </Link>
      <section className="hero hero-blocland">
        <p className="hero-kicker">Aventure</p>
        <h1 className="hero-title">{UNIVERS[univers].nom}</h1>
        <p className="hero-text">
          <Syllabified text="Le village est en ruine. Toi, tu es le bâtisseur. Chaque exercice réussi te donne des blocs pour le reconstruire, puis le Bloc-Navire t’emmène d’archipel en archipel." />
        </p>
        <p className="hero-actions">
          <InventoryLink className="button" />
          <Link to={SCHOOL_PATH} className="button">
            <Icon name="school" /> {SCHOOL_TITLE}
          </Link>
          <Link to={MONUMENTS_PATH} className="button">
            <Icon name="castle" /> {MONUMENTS_TITLE}
          </Link>
        </p>
      </section>

      {renommage.ouvert ? (
        <RenommagePanel onClose={renommage.fermer} />
      ) : rallume ? (
        <RallumagePanel id={rallume} onClose={() => rallumage.enAttente.forEach(rallumage.noterVu)} />
      ) : (
        whale.word && <WhaleWordPanel word={whale.word} onClose={whale.close} />
      )}

      {/* La Carte en vue simple : la prochaine destination, puis les quatre archipels, ceux non atteints dans la brume. */}
      <section className="panel home-resume" aria-label="Prochaine destination">
        <Link to={lienDeLaDestination(destination)} className="button primary home-resume-button">
          <Icon name="play" /> Y aller
        </Link>
        <p className="home-destination">
          <SpeakButton text={destinationText} label="Écouter" compact />
          <span>
            <Syllabified text={destinationText} />
          </span>
        </p>
      </section>
      {/* Les commandes des créatures de l'archipel du bonhomme (GD-7), sous la prochaine destination. */}
      <Commandes niveau="h2" className="panel" />
      <ArchipelagoMap bridges={state.world.links} here={here} />

      {ARCHIPELAGOS.map((a) => {
        const reached = isArchipelagoReached(a.classe, state.world.links);
        const stage = stageAt(a.port);
        const status = stage && reached ? planStatus(state, stage) : null;
        return (
          <section key={a.classe} className={`archipel${reached ? '' : ' archipel-locked'}`} aria-labelledby={`archipel-${a.classe}`}>
            <h2 id={`archipel-${a.classe}`} className="section-title">
              <Icon name="map" /> {archipelagoTitle(a.classe, textes.archipels)}{' '}
              <span className={`tag${a.classe === here ? ' tag-new' : reached ? ' tag-ok' : ''}`}>{a.classe === here ? 'Tu es ici' : reached ? 'Ouvert' : 'Dans la brume'}</span>
            </h2>
            {reached && <VillageStageLine village={state.world} archipelago={a.classe} className="section-intro" />}
            {!reached && (
              <p className="section-intro">
                <Syllabified text={lockedArchipelagoText(state, a.classe)} />
              </p>
            )}
            <ol className="biome-map">
              {islandsOf(a.classe).map((biome) => {
                const block = BLOCKS[biome.block];
                const unlocked = isBiomeUnlocked(biome.id, state.world.links);
                const bridge = unlocked || !reached ? undefined : buildableBridges(state.world.links, biome.id, undefined, settings.lv2)[0];
                const owned = state.stock[biome.block] ?? 0;
                const st = islandState(state, biome.id);
                const signe = fontSigne.get(biome.id);
                return (
                  <li key={biome.id}>
                    <Link to={`/adventure/${biome.id}`} className={`panel biome-card biome-${biome.id}${unlocked ? '' : ' locked'}`}>
                      <Creature biome={biome.id} className="creature-small" />
                      {signe?.bloc ? (
                        // Le signe d'une commande prête et suggérée : l'icône du bloc demandé, à la place de celle des révisions.
                        <span className="biome-rappel biome-commande">
                          <BlockIcon top={BLOCKS[signe.bloc].top} side={BLOCKS[signe.bloc].side} size={22} />
                          <span className="visually-hidden">{biome.creature.name} attend sa commande.</span>
                        </span>
                      ) : (
                        signe && (
                          // Le signe de la créature : l'icône de la notion, fixe ; le panneau de l'île propose de reprendre.
                          <span className="biome-rappel">
                            <Icon name={biome.icon} size="1.4rem" />
                            <span className="visually-hidden">{biome.creature.name} te propose de reprendre.</span>
                          </span>
                        )
                      )}
                      <span className="biome-name">{biome.name}</span>
                      <span className="biome-module">
                        {biome.module} · Niveau {biome.classe}
                      </span>
                      <span className="biome-block">
                        <BlockIcon top={block.top} side={block.side} size={28} />
                        {owned} bloc{owned > 1 ? 's' : ''} {ofBlock(biome.block)}
                      </span>
                      <span className={`island-state island-state-${st.id}`}>
                        <Icon name={st.icon} /> {textes.etatsDIle[st.id]}
                      </span>
                      {biome.id === a.port && (
                        <span className="tag">
                          <Icon name="ship" /> Port{status && !status.complete ? ` · Bloc-Navire ${status.done} / ${status.total}` : ''}
                        </span>
                      )}
                      {!unlocked && (
                        <span className="tag">
                          <Icon name="lock" />{' '}
                          {!reached ? 'Archipel à rejoindre' : bridge ? `${KIND_NAME[bridge.kind]} à construire : ${bridge.cost} blocs` : 'Île lointaine'}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}

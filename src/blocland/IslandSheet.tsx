import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { estIleLv2, guardianTitle, missionsJouables, type BiomeDef } from './biomes';
import { Bridges } from './Bridges';
import { Commandes } from './Commandes';
import { isBiomeUnlocked } from './world/archipelago';
import { PlanSection } from './PlanSection';
import { ShipSection } from './ShipSection';
import type { VehicleBuilder } from './useVehicleBuilder';
import type { ArchipelagoId } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { STARS_TO_UNLOCK, isBossBeaten, isBossOpen, missingForBoss } from './boss';
import { levelFor } from './engine';
import { pickExercise, questProgress } from './exercises';
import { Creature } from './Creatures';
import { Stars } from './Stars';
import { nextGoalInfo } from './world/goals';
import { accueilDeLIle } from './decouvertes';
import { GoalFold, GoalLine } from './GoalLine';
import { firstSentences } from './firstSentences';
import { VillageStageLine } from './VillageStageLine';
import { SchoolLink } from './School';
import { AssemblageLink } from './Assemblage';
import { TROPHIES_PATH, TROPHIES_TITLE } from './trophies';
import { archipelagoOf } from './world/archipelago';
import { useTextes } from '../univers';
import type { Partie } from './world/parties';
import { PlusTardDit, RappelDeLaCreature, useRappelDeLaCreature } from './RappelDeLaCreature';

interface Props {
  biome: BiomeDef;
  in3d?: boolean;
  onClose: () => void;
  /** Un ouvrage vient d'être construit depuis cette île : l'île d'en face s'ouvre. */
  onBuilt?: (to: BiomeDef['id']) => void;
  /** L'ouvrage touché dans le monde : sa proposition est mise en avant. */
  highlight?: string | null;
  /** Le chantier du Bloc-Navire (sur une île-port). */
  ship?: VehicleBuilder;
  /** Embarquer sur le Bloc-Navire vers un archipel. */
  onBoard?: (to: ArchipelagoId, back: boolean) => void;
  /** Les parties qui viennent de se poser dans le monde (GD-6), dites en tête du bâtiment une fois la pose finie. */
  posees?: Partie[] | null;
  /** Les parties que la vague est en train de poser (GD-6) : le compte du bâtiment les attend. */
  enCoursDePose?: Partie[] | null;
}

/**
 * Le panneau d'une île, qui glisse depuis le bas du monde : la créature (une ligne, la suite dans un pli), ses missions,
 * le Gardien, le prochain objectif, puis le bâtiment de l'île, le Bloc-Navire (sur un port) et les ouvrages, repliés quand
 * il n'y a rien à y faire ; au pied, la matière, la classe et l'archipel. Tout est en HTML (police dys), on ne quitte
 * pas le monde.
 */
export function IslandSheet({ biome, in3d = false, onClose, onBuilt, highlight = null, ship, onBoard, posees = null, enCoursDePose = null }: Props) {
  const { state } = useBlocland();
  const { settings, speak } = useSettings();
  const sansLv2 = estIleLv2(biome) && settings.lv2 === 'none';
  const textes = useTextes();
  const unlocked = isBiomeUnlocked(biome.id, state.world.links);
  // « Pas de LV2 » : un seul message, lu à l'ouverture, à la place de l'accueil et du prochain objectif.
  const greeting = accueilDeLIle(state, biome.id, sansLv2, textes);
  const bossReady = unlocked && isBossOpen(biome, state.progress);
  const bossBeaten = isBossBeaten(biome.id, state.progress);
  const goal = unlocked && !sansLv2 ? nextGoalInfo(state, biome.id, textes.archipels, textes.libelles) : null;
  const port = unlocked && archipelagoOf(biome.id).port === biome.id;
  // L'accueil de la créature : une ligne écrite visible, la suite dans un pli. Un message d'île fermée (ou « pas de
  // LV2 ») dit quoi faire : il reste entier.
  const says = unlocked && !sansLv2 ? firstSentences(greeting) : { first: greeting, rest: '' };
  // La créature qui se souvient (GD-4, étape 1) : des révisions dues sur l'île, elle propose de reprendre.
  const rappelDue = useRappelDeLaCreature(biome);
  const rappel = unlocked && !sansLv2 ? rappelDue : null;
  // Après « Plus tard » : le focus revient au titre de l'île, et une courte ligne le dit.
  const titreRef = useRef<HTMLHeadingElement>(null);
  const [remis, setRemis] = useState(false);
  const remettre = () => {
    setRemis(true);
    titreRef.current?.focus();
  };
  const [bossSaid, setBossSaid] = useState<string | null>(null);
  // En 3D, le bâtiment, le navire et les ouvrages se replient quand il n'y a rien à y faire : le panneau reste court.
  // Le choix de l'élève (ouvrir, fermer) est oublié quand l'île change ou qu'un ouvrage est mis en avant.
  const fold = in3d ? `${biome.id}:${highlight ?? ''}` : undefined;
  // Le Gardien n'accepte pas encore : on le dit (et on le lit), au lieu d'un bouton qui ne répond pas.
  const explainBoss = () => {
    const missing = missingForBoss(biome, state.progress);
    const text = unlocked
      ? `Pas tout de suite ! ${biome.guardian} veut ${STARS_TO_UNLOCK} étoiles dans ${missing.length ? missing.join(', ') : 'chaque mission'}. Fais ces missions, puis reviens le défier.`
      : `Pas tout de suite ! Il faut d’abord un chemin jusqu’à cette île.`;
    setBossSaid(text);
    if (settings.autoRead) speak(frenchTypography(text));
  };

  // La créature accueille à voix haute quand le panneau s'ouvre, puis dit sa proposition s'il y en a une.
  useEffect(() => {
    setBossSaid(null);
    setRemis(false);
    if (settings.autoRead) speak(frenchTypography(rappel ? `${greeting} ${rappel.lu}` : greeting));
    // Une lecture par île.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biome.id]);

  return (
    <section id={`panneau-${biome.id}`} className={`island-sheet biome-${biome.id}`} role="dialog" aria-labelledby={`ile-${biome.id}`} aria-modal="false">
      <div className="island-sheet-head">
        <Creature biome={biome.id} className="creature-small" />
        <div className="island-sheet-titles">
          <h2 id={`ile-${biome.id}`} ref={titreRef} tabIndex={-1} className="island-sheet-title">
            <Icon name={biome.icon} /> {biome.name}
          </h2>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {/* « Réécouter » sur la ligne du nom de la créature ; sa phrase dessous, sur toute la largeur. */}
      <p className="island-sheet-says island-sheet-says-nom" role="status" aria-live="polite">
        <strong>{biome.creature.name} :</strong>
        <SpeakButton text={greeting} label="Réécouter" compact />
        <span className="island-sheet-says-texte">
          <Syllabified text={says.first} />
        </span>
      </p>
      {says.rest && (
        // La suite de l'accueil, écrite dans un pli : rien n'est seulement à l'écoute. « Réécouter » lit le tout.
        <details key={`suite-${biome.id}`} className="sheet-more island-says-more">
          <summary>La suite</summary>
          <p>
            <Syllabified text={says.rest} />
          </p>
        </details>
      )}

      {rappel && <RappelDeLaCreature biome={biome} rappel={rappel} onRemis={remettre} />}
      <PlusTardDit dit={remis} />

      {sansLv2 ? (
        // « Pas de LV2 » : rien à construire, rien à jouer ; le chemin vers le réglage (décision du directeur artistique).
        <p>
          <Link to="/reglages" className="button">
            <Icon name="settings" /> Choisir une LV2
          </Link>
        </p>
      ) : (
        !unlocked && <Bridges island={biome.id} onBuilt={onBuilt} highlight={highlight} />
      )}

      {!sansLv2 && (
        <h3 className="island-sheet-heading">
          <Icon name="hammer" /> Missions
        </h3>
      )}
      <ul className="island-quests" aria-label="Missions de l’île">
        {missionsJouables(biome, settings.lv2).map((exercise) => {
          const def = pickExercise(biome.id, exercise.id, levelFor(state, exercise.id), state.progress);
          const progress = def ? questProgress(biome.id, exercise.id, state.progress) : undefined;
          const playable = Boolean(def && unlocked);
          const inner = (
            <>
              <span className="island-quest-icon">
                <Icon name={playable ? 'play' : 'lock'} />
              </span>
              <span className="island-quest-text">
                <span className="island-quest-title">{exercise.title}</span>
                <span className="island-quest-desc">{exercise.description}</span>
              </span>
              {progress ? (
                <Stars count={progress.stars} label={`${progress.stars} étoile${progress.stars > 1 ? 's' : ''} sur 3`} />
              ) : (
                <span className="tag tag-new">{playable ? 'Nouveau' : 'Verrouillé'}</span>
              )}
            </>
          );
          return (
            <li key={exercise.id}>
              {playable ? (
                <Link to={`/adventure/${biome.id}/${exercise.id}`} className="island-quest">
                  {inner}
                </Link>
              ) : (
                <div className="island-quest locked" aria-disabled="true">
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <ul className="island-actions" aria-label="Sur cette île">
        {unlocked && archipelagoOf(biome.id).school === biome.id && (
          <>
            <li>
              <SchoolLink />
            </li>
            <li>
              <AssemblageLink />
            </li>
            <li>
              <Link to={TROPHIES_PATH} className="island-quest">
                <span className="island-quest-icon">
                  <Icon name="trophy" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{TROPHIES_TITLE}</span>
                  <span className="island-quest-desc">Un trophée par succès gagné.</span>
                </span>
              </Link>
            </li>
          </>
        )}
        {!sansLv2 && (
          <li>
            {bossReady ? (
              <Link to={`/adventure/${biome.id}/challenge`} className="island-quest island-boss">
                <span className="island-quest-icon boss-icon">
                  <Icon name="shield" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{guardianTitle(biome)}</span>
                  <span className="island-quest-desc">{bossBeaten ? textes.libelles.dejaFait : textes.libelles.defiPret}</span>
                </span>
                {bossBeaten && <Stars count={state.progress[`${biome.id}-challenge`]?.stars ?? 0} label={textes.libelles.etoiles} />}
              </Link>
            ) : (
              <button type="button" className="island-quest locked island-boss-locked" onClick={explainBoss} aria-describedby={`gardien-${biome.id}`}>
                <span className="island-quest-icon">
                  <Icon name="lock" />
                </span>
                <span className="island-quest-text">
                  <span className="island-quest-title">{guardianTitle(biome)}</span>
                  <span className="island-quest-desc">
                    {STARS_TO_UNLOCK} étoiles dans : {missingForBoss(biome, state.progress).join(', ') || 'chaque mission'}
                  </span>
                </span>
              </button>
            )}
          </li>
        )}
      </ul>
      <p id={`gardien-${biome.id}`} className="bridges-said" role="status" aria-live="polite">
        {bossSaid ? <Syllabified text={bossSaid} /> : ''}
      </p>

      {/* Le prochain objectif et, sur l'île-port, l'état du village (qui se voit aussi au port en cubes) : un seul pli. */}
      {goal && port ? (
        <GoalFold key={`objectif-${biome.id}`} goal={goal}>
          <VillageStageLine village={state.world} archipelago={biome.classe} />
        </GoalFold>
      ) : goal ? (
        <GoalLine goal={goal} />
      ) : (
        port && <VillageStageLine village={state.world} archipelago={biome.classe} className="island-village" />
      )}

      {/* Les commandes des créatures de l'archipel (GD-7) : entre le prochain objectif et le bâtiment. */}
      {unlocked && !sansLv2 && <Commandes island={biome.id} fold={fold} highlight={highlight} />}

      {unlocked && <PlanSection biome={biome} fold={fold} highlight={highlight === 'part'} vientDePoser={posees} enCoursDePose={enCoursDePose} />}

      {unlocked && ship && onBoard && <ShipSection biome={biome} builder={ship} in3d={in3d} onBoard={onBoard} highlight={highlight === 'vehicle'} fold={fold} />}

      {unlocked && <Bridges island={biome.id} onBuilt={onBuilt} highlight={highlight} fold={fold} objectif={goal?.ouvrage ?? null} />}

      {/* La matière, la classe (cadrage-contenu) et l'archipel : une ligne au pied du panneau. */}
      <p className="island-sheet-module island-sheet-foot">
        {biome.module} · Niveau {biome.classe} · Les {textes.archipels[biome.classe]}
      </p>
    </section>
  );
}

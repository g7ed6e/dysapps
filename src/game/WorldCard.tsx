// La fiche d'un objet du monde (lot 2 de « Toucher le monde », spécification du consultant UX UI arbitrée par le
// directeur artistique) : toucher une borne, le Gardien, la Nef, un ouvrage en fantôme, une île pâle ou une
// créature ouvre SA fiche, toujours à la même place (en bas, au-dessus de la barre ; en paysage, en bas à gauche), qui
// ne couvre jamais toute l'île. Peu de texte : un titre, une phrase au plus, un bouton principal. Elle reprend les
// actions qui existent déjà (Jouer, Défier, Poser le bloc suivant, Embarquer, Construire, Livrer, Reprendre, Plus tard)
// sans rien inventer. Un dialogue non modal : le focus va au titre à l'ouverture, Écouter relit tout, la croix et Échap
// la ferment (la page s'en charge, avec le toucher sur le sol).
// Dans les deux univers (proposition P2, PR 2, pour Blocland ; « 4a », 4 octobre 2026, pour Archipéo), la fiche de la
// créature et celle du Gardien portent leur portrait en médaillon, qui déborde au-dessus de la fiche ; les autres gardent
// l'icône du titre. Blocland le dessine en cubes, Archipéo avec son modèle en SVG (l'icône en attendant, ou en repli).
import type { PetiteConstructionAPoser } from './world/placedFixtures';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Icon, type AnyIconName } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useASuivre } from '../components/useNextUp';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { useTextes } from '../universes';
import { BLOCKS, blockCount, getBiome, guardianTitle, missionsJouables, sansSonOption, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { isBossBeaten, isBossOpen } from './boss';
import { useConstruireUnOuvrage, withArticle } from './Bridges';
import { livrerLaCommande } from './Requests';
import { accueilDeLIle } from './discoveries';
import { currentStage, levelFor } from './engine';
import { pickExercise, questProgress } from './exercises';
import { explicationDuGardien } from './IslandSheet';
import { EarnLink } from './PlanSection';
import { ReminderButtons, LaterSaid, ReminderText, useResidentReminder } from './ResidentReminder';
import { shipSummary } from './ShipSection';
import { Stars } from './Stars';
import { Creature } from './Creatures';
import { habillageDuMonde } from './skin';
import { BlockIcon, VoxelScene } from './Voxel';
import { GUARDIAN_CUBES } from './world/characters/guardians';
import { statueDe } from './world/terrain';
import type { VehicleBuilder } from './useVehicleBuilder';
import { borneDe } from './world/affordance';
import type { ObjetDeLaFiche } from './world/layout';
import { KIND_NAME, archipelagoOf, bridgeState, conditionText, getArchipelago, getBridge, isBiomeUnlocked, linkKind, linksToIsland, nearestDeparture, opensAnIsland, otherEnd, payableBlocks, reachableIslands, type ArchipelagoId } from './world/archipelago';
import { commandeALivrerChez, texteDeLaCommande } from './world/requests';
import { canTapStep, openStoryOf, type Story } from './world/stories';
import { StepButton, StoryBadge, stepSentence, storyBadgeReading, tapTheStep } from './Stories';
import { ileDeLOuvrage } from './world/model';
import { ofPlace, thePlace, toPlace } from './world/placeArticle';
import { earnIsland, whereToEarn } from './world/uses';
import { VEHICLE_NAME, VEHICLE_STAGES } from './world/vehicle';

/** Une fiche ouverte : son objet, et, pour une créature, la phrase tirée à l'ouverture. `seq` change à chaque ouverture. */
export interface FicheOuverte {
  objet: ObjetDeLaFiche;
  seq: number;
  /** Ouverte autrement que d'un toucher sur l'objet (« Y aller », « Relier ») : son signe saute. */
  saut: boolean;
  /** Ce que dit la créature touchée, quand elle n'a rien à proposer. */
  phrase?: string;
  /** Une île pâle touchée la première fois : la découverte des ouvrages, deuxième phrase de sa fiche. */
  decouverte?: string;
  /** Ouverte par « Partir d'une autre île » (GD-9) : la caméra tient la liaison au-dessus de la fiche. */
  cadrer?: boolean;
}

interface Props {
  fiche: FicheOuverte;
  onClose: () => void;
  /** Le chantier de la Nef au port de l'archipel. */
  ship: VehicleBuilder;
  /** Embarquer (`back` : un voyage déjà fait, vers l’île `dest`). */
  onBoard: (to: ArchipelagoId, back: boolean, dest?: BiomeId) => void;
  /** Un ouvrage vient d'être construit : l'île d'en face s'ouvre. */
  onBuilt: (to: BiomeId) => void;
  /** Une commande livrée : la scène pose sa petite construction ; `true` si elle en prend le son. */
  onLivree?: (c: PetiteConstructionAPoser) => boolean;
  /** La commande dont la petite construction se pose : la phrase « posée » attend la fin. */
  commandeEnCoursDePose?: string | null;
  /** « Relier » d'une île pâle : la fiche de cet ouvrage ; `autreDepart` : depuis « Partir d'une autre île » (la caméra cadre sa liaison). */
  onVoirOuvrage: (id: string, autreDepart?: boolean) => void;
  /** « Y aller » de la fiche d'un Gardien pas encore prêt : son lieu et ses missions, comme un toucher sur son lieu. */
  onAllerAuLieu?: (id: BiomeId) => void;
}

/** La fiche de l'objet touché ; la page la remonte à chaque ouverture (`key`). */
export function WorldCard(props: Props) {
  const { objet } = props.fiche;
  switch (objet.genre) {
    case 'borne':
      return <FicheDeLaBorne id={objet.id} {...props} />;
    case 'gardien':
      return <FicheDuGardien ile={objet.id} {...props} />;
    case 'navire':
      return <FicheDuNavire port={objet.port} {...props} />;
    case 'ouvrage':
      return <FicheDeLOuvrage id={objet.id} {...props} />;
    case 'ile':
      return <FicheDeLIlePale ile={objet.id} {...props} />;
    case 'creature':
      return <FicheDeLaCreature ile={objet.id} {...props} />;
  }
}

interface CadreProps {
  titre: string;
  icone?: AnyIconName;
  /** Le portrait en médaillon (la créature, le Gardien) : il remplace l'icône du titre. Décoratif. */
  portrait?: ReactNode;
  /** Ce qu'Écouter lit, et la lecture automatique à l'ouverture : tout ce que la fiche dit. */
  lecture: string;
  onClose: () => void;
  /** Le bouton principal (et un secondaire), toujours entiers sous le texte. */
  actions?: ReactNode;
  /** Sans phrase (les étoiles d'une borne) : le texte et les boutons sur une même rangée, la fiche aussi petite que possible. */
  ligne?: boolean;
  children?: ReactNode;
}

/** Le cadre commun : le titre (qui prend le focus), Écouter à côté, la croix ; le texte qui défile ; les boutons. */
function Fiche({ titre, icone, portrait, lecture, onClose, actions, ligne, children }: CadreProps) {
  const { settings, speak } = useSettings();
  const titreRef = useRef<HTMLHeadingElement>(null);
  // Le texte continue plus bas (grand texte, une découverte) : un trait pointillé le dit, comme sur la Carte.
  const [texteRef, suite] = useASuivre<HTMLDivElement>(lecture);
  // Dernier recours, la fiche entière défile (grand texte, deux boutons) : son bord du bas en pointillé le dit.
  const [ficheRef, ficheSuite] = useASuivre<HTMLElement>(lecture);
  useEffect(() => {
    titreRef.current?.focus({ preventScroll: true });
    if (settings.autoRead) speak(frenchTypography(lecture));
    // Une fois, à l'ouverture (la page remonte la fiche à chaque ouverture).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const corps = (
    <>
      {children && (
        <div ref={texteRef} className={`world-fiche-texte${suite ? ' a-suivre' : ''}`}>
          {children}
        </div>
      )}
      {actions && <div className="world-fiche-actions">{actions}</div>}
    </>
  );
  // Le médaillon est hors de la fiche qui défile : il reste entier, et sa hauteur compte dans la place de la fiche.
  return (
    <div className={`world-fiche-cadre${portrait ? ' avec-medaillon' : ''}`}>
      {portrait && (
        <span className="world-fiche-medaillon" aria-hidden="true">
          {portrait}
        </span>
      )}
      <section ref={ficheRef} className={`world-fiche${ficheSuite ? ' a-suivre' : ''}`} role="dialog" aria-modal="false" aria-labelledby="fiche-titre">
        <div className="world-fiche-tete">
          <h2 id="fiche-titre" ref={titreRef} tabIndex={-1} className="world-fiche-titre">
            {icone && !portrait && <Icon name={icone} />} <span>{frenchTypography(titre)}</span>
          </h2>
          <SpeakButton text={lecture} compact />
          <button type="button" className="icon-button world-fiche-fermer" aria-label="Fermer la fiche" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {ligne ? (
          <div className="world-fiche-ligne">
            {corps}
          </div>
        ) : (
          corps
        )}
      </section>
    </div>
  );
}

/** Le personnage d'Archipéo en SVG, chargé à la demande (les modèles ne pèsent pas sur le monde en blocs). */
const CharacterSvg = lazy(() => import('./CharacterSvg'));

/**
 * Le portrait en médaillon, un dessin fixe, sans 3D : en cubes avec les figures en cubes (Blocland), le modèle en SVG
 * avec les figures en modèles (Archipéo) ; l'icône du titre le temps qu'il arrive, ou s'il ne peut pas se charger.
 */
function portraitEnMedaillon(kind: 'creature' | 'guardian', ile: BiomeId, icone: AnyIconName, enCubes: () => ReactNode, allumage?: number): ReactNode {
  if (habillageDuMonde().figures === 'cubes') return enCubes();
  const repli = <Icon name={icone} />;
  return (
    <ErrorBoundary fallback={repli}>
      <Suspense fallback={repli}>
        <CharacterSvg kind={kind} id={ile} allumage={allumage} />
      </Suspense>
    </ErrorBoundary>
  );
}

/** Une phrase de la fiche, en syllabes si le réglage le demande. */
function Phrase({ text, role }: { text: string; role?: 'status' }) {
  return (
    <p className="world-fiche-phrase" role={role} aria-live={role ? 'polite' : undefined}>
      <Syllabified text={frenchTypography(text)} />
    </p>
  );
}

const etoiles = (n: number) => `${n} étoile${n > 1 ? 's' : ''} sur 3`;

/** Une borne : le titre de la mission, ses étoiles, « Jouer » ; fermée, la raison en une phrase, sans bouton grisé. */
function FicheDeLaBorne({ id, onClose }: Props & { id: string }) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const borne = borneDe(id);
  const ile: BiomeId = borne?.ile ?? 'french-6e-phonology';
  const mission = borne?.mission ?? '';
  const biome = borne ? getBiome(ile) : undefined;
  const exercise = biome ? missionsJouables(biome, settings.lv2, settings.lca).find((m) => m.id === mission) : undefined;
  const def = pickExercise(ile, mission, levelFor(state, mission), state.progress);
  const unlocked = isBiomeUnlocked(ile, state.world.links);
  const jouable = Boolean(def && unlocked && exercise);
  const progress = def ? questProgress(ile, mission, state.progress) : undefined;
  const titre = exercise?.title ?? mission;
  const raison = unlocked ? 'Cette mission n’est pas encore ouverte.' : 'Il faut d’abord un chemin jusqu’à cette île.';
  const lecture = `${titre}. ${jouable ? (progress ? `${etoiles(progress.stars)}.` : '') : raison}`.trim();
  return (
    <Fiche
      titre={titre}
      icone={jouable ? 'play' : 'lock'}
      lecture={lecture}
      onClose={onClose}
      ligne={jouable}
      actions={
        jouable && (
          <Link to={`/adventure/${ile}/${mission}`} className="button primary">
            <Icon name="play" /> Jouer
          </Link>
        )
      }
    >
      {progress && <Stars count={progress.stars} label={etoiles(progress.stars)} />}
      {!jouable && <Phrase text={raison} />}
    </Fiche>
  );
}

/**
 * Le Gardien : ce qu'il attend (une phrase), ou « Rallumer » quand il est prêt, déjà rallumé avec ses étoiles (GD-8).
 * Il se tient sur son île (GD-11) : la fiche nomme son lieu (son icône et son nom) ; « Rallumer » ouvre le défi d'ici,
 * sans trajet du bonhomme ; pas encore prêt, « Y aller » mène à son lieu.
 */
function FicheDuGardien({ ile, onClose, onAllerAuLieu }: Props & { ile: BiomeId }) {
  const { state } = useBlocland();
  const textes = useTextes();
  const biome = getBiome(ile);
  if (!biome) return null;
  const unlocked = isBiomeUnlocked(ile, state.world.links);
  const pret = unlocked && isBossOpen(biome, state.progress, state.world.challengesKeptOpen);
  const vaincu = isBossBeaten(ile, state.progress);
  const phrase = pret ? (vaincu ? textes.libelles.dejaFait : textes.libelles.defiPret) : explicationDuGardien(biome, state.progress, unlocked);
  const stars = state.progress[`${ile}-challenge`]?.stars ?? 0;
  const titre = guardianTitle(biome);
  return (
    <Fiche
      titre={titre}
      icone={pret ? 'flame' : 'lock'}
      // Éteint (en pierre, ou la sentinelle éteinte d'Archipéo) tant qu'il n'est pas rallumé, en couleurs ensuite (GD-8).
      portrait={portraitEnMedaillon('guardian', ile, 'flame', () => <VoxelScene cubes={vaincu ? GUARDIAN_CUBES[ile] : statueDe(GUARDIAN_CUBES[ile])} s={12} pad={2} className="creature guardian-svg" />, vaincu ? 1 : 0)}
      lecture={`${titre}. ${biome.name}. ${phrase}`}
      onClose={onClose}
      actions={
        !pret ? (
          unlocked &&
          onAllerAuLieu && (
            <button type="button" className="button" onClick={() => onAllerAuLieu(ile)}>
              <Icon name="play" /> Y aller
            </button>
          )
        ) : (
          <Link to={`/adventure/${ile}/challenge`} className="button primary">
            {vaincu ? (
              <>
                <Icon name="replay" /> Rejouer
              </>
            ) : (
              <>
                <Icon name="flame" /> Rallumer
              </>
            )}
          </Link>
        )
      }
    >
      {/* Son lieu, en signes : son icône et son nom. */}
      <p className="world-fiche-lieu">
        <Icon name={biome.icon} /> {biome.name}
      </p>
      {pret && vaincu && <Stars count={stars} label={textes.libelles.etoiles} />}
      <Phrase text={phrase} />
    </Fiche>
  );
}

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
/** Un point au bout d'une phrase qui n'a pas sa ponctuation finale. */
const finDePhrase = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}.`);

/** Les trois pastilles des formes de la Nef : faites (coche), en chantier (pleine), à venir (vide), sans la couleur seule. */
function PastillesDeLaNef({ stage }: { stage: number }) {
  return (
    <span className="signe nef-pastilles">
      {VEHICLE_STAGES.map((s) => (
        <span key={s.stage} className={`nef-pastille${s.stage < stage ? ' faite' : s.stage === stage ? ' en-cours' : ''}`}>
          {s.stage < stage && <Icon name="check" />}
        </span>
      ))}
    </span>
  );
}

/**
 * La Nef (GD-15, option A du consultant UX UI) : une ligne de titre, puis en signes les trois pastilles des formes, la
 * jauge des blocs posés et, s'il en manque, l'icône des blocs suivie de leur nombre, avec où les gagner (`EarnLink`) ;
 * un seul bouton, « Poser » (tout ce qu'on a), puis « Partir » quand elle est prête. La voix lit tout en mots. Le voyage
 * de ce port déjà fait : une phrase vers la forme suivante, et « Y aller ».
 */
function FicheDuNavire({ port, ship, onBoard, onClose }: Props & { port: BiomeId }) {
  const { state } = useBlocland();
  const textes = useTextes();
  const { stage, status, launch } = ship;
  const titre = cap(VEHICLE_NAME);
  if (!stage || !status) {
    // Le voyage de ce port est fait : la prochaine forme, sur le port d'un autre archipel (ou plus rien à construire).
    const suite = currentStage(state);
    const phrase = suite ? `Sa prochaine forme se construit au port des ${textes.archipels[suite.from]}.` : `${titre} a fait tous ses voyages.`;
    return (
      <Fiche
        titre={titre}
        icone="ship"
        lecture={`${titre}. ${phrase}`}
        onClose={onClose}
        actions={
          suite &&
          suite.biome !== port && (
            <button type="button" className="button primary" onClick={() => onBoard(suite.from, true, suite.biome)}>
              <Icon name="ship" /> Y aller
            </button>
          )
        }
      >
        <Phrase text={phrase} />
      </Fiche>
    );
  }
  const ready = Boolean(launch?.ok);
  const attend = launch && !launch.ok && launch.reason === 'gardiens' ? launch : null;
  // Le premier bloc qui manque (dans l'inventaire aussi) : où le gagner.
  const manque = !ready && !attend ? ((Object.entries(status.missing) as [BlockId, number][]).find(([b, n]) => n > (state.stock[b] ?? 0)) ?? null) : null;
  const ou = manque ? (earnIsland(manque[0])?.name ?? whereToEarn(manque[0])) : '';
  const manquants = manque ? manque[1] - (state.stock[manque[0]] ?? 0) : 0;
  const etape = `Forme ${stage.stage} sur ${VEHICLE_STAGES.length}, ${stage.name.charAt(0).toLowerCase()}${stage.name.slice(1)}`;
  const phrase = ready
    ? `${titre} est prête : pars vers les ${textes.archipels[stage.to]} quand tu veux.`
    : attend && status.complete
      ? textes.libelles.navireAttend(attend.missing)
      : manque
        ? `${status.done} blocs posés sur ${status.total}. Il manque ${blockCount(manque[0], manquants)}, à gagner dans ${ou}.`
        : finDePhrase(shipSummary(ship, state.stock, textes));
  const lecture = `${titre}. ${etape}. ${phrase}`;
  const suivant = getArchipelago(stage.to);
  // En signes tant qu'on construit ; une phrase quand elle attend ses Gardiens ou qu'elle est prête.
  const enSignes = !ready && !(attend && status.complete);
  return (
    <Fiche
      titre={titre}
      icone="ship"
      lecture={lecture}
      onClose={onClose}
      actions={
        ready ? (
          <button type="button" className="button primary" aria-label={`Partir vers les ${textes.archipels[suivant.classe]}`} onClick={() => onBoard(stage.to, false)}>
            <Icon name="ship" /> Partir
          </button>
        ) : (
          !status.complete &&
          ship.canFill && (
            <button type="button" className="button primary" onClick={ship.fillAll}>
              <Icon name="hammer" /> Poser
            </button>
          )
        )
      }
    >
      {enSignes ? (
        <>
          <p className="visually-hidden">{frenchTypography(`${etape}. ${phrase}`)}</p>
          <p className="world-fiche-phrase fiche-signes" aria-hidden="true">
            <PastillesDeLaNef stage={stage.stage} />{' '}
            <span className="signe">
              <Icon name="cube" /> {status.done}/{status.total}
            </span>{' '}
            {manque && (
              <span className="signe">
                <BlockIcon top={BLOCKS[manque[0]].top} side={BLOCKS[manque[0]].side} size={28} /> {manquants}
              </span>
            )}
          </p>
          {manque && (
            <p className="world-fiche-phrase">
              {blockCount(manque[0], manquants)} <EarnLink block={manque[0]} here={port} />.
            </p>
          )}
        </>
      ) : (
        <p className="world-fiche-phrase">
          <PastillesDeLaNef stage={ready ? stage.stage + 1 : stage.stage} /> <Syllabified text={frenchTypography(phrase)} />
        </p>
      )}
      <p className="build-status" role="status" aria-live="polite">
        {ship.notice ? frenchTypography(ship.notice) : ''}
      </p>
    </Fiche>
  );
}

/**
 * Un ouvrage : « Pont entre X et Y », ses blocs, « Poser » ; sinon ce qui manque ; « Déjà posé. » une fois construit. Un
 * ouvrage qui ouvre une île (GD-9, « Relier » ; piste A, des signes à la place des phrases) : le titre, fixe, est le nom
 * de l'île à ouvrir ; dessous, en signes, l'île de départ (l'icône d'un ouvrage et son nom), le coût (un cube et le
 * nombre) et, s'il manque des blocs, combien (jamais en rouge seul) ; quand l'île a plusieurs départs, « 2/3 » et le
 * chevron du départ suivant (dont le monde montre le fantôme et que la caméra cadre). La voix dit tout en mots.
 */
function FicheDeLOuvrage({ id, onBuilt, onClose, onVoirOuvrage }: Props & { id: string }) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const def = getBridge(id);
  const links = state.world.links;
  const ile = ileDeLOuvrage(id, links) ?? def?.from ?? 'french-6e-phonology';
  const { said, build } = useConstruireUnOuvrage(ile, onBuilt);
  if (!def) return null;
  const a = getBiome(def.from)?.name ?? def.from;
  const b = getBiome(def.to)?.name ?? def.to;
  const kind = linkKind(def, links);
  const world = { progress: state.progress, plans: state.world.parts };
  const etat = bridgeState(def, links, world);
  const have = payableBlocks(state.stock);
  // Une liaison vers un lieu d'option sans son option (« Pas de LV2 », « Pas d'option », GD-13) ne se construit pas.
  const sansOption = [def.from, def.to].map((i) => sansSonOption(getBiome(i), settings)).find((x) => x !== null) ?? null;
  const sansLv2 = sansOption !== null;
  const pret = etat === 'buildable' && have >= def.cost && !sansLv2;
  // Un ouvrage qui ouvre une île : ses départs possibles, du plus proche au plus loin.
  const open = reachableIslands(links);
  const ferme = etat !== 'built' && opensAnIsland(def, open) ? (open.has(def.from) ? def.to : def.from) : null;
  const departs = ferme ? linksToIsland(ferme, links, open) : [];
  const rang = departs.findIndex((d) => d.id === def.id);
  const suivant = departs.length > 1 ? departs[(rang + 1) % departs.length] : null;
  const nomDeLIle = ferme ? (getBiome(ferme)?.name ?? ferme) : '';
  const titre = ferme ? nomDeLIle : `${KIND_NAME[kind]} entre ${thePlace(a)} et ${thePlace(b)}`;
  const depart = ferme ? (getBiome(otherEnd(def, ferme))?.name ?? otherEnd(def, ferme)) : '';
  const quoi = withArticle(kind);
  const depuis = ferme ? `${quoi.charAt(0).toUpperCase()}${quoi.slice(1)} part ${ofPlace(depart)}. ` : '';
  const numero = ferme && departs.length > 1 && rang >= 0 ? `Départ ${rang + 1} sur ${departs.length}. ` : '';
  const phrase = sansOption
    ? sansOption.liaison
    : etat === 'far'
      ? `Il faut d’abord un chemin jusqu’${toPlace(a)} ou ${toPlace(b)}.`
      : etat === 'blocked'
        ? `${def.cost} blocs. ${conditionText(def, links) ?? ''}`.trim()
        : etat === 'built'
          ? 'Déjà posé.'
          : have >= def.cost
            ? `${depuis}${numero}${def.cost} blocs. Tu en as ${have}.`
            : `${depuis}${numero}${def.cost} blocs. Il t’en manque ${def.cost - have}.`;
  const texte = said ?? phrase;
  // En signes : l'île à relier attend un départ, des blocs ; la phrase reste pour ce qui empêche (LV2, chemin, condition).
  const enSignes = Boolean(ferme && !said && !sansLv2 && etat !== 'far' && etat !== 'blocked' && etat !== 'built');
  return (
    <Fiche
      titre={titre}
      icone="ouvrage"
      lecture={`${ferme ? `Relier ${thePlace(nomDeLIle)}` : titre}. ${texte}`}
      onClose={onClose}
      actions={
        !said &&
        (pret || (suivant && !sansLv2)) && (
          <>
            {pret && (
              <button type="button" className="button primary" onClick={() => build(def)}>
                <Icon name="hammer" /> Poser
              </button>
            )}
            {suivant && !sansLv2 && (
              <button
                type="button"
                className="button bouton-icone"
                aria-label={`Autre départ, ${rang + 1} sur ${departs.length}`}
                onClick={() => onVoirOuvrage(suivant.id, true)}
              >
                <span className="signe">
                  {rang + 1}/{departs.length}
                  <Icon name="chevronRight" />
                </span>
                <span className="mot-sous-icone" aria-hidden="true">
                  Autre départ
                </span>
              </button>
            )}
          </>
        )
      }
    >
      {enSignes ? (
        <>
          <p className="visually-hidden" role="status" aria-live="polite">
            {frenchTypography(texte)}
          </p>
          <p className="world-fiche-phrase fiche-signes" aria-hidden="true">
            <span className="signe">
              <Icon name="ouvrage" /> {depart}
            </span>{' '}
            <span className="signe">
              <Icon name="cube" /> {def.cost}
            </span>{' '}
            {have >= def.cost ? (
              <span className="signe">
                <Icon name="check" />
              </span>
            ) : (
              <span className="signe">
                <Icon name="blocks" /> −{def.cost - have}
              </span>
            )}
          </p>
        </>
      ) : (
        <Phrase text={texte} role="status" />
      )}
    </Fiche>
  );
}

/**
 * Une île pâle : l'indice de sa créature, la première fois la découverte des ouvrages, et « Relier » quand une liaison
 * directe tient (GD-9 : la fiche de l'ouvrage depuis l'île reliée la plus proche, `nearestDeparture`, le même départ
 * que la phrase et le fantôme du monde, d'où l'on peut choisir un autre départ). Sans liaison directe, pas de
 * « Relier » : la phrase dit l'île à relier d'abord.
 */
function FicheDeLIlePale({ ile, fiche, onVoirOuvrage, onClose }: Props & { ile: BiomeId }) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const biome = getBiome(ile);
  if (!biome) return null;
  const indice = accueilDeLIle(state, ile, sansSonOption(biome, settings), textes);
  const premier = nearestDeparture(ile, state.world.links);
  return (
    <Fiche
      titre={biome.name}
      icone="lock"
      lecture={`${biome.name}. ${biome.creature.name} : ${indice}${fiche.decouverte ? ` ${fiche.decouverte}` : ''}`}
      onClose={onClose}
      actions={
        premier && (
          <button type="button" className="button primary" onClick={() => onVoirOuvrage(premier.id)}>
            <Icon name="ouvrage" /> Relier
          </button>
        )
      }
    >
      <p className="world-fiche-phrase">
        <strong>{frenchTypography(`${biome.creature.name} :`)}</strong> <Syllabified text={frenchTypography(indice)} />
      </p>
      {fiche.decouverte && <Phrase text={fiche.decouverte} />}
    </Fiche>
  );
}

/**
 * Une créature : son nom, sa phrase ; sa plaque, avec la même priorité : une commande prête, « Livrer » ; l'étape de la
 * quête de sa région qui se fait chez elle (GD-10), son signe (l'objet, « 2/3 ») et « Donner » ou « Apporter » ; des
 * révisions, « Reprendre » (le bouton principal) et « Plus tard », avec les boutons de la fiche.
 */
function FicheDeLaCreature({ ile, fiche, onLivree, commandeEnCoursDePose = null, onClose }: Props & { ile: BiomeId }) {
  const { state, deliver, tapStory } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const biome = getBiome(ile);
  const rappel = useResidentReminder(biome && isBiomeUnlocked(ile, state.world.links) ? biome : undefined);
  const [livree, setLivree] = useState<{ id: string; text: string; quete?: { story: Story; index: number } } | null>(null);
  const [remis, setRemis] = useState(false);
  if (!biome) return null;
  const lieu = textes.assemblage.a;
  const nom = biome.creature.name;
  // Sa commande prête, qu'elle soit ou non la prochaine destination (celle que montre sa plaque) : « Livrer » dès que
  // les blocs sont là, sinon elle ne pourrait plus se livrer tant qu'autre chose passe avant elle (une mission à jouer
  // sur l'île, une autre commande prête).
  const prete = (textes.commandes && commandeALivrerChez(state, ile)) || null;
  const ouverte = textes.quetes && !prete ? openStoryOf(state.world, archipelagoOf(ile).classe) : null;
  const quete = ouverte && ouverte.step.place === ile ? ouverte : null;
  // L'étape se fait ici d'un toucher : elle passe avant les révisions ; sinon, les révisions d'abord (consultant UX UI).
  const queteFaisable = quete && canTapStep(state, quete.step) ? quete : null;
  const avecRappel = Boolean(rappel && !remis);
  const queteMontree = queteFaisable ?? (quete && !avecRappel ? quete : null);
  const posee = livree && commandeEnCoursDePose !== livree.id ? livree.text : null;
  const phrase = livree
    ? (posee ?? '')
    : prete
      ? texteDeLaCommande(prete, 'ready', lieu)
      : queteMontree
        ? stepSentence(state, queteMontree.step, textes.commandes?.tuEnAs)
        : rappel && !remis
          ? rappel.texte
          : (fiche.phrase ?? '');
  const enRappel = !prete && !queteMontree && !livree && rappel && !remis ? rappel : null;
  // Le signe de la quête, gardé après une étape faite ici (celui de l'étape suivante, ou toutes faites à la fin).
  const signe = livree?.quete ?? (queteMontree && !livree ? { story: queteMontree.story, index: queteMontree.index } : null);
  const luDuSigne = signe && textes.quetes ? `${storyBadgeReading(textes.quetes, signe.story, signe.index)} ` : '';
  const lecture = `${nom}. ${luDuSigne}${livree ? (posee ?? '') : enRappel ? enRappel.lu : phrase}`.trim();
  return (
    <Fiche
      titre={nom}
      icone={biome.icon}
      portrait={portraitEnMedaillon('creature', ile, biome.icon, () => <Creature biome={ile} />)}
      lecture={lecture}
      onClose={onClose}
      actions={
        prete && !livree ? (
          <button
            type="button"
            className="button primary"
            onClick={() => {
              const text = livrerLaCommande(prete, { deliver, onLivree, sons: settings.sounds, lieu });
              if (text) setLivree({ id: prete.id, text });
            }}
          >
            <Icon name="hammer" /> {textes.commandes?.livrer ?? 'Livrer'}
          </button>
        ) : queteFaisable && !livree ? (
          <StepButton
            step={queteFaisable.step}
            onClick={() => {
              const { story, index } = queteFaisable;
              const r = tapTheStep(story, { tapStory, onLivree, sons: settings.sounds });
              if (r) setLivree({ id: story.id, text: r.text, quete: { story, index: r.finished ? story.steps.length : index + 1 } });
            }}
          />
        ) : (
          enRappel && <ReminderButtons biome={biome} rappel={enRappel} onRemis={() => setRemis(true)} />
        )
      }
    >
      {enRappel ? (
        <p className="world-fiche-phrase">
          <ReminderText rappel={enRappel} />
        </p>
      ) : livree ? (
        <p className="world-fiche-phrase commande-posee" role="status" aria-live="polite">
          {signe && <StoryBadge story={signe.story} index={signe.index} />} {posee ? <Syllabified text={frenchTypography(posee)} /> : null}
        </p>
      ) : signe ? (
        <p className="world-fiche-phrase">
          <StoryBadge story={signe.story} index={signe.index} /> <Syllabified text={phrase} />
        </p>
      ) : (
        <Phrase text={phrase} />
      )}
      <LaterSaid dit={remis} />
    </Fiche>
  );
}

// La fiche d'un objet du monde (lot 2 de « Toucher le monde », spécification du consultant UX UI arbitrée par le
// directeur artistique) : toucher une borne, le Gardien, le Bloc-Navire, un ouvrage en fantôme, une île pâle ou une
// créature ouvre SA fiche, toujours à la même place (en bas, au-dessus de la barre ; en paysage, en bas à gauche), qui
// ne couvre jamais toute l'île. Peu de texte : un titre, une phrase au plus, un bouton principal. Elle reprend les
// actions qui existent déjà (Jouer, Défier, Poser le bloc suivant, Embarquer, Construire, Livrer, Reprendre, Plus tard)
// sans rien inventer. Un dialogue non modal : le focus va au titre à l'ouverture, Écouter relit tout, la croix et Échap
// la ferment (la page s'en charge, avec le toucher sur le sol).
// Dans les deux univers (proposition P2, PR 2, pour Blocland ; « 4a », 4 octobre 2026, pour Archipéo), la fiche de la
// créature et celle du Gardien portent leur portrait en médaillon, qui déborde au-dessus de la fiche ; les autres gardent
// l'icône du titre. Blocland le dessine en cubes, Archipéo avec son modèle en SVG (l'icône en attendant, ou en repli).
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Link } from 'react-router-dom';
import { Icon, type AnyIconName } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useASuivre } from '../components/useASuivre';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { useTextes } from '../univers';
import { blockCount, estIleLv2, getBiome, guardianTitle, missionsJouables, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { isBossBeaten, isBossOpen } from './boss';
import { useConstruireUnOuvrage } from './Bridges';
import { livrerLaCommande } from './Commandes';
import { accueilDeLIle } from './decouvertes';
import { currentStage, levelFor } from './engine';
import { pickExercise, questProgress } from './exercises';
import { explicationDuGardien } from './IslandSheet';
import { EarnLink } from './PlanSection';
import { BoutonsDuRappel, PlusTardDit, TexteDuRappel, useRappelDeLaCreature } from './RappelDeLaCreature';
import { shipSummary } from './ShipSection';
import { Stars } from './Stars';
import { Creature } from './Creatures';
import { habillageDuMonde } from './habillage';
import { VoxelScene } from './Voxel';
import { GUARDIAN_CUBES } from './world/personnages/gardiens';
import { statueDe } from './world/terrain';
import type { VehicleBuilder } from './useVehicleBuilder';
import { borneDe } from './world/affordance';
import type { ObjetDeLaFiche } from './world/disposition';
import { KIND_NAME, bridgeState, conditionText, getArchipelago, getBridge, isBiomeUnlocked, otherEnd, payableBlocks, remainingPath, type ArchipelagoId } from './world/archipelago';
import { estPrete, texteDeLaCommande, type Commande } from './world/commandes';
import { ileDeLOuvrage } from './world/modele';
import { earnIsland, whereToEarn } from './world/uses';
import { VEHICLE_NAME, VEHICLE_STAGES } from './world/vehicle';

/** Une fiche ouverte : son objet, et, pour une créature, la phrase tirée à l'ouverture. `seq` change à chaque ouverture. */
export interface FicheOuverte {
  objet: ObjetDeLaFiche;
  seq: number;
  /** Ouverte autrement que d'un toucher sur l'objet (« Y aller », « Voir le premier ouvrage ») : son signe saute. */
  saut: boolean;
  /** Ce que dit la créature touchée, quand elle n'a rien à proposer. */
  phrase?: string;
  /** Une île pâle touchée la première fois : la découverte des ouvrages, deuxième phrase de sa fiche. */
  decouverte?: string;
}

interface Props {
  fiche: FicheOuverte;
  onClose: () => void;
  /** Le chantier du Bloc-Navire du port de l'archipel. */
  ship: VehicleBuilder;
  /** Embarquer (`back` : un voyage déjà fait, vers l’île `dest`). */
  onBoard: (to: ArchipelagoId, back: boolean, dest?: BiomeId) => void;
  /** Un ouvrage vient d'être construit : l'île d'en face s'ouvre. */
  onBuilt: (to: BiomeId) => void;
  /** La commande prête et suggérée de la créature (sa plaque), s'il y en a une. */
  commande?: Commande;
  /** Une commande livrée : la scène pose sa petite construction ; `true` si elle en prend le son. */
  onLivree?: (c: Commande) => boolean;
  /** La commande dont la petite construction se pose : la phrase « posée » attend la fin. */
  commandeEnCoursDePose?: string | null;
  /** « Voir le premier ouvrage » d'une île pâle : la fiche de cet ouvrage. */
  onVoirOuvrage: (id: string) => void;
}

/** La fiche de l'objet touché ; la page la remonte à chaque ouverture (`key`). */
export function FicheDuMonde(props: Props) {
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
const PersonnageSvg = lazy(() => import('./PersonnageSvg'));

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
        <PersonnageSvg kind={kind} id={ile} allumage={allumage} />
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
  const exercise = biome ? missionsJouables(biome, settings.lv2).find((m) => m.id === mission) : undefined;
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

/** Le Gardien : ce qu'il attend (une phrase), ou « Rallumer » quand il est prêt, déjà rallumé avec ses étoiles (GD-8). */
function FicheDuGardien({ ile, onClose }: Props & { ile: BiomeId }) {
  const { state } = useBlocland();
  const textes = useTextes();
  const biome = getBiome(ile);
  if (!biome) return null;
  const unlocked = isBiomeUnlocked(ile, state.world.links);
  const pret = unlocked && isBossOpen(biome, state.progress);
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
      lecture={`${titre}. ${phrase}`}
      onClose={onClose}
      actions={
        pret && (
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
      {pret && vaincu && <Stars count={stars} label={textes.libelles.etoiles} />}
      <Phrase text={phrase} />
    </Fiche>
  );
}

const cap = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
/** Un point au bout d'une phrase qui n'a pas sa ponctuation finale. */
const finDePhrase = (text: string) => (/[.!?…]$/.test(text) ? text : `${text}.`);

/**
 * Le Bloc-Navire : l'étape en chantier sur ce port, ce qui manque et où le gagner (`EarnLink`) ; « Poser le bloc
 * suivant », ou « Embarquer vers… » quand tout est prêt ; « Poser tout ce que j'ai » en second. Le titre et la phrase
 * parlent du même chantier. Le voyage de ce port déjà fait : une phrase vers l'étape suivante, et « Y aller ».
 */
function FicheDuNavire({ port, ship, onBoard, onClose }: Props & { port: BiomeId }) {
  const { state } = useBlocland();
  const textes = useTextes();
  const { stage, status, launch } = ship;
  if (!stage || !status) {
    // Le voyage de ce port est fait : la prochaine étape, sur le port d'un autre archipel (ou plus rien à construire).
    const suite = currentStage(state);
    const titre = cap(VEHICLE_NAME);
    const phrase = suite ? `La prochaine étape est au port des ${textes.archipels[suite.from]}.` : `${cap(VEHICLE_NAME)} a fait tous ses voyages.`;
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
  const titre = `${cap(VEHICLE_NAME)} : étape ${stage.stage} sur ${VEHICLE_STAGES.length}`;
  const ready = Boolean(launch?.ok);
  const attend = launch && !launch.ok && launch.reason === 'gardiens' ? launch : null;
  // Le premier bloc qui manque (dans l'inventaire aussi) : où le gagner.
  const manque = !ready && !attend ? ((Object.entries(status.missing) as [BlockId, number][]).find(([b, n]) => n > (state.stock[b] ?? 0)) ?? null) : null;
  const ou = manque ? (earnIsland(manque[0])?.name ?? whereToEarn(manque[0])) : '';
  const phrase = manque
    ? `${status.done} blocs posés sur ${status.total}. Il manque ${blockCount(manque[0], manque[1] - (state.stock[manque[0]] ?? 0))}, `
    : attend && status.complete
      ? textes.libelles.navireAttend(attend.missing)
      : finDePhrase(shipSummary(ship, state.stock, textes));
  const lecture = `${titre}. ${phrase}${manque ? `à gagner dans ${ou}.` : ''}`;
  const suivant = getArchipelago(stage.to);
  return (
    <Fiche
      titre={titre}
      icone="ship"
      lecture={lecture}
      onClose={onClose}
      actions={
        ready ? (
          <button type="button" className="button primary" onClick={() => onBoard(stage.to, false)}>
            <Icon name="ship" /> Embarquer vers les {textes.archipels[suivant.classe]}
          </button>
        ) : (
          !status.complete &&
          ship.canFill && (
            <>
              <button type="button" className="button primary" onClick={ship.fillNext}>
                <Icon name="hammer" /> Poser le bloc suivant
              </button>
              <button type="button" className="button" onClick={ship.fillAll}>
                <Icon name="blocks" /> Poser tout ce que j’ai
              </button>
            </>
          )
        )
      }
    >
      <p className="world-fiche-phrase">
        <Syllabified text={frenchTypography(phrase)} />
        {manque && (
          <>
            <EarnLink block={manque[0]} here={port} />.
          </>
        )}
      </p>
      <p className="build-status" role="status" aria-live="polite">
        {ship.notice ? frenchTypography(ship.notice) : ''}
      </p>
    </Fiche>
  );
}

/** Un ouvrage en fantôme : « Pont entre X et Y », ses blocs, « Construire » ; sinon ce qui manque. */
function FicheDeLOuvrage({ id, onBuilt, onClose }: Props & { id: string }) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const def = getBridge(id);
  const ile = ileDeLOuvrage(id, state.world.links) ?? def?.from ?? 'french-6e-phonology';
  const { said, build } = useConstruireUnOuvrage(ile, onBuilt);
  if (!def) return null;
  const a = getBiome(def.from)?.name ?? def.from;
  const b = getBiome(def.to)?.name ?? def.to;
  const titre = `${KIND_NAME[def.kind]} entre ${a} et ${b}`;
  const world = { progress: state.progress, plans: state.world.parts };
  const etat = bridgeState(def, state.world.links, world);
  const have = payableBlocks(state.stock);
  const sansLv2 = settings.lv2 === 'none' && [def.from, def.to].some((i) => getBiome(i)?.subject === 'lv2');
  const pret = etat === 'buildable' && have >= def.cost && !sansLv2;
  const phrase = sansLv2
    ? 'Choisis d’abord une LV2 dans les Réglages.'
    : etat === 'far'
      ? `Il faut d’abord un chemin jusqu’à ${a} ou ${b}.`
      : etat === 'blocked'
        ? `${def.cost} blocs. ${conditionText(def, state.world.links) ?? ''}`.trim()
        : etat === 'built'
          ? 'Déjà construit.'
          : have >= def.cost
            ? `${def.cost} blocs. Tu en as ${have}.`
            : `${def.cost} blocs. Il t’en manque ${def.cost - have}.`;
  const texte = said ?? phrase;
  return (
    <Fiche
      titre={titre}
      icone="ouvrage"
      lecture={`${titre}. ${texte}`}
      onClose={onClose}
      actions={
        pret &&
        !said && (
          <button type="button" className="button primary" onClick={() => build(def, getBiome(otherEnd(def, ile))?.name ?? '')}>
            <Icon name="hammer" /> Construire
          </button>
        )
      }
    >
      <Phrase text={texte} role="status" />
    </Fiche>
  );
}

/**
 * Une île pâle : l'indice de sa créature, la première fois la découverte des ouvrages, et « Voir le premier ouvrage » (la
 * fiche de cet ouvrage).
 */
function FicheDeLIlePale({ ile, fiche, onVoirOuvrage, onClose }: Props & { ile: BiomeId }) {
  const { state } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const biome = getBiome(ile);
  if (!biome) return null;
  const indice = accueilDeLIle(state, ile, estIleLv2(biome) && settings.lv2 === 'none', textes);
  const premier = remainingPath(ile, state.world.links)[0];
  return (
    <Fiche
      titre={biome.name}
      icone="lock"
      lecture={`${biome.name}. ${biome.creature.name} : ${indice}${fiche.decouverte ? ` ${fiche.decouverte}` : ''}`}
      onClose={onClose}
      actions={
        premier && (
          <button type="button" className="button primary" onClick={() => onVoirOuvrage(premier.id)}>
            <Icon name="hammer" /> Voir le premier ouvrage
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
 * Une créature : son nom, sa phrase ; sa plaque, avec la même priorité : une commande prête, « Livrer » ; des révisions,
 * « Reprendre » (le bouton principal) et « Plus tard », avec les boutons de la fiche.
 */
function FicheDeLaCreature({ ile, fiche, commande, onLivree, commandeEnCoursDePose = null, onClose }: Props & { ile: BiomeId }) {
  const { state, deliver } = useBlocland();
  const { settings } = useSettings();
  const textes = useTextes();
  const biome = getBiome(ile);
  const rappel = useRappelDeLaCreature(biome && isBiomeUnlocked(ile, state.world.links) ? biome : undefined);
  const [livree, setLivree] = useState<{ id: string; text: string } | null>(null);
  const [remis, setRemis] = useState(false);
  if (!biome) return null;
  const lieu = textes.assemblage.a;
  const nom = biome.creature.name;
  const prete = commande && commande.biome === ile && estPrete(state, commande) ? commande : null;
  const posee = livree && commandeEnCoursDePose !== livree.id ? livree.text : null;
  const phrase = livree ? (posee ?? '') : prete ? texteDeLaCommande(prete, 'ready', lieu) : rappel && !remis ? rappel.texte : (fiche.phrase ?? '');
  const enRappel = !prete && !livree && rappel && !remis ? rappel : null;
  const lecture = `${nom}. ${livree ? (posee ?? '') : enRappel ? enRappel.lu : phrase}`.trim();
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
        ) : (
          enRappel && <BoutonsDuRappel biome={biome} rappel={enRappel} onRemis={() => setRemis(true)} />
        )
      }
    >
      {enRappel ? (
        <p className="world-fiche-phrase">
          <TexteDuRappel rappel={enRappel} />
        </p>
      ) : livree ? (
        <p className="world-fiche-phrase commande-posee" role="status" aria-live="polite">
          {posee ? <Syllabified text={frenchTypography(posee)} /> : null}
        </p>
      ) : (
        <Phrase text={phrase} />
      )}
      <PlusTardDit dit={remis} />
    </Fiche>
  );
}

// La fiche de la Nef du monde continu (GD-21 ; GD-15, option A du consultant UX UI) : le panneau d'un lieu
// (`MissionSheet`), « La Nef » pour titre, puis en signes les trois pastilles des formes, la jauge des blocs posés et,
// s'il en manque, l'icône des blocs suivie de leur nombre, avec où les gagner ; un seul bouton, « Poser » (tout ce qu'on
// a), puis « Partir » à la même place, quand la voile est hissée. Le monde continu n'a pas de Gardiens : la voile arrive
// avec les lieux achevés. Aucune phrase d'échec ; la voix lit tout en mots. Toucher la Nef ne la fait jamais partir.
import { useEffect, useRef } from 'react';
import { Icon } from '../../../components/Icon';
import { Syllabified } from '../../../components/Syllabified';
import { frenchTypography } from '../../../components/math/RichText';
import { useTextes } from '../../../universes';
import { BLOCKS, blockCount, type BiomeId, type BlockId } from '../../biomes';
import { useBlocland } from '../../BloclandContext';
import { planStatus, type GameState } from '../../engine';
import { EarnLink, useEarnWhere } from '../../PlanSection';
import { useVehicleBuilder } from '../../useVehicleBuilder';
import { BlockIcon } from '../../Voxel';
import { voyageId, type ArchipelagoId } from '../../world/archipelago';
import { nefLook, type NefLook } from '../../world/continu/nef';
import { planCells } from '../../world/plans';
import { VEHICLE_NAME, VEHICLE_STAGES, kitReady, stageWords, type VehicleStage } from '../../world/vehicle';
import { MissionSheet, useOpenPanel } from './PortPanels';

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/**
 * La forme de la Nef qui se construit au lieu de départ d'un niveau du monde continu : le voilier au 6e (son chantier à
 * l'Escale), le dirigeable au 5e (à la Lisière, GD-22, lot 4).
 */
export const nefStageOf = (level: ArchipelagoId): VehicleStage => VEHICLE_STAGES.find((s) => s.from === level) ?? VEHICLE_STAGES[0];

/**
 * Le dernier temps de la Nef du monde continu, qui n'a pas de Gardiens : il arrive avec autant de lieux achevés que la
 * grille demande de Gardiens rallumés (trois en 6e pour la voile, deux en 5e pour le gouvernail : règle de GD-21,
 * décision du mainteneur du 19 octobre 2026), ou avec les Gardiens rallumés dans la grille. `missing` : les lieux qu'il
 * reste à achever.
 */
export function nefSail(state: GameState, achieved: number, stage: VehicleStage = VEHICLE_STAGES[0]): { kit: boolean; missing: number } {
  const kit = kitReady(stage, state.progress) || achieved >= stage.guardians;
  return { kit, missing: kit ? 0 : stage.guardians - achieved };
}

/** Le temps de la Nef dans une sauvegarde : la coque (ses cases du bas), toutes les cases, la voile, le voyage fait. */
export function nefLookOf(state: GameState, kit: boolean, stage: VehicleStage = VEHICLE_STAGES[0]): NefLook {
  const done = new Set(state.world.parts[stage.id] ?? []);
  const hull = planCells(stage, stage.cells.filter((c) => c.z === 0)).every((c) => done.has(c.key));
  return nefLook({ hull, all: planStatus(state, stage).complete, sail: kit, departed: state.world.links.includes(voyageId(stage.to)) });
}

/**
 * Les trois pastilles des temps de la Nef du monde continu (la coque, le mât, la voile ; GD-21) : fait (pleine, avec une
 * coche), en cours (pleine), à venir (un anneau) ; l'état se lit à la forme, pas à la couleur seule. Les pastilles des
 * formes de la grille (`PastillesDeLaNef`) compteraient le voilier, le dirigeable et l'aéronef : ici, un seul voyage.
 * Les mêmes pastilles aux deux niveaux : aucun dessin sur la troisième (le gouvernail en croix se lisait « + » à 16 px ;
 * directeur artistique, seconde passe du lot 4) ; le mot « gouvernail » reste dans les textes.
 */
function PastillesDesTemps({ look }: { look: NefLook }) {
  return (
    <span className="signe nef-pastilles" aria-hidden="true">
      {([1, 2, 3] as const).map((t) => (
        <span key={t} className={`nef-pastille${t <= look ? ' faite' : t === look + 1 ? ' en-cours' : ''}`}>
          {t <= look && <Icon name="check" />}
        </span>
      ))}
    </span>
  );
}

/**
 * Ce que dit la Nef qui a tous ses blocs et attend son dernier temps (la voile du voilier, le gouvernail du dirigeable) :
 * une seule idée, ce qu'il reste à faire, jamais un manque (référent dys, retouche du lot 4) ; la même à l'écran, au
 * lecteur d'écran et à la voix.
 */
export function nefWaitLabel(missing: number): string {
  return `Encore ${missing} lieu${missing > 1 ? 'x' : ''} à achever.`;
}

/** Ce que dit la Nef prête : sa destination seule (référent dys et consultant UX UI, retouche du lot 4). */
export const nefReadyLabel = (to: string): string => `Prête. Direction : les ${to}.`;

/** L'annonce du départ, au lecteur d'écran et à la voix (référent dys, retouche du lot 4). */
export const NEF_LEAVES = `${cap(VEHICLE_NAME)} part.`;

interface Props {
  /** La forme qui se construit au lieu de départ du niveau (`nefStageOf`). */
  stage: VehicleStage;
  /** La voile est arrivée (assez de lieux achevés, ou de Gardiens rallumés dans la grille). */
  kit: boolean;
  /** Les lieux qu'il reste à achever pour la voile. */
  missing: number;
  /** « Partir » : la page ferme la fiche, la Nef part, puis le voyage se fait. */
  onDepart(stage: VehicleStage): void;
  /** « Carte » : la fiche se ferme, la Carte s'ouvre (les lieux à achever). */
  onMap(): void;
  onClose(): void;
}

export function NefSheet({ stage: building, kit, missing, onDepart, onMap, onClose }: Props) {
  useOpenPanel(onClose);
  const { state } = useBlocland();
  const textes = useTextes();
  const port: BiomeId = building.biome;
  const vers = textes.archipels[building.to];
  const ship = useVehicleBuilder(port, { kit, waiting: nefWaitLabel(missing), ready: nefReadyLabel(vers) });
  const earnWhere = useEarnWhere();
  const { stage, status, launch } = ship;
  const titre = cap(VEHICLE_NAME);
  // Le focus va sur le bouton d'action à l'ouverture (consultant UX UI), « Poser » ou « Partir ».
  const action = useRef<HTMLButtonElement>(null);
  const ready = Boolean(launch?.ok);
  useEffect(() => {
    action.current?.focus();
  }, [ready]);
  if (!stage || !status) {
    const phrase = `${titre} a fait son voyage.`;
    return (
      <MissionSheet id="panneau-nef" className="nef-sheet" icon="ship" title={titre} onClose={onClose}>
        <p className="world-fiche-phrase">
          <Syllabified text={frenchTypography(phrase)} />
        </p>
      </MissionSheet>
    );
  }
  const waiting = status.complete && !kit;
  // Le premier bloc qui manque (dans l'inventaire aussi) : où le gagner.
  const manque = !status.complete ? ((Object.entries(status.missing) as [BlockId, number][]).find(([b, n]) => n > (state.stock[b] ?? 0)) ?? null) : null;
  const manquants = manque ? manque[1] - (state.stock[manque[0]] ?? 0) : 0;
  const ou = manque ? earnWhere(manque[0]) : '';
  const nom = stageWords(stage, textes.libelles.formesDeLaNef).name;
  const etape = `${cap(nom)}`;
  const look = nefLookOf(state, kit, building);
  const phrase = ready
    ? nefReadyLabel(textes.archipels[stage.to])
    : waiting
      ? nefWaitLabel(missing)
      : manque
        ? `${status.done} blocs posés sur ${status.total}. Il manque ${blockCount(manque[0], manquants)}, à gagner ${ou}.`
        : `${status.done} blocs posés sur ${status.total}.`;
  // En signes tant qu'on construit ou qu'elle attend sa voile (le moins de texte possible, consultant UX UI) ; une
  // phrase quand elle est prête.
  const enSignes = !ready;
  return (
    <MissionSheet id="panneau-nef" className="nef-sheet" icon="ship" title={titre} onClose={onClose}>
      {enSignes ? (
        <>
          {/* Une seule idée quand elle attend son dernier temps (référent dys) ; sinon la forme, puis la jauge. */}
          <p className="visually-hidden">{frenchTypography(waiting ? phrase : `${etape}. ${phrase}`)}</p>
          <p className="world-fiche-phrase fiche-signes" aria-hidden="true">
            <PastillesDesTemps look={look} />{' '}
            <span className="signe">
              <Icon name="cube" /> {status.done}/{status.total}
            </span>{' '}
            {waiting && (
              <span className="signe">
                <Icon name="map" /> {missing}
              </span>
            )}
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
          {waiting && (
            <p className="world-fiche-phrase" aria-hidden="true">
              <Syllabified text={frenchTypography(phrase)} />
            </p>
          )}
        </>
      ) : (
        <p className="world-fiche-phrase">
          <PastillesDesTemps look={look} /> <Syllabified text={frenchTypography(phrase)} />
        </p>
      )}
      <div className="nef-sheet-actions">
        {ready ? (
          <button ref={action} type="button" className="button primary" aria-label={`Partir vers les ${textes.archipels[stage.to]}`} onClick={() => onDepart(stage)}>
            <Icon name="ship" /> Partir
          </button>
        ) : waiting ? (
          // Achever un lieu se fait ailleurs : la Carte montre les lieux et leur état.
          <button ref={action} type="button" className="button" onClick={onMap}>
            <Icon name="map" /> Carte
          </button>
        ) : (
          ship.canFill && (
            <button ref={action} type="button" className="button primary" onClick={ship.fillAll}>
              <Icon name="hammer" /> Poser
            </button>
          )
        )}
      </div>
      <p className="build-status" role="status" aria-live="polite">
        {ship.notice ? frenchTypography(ship.notice) : ''}
      </p>
    </MissionSheet>
  );
}

import { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, BLOCKS, isBiomeUnlocked, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { BuildGrid } from './BuildGrid';
import { useProgress } from '../core/ProgressContext';
import { FREE_ZONE, MAX_HEIGHT, columnHeight, inFreeZone, nextFillable, planCellAt, planStatus, placedOn, type PlaceReason } from './engine';
import { PlanPanel, whereToEarn } from './PlanPanel';
import { playDone, playNope, playPlace, playRemove } from './sound';
import { WorldCanvas, hasWebGL } from './three';
import { BlockIcon } from './Voxel';
import { plansFor } from './world/plans';
import { creaturePlacements, freeZoneOf, islandOrigin, toIslandCell, worldCubes } from './world/terrain';
import { useAmbience } from './useAmbience';
import { daylight } from './world/daylight';

type Mode = 'poser' | 'retirer';

const REASONS: Record<PlaceReason, string> = {
  'plus-de-blocs': 'Tu n’as plus de blocs de ce type. Gagne-en dans les biomes !',
  'trop-haut': `On ne monte pas plus haut que ${MAX_HEIGHT} blocs.`,
  'hors-zone': 'Ici, ce n’est pas la zone libre : pose tes blocs sur le tapis jaune.',
  occupe: 'Il y a déjà un bloc ici.',
};

/** Le chantier : on construit ce qu'on veut sur la zone libre de chaque île, dans le village en 3D ou dans la vue simple. */
export function ChantierPage() {
  const { state, placeAt, placeOnColumn, removeAt, removeFromColumn, clearIsland, fillPlan } = useBlocland();
  const { settings, update, speak } = useSettings();
  const { completePlan } = useProgress();
  const webgl = hasWebGL();
  const in3d = settings.view3d && webgl;
  const unlockedIslands = BIOMES.filter((b) => isBiomeUnlocked(b.id, state.progress)).map((b) => b.id);
  const [island, setIsland] = useState<BiomeId>(unlockedIslands[0] ?? 'foret');
  const [seq, setSeq] = useState(1);
  const [forceDay, setForceDay] = useState(false);
  const [burst, setBurst] = useState<{ seq: number; cell: { x: number; y: number; z: number }; color: string }>({
    seq: 0,
    cell: { x: 0, y: 0, z: 0 },
    color: '#fff',
  });
  useAmbience(forceDay);
  const night = !forceDay && daylight().light < 0.5;
  const cells = placedOn(state, island);
  const blocks = (Object.keys(BLOCKS) as BlockId[]).filter((b) => (state.inventory[b] ?? 0) > 0 || cells.some((c) => c.block === b));
  const [selectedBlock, setSelectedBlock] = useState<BlockId | null>(() => blocks[0] ?? null);
  const [mode, setMode] = useState<Mode>('poser');
  const [cell, setCell] = useState<{ x: number; y: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const total = Object.values(state.inventory).reduce((a, b) => a + (b ?? 0), 0);
  const sound = (f: () => void) => settings.sounds && f();
  // Le plan en cours de l'île : le premier qui n'est pas terminé (sinon le dernier, pour afficher « terminé »).
  const plans = plansFor(island);
  const plan = plans.find((p) => !planStatus(state, p).complete) ?? plans[plans.length - 1];
  const status = plan ? planStatus(state, plan) : null;

  // Le premier type disponible est présélectionné dès qu'il y en a un.
  useEffect(() => {
    if (selectedBlock === null && blocks[0]) setSelectedBlock(blocks[0]);
  }, [blocks, selectedBlock]);

  const chooseIsland = (id: BiomeId) => {
    setIsland(id);
    setSeq((n) => n + 1);
    setCell(null);
    setNotice(null);
    setConfirmClear(false);
  };

  /** Éclats de la couleur du bloc à une case relative à l'île (z relatif). */
  const sparkle = (x: number, y: number, z: number, block: BlockId) => {
    const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === island));
    setBurst((b) => ({ seq: b.seq + 1, cell: { x: ox + x, y: oy + y, z: z + 1 }, color: BLOCKS[block].top }));
  };
  const afterPlace = (ok: boolean, reason?: PlaceReason) => {
    if (ok) {
      setNotice(null);
      sound(playPlace);
    } else {
      setNotice(reason ? REASONS[reason] : null);
      sound(playNope);
    }
  };
  const afterRemove = (removed: BlockId | null) => {
    if (removed) {
      setNotice(`Bloc de ${BLOCKS[removed].name.toLowerCase()} rangé dans l’inventaire.`);
      sound(playRemove);
    } else {
      setNotice('Rien à retirer ici : touche un bloc que tu as posé.');
      sound(playNope);
    }
  };

  /** Pose le bloc attendu à une cellule du plan (coordonnées relatives à l'île). */
  const fillAt = (x: number, y: number, z: number) => {
    if (!plan) return;
    const r = fillPlan(plan, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc de ${BLOCKS[r.block].name.toLowerCase()} : va dans ${whereToEarn(r.block)}.`);
      else if (r.reason === 'deja-pose') setNotice('Ce bloc du plan est déjà posé.');
      sound(playNope);
      return;
    }
    sparkle(x, y, z, r.block);
    if (r.completed) {
      const chest = Object.entries(plan.reward.chest)
        .map(([b, n]) => `${n} ${BLOCKS[b as BlockId].name.toLowerCase()}`)
        .join(', ');
      const msg = `${plan.name} : terminé ! ${plan.done} Coffre : ${chest}. +${plan.reward.xp} XP.`;
      setNotice(msg);
      completePlan(plan.reward.xp);
      sound(playDone);
      if (settings.autoRead) speak(msg);
    } else {
      setNotice(null);
      sound(playPlace);
    }
  };
  const fillNext = () => {
    if (!plan) return;
    const next = nextFillable(state, plan);
    if (next) fillAt(next.x, next.y, next.z);
  };

  /** Vue simple : la case (x, y) de la zone libre, en colonne. */
  const onColumn = (gx: number, gy: number) => {
    const x = FREE_ZONE.x + gx;
    const y = FREE_ZONE.y + gy;
    if (mode === 'retirer') return afterRemove(removeFromColumn(island, x, y));
    if (!selectedBlock) return setNotice('Choisis d’abord un type de bloc.');
    const r = placeOnColumn(island, x, y, selectedBlock);
    if (r.ok) sparkle(x, y, columnHeight(placedOn(r.state, island), x, y) - 1, selectedBlock);
    afterPlace(r.ok, r.ok ? undefined : r.reason);
  };

  /** 3D : on a touché la face d'un bloc (`hit`) ; la case devant est `next`. */
  const onFace = (hit: { x: number; y: number; z: number }, next: { x: number; y: number; z: number }) => {
    // Une cellule du plan (fantôme ou déjà posée) : on y pose le bloc attendu, quel que soit le mode.
    if (plan) {
      const h = toIslandCell(island, hit.x, hit.y, hit.z);
      if (planCellAt(plan, h.x, h.y, h.z)) return fillAt(h.x, h.y, h.z);
    }
    if (mode === 'retirer') {
      const c = toIslandCell(island, hit.x, hit.y, hit.z);
      return afterRemove(removeAt(island, c.x, c.y, c.z));
    }
    if (!selectedBlock) return setNotice('Choisis d’abord un type de bloc.');
    const c = toIslandCell(island, next.x, next.y, next.z);
    if (!inFreeZone(c.x, c.y)) return afterPlace(false, 'hors-zone');
    const r = placeAt(island, c.x, c.y, c.z, selectedBlock);
    if (r.ok) sparkle(c.x, c.y, c.z, selectedBlock);
    afterPlace(r.ok, r.ok ? undefined : r.reason);
  };

  const gridCells = cells.map((c) => ({ ...c, x: c.x - FREE_ZONE.x, y: c.y - FREE_ZONE.y }));

  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Carte de Blocland
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> Chantier
      </h1>
      <p className="intro">
        <Syllabified text="Chaque île a un terrain libre. Choisis un bloc, puis touche une case pour le poser. Rien ne tombe, rien ne casse." />
      </p>

      <div className="world-nav" role="group" aria-label="Île">
        {BIOMES.map((b) => {
          const unlocked = unlockedIslands.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              className={`button${island === b.id ? ' primary' : ''}`}
              aria-pressed={island === b.id}
              disabled={!unlocked}
              onClick={() => chooseIsland(b.id)}
            >
              {!unlocked && <Icon name="lock" />} {b.name}
            </button>
          );
        })}
      </div>

      {plan && status && <PlanPanel plan={plan} status={status} canFill={!status.complete && nextFillable(state, plan) !== null} onFillNext={fillNext} />}

      <section className="panel inventory" aria-labelledby="inventaire-titre">
        <h2 id="inventaire-titre" className="section-title inventory-title">
          <Icon name="blocks" /> Mes blocs ({total})
        </h2>
        {blocks.length === 0 ? (
          <p>
            Ton inventaire est vide. <Link to="/aventure">Va gagner des blocs dans les biomes !</Link>
          </p>
        ) : (
          <div className="palette" role="radiogroup" aria-label="Type de bloc à poser">
            {blocks.map((b) => {
              const n = state.inventory[b] ?? 0;
              return (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={selectedBlock === b && mode === 'poser'}
                  className={`palette-block${selectedBlock === b && mode === 'poser' ? ' selected' : ''}${n === 0 ? ' empty' : ''}`}
                  onClick={() => {
                    setSelectedBlock(b);
                    setMode('poser');
                  }}
                >
                  <BlockIcon top={BLOCKS[b].top} side={BLOCKS[b].side} size={40} />
                  <span className="palette-name">{BLOCKS[b].name}</span>
                  <span className="palette-count">{n}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="build-modes" role="group" aria-label="Action">
          <button type="button" className={`button${mode === 'poser' ? ' primary' : ''}`} aria-pressed={mode === 'poser'} onClick={() => setMode('poser')}>
            <Icon name="hammer" /> Poser
          </button>
          <button
            type="button"
            className={`button${mode === 'retirer' ? ' primary' : ''}`}
            aria-pressed={mode === 'retirer'}
            onClick={() => setMode('retirer')}
          >
            <Icon name="pickaxe" /> Retirer
          </button>
          <button type="button" className="button" aria-pressed={!settings.sounds} onClick={() => update({ sounds: !settings.sounds })}>
            <Icon name={settings.sounds ? 'volume' : 'volumeOff'} /> {settings.sounds ? 'Couper les sons' : 'Remettre les sons'}
          </button>
          {night && (
            <button type="button" className="button" onClick={() => setForceDay(true)}>
              <Icon name="sun" /> Forcer le jour
            </button>
          )}
          {forceDay && (
            <button type="button" className="button" onClick={() => setForceDay(false)}>
              <Icon name="moon" /> Revenir à l’heure réelle
            </button>
          )}
        </div>
      </section>

      <div className="panel build-panel">
        <div className="view-toggle">
          {webgl ? (
            <button type="button" className="button" aria-pressed={in3d} onClick={() => update({ view3d: !settings.view3d })}>
              <Icon name="blocks" /> {in3d ? 'Passer en vue simple' : 'Passer en vue 3D'}
            </button>
          ) : (
            <span className="view-note">Vue simple (la 3D n’est pas disponible sur cet appareil).</span>
          )}
          {in3d && <span className="view-note">Touche une face pour poser à côté, touche un bloc posé pour le retirer. Le tapis jaune est ta zone libre.</span>}
        </div>
        {in3d ? (
          <Suspense fallback={<p className="loading">Chargement du village…</p>}>
            <WorldCanvas
              cubes={worldCubes(state.progress, state.village, false)}
              creatures={creaturePlacements(state.progress)}
              forceDay={forceDay}
              burst={burst}
              focus={{ island, seq }}
              reduceMotion={settings.reduceMotion}
              build={{ zone: freeZoneOf(island), onPickFace: onFace }}
              className="voxel-canvas-world"
              label={`Chantier en 3D : ${BIOMES.find((b) => b.id === island)?.name}`}
            />
          </Suspense>
        ) : (
          <BuildGrid build={gridCells} width={FREE_ZONE.w} height={FREE_ZONE.h} selected={cell} onSelect={(x, y) => setCell({ x, y })} onAction={onColumn} />
        )}
        <p className="build-status" role="status" aria-live="polite">
          {notice ??
            `${cells.length} bloc${cells.length > 1 ? 's' : ''} posé${cells.length > 1 ? 's' : ''} sur cette île (zone libre de ${FREE_ZONE.w} × ${FREE_ZONE.h} cases).`}
        </p>
      </div>

      {cells.length > 0 && (
        <div className="actions">
          {confirmClear ? (
            <>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  clearIsland(island);
                  setConfirmClear(false);
                  setNotice('Tout est rangé dans l’inventaire.');
                }}
              >
                Oui, tout démonter
              </button>
              <button type="button" className="button" onClick={() => setConfirmClear(false)}>
                Annuler
              </button>
            </>
          ) : (
            <button type="button" className="button" onClick={() => setConfirmClear(true)}>
              Tout démonter sur cette île (les blocs reviennent dans l’inventaire)
            </button>
          )}
        </div>
      )}
      {!in3d && cell && <span className="visually-hidden">{`Colonne ${cell.x + 1}, ${cell.y + 1} : ${columnHeight(gridCells, cell.x, cell.y)} bloc(s)`}</span>}
    </>
  );
}

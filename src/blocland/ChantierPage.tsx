import { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { BuildGrid } from './BuildGrid';
import { GRID_SIZE, MAX_HEIGHT } from './engine';
import { BlockIcon } from './Voxel';
import { VoxelCanvas, hasWebGL } from './three';
import { useSettings } from '../core/SettingsContext';
import { columnHeight } from './engine';

type Mode = 'poser' | 'retirer';

const REASONS: Record<string, string> = {
  'plus-de-blocs': 'Tu n’as plus de blocs de ce type. Gagne-en dans les biomes !',
  'trop-haut': `Cette colonne est déjà haute de ${MAX_HEIGHT} blocs.`,
  'hors-grille': 'Cette case est en dehors du chantier.',
};

/** Le chantier : inventaire des blocs et grille de construction libre (poser / retirer, sans physique). */
export function ChantierPage() {
  const { state, place, remove, clearBuild } = useBlocland();
  const { settings, update } = useSettings();
  const webgl = hasWebGL();
  const in3d = settings.view3d && webgl;
  const blocks = (Object.keys(BLOCKS) as BlockId[]).filter((b) => (state.inventory[b] ?? 0) > 0 || state.build.some((c) => c.block === b));
  const [selectedBlock, setSelectedBlock] = useState<BlockId | null>(() => blocks[0] ?? null);
  const [mode, setMode] = useState<Mode>('poser');
  const [cell, setCell] = useState<{ x: number; y: number } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const total = Object.values(state.inventory).reduce((a, b) => a + (b ?? 0), 0);

  const onAction = (x: number, y: number) => {
    if (mode === 'retirer') {
      const removed = remove(x, y);
      setNotice(removed ? `Bloc de ${BLOCKS[removed].name.toLowerCase()} rangé dans l’inventaire.` : 'Rien à retirer ici.');
      return;
    }
    if (!selectedBlock) {
      setNotice('Choisis d’abord un type de bloc.');
      return;
    }
    const r = place(x, y, selectedBlock);
    setNotice(r.ok ? null : REASONS[r.reason]);
  };

  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> Carte de Blocland
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> Chantier
      </h1>
      <p className="intro">
        <Syllabified text="Choisis un bloc, puis touche une case pour le poser. Les blocs s’empilent. Rien ne tombe, rien ne casse." />
      </p>

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
          <button type="button" className={`button${mode === 'retirer' ? ' primary' : ''}`} aria-pressed={mode === 'retirer'} onClick={() => setMode('retirer')}>
            <Icon name="pickaxe" /> Retirer
          </button>
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
          {in3d && <span className="view-note">Glisse pour tourner, pince pour zoomer, touche une case pour poser.</span>}
        </div>
        {in3d ? (
          <Suspense fallback={<p className="loading">Chargement de la 3D…</p>}>
            <VoxelCanvas
              cubes={state.build.map((c) => ({ x: c.x, y: c.y, z: c.z, color: BLOCKS[c.block].side, top: BLOCKS[c.block].top }))}
              gridSize={GRID_SIZE}
              selected={cell}
              selectedHeight={cell ? columnHeight(state.build, cell.x, cell.y) : 0}
              reduceMotion={settings.reduceMotion}
              onPick={(x, y) => {
                setCell({ x, y });
                onAction(x, y);
              }}
              className="voxel-canvas-build"
              label="Chantier en 3D"
            />
          </Suspense>
        ) : (
          <BuildGrid build={state.build} selected={cell} onSelect={(x, y) => setCell({ x, y })} onAction={onAction} />
        )}
        <p className="build-status" role="status" aria-live="polite">
          {notice ?? `${state.build.length} bloc${state.build.length > 1 ? 's' : ''} posé${state.build.length > 1 ? 's' : ''} sur le chantier (${GRID_SIZE} × ${GRID_SIZE} cases).`}
        </p>
      </div>

      {state.build.length > 0 && (
        <div className="actions">
          {confirmClear ? (
            <>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  clearBuild();
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
              Tout démonter (les blocs reviennent dans l’inventaire)
            </button>
          )}
        </div>
      )}
    </>
  );
}

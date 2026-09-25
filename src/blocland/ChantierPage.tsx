import { Suspense, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { useSettings } from '../core/SettingsContext';
import { BIOMES, BLOCKS, ofBlock, type BiomeId, type BlockId } from './biomes';
import { isBiomeUnlocked } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { useProgress } from '../core/ProgressContext';
import { currentPlan, nextFillable, planCellAt, planStatus } from './engine';
import { PlanPanel, whereToEarn } from './PlanPanel';
import { playDone, playNope, playPlace } from './sound';
import { WorldCanvas, hasWebGL } from './three';
import { BlockIcon } from './Voxel';
import { getPlan, plansFor } from './world/plans';
import { creaturePlacements, guardianPlacements, islandOrigin, toIslandCell, worldCubes } from './world/terrain';
import { useAmbience } from './useAmbience';
import { Tutorial } from './Tutorial';
import { SESSION_MAX_MINUTES } from './BloclandContext';
import { daylight } from './world/daylight';

/** Le chantier : on reconstruit les bâtiments de chaque île en suivant les plans, dans le village en 3D ou en vue simple. */
export function ChantierPage() {
  const { state, fillPlan } = useBlocland();
  const { settings, update, speak } = useSettings();
  const { completePlan } = useProgress();
  const webgl = hasWebGL();
  const in3d = settings.view3d && webgl;
  const unlockedIslands = BIOMES.filter((b) => isBiomeUnlocked(b.id, state.village.bridges)).map((b) => b.id);
  // « ?ile=mine » (depuis le panneau d'une île) présélectionne cette île.
  const [params] = useSearchParams();
  const asked = params.get('ile') as BiomeId | null;
  const [island, setIsland] = useState<BiomeId>(asked && unlockedIslands.includes(asked) ? asked : (unlockedIslands[0] ?? 'foret'));
  const [seq, setSeq] = useState(1);
  const [forceDay, setForceDay] = useState(false);
  const [replay, setReplay] = useState(0);
  // Sessions courtes : après dix minutes de construction, on propose une pause (sans rien bloquer).
  const [pauseOffered, setPauseOffered] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setPauseOffered(true), SESSION_MAX_MINUTES * 60_000);
    return () => window.clearTimeout(t);
  }, []);
  const [burst, setBurst] = useState<{ seq: number; cell: { x: number; y: number; z: number }; color: string }>({
    seq: 0,
    cell: { x: 0, y: 0, z: 0 },
    color: '#fff',
  });
  useAmbience(forceDay);
  const night = !forceDay && daylight().light < 0.5;
  const blocks = (Object.keys(BLOCKS) as BlockId[]).filter((b) => (state.inventory[b] ?? 0) > 0);
  const [notice, setNotice] = useState<string | null>(null);
  const total = Object.values(state.inventory).reduce((a, b) => a + (b ?? 0), 0);
  const sound = (f: () => void) => settings.sounds && f();
  // Le plan en cours de l'île : le premier qui n'est pas terminé (sinon le dernier, pour afficher « terminé »).
  const plans = plansFor(island);
  const current = currentPlan(state, island);
  const plan = current?.plan;
  const status = plan ? planStatus(state, plan) : null;
  const journal = [...state.village.journal].reverse();

  const chooseIsland = (id: BiomeId) => {
    setIsland(id);
    setSeq((n) => n + 1);
    setNotice(null);
  };

  /** Éclats de la couleur du bloc à une case relative à l'île (z relatif). */
  const sparkle = (x: number, y: number, z: number, block: BlockId) => {
    const { ox, oy } = islandOrigin(BIOMES.findIndex((b) => b.id === island));
    setBurst((b) => ({ seq: b.seq + 1, cell: { x: ox + x, y: oy + y, z: z + 1 }, color: BLOCKS[block].top }));
  };

  /** Pose le bloc attendu à une cellule du plan (coordonnées relatives à l'île). */
  const fillAt = (x: number, y: number, z: number) => {
    if (!plan) return;
    const r = fillPlan(plan, x, y, z);
    if (!r.ok) {
      if (r.reason === 'plus-de-blocs' && r.block) setNotice(`Il te faut 1 bloc ${ofBlock(r.block)} : va dans ${whereToEarn(r.block)}.`);
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

  /** 3D : on a touché la face d'un bloc (`hit`) ; seules les cellules du plan réagissent. */
  const onFace = (hit: { x: number; y: number; z: number }) => {
    if (!plan) return;
    const h = toIslandCell(island, hit.x, hit.y, hit.z);
    if (planCellAt(plan, h.x, h.y, h.z)) return fillAt(h.x, h.y, h.z);
    setNotice('Touche une case bleue du plan : c’est là que le bloc va.');
    sound(playNope);
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
        <Syllabified text="Chaque île a un bâtiment en ruine à reconstruire. Suis le plan : les cases bleues attendent leurs blocs." />
      </p>

      <Tutorial
        id="chantier"
        replay={replay}
        steps={[
          'Ici, tu reconstruis le village. Chaque île a un plan : un bâtiment en ruine, dessiné en bleu transparent.',
          'Touche une case bleue pour y poser le bon bloc, ou utilise le bouton « Poser le bloc suivant ». Le plan te dit quels blocs il manque.',
          'Les blocs se gagnent dans les quêtes des îles. Quand un plan est fini, la créature te remercie et t’offre un coffre.',
        ]}
      />
      {pauseOffered && (
        <div className="panel pause-note" role="status">
          <p>
            <Syllabified text="Tu construis depuis dix minutes. C’est un bon moment pour faire une pause ; le village t’attendra." />
          </p>
          <button type="button" className="button" onClick={() => setPauseOffered(false)}>
            <Icon name="check" /> D’accord
          </button>
        </div>
      )}
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

      {plan && status && (
        <PlanPanel
          plan={plan}
          status={status}
          allDone={current?.allDone}
          index={plans.indexOf(plan) + 1}
          total={plans.length}
          canFill={!status.complete && nextFillable(state, plan) !== null}
          onFillNext={fillNext}
        />
      )}

      <section className="panel inventory" aria-labelledby="inventaire-titre">
        <h2 id="inventaire-titre" className="section-title inventory-title">
          <Icon name="blocks" /> Mes blocs ({total})
        </h2>
        {blocks.length === 0 ? (
          <p>
            Ton inventaire est vide. <Link to="/aventure">Va gagner des blocs dans les biomes !</Link>
          </p>
        ) : (
          <ul className="palette" aria-label="Blocs dans l’inventaire">
            {blocks.map((b) => (
              <li key={b} className="palette-block">
                <BlockIcon top={BLOCKS[b].top} side={BLOCKS[b].side} size={40} />
                <span className="palette-name">{BLOCKS[b].name}</span>
                <span className="palette-count">{state.inventory[b] ?? 0}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="build-modes" role="group" aria-label="Chantier">
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
          <button type="button" className="button" onClick={() => setReplay((n) => n + 1)}>
            <Icon name="help" /> Revoir l’aide
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
          {in3d && <span className="view-note">Touche une case bleue du plan pour y poser le bloc attendu.</span>}
        </div>
        {in3d && (
          <Suspense fallback={<p className="loading">Chargement du village…</p>}>
            <WorldCanvas
              cubes={worldCubes(state.progress, state.village, false)}
              creatures={[...creaturePlacements(state.village.bridges), ...guardianPlacements(state.progress, state.village.bridges)]}
              forceDay={forceDay}
              burst={burst}
              focus={{ island, seq }}
              reduceMotion={settings.reduceMotion}
              cameraSpeed={settings.cameraSpeed}
              build={{ onPickFace: onFace }}
              className="voxel-canvas-world"
              label={`Chantier en 3D : ${BIOMES.find((b) => b.id === island)?.name}`}
            />
          </Suspense>
        )}
        <p className="build-status" role="status" aria-live="polite">
          {notice ?? (status ? `${status.done} bloc${status.done > 1 ? 's' : ''} posé${status.done > 1 ? 's' : ''} sur ${status.total} pour ce plan.` : '')}
        </p>
      </div>

      {journal.length > 0 && (
        <section className="panel journal" aria-labelledby="journal-titre">
          <h2 id="journal-titre" className="section-title inventory-title">
            <Icon name="flag" /> Journal du village
          </h2>
          <ol className="journal-list">
            {journal.map((e, i) => {
              const p = getPlan(e.plan);
              return (
                <li key={`${e.day}-${e.plan}-${i}`}>
                  <span className="journal-day">{new Date(e.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                  <span>
                    <strong>{p?.name ?? e.plan}</strong>
                    {p ? ` · ${BIOMES.find((b) => b.id === p.biome)?.name}` : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </>
  );
}

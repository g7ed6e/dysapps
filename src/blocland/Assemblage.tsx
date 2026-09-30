// Le lieu où l'on assemble les blocs (GD-2) : la Fabrique dans Blocland, la Halle aux matériaux dans Archipéo, sur
// l'île de l'école de chaque archipel. Une recette par archipel atteint, toujours affichée (vignettes, nombres, noms,
// lue à voix haute) ; un toucher sur « Assembler » fait un bloc. Pas de grille, rien à deviner, rien ne se perd
// (référent dys). Un panneau dans le monde (3D, 2D), une page en vue simple : le même contenu.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';
import { useTextes } from '../univers';
import { BLOCKS, blockCount, blockName, nomDuBloc, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { EarnLink } from './PlanSection';
import { useSchoolIsland } from './School';
import { BlockIcon } from './Voxel';
import { planStatus } from './engine';
import { ASSEMBLAGE_PATH, assemblables, manquePour, RECETTES, type Recette } from './world/assemblage';
import { archipelagoOf, getArchipelago, reachableIslands } from './world/archipelago';
import { archipelagoOfIsland, type ArchipelagoId } from './world/archipels';
import { monumentsOf } from './world/monuments';

export { ASSEMBLAGE_PATH };

/** Les recettes des archipels où l'élève a une île ouverte, celle de l'archipel où il se tient en premier. */
function useRecettes(): Recette[] {
  const { state } = useBlocland();
  const ici = archipelagoOf(state.village.at ?? 'foret').classe;
  const atteints = new Set<ArchipelagoId>([...reachableIslands(state.village.bridges)].map(archipelagoOfIsland));
  atteints.add(ici);
  return [...RECETTES.filter((r) => r.archipelago === ici), ...RECETTES.filter((r) => r.archipelago !== ici && atteints.has(r.archipelago))];
}

/** « 2 blocs de bois et 1 bloc de pierre » */
function enMots(r: Recette): string {
  return r.ingredients.map((i) => blockCount(i.bloc, i.n)).join(' et ');
}

/** Une vignette par bloc à donner (au plus cinq d'un même bloc : la recette reste petite). */
function Vignettes({ bloc, n }: { bloc: BlockId; n: number }) {
  const b = BLOCKS[bloc];
  return (
    <span className="assemblage-vignettes" aria-hidden="true">
      {Array.from({ length: n }, (_, k) => (
        <BlockIcon key={k} top={b.top} side={b.side} size={24} />
      ))}
    </span>
  );
}

function RecetteCarte({ recette }: { recette: Recette }) {
  const { state, assemble } = useBlocland();
  const [dit, setDit] = useState<string | null>(null);
  const nom = nomDuBloc(recette.bloc);
  const peut = assemblables(state.inventory, recette) > 0;
  const manque = manquePour(state.inventory, recette);
  const en = state.inventory[recette.bloc] ?? 0;
  const pour = monumentsOf(recette.archipelago).filter((m) => (planStatus(state, m).missing[recette.bloc] ?? 0) > 0);
  const phrase = `Pour 1 ${blockName(recette.bloc, 1)}, il faut ${enMots(recette)}.`;
  const titreId = `recette-${recette.bloc}`;
  const bloc = BLOCKS[recette.bloc];

  const onAssemble = () => {
    const r = assemble(recette.bloc);
    if (r.ok) setDit(`Tu as assemblé 1 ${blockName(recette.bloc, 1)}. Tu en as ${(r.state.inventory[recette.bloc] ?? 0).toString()}.`);
  };

  return (
    <section className="assemblage-recette panel" aria-labelledby={titreId}>
      <h3 id={titreId} className="island-sheet-heading">
        <BlockIcon top={bloc.top} side={bloc.side} size={32} /> {nom}
        <span className="assemblage-archipel"> · {getArchipelago(recette.archipelago).name}</span>
      </h3>
      <p className="assemblage-phrase">
        <Syllabified text={phrase} />
        <SpeakButton text={phrase} label="Écouter la recette" compact />
      </p>
      <ul className="assemblage-ingredients" aria-label={`Ce qu’il faut pour 1 ${blockName(recette.bloc, 1)}`}>
        {recette.ingredients.map((i) => {
          const a = state.inventory[i.bloc] ?? 0;
          return (
            <li key={i.bloc}>
              <Vignettes bloc={i.bloc} n={i.n} />
              <span>
                <strong>{i.n}</strong> {blockName(i.bloc, i.n)} · tu en as <strong>{a}</strong>
                {a >= i.n ? (
                  <>
                    {' '}
                    <Icon name="check" /> assez
                  </>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {manque.length > 0 && (
        <ul className="assemblage-manque" aria-label="Ce qu’il te manque">
          {manque.map((m) => (
            <li key={m.bloc}>
              Il te manque {blockCount(m.bloc, m.n)}, <EarnLink block={m.bloc} />.
            </li>
          ))}
        </ul>
      )}
      {pour.length > 0 && (
        <p className="assemblage-pour">
          <Icon name="castle" /> Pour{' '}
          {pour.map((m, k) => (
            <span key={m.id}>
              {k > 0 ? ' et ' : ''}
              <Link to={`/aventure/${m.id}`}>{m.name}</Link>
            </span>
          ))}
          .
        </p>
      )}
      <p className="assemblage-en-poche">
        Dans ta poche : <strong>{en}</strong> {blockName(recette.bloc, en)}.
      </p>
      <button type="button" className="button primary" disabled={!peut} onClick={onAssemble}>
        <Icon name="hammer" /> Assembler 1 {blockName(recette.bloc, 1)}
      </button>
      <p className="build-status" role="status" aria-live="polite">
        {dit ?? ''}
      </p>
    </section>
  );
}

/** Ce qu'on y fait, puis une carte par recette. */
export function AssemblageBody() {
  const { assemblage } = useTextes();
  const recettes = useRecettes();
  return (
    <div className="assemblage">
      <p className="section-intro">
        <Syllabified text={assemblage.presentation} />
        <SpeakButton text={assemblage.presentation} label="Réécouter" compact />
      </p>
      {recettes.map((r) => (
        <RecetteCarte key={r.bloc} recette={r} />
      ))}
    </div>
  );
}

/** Le panneau du lieu, qui glisse depuis le bas du monde (comme celui de l'école). */
export function AssemblageSheet({ onClose }: { onClose: () => void }) {
  const island = useSchoolIsland();
  const { assemblage } = useTextes();
  return (
    <section
      id="panneau-assemblage"
      className={`island-sheet assemblage-sheet biome-${island.id}`}
      role="dialog"
      aria-labelledby="assemblage-titre"
      aria-modal="false"
    >
      <div className="island-sheet-head">
        <div className="island-sheet-titles">
          <h2 id="assemblage-titre" className="island-sheet-title">
            <Icon name="hammer" /> {assemblage.titre}
          </h2>
          <p className="island-sheet-module">Sur {island.name}</p>
        </div>
        <button type="button" className="icon-button island-sheet-close" aria-label="Fermer le panneau" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <AssemblageBody />
    </section>
  );
}

/** Le lieu en vue simple : une page. */
export function AssemblagePage() {
  const univers = useUnivers();
  const island = useSchoolIsland();
  const { assemblage } = useTextes();
  return (
    <>
      <Link to="/aventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].nom}
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> {assemblage.titre}
      </h1>
      <p className="section-intro">Sur {island.name}.</p>
      <AssemblageBody />
    </>
  );
}

/** Le lien vers le lieu, sur l'île de l'école : une ligne du panneau de l'île, ou une carte en vue simple. */
export function AssemblageLink({ variant = 'sheet' }: { variant?: 'sheet' | 'card' }) {
  const { assemblage } = useTextes();
  const desc = 'Assemble tes blocs pour les monuments.';
  if (variant === 'card')
    return (
      <Link to={ASSEMBLAGE_PATH} className="panel app-card assemblage-link">
        <span className="app-icon">
          <Icon name="hammer" size="1.8rem" />
        </span>
        <span className="app-title">{assemblage.titre}</span>
        <span className="app-desc">{desc}</span>
      </Link>
    );
  return (
    <Link to={ASSEMBLAGE_PATH} className="island-quest assemblage-link">
      <span className="island-quest-icon">
        <Icon name="hammer" />
      </span>
      <span className="island-quest-text">
        <span className="island-quest-title">{assemblage.titre}</span>
        <span className="island-quest-desc">{desc}</span>
      </span>
    </Link>
  );
}

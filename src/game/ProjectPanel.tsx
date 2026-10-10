// Le chantier d'un grand projet (GD-10, piste A choisie par le mainteneur le 8 octobre 2026) : à la place du « bloc
// suivant », cinq ronds (les pièces posées, la prochaine), deux recettes au choix et un seul bouton, « Construire la
// lanterne » (Blocland), qui ouvre la question de la pièce. Une pièce commencée case par case (avant les projets) se finit d'un
// geste, sans question ni blocs.
import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { useUnivers } from '../core/SettingsContext';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../core/typography';
import { BLOCKS, blockName, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { EarnLink } from './PlanSection';
import { projectQuestionPath } from './ProjectQuestion';
import { BlockIcon } from './Voxel';
import type { MonumentDef } from './world/monuments';
import { canPay, nextPiece, pieceIsFree, pieceState, piecesBuilt, type Project, type ProjectRecipe } from './world/projects';

/** Le nom d'une pièce dans l'univers de l'élève, avec son article. */
function usePieceName(project: Project, index: number): string {
  const univers = useUnivers();
  return project.pieces[index]?.names[univers === 'archipeo' ? 'archipeo' : 'blocland'] ?? '';
}

export function ProjectPanel({ project, monument, done }: { project: Project; monument: MonumentDef; done: string }) {
  const { state, finishPiece } = useBlocland();
  const { completeMonument } = useProgress();
  const [notice, setNotice] = useState<string | null>(null);
  // « Finir » disparaît une fois la pièce finie : le focus va à la ligne qui le dit, jamais perdu.
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const index = nextPiece(state, project);
  const built = piecesBuilt(state, project);
  const total = project.pieces.length;
  const name = usePieceName(project, index ?? 0);
  // La recette choisie : celle que l'élève a touchée, sinon la première que son stock paie.
  const recipes = index === null ? [] : project.pieces[index].recipes;
  const [chosen, setChosen] = useState<{ piece: number; k: number } | null>(null);
  const payable = recipes.findIndex((r) => canPay(state.stock, r));
  const recipe = chosen && chosen.piece === index ? chosen.k : payable < 0 ? 0 : payable;
  const free = index !== null && pieceIsFree(state, project, index);
  const group = useId();
  const finish = () => {
    const r = finishPiece(monument.id);
    if (!r?.ok) return;
    // Le rond qui se remplit et le compteur disent l'avancement : la ligne ne dit que la pièce posée, ou l'XP à la fin.
    if (r.completed) {
      completeMonument(monument.reward.xp);
      setNotice(`+${monument.reward.xp} XP`);
    } else setNotice(`Pièce posée : ${name}.`);
    requestAnimationFrame(() => noticeRef.current?.focus());
  };
  return (
    <>
      <div className="project-pieces" role="img" aria-label={`${built} ${built > 1 ? 'pièces posées' : 'pièce posée'} sur ${total}`}>
        {project.pieces.map((p, k) => {
          const s = pieceState(state, project, k);
          return <span key={p.id} className={`project-piece ${s === 'built' ? 'built' : k === index ? 'next' : 'todo'}`} />;
        })}
      </div>
      <p className="plan-count">
        <strong>{built}</strong> / {total} pièces posées · +{monument.reward.xp} XP à la fin
      </p>
      {index === null ? (
        <p className="plan-done">
          <Icon name="star" /> <span className="plan-done-word">Terminé !</span> <span className="plan-done-text"><Syllabified text={frenchTypography(done)} /></span>
        </p>
      ) : free ? (
        <button type="button" className="button primary" onClick={finish}>
          <Icon name="hammer" /> Finir {name}
        </button>
      ) : (
        <>
          <fieldset className="project-recipes">
            <legend className="visually-hidden">Avec quels blocs ?</legend>
            {recipes.map((r, k) => (
              <RecipeCard key={k} group={group} recipe={r} stock={state.stock} checked={k === recipe} onPick={() => setChosen({ piece: index, k })} />
            ))}
          </fieldset>
          {!canPay(state.stock, recipes[recipe]) && <Lacking recipe={recipes[recipe]} stock={state.stock} />}
          {canPay(state.stock, recipes[recipe]) ? (
            <Link to={projectQuestionPath(monument.id, recipe)} className="button primary">
              <Icon name="hammer" /> Construire {name}
            </Link>
          ) : (
            <button type="button" className="button primary" disabled>
              <Icon name="hammer" /> Construire {name}
            </button>
          )}
        </>
      )}
      <p ref={noticeRef} tabIndex={-1} className="build-status" role="status" aria-live="polite">
        {notice ?? ''}
      </p>
    </>
  );
}

/**
 * Une recette : ses deux blocs, en icônes avec leur nombre ; une pastille cochée dans le coin quand le stock la paie.
 * Un vrai bouton radio (les flèches passent d'une recette à l'autre) ; la carte choisie a son fond teinté.
 */
function RecipeCard({
  group,
  recipe,
  stock,
  checked,
  onPick,
}: {
  group: string;
  recipe: ProjectRecipe;
  stock: Partial<Record<BlockId, number>>;
  checked: boolean;
  onPick: () => void;
}) {
  const ok = canPay(stock, recipe);
  const label = recipe.ingredients.map((i) => `${i.n} ${blockName(i.bloc, i.n)}`).join(' et ');
  return (
    <label className="project-recipe">
      <input type="radio" name={group} className="visually-hidden" aria-label={`${label}${ok ? ', tu les as' : ''}`} checked={checked} onChange={onPick} />
      {recipe.ingredients.map((i) => (
        <span key={i.bloc} className="project-ingredient">
          <BlockIcon top={BLOCKS[i.bloc].top} side={BLOCKS[i.bloc].side} size={28} />
          <strong>{i.n}</strong>
        </span>
      ))}
      {ok && (
        <span className="project-recipe-ok">
          <Icon name="check" />
        </span>
      )}
    </label>
  );
}

/** Ce qui manque à la recette choisie, et où le gagner. */
function Lacking({ recipe, stock }: { recipe: ProjectRecipe; stock: Partial<Record<BlockId, number>> }) {
  const missing = recipe.ingredients.filter((i) => (stock[i.bloc] ?? 0) < i.n);
  return (
    <ul className="plan-missing" aria-label="Blocs qu’il manque">
      {missing.map((i) => {
        const left = i.n - (stock[i.bloc] ?? 0);
        return (
          <li key={i.bloc}>
            <BlockIcon top={BLOCKS[i.bloc].top} side={BLOCKS[i.bloc].side} size={28} />
            <span>
              <strong>{left}</strong> {blockName(i.bloc, left)} · <EarnLink block={i.bloc} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// La question d'une pièce de projet (GD-10, piste A choisie par le mainteneur le 8 octobre 2026) : « Construire la
// lanterne » ouvre, en plein écran comme une mission, la question qui mêle les deux matières de la recette choisie
// (docs/contenu/projets.md). C'est l'écran de la question d'un bloc assemblé (AssemblyQuestion.tsx) : deux essais,
// rien de perdu. Juste : la pièce entière se pose, et le retour au grand ouvrage la montre posée.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProgress } from '../core/ProgressContext';
import { Icon } from '../components/Icon';
import { Loading } from '../components/Loading';
import { useLoaded } from '../core/useLoaded';
import { NotFoundPage } from '../pages/NotFoundPage';
import { texteDuMonument, useTextes } from '../universes';
import { useUnivers } from '../core/SettingsContext';
import { MixedQuestion } from './AssemblyQuestion';
import { useBlocland } from './BloclandContext';
import { loadAssemblage } from './exercises';
import { getMonument } from './world/monuments';
import { canPay, nextPiece, piecesBuilt, projectOf, type Project } from './world/projects';

/** L'adresse de la question de la pièce à construire d'un projet, avec la recette choisie (0 ou 1). */
export function projectQuestionPath(monument: string, recipe: number): string {
  return `/adventure/project/${monument}/${recipe}`;
}

export function ProjectQuestionPage() {
  const { monument: id, recipe } = useParams();
  const { state } = useBlocland();
  const project = id ? projectOf(id) : undefined;
  const monument = id ? getMonument(id) : undefined;
  const r = Number(recipe);
  // La pièce, fixée à l'ouverture : celle à construire.
  const [index] = useState(() => (project ? nextPiece(state, project) : null));
  const bank = project && index !== null && (r === 0 || r === 1) ? project.pieces[index].recipes[r].bank : undefined;
  const [autre, setAutre] = useState(0);
  const loaded = useLoaded(async () => (bank ? ((await loadAssemblage(bank)) ?? null) : null), [bank]);
  const univers = useUnivers();
  if (!project || !monument || index === null || !bank || loaded === null) return <NotFoundPage />;
  const piece = project.pieces[index];
  const name = piece.names[univers === 'archipeo' ? 'archipeo' : 'blocland'];
  const retour = `/adventure/${monument.id}`;
  return (
    <>
      <Link to={retour} className="back-link">
        <Icon name="back" /> {monument.name}
      </Link>
      <h1 className="page-title">
        <Icon name="hammer" /> Construire {name}
      </h1>
      {loaded ? (
        <PieceQuestion key={autre} project={project} index={index} recipe={r} name={name} def={loaded} retour={retour} onAutre={() => setAutre((n) => n + 1)} />
      ) : (
        <Loading />
      )}
    </>
  );
}

function PieceQuestion({
  project,
  index,
  recipe,
  name,
  def,
  retour,
  onAutre,
}: {
  project: Project;
  index: number;
  recipe: number;
  name: string;
  def: Parameters<typeof MixedQuestion>[0]['def'];
  retour: string;
  onAutre: () => void;
}) {
  const { repondreProjet } = useBlocland();
  const { completeMonument } = useProgress();
  const monument = getMonument(project.monument)!;
  const { done } = texteDuMonument(useTextes(), monument);
  const r = project.pieces[index].recipes[recipe];
  return (
    <MixedQuestion
      def={def}
      drawKey={r.bank}
      canDo={(stock) => canPay(stock, r)}
      retour={retour}
      retourText={`Revenir au ${monument.name.replace(/^Le /, '')}`}
      aLieu={`au ${monument.name.replace(/^Le /, '')}`}
      onAutre={onAutre}
      commit={(reponse) => {
        const res = repondreProjet(project.monument, index, recipe, reponse);
        if (!res.built)
          return {
            done: false,
            lacking: reponse.juste ? `C’est juste, mais il te manque des blocs pour ${name} : rien n’est pris.` : undefined,
          };
        if (res.completed) {
          completeMonument(monument.reward.xp);
          return {
            done: true,
            text: `${done} +${monument.reward.xp} XP.`,
            backState: { piece: index },
          };
        }
        return {
          done: true,
          text: `Pièce posée : ${piecesBuilt(res.state, project)} sur ${project.pieces.length}.`,
          backState: { piece: index },
        };
      }}
    />
  );
}

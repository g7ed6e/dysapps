import { useRef, useState } from 'react';
import { Icon } from '../../components/Icon';
import { frenchTypography } from '../../components/math/RichText';
import { Syllabified } from '../../components/Syllabified';
import { useBlocland } from '../BloclandContext';
import { VoxelScene, type VoxelCube } from '../Voxel';
import type { ScreenProps } from './registry';

/** Tour de verre : un étage par paragraphe lu. */
function Tower({ floors, total }: { floors: number; total: number }) {
  const cubes: VoxelCube[] = [];
  for (let z = 0; z < total; z++) {
    const built = z < floors;
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      cubes.push({ x, y, z, color: built ? '#6fbdd3' : '#e6e2d8', top: built ? '#bfe8f2' : '#f3f0e8' });
    }
  }
  cubes.push({ x: 0, y: 0, z: -1, color: '#8a5a26', top: '#c98d4b' }, { x: 1, y: 0, z: -1, color: '#8a5a26', top: '#c98d4b' }, { x: 0, y: 1, z: -1, color: '#8a5a26', top: '#c98d4b' }, { x: 1, y: 1, z: -1, color: '#8a5a26', top: '#c98d4b' });
  return <VoxelScene cubes={cubes} s={12} className="tower" label={`Tour : ${floors} étage${floors > 1 ? 's' : ''} sur ${total}`} />;
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m ? `${m} min ${r} s` : `${r} s`;
}

/**
 * Ascension : l'élève lit chaque paragraphe à voix haute et le valide lui-même (mode manuel).
 * Le temps est mesuré discrètement et comparé seulement à ses lectures précédentes.
 * Champs de l'item : text (un paragraphe).
 */
export function AscensionScreen({ items, answered, onAnswer, exerciseId }: ScreenProps) {
  const { recordFluence } = useBlocland();
  const [floor, setFloor] = useState(0);
  const [comparison, setComparison] = useState<string | null>(null);
  const start = useRef(Date.now());

  const validate = () => {
    if (floor + 1 < items.length) {
      setFloor(floor + 1);
      return;
    }
    const seconds = (Date.now() - start.current) / 1000;
    const { previous } = recordFluence(exerciseId, seconds);
    setComparison(
      previous === null
        ? `Première lecture : ${formatSeconds(seconds)}.`
        : seconds < previous
          ? `${formatSeconds(seconds)} : plus fluide que la dernière fois (${formatSeconds(previous)}).`
          : `${formatSeconds(seconds)} : même rythme que d’habitude, c’est très bien.`,
    );
    onAnswer({ results: items.map((it) => ({ key: it.key, correct: true })), detail: {} });
  };

  const current = items[Math.min(floor, items.length - 1)];

  return (
    <div className="ascension">
      <Tower floors={answered ? items.length : floor} total={items.length} />
      <div className="panel question reader ascension-text">
        {!answered ? (
          <>
            <p className="question-count">
              Paragraphe {floor + 1} / {items.length}
            </p>
            <p className="ascension-paragraph">
              <Syllabified text={frenchTypography(String(current.text))} />
            </p>
            <button type="button" className="button primary validate-button" onClick={validate}>
              <Icon name="check" /> J’ai lu ce paragraphe
            </button>
          </>
        ) : (
          <>
            <p className="question-count">Tour terminée</p>
            {items.map((it) => (
              <p key={it.key} className="ascension-paragraph">
                <Syllabified text={frenchTypography(String(it.text))} />
              </p>
            ))}
            {comparison && <p className="fluence-note">{comparison}</p>}
          </>
        )}
      </div>
    </div>
  );
}

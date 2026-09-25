import { Icon } from '../../components/Icon';
import { SCREEN_TYPES, type ScreenAnswer, type ScreenProps } from './registry';
import { fillTemplate, type ExerciseItem } from './types';

/**
 * Écran du Gardien : une manche = l'écran d'un type de quête (chasse au son, filon, enclos…) avec ses items.
 * Le message de correction de la quête d'origine est calculé ici et remonté dans `detail.explain`.
 */
export function BossScreen({ items, answered, onAnswer, onHelp, level }: ScreenProps) {
  const round = items[0];
  const type = SCREEN_TYPES[String(round.screenType)];
  const subItems = (Array.isArray(round.items) ? round.items : []) as ExerciseItem[];
  if (!type) return <p className="intro">Cette manche n’est pas disponible.</p>;
  const Sub = type.component;

  const forward = (a: ScreenAnswer) => {
    const firstWrong =
      subItems[
        Math.max(
          0,
          a.results.findIndex((r) => !r.correct),
        )
      ];
    const explain = a.results.every((r) => r.correct) ? '' : fillTemplate(String(round.wrong), { target: round.target, ...firstWrong, ...a.detail });
    onAnswer({ results: a.results, detail: { ...a.detail, explain } });
  };

  return (
    <div className="boss-round">
      <p className="boss-round-title">
        <Icon name="shield" /> Épreuve : {labelOf(String(round.screenType))}
      </p>
      <Sub
        items={subItems}
        answered={answered}
        onAnswer={forward}
        onHelp={onHelp}
        level={level}
        target={round.target as string | undefined}
        exerciseId={String(round.exerciseId)}
      />
    </div>
  );
}

const LABELS: Record<string, string> = {
  abattage: 'Abattage syllabique',
  'chasse-son': 'Chasse au son',
  rimes: 'Rimes-échelle',
  filon: 'Filon',
  oreille: 'Oreille du mineur',
  'mot-troue': 'Mot troué',
  familles: 'Familles-craft',
  coffre: 'Coffre à mots',
  enclos: 'Enclos',
  graines: 'Tri des graines',
  recolte: 'Récolte',
  ascension: 'Ascension',
};

function labelOf(type: string): string {
  return LABELS[type] ?? type;
}

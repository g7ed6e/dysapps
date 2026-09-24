import { QuestMenu } from '../../components/QuestMenu';
import { QUESTIONS_PER_QUEST, QUESTS } from './generators';

export default function FractionsApp() {
  return (
    <QuestMenu
      appId="fractions"
      quests={QUESTS}
      intro={
        <>
          {QUESTIONS_PER_QUEST} questions par quête. Les fractions sont écrites en colonne, et le joker les dessine : barres, disques, groupes de points.
        </>
      }
    />
  );
}

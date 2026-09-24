import { QuestMenu } from '../../components/QuestMenu';
import { QUESTIONS_PER_QUEST, QUESTS } from './generators';

export default function DecimauxApp() {
  return (
    <QuestMenu
      appId="decimaux"
      quests={QUESTS}
      intro={
        <>
          {QUESTIONS_PER_QUEST} questions par quête. Le joker ouvre le tableau de numération, avec la virgule bien marquée, ou la droite graduée.
        </>
      }
    />
  );
}

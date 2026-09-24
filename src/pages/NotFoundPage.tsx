import { Link } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { Icon } from '../components/Icon';

export function NotFoundPage() {
  return (
    <>
      <Feedback shout="404" message="Zone introuvable. Retour au menu." tone="rate" autoSpeak={false} />
      <Link to="/" className="button primary">
        <Icon name="home" /> Menu
      </Link>
    </>
  );
}

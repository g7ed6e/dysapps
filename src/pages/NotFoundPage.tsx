import { Link } from 'react-router-dom';
import { Mascot } from '../components/Mascot';

export function NotFoundPage() {
  return (
    <>
      <Mascot message="Oups, je ne trouve pas cette page. Retournons à l’accueil !" mood="reflechit" autoSpeak={false} />
      <Link to="/" className="button primary">
        Retour à l’accueil
      </Link>
    </>
  );
}

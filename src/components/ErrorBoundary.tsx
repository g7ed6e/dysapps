import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Feedback } from './Feedback';
import { Icon } from './Icon';

interface Props {
  children: ReactNode;
  /** Ce qu'on affiche à la place (par défaut : le message « Recharger »). */
  fallback?: ReactNode;
  /** Quand cette valeur change (la page), l'erreur est oubliée et on réessaie. */
  resetKey?: unknown;
}

/**
 * Limite d'erreur : une page qui n'a pas pu s'ouvrir affiche un message et un bouton « Recharger » au lieu d'un
 * écran blanc. Le cas attendu : un fichier chargé à la demande (3D, mission, exercice) qui n'existe plus parce que
 * l'application a été mise à jour pendant la séance, avant que le service worker ne la garde hors ligne.
 * Rien n'est perdu : la progression est enregistrée sur l'appareil.
 */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback;
    return <PageError />;
  }
}

function PageError() {
  return (
    <>
      <Feedback
        shout="Oups"
        message="Cette page n’a pas pu s’ouvrir. L’application a peut-être été mise à jour : recharge-la. Ta progression est gardée."
        tone="rate"
      />
      <div className="actions">
        <button type="button" className="button primary" onClick={() => window.location.reload()}>
          <Icon name="replay" /> Recharger
        </button>
        <Link to="/" className="button">
          <Icon name="home" /> Menu
        </Link>
      </div>
    </>
  );
}

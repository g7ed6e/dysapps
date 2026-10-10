// Les accès directs du monde, depuis que le Menu n'existe plus (mot du mainteneur, 10 octobre 2026, choix « 1a 2ok
// 3a ») : en haut à gauche, la dernière mission, les révisions du jour et les commandes ; dans la barre du bas, après
// île, Carte et Blocs, l'école, les monuments, le lieu où l'on assemble, les missions, les succès et l'aide ; Réglages
// seul, en bas à droite. Des icônes seules, le nom au doigt posé (WorldButton.tsx). Communs aux deux univers.
import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { lastPlace } from '../core/lastPlace';
import { useTextes } from '../universes';
import { useBlocland } from './BloclandContext';
import type { BiomeId } from './biomes';
import { Requests } from './Requests';
import { Sheet } from './Sheet';
import { MONUMENTS_PATH, MONUMENTS_TITLE } from './Monuments';
import { questsToReview } from './review';
import { SCHOOL_PATH, SCHOOL_TITLE } from './School';
import { TROPHIES_PATH, TROPHIES_TITLE } from './trophies';
import { WorldButton } from './WorldButton';
import { ASSEMBLAGE_PATH } from './world/assembly';
import type { ArchipelagoId } from './world/archipelago';
import { commandesOuvertes } from './world/requests';
import { openStoryOf } from './world/stories';

/** L'adresse de la fiche des commandes, par-dessus le monde (elle était dans le Menu). */
const REQUESTS_PATH = '/adventure/requests';

/** En haut à gauche, en colonne : Reprendre, Révisions, Commandes. Toujours à leur place, délavés quand ils sont vides. */
export function WorldShortcuts({ a, requestsOpen }: { a: ArchipelagoId; requestsOpen: boolean }) {
  const navigate = useNavigate();
  const { state } = useBlocland();
  const textes = useTextes();
  const resume = lastPlace(state.world.links);
  const reviews = questsToReview(state.spaced, state.world.links);
  // Les commandes de la région du bonhomme, et sa quête d'entraide (GD-10), comme la liste qu'ouvre le bouton.
  const commandes = textes.commandes ? commandesOuvertes(state.world, a).length + (textes.quetes && openStoryOf(state.world, a) ? 1 : 0) : 0;
  return (
    <nav className="world-shortcuts" data-couvre="bouton" data-tuto="raccourcis" aria-label="Reprendre">
      <WorldButton icon="play" name={resume ? `Ma dernière mission : ${resume.label}` : 'Ma dernière mission'} empty={resume ? undefined : 'pas encore de mission'} onClick={() => resume && navigate(resume.path)} />
      <WorldButton
        icon="history"
        name={reviews.length ? `Mes révisions du jour : ${reviews.length === 1 ? 'une' : reviews.length}` : 'Mes révisions du jour'}
        empty={reviews.length ? undefined : 'rien à revoir aujourd’hui'}
        count={reviews.length || undefined}
        onClick={() => reviews[0] && navigate(reviews[0].path)}
      />
      {textes.commandes && (
        <WorldButton
          icon="scroll-text"
          className="world-commandes"
          name={commandes ? `${textes.commandes.titre} : ${commandes}` : textes.commandes.titre}
          empty={commandes ? undefined : 'aucune commande'}
          count={commandes || undefined}
          pressed={requestsOpen}
          controls={requestsOpen ? 'panneau-commandes' : undefined}
          onClick={() => navigate(requestsOpen ? '/adventure' : REQUESTS_PATH)}
        />
      )}
    </nav>
  );
}

/** Les lieux du village dans la barre du bas, après Blocs, derrière un trait ; puis l'aide (les bulles du début). */
export function WorldPlaces({ onHelp }: { onHelp: () => void }) {
  const navigate = useNavigate();
  const { assemblage } = useTextes();
  return (
    <>
      <span className="world-bar-trait" aria-hidden="true" />
      <WorldButton icon="school" name={SCHOOL_TITLE} onClick={() => navigate(SCHOOL_PATH)} />
      <WorldButton icon="castle" name={MONUMENTS_TITLE} onClick={() => navigate(MONUMENTS_PATH)} />
      <WorldButton icon="hammer" name={assemblage.titre} onClick={() => navigate(ASSEMBLAGE_PATH)} />
      <WorldButton icon="dumbbell" name="Missions" onClick={() => navigate('/quetes')} />
      <WorldButton icon="trophy" name={TROPHIES_TITLE} onClick={() => navigate(TROPHIES_PATH)} />
      <WorldButton icon="help" name="Aide du village" tuto="aide" onClick={onHelp} />
    </>
  );
}

/** Réglages, seul dans le coin en bas à droite. */
export function SettingsButton() {
  const navigate = useNavigate();
  return <WorldButton icon="settings" name="Réglages" className="world-settings" onClick={() => navigate('/reglages')} />;
}

/**
 * Les commandes des créatures de l'archipel du bonhomme (GD-7) et sa quête d'entraide, en panneau par-dessus le monde :
 * « Y aller » ouvre le panneau de l'île visée. Échap le referme, comme la croix.
 */
export function RequestsSheet({ onClose, onAller }: { onClose: () => void; onAller: (island: BiomeId, commande?: string) => void }) {
  const textes = useTextes();
  const toucheEchap = useEffectEvent((e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    onClose();
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => toucheEchap(e);
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
  const titre = textes.commandes?.titre ?? 'Commandes';
  return (
    <Sheet id="panneau-commandes" className="requests-sheet" titleId="commandes-titre" icon="scroll-text" title={titre} closeLabel={`Fermer : ${titre}`} autoFocusClose onClose={onClose}>
      <Requests className="world-requests" onAller={onAller} />
    </Sheet>
  );
}

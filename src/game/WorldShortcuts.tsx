// Les accès directs du monde, depuis que le Menu n'existe plus (mot du mainteneur, 10 octobre 2026, choix « 1a 2ok
// 3a ») : en haut à gauche, la dernière mission, les révisions du jour et les commandes ; dans la barre du bas, après
// île, Carte et Blocs, l'école, les monuments, le lieu où l'on assemble, les missions, les succès et l'aide ; Réglages
// en haut à droite. Des icônes seules, le nom au doigt posé (WorldButton.tsx). Communs aux deux univers.
import { useEffect, useEffectEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { lastPlace } from '../core/lastPlace';
import { useTextes } from '../universes';
import { useBlocland } from './BloclandContext';
import type { BiomeId } from './biomes';
import type { World } from './engine/state';
import { Requests } from './Requests';
import { Sheet } from './Sheet';
import { MONUMENTS_PATH, MONUMENTS_TITLE } from './Monuments';
import { questsToReview } from './review';
import { SCHOOL_PATH, SCHOOL_TITLE } from './School';
import { TROPHIES_PATH, TROPHIES_TITLE } from './trophies';
import { WorldButton } from './WorldButton';
import { ASSEMBLAGE_PATH } from './world/assembly';
import { archipelagoOf, type ArchipelagoId } from './world/archipelago';
import { commandesOuvertes } from './world/requests';
import { openStoryOf } from './world/stories';

/** L'adresse de la fiche des commandes, par-dessus le monde (elle était dans le Menu). */
const REQUESTS_PATH = '/adventure/requests';

/** Les commandes de la région du bonhomme, et sa quête d'entraide (GD-10) s'il y en a une : ce que montre leur liste. */
function requestCount(world: World, a: ArchipelagoId, quetes: boolean): number {
  return commandesOuvertes(world, a).length + (quetes && openStoryOf(world, a) ? 1 : 0);
}

/** En haut à gauche, en colonne : Reprendre, Révisions, Commandes. Toujours à leur place, délavés quand ils sont vides. */
export function WorldShortcuts({ a, requestsOpen }: { a: ArchipelagoId; requestsOpen: boolean }) {
  const navigate = useNavigate();
  const { state } = useBlocland();
  const textes = useTextes();
  const resume = lastPlace(state.world.links);
  const reviews = questsToReview(state.spaced, state.world.links);
  const commandes = textes.commandes ? requestCount(state.world, a, Boolean(textes.quetes)) : 0;
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

/** Réglages, dans le coin en haut à droite, au-dessus du choix de l'archipel (mot du mainteneur, 10 octobre 2026). */
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
  const { state } = useBlocland();
  const a = archipelagoOf(state.world.place ?? 'french-6e-phonology').classe;
  const titre = textes.commandes?.titre ?? 'Commandes';
  return (
    <Sheet id="panneau-commandes" className="requests-sheet" titleId="commandes-titre" icon="scroll-text" title={titre} closeLabel={`Fermer : ${titre}`} autoFocusClose onClose={onClose}>
      {/* Ouvert par son adresse quand il n'y en a aucune : la liste ne dit rien, la ligne le dit. */}
      {requestCount(state.world, a, Boolean(textes.quetes)) ? <Requests className="world-requests" onAller={onAller} /> : <p className="world-requests">Aucune commande pour l’instant.</p>}
    </Sheet>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useProgress } from '../core/ProgressContext';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useBlocland } from './BloclandContext';
import { canLaunch } from './engine';
import { VoyagePanel } from './VoyagePanel';
import { ARCHIPELAGOS, getArchipelago, isArchipelagoReached, type ArchipelagoId } from './world/archipelago';
import { stageTo } from './world/vehicle';
import { useUnivers } from '../core/SettingsContext';
import { UNIVERS } from '../core/univers';
import { useHoldCelebrations } from '../components/Celebrations';

/**
 * Le voyage en vue simple : `#/adventure/passage/:vers` (la classe de l'archipel d'arrivée). Un premier voyage largue les
 * amarres (le voyage reste fait) ; vers un archipel déjà atteint, le bonhomme y va simplement. Puis le port d'arrivée.
 */
export function VoyagePage() {
  const univers = useUnivers();
  const { vers } = useParams();
  const navigate = useNavigate();
  // Pendant le voyage, un bandeau de récompense attend l'arrivée (DA-9).
  useHoldCelebrations(true);
  const { state, launch, moveTo } = useBlocland();
  const { launchVoyage } = useProgress();
  const to = ARCHIPELAGOS.find((a) => a.classe === vers)?.classe as ArchipelagoId | undefined;
  if (!to) return <NotFoundPage />;
  const back = isArchipelagoReached(to, state.world.links);
  const stage = stageTo(to);
  if (!back && (!stage || !canLaunch(state, stage).ok)) return <NotFoundPage />;
  const port = getArchipelago(to).port;
  const arrive = () => {
    if (back) moveTo(port);
    else if (stage) {
      const r = launch(stage);
      if (r.ok) launchVoyage(stage.reward.xp);
    }
    navigate(`/adventure/${port}`, { replace: true });
  };
  return (
    <>
      <Link to="/adventure" className="back-link">
        <Icon name="back" /> {UNIVERS[univers].carte}
      </Link>
      <VoyagePanel to={to} back={back} onArrive={arrive} />
    </>
  );
}

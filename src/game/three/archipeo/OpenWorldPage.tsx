// Le monde ouvert d'Archipéo, au 6e (prototype, piste B « chemins aimantés », choix du mainteneur du 14 octobre 2026) :
// derrière le drapeau `?monde=ouvert`, dans l'univers Archipéo seulement (../../worldLayoutFactory.tsx). Le socle : le
// terrain du 6e, le lagon et la mer, les quatre lieux du prototype, Kéo posé devant son lieu. Rien de neuf dans la
// sauvegarde. Chargé à la demande.
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loading } from '../../../components/Loading';
import { useMoinsDAnimations } from '../../../core/motion';
import { useBlocland } from '../../BloclandContext';
import { mesuresDemandees, meterShown } from '../../rendering';
import { SettingsButton } from '../../WorldShortcuts';
import { placeOfIsland, type PlaceId } from '../../world/continu/plan6e';
import { createOpenWorld, type OpenWorld } from './scene';
import './openWorld.css';

declare global {
  interface Window {
    /** Le monde ouvert, pour les captures et les mesures (en développement, ou avec `?mesures`). */
    __dysappsMondeOuvert?: Pick<OpenWorld, 'info'>;
  }
}

export default function OpenWorldPage() {
  const { biomeId } = useParams();
  const { state } = useBlocland();
  const reduceMotion = useMoinsDAnimations();

  // Kéo part devant le lieu de l'adresse (le retour d'une mission), sinon celui de la partie, sinon le Phare.
  const [start] = useState<PlaceId>(() => placeOfIsland(biomeId ?? '')?.id ?? placeOfIsland(state.world.place ?? '')?.id ?? 'phare');

  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const w = createOpenWorld(el, { start, reduceMotion, meter: { show: meterShown(), expose: import.meta.env.DEV || mesuresDemandees() } });
    setReady(true);
    if (import.meta.env.DEV || mesuresDemandees()) window.__dysappsMondeOuvert = { info: w.info };
    return () => {
      w.dispose();
      if (window.__dysappsMondeOuvert?.info === w.info) delete window.__dysappsMondeOuvert;
    };
    // La scène est faite une fois (et refaite si l'appareil change « Réduire les animations ») ; `start` ne change pas.
  }, [start, reduceMotion]);

  return (
    <div className="world-page open-world">
      <div className="world-stage" data-scene>
        <div ref={host} className="open-world-canvas" />
        {!ready && <Loading className="world-loading" text="Chargement du monde…" />}
        <SettingsButton />
      </div>
    </div>
  );
}

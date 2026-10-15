// Les étiquettes de la Carte des lieux ouverts (piste 1, lot 3) : Kéo (une pastille unie à sa silhouette et « Toi »), le
// nom de chaque lieu ouvert (un bouton qui y mène, l'état de sa construction dessous, GD-20, lot 1), le cadenas de chaque lieu fermé et son nom atténué dessous (un
// toucher : la page dit « Fermé pour l'instant », au-dessus de « Retour »). Rien n'est écrit dans la 3D : la scène donne les points à l'écran, posés ici
// sans passer par React ; aucune étiquette n'en recouvre une autre (`layoutMapLabels`, world/continu/map.ts). Les
// tailles sont relues seulement quand une étiquette change de taille (police, grand texte), jamais à chaque image.
import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { Icon } from '../../../components/Icon';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { layoutMapLabels, type MapLabel, type Rect } from '../../world/continu/map';
import { PLACES, type PlaceId } from '../../world/continu/plan6e';
import type { MapSpotOnScreen } from './scene';

interface Props {
  /** Les lieux qu'on peut toucher ; les autres portent leur cadenas. */
  openPlaces: readonly PlaceId[];
  onPick(place: PlaceId): void;
  /** La page y range la fonction qui pose les étiquettes (le rappel `onMapPlaces` de la scène l'appelle). */
  placer: MutableRefObject<((spots: readonly MapSpotOnScreen[]) => void) | null>;
  /** Un lieu fermé touché : la page dit « Fermé pour l'instant ». */
  onClosed(place: PlaceId): void;
  /** L'état de chaque lieu ouvert (GD-20, lot 1) : en chantier, achevé, ou rien encore (aucune partie posée). */
  states: Readonly<Record<PlaceId, 'en-chantier' | 'restauree' | null>>;
  /** Les mots des états, ceux de l'univers (« En chantier »). */
  words: Readonly<Record<IslandStateId, string>>;
}

export function MapLabels({ openPlaces, onPick, placer, onClosed, states, words }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const sizes = useRef(new Map<string, { w: number; h: number }>());
  const last = useRef<readonly MapSpotOnScreen[]>([]);
  // Les boutons de la page que les étiquettes évitent, relus au changement de taille seulement.
  const obstacles = useRef<Rect[]>([]);
  const screen = useRef({ width: Infinity, height: Infinity });

  const place = useCallback((spots: readonly MapSpotOnScreen[]) => {
    last.current = spots;
    const el = root.current;
    if (!el) return;
    const items: MapLabel[] = [];
    for (const s of spots) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${s.id}"]`);
      if (!node) continue;
      if (node.hidden === s.shown) node.hidden = !s.shown;
      const size = sizes.current.get(s.id);
      if (!s.shown || !size) continue;
      const kind = s.id === 'keo' ? 'keo' : openPlaces.includes(s.id) ? 'open' : 'closed';
      items.push({ id: s.id, kind, x: s.x, y: s.y, w: size.w, h: size.h });
    }
    // Kéo d'abord, puis les lieux ouverts, puis les fermés : l'ordre de `layoutMapLabels`.
    for (const spot of layoutMapLabels(items, obstacles.current, screen.current)) {
      const node = el.querySelector<HTMLElement>(`[data-lieu="${spot.id}"]`);
      if (!node) continue;
      const transform = `translate(${Math.round(spot.left)}px, ${Math.round(spot.top)}px)`;
      if (node.style.transform !== transform) node.style.transform = transform;
      const name = spot.name ? 'oui' : 'non';
      if (node.dataset.nom !== name) node.dataset.nom = name;
    }
  }, [openPlaces]);

  useEffect(() => {
    placer.current = place;
    return () => {
      placer.current = null;
    };
  }, [place, placer]);

  // Les tailles des étiquettes, relues quand elles changent ; les étiquettes se reposent alors.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const stage = el.parentElement;
    const measureObstacles = () => {
      if (!stage) return;
      const s = el.getBoundingClientRect();
      screen.current = { width: s.width, height: s.height };
      obstacles.current = [...stage.querySelectorAll<HTMLElement>('.open-world-bar, .world-settings, .world-shortcuts')].map((o) => {
        const r = o.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, right: r.right - s.left, bottom: r.bottom - s.top };
      });
    };
    const observer = new ResizeObserver((entries) => {
      for (const e of entries) {
        const node = e.target as HTMLElement;
        if (node.dataset.lieu) sizes.current.set(node.dataset.lieu, { w: node.offsetWidth, h: node.offsetHeight });
      }
      measureObstacles();
      place(last.current);
    });
    observer.observe(el);
    for (const node of el.querySelectorAll<HTMLElement>('[data-lieu]')) observer.observe(node);
    return () => observer.disconnect();
  }, [openPlaces, place]);


  return (
    <div ref={root} className="open-world-map-places">
      <span className="open-world-map-keo" data-lieu="keo" role="img" aria-label="Toi : Kéo est ici" hidden>
        <span className="open-world-map-keo-disc" aria-hidden="true">
          <Icon name="toi" />
        </span>
        <span className="open-world-map-keo-word" aria-hidden="true">
          Toi
        </span>
      </span>
      {PLACES.map((p) =>
        openPlaces.includes(p.id) ? (
          <button
            key={p.id}
            type="button"
            className="open-world-map-place"
            data-lieu={p.id}
            hidden
            aria-label={`Y aller : ${p.name}${states[p.id] ? `, ${words[states[p.id]!]}` : ''}`}
            onClick={() => onPick(p.id)}
          >
            <span className="open-world-map-place-name">{p.name}</span>
            {/* L'état de sa construction, sous son nom : une icône et un mot, jamais la couleur seule (consultant UX UI). */}
            {states[p.id] && (
              <span className="open-world-map-state" data-etat={states[p.id]} aria-hidden="true">
                <Icon name={islandStateIcon(states[p.id]!)} />
                <span className="open-world-map-state-word">{words[states[p.id]!]}</span>
              </span>
            )}
          </button>
        ) : (
          <button
            key={p.id}
            type="button"
            className="open-world-map-closed"
            data-lieu={p.id}
            hidden
            aria-label={`${p.name} : sous la brume, fermé pour l’instant`}
            onClick={() => onClosed(p.id)}
          >
            <span className="open-world-lock" aria-hidden="true">
              <Icon name="lock" />
            </span>
            <span className="open-world-map-closed-name" aria-hidden="true">
              {p.name}
            </span>
          </button>
        ),
      )}
    </div>
  );
}

// La liste des lieux ouverts (GD-20, « La Carte au plus grand texte », bouton « Lieux », choix du mainteneur du 16 octobre
// 2026) : sur la Carte, le bouton « Lieux », à droite de « Retour », ouvre le même panneau qu'un lieu (`Sheet`), une ligne
// par lieu ouvert dans l'ordre de jeu (l'Escale, puis les lieux du plan), jamais par proximité ni par ordre alphabétique. Une
// ligne porte l'icône du lieu (celle de la pastille réduite de la Carte), son nom entier, l'icône et le mot de l'état de
// sa construction ; la ligne de la prochaine mission seule est mise en avant, « Prochaine mission » écrit. Toucher une
// ligne y mène d'un coup, comme une pastille (`pickPlace`). La croix, Échap (la liste d'abord, la Carte ensuite) ou un
// toucher sur la Carte à côté ferment la liste sans rien choisir ; le focus revient sur « Lieux ». Le lecteur d'écran
// lit aussi ce que les habitants ont reçu, posé dans le lieu (« …, avec le potager et la lanterne », lot L2 de GD-20,
// point 4 : relecture du lot L1), rien à l'écran : la ligne garde sa place.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHoldCelebrations } from '../../../components/Celebrations';
import { Icon, type AnyIconName } from '../../../components/Icon';
import { getBiome } from '../../biomes';
import { Sheet } from '../../Sheet';
import { islandStateIcon, type IslandStateId } from '../../world/islandState';
import { amenagementById } from '../../world/continu/amenagements';
import type { LevelPlan, OpenPlace, PlaceId } from '../../world/continu/levelPlan';
import { mapStateWord } from './constructionParts';

/** Le nom du panneau, dit aussi par la croix. */
export const PLACES_TITLE = 'Lieux ouverts';
/** Ce que dit le bouton qui ouvre la liste (le mot « Lieux » reste écrit sous l'icône). */
export const PLACES_BUTTON_LABEL = 'Lieux : la liste des lieux ouverts';
/** L'identifiant du panneau, pour `aria-controls` du bouton. */
export const PLACES_SHEET_ID = 'panneau-lieux';
/** Le mot écrit sur la ligne de la prochaine mission (jamais la couleur seule). */
export const NEXT_MISSION_WORD = 'Prochaine mission';

type BuildState = 'en-chantier' | 'restauree' | null;

/** Une ligne de la liste : l'Escale (sans état) ou un lieu ouvert. */
export interface PlacesRow {
  id: PlaceId | 'port';
  name: string;
  icon: AnyIconName;
  /** L'état de la construction, en icône et en mot ; rien pour l'Escale (rien ne s'y rebâtit). */
  state: { icon: AnyIconName; word: string } | null;
  next: boolean;
  /** Ce qui est posé chez l'habitant (les noms des aménagements, avec leur article), lu par le lecteur d'écran. */
  posed?: readonly string[];
}

/**
 * Le mot de l'état d'un lieu ouvert, accordé : celui du bouton de la Carte (`mapStateWord` : « Relevées » aux Ruines,
 * jamais « restaurées », lot L8b), et « À explorer » quand aucune partie n'est posée (l'icône de la pastille réduite).
 */
function placeStateWord(place: OpenPlace, state: BuildState, words: Readonly<Record<IslandStateId, string>>): string {
  return mapStateWord(place, state, words) ?? words['a-explorer'];
}

/** Les lignes, dans l'ordre de jeu : l'Escale (s'il y en a une), puis les lieux ouverts dans l'ordre du plan. */
export function placesRows(
  plan: LevelPlan,
  open: readonly PlaceId[],
  states: Readonly<Partial<Record<PlaceId, BuildState>>>,
  words: Readonly<Record<IslandStateId, string>>,
  next: PlaceId | null,
  portName?: string,
  posed?: Partial<Record<PlaceId, readonly string[]>>,
): PlacesRow[] {
  const port: PlacesRow[] = portName ? [{ id: 'port', name: portName, icon: 'ancre', state: null, next: false }] : [];
  return [
    ...port,
    ...plan.places.filter((p) => open.includes(p.id)).map((p) => ({
      id: p.id,
      name: p.name,
      icon: getBiome(p.island)?.icon ?? 'map',
      state: { icon: islandStateIcon(states[p.id] ?? 'a-explorer'), word: placeStateWord(p, states[p.id] ?? null, words) },
      next: p.id === next,
      posed: (posed?.[p.id] ?? []).flatMap((id) => amenagementById(id)?.name ?? []),
    })),
  ];
}

/** Ce que dit une ligne : « Y aller : [Nom], [état] », ce qui y est posé (« avec le potager »), et « prochaine mission » sur la ligne mise en avant. */
const rowLabel = (row: PlacesRow) =>
  `Y aller : ${row.name}${row.state ? `, ${row.state.word.toLowerCase()}` : ''}${row.posed?.length ? `, avec ${listWords(row.posed)}` : ''}${row.next ? `, ${NEXT_MISSION_WORD.toLowerCase()}` : ''}`;

/** « le potager », « le potager et la lanterne », « a, b et c ». */
const listWords = (words: readonly string[]) => (words.length < 2 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} et ${words[words.length - 1]}`);

/**
 * L'état de la liste sur la Carte : ouverte ou non, le bouton « Lieux » qui reprend le focus quand elle se ferme (la Carte
 * restant ouverte), et Échap en deux temps (la liste d'abord, puis la Carte, `closeMap`). Fermée avec la Carte : elle ne
 * se rouvre jamais d'elle-même.
 */
export function usePlacesList(mapOpen: boolean, closeMap: () => void) {
  const [open, setOpen] = useState(false);
  // La Carte fermée ferme la liste (mise à jour pendant le rendu, sans effet ni image de plus).
  const [mapWas, setMapWas] = useState(mapOpen);
  if (mapWas !== mapOpen) {
    setMapWas(mapOpen);
    setOpen(false);
  }
  const shown = open && mapOpen;
  const button = useRef<HTMLButtonElement>(null);
  const wasShown = useRef(false);
  useEffect(() => {
    if (shown) wasShown.current = true;
    else if (wasShown.current) {
      wasShown.current = false;
      if (mapOpen) button.current?.focus();
    }
  }, [shown, mapOpen]);
  const closeMapRef = useRef(closeMap);
  useEffect(() => {
    closeMapRef.current = closeMap;
  }, [closeMap]);
  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (shown) setOpen(false);
      else closeMapRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mapOpen, shown]);
  const toggle = useCallback(() => setOpen((was) => !was), []);
  const close = useCallback(() => setOpen(false), []);
  return { open: shown, toggle, close, button };
}

interface Props {
  rows: readonly PlacesRow[];
  onPick(place: PlaceId | 'port'): void;
  onClose(): void;
}

/** Le panneau « Lieux ouverts ». */
export function PlacesSheet({ rows, onPick, onClose }: Props) {
  useHoldCelebrations(true);
  const first = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  // Le focus sur la première ligne (l'Escale), sans faire défiler : la liste s'ouvre toujours en haut.
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, []);
  // Le repère « Suite plus bas » (un chevron sur une bande au bas du panneau, celui des questions) tant qu'une ligne est
  // sous le bord : une ligne peut finir juste au bord, sans rien de coupé qui dise la suite. Relu au défilement et quand
  // le panneau ou la liste change de taille, jamais à chaque image.
  useEffect(() => {
    const sheet = list.current?.closest<HTMLElement>('.island-sheet');
    if (!sheet || !list.current) return;
    const update = () => {
      const more = sheet.scrollTop + sheet.clientHeight < sheet.scrollHeight - 2;
      if (more === (sheet.dataset.repere === 'oui')) return;
      if (more) sheet.dataset.repere = 'oui';
      else delete sheet.dataset.repere;
    };
    sheet.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(sheet);
    observer?.observe(list.current);
    update();
    return () => {
      sheet.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, []);
  const alone = rows.length === 1 && rows[0].id === 'port';
  return (
    <Sheet id={PLACES_SHEET_ID} className="lieux-sheet" titleId={`${PLACES_SHEET_ID}-titre`} icon="liste" title={PLACES_TITLE} closeLabel={`Fermer : ${PLACES_TITLE}`} modal={false} onClose={onClose}>
      <ul ref={list} className="lieux-rows" aria-label={PLACES_TITLE}>
        {rows.map((row, i) => (
          <li key={row.id}>
            <button
              type="button"
              ref={i === 0 ? first : undefined}
              className={`panel app-card lieux-row${row.next ? ' suggested' : ''}`}
              aria-label={rowLabel(row)}
              aria-current={row.next ? 'step' : undefined}
              onClick={() => onPick(row.id)}
            >
              {/* L'icône et le nom : deux cases de la ligne, ou, au plus grand texte, du texte qui coule : l'icône en tête
                  du nom, l'état à la suite s'il tient sur sa ligne, entier, « Prochaine mission » dessous (openWorld.css). */}
              <span className="lieux-row-name">
                <span className="app-icon lieux-row-icon" aria-hidden="true">
                  <Icon name={row.icon} />
                </span>
                {/* Jamais de coupure après l'article élidé (« L’Imprimerie » reste entier), comme sur la Carte (`nameLines`). */}
                <span className="lieux-row-text">{row.name}</span>
              </span>
              {/* L'espace où l'état passe à la ligne, au plus grand texte (sans effet dans la grille du texte normal). */}{' '}
              {row.state && (
                <span className="lieux-row-state" aria-hidden="true">
                  <Icon name={row.state.icon} />
                  {row.state.word}
                </span>
              )}
              {row.next && (
                <span className="lieux-row-next" aria-hidden="true">
                  <Icon name="nord" />
                  {NEXT_MISSION_WORD}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {alone && (
        <p className="lieux-alone">
          <Icon name="lock" /> Rien d’autre d’ouvert
        </p>
      )}
      {/* Un repère pour l'œil : au clavier et au lecteur d'écran, la liste défile et se lit d'elle-même (expert frontend). */}
      <div className="lieux-repere" aria-hidden="true">
        <Icon name="chevronDown" />
      </div>
    </Sheet>
  );
}

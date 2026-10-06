// Les boutons des poignées du mode « Modifier le plan » sur la Carte (GD-9). Les quatre flèches et « Tourner » sont
// dessinées dans le monde, sur des radeaux posés sur l'eau autour du choix (three/arrangeHandles.ts ; mot du
// mainteneur, 6 octobre 2026 : « Il faut intégrer les boutons dans le dessin », « Pour rotation et translation »). Ici,
// par-dessus chaque poignée dessinée, un bouton HTML transparent, d'au moins 48 px, à la place que la 3D donne à chaque
// image où elle bouge (`ChoixALEcran`) : il porte son nom, `aria-disabled` quand la poignée ne sert pas (le toucher dit
// alors « Plus de place par là » dans la ligne du haut) et un focus visible ; il reçoit le toucher, le clavier et les
// lecteurs d'écran. Le clavier du mode (les flèches, Échap) ne change pas. « Réunir » est dans la barre du bas (ArrangeBar.tsx).
// Sans choix, un bouton transparent sur la poignée de chaque bout de liaison posée (choix 1a du mainteneur, 6 octobre
// 2026), nommé par son arrivée : le toucher choisit cette arrivée, que les flèches déplacent ensuite le long de la côte.
import { useLayoutEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { type Amenagement, FLECHES } from './Arranging';
import type { CleDePoignee } from './world/arrangeHandles';
import type { ChoixALEcran, LinkEndOnScreen } from './world/view';

/** Ce qui relie la 3D aux boutons : la 3D donne où se tiennent les poignées, les boutons l'écoutent ; et leurs touchers. */
export interface SuiviALEcran {
  suivre(b: ChoixALEcran | null): void;
  /** Écoute la place des poignées (la dernière tout de suite) ; rend de quoi arrêter. */
  ecouter(f: (b: ChoixALEcran | null) => void): () => void;
  /** Un bouton touché : la 3D enfonce sa poignée. */
  toucher(cle: CleDePoignee): void;
  /** Ce que la 3D écoute des touchers ; rend de quoi arrêter. */
  readonly touchers: { ecouter(f: (cle: CleDePoignee) => void): () => void };
}

export function creerSuiviALEcran(): SuiviALEcran {
  let dernier: ChoixALEcran | null = null;
  let ecoute: ((b: ChoixALEcran | null) => void) | null = null;
  let touche: ((cle: CleDePoignee) => void) | null = null;
  return {
    suivre(b) {
      dernier = b;
      ecoute?.(b);
    },
    ecouter(f) {
      ecoute = f;
      f(dernier);
      return () => {
        if (ecoute === f) ecoute = null;
      };
    },
    toucher(cle) {
      touche?.(cle);
    },
    touchers: {
      ecouter(f) {
        touche = f;
        return () => {
          if (touche === f) touche = null;
        };
      },
    },
  };
}

/** La plus petite cible du toucher, en pixels CSS. */
const CIBLE_MIN = 48;

/**
 * Le bouton de chaque poignée à sa place : exactement sur la poignée dessinée, aussi grand qu'elle (`CIBLE_MIN` au
 * moins), jamais déplacé sans elle. Une poignée qui sort de la place libre (sous la ligne du mode, sous sa barre, hors
 * de l'écran), c'est la vue qui se recadre pour la ramener (three/arrange.ts) ; le bouton la suit. Pur.
 */
export function placerLesBoutons(b: ChoixALEcran): Map<CleDePoignee, { x: number; y: number; w: number; h: number }> {
  const out = new Map<CleDePoignee, { x: number; y: number; w: number; h: number }>();
  for (const p of b.poignees) out.set(p.cle, { x: p.x, y: p.y, w: Math.max(CIBLE_MIN, p.w), h: Math.max(CIBLE_MIN, p.h) });
  return out;
}

/** La clé du bouton d'un bout de liaison (`data-bout`). */
const cleDuBout = (b: Pick<LinkEndOnScreen, 'link' | 'end'>) => `${b.link}|${b.end}`;

/** Le bouton de chaque bout de liaison à sa place : sur son petit radeau, 48 px au moins. Pur. */
export function placerLesBoutsDesLiaisons(b: ChoixALEcran): Map<string, { x: number; y: number; w: number; h: number }> {
  const out = new Map<string, { x: number; y: number; w: number; h: number }>();
  for (const p of b.bouts ?? []) out.set(cleDuBout(p), { x: p.x, y: p.y, w: Math.max(CIBLE_MIN, p.w), h: Math.max(CIBLE_MIN, p.h) });
  return out;
}

/** Les boutons, dans l'ordre de lecture : les quatre flèches, puis « Tourner ». */
const BOUTONS: readonly { cle: CleDePoignee; nom: string }[] = [...FLECHES.map((f) => ({ cle: f.dir, nom: f.nom })), { cle: 'tourner', nom: 'Tourner' }];

/**
 * Les boutons transparents des poignées. Rien sans choix ni pendant le geste de la pose. Sans `suivi` (pas de scène),
 * ils restent à leur place dans la page, sans être posés.
 */
export function ArrangeHandles({ amenagement, suivi }: { amenagement: Amenagement; suivi?: SuiviALEcran }) {
  const { choix, geste, vue, bouts } = amenagement;
  const boite = useRef<HTMLDivElement>(null);
  const avecBouts = !choix && !geste && Boolean(bouts?.length);
  const visible = (Boolean(choix) && !geste) || avecBouts;
  const poignees = choix ? (vue?.poignees?.liste ?? []) : [];
  // Les places qui colleraient le lieu choisi à un voisin (choix 2a) : l'icône de « Réunir » posée dessus.
  const nReunions = choix ? (vue?.reunions?.length ?? 0) : 0;
  const cles = choix ? `${poignees.map((p) => p.cle).join(',')}|${nReunions}` : (bouts ?? []).map(cleDuBout).join(',');
  useLayoutEffect(() => {
    const el = boite.current;
    if (!visible || !suivi || !el) return;
    return suivi.ecouter((b) => {
      if (!b) {
        el.dataset.place = 'non';
        return;
      }
      const places = placerLesBoutons(b);
      const desBouts = placerLesBoutsDesLiaisons(b);
      // Les icônes de « Réunir » : au milieu de leur place, sans rien recevoir (le toucher passe à la mer dessous).
      const reunions = b.reunions ?? [];
      Array.from(el.querySelectorAll<HTMLElement>('[data-reunion]')).forEach((x, i) => {
        const r = reunions[i];
        x.hidden = !r;
        if (r) x.style.transform = `translate(${Math.round(r.x)}px, ${Math.round(r.y)}px) translate(-50%, -50%)`;
      });
      for (const x of Array.from(el.querySelectorAll<HTMLElement>('[data-cle], [data-bout]'))) {
        const p = x.dataset.cle ? places.get(x.dataset.cle as CleDePoignee) : desBouts.get(x.dataset.bout ?? '');
        x.hidden = !p;
        if (!p) continue;
        x.style.width = `${Math.round(p.w)}px`;
        x.style.height = `${Math.round(p.h)}px`;
        x.style.transform = `translate(${Math.round(p.x - p.w / 2)}px, ${Math.round(p.y - p.h / 2)}px)`;
      }
      el.dataset.place = 'oui';
    });
  }, [visible, suivi, cles]);
  if (!visible) return null;
  const agir = (cle: CleDePoignee) => {
    suivi?.toucher(cle);
    if (cle === 'tourner') amenagement.tourner();
    else amenagement.fleche(cle);
  };
  if (avecBouts)
    return (
      <div ref={boite} className={`arrange-handles${suivi ? ' arrange-handles-poses' : ''}`} data-place={suivi ? 'non' : undefined} role="group" aria-label="Déplacer une arrivée">
        {bouts!.map((b) => (
          <button key={cleDuBout(b)} type="button" data-bout={cleDuBout(b)} className="arrange-handle" aria-label={b.nom} onClick={() => amenagement.choisirUnBout(b.link, b.end)} />
        ))}
      </div>
    );
  return (
    <div ref={boite} className={`arrange-handles${suivi ? ' arrange-handles-poses' : ''}`} data-place={suivi ? 'non' : undefined} role="group" aria-label="Déplacer">
      {suivi &&
        Array.from({ length: nReunions }, (_, i) => (
          <span key={`r${i}`} className="arrange-reunir-place" data-reunion={i} aria-hidden="true" hidden>
            <Icon name="reunir" />
          </span>
        ))}
      {BOUTONS.map(({ cle, nom }) => {
        const p = poignees.find((q) => q.cle === cle);
        if (!p) return null;
        return (
          <button key={cle} type="button" data-cle={cle} className="arrange-handle" aria-label={nom} aria-disabled={p.dispo ? undefined : true} onClick={() => agir(cle)} />
        );
      })}
    </div>
  );
}

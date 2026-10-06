// Les boutons des poignées du mode « Modifier le plan » sur la Carte (GD-9). Les quatre flèches et « Tourner » sont
// dessinées dans le monde, sur des radeaux posés sur l'eau autour du choix (three/arrangeHandles.ts ; mot du
// mainteneur, 6 octobre 2026 : « Il faut intégrer les boutons dans le dessin », « Pour rotation et translation »). Ici,
// par-dessus chaque poignée dessinée, un bouton HTML transparent, d'au moins 48 px, à la place que la 3D donne à chaque
// image où elle bouge (`ChoixALEcran`) : il porte son nom, `aria-disabled` quand la poignée ne sert pas (le toucher dit
// alors « Plus de place par là » dans la ligne du haut) et un focus visible ; il reçoit le toucher, le clavier et les
// lecteurs d'écran. Le clavier du mode (les flèches, Échap) ne change pas. « Réunir » est dans la barre du bas (ArrangeBar.tsx).
// Sans choix, un bouton transparent sur la poignée de chaque bout de liaison posée (choix 1a du mainteneur, 6 octobre
// 2026), nommé par son arrivée : le toucher choisit cette arrivée, que les flèches déplacent ensuite le long de la côte.
import { type PointerEvent as ReactPointerEvent, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { type Amenagement, FLECHES } from './Arranging';
import { RELAYE_DEPUIS_UN_BOUTON } from './three/drag';
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

/** Jamais une cible partagée sous cette taille, en pixels CSS : en dessous, un seul bouton pour deux bouts. */
const CIBLE_PARTAGEE_MIN = 24;

/**
 * Le bouton de chaque bout de liaison à sa place : sur son petit radeau, 48 px au moins. Deux bouts trop proches ont
 * déjà reculé le long de leur ponton (three/arrangeHandles.ts) ; s'ils se couvrent encore (deux bouts côte à côte sur
 * la même côte), leurs boutons se partagent la place à mi-distance, sur l'axe où ils s'écartent le plus : aucun bouton
 * n'en couvre un autre. Un partage qui laisserait une cible sous `CIBLE_PARTAGEE_MIN` (ou deux bouts au même point) :
 * un seul bouton pour les deux, celui du bout le plus près du milieu de la place libre (le premier, à égalité) ;
 * l'autre arrivée se choisit en touchant son ouvrage, ou dans la vue simple. Pur.
 */
export function placerLesBoutsDesLiaisons(b: ChoixALEcran): Map<string, { x: number; y: number; w: number; h: number }> {
  const out = new Map<string, { x: number; y: number; w: number; h: number }>();
  const liste = (b.bouts ?? []).map((p) => ({ cle: cleDuBout(p), x: p.x, y: p.y, w: Math.max(CIBLE_MIN, p.w), h: Math.max(CIBLE_MIN, p.h), retire: false }));
  const mx = (b.libre.x0 + b.libre.x1) / 2;
  const my = (b.libre.y0 + b.libre.y1) / 2;
  const loin = (p: { x: number; y: number }) => Math.hypot(p.x - mx, p.y - my);
  for (let i = 0; i < liste.length; i++)
    for (let j = i + 1; j < liste.length; j++) {
      const p = liste[i];
      const q = liste[j];
      if (p.retire || q.retire) continue;
      const dx = Math.abs(p.x - q.x);
      const dy = Math.abs(p.y - q.y);
      if (dx >= (p.w + q.w) / 2 || dy >= (p.h + q.h) / 2) continue;
      if (Math.max(dx, dy) < CIBLE_PARTAGEE_MIN) {
        // Trop près pour deux cibles : le bout le plus près du milieu garde la sienne, entière.
        (loin(q) < loin(p) ? p : q).retire = true;
        continue;
      }
      if (dx >= dy) p.w = q.w = Math.min(p.w, q.w, dx);
      else p.h = q.h = Math.min(p.h, q.h, dy);
    }
  for (const { cle, retire, ...p } of liste) if (!retire) out.set(cle, p);
  return out;
}

/** Le doigt bouge de moins que ça sur le bouton d'un bout : c'est un toucher (il choisit l'arrivée) ; au-delà, un glissé. */
const SEUIL_DU_TOUCHER = 8;

/**
 * Un glissé parti du bouton d'un bout de liaison fait glisser la Carte, comme partout ailleurs (expert frontend,
 * proposition a) : passé `SEUIL_DU_TOUCHER`, le bouton lâche le doigt et le relaie au canvas de la scène (un appui là
 * où il est parti, marqué `RELAYE_DEPUIS_UN_BOUTON`, puis le mouvement) ; la scène le capture et la vue glisse, le lever
 * n'ouvre rien, et le clic du bouton ne choisit rien. Rend de quoi brancher le bouton.
 */
function relaiDuGlisse() {
  let appui: { id: number; x: number; y: number } | null = null;
  let relaye = false;
  const pointeur = (type: string, e: ReactPointerEvent, x: number, y: number) =>
    new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: e.isPrimary, button: 0, buttons: 1, clientX: x, clientY: y });
  return {
    onPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
      appui = e.isPrimary ? { id: e.pointerId, x: e.clientX, y: e.clientY } : null;
      relaye = false;
    },
    onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
      // Un survol sans bouton enfoncé (la souris) n'est pas un glissé.
      if (!appui || relaye || e.buttons === 0 || e.pointerId !== appui.id || Math.hypot(e.clientX - appui.x, e.clientY - appui.y) < SEUIL_DU_TOUCHER) return;
      const canvas = e.currentTarget.closest('[data-scene]')?.querySelector('canvas');
      if (!canvas || typeof PointerEvent === 'undefined') return;
      relaye = true;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      canvas.dispatchEvent(Object.assign(pointeur('pointerdown', e, appui.x, appui.y), { [RELAYE_DEPUIS_UN_BOUTON]: true }));
      canvas.dispatchEvent(pointeur('pointermove', e, e.clientX, e.clientY));
    },
    /** Le doigt levé : plus d'appui (le clic qui suit lit encore `relaye`). */
    onPointerUp() {
      appui = null;
    },
    /** Le geste annulé : plus d'appui ni de glissé. */
    onPointerCancel() {
      appui = null;
      relaye = false;
    },
    /** Le clic n'est un toucher que si le doigt n'est pas parti en glissé. */
    toucher(): boolean {
      const ok = !relaye;
      appui = null;
      relaye = false;
      return ok;
    },
  };
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
  const [relai] = useState(relaiDuGlisse);
  const lesBouts = !choix && !geste && bouts?.length ? bouts : null;
  const visible = (Boolean(choix) && !geste) || lesBouts !== null;
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
      // Les icônes de « Réunir » : sur la jointure avec le voisin, sans rien recevoir (le toucher passe à la mer dessous).
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
  if (lesBouts)
    return (
      <div ref={boite} className={`arrange-handles${suivi ? ' arrange-handles-poses' : ''}`} data-place={suivi ? 'non' : undefined} role="group" aria-label="Déplacer une arrivée">
        {lesBouts.map((b) => (
          <button
            key={cleDuBout(b)}
            type="button"
            data-bout={cleDuBout(b)}
            className="arrange-handle"
            aria-label={b.nom}
            onPointerDown={relai.onPointerDown}
            onPointerMove={relai.onPointerMove}
            onPointerUp={relai.onPointerUp}
            onPointerCancel={relai.onPointerCancel}
            onClick={(e) => {
              // Au clavier (Entrée, Espace : `detail` à 0), le bouton choisit toujours ; au doigt, si ce n'était pas un glissé.
              const auToucher = relai.toucher();
              if (e.detail === 0 || auToucher) amenagement.choisirUnBout(b.link, b.end);
            }}
          />
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

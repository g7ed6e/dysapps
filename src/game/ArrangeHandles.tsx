// Les flèches autour du choix, dans le mode « Aménager » sur la Carte (GD-9 ; mot du mainteneur, 6 octobre 2026 : « les
// petites flèches de translation et de rotation se placent autour de l'item que l'on souhaite déplacer / tourner ») :
// les quatre flèches (le nord au-dessus, le sud dessous, l'ouest à gauche, l'est à droite), « Tourner » en haut à
// droite et « Réunir » en bas à droite, quand ils servent. Des boutons HTML, posés à l'écran sur la place projetée du
// choix (lieu, Gardien, borne ou arrivée) que la 3D donne à chaque image où elle change (`ChoixALEcran`,
// three/arrange.ts) : ils le suivent quand il bouge et quand la vue glisse ou se zoome, sans rien dessiner dans la
// scène. Ils restent dans la place libre (jamais sous la ligne du mode, sa barre ou le bouton Menu) ; autour d'un grand
// lieu, ils se resserrent (au téléphone plus encore), et une poignée qui en toucherait une autre se décale. Le clavier
// reste celui du mode (les flèches, Échap) ; chaque bouton a son nom, son mot dessous en grand texte.
import { useLayoutEffect, useRef } from 'react';
import { IconButton } from '../components/Icon';
import { type Amenagement, FLECHES } from './Arranging';
import { useTelephone } from './ArrangeBar';
import { canTurn } from './world/arrangeMode';
import type { Rectangle } from './world/placement';
import type { ChoixALEcran } from './world/view';

/** Ce qui relie la 3D aux flèches : la 3D donne où se tient le choix, les flèches l'écoutent (la dernière place gardée). */
export interface SuiviALEcran {
  suivre(b: ChoixALEcran | null): void;
  /** Écoute la place du choix (la dernière tout de suite) ; rend de quoi arrêter. */
  ecouter(f: (b: ChoixALEcran | null) => void): () => void;
}

export function creerSuiviALEcran(): SuiviALEcran {
  let dernier: ChoixALEcran | null = null;
  let ecoute: ((b: ChoixALEcran | null) => void) | null = null;
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
  };
}

/** Une poignée à poser : sa clé, son côté autour du choix (-1, 0 ou 1, en x et en y), sa taille à l'écran. */
export interface Poignee {
  cle: string;
  dx: -1 | 0 | 1;
  dy: -1 | 0 | 1;
  w: number;
  h: number;
}

/** L'écart, en pixels CSS, entre le choix et une poignée, entre deux poignées, et jusqu'au bord de la place libre. */
const ECART = 6;
/**
 * La demi-taille du choix prise en compte, en pixels CSS : au moins `min` (une borne : les flèches ne se touchent pas),
 * au plus `tablette` ou `telephone` (un grand lieu : les flèches se resserrent vers son milieu).
 */
export const RAYON = { min: 30, tablette: 170, telephone: 110 } as const;

/** Les pas autour de la place voulue, du plus proche au plus loin (quatre pas au plus de chaque côté). */
const VOISINAGE: readonly (readonly [number, number])[] = Array.from({ length: 81 }, (_, n) => [(n % 9) - 4, Math.floor(n / 9) - 4] as const)
  .filter(([i, j]) => i || j)
  .sort((p, q) => Math.hypot(p[0], p[1]) - Math.hypot(q[0], q[1]));

/** `v` ramené dans la bande [a + m, b - m] ; au milieu de la bande si elle est trop étroite. */
function bande(v: number, a: number, b: number, m: number): number {
  return b - a < 2 * m ? (a + b) / 2 : Math.min(Math.max(v, a + m), b - m);
}

/**
 * Où poser chaque poignée (son centre, en pixels CSS) autour du choix `b`, dans sa place libre : à son côté, juste hors
 * du choix (sa demi-taille bornée par `RAYON`, `rayonMax` au plus) ; ramenée dans la place libre ; et si elle en touche
 * une déjà posée, décalée (de l'autre côté du choix, sinon à la place libre la plus proche). Dans l'ordre donné : les
 * premières ont leur place.
 * Pur.
 */
export function placerLesPoignees(b: ChoixALEcran, poignees: readonly Poignee[], rayonMax: number): Map<string, { x: number; y: number }> {
  const rx = Math.min(Math.max(b.rx, RAYON.min), rayonMax);
  const ry = Math.min(Math.max(b.ry, RAYON.min), rayonMax);
  const libre: Rectangle = b.libre;
  const out = new Map<string, { x: number; y: number }>();
  const posees: { x: number; y: number; w: number; h: number }[] = [];
  const touche = (p: { x: number; y: number; w: number; h: number }) =>
    posees.some((q) => Math.abs(p.x - q.x) < (p.w + q.w) / 2 + ECART / 2 && Math.abs(p.y - q.y) < (p.h + q.h) / 2 + ECART / 2);
  for (const p of poignees) {
    const dans = (x: number, y: number) => ({ x: bande(x, libre.x0, libre.x1, p.w / 2 + ECART), y: bande(y, libre.y0, libre.y1, p.h / 2 + ECART), w: p.w, h: p.h });
    const a = (dx: number, dy: number) => dans(b.x + dx * (rx + p.w / 2 + ECART), b.y + dy * (ry + p.h / 2 + ECART));
    const pasX = p.w + ECART;
    const pasY = p.h + ECART;
    const voulue = a(p.dx, p.dy);
    // Une flèche garde son côté (le nord jamais sous le choix) ; « Tourner » et « Réunir » peuvent passer à un autre coin.
    const coin = p.dx !== 0 && p.dy !== 0;
    const essais = [
      voulue,
      ...(coin ? [a(-p.dx, p.dy), a(p.dx, -p.dy), a(-p.dx, -p.dy)] : []),
      // Au bord de l'écran : la place la plus proche de celle voulue, d'un pas de bouton en un pas de bouton.
      ...VOISINAGE.map(([i, j]) => dans(voulue.x + i * pasX, voulue.y + j * pasY)),
    ];
    const ici = essais.find((e) => !touche(e)) ?? essais[0];
    posees.push(ici);
    out.set(p.cle, { x: ici.x, y: ici.y });
  }
  return out;
}

/** Le côté de « Tourner » (en haut à droite) et de « Réunir » (en bas à droite), après les quatre flèches. */
const COINS = { tourner: { dx: 1, dy: -1 }, reunir: { dx: 1, dy: 1 } } as const;
const COTES: Readonly<Record<string, { dx: -1 | 0 | 1; dy: -1 | 0 | 1 }>> = { nord: { dx: 0, dy: -1 }, sud: { dx: 0, dy: 1 }, ouest: { dx: -1, dy: 0 }, est: { dx: 1, dy: 0 }, ...COINS };

/**
 * Les flèches, « Tourner » et « Réunir », autour du choix. Rien sans choix ni pendant le geste de la pose. Sans `suivi`
 * (pas de scène), elles restent à leur place dans la page, sans être posées.
 */
export function ArrangeHandles({ amenagement, suivi }: { amenagement: Amenagement; suivi?: SuiviALEcran }) {
  const { choix, geste, question, reunirAvec } = amenagement;
  const telephone = useTelephone();
  const boite = useRef<HTMLDivElement>(null);
  const tourner = canTurn(choix);
  const visible = Boolean(choix) && !geste;
  useLayoutEffect(() => {
    const el = boite.current;
    if (!visible || !suivi || !el) return;
    const rayonMax = telephone ? RAYON.telephone : RAYON.tablette;
    return suivi.ecouter((b) => {
      if (!b) {
        el.dataset.place = 'non';
        return;
      }
      const boutons = Array.from(el.querySelectorAll<HTMLElement>('[data-cle]'));
      // La taille de chaque bouton (une transformation ne la change pas : rien à recalculer dans la page).
      const poignees = boutons.map((x) => ({ cle: x.dataset.cle!, ...COTES[x.dataset.cle!], w: x.offsetWidth, h: x.offsetHeight }));
      const places = placerLesPoignees(b, poignees, rayonMax);
      for (const x of boutons) {
        const p = places.get(x.dataset.cle!);
        if (p) x.style.transform = `translate(${Math.round(p.x - x.offsetWidth / 2)}px, ${Math.round(p.y - x.offsetHeight / 2)}px)`;
      }
      el.dataset.place = 'oui';
    });
  }, [visible, suivi, telephone, tourner, reunirAvec]);
  if (!visible) return null;
  return (
    <div ref={boite} className={`arrange-handles${suivi ? ' arrange-handles-poses' : ''}`} data-place={suivi ? 'non' : undefined} role="group" aria-label="Déplacer">
      {FLECHES.map((f) => (
        <IconButton key={f.dir} data-cle={f.dir} icone={f.icone} nom={f.nom} className={`arrange-handle arrange-arrow arrange-arrow-${f.dir}`} onClick={() => amenagement.fleche(f.dir)} />
      ))}
      {tourner && <IconButton data-cle="tourner" icone="tourner" nom="Tourner" className="arrange-handle" onClick={amenagement.tourner} />}
      {reunirAvec && (
        <IconButton data-cle="reunir" icone="reunir" nom="Réunir" className="arrange-handle" aria-pressed={Boolean(question)} onClick={() => amenagement.demanderReunion()} />
      )}
    </div>
  );
}

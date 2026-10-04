// La place libre de la Carte (DA-31) : la part de la vue que l'interface ne couvre pas, sous le panneau « Prochaine
// destination » (son pli « Les îles et leur état » compté fermé), au-dessus de la barre du bas, sans la colonne (ou la
// rangée) Pause et archipel. La caméra de la Carte y cadre l'archipel et la destination (three/camera.ts).
// Lue dans la page par les zones que marque `data-couvre` (./zonesCouvertes.ts), pas image par image.
import type { LabelBox } from './world/labelLayout';
import { zonesCouvertes } from './zonesCouvertes';

/** Un rectangle de la vue, en pixels CSS, par ses bords. */
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Sans page autour (un aperçu), la bande du bas où flotteraient les boutons (comme pour les étiquettes). */
export const RESERVE_DU_BAS = 72;
/** En deçà, la place libre ne veut plus rien dire (une vue minuscule, une page en cours de mise en place) : toute la vue. */
const PLACE_MIN = { w: 120, h: 60 };
/** Sans panneau en haut, combien de temps la place est encore relue (le mot de la baleine peut rester ouvert). */
const ATTENTE_DU_PANNEAU_MS = 10_000;
/** Après un changement (la taille du texte, la vue, la Carte ouverte), la page finit de se mettre en place : relue une seconde encore. */
const MISE_EN_PLACE_MS = 1000;
const RELECTURE_MS = 250;

const bords = (b: LabelBox): Rect => ({ x0: b.x - b.w / 2, y0: b.y - b.h / 2, x1: b.x + b.w / 2, y1: b.y + b.h / 2 });

/**
 * La place libre d'une vue `w` × `h`, en pixels CSS : sous ce que l'interface pose en haut (`panneaux` du haut) et
 * au-dessus de ce qu'elle pose en bas (`panneaux` du bas, la barre), sans les `boutons` (Pause, choix de l'archipel)
 * qui descendent plus bas que le panneau : on les contourne par le côté, ou on passe sous eux, selon ce qui laisse le
 * plus de place. Pur, sans page.
 */
export function placeLibre(w: number, h: number, panneaux: LabelBox[], boutons: LabelBox[]): Rect {
  const r: Rect = { x0: 0, y0: 0, x1: w, y1: h };
  for (const p of panneaux.map(bords)) {
    if ((p.y0 + p.y1) / 2 < h / 2) r.y0 = Math.max(r.y0, p.y1);
    else r.y1 = Math.min(r.y1, p.y0);
  }
  for (const b of boutons) Object.assign(r, contourner(r, b));
  if (r.x1 - r.x0 < PLACE_MIN.w || r.y1 - r.y0 < PLACE_MIN.h) return { x0: 0, y0: 0, x1: w, y1: h };
  return r;
}

/**
 * La place `r` sans le bouton `b` (pixels CSS) : on le contourne par le côté, ou on passe sous lui, selon ce qui laisse le
 * plus de place ; `r` tel quel s'il ne le touche pas. Pur.
 */
export function contourner(r: Rect, b: LabelBox): Rect {
  const c = bords(b);
  if (c.y1 <= r.y0 || c.y0 >= r.y1 || c.x1 <= r.x0 || c.x0 >= r.x1) return r;
  const aDroite = (c.x0 + c.x1) / 2 > (r.x0 + r.x1) / 2;
  const cote = aDroite ? { ...r, x1: c.x0 } : { ...r, x0: c.x1 };
  const dessous = { ...r, y0: c.y1 };
  const aire = (q: Rect) => Math.max(0, q.x1 - q.x0) * Math.max(0, q.y1 - q.y0);
  return aire(cote) >= aire(dessous) ? cote : dessous;
}

/**
 * Le centre (`x`, `y`) d'une marque `w` × `h` ramené dans la place libre `lue` (lue pour une vue de `lue.w` × `lue.h`,
 * ramenée à `W` × `H`, pixels CSS ; `null` : toute la vue), à `bord` de ses bords ; au milieu de la bande si elle est trop
 * étroite. Pur.
 */
export function tenirDansLaPlace(x: number, y: number, w: number, h: number, W: number, H: number, lue: PlaceLue | null, bord: number): { x: number; y: number } {
  const r = lue?.libre;
  const sx = r && lue.w ? W / lue.w : 1;
  const sy = r && lue.h ? H / lue.h : 1;
  const bande = (v: number, a: number, b: number, m: number) => (b - a < 2 * m ? (a + b) / 2 : Math.min(Math.max(v, a + m), b - m));
  return {
    x: bande(x, r ? r.x0 * sx : 0, r ? r.x1 * sx : W, w / 2 + bord),
    y: bande(y, r ? r.y0 * sy : 0, r ? r.y1 * sy : H, h / 2 + bord),
  };
}

/** Autour du point d'un objet, en pixels CSS : la fiche le cache quand ce carré la touche. */
export const MARGE_DE_LA_FICHE = 24;

/**
 * La fiche d'un objet (lot 2 de « Toucher le monde ») cache-t-elle le point `ecran` de l'objet (pixels CSS de la vue) ?
 * Oui quand le carré de `MARGE_DE_LA_FICHE` autour de lui touche le rectangle de la fiche. Pur.
 */
export function sousLaFiche(ecran: { x: number; y: number }, fiche: Rect, marge = MARGE_DE_LA_FICHE): boolean {
  return ecran.x + marge > fiche.x0 && ecran.x - marge < fiche.x1 && ecran.y + marge > fiche.y0 && ecran.y - marge < fiche.y1;
}

/**
 * Ce qui s'ouvre dans l'interface compte fermé : le pli « Les îles et leur état » (un `details` ouvert) et ce qu'ouvre
 * un bouton `aria-expanded`, s'il y en a un. La zone qui les porte s'arrête où elle s'arrêterait fermée, défilement
 * du haut remis à zéro (fermé, le panneau tient sans défiler) : la caméra ne bouge pas quand l'élève ouvre ou referme un pli.
 */
function plisFermes(stage: Element, vue: DOMRect, zones: LabelBox[]): LabelBox[] {
  const fermes: { porteur: Element; plie: number }[] = [];
  const porteurDe = (e: Element) => e.closest('[data-couvre="scene"] > *, [data-couvre="bouton"]');
  for (const d of stage.querySelectorAll<HTMLDetailsElement>('[data-couvre] details[open]')) {
    const resume = d.querySelector(':scope > summary');
    const porteur = porteurDe(d);
    if (resume && porteur) fermes.push({ porteur, plie: d.getBoundingClientRect().bottom - resume.getBoundingClientRect().bottom });
  }
  for (const b of stage.querySelectorAll('[data-couvre] [aria-expanded="true"]')) {
    const porteur = porteurDe(b);
    if (porteur) fermes.push({ porteur, plie: porteur.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom });
  }
  if (!fermes.length) return zones;
  const out = [...zones];
  for (const { porteur, plie } of fermes) {
    const parent = porteur.parentElement?.hasAttribute('data-couvre') ? porteur.parentElement : null;
    const b = porteur.getBoundingClientRect();
    const cadre = parent ? parent.getBoundingClientRect() : b;
    const defile = parent?.scrollTop ?? 0;
    const left = Math.max(b.left, cadre.left) - vue.left;
    const right = Math.min(b.right, cadre.right) - vue.left;
    // La zone du porteur : même place en largeur (le défilement ne la change pas).
    // Et même hauteur : deux boutons de même largeur, l'un sous l'autre (Pause et l'archipel), ne se confondent pas.
    const dessus = Math.max(b.top, cadre.top) - vue.top;
    const dessous = Math.min(b.bottom, cadre.bottom) - vue.top;
    const i = out.findIndex((z) => Math.abs(z.x - (left + right) / 2) < 1 && Math.abs(z.w - (right - left)) < 1 && z.y >= dessus - 1 && z.y <= dessous + 1);
    if (i < 0) continue;
    const haut = Math.max(b.top + defile, cadre.top) - vue.top;
    const bas = Math.max(haut, Math.min(b.bottom + defile - plie, cadre.bottom) - vue.top);
    out[i] = { x: out[i].x, y: (haut + bas) / 2, w: out[i].w, h: bas - haut };
  }
  return out;
}

/**
 * La place libre de la vue `el` lue dans la page (plis comptés fermés), et s'il y a un panneau en haut ; sans page
 * autour (un aperçu), la vue moins la bande du bas.
 */
export function lirePlaceLibre(el: HTMLElement): { libre: Rect; panneau: boolean } {
  const w = el.clientWidth;
  const h = el.clientHeight;
  const stage = el.closest('[data-scene]');
  if (!stage) return { libre: { x0: 0, y0: 0, x1: w, y1: Math.max(h / 2, h - RESERVE_DU_BAS) }, panneau: true };
  const vue = el.getBoundingClientRect();
  const panneaux = plisFermes(stage, vue, zonesCouvertes(el, 1, '[data-couvre="scene"] > *'));
  const boutons = plisFermes(stage, vue, zonesCouvertes(el, 1, '[data-couvre="bouton"]'));
  return { libre: placeLibre(w, h, panneaux, boutons), panneau: panneaux.some((p) => p.y < h / 2) };
}

export interface PlaceLue {
  libre: Rect;
  /** La taille de la vue, en pixels CSS. */
  w: number;
  h: number;
  /** La place vient de changer avec la taille du texte : la caméra s'y met d'un coup, sans mouvement. */
  saut: boolean;
}

/** Ce que les réglages de texte posent sur la racine (la taille, la police, les espacements, `data-texte`). */
const reglagesDuTexte = () => {
  const root = document.documentElement;
  return `${root.getAttribute('data-texte') ?? ''}|${root.getAttribute('style') ?? ''}`;
};

/**
 * La place libre de la vue `el`, gardée tant que rien ne la change : relue quand `contexte` change (la Carte ouverte,
 * une autre destination), quand la vue change de taille ou le texte de réglages, puis une seconde encore le temps que
 * la page se mette en place, et tant qu'aucun panneau n'est posé en haut (le panneau de la Carte attend que le mot de
 * la baleine soit fermé) ; quatre fois par seconde au plus, à chaque appel si l'horloge est figée (les captures).
 * Entre deux, la caméra ne suit pas le panneau.
 */
export function lecteurDePlaceLibre(el: HTMLElement): (contexte: string) => PlaceLue {
  let lu = -Infinity;
  let jusqua = -Infinity;
  let cle = '';
  let texte = '';
  let sautJusqua = -Infinity;
  let panneau = false;
  let place: PlaceLue | null = null;
  return (contexte) => {
    const now = performance.now();
    const w = el.clientWidth;
    const h = el.clientHeight;
    const t = reglagesDuTexte();
    const k = `${contexte}@${w}x${h}@${t}`;
    if (k !== cle) {
      // Le texte a changé sous une place déjà lue : la caméra saute, pendant la mise en place aussi.
      if (place && t !== texte) sautJusqua = now + MISE_EN_PLACE_MS;
      cle = k;
      texte = t;
      jusqua = now + MISE_EN_PLACE_MS;
      lu = -Infinity;
    }
    if (place?.saut) place = { ...place, saut: false };
    // Sans panneau en haut, relue encore un moment (le mot de la baleine se ferme), pas sans fin.
    const attend = !panneau && now <= jusqua + ATTENTE_DU_PANNEAU_MS;
    if (place && !((now <= jusqua || attend) && !(now - lu > 0 && now - lu < RELECTURE_MS))) return place;
    lu = now;
    const lue = lirePlaceLibre(el);
    panneau = lue.panneau;
    const avant = place;
    const bouge = !avant || avant.w !== w || avant.h !== h || (['x0', 'y0', 'x1', 'y1'] as const).some((c) => Math.round(avant.libre[c]) !== Math.round(lue.libre[c]));
    const lueOuGardee = bouge ? { libre: lue.libre, w, h, saut: Boolean(avant) && now <= sautJusqua } : avant;
    place = lueOuGardee;
    return lueOuGardee;
  };
}

// Ce que l'interface du monde pose sur la scène (le panneau de la Carte, les bulles, le bouton Pause, le choix de
// l'archipel, les boutons du bas) : des rectangles en pixels de la vue, qu'aucune étiquette d'île ne doit couvrir
// (DA-10). Lu dans la page, pas image par image : la vue le relit de temps en temps.
import type { LabelBox } from './world/labelLayout';

// La page marque ce qu'elle pose sur la scène (`data-scene`) par un attribut qui ne sert pas au style : `data-couvre`
// « scene » sur un conteneur dont chaque enfant compte (le haut, la barre du bas), « bouton » sur un élément seul
// (Pause, choix de l'archipel), « bulle » sur le conteneur des bulles du bas.
/** Ce qui reste posé sur la scène : les étiquettes s'en écartent. */
const DURABLES = '[data-couvre="scene"] > *, [data-couvre="bouton"]';
/** Les bulles du bas (le mot de la baleine, l'aide) : passagères, les étiquettes ne bougent pas pour elles, mais celles qu'elles couvrent se cachent le temps de la bulle. */
const PASSAGERES = '[data-couvre="bulle"] > *';

/** Les zones couvertes, au centre (comme les étiquettes), relatives à la vue `el` ; `echelle` : pixels de la vue par pixel CSS. */
export function zonesCouvertes(el: HTMLElement, echelle = 1, selecteur = DURABLES): LabelBox[] {
  const stage = el.closest('[data-scene]');
  if (!stage) return [];
  const vue = el.getBoundingClientRect();
  const zones: LabelBox[] = [];
  // Le cadre de chaque conteneur, lu une fois.
  const cadres = new Map<Element, DOMRect>();
  for (const z of stage.querySelectorAll<HTMLElement>(selecteur)) {
    // Un panneau plus haut que son conteneur qui défile (le haut et le bas ont une hauteur maximale) ne couvre que ce cadre.
    const b = z.getBoundingClientRect();
    const parent = z.parentElement?.hasAttribute('data-couvre') ? z.parentElement : null;
    if (parent && !cadres.has(parent)) cadres.set(parent, parent.getBoundingClientRect());
    const cadre = parent ? cadres.get(parent)! : b;
    const left = Math.max(b.left, cadre.left);
    const top = Math.max(b.top, cadre.top);
    const w = Math.min(b.left + b.width, cadre.left + cadre.width) - left;
    const h = Math.min(b.top + b.height, cadre.top + cadre.height) - top;
    if (w < 1 || h < 1) continue;
    zones.push({ x: (left + w / 2 - vue.left) * echelle, y: (top + h / 2 - vue.top) * echelle, w: w * echelle, h: h * echelle });
  }
  return zones;
}

/** Une clé des zones, au pixel près : l'écart des étiquettes ne se refait que si elles ont bougé. */
export function cleDesZones(zones: LabelBox[]): string {
  return zones.map((z) => `${Math.round(z.x)},${Math.round(z.y)},${Math.round(z.w)},${Math.round(z.h)}`).join(';');
}

/**
 * Les zones de la vue `el`, relues au plus quatre fois par seconde (à chaque image si l'horloge est figée, comme pour
 * les captures) : `zones`, dont les étiquettes s'écartent, et `bulles`, sous lesquelles elles se cachent sans bouger ;
 * `repli` : ce qui est réservé sans page autour (un aperçu), en pixels de la vue.
 */
export function lecteurDeZones(el: HTMLElement, repli: () => LabelBox[], echelle: () => number = () => 1) {
  let lu = -Infinity;
  const lues = { zones: [] as LabelBox[], bulles: [] as LabelBox[], cle: '' };
  return () => {
    const now = performance.now();
    // Relue si 250 ms ont passé, ou si l'horloge n'a pas avancé (figée pour les captures) ou a reculé.
    if (!(now - lu > 0 && now - lu < 250)) {
      lu = now;
      const e = echelle();
      const zones = zonesCouvertes(el, e);
      lues.zones = zones.length ? zones : repli();
      lues.bulles = zonesCouvertes(el, e, PASSAGERES);
      lues.cle = `${cleDesZones(lues.zones)}|${cleDesZones(lues.bulles)}`;
    }
    return lues;
  };
}

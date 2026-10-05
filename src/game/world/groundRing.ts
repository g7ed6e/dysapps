// Le rond au sol : la case où va le bonhomme quand on a touché le sol, montrée dès le toucher et effacée à l'arrivée.
// Un rond plein et fixe (ni pulsation, ni clignotement, ni grossissement), clair, cerclé d'un trait foncé : il se lit par
// sa forme sur l'herbe comme sur le sable ou la neige, et pas seulement par sa couleur. Code pur, sans Three.js : la
// forme (quelques triangles) et ses deux couleurs ; three/groundRing.ts la pose dans la scène, en un seul appel de dessin.
//
// Selon l'univers : dans le monde en blocs, un octogone net aux côtés droits, comme dessiné en pixels ; dans le monde
// peint d'Archipéo, un rond plus doux, ivoire cerclé d'encre brune.
import type { ArchipelagoId } from './archipelago';
import { mixColor } from './daylight';
import { deNuit, ENCRE, IVOIRE, IVOIRE_DE_NUIT, type Couleur } from './palette';

export interface FormeDuRond {
  /** Les sommets, trois par triangle, à plat : (x, z) autour du centre de la case, en cases. */
  sommets: Float32Array;
  /** Pour chaque sommet : 0 le plein, 1 le cerne. */
  roles: Uint8Array;
  plein: Couleur;
  cerne: Couleur;
}

/** Le rayon du plein et celui du cerne, en cases : le rond tient dans sa case, sous les pieds du bonhomme. */
export const RAYON_DU_PLEIN = 0.32;
export const RAYON_DU_CERNE = 0.46;

/**
 * Le blanc et le bleu nuit du rond dans le monde en blocs : ceux du contour des repères en pixels. Le monde en blocs n'a
 * pas de palette nommée (ses couleurs sont dans ses textures, ./pixels.ts) : elles restent ici.
 */
const BLANC_DU_ROND = 0xffffff;
const BLEU_NUIT_DU_ROND = 0x1b2440;

/** Quand on touche la case où il se tient déjà : le rond y reste ce temps (ms), fixe, sans marche. */
export const DUREE_DU_ROND_SEUL = 1000;

const STYLES = {
  // Les côtés de l'octogone suivent la grille (décalé d'un demi-pas) : un rond de pixels.
  blocs: { cotes: 8, decalage: Math.PI / 8, plein: BLANC_DU_ROND, cerne: BLEU_NUIT_DU_ROND },
  // Les couleurs nommées de la palette d'Archipéo.
  peint: { cotes: 16, decalage: 0, plein: IVOIRE, cerne: ENCRE },
} as const;

export type StyleDuRond = keyof typeof STYLES;

/** La forme du rond : un disque (le plein) et un anneau (le cerne), en triangles indépendants. */
export function formeDuRond(style: StyleDuRond): FormeDuRond {
  const { cotes, decalage, plein, cerne } = STYLES[style];
  const sommets: number[] = [];
  const roles: number[] = [];
  const point = (r: number, i: number): [number, number] => {
    const a = decalage + (i / cotes) * Math.PI * 2;
    return [r * Math.cos(a), r * Math.sin(a)];
  };
  const tri = (role: number, ...pts: [number, number][]) => {
    for (const [x, z] of pts) {
      sommets.push(x, z);
      roles.push(role);
    }
  };
  for (let i = 0; i < cotes; i++) {
    const a1 = point(RAYON_DU_PLEIN, i);
    const a2 = point(RAYON_DU_PLEIN, i + 1);
    const b1 = point(RAYON_DU_CERNE, i);
    const b2 = point(RAYON_DU_CERNE, i + 1);
    // Vus d'en haut (y vers le haut, z vers l'avant) : sens trigonométrique depuis la caméra.
    tri(0, [0, 0], a2, a1);
    tri(1, a1, a2, b2);
    tri(1, a1, b2, b1);
  }
  return { sommets: new Float32Array(sommets), roles: new Uint8Array(roles), plein, cerne };
}

/**
 * Les couleurs du rond à un moment du jour (`jour` : 0 la nuit, 1 le jour). Le monde en blocs les garde telles quelles ;
 * le monde peint teinte un peu son ivoire de la nuit de l'archipel (`IVOIRE_DE_NUIT`), le cerne reste l'encre.
 */
export function couleursDuRond(style: StyleDuRond, archipel: ArchipelagoId, jour: number): { plein: Couleur; cerne: Couleur } {
  const { plein, cerne } = STYLES[style];
  if (style === 'blocs') return { plein, cerne };
  const nuit = IVOIRE_DE_NUIT * (1 - Math.min(1, Math.max(0, jour)));
  return { plein: mixColor(plein, deNuit(archipel, plein, 0), nuit), cerne };
}

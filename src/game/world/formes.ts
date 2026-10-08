// Les formes des îles (GD-12, « Une forme par île », décision du mainteneur du 8 octobre 2026) : un petit catalogue de
// sept formes de nature (le galet, le croissant, le haricot, la presqu'île, la goutte, le trèfle, la cacahuète), que
// chaque île prend à la main (./silhouettes/), orientée (vers le devant, le fond, la gauche ou la droite, et en miroir).
// La forme se pose autour du cœur, qui ne bouge pas : c'est la terre autour qui change. Chaque forme est une distance
// signée (en cases) à son bord, faite de quelques volumes simples (disques, gélules, rectangles arrondis), lue dans le
// repère du cœur : `u` vers la droite, `v` vers le fond, depuis le milieu du cœur, `s` son demi-côté (11 pour un cœur de
// 22, 13 pour un cœur de 26). Le bruit de la graine de l'île casse ensuite le contour à la case près (./map.ts).
// Code pur, sans Three.js.

/** Les sept formes du catalogue (docs/gameplay/propositions/GD-12.md, §1). */
export type FormeId = 'galet' | 'croissant' | 'haricot' | 'presquile' | 'goutte' | 'trefle' | 'cacahuete';

export const FORMES: readonly FormeId[] = ['galet', 'croissant', 'haricot', 'presquile', 'goutte', 'trefle', 'cacahuete'];

/** Le côté vers lequel une forme tourne ce qui la distingue (l'ouverture du croissant, la pointe de la goutte, le bras…). */
export type Vers = 'devant' | 'fond' | 'gauche' | 'droite';

/**
 * La forme d'une île : la forme du catalogue, le côté vers lequel elle se tourne (dans le repère de l'île, avant qu'on la
 * tourne : le devant est côté caméra, côté quai) et, s'il le faut, son miroir (gauche et droite échangées, vue depuis
 * ce côté). `quai` : l'île-port, dont la baie garde l'eau du quai et du Bloc-Navire, et une rive droite devant la jetée.
 */
export interface FormeDeLIle {
  forme: FormeId;
  vers: Vers;
  miroir?: boolean;
  quai?: boolean;
}

// ---------- Les volumes simples, en distance signée (négative dedans) ----------

const longueur = (x: number, y: number) => Math.hypot(x, y);

/** Un disque de centre (cx, cy) et de rayon r. */
function disque(u: number, v: number, cx: number, cy: number, r: number): number {
  return longueur(u - cx, v - cy) - r;
}

/** Une gélule : le segment de (ax, ay) à (bx, by), épaissi de r. */
function gelule(u: number, v: number, ax: number, ay: number, bx: number, by: number, r: number): number {
  const px = u - ax;
  const py = v - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (dx * dx + dy * dy)));
  return longueur(px - dx * t, py - dy * t) - r;
}

/** Une gélule qui s'effile : de rayon `ra` en (ax, ay) à `rb` en (bx, by) (un cône arrondi). */
function goutteDe(u: number, v: number, ax: number, ay: number, ra: number, bx: number, by: number, rb: number): number {
  const px = u - ax;
  const py = v - ay;
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / l2));
  return longueur(px - dx * t, py - dy * t) - (ra + (rb - ra) * t);
}

/** Un rectangle de centre (cx, cy), de demi-côtés (hx, hy), aux coins arrondis de rayon r. */
function rectangleArrondi(u: number, v: number, cx: number, cy: number, hx: number, hy: number, r: number): number {
  const qx = Math.abs(u - cx) - (hx - r);
  const qy = Math.abs(v - cy) - (hy - r);
  return longueur(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** L'union adoucie de deux volumes (un congé de rayon k là où ils se rejoignent : ni pointe ni entaille étroite). */
function unionDouce(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - a)) / k));
  return b + (a - b) * h - k * h * (1 - h);
}

/** `a` creusé de `b` (une baie, une crique), adouci de k. */
function creuse(a: number, b: number, k: number): number {
  return -unionDouce(-a, b, k);
}

// ---------- Le catalogue, chaque forme tournée vers le devant (−v) ----------

/**
 * La boîte de chaque forme (piste 1 du directeur artistique, « formes contenues », 8 octobre 2026) : sa terre ne dépasse
 * jamais le cœur de plus de `BOITE_DE_LA_FORME` cases, sur aucun de ses quatre côtés. La boîte est carrée et centrée
 * sur le cœur : elle tourne avec le lieu sans changer de place, si bien qu'un lieu qui tient à sa place y tient tourné
 * (GD-9, GD-11 : chaque lieu mobile peut tourner). Une forme se lit donc par des volumes larges plutôt que longs : un
 * bras plus large que long, une baie qui mord la terre autour du cœur (jamais le cœur) ; on n'agrandit pas la boîte.
 */
export const BOITE_DE_LA_FORME = 5;

/** Sur chaque côté, la terre dépasse le cœur d'au moins tant de cases, là où la forme est la plus large. */
export const COTE_MINIMALE_DE_LA_FORME = 3;

/** Le bord le plus lointain que dessine une forme, depuis le bord du cœur, avant le bruit (qui l'écarte de moins d'une case). */
const LOIN = BOITE_DE_LA_FORME - 0.5;

/**
 * Une baie creusée dans le bord de devant (−v) : un disque qui mord la terre jusqu'à `fond` cases du cœur, sur `demi`
 * cases de part et d'autre de `cu`, depuis un bord placé à `bord` cases du cœur.
 */
function baie(u: number, v: number, s: number, cu: number, demi: number, bord: number, fond: number): number {
  const d = bord - fond;
  const r = (demi * demi + d * d) / (2 * d);
  return disque(u, v, cu, -(s + bord) - r + d, r);
}

/**
 * La distance signée au bord d'une forme du catalogue, dans son repère propre : ce qui la distingue tourné vers le
 * devant (−v), `s` le demi-côté du cœur. Chaque forme tient dans sa boîte (`BOITE_DE_LA_FORME`), laisse au moins deux
 * cases de terre autour du cœur (./map.ts le tient), et ses bras, ses lobes et ses baies ont trois cases de large au
 * moins (formes.test.ts).
 */
function distanceCanonique(f: FormeDeLIle, u: number, v: number, s: number): number {
  const L = s + LOIN;
  switch (f.forme) {
    case 'galet':
      // Un ovale doux, un peu plus long vers le fond : les coins de devant très arrondis, ceux du fond un peu moins, où
      // se tiennent les repères (le chêne de la Forêt, juste derrière le cœur).
      return v > 0.5 ? rectangleArrondi(u, v, 0, 0.5, s + 3, s + 3.5, 7) : rectangleArrondi(u, v, 0, 0.5, s + 3, s + 3.5, s * 0.9);
    case 'croissant': {
      if (f.quai) {
        // L'île-port : la baie s'ouvre devant, à droite, où se tiennent la jetée (colonne 16 du cœur, u = 8,5) et le
        // Bloc-Navire (u de 9 à 15). Devant elles, la rive reste droite à deux cases du cœur ; une seule corne, à gauche,
        // embrasse la rade : la seconde serait sous le navire, et la boîte ne la tient pas au-delà.
        const corps = rectangleArrondi(u, v, 0, 0.5, s + 3, s + 2.5, 7);
        const corne = rectangleArrondi(u, v, -(s - 1), -(s + 1), 5.5, 3.5, 2.5);
        return unionDouce(corps, corne, 2.5);
      }
      // Un corps rond derrière, deux cornes larges et courtes devant, et entre elles la baie, qui mord la terre jusqu'à
      // une case et demie du cœur.
      const corps = v > 0 ? rectangleArrondi(u, v, 0, -0.5, L, s + 4, 9) : rectangleArrondi(u, v, 0, -0.5, L, s + 4, 3);
      return creuse(corps, baie(u, v, s, 0, 8, LOIN, 1.5), 1.5);
    }
    case 'haricot': {
      // Un ventre rond, entamé devant d'un creux large et peu profond : le bord rentre jusqu'à une case et demie du cœur.
      const ventre = rectangleArrondi(u, v, 0, 0.25, s + 3.5, s + 3.75, 10);
      return creuse(ventre, baie(u, v, s, 0, 10, 4, 1.5), 2);
    }
    case 'presquile': {
      // Un corps rond, mince devant (deux cases), et un bras large qui s'avance devant, du côté droit, jusqu'au bord
      // de la boîte : plus large que long, il se lit par la côte mince qui le borde.
      const corps = rectangleArrondi(u, v, 0, 0.5, s + 3, s + 2.5, 8);
      const bras = gelule(u, v, s - 4, -(s - 1), s - 1, -(s + 1.5), 3);
      return unionDouce(corps, bras, 2);
    }
    case 'goutte': {
      // Un rond dont le devant s'effile : les coins de devant très arrondis, une pointe au milieu jusqu'au bord de la boîte.
      const rond = v > 0 ? rectangleArrondi(u, v, 0, 0, s + 3, s + 3, 6) : rectangleArrondi(u, v, 0, 0, s + 3, s + 3, s - 2);
      const pointe = goutteDe(u, v, 0, -(s - 4), 8, 0, -(s + 3), 2);
      return unionDouce(rond, pointe, 3);
    }
    case 'trefle': {
      // Trois lobes, deux aux coins de devant, l'un au fond ; entre eux, la côte rentre jusqu'à deux cases du cœur.
      const base = rectangleArrondi(u, v, 0, 0, s + 2, s + 2, 8);
      const fond = disque(u, v, 0, s - 0.5, 5);
      const gauche = disque(u, v, -(s - 1.5), -(s - 1.5), 6);
      const droite = disque(u, v, s - 1.5, -(s - 1.5), 6);
      return unionDouce(unionDouce(unionDouce(base, fond, 2), gauche, 2), droite, 2);
    }
    case 'cacahuete': {
      // Deux lobes, devant et au fond, réunis par une taille : de part et d'autre du milieu du cœur, la côte rentre
      // jusqu'à une case et demie de lui.
      const corps = rectangleArrondi(u, v, 0, 0, s + 3.5, L, 9);
      const taille = Math.min(disque(u, v, -(s + 1.5 + 7), 0, 7), disque(u, v, s + 1.5 + 7, 0, 7));
      return creuse(corps, taille, 2);
    }
  }
}

/**
 * Un point du repère du cœur (`u` à droite, `v` vers le fond) dans le repère propre d'une forme tournée vers `vers` :
 * son devant y tombe devant (−v). Le miroir échange la gauche et la droite de la forme.
 */
function versLeRepereDeLaForme(f: FormeDeLIle, u: number, v: number): [number, number] {
  let a: number;
  let b: number;
  switch (f.vers) {
    case 'devant':
      [a, b] = [u, v];
      break;
    case 'fond':
      [a, b] = [-u, -v];
      break;
    case 'gauche':
      // Le devant de la forme regarde vers la gauche (−u) : sa droite est devant l'île (−v).
      [a, b] = [-v, u];
      break;
    case 'droite':
      [a, b] = [v, -u];
      break;
  }
  return [f.miroir ? -a : a, b];
}

/**
 * La distance signée (en cases, négative dedans) d'un point au bord de la forme d'une île, dans le repère du cœur : `u`
 * vers la droite et `v` vers le fond depuis le milieu du cœur, `s` son demi-côté.
 */
export function distanceALaForme(f: FormeDeLIle, u: number, v: number, s: number): number {
  const [a, b] = versLeRepereDeLaForme(f, u, v);
  return distanceCanonique(f, a, b, s);
}

/**
 * L'étendue de la forme autour du cœur, en cases (de son bord au bout de la terre, de chaque côté), avant le bruit :
 * ce que la boîte de la terre de l'île (`ext`, ./map.ts) doit tenir, le bruit compris (`marge`).
 */
export function etendueDeLaForme(f: FormeDeLIle, s: number, marge: number): { left: number; right: number; front: number; back: number } {
  let [x0, x1, y0, y1] = [0, 0, 0, 0];
  const R = s + 30;
  for (let i = -R; i < R; i++)
    for (let j = -R; j < R; j++) {
      // Le milieu de la case (i, j) depuis le milieu du cœur.
      if (distanceALaForme(f, i + 0.5, j + 0.5, s) >= marge) continue;
      x0 = Math.min(x0, i);
      x1 = Math.max(x1, i + 1);
      y0 = Math.min(y0, j);
      y1 = Math.max(y1, j + 1);
    }
  return { left: Math.max(0, -s - x0), right: Math.max(0, x1 - s), front: Math.max(0, -s - y0), back: Math.max(0, y1 - s) };
}

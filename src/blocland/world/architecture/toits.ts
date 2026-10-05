// Les pièces de toit de l'architecture modulaire (lot 7b d'Archipéo) : les toits en gradins de world/architect.ts
// deviennent des pentes à 45°, lues sur le sens de la pente (./choix.ts) : le versant, qui monte d'un côté ; le faîte,
// qui descend des deux côtés ; la croupe, le bout d'un faîte qui descend aussi vers son bout ; la pointe, qui descend de
// quatre côtés ; l'arêtier, le coin d'un toit en pyramide. D'un gradin au suivant, les pentes se prolongent : le haut
// d'un versant touche le bas du faîte, un cran plus haut. Rien ne sort de la case.
//
// Chaque pièce est dessinée dans son orientation de référence (voir `pieceDe`) : le versant monte vers +x ; le faîte
// descend vers +x et −x (il file le long de y) ; la croupe descend vers +x, −x et −y ; l'arêtier monte vers le coin
// (+x, +y). Les couleurs sont celles de la couverture de l'île (world/toits.ts) : le dessus pour les pentes, les rives
// (un peu plus sombres) pour les bouts et le dessous. Code pur.
import type { IdDeToit } from './choix';
import { FACES, type DessinDePiece, type Facette, type V3 } from './pieces';

const pente = (points: V3[], normale: V3): Facette => ({ points, normale, face: 'dessus' });
const rive = (points: V3[], normale: V3): Facette => ({ points, normale, face: 'cote' });
const dessous = rive(
  [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
  ],
  [0, 0, -1],
);

/** Le versant : monte de x = 0 (au bas) à x = 1 (en haut), fermé derrière (x = 1) et dessous. */
const VERSANT: DessinDePiece = {
  facettes: [
    pente(
      [
        [0, 0, 0],
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [-1, 0, 1],
    ),
    rive(
      [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
        [1, 0, 1],
      ],
      [1, 0, 0],
    ),
    dessous,
    rive(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
      ],
      [0, -1, 0],
    ),
    rive(
      [
        [0, 1, 0],
        [1, 1, 1],
        [1, 1, 0],
      ],
      [0, 1, 0],
    ),
  ],
  couvre: FACES.est | FACES.bas,
  filant: true,
};

/** Le faîte : deux pentes qui se rejoignent au milieu de la case, à mi-hauteur ; il file le long de y. */
const FAITE: DessinDePiece = {
  facettes: [
    pente(
      [
        [0, 0, 0],
        [0.5, 0, 0.5],
        [0.5, 1, 0.5],
        [0, 1, 0],
      ],
      [-1, 0, 1],
    ),
    pente(
      [
        [0.5, 0, 0.5],
        [1, 0, 0],
        [1, 1, 0],
        [0.5, 1, 0.5],
      ],
      [1, 0, 1],
    ),
    dessous,
    rive(
      [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 0, 0.5],
      ],
      [0, -1, 0],
    ),
    rive(
      [
        [0, 1, 0],
        [0.5, 1, 0.5],
        [1, 1, 0],
      ],
      [0, 1, 0],
    ),
  ],
  couvre: FACES.bas,
  filant: true,
};

/** La croupe : le bout d'un faîte (il file vers +y) qui descend aussi vers −y. */
const CROUPE: DessinDePiece = {
  facettes: [
    pente(
      [
        [0, 0, 0],
        [0.5, 0.5, 0.5],
        [0.5, 1, 0.5],
        [0, 1, 0],
      ],
      [-1, 0, 1],
    ),
    pente(
      [
        [1, 0, 0],
        [1, 1, 0],
        [0.5, 1, 0.5],
        [0.5, 0.5, 0.5],
      ],
      [1, 0, 1],
    ),
    pente(
      [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 0.5, 0.5],
      ],
      [0, -1, 1],
    ),
    dessous,
    rive(
      [
        [0, 1, 0],
        [0.5, 1, 0.5],
        [1, 1, 0],
      ],
      [0, 1, 0],
    ),
  ],
  couvre: FACES.bas,
};

/** La pointe : une pyramide, qui descend de ses quatre côtés. */
const POINTE: DessinDePiece = {
  facettes: [
    pente(
      [
        [0, 0, 0],
        [1, 0, 0],
        [0.5, 0.5, 0.5],
      ],
      [0, -1, 1],
    ),
    pente(
      [
        [1, 0, 0],
        [1, 1, 0],
        [0.5, 0.5, 0.5],
      ],
      [1, 0, 1],
    ),
    pente(
      [
        [1, 1, 0],
        [0, 1, 0],
        [0.5, 0.5, 0.5],
      ],
      [0, 1, 1],
    ),
    pente(
      [
        [0, 1, 0],
        [0, 0, 0],
        [0.5, 0.5, 0.5],
      ],
      [-1, 0, 1],
    ),
    dessous,
  ],
  couvre: FACES.bas,
};

/** L'arêtier : le coin d'un toit en pyramide, qui monte vers le coin (+x, +y) ; deux pentes, deux rives. */
const ARETIER: DessinDePiece = {
  facettes: [
    pente(
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 1],
      ],
      [0, -1, 1],
    ),
    pente(
      [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ],
      [-1, 0, 1],
    ),
    rive(
      [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
      ],
      [1, 0, 0],
    ),
    rive(
      [
        [0, 1, 0],
        [1, 1, 1],
        [1, 1, 0],
      ],
      [0, 1, 0],
    ),
    dessous,
  ],
  couvre: FACES.bas,
};

/**
 * Les pièces de toit d'un kit : chaque pente, au bout d'une rangée (la rive) comme au milieu, sous le ciel. Un toit
 * sous un autre bloc du plan, ou à plat (sans pente lue), reste un bloc taillé.
 */
export function piecesDeToit(): Partial<Record<IdDeToit, DessinDePiece>> {
  const out: Partial<Record<IdDeToit, DessinDePiece>> = {};
  for (const rive of ['rive', 'courant'] as const) {
    out[`toit.versant.${rive}.ciel`] = VERSANT;
    out[`toit.faite.${rive}.ciel`] = FAITE;
    out[`toit.croupe.${rive}.ciel`] = CROUPE;
    out[`toit.pointe.${rive}.ciel`] = POINTE;
    out[`toit.aretier.${rive}.ciel`] = ARETIER;
  }
  return out;
}

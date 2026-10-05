// Les réglages de l'intention (directeur artistique, 28 septembre 2026) : la teinte, le biseau, la lueur et l'allumage
// des fenêtres, les lanternes, les trophées, le fantôme, les pilotis ; et les couleurs des rôles du kit d'architecture.
// Lus par le maillage (../construction.ts), le shader (./shader.ts) et la vue (three/construction.ts).
import { ambianceDe, BLEU_LAGON, BRUME, type Couleur } from '../palette';
import { TROPHY_SLOTS } from '../trophyHall';
import { mixColor } from '../daylight';
import type { ArchipelagoId } from '../map';
import { type Kit, KITS, type Role, ROLES_PEINTS } from '../architecture';
import { DELAVE, rgb } from '../decor/brush';
import { lineaire } from '../landMesh/lighting';

/** La variation de luminosité d'un bloc à l'autre : ± 4 %, jamais une autre teinte. */
export const TEINTE = 0.04;

/** Le biseau des arêtes saillantes, en part de case. */
export const BISEAU = 0.08;

/** La lueur des fenêtres et des lanternes, la nuit. */
export const LUEUR: Couleur = 0xffd866;

/** Le verre d'une vitre, le jour : le verre de la palette, à cette part de sa luminosité. */
export const VITRE_DE_JOUR = 0.55;

/** Au plus tant de vitres allumées par bâtiment. */
export const FENETRES_ALLUMEES = 3;

/** Au plus tant de lanternes allumées par cour (une île et un lieu, comme les vitres). */
export const LANTERNES_ALLUMEES = 2;

/**
 * Une lanterne (le genre `lanterne` : cours, comptoirs, sommets, pas les vitres) : un corps sombre de `corps` case de côté
 * et de haut, posé au milieu de sa case, et sur lui un cœur de `coeur` case, qui s'allume. Rien ne sort de la case.
 */
export const LANTERNE = { corps: 0.3, coeur: 0.18 } as const;

/**
 * Un trophée de la salle des trophées, dans Archipéo, quand le kit de l'archipel reprend la salle (GD-3, retouches du
 * directeur artistique : la halle ne se lit plus comme un mur de panneaux) : un bloc plus petit que sa case, au milieu,
 * pour qu'il ne touche ni le pilier voisin ni la sablière et qu'on voie le fond de velours autour et au-dessus de lui.
 * `bas` : le côté du trophée posé sur son socle ; `haut` : celui du second rang, posé sur lui (et non sur le sol de sa
 * case : il ne flotte pas) ; `hauteur` : la hauteur de chacun. Les deux rangs laissent `2 - 2 × hauteur` case d'ombre
 * sous le toit. Blocland garde ses trophées en blocs entiers (three/cubes.ts).
 */
export const TROPHEE = { bas: 0.62, haut: 0.46, hauteur: 0.66 } as const;

/** Le rang des trophées posés sur leur socle (les autres sont posés sur eux). */
export const RANG_DES_SOCLES = Math.min(...TROPHY_SLOTS.map((t) => t.z));

/** Le verre hors d'un mur (provisoire, jusqu'au phare de R4b) : 80 % Brume, 20 % Bleu lagon, avec une arête par case. */
export const VERRE_HORS_MUR: Couleur = mixColor(BRUME, BLEU_LAGON, 0.2);

/** L'arête du verre hors d'un mur : `ARETE`, à cette opacité, sur 1,5 pixel. */
export const ARETE_DU_VERRE = 0.4;

/** Le biseau peint : la lumière ajoutée au bord saillant (+22 %)… */
export const ECLAT_DU_BISEAU = 0.22;

/** … et au moins tant de niveaux sRGB de plus, par canal, sur une teinte sombre (luminance sous `SOMBRE`). */
export const ECART_SOMBRE = 14;

export const SOMBRE = 0.25;

/** Le décalage d'allumage d'une fenêtre, de 0 à cette valeur (en degré de nuit). */
export const DECALAGE_MAX = 0.15;

/** L'allumage : rien sous ce degré de nuit, tout allumé à `PLEINE_NUIT`. */
export const ALLUMAGE = 0.3;

export const PLEINE_NUIT = 0.8;

/** Le fantôme : sa teinte, son arête, et l'épaisseur de l'arête en part de case. */
export const FANTOME: Couleur = BRUME;

export const ARETE: Couleur = 0x142b38;

export const ARETE_FANTOME = 0.035;

/** Les pilotis : une case est sur le vide si rien de solide n'est dessous sur tant de cases (ou si c'est l'eau). */
export const PROFONDEUR = 6;

/** La toile du Bloc-Navire : le crème Brume. */
export const TOILE_DU_NAVIRE: Couleur = BRUME;

/**
 * La couleur d'un rôle du kit d'architecture (lot 7 : poteau, remplissage, soubassement, bardage, pilotis, chaperon), de
 * jour : sous le voile de l'archipel, comme les matières ; délavée si l'île est fermée.
 */
export function couleurDuRole(a: ArchipelagoId, kit: Kit, role: Role, muted = false): Couleur {
  const [teinte, force] = ambianceDe(a).voile;
  const v = mixColor(kit.couleurs[role] ?? BRUME, teinte, force);
  return muted ? mixColor(v, DELAVE[0], DELAVE[1]) : v;
}

/**
 * Les couleurs des rôles que le shader peint sur les murs (`ROLES_PEINTS` : poteau, soubassement, chaperon), puis les
 * mêmes délavées, dans l'espace linéaire de Three.js : l'uniforme `uRoles` des blocs (three/construction.ts).
 */
export function couleursDesRoles(a: ArchipelagoId, kit: Kit = KITS[a]): Float32Array {
  const out: number[] = [];
  for (const muted of [false, true])
    for (const r of ROLES_PEINTS) {
      const k = rgb(couleurDuRole(a, kit, r, muted));
      out.push(lineaire(k[0] / 255), lineaire(k[1] / 255), lineaire(k[2] / 255));
    }
  return Float32Array.from(out);
}

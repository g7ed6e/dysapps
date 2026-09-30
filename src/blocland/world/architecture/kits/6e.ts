// Le kit des Premiers Rivages (6e, lot 7b d'Archipéo), la référence des autres archipels : l'intention du directeur
// artistique du 30 septembre 2026 (avis « Aligné », docs/conception/cadrage-archipeo.md, « L'intention du 6e »).
// - Le bois : le colombage (poteaux #795643 sur un remplissage crème #D8D9C9, peint, 0 triangle) ; bardé (#B1815E) aux
//   pignons et sur les bâtiments du quai ; des pilotis (#6E4C30) là où il touche l'eau et où le sol manque dessous.
// - La pierre : un mur plein, de sa matière ; le soubassement et le chaperon en pierre #8A8F84.
// - Les toits : les pentes de ./toits.ts, dans la couverture de leur île (world/toits.ts : ardoise, ou terre cuite à la
//   Ferme et à la Mine).
// Le verre et les lanternes ne deviennent jamais des pièces ; les monuments, l'école et la salle des trophées gardent
// leur dessin (ils ont un lieu, et n'ont pas de plan d'île : ./plans.ts).
import { boiteDansLaCase, type DessinDePiece, type Facette } from '../pieces';
import { MOTIF } from '../peinture';
import { piecesDeToit } from '../toits';
import type { IdDeMur, Forme, Tete } from '../choix';
import type { Kit } from './types';

/** La hauteur des pilotis sous le plancher : celle du soubassement, qu'ils remplacent. */
export const PILOTIS = { haut: 0.35, cote: 0.14 } as const;

/**
 * Un mur de bois sur pilotis : le plancher et le colombage au-dessus des pilotis (sa sablière basse posée sur eux), et
 * quatre poteaux aux coins de la case, jusqu'au bas de la case (le reste du pieu est dans l'eau).
 */
function surPilotis(tete: Tete): DessinDePiece {
  const motif = MOTIF.colombage | MOTIF.sabliereBasse | (tete === 'toit' ? MOTIF.sabliereHaute : 0) | (tete === 'chaperon' ? MOTIF.chaperon : 0);
  const corps = boiteDansLaCase(0, 1, 0, 1, PILOTIS.haut, 1, motif, 'remplissage');
  const c = PILOTIS.cote;
  const pieux: Facette[] = [];
  for (const [x0, y0] of [
    [0, 0],
    [1 - c, 0],
    [0, 1 - c],
    [1 - c, 1 - c],
  ])
    // Les quatre côtés d'un pieu (le dessus est sous le plancher, le dessous dans l'eau).
    pieux.push(...boiteDansLaCase(x0, x0 + c, y0, y0 + c, 0, PILOTIS.haut, 0, 'pilotis').facettes.filter((f) => f.normale[2] === 0));
  // Le dessus du corps : du chaperon s'il n'y a rien au-dessus.
  const facettes = corps.facettes.map((f) => (f.normale[2] > 0 && tete === 'chaperon' ? { ...f, motif: MOTIF.pierreEntiere } : f));
  return { facettes: [...facettes, ...pieux], couvre: corps.couvre };
}

function piecesSurPilotis(): Partial<Record<IdDeMur, DessinDePiece>> {
  const out: Partial<Record<IdDeMur, DessinDePiece>> = {};
  const formes: Forme[] = ['seul', 'bout', 'droit', 'angle', 'te', 'croix'];
  for (const tete of ['chaperon', 'toit', 'mur'] as const) {
    const d = surPilotis(tete);
    for (const forme of formes) out[`mur.${forme}.pilotis.${tete}`] = d;
  }
  return out;
}

export const KIT_6E: Kit = {
  // La Ferme (terre) : le torchis d'un colombage ; proposition de l'artiste technique 3D, à valider par le directeur
  // artistique (sinon, la retirer : l'étable garde ses blocs de terre).
  matieres: { planches: 'bois', terre: 'bois', pierre: 'pierre', galet: 'pierre', brique: 'pierre', obsidienne: 'pierre', toit: 'toit' },
  couleurs: { poteau: 0x795643, remplissage: 0xd8d9c9, soubassement: 0x8a8f84, chaperon: 0x8a8f84, bardage: 0xb1815e, pilotis: 0x6e4c30 },
  murs: { bois: 'colombage', pierre: 'plein' },
  // Les îles au quai ou au ponton : la Baie (le quai de la cabine), la Rivière (le ponton de la hutte), la Tour (le quai du
  // phare). Leurs murs ne sont pas de bois aujourd'hui : la règle attend les bâtiments de bois qu'on y posera.
  bardes: ['baie', 'riviere', 'tour'],
  pieces: { toit: piecesDeToit(), bois: piecesSurPilotis() },
};

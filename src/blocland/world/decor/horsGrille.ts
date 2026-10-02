// Le décor d'Archipéo hors de la grille (règle 2 des intentions du directeur artistique, docs/univers/archipeo/intentions/
// commun.md) : ce qui se dessine sur des cases où le bonhomme ne va jamais, ou au loin (la grue du 4e, le lointain).
// Rien de cela n'a de cube : ni la marche, ni les empreintes de J0, ni Blocland, ni la 2D n'en savent rien, et rien ne
// s'y touche (`caseDuDecor` et la vue 3D l'ignorent). Chaque sous-lot R4b range ici, par une ligne, ce qu'il pose et
// comment il le dessine.
import type { ElementDeDecor } from '../decorMesh';
import type { ChampDuSol } from '../landMesh';
import type { ArchipelagoId } from '../map';
import { FORMES_HORS_GRILLE_5E, horsGrille5e } from './5e';
import { FORMES_HORS_GRILLE_4E, horsGrille4e } from './4e';
import type { Forme } from './outils';

/** Ce qu'un archipel pose hors de la grille, d'après son sol et le décor déjà posé, et les formes qui le dessinent. */
interface DecorHorsGrille {
  poser: (champ: ChampDuSol, elements: readonly ElementDeDecor[]) => ElementDeDecor[];
  formes: Record<string, Forme>;
}

const PAR_ARCHIPEL: Partial<Record<ArchipelagoId, DecorHorsGrille>> = {
  '5e': { poser: horsGrille5e, formes: FORMES_HORS_GRILLE_5E },
  '4e': { poser: horsGrille4e, formes: FORMES_HORS_GRILLE_4E },
};

/** Les éléments hors de la grille d'un archipel (sans cubes, marqués `horsGrille`). */
export function decorHorsGrille(a: ArchipelagoId, champ: ChampDuSol, elements: readonly ElementDeDecor[]): ElementDeDecor[] {
  return PAR_ARCHIPEL[a]?.poser(champ, elements) ?? [];
}

/** La forme d'un genre hors de la grille dans un archipel, s'il en a une. */
export function formeHorsGrille(a: ArchipelagoId, genre: string): Forme | undefined {
  return PAR_ARCHIPEL[a]?.formes[genre];
}

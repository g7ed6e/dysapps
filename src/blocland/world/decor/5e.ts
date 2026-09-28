// Les formes du décor propres aux Îles Brumeuses (5e) : leurs repères. Ce fichier appartient au sous-lot R4b-5e
// (docs/conception/cadrage-archipeo.md §6).
import { enRepere, type Forme } from './outils';
import { octaedre, peintre, tronconique } from './pinceau';

/** Le champignon géant du Marais : pied clair, chapeau rouge en dôme, des points blancs. */
const champignonGeant = enRepere(({ P, e, cx, cz, pied, Z, rot, du, deMatiere }) => {
  const fPied = deMatiere('sable');
  const chapeau = e.cubes.find((c) => c.z === Z + 3 && !c.texture) ?? e.cubes[0];
  const fC = du(chapeau);
  const fP = du(e.cubes.find((c) => c.z === Z + 5) ?? chapeau);
  tronconique(P, cx, cz, pied, Z + 3.9, 0.5, 0.4, 6, rot, peintre(fPied, pied, Z + 4 - pied), false);
  const pC = peintre(fC, Z + 3.4, 2);
  tronconique(P, cx, cz, Z + 3.5, Z + 4.6, 2.5, 1.3, 8, rot, pC, false);
  tronconique(P, cx, cz, Z + 4.6, Z + 5.5, 1.3, 0, 8, rot, pC);
  for (let k = 0; k < 5; k++) {
    const a = rot + (k / 5) * Math.PI * 2 + 0.3;
    octaedre(P, [cx + 1.75 * Math.cos(a), Z + 4.35, cz + 1.75 * Math.sin(a)], 0.24, 0.7, peintre(fP, Z + 4, 1), true, a);
  }
  octaedre(P, [cx, Z + 5.5, cz], 0.3, 0.6, peintre(fP, Z + 5, 1), true);
});

/** L'aiguille de glace du Glacier : un pilier qui s'amincit en pointe, un cristal au sommet. */
const aiguilleDeGlace = enRepere(({ P, cx, cz, pied, Z, rot, deMatiere }) => {
  const fG = deMatiere('glace');
  const pG = peintre(fG, pied, Z + 8 - pied);
  tronconique(P, cx, cz, pied, Z + 5.2, 1.1, 0.62, 6, rot, pG, false);
  tronconique(P, cx, cz, Z + 5.2, Z + 8.6, 0.62, 0, 6, rot + 0.3, pG);
  octaedre(P, [cx, Z + 9.2, cz], 0.42, 1.5, peintre(deMatiere('cristal'), Z + 8.5, 1.2), false, rot);
});

export const FORMES_5E: Record<string, Forme> = { 'champignon-geant': champignonGeant, 'aiguille-de-glace': aiguilleDeGlace };

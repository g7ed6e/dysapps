// Les formes du décor propres aux Îles Brumeuses (5e) : leurs repères. Ce fichier appartient au sous-lot R4b-5e
// (docs/conception/cadrage-archipeo.md §6).
import type { Lointain } from './lointain';
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

/**
 * Le lointain des Îles Brumeuses (intention du directeur artistique, design/archipeo/intentions/5e-iles-brumeuses.md
 * §2) : des masses de roche en gradins, plus hautes que larges, au sommet plat et moussu, la plus au centre portant une
 * tour carrée au toit d'ardoise ; derrière elles, une chaîne de cimes très pâles.
 */
export const LOINTAIN_5E: Lointain = {
  graine: 'lointain-5e',
  pieces: [
    { genre: 'gradins', u: 0.1, recul: 62, haut: 19, rayon: 5.5, marche: 2.5, retrait: 0.6, pans: 7, couleur: 0x6895ad, sommet: 0x6f8f6a },
    { genre: 'gradins', u: 0.42, recul: 85, haut: 24, rayon: 7, marche: 2.5, retrait: 0.6, pans: 7, couleur: 0x6895ad, sommet: 0x6f8f6a, tour: { cote: 2.5, haut: 5, pierre: 0x7d8a86, toit: 0x224c5f } },
    { genre: 'gradins', u: 0.7, recul: 66, haut: 21, rayon: 6, marche: 2.5, retrait: 0.6, pans: 7, couleur: 0x6895ad, sommet: 0x6f8f6a },
    { genre: 'gradins', u: 0.95, recul: 100, haut: 18, rayon: 5.5, marche: 2.5, retrait: 0.6, pans: 6, couleur: 0x6895ad, sommet: 0x6f8f6a },
    { genre: 'cretes', u: -0.3, a: 1.3, recul: 125, haut: 22, cimes: 7, epaisseur: 24, couleur: 0xa9c4d4, sommet: 0xe6eef2, neige: 0.78 },
  ],
};

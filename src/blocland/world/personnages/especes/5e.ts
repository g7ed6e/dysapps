// Les habitants des Îles Brumeuses (5e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique.
import type { BiomeId } from '../../../biomes';
import { TENUE } from '../couleurs';
import { disque, jalon, manche, pointe, type Espece } from '../gabarit';
import { facette, fuseau, parFace, pave, pose, repere } from '../peint';

export const ESPECES_5E: Partial<Record<BiomeId, Espece>> = {
  glacier: {
    nom: 'Frimas',
    metier: 'guetteur',
    gabarit: 'elance',
    dominante: 0x2e3a48,
    marque: { couleur: 0xe8e0cc, ou: ['ventre', 'visage'] },
    tenue: { couleur: TENUE.lin, vetements: ['echarpe'] },
    silhouette: { largeur: 0.34, profondeur: 0.3, ventre: 0.05, jambe: 0.07, jambes: 0.5 },
    museau: { forme: 'bec', long: 0.12, r: 0.05, y: 2.2 },
    outil: { pose: [0, 0, -0.05], dessiner: (T, k) => jalon(T, -1.12, 1.35, 0.026, 6, k.bois, k.lin) },
  },
  marche: {
    nom: 'Bazar',
    metier: 'marchand',
    gabarit: 'trapu',
    // Gris chaud et oreilles rondes : il ne se confond pas avec Moustache, gris froid aux oreilles pointues.
    dominante: 0x8a7f70,
    marque: { couleur: 0xc4baa8, ou: ['ventre', 'museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.18, r: 0.08 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.21, 2.5, 0.03], Math.PI / 2, 0, 0)), 0, 0.13, 0.04, k.dom, 6);
    },
    corps: (T, k) =>
      // La queue rayée.
      fuseau(
        pose(T, repere([-0.1, 0.85, 0.2], 1.9, 0, 0.9)),
        [
          [0, 0.07],
          [0.14, 0.09],
          [0.28, 0.09],
          [0.42, 0.08],
          [0.56, 0],
        ],
        5,
        parFace((s) => (s % 2 === 1 ? k.marque : k.dom)),
      ),
    outil: {
      // La balance romaine : le crochet, le fléau, le poids et le plateau suspendu.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.1, 0.06, 0.016, k.fer);
        pave(T, -0.14, -0.13, -0.018, 0.4, -0.09, 0.018, k.fer);
        pave(T, 0.32, -0.26, -0.04, 0.4, -0.13, 0.04, k.laiton);
        manche(T, -0.3, -0.13, 0.008, k.fer, 3);
        disque(T, -0.32, 0.13, 0.03, k.laiton);
      },
    },
  },
  carrefour: {
    nom: 'Sema',
    metier: 'peintre d’enseignes',
    dominante: 0x7fa048,
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    // Le casque du caméléon, une crête haute qui part vers l'arrière.
    coiffe: (T, k) => pointe(T, [0, 2.4, 0.1], 0.17, 0.32, k.dom, [0.55, 0, 0], 4, 0.04),
    corps: (T, k) =>
      // La queue enroulée en spirale, à côté de la jambe.
      fuseau(
        pose(T, repere([-0.2, 0.7, 0.18], 0, 0, 0)),
        [
          [-0.05, 0.08, 0.08, 0, 0],
          [0.05, 0.075, 0.075, 0.1, -0.12],
          [0.2, 0.07, 0.07, 0.12, -0.3],
          [0.4, 0.06, 0.06, 0.04, -0.36],
          [0.52, 0.055, 0.055, -0.04, -0.24],
          [0.56, 0.04, 0.04, 0, -0.16],
          [0.58, 0, 0, 0, -0.12],
        ],
        4,
        k.dom,
      ),
    outil: {
      pose: [-0.5, 0, 0.2],
      dessiner: (T, k) => {
        manche(T, -0.08, 0.45, 0.022, k.bois);
        pointe(T, [0, 0.45, 0], 0.045, 0.14, k.lin);
      },
    },
    autreMain: {
      // Le panneau fléché (0,5 × 0,3 bloc, et sa pointe), tourné vers l'avant : il se voit de face.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.4, 0.5, 0.022, k.bois);
        pave(T, -0.5, 0.18, -0.018, 0.04, 0.48, 0.018, k.lin);
        facette(
          T,
          [
            [-0.5, 0.12, -0.019],
            [-0.5, 0.54, -0.019],
            [-0.68, 0.33, -0.019],
          ],
          [-0.55, 0.33, 1],
          k.lin,
        );
      },
    },
  },
  marais: {
    nom: 'Kroa',
    metier: 'vannier',
    gabarit: 'trapu',
    dominante: 0x3f5a3a,
    marque: { couleur: 0xb8683a, ou: ['ventre'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    museau: { forme: 'museau', long: 0.08, r: 0.12 },
    corps: (T, k) => {
      // Les roseaux sur le dos, et la queue.
      for (const [x, rz, h] of [
        [-0.14, 0.32, 1.4],
        [-0.05, 0.14, 1.65],
        [0.05, -0.12, 1.55],
        [0.14, -0.3, 1.35],
      ])
        manche(pose(T, repere([x, 0.95, 0.3], 0.12, 0, rz)), 0, h, 0.018, k.lin, 3);
      fuseau(
        pose(T, repere([0, 0.75, 0.2], 2.3, 0, 0)),
        [
          [0, 0.09],
          [0.25, 0.06],
          [0.45, 0],
        ],
        5,
        k.dom,
      );
    },
    outil: {
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.3, 0.17],
            [0, 0.24],
          ],
          6,
          k.bois,
          { haut: false },
        ),
    },
  },
  comptoir: {
    nom: 'Pudding',
    metier: 'commis',
    gabarit: 'trapu',
    dominante: 0xd8c8a8,
    marque: { couleur: 0x8a6a4a, ou: ['museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.36, ventre: 0.06, tete: 0.31 },
    museau: { forme: 'museau', long: 0.09, r: 0.14, y: 2.13 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pave(pose(T, repere([c * 0.3, 2.42, 0], 0, 0, c * 0.25)), -0.035, -0.22, -0.07, 0.035, 0, 0.07, k.marque);
    },
    outil: {
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        pave(T, -0.045, -0.05, -0.17, 0.045, 0.33, 0.17, k.bois);
        pave(T, -0.036, -0.035, -0.18, 0.036, 0.315, 0.15, k.lin);
      },
    },
  },
  manoir: {
    nom: 'Moustache',
    metier: 'intendant',
    dominante: 0x4a4a55,
    marque: { couleur: 0x9a98a2, ou: ['visage', 'poitrine', 'museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['gilet'] },
    museau: { forme: 'museau', long: 0.08, r: 0.08 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) {
        pointe(T, [c * 0.15, 2.44, 0.02], 0.08, 0.18, k.dom, [0, 0, -c * 0.2], 4);
        // Les moustaches.
        pave(pose(T, repere([c * 0.2, 2.15, -0.26], 0, 0, c * 0.12)), -0.13, -0.008, -0.008, 0.13, 0.008, 0.008, k.marque);
      }
    },
    corps: (T, k) =>
      // La queue dressée derrière le corps (0,15 bloc derrière le dos au moins), qui monte 0,3 bloc au-dessus de
      // l'épaule droite et recourbe son bout vers l'avant.
      fuseau(
        T,
        [
          [0.8, 0.05, 0.05, 0.22, 0.08],
          [1.3, 0.045, 0.045, 0.34, 0.2],
          [1.85, 0.045, 0.045, 0.34, 0.33],
          [2.08, 0.04, 0.04, 0.3, 0.4],
          [2.16, 0, 0, 0.17, 0.4],
        ],
        4,
        k.dom,
      ),
    outil: {
      // Le trousseau de clés (0,25 bloc).
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        disque(pose(T, repere([0, -0.08, 0], Math.PI / 2, 0, 0)), 0, 0.09, 0.025, k.fer);
        for (const c of [-1, 0, 1]) pave(pose(T, repere([c * 0.04, -0.15, 0], 0, 0, c * 0.3)), -0.016, -0.25, -0.012, 0.016, 0, 0.012, k.laiton);
      },
    },
  },
};

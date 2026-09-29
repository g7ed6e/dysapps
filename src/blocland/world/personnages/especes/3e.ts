// Les habitants des Îles du Ciel (3e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique. Fi, l'allumeuse à tête-lanterne, n'a pas d'yeux ; sa lanterne et l'abdomen d'Astra brillent
// la nuit.
import type { BiomeId } from '../../../biomes';
import { TENUE, VERRE_DE_FI } from '../couleurs';
import { COU, disque, jalon, manche, pointe, SOMMET_DE_TETE, type Espece } from '../gabarit';
import { devant, fuseau, pave, pose, repere } from '../peint';
import { tube } from '../sentinelle';

export const ESPECES_3E = {
  belvedere: {
    nom: 'Théo',
    metier: 'géomètre',
    gabarit: 'elance',
    dominante: 0x7f93a6,
    marque: { couleur: 0xd8d2c4, ou: ['poitrine', 'museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['gilet'] },
    silhouette: { largeur: 0.27, profondeur: 0.24, jambes: 0.95, jambe: 0.04, tete: 0.24, teteProfondeur: 0.24 },
    museau: { forme: 'bec', long: 0.32, r: 0.045, y: 2.22 },
    coiffe: (T, k) => pointe(T, [0, 2.46, 0.08], 0.03, 0.22, k.dom, [1.2, 0, 0], 3),
    outil: { pose: [0, 0, 0], dessiner: (T, k) => jalon(T, -1.12, 1.0, 0.026, 4, k.bois, k.lin) },
    autreMain: {
      // Le fil à plomb.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.35, 0, 0.006, k.fer, 3);
        pointe(T, [0, -0.35, 0], 0.045, 0.12, k.fer, [Math.PI, 0, 0]);
      },
    },
  },
  donnees: {
    nom: 'Stat',
    metier: 'astronome',
    gabarit: 'elance',
    dominante: 0x8e8272,
    marque: { couleur: 0xd8ccb4, ou: ['visage', 'ventre'] },
    tenue: { couleur: 0x2e3e5c, vetements: ['cape'] },
    silhouette: { tete: 0.32, teteProfondeur: 0.27 },
    museau: { forme: 'bec', long: 0.07, r: 0.045, y: 2.2 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.2, 2.46, 0], 0.06, 0.16, k.dom, [0, 0, -c * 0.4], 3);
    },
    outil: {
      // La lunette sur son trépied, posé au sol.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        fuseau(
          pose(T, repere([0, 0.05, 0], -1.1, 0, 0)),
          [
            [-0.2, 0.05],
            [0.32, 0.065],
          ],
          6,
          k.laiton,
        );
        for (const [rx, rz] of [
          [0.22, 0],
          [-0.12, 0.2],
          [-0.12, -0.2],
        ])
          manche(pose(T, repere([0, 0, 0], rx, 0, rz)), -1.2, 0, 0.018, k.bois, 3);
      },
    },
  },
  phare: {
    nom: 'Fi',
    metier: 'allumeuse',
    gabarit: 'elance',
    dominante: 0x8a7a5a,
    tenue: { couleur: 0x2a3550, vetements: ['cire'] },
    yeux: false,
    tete: (T, k) => {
      // La tête-lanterne : un socle, quatre montants, un toit ; le verre est la pièce qui brille.
      fuseau(
        T,
        [
          [COU, 0.18],
          [2.07, 0.21],
        ],
        6,
        k.laiton,
      );
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        manche(pose(T, repere([0.17 * Math.cos(a), 0, 0.17 * Math.sin(a)])), 2.07, 2.4, 0.02, k.laiton, 3);
      }
      fuseau(
        T,
        [
          [2.39, 0.25],
          [SOMMET_DE_TETE, 0],
        ],
        6,
        k.laiton,
      );
    },
    coiffe: (T, k) => pointe(T, [0, SOMMET_DE_TETE - 0.02, 0], 0.035, 0.12, k.laiton, [0, 0, 0], 4),
    lueur: {
      // Le verre : ambre pâle et mat le jour, la lueur la nuit.
      nom: 'lanterne',
      sur: 'tete',
      couleur: VERRE_DE_FI.jour,
      nuit: VERRE_DE_FI.nuit,
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [2.07, 0.16],
            [2.39, 0.16],
          ],
          6,
          k.lueur,
        ),
    },
    outil: {
      // La burette.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        fuseau(
          T,
          [
            [-0.2, 0.1],
            [-0.06, 0.085],
            [0, 0.03],
          ],
          6,
          k.laiton,
        );
        pointe(T, [0, -0.1, -0.06], 0.02, 0.22, k.fer, [-1.1, 0, 0], 3);
      },
    },
  },
  textes: {
    nom: 'Astra',
    metier: 'copiste',
    dominante: 0x3a3a4a,
    marque: { couleur: 0xb8bcc8, ou: ['visage'] },
    // La robe au-dessus du genou (0,55 bloc), à manches courtes : les jambes et les avant-bras, sombres, se lisent d'abord.
    tenue: { couleur: TENUE.lin, vetements: ['robe'], bas: 0.55, manches: 'courtes' },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.08, 2.46, -0.02], 0.025, 0.3, k.dom, [-0.3, 0, -c * 0.75], 3);
    },
    corps: (T, k) => {
      // Les ailes claires, dressées sur le dos, qui s'écartent au-dessus des épaules.
      for (const c of [-1, 1])
        fuseau(
          pose(T, repere([c * 0.14, 1.6, 0.24], 0.35, 0, -c * 0.55)),
          [
            [0, 0.06, 0.015],
            [0.35, 0.12, 0.015],
            [0.7, 0.05, 0.015],
          ],
          4,
          k.marque,
        );
    },
    lueur: {
      nom: 'abdomen',
      sur: 'corps',
      dessiner: (T, k) =>
        fuseau(
          pose(T, repere([0, 0.95, 0.26], 1.8, 0, 0)),
          [
            [0, 0.15],
            [0.2, 0.17],
            [0.38, 0],
          ],
          6,
          k.lueur,
        ),
    },
    outil: {
      // Le livre ouvert, tenu à plat.
      pose: [-0.3, 0, 0],
      dessiner: (T, k) => {
        for (const c of [-1, 1]) {
          const P = pose(T, repere([0, 0, 0], 0, 0, -c * 0.18));
          pave(P, c < 0 ? -0.2 : 0, 0, -0.14, c < 0 ? 0 : 0.2, 0.02, 0.14, k.bois);
          pave(P, c < 0 ? -0.19 : 0, 0.02, -0.13, c < 0 ? 0 : 0.19, 0.04, 0.13, k.lin);
        }
      },
    },
  },
  studio: {
    nom: 'Écho',
    metier: 'opératrice radio',
    dominante: 0x5a4a6a,
    marque: { couleur: 0xb0a4b8, ou: ['visage'] },
    tenue: { couleur: TENUE.lin, vetements: ['ailes', 'gilet'] },
    coiffe: (T, k) => {
      // Les grandes oreilles, le casque et ses écouteurs.
      for (const c of [-1, 1]) {
        pointe(T, [c * 0.18, 2.4, 0.02], 0.13, 0.32, k.dom, [0, 0, -c * 0.6], 4);
        disque(pose(T, repere([c * 0.28, 2.28, 0], 0, 0, Math.PI / 2)), 0, 0.075, 0.05, k.laiton);
      }
      pave(T, -0.29, 2.5, -0.03, 0.29, 2.54, 0.03, k.laiton);
    },
    outil: {
      // Le micro.
      pose: [-0.3, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.25, 0.018, k.fer);
        fuseau(
          T,
          [
            [0.24, 0.04],
            [0.32, 0.05],
            [0.38, 0],
          ],
          5,
          k.laiton,
        );
      },
    },
  },
  chateau: {
    nom: 'Knight',
    metier: 'écuyer héraut',
    // Une souris gris froid.
    dominante: 0x8c8a84,
    marque: { couleur: 0xe0d4c8, ou: ['museau'] },
    tenue: { couleur: 0x3e5c8a, vetements: ['robe', 'ceinture'] },
    museau: { forme: 'museau', long: 0.14, r: 0.07 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.23, 2.53, 0.02], Math.PI / 2, 0, 0)), 0, 0.13, 0.03, k.dom);
    },
    outil: {
      // La bannière.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -1.12, 1.35, 0.026, k.bois);
        pave(T, 0.03, 0.8, -0.012, 0.36, 1.28, 0.012, k.tenue);
        pointe(T, [0, 1.35, 0], 0.04, 0.1, k.laiton);
      },
    },
    autreMain: {
      // Le heaume, sous le bras.
      pose: [0, 0, 0],
      dessiner: (T, k) =>
        fuseau(
          T,
          [
            [-0.05, 0.13],
            [0.13, 0.14],
            [0.24, 0.07],
          ],
          6,
          k.fer,
        ),
    },
  },
  refuge: {
    // La loutre factrice du Refuge des carnets (DA, LV2-5) : brun-gris (plus sombre que Tunel, plus chaud que Vapeur),
    // la gorge et le museau crème, sans masque ni moustaches ; la tête plate et large, deux petites oreilles rondes sur
    // les côtés ; une sacoche de cuir fauve unie en bandoulière (ni casquette, ni uniforme, ni cor, ni jaune) ; la queue
    // épaisse à la base, en pointe, posée au sol derrière elle, vers la droite (ni panache, ni queue qui monte). Dans la
    // main, une lettre sans rien d'écrit dessus.
    nom: 'Timbre',
    metier: 'factrice',
    dominante: 0x5c4a3e,
    marque: { couleur: 0xe2d4b6, ou: ['poitrine', 'museau'] },
    tenue: { couleur: 0xa8703a, vetements: [] },
    silhouette: { largeur: 0.27, profondeur: 0.24, jambes: 0.6, tete: 0.32, teteProfondeur: 0.25, crane: 1 },
    museau: { forme: 'museau', long: 0.08, r: 0.11, y: 2.14 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) disque(pose(T, repere([c * 0.33, 2.36, 0.04], 0, 0, (c * Math.PI) / 2)), 0, 0.07, 0.04, k.dom, 4);
    },
    corps: (T, k) => {
      // La queue : de la base du dos, posée au sol, vers l'arrière et la droite ; épaisse, puis en pointe.
      fuseau(
        pose(T, repere([0.1, 0.1, 0.12], Math.PI / 2, 0.7, 0)),
        [
          [0, 0.12, 0.09],
          [0.3, 0.13, 0.08],
          [0.52, 0.09, 0.06],
          [0.74, 0, 0],
        ],
        5,
        k.dom,
      );
      // La sacoche, sur la hanche gauche, et sa bandoulière, de l'épaule droite à la sacoche, en travers du devant.
      pave(T, -0.44, 0.72, -0.15, -0.27, 1.02, 0.13, k.tenue);
      const z = (y: number) => devant(k.torse, 8, y).z - 0.02;
      tube(
        T,
        [
          [0.24, 1.78, z(1.78) + 0.04],
          [0.02, 1.42, z(1.42)],
          [-0.22, 1.08, z(1.08) + 0.03],
          [-0.33, 1.0, -0.05],
        ],
        0.028,
        3,
        k.tenue,
        0.5,
      );
    },
    outil: {
      // Une lettre, pliée, sans rien d'écrit (aucun motif qu'on puisse lire).
      pose: [0, 0, 0],
      dessiner: (T, k) => pave(T, -0.02, -0.16, -0.12, 0.02, 0.02, 0.12, k.lin),
    },
  },
} satisfies Partial<Record<BiomeId, Espece>>;

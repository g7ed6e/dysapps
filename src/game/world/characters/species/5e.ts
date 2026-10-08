// Les habitants des Îles Brumeuses (5e) en facettes (lot R6) : l'espèce, le métier et son outil, d'après l'intention
// du directeur artistique.
import type { BiomeId } from '../../../biomes';
import { TENUE } from '../colors';
import { anneau, disque, jalon, manche, pointe, type Espece } from '../template';
import { facette, fuseau, parFace, pave, pose, repere } from '../painted';

export const ESPECES_5E = {
  'maths-5e-signed-numbers': {
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
  'maths-5e-proportionality': {
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
  'french-5e-homophones': {
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
  'french-5e-conjugation': {
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
  'english-5e-vocabulary': {
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
  'english-5e-grammar': {
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
      // La queue dressée derrière le corps (0,15 bloc derrière le dos au moins), du côté opposé au trousseau (décalée
      // de 0,2 bloc vers la gauche), qui monte 0,3 bloc au-dessus de l'épaule gauche et recourbe son bout vers
      // l'avant : de trois quarts, il sort du contour.
      fuseau(
        T,
        [
          [0.8, 0.05, 0.05, 0.22, -0.2],
          [1.3, 0.045, 0.045, 0.34, -0.32],
          [1.85, 0.045, 0.045, 0.34, -0.45],
          [2.08, 0.04, 0.04, 0.3, -0.52],
          [2.16, 0, 0, 0.17, -0.52],
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
  'lv2-5e-introductions': {
    // La cigogne voyageuse (DA, LV2-2) : corps blanc, bouts d'ailes noirs, long bec et hautes pattes orange, sans coiffe.
    nom: 'Lina',
    metier: 'aubergiste',
    dominante: 0xe2ded4,
    marque: { couleur: 0xd07a48, ou: ['museau'] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    silhouette: { largeur: 0.29, profondeur: 0.25, jambes: 0.95, jambe: 0.08, tete: 0.24, teteProfondeur: 0.24 },
    museau: { forme: 'bec', long: 0.44, r: 0.05, y: 2.2 },
    corps: (T, k) => {
      for (const c of [-1, 1]) {
        // Les hautes pattes, orange comme le bec, par-dessus celles du gabarit.
        fuseau(
          T,
          [
            [0, 0.09, 0.12, -0.03],
            [0.93, 0.075],
          ],
          4,
          k.marque,
          { x: c * 0.14, haut: false },
        );
        // Les bouts d'ailes, sombres, repliés le long des flancs vers l'arrière (le fer des outils : la dominante et
        // sa marque sont déjà le blanc et l'orange).
        pointe(T, [c * 0.25, 1.2, 0.14], 0.1, 0.62, k.fer, [2.3, 0, c * 0.12], 3, 0.05);
      }
    },
    outil: {
      // Le cor du relais, en laiton : il annonce la diligence.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        anneau(T, [0, -0.12, 0], 0.09, 0.02, k.laiton, [0, Math.PI / 2, 0], 8, 3);
        pointe(T, [0, -0.2, 0.09], 0.06, 0.16, k.laiton, [Math.PI, 0, 0], 6);
      },
    },
  },
  // Les habitants d'histoire-géographie (HG-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict
  // nécessaire (budget de l'archipel). Vélin est un lapin enlumineur, Sillon un ibis des rizières (DA, HG-3).
  'history-5e-middle-ages': {
    nom: 'Vélin',
    metier: 'enlumineur',
    // Gris-fauve : le gris-pierre d'avant (#B8AEA0) se confondait avec une statue (DA, relecture des planches).
    dominante: 0xa08870,
    marque: { couleur: 0xdcd0bc, ou: ['ventre', 'museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    museau: { forme: 'museau', long: 0.14, r: 0.07 },
    // Rond et dodu, deux longues oreilles debout, écartées : il ne se confond pas avec Moustache, mince aux oreilles pointues.
    silhouette: { largeur: 0.4, ventre: 0.09, tete: 0.32 },
    coiffe: (T, k) => {
      for (const c of [-1, 1]) pointe(T, [c * 0.16, 2.4, 0.05], 0.08, 0.28, k.dom, [0, 0, -c * 0.45], 4, 0.035);
    },
    outil: {
      // La plume d'enluminure : un fût de bois, la barbe dorée (les filets d'or de l'enluminure).
      pose: [-0.2, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.02, 0.36, 0.018, k.bois, 3);
        pointe(T, [0, 0.34, 0], 0.06, 0.3, k.laiton, [0, 0, 0], 3, 0.015);
      },
    },
  },
  'geography-5e-resources': {
    nom: 'Sillon',
    metier: 'cultivateur',
    dominante: 0xf2efe6,
    marque: { couleur: 0x2a2622, ou: ['tete'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ailes'] },
    // Le long bec de l'ibis, sous un chapeau de paille (le lin des outils).
    museau: { forme: 'bec', long: 0.42, r: 0.05, y: 2.15 },
    silhouette: { jambes: 0.8, jambe: 0.06 },
    coiffe: (T, k) => disque(T, 2.5, 0.32, 0.04, k.lin, 8),
    outil: {
      // La faucille du riz : un manche, la lame de fer recourbée.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.05, 0.2, 0.02, k.bois, 3);
        pointe(T, [0, 0.2, 0], 0.05, 0.2, k.fer, [0, 0, 0.9], 3, 0.015);
      },
    },
  },
  // Les habitants de sciences (SC-3) : Archipéo est en pause (2 octobre 2026), ils n'ont que le strict nécessaire, une
  // signature chacun (budget de l'archipel). Humus est un ver de terre météorologue, Perle un canard saunier, Rabot un
  // pic-vert menuisier (DA, SC-3).
  'life-earth-sciences-5e-active-planet': {
    nom: 'Humus',
    metier: 'météorologue',
    dominante: 0xb07468,
    marque: { couleur: 0xd0a096, ou: ['ventre'] },
    tenue: { couleur: TENUE.cuir, vetements: ['ceinture'] },
    // Un ver : le corps d'un seul tenant, sans épaules marquées, la tête ronde dans son prolongement.
    silhouette: { largeur: 0.25, profondeur: 0.24, ventre: 0, jambes: 0.45, jambe: 0.12, tete: 0.25, teteProfondeur: 0.24, crane: 1 },
    // Le bonnet de lin, en pointe.
    coiffe: (T, k) => pointe(T, [0, 2.38, 0], 0.22, 0.32, k.lin, [0, 0, 0], 5),
    corps: (T, k) => {
      // La queue du ver, couchée derrière lui sur le sol, en anneaux.
      fuseau(pose(T, repere([0, 0.13, 0.15], Math.PI / 2, 0, 0)), [[0, 0.12], [0.3, 0.11], [0.5, 0.07], [0.56, 0]], 5, k.dom);
    },
    outil: {
      // Le pluviomètre : un piquet de bois, le tube de laiton gradué au bout.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.3, 0.2, 0.025, k.bois, 3);
        manche(T, 0.2, 0.45, 0.06, k.laiton, 5);
      },
    },
  },
  'physics-chemistry-5e-matter-universe': {
    nom: 'Perle',
    metier: 'saunier',
    dominante: 0xe8e4da,
    marque: { couleur: 0xd8862a, ou: ['museau'] },
    tenue: { couleur: TENUE.lin, vetements: ['tablier'] },
    // Un canard : rond et bas sur pattes, le large bec plat orangé, la queue relevée.
    silhouette: { largeur: 0.44, profondeur: 0.34, ventre: 0.1, jambes: 0.4, tete: 0.26 },
    museau: { forme: 'museau', long: 0.22, r: 0.07, y: 2.12 },
    // Les ailes un peu ouvertes : il ne se confond pas avec Vélin, rond lui aussi.
    bras: { rz: 0.3 },
    autreBras: { rz: 0.3 },
    corps: (T, k) => pointe(T, [0, 1.25, 0.3], 0.16, 0.4, k.dom, [1.9, 0, 0], 4),
    outil: {
      // Le râteau à sel : un long manche de bois, sa traverse au sol.
      pose: [0, 0, 0],
      dessiner: (T, k) => {
        manche(T, -0.95, 0.35, 0.025, k.bois, 3);
        pave(T, -0.22, -1.0, -0.03, 0.22, -0.92, 0.03, k.bois);
      },
    },
  },
  'technology-5e-design': {
    nom: 'Rabot',
    metier: 'menuisier',
    dominante: 0x5e8a3a,
    marque: { couleur: 0xb8402e, ou: [] },
    tenue: { couleur: TENUE.cuir, vetements: ['tablier'] },
    museau: { forme: 'bec', long: 0.3, r: 0.05, y: 2.2 },
    // Trapu et court sur pattes : il ne se confond ni avec Moustache, mince, ni avec Lina.
    silhouette: { largeur: 0.38, profondeur: 0.3, ventre: 0.08, jambes: 0.55, tete: 0.22, crane: 0.6 },
    // Le rabot tenu loin du corps.
    bras: { rz: 0.35 },
    // La crête rouge, dressée et tirée vers l'arrière du crâne.
    coiffe: (T, k) => pointe(T, [0, 2.36, 0.02], 0.1, 0.34, k.marque, [0.35, 0, 0], 4, 0.06),
    corps: (T, k) => {
      // La queue raide du pic, qui s'appuie au sol derrière lui.
      pointe(T, [0, 1.0, 0.22], 0.14, 0.9, k.dom, [2.6, 0, 0], 4, 0.05);
    },
    outil: {
      // Le rabot : un pavé de bois, sa lame de fer dessous, sa poignée.
      pose: [0, 0, -Math.PI / 2],
      dessiner: (T, k) => {
        pave(T, -0.1, -0.02, -0.26, 0.1, 0.16, 0.26, k.bois);
        pave(T, -0.05, -0.04, -0.02, 0.05, -0.02, 0.05, k.fer);
        pave(T, -0.03, 0.16, -0.16, 0.03, 0.26, -0.06, k.bois);
      },
    },
  },
} satisfies Partial<Record<BiomeId, Espece>>;

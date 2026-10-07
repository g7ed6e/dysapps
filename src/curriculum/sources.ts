// Provenance du référentiel : les programmes d'enseignement publiés sur data.gouv.fr par le ministère de
// l'Éducation nationale, sous Licence Ouverte 2.0 (réutilisation libre, avec mention de la source et de la date) ;
// les programmes plus récents, publiés au Bulletin officiel ou sur éduscol, informations publiques que le code des
// relations entre le public et l'administration laisse réutiliser librement, avec mention de la source et de la date.
import type { ProgrammeSource, SourceId } from './types';

export const LICENCE_OUVERTE = {
  name: 'Licence Ouverte / Open Licence 2.0 (Etalab)',
  url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
};

const DATASET = 'Programmes d’enseignement de l’école élémentaire et du collège : cycles 2, 3 et 4';
const DATASET_URL = 'https://www.data.gouv.fr/datasets/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/';
const PDF_BASE = 'https://static.data.gouv.fr/resources/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/';
const LEGAL = 'Arrêté du 17 juillet 2020, Bulletin officiel n° 31 du 30 juillet 2020';

const EDUCATION = 'https://www.education.gouv.fr/sites/default/files/';
/** La page du BO que lie le calendrier d'éduscol pour les langues vivantes du collège. */
const BO_LV_2025 = 'https://www.education.gouv.fr/bo/2025/Hebdo22/MENE2504621A';
/**
 * La page du BO du français et des maths du cycle 4 : son titre a été lu dans une recherche ; l'adresse suit le modèle de
 * celles que lie le calendrier (bo/<année>/Hebdo<n>/<NOR>), la page refuse les robots (403).
 */
const BO_2026 = 'https://www.education.gouv.fr/bo/2026/Hebdo10/MENE2602912A';
const LEGAL_2026 = 'Arrêté du 18 février 2026, Bulletin officiel n° 10 du 5 mars 2026';
const BO_NON_LU = 'Bulletin officiel : référence non lue (le PDF ne l’écrit pas)';

/** Les textes publiés par le ministère hors de data.gouv.fr. */
export const INFORMATIONS_PUBLIQUES = {
  name: 'Informations publiques, réutilisation libre (code des relations entre le public et l’administration, articles L321-1 et L322-1)',
  url: 'https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000031366350/LEGISCTA000031367685/',
};

export const SOURCES: Record<SourceId, ProgrammeSource> = {
  c3: {
    id: 'c3',
    dataset: DATASET,
    datasetUrl: DATASET_URL,
    title: 'Programme du cycle 3 (annexe 2), en vigueur à la rentrée 2020',
    pdfUrl: `${PDF_BASE}20210126-145814/ensel714-annexe2-1312887.pdf`,
    pages: 98,
    licence: LICENCE_OUVERTE,
    legal: LEGAL,
    // En 6e, n'est plus cité que pour l'histoire et la géographie : le français et les maths suivent le texte de 2025,
    // l'anglais celui de 2025, les sciences celui de 2023.
    classes: ['6e'],
    consulted: '2026-09-27',
  },
  c4: {
    id: 'c4',
    dataset: DATASET,
    datasetUrl: DATASET_URL,
    title: 'Programme du cycle 4 (annexe 3), en vigueur à la rentrée 2020',
    pdfUrl: `${PDF_BASE}20210126-145848/ensel714-annexe3-1312891.pdf`,
    pages: 138,
    licence: LICENCE_OUVERTE,
    legal: LEGAL,
    // L'histoire et la géographie, la physique-chimie et la SVT de la 5e à la 3e ; le français, les maths et les langues
    // vivantes en 4e et en 3e seulement (la 5e suit les textes de 2025 et 2026 ; la 4e les suivra en 2027, la 3e en 2028).
    classes: ['5e', '4e', '3e'],
    consulted: '2026-09-27',
  },
  'c3-2023': {
    id: 'c3-2023',
    dataset: 'Éduscol : programme du cycle 3 en vigueur à la rentrée 2023',
    datasetUrl: 'https://eduscol.education.gouv.fr/',
    title: 'Programme du cycle 3, en vigueur à la rentrée 2023 (sciences et technologie modifiées)',
    pdfUrl: 'https://eduscol.education.gouv.fr/sites/default/files/document/programme-d-enseignement-du-cycle-3-2023-100806.pdf',
    pages: 108,
    licence: INFORMATIONS_PUBLIQUES,
    legal: 'D’après le Bulletin officiel n° 31 du 30 juillet 2020 et le Bulletin officiel n° 25 du 22 juin 2023',
    classes: ['6e'],
    consulted: '2026-10-07',
  },
  'c4-te-2024': {
    id: 'c4-te-2024',
    dataset: 'Bulletin officiel n° 9 du 29 février 2024',
    datasetUrl: 'https://www.education.gouv.fr/bo/2024/Hebdo9',
    title: 'Programme de technologie du cycle 4 (annexe), en 5e depuis 2024, en 4e depuis 2025, en 3e depuis 2026',
    pdfUrl: 'https://www.education.gouv.fr/sites/default/files/document/Annexe%20%E2%80%94%20Programme%20de%20technologie%20du%20cycle%204-368016.pdf',
    pages: 16,
    licence: INFORMATIONS_PUBLIQUES,
    legal: 'Bulletin officiel n° 9 du 29 février 2024',
    classes: ['5e', '4e', '3e'],
    consulted: '2026-10-07',
  },
  // Les textes de 2025 et 2026 : les PDF sont ceux que lie le calendrier de mise en œuvre des nouveaux programmes
  // d'éduscol (juillet 2026, page 2), qui dit aussi les classes où ils s'appliquent ; les langues vivantes, trouvées par
  // recherche, ont été comparées octet par octet aux fichiers lus (7 octobre 2026). Aucun de ces PDF n'écrit sa
  // référence au Bulletin officiel : celle du français et des maths de 2026 vient du titre de la page du BO
  // (MENE2602912A), celle des langues vivantes de l'adresse que lie le calendrier (MENE2504621A, date non lue) ; celle du
  // français et des maths de 2025 n'a pas été lue et n'est pas écrite.
  'c3-fr-2025': {
    id: 'c3-fr-2025',
    dataset: 'Programme de français pour le cycle 3 (education.gouv.fr), lié par le calendrier des nouveaux programmes d’éduscol',
    datasetUrl: `${EDUCATION}programme-de-fran-ais-pour-le-cycle-3-439824.pdf`,
    title: 'Programme de français du cycle 3, en vigueur en 6e depuis la rentrée 2025',
    pdfUrl: `${EDUCATION}programme-de-fran-ais-pour-le-cycle-3-439824.pdf`,
    pages: 21,
    licence: INFORMATIONS_PUBLIQUES,
    legal: BO_NON_LU,
    classes: ['6e'],
    consulted: '2026-10-07',
  },
  'c3-ma-2025': {
    id: 'c3-ma-2025',
    dataset: 'Programme de mathématiques pour le cycle 3 (education.gouv.fr), lié par le calendrier des nouveaux programmes d’éduscol',
    datasetUrl: `${EDUCATION}programme-de-math-matiques-pour-le-cycle-3-439827.pdf`,
    title: 'Programme de mathématiques du cycle 3, en vigueur en 6e depuis la rentrée 2025',
    pdfUrl: `${EDUCATION}programme-de-math-matiques-pour-le-cycle-3-439827.pdf`,
    pages: 28,
    licence: INFORMATIONS_PUBLIQUES,
    legal: BO_NON_LU,
    classes: ['6e'],
    consulted: '2026-10-07',
  },
  'c4-fr-2026': {
    id: 'c4-fr-2026',
    dataset: 'Bulletin officiel n° 10 du 5 mars 2026 (MENE2602912A)',
    datasetUrl: BO_2026,
    title: 'Programme de français du cycle 4 (annexe 1), en vigueur en 5e depuis la rentrée 2026 (en 4e en 2027, en 3e en 2028)',
    pdfUrl: `${EDUCATION}document/Annexe%201%20%E2%80%93%20Programme%20de%20fran%C3%A7ais%20pour%20le%20cycle%204-480713.pdf`,
    pages: 19,
    licence: INFORMATIONS_PUBLIQUES,
    legal: LEGAL_2026,
    classes: ['5e'],
    consulted: '2026-10-07',
  },
  'c4-ma-2026': {
    id: 'c4-ma-2026',
    dataset: 'Bulletin officiel n° 10 du 5 mars 2026 (MENE2602912A)',
    datasetUrl: BO_2026,
    title: 'Programme de mathématiques du cycle 4 (annexe 2), en vigueur en 5e depuis la rentrée 2026 (en 4e en 2027, en 3e en 2028)',
    pdfUrl: `${EDUCATION}document/Annexe%202%20%E2%80%93%20Programme%20de%20math%C3%A9matiques%20pour%20le%20cycle%204-480716.pdf`,
    pages: 20,
    licence: INFORMATIONS_PUBLIQUES,
    legal: LEGAL_2026,
    classes: ['5e'],
    consulted: '2026-10-07',
  },
  'lv-en-2025': {
    id: 'lv-en-2025',
    dataset: 'Bulletin officiel n° 22 de 2025 (MENE2504621A)',
    datasetUrl: BO_LV_2025,
    title: 'Programme d’anglais pour les classes de collège (annexe 3), en vigueur en 6e depuis la rentrée 2025, en 5e depuis 2026',
    pdfUrl: `${EDUCATION}annexe-3-programme-d-anglais-pour-les-classes-de-coll-ge-440358.pdf`,
    pages: 36,
    licence: INFORMATIONS_PUBLIQUES,
    legal: 'Bulletin officiel n° 22 de 2025, annexe 3',
    classes: ['6e', '5e'],
    consulted: '2026-10-07',
  },
  'lv-de-2025': {
    id: 'lv-de-2025',
    dataset: 'Bulletin officiel n° 22 de 2025 (MENE2504621A)',
    datasetUrl: BO_LV_2025,
    title: 'Programme d’allemand pour les classes de collège (annexe 1), en vigueur en 5e depuis la rentrée 2026',
    pdfUrl: `${EDUCATION}annexe-1-programme-d-allemand-pour-les-classes-de-coll-ge-440355.pdf`,
    pages: 44,
    licence: INFORMATIONS_PUBLIQUES,
    legal: 'Bulletin officiel n° 22 de 2025, annexe 1',
    // La LV2 commence en 5e dans l'application : le texte de 6e (LVA, bilangue) n'y est pas cité.
    classes: ['5e'],
    consulted: '2026-10-07',
  },
  'lv-es-2025': {
    id: 'lv-es-2025',
    dataset: 'Bulletin officiel n° 22 de 2025 (MENE2504621A)',
    datasetUrl: BO_LV_2025,
    title: 'Programme d’espagnol pour les classes de collège (annexe 9), en vigueur en 5e depuis la rentrée 2026',
    pdfUrl: `${EDUCATION}annexe-9-programme-d-espagnol-pour-les-classes-de-coll-ge-440373.pdf`,
    pages: 34,
    licence: INFORMATIONS_PUBLIQUES,
    legal: 'Bulletin officiel n° 22 de 2025, annexe 9',
    classes: ['5e'],
    consulted: '2026-10-07',
  },
};

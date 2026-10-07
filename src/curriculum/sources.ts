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
    consulted: '2026-10-07',
  },
};

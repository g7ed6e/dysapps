// Provenance du référentiel : les programmes d'enseignement publiés sur data.gouv.fr par le ministère de
// l'Éducation nationale, sous Licence Ouverte 2.0 (réutilisation libre, avec mention de la source et de la date).
import type { ProgrammeSource, SourceId } from './types';

export const LICENCE_OUVERTE = {
  name: 'Licence Ouverte / Open Licence 2.0 (Etalab)',
  url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
};

const DATASET = 'Programmes d’enseignement de l’école élémentaire et du collège : cycles 2, 3 et 4';
const DATASET_URL = 'https://www.data.gouv.fr/datasets/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/';
const PDF_BASE = 'https://static.data.gouv.fr/resources/programmes-denseignement-de-lecole-elementaire-et-du-college-cycles-2-3-et-4/';
const LEGAL = 'Arrêté du 17 juillet 2020, Bulletin officiel n° 31 du 30 juillet 2020';

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
};

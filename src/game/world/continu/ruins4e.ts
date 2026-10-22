// Les lieux du 4e en ruines simples (lot 1 du monde ouvert du 4e, « l'île entière en grandes masses ») : à leur place,
// une silhouette lisible pour chacun, sans les finir ; leurs étapes viennent avec leur lot, un lieu par lot, et un lieu
// construit quitte ce fichier (la Forge, la Soute, la Porte et l'Étalon au lot 2, ./forge4e.ts, ./soute4e.ts, ./porte4e.ts,
// ./etalon4e.ts ; le Gabarit, le Chariot, la Manufacture et la Loge au lot 3, ./gabarit4e.ts, ./chariot4e.ts,
// ./manufacture4e.ts, ./loge4e.ts ; le Terminus, les Orgues et la Dynamo au lot 3, ./terminus4e.ts, ./orgues4e.ts,
// ./dynamo4e.ts ; les lieux des Coteaux, ./herbier4e.ts, ./roches4e.ts, ./jonction4e.ts, ./veillee4e.ts,
// ./basilique4e.ts). Depuis les Coteaux, tous les lieux du 4e sont construits : il n'y reste aucune ruine simple. Code pur.
import type { FacetBuilder } from './facets';
import type { BuiltPlace4e, PlaceId4e } from './plan4e';

/**
 * La ruine de chaque lieu du 4e pas encore construit, dessinée dans son repère : un lieu construit (./plan4e.ts,
 * `BUILT_PLACES_4E`) dessine sa ruine dans son fichier, avec ses étapes. Tous le sont : la table est vide.
 */
export const RUINS_4E: Readonly<Record<Exclude<PlaceId4e, BuiltPlace4e>, (b: FacetBuilder) => void>> = {};

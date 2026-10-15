// Pour les tests à empreintes (./fingerprints.test.ts…) : une valeur où chaque identifiant neutre est remis dans son mot
// d'avant (src/core/legacyIds.ts), pour que les empreintes prises avant les mots neutres (2 octobre 2026) restent
// valables et prouvent qu'un changement d'identifiant ne change rien de ce qui est dessiné.
import { LEGACY_MISSIONS, LEGACY_PARTS, LEGACY_PLACES, LEGACY_RESOURCES } from '../../core/legacyIds';

const inverse = (o: Readonly<Record<string, string>>): Map<string, string> => new Map(Object.entries(o).map(([k, v]) => [v, k]));

const LIEUX = inverse(LEGACY_PLACES);
const PARTIES = inverse(LEGACY_PARTS);
/** Les ressources qui ne sont pas l'identifiant d'un lieu (trophées, blocs de finition) : un lieu garde son mot de lieu. */
const RESSOURCES = new Map([...inverse(LEGACY_RESOURCES)].filter(([neutre]) => !LIEUX.has(neutre)));
const MISSIONS = new Map(
  Object.entries(LEGACY_MISSIONS).map(([lieu, missions]) => [LEGACY_PLACES[lieu], inverse(missions)] as const),
);
/** Une mission seule (le `typeId` d'une borne) : les missions neutres sont uniques d'un lieu à l'autre. */
const TOUTES_LES_MISSIONS = new Map([...MISSIONS.values()].flatMap((m) => [...m]));
const LIEUX_DU_VILLAGE = new Map([
  ['school', 'ecole'],
  ['trophies', 'trophees'],
  ['assembly', 'assemblage'],
]);

/** Les textes déjà remis dans leur mot d'avant : `texteDAvant` est pure, et les mêmes textes reviennent par milliers. */
const dejaVus = new Map<string, string>();

/** Un texte : un lieu, une partie, une ressource, une mission, `monument:<partie>`, `<lieu>:<mission>`, `<lieu>/<nom>`, `<lieu>-<lieu>`. */
export function texteDAvant(s: string): string {
  let avant = dejaVus.get(s);
  if (avant === undefined) dejaVus.set(s, (avant = calculeTexteDAvant(s)));
  return avant;
}

function calculeTexteDAvant(s: string): string {
  const exact = LIEUX.get(s) ?? PARTIES.get(s) ?? RESSOURCES.get(s) ?? TOUTES_LES_MISSIONS.get(s) ?? LIEUX_DU_VILLAGE.get(s);
  if (exact !== undefined) return exact;
  if (s.startsWith('monument:')) return `monument:${texteDAvant(s.slice('monument:'.length))}`;
  const passage = /^passage-(\de)$/.exec(s);
  if (passage) return `voyage-${passage[1]}`;
  for (const sep of [':', '/']) {
    const i = s.indexOf(sep);
    if (i > 0 && LIEUX.has(s.slice(0, i))) {
      const lieu = s.slice(0, i);
      const reste = s.slice(i + 1);
      const mission = sep === ':' ? MISSIONS.get(lieu)?.get(reste) : undefined;
      return `${LIEUX.get(lieu)}${sep}${mission ?? reste}`;
    }
  }
  // Une liaison : `<lieu>-<lieu>`.
  for (const [neutre, avant] of LIEUX) {
    if (s.startsWith(`${neutre}-`) && LIEUX.has(s.slice(neutre.length + 1))) return `${avant}-${LIEUX.get(s.slice(neutre.length + 1))}`;
  }
  return s;
}

/**
 * Une valeur (JSON) dont chaque texte, clé comprise, est remis dans son mot d'avant (`texteDAvant`). Sa copie JSON est
 * parcourue des feuilles vers la racine, comme le ferait un `reviver` de `JSON.parse`, mais sans en payer l'appel à
 * chaque valeur : un objet n'est recopié que si une de ses clés change.
 */
export function versLesIdsDAvant<T>(v: T): T {
  const json = JSON.stringify(v);
  return (json === undefined ? undefined : remets(JSON.parse(json))) as T;
}

function remets(x: unknown): unknown {
  if (typeof x === 'string') return texteDAvant(x);
  if (x === null || typeof x !== 'object') return x;
  if (Array.isArray(x)) {
    for (let i = 0; i < x.length; i++) x[i] = remets(x[i]);
    return x;
  }
  const o = x as Record<string, unknown>;
  let renomme = false;
  for (const k of Object.keys(o)) {
    o[k] = remets(o[k]);
    if (!renomme && texteDAvant(k) !== k) renomme = true;
  }
  return renomme ? Object.fromEntries(Object.entries(o).map(([k, y]) => [texteDAvant(k), y])) : o;
}

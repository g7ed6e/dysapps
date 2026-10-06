// Le mot qui nomme une liaison dans l'univers (GD-9) : « ouvrage » dans Blocland et dans Archipéo, comme partout
// ailleurs à l'écran ; sans univers, le mot du jeu, « liaison ». Les phrases du mode « Aménager » et du menu s'accordent
// avec lui (un ouvrage, l'ouvrage, cet ouvrage ; une liaison, la liaison, cette liaison). Code pur, sans Three.js.

/** Le mot d'une liaison : au singulier, au pluriel, et son genre. */
export interface LinkWord {
  nom: string;
  pluriel: string;
  feminin: boolean;
}

/** Le mot du jeu, sans univers. */
export const LIAISON: LinkWord = { nom: 'liaison', pluriel: 'liaisons', feminin: true };

const voyelle = (mot: string) => /^[aeiouyàâéèêëîïôöûüh]/i.test(mot);

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les formes accordées d'un mot de liaison. */
export interface LinkPhrases {
  /** « un ouvrage », « une liaison ». */
  un: string;
  /** « l’ouvrage », « la liaison ». */
  le: string;
  /** « cet ouvrage », « cette liaison ». */
  ce: string;
  /** « de l’ouvrage », « du pont », « de la liaison ». */
  du: string;
  /** « ouvrage », « liaison ». */
  nom: string;
  /** « ouvrages », « liaisons ». */
  pluriel: string;
  /** L'adjectif ou le participe accordé : `accord('posé')` → « posé » ou « posée ». */
  accord: (masculin: string, feminin?: string) => string;
  /** « Un ouvrage est à reposer. », « 2 ouvrages sont à reposer. » */
  aReposer: (n: number) => string;
  /** Avec une majuscule. */
  Un: string;
  Le: string;
  Ce: string;
}

export function linkPhrases(m: LinkWord = LIAISON): LinkPhrases {
  const un = `${m.feminin ? 'une' : 'un'} ${m.nom}`;
  const le = voyelle(m.nom) ? `l’${m.nom}` : `${m.feminin ? 'la' : 'le'} ${m.nom}`;
  const ce = `${m.feminin ? 'cette' : voyelle(m.nom) ? 'cet' : 'ce'} ${m.nom}`;
  const du = voyelle(m.nom) || m.feminin ? `de ${le}` : `du ${m.nom}`;
  const accord = (masculin: string, feminin = `${masculin}e`) => (m.feminin ? feminin : masculin);
  return {
    un,
    le,
    ce,
    du,
    nom: m.nom,
    pluriel: m.pluriel,
    accord,
    aReposer: (n) => (n === 1 ? `${majuscule(un)} est à reposer.` : `${n} ${m.pluriel} sont à reposer.`),
    Un: majuscule(un),
    Le: majuscule(le),
    Ce: majuscule(ce),
  };
}

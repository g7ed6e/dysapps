// Les questions nées du monde (lot 4 du prototype, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) : ce
// que chaque lieu fait des items de sa mission. Le Phare garde les mots de référence, portés par des cloches (en manches
// de six à marquer, ou trois cloches et leurs nombres pour l'Abattage syllabique, GD-20, point 8, lot L3) ; les Filets posent les
// items du lieu écrits pour la scène (docs/contenu/<île>.md, « ## Au lieu · Archipéo », jumeaux à clé partagée, règle
// « à l'essai ») ; les Écluses et les Quais gardent l'item du générateur de référence (même clé, mêmes choix, même
// explication) et n'en changent que la phrase, et la scène se calcule à partir de ses nombres ; aux Écluses, Deux rives
// a son gabarit (les deux sas), les autres missions gardent leurs items de référence (GD-20, point 8, lot L2). Code
// pur : la vue dessine, le jeu commun compte les étoiles et le barème.
import PLACE_ITEMS from './placeItems.json';
import { isSixthPlace, scenePlace, sixthPlace, type PlaceId as AnyPlaceId, type ScenePlaceId as PlaceId } from './levelPlan';
import { isBuiltPlace4e } from './plan4e';
import { isBuiltPlace3e } from './plan3e';
import { isBuiltPlace5e } from './plan5e';

/** Un item d'exercice, vu d'ici : sa clé, et ses champs (ceux du jeu commun, sans en dépendre). */
export interface QuestionItem {
  key: string;
  [field: string]: unknown;
}

/** Ce que les Filets montrent dans le filet ou à côté (la phrase parle de ce qu'on voit). */
type Catch = 'sardines' | 'filets' | 'mouette' | 'bocaux' | 'crabes' | 'pêche' | 'seaux' | 'crabe';

/** La scène d'un item, calculée à partir de l'item seul. */
export type ItemScene =
  | { kind: 'cloches' }
  | { kind: 'filets'; catch: Catch; count: number }
  /**
   * Le filet au repos, sans pêche : l'Enclos aux Filets (GD-20, point 8, lot L4), où les objets à ranger et les paniers
   * sont les objets des réponses.
   */
  | { kind: 'enclos' }
  /** Le sas (niveau 1) : `d` bandes égales, `n` pleines d'eau. */
  | { kind: 'sas'; n: number; d: number }
  /** L'échelle de hauteur (niveau 2), de 0 à 2 : `d` crans par unité, l'eau au cran `n`. */
  | { kind: 'echelle'; n: number; d: number }
  /**
   * Le quai : `before` caisses, puis `after` (la grue en prend la moitié, ou le bateau en apporte autant) ; `calcul` :
   * le quai vide, la scène ne montre rien de l'item (les missions des Quais jouées avec leurs items de référence, tant
   * que leur gabarit n'est pas écrit, et celles où des caisses feraient compter des objets : la grille, les figures
   * restent dans le panneau).
   */
  | { kind: 'quai'; op: 'moitie' | 'double' | 'calcul'; before: number; after: number }
  /**
   * Deux sas côte à côte (Deux rives, GD-20, point 8, lot L2) : les deux barres de l'item, de même unité, `a` puis `b`
   * dans l'ordre du tirage, chacune `[parts pleines, parts égales]`.
   */
  | { kind: 'lockPair'; a: [number, number]; b: [number, number] }
  /**
   * Le sas au repos : la scène ne montre rien de l'item (les missions des Écluses jouées avec leurs items de référence,
   * où l'opération posée, l'aide et le schéma restent exacts dans le panneau). `column` : les réponses restent dans la
   * colonne, la scène fait le décor (Calculer avec des fractions, toute la mission, GD-20, point 8, lot L2).
   */
  | { kind: 'lockIdle'; column: boolean }
  /**
   * Le bassin des Marais salants au repos (GD-20, point 8, lot L5) : la scène ne montre rien de l'item (les missions
   * jouées avec leurs items de référence ; la figure, le tableau et la règle restent dans le panneau).
   */
  | { kind: 'saline' }
  /**
   * La jauge du bassin des Marais salants (la Pente graduée, niveau 1) : verticale, de `start` à `start + 1`, l'unité
   * coupée en `d` graduations ; l'eau arrive pile sur la graduation `n`.
   */
  | { kind: 'jauge'; start: number; d: number; n: number }
  /**
   * Le C, scène de décor neutre (GD-20, point 8, lot L6a) : la scène ne montre rien de l'item, les réponses restent dans
   * la colonne (la phrase, les réponses, le document, le rappel), aucun objet ne les porte ; le décor du lieu et son
   * objet témoin, qui réagit après une bonne réponse (questionScene.ts, `COLUMN_DECOR`). Pour la Turbine, le Chantier
   * naval, et les lieux qui suivent.
   */
  | { kind: 'column' }
  /**
   * Le lieu au repos (GD-20, point 8, lot L7) : la scène ne montre rien de l'item, les réponses sont portées par l'objet
   * du lieu (les vitraux de la Vigie, les tiroirs à fiches des Archives, les feuilles de l'Imprimerie), leurs étiquettes
   * dans la page.
   */
  | { kind: 'rest' }
  /**
   * Le lieu au repos, et l'objet de la bonne réponse qui réagit après une bonne réponse seulement, jamais après une
   * correction (GD-20, point 8, lot L9 : la bouée reçoit son voyant, la malle se ferme), puis reste jusqu'à l'item
   * suivant ; les réponses portées par l'objet du lieu, leurs étiquettes dans la page.
   */
  | { kind: 'restMark' };

const CATCHES: readonly Catch[] = ['sardines', 'filets', 'mouette', 'bocaux', 'crabes', 'pêche', 'seaux', 'crabe'];
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;
/** Une part de sas : `[parts pleines, parts égales]`, au plus toutes pleines. */
const isPart = (v: unknown): v is [number, number] => Array.isArray(v) && v.length === 2 && isCount(v[0]) && isCount(v[1]) && v[1] > 0 && v[0] <= v[1];

/** Une scène d'item bien formée (ce que `placeItems` pose dans `placeScene`), vérifiée champ par champ. */
export function isItemScene(v: unknown): v is ItemScene {
  if (typeof v !== 'object' || v === null || !('kind' in v)) return false;
  switch (v.kind) {
    case 'cloches':
    case 'enclos':
    case 'saline':
    case 'column':
    case 'rest':
    case 'restMark':
      return true;
    case 'jauge':
      return 'start' in v && isCount(v.start) && 'd' in v && isCount(v.d) && v.d > 0 && 'n' in v && isCount(v.n) && v.n <= v.d;
    case 'filets':
      return 'catch' in v && CATCHES.some((c) => c === v.catch) && 'count' in v && isCount(v.count);
    case 'sas':
    case 'echelle':
      return 'n' in v && isCount(v.n) && 'd' in v && isCount(v.d) && v.d > 0;
    case 'lockPair':
      return 'a' in v && isPart(v.a) && 'b' in v && isPart(v.b);
    case 'lockIdle':
      return 'column' in v && typeof v.column === 'boolean';
    case 'quai':
      return 'op' in v && (v.op === 'moitie' || v.op === 'double' || v.op === 'calcul') && 'before' in v && isCount(v.before) && 'after' in v && isCount(v.after);
    default:
      return false;
  }
}

/** Un item posé dans le lieu : l'item, sa scène, et la ligne de calcul de référence quand la phrase change (maths). */
export interface PlacedItem extends QuestionItem {
  placeScene: ItemScene;
  /** La ligne de référence, écrite sous la phrase du lieu (« Moitié de 34 = … »). */
  referenceLine?: string;
  /** Le mot à compléter, sous la phrase (les Familles-craft, lot L7 : « …faire ») ; son trou se remplit à la réussite. */
  gapWord?: string;
  /** Ce que dit la voix de la phrase (lot L7) : « Écouter le mot » (le Mot troué), « Réécouter » (les dictées). */
  listen?: 'mot' | 'reecouter';
  /** La voix dit la phrase à l'ouverture de l'item, comme l'écran de la dictée (lot L7). */
  speakOnOpen?: boolean;
  /** Ce qu'écrit chaque réponse, quand ce n'est pas la réponse elle-même (les morceaux « re- », « -et », lot L7). */
  choiceLabels?: string[];
  /**
   * Ears aux Balises (lot L9a, relecture du contenu) : pas de phrase écrite, la consigne la dit déjà ; le seul bouton de la
   * voix, son nom écrit (« Écouter le mot », « Réécouter »), qui dit le mot dans la langue de l'exercice ; le mot n'est
   * écrit qu'après la réponse, ou dès l'ouverture sans synthèse vocale.
   */
  listenOnly?: true;
  /**
   * Story time à la Gare maritime (lot L9b, relecture du contenu, comme `StoryScreen`) : l'histoire ne s'écrit qu'après
   * la réponse, ou dès l'ouverture sans synthèse vocale ; avant, « Écoute l'histoire » et le bouton « Écouter ».
   */
  listenFirst?: true;
}

/**
 * La mission d'un exercice (`maths-6e-fractions-equivalence-1` : `equivalence`), si son identifiant la porte. Un test
 * vérifie, pour chaque mission des `scenes` de plan6e.ts, qu'elle ne reconnaît que les exercices de cette mission.
 */
export const missionIs = (exerciseId: string, mission: string): boolean => exerciseId.includes(`-${mission}-`);

/**
 * La consigne de Deux rives aux Écluses (gabarit `compareFractions`, accord du directeur du contenu, 15 octobre 2026) ;
 * elle dit l'égalité, que la phrase courte de l'item ne dit plus (relecture de L3).
 */
export const PAIR_INSTRUCTION = 'Touche la plus grande fraction : c’est le sas le plus rempli d’eau. Remplis pareil : elles sont égales.';

/** La première phrase de la consigne de l'Abattage syllabique au Phare (relecture de L3, contenu). */
export const PHARE_SYLLABLES = 'Écoute le mot, puis touche la cloche du nombre de syllabes que tu entends.';

/**
 * La consigne de l'Enclos aux Filets (GD-20, point 8, lot L4, textes du directeur du contenu après la relecture) :
 * elle garde la question de la référence (le verbe au singulier ou au pluriel), puis dit le geste « ranger » (toucher
 * le sujet, puis son panier). Le niveau 2 garde son début (« Attention aux pièges »).
 */
export const ENCLOS_INSTRUCTION = [
  'Pour chaque sujet, son verbe est-il au singulier ou au pluriel ? Touche le sujet, puis son panier. Puis valide.',
  'Attention aux pièges : cherche qui fait l’action. Son verbe est-il au singulier ou au pluriel ? Touche le sujet, puis son panier, puis valide.',
] as const;

/**
 * La ligne de règle de l'Enclos, toujours affichée sous la consigne sur un téléphone, où la carte de règle ne tient
 * pas (relecture de L4 : contenu et référent dys) ; un texte par niveau.
 */
export const ENCLOS_RULE_LINE = [
  'Plusieurs : pluriel, le verbe finit par -nt (ils parlent).',
  'Deux sujets reliés par « et » : pluriel, le verbe finit par -nt.',
] as const;

/** La ligne de règle d'une mission qui en a une (l'Enclos), au niveau donné ; `null` sinon. */
export function placeRuleLine(anyPlace: AnyPlaceId, exerciseId: string, level: number): string | null {
  // Un lieu du 5e n'a pas encore de consigne à lui (GD-22, lot 2) : la consigne de référence.
  if (!isSixthPlace(anyPlace)) return null;
  const place = sixthPlace(anyPlace);
  return rangeGesture(place, exerciseId) ? ENCLOS_RULE_LINE[level >= 2 ? 1 : 0] : null;
}

/**
 * La consigne d'un lieu, quand elle change, mission par mission : aux Filets, celle de l'Enclos dit le geste
 * « ranger » ; au Phare, celle de l'Abattage syllabique dit la
 * cloche à toucher ; aux Écluses, celle des Nénuphars parle du sas (niveau
 * 1) ou de l'échelle (niveau 2), celle de Deux rives des deux sas ; aux Marais salants, celle de la Pente graduée
 * parle de la jauge (niveau 1) ; les autres missions gardent leur consigne de référence. `scene` : la scène de l'item montré, quand il y en a un ; un item de Deux rives sans ses deux sas
 * (`pairScene` rend `null`, il se joue sur le sas au repos) garde la consigne de référence (contenu, relecture de L2).
 */
export function placeInstruction(anyPlace: AnyPlaceId, exerciseId: string, level: number, reference: string, scene?: ItemScene): string {
  // Un lieu du 5e n'a pas encore de consigne à lui (GD-22, lot 2) : la consigne de référence.
  if (!isSixthPlace(anyPlace)) return reference;
  const place = sixthPlace(anyPlace);
  // Au Phare, l'Abattage syllabique se répond en touchant une cloche : « tape » s'y lirait « frappe la cloche une fois
  // par syllabe » (relecture de L3, contenu). Sa première phrase change ; la fin des niveaux 2 et 3 reste.
  if (place === 'phare' && missionIs(exerciseId, 'syllables')) return PHARE_SYLLABLES + reference.slice(reference.indexOf('.') + 1);
  if (rangeGesture(place, exerciseId)) return ENCLOS_INSTRUCTION[level >= 2 ? 1 : 0];
  // Aux Marais salants, la Pente graduée au niveau 1 parle de la jauge (avant le premier item aussi) ; un item sans sa
  // jauge garde la consigne de référence.
  if (place === 'saltworks') return missionIs(exerciseId, 'scale') && level === 1 && (!scene || scene.kind === 'jauge') ? JAUGE_INSTRUCTION : reference;
  if (place !== 'ecluses') return reference;
  if (missionIs(exerciseId, 'equivalence')) return !scene || scene.kind === 'lockPair' ? PAIR_INSTRUCTION : reference;
  if (!missionIs(exerciseId, 'number-line')) return reference;
  return level >= 2
    ? 'Sur l’échelle, compte en combien de parts est coupée l’unité, puis compte les parts jusqu’à l’eau.'
    : 'Regarde le sas : en bas, le nombre de parts égales ; en haut, le nombre de parts pleines d’eau.';
}

/** Les items du lieu d'un exercice, dans un univers (aujourd'hui, Archipéo seul) : par clé de leur jumeau. */
function twinsOf(exerciseId: string): Map<string, QuestionItem> {
  const all = (PLACE_ITEMS as Record<string, Record<string, QuestionItem[]>>).archipeo ?? {};
  return new Map((all[exerciseId] ?? []).map((it) => [it.key, it]));
}

/**
 * La carte de règle de la référence réduite à sa ligne `rule` (son titre gardé) : le lieu n'en montre qu'une ligne, la
 * carte entière reste dans « Vue simple ». Une aide d'une autre sorte, ou une ligne absente de la carte, ne change pas.
 */
function ruleOnly(aid: unknown, rule: string): unknown {
  if (typeof aid !== 'object' || aid === null || !('kind' in aid) || aid.kind !== 'rule-card' || !('props' in aid)) return aid;
  const props = aid.props;
  if (typeof props !== 'object' || props === null || !('lines' in props) || !Array.isArray(props.lines) || !props.lines.includes(rule)) return aid;
  return { ...aid, props: { ...props, lines: [rule] } };
}

/** Les exercices qui ont des items du lieu (pour les tests et la documentation). */
export const EXERCISES_WITH_TWINS: readonly string[] = Object.keys((PLACE_ITEMS as Record<string, Record<string, unknown>>).archipeo ?? {});

const numberOf = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** La figure d'un item de fraction (barre, disque ou droite graduée) : ses nombres. */
function fractionOf(item: QuestionItem): { n: number; d: number; line: boolean } | null {
  const figure = item.figure as { kind?: string; props?: Record<string, unknown> } | undefined;
  const props = figure?.props ?? {};
  if (figure?.kind === 'fraction-bar' || figure?.kind === 'fraction-disc') {
    const n = numberOf(props.n),
      d = numberOf(props.d);
    return n !== null && d !== null ? { n, d, line: false } : null;
  }
  if (figure?.kind === 'graduated-line') {
    const n = numberOf(props.point),
      d = numberOf(props.perUnit);
    return n !== null && d !== null ? { n, d, line: true } : null;
  }
  return null;
}

/** L'indice du sas des Écluses (niveau 1). */
export const SAS_HINT = 'En bas : le nombre de parts égales du sas. En haut : le nombre de parts pleines d’eau.';

/** La correction du sas des Écluses : « 3 parts pleines d’eau sur 4 parts égales : 3/4. » (accordée). */
export function sasExplanation(n: number, d: number): string {
  const pleines = n > 1 ? `${n} parts pleines d’eau` : `${n} part pleine d’eau`;
  return `${pleines} sur ${d} parts égales : ${n}/${d}.`;
}

/** « 3 parts pleines », « 1 part pleine ». */
const fullParts = (n: number): string => (n > 1 ? `${n} parts pleines` : `${n} part pleine`);

/**
 * Une fraction dite en mots (« 3 cinquièmes ») : la vue la donne (core/fractions.ts, `fractionWords`), ce dossier ne lit
 * que lui-même ; sans elle, la fraction écrite.
 */
export type SayFraction = (n: number, d: number) => string;
const written: SayFraction = (n, d) => `${n}/${d}`;

/** Ce que Deux rives change dans un item : sa scène, sa phrase écrite et lue, son indice, sa correction. */
interface PairItem {
  scene: Extract<ItemScene, { kind: 'lockPair' }>;
  prompt: string;
  spoken: string;
  hint: string;
  explanation: string;
}

/**
 * Deux rives aux Écluses (le gabarit `compareFractions` né du monde, accord du directeur du contenu pédagogique, 15
 * octobre 2026) : les deux barres de l'item deviennent deux sas de même unité ; la phrase les dit dans l'ordre du tirage,
 * jamais « à gauche » ni « à droite » ; l'indice et la correction suivent le cas (même dénominateur, même numérateur,
 * fractions égales). La clé, les trois choix et la réponse restent ceux de la référence. `null` : l'item n'a pas ses
 * deux barres, ou elles ne tombent dans aucun des trois cas.
 */
export function pairScene(item: QuestionItem, say: SayFraction = written): PairItem | null {
  const aid = item.aid as { kind?: string; props?: Record<string, unknown> } | undefined;
  const a = aid?.props?.a;
  const b = aid?.props?.b;
  if (aid?.kind !== 'compare-bars' || !isPart(a) || !isPart(b)) return null;
  const [fa, fb] = [`${a[0]}/${a[1]}`, `${b[0]}/${b[1]}`];
  // La phrase B du contenu (relecture de L3) : la phrase A tenait sur trois lignes au plus grand texte sur téléphone.
  // « Compare » ne suppose aucune issue ; la consigne (`PAIR_INSTRUCTION`) annonce l'égalité, pour ne pas piéger.
  const prompt = `Compare ${fa} et ${fb}.`;
  const spoken = `Compare ${say(a[0], a[1])} et ${say(b[0], b[1])}.`;
  const [va, vb] = [a[0] / a[1], b[0] / b[1]];
  const [big, small, fBig, fSmall] = va > vb ? [a, b, fa, fb] : [b, a, fb, fa];
  let hint: string;
  let explanation: string;
  if (va === vb) {
    hint = 'Regarde l’eau des deux sas : arrive-t-elle à la même hauteur ?';
    explanation = `L’eau arrive à la même hauteur dans les deux sas : ${fa} et ${fb} sont égales.`;
  } else if (a[1] === b[1]) {
    hint = 'Les deux sas ont le même nombre de parts égales : compare le nombre de parts pleines d’eau.';
    explanation = `${fullParts(big[0])} sur ${big[1]}, c’est plus que ${fullParts(small[0])} sur ${small[1]} : ${fBig} est plus grande que ${fSmall}.`;
  } else if (a[0] === b[0]) {
    hint = 'Plus un sas est coupé en parts, plus chaque part est petite.';
    explanation = `Le même nombre de parts pleines, mais des parts plus grandes dans le sas coupé en ${big[1]} : ${fBig} est plus grande que ${fSmall}.`;
  } else return null;
  return { scene: { kind: 'lockPair', a, b }, prompt, spoken, hint, explanation };
}

/**
 * La consigne de la Pente graduée aux Marais salants, au niveau 1 (la jauge du bassin ; textes du directeur du contenu,
 * 16 octobre 2026). Le niveau 3 se joue en items de référence : sur un téléphone couché, ses graduations seraient trop
 * serrées sur la jauge (moins de 8 px, questionScene.ts, `JAUGE`).
 */
export const JAUGE_INSTRUCTION = 'Sur la jauge, l’unité est coupée en dix : chaque graduation vaut un dixième. Lis le nombre où arrive l’eau.';

/** La phrase de la Pente graduée aux Marais salants, au niveau 1 (écrite et lue). */
export const JAUGE_PROMPT = 'L’eau du bassin arrive à quel nombre sur la jauge ?';

/** L'indice de la jauge des Marais salants. */
export const JAUGE_HINT = 'Sur la jauge, l’unité est partagée en 10 parts égales : chaque graduation vaut un dixième (0,1).';

/** Un dixième écrit à la française : 3 → « 0,3 ». */
const tenths = (k: number): string => `0,${k}`;

/**
 * La correction de la jauge : « L’eau arrive 3 graduations au-dessus de 5 : 5 + 0,3 = 5,3. » (accordée). Le calcul ne se
 * coupe jamais (des espaces insécables autour de + et de =), ni « au-dessus » à son trait d'union (un gluon sans chasse
 * après lui) : relecture du référent dys, lot L5. La voix lit les mêmes signes.
 */
export function jaugeExplanation(start: number, k: number, answer: string): string {
  return `L’eau arrive ${k} graduation${k > 1 ? 's' : ''} au-\u2060dessus de ${start} : ${start}\u00a0+\u00a0${tenths(k)}\u00a0=\u00a0${answer}.`;
}

/**
 * La jauge d'un item de la Pente graduée, niveau 1 (le gabarit `decimalOnLine`) : sa droite de `start` à `start + 1`,
 * en dixièmes, et le point repéré. `null` : l'item n'a pas cette droite (un autre niveau).
 */
function jaugeOf(item: QuestionItem): Extract<ItemScene, { kind: 'jauge' }> | null {
  const figure = item.figure as { kind?: string; props?: Record<string, unknown> } | undefined;
  const props = figure?.props ?? {};
  if (figure?.kind !== 'graduated-line') return null;
  const start = numberOf(props.start),
    units = numberOf(props.units),
    d = numberOf(props.perUnit),
    n = numberOf(props.point);
  if (start === null || units !== 1 || d !== 10 || n === null || !Number.isInteger(start) || start < 0 || !Number.isInteger(n) || n < 1 || n >= d) return null;
  return { kind: 'jauge', start, d, n };
}

/** Le bassin au repos : la scène des missions des Marais salants qui gardent leur item de référence. */
export const SALINE: ItemScene = { kind: 'saline' };

/** Le sas au repos : la scène des missions des Écluses qui gardent leur item de référence. */
export const LOCK_IDLE: ItemScene = { kind: 'lockIdle', column: false };
/** Le sas au repos, les réponses dans la colonne (Calculer avec des fractions). */
export const LOCK_COLUMN: ItemScene = { kind: 'lockIdle', column: true };

/** Le C neutre : la scène fait le décor, les réponses restent dans la colonne (la Turbine, lot L6a). */
export const COLUMN: ItemScene = { kind: 'column' };

/**
 * Les réponses d'une scène restent-elles dans la colonne (aucun objet ne les porte dans la scène) ? Le C neutre, et le
 * sas au repos de Calculer avec des fractions aux Écluses.
 */
export const answersInColumn = (scene: ItemScene): boolean => scene.kind === 'column' || (scene.kind === 'lockIdle' && scene.column);

/** La phrase des Quais pour un item de Doubles et moitiés (clé `half-34` ou `dbl-23`) : une idée par phrase, un verbe. */
export function quaiScene(key: string): { scene: Extract<ItemScene, { kind: 'quai' }>; prompt: string } | null {
  let m = /^half-(\d+)$/.exec(key);
  if (m) {
    const before = Number(m[1]);
    return {
      scene: { kind: 'quai', op: 'moitie', before, after: before / 2 },
      prompt: `${before} caisses sont sur le quai. La grue prend la moitié. Combien de caisses restent sur le quai ?`,
    };
  }
  m = /^dbl-(\d+)$/.exec(key);
  if (m) {
    const before = Number(m[1]);
    return {
      scene: { kind: 'quai', op: 'double', before, after: 2 * before },
      prompt: `${before} caisses sont sur le quai. Le bateau en apporte ${before} de plus. Combien y en a-t-il sur le quai maintenant ?`,
    };
  }
  return null;
}

/** Le quai vide : la scène des missions des Quais qui gardent leur item de référence. */
export const QUAI_NU: ItemScene = { kind: 'quai', op: 'calcul', before: 0, after: 0 };

/** L'ordre des paniers de la Récolte aux Filets : celui de la consigne (« é, er ou ez »). */
export const RECOLTE_ORDER = ['é', 'er', 'ez'] as const;

/**
 * Les choix de la Récolte dans l'ordre de la consigne, quel que soit le tirage de la partie (relecture de L4, référent
 * dys : les paniers ne changent pas de place d'un item à l'autre) ; rien pour une autre mission.
 */
function inInstructionOrder(exerciseId: string, it: QuestionItem): { choices?: string[] } {
  if (!missionIs(exerciseId, 'e-er-ez') || !Array.isArray(it.choices)) return {};
  const rank = (c: unknown) => {
    const i = (RECOLTE_ORDER as readonly unknown[]).indexOf(c);
    return i < 0 ? RECOLTE_ORDER.length : i;
  };
  return { choices: [...(it.choices as string[])].sort((a, b) => rank(a) - rank(b)) };
}

/**
 * Les items d'une partie, posés dans un lieu. `items` : ceux que le jeu commun a tirés (même graine, mêmes clés). Le
 * Phare garde les items de référence de ses trois missions, portés par ses cloches (le mot est l'objet appris : il ne
 * varie jamais, GD-20, point 8, lot L3) ; les Filets prennent l'item du lieu de même clé quand il existe (sinon l'item de référence, le filet
 * vide) ; aux Écluses, les Nénuphars gardent l'item et ne changent que sa phrase, Deux rives a son gabarit (les deux
 * sas), les autres missions gardent leur item de référence, le sas au repos ; aux Quais, Doubles et moitiés change sa phrase, les
 * autres missions gardent l'item de référence tel quel, sur le quai vide. `say` : les fractions dites en mots (la phrase
 * lue de Deux rives). Aux Marais salants, la Pente graduée au niveau 1 a sa jauge ; tout le reste se joue en items de
 * référence, sur le bassin au repos. À la Turbine et au Chantier naval, tout se joue en C, en items de référence.
 * `reference` : les items de « Vue simple ».
 */
export function placeItems(anyPlace: AnyPlaceId, exerciseId: string, items: readonly QuestionItem[], say: SayFraction = written, reference = false): PlacedItem[] {
  const place = scenePlace(anyPlace);
  const placed = placedInScene(place, exerciseId, items, say);
  // « Vue simple » (`reference`) joue l'item de référence en entier quand la scène remplace sa figure : sa consigne, sa
  // phrase, son indice, sa correction et sa figure d'origine (directeur du contenu pédagogique, 16 octobre 2026) ; la
  // scène garde ses textes. Chaque lieu pose ses items un à un, dans l'ordre : le rang suffit.
  if (!reference) return placed;
  return placed.map((p, i) => (sceneDrawsFigure(p.placeScene) ? { ...items[i], placeScene: p.placeScene } : p));
}

/**
 * La scène dessine-t-elle la figure de l'item, qu'elle remplace (le sas et l'échelle des Nénuphars, les deux sas de Deux
 * rives, la jauge des Marais salants) ? Elle a alors ses propres textes ; « Vue simple » revient à ceux de la référence.
 */
export const sceneDrawsFigure = (scene: ItemScene): boolean => scene.kind === 'sas' || scene.kind === 'echelle' || scene.kind === 'lockPair' || scene.kind === 'jauge';

/** Le lieu au repos (lot L7) : les réponses portées par l'objet du lieu, rien de l'item dans la scène. */
export const REST: ItemScene = { kind: 'rest' };

/** Le lieu au repos, l'objet de la bonne réponse marqué après une bonne réponse (lot L9). */
export const REST_MARK: ItemScene = { kind: 'restMark' };

/** Les missions du large jouées en C (lot L9) : les documents à lire et l'histoire à écouter. */
const LARGE_COLUMN = ['signs', 'famous-people', 'story'] as const;

/**
 * Ce qu'un item du rivage nord sans phrase affiche et dit dans la scène, pris sur son écran de référence (directeur du
 * contenu pédagogique, avis d'avant L7) : le Mot troué, le mot et son trou (« p…talon »), le mot entier dit ; les
 * Familles-craft, le sens, puis la racine et son trou (`gapWord`), dits avec la racine, et les morceaux écrits « re- »,
 * « -et » ; le Coffre à mots et l'Oreille du mineur, la ligne de la dictée, le mot ou sa phrase dits à l'ouverture,
 * jamais écrits. Les autres items gardent leur phrase.
 */
function northItem(exerciseId: string, it: QuestionItem): Partial<PlacedItem> {
  const word = String(it.word ?? '');
  if (missionIs(exerciseId, 'missing-letters')) return { prompt: `${String(it.before ?? '')}…${String(it.after ?? '')}`, spoken: word, listen: 'mot' };
  if (missionIs(exerciseId, 'word-families')) {
    const root = String(it.root ?? '');
    const prefix = it.slot !== 'suffix';
    const choices = Array.isArray(it.choices) ? it.choices.map(String) : [];
    const meaning = String(it.meaning ?? '');
    return {
      prompt: meaning,
      spoken: `${meaning} La racine est ${String(it.spokenRoot ?? root)}.`,
      gapWord: prefix ? `…${root}` : `${root}…`,
      choiceLabels: choices.map((c) => (prefix ? `${c}-` : `-${c}`)),
    };
  }
  if (missionIs(exerciseId, 'sight-words') || missionIs(exerciseId, 'sound-discrimination')) {
    const sentence = typeof it.sentence === 'string' ? it.sentence : null;
    return {
      prompt: sentence ? 'Écoute la phrase, puis choisis l’écriture du mot.' : 'Écoute, puis choisis la bonne écriture.',
      spoken: sentence ?? word,
      listen: 'reecouter',
      speakOnOpen: true,
    };
  }
  return {};
}

/** Les items posés dans la scène d'un lieu (`placeItems`), avec ses textes. */
function placedInScene(place: PlaceId, exerciseId: string, items: readonly QuestionItem[], say: SayFraction): PlacedItem[] {
  if (place === 'phare') return items.map((it) => ({ ...it, placeScene: { kind: 'cloches' } }));
  // Les lieux construits du 5e (GD-22, ./plan5e.ts, `BUILT_PLACES_5E`, la seule liste) : toutes leurs missions en R, avec
  // leurs items de référence ; les réponses portées par l'objet du lieu (les godets de la Montée, les miches du Hameau,
  // les poids des Radeaux, les bobines de la Croisée, les galets des Instants et des Fumerolles, les gobelets de l'Étuve,
  // les bols des Terrasses, les malles de l'Auberge, les claveaux du Donjon, les lampes à huile de l'Oracle, les fanions
  // du Sémaphore, les petites toiles du Gaillard, les moufles des Nacelles), le lieu au repos ; les nombres, la droite et les figures restent dans
  // le panneau. Un lieu construit s'y ajoute de lui-même.
  // Au 4e de même (./plan4e.ts, `BUILT_PLACES_4E`) : les lingots de fer de la Forge ; au 3e (./plan3e.ts,
  // `BUILT_PLACES_3E`) : les galets du Belvédère.
  if (isBuiltPlace5e(place) || isBuiltPlace4e(place) || isBuiltPlace3e(place)) return items.map((it) => ({ ...it, placeScene: REST }));
  // La Turbine (GD-20, point 8, lot L6a) et le Chantier naval (lot L6b) : leurs quatre missions en C, aux deux niveaux,
  // avec leurs items de référence (consigne, phrase, document, rappel) ; la scène fait le décor, les réponses restent dans
  // la colonne.
  if (place === 'engine' || place === 'shipyard') return items.map((it) => ({ ...it, placeScene: REST }));
  // Le rivage nord (GD-20, point 8, lot L7) : les items de référence tels quels. En C (les réponses dans la colonne) : à
  // la Vigie, Étages du sens et Les temps du récit ; aux Archives, Facettes (une mission, un geste : C entier, contenu et
  // référent dys). En R, les réponses portées par l'objet du lieu, le lieu au repos : les Vitraux des phrases, et la phrase
  // affichée et dite de l'écran de référence pour les autres (`northItem`).
  if (place === 'lookout' || place === 'archives' || place === 'printworks') {
    const column = missionIs(exerciseId, 'comprehension') || missionIs(exerciseId, 'tense-values') || missionIs(exerciseId, 'word-forms');
    return items.map((it) => (column ? { ...it, placeScene: REST } : { ...it, ...northItem(exerciseId, it), placeScene: REST }));
  }
  // La Mangrove (lot L8a) : de même, ses quatre missions en C, avec leurs items de référence.
  if (place === 'mangrove') return items.map((it) => ({ ...it, placeScene: REST }));
  // Les Ruines (lot L8b) : de même.
  if (place === 'ruins') return items.map((it) => ({ ...it, placeScene: REST }));
  // L'Observatoire (lot L8c) : ses trois missions en C, aux deux niveaux, avec leurs items de référence.
  if (place === 'observatory') return items.map((it) => ({ ...it, placeScene: REST }));
  // La Halle (lot L8d) : ses trois missions en C, aux deux niveaux, avec leurs items de référence.
  if (place === 'commons') return items.map((it) => ({ ...it, placeScene: REST }));
  // Le large (lot L9) : les items de référence tels quels. En C, les documents (Signs, Famous people) et l'histoire
  // (Story time) ; en R, les phrases à trou, les nombres et l'écoute, portés par les bouées des Balises et les malles de la
  // Gare maritime (deux malles pour Have ou has, au niveau 1 : l'item a deux choix). Ears garde son écoute : le mot dit à
  // l'ouverture, sans phrase écrite (`listenOnly`) ; Story time, l'histoire écrite après la réponse (`listenFirst`).
  if (place === 'beacons' || place === 'ferry') {
    if (missionIs(exerciseId, 'story')) return items.map((it) => ({ ...it, listenFirst: true as const, placeScene: COLUMN }));
    if (LARGE_COLUMN.some((m) => missionIs(exerciseId, m))) return items.map((it) => ({ ...it, placeScene: REST_MARK }));
    if (missionIs(exerciseId, 'first-listening'))
      return items.map((it) => ({ ...it, listenOnly: true as const, spoken: String(it.word ?? ''), speakOnOpen: true, placeScene: REST_MARK }));
    return items.map((it) => ({ ...it, placeScene: REST_MARK }));
  }
  if (place === 'saltworks') {
    // Les Marais salants (GD-20, point 8, lot L5) : toutes les missions au même bassin, avec les mêmes sacs de sel. Seule
    // la Pente graduée, au niveau 1, a son gabarit (la jauge) ; les autres gardent leur item de référence, le bassin au
    // repos, leur figure dans le panneau.
    if (!missionIs(exerciseId, 'scale')) return items.map((it) => ({ ...it, placeScene: SALINE }));
    return items.map((it) => {
      const jauge = jaugeOf(it);
      if (!jauge) return { ...it, placeScene: SALINE };
      // La droite de référence reste dans l'item : « Vue simple » la montre ; la jauge la remplace ici.
      return {
        ...it,
        prompt: JAUGE_PROMPT,
        spoken: JAUGE_PROMPT,
        hint: JAUGE_HINT,
        explanation: jaugeExplanation(jauge.start, jauge.n, String(it.answer ?? '')),
        placeScene: jauge,
      };
    });
  }
  if (place === 'filets') {
    // L'Enclos (lot L4) : les items de référence, rangés par quatre ; le filet au repos.
    if (rangeGesture(place, exerciseId)) return items.map((it) => ({ ...it, placeScene: ENCLOS }));
    const twins = twinsOf(exerciseId);
    return items.map((it) => {
      const twin = twins.get(it.key);
      if (!twin) return { ...it, ...inInstructionOrder(exerciseId, it), placeScene: { kind: 'filets', catch: 'pêche', count: 1 } };
      const scene = twin.scene as { catch: Catch; count: number };
      const { scene: _scene, point: _point, traps: _traps, rule, ...fields } = twin;
      return {
        ...it,
        ...fields,
        key: it.key,
        ...(typeof rule === 'string' ? { aid: ruleOnly(it.aid, rule) } : {}),
        placeScene: { kind: 'filets', catch: scene.catch, count: scene.count },
      };
    });
  }
  if (place === 'ecluses') {
    // Les Écluses (GD-20, point 8, lot L2) : toutes leurs missions au même sas, avec les mêmes leviers. Les Nénuphars et
    // Deux rives ont leur gabarit ; Partage du gâteau et Galets en colonnes gardent leur item de référence, le sas au
    // repos ; Calculer avec des fractions aussi, ses réponses dans la colonne (toute la mission).
    if (missionIs(exerciseId, 'fraction-sums')) return items.map((it) => ({ ...it, placeScene: LOCK_COLUMN }));
    if (missionIs(exerciseId, 'sharing') || missionIs(exerciseId, 'place-value')) return items.map((it) => ({ ...it, placeScene: LOCK_IDLE }));
    if (missionIs(exerciseId, 'equivalence'))
      return items.map((it) => {
        const pair = pairScene(it, say);
        if (!pair) return { ...it, placeScene: LOCK_IDLE };
        // Les barres de référence restent dans l'item : « Vue simple » les montre, leurs fractions en colonne comme dans
        // la phrase (une seule forme, référent dys) ; la scène les dessine ici.
        const aid = it.aid as { kind: string; props: Record<string, unknown> };
        return {
          ...it,
          prompt: pair.prompt,
          spoken: pair.spoken,
          hint: pair.hint,
          explanation: pair.explanation,
          aid: { ...aid, props: { ...aid.props, stacked: true } },
          placeScene: pair.scene,
        };
      });
    return items.map((it) => {
      const f = fractionOf(it);
      if (!f) return { ...it, placeScene: LOCK_IDLE };
      const prompt = f.line ? 'L’eau arrive à quelle hauteur sur l’échelle ?' : 'Quelle part du sas est pleine d’eau ?';
      // La figure de référence reste dans l'item : « Vue simple » la montre ; la scène la remplace ici.
      if (f.line) return { ...it, prompt, spoken: prompt, placeScene: { kind: 'echelle', n: f.n, d: f.d } };
      // Le sas (niveau 1) : l'indice et la correction parlent du sas (contenu, 14 octobre 2026), la clé et les choix restent.
      return {
        ...it,
        prompt,
        spoken: prompt,
        hint: SAS_HINT,
        explanation: sasExplanation(f.n, f.d),
        placeScene: { kind: 'sas', n: f.n, d: f.d },
      };
    });
  }
  // Les Quais : toutes leurs missions au même quai, avec la même caisse ; seule Doubles et moitiés a son gabarit (la
  // phrase du lieu et les caisses du tirage) ; les autres gardent leur item de référence, le quai vide (GD-20, point 8 :
  // un gabarit manquant, on joue la référence).
  return items.map((it) => {
    const q = exerciseId.includes('-doubles-halves-') ? quaiScene(it.key) : null;
    if (!q) return { ...it, placeScene: QUAI_NU };
    return {
      ...it,
      prompt: q.prompt,
      spoken: q.prompt,
      referenceLine: String(it.prompt ?? ''),
      placeScene: q.scene,
    };
  });
}

/**
 * Le geste d'une mission du Phare (GD-20, point 8, lot L3 : toutes ses missions aux mêmes cloches) : la Chasse au son et
 * les Rimes-échelle se jouent en marquant des cloches, puis « Valider » (`marquer`, en manches de six au plus, quatre au
 * plus grand texte sur un écran bas) ;
 * l'Abattage syllabique, en touchant la cloche de sa réponse (`toucher`, un mot par item, trois cloches qui portent les
 * trois nombres de l'item de référence : 1, 2, 3 au premier niveau, jusqu'à 5, 6, 7 au troisième).
 */
export const phareGesture = (exerciseId: string): 'marquer' | 'toucher' => (missionIs(exerciseId, 'syllables') ? 'toucher' : 'marquer');

/** Le filet au repos : la scène de l'Enclos (rien de l'item ne s'y montre). */
export const ENCLOS: ItemScene = { kind: 'enclos' };

/** Un panier du geste « ranger » : son identifiant (la réponse de l'item qu'il reçoit) et son étiquette. */
export interface RangeBin {
  id: string;
  label: string;
}

/**
 * Les paniers de l'Enclos (lot L4) : les catégories du contenu, les réponses de ses items (`answer` : `singulier`,
 * `pluriel`), écrites comme la carte de règle du niveau 1 les nomme (« Un seul : singulier », « Plusieurs : pluriel »).
 */
export const ENCLOS_BINS: readonly RangeBin[] = [
  { id: 'singulier', label: 'Singulier' },
  { id: 'pluriel', label: 'Pluriel' },
];

/**
 * La phrase d'un sujet de l'Enclos avec son verbe accordé (« Les chiens mangent ») : les formes `singular` et `plural`
 * de l'item, celle de sa réponse. Montrée et dite après « Valider » (relecture de L4, contenu) ; le sujet seul sans
 * verbe.
 */
export function agreedSentence(item: QuestionItem): string {
  const subject = String(item.subject ?? item.key);
  const verb = agreedVerb(item);
  return verb ? `${subject} ${verb}` : subject;
}

/** Le verbe accordé d'un sujet de l'Enclos (« mangent »), ou une chaîne vide. */
export function agreedVerb(item: QuestionItem): string {
  const verb = item.answer === 'pluriel' ? item.plural : item.singular;
  return typeof verb === 'string' ? verb : '';
}

/** Le nombre d'objets à ranger par manche : quatre sujets, comme l'Enclos de la grille. */
export const RANGE_PER_ROUND = 4;

/**
 * Sur un écran bas (un téléphone couché), trois sujets par manche : avec les deux paniers, la rangée de cinq étiquettes
 * garde la largeur de celles d'une tablette (lot L4 : « Des oiseaux » tient sans « Vue simple » à 844 px).
 */
export const RANGE_PER_SMALL_ROUND = 3;

/**
 * Au plus grand texte sur un écran bas, un sujet par manche (relecture de L4, contenu). La ligne de règle prend la ligne
 * de la consigne repliée ; sur un téléphone couché, le sujet et les paniers passent alors sous « Valider » et le panneau
 * défile, signalé par l'ombre et le chevron « Suite plus bas » (dérogation du 16 octobre 2026, à ce seul réglage).
 */
export const RANGE_PER_GRAND_ROUND = 1;

/**
 * Le geste d'une mission quand c'est « ranger » (GD-20, point 8, lot L4 : toucher l'objet, puis le panier ; glisser
 * n'est pas construit) : ses paniers ; `null` sinon. Aux Filets, l'Enclos.
 */
export function rangeGesture(anyPlace: AnyPlaceId, exerciseId: string): readonly RangeBin[] | null {
  if (!isSixthPlace(anyPlace)) return null;
  const place = sixthPlace(anyPlace);
  return place === 'filets' && missionIs(exerciseId, 'word-classes') ? ENCLOS_BINS : null;
}

/** Les manches du geste « ranger » : les items dans leur ordre, par quatre. */
export function rangeRounds<T>(items: readonly T[], perRound = RANGE_PER_ROUND): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += perRound) out.push(items.slice(i, i + perRound));
  return out.length ? out : [[]];
}

/** Le nombre de cloches d'une manche au Phare : six au plus (quatre à six cibles, avis du référent dys). */
export const BELLS_PER_ROUND = 6;

/**
 * Au plus grand texte sur un écran bas, quatre cloches par manche (relecture de L3, contenu et référent dys) : la
 * référence joue déjà par quatre, et la manche tient entière au-dessus de « Valider ».
 */
export const BELLS_PER_SMALL_ROUND = 4;

/**
 * Les manches du Phare : les mots d'un niveau en manches de `perRound` au plus (six, ou quatre au plus grand texte sur
 * un écran bas), chacune avec des bons mots et des pièges en proportion (jamais une manche sans piège ni une manche sans
 * bon mot, si le niveau en a), dans un ordre tiré de `rng`.
 */
export function bellRounds<T extends QuestionItem>(items: readonly T[], rng: () => number, perRound = BELLS_PER_ROUND): T[][] {
  const rounds = Math.max(1, Math.ceil(items.length / perRound));
  const good = items.filter((it) => Boolean(it.correct));
  const traps = items.filter((it) => !it.correct);
  const out: T[][] = Array.from({ length: rounds }, () => []);
  good.forEach((it, i) => out[i % rounds].push(it));
  traps.forEach((it, i) => out[(rounds - 1 - (i % rounds)) % rounds].push(it));
  return out.map((round) => {
    const copy = [...round];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });
}

/**
 * La trace de la scénette d'un lieu se voit dès la première réussite de sa mission (une étoile au moins). Tiré des
 * étoiles déjà gardées par le jeu commun : rien de neuf dans la sauvegarde.
 */
export const traceDone = (stars: readonly number[]): boolean => stars.some((s) => s >= 1);

/** La durée d'une réaction à un item, en secondes : entre une et deux (elle ne reste pas). */
export const REACTION_SECONDS = 1.4;

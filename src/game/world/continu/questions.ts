// Les questions nées du monde (lot 4 du prototype, questions-du-monde.md, choix du mainteneur du 14 octobre 2026) : ce
// que chaque lieu fait des items de sa mission. Le Phare garde les mots de référence, portés par des cloches, en deux
// manches de six ; les Filets posent les items du lieu écrits pour la scène (docs/contenu/<île>.md, « ## Au lieu ·
// Archipéo », jumeaux à clé partagée, règle « à l'essai ») ; les Écluses et les Quais gardent l'item du générateur de
// référence (même clé, mêmes choix, même explication) et n'en changent que la phrase, et la scène se calcule à partir
// de ses nombres. Code pur : la vue dessine, le jeu commun compte les étoiles et le barème.
import PLACE_ITEMS from './placeItems.json';
import type { PlaceId } from './plan6e';

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
  /** Le sas (niveau 1) : `d` bandes égales, `n` pleines d'eau. */
  | { kind: 'sas'; n: number; d: number }
  /** L'échelle de hauteur (niveau 2), de 0 à 2 : `d` crans par unité, l'eau au cran `n`. */
  | { kind: 'echelle'; n: number; d: number }
  /** Le quai : `before` caisses, puis `after` (la grue en prend la moitié, ou le bateau en apporte autant). */
  | { kind: 'quai'; op: 'moitie' | 'double'; before: number; after: number };

const CATCHES: readonly Catch[] = ['sardines', 'filets', 'mouette', 'bocaux', 'crabes', 'pêche', 'seaux', 'crabe'];
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/** Une scène d'item bien formée (ce que `placeItems` pose dans `placeScene`), vérifiée champ par champ. */
export function isItemScene(v: unknown): v is ItemScene {
  if (typeof v !== 'object' || v === null || !('kind' in v)) return false;
  switch (v.kind) {
    case 'cloches':
      return true;
    case 'filets':
      return 'catch' in v && CATCHES.some((c) => c === v.catch) && 'count' in v && isCount(v.count);
    case 'sas':
    case 'echelle':
      return 'n' in v && isCount(v.n) && 'd' in v && isCount(v.d) && v.d > 0;
    case 'quai':
      return 'op' in v && (v.op === 'moitie' || v.op === 'double') && 'before' in v && isCount(v.before) && 'after' in v && isCount(v.after);
    default:
      return false;
  }
}

/** Un item posé dans le lieu : l'item, sa scène, et la ligne de calcul de référence quand la phrase change (maths). */
export interface PlacedItem extends QuestionItem {
  placeScene: ItemScene;
  /** La ligne de référence, écrite sous la phrase du lieu (« Moitié de 34 = … »). */
  referenceLine?: string;
}

/** La consigne d'un lieu, quand elle change : celle des Écluses parle du sas et de l'échelle. */
export function placeInstruction(place: PlaceId, level: number, reference: string): string {
  if (place !== 'ecluses') return reference;
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

/**
 * Les items d'une partie, posés dans un lieu. `items` : ceux que le jeu commun a tirés (même graine, mêmes clés). Le
 * Phare les garde ; les Filets prennent l'item du lieu de même clé quand il existe (sinon l'item de référence, le filet
 * vide) ; les Écluses et les Quais gardent l'item et ne changent que sa phrase.
 */
export function placeItems(place: PlaceId, exerciseId: string, items: readonly QuestionItem[]): PlacedItem[] {
  if (place === 'phare') return items.map((it) => ({ ...it, placeScene: { kind: 'cloches' } }));
  if (place === 'filets') {
    const twins = twinsOf(exerciseId);
    return items.map((it) => {
      const twin = twins.get(it.key);
      if (!twin)
        return {
          ...it,
          placeScene: { kind: 'filets', catch: 'pêche', count: 1 },
        };
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
    return items.map((it) => {
      const f = fractionOf(it);
      if (!f) return { ...it, placeScene: { kind: 'sas', n: 1, d: 2 } };
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
  return items.map((it) => {
    const q = quaiScene(it.key);
    if (!q)
      return {
        ...it,
        placeScene: { kind: 'quai', op: 'moitie', before: 0, after: 0 },
      };
    return {
      ...it,
      prompt: q.prompt,
      spoken: q.prompt,
      referenceLine: String(it.prompt ?? ''),
      placeScene: q.scene,
    };
  });
}

/** Le nombre de cloches d'une manche au Phare : six au plus (quatre à six cibles, avis du référent dys). */
export const BELLS_PER_ROUND = 6;

/**
 * Les manches du Phare : les mots d'un niveau en manches de six au plus, chacune avec des bons mots et des pièges en
 * proportion (jamais une manche sans piège ni une manche sans bon mot, si le niveau en a), dans un ordre tiré de `rng`.
 */
export function bellRounds<T extends QuestionItem>(items: readonly T[], rng: () => number): T[][] {
  const rounds = Math.max(1, Math.ceil(items.length / BELLS_PER_ROUND));
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

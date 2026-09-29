import { BIOMES, BLOCKS } from '../biomes';
import { CATALOG, UNORDERED, exercisesOf, loadAllExercises, pickExercise, questProgress } from './index';
import { SCREEN_TYPES } from './registry';
import { piegesDe } from './shuffle';
import { CalculScreen } from './CalculScreen';
import { DicteeItem } from './DicteeItem';
import { fillTemplate } from './types';
import { parseHour, parseNumber, placeAnswer, type Parsed } from '../../core/choices';
import { COFFRE_HORS_LISTE, motDictable, motsOutilsDictables } from '../../programme/motsOutils';

const EXERCISES = await loadAllExercises();

it('chaque fichier de data/ a sa place dans l’ordre du catalogue, une seule fois', () => {
  expect(UNORDERED).toEqual([]);
  const ids = CATALOG.map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
});

it('l’index du catalogue dit la même chose que le contenu chargé à la demande', () => {
  expect(EXERCISES.map(({ id, biome, type, level }) => ({ id, biome, type, level }))).toEqual(CATALOG);
});

describe.each(EXERCISES.map((e) => [e.id, e] as const))('exercice %s', (_, def) => {
  it('est complet et cohérent', () => {
    const biome = BIOMES.find((b) => b.id === def.biome)!;
    expect(biome).toBeTruthy();
    expect(biome.exercises.map((x) => x.id)).toContain(def.type);
    expect(SCREEN_TYPES[def.type]).toBeTruthy();
    expect(def.level).toBeGreaterThanOrEqual(1);
    expect(def.instruction.length).toBeGreaterThan(10);
    expect(def.instruction).not.toContain("'");
    expect(def.items.length).toBeGreaterThanOrEqual(4);
    expect(new Set(def.items.map((i) => i.key)).size).toBe(def.items.length);
    expect(BLOCKS[def.reward.block]).toBeTruthy();
    expect(def.reward.amount).toBeGreaterThan(0);
    expect(def.reward.xp).toBeGreaterThan(0);
    expect(def.adaptive.promoteAt).toBeGreaterThan(def.adaptive.demoteAt);
    expect(def.feedback.correct).toBeTruthy();
    // Les variables du message de correction existent dans les items.
    for (const v of def.feedback.wrong.matchAll(/\{(\w+)\}/g)) {
      const name = v[1];
      const known = ['target', 'chosen', 'mined', 'missed', 'verb'].includes(name) || def.items.every((i) => name in i);
      expect(known, `variable {${name}} inconnue`).toBe(true);
    }
  });
});

it('chasse au son : 4 mots par écran, 2 à 3 bons par écran, pictogramme et son entendu', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'chasse-son')) {
    expect(def.items.length % 4).toBe(0);
    for (let i = 0; i < def.items.length; i += 4) {
      const screen = def.items.slice(i, i + 4);
      const good = screen.filter((it) => it.correct).length;
      expect(good, `${def.id} écran ${i / 4}`).toBeGreaterThanOrEqual(2);
      expect(good).toBeLessThanOrEqual(3);
    }
    for (const it of def.items) {
      expect(String(it.image).length).toBeGreaterThan(0);
      expect(String(it.heard)).toMatch(/^\[.+\]$/);
    }
  }
});

it('abattage : on compte les syllabes entendues, sans e muet final', () => {
  const defs = EXERCISES.filter((e) => e.type === 'abattage');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs) {
    expect(def.instruction).toMatch(/entends/);
    for (const it of def.items) {
      const syllables = String(it.heard).split('-');
      expect(String(syllables.length), String(it.word)).toBe(it.answer);
      expect(it.choices).toContain(it.answer);
      // « ca-ba-ne » compterait le e muet, que l'oreille n'entend pas : on attend « ca-bane ».
      for (const s of syllables) expect(s, `${it.word} : ${it.heard}`).not.toMatch(/^[^aeiouyàâéèêëîïôûù]+e$/);
    }
  }
});

it('filon : moitié de lettres cibles, lettres proches seulement', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'filon')) {
    expect(def.items.filter((i) => i.correct).length).toBe(def.items.length / 2);
    for (const it of def.items) {
      expect(['b', 'd', 'p', 'q']).toContain(it.letter);
      // La cible est celle du bloc quand elle change à chaque bloc (filon mélangé), sinon celle de l'exercice.
      expect(it.correct).toBe(it.letter === (it.target ?? def.target));
    }
  }
});

it('mot troué : le trou reconstitue le mot, 3 blocs dont la réponse', () => {
  for (const def of EXERCISES.filter((e) => e.type === 'mot-troue')) {
    for (const it of def.items) {
      expect(`${it.before}${it.answer}${it.after}`).toBe(it.word);
      expect(it.choices).toHaveLength(3);
      expect(it.choices).toContain(it.answer);
      expect(new Set(it.choices as string[]).size).toBe(3);
    }
  }
});

it('tri des graines : construit depuis les homophones, avec règle et astuce', () => {
  const defs = EXERCISES.filter((e) => e.type === 'graines');
  expect(defs.map((d) => d.id).sort()).toEqual(['ferme-graines-a', 'ferme-graines-ce', 'ferme-graines-et', 'ferme-graines-on', 'ferme-graines-son']);
  for (const def of defs)
    for (const it of def.items) {
      expect(String(it.prompt)).toContain('…');
      expect(it.choices).toContain(it.answer);
      expect(String(it.rule).length).toBeGreaterThan(5);
      expect(fillTemplate(def.feedback.wrong, it)).not.toMatch(/\{\w+\}/);
    }
});

it('ascension : textes de 60 à 120 mots en 3 à 5 paragraphes', () => {
  const defs = EXERCISES.filter((e) => e.type === 'ascension');
  expect(defs.length).toBeGreaterThanOrEqual(3);
  for (const def of defs) {
    const words = def.items.reduce((n, it) => n + String(it.text).split(/\s+/).length, 0);
    expect(words).toBeGreaterThanOrEqual(60);
    expect(words).toBeLessThanOrEqual(120);
    expect(def.items.length).toBeGreaterThanOrEqual(3);
    expect(def.items.length).toBeLessThanOrEqual(5);
  }
});

it('rimes : 4 mots par écran, 2 à 3 qui riment, pictogramme et fin entendue', () => {
  const defs = EXERCISES.filter((e) => e.type === 'rimes');
  expect(defs.length).toBeGreaterThanOrEqual(3);
  for (const def of defs) {
    expect(def.target).toBeTruthy();
    expect(def.items.length % 4).toBe(0);
    for (let i = 0; i < def.items.length; i += 4) {
      const good = def.items.slice(i, i + 4).filter((it) => it.correct).length;
      expect(good, `${def.id} écran ${i / 4}`).toBeGreaterThanOrEqual(2);
      expect(good).toBeLessThanOrEqual(3);
    }
    for (const it of def.items) {
      expect(String(it.image).length).toBeGreaterThan(0);
      expect(String(it.ending)).toMatch(/^\[.+\]$/);
    }
  }
});

it('dictées à choix (oreille, coffre) : le mot est parmi 2 ou 3 écritures différentes, avec un indice', () => {
  const defs = EXERCISES.filter((e) => e.type === 'oreille' || e.type === 'coffre');
  expect(defs.length).toBeGreaterThanOrEqual(4);
  for (const def of defs)
    for (const it of def.items) {
      const choices = it.choices as string[];
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(choices.length).toBeLessThanOrEqual(3);
      expect(new Set(choices).size).toBe(choices.length);
      expect(choices).toContain(it.answer);
      expect(it.answer).toBe(it.word);
      expect(String(it.hint).length).toBeGreaterThan(5);
    }
});

it('coffre à mots : chaque mot dicté vient de la liste officielle des mots-outils (CP, CE1), ou des exceptions motivées', () => {
  const official = motsOutilsDictables();
  const used = new Set<string>();
  for (const def of EXERCISES.filter((e) => e.type === 'coffre'))
    for (const it of def.items) {
      const w = motDictable(String(it.word));
      used.add(w);
      expect(official.has(w) || w in COFFRE_HORS_LISTE, `${def.id} : « ${w} » n’est ni dans la liste officielle ni dans COFFRE_HORS_LISTE`).toBe(true);
    }
  for (const w of Object.keys(COFFRE_HORS_LISTE)) expect(used.has(w), `« ${w} » n’est plus dicté par le Coffre : retirer l’exception`).toBe(true);
});

it('familles : le morceau choisi et la racine reconstituent le mot', () => {
  const defs = EXERCISES.filter((e) => e.type === 'familles');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs)
    for (const it of def.items) {
      expect(['prefix', 'suffix']).toContain(it.slot);
      expect(it.slot === 'prefix' ? `${it.answer}${it.root}` : `${it.root}${it.answer}`).toBe(it.word);
      expect(it.choices).toHaveLength(3);
      expect(it.choices).toContain(it.answer);
      expect(String(it.meaning).length).toBeGreaterThan(5);
    }
});

it('enclos : 4 sujets par écran, réponse singulier ou pluriel, avec une explication', () => {
  const defs = EXERCISES.filter((e) => e.type === 'enclos');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs) {
    expect(def.items.length % 4).toBe(0);
    for (const it of def.items) {
      expect(['singulier', 'pluriel']).toContain(it.answer);
      expect(it.singular).not.toBe(it.plural);
      expect(String(it.why).length).toBeGreaterThan(10);
    }
  }
});

it('récolte : phrase à trou, trois terminaisons, règle', () => {
  const defs = EXERCISES.filter((e) => e.type === 'recolte');
  expect(defs.length).toBeGreaterThanOrEqual(2);
  for (const def of defs)
    for (const it of def.items) {
      expect(String(it.prompt)).toContain('…');
      expect(it.choices).toEqual(['é', 'er', 'ez']);
      expect(it.choices).toContain(it.answer);
      expect(String(it.rule).length).toBeGreaterThan(10);
    }
});

it('plus aucun type d’exercice n’est « bientôt » : chaque type déclaré a du contenu', () => {
  for (const biome of BIOMES) for (const x of biome.exercises) expect(exercisesOf(biome.id, x.id).length, `${biome.id}/${x.id}`).toBeGreaterThanOrEqual(1);
});

it('chaque type de chaque biome a au moins un exercice', () => {
  for (const biome of BIOMES) {
    const withContent = biome.exercises.filter((x) => exercisesOf(biome.id, x.id).length > 0);
    expect(withContent.length, biome.id).toBeGreaterThanOrEqual(1);
  }
});

it('pickExercise varie entre les exercices d’un même niveau (le moins joué d’abord)', () => {
  const first = pickExercise('foret', 'chasse-son', 1)!;
  expect(first.level).toBe(1);
  const second = pickExercise('foret', 'chasse-son', 1, { [first.id]: { attempts: 1 } })!;
  expect(second.id).not.toBe(first.id);
  expect(second.level).toBe(1);
  // Niveau 2 demandé : on reste au niveau 2 ; niveau 9 : le plus haut disponible.
  expect(pickExercise('foret', 'chasse-son', 2)!.level).toBe(2);
  expect(pickExercise('foret', 'chasse-son', 9)!.level).toBe(3);
  expect(pickExercise('foret', 'rimes', 1)?.type).toBe('rimes');
  expect(pickExercise('tour', 'inconnu', 1)).toBeUndefined();
});

it('questProgress garde la progression d’une mission quand la partie suivante tombe sur une autre variante', () => {
  expect(questProgress('foret', 'chasse-son', {})).toBeUndefined();
  const first = pickExercise('foret', 'chasse-son', 1)!;
  const progress = { [first.id]: { stars: 2, attempts: 1, best: 0.8 } };
  // La prochaine partie proposée est une autre variante, jamais jouée…
  const next = pickExercise('foret', 'chasse-son', 1, progress)!;
  expect(next.id).not.toBe(first.id);
  expect(progress[next.id]).toBeUndefined();
  // … mais la mission affiche toujours ses étoiles.
  expect(questProgress('foret', 'chasse-son', progress)).toEqual({ stars: 2, attempts: 1, best: 0.8 });
  // Toutes variantes et niveaux confondus : meilleures étoiles, meilleur score, parties cumulées.
  const level2 = exercisesOf('foret', 'chasse-son').find((e) => e.level === 2)!;
  const more = { ...progress, [next.id]: { stars: 1, attempts: 2, best: 0.5 }, [level2.id]: { stars: 3, attempts: 1, best: 0.95 } };
  expect(questProgress('foret', 'chasse-son', more)).toEqual({ stars: 3, attempts: 4, best: 0.95 });
  // Les exercices d’autres missions ne comptent pas.
  expect(questProgress('foret', 'rimes', more)).toBeUndefined();
});

it('français du collège : phrase à trou (ou question), 2 à 3 choix, règle affichée et explication', () => {
  const defs = EXERCISES.filter((e) => ['carrefour', 'marais', 'falaise', 'cabinet', 'textes'].includes(e.biome));
  expect(
    defs
      .filter((e) => e.type === 'panneaux')
      .map((e) => e.id)
      .sort(),
  ).toEqual(['ces', 'cest', 'la', 'leur', 'ou', 'peu', 'quand'].map((s) => `carrefour-panneaux-${s}`).sort());
  expect(defs.length).toBe(44);
  for (const def of defs)
    for (const it of def.items) {
      expect(it.choices).toContain(it.answer);
      expect((it.choices as string[]).length).toBeGreaterThanOrEqual(2);
      expect(new Set(it.choices as string[]).size).toBe((it.choices as string[]).length);
      expect((it.aid as { kind: string }).kind).toBe('rule-card');
      expect(String(it.explanation).length).toBeGreaterThan(5);
      expect(String(it.spoken)).not.toContain('…');
    }
});

it('anglais : tout le contenu en anglais (lang: en), la réponse parmi les choix, une correction en français', () => {
  const islands = BIOMES.filter((b) => b.subject === 'anglais').map((b) => b.id);
  const defs = EXERCISES.filter((e) => islands.includes(e.biome));
  expect(defs.length).toBeGreaterThan(0);
  for (const def of defs) {
    expect(def.lang, def.id).toBe('en');
    const screen = SCREEN_TYPES[def.type].component;
    for (const it of def.items) {
      const choices = it.choices as string[];
      expect(choices, `${def.id} ${it.key}`).toContain(it.answer);
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(choices).size).toBe(choices.length);
      expect(String(it.explanation).length).toBeGreaterThan(5);
      // Apostrophes typographiques partout, en anglais aussi (I’m, don’t).
      for (const text of [it.prompt, it.spoken, it.word, it.hint, it.explanation, ...choices]) if (text !== undefined) expect(String(text), it.key).not.toContain("'");
      if (screen === CalculScreen) {
        // Le trou se lit « blank », comme en classe d'anglais ; la règle est toujours affichée.
        expect(String(it.spoken)).not.toContain('…');
        if (String(it.prompt).includes('…')) expect(String(it.spoken)).toContain('blank');
        expect((it.aid as { kind: string }).kind).toBe('rule-card');
      }
      if (it.question !== undefined) {
        // Un document à lire (Notices) : la question en français, sans symbole à lire ; le document en anglais, lu en
        // entier par `spoken`, sans symbole (pas de « £ », pas d'heure « 8:15 ») ; l'indice, lu en français, non plus.
        expect(String(it.question), it.key).toMatch(/\?$/);
        expect(String(it.question), it.key).not.toMatch(/[£$€:]/);
        expect(String(it.question), it.key).not.toContain("'");
        expect(String(it.spoken), it.key).not.toMatch(/[£$€]|\d:\d/);
        expect(String(it.hint), it.key).not.toMatch(/[£$€]|\d:\d/);
        expect(String(it.prompt), it.key).not.toContain('…');
      }
      if (screen === DicteeItem) {
        // Écoute d'abord : un mot ou une phrase à entendre ; on choisit son sens (en français) ou la bonne réplique
        // (en anglais, comme les Dialogues). Rien n'est écrit avant l'écoute : la réponse n'est pas le texte lu.
        expect([undefined, 'fr']).toContain(it.choicesLang);
        expect(String(it.word).length).toBeGreaterThan(1);
        expect(it.answer).not.toBe(it.word);
      }
    }
  }
});

it('LV2 (allemand, espagnol) : la langue de la mission, la règle affichée, ¿ et ¡ jamais lus, une correction en français', () => {
  const defs = EXERCISES.filter((e) => e.lang === 'de' || e.lang === 'es');
  expect(defs.length).toBeGreaterThan(0);
  for (const def of defs) {
    // Une mission par langue : son identifiant dit sa langue (relais-de-hallo, relais-es-hola).
    expect(def.type.startsWith(`${def.lang}-`), def.id).toBe(true);
    expect(SCREEN_TYPES[def.type].component, def.id).toBe(CalculScreen);
    expect(def.items.length, def.id).toBe(8);
    for (const it of def.items) {
      const choices = it.choices as string[];
      expect(choices, `${def.id} ${it.key}`).toContain(it.answer);
      expect(choices.length).toBeGreaterThanOrEqual(2);
      expect(new Set(choices).size).toBe(choices.length);
      // Jamais deux réponses qui ne diffèrent que par une majuscule.
      expect(new Set(choices.map((c) => c.toLowerCase())).size, it.key).toBe(choices.length);
      expect(String(it.explanation).length).toBeGreaterThan(5);
      expect((it.aid as { kind: string }).kind).toBe('rule-card');
      for (const text of [it.question, it.prompt, it.spoken, it.hint, it.explanation, ...choices]) if (text !== undefined) expect(String(text), it.key).not.toContain("'");
      // ¿ et ¡ s'affichent, jamais lus. Pas de phrase à trou lue en LV2 (le mot lu pour le trou n'est pas décidé) : un
      // trou n'y sert qu'à la dictée à choix, un seul par item, et la voix dit le mot ou la phrase en entier.
      expect(String(it.spoken), it.key).not.toMatch(/[…¿¡]/);
      const prompt = String(it.prompt);
      if (prompt.includes('…')) {
        expect(def.programme?.some((id) => id.endsWith('.ecrire.dictee-fiche')), `${def.id} : un trou, seulement en dictée`).toBe(true);
        expect(prompt.split('…').length, it.key).toBe(2);
        expect(it.question, it.key).toBeUndefined();
        expect(String(it.spoken), it.key).toBe(prompt.replace('…', String(it.answer)).replace(/[¿¡]/g, ''));
      }
      if (it.question !== undefined) {
        expect(String(it.question), it.key).toMatch(/\?$/);
        expect(String(it.question), it.key).not.toMatch(/[£$€:]/);
        // Des réponses en français, sauf « Quelle phrase est vraie ? » (Refuge) : des phrases de la langue, dites exprès.
        expect(['fr', def.lang], it.key).toContain(it.choicesLang);
      }
    }
  }
});

it('LV2 : la bonne réponse ne se devine pas à sa longueur', () => {
  // Jamais strictement la plus longue ; et, parmi les items dont les choix n'ont pas tous la même longueur, au moins la
  // moitié où elle est plus courte qu'un piège. Hors listes rangées (heures, nombres). Le Refuge des carnets d'abord :
  // le Relais et le Jardin ont des items où la réponse est la plus longue, à reprendre à part (cadrage du contenu).
  const fautes: string[] = [];
  for (const def of EXERCISES.filter((e) => e.biome === 'refuge')) {
    let inegaux = 0;
    let plusCourte = 0;
    for (const it of def.items) {
      const choices = (it.choices as unknown[]).map(String);
      if (choices.every((c) => parseHour(c) !== undefined || parseNumber(c) !== undefined)) continue;
      const answer = String(it.answer);
      const pieges = choices.filter((c) => c !== answer).map((c) => c.length);
      if (answer.length > Math.max(...pieges)) fautes.push(`${it.key} : la réponse est la plus longue`);
      if (new Set(choices.map((c) => c.length)).size === 1) continue;
      inegaux++;
      if (answer.length < Math.max(...pieges)) plusCourte++;
    }
    if (plusCourte < Math.ceil(inegaux / 2)) fautes.push(`${def.id} : plus courte ${plusCourte} fois sur ${inegaux}`);
  }
  expect(EXERCISES.some((e) => e.biome === 'refuge')).toBe(true);
  expect(fautes).toEqual([]);
});

it('des choix qui sont tous des nombres de même unité sont rangés : sinon la réponse garde la place que lui donne le fichier', () => {
  const desordre: string[] = [];
  for (const def of EXERCISES)
    for (const it of def.items) {
      const choices = it.choices;
      if (!Array.isArray(choices) || choices.length < 2) continue;
      const lus = choices.map(parseNumber);
      if (!lus.every((l): l is Parsed => l !== undefined) || new Set(lus.map((l) => l.unit)).size > 1) continue;
      if (!lus.every((l, i) => i === 0 || l.value > lus[i - 1].value)) desordre.push(`${def.id} ${it.key}`);
    }
  expect(desordre).toEqual([]);
});

it('hors maths, placer les choix n’en invente aucun (pas de « 38 juin ») : seuls les calculs ont des pièges calculés', () => {
  const inventes: string[] = [];
  for (const def of EXERCISES) {
    if (piegesDe(def) === 'calcules') continue;
    for (const it of def.items) {
      const choices = it.choices;
      if (!Array.isArray(choices) || choices.length < 2) continue;
      // Des entiers qui se suivent (« 2, 3, 4 syllabes ») : une fenêtre qu'on décale, voulue.
      const n = choices.map(parseNumber);
      if (n.every((l): l is Parsed => l !== undefined && l.decimals === 0) && n.every((l, i) => i === 0 || l.value === n[i - 1].value + 1)) continue;
      for (let place = 0; place < choices.length; place++)
        for (const tirage of [0, 0.5, 0.99]) {
          const places = placeAnswer(choices, it.answer, place, () => tirage, 'du-fichier').map(String).sort();
          if (places.join('|') !== choices.map(String).sort().join('|')) inventes.push(`${def.id} ${it.key}`);
        }
    }
  }
  expect([...new Set(inventes)]).toEqual([]);
});

it('des choix qui sont des heures s’écrivent « H h MM » et sont rangés dans l’ordre de la journée, en partie aussi', () => {
  // « 5 h » à côté de « 5 h 30 » : une seule écriture, « 5 h 00 ». Une liste « 5 h, 17 h » reste une liste de nombres.
  const heure = /^\d{1,2} h( \d{2})?$/;
  const fautes: string[] = [];
  const rng = () => 0.99;
  for (const def of EXERCISES)
    for (const it of def.items) {
      const choices = it.choices;
      if (!Array.isArray(choices) || choices.length < 2 || !choices.every((c) => heure.test(String(c)))) continue;
      if (!choices.some((c) => / \d{2}$/.test(String(c)))) continue;
      const minutes = choices.map(parseHour);
      if (!minutes.every((m): m is number => m !== undefined)) fautes.push(`${def.id} ${it.key} : « H h MM »`);
      else if (!minutes.every((m, i) => i === 0 || m > minutes[i - 1])) fautes.push(`${def.id} ${it.key} : pas rangés`);
      else if (placeAnswer(choices, it.answer, 0, rng).join() !== choices.join()) fautes.push(`${def.id} ${it.key} : déplacés en partie`);
    }
  expect(fautes).toEqual([]);
});

it('hors maths, la bonne réponse d’une liste rangée (nombres, heures) change de rang d’un item à l’autre', () => {
  // Ses pièges sont ceux du fichier : la réponse garde la place de son rang. Sur une série, aucun rang ne revient plus
  // de ⌈items / choix⌉ + 1 fois (3 / 3 / 2 visé sur 8 items à trois choix). Les fenêtres d'entiers qui se suivent
  // (« 2, 3, 4 syllabes ») se décalent en partie : hors du compte.
  const trop: string[] = [];
  for (const def of EXERCISES) {
    if (piegesDe(def) !== 'du-fichier') continue;
    const rangs = new Map<number, number[]>();
    for (const it of def.items) {
      const choices = it.choices;
      if (!Array.isArray(choices) || choices.length < 2) continue;
      const heures = choices.map(parseHour);
      const n = choices.map(parseNumber);
      const enHeures = heures.every((h): h is number => h !== undefined);
      const enNombres = n.every((l): l is Parsed => l !== undefined && l.unit === n[0]!.unit);
      if (!enHeures && !enNombres) continue;
      if (!enHeures && n.every((l, i) => l!.decimals === 0 && (i === 0 || l!.value === n[i - 1]!.value + 1))) continue;
      const rang = choices.findIndex((c) => String(c) === String(it.answer));
      const compte = rangs.get(choices.length) ?? Array(choices.length).fill(0);
      compte[rang]++;
      rangs.set(choices.length, compte);
    }
    for (const [taille, compte] of rangs) {
      const total = compte.reduce((a, b) => a + b, 0);
      if (Math.max(...compte) > Math.ceil(total / taille) + 1) trop.push(`${def.id} : ${compte.join(' / ')}`);
    }
  }
  expect(trop).toEqual([]);
});

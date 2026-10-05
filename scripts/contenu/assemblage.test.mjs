import { readFileSync } from 'node:fs';
import { lireAssemblage, lireQuestions } from './assemblage.mjs';

const md = readFileSync('docs/contenu/assemblage.md', 'utf8');
const lire = (m) => () => lireAssemblage(m, 'assemblage.md');

describe('l’assemblage des blocs en Markdown', () => {
  it('lit le lieu et les recettes, avec les noms de chaque univers', () => {
    const a = lireAssemblage(md, 'assemblage.md');
    expect(a.lieu.blocland.titre).toBe('La Fabrique');
    expect(a.lieu.archipeo.titre).toBe('La Halle aux matériaux');
    expect(a.recettes[1]).toEqual({
      bloc: 'compound-5e',
      archipelago: '5e',
      ingredients: [
        { bloc: 'maths-5e-signed-numbers', n: 2 },
        { bloc: 'french-5e-homophones', n: 1 },
      ],
      noms: { blocland: { nom: 'Vitrail', pluriel: 'vitraux' }, archipeo: { nom: 'Hublot' } },
    });
  });

  it('refuse une recette mal écrite, un archipel en double ou un univers sans nom', () => {
    expect(lire(md.replace('french-6e-phonology × 2', 'french-6e-phonology x 2'))).toThrow(/bloc × nombre/);
    expect(lire(md.replace('| `compound-5e` | 5e', '| `compound-5e` | 6e'))).toThrow(/déjà son bloc assemblé/);
    expect(lire(md.replace(/^\| `archipeo` .*$/m, ''))).toThrow(/ligne de tableau attendue|univers « archipeo »/);
    expect(lire(md.replace('## Le lieu', '## Lieu'))).toThrow(/« ## Le lieu » manque/);
  });
});

describe('les questions des blocs assemblés en Markdown', () => {
  // Un extrait écrit ici : le contenu de docs/contenu/assemblage.md, lui, est vérifié par src/game/exercises/assembly.test.ts.
  const base = md.slice(0, md.includes('\n## Les questions') ? md.indexOf('\n## Les questions') : md.length).trimEnd();
  const questions = [
    '## Les questions',
    '',
    '> Une note.',
    '',
    '### La poutre · `compound-6e`',
    '',
    '- compétences : c3.fr.langue.genre-nombre · c3.ma.nombres.problemes',
    '- consigne : Lis, calcule, puis choisis la bonne réponse.',
    '- bravo : Bien assemblé !',
    '- erreur : {explanation}',
    '',
    '1. énoncé : "Léa a 5 billes.\\nElle en donne 4 à Tom."',
    '   - question : Quelle phrase est juste ?',
    '   - choix : Il lui reste 1 bille. · Il lui reste 1 billes. · Il lui reste 9 billes.',
    '   - réponse : Il lui reste 1 bille.',
    '   - aide « Un ou plusieurs ? » :',
    '     - Donner, c’est enlever.',
    '2. clé : compound-6e-billes',
    '   - énoncé : Tom a 8 billes.',
    '   - choix : 3 · 6 · 10',
    '   - réponse : 10',
    '',
    '### L’engrenage · `compound-4e`',
    '',
    '- compétences : c4.ma.a.puissances · c4.en.langue.lexique',
    '- langue : en',
    '- consigne : Lis la phrase en anglais, calcule, puis choisis la bonne réponse.',
    '- bravo : Bien assemblé !',
    '- erreur : {explanation}',
    '',
    'Pour tous les items :',
    '- langue des choix : fr',
    '',
    '1. énoncé : Nine squared.',
    '   - choix : 18 · 81 · 92',
    '   - réponse : 81',
    '',
  ].join('\n');
  const avec = (q) => `${base}\n\n${q}`;
  const blocs = ['compound-6e', 'compound-5e', 'compound-4e', 'compound-3e'];
  const lireQ = (q) => () => lireQuestions(avec(q), 'assemblage.md', blocs);

  it('lit une question par bloc, au format d’un exercice, avec ses clés « <bloc>-<rang> »', () => {
    const [poutre, engrenage] = lireQuestions(avec(questions), 'assemblage.md', blocs);
    expect(Object.keys(poutre)).toEqual(['id', 'bloc', 'type', 'level', 'instruction', 'programme', 'items', 'feedback']);
    expect(poutre).toMatchObject({
      id: 'assembly-compound-6e',
      bloc: 'compound-6e',
      type: 'assembly',
      programme: ['c3.fr.langue.genre-nombre', 'c3.ma.nombres.problemes'],
      feedback: { correct: 'Bien assemblé !', wrong: '{explanation}' },
    });
    expect(poutre.items.map((it) => it.key)).toEqual(['compound-6e-0', 'compound-6e-billes']);
    expect(poutre.items[0]).toMatchObject({ prompt: 'Léa a 5 billes.\nElle en donne 4 à Tom.', question: 'Quelle phrase est juste ?' });
    expect(poutre.items[0].aid).toEqual({ kind: 'rule-card', props: { title: 'Un ou plusieurs ?', lines: ['Donner, c’est enlever.'] } });
    expect(engrenage).toMatchObject({ id: 'assembly-compound-4e', lang: 'en' });
    expect(engrenage.items[0]).toMatchObject({ key: 'compound-4e-0', choicesLang: 'fr' });
    // Sans la section, aucune question.
    expect(lireQuestions(base, 'assemblage.md', blocs)).toEqual([]);
  });

  it('refuse ce qui rapporterait quelque chose, un bloc inconnu, et donne la ligne du fichier', () => {
    expect(lireQ(questions.replace('- bravo : Bien assemblé !', '- XP : 3'))).toThrow(/ne rapporte rien/);
    expect(lireQ(questions.replace('- bravo : Bien assemblé !', '- monte à : 0.8'))).toThrow(/n’adapte aucun niveau/);
    expect(lireQ(questions.replace('`compound-6e`', '`french-6e-phonology`'))).toThrow(/bloc assemblé « french-6e-phonology » inconnu/);
    expect(lireQ(questions.replace('`compound-4e`', '`compound-6e`'))).toThrow(/écrites deux fois/);
    expect(lireQ(questions.replace(/^- compétences : c4.*$/m, ''))).toThrow(/« compétences » manque/);
    const fautif = avec(questions.replace('   - réponse : 10', '   - couleur : bleu'));
    const ligne = fautif.split('\n').indexOf('   - couleur : bleu') + 1;
    expect(() => lireQuestions(fautif, 'assemblage.md', blocs)).toThrow(`assemblage.md, ligne ${ligne} : champ inconnu « couleur »`);
    expect(lireQ(questions.replace('2. clé : compound-6e-billes', '2. clé : compound-6e-0'))).toThrow(/même clé « compound-6e-0 »/);
  });
});

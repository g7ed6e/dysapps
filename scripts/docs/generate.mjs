// Pages « vivantes » de la documentation : elles sont produites au build à partir des données du jeu
// (biomes, exercices, plans, ouvrages, succès, quêtes du portail), jamais écrites à la main.
// Le code source est chargé par Vite (TypeScript, JSON, JSX), comme le fait l'application.
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';

const root = process.cwd();

/** Charge les modules du jeu et renvoie les pages générées : { path, title, body } (chemin relatif à docs/). */
export async function generatePages() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const load = (p) => server.ssrLoadModule(p);
    const [biomesMod, exercisesMod, plansMod, archMod, engineMod, progressMod, settingsMod, homophonesMod, tablesMod, fractionsMod, decimauxMod, registryMod, subjectMod] =
      await Promise.all([
        load('/src/blocland/biomes.ts'),
        load('/src/blocland/exercises/index.ts'),
        load('/src/blocland/world/plans.ts'),
        load('/src/blocland/world/archipelago.ts'),
        load('/src/blocland/engine.ts'),
        load('/src/core/progress.ts'),
        load('/src/core/settings.ts'),
        load('/src/apps/homophones/data.ts'),
        load('/src/apps/tables/generators.tsx'),
        load('/src/apps/fractions/generators.tsx'),
        load('/src/apps/decimaux/generators.tsx'),
        load('/src/apps/registry.ts'),
        load('/src/core/subjectProgress.ts'),
      ]);
    const texts = JSON.parse(readFileSync(new URL('../../src/apps/lecture/texts.json', import.meta.url), 'utf8'));
    const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
    const data = {
      version: pkg.version,
      BIOMES: biomesMod.BIOMES,
      BLOCKS: biomesMod.BLOCKS,
      EXERCISES: exercisesMod.EXERCISES,
      PLANS: plansMod.PLANS,
      BRIDGES: archMod.BRIDGES,
      KIND_NAME: archMod.KIND_NAME,
      CONDITION_OF: archMod.CONDITION_OF,
      START_ISLANDS: archMod.START_ISLANDS,
      engine: engineMod,
      progress: progressMod,
      settings: settingsMod,
      homophones: homophonesMod,
      tables: tablesMod,
      fractions: fractionsMod,
      decimaux: decimauxMod,
      APPS: registryMod.APPS,
      SUBJECTS: registryMod.SUBJECTS,
      subjectProgress: subjectMod,
      texts,
    };
    return [
      archipelPage(data),
      ...data.BIOMES.map((b) => islandPage(b, data)),
      homophonesPage(data),
      lecturePage(data),
      mathsPortailPage(data),
      ouvragesPage(data),
      baremePage(data),
    ];
  } finally {
    await server.close();
  }
}

// ---------- Outils ----------

const SUBJECT_NAME = { francais: 'Français', maths: 'Maths' };
const CONDITION_TEXT = {
  aucune: 'aucune condition',
  plan: 'le premier plan de l’île de départ terminé',
  gardien: 'le Gardien de l’île de départ vaincu',
};
const AID_NAME = {
  dots: 'grille de points (par cinq)',
  ten: 'boîte de dix',
  jumps: 'droite par bonds',
  'compare-bars': 'barres alignées',
  'dot-groups': 'groupes de points',
  'decimal-table': 'tableau de numération',
  'number-line': 'droite graduée avec négatifs',
  'ratio-table': 'tableau de proportionnalité ou de valeurs',
  'bar-list': 'série en barres',
  'rule-card': 'rappel de règle',
  'right-triangle': 'triangle rectangle codé',
  'thales-figure': 'configuration de Thalès',
  'value-table': 'tableau de valeurs',
};

/** Échappe le texte pour une cellule ou une ligne de tableau Markdown. */
function cell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function table(headers, rows) {
  const line = (cells) => `| ${cells.map(cell).join(' | ')} |`;
  return [line(headers), `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map(line)].join('\n');
}

function percent(x) {
  return `${Math.round(x * 100)} %`;
}

function plural(n, one, many = `${one}s`) {
  return `${n} ${n > 1 ? many : one}`;
}

const CLASSES = ['6e', '5e', '4e', '3e'];

function aidOf(exercise) {
  const kinds = new Set(exercise.items.map((it) => it.aid?.kind).filter(Boolean));
  if (kinds.size === 0) return '';
  return [...kinds].map((k) => AID_NAME[k] ?? k).join(', ');
}

/** Rendu d'un item d'exercice en une ligne lisible, selon sa forme. */
function describeItem(item) {
  if (item.prompt && Array.isArray(item.choices)) {
    return `${item.prompt} → **${item.answer}** (${item.choices.join(' / ')})`;
  }
  if (item.subject) {
    return `${item.subject} → **${item.answer === 'singulier' ? item.singular : item.plural}** (${item.singular} / ${item.plural})`;
  }
  if (item.meaning) {
    return `« ${item.meaning} » → **${item.word}** (${item.slot === 'prefix' ? 'préfixe' : 'suffixe'} ${item.answer}, racine ${item.root})`;
  }
  if (item.before !== undefined && item.after !== undefined) {
    return `${item.before}…${item.after} → **${item.word}** (${item.choices.join(' / ')})`;
  }
  if (item.letter !== undefined) {
    return `${item.letter}${item.target ? ` (cible ${item.target})` : ''} : ${item.correct ? 'à piocher' : 'à laisser passer'}`;
  }
  if (item.word && item.correct !== undefined) {
    return `${item.image ? `${item.image} ` : ''}${item.word} : ${item.correct ? 'oui' : 'non'}${item.heard ? ` (${item.heard})` : ''}${item.ending ? ` (${item.ending})` : ''}`;
  }
  if (item.word && Array.isArray(item.choices)) {
    return `${item.sentence ? `« ${item.sentence} » ` : ''}→ **${item.word}** (${item.choices.join(' / ')})`;
  }
  if (item.text) return item.text;
  return '`' + JSON.stringify(item) + '`';
}

// ---------- Pages ----------

function archipelPage(d) {
  const { BIOMES, EXERCISES, PLANS, BRIDGES } = d;
  const items = EXERCISES.reduce((n, e) => n + e.items.length, 0);
  const quests = BIOMES.reduce((n, b) => n + b.exercises.length, 0);
  const lines = [
    '# L’archipel Blocland',
    '',
    'Cette page est produite à chaque build à partir des données du jeu (`src/blocland/biomes.ts`, `src/blocland/exercises/`). Elle décrit exactement ce que contient la version publiée.',
    '',
    '| | |',
    '| --- | --- |',
    `| Version | ${d.version} |`,
    `| Îles | ${BIOMES.length} (${BIOMES.filter((b) => b.subject === 'francais').length} de français, ${BIOMES.filter((b) => b.subject === 'maths').length} de maths) |`,
    `| Quêtes | ${quests} |`,
    `| Exercices (variantes et niveaux) | ${EXERCISES.length}, dont ${EXERCISES.filter((e) => e.generate).length} générés |`,
    `| Items de référence | ${items} |`,
    `| Plans à construire | ${PLANS.length} |`,
    `| Ouvrages entre les îles | ${BRIDGES.length} |`,
    '',
    'Chaque île est un thème du programme. Elle a sa créature qui donne les quêtes, son bloc de construction, ses trois plans et son Gardien. Les îles s’ouvrent en construisant des ouvrages avec les blocs gagnés : voir [Ouvrages et plans](ouvrages.md).',
    '',
  ];
  for (const classe of CLASSES) {
    for (const subject of ['francais', 'maths']) {
      const list = BIOMES.filter((b) => b.classe === classe && b.subject === subject);
      if (list.length === 0) continue;
      lines.push(`## ${SUBJECT_NAME[subject]} — ${classe}`, '');
      lines.push(
        table(
          ['Île', 'Module', 'Créature', 'Gardien', 'Bloc', 'Quêtes'],
          list.map((b) => [
            `[${b.name}](iles/${b.id}.md)`,
            b.module,
            `${b.creature.name}, ${b.creature.species}`,
            b.guardian,
            d.BLOCKS[b.block].name,
            b.exercises.map((e) => e.title).join(', '),
          ]),
        ),
        '',
      );
    }
  }
  lines.push('## Types d’écrans', '', 'Chaque quête utilise un type d’écran (champ `type` de l’exercice). Les mêmes règles s’appliquent partout : consigne lue à voix haute, un seul geste par item, correction qui explique, indice jamais pénalisant, pas de chrono.', '');
  const types = new Map();
  for (const b of BIOMES) for (const e of b.exercises) types.set(e.id, { ...e, islands: [...(types.get(e.id)?.islands ?? []), b.name] });
  lines.push(
    table(
      ['Type', 'Quête', 'Ce que fait l’élève', 'Exercices'],
      [...types.values()].map((t) => [t.id, t.title, t.description, String(EXERCISES.filter((e) => e.type === t.id).length)]),
    ),
    '',
  );
  return { path: 'pedagogie/archipel.md', title: 'L’archipel Blocland', body: lines.join('\n') };
}

function islandPage(b, d) {
  const { EXERCISES, PLANS, BRIDGES, BLOCKS, KIND_NAME, CONDITION_OF } = d;
  const plans = PLANS.filter((p) => p.biome === b.id);
  const bridges = BRIDGES.filter((br) => br.from === b.id || br.to === b.id);
  const name = (id) => d.BIOMES.find((x) => x.id === id)?.name ?? id;
  const lines = [
    `# ${b.name}`,
    '',
    `**${SUBJECT_NAME[b.subject]} · ${b.classe} · ${b.module}.** ${b.description}`,
    '',
    '| | |',
    '| --- | --- |',
    `| Créature | ${b.creature.name}, ${b.creature.species} |`,
    `| Gardien | ${b.guardian} |`,
    `| Bloc gagné | ${BLOCKS[b.block].name} |`,
    `| Quêtes | ${b.exercises.length} |`,
    `| Exercices | ${EXERCISES.filter((e) => e.biome === b.id).length} |`,
    `| Départ | ${d.START_ISLANDS.includes(b.id) ? 'île ouverte dès le début' : 'à ouvrir par un ouvrage'} |`,
    '',
    '## La créature',
    '',
    `À l’arrivée, ${b.creature.name} dit : « ${b.creature.greeting} »`,
    '',
    'Quand on la touche dans le village :',
    '',
    ...b.creature.lines.map((l) => `- « ${l} »`),
    '',
    `Quand sa maison est finie : « ${b.creature.home} »`,
    '',
    '## Le Gardien',
    '',
    `${b.challenge}`,
    '',
    'Le défi enchaîne deux manches de chaque quête de l’île, au niveau de l’élève, sans chrono. Deux étoiles le font tomber.',
    '',
    `- Épreuve réussie : « ${b.guardianSays.hit} »`,
    `- Épreuve ratée : « ${b.guardianSays.miss} »`,
    `- Vaincu : « ${b.guardianSays.beaten} »`,
    '',
    '## Les quêtes',
    '',
  ];
  for (const q of b.exercises) {
    const exos = EXERCISES.filter((e) => e.biome === b.id && e.type === q.id).sort((a, c) => a.level - c.level);
    lines.push(`### ${q.title}`, '', `*${q.description}*`, '');
    if (exos.length === 0) {
      lines.push('Aucun exercice n’est encore écrit pour cette quête.', '');
      continue;
    }
    lines.push(
      table(
        ['Exercice', 'Niveau', 'Items', 'Origine', 'Aide visuelle', 'Récompense', 'Monte à / descend à'],
        exos.map((e) => [
          `\`${e.id}\``,
          String(e.level),
          e.perRun && e.perRun < e.items.length ? `${e.items.length} (${e.perRun} joués par partie)` : String(e.items.length),
          e.generate ? 'généré (autres nombres à chaque partie)' : 'écrit à la main',
          aidOf(e) || '—',
          `${e.reward.amount} ${BLOCKS[e.reward.block].name.toLowerCase()}, ${e.reward.xp} XP`,
          `${percent(e.adaptive.promoteAt)} / ${percent(e.adaptive.demoteAt)}`,
        ]),
      ),
      '',
    );
    for (const e of exos) {
      lines.push(`#### \`${e.id}\` (niveau ${e.level})`, '', `Consigne : « ${e.instruction} »`, '');
      lines.push(`Correction : « ${e.feedback.correct} » quand c’est juste ; sinon « ${e.feedback.wrong} » (les accolades sont remplacées par le mot, ce qu’on entend ou la réponse).`, '');
      const heading = e.generate ? 'Items de référence (une partie tire d’autres nombres) :' : 'Items :';
      lines.push('<details>', `<summary>${heading} ${e.items.length}</summary>`, '');
      lines.push(...e.items.map((it) => `- ${describeItem(it)}`), '', '</details>', '');
    }
  }
  lines.push('## Les plans', '');
  if (plans.length) {
    lines.push(
      table(
        ['Plan', 'Blocs', 'XP', 'Coffre', 'La créature dit'],
        plans.map((p) => {
          const byBlock = {};
          for (const c of p.cells) byBlock[c.block] = (byBlock[c.block] ?? 0) + 1;
          const blocks = Object.entries(byBlock)
            .map(([k, n]) => `${n} ${BLOCKS[k]?.name.toLowerCase() ?? k}`)
            .join(', ');
          const chest = Object.entries(p.reward.chest)
            .map(([k, n]) => `${n} ${BLOCKS[k]?.name.toLowerCase() ?? k}`)
            .join(', ');
          return [p.name, `${p.cells.length} (${blocks})`, String(p.reward.xp), chest || '—', `« ${p.done} »`];
        }),
      ),
      '',
    );
  }
  lines.push('## Les ouvrages', '');
  lines.push(
    table(
      ['Ouvrage', 'Relie', 'Coût', 'Condition'],
      bridges.map((br) => [
        KIND_NAME[br.kind],
        `${name(br.from)} ↔ ${name(br.to)}`,
        br.cost === 0 ? 'déjà construit' : plural(br.cost, 'bloc'),
        CONDITION_TEXT[CONDITION_OF[br.kind]],
      ]),
    ),
    '',
  );
  return { path: `pedagogie/iles/${b.id}.md`, title: b.name, body: lines.join('\n') };
}

function homophonesPage(d) {
  const { SETS, LEVELS, QUESTIONS_PER_QUEST } = d.homophones;
  const lines = [
    '# Homophones (quête du portail)',
    '',
    `Quête **Français** du portail. ${SETS.length} jeux d’homophones répartis en ${LEVELS.length} niveaux ; une quête de niveau tire ${QUESTIONS_PER_QUEST} phrases parmi les jeux du niveau, l’entraînement ciblé travaille un seul jeu. Le joker donne l’astuce de remplacement, la correction rappelle la règle. Les phrases sont dans \`src/apps/homophones/sets.json\` et vérifiées par les tests : un seul trou, jamais en début de phrase, chaque réponse travaillée.`,
    '',
    'Les mêmes phrases servent dans Blocland : le **Tri des graines** (Ferme des accords) et les **Panneaux** (Carrefour des homophones).',
    '',
  ];
  for (const lvl of LEVELS) {
    const sets = SETS.filter((s) => s.level === lvl.level);
    lines.push(`## Niveau ${lvl.level} : ${lvl.title}`, '');
    lines.push(table(['Jeu', 'Choix', 'Astuce (joker)', 'Phrases'], sets.map((s) => [s.label, s.choices.join(' / '), s.hint, String(s.sentences.length)])), '');
    for (const s of sets) {
      lines.push(`### ${s.label}`, '');
      lines.push(...Object.entries(s.rules).map(([k, r]) => `- **${k}** : ${r}`), '');
      lines.push('<details>', `<summary>Phrases : ${s.sentences.length}</summary>`, '');
      lines.push(...s.sentences.map((p) => `- ${p.text.replace('…', `**${p.answer}**`)}`), '', '</details>', '');
    }
  }
  return { path: 'pedagogie/homophones.md', title: 'Homophones', body: lines.join('\n') };
}

function lecturePage(d) {
  const lines = [
    '# Lecture (quête du portail)',
    '',
    `Quête **Français** du portail : ${d.texts.length} textes du domaine public, une ligne par vers ou par phrase, couleurs alternées, lecture à voix haute qui surligne la ligne lue, mots difficiles expliqués, puis des questions de compréhension. Le joker cite le passage à relire ; le texte reste consultable pendant les questions. Textes et questions sont dans \`src/apps/lecture/texts.json\`.`,
    '',
    table(
      ['Texte', 'Auteur', 'Source', 'Forme', 'Lignes', 'Mots expliqués', 'Questions'],
      d.texts.map((t) => [
        t.title,
        t.author,
        t.source,
        t.kind === 'vers' ? 'vers' : 'prose',
        String(t.paragraphs.reduce((n, p) => n + p.length, 0)),
        String(t.glossary.length),
        String(t.questions.length),
      ]),
    ),
    '',
  ];
  for (const t of d.texts) {
    lines.push(`## ${t.title}`, '', `${t.author} — ${t.source}.`, '');
    lines.push('**Mots expliqués**', '', ...t.glossary.map((g) => `- *${g.word}* : ${g.definition}`), '');
    lines.push('**Questions**', '');
    lines.push(...t.questions.map((q) => `- ${q.prompt} → **${q.answer}** (${q.choices.join(' / ')})${q.explanation ? ` — ${q.explanation}` : ''}`), '');
  }
  return { path: 'pedagogie/lecture.md', title: 'Lecture', body: lines.join('\n') };
}

/** Générateur pseudo-aléatoire reproductible : les exemples de la doc sont stables d'un build à l'autre. */
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function sampleQuestions(make, count) {
  try {
    const qs = make(seeded(42));
    return qs.slice(0, count).map((q) => {
      const prompt = typeof q.prompt === 'string' ? q.prompt : q.spokenPrompt ?? '(énoncé avec figure)';
      return `- ${prompt} → **${q.answer}** (${q.choices.join(' / ')})${q.hint ? ` — joker : ${q.hint}` : ''}`;
    });
  } catch (err) {
    return [`- (exemples indisponibles : ${err.message})`];
  }
}

function mathsPortailPage(d) {
  const apps = [
    { app: d.APPS.find((a) => a.id === 'tables'), quests: d.tables.QUESTS, per: d.tables.QUESTIONS_PER_QUEST, make: (q) => (rng) => q.make(rng) },
    { app: d.APPS.find((a) => a.id === 'fractions'), quests: d.fractions.QUESTS, per: d.fractions.QUESTIONS_PER_QUEST, make: (q) => (rng) => q.makeWith(rng) },
    { app: d.APPS.find((a) => a.id === 'decimaux'), quests: d.decimaux.QUESTS, per: d.decimaux.QUESTIONS_PER_QUEST, make: (q) => (rng) => q.makeWith(rng) },
  ];
  const lines = [
    '# Maths (quêtes du portail)',
    '',
    'Les trois quêtes de maths du portail génèrent leurs questions au hasard à chaque séance : quatre réponses rangées dans l’ordre croissant, des pièges tirés des erreurs fréquentes, un joker qui donne une astuce et une aide visuelle. Les mêmes générateurs alimentent les îles de maths 6e de Blocland (Plaine des nombres, Rivière des fractions, Volcan des décimaux).',
    '',
    'Les exemples ci-dessous sont tirés avec une graine fixe : ils changent quand les générateurs changent, pas d’un build à l’autre.',
    '',
  ];
  for (const { app, quests, per, make } of apps) {
    lines.push(`## ${app.title}`, '', `${app.description} ${per} questions par quête.`, '');
    lines.push(table(['Quête', 'Détail'], quests.map((q) => [q.title, q.detail])), '');
    for (const q of quests) {
      lines.push(`### ${q.title}`, '', `*${q.detail}.* Exemples :`, '', ...sampleQuestions(make(q), 3), '');
    }
    if (app.id === 'tables') {
      lines.push(`### Réviser une table`, '', `Une quête libre par table : ${d.tables.TABLES.map((t) => `× ${t}`).join(', ')}.`, '');
    }
  }
  return { path: 'pedagogie/maths-portail.md', title: 'Maths du portail', body: lines.join('\n') };
}

function ouvragesPage(d) {
  const { BRIDGES, PLANS, BLOCKS, KIND_NAME, CONDITION_OF } = d;
  const name = (id) => d.BIOMES.find((x) => x.id === id)?.name ?? id;
  const lines = [
    '# Ouvrages et plans',
    '',
    `Les ${BRIDGES.length} ouvrages relient les ${d.BIOMES.length} îles. Un ouvrage se construit depuis le panneau d’une île ouverte qu’il touche et coûte des blocs gagnés sur n’importe quelle île (jamais les kits de finition des plans). Certains demandent en plus une condition. Îles ouvertes au départ : ${d.START_ISLANDS.map(name).join(' et ')}.`,
    '',
    '## Natures d’ouvrage',
    '',
    table(
      ['Nature', 'Condition en plus des blocs', 'Nombre'],
      Object.keys(KIND_NAME).map((k) => [KIND_NAME[k], CONDITION_TEXT[CONDITION_OF[k]], String(BRIDGES.filter((b) => b.kind === k).length)]),
    ),
    '',
    '## Tous les ouvrages',
    '',
    table(
      ['De', 'Vers', 'Nature', 'Coût', 'Condition'],
      BRIDGES.map((b) => [name(b.from), name(b.to), KIND_NAME[b.kind], b.cost === 0 ? 'déjà construit' : plural(b.cost, 'bloc'), CONDITION_TEXT[CONDITION_OF[b.kind]]]),
    ),
    '',
    '## Les plans',
    '',
    `${PLANS.length} plans, trois par île, enchaînés : le bâtiment, puis son toit (porte et lanterne), puis sa cour (barrières et escalier). Les blocs de finition viennent des coffres, jamais des exercices.`,
    '',
    table(
      ['Île', 'Plan', 'Blocs', 'XP', 'Coffre'],
      PLANS.map((p) => {
        const chest = Object.entries(p.reward.chest)
          .map(([k, n]) => `${n} ${BLOCKS[k]?.name.toLowerCase() ?? k}`)
          .join(', ');
        return [`[${name(p.biome)}](iles/${p.biome}.md)`, p.name, String(p.cells.length), String(p.reward.xp), chest || '—'];
      }),
    ),
    '',
  ];
  return { path: 'pedagogie/ouvrages.md', title: 'Ouvrages et plans', body: lines.join('\n') };
}

function baremePage(d) {
  const { XP, BADGES, xpToNextLevel, rankForLevel, LEGEND_LEVEL } = d.progress;
  const { INTERVALS, GRADUATE_AT, CHEST_EVERY, CHEST_BLOCKS, PROMOTE_AT_ONCE, FIRST_TIME_BLOCKS } = d.engine;
  const { DEFAULT_SETTINGS, FONT_LABELS, THEME_LABELS, MIN_FONT_SIZE, MIN_LINE_HEIGHT } = d.settings;
  const { APP_REWORK_BELOW, REWORK_SHOWN } = d.subjectProgress;
  const levels = [];
  let total = 0;
  for (let l = 1; l <= LEGEND_LEVEL; l++) {
    levels.push([String(l), rankForLevel(l).title, String(total), String(xpToNextLevel(l))]);
    total += xpToNextLevel(l);
  }
  const lines = [
    '# Barème, succès et valeurs par défaut',
    '',
    'Les nombres de cette page viennent du code (`src/core/progress.ts`, `src/blocland/engine.ts`, `src/core/subjectProgress.ts`, `src/core/settings.ts`).',
    '',
    '## Points d’expérience (quêtes du portail)',
    '',
    table(
      ['Évènement', 'XP'],
      [
        ['Bonne réponse du premier coup', String(XP.firstTry)],
        ['Bonne réponse après une erreur ou avec le joker', String(XP.afterRetry)],
        ['Réponse fausse (point d’effort)', String(XP.effort)],
        ['Quête terminée', String(XP.sessionBonus)],
        ['Bonus quête parfaite (100 %)', String(XP.perfectBonus)],
      ],
    ),
    '',
    '## Niveaux et rangs',
    '',
    `Trois divisions par rang, puis Légende à partir du niveau ${LEGEND_LEVEL}. L’XP gagnée dans Blocland compte aussi.`,
    '',
    table(['Niveau', 'Rang', 'XP cumulée pour y arriver', 'XP jusqu’au suivant'], levels),
    '',
    '## Succès',
    '',
    table(['Succès', 'Condition'], BADGES.map((b) => [b.title, b.description])),
    '',
    '## Moteur Blocland',
    '',
    table(
      ['Règle', 'Valeur'],
      [
        ['Score d’un item', '1 point du premier coup, ½ avec aide ou après une erreur'],
        ['Étoiles', '1 = terminé, 2 = au moins 70 %, 3 = au moins 90 % (la meilleure est gardée)'],
        ['Blocs', `proportionnels au score, jamais 0 dès une bonne réponse ; +1 à deux étoiles, +2 à trois ; +${FIRST_TIME_BLOCKS} la première fois qu’une quête est jouée`],
        ['XP', '+50 % sans aide ni erreur'],
        ['Répétition espacée des items ratés', `J+${INTERVALS.join(', J+')} ; sortie après ${GRADUATE_AT} réussites d’affilée`],
        ['Régularité', `un coffre de ${CHEST_BLOCKS} blocs tous les ${CHEST_EVERY} jours de suite ; la série se fissure après un jour manqué, réparable le lendemain`],
        ['Adaptation du niveau', `monte après deux parties au-dessus du seuil de la quête, ou une seule à ${percent(PROMOTE_AT_ONCE)} ; descend après deux parties sous le seuil bas, sans jamais l’afficher comme une baisse`],
        ['Pause', 'proposée après 3 exercices ou 10 minutes'],
      ],
    ),
    '',
    '## À retravailler (page Succès)',
    '',
    table(
      ['Règle', 'Valeur'],
      [
        ['Quête de Blocland proposée', 'déjà jouée, moins de 3 étoiles, sur une île ouverte'],
        ['Quête du portail proposée', `record sous ${APP_REWORK_BELOW} %`],
        ['Ordre', 'du score le plus faible au plus fort ; à score égal, le moins d’étoiles d’abord'],
        ['Nombre affiché par matière', `${REWORK_SHOWN} au plus (les autres sont comptées)`],
      ],
    ),
    '',
    '## Réglages par défaut',
    '',
    table(
      ['Réglage', 'Valeur par défaut', 'Bornes'],
      [
        ['Police', FONT_LABELS[DEFAULT_SETTINGS.font], Object.values(FONT_LABELS).join(', ')],
        ['Taille du texte', `${DEFAULT_SETTINGS.fontSize} px`, `${MIN_FONT_SIZE} à 32 px`],
        ['Espace entre les lignes', String(DEFAULT_SETTINGS.lineHeight), `${MIN_LINE_HEIGHT} à 2,4`],
        ['Espace entre les lettres', `${DEFAULT_SETTINGS.letterSpacing} em`, '0 à 0,2 em'],
        ['Espace entre les mots', `${DEFAULT_SETTINGS.wordSpacing} em`, '0 à 0,5 em'],
        ['Thème', THEME_LABELS[DEFAULT_SETTINGS.theme], Object.values(THEME_LABELS).join(', ')],
        ['Vitesse de lecture', String(DEFAULT_SETTINGS.speechRate), '0,5 à 1,3'],
        ['Lire les consignes à voix haute', DEFAULT_SETTINGS.autoRead ? 'oui' : 'non', ''],
        ['Syllabes en couleurs', DEFAULT_SETTINGS.syllables ? 'oui' : 'non', ''],
        ['Réduire les animations', DEFAULT_SETTINGS.reduceMotion ? 'oui' : 'non', ''],
        ['Vues en 3D', DEFAULT_SETTINGS.view3d ? 'oui' : 'non', ''],
        ['Sons du village', DEFAULT_SETTINGS.sounds ? 'oui' : 'non', ''],
        ['Ambiance sonore', DEFAULT_SETTINGS.ambience ? 'oui' : 'non', ''],
      ],
    ),
    '',
  ];
  return { path: 'pedagogie/bareme.md', title: 'Barème et succès', body: lines.join('\n') };
}

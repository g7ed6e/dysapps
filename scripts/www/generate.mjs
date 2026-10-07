// Pages « vivantes » de la documentation : elles sont produites au build à partir des données du jeu
// (biomes, exercices, plans, ouvrages, monuments, succès, missions du portail), jamais écrites à la main.
// Le code source est chargé par Vite (TypeScript, JSON, JSX), comme le fait l'application.
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { appVersion } from '../version.mjs';
import { exerciseMeta } from '../exerciseMeta.mjs';

/** Majuscule en tête de cellule (« Le Grand Chêne »). */
const capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const root = process.cwd();

/** Charge les modules du jeu et renvoie les pages générées : { path, title, body } (chemin relatif à www/). */
export async function generatePages() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    // L'index des exercices (`./data/*.json?meta`), comme dans l'application.
    plugins: [exerciseMeta()],
  });
  try {
    const load = (p) => server.ssrLoadModule(p);
    const [biomesMod, exercisesMod, plansMod, archMod, engineMod, progressMod, settingsMod, homophonesMod, tablesMod, fractionsMod, decimauxMod, registryMod, subjectMod, vocabulaireMod, irreguliersMod, programmeMod, exclusionsMod, motsOutilsMod] =
      await Promise.all([
        load('/src/game/biomes.ts'),
        load('/src/game/exercises/index.ts'),
        load('/src/game/world/plans.ts'),
        load('/src/game/world/archipelago.ts'),
        load('/src/game/engine.ts'),
        load('/src/core/progress.ts'),
        load('/src/core/settings.ts'),
        load('/src/apps/homophones/data.ts'),
        load('/src/apps/tables/generators.tsx'),
        load('/src/apps/fractions/generators.tsx'),
        load('/src/apps/decimaux/generators.tsx'),
        load('/src/apps/registry.ts'),
        load('/src/core/subjectProgress.ts'),
        load('/src/apps/vocabulaire/data.ts'),
        load('/src/apps/irreguliers/data.ts'),
        load('/src/curriculum/index.ts'),
        load('/src/curriculum/exclusions.ts'),
        load('/src/curriculum/functionWords.ts'),
      ]);
    // La géométrie des liaisons (GD-9) : sans elle, les règles n'ont ni nature ni longueur (`provideLinkGeometry`).
    await load('/src/game/world/linkGeometry.ts');
    const vehicleMod = await load('/src/game/world/vehicle.ts');
    const monumentsMod = await load('/src/game/world/monuments.ts');
    const recettesMod = await load('/src/game/world/recipes.ts');
    const partiesMod = await load('/src/game/world/parts.ts');
    // Les commandes des créatures (GD-7) : qui demande quoi, contre quoi.
    const commandesMod = await load('/src/game/world/requests.ts');
    // Les textes d'univers (Gardiens, espèces) : ceux de l'univers par défaut, Blocland.
    const universMod = await load('/src/universes/index.ts');
    const universCore = await load('/src/core/universe.ts');
    const legacyMod = await load('/src/core/legacyIds.ts');
    const texts = JSON.parse(readFileSync(new URL('../../src/apps/lecture/texts.json', import.meta.url), 'utf8'));
    const data = {
      version: appVersion(root),
      BIOMES: biomesMod.BIOMES,
      BLOCKS: biomesMod.BLOCKS,
      TEXTES: universMod.textesDe(universMod.universAffiche()),
      UNIVERS: universCore.UNIVERS,
      UNIVERS_PAR_DEFAUT: universCore.UNIVERS_PAR_DEFAUT,
      blockCount: biomesMod.blockCount,
      EXERCISES: await exercisesMod.loadAllExercises(),
      PLANS: plansMod.PLANS,
      partiesDe: partiesMod.partiesDe,
      commandeDeLIle: commandesMod.commandeDeLIle,
      texteDeLaCommande: commandesMod.texteDeLaCommande,
      SEUIL_DE_LA_PREMIERE_COMMANDE: commandesMod.SEUIL_DE_LA_PREMIERE_COMMANDE,
      BRIDGES: archMod.BRIDGES,
      KIND_NAME: archMod.KIND_NAME,
      // La nature d'un ouvrage suit son tracé sur la carte de départ, sans liaison posée (GD-9, `linkKind`).
      kindOf: (b) => archMod.linkKind(b, []),
      CONDITION_OF: archMod.CONDITION_OF,
      START_ISLANDS: archMod.START_ISLANDS,
      ARCHIPELAGOS: archMod.ARCHIPELAGOS,
      VOYAGES: archMod.VOYAGES,
      VEHICLE_STAGES: vehicleMod.VEHICLE_STAGES,
      MONUMENTS: monumentsMod.MONUMENTS,
      ASSEMBLAGE: recettesMod.ASSEMBLAGE,
      // Les questions des blocs assemblés (GD-2), une par bloc : hors du catalogue des îles.
      QUESTIONS_ASSEMBLAGE: (await Promise.all(recettesMod.ASSEMBLAGE.recettes.map((r) => exercisesMod.loadAssemblage(r.bloc)))).filter(Boolean),
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
      vocabulaire: vocabulaireMod,
      irreguliers: irreguliersMod,
      texts,
      programme: programmeMod,
      EXCLUSIONS: exclusionsMod.EXCLUSIONS,
      motsOutils: motsOutilsMod,
    };
    // Une matière ajoutée au jeu doit l'être ici aussi (nom et complément), dans le même ordre : sinon « undefined ».
    const matieres = Object.keys(data.SUBJECTS).join(',');
    for (const [nom, table] of [['SUBJECT_NAME', SUBJECT_NAME], ['SUBJECT_DE', SUBJECT_DE]])
      if (Object.keys(table).join(',') !== matieres) throw new Error(`generate.mjs : ${nom} (${Object.keys(table)}) ne suit pas les matières du jeu (${matieres})`);
    data.coverage = coverageOf(data);
    return [
      programmesPage(data),
      archipelPage(data),
      ...data.BIOMES.map((b) => islandPage(b, data)),
      homophonesPage(data),
      lecturePage(data),
      mathsPortailPage(data),
      anglaisPortailPage(data),
      ouvragesPage(data),
      baremePage(data),
      // Les pages des îles sous leur ancienne adresse (avant les identifiants neutres, 2 octobre 2026) : un lien gardé
      // par un enseignant mène à la page d'aujourd'hui.
      ...Object.entries(legacyMod.LEGACY_PLACES).map(([avant, lieu]) => ({ path: `pedagogie/iles/${avant}.html`, redirect: `${lieu}.html` })),
    ];
  } finally {
    await server.close();
  }
}

// ---------- Outils ----------

const SUBJECT_NAME = {
  french: 'Français',
  maths: 'Maths',
  english: 'Anglais',
  'history-geography': 'Histoire-géo',
  'life-earth-sciences': 'SVT',
  'physics-chemistry': 'Physique-chimie',
  technology: 'Technologie',
  lv2: 'LV2 (espagnol ou allemand)',
};
/** Les matières, dans l'ordre du portail. */
const SUBJECT_IDS = Object.keys(SUBJECT_NAME);
/** « 3 d’anglais », « 1 de LV2 » : le complément de chaque matière dans le décompte des îles. */
const SUBJECT_DE = {
  french: 'de français',
  maths: 'de maths',
  english: 'd’anglais',
  'history-geography': 'd’histoire-géo',
  'life-earth-sciences': 'de SVT',
  'physics-chemistry': 'de physique-chimie',
  technology: 'de technologie',
  lv2: 'de LV2',
};
// Quand arrive la première commande d'un archipel, selon `SEUIL_DE_LA_PREMIERE_COMMANDE` (src/game/world/requests.ts).
const QUAND_LA_PREMIERE_COMMANDE = {
  'premier-ouvrage': 'après le premier ouvrage construit dans l’archipel',
  'premiere-mission': 'après la première mission réussie dans l’archipel',
};
function quandLaPremiereCommande(seuil) {
  const texte = QUAND_LA_PREMIERE_COMMANDE[seuil];
  if (!texte) throw new Error(`Seuil de la première commande inconnu : ${seuil} (à décrire dans QUAND_LA_PREMIERE_COMMANDE).`);
  return texte;
}
const CONDITION_TEXT = {
  aucune: 'aucune condition',
  plan: 'une mission de l’île de départ réussie (la première partie de son bâtiment posée)',
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
  graph: 'graphique d’une fonction (repère gradué de 1 en 1, la droite et ses points aux intersections du quadrillage)',
  'column-operation': 'opération posée en colonnes (chiffre sous chiffre, virgule sous virgule)',
  'long-division': 'division posée en potence',
  'class-table': 'tableau de numération par classes (unités, mille, millions, milliards)',
  'value-table': 'tableau de valeurs',
  scene: 'schéma de la situation',
};
/** Les schémas de problèmes situés (`scene`), par sorte, avec la grandeur que l'élève cherche. */
const SCENE_NAME = {
  pont: 'pont en travées (une longueur)',
  quai: 'quai à clôturer (un périmètre)',
  traversee: 'traversée en bateau (une durée ou un horaire)',
  carte: 'carte à l’échelle (une distance)',
  cargaison: 'cargaison partagée selon un ratio (une part ou un total)',
  mat: 'mât tenu par un câble (un côté du triangle rectangle)',
  route: 'traversée à vitesse constante (une distance, une vitesse ou une durée)',
  ombre: 'ombre d’un bâton et d’un mât (une hauteur ou une ombre, par Thalès)',
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
  const aids = exercise.items.flatMap((it) => [it.aid, it.figure]).filter((a) => a?.kind);
  const kinds = new Set(aids.map((a) => a.kind));
  if (kinds.size === 0) return '';
  const scenes = [...new Set(aids.filter((a) => a.kind === 'scene').map((a) => a.props?.scene))];
  return [...kinds]
    .map((k) => (k === 'scene' && scenes.length ? `${AID_NAME.scene} : ${scenes.map((x) => SCENE_NAME[x] ?? x).join(', ')}` : AID_NAME[k] ?? k))
    .join(', ');
}

// ---------- Programme officiel ----------

/** Qui travaille chaque compétence : { id → [{ kind: 'ile' | 'portail', biome?, quest, title }] }. */
function coverageOf(d) {
  const map = new Map();
  const add = (id, who) => map.set(id, [...(map.get(id) ?? []), who]);
  for (const b of d.BIOMES) for (const q of b.exercises) for (const id of q.programme) add(id, { kind: 'ile', biome: b, quest: q.id, title: q.title });
  for (const a of d.APPS) for (const id of a.programme ?? []) add(id, { kind: 'portail', app: a, quest: a.id, title: a.title });
  for (const e of d.EXERCISES) for (const id of e.programme ?? []) {
    const b = d.BIOMES.find((x) => x.id === e.biome);
    const q = b.exercises.find((x) => x.id === e.type);
    if (!map.get(id)?.some((w) => w.kind === 'ile' && w.biome === b && w.quest === q.id)) add(id, { kind: 'ile', biome: b, quest: q.id, title: q.title });
  }
  return map;
}

/** Page du portail qui décrit une mission (pour les liens de couverture). */
const PORTAL_PAGE = { homophones: 'homophones.md', lecture: 'lecture.md', tables: 'maths-portail.md', fractions: 'maths-portail.md', decimaux: 'maths-portail.md', vocabulaire: 'anglais-portail.md', irreguliers: 'anglais-portail.md' };

/** « Ferme des accords : Enclos », avec un lien vers la page de l'île ou du portail (depuis pedagogie/). */
function coverageText(who, from = '') {
  if (who.kind === 'ile') return `[${who.biome.name}](${from}iles/${who.biome.id}.md) : ${who.title}`;
  const page = PORTAL_PAGE[who.app.id];
  return page ? `[${who.title}](${from}${page}) (portail)` : `${who.title} (portail)`;
}

/** Ligne « Programme : … » sous une mission : ses compétences, avec le domaine, la page et un lien vers la page Programmes. */
function programmeLine(ids, d, from) {
  const parts = [...new Set(ids)].map((id) => {
    const p = d.programme.byId(id);
    if (!p) return id;
    const dom = d.programme.domaineOf(p);
    return `${p.competence} ([cycle ${p.cycle}, ${dom.title.replace(/^Langues vivantes : /, '')}, p. ${p.page}](${from}programmes.md#${p.domaine}))`;
  });
  return `Programme officiel : ${parts.join(' ; ')}.`;
}

function programmesPage(d) {
  const { PROGRAMME, DOMAINES, DISCIPLINES, SOURCES, INFORMATIONS_PUBLIQUES } = d.programme;
  const { EXCLUSIONS, coverage } = d;
  const disciplines = Object.keys(DISCIPLINES);
  const status = (e) => (coverage.has(e.id) ? 'travaillee' : EXCLUSIONS[e.id]?.kind ?? 'sans');
  const count = (list, s) => list.filter((e) => status(e) === s).length;
  const lines = [
    '# Programmes officiels',
    '',
    'Chaque mission d’Archipéo et du portail cite les compétences du programme officiel qu’elle travaille. Cette page les met en face du programme, domaine par domaine : ce qui est travaillé (et par quelle mission), ce qui reste **à couvrir** (la feuille de route du contenu) et ce qui est **hors périmètre** d’une application d’entraînement (l’oral, l’écriture libre, la lecture d’œuvres complètes, la géométrie de construction). Le référentiel est dans `src/curriculum/` ; les libellés sont des résumés fidèles du texte officiel, dont la page est indiquée (« à vérifier » quand elle n’a pas encore été relue dans le texte en vigueur) ; le texte fait foi.',
    '',
    'Le cycle 3 se termine en 6e ; le cycle 4 couvre la 5e, la 4e et la 3e, sans répartition par année dans le texte officiel. Une île de 5e, 4e ou 3e peut consolider une compétence du cycle 3 ; une île de 6e ne travaille jamais le cycle 4.',
    '',
    'Le programme de langues vivantes est commun à toutes les langues : l’anglais le suit du cycle 3 au cycle 4, et la deuxième langue vivante (LV2), l’allemand ou l’espagnol, commencée en 5e, le suit au cycle 4 seulement, avec les mêmes compétences et les mêmes pages.',
    '',
    table(
      ['Cycle', 'Discipline', 'Compétences', 'Travaillées', 'À couvrir', 'Hors périmètre'],
      // Une discipline absente d'un cycle (les LV2 n'ont que le cycle 4) n'a pas de ligne.
      [3, 4].flatMap((cycle) =>
        disciplines.flatMap((disc) => {
          const list = PROGRAMME.filter((e) => e.cycle === cycle && e.discipline === disc);
          if (list.length === 0) return [];
          return [[`Cycle ${cycle}`, DISCIPLINES[disc].label, String(list.length), String(count(list, 'travaillee')), String(count(list, 'a-couvrir')), String(count(list, 'hors-perimetre'))]];
        }),
      ),
    ),
    '',
  ];
  for (const cycle of [3, 4]) {
    for (const disc of disciplines) {
      const domaines = DOMAINES.filter((x) => x.cycle === cycle && x.discipline === disc);
      if (domaines.length === 0) continue;
      lines.push(`## Cycle ${cycle} (${cycle === 3 ? '6e' : '5e, 4e, 3e'}) — ${DISCIPLINES[disc].label} {#c${cycle}-${DISCIPLINES[disc].short}}`, '');
      for (const dom of domaines) {
        const entries = PROGRAMME.filter((e) => e.domaine === dom.id);
        lines.push(`### ${dom.title} {#${dom.id}}`, '');
        const attendus = [...new Set(entries.map((e) => e.attendu))];
        const texte = dom.source ? ` de [${SOURCES[dom.source].title}](${SOURCES[dom.source].pdfUrl})` : '';
        lines.push(`*Attendus de fin de cycle (p. ${dom.page}${texte}${dom.unverified ? ', à vérifier' : ''}) : ${attendus.map((a) => `${a.replace(/\.$/, '')}`).join(' ; ')}.*`, '');
        lines.push(
          table(
            ['Compétence', 'Page', 'Missions'],
            entries.map((e) => {
              const who = coverage.get(e.id);
              const x = EXCLUSIONS[e.id];
              const quests = who
                ? [...new Set(who.map((w) => coverageText(w)))].join(' ; ')
                : x
                  ? `*${x.kind === 'a-couvrir' ? 'À couvrir' : 'Hors périmètre'} — ${x.motif}*`
                  : '*aucune*';
              return [e.competence, e.unverified ? `${e.page} (à vérifier)` : String(e.page), quests];
            }),
          ),
          '',
        );
      }
    }
  }
  const { MOTS_OUTILS_CP, MOTS_OUTILS_CE1, MOTS_OUTILS_SOURCE, COFFRE_HORS_LISTE, motsOutilsDictables, motDictable } = d.motsOutils;
  const dictables = motsOutilsDictables();
  const coffre = new Set(d.EXERCISES.filter((e) => e.type === 'sight-words').flatMap((e) => e.items.map((it) => motDictable(String(it.word)))));
  const inList = [...coffre].filter((w) => dictables.has(w));
  lines.push(
    '## Mots-outils {#mots-outils}',
    '',
    `Le **Coffre à mots** de la Carrière des mots dicte des mots de la liste officielle des mots-outils (fin de CP) et des mots invariables les plus fréquents (fin de CE1), que le programme du cycle 3 demande de mémoriser. La liste vient du jeu de données [${MOTS_OUTILS_SOURCE.dataset}](${MOTS_OUTILS_SOURCE.datasetUrl}) de data.gouv.fr ([le document](${MOTS_OUTILS_SOURCE.pdfUrl}), ${MOTS_OUTILS_SOURCE.legal}), sous ${MOTS_OUTILS_SOURCE.licence.name}. Un test vérifie que chaque mot du Coffre en fait partie.`,
    '',
    `Le Coffre dicte aujourd’hui ${inList.length} mots de la liste sur ${dictables.size}${Object.keys(COFFRE_HORS_LISTE).length ? `, plus ${Object.entries(COFFRE_HORS_LISTE).map(([w, why]) => `« ${w} » (${why.replace(/\.$/, '').toLowerCase()})`).join(' et ')}` : ''}.`,
    '',
    `**Fin de CP** (${MOTS_OUTILS_CP.length}) : ${MOTS_OUTILS_CP.join(', ')}.`,
    '',
    `**Fin de CE1** (${MOTS_OUTILS_CE1.length}) : ${MOTS_OUTILS_CE1.join(', ')}.`,
    '',
    '## Sources et licence {#sources}',
    '',
    `Les programmes viennent du jeu de données [${SOURCES.c3.dataset}](${SOURCES.c3.datasetUrl}) publié sur data.gouv.fr par le ministère de l’Éducation nationale, sous ${SOURCES.c3.licence.name} ([texte de la licence](${SOURCES.c3.licence.url})) : réutilisation libre, avec mention de la source et de la date. Quand une discipline suit un programme plus récent, publié au Bulletin officiel ou sur éduscol, ses domaines citent ce texte ; ce sont des informations publiques, réutilisables librement avec la même mention ([code des relations entre le public et l’administration](${INFORMATIONS_PUBLIQUES.url})).`,
    '',
    ...Object.values(SOURCES).map((s) => `- [${s.title}](${s.pdfUrl}) : ${s.pages} pages, ${s.legal}, consulté le ${s.consulted.split('-').reverse().join('/')}.`),
    '',
    'Les libellés de cette page sont des résumés fidèles du texte officiel, écrits pour tenir sur une ligne ; le texte officiel fait foi.',
    '',
  );
  return { path: 'pedagogie/programmes.md', title: 'Programmes officiels', body: lines.join('\n') };
}

/** Rendu d'un item d'exercice en une ligne lisible, selon sa forme. */
function describeItem(item) {
  // Un document à lire (Notices) : le document, une ligne par information, puis la question en français.
  if (item.question && item.prompt && Array.isArray(item.choices)) {
    return `${item.image ? `${item.image} ` : ''}« ${item.prompt.split('\n').join(' / ')} » ${item.question} → **${item.answer}** (${item.choices.join(' / ')})`;
  }
  if (item.prompt && Array.isArray(item.choices)) {
    return `${item.prompt} → **${item.answer}** (${item.choices.join(' / ')})`;
  }
  if (item.subject) {
    return `${item.subject} → **${item.answer === 'singulier' ? item.singular : item.plural}** (${item.singular} / ${item.plural})`;
  }
  if (item.meaning) {
    return `« ${item.meaning} » → **${item.word}** (${item.slot === 'prefix' ? 'préfixe' : 'suffixe'} ${item.answer}, racine ${item.root}${item.spokenRoot && item.spokenRoot !== item.root ? `, lue « ${item.spokenRoot} »` : ''})`;
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
  // Écoute d'un mot anglais : on entend le mot, on choisit son sens (la réponse n'est pas le mot lui-même).
  if (item.word && Array.isArray(item.choices) && item.answer !== undefined && item.answer !== item.word) {
    return `on entend « ${item.word} » → **${item.answer}** (${item.choices.join(' / ')})`;
  }
  if (item.word && Array.isArray(item.choices)) {
    return `${item.sentence ? `« ${item.sentence} » ` : ''}→ **${item.word}** (${item.choices.join(' / ')})`;
  }
  if (item.text) return item.text;
  return '`' + JSON.stringify(item) + '`';
}

// ---------- Pages ----------

function archipelPage(d) {
  const { BIOMES, EXERCISES, BRIDGES } = d;
  const items = EXERCISES.reduce((n, e) => n + e.items.length, 0);
  const quests = BIOMES.reduce((n, b) => n + b.exercises.length, 0);
  const lines = [
    '# L’archipel',
    '',
    'Cette page est produite à chaque build à partir des données du jeu (les îles, leurs missions et leurs exercices). Elle décrit exactement ce que contient la version publiée.',
    '',
    '| | |',
    '| --- | --- |',
    `| Version | ${d.version} |`,
    `| Îles | ${BIOMES.length} (${SUBJECT_IDS.map((s) => [s, BIOMES.filter((b) => b.subject === s).length])
      .filter(([, n]) => n > 0)
      .map(([s, n]) => `${n} ${SUBJECT_DE[s]}`)
      .join(', ')}) |`,
    `| Missions | ${quests} |`,
    `| Exercices (variantes et niveaux) | ${EXERCISES.length}, dont ${EXERCISES.filter((e) => e.generate).length} générés |`,
    `| Items de référence | ${items} |`,
    `| Parties de bâtiment (une par mission) | ${BIOMES.reduce((n, b) => n + d.partiesDe(b.id).length, 0)} |`,
    `| Ouvrages entre les îles | ${BRIDGES.length} |`,
    `| Compétences du programme officiel travaillées | ${d.programme.PROGRAMME.filter((e) => d.coverage.has(e.id)).length} sur ${d.programme.PROGRAMME.length} (voir [Programmes officiels](programmes.md)) |`,
    '',
    'Chaque île est un thème du programme. Elle a sa créature qui donne les missions, son bloc de construction, son bâtiment et son Gardien. Chaque mission réussie pour la première fois pose une partie du bâtiment. Les îles s’ouvrent en construisant des ouvrages avec les blocs gagnés, et l’on passe d’un archipel au suivant avec le Bloc-Navire : voir [Ouvrages et plans](ouvrages.md).',
    '',
    '## Les quatre archipels',
    '',
    'Un archipel par classe. On en voit un à la fois ; l’île-port accueille le quai et le Bloc-Navire, l’île de l’école accueille l’école du village (les missions du portail, qui y rapportent ses blocs) et la salle des trophées (un trophée par succès).',
    '',
    table(
      ['Archipel', 'Classe', 'Île-port', 'École du village', 'Îles', 'Pour y aller'],
      d.ARCHIPELAGOS.map((a, i) => {
        const stage = d.VEHICLE_STAGES.find((s) => s.to === a.classe);
        return [
          `Les ${a.name}`,
          a.classe,
          `[${BIOMES.find((b) => b.id === a.port)?.name ?? a.port}](iles/${a.port}.md)`,
          `[${BIOMES.find((b) => b.id === a.school)?.name ?? a.school}](iles/${a.school}.md) (${d.BLOCKS[BIOMES.find((b) => b.id === a.school).block].name.toLowerCase()})`,
          BIOMES.filter((b) => b.classe === a.classe).map((b) => `[${b.name}](iles/${b.id}.md)`).join(', '),
          i === 0 ? 'le départ : la Forêt et la Plaine sont ouvertes' : `le Bloc-Navire, étape ${stage.stage} (${stage.name.toLowerCase()}), construit au port des ${d.ARCHIPELAGOS[i - 1].name}`,
        ];
      }),
    ),
    '',
  ];
  for (const classe of CLASSES) {
    for (const subject of SUBJECT_IDS) {
      const list = BIOMES.filter((b) => b.classe === classe && b.subject === subject);
      if (list.length === 0) continue;
      lines.push(`## ${SUBJECT_NAME[subject]} — ${classe}`, '');
      lines.push(
        table(
          ['Île', 'Module', 'Créature', 'Gardien', 'Bloc', 'Missions'],
          list.map((b) => [
            `[${b.name}](iles/${b.id}.md)`,
            b.module,
            `${b.creature.name}, ${d.TEXTES.especes[b.id]}`,
            capFirst(b.guardian),
            d.BLOCKS[b.block].name,
            b.exercises.map((e) => e.title).join(', '),
          ]),
        ),
        '',
      );
    }
  }
  lines.push('## Types d’écrans', '', 'Chaque mission utilise un type d’écran (champ `type` de l’exercice). Les mêmes règles s’appliquent partout : consigne lue à voix haute, un seul geste par item, correction qui explique, indice jamais pénalisant, pas de chrono.', '');
  const types = new Map();
  for (const b of BIOMES) for (const e of b.exercises) types.set(e.id, { ...e, islands: [...(types.get(e.id)?.islands ?? []), b.name] });
  lines.push(
    table(
      ['Type', 'Mission', 'Ce que fait l’élève', 'Exercices'],
      [...types.values()].map((t) => [t.id, t.title, t.description, String(EXERCISES.filter((e) => e.type === t.id).length)]),
    ),
    '',
  );
  return { path: 'pedagogie/archipel.md', title: 'L’archipel', body: lines.join('\n') };
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
    `| Archipel | Les ${d.ARCHIPELAGOS.find((a) => a.classe === b.classe).name} (${b.classe}) |`,
    `| Île-port | ${d.ARCHIPELAGOS.some((a) => a.port === b.id) ? 'oui : le quai et le Bloc-Navire sont devant l’île' : 'non'} |`,
    `| École du village | ${d.ARCHIPELAGOS.some((a) => a.school === b.id) ? `oui : les missions du portail y rapportent des blocs ${BLOCKS[b.block].name.toLowerCase().match(/^[aeiouyéèêh]/) ? 'd’' : 'de '}${BLOCKS[b.block].name.toLowerCase()}` : 'non'} |`,
    `| Créature | ${b.creature.name}, ${d.TEXTES.especes[b.id]} |`,
    `| Gardien | ${capFirst(b.guardian)} |`,
    `| Bloc gagné | ${BLOCKS[b.block].name} |`,
    `| Missions | ${b.exercises.length} |`,
    `| Exercices | ${EXERCISES.filter((e) => e.biome === b.id).length} |`,
    `| Départ | ${d.START_ISLANDS.includes(b.id) ? 'île ouverte dès le début' : d.ARCHIPELAGOS.some((a) => a.port === b.id) ? 'île-port, ouverte à l’arrivée du Bloc-Navire' : 'à ouvrir par un ouvrage'} |`,
    '',
    '## La créature',
    '',
    `À l’arrivée, ${b.creature.name} dit : « ${d.TEXTES.creatures[b.id].greeting} »`,
    '',
    'Quand on la touche dans le village :',
    '',
    ...d.TEXTES.creatures[b.id].lines.map((l) => `- « ${l} »`),
    '',
    `Quand sa maison est finie : « ${d.TEXTES.creatures[b.id].home} »`,
    '',
    '## Le Gardien',
    '',
    `${d.TEXTES.gardiens[b.id].challenge}`,
    '',
    'Le défi enchaîne deux manches de chaque mission de l’île, au niveau de l’élève, sans chrono. Deux étoiles le rallument.',
    '',
    `- Épreuve réussie : « ${d.TEXTES.gardiens[b.id].guardianSays.hit} »`,
    `- Épreuve ratée : « ${d.TEXTES.gardiens[b.id].guardianSays.miss} »`,
    `- Rallumé : « ${d.TEXTES.gardiens[b.id].guardianSays.beaten} »`,
    '',
    '## Les missions',
    '',
  ];
  for (const q of b.exercises) {
    const exos = EXERCISES.filter((e) => e.biome === b.id && e.type === q.id).sort((a, c) => a.level - c.level);
    lines.push(`### ${q.title}`, '', `*${q.description}*`, '');
    lines.push(programmeLine([...q.programme, ...exos.flatMap((e) => e.programme ?? [])], d, '../'), '');
    if (b.id === 'french-6e-word-spelling' && q.id === 'sight-words') lines.push('Les mots dictés viennent de la liste officielle des mots-outils (fin de CP, fin de CE1) : voir [Programmes officiels](../programmes.md#mots-outils).', '');
    if (exos.length === 0) {
      lines.push('Aucun exercice n’est encore écrit pour cette mission.', '');
      continue;
    }
    lines.push(
      table(
        ['Exercice', 'Niveau', 'Items', 'Origine', 'Aide visuelle', 'Récompense', 'Monte à / descend à'],
        exos.map((e) => [
          `\`${e.id}\`${e.lang === 'en' ? ' (en anglais, voix anglaise)' : ''}`,
          String(e.level),
          e.perRun && e.perRun < e.items.length ? `${e.items.length} (${e.perRun} joués par partie)` : String(e.items.length),
          e.generate ? 'généré (autres nombres à chaque partie)' : 'écrit à la main',
          aidOf(e) || '—',
          `${d.blockCount(e.reward.block, e.reward.amount)}, ${e.reward.xp} XP`,
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
  const parties = d.partiesDe(b.id);
  lines.push('## Le bâtiment', '');
  if (parties.length) {
    lines.push(
      `Le bâtiment de l’île a ${plural(parties.length, 'partie')}, une par mission. La première fois que l’élève termine une mission de l’île, une partie se pose toute seule, sans prendre de blocs, quels que soient le niveau, les étoiles et les jokers. Les parties se posent dans cet ordre, quelle que soit la mission jouée.`,
      '',
      table(
        ['Partie', 'Nom', 'Blocs posés'],
        parties.map((p) => [String(p.rang), p.nom, String(p.cases.reduce((n, c) => n + c.keys.length, 0))]),
      ),
      '',
      'Le dessin du bâtiment suit trois plans. Un plan fini rapporte son XP, et la créature le dit.',
      '',
      table(
        ['Plan', 'Blocs', 'XP', 'La créature dit'],
        plans.map((p) => {
          const byBlock = {};
          for (const c of p.cells) byBlock[c.block] = (byBlock[c.block] ?? 0) + 1;
          const blocks = Object.entries(byBlock)
            .map(([k, n]) => (BLOCKS[k] ? d.blockCount(k, n) : `${n} ${k}`))
            .join(', ');
          return [p.name, `${p.cells.length} (${blocks})`, String(p.reward.xp), `« ${p.done} »`];
        }),
      ),
      '',
    );
  }
  const stage = d.VEHICLE_STAGES.find((s) => s.biome === b.id);
  if (stage) {
    const count = (cells) => Object.entries(cells.reduce((acc, c) => ({ ...acc, [c.block]: (acc[c.block] ?? 0) + 1 }), {}))
      .map(([k, n]) => (BLOCKS[k] ? d.blockCount(k, n) : `${n} ${k}`))
      .join(', ');
    lines.push(
      '## Le chantier du Bloc-Navire',
      '',
      `Étape ${stage.stage} : **${stage.name}**, vers les ${d.ARCHIPELAGOS.find((a) => a.classe === stage.to).name}. Blocs à poser : ${count(stage.cells)}. Kit qui arrive avec ${stage.guardians} Gardien${stage.guardians > 1 ? 's' : ''} rallumé${stage.guardians > 1 ? 's' : ''} : ${count(stage.kit)}. ${stage.reward.xp} XP au départ.`,
      '',
      `Quand le kit arrive : « ${stage.done} »`,
      '',
    );
  }
  const commande = d.commandeDeLIle(b.id);
  if (commande) {
    const lieu = d.ASSEMBLAGE.lieu.blocland.a;
    lines.push(
      '## La commande',
      '',
      `Dans Blocland, ${b.creature.name} passe une commande : ${d.blockCount(commande.block, commande.count)} pour ${commande.blocland.name}. Elle arrive ${quandLaPremiereCommande(d.SEUIL_DE_LA_PREMIERE_COMMANDE)}, une fois qu’une mission de l’île est réussie et que l’île qui donne ce bloc est ouverte${commande.afterPlan ? `, et seulement quand « ${d.PLANS.find((p) => p.id === commande.afterPlan)?.name ?? commande.afterPlan} » est bâti` : ''}. Livrée, elle pose ${commande.blocland.name} à côté de ${b.creature.name}, avec les blocs livrés : ni coffre ni XP, ni délai, rien à perdre si on la laisse de côté.`,
      '',
      table(
        ['Quand', 'Ce que dit la ligne'],
        [
          ['Demandée', `« ${d.texteDeLaCommande(commande, 'ask', lieu)} »`],
          ['Les blocs sont là', `« ${d.texteDeLaCommande(commande, 'ready', lieu)} »`],
          ['Livrée', `« ${d.texteDeLaCommande(commande, 'done', lieu)} »`],
        ],
      ),
      '',
    );
  }
  lines.push('## Les ouvrages', '');
  lines.push(
    table(
      ['Ouvrage', 'Relie', 'Coût', 'Condition'],
      bridges.map((br) => [
        KIND_NAME[d.kindOf(br)],
        `${name(br.from)} ↔ ${name(br.to)}`,
        br.cost === 0 ? 'déjà construit' : plural(br.cost, 'bloc'),
        CONDITION_TEXT[CONDITION_OF[d.kindOf(br)]],
      ]),
    ),
    '',
  );
  return { path: `pedagogie/iles/${b.id}.md`, title: b.name, body: lines.join('\n') };
}

/**
 * La page « Personnages et Gardiens » du pilotage (docs/gameplay/personnages.md, hors du site de documentation,
 * qui s'adresse aux élèves et aux adultes qui les accompagnent) : `npm run pilotage:personnages`.
 */
export async function generatePersonnages() {
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    plugins: [exerciseMeta()],
  });
  try {
    const load = (p) => server.ssrLoadModule(p);
    const [biomesMod, archMod, universMod, universCore] = await Promise.all([
      load('/src/game/biomes.ts'),
      load('/src/game/world/archipelago.ts'),
      load('/src/universes/index.ts'),
      load('/src/core/universe.ts'),
    ]);
    return personnagesPage({
      BIOMES: biomesMod.BIOMES,
      ARCHIPELAGOS: archMod.ARCHIPELAGOS,
      UNIVERS: universCore.UNIVERS,
      TEXTES_DE: { blocland: universMod.textesDe('blocland'), archipeo: universMod.textesDe('archipeo') },
    });
  } finally {
    await server.close();
  }
}

/**
 * Les personnages : qui parle aux grandes étapes (la créature de l'île-école dans Blocland, la baleine dans Archipéo),
 * puis une créature et un Gardien par île, avec ce qui change d'un univers à l'autre (noms des archipels compris).
 */
/** Qui dit le mot des grandes étapes dans un univers, en une phrase. */
function parleDe(univers, t, d) {
  if (t.baleine.parle === 'baleine') return `Dans ${univers}, la **baleine** le dit.`;
  const ecoles = d.ARCHIPELAGOS.map((a) => `${d.BIOMES.find((b) => b.id === a.school).creature.name} en ${a.classe}`).join(', ');
  return `Dans ${univers}, la **créature de l’île-école** de l’archipel le dit, son nom écrit et son portrait dans la bulle : ${ecoles}.`;
}

function personnagesPage(d) {
  const { BIOMES, TEXTES_DE, UNIVERS } = d;
  const bl = TEXTES_DE.blocland;
  const ar = TEXTES_DE.archipeo;
  for (const [u, t] of Object.entries(TEXTES_DE))
    for (const b of BIOMES)
      if (!t.gardiens[b.id] || !t.creatures[b.id] || !t.especes[b.id]) throw new Error(`generate.mjs : textes de ${u} incomplets pour l’île ${b.id}`);
  // Les exemples du mot des grandes étapes : le premier archipel, son île-port, la première île ouverte par un ouvrage.
  const premier = d.ARCHIPELAGOS[0];
  const nom = (id) => BIOMES.find((b) => b.id === id).name;
  const port = nom(premier.port);
  const ouverte = nom(BIOMES.find((b) => b.classe === premier.classe && !premier.starts.includes(b.id)).id);
  const lines = [
    '# Personnages et Gardiens',
    '',
    '<!-- Page produite par `npm run pilotage:personnages` : ne pas l’écrire à la main. -->',
    '',
    'Cette page est produite à partir des données du jeu (`docs/contenu/` pour les noms, `src/universes/` pour les espèces et les répliques) par `npm run pilotage:personnages`. Elle se corrige dans le code, puis se régénère ; jamais à la main.',
    '',
    `Chaque île a une **créature**, qui l’habite, donne les missions et parle à l’arrivée, et un **Gardien**, dont le défi ferme l’île. Les noms sont communs aux deux univers ; l’espèce de la créature et ce que dit le Gardien changent. Dans les deux univers, le Gardien attend éteint sur son îlot et son défi le **rallume** : une statue de pierre qui reprend ses couleurs dans ${UNIVERS.blocland.nom}, une sentinelle de pierre éteinte dans ${UNIVERS.archipeo.nom}. Les noms des archipels changent d’un univers à l’autre (GD-1), leurs identifiants jamais.`,
    '',
    '## Le mot des grandes étapes',
    '',
    `Rare, aux grandes étapes d’un archipel (l’arrivée, le dernier Gardien, l’île-port, le premier ouvrage). ${parleDe(UNIVERS.blocland.nom, bl, d)} ${parleDe(UNIVERS.archipeo.nom, ar, d)}`,
    '',
    table(
      ['Moment', UNIVERS.blocland.nom, UNIVERS.archipeo.nom],
      [
        ...CLASSES.map((c) => [`Arrivée en ${c}`, bl.baleine.arrivee[c], ar.baleine.arrivee[c]]),
        ['Tous les Gardiens d’un archipel (exemple)', bl.baleine.gardiens(bl.archipels[premier.classe]), ar.baleine.gardiens(ar.archipels[premier.classe])],
        ['Île-port terminée (exemple)', bl.baleine.port(port), ar.baleine.port(port)],
        ['Premier ouvrage payé (exemple)', bl.baleine.ouvrage(ouverte), ar.baleine.ouvrage(ouverte)],
      ],
    ),
    '',
  ];
  for (const a of d.ARCHIPELAGOS) {
    const list = BIOMES.filter((b) => b.classe === a.classe);
    lines.push(`## ${bl.archipels[a.classe] === ar.archipels[a.classe] ? `Les ${bl.archipels[a.classe]}` : `Les ${bl.archipels[a.classe]} (${UNIVERS.blocland.nom}), les ${ar.archipels[a.classe]} (${UNIVERS.archipeo.nom})`}, ${a.classe}`, '');
    lines.push(
      table(
        ['Île', 'Créature', `Espèce (${UNIVERS.blocland.nom})`, `Espèce (${UNIVERS.archipeo.nom})`, 'Gardien'],
        list.map((b) => [
          `[${b.name}](https://g7ed6e.github.io/dysapps/pedagogie/iles/${b.id}.html) (${SUBJECT_NAME[b.subject]})`,
          b.creature.name,
          bl.especes[b.id],
          ar.especes[b.id],
          capFirst(b.guardian),
        ]),
      ),
      '',
    );
    for (const b of list) {
      lines.push(`### ${capFirst(b.guardian)}, ${b.name}`, '');
      lines.push(
        table(
          ['', UNIVERS.blocland.nom, UNIVERS.archipeo.nom],
          [
            ['Au défi', bl.gardiens[b.id].challenge, ar.gardiens[b.id].challenge],
            ['À la fin', bl.gardiens[b.id].guardianSays.beaten, ar.gardiens[b.id].guardianSays.beaten],
            [`${b.creature.name} à l’arrivée`, bl.creatures[b.id].greeting, ar.creatures[b.id].greeting],
          ],
        ),
        '',
      );
    }
  }
  return `${lines.join('\n')}\n`;
}

function homophonesPage(d) {
  const { SETS, LEVELS, QUESTIONS_PER_QUEST } = d.homophones;
  const lines = [
    '# Homophones (mission du portail)',
    '',
    `Mission **Français** du portail. ${SETS.length} jeux d’homophones répartis en ${LEVELS.length} niveaux ; une mission de niveau tire ${QUESTIONS_PER_QUEST} phrases parmi les jeux du niveau, l’entraînement ciblé travaille un seul jeu. Le joker donne l’astuce de remplacement, la correction rappelle la règle. Les phrases sont dans \`src/apps/homophones/sets.json\` et vérifiées par les tests : un seul trou, jamais en début de phrase, chaque réponse travaillée.`,
    '',
    'Les mêmes phrases servent dans Archipéo : le **Tri des graines** (Ferme des accords) et les **Panneaux** (Carrefour des homophones).',
    '',
    programmeLine(d.APPS.find((a) => a.id === 'homophones').programme, d, ''),
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
    '# Lecture (mission du portail)',
    '',
    `Mission **Français** du portail : ${d.texts.length} textes du domaine public, une ligne par vers ou par phrase, couleurs alternées, lecture à voix haute qui surligne la ligne lue, mots difficiles expliqués, puis des questions de compréhension. Le joker cite le passage à relire ; le texte reste consultable pendant les questions. Textes et questions sont dans \`src/apps/lecture/texts.json\`.`,
    '',
    programmeLine(d.APPS.find((a) => a.id === 'lecture').programme, d, ''),
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
    '# Maths (missions du portail)',
    '',
    'Les trois missions de maths du portail génèrent leurs questions au hasard à chaque séance : quatre réponses rangées dans l’ordre croissant, des pièges tirés des erreurs fréquentes, un joker qui donne une astuce et une aide visuelle. Les mêmes générateurs alimentent les îles de maths 6e d’Archipéo (Plaine des nombres, Rivière des fractions, Volcan des décimaux).',
    '',
    'Les exemples ci-dessous sont tirés avec une graine fixe : ils changent quand les générateurs changent, pas d’un build à l’autre.',
    '',
  ];
  for (const { app, quests, per, make } of apps) {
    lines.push(`## ${app.title}`, '', `${app.description} ${per} questions par mission.`, '', programmeLine(app.programme, d, ''), '');
    lines.push(table(['Mission', 'Détail'], quests.map((q) => [q.title, q.detail])), '');
    for (const q of quests) {
      lines.push(`### ${q.title}`, '', `*${q.detail}.* Exemples :`, '', ...sampleQuestions(make(q), 3), '');
    }
    if (app.id === 'tables') {
      lines.push(`### Réviser une table`, '', `Une mission libre par table : ${d.tables.TABLES.map((t) => `× ${t}`).join(', ')}.`, '');
    }
  }
  return { path: 'pedagogie/maths-portail.md', title: 'Maths du portail', body: lines.join('\n') };
}

function anglaisPortailPage(d) {
  const { THEMES, LEVELS: VOCAB_LEVELS, QUESTIONS_PER_QUEST: VOCAB_PER } = d.vocabulaire;
  const { VERBS, LEVELS: VERB_LEVELS, QUESTIONS_PER_QUEST: VERB_PER, choicesFor } = d.irreguliers;
  const lines = [
    '# Anglais (missions du portail)',
    '',
    'Les missions d’anglais gardent les règles des autres matières. La consigne, le joker et la correction sont en français, lus avec la voix française. Les mots et les phrases à travailler sont en anglais : ils sont lus avec une voix anglaise britannique et ne sont pas découpés en syllabes (le découpage suit les règles du français).',
    '',
    '## Vocabulaire',
    '',
    `${THEMES.length} thèmes de ${THEMES[0].words.length} mots. Une mission de niveau tire ${VOCAB_PER} mots dans tous les thèmes ; « Un thème » révise tous les mots d’un seul thème, de l’anglais au français ou l’inverse. Les réponses sont les autres mots du même thème ; au niveau 3, deux écritures fautives vraisemblables. Les mots sont dans \`src/apps/vocabulaire/themes.json\`.`,
    '',
    programmeLine(d.APPS.find((a) => a.id === 'vocabulaire').programme, d, ''),
    '',
    table(
      ['Niveau', 'Nom', 'Ce qu’on fait'],
      VOCAB_LEVELS.map((l) => [String(l.level), l.title, l.description]),
    ),
    '',
  ];
  for (const theme of THEMES) {
    lines.push(`### ${theme.label}`, '');
    lines.push(table(['Anglais', 'Français', 'Écritures fautives (niveau 3)'], theme.words.map((w) => [w.en, w.fr, w.traps.join(', ')])), '');
  }
  lines.push(
    '## Verbes irréguliers',
    '',
    `${VERBS.length} verbes du collège en ${VERB_LEVELS.length} niveaux. Une mission tire ${VERB_PER} verbes du niveau, chacun au prétérit ou au participe passé. Les réponses : la bonne forme, l’autre forme, la base, la fausse forme en -ed (« goed », l’erreur la plus fréquente) et, quand les formes se ressemblent, des erreurs d’élève écrites à la main. La correction redonne les trois formes et le sens. Les verbes sont dans \`src/apps/irreguliers/verbs.json\`.`,
    '',
    programmeLine(d.APPS.find((a) => a.id === 'irreguliers').programme, d, ''),
    '',
  );
  for (const lvl of VERB_LEVELS) {
    lines.push(`### Niveau ${lvl.level} : ${lvl.title}`, '');
    lines.push(
      table(
        ['Base', 'Prétérit', 'Participe passé', 'Sens', 'Réponses proposées (prétérit)'],
        VERBS.filter((v) => v.level === lvl.level).map((v) => [v.base, v.preterit, v.participle, v.fr, choicesFor(v, 'preterit').join(', ')]),
      ),
      '',
    );
  }
  return { path: 'pedagogie/anglais-portail.md', title: 'Anglais du portail', body: lines.join('\n') };
}

function ouvragesPage(d) {
  const { BRIDGES, PLANS, BLOCKS, KIND_NAME, CONDITION_OF } = d;
  const name = (id) => d.BIOMES.find((x) => x.id === id)?.name ?? id;
  const lines = [
    '# Ouvrages et plans',
    '',
    `Les ${BRIDGES.length} ouvrages relient les îles d’un même archipel. Un ouvrage se construit depuis le panneau d’une île ouverte qu’il touche et coûte des blocs gagnés sur n’importe quelle île. L’or et le cristal ne paient rien : ce sont des trophées. Les blocs de finition (toit, porte, lanterne…) ne paient pas non plus. Certains demandent en plus une condition. Îles ouvertes au départ : ${d.START_ISLANDS.map(name).join(' et ')}. D’un archipel au suivant, on voyage avec le Bloc-Navire.`,
    '',
    '## Le Bloc-Navire',
    '',
    'Un seul navire qui grandit en trois étapes, chacune un plan à construire sur le quai de l’île-port. Le kit (voile, haut du ballon, feux) arrive avec les Gardiens rallumés de l’archipel ; le reste se pose bloc par bloc. Embarquer est un bouton ; le voyage fait reste fait, on revient quand on veut.',
    '',
    table(
      ['Étape', 'Nom', 'Se construit sur', 'Blocs à poser', 'Kit', 'Gardiens', 'Mène aux', 'XP'],
      d.VEHICLE_STAGES.map((s) => {
        const count = (cells) => Object.entries(cells.reduce((acc, c) => ({ ...acc, [c.block]: (acc[c.block] ?? 0) + 1 }), {}))
          .map(([k, n]) => (BLOCKS[k] ? d.blockCount(k, n) : `${n} ${k}`))
          .join(', ');
        return [String(s.stage), s.name, `[${name(s.biome)}](iles/${s.biome}.md)`, count(s.cells), count(s.kit), `${s.guardians} des ${d.ARCHIPELAGOS.find((a) => a.classe === s.from).name}`, d.ARCHIPELAGOS.find((a) => a.classe === s.to).name, String(s.reward.xp)];
      }),
    ),
    '',
    '## Natures d’ouvrage',
    '',
    table(
      ['Nature', 'Condition en plus des blocs', 'Nombre'],
      // Seulement les natures qu'un ouvrage prend aujourd'hui (GD-9 : plus d'escalier taillé, de tunnel ni de col).
      Object.keys(KIND_NAME)
        .map((k) => [k, BRIDGES.filter((b) => d.kindOf(b) === k).length])
        .filter(([, n]) => n > 0)
        .map(([k, n]) => [KIND_NAME[k], CONDITION_TEXT[CONDITION_OF[k]], String(n)]),
    ),
    '',
    '## Tous les ouvrages',
    '',
    ...d.ARCHIPELAGOS.flatMap((a) => {
      const own = BRIDGES.filter((b) => d.BIOMES.find((x) => x.id === b.from)?.classe === a.classe);
      return [
        `### Archipel de ${a.classe} — Les ${a.name}`,
        '',
        table(
          ['De', 'Vers', 'Nature', 'Coût', 'Condition'],
          own.map((b) => [name(b.from), name(b.to), KIND_NAME[d.kindOf(b)], b.cost === 0 ? 'déjà construit' : plural(b.cost, 'bloc'), CONDITION_TEXT[CONDITION_OF[d.kindOf(b)]]]),
        ),
        '',
      ];
    }),
    '## Les bâtiments des îles',
    '',
    'Chaque île a un bâtiment, avec une partie par mission (de 2 à 4). La première fois que l’élève termine une mission de l’île, une partie se pose toute seule, sans prendre de blocs, quels que soient le niveau, les étoiles et les jokers. Les parties se posent dans l’ordre du dessin. Les blocs gagnés vont dans le stock et servent aux ouvrages, aux monuments et au Bloc-Navire.',
    '',
    'Le dessin suit trois plans : le bâtiment, puis son toit, puis sa cour. Avec trois missions, chaque partie est un plan. Avec deux, la deuxième partie pose le toit et la cour ensemble. Avec quatre, le premier plan se pose en deux fois : le bas, puis le haut. Un plan fini rapporte son XP.',
    '',
    table(
      ['Île', 'Parties', 'Plans (XP)'],
      d.BIOMES.filter((b) => d.partiesDe(b.id).length).map((b) => [
        `[${name(b.id)}](iles/${b.id}.md)`,
        d.partiesDe(b.id).map((p) => p.nom).join(' ; '),
        PLANS.filter((p) => p.biome === b.id).map((p) => `${p.name} (${p.reward.xp})`).join(' ; '),
      ]),
    ),
    '',
    '## Les monuments',
    '',
    `${d.MONUMENTS.length} monuments, deux par archipel, chacun sur son îlot au large d’une île. Ils se construisent à la main, bloc par bloc, avec les blocs de plusieurs îles de leur archipel : de quoi employer les blocs qui restent une fois les bâtiments finis. Ils n’ouvrent rien et ne donnent pas de coffre ; un monument fini rapporte de l’XP, et le premier le succès Patrimoine.`,
    '',    `Chaque monument demande aussi quelques **blocs assemblés** : un par archipel, qu’aucune île ne donne. On les assemble sur l’île de l’école, ${d.ASSEMBLAGE.lieu.blocland.a} dans Blocland (${d.ASSEMBLAGE.lieu.archipeo.a} dans Archipéo), avec des blocs de deux îles de l’archipel.`,
    '',
    table(
      ['Archipel', 'Bloc assemblé', 'Recette', 'Nom dans Archipéo'],
      d.ASSEMBLAGE.recettes.map((r) => [
        `Les ${d.ARCHIPELAGOS.find((a) => a.classe === r.archipelago).name}`,
        r.noms.blocland.nom,
        r.ingredients.map((i) => d.blockCount(i.bloc, i.n)).join(' et '),
        r.noms.archipeo.nom,
      ]),
    ),
    '',
    table(
      ['Archipel', 'Monument', 'Au large de', 'Blocs', 'XP'],
      d.MONUMENTS.map((m) => {
        const need = Object.entries(m.cells.reduce((acc, c) => ({ ...acc, [c.block]: (acc[c.block] ?? 0) + 1 }), {}))
          .sort((x, y) => y[1] - x[1])
          .map(([k, n]) => (BLOCKS[k] ? d.blockCount(k, n) : `${n} ${k}`))
          .join(', ');
        return [`Les ${d.ARCHIPELAGOS.find((a) => a.classe === m.archipelago).name}`, `${m.name} — ${m.description}`, `[${name(m.biome)}](iles/${m.biome}.md)`, `${m.cells.length} : ${need}`, String(m.reward.xp)];
      }),
    ),
    '',
    ...questionsAssemblage(d),
  ];
  return { path: 'pedagogie/ouvrages.md', title: 'Ouvrages et plans', body: lines.join('\n') };
}

/** Les questions des blocs assemblés (GD-2) : ce qu'elles travaillent, leur consigne et leurs questions. */
function questionsAssemblage(d) {
  if (d.QUESTIONS_ASSEMBLAGE.length === 0) return [];
  const lines = [
    '## Les questions de l’assemblage',
    '',
    'Chaque bloc assemblé demande de répondre à une question qui mêle les **deux matières de sa recette** : on lit un petit texte, on calcule, puis on choisit parmi trois réponses, avec le rappel des deux matières toujours affiché et un indice. Une bonne réponse, du premier coup ou au second essai, assemble le bloc ; une erreur ne fait rien perdre. Les questions ne rapportent ni XP ni étoiles. Chaque élève les rencontre dans son propre ordre ; une question ne revient jamais avant six autres, et une question manquée revient plus tard. Voir [La Fabrique](../manuel/blocland.md#la-question-de-lassemblage) dans le manuel.',
    '',
    table(
      ['Bloc assemblé', 'Archipel', 'Recette', 'Questions'],
      d.QUESTIONS_ASSEMBLAGE.map((q) => {
        const r = d.ASSEMBLAGE.recettes.find((x) => x.bloc === q.bloc);
        return [
          r.noms.blocland.nom,
          `Les ${d.ARCHIPELAGOS.find((a) => a.classe === r.archipelago).name}`,
          r.ingredients.map((i) => d.blockCount(i.bloc, i.n)).join(' et '),
          String(q.items.length),
        ];
      }),
    ),
    '',
  ];
  for (const q of d.QUESTIONS_ASSEMBLAGE) {
    const r = d.ASSEMBLAGE.recettes.find((x) => x.bloc === q.bloc);
    lines.push(`### ${r.noms.blocland.nom} (${r.noms.archipeo.nom} dans Archipéo)`, '');
    lines.push(programmeLine(q.programme, d, ''), '');
    lines.push(`Consigne : « ${q.instruction} »${q.lang === 'en' ? ' Le texte à lire est en anglais, lu en voix anglaise ; la question, l’indice et l’aide sont en français.' : ''}`, '');
    lines.push('<details>', `<summary>Questions : ${q.items.length}</summary>`, '');
    lines.push(...q.items.map((it) => `- ${describeItem(it)}`), '', '</details>', '');
  }
  return lines;
}

function baremePage(d) {
  const { XP, BADGES, xpToNextLevel, ROLES } = d.progress;
  const { INTERVALS, GRADUATE_AT, CHEST_EVERY, CHEST_BLOCKS, PROMOTE_AT_ONCE, FIRST_TIME_BLOCKS, PORTAL_BLOCKS } = d.engine;
  const { DEFAULT_SETTINGS, FONT_LABELS, THEME_LABELS, WORLD_VIEW_LABELS, MIN_FONT_SIZE, MIN_LINE_HEIGHT } = d.settings;
  const { APP_REWORK_BELOW, REWORK_SHOWN } = d.subjectProgress;
  // Les rôles et l'XP cumulée pour atteindre le niveau où chacun commence.
  const xpAt = (level) => Array.from({ length: level - 1 }, (_, i) => xpToNextLevel(i + 1)).reduce((a, b) => a + b, 0);
  const roles = ROLES.map((r) => [r.name, String(r.firstLevel), String(xpAt(r.firstLevel))]);
  const lines = [
    '# Barème, succès et valeurs par défaut',
    '',
    'Les nombres de cette page viennent du code (`src/core/progress.ts`, `src/game/engine.ts`, `src/core/subjectProgress.ts`, `src/core/settings.ts`).',
    '',
    '## Points d’expérience (missions du portail)',
    '',
    table(
      ['Évènement', 'XP'],
      [
        ['Bonne réponse du premier coup', String(XP.firstTry)],
        ['Bonne réponse après une erreur ou avec le joker', String(XP.afterRetry)],
        ['Réponse fausse (point d’effort)', String(XP.effort)],
        ['Mission terminée', String(XP.sessionBonus)],
        ['Bonus mission parfaite (100 %)', String(XP.perfectBonus)],
      ],
    ),
    '',
    '## Niveaux et rôles',
    '',
    `Passer d’un niveau au suivant demande ${xpToNextLevel(1)} XP au niveau 1, puis ${xpToNextLevel(2) - xpToNextLevel(1)} de plus à chaque niveau. Le rôle change à certains niveaux ; après le dernier, le niveau continue de monter et le rôle reste. L’XP gagnée dans Archipéo compte aussi.`,
    '',
    table(['Rôle', 'À partir du niveau', 'XP cumulée pour y arriver'], roles),
    '',
    '## Succès',
    '',
    table(['Succès', 'Condition'], BADGES.map((b) => [b.title, b.description])),
    '',
    '## Moteur de l’aventure',
    '',
    table(
      ['Règle', 'Valeur'],
      [
        ['Score d’un item', '1 point du premier coup, ½ avec aide ou après une erreur'],
        ['Étoiles', '1 = terminé, 2 = au moins 70 %, 3 = au moins 90 % (la meilleure est gardée)'],
        ['Blocs', `proportionnels au score, jamais 0 dès une bonne réponse ; +1 à deux étoiles, +2 à trois ; +${FIRST_TIME_BLOCKS} la première fois qu’une mission est jouée`],
        [
          'Blocs d’une mission du portail (école du village)',
          `${PORTAL_BLOCKS} × le score, jamais 0 dès une bonne réponse, mêmes bonus d’étoiles et de première fois ; des blocs de l’île de l’école de l’archipel où se tient le bonhomme (${d.ARCHIPELAGOS.map((a) => `${d.BIOMES.find((b) => b.id === a.school).name} en ${a.classe}`).join(', ')}) ; la mission compte pour la régularité, pas pour les étoiles ni les Gardiens`,
        ],
        [
          'Blocs d’une révision (une mission qui a des questions à revoir aujourd’hui)',
          `toujours autant qu’une mission sans faute (la base de la mission, +${d.engine.blocksBonus(3, false).stars} des trois étoiles), quel que soit le score : ni le joker ni les erreurs n’en retirent`,
        ],
        ['XP', '+50 % sans aide ni erreur'],
        ['Répétition espacée des items ratés', `J+${INTERVALS.join(', J+')} ; sortie après ${GRADUATE_AT} réussites d’affilée`],
        ['Régularité', `un coffre de ${CHEST_BLOCKS} blocs tous les ${CHEST_EVERY} jours de suite ; la série se fissure après un jour manqué, réparable le lendemain`],
        ['Adaptation du niveau', `monte après deux parties au-dessus du seuil de la mission, ou une seule à ${percent(PROMOTE_AT_ONCE)} ; descend après deux parties sous le seuil bas, sans jamais l’afficher comme une baisse`],
        ['Pause', 'proposée après 3 exercices ou 10 minutes'],
      ],
    ),
    '',
    '## À retravailler (page Succès)',
    '',
    table(
      ['Règle', 'Valeur'],
      [
        ['Mission d’Archipéo proposée', 'déjà jouée, moins de 3 étoiles, sur une île ouverte'],
        ['Mission du portail proposée', `record sous ${APP_REWORK_BELOW} %`],
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
        ['Vue du monde', WORLD_VIEW_LABELS[DEFAULT_SETTINGS.worldView], Object.values(WORLD_VIEW_LABELS).join(', ')],
        ['Lumière du monde', d.settings.WORLD_LIGHT_LABELS[DEFAULT_SETTINGS.worldLight], Object.values(d.settings.WORLD_LIGHT_LABELS).join(', ')],
        ['Sons du village', DEFAULT_SETTINGS.sounds ? 'oui' : 'non', ''],
        ['Ambiance sonore', DEFAULT_SETTINGS.ambience ? 'oui' : 'non', ''],
        ['Univers', d.UNIVERS[d.UNIVERS_PAR_DEFAUT].nom, Object.values(d.UNIVERS).map((u) => u.nom).join(', ')],
      ],
    ),
    '',
  ];
  return { path: 'pedagogie/bareme.md', title: 'Barème et succès', body: lines.join('\n') };
}

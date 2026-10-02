// Les identifiants d'avant les mots neutres (décision du mainteneur, 2 octobre 2026) et leur traduction. Seule la
// traduction des anciennes sauvegardes (src/core/migration.ts) et des anciennes adresses (src/App.tsx) les lit. Un lieu
// prend sa matière, sa classe et son thème (`french-6e-phonology`) ; sa ressource, l'identifiant du lieu ; ses parties,
// le lieu et un rang (`french-6e-phonology-1`) ; une mission, sa notion en anglais (`syllables`). Données figées : ne
// rien y ajouter, un identifiant nouveau naît neutre.

/** Les lieux : l'ancien identifiant (le mot de Blocland) → l'identifiant neutre. */
export const LEGACY_PLACES: Readonly<Record<string, string>> = {
  foret: 'french-6e-phonology',
  mine: 'french-6e-letter-confusion',
  carriere: 'french-6e-word-spelling',
  ferme: 'french-6e-grammar-spelling',
  tour: 'french-6e-reading',
  plaine: 'maths-6e-calculation',
  riviere: 'maths-6e-fractions',
  volcan: 'maths-6e-decimals',
  glacier: 'maths-5e-signed-numbers',
  marche: 'maths-5e-proportionality',
  carrefour: 'french-5e-homophones',
  marais: 'french-5e-conjugation',
  forge: 'maths-4e-powers',
  atelier: 'maths-4e-algebra',
  falaise: 'french-4e-agreement',
  cabinet: 'french-4e-vocabulary',
  belvedere: 'maths-3e-geometry',
  donnees: 'maths-3e-statistics',
  phare: 'maths-3e-functions',
  textes: 'french-3e-close-reading',
  baie: 'english-6e-vocabulary',
  horloge: 'english-6e-grammar',
  comptoir: 'english-5e-vocabulary',
  manoir: 'english-5e-grammar',
  theatre: 'english-4e-comprehension',
  gare: 'english-4e-grammar',
  studio: 'english-3e-comprehension',
  chateau: 'english-3e-grammar',
  relais: 'lv2-5e-introductions',
  jardin: 'lv2-4e-daily-life',
  refuge: 'lv2-3e-travel',
};

/** Les missions de chaque lieu, sous son ancien identifiant : l'ancienne mission → la neutre. */
export const LEGACY_MISSIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  foret: { abattage: 'syllables', 'chasse-son': 'sound-hunt', rimes: 'rhymes' },
  mine: { filon: 'letter-pairs', oreille: 'sound-discrimination' },
  carriere: {
    'mot-troue': 'missing-letters',
    familles: 'word-families',
    coffre: 'sight-words',
    facettes: 'word-forms',
  },
  ferme: {
    enclos: 'word-classes',
    graines: 'sorting',
    recolte: 'e-er-ez',
    troupeau: 'plurals',
  },
  tour: {
    ascension: 'fluency',
    etages: 'comprehension',
    vitraux: 'sentence-order',
  },
  plaine: {
    tables: 'times-tables',
    complements: 'make-ten',
    doubles: 'doubles-halves',
    passeur: 'word-problems',
  },
  riviere: {
    nenuphars: 'number-line',
    'deux-rives': 'equivalence',
    partage: 'sharing',
    colonnes: 'place-value',
  },
  volcan: {
    cratere: 'ordering',
    coulee: 'operations',
    pente: 'scale',
    geants: 'large-numbers',
  },
  glacier: {
    thermometre: 'thermometer',
    banquise: 'adding',
    crevasses: 'subtracting',
    icebergs: 'fractions',
  },
  marche: {
    etals: 'proportion-tables',
    remises: 'percentages',
    balances: 'ratios',
  },
  carrefour: {
    panneaux: 'pairs',
    aiguillage: 'choices',
    bifurcation: 'homophone-sentences',
  },
  marais: {
    rives: 'past-tenses',
    brume: 'future-tense',
    roseaux: 'subjunctive',
    gue: 'tense-choice',
  },
  forge: {
    etincelles: 'powers',
    enclume: 'square-roots',
    trempe: 'scientific-notation',
  },
  atelier: {
    reduire: 'simplifying',
    developper: 'expanding',
    equilibre: 'equations',
  },
  falaise: {
    corde: 'past-participle',
    paroi: 'adjectives',
    sommet: 'subject-verb',
    echo: 'reflexive-verbs',
  },
  cabinet: { racines: 'word-roots', sens: 'meaning', nuances: 'nuances' },
  belvedere: {
    pythagore: 'pythagoras',
    thales: 'thales',
    trigo: 'trigonometry',
  },
  donnees: { moyenne: 'mean', chances: 'probability', releves: 'data' },
  phare: { images: 'images', droites: 'linear', faisceaux: 'graphs' },
  textes: {
    inferences: 'inference',
    figures: 'figures-of-speech',
    rouages: 'text-connectives',
    voix: 'voices',
  },
  baie: {
    hello: 'hello',
    numbers: 'numbers',
    ears: 'first-listening',
    signs: 'signs',
  },
  horloge: {
    'to-be': 'to-be',
    'have-got': 'have-got',
    'present-simple': 'present-simple',
    story: 'story',
  },
  comptoir: {
    shopping: 'shopping',
    routine: 'routine',
    listening: 'listening',
    notices: 'notices',
  },
  manoir: { ing: 'ing', preterit: 'past-simple', comparatifs: 'comparatives' },
  theatre: {
    dialogues: 'dialogues',
    quantites: 'quantities',
    'preterit-irregulier': 'irregular-past',
    stories: 'stories',
  },
  gare: {
    futur: 'future',
    modaux: 'modals',
    'present-perfect': 'present-perfect',
    traditions: 'traditions',
  },
  studio: {
    comprendre: 'understanding',
    connecteurs: 'linking-words',
    'faux-amis': 'false-friends',
    medias: 'media',
  },
  chateau: { 'for-since': 'for-since', if: 'if', passif: 'passive' },
  relais: {
    'es-hola': 'es-greetings',
    'es-numeros': 'es-numbers',
    'es-familia': 'es-family',
    'es-el-la': 'es-articles',
    'de-hallo': 'de-greetings',
    'de-zahlen': 'de-numbers',
    'de-familie': 'de-family',
    'de-der-die-das': 'de-articles',
  },
  jardin: {
    'es-hora': 'es-time',
    'es-mi-dia': 'es-my-day',
    'es-horario': 'es-timetable',
    'es-ser-estar': 'es-ser-estar',
    'de-uhrzeit': 'de-time',
    'de-mein-tag': 'de-my-day',
    'de-stundenplan': 'de-timetable',
    'de-ich-kann': 'de-modals',
  },
  refuge: {
    'es-viaje': 'es-past',
    'es-relato': 'es-stories',
    'es-paises': 'es-countries',
    'es-porque': 'es-connectives',
    'de-reise': 'de-past',
    'de-geschichte': 'de-stories',
    'de-unterwegs': 'de-on-the-road',
    'de-weil-dass': 'de-connectives',
  },
};

/** Les ressources : le bloc d'un lieu → l'identifiant du lieu ; les blocs assemblés, les trophées, les blocs de finition. */
export const LEGACY_RESOURCES: Readonly<Record<string, string>> = {
  bois: 'french-6e-phonology',
  pierre: 'french-6e-letter-confusion',
  sable: 'french-6e-word-spelling',
  terre: 'french-6e-grammar-spelling',
  verre: 'french-6e-reading',
  brique: 'maths-6e-calculation',
  galet: 'maths-6e-fractions',
  obsidienne: 'maths-6e-decimals',
  glace: 'maths-5e-signed-numbers',
  toile: 'maths-5e-proportionality',
  panneau: 'french-5e-homophones',
  tourbe: 'french-5e-conjugation',
  acier: 'maths-4e-powers',
  calque: 'maths-4e-algebra',
  ardoise: 'french-4e-agreement',
  parchemin: 'french-4e-vocabulary',
  marbre: 'maths-3e-geometry',
  quartz: 'maths-3e-statistics',
  prisme: 'maths-3e-functions',
  lentille: 'french-3e-close-reading',
  cabine: 'english-6e-vocabulary',
  cadran: 'english-6e-grammar',
  tuile: 'english-5e-vocabulary',
  lambris: 'english-5e-grammar',
  velours: 'english-4e-comprehension',
  rail: 'english-4e-grammar',
  antenne: 'english-3e-comprehension',
  taille: 'english-3e-grammar',
  dalle: 'lv2-5e-introductions',
  osier: 'lv2-4e-daily-life',
  bardeau: 'lv2-3e-travel',
  poutre: 'compound-6e',
  vitrail: 'compound-5e',
  engrenage: 'compound-4e',
  miroir: 'compound-3e',
  or: 'trophy-gold',
  cristal: 'trophy-crystal',
  toit: 'roof',
  porte: 'door',
  lanterne: 'lantern',
  barriere: 'fence',
  escalier: 'stairs',
};

/** Les parties des constructions des lieux, et les grandes constructions. */
export const LEGACY_PARTS: Readonly<Record<string, string>> = {
  'foret-cabane': 'french-6e-phonology-1',
  'foret-toit': 'french-6e-phonology-2',
  'foret-cour': 'french-6e-phonology-3',
  'mine-forge': 'french-6e-letter-confusion-1',
  'mine-toit': 'french-6e-letter-confusion-2',
  'mine-cour': 'french-6e-letter-confusion-3',
  'carriere-four': 'french-6e-word-spelling-1',
  'carriere-abri': 'french-6e-word-spelling-2',
  'carriere-cour': 'french-6e-word-spelling-3',
  'ferme-etable': 'french-6e-grammar-spelling-1',
  'ferme-toit': 'french-6e-grammar-spelling-2',
  'ferme-enclos': 'french-6e-grammar-spelling-3',
  'tour-phare': 'french-6e-reading-1',
  'tour-lanterne': 'french-6e-reading-2',
  'tour-quai': 'french-6e-reading-3',
  'plaine-nid': 'maths-6e-calculation-1',
  'plaine-toit': 'maths-6e-calculation-2',
  'plaine-cour': 'maths-6e-calculation-3',
  'riviere-hutte': 'maths-6e-fractions-1',
  'riviere-toit': 'maths-6e-fractions-2',
  'riviere-ponton': 'maths-6e-fractions-3',
  'volcan-abri': 'maths-6e-decimals-1',
  'volcan-toit': 'maths-6e-decimals-2',
  'volcan-terrasse': 'maths-6e-decimals-3',
  'glacier-igloo': 'maths-5e-signed-numbers-1',
  'glacier-toit': 'maths-5e-signed-numbers-2',
  'glacier-patinoire': 'maths-5e-signed-numbers-3',
  'marche-echoppe': 'maths-5e-proportionality-1',
  'marche-toit': 'maths-5e-proportionality-2',
  'marche-etal': 'maths-5e-proportionality-3',
  'carrefour-cabane': 'french-5e-homophones-1',
  'carrefour-toit': 'french-5e-homophones-2',
  'carrefour-rondpoint': 'french-5e-homophones-3',
  'marais-hutte': 'french-5e-conjugation-1',
  'marais-toit': 'french-5e-conjugation-2',
  'marais-ponton': 'french-5e-conjugation-3',
  'forge-atelier': 'maths-4e-powers-1',
  'forge-toit': 'maths-4e-powers-2',
  'forge-cour': 'maths-4e-powers-3',
  'atelier-bureau': 'maths-4e-algebra-1',
  'atelier-toit': 'maths-4e-algebra-2',
  'atelier-terrasse': 'maths-4e-algebra-3',
  'falaise-bergerie': 'french-4e-agreement-1',
  'falaise-toit': 'french-4e-agreement-2',
  'falaise-enclos': 'french-4e-agreement-3',
  'cabinet-nid': 'french-4e-vocabulary-1',
  'cabinet-toit': 'french-4e-vocabulary-2',
  'cabinet-perchoir': 'french-4e-vocabulary-3',
  'belvedere-kiosque': 'maths-3e-geometry-1',
  'belvedere-toit': 'maths-3e-geometry-2',
  'belvedere-terrasse': 'maths-3e-geometry-3',
  'donnees-dome': 'maths-3e-statistics-1',
  'donnees-toit': 'maths-3e-statistics-2',
  'donnees-terrasse': 'maths-3e-statistics-3',
  'phare-lanterne': 'maths-3e-functions-1',
  'phare-toit': 'maths-3e-functions-2',
  'phare-jetee': 'maths-3e-functions-3',
  'textes-lanterne': 'french-3e-close-reading-1',
  'textes-toit': 'french-3e-close-reading-2',
  'textes-coupole': 'french-3e-close-reading-3',
  'baie-cabine': 'english-6e-vocabulary-1',
  'baie-toit': 'english-6e-vocabulary-2',
  'baie-quai': 'english-6e-vocabulary-3',
  'horloge-tour': 'english-6e-grammar-1',
  'horloge-toit': 'english-6e-grammar-2',
  'horloge-cour': 'english-6e-grammar-3',
  'comptoir-boutique': 'english-5e-vocabulary-1',
  'comptoir-toit': 'english-5e-vocabulary-2',
  'comptoir-terrasse': 'english-5e-vocabulary-3',
  'manoir-salon': 'english-5e-grammar-1',
  'manoir-toit': 'english-5e-grammar-2',
  'manoir-jardin': 'english-5e-grammar-3',
  'theatre-loge': 'english-4e-comprehension-1',
  'theatre-toit': 'english-4e-comprehension-2',
  'theatre-scene': 'english-4e-comprehension-3',
  'gare-abri': 'english-4e-grammar-1',
  'gare-toit': 'english-4e-grammar-2',
  'gare-quai': 'english-4e-grammar-3',
  'studio-regie': 'english-3e-comprehension-1',
  'studio-toit': 'english-3e-comprehension-2',
  'studio-terrasse': 'english-3e-comprehension-3',
  'chateau-tour': 'english-3e-grammar-1',
  'chateau-toit': 'english-3e-grammar-2',
  'chateau-rempart': 'english-3e-grammar-3',
  'relais-auberge': 'lv2-5e-introductions-1',
  'relais-ecurie': 'lv2-5e-introductions-2',
  'relais-fontaine': 'lv2-5e-introductions-3',
  'jardin-cuisine': 'lv2-4e-daily-life-1',
  'jardin-tonnelle': 'lv2-4e-daily-life-2',
  'jardin-serre': 'lv2-4e-daily-life-3',
  'refuge-poste': 'lv2-3e-travel-1',
  'refuge-salle': 'lv2-3e-travel-2',
  'refuge-pigeonnier': 'lv2-3e-travel-3',
  'monument-observatoire': 'landmark-6e-1',
  'monument-moulin': 'landmark-6e-2',
  'monument-phare-large': 'landmark-5e-1',
  'monument-kiosque': 'landmark-5e-2',
  'monument-viaduc': 'landmark-4e-1',
  'monument-amphitheatre': 'landmark-4e-2',
  'monument-etoiles': 'landmark-3e-1',
  'monument-temple': 'landmark-3e-2',
};

const has = (o: Readonly<Record<string, unknown>>, k: string): boolean => Object.hasOwn(o, k);

/** Toutes les missions d'avant, de toutes les îles : elles étaient uniques d'une île à l'autre. */
const MISSIONS = Object.fromEntries(Object.values(LEGACY_MISSIONS).flatMap((m) => Object.entries(m)));

export function translatePlaceId(id: string): string {
  return has(LEGACY_PLACES, id) ? LEGACY_PLACES[id] : id;
}

export function translateResourceId(id: string): string {
  return has(LEGACY_RESOURCES, id) ? LEGACY_RESOURCES[id] : id;
}

export function translatePartId(id: string): string {
  return has(LEGACY_PARTS, id) ? LEGACY_PARTS[id] : id;
}

/** Une mission (le `type` d'un exercice, la clé de son niveau adapté). */
export function translateMissionId(id: string): string {
  return has(MISSIONS, id) ? MISSIONS[id] : id;
}

/**
 * Un exercice (ses étoiles, son temps de lecture) : `foret-chasse-son-an` → `french-6e-phonology-sound-hunt-an`. Le
 * Gardien d'une île (`foret-gardien`) devient le défi de son lieu ; la question d'un bloc assemblé
 * (`assemblage-poutre`), `assembly-compound-6e`.
 */
export function translateExerciseId(id: string): string {
  const i = id.indexOf('-');
  if (i < 0) return id;
  const head = id.slice(0, i);
  const rest = id.slice(i + 1);
  if (head === 'assemblage') return has(LEGACY_RESOURCES, rest) ? `assembly-${LEGACY_RESOURCES[rest]}` : id;
  if (!has(LEGACY_PLACES, head)) return id;
  const place = LEGACY_PLACES[head];
  if (rest === 'gardien') return `${place}-challenge`;
  // Les trois premiers niveaux de l'Abattage s'appelaient « échauffement ».
  if (head === 'foret' && rest.startsWith('echauffement-')) return `${place}-syllables-warmup-${rest.slice('echauffement-'.length)}`;
  const missions = LEGACY_MISSIONS[head];
  const mission = Object.keys(missions)
    .sort((a, b) => b.length - a.length)
    .find((m) => rest === m || rest.startsWith(`${m}-`));
  return mission === undefined ? id : `${place}-${missions[mission]}${rest.slice(mission.length)}`;
}

/**
 * Une question de la répétition espacée (`<exercice>:<clé>`) : l'exercice, et la clé quand elle se déduisait de son
 * identifiant (`foret-rimes-eau-3`) ou du bloc assemblé (`poutre-3`).
 */
export function translateItemId(itemId: string): string {
  const i = itemId.indexOf(':');
  if (i < 0) return itemId;
  const def = itemId.slice(0, i);
  return `${translateExerciseId(def)}:${translateItemKey(def, itemId.slice(i + 1))}`;
}

/** La clé d'une question, dans l'exercice d'avant `def`. */
export function translateItemKey(def: string, key: string): string {
  if (key.startsWith(`${def}-`)) return `${translateExerciseId(def)}${key.slice(def.length)}`;
  return translateAssemblyKey(key);
}

/** Une question d'un bloc assemblé, dans son tirage (`poutre-3` → `compound-6e-3`). */
export function translateAssemblyKey(key: string): string {
  const m = /^([a-z]+)-(\d+)$/.exec(key);
  return m && has(LEGACY_RESOURCES, m[1]) && LEGACY_RESOURCES[m[1]].startsWith('compound-') ? `${LEGACY_RESOURCES[m[1]]}-${m[2]}` : key;
}

/** Une liaison construite (`foret-mine`) ou un passage fait (`voyage-5e` → `passage-5e`). */
export function translateLinkId(id: string): string {
  if (id.startsWith('voyage-')) return `passage-${id.slice('voyage-'.length)}`;
  const parts = id.split('-');
  return parts.length === 2 && parts.every((p) => has(LEGACY_PLACES, p)) ? `${LEGACY_PLACES[parts[0]]}-${LEGACY_PLACES[parts[1]]}` : id;
}

/** Les matières d'avant, dans `/matiere/…`. */
const SUBJECTS: Readonly<Record<string, string>> = { francais: 'french', anglais: 'english' };

/** Les lieux du village et les pages de l'aventure, dans les adresses d'avant. */
const PAGES: Readonly<Record<string, string>> = {
  monde: 'world',
  carte: 'map',
  menu: 'menu',
  blocs: 'stock',
  monuments: 'landmarks',
  ecole: 'school',
  trophees: 'trophies',
  assemblage: 'assembly',
  voyage: 'passage',
};

/**
 * Une adresse d'avant (`/aventure/foret/chasse-son`, un favori, un lien d'enseignant, « Continuer ») → la neuve
 * (`/adventure/french-6e-phonology/sound-hunt`) ; `/matiere/francais` → `/matiere/french`. Une autre adresse passe
 * telle quelle.
 */
export function translatePath(path: string): string {
  const q = path.indexOf('?');
  const route = q < 0 ? path : path.slice(0, q);
  const query = q < 0 ? '' : path.slice(q + 1);
  const segs = route.split('/');
  if (segs[1] === 'matiere' && segs.length === 3 && has(SUBJECTS, segs[2])) return `/matiere/${SUBJECTS[segs[2]]}${q < 0 ? '' : path.slice(q)}`;
  if (segs[1] !== 'aventure') return path;
  const [, , first, second] = segs;
  const out = ['', 'adventure'];
  if (first !== undefined && first !== '') {
    if (has(PAGES, first)) {
      out.push(PAGES[first]);
      if (second !== undefined) out.push(first === 'assemblage' ? translateResourceId(second) : second);
    } else if (has(LEGACY_PLACES, first)) {
      out.push(LEGACY_PLACES[first]);
      if (second !== undefined) out.push(second === 'gardien' ? 'challenge' : (has(LEGACY_MISSIONS[first], second) ? LEGACY_MISSIONS[first][second] : second));
    } else {
      out.push(translatePartId(first));
      if (second !== undefined) out.push(second);
    }
    // Ce qui suit (une adresse fausse) passe tel quel : la page introuvable s'affiche, comme avant.
    out.push(...segs.slice(4));
  }
  const params = new URLSearchParams(query);
  const chantier = params.get('chantier');
  if (chantier !== null) {
    params.delete('chantier');
    params.set('worksite', chantier === 'navire' ? 'vehicle' : chantier === 'plan' ? 'part' : translateLinkId(chantier));
  }
  // Le bloc assemblé demandé à la Fabrique (`?bloc=poutre`).
  const bloc = params.get('bloc');
  if (bloc !== null) params.set('bloc', translateResourceId(bloc));
  const porte = params.get('porte');
  if (porte !== null) {
    params.delete('porte');
    params.set('door', porte === 'francais' ? 'french' : porte === 'anglais' ? 'english' : porte);
  }
  const rest = params.toString();
  return out.join('/') + (rest ? `?${rest}` : '');
}

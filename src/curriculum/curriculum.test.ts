import { CYCLE_OF, DISCIPLINES, DOMAINES, PROGRAMME, SOURCES, byId, domaineOf, entriesOf, sourceOf } from './index';
import { EXCLUSIONS } from './exclusions';
import { COFFRE_HORS_LISTE, MOTS_OUTILS_CE1, MOTS_OUTILS_CP, MOTS_OUTILS_SOURCE, motDictable, motsOutilsDictables } from './functionWords';

const SHORTS = Object.values(DISCIPLINES).map((d) => d.short).join('|');
// c<cycle>.<short>[.<classe>].<domaine>.<compétence> : la classe, pour les textes rangés par classe (types.ts).
const ID = new RegExp(`^c[34]\\.(${SHORTS})(\\.[3-6]e)?\\.[a-z0-9-]+\\.[a-z0-9-]+$`);
const straightApostrophe = (t: string) => t.includes("'");

/** Les LV2 commencent en 5e : elles n'ont que le cycle 4. */
const LV2 = ['german', 'spanish'] as const;

/** L'option langues et cultures de l'Antiquité (latin, grec) commence en 5e : elle n'a que le cycle 4. */
const LCA = ['latin', 'greek'] as const;
const CYCLE4_SEUL: readonly string[] = [...LV2, ...LCA];

/**
 * L'enseignement moral et civique : un texte rangé par classe, une compétence par thème, au grain d'une mission (3 thèmes
 * en 6e, 2 en 5e, 2 en 4e, 3 en 3e). Il a donc moins de compétences que le plancher des autres disciplines.
 */
const EMC_THEMES = { '6e': 3, '5e': 2, '4e': 2, '3e': 3 } as const;

it('le référentiel a une taille raisonnable et chaque discipline est présente dans ses cycles', () => {
  // 188 compétences pour le français, les maths et l'anglais, plus 20 par LV2 (le programme de langues vivantes du
  // cycle 4 est commun à toutes les langues) : le plafond passe de 200 à 250 pour les accueillir, puis à 300 pour
  // l'histoire et la géographie et les sciences de 6e. L'histoire et la géographie du cycle 4 (28 compétences) y
  // tiennent : 284 en tout. Le plafond passe à 320 pour la SVT, la physique-chimie et la technologie du cycle 4
  // (34 compétences) : 318 en tout. Le plafond passe à 350 quand les sciences sont relues dans les textes en vigueur
  // (7 octobre 2026) : neuf compétences de plus en 6e (programme de 2023), cinq de plus en technologie du cycle 4
  // (programme de 2024, trois thèmes et neuf compétences de fin de cycle). Le plafond passe à 450 quand la 6e et la 5e
  // suivent les textes en vigueur (7 octobre 2026) : le français, les maths et l'anglais de 6e réécrits sur les textes
  // de 2025 (87 compétences au lieu de 73), et 82 compétences de 5e (français et maths de 2026, anglais, allemand et
  // espagnol de 2025) à côté de celles de 2020, réservées à la 4e et à la 3e : 427 en tout. L'enseignement moral et
  // civique (8 octobre 2026) y ajoute 10 compétences, une par thème : 437 en tout, sous le même plafond. Le plafond passe
  // à 500 pour le latin et le grec ancien (option LCA, 8 octobre 2026) : 29 et 26 compétences, 492 en tout.
  expect(PROGRAMME.length).toBeGreaterThanOrEqual(100);
  expect(PROGRAMME.length).toBeLessThanOrEqual(500);
  for (const discipline of Object.keys(DISCIPLINES) as (keyof typeof DISCIPLINES)[]) {
    if (discipline === 'civics') continue;
    if (CYCLE4_SEUL.includes(discipline)) expect(entriesOf(3, discipline), `${discipline} : rien au cycle 3`).toHaveLength(0);
    else expect(entriesOf(3, discipline).length, `${discipline}, cycle 3`).toBeGreaterThanOrEqual(10);
    expect(entriesOf(4, discipline).length, `${discipline}, cycle 4`).toBeGreaterThanOrEqual(10);
  }
});

it('l’enseignement moral et civique a une compétence par thème, dans chaque classe, sur le programme de 2024', () => {
  const emc = [...entriesOf(3, 'civics'), ...entriesOf(4, 'civics')];
  for (const [classe, themes] of Object.entries(EMC_THEMES)) {
    const list = emc.filter((e) => e.classes.includes(classe as keyof typeof EMC_THEMES));
    expect(list, `EMC, ${classe}`).toHaveLength(themes);
    // Un thème, un domaine : deux compétences ne partagent pas un domaine.
    expect(new Set(list.map((e) => e.domaine)).size, `EMC, ${classe}`).toBe(themes);
  }
  for (const e of emc) {
    expect(e.source, e.id).toBe('emc-2024');
    expect(e.classes, e.id).toHaveLength(1);
  }
});

it('le latin et le grec suivent le programme de LCA de 2016 : la culture de 5e et 4e et l’ensemble commun de 3e sont les mêmes', () => {
  const la = entriesOf(4, 'latin');
  const gr = entriesOf(4, 'greek');
  for (const e of [...la, ...gr]) expect(e.source, e.id).toBe('lca-2016');
  // Chaque classe a sa culture et sa langue, dans chaque langue.
  for (const list of [la, gr]) {
    for (const classe of ['5e', '4e', '3e'] as const) {
      const domaines = new Set(list.filter((e) => e.classes.includes(classe)).map((e) => e.domaine.replace(/^c4-(la|gr)-(3e-)?/, '')));
      expect([...domaines].sort(), `${list[0].discipline}, ${classe}`).toEqual(['culture', 'langue', 'lecture', 'reperes']);
    }
  }
  // Le texte ne donne qu'une liste de thèmes pour la 5e et la 4e, et un ensemble commun en 3e : mêmes libellés et pages.
  const communs = (e: { id: string }) => /^c4\.(la|gr)\.(culture\.|3e\.culture\.mediterranee|reperes\.|langue\.cas-fonctions|langue\.lexique)/.test(e.id);
  const laCommuns = la.filter(communs);
  expect(gr.filter(communs).map((e) => [e.id.replace('c4.gr.', 'c4.la.'), e.classes, e.competence, e.page])).toEqual(
    laCommuns.map((e) => [e.id, e.classes, e.competence, e.page]),
  );
  // Ce que l'écran ne fait pas (lire à voix haute, traduire soi-même, commenter) est hors périmètre ; le reste, à couvrir,
  // sauf ce que travaille déjà la Grotte des légendes (5e, LCA-2), sorti des exclusions (game/curriculum.test.ts).
  for (const e of [...la, ...gr]) {
    const hors = /\.lecture\.(lire-oralement|traduire|interpreter)$/.test(e.id);
    const kind = EXCLUSIONS[e.id as keyof typeof EXCLUSIONS]?.kind;
    if (kind === undefined && !hors) continue;
    expect(kind, e.id).toBe(hors ? 'hors-perimetre' : 'a-couvrir');
  }
});

it('chaque LV2 reprend le programme de langues vivantes de 2020 de l’anglais en 4e et 3e : mêmes compétences, libellés et pages', () => {
  // Le texte de 2020 est commun à toutes les langues ; ceux de 2025 (la 5e) sont propres à chaque langue.
  const de2020 = (e: { source: string }) => e.source === 'c4';
  const en = entriesOf(4, 'english').filter(de2020);
  for (const discipline of LV2) {
    const short = DISCIPLINES[discipline].short;
    const lv = entriesOf(4, discipline).filter(de2020);
    expect(lv.map((e) => e.id)).toEqual(en.map((e) => e.id.replace('c4.en.', `c4.${short}.`)));
    lv.forEach((e, i) => {
      expect([e.attendu, e.competence, e.page], e.id).toEqual([en[i].attendu, en[i].competence, en[i].page]);
      expect(domaineOf(e)!.title, e.id).toBe(domaineOf(en[i])!.title);
    });
  }
});

it('chaque compétence a un identifiant unique, au format, cohérent avec son cycle, sa discipline et son domaine', () => {
  const ids = PROGRAMME.map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const e of PROGRAMME) {
    expect(e.id).toMatch(ID);
    const parts = e.id.split('.');
    const [cycle, short] = parts;
    const classe = parts.length === 5 ? parts[2] : undefined;
    const domaine = parts.length === 5 ? `${classe}-${parts[3]}` : parts[2];
    expect(cycle, e.id).toBe(`c${e.cycle}`);
    expect(short, e.id).toBe(DISCIPLINES[e.discipline].short);
    // Les classes : au moins une, toutes du cycle, toutes régies par le texte cité ; la classe de l'identifiant, seule.
    expect(e.classes.length, e.id).toBeGreaterThanOrEqual(1);
    for (const c of e.classes) {
      expect(CYCLE_OF[c], `${e.id} : ${c} n’est pas du cycle ${e.cycle}`).toBe(e.cycle);
      expect(SOURCES[e.source].classes, `${e.id} : ${c} n’est pas régie par ${e.source}`).toContain(c);
    }
    if (classe) expect(e.classes, e.id).toEqual([classe]);
    const d = domaineOf(e);
    expect(d, `${e.id} : domaine ${e.domaine} inconnu`).toBeTruthy();
    expect(d!.cycle, e.id).toBe(e.cycle);
    expect(d!.discipline, e.id).toBe(e.discipline);
    expect(e.domaine, e.id).toBe(`c${e.cycle}-${short}-${domaine}`);
    expect(byId(e.id)).toBe(e);
  }
});

/**
 * Les compétences dont la page précède celle de leur domaine : le texte de 2025 ne nomme plus en 6e les correspondances
 * entre graphèmes et phonèmes, que la compétence cite dans ses principes (page 2) ; elle reste dans le domaine de la
 * langue, où les îles la travaillent (cycle3.ts).
 */
const PAGE_AVANT_DOMAINE = new Set(['c3.fr.langue.phonemes-graphemes']);

it('les libellés sont courts, sans apostrophe droite ni barre verticale, avec une page du PDF source', () => {
  for (const e of PROGRAMME) {
    // L'attendu des textes de 2025 et 2026 est un titre du texte, parfois d'un mot (« Angles ») ; la compétence, jamais.
    for (const [text, min] of [[e.attendu, 5], [e.competence, 11]] as const) {
      expect(text.length, e.id).toBeGreaterThanOrEqual(min);
      expect(text.length, e.id).toBeLessThan(400);
      expect(straightApostrophe(text), `${e.id} : apostrophe droite`).toBe(false);
      expect(text.includes('|'), `${e.id} : barre verticale`).toBe(false);
    }
    const d = domaineOf(e)!;
    const source = sourceOf(d);
    // La compétence cite le texte de son domaine (un texte de langues vivantes vaut pour les deux cycles du collège).
    expect(e.source, `${e.id} : source différente de celle du domaine ${d.id}`).toBe(source.id);
    expect(e.page, e.id).toBeGreaterThanOrEqual(1);
    expect(e.page, e.id).toBeLessThanOrEqual(source.pages);
    if (!PAGE_AVANT_DOMAINE.has(e.id)) expect(e.page, `${e.id} : avant la page du domaine`).toBeGreaterThanOrEqual(d.page);
  }
  const domaineIds = DOMAINES.map((d) => d.id);
  expect(new Set(domaineIds).size).toBe(domaineIds.length);
  for (const d of DOMAINES) expect(d.id).toMatch(new RegExp(`^c[34]-(${SHORTS})-[a-z0-9-]+$`));
});

it('les sources disent d’où vient le texte : jeu de données, PDF, licence, texte réglementaire, date', () => {
  for (const s of Object.values(SOURCES)) {
    // Le ministère : data.gouv.fr, le Bulletin officiel ou éduscol.
    expect(s.datasetUrl).toMatch(/^https:\/\/(www\.data\.gouv\.fr|www\.education\.gouv\.fr|eduscol\.education\.gouv\.fr)\//);
    if (s.pdfCopyBy) {
      // Un texte que le Bulletin officiel ne publie qu'en HTML : la page du BO, et une copie PDF dont l'auteur est nommé.
      expect(s.datasetUrl, s.id).toMatch(/^https:\/\/www\.education\.gouv\.fr\/bo\/.+\.htm$/);
      // Les hôtes de copie sont épinglés : en ajouter un se décide dans la pull request.
      expect(s.pdfUrl, s.id).toMatch(/^https:\/\/www\.arretetonchar\.fr\/.+\.pdf$/);
    } else {
      expect(s.pdfUrl).toMatch(/^https:\/\/(static\.data\.gouv\.fr|www\.education\.gouv\.fr|eduscol\.education\.gouv\.fr)\/.+\.pdf$/);
    }
    expect(s.licence.name).toMatch(/Licence Ouverte|réutilisation libre/);
    expect(s.licence.url).toMatch(/^https:\/\//);
    // Le texte réglementaire tel qu'il est lu : numéro et date du Bulletin officiel, numéro et année quand la date n'a
    // pas été lue, ou l'aveu que le PDF ne le dit pas (sources.ts) ; jamais une référence inventée.
    expect(s.legal).toMatch(/Bulletin officiel n° \d+ (du .+|de) 20\d\d|Bulletin officiel : référence non lue/);
    expect(s.classes.length, s.id).toBeGreaterThanOrEqual(1);
    expect(s.consulted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(s.pages).toBeGreaterThan(10);
  }
});

it('chaque exclusion vise une compétence existante et donne un motif', () => {
  for (const [id, x] of Object.entries(EXCLUSIONS)) {
    expect(byId(id), `${id} : compétence inconnue`).toBeTruthy();
    expect(['hors-perimetre', 'a-couvrir']).toContain(x!.kind);
    expect(x!.motif.length, id).toBeGreaterThanOrEqual(10);
    expect(straightApostrophe(x!.motif), `${id} : apostrophe droite`).toBe(false);
  }
});

it('la liste des mots-outils est citée en entier, sans doublon, avec sa provenance', () => {
  expect(MOTS_OUTILS_CP).toHaveLength(79);
  expect(MOTS_OUTILS_CE1).toHaveLength(70);
  const all = [...MOTS_OUTILS_CP, ...MOTS_OUTILS_CE1];
  expect(new Set(all).size).toBe(all.length);
  for (const m of all) {
    expect(m).toBe(m.trim());
    expect(m).toBe(m.toLowerCase());
    expect(straightApostrophe(m), m).toBe(false);
  }
  expect(motDictable('ne… jamais')).toBe('jamais');
  expect(motsOutilsDictables().has('jamais')).toBe(true);
  expect(motsOutilsDictables().has('ne… pas')).toBe(false);
  expect(MOTS_OUTILS_SOURCE.pdfUrl).toMatch(/^https:\/\/static\.data\.gouv\.fr\//);
  expect(MOTS_OUTILS_SOURCE.licence.name).toContain('Licence Ouverte');
  for (const [mot, motif] of Object.entries(COFFRE_HORS_LISTE)) {
    expect(motsOutilsDictables().has(mot), `${mot} est dans la liste officielle : retirer l’exception`).toBe(false);
    expect(motif.length).toBeGreaterThan(10);
  }
});

import { DISCIPLINES, DOMAINES, PROGRAMME, SOURCES, byId, domaineOf, entriesOf } from './index';
import { EXCLUSIONS } from './exclusions';
import { COFFRE_HORS_LISTE, MOTS_OUTILS_CE1, MOTS_OUTILS_CP, MOTS_OUTILS_SOURCE, motDictable, motsOutilsDictables } from './functionWords';

const SHORTS = Object.values(DISCIPLINES).map((d) => d.short).join('|');
const ID = new RegExp(`^c[34]\\.(${SHORTS})\\.[a-z0-9-]+\\.[a-z0-9-]+$`);
const straightApostrophe = (t: string) => t.includes("'");

/** Les LV2 commencent en 5e : elles n'ont que le cycle 4. */
const LV2 = ['german', 'spanish'] as const;
/** L'histoire et la géographie et les sciences n'ont pour l'instant que la 6e (cycle 3) : le cycle 4 viendra avec leurs îles. */
const CYCLE_3_ONLY: readonly string[] = ['history-geography', 'life-earth-sciences', 'physics-chemistry', 'technology'];

it('le référentiel a une taille raisonnable et chaque discipline est présente dans ses cycles', () => {
  // 188 compétences pour le français, les maths et l'anglais, plus 20 par LV2 (le programme de langues vivantes du
  // cycle 4 est commun à toutes les langues) : le plafond passe de 200 à 250 pour les accueillir, puis à 300 pour
  // l'histoire et la géographie et les sciences de 6e.
  expect(PROGRAMME.length).toBeGreaterThanOrEqual(100);
  expect(PROGRAMME.length).toBeLessThanOrEqual(300);
  for (const discipline of Object.keys(DISCIPLINES) as (keyof typeof DISCIPLINES)[]) {
    const lv2 = (LV2 as readonly string[]).includes(discipline);
    if (lv2) expect(entriesOf(3, discipline), `${discipline} : pas de LV2 au cycle 3`).toHaveLength(0);
    else expect(entriesOf(3, discipline).length, `${discipline}, cycle 3`).toBeGreaterThanOrEqual(10);
    if (CYCLE_3_ONLY.includes(discipline)) expect(entriesOf(4, discipline), `${discipline} : pas encore de cycle 4`).toHaveLength(0);
    else expect(entriesOf(4, discipline).length, `${discipline}, cycle 4`).toBeGreaterThanOrEqual(10);
  }
});

it('chaque LV2 reprend le programme de langues vivantes de l’anglais au cycle 4 : mêmes compétences, libellés et pages', () => {
  const en = entriesOf(4, 'english');
  for (const discipline of LV2) {
    const short = DISCIPLINES[discipline].short;
    const lv = entriesOf(4, discipline);
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
    const [cycle, short, domaine] = e.id.split('.');
    expect(cycle, e.id).toBe(`c${e.cycle}`);
    expect(short, e.id).toBe(DISCIPLINES[e.discipline].short);
    const d = domaineOf(e);
    expect(d, `${e.id} : domaine ${e.domaine} inconnu`).toBeTruthy();
    expect(d!.cycle, e.id).toBe(e.cycle);
    expect(d!.discipline, e.id).toBe(e.discipline);
    expect(e.domaine, e.id).toBe(`c${e.cycle}-${short}-${domaine}`);
    expect(byId(e.id)).toBe(e);
  }
});

it('les libellés sont courts, sans apostrophe droite ni barre verticale, avec une page du PDF source', () => {
  for (const e of PROGRAMME) {
    for (const text of [e.attendu, e.competence]) {
      expect(text.length, e.id).toBeGreaterThan(10);
      expect(text.length, e.id).toBeLessThan(400);
      expect(straightApostrophe(text), `${e.id} : apostrophe droite`).toBe(false);
      expect(text.includes('|'), `${e.id} : barre verticale`).toBe(false);
    }
    const source = SOURCES[`c${e.cycle}`];
    expect(e.page, e.id).toBeGreaterThanOrEqual(1);
    expect(e.page, e.id).toBeLessThanOrEqual(source.pages);
    const d = domaineOf(e)!;
    expect(e.page, `${e.id} : avant la page du domaine`).toBeGreaterThanOrEqual(d.page);
  }
  const domaineIds = DOMAINES.map((d) => d.id);
  expect(new Set(domaineIds).size).toBe(domaineIds.length);
  for (const d of DOMAINES) expect(d.id).toMatch(new RegExp(`^c[34]-(${SHORTS})-[a-z0-9-]+$`));
});

it('les sources disent d’où vient le texte : jeu de données, PDF, licence, texte réglementaire, date', () => {
  for (const s of Object.values(SOURCES)) {
    expect(s.datasetUrl).toMatch(/^https:\/\/www\.data\.gouv\.fr\//);
    expect(s.pdfUrl).toMatch(/^https:\/\/static\.data\.gouv\.fr\/.+\.pdf$/);
    expect(s.licence.name).toContain('Licence Ouverte');
    expect(s.licence.url).toMatch(/^https:\/\//);
    expect(s.legal).toContain('2020');
    expect(s.consulted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(s.pages).toBeGreaterThan(50);
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

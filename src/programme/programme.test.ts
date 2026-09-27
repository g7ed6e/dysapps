import { DISCIPLINES, DOMAINES, PROGRAMME, SOURCES, byId, domaineOf, entriesOf } from './index';
import { EXCLUSIONS } from './exclusions';
import { COFFRE_HORS_LISTE, MOTS_OUTILS_CE1, MOTS_OUTILS_CP, MOTS_OUTILS_SOURCE, motDictable, motsOutilsDictables } from './motsOutils';

const ID = /^c[34]\.(fr|ma|en)\.[a-z0-9-]+\.[a-z0-9-]+$/;
const straightApostrophe = (t: string) => t.includes("'");

it('le référentiel a une taille raisonnable et chaque discipline est présente dans les deux cycles', () => {
  expect(PROGRAMME.length).toBeGreaterThanOrEqual(100);
  expect(PROGRAMME.length).toBeLessThanOrEqual(200);
  for (const discipline of Object.keys(DISCIPLINES) as (keyof typeof DISCIPLINES)[]) {
    expect(entriesOf(3, discipline).length, `${discipline}, cycle 3`).toBeGreaterThanOrEqual(10);
    expect(entriesOf(4, discipline).length, `${discipline}, cycle 4`).toBeGreaterThanOrEqual(10);
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
  for (const d of DOMAINES) expect(d.id).toMatch(/^c[34]-(fr|ma|en)-[a-z0-9-]+$/);
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

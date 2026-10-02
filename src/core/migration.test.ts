// La sauvegarde aux mots neutres : une sauvegarde ancienne complète devient la même sous les nouveaux noms, sans un
// chiffre de moins, et rien ne se perd quand l'appareil refuse d'écrire ou quand la sauvegarde est gelée.
import { sanitizeState } from '../blocland/engine';
import { planCells, getPlan } from '../blocland/world/plans';
import { planV1 } from '../blocland/world/plansV1';
import { tirageNeuf } from '../blocland/world/assemblage';
import { GAME_VERSION, KEY_MOVES, migrateStorage, translateGame, translateProgress, translateSettings } from './migration';
import { sanitizeProgress } from './progress';
import { sanitizeSettings } from './settings';
import { degelerSauvegarde, gelerSauvegarde } from './storage';

const cabane = getPlan('foret-cabane')!;
const cabaneV1 = [...planV1('foret-cabane')!.blocks.keys()];
const cour = getPlan('foret-cour')!;
const courDebut = planCells(cour)
  .slice(0, 3)
  .map((c) => c.key);
const tirage = { ...tirageNeuf('graine'), tour: 1, recentes: ['q1'], ratees: ['q2'] };

/** Une sauvegarde d'avant les mots neutres, avec toutes ses clés et tous ses champs, et les plus anciennes formes. */
const ANCIENNE = {
  blocland: {
    progress: { 'foret-rimes-1': { stars: 3, attempts: 2, best: 1 }, 'mine-lettres-1': { stars: 1, attempts: 1, best: 0.5 } },
    spaced: [{ itemId: 'foret-rimes-1:chat', due: '2026-10-03', stage: 1, streak: 1 }],
    inventory: { bois: 7, pierre: 2, toit: 9, lanterne: 1 },
    streak: { current: 4, lastDay: '2026-10-01', cracked: false },
    types: { rimes: { level: 2, recent: [0.8, 1] } },
    chests: 2,
    fluence: { 'texte-loup': [52, 47] },
    // L'ancien chantier (grille 8 × 8) et l'ancienne zone libre : leurs blocs reviennent au stock.
    build: [{ x: 1, y: 1, z: 0, block: 'bois' }],
    village: {
      // La cabane terminée avec l'ancien dessin (plansV1) ; la cour commencée avec le nouveau.
      plans: { 'foret-cabane': cabaneV1, 'foret-cour': courDebut },
      journal: [{ day: '2026-09-20', plan: 'foret-cabane' }],
      bridges: ['foret-mine'],
      at: 'mine',
      placed: { foret: [{ x: 2, y: 1, z: 0, block: 'pierre' }] },
    },
    assemblageTirage: { poutre: tirage },
  },
  progress: {
    xp: 1234,
    totalAnswers: 210,
    correctAnswers: 180,
    currentStreak: 3,
    bestStreak: 12,
    sessionsCompleted: 25,
    perfectSessions: 6,
    plansCompleted: 4,
    bossesBeaten: 2,
    voyages: 1,
    monumentsCompleted: 1,
    badges: { 'premier-pas': '2026-09-01T10:00:00.000Z' },
    apps: { tables: { sessions: 3, bestScore: 90, lastPlayed: '2026-09-30T10:00:00.000Z' } },
  },
  settings: {
    font: 'luciole',
    fontSize: 22,
    theme: 'nuit',
    worldView: 'liste',
    worldLight: 'jour',
    startIn: 'village',
    lv2: 'aucune',
    univers: 'blocland',
  },
  reprise: { path: '/aventure/foret/rimes', label: 'Rimes · Forêt des sons' },
  tutos: { 'village-immersif': true, 'archipel-5e': true },
  baleine: { 'baleine-6e-arrivee': true },
  rallumage: { foret: true },
  'noms-archipels': { dit: true },
  'univers-message': { dit: false },
};

/** La même, aux mots neutres : rien n'est perdu, les anciennes formes passent telles quelles. */
const ATTENDUE = {
  game: {
    progress: ANCIENNE.blocland.progress,
    spaced: ANCIENNE.blocland.spaced,
    stock: { bois: 7, pierre: 2, toit: 9, lanterne: 1 },
    streak: ANCIENNE.blocland.streak,
    types: ANCIENNE.blocland.types,
    chests: 2,
    fluency: { 'texte-loup': [52, 47] },
    build: [{ x: 1, y: 1, z: 0, block: 'bois' }],
    world: {
      parts: { 'foret-cabane': cabaneV1, 'foret-cour': courDebut },
      log: [{ day: '2026-09-20', part: 'foret-cabane' }],
      links: ['foret-mine'],
      place: 'mine',
      placed: { foret: [{ x: 2, y: 1, z: 0, block: 'pierre' }] },
    },
    assemblyDraw: { poutre: tirage },
    version: GAME_VERSION,
  },
  progress: {
    xp: 1234,
    totalAnswers: 210,
    correctAnswers: 180,
    currentStreak: 3,
    bestStreak: 12,
    sessionsCompleted: 25,
    perfectSessions: 6,
    structuresCompleted: 4,
    challengesWon: 2,
    passages: 1,
    landmarksCompleted: 1,
    badges: ANCIENNE.progress.badges,
    apps: ANCIENNE.progress.apps,
  },
  settings: { ...ANCIENNE.settings, theme: 'night', worldView: 'list', worldLight: 'day', startIn: 'world', lv2: 'none' },
  resume: ANCIENNE.reprise,
  tutorials: ANCIENNE.tutos,
  'guide-messages': ANCIENNE.baleine,
  'guardians-seen': ANCIENNE.rallumage,
  'region-names': { said: true },
  'universe-message': { said: false },
};

function ranger(sauvegarde: Record<string, unknown>): void {
  for (const [cle, valeur] of Object.entries(sauvegarde)) localStorage.setItem(`dysapps:${cle}`, JSON.stringify(valeur));
}

/** Tout ce que l'appareil range, clé par clé, tel quel. */
function appareil(): Record<string, string> {
  const tout: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i)!;
    tout[cle] = localStorage.getItem(cle)!;
  }
  return tout;
}

const lire = (cle: string): unknown => JSON.parse(localStorage.getItem(`dysapps:${cle}`)!);

it('une sauvegarde ancienne complète devient la même sous les mots neutres', () => {
  ranger(ANCIENNE);
  migrateStorage();
  const apres: Record<string, unknown> = {};
  for (const cle of Object.keys(appareil())) apres[cle.slice('dysapps:'.length)] = lire(cle.slice('dysapps:'.length));
  expect(apres).toEqual(ATTENDUE);
});

it('les anciennes clés ont disparu, chacune remplacée par sa nouvelle', () => {
  ranger(ANCIENNE);
  migrateStorage();
  for (const { from, to } of KEY_MOVES) {
    expect(localStorage.getItem(`dysapps:${from}`), from).toBeNull();
    expect(localStorage.getItem(`dysapps:${to}`), to).not.toBeNull();
  }
});

it('la partie et la progression lues gardent chaque compteur, un à un', () => {
  ranger(ANCIENNE);
  const avant = sanitizeState(ANCIENNE.blocland);
  const progressionAvant = sanitizeProgress(ANCIENNE.progress);
  migrateStorage();
  const partie = sanitizeState(lire('game'));
  // La partie lue après la migration est celle qu'on lisait avant, au chiffre près.
  expect(partie).toEqual(avant);
  expect(partie.version).toBe(GAME_VERSION);
  expect(partie.progress).toEqual(ANCIENNE.blocland.progress);
  expect(partie.spaced).toEqual(ANCIENNE.blocland.spaced);
  expect(partie.streak).toEqual(ANCIENNE.blocland.streak);
  expect(partie.chests).toBe(2);
  expect(partie.fluency).toEqual({ 'texte-loup': [52, 47] });
  expect(partie.assemblyDraw).toEqual({ poutre: tirage });
  expect(partie.world.links).toContain('foret-mine');
  expect(partie.world.place).toBe('mine');
  expect(partie.world.log).toEqual([{ day: '2026-09-20', part: 'foret-cabane' }]);
  // La cabane terminée avec l'ancien dessin reste terminée ; la cour garde ses trois cases.
  expect(partie.world.parts['foret-cabane']).toEqual(planCells(cabane).map((c) => c.key));
  expect(partie.world.parts['foret-cour']).toEqual(courDebut);
  // Le stock : 7 bois + 1 de l'ancien chantier ; 2 pierres + 1 de l'ancienne zone libre ; le coffre du nouveau dessin.
  expect(partie.stock.bois).toBe(7 + 1);
  expect(partie.stock.pierre).toBe(2 + 1);
  expect(partie.stock.toit).toBe(avant.stock.toit);
  expect(partie.stock.lanterne).toBe(avant.stock.lanterne);
  const progression = sanitizeProgress(lire('progress'));
  expect(progression).toEqual(progressionAvant);
  expect(progression.xp).toBe(1234);
  expect(progression.totalAnswers).toBe(210);
  expect(progression.correctAnswers).toBe(180);
  expect(progression.sessionsCompleted).toBe(25);
  expect(progression.perfectSessions).toBe(6);
  expect(progression.structuresCompleted).toBe(4);
  expect(progression.challengesWon).toBe(2);
  expect(progression.passages).toBe(1);
  expect(progression.landmarksCompleted).toBe(1);
  expect(progression.badges).toEqual(ANCIENNE.progress.badges);
  expect(sanitizeSettings(lire('settings') as never)).toEqual(sanitizeSettings(ANCIENNE.settings as never));
});

it('un stockage plein garde l’ancienne clé, à traduire au prochain chargement', () => {
  ranger(ANCIENNE);
  const setItem = Storage.prototype.setItem;
  const espion = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
    if (k === 'dysapps:game') throw new DOMException('plein', 'QuotaExceededError');
    setItem.call(this, k, v);
  });
  migrateStorage();
  espion.mockRestore();
  expect(localStorage.getItem('dysapps:blocland')).toBe(JSON.stringify(ANCIENNE.blocland));
  expect(localStorage.getItem('dysapps:game')).toBeNull();
  // Les autres clés, elles, sont passées.
  expect(lire('resume')).toEqual(ANCIENNE.reprise);
  // Au chargement suivant, la place revenue, la partie passe à son tour.
  migrateStorage();
  expect(localStorage.getItem('dysapps:blocland')).toBeNull();
  expect(lire('game')).toEqual(ATTENDUE.game);
});

it('une écriture qui ne se relit pas pareil garde l’ancienne clé', () => {
  ranger(ANCIENNE);
  const setItem = Storage.prototype.setItem;
  const espion = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, k: string, v: string) {
    setItem.call(this, k, k === 'dysapps:game' ? '{}' : v);
  });
  migrateStorage();
  espion.mockRestore();
  expect(localStorage.getItem('dysapps:blocland')).toBe(JSON.stringify(ANCIENNE.blocland));
});

it('une sauvegarde gelée reste intacte, octet pour octet', () => {
  ranger(ANCIENNE);
  const avant = appareil();
  gelerSauvegarde();
  try {
    migrateStorage();
  } finally {
    degelerSauvegarde();
  }
  expect(appareil()).toEqual(avant);
});

it('passer deux fois ne change rien de plus', () => {
  ranger(ANCIENNE);
  migrateStorage();
  const une = appareil();
  migrateStorage();
  expect(appareil()).toEqual(une);
  // Une sauvegarde déjà neuve ne bouge pas non plus.
  localStorage.clear();
  ranger(ATTENDUE);
  const neuve = appareil();
  migrateStorage();
  expect(appareil()).toEqual(neuve);
});

it('une ancienne clé restée d’une migration interrompue s’efface, sans rien perdre', () => {
  ranger({ ...ATTENDUE, blocland: ANCIENNE.blocland });
  migrateStorage();
  expect(lire('game')).toEqual(ATTENDUE.game);
  expect(localStorage.getItem('dysapps:blocland')).toBeNull();
});

it('un vieil onglet a écrit `blocland` après la migration : sa partie, plus récente, est gardée', () => {
  ranger({ game: { stock: { bois: 3 }, version: GAME_VERSION }, blocland: { inventory: { bois: 99 } }, reprise: ANCIENNE.reprise });
  migrateStorage();
  expect(lire('game')).toEqual({ stock: { bois: 99 }, version: GAME_VERSION });
  expect(localStorage.getItem('dysapps:blocland')).toBeNull();
  expect(lire('resume')).toEqual(ANCIENNE.reprise);
});

it('dans une partie, un champ neuf a priorité sur l’ancien', () => {
  expect(translateGame({ stock: { bois: 1 }, inventory: { bois: 9 }, world: { parts: {}, plans: { x: [] }, at: 'mine' } })).toEqual({
    stock: { bois: 1 },
    world: { parts: {}, place: 'mine' },
  });
  expect(translateProgress({ passages: 2, voyages: 1 })).toEqual({ passages: 2 });
});

it('une partie lue sans migration (tolérance) est traduite par sanitizeState', () => {
  expect(sanitizeState(ANCIENNE.blocland)).toEqual(sanitizeState(ATTENDUE.game));
  expect(sanitizeProgress(ANCIENNE.progress)).toEqual(sanitizeProgress(ATTENDUE.progress));
  expect(sanitizeSettings(ANCIENNE.settings as never)).toEqual(sanitizeSettings(ATTENDUE.settings as never));
});

it('les valeurs inconnues des réglages et les données illisibles passent telles quelles', () => {
  expect(translateSettings({ theme: 'rose', font: 'luciole' })).toEqual({ theme: 'rose', font: 'luciole' });
  expect(translateGame(null)).toBeNull();
  expect(translateGame([1])).toEqual([1]);
  localStorage.setItem('dysapps:blocland', '{abîmé');
  migrateStorage();
  expect(localStorage.getItem('dysapps:blocland')).toBe('{abîmé');
  expect(localStorage.getItem('dysapps:game')).toBeNull();
});

import { EMPTY_PROGRESS, XP, firstLevelOf, levelFromXp, rankForLevel, rankLadder, recordAnswer, recordSession, sanitizeProgress, xpToNextLevel } from './progress';

describe('niveaux', () => {
  it('commence au niveau 1', () => {
    expect(levelFromXp(0)).toMatchObject({ level: 1, xpIntoLevel: 0, xpForLevel: 50 });
  });

  it('passe au niveau suivant au seuil exact', () => {
    expect(levelFromXp(49).level).toBe(1);
    expect(levelFromXp(50)).toMatchObject({ level: 2, xpIntoLevel: 0, xpForLevel: xpToNextLevel(2) });
    expect(levelFromXp(50 + 75).level).toBe(3);
  });

  it('ignore les valeurs négatives', () => {
    expect(levelFromXp(-10).level).toBe(1);
  });
});

describe('recordAnswer', () => {
  it('donne plus de points au premier essai', () => {
    expect(recordAnswer(EMPTY_PROGRESS, true, 1).xpGained).toBe(XP.firstTry);
    expect(recordAnswer(EMPTY_PROGRESS, true, 2).xpGained).toBe(XP.afterRetry);
    expect(recordAnswer(EMPTY_PROGRESS, false, 2).xpGained).toBe(XP.effort);
  });

  it('suit la série de bonnes réponses et la remet à zéro après une erreur', () => {
    let p = EMPTY_PROGRESS;
    for (let i = 0; i < 5; i++) p = recordAnswer(p, true).progress;
    expect(p.currentStreak).toBe(5);
    expect(p.bestStreak).toBe(5);
    p = recordAnswer(p, false, 2).progress;
    expect(p.currentStreak).toBe(0);
    expect(p.bestStreak).toBe(5);
  });

  it('attribue les badges une seule fois', () => {
    const first = recordAnswer(EMPTY_PROGRESS, true, 1, '2026-01-01');
    expect(first.newBadges.map((b) => b.id)).toEqual(['premier-pas']);
    expect(first.progress.badges['premier-pas']).toBe('2026-01-01');
    const second = recordAnswer(first.progress, true);
    expect(second.newBadges).toEqual([]);
    expect(second.progress.badges['premier-pas']).toBe('2026-01-01');
  });

  it('signale un passage de niveau', () => {
    const p = { ...EMPTY_PROGRESS, xp: 45 };
    expect(recordAnswer(p, true).leveledUp).toBe(true);
    expect(recordAnswer(EMPTY_PROGRESS, true).leveledUp).toBe(false);
  });

  it('ne modifie pas la progression d’origine', () => {
    const before = structuredClone(EMPTY_PROGRESS);
    recordAnswer(EMPTY_PROGRESS, true);
    expect(EMPTY_PROGRESS).toEqual(before);
  });
});

describe('recordSession', () => {
  it('met à jour les statistiques de l’application', () => {
    let p = recordSession(EMPTY_PROGRESS, 'tables', 60, '2026-01-01').progress;
    p = recordSession(p, 'tables', 40, '2026-01-02').progress;
    expect(p.apps.tables).toEqual({ sessions: 2, bestScore: 60, lastPlayed: '2026-01-02' });
    expect(p.sessionsCompleted).toBe(2);
  });

  it('récompense une séance parfaite', () => {
    const update = recordSession(EMPTY_PROGRESS, 'demo', 100);
    expect(update.xpGained).toBe(XP.sessionBonus + XP.perfectBonus);
    expect(update.newBadges.map((b) => b.id)).toEqual(expect.arrayContaining(['premiere-seance', 'sans-faute']));
  });
});

describe('sanitizeProgress', () => {
  it('répare des données corrompues', () => {
    const p = sanitizeProgress({ xp: 'beaucoup', apps: null, badges: { 'premier-pas': 12, 'serie-5': '2026-01-01' }, bestStreak: -3 });
    expect(p.xp).toBe(0);
    expect(p.apps).toEqual({});
    expect(p.badges).toEqual({ 'serie-5': '2026-01-01' });
    expect(p.bestStreak).toBe(0);
    expect(() => recordSession(p, 'demo', 50)).not.toThrow();
  });

  it('conserve des données valides', () => {
    const valid = recordSession(recordAnswer(EMPTY_PROGRESS, true).progress, 'demo', 80, '2026-01-01').progress;
    expect(sanitizeProgress(JSON.parse(JSON.stringify(valid)))).toEqual(valid);
  });

  it('accepte une valeur qui n’est pas un objet', () => {
    expect(sanitizeProgress(null)).toEqual(EMPTY_PROGRESS);
  });
});

describe('rôles', () => {
  it('commence Explorateur, devient Cartographe au niveau 4', () => {
    expect(rankForLevel(1)).toEqual({ title: 'Explorateur', tier: 'explorateur' });
    expect(rankForLevel(3)).toEqual({ title: 'Explorateur', tier: 'explorateur' });
    expect(rankForLevel(4)).toEqual({ title: 'Cartographe', tier: 'cartographe' });
    expect(firstLevelOf('navigateur')).toBe(18);
  });

  it('présente les cinq rôles : atteints, en cours, à venir', () => {
    const at = (level: number) => rankLadder(level).map((r) => `${r.tier}${r.current ? '*' : r.reached ? '+' : '-'}${r.firstLevel}`);
    expect(at(1)).toEqual(['explorateur*1', 'cartographe-4', 'batisseur-10', 'navigateur-18', 'architecte-28']);
    expect(at(12)).toEqual(['explorateur+1', 'cartographe+4', 'batisseur*10', 'navigateur-18', 'architecte-28']);
    expect(at(40)).toEqual(['explorateur+1', 'cartographe+4', 'batisseur+10', 'navigateur+18', 'architecte*28']);
    expect(rankLadder(1).map((r) => r.name)).toEqual(['Explorateur', 'Cartographe', 'Bâtisseur', 'Navigateur', 'Architecte de l’archipel']);
  });

  it('garde le dernier rôle quand le niveau continue de monter', () => {
    expect(rankForLevel(27).title).toBe('Navigateur');
    expect(rankForLevel(28)).toEqual({ title: 'Architecte de l’archipel', tier: 'architecte' });
    expect(rankForLevel(60).title).toBe('Architecte de l’archipel');
  });

  it('débloque le succès Cartographe au niveau 4', () => {
    let xp = 0;
    for (let l = 1; l < 4; l++) xp += xpToNextLevel(l);
    const update = recordAnswer({ ...EMPTY_PROGRESS, xp: xp - 1, totalAnswers: 1, badges: { 'premier-pas': 'x' } }, true);
    expect(update.leveledUp).toBe(true);
    expect(update.newBadges.map((b) => b.id)).toContain('rang-argent');
  });
});

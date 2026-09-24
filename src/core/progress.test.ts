import { EMPTY_PROGRESS, XP, levelFromXp, recordAnswer, recordSession, xpToNextLevel } from './progress';

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

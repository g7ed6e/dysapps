import { parseUsageBatch, screenOf, toDataPoint, type UsageBatch } from './usageEvents';

const batch = (events: unknown[]) => ({ version: '1.42.0', universe: 'blocland', view: '3d', events });

describe('screenOf', () => {
  it('garde l’adresse sans paramètres, quatre segments au plus', () => {
    expect(screenOf('/adventure/maths-6e-calculation')).toBe('/adventure/maths-6e-calculation');
    expect(screenOf('/adventure/a/b/c/d/e')).toBe('/adventure/a/b/c');
    expect(screenOf('/')).toBe('/');
  });
  it('remplace un segment inattendu', () => {
    expect(screenOf('/app/Élève Dupont')).toBe('/app/x');
  });
});

describe('parseUsageBatch', () => {
  it('accepte un envoi bien formé et arrondit les nombres', () => {
    const parsed = parseUsageBatch(
      batch([
        { kind: 'launch', startMs: 812.4, firstFrameMs: 2400, width: 1000, height: 800, dpr: 2.1, installed: true },
        { kind: 'screen', screen: '/adventure', seconds: 63, frames: 3600, frameMs: 60020.5, slowFrames: 12 },
        { kind: 'error', screen: '/reglages', message: 'x'.repeat(500) },
      ]),
    );
    expect(parsed?.events).toEqual([
      { kind: 'launch', startMs: 812, firstFrameMs: 2400, width: 1000, height: 800, dpr: 2, installed: true },
      { kind: 'screen', screen: '/adventure', seconds: 63, frames: 3600, frameMs: 60021, slowFrames: 12 },
      { kind: 'error', screen: '/reglages', message: 'x'.repeat(120) },
    ]);
  });
  it('refuse un envoi mal formé, laisse de côté un évènement mal formé', () => {
    expect(parseUsageBatch(null)).toBeNull();
    expect(parseUsageBatch({ ...batch([]), view: 'vr' })).toBeNull();
    expect(parseUsageBatch({ ...batch([]), version: '<script>' })).toBeNull();
    expect(parseUsageBatch(batch(Array.from({ length: 51 }, () => ({}))))).toBeNull();
    const parsed = parseUsageBatch(
      batch([
        { kind: 'screen', screen: 'https://exemple.fr', seconds: 3, frames: 0, frameMs: 0, slowFrames: 0 },
        { kind: 'screen', screen: '/adventure', seconds: -1, frames: 0, frameMs: 0, slowFrames: 0 },
        { kind: 'other' },
        { kind: 'screen', screen: '/adventure', seconds: 99999, frames: 2, frameMs: 30, slowFrames: 9 },
      ]),
    );
    expect(parsed?.events).toEqual([{ kind: 'screen', screen: '/adventure', seconds: 3600, frames: 2, frameMs: 30, slowFrames: 2 }]);
  });
});

describe('toDataPoint', () => {
  it('range chaque évènement dans les mêmes colonnes', () => {
    const b = parseUsageBatch(batch([])) as UsageBatch;
    expect(toDataPoint(b, { kind: 'screen', screen: '/adventure', seconds: 5, frames: 300, frameMs: 5000, slowFrames: 1 }, 'production')).toEqual({
      blobs: ['screen', '1.42.0', 'blocland', '3d', 'production', '/adventure', ''],
      doubles: [5, 300, 5000, 1],
      indexes: ['screen'],
    });
    expect(toDataPoint(b, { kind: 'launch', startMs: 1, firstFrameMs: 2, width: 3, height: 4, dpr: 1, installed: false }, 'preview').blobs).toEqual([
      'launch', '1.42.0', 'blocland', '3d', 'preview', '', 'browser',
    ]);
  });
});

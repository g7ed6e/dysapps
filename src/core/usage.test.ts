type Usage = typeof import('./usage');
type SettingsModule = typeof import('./settings');

describe('la mesure d’usage', () => {
  let beacon: ReturnType<typeof vi.fn>;
  let sent: () => Promise<unknown[]>;
  let settings: SettingsModule;

  async function load(): Promise<Usage> {
    vi.resetModules();
    vi.stubEnv('PROD', true);
    beacon = vi.fn(() => true);
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    sent = () => Promise.all(beacon.mock.calls.map(([, blob]) => (blob as Blob).text().then((t) => JSON.parse(t))));
    // Les réglages du même chargement que la mesure (vi.resetModules en refait une copie).
    settings = await import('./settings');
    return import('./usage');
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    settings?.retenirReglages(null);
  });

  it('n’envoie rien hors de l’application publiée', async () => {
    vi.resetModules();
    const usage = await import('./usage');
    beacon = vi.fn();
    Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true });
    usage.startUsage();
    usage.flushUsage();
    expect(beacon).not.toHaveBeenCalled();
  });

  it('envoie le lancement puis les écrans, sans identifiant', async () => {
    vi.useFakeTimers();
    const usage = await load();
    usage.startUsage();
    usage.usageScreen('/adventure');
    usage.usageFrame(16);
    usage.usageFrame(80);
    usage.usageFrame(5000);
    vi.advanceTimersByTime(3000);
    usage.usageScreen('/reglages');
    usage.flushUsage();
    const [batch] = (await sent()) as { view: string; events: { kind: string }[] }[];
    expect(batch.view).toBe('3d');
    expect(batch.events.map((e) => e.kind)).toEqual(['launch', 'screen']);
    expect(batch.events[1]).toEqual({ kind: 'screen', screen: '/adventure', seconds: 3, frames: 2, frameMs: 96, slowFrames: 1 });
    expect(Object.keys(batch).sort()).toEqual(['events', 'universe', 'version', 'view']);
  });

  it('oublie ce qui attendait quand le réglage est coupé', async () => {
    const usage = await load();
    usage.startUsage();
    settings.retenirReglages({ ...settings.DEFAULT_SETTINGS, usageStats: false });
    usage.flushUsage();
    expect(beacon).not.toHaveBeenCalled();
  });
});

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
    vi.restoreAllMocks();
    localStorage.clear();
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

  it('coupe l’écran quand l’appli est cachée et le rouvre au retour', async () => {
    vi.useFakeTimers();
    const usage = await load();
    usage.startUsage();
    usage.usageScreen('/adventure');
    vi.advanceTimersByTime(2000);
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    // Changé pendant que l'appli est cachée : c'est cet écran qui se rouvre.
    usage.usageScreen('/reglages');
    vi.advanceTimersByTime(60_000);
    hidden.mockReturnValue(false);
    document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(4000);
    usage.flushUsage();
    const batches = (await sent()) as { events: { kind: string; screen?: string; seconds?: number }[] }[];
    const screens = batches.flatMap((b) => b.events).filter((e) => e.kind === 'screen');
    expect(screens).toEqual([expect.objectContaining({ screen: '/adventure', seconds: 2 })]);
    usage.usageScreen('/succes');
    usage.flushUsage();
    const again = ((await sent()) as { events: { screen?: string; seconds?: number }[] }[]).flatMap((b) => b.events);
    expect(again.at(-1)).toEqual(expect.objectContaining({ screen: '/reglages', seconds: 4 }));
    hidden.mockRestore();
  });

  it('ne compte la première image que si le monde est le premier écran', async () => {
    const usage = await load();
    usage.startUsage();
    usage.usageScreen('/');
    usage.usageScreen('/adventure');
    usage.usageFrame(16);
    usage.flushUsage();
    const [batch] = (await sent()) as { events: { kind: string; firstFrameMs?: number }[] }[];
    expect(batch.events[0]).toEqual(expect.objectContaining({ kind: 'launch', firstFrameMs: 0 }));
  });

  it('garde les chiffres en mémoire sans réseau et les envoie à son retour', async () => {
    const usage = await load();
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    usage.startUsage();
    usage.flushUsage();
    expect(beacon).not.toHaveBeenCalled();
    online.mockReturnValue(true);
    window.dispatchEvent(new Event('online'));
    const [batch] = (await sent()) as { events: { kind: string }[] }[];
    expect(batch.events.map((e) => e.kind)).toEqual(['launch']);
  });

  it('garde sur l’appareil ce qui attend le réseau, d’un lancement à l’autre', async () => {
    const first = await load();
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    first.startUsage();
    first.flushUsage();
    expect(localStorage.getItem('dysapps-usage-waiting')).toContain('launch');
    // L'appli relancée avec le réseau : les deux lancements partent ensemble, puis plus rien n'attend.
    online.mockReturnValue(true);
    const second = await load();
    second.startUsage();
    second.flushUsage();
    const [batch] = (await sent()) as { events: { kind: string }[] }[];
    expect(batch.events.map((e) => e.kind)).toEqual(['launch', 'launch']);
    expect(localStorage.getItem('dysapps-usage-waiting')).toBeNull();
  });

  it('oublie ce qui attendait quand le réglage est coupé', async () => {
    const usage = await load();
    usage.startUsage();
    settings.retenirReglages({ ...settings.DEFAULT_SETTINGS, usageStats: false });
    usage.flushUsage();
    expect(beacon).not.toHaveBeenCalled();
    expect(localStorage.getItem('dysapps-usage-waiting')).toBeNull();
  });
});

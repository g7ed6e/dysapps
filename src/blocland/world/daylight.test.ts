import { AMBIENCE, daylight, daylightAt, mixColor, palette } from './daylight';
import { ARCHIPELAGO_IDS } from './map';

it('fait le jour entre 8 h et 20 h, la nuit avant 7 h et après 21 h, avec des transitions douces', () => {
  expect(daylightAt(12)).toEqual({ light: 1, phase: 'jour' });
  expect(daylightAt(3)).toEqual({ light: 0, phase: 'nuit' });
  expect(daylightAt(23.5)).toEqual({ light: 0, phase: 'nuit' });
  expect(daylightAt(7.5)).toMatchObject({ phase: 'aube' });
  expect(daylightAt(7.5).light).toBeCloseTo(0.5, 5);
  expect(daylightAt(20.25).phase).toBe('crepuscule');
  expect(daylightAt(20.25).light).toBeGreaterThan(0.5);
  expect(daylightAt(20.75).light).toBeLessThan(0.5);
  // Continu aux bords.
  expect(daylightAt(6.999).light).toBe(0);
  expect(daylightAt(7.001).light).toBeLessThan(0.01);
  expect(daylightAt(7.999).light).toBeGreaterThan(0.99);
  expect(daylightAt(25)).toEqual(daylightAt(1));
});

it('lit l’heure de l’appareil', () => {
  expect(daylight(new Date(2026, 0, 1, 14, 0))).toEqual({ light: 1, phase: 'jour' });
  expect(daylight(new Date(2026, 0, 1, 2, 30))).toEqual({ light: 0, phase: 'nuit' });
});

it('mélange les couleurs et la palette suit la lumière', () => {
  expect(mixColor(0x000000, 0xffffff, 0)).toBe(0x000000);
  expect(mixColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
  expect(mixColor(0x000000, 0xff0000, 0.5)).toBe(0x800000);
  expect(palette(1).sky).toBe(0x8fd0f5);
  expect(palette(0).sunIntensity).toBeLessThan(palette(1).sunIntensity);
});

it('chaque archipel a son ambiance : quatre ciels différents, jamais noirs la nuit, les Îles du Ciel sans mer', () => {
  const skies = ARCHIPELAGO_IDS.map((a) => palette(1, a).sky);
  expect(new Set(skies).size).toBe(4);
  for (const a of ARCHIPELAGO_IDS) {
    const night = palette(0, a).sky;
    for (const shift of [16, 8, 0]) expect((night >> shift) & 255, a).toBeGreaterThanOrEqual(0x20);
    expect(palette(1, a).ground).toBe(AMBIENCE[a].ground);
    expect(AMBIENCE[a].fog[0]).toBeLessThan(AMBIENCE[a].fog[1]);
  }
  expect(AMBIENCE['3e'].sky).toBe(true);
  expect(ARCHIPELAGO_IDS.filter((a) => AMBIENCE[a].sky)).toEqual(['3e']);
  expect(palette(1, '6e')).toEqual({ ...palette(1), ground: AMBIENCE['6e'].ground });
});

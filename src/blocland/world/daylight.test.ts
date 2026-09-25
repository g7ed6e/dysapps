import { daylight, daylightAt, mixColor, palette } from './daylight';

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

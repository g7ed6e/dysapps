import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SPLASH_DEVICES, splashFile, splashLinks } from './splash-devices.mjs';
import { decodePng, encodePng } from './splash.mjs';

it('chaque appareil a ses deux écrans de lancement, à la bonne taille (npm run splash)', () => {
  for (const { w, h } of SPLASH_DEVICES) {
    for (const [fw, fh] of [
      [w, h],
      [h, w],
    ]) {
      const file = join('public', splashFile(fw, fh));
      expect(existsSync(file), file).toBe(true);
      const png = readFileSync(file);
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], file).toEqual([fw, fh]);
    }
  }
});

it('une balise par appareil et par orientation, avec sa media query', () => {
  const links = splashLinks('/dysapps/');
  expect(links).toHaveLength(SPLASH_DEVICES.length * 2);
  expect(links[0]).toEqual({
    rel: 'apple-touch-startup-image',
    href: '/dysapps/splash/apple-splash-1320x2868.png',
    media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
  });
});

it('encode puis décode une image sans la changer', () => {
  const rgb = Buffer.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 251, 246, 234]);
  const back = decodePng(encodePng(2, 2, rgb));
  expect(back.width).toBe(2);
  expect([...back.rgba]).toEqual([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 251, 246, 234, 255]);
});

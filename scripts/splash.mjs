// Fabrique les écrans de lancement d'iPhone et d'iPad (public/splash/) : le bloc d'herbe de l'icône, agrandi sans
// lissage (pixel art), au centre d'un fond crème, la couleur de fond du manifeste. Aucune dépendance : l'icône PNG est
// décodée et les écrans encodés ici, avec zlib.
// Usage : npm run splash (à relancer si l'icône public/pwa-512.png ou la liste des appareils change).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync, inflateSync } from 'node:zlib';
import { SPLASH_DEVICES, splashFile } from './splash-devices.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKGROUND = [0xfb, 0xf6, 0xea]; // background_color du manifeste
const ICON_SHARE = 0.34; // côté de l'icône : 34 % du petit côté de l'écran

/** Décode un PNG 8 bits RGB ou RGBA, non entrelacé : { width, height, rgba }. */
export function decodePng(buf) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
      if (data[8] !== 8 || data[12] !== 0 || (colorType !== 2 && colorType !== 6)) throw new Error('PNG non géré');
    } else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const add = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter];
      line[i] = (line[i] + add) & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      out[o] = line[x * bpp];
      out[o + 1] = line[x * bpp + 1];
      out[o + 2] = line[x * bpp + 2];
      out[o + 3] = bpp === 4 ? line[x * bpp + 3] : 255;
    }
    prev = line;
  }
  return { width, height, rgba: out };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** Encode une image RGB (Buffer de width × height × 3 octets) en PNG. */
export function encodePng(width, height, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Un écran de lancement : fond crème, icône au centre, agrandie au plus proche voisin (pixels nets). */
export function splashImage(width, height, icon) {
  const rgb = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) rgb.set(BACKGROUND, i * 3);
  const side = Math.round(Math.min(width, height) * ICON_SHARE);
  const x0 = Math.round((width - side) / 2);
  const y0 = Math.round((height - side) / 2);
  for (let y = 0; y < side; y++) {
    const sy = Math.floor((y * icon.height) / side);
    for (let x = 0; x < side; x++) {
      const sx = Math.floor((x * icon.width) / side);
      const s = (sy * icon.width + sx) * 4;
      const alpha = icon.rgba[s + 3] / 255;
      if (alpha === 0) continue;
      const o = ((y0 + y) * width + x0 + x) * 3;
      for (let k = 0; k < 3; k++) rgb[o + k] = Math.round(icon.rgba[s + k] * alpha + rgb[o + k] * (1 - alpha));
    }
  }
  return encodePng(width, height, rgb);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const icon = decodePng(readFileSync(join(root, 'public/pwa-512.png')));
  mkdirSync(join(root, 'public/splash'), { recursive: true });
  let total = 0;
  for (const { w, h } of SPLASH_DEVICES) {
    for (const [fw, fh] of [
      [w, h],
      [h, w],
    ]) {
      const png = splashImage(fw, fh, icon);
      writeFileSync(join(root, 'public', splashFile(fw, fh)), png);
      total += png.length;
    }
  }
  console.log(`${SPLASH_DEVICES.length * 2} écrans de lancement, ${Math.round(total / 1024)} Ko, dans public/splash/`);
}

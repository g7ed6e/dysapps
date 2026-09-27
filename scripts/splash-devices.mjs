// Les écrans d'iPhone et d'iPad pour lesquels on fournit un écran de lancement (Safari n'en fabrique pas tout seul,
// contrairement à Android qui le compose à partir du manifeste). Dimensions en pixels réels, en portrait, et densité.
// Les fichiers sont produits par `npm run splash` (scripts/splash.mjs) dans public/splash/, et les balises
// <link rel="apple-touch-startup-image"> ajoutées à index.html par le plugin `appleSplash` de vite.config.ts.
export const SPLASH_DEVICES = [
  // iPhone
  { w: 1320, h: 2868, r: 3 }, // 16 Pro Max
  { w: 1206, h: 2622, r: 3 }, // 16 Pro
  { w: 1290, h: 2796, r: 3 }, // 15 Pro Max, 15 Plus, 14 Pro Max
  { w: 1179, h: 2556, r: 3 }, // 15, 15 Pro, 14 Pro
  { w: 1284, h: 2778, r: 3 }, // 14 Plus, 13 Pro Max, 12 Pro Max
  { w: 1170, h: 2532, r: 3 }, // 14, 13, 13 Pro, 12, 12 Pro
  { w: 1080, h: 2340, r: 3 }, // 13 mini, 12 mini
  { w: 1242, h: 2688, r: 3 }, // 11 Pro Max, XS Max
  { w: 1125, h: 2436, r: 3 }, // 11 Pro, XS, X
  { w: 828, h: 1792, r: 2 }, // 11, XR
  { w: 1242, h: 2208, r: 3 }, // 8 Plus
  { w: 750, h: 1334, r: 2 }, // SE, 8
  // iPad
  { w: 2064, h: 2752, r: 2 }, // Pro 13 pouces (M4)
  { w: 2048, h: 2732, r: 2 }, // Pro 12,9 pouces
  { w: 1668, h: 2420, r: 2 }, // Pro 11 pouces (M4)
  { w: 1668, h: 2388, r: 2 }, // Pro 11 pouces
  { w: 1640, h: 2360, r: 2 }, // Air 10,9 pouces, iPad 10e génération
  { w: 1668, h: 2224, r: 2 }, // Air 10,5 pouces
  { w: 1620, h: 2160, r: 2 }, // iPad 10,2 pouces
  { w: 1488, h: 2266, r: 2 }, // mini 8,3 pouces
  { w: 1536, h: 2048, r: 2 }, // mini, iPad 9,7 pouces
];

/** Nom du fichier d'un écran (dans public/splash/), pour une largeur et une hauteur en pixels réels. */
export const splashFile = (w, h) => `splash/apple-splash-${w}x${h}.png`;

/** Les balises <link> des écrans de lancement, portrait et paysage, avec la media query de chaque appareil. */
export function splashLinks(base = '/') {
  return SPLASH_DEVICES.flatMap(({ w, h, r }) =>
    [
      ['portrait', w, h],
      ['landscape', h, w],
    ].map(([orientation, fw, fh]) => ({
      rel: 'apple-touch-startup-image',
      href: `${base}${splashFile(fw, fh)}`,
      media: `(device-width: ${w / r}px) and (device-height: ${h / r}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: ${orientation})`,
    })),
  );
}

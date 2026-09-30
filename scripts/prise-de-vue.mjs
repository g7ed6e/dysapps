// La prise de vue commune aux captures de la documentation (scripts/www/captures.mjs) et aux mesures du rendu
// (scripts/rendu/mesures.mjs). En rendu logiciel (SwiftShader, sans carte graphique), la 3D se redessine sans arrêt et
// Chromium peine à prendre l'image pendant ce temps : 10 à 15 s par capture. Figer la boucle de rendu (les
// `requestAnimationFrame` de la page) juste avant la ramène à environ 3 s, pour la même image : la dernière dessinée.
// La page ne change pas : l'application n'en sait rien.

/** À passer à `page.addInitScript` avant de charger l'application : rend la boucle de rendu figeable. */
export function figeable() {
  const raf = window.requestAnimationFrame.bind(window);
  const caf = window.cancelAnimationFrame.bind(window);
  // Les rappels mis de côté pendant le gel, sous des numéros négatifs : une vue démontée pendant la prise les annule.
  const enAttente = new Map();
  let suivant = -1;
  let fige = false;
  window.requestAnimationFrame = (cb) => {
    if (!fige) return raf(cb);
    const id = suivant--;
    enAttente.set(id, cb);
    return id;
  };
  window.cancelAnimationFrame = (id) => (id < 0 ? enAttente.delete(id) : caf(id));
  window.__dysappsPriseDeVue = {
    figer() {
      fige = true;
    },
    reprendre() {
      fige = false;
      const cbs = [...enAttente.values()];
      enAttente.clear();
      for (const cb of cbs) raf(cb);
    },
  };
}

/**
 * Prend une capture de la page, la boucle de rendu figée le temps de la prise (puis relancée : une seconde capture,
 * plus tard, montre la scène qui a continué). Mêmes options que `page.screenshot` ; rend l'image.
 */
export async function capturer(page, options) {
  await page.evaluate(() => window.__dysappsPriseDeVue?.figer());
  try {
    return await page.screenshot(options);
  } finally {
    await page.evaluate(() => window.__dysappsPriseDeVue?.reprendre()).catch(() => {});
  }
}

// La prise de vue commune aux captures de la documentation (scripts/www/captures.mjs) et aux mesures du rendu
// (scripts/rendu/mesures.mjs). En rendu logiciel (SwiftShader, sans carte graphique), la page demande 60 images/s, le
// processus graphique n'en dessine pas autant (il occupe les quatre cœurs) et les images en retard s'empilent : une
// capture attendait que la pile se vide, 10 à 18 s. Deux remèdes, sans que l'application en sache rien :
// - la boucle de rendu (les `requestAnimationFrame` de la page) est bridée à `IMAGES_PAR_SECONDE` : le processus
//   graphique suit, rien ne s'empile ;
// - elle est figée le temps de la prise : la capture montre la dernière image dessinée.
// Avec la caméra posée à son cadrage (`attendreLaScene`) plutôt que des attentes fixes, mesuré sur le 6e, jour et nuit
// (01/10/2026) : 149 s → 36 s pour les six vues, la même image au mouvement des créatures et des vagues près.

/** À passer à `page.addInitScript` avant de charger l'application : bride la boucle de rendu et la rend figeable. */
export function figeable() {
  /** Assez pour que la caméra et les animations avancent, assez peu pour que le rendu logiciel suive. */
  const IMAGES_PAR_SECONDE = 8;
  const raf = window.requestAnimationFrame.bind(window);
  // Les rappels en attente (de la prochaine image bridée, ou de la fin du gel), sous des numéros négatifs : une vue
  // démontée entre-temps les annule.
  const enAttente = new Map();
  let suivant = -1;
  let fige = false;
  /** La prochaine image, à intervalle fixe : tous les rappels demandés d'ici là partent ensemble, comme avec le navigateur. */
  let prochaine = null;
  const lancer = () => {
    prochaine = null;
    if (fige) return;
    // Les numéros, pas les rappels : une vue démontée d'ici l'image (`cancelAnimationFrame`) n'est plus appelée.
    const ids = [...enAttente.keys()];
    raf((t) => {
      for (const id of ids) {
        const cb = enAttente.get(id);
        if (!cb) continue;
        enAttente.delete(id);
        cb(t);
      }
    });
  };
  window.requestAnimationFrame = (cb) => {
    const id = suivant--;
    enAttente.set(id, cb);
    if (!fige && prochaine === null) prochaine = setTimeout(lancer, 1000 / IMAGES_PAR_SECONDE);
    return id;
  };
  window.cancelAnimationFrame = (id) => enAttente.delete(id);
  window.__dysappsPriseDeVue = {
    figer() {
      fige = true;
    },
    reprendre() {
      fige = false;
      if (enAttente.size && prochaine === null) lancer();
    },
  };
}

/**
 * Attend que la scène 3D soit prête et pose la caméra à son cadrage (`window.__dysappsCamera.poser`, voir
 * src/blocland/three/camera.ts) : bridée, la caméra mettrait plus de 20 s à finir son approche en douceur. Prête quand le
 * cadrage ne bouge plus pendant une seconde (quatre relevés de suite), au plus `max` millisecondes ; sans scène 3D (un
 * écran sans monde), attend `max`. L'horloge de la page est figée : pas de `waitForFunction`, des relevés espacés.
 */
export async function attendreLaScene(page, max) {
  const debut = Date.now();
  let deSuite = 0;
  while (Date.now() - debut < max) {
    await page.waitForTimeout(250);
    const ecart = await page.evaluate(() => window.__dysappsCamera?.poser() ?? null).catch(() => null);
    deSuite = ecart !== null && ecart < 0.01 ? deSuite + 1 : 0;
    // Une seconde de cadrage immobile : les dernières textures et étiquettes ont eu leurs images.
    if (deSuite >= 4) return true;
  }
  return false;
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

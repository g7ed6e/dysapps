// La prise de vue commune aux captures de la documentation (scripts/www/captures.mjs) et aux mesures du rendu
// (scripts/rendu/mesures.mjs). En rendu logiciel (SwiftShader, sans carte graphique), la page demande 60 images/s, le
// processus graphique n'en dessine pas autant (il occupe les quatre cœurs) et les images en retard s'empilent : une
// capture attendait que la pile se vide, 10 à 18 s. Deux remèdes, sans que l'application en sache rien :
// - la boucle de rendu (les `requestAnimationFrame` de la page) est bridée à `IMAGES_PAR_SECONDE` : le processus
//   graphique suit, rien ne s'empile ;
// - elle est figée le temps de la prise : la capture montre la dernière image dessinée.
// Les captures de rendu (`rendu:mesures`) pilotent en plus l'horloge de la page (`piloterLHorloge`, `preparerLaScene`) et
// tirent le hasard d'une graine fixe (`hasardFixe`) : deux prises du même état donnent la même image, animations
// comprises. Le manuel garde l'heure figée et pose la caméra avec `attendreLaScene`.
// Mesuré sur le 6e, jour et nuit (01/10/2026) : 149 s → 35 s pour les six vues.

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
 * src/game/three/camera.ts) : bridée, la caméra mettrait plus de 20 s à finir son approche en douceur. Prête quand le
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
 * À passer à `page.addInitScript` : un hasard à graine fixe, les mêmes tirages à chaque chargement (promenades des
 * créatures, questions, phrases). Les identifiants que Three.js tire pour chaque objet (`generateUUID`, des milliers, au
 * gré des chargements) puisent dans une suite à part : ils ne décalent pas les tirages du jeu.
 */
export function hasardFixe() {
  const suite = (graine) => () => {
    graine = (graine + 0x6d2b79f5) | 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const jeu = suite(20260928);
  const identifiants = suite(1);
  Math.random = () => (new Error().stack?.includes('generateUUID') ? identifiants() : jeu());
}

/** Un pas de l'horloge pilotée : une image bridée (`figeable`). */
const PAS_MS = 125;
/** Les pas joués une fois le monde construit : trois secondes de la page, les promenades et les vagues partent. */
const PAS_APRES_LE_MONDE = 24;
/** Au plus, les pas de plus pour que le cadrage se pose (deux secondes de la page). */
const ATTENTES_DU_CADRAGE = 16;

/**
 * Pilote l'horloge de la page (heure, minuteries, images, `performance.now`), arrêtée à `time` : elle n'avance que par
 * `preparerLaScene`. À appeler avant de charger l'application, avant `page.addInitScript(figeable)`.
 */
export async function piloterLHorloge(page, time) {
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
}

/**
 * Prépare une scène 3D à horloge pilotée (`piloterLHorloge`), pour que deux prises du même état donnent la même image :
 * fait avancer l'horloge pas à pas jusqu'à ce que le monde soit construit (au plus `max` millisecondes réelles), puis
 * toujours du même nombre de pas, et pose la caméra à son cadrage. Les animations restent : elles sont seulement au même
 * instant d'une prise à l'autre (avec `hasardFixe`). Rend `false` si aucun monde 3D n'est apparu (un défi, une bulle).
 */
export async function preparerLaScene(page, max) {
  // Les modules de l'écran d'abord, l'horloge arrêtée : les tirages au hasard (questions d'un défi) se font ensuite dans
  // le même ordre d'une prise à l'autre, pas au gré des images jouées pendant un chargement.
  await page.waitForLoadState('networkidle').catch(() => {});
  const debut = Date.now();
  let monde = false;
  while (!monde && Date.now() - debut < max) {
    await page.clock.runFor(PAS_MS);
    // Le temps réel que le rendu logiciel dessine l'image, et que les chargements avancent.
    await page.waitForTimeout(50);
    monde = await page.evaluate(() => Boolean(window.__dysappsCamera)).catch(() => false);
  }
  for (let i = 0; i < PAS_APRES_LE_MONDE; i++) {
    await page.clock.runFor(PAS_MS);
    await page.waitForTimeout(30);
  }
  if (monde) {
    // Les polices chargées d'abord : un texte qui change de police déplace l'interface, donc la place libre et le
    // cadrage (la Carte en OpenDyslexic, HG-3).
    await page.evaluate(() => document.fonts?.ready).catch(() => {});
    await page.evaluate(() => window.__dysappsCamera?.poser());
    await page.clock.runFor(PAS_MS);
    await page.waitForTimeout(100);
    // Puis jusqu'à ce que le cadrage ne bouge plus : `poser` rend l'écart qu'il restait. Si la place libre a changé
    // pendant le pas (une bulle fermée, l'interface remise en place), la caméra glissait encore à la prise, les étiquettes
    // déjà posées pour son but (la Carte du 6e en OpenDyslexic, la vue de nuit de l'archipel du 6e, HG-3). Un cadrage
    // déjà posé ne coûte aucun pas de plus : les autres prises restent au même instant.
    for (let i = 0; i < ATTENTES_DU_CADRAGE; i++) {
      const ecart = await page.evaluate(() => window.__dysappsCamera?.poser() ?? 0);
      if (!(ecart > 0.01)) break;
      await page.clock.runFor(PAS_MS);
      await page.waitForTimeout(100);
    }
  }
  return monde;
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

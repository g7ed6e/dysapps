// Le cadrage des grands repères (revue d'ensemble du directeur artistique, DA-17 et DA-18) : dans Archipéo, le grand
// phare des Îles du Ciel reste dans le cadre de la vue de l'archipel et de la vue de son île, et sa lanterne se découpe
// sur le ciel à l'arrivée ; Blocland garde son cadrage. Sans WebGL : on projette des points avec la caméra placée.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../skin';
import { repereDeLaVue } from '../world/framing';
import { GRAND_PHARE_3E } from '../world/decor/3e';
import { PHARE, PHARES } from '../world/decor/lighthouse';
import { islandDef, landBox, mapOf } from '../world/map';
import { BRIDGES } from '../world/archipelago';
import { archipelagoOfIsland } from '../world/archipelagos';
import { grilleDe } from '../world/grid';
import { placeLibre, type Rect } from '../freeSpace';
import { avatarRoute, cadreDeTraversee, islandCenter, worldBounds } from '../world/terrain';
import { AUTOUR_DE_LA_DESTINATION, cadrageDeLaCarte, cadrageDeLaTraversee, creerCamera, decalagePourViser, ECHELLE_MIN_DE_LA_TRAVERSEE, PLANCHER_DE_LA_CARTE } from './camera';
import type { Derniers, Instant, Monde } from './scenePart';

/** La scène de la tablette de référence (1024 × 768, moins la barre du haut) ; la vue d'une île, à gauche du panneau. */
const ARCHIPEL = { w: 1024, h: 688 };
const ILE = { w: 505, h: 688 };

function placer(habillage: Habillage, taille: { w: number; h: number }, focus: { island: BiomeId | null }, home: BiomeId | null): THREE.PerspectiveCamera {
  const b = worldBounds('3e');
  const monde: Monde = {
    scene: new THREE.Scene(),
    archipel: '3e',
    habillage,
    surface: null,
    etendue: b,
    centre: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
    largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY),
  };
  const camera = new THREE.PerspectiveCamera(40, taille.w / taille.h, 0.5, 2000);
  const derniers = { current: { carte: false, focus, home, forceDay: true, whalePass: undefined, sons: false } as unknown as Derniers };
  const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
  creerCamera(monde, camera, new THREE.Object3D(), derniers, instant).cadrer(focus as Derniers['focus'], false, home);
  camera.updateMatrixWorld();
  return camera;
}

const ecran = (cam: THREE.Camera, t: { w: number; h: number }, x: number, y: number, z: number) => {
  const p = new THREE.Vector3(x, y, z).project(cam);
  return { x: ((p.x + 1) / 2) * t.w, y: ((1 - p.y) / 2) * t.h };
};
const R = GRAND_PHARE_3E;
const lanterne = R.pied + 0.3 + PHARES['3e'].socle + ((PHARE.lanterne.bas + PHARE.lanterne.haut) / 2) * PHARES['3e'].H;
/**
 * Le pied (ou, avec `bas`, une autre hauteur) et le sommet du phare dans le cadre, à `marge` pixels des bords (et
 * au-dessus de la barre du bas, 72 px).
 */
function dansLeCadre(cam: THREE.Camera, t: { w: number; h: number }, marge: number, bas: number = R.pied): boolean {
  const pied = ecran(cam, t, R.x, bas, R.y);
  const haut = ecran(cam, t, R.x, R.haut, R.y);
  return [pied, haut].every((p) => p.x >= marge && p.x <= t.w - marge && p.y >= marge && p.y <= t.h - 72);
}

describe('Le cadrage des grands repères', () => {
  it('le grand phare est le repère de son île et de la vue de l’archipel depuis ses voisines, pas au-delà', () => {
    expect(repereDeLaVue('maths-3e-functions', null)).toBe(R);
    for (const zone of ['maths-3e-functions', 'maths-3e-geometry', 'maths-3e-statistics', 'french-3e-close-reading'] as BiomeId[]) expect(repereDeLaVue(null, zone), zone).toBe(R);
    for (const zone of ['english-3e-comprehension', 'english-3e-grammar', 'french-6e-phonology', 'maths-4e-algebra'] as BiomeId[]) expect(repereDeLaVue(null, zone), zone).toBeNull();
    expect(repereDeLaVue('french-3e-close-reading', null)).toBeNull();
  });

  it('Archipéo : le phare dans le cadre de la vue de l’archipel depuis chacune de ses voisines, et de la vue de son île', () => {
    for (const home of ['maths-3e-functions', 'maths-3e-geometry', 'maths-3e-statistics'] as BiomeId[])
      expect(dansLeCadre(placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, home), ARCHIPEL, 60), home).toBe(true);
    // Depuis l'Observatoire des textes, le phare est au premier plan : son fût et sa lanterne, au-dessus de son socle.
    expect(dansLeCadre(placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, 'french-3e-close-reading'), ARCHIPEL, 60, R.pied + 0.3 + PHARES['3e'].socle)).toBe(true);
    expect(dansLeCadre(placer(HABILLAGES.archipeo, ILE, { island: 'maths-3e-functions' }, 'maths-3e-functions'), ILE, 40)).toBe(true);
    // Avant la retouche, depuis le Belvédère et dans la vue de l'île, il sortait du cadre : Blocland n'a pas changé.
    expect(dansLeCadre(placer(HABILLAGES.blocland, ARCHIPEL, { island: null }, 'maths-3e-geometry'), ARCHIPEL, 0)).toBe(false);
    expect(dansLeCadre(placer(HABILLAGES.blocland, ILE, { island: 'maths-3e-functions' }, 'maths-3e-functions'), ILE, 0)).toBe(false);
  });

  it.each(['maths-3e-functions', 'french-3e-close-reading'] as BiomeId[])('Archipéo, vue de l’archipel depuis %s : la lanterne ne se découpe plus sur l’île de l’Observatoire des textes', (home) => {
    const cam = placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, home);
    const l = ecran(cam, ARCHIPEL, R.x, lanterne, R.y);
    // L'île de l'Observatoire, sol et bâtiments (jusqu'à 7 blocs au-dessus de son sol), vue de la caméra.
    const b = landBox(islandDef('french-3e-close-reading'));
    const coins = [b.x0, b.x1].flatMap((x) => [b.y0, b.y1].flatMap((y) => [10, 16].map((z) => ecran(cam, ARCHIPEL, x, z, y))));
    const gauche = Math.min(...coins.map((p) => p.x));
    expect(l.x).toBeLessThan(gauche - 10);
  });
});

describe('La Carte dans la place libre (DA-31)', () => {
  const T = { w: 1024, h: 643 };
  /** Ce que la caméra, placée, montre d'un point du monde (en pixels CSS de la vue). */
  const vu = (c: { target: THREE.Vector3; pos: THREE.Vector3 }, t: { w: number; h: number }, x: number, y: number, z: number) => {
    const cam = new THREE.PerspectiveCamera(40, t.w / t.h, 0.5, 1e5);
    cam.position.copy(c.pos);
    cam.lookAt(c.target);
    cam.updateMatrixWorld();
    return ecran(cam, t, x, y, z);
  };
  const centre = (id: BiomeId, c: { target: THREE.Vector3; pos: THREE.Vector3 }, t: { w: number; h: number }) => {
    const i = islandCenter(id);
    return vu(c, t, i.x + 0.5, i.z, i.y + 0.5);
  };
  const dedans = (p: { x: number; y: number }, r: Rect, a = AUTOUR_DE_LA_DESTINATION) =>
    p.x - a.cote >= r.x0 - 1 && p.x + a.cote <= r.x1 + 1 && p.y - a.haut >= r.y0 - 1 && p.y + a.bas <= r.y1 + 1;

  it('la place libre : sous le panneau, au-dessus de la barre, en contournant la colonne Pause et archipel', () => {
    const panneau = { x: 440, y: 160, w: 830, h: 350 };
    const barre = { x: 512, y: 610, w: 920, h: 64 };
    // La colonne s'arrête au-dessus du bas du panneau : rien à contourner.
    expect(placeLibre(1024, 643, [panneau, barre], [{ x: 985, y: 30, w: 52, h: 52 }, { x: 960, y: 100, w: 100, h: 60 }])).toEqual({ x0: 0, y0: 335, x1: 1024, y1: 578 });
    // Sans panneau (le mot de la baleine l'a remplacé), la colonne descend dans la place : on passe à côté.
    expect(placeLibre(1024, 643, [barre], [{ x: 960, y: 100, w: 100, h: 200 }])).toEqual({ x0: 0, y0: 0, x1: 910, y1: 578 });
    // Une vue sans place (une page qui se met en place) : toute la vue.
    expect(placeLibre(390, 700, [{ x: 195, y: 330, w: 390, h: 660 }], [])).toEqual({ x0: 0, y0: 0, x1: 390, y1: 700 });
  });

  it('au large : l’archipel entier tient dans la place libre, plus près que le plancher, la destination dedans', () => {
    for (const a of ['6e', '5e', '4e', '3e'] as const) {
      const libre = { x0: 0, y0: 250, x1: 1024, y1: 578 };
      const dest = mapOf(a)[1].id;
      const c = cadrageDeLaCarte(a, dest, T.w, T.h, { x0: 0, y0: 0, x1: T.w, y1: T.h - 64 });
      expect(c.auPlancher, a).toBe(false);
      expect(c.echelle, a).toBeGreaterThanOrEqual(PLANCHER_DE_LA_CARTE);
      for (const def of mapOf(a)) {
        const b = landBox(def);
        for (const [x, y] of [[b.x0, b.y0], [b.x1, b.y1]]) {
          const p = vu(c, T, x, def.altitude, y);
          expect(p.x >= 0 && p.x <= T.w && p.y >= 0 && p.y <= T.h - 64, `${a} ${def.id}`).toBe(true);
        }
      }
      expect(dedans(centre(dest, c, T), { x0: 0, y0: 0, x1: T.w, y1: T.h - 64 }), a).toBe(true);
      // Plus serré, l'archipel se resserre ou passe au plancher, mais la destination reste dans la place.
      expect(dedans(centre(dest, cadrageDeLaCarte(a, dest, T.w, T.h, libre), T), libre), `${a} serré`).toBe(true);
    }
  });

  it('la flèche posée sur un ouvrage (GD-7) : sa pointe reste dans la place libre, au large comme serré', () => {
    for (const def of BRIDGES) {
      const a = archipelagoOfIsland(def.from);
      const m = grilleDe(a).placesDeLaFleche(def.id)[0];
      // La pointe, comme three/markers.ts la pose (`poserLaFleche`) : juste au-dessus du tablier.
      const pointe = { x: m.x + 0.5, y: m.y + 0.5, z: m.z + 2 };
      for (const libre of [
        { x0: 0, y0: 0, x1: T.w, y1: T.h - 64 },
        { x0: 0, y0: 250, x1: 1024, y1: 578 },
      ]) {
        const c = cadrageDeLaCarte(a, pointe, T.w, T.h, libre);
        expect(dedans(vu(c, T, pointe.x, pointe.z, pointe.y), libre), `${def.id} ${libre.y0}`).toBe(true);
      }
    }
  });

  it('le cas de référence (4e, 1024 × 768, grand texte) : au plancher, la destination au centre de la place, ses voisines à l’écran', () => {
    // La place libre relevée sous le panneau « Prochaine destination » en OpenDyslexic 32 : environ 180 px de haut.
    const libre = { x0: 0, y0: 375, x1: 1024, y1: 555 };
    for (const dest of mapOf('4e').map((d) => d.id)) {
      const c = cadrageDeLaCarte('4e', dest, T.w, T.h, libre);
      expect(c.auPlancher).toBe(true);
      expect(c.echelle).toBeCloseTo(PLANCHER_DE_LA_CARTE, 5);
      const p = centre(dest, c, T);
      expect(p.x).toBeCloseTo(512, 0);
      // Le cadre de la destination, plus haut que la place, s'aligne sur son haut : la flèche et le nom au-dessus
      // tiennent, l'île reste dans la place.
      expect(p.y - AUTOUR_DE_LA_DESTINATION.haut, dest).toBeGreaterThanOrEqual(libre.y0);
      expect(p.y, dest).toBeLessThan(libre.y1);
      // Les îles voisines (à moins de 45 cases) sont à l'écran, sous le panneau ; celles du sud au moins par leur
      // moitié haute (une île fait une trentaine de pixels de haut au plancher).
      const d0 = islandDef(dest);
      for (const def of mapOf('4e').filter((d) => d.id !== dest && Math.hypot(d.core.x - d0.core.x, d.core.y - d0.core.y) < 45)) {
        const q = centre(def.id, c, T);
        expect(q.x > 0 && q.x < T.w && q.y > libre.y0 && q.y < libre.y1 + 30, `${dest} → ${def.id}`).toBe(true);
      }
    }
  });

  it('la caméra ne suit pas le panneau : le cadrage ne dépend que de la place libre lue, et se recadre d’un coup quand le texte change', () => {
    const b = worldBounds('4e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '4e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 220 };
    const camera = new THREE.PerspectiveCamera(40, T.w / T.h, 0.5, 2000);
    const derniers = { current: { carte: true, focus: { island: null }, home: 'maths-4e-powers', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: true, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const lues: string[] = [];
    let place = { libre: { x0: 0, y0: 200, x1: 1024, y1: 578 }, w: T.w, h: T.h, saut: false };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, {
      place: (contexte) => {
        lues.push(contexte);
        return place;
      },
      destination: () => 'english-4e-grammar',
    });
    cam.animer!(0, 0.016, false);
    const avant = camera.position.clone();
    cam.animer!(0.1, 0.016, false);
    expect(camera.position.equals(avant)).toBe(true);
    // La place change avec le texte (saut) : la caméra y est tout de suite, sans glisser.
    place = { libre: { x0: 0, y0: 375, x1: 1024, y1: 555 }, w: T.w, h: T.h, saut: true };
    cam.animer!(0.2, 0.016, false);
    expect(camera.position.equals(instant.but.pos)).toBe(true);
    expect(camera.position.equals(avant)).toBe(false);
    // La Carte refermée puis rouverte : la place est relue (un autre contexte).
    instant.carte = false;
    cam.animer!(0.3, 0.016, false);
    instant.carte = true;
    cam.animer!(0.4, 0.016, false);
    expect(new Set(lues)).toEqual(new Set(['1|english-4e-grammar', '2|english-4e-grammar']));
  });

  it('glisser déplace la vue à plat, borné à l’archipel ; une nouvelle île ou la Carte l’efface, « Recentrer » aussi', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200 };
    const camera = new THREE.PerspectiveCamera(40, 1024 / 688, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: 'french-6e-phonology', seq: 1 }, home: 'french-6e-phonology', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant);
    cam.animer!(0, 0.016, true);
    const t0 = cam.cible.clone();
    const p0 = camera.position.clone();
    const q0 = camera.quaternion.clone();
    expect(cam.decale()).toBe(false);
    // Glisser : la caméra y est tout de suite, cible et position ensemble ; même hauteur, même direction de vue.
    cam.glisser(3, -2);
    expect(cam.decale()).toBe(true);
    expect(cam.cible.x - t0.x).toBeCloseTo(3);
    expect(cam.cible.z - t0.z).toBeCloseTo(-2);
    expect(camera.position.x - p0.x).toBeCloseTo(3);
    expect(camera.position.y).toBeCloseTo(p0.y);
    expect(camera.position.z - p0.z).toBeCloseTo(-2);
    expect(camera.quaternion.angleTo(q0)).toBeCloseTo(0);
    // L'image suivante garde le décalage.
    cam.animer!(0.1, 0.016, true);
    expect(cam.cible.x - t0.x).toBeCloseTo(3);
    // Très loin : la cible s'arrête au bord de l'archipel.
    cam.glisser(10_000, 10_000);
    expect(cam.cible.x).toBeCloseTo(b.maxX);
    expect(cam.cible.z).toBeCloseTo(b.maxY);
    // « Recentrer » : le décalage s'efface, la caméra revient (d'un coup ici, moins d'animations).
    cam.recentrer();
    expect(cam.decale()).toBe(false);
    cam.animer!(0.2, 0.016, true);
    expect(cam.cible.distanceTo(t0)).toBeCloseTo(0);
    // Une nouvelle demande de cadrage efface le décalage, comme la Carte ouverte et la marche du bonhomme.
    for (const reprendre of [
      () => (derniers.current = { ...derniers.current, focus: { island: 'french-6e-phonology', seq: 2 } }),
      () => (derniers.current = { ...derniers.current, carte: true }),
      () => (instant.marche = true),
    ]) {
      cam.glisser(2, 2);
      expect(cam.decale()).toBe(true);
      reprendre();
      cam.animer!(0.3, 0.016, true);
      expect(cam.decale()).toBe(false);
    }
  });

  it('la Carte se zoome : de son cadrage d’ouverture jusqu’à une île en gros plan, le point visé reste sous le doigt ; la Carte refermée l’efface', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200 };
    const camera = new THREE.PerspectiveCamera(40, T.w / T.h, 0.5, 2000);
    const derniers = { current: { carte: true, focus: { island: null, seq: 1 }, home: 'french-6e-phonology', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: true, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const libre = { x0: 0, y0: 80, x1: T.w, y1: T.h - 80 };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, { place: () => ({ libre, w: T.w, h: T.h, saut: false }), destination: () => null });
    cam.animer!(0, 0.016, true);
    const d0 = camera.position.distanceTo(cam.cible);
    const q0 = camera.quaternion.clone();
    // Plus loin que l'ouverture : rien ne bouge.
    expect(cam.zoomer(0.5, { x: 0, y: 0 })).toBe(false);
    expect(cam.decale()).toBe(false);
    // Rapprocher autour d'un point hors du centre : la caméra y est tout de suite, même direction de vue, et le point du
    // sol vu là avant le zoom y est encore après.
    const vers = { x: 0.4, y: -0.3 };
    const sol = (): THREE.Vector3 => {
      const r = new THREE.Raycaster();
      camera.updateMatrixWorld();
      r.setFromCamera(new THREE.Vector2(vers.x, vers.y), camera);
      const t = (cam.cible.y - r.ray.origin.y) / r.ray.direction.y;
      return r.ray.origin.clone().addScaledVector(r.ray.direction, t);
    };
    const avant = sol();
    expect(cam.zoomer(2, vers)).toBe(true);
    expect(cam.decale()).toBe(true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0 / 2, 3);
    expect(camera.quaternion.angleTo(q0)).toBeCloseTo(0);
    expect(sol().distanceTo(avant)).toBeLessThan(0.05);
    // L'image suivante garde le zoom.
    cam.animer!(0.1, 0.016, true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0 / 2, 3);
    // Au plus près, une île (22 cases) remplit les deux tiers du petit côté de la place libre, pas plus.
    cam.zoomer(1000, { x: 0, y: 0 });
    cam.animer!(0.2, 0.016, true);
    const echelle = T.h / (2 * camera.position.distanceTo(cam.cible) * Math.tan((40 * Math.PI) / 360));
    expect(22 * echelle).toBeCloseTo((2 / 3) * (libre.y1 - libre.y0), 0);
    // « Recentrer » revient au cadrage d'ouverture.
    cam.recentrer();
    cam.animer!(0.3, 0.016, true);
    expect(cam.decale()).toBe(false);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0, 3);
    // Hors de la Carte, pas de zoom ; la Carte refermée efface celui qu'on avait.
    cam.zoomer(2, { x: 0, y: 0 });
    derniers.current = { ...derniers.current, carte: false };
    instant.carte = false;
    cam.animer!(0.4, 0.016, true);
    expect(cam.decale()).toBe(false);
    expect(cam.zoomer(2, { x: 0, y: 0 })).toBe(false);
  });

  it('poser met la caméra d’un coup à son cadrage et rend l’écart qu’il restait (les captures)', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200 };
    const camera = new THREE.PerspectiveCamera(40, 1024 / 688, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: 'french-6e-phonology', seq: 1 }, home: 'french-6e-phonology', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant);
    // Avant la première image, aucun cadrage à rejoindre.
    expect(cam.poser()).toBe(Infinity);
    cam.animer!(0, 0.016, false);
    const t0 = cam.cible.clone();
    // Une autre île : la caméra part en douceur, une image ne suffit pas.
    derniers.current = { ...derniers.current, focus: { island: 'french-6e-grammar-spelling', seq: 2 } };
    cam.animer!(0.1, 0.016, false);
    const enRoute = cam.cible.clone();
    expect(enRoute.distanceTo(t0)).toBeGreaterThan(0);
    expect(cam.poser()).toBeGreaterThan(0.01);
    // Posée : la cible ne bouge plus à l'image suivante, et un nouvel appel ne trouve plus d'écart.
    const posee = cam.cible.clone();
    expect(posee.distanceTo(enRoute)).toBeGreaterThan(0);
    cam.animer!(0.2, 0.016, false);
    expect(cam.cible.distanceTo(posee)).toBeCloseTo(0);
    expect(cam.poser()).toBeLessThan(0.01);
  });
});

describe('Une longue traversée (GD-7)', () => {
  it('la caméra se pose sur le cadre du départ à l’arrivée et ne suit pas le bonhomme ; les deux bouts sont à l’écran', () => {
    const b = worldBounds('6e');
    const monde: Monde = {
      scene: new THREE.Scene(),
      archipel: '6e',
      habillage: HABILLAGES.blocland,
      surface: null,
      etendue: b,
      centre: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
      largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY),
    };
    const camera = new THREE.PerspectiveCamera(40, ARCHIPEL.w / ARCHIPEL.h, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: null, seq: 0 }, home: 'maths-6e-calculation', forceDay: true } as unknown as Derniers };
    const cadre = { minX: 70, maxX: 145, minY: 14, maxY: 64 };
    const instant: Instant = { now: 0, marche: true, traversee: cadre, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const avatar = new THREE.Object3D();
    const cam = creerCamera(monde, camera, avatar, derniers, instant);
    const poser = () => {
      cam.animer?.(0, 0.016, true);
      camera.updateMatrixWorld();
      return camera.position.clone();
    };
    avatar.position.set(80, 0, 20);
    const ici = poser();
    // Le bonhomme avance sur le bac : la caméra ne bouge pas.
    avatar.position.set(140, 0, 30);
    expect(poser().distanceTo(ici)).toBeLessThan(1e-6);
    // Le départ et l'arrivée tiennent dans la vue.
    for (const [x, y] of [
      [cadre.minX, cadre.minY],
      [cadre.maxX, cadre.maxY],
    ]) {
      const p = ecran(camera, ARCHIPEL, x, 0, y);
      expect(p.x >= 0 && p.x <= ARCHIPEL.w && p.y >= 0 && p.y <= ARCHIPEL.h, `${x},${y}`).toBe(true);
    }
    // Sans traversée, elle suit le bonhomme.
    instant.traversee = null;
    const suivi = poser();
    avatar.position.set(80, 0, 20);
    expect(poser().distanceTo(suivi)).toBeGreaterThan(1);
  });

  it('le cadre fixe se pose dans la place libre, hors du panneau d’île ouvert et des barres : paysage et portrait 800 × 1280', () => {
    // De la Plaine à la Carrière par le long bac du port (109 cases), panneau de la Carrière ouvert.
    const route = avatarRoute('maths-6e-calculation', 'french-6e-word-spelling', ['maths-6e-calculation-french-6e-word-spelling'])!;
    const cadre = cadreDeTraversee('6e', route)!;
    expect(cadre).not.toBeNull();
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200 };
    // La vue qui reste au monde, panneau ouvert (pixels CSS, sous la barre du haut) : en paysage 1024 × 768, le panneau
    // de 26rem à droite ; en portrait 800 × 1280, le panneau en bas (55 % au plus). En haut, la ligne d'une parole ; en
    // bas, la barre ; à droite, la colonne Pause et archipel.
    const vues = [
      { nom: 'paysage 1024 × 768', w: 1024 - 416, h: 688 },
      { nom: 'portrait 800 × 1280', w: 800, h: Math.round(1200 * 0.45) },
    ];
    for (const t of vues) {
      const libre = placeLibre(
        t.w,
        t.h,
        [
          { x: t.w / 2, y: 50, w: t.w - 120, h: 84 },
          { x: t.w / 2, y: t.h - 34, w: t.w, h: 64 },
        ],
        [{ x: t.w - 30, y: 60, w: 52, h: 110 }],
      );
      const camera = new THREE.PerspectiveCamera(40, t.w / t.h, 0.5, 2000);
      const derniers = { current: { carte: false, focus: { island: null, seq: 0 }, home: 'maths-6e-calculation', forceDay: true } as unknown as Derniers };
      const instant: Instant = { now: 0, marche: true, traversee: cadre, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
      const lues: string[] = [];
      const place = { libre, w: t.w, h: t.h, saut: false };
      const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, {
        place: (contexte) => {
          lues.push(contexte);
          return place;
        },
        destination: () => null,
      });
      cam.animer!(0, 0.016, true);
      camera.updateMatrixWorld();
      // Les deux bouts du trajet (au sol, et la tête du bonhomme) sont dans la place libre, pas sous le panneau.
      for (const c of [route[0], route[route.length - 1]])
        for (const haut of [0, 2]) {
          const p = ecran(camera, t, c.x + 0.5, c.z + haut, c.y + 0.5);
          expect(p.x >= libre.x0 && p.x <= libre.x1 && p.y >= libre.y0 && p.y <= libre.y1, `${t.nom} ${c.x},${c.y} → ${p.x},${p.y}`).toBe(true);
        }
      // Le même cadre, la même place : la caméra ne bouge pas, et la place n'est lue que pour cette traversée.
      const but = instant.but.target.clone();
      cam.animer!(0.1, 0.016, true);
      expect(instant.but.target.equals(but)).toBe(true);
      expect(new Set(lues)).toEqual(new Set(['traversee|1']));
    }
  });

  it('le cadre fixe seulement à une taille lisible : gardé en 1024 × 768 et 800 × 1280 (et au Phare, 3e), la caméra suit le bonhomme en 390 × 844', () => {
    const port = avatarRoute('maths-6e-calculation', 'french-6e-word-spelling', ['maths-6e-calculation-french-6e-word-spelling'])!;
    const phare = avatarRoute('maths-3e-functions', 'english-3e-grammar', ['maths-3e-functions-english-3e-grammar'])!;
    // La vue entière, panneau fermé (il attend l'arrivée), sous la barre du haut (80 px).
    const cas = [
      { nom: '6e, 1024 × 768', archipel: '6e' as const, route: port, w: 1024, h: 688, fixe: true },
      { nom: '6e, 800 × 1280', archipel: '6e' as const, route: port, w: 800, h: 1200, fixe: true },
      { nom: '3e, 1024 × 768', archipel: '3e' as const, route: phare, w: 1024, h: 688, fixe: true },
      { nom: '6e, 390 × 844', archipel: '6e' as const, route: port, w: 390, h: 764, fixe: false },
    ];
    for (const t of cas) {
      const cadre = cadreDeTraversee(t.archipel, t.route)!;
      const libre = placeLibre(t.w, t.h, [{ x: t.w / 2, y: t.h - 34, w: t.w, h: 64 }], [{ x: t.w - 30, y: 60, w: 52, h: 110 }]);
      const altitude = mapOf(t.archipel)[0]?.altitude ?? 0;
      const { echelle } = cadrageDeLaTraversee(cadre, altitude, t.w, t.h, libre, 40);
      expect(echelle >= ECHELLE_MIN_DE_LA_TRAVERSEE, `${t.nom} : ${echelle.toFixed(1)} px la case`).toBe(t.fixe);
      const b = worldBounds(t.archipel);
      const monde: Monde = { scene: new THREE.Scene(), archipel: t.archipel, habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200 };
      const camera = new THREE.PerspectiveCamera(40, t.w / t.h, 0.5, 2000);
      const derniers = { current: { carte: false, focus: { island: null, seq: 0 }, home: null, forceDay: true } as unknown as Derniers };
      const instant: Instant = { now: 0, marche: true, traversee: cadre, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
      const avatar = new THREE.Object3D();
      const cam = creerCamera(monde, camera, avatar, derniers, instant, { place: () => ({ libre, w: t.w, h: t.h, saut: false }), destination: () => null });
      const poser = (c: { x: number; y: number; z: number }) => {
        avatar.position.set(c.x + 0.5, c.z, c.y + 0.5);
        cam.animer!(0, 0.016, true);
        camera.updateMatrixWorld();
        return camera.position.clone();
      };
      const depart = poser(t.route[0]);
      const milieu = t.route[Math.floor(t.route.length / 2)];
      const ici = poser(milieu);
      // Cadre fixe : la caméra ne bouge pas. Sinon, elle suit le bonhomme, à la distance d'avant GD-7 : il est au centre.
      expect(ici.distanceTo(depart) < 1e-6, t.nom).toBe(t.fixe);
      if (!t.fixe) {
        const p = ecran(camera, t, milieu.x + 0.5, milieu.z + 1, milieu.y + 0.5);
        expect(Math.abs(p.x - t.w / 2) < t.w / 4 && Math.abs(p.y - t.h / 2) < t.h / 4, `${p.x},${p.y}`).toBe(true);
      }
    }
  });
});

it('le recadrage d’une fiche (lot 2 de « Toucher le monde ») : un glissement à plat pose le point de l’objet où on le veut, sans changer la vue', () => {
  const cam = new THREE.PerspectiveCamera(40, 390 / 760, 0.5, 1e4);
  cam.position.set(30, 40, -10);
  cam.lookAt(20, 2, 30);
  const objet = new THREE.Vector3(22, 4, 34);
  const vers = { x: 0, y: 0.45 };
  const g = decalagePourViser(cam, objet, vers, new THREE.Vector3());
  expect(g.y).toBe(0);
  const avant = cam.quaternion.clone();
  cam.position.add(g);
  cam.updateMatrixWorld();
  const p = objet.clone().project(cam);
  expect(p.x).toBeCloseTo(vers.x, 5);
  expect(p.y).toBeCloseTo(vers.y, 5);
  // La direction de vue ne change pas : seule la place glisse.
  expect(cam.quaternion.angleTo(avant)).toBeCloseTo(0, 6);
  // Visé au-dessus de l'horizon (le ciel) : rien ne bouge.
  cam.lookAt(20, 40, 30);
  expect(decalagePourViser(cam, objet, { x: 0, y: 0.5 }, new THREE.Vector3()).length()).toBe(0);
});

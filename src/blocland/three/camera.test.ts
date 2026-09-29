// Le cadrage des grands repères (revue d'ensemble du directeur artistique, DA-17 et DA-18) : dans Archipéo, le grand
// phare des Îles du Ciel reste dans le cadre de la vue de l'archipel et de la vue de son île, et sa lanterne se découpe
// sur le ciel à l'arrivée ; Blocland garde son cadrage. Sans WebGL : on projette des points avec la caméra placée.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../habillage';
import { repereDeLaVue } from '../world/cadrage';
import { GRAND_PHARE_3E } from '../world/decor/3e';
import { PHARE, PHARES } from '../world/decor/phare';
import { islandDef, landBox, mapOf } from '../world/map';
import { placeLibre, type Rect } from '../placeLibre';
import { islandCenter, worldBounds } from '../world/terrain';
import { AUTOUR_DE_LA_DESTINATION, cadrageDeLaCarte, creerCamera, PLANCHER_DE_LA_CARTE } from './camera';
import type { Derniers, Instant, Monde } from './partie';

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
  const instant: Instant = { now: 0, marche: false, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
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
    expect(repereDeLaVue('phare', null)).toBe(R);
    for (const zone of ['phare', 'belvedere', 'donnees', 'textes'] as BiomeId[]) expect(repereDeLaVue(null, zone), zone).toBe(R);
    for (const zone of ['studio', 'chateau', 'foret', 'atelier'] as BiomeId[]) expect(repereDeLaVue(null, zone), zone).toBeNull();
    expect(repereDeLaVue('textes', null)).toBeNull();
  });

  it('Archipéo : le phare dans le cadre de la vue de l’archipel depuis chacune de ses voisines, et de la vue de son île', () => {
    for (const home of ['phare', 'belvedere', 'donnees'] as BiomeId[])
      expect(dansLeCadre(placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, home), ARCHIPEL, 60), home).toBe(true);
    // Depuis l'Observatoire des textes, le phare est au premier plan : son fût et sa lanterne, au-dessus de son socle.
    expect(dansLeCadre(placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, 'textes'), ARCHIPEL, 60, R.pied + 0.3 + PHARES['3e'].socle)).toBe(true);
    expect(dansLeCadre(placer(HABILLAGES.archipeo, ILE, { island: 'phare' }, 'phare'), ILE, 40)).toBe(true);
    // Avant la retouche, depuis le Belvédère et dans la vue de l'île, il sortait du cadre : Blocland n'a pas changé.
    expect(dansLeCadre(placer(HABILLAGES.blocland, ARCHIPEL, { island: null }, 'belvedere'), ARCHIPEL, 0)).toBe(false);
    expect(dansLeCadre(placer(HABILLAGES.blocland, ILE, { island: 'phare' }, 'phare'), ILE, 0)).toBe(false);
  });

  it.each(['phare', 'textes'] as BiomeId[])('Archipéo, vue de l’archipel depuis %s : la lanterne ne se découpe plus sur l’île de l’Observatoire des textes', (home) => {
    const cam = placer(HABILLAGES.archipeo, ARCHIPEL, { island: null }, home);
    const l = ecran(cam, ARCHIPEL, R.x, lanterne, R.y);
    // L'île de l'Observatoire, sol et bâtiments (jusqu'à 7 blocs au-dessus de son sol), vue de la caméra.
    const b = landBox(islandDef('textes'));
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
    const derniers = { current: { carte: true, focus: { island: null }, home: 'forge', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, navigue: null, carte: true, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const lues: string[] = [];
    let place = { libre: { x0: 0, y0: 200, x1: 1024, y1: 578 }, w: T.w, h: T.h, saut: false };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, {
      place: (contexte) => {
        lues.push(contexte);
        return place;
      },
      destination: () => 'gare',
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
    expect(new Set(lues)).toEqual(new Set(['1|gare', '2|gare']));
  });
});

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
import { chooseIsland } from '../world/arrangeMode';
import { arrangeView } from '../world/arrangeView';
import { COTE_DU_RADEAU, ecartVersLaPlace, placerALEchelle, POIGNEE_MIN_PX } from '../world/arrangeHandles';
import { toutConstruit } from '../world/budget';
import { BRIDGES, linkWholeRegion, VOYAGES } from '../world/archipelago';
import { ARCHIPELAGO_IDS } from '../world/archipelagos';
import { neighboursOf } from '../world/linkGeometry';
import { archipelagoOfIsland } from '../world/archipelagos';
import { dispositionEnGrille } from '../world/grid';
import { placeLibre, type Rect } from '../freeSpace';
import { avatarRoute, bornesDansLeMonde, bridgePath, ETAGES_DE_LA_BORNE, cadreDeLaLiaison, cadreDeTraversee, islandCenter, worldBounds } from '../world/terrain';
import { getBridge } from '../world/archipelago';
import { AUTOUR_DE_LA_DESTINATION, BORNES_AU_TELEPHONE, cadrageDeLaCarte, cadrageDeLaTraversee, creerCamera, decalagePourViser, ECHELLE_MIN_DE_LA_TRAVERSEE, PLANCHER_DE_LA_CARTE, ZOOM_DU_MONDE } from './camera';
import { boitesDesBornes, cadrerLesBornes, type InterfaceDeLaVue, ZOOM_DE_LA_CARTE } from './camera/framings';
import { RESERVE_DU_BAS } from '../freeSpace';
import { placerEtiquettes, replierLesSignes } from '../world/labelLayout';
import { HAUTEUR_DES_NOMS } from '../world/terrain';
import { SIGNE } from '../world/affordance';
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
    largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY), liaisons: () => [],
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
    // Ses voisines depuis une forme par île (GD-12) : le Belvédère, les deux observatoires, le Château des hypothèses et
    // le Verger de la santé ; pas le Refuge des carnets, le Kiosque des témoins ni le Studio des ondes, plus loin depuis
    // que les îles du Ciel s'écartent de huit cases (relecture du 9 octobre 2026).
    for (const zone of ['maths-3e-functions', 'maths-3e-geometry', 'maths-3e-statistics', 'french-3e-close-reading', 'english-3e-grammar', 'life-earth-sciences-3e-human-body'] as BiomeId[])
      expect(repereDeLaVue(null, zone), zone).toBe(R);
    for (const zone of ['lv2-3e-travel', 'history-3e-twentieth-century', 'english-3e-comprehension', 'french-6e-phonology', 'maths-4e-algebra'] as BiomeId[]) expect(repereDeLaVue(null, zone), zone).toBeNull();
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

  it('à l’ouverture, la Carte cadre les lieux d’aujourd’hui, plus près que le cadre de la région ; « Modifier le plan » garde le cadre entier (GD-11, consultant UX UI)', () => {
    const libre = { x0: 0, y0: 0, x1: T.w, y1: T.h - 64 };
    for (const a of ARCHIPELAGO_IDS) {
      const dest = mapOf(a)[1].id;
      const lieux = cadrageDeLaCarte(a, dest, T.w, T.h, libre);
      const region = cadrageDeLaCarte(a, dest, T.w, T.h, libre, { region: true });
      expect(lieux.echelle, a).toBeGreaterThan(region.echelle);
      // Le cadre de la région, ses quatre coins dans la place libre : les places libres s'y voient toutes.
      const b = worldBounds(a);
      const altitude = mapOf(a)[0].altitude;
      for (const [x, y] of [[b.minX, b.minY], [b.maxX, b.minY], [b.minX, b.maxY], [b.maxX, b.maxY]]) {
        const p = vu(region, T, x, altitude, y);
        expect(p.x >= libre.x0 && p.x <= libre.x1 && p.y >= libre.y0 && p.y <= libre.y1, `${a} (${x}, ${y})`).toBe(true);
      }
    }
  });

  it('« Modifier le plan » garde le cadre entier, quelle que soit la destination, sous la phrase de la place (GD-12, relecture UX UI)', () => {
    // La tablette, la phrase de la place en haut, Menu et bonhomme contournés à droite, Annuler et Valider en bas.
    const V = { w: 1024, h: 768 };
    const libre = { x0: 0, y0: 88, x1: 960, y1: 698 };
    for (const a of ARCHIPELAGO_IDS)
      for (const def of mapOf(a)) {
        const c = cadrageDeLaCarte(a, def.id, V.w, V.h, libre, { region: true });
        expect(c.auPlancher, `${a} ${def.id}`).toBe(false);
        const b = worldBounds(a);
        for (const [x, y] of [[b.minX, b.minY], [b.maxX, b.minY], [b.minX, b.maxY], [b.maxX, b.maxY]]) {
          const p = vu(c, V, x, def.altitude, y);
          expect(p.x >= libre.x0 && p.x <= libre.x1 && p.y >= libre.y0 && p.y <= libre.y1, `${a} ${def.id} (${x}, ${y})`).toBe(true);
        }
      }
  });

  it('« Modifier le plan » : un lieu choisi, son radeau « Tourner » tient dans la place, ou la Carte glisse de peu, le cadre de la région à l’écran (GD-12, relecture UX UI)', () => {
    // La Carte se juge à sa place visée (three/arrange.ts) : choisi pendant son glissé vers le cadre de la région, le
    // Bassin des maquettes (au coin du fond du 4e) se posait au milieu de la place, et la Source des espèces sortait au
    // coin opposé. Le radeau à l'échelle que lui donne la vue (three/arrangeHandles.ts, `echelleVoulue`).
    const V = { w: 1024, h: 768 };
    const { world } = toutConstruit();
    const ecart = { x: 0, y: 0 };
    for (const libre of [{ x0: 0, y0: 88, x1: 960, y1: 698 }, { x0: 0, y0: 88, x1: 1024, y1: 700 }])
      for (const a of ARCHIPELAGO_IDS) {
        const c = cadrageDeLaCarte(a, null, V.w, V.h, libre, { region: true });
        const cam = new THREE.PerspectiveCamera(40, V.w / V.h, 0.5, 1e5);
        cam.position.copy(c.pos);
        cam.lookAt(c.target);
        cam.updateMatrixWorld();
        const regard = cam.getWorldDirection(new THREE.Vector3());
        for (const def of mapOf(a)) {
          const choix = chooseIsland(world, def.id);
          const p = choix && arrangeView(world, choix).poignees;
          if (!p?.liste.length) continue;
          const profondeur = new THREE.Vector3(p.cx, p.z, p.cy).sub(cam.position).dot(regard);
          const parPixel = (2 * profondeur * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) / V.h;
          const s = Math.max(1, (POIGNEE_MIN_PX * parPixel) / (COTE_DU_RADEAU * Math.max(0.5, Math.abs(regard.y))));
          const centres = new Float32Array(2 * p.liste.length);
          placerALEchelle(p, s, centres);
          const d = (COTE_DU_RADEAU / 2) * s;
          const ici = new Float32Array(5 * p.liste.length);
          p.liste.forEach((_, k) => {
            const coins = [-d, d].flatMap((dx) => [-d, d].map((dy) => vu(c, V, centres[2 * k] + dx, p.z, centres[2 * k + 1] + dy)));
            const x0 = Math.min(...coins.map((q) => q.x));
            const x1 = Math.max(...coins.map((q) => q.x));
            const y0 = Math.min(...coins.map((q) => q.y));
            const y1 = Math.max(...coins.map((q) => q.y));
            ici.set([k, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0], 5 * k);
          });
          ecartVersLaPlace(ici, p.liste.length, libre, 4, ecart);
          expect(Math.hypot(ecart.x, ecart.y), `${a} ${def.id}`).toBeLessThanOrEqual(24);
          // La Carte glissée d'autant : les quatre coins du cadre de la région restent à l'écran.
          const b = worldBounds(a);
          for (const [x, y] of [[b.minX, b.minY], [b.maxX, b.minY], [b.minX, b.maxY], [b.maxX, b.maxY]]) {
            const q = vu(c, V, x, def.altitude, y);
            expect(q.x + ecart.x >= 0 && q.x + ecart.x <= V.w && q.y + ecart.y >= 0 && q.y + ecart.y <= V.h, `${a} ${def.id} (${x}, ${y})`).toBe(true);
          }
        }
      }
  });

  it('au plancher, l’île du bonhomme hors de la place y entre avec la destination quand les deux y tiennent ; sinon, la destination seule (GD-11, consultant UX UI)', () => {
    // La tablette, panneau ouvert : au plancher dans chaque classe.
    const libre = { x0: 0, y0: 250, x1: 1024, y1: 578 };
    const A = AUTOUR_DE_LA_DESTINATION;
    let cadrees = 0;
    for (const a of ARCHIPELAGO_IDS)
      for (const dest of mapOf(a).map((d) => d.id))
        for (const bonhomme of mapOf(a).map((d) => d.id)) {
          const seule = cadrageDeLaCarte(a, dest, T.w, T.h, libre);
          expect(seule.auPlancher, a).toBe(true);
          const avec = cadrageDeLaCarte(a, dest, T.w, T.h, libre, { bonhomme });
          const ici = centre(bonhomme, seule, T);
          const d = centre(dest, seule, T);
          const horsDeLaPlace = ici.x < libre.x0 || ici.x > libre.x1 || ici.y < libre.y0 || ici.y > libre.y1;
          const ensemble = Math.max(d.x, ici.x) - Math.min(d.x, ici.x) + 2 * A.cote <= libre.x1 - libre.x0 - 24 && Math.max(d.y, ici.y) - Math.min(d.y, ici.y) + A.haut + A.bas <= libre.y1 - libre.y0 - 24;
          if (horsDeLaPlace && ensemble) {
            cadrees++;
            expect(dedans(centre(dest, avec, T), libre), `${dest}, bonhomme sur ${bonhomme}`).toBe(true);
            expect(dedans(centre(bonhomme, avec, T), libre), `${bonhomme} avec ${dest}`).toBe(true);
          } else if (!horsDeLaPlace) expect(avec.target.distanceTo(seule.target), `${dest}, bonhomme sur ${bonhomme}`).toBeLessThan(1e-6);
        }
    expect(cadrees).toBeGreaterThan(0);
  });

  it('la flèche posée sur un ouvrage (GD-7) : sa pointe reste dans la place libre, au large comme serré', () => {
    // Les liaisons posées de la partie : depuis GD-9, une liaison qui ne tient pas n'a ni tracé ni flèche.
    const posees = [...new Set([...ARCHIPELAGO_IDS.flatMap((a) => linkWholeRegion(a, VOYAGES.map((v) => v.id))), ...VOYAGES.map((v) => v.id)])];
    for (const def of BRIDGES.filter((b) => posees.includes(b.id))) {
      const a = archipelagoOfIsland(def.from);
      const m = dispositionEnGrille(a, posees).placesDeLaFleche(def.id)[0];
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
      // Les voisines : celles qu'un pont relie (GD-9, `neighboursOf`), à moins de 45 cases. Elles restent à l'écran ; aux
      // Anciens Ateliers, dessinés en deux rangs (GD-9), une voisine du rang d'en face sort de la place libre.
      // Depuis HG-3, un troisième rang (l'Imprimerie et l'Escale, 16 cases au sud du deuxième) : l'Atelier et l'Escale, à 44
      // cases l'un de l'autre du nord au sud, ne tiennent pas ensemble dans cette place de 180 px ; seules les voisines à
      // moins de 40 cases du nord au sud (toutes celles d'avant, 28 au plus) s'y vérifient.
      for (const def of mapOf('4e').filter((d) => neighboursOf(dest).includes(d.id) && Math.hypot(d.core.x - d0.core.x, d.core.y - d0.core.y) < 45 && Math.abs(d.core.y - d0.core.y) < 40)) {
        const q = centre(def.id, c, T);
        // Les Anciens Ateliers sont dessinés en deux rangs (GD-9) : une voisine du rang d'en face déborde la place
        // libre d'une demi-île (une trentaine de pixels au plancher), en haut comme en bas.
        expect(q.x > 0 && q.x < T.w && q.y > 0 && q.y < T.h, `${dest} → ${def.id} (${Math.round(q.x)}, ${Math.round(q.y)})`).toBe(true);
      }
    }
  });

  it('la caméra ne suit pas le panneau : le cadrage ne dépend que de la place libre lue, et se recadre d’un coup quand le texte change', () => {
    const b = worldBounds('4e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '4e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 220, liaisons: () => [] };
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
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
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

  it('la Carte se zoome : de son cadrage d’ouverture jusqu’à deux îles environ, le point visé reste sous le doigt ; la Carte refermée l’efface', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
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
    // Au plus près, une île (22 cases) remplit la moitié du petit côté de la place libre, pas plus : deux îles environ.
    cam.zoomer(1000, { x: 0, y: 0 });
    cam.animer!(0.2, 0.016, true);
    const echelle = T.h / (2 * camera.position.distanceTo(cam.cible) * Math.tan((40 * Math.PI) / 360));
    expect(22 * echelle).toBeCloseTo(ZOOM_DE_LA_CARTE.ile * (libre.y1 - libre.y0), 0);
    // « Recentrer » revient au cadrage d'ouverture.
    cam.recentrer();
    cam.animer!(0.3, 0.016, true);
    expect(cam.decale()).toBe(false);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0, 3);
    // La Carte refermée efface le zoom qu'on y avait.
    cam.zoomer(2, { x: 0, y: 0 });
    derniers.current = { ...derniers.current, carte: false };
    instant.carte = false;
    cam.animer!(0.4, 0.016, true);
    expect(cam.decale()).toBe(false);
  });

  it('le monde se zoome aussi, borné autour de son cadrage ; le zoom reste d’une île à l’autre, « Recentrer » l’efface', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
    const camera = new THREE.PerspectiveCamera(40, T.w / T.h, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: 'french-6e-phonology', seq: 1 }, home: 'french-6e-phonology', forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant);
    // Avant la première image, la vue n'est pas encore celle du monde.
    expect(cam.zoomer(2, { x: 0, y: 0 })).toBe(false);
    cam.animer!(0, 0.016, true);
    const d0 = camera.position.distanceTo(cam.cible);
    const q0 = camera.quaternion.clone();
    expect(cam.zoomer(2, { x: 0.3, y: 0.2 })).toBe(true);
    expect(cam.decale()).toBe(true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0 / 2, 3);
    expect(camera.quaternion.angleTo(q0)).toBeCloseTo(0);
    // Bornes : au plus près, puis au plus loin.
    cam.zoomer(1000, { x: 0, y: 0 });
    cam.animer!(0.1, 0.016, true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0 / ZOOM_DU_MONDE.pres, 3);
    expect(cam.zoomer(2, { x: 0, y: 0 })).toBe(false);
    cam.zoomer(1e-3, { x: 0, y: 0 });
    cam.animer!(0.2, 0.016, true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d0 / ZOOM_DU_MONDE.loin, 3);
    // Vu de plus loin, la brume recule d'autant que la caméra.
    expect(instant.recul).toBeCloseTo(d0 / ZOOM_DU_MONDE.loin - d0, 3);
    // Une autre île : le décalage s'efface, le zoom reste.
    cam.zoomer(2, { x: 0, y: 0 });
    derniers.current = { ...derniers.current, focus: { island: 'french-6e-grammar-spelling', seq: 2 } };
    cam.animer!(0.3, 0.016, true);
    const d1 = camera.position.distanceTo(cam.cible);
    expect(cam.decale()).toBe(true);
    // Toucher une cible recentre sans effacer le zoom ; le bouton « Recentrer » l'efface.
    cam.recentrer();
    cam.animer!(0.4, 0.016, true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d1, 3);
    // Sur la Carte, le zoom du monde ne compte pas, et « Recentrer » ne l'efface pas ; il revient à la fermeture.
    derniers.current = { ...derniers.current, carte: true };
    instant.carte = true;
    cam.animer!(0.41, 0.016, true);
    expect(cam.decale()).toBe(false);
    cam.recentrer(true);
    derniers.current = { ...derniers.current, carte: false };
    instant.carte = false;
    cam.animer!(0.42, 0.016, true);
    expect(cam.decale()).toBe(true);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d1, 3);
    cam.recentrer(true);
    cam.animer!(0.5, 0.016, true);
    expect(cam.decale()).toBe(false);
    expect(instant.recul).toBe(0);
    expect(camera.position.distanceTo(cam.cible)).toBeCloseTo(d1 * (2 * ZOOM_DU_MONDE.loin), 3);
  });

  it('poser met la caméra d’un coup à son cadrage et rend l’écart qu’il restait (les captures)', () => {
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
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
      largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY), liaisons: () => [],
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

  it('« Partir d’une autre île » (GD-9) : la caméra tient le départ et l’arrivée du fantôme au-dessus de la fiche, d’un coup en mouvement réduit', () => {
    // La Mine reliée : le bac de la Mine à la Rivière, l'autre départ de la Rivière (GD-9).
    const posees = ['french-6e-phonology-french-6e-letter-confusion'];
    const def = getBridge('french-6e-letter-confusion-maths-6e-fractions')!;
    const cases = bridgePath(def, posees);
    const cadre = cadreDeLaLiaison(def, posees)!;
    expect(cadre).not.toBeNull();
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
    // Une tablette en paysage, la fiche en bas (un tiers de la vue) et la barre du haut.
    const t = { w: 1024, h: 688 };
    const libre = placeLibre(t.w, t.h, [{ x: t.w / 2, y: t.h - 130, w: t.w, h: 260 }], [{ x: t.w - 30, y: 60, w: 52, h: 110 }]);
    const camera = new THREE.PerspectiveCamera(40, t.w / t.h, 0.5, 2000);
    const derniers = { current: { carte: false, focus: { island: 'maths-6e-calculation', seq: 1 }, home: 'maths-6e-calculation', forceDay: true, cadreDeLaLiaison: cadre } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const cam = creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, { place: () => ({ libre, w: t.w, h: t.h, saut: false }), destination: () => null });
    // Mouvement réduit : coupé net, à la première image.
    cam.animer!(0, 0.016, true);
    camera.updateMatrixWorld();
    for (const c of [cases[0], cases[cases.length - 1]]) {
      const p = ecran(camera, t, c.x + 0.5, c.z, c.y + 0.5);
      expect(p.x >= libre.x0 && p.x <= libre.x1 && p.y >= libre.y0 && p.y <= libre.y1, `${c.x},${c.y} → ${p.x},${p.y}`).toBe(true);
    }
    const but = camera.position.clone();
    cam.animer!(0.1, 0.016, true);
    expect(camera.position.distanceTo(but)).toBeLessThan(1e-6);
    // La fiche fermée (plus de liaison cadrée) : la caméra revient à son cadrage d'île.
    (derniers.current as { cadreDeLaLiaison: unknown }).cadreDeLaLiaison = null;
    cam.animer!(0.2, 0.016, true);
    expect(camera.position.distanceTo(but)).toBeGreaterThan(1);
  });

  it('le cadre fixe se pose dans la place libre, hors du panneau d’île ouvert et des barres : paysage et portrait 800 × 1280', () => {
    // De la Plaine à la Fouille des siècles par le long bac du port (118 cases), panneau de la Fouille ouvert (la Carrière,
    // à 67 cases depuis que les îles ont grandi, GD-11, était l'exemple jusque-là).
    const liens = ['maths-6e-calculation-history-6e-antiquity'];
    const route = avatarRoute('maths-6e-calculation', 'history-6e-antiquity', liens)!;
    const cadre = cadreDeTraversee('6e', liens, route)!;
    expect(cadre).not.toBeNull();
    const b = worldBounds('6e');
    const monde: Monde = { scene: new THREE.Scene(), archipel: '6e', habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
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

  it('le cadre fixe seulement à une taille lisible : gardé en 1024 × 768 et 800 × 1280 (et aux Îles du Ciel, 3e), la caméra suit le bonhomme en 390 × 844', () => {
    // Aux Îles du Ciel, depuis une forme par île (GD-12), plus aucune liaison du Phare ne fait une longue traversée : celle
    // du Belvédère au Château des hypothèses longe le Phare, sur le rang de devant.
    const liens = ['maths-6e-calculation-french-6e-word-spelling', 'maths-3e-geometry-english-3e-grammar'];
    const port = avatarRoute('maths-6e-calculation', 'french-6e-word-spelling', liens)!;
    const phare = avatarRoute('maths-3e-geometry', 'english-3e-grammar', liens)!;
    // La vue entière, panneau fermé (il attend l'arrivée), sous la barre du haut (80 px).
    const cas = [
      { nom: '6e, 1024 × 768', archipel: '6e' as const, route: port, w: 1024, h: 688, fixe: true },
      { nom: '6e, 800 × 1280', archipel: '6e' as const, route: port, w: 800, h: 1200, fixe: true },
      { nom: '3e, 1024 × 768', archipel: '3e' as const, route: phare, w: 1024, h: 688, fixe: true },
      { nom: '6e, 390 × 844', archipel: '6e' as const, route: port, w: 390, h: 764, fixe: false },
    ];
    for (const t of cas) {
      const cadre = cadreDeTraversee(t.archipel, liens, t.route)!;
      const libre = placeLibre(t.w, t.h, [{ x: t.w / 2, y: t.h - 34, w: t.w, h: 64 }], [{ x: t.w - 30, y: 60, w: 52, h: 110 }]);
      const altitude = mapOf(t.archipel)[0]?.altitude ?? 0;
      const { echelle } = cadrageDeLaTraversee(cadre, altitude, t.w, t.h, libre, 40);
      expect(echelle >= ECHELLE_MIN_DE_LA_TRAVERSEE, `${t.nom} : ${echelle.toFixed(1)} px la case`).toBe(t.fixe);
      const b = worldBounds(t.archipel);
      const monde: Monde = { scene: new THREE.Scene(), archipel: t.archipel, habillage: HABILLAGES.blocland, surface: null, etendue: b, centre: { x: 0, y: 0 }, largeur: 200, liaisons: () => [] };
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

// Les bornes au téléphone (GD-14, consultant UX UI) : sur les îles-écoles à cinq places (x = 0 à 16), la borne de la
// mission 1 sortait par le bord droit de l'écran en portrait. La caméra glisse de côté, ou recule, juste ce qu'il faut ;
// la tablette garde son cadrage. Sans WebGL : on projette les bornes avec la caméra calculée.
describe('Les bornes au téléphone en portrait (GD-14)', () => {
  /** Une vue de téléphone en portrait : sa taille, et ce que l'interface y pose (lu dans la page, WorldCanvas.tsx). */
  type Telephone = { w: number; h: number; ui: InterfaceDeLaVue; nom: string };
  /**
   * La caméra de la vue de l'île (`island`) ou du bonhomme posé sur `home`, dans une vue `t` dont la caméra connaît la
   * taille et l'interface.
   */
  function cadrer(habillage: Habillage, t: { w: number; h: number; ui?: InterfaceDeLaVue }, island: BiomeId | null, home: BiomeId): THREE.PerspectiveCamera {
    const a = archipelagoOfIsland(home);
    const b = worldBounds(a);
    const monde: Monde = { scene: new THREE.Scene(), archipel: a, habillage, surface: null, etendue: b, centre: { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }, largeur: Math.max(b.maxX - b.minX, b.maxY - b.minY), liaisons: () => [] };
    const camera = new THREE.PerspectiveCamera(40, t.w / t.h, 0.5, 2000);
    const focus = { island, seq: 0 } as unknown as Derniers['focus'];
    const derniers = { current: { carte: false, focus, home, forceDay: true, sons: false } as unknown as Derniers };
    const instant: Instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } };
    const lecture = { place: () => ({ libre: { x0: 0, y0: 0, x1: t.w, y1: t.h }, w: t.w, h: t.h, saut: false }), destination: () => null, vue: t };
    creerCamera(monde, camera, new THREE.Object3D(), derniers, instant, lecture).cadrer(focus, false, home);
    camera.updateMatrixWorld();
    return camera;
  }
  /**
   * Le plus petit écart, en pixels CSS, entre une borne de `id` (sa bulle la plus grande, son pied) et ce qu'elle ne doit
   * pas passer : la marge des bords, la barre du bas, les boutons du haut qu'elle croise. Négatif : elle déborde.
   */
  function jeu(cam: THREE.Camera, t: Telephone, id: BiomeId): number {
    const B = BORNES_AU_TELEPHONE;
    let min = Infinity;
    for (const b of bornesDansLeMonde(id)) {
      const pointe = ecran(cam, t, b.x, b.sommet + SIGNE.auDessus, b.y);
      const pied = ecran(cam, t, b.x, b.sommet - ETAGES_DE_LA_BORNE.ardoise, b.y);
      const haut = pointe.y - B.hautBulle;
      // La bulle ne touche aucun bouton, à la marge près.
      for (const o of t.ui.boutons) {
        const cote = Math.max(o.x - o.w / 2 - (pointe.x + B.demiBulle), pointe.x - B.demiBulle - (o.x + o.w / 2));
        const dessous = haut - (o.y + o.h / 2);
        min = Math.min(min, Math.max(cote, dessous) - B.marge);
      }
      min = Math.min(min, pointe.x - B.demiBulle - B.marge, t.w - B.marge - (pointe.x + B.demiBulle), haut - B.marge, t.h - Math.max(RESERVE_DU_BAS, t.ui.barre) - B.marge - pied.y);
    }
    return min;
  }
  /**
   * Les boutons du haut, relevés dans la page (global.css, `.world-menu-button`, `.world-archipel`) : en texte normal, Menu
   * (52 px) dans le coin et la colonne des quatre classes dessous (jusqu'à 290 px, 82 px pour « ✓ 3e ») ; en grand texte au
   * téléphone, la rangée des classes en haut, sur deux lignes (OpenDyslexic, plus large), à gauche de Menu, et la barre
   * du bas sur deux lignes.
   */
  const colonne = (w: number): InterfaceDeLaVue => ({
    boutons: [
      { x: w - 12 - 26, y: 12 + 26, w: 52, h: 52 },
      { x: w - 12 - 41, y: 74 + 108, w: 82, h: 216 },
    ],
    barre: 72,
  });
  const rangee = (w: number): InterfaceDeLaVue => ({
    boutons: [
      { x: w - 12 - 26, y: 12 + 26, w: 52, h: 52 },
      { x: (12 + (w - 74)) / 2, y: 12 + 62, w: w - 86, h: 124 },
    ],
    barre: 140,
  });
  const ECOLES = ['maths-5e-proportionality', 'maths-4e-algebra', 'maths-3e-functions'] as BiomeId[];
  const TELEPHONES: Telephone[] = [
    { w: 390, h: 844, ui: colonne(390), nom: '390 × 844' },
    { w: 360, h: 740, ui: colonne(360), nom: '360 × 740' },
    { w: 390, h: 844, ui: rangee(390), nom: '390 × 844, grand texte' },
  ];

  it('le nom de l’île ne se pose sur aucune borne ni sur sa bulle : au Phare des fonctions, au téléphone, il en couvrait une (référent dys, consultant UX UI)', () => {
    // L'étiquette telle que la pose three/labels.ts : au-dessus du milieu du cœur, à `HAUTEUR_DES_NOMS` ; sa taille, celle
    // que mesure la recherche des Gardiens (18 px, 0,65 em par lettre, le bloc et le bord).
    const id: BiomeId = 'maths-3e-functions';
    const nom = 'Phare des fonctions';
    let montres = 0;
    for (const t of TELEPHONES)
      for (const u of ['blocland', 'archipeo'] as const) {
        const cam = cadrer(HABILLAGES[u], t, id, id);
        const c = islandCenter(id);
        const p = ecran(cam, t, c.x + 0.5, c.z + HAUTEUR_DES_NOMS, c.y + 0.5);
        const ile = ecran(cam, t, c.x + 0.5, c.z, c.y + 0.5);
        const box = { x: p.x, y: p.y, w: 18 * (nom.length * 0.65 + 2.4) + 4, h: 18 * 1.7 + 4 };
        const zones = [...t.ui.boutons, { x: t.w / 2, y: t.h - t.ui.barre / 2, w: t.w, h: t.ui.barre }];
        const bornes = boitesDesBornes(cam, t.w, t.h, [id]);
        expect(bornes.length, `${u}, ${t.nom}`).toBe(5);
        const vue = { zones, bulles: [], obstacles: bornes, bounds: { w: t.w, h: t.h }, gap: 6 };
        // Comme three/labels.ts : sans place, le nom essaie sans son bloc, plus étroit.
        const etroite = [box.w - 18 * 1.2];
        const r = replierLesSignes([box], etroite, (b) => placerEtiquettes(b, [ile], vue, null, [0]));
        // Le nom ne se tait pas pour les bornes : visible sans elles, il l'est avec.
        const sans = replierLesSignes([box], etroite, (b) => placerEtiquettes(b, [ile], { ...vue, obstacles: [] }, null, [0]));
        expect(r.visibles[0], `${u}, ${t.nom}, visible`).toBe(sans.visibles[0]);
        if (!r.visibles[0]) continue;
        montres++;
        const pose = { ...box, w: r.sansSigne[0] ? etroite[0] : box.w, x: box.x + r.offsets[0].dx, y: box.y + r.offsets[0].dy };
        const recouvre = bornes.filter((b) => Math.abs(b.x - pose.x) < (b.w + pose.w) / 2 && Math.abs(b.y - pose.y) < (b.h + pose.h) / 2);
        expect(recouvre, `${u}, ${t.nom}`).toEqual([]);
      }
    expect(montres).toBeGreaterThan(0);
  });

  it('les îles-écoles du 5e au 3e : leurs bornes à 0, 4, 8, 12 et 16 (quatre au 4e), comme sur les captures', () => {
    for (const id of ECOLES) {
      const xs = bornesDansLeMonde(id).map((b) => b.x - bornesDansLeMonde(id)[0].x);
      expect(xs, id).toEqual(id === 'maths-4e-algebra' ? [0, 4, 8, 12] : [0, 4, 8, 12, 16]);
    }
  });

  it.each(Object.keys(HABILLAGES) as (keyof typeof HABILLAGES)[])('%s : chaque borne et sa bulle tiennent dans la vue, à 24 px des bords, sous les boutons du haut lus dans la page et au-dessus de la barre du bas', (u) => {
    for (const id of ECOLES)
      for (const t of TELEPHONES)
        for (const island of [id, null]) {
          const vue = island ? 'vue de l’île' : 'bonhomme posé';
          const marge = jeu(cadrer(HABILLAGES[u], t, island, id), t, id);
          expect(marge, `${id}, ${vue}, ${t.nom}`).toBeGreaterThanOrEqual(-0.5);
        }
  });

  it('juste ce qu’il faut : dans la vue de l’île du Marché, la borne la plus serrée est à la marge, pas plus loin', () => {
    const t = TELEPHONES[0];
    for (const u of ['blocland', 'archipeo'] as const) {
      const marge = jeu(cadrer(HABILLAGES[u], t, 'maths-5e-proportionality', 'maths-5e-proportionality'), t, 'maths-5e-proportionality');
      expect(marge, u).toBeGreaterThanOrEqual(-0.5);
      expect(marge, u).toBeLessThan(1);
    }
  });

  it('la tablette garde son cadrage : en paysage, panneau ouvert ou en portrait, rien ne glisse ni ne recule', () => {
    const target = new THREE.Vector3(10, 4, 10);
    const pos = new THREE.Vector3(30, 30, -10);
    const bornes = bornesDansLeMonde('maths-5e-proportionality');
    for (const [w, h] of [[1024, 688], [1024, 768], [1280, 800], [505, 688], [768, 1024], [844, 390]]) {
      const r = cadrerLesBornes(target, pos, bornes, w, h, 40);
      expect(r.glisse.length(), `${w} × ${h}`).toBe(0);
      expect(r.recul, `${w} × ${h}`).toBe(1);
    }
    // Les bornes y tiennent déjà : à la tablette de référence, en paysage, la vue de l'île les montre entières.
    for (const u of ['blocland', 'archipeo'] as const)
      for (const id of ECOLES) {
        const t = { w: 1024, h: 688 };
        const cam = cadrer(HABILLAGES[u], t, id, id);
        for (const b of bornesDansLeMonde(id)) {
          const p = ecran(cam, t, b.x, b.sommet + SIGNE.auDessus, b.y);
          expect(p.x > BORNES_AU_TELEPHONE.demiBulle && p.x < t.w - BORNES_AU_TELEPHONE.demiBulle && p.y < t.h - RESERVE_DU_BAS, `${u} ${id}`).toBe(true);
        }
      }
  });

  it('au téléphone, ni le nord ni la direction de vue ne changent : la caméra glisse à plat et recule seulement', () => {
    const t = TELEPHONES[0];
    const cam = cadrer(HABILLAGES.blocland, t, 'maths-5e-proportionality', 'maths-5e-proportionality');
    const c = islandCenter('maths-5e-proportionality');
    const r = cadrerLesBornes(new THREE.Vector3(c.x, c.z + 1, c.y), new THREE.Vector3(c.x + 30, c.z + 40, c.y - 30), bornesDansLeMonde('maths-5e-proportionality'), t.w, t.h, 40);
    expect(r.glisse.y).toBeCloseTo(0, 9);
    expect(r.recul).toBeGreaterThanOrEqual(1);
    // La vue de l'île garde la direction de celle de la tablette, qui ne glisse pas.
    const d = cam.getWorldDirection(new THREE.Vector3());
    const tablette = cadrer(HABILLAGES.blocland, { w: 1024, h: 688 }, 'maths-5e-proportionality', 'maths-5e-proportionality').getWorldDirection(new THREE.Vector3());
    expect(d.angleTo(tablette)).toBeLessThan(1e-6);
  });
});

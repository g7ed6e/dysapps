// Le cadrage des grands repères (revue d'ensemble du directeur artistique, DA-17 et DA-18) : dans Archipéo, le grand
// phare des Îles du Ciel reste dans le cadre de la vue de l'archipel et de la vue de son île, et sa lanterne se découpe
// sur le ciel à l'arrivée ; Blocland garde son cadrage. Sans WebGL : on projette des points avec la caméra placée.
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { HABILLAGES, type Habillage } from '../habillage';
import { repereDeLaVue } from '../world/cadrage';
import { GRAND_PHARE_3E } from '../world/decor/3e';
import { PHARE, PHARES } from '../world/decor/phare';
import { islandDef, landBox } from '../world/map';
import { worldBounds } from '../world/terrain';
import { creerCamera } from './camera';
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

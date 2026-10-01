// Sur la Carte, chaque île a son nom (référent dys, relecture du 01/10/2026 : le « Marais des temps » s'était tu au
// 5e quand les îles-écoles ont grandi). Sans WebGL ni navigateur : la caméra de la Carte se cadre comme dans la scène
// (`cadrageDeLaCarte`), les îles et leurs étiquettes se projettent à l'écran, et le placement est celui des deux vues
// (`placerEtiquettes`). Les étiquettes ont la taille de `labelCanvas.ts`, le texte mesuré dans la police de lecture
// (la chasse lue dans son fichier, `policesDeTest.ts`) ; l'interface est celle relevée sur les captures de la tablette.
// Ce que le test ne couvre pas :
// - OpenDyslexic. En taille normale, son panneau est plus haut que celui relevé ici (non mesuré sans navigateur) ; avec
//   un panneau de 250 à 310 px, un nom se tait encore au 6e (la Ferme) et, à 310 px, au 5e (le Marais). En grand texte,
//   la Carte est au plancher (`PLANCHER_DE_LA_CARTE`) : les îles y sont à 115 px les unes des autres, leurs noms en
//   OpenDyslexic font de 240 à 400 px de large dans une bande de 180 px de haut ; tous ne peuvent pas se montrer.
// - Au 6e, une autre destination que le port : onze îles serrées, le fanion du bonhomme sur la Forêt ; un nom peut
//   s'y taire (la Forêt, la Ferme, la Baie, l'Horloge selon la destination).
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { getArchipelago, islandsOf } from '../world/archipelago';
import { ARCHIPELAGO_IDS, type ArchipelagoId } from '../world/archipels';
import { placerEtiquettes, separateMark, type LabelBox } from '../world/labelLayout';
import { avatarHome, islandCenter } from '../world/terrain';
import { placeLibre } from '../placeLibre';
import { cadrageDeLaCarte } from './camera';
import { largeurEnGras, type PoliceDeTest } from './policesDeTest';

/** La tablette de référence, et ce que l'interface y pose sur la Carte (relevé sur les captures, village complet). */
const TABLETTE = { w: 1024, h: 768 };
const PANNEAU: LabelBox = { x: 467, y: 119, w: 678, h: 214 };
const BARRE: LabelBox = { x: 512, y: 731, w: 540, h: 50 };
const BOUTONS: LabelBox[] = [
  { x: 985, y: 37, w: 52, h: 52 },
  { x: 966, y: 98, w: 66, h: 46 },
];
const ZONES = [PANNEAU, BARRE, ...BOUTONS];

/** L'étiquette d'une île sur la Carte, en pixels CSS : le nom à 18 px, l'état à 16 px (voir `labelCanvas.ts`, `etiquettes.ts`). */
function etiquette(nom: string, etat: string, largeur: (t: string) => number, elargir: number): { w: number; h: number } {
  const px = 18;
  const nomW = largeur(nom) * px * elargir;
  const etatW = px * 0.9 * 1.35 + largeur(etat) * px * 0.9 * elargir;
  const bord = 2 * Math.max(2, Math.round(40 / 8)) * (px / 40);
  // (Plus 4 pixels de canvas autour, à l'échelle de l'affichage.)
  return { w: Math.max(nomW, etatW) + px * 1.2 + bord + 4 * (px / 40), h: px * 3.05 + bord + 4 * (px / 40) };
}

/**
 * La Carte d'un archipel tout construit, comme sur les captures : la destination est le port (« Le village est complet »),
 * le bonhomme sur la première île de l'archipel. Rend les îles dont le nom se tait alors que l'île se voit (`tus`), et
 * de combien chaque nom se pose au-dessus de son île, en pixels (`dessus`).
 */
function laCarte(a: ArchipelagoId, etat: string, police: PoliceDeTest, elargir: number, destination: BiomeId = getArchipelago(a).port) {
  const { w: W, h: H } = TABLETTE;
  const c = cadrageDeLaCarte(a, destination, W, H, placeLibre(W, H, [PANNEAU, BARRE], BOUTONS));
  const cam = new THREE.PerspectiveCamera(40, W / H, 0.5, 1e5);
  cam.position.copy(c.pos);
  cam.lookAt(c.target);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3();
  const ecran = (x: number, y: number, z: number) => {
    v.set(x, y, z).project(cam);
    return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
  };
  const iles = islandsOf(a);
  const largeur = largeurEnGras(police);
  const centres = iles.map((b) => islandCenter(b.id));
  // L'étiquette flotte à 12 cases au-dessus du sol de son île (`etiquettes.ts`).
  const boxes = iles.map((b, i) => ({ ...ecran(centres[i].x + 0.5, centres[i].z + 12, centres[i].y + 0.5), ...etiquette(b.name, etat, largeur, elargir) }));
  const points = centres.map((p) => ecran(p.x + 0.5, p.z, p.y + 0.5));
  // Le fanion du bonhomme et la flèche de la destination (`marksOnScreen`).
  const av = avatarHome(iles[0].id);
  const pied = ecran(av.x + 0.5, av.z + 4.5, av.y + 0.5);
  const tete = ecran(av.x + 0.5, av.z + 17, av.y + 0.5);
  const fh = Math.max(24, Math.abs(pied.y - tete.y));
  const fanion = { x: (pied.x + tete.x) / 2, y: (pied.y + tete.y) / 2, w: Math.max(24, fh * 0.9), h: fh };
  const d = islandCenter(destination);
  const pointe = ecran(d.x + 0.5, d.z + 8, d.y + 0.5);
  const ecart = separateMark(pointe, { x: fanion.x, y: fanion.y + fanion.h / 2 }, 56);
  const fleche = { x: pointe.x + ecart.dx, y: pointe.y + ecart.dy - 24, w: (48 * 96) / 124, h: 48 };
  const poids = iles.map((b) => (b.id === destination ? 2 : 1));
  const { visibles, offsets } = placerEtiquettes(boxes, points, { zones: ZONES, bulles: [], obstacles: [fleche, fanion], bounds: { w: W, h: H }, gap: 6 }, { weights: poids });
  const sousLInterface = (p: { x: number; y: number }) => ZONES.some((z) => Math.abs(p.x - z.x) < z.w / 2 && Math.abs(p.y - z.y) < z.h / 2);
  const seVoit = (p: { x: number; y: number }) => p.x >= 0 && p.x <= W && p.y >= 0 && p.y <= H && !sousLInterface(p);
  return {
    tus: iles.filter((_, i) => !visibles[i] && seVoit(points[i])).map((b) => b.id),
    dessus: new Map(iles.map((b, i) => [b.id, points[i].y - (boxes[i].y + offsets[i].dy)])),
  };
}
const nomsTus = (...args: Parameters<typeof laCarte>) => laCarte(...args).tus;

/** Le mot de l'état « tout construit » dans chaque univers (`etatsDIle`). */
const ETATS = { blocland: 'Bâtie', archipeo: 'Restaurée' };

describe('La Carte : chaque île a son nom (tablette 1024 × 768)', () => {
  it.each(ARCHIPELAGO_IDS)('%s, archipel tout construit : toutes les îles sont à l’écran, hors de l’interface, et montrent leur nom', (a) => {
    for (const [univers, etat] of Object.entries(ETATS))
      // La police de lecture par défaut, et la même 10 % plus large (une police de repli, si elle manque à l'appareil).
      for (const elargir of [1, 1.1]) expect(nomsTus(a, etat, 'atkinson-hyperlegible', elargir), `${a}, ${univers}, ×${elargir}`).toEqual([]);
  });

  it('le Marais des temps (5e) garde son nom, et l’Atelier (4e, la destination) le sien au-dessus de son île', () => {
    expect(nomsTus('5e', ETATS.blocland, 'atkinson-hyperlegible', 1)).not.toContain('marais');
    for (const etat of Object.values(ETATS)) {
      const atelier = laCarte('4e', etat, 'atkinson-hyperlegible', 1);
      expect(getArchipelago('4e').port).toBe('atelier');
      expect(atelier.tus).toEqual([]);
      expect(atelier.dessus.get('atelier')).toBeGreaterThan(0);
    }
  });

  it.each(['5e', '4e', '3e'] as const)('%s : quelle que soit la destination, chaque île qui se voit garde son nom', (a) => {
    for (const dest of islandsOf(a).map((b) => b.id)) expect(nomsTus(a, ETATS.blocland, 'atkinson-hyperlegible', 1, dest), `${a} → ${dest}`).toEqual([]);
  });
});

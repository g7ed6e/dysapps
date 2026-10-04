// Les bulles dans la scène 3D, sans WebGL : celle de la créature (GD-4, étape 1 ; GD-7) et, dans Blocland, celles des
// objets à faire (proposition « à la Supercell », 4 octobre 2026) : le geste une fois à l'arrivée de la caméra sur
// l'île, la bulle ensuite, un seul appel de dessin pour toutes, trois au plus sur l'île du bonhomme, la première mise en
// avant (plus grande, bordée d'or, seule à bouger), le rebond au toucher, rien sur la Carte, et rien qui bouge avec
// « Réduire les animations ».
import * as THREE from 'three';
import type { BiomeId } from '../biomes';
import { GESTE_DU_SIGNE, ICONE_DU_SIGNE } from '../world/signe';
import type { Derniers, Instant, Monde } from './partie';
import type { Personnages } from './personnages';
import { HABILLAGES, type Habillage } from '../habillage';
import { BLOCKS } from '../biomes';
import { shade } from '../Voxel';
import { BULLE, cleDeLObjet, type ObjetTouche, type SigneDObjet } from '../world/affordance';
import { creerSignes, dessinerLaCase } from './signes';

const FORET: BiomeId = 'french-6e-phonology';
const MINE: BiomeId = 'french-6e-letter-confusion';

/** La taille à l'écran d'une case de Blocland (la plaque et sa pointe), en pixels CSS : une bulle, ou la mise en avant. */
const CASE_CSS = (BULLE.px * 128) / 96;
const CASE_EN_AVANT_CSS = (BULLE.prochainePx * 128) / 96;

/** Un objet à faire de la Forêt, en (x, 0), sa bulle à 4 blocs de haut. */
const objet = (o: ObjetTouche, x: number, ile: BiomeId = FORET): SigneDObjet => ({
  cle: cleDeLObjet(o),
  objet: o,
  etat: 'aFaire',
  x,
  y: 0,
  z: 4,
  iles: [ile],
  boite: { min: { x: x - 0.5, y: -0.5, z: 1 }, max: { x: x + 0.5, y: 0.5, z: 3.6 } },
});

/** Le côté, dans le monde, du quadrilatère `n` du maillage. */
const cote = (signes: { maillage: THREE.Mesh }, n: number) => {
  const p = signes.maillage.geometry.getAttribute('position');
  return Math.hypot(p.getX(4 * n + 1) - p.getX(4 * n), p.getY(4 * n + 1) - p.getY(4 * n), p.getZ(4 * n + 1) - p.getZ(4 * n));
};

function scene(habillage: Habillage = HABILLAGES.blocland) {
  // jsdom ne dessine pas dans un canvas : la texture reste vide, le reste se vérifie.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const monde = { scene: new THREE.Scene(), habillage } as unknown as Monde;
  const el = { clientHeight: 768 } as HTMLElement;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  const faireSigne = vi.fn();
  const personnages = {
    faireSigne,
    teteDe: (_id: BiomeId, out: THREE.Vector3) => (out.set(0, 3, 0), true),
  } as unknown as Personnages;
  const derniers = { current: { carte: false, focus: { island: FORET, seq: 1 }, home: null, forceDay: false, whalePass: null, sons: false } as Derniers };
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const signes = creerSignes(monde, el, camera, personnages, derniers, instant);
  return { monde, signes, faireSigne, derniers, instant, camera };
}

afterEach(() => vi.restoreAllMocks());

it('à l’arrivée sur l’île, un seul geste, puis la bulle ; seulement celles de l’île du bonhomme, en un appel de dessin', () => {
  const { monde, signes, faireSigne, derniers, instant } = scene();
  signes.poser([
    { id: FORET, icone: 'tree' },
    { id: MINE, icone: 'pickaxe' },
  ]);
  instant.now = 1000;
  signes.animer!(0, 0, false);
  expect(faireSigne).toHaveBeenCalledTimes(1);
  expect(faireSigne).toHaveBeenCalledWith(FORET, 1000 + GESTE_DU_SIGNE.attenteMs);
  // Pendant le geste : la bulle de la Forêt attend ; celle de la Mine n'est pas sur l'île du bonhomme.
  expect(signes.maillage.visible).toBe(false);
  // Le geste fini : la bulle de la Forêt, seule.
  instant.now = 1000 + GESTE_DU_SIGNE.attenteMs + GESTE_DU_SIGNE.dureeMs;
  signes.animer!(0, 0, false);
  expect(signes.maillage.geometry.drawRange.count).toBe(6);
  expect(monde.scene.children.filter((o) => o instanceof THREE.Mesh)).toHaveLength(1);
  // Le geste ne se répète pas : la même île cadrée de nouveau, rien de plus.
  derniers.current.focus = { island: FORET, seq: 2 };
  signes.animer!(0, 0, false);
  expect(faireSigne).toHaveBeenCalledTimes(1);
  // Le rayon la traverse (une bulle se touche par `sous`).
  const touche: THREE.Intersection[] = [];
  signes.maillage.raycast(new THREE.Raycaster(), touche);
  expect(touche).toHaveLength(0);
});

it('rien sur la Carte', () => {
  const { signes, faireSigne, derniers } = scene();
  derniers.current.carte = true;
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, false);
  expect(faireSigne).not.toHaveBeenCalled();
  expect(signes.maillage.visible).toBe(false);
});

it('avec « Réduire les animations » : pas de geste, l’icône tout de suite', () => {
  const { signes, faireSigne } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, true);
  expect(faireSigne).not.toHaveBeenCalled();
  expect(signes.maillage.visible).toBe(true);
  expect(signes.maillage.geometry.drawRange.count).toBe(6);
});

it('sans révision due, rien n’est dessiné, et tout se libère', () => {
  const { monde, signes } = scene();
  signes.poser([]);
  signes.animer!(0, 0, false);
  expect(signes.maillage.visible).toBe(false);
  const geometrie = vi.spyOn(signes.maillage.geometry, 'dispose');
  signes.dispose();
  expect(geometrie).toHaveBeenCalled();
  expect(monde.scene.children).toHaveLength(0);
});

it('dans Blocland, une bulle carrée aux coins presque droits, avec son ombre et sa pointe ; dans Archipéo, le disque', () => {
  const traceur = () => {
    const appels: string[] = [];
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (cible, nom: string) => cible[nom] ?? ((...args: unknown[]) => void appels.push(`${nom}:${args.join(',')}`)),
      set: (cible, nom: string, valeur) => ((cible[nom] = valeur), true),
    }) as unknown as CanvasRenderingContext2D;
    return { ctx, appels };
  };
  expect(HABILLAGES.blocland.signe).toBe('plaque');
  expect(HABILLAGES.archipeo.signe).toBe('disque');
  const plaque = traceur();
  dessinerLaCase(plaque.ctx, 0, { icone: 'tree' }, 'plaque');
  // L'ombre, le bord sombre et le fond : trois carrés aux petits coins (rayon de 8 au plus sur une case de 128), aucun
  // cercle ; la pointe vers l'objet, au milieu, en bas de la case.
  const coins = plaque.appels.filter((a) => a.startsWith('arcTo'));
  expect(coins).toHaveLength(12);
  expect(coins.every((a) => Number(a.split(',').at(-1)) <= 8)).toBe(true);
  expect(plaque.appels.some((a) => a.startsWith('arc:'))).toBe(false);
  expect(plaque.appels).toContain('lineTo:64,122');
  const disque = traceur();
  dessinerLaCase(disque.ctx, 0, { icone: 'tree' }, 'disque');
  expect(disque.appels.some((a) => a.startsWith('arc:'))).toBe(true);
  expect(disque.appels.some((a) => a.startsWith('arcTo'))).toBe(false);
});

it('une commande (GD-7) : la même plaque, avec le cube du bloc demandé aux couleurs de Mes blocs, cerné de sombre', () => {
  const remplis: string[] = [];
  const traits: number[] = [];
  const appels: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (cible, nom: string) => {
      if (nom === 'fill') return () => remplis.push(String(cible.fillStyle));
      if (nom === 'stroke') return () => traits.push(Number(cible.lineWidth));
      return cible[nom] ?? ((...args: unknown[]) => void appels.push(`${nom}:${args.join(',')}`));
    },
    set: (cible, nom: string, valeur) => ((cible[nom] = valeur), true),
  }) as unknown as CanvasRenderingContext2D;
  const brique = BLOCKS['maths-6e-calculation'];
  dessinerLaCase(ctx, 0, { bloc: 'maths-6e-calculation' }, 'plaque');
  // L'ombre, la pointe, le bord sombre, le fond clair, puis le dessus, la face gauche et la face droite plus sombre du
  // cube : celles de BlockIcon.
  expect(remplis).toEqual(['#2b2118', '#2b2118', '#2b2118', '#fff6e0', brique.top ?? shade(brique.side, 0.16), brique.side, shade(brique.side, -0.18)]);
  // Le contour du cube, ses arêtes intérieures (le bord de la bulle est un aplat).
  expect(traits).toEqual([5, 3]);
  expect(appels.filter((a) => a.startsWith('arcTo'))).toHaveLength(12);
  // Mise en avant : un bord d'or entre le bord sombre et le fond.
  remplis.length = 0;
  dessinerLaCase(ctx, 1, { bloc: 'maths-6e-calculation' }, 'plaque', true);
  expect(remplis.slice(0, 5)).toEqual(['#2b2118', '#2b2118', '#2b2118', '#e0b73f', '#fff6e0']);
});

it('une commande et un objet ont chacun leur case, dans le même maillage', () => {
  const { signes, monde } = scene();
  signes.poser([{ id: FORET, icone: 'blocks', bloc: 'maths-6e-calculation' }]);
  signes.poserLesObjets([objet({ genre: 'borne', id: `${FORET}:a` }, 2)], null);
  signes.animer!(0, 0, true);
  expect(signes.maillage.geometry.drawRange.count).toBe(12);
  const uv = signes.maillage.geometry.getAttribute('uv');
  // Deux cases différentes de la texture : l'image du bloc n'est pas l'icône des blocs.
  expect(uv.getX(0)).not.toBe(uv.getX(4));
  expect(monde.scene.children.filter((o) => o instanceof THREE.Mesh)).toHaveLength(1);
});

it('les plaques sont des obstacles pour les étiquettes ; leur version ne change qu’à l’arrivée d’une plaque', () => {
  const { signes, derniers, instant } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, true);
  const v = signes.version;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const [b] = signes.boites(camera, 1024, 768);
  // Sa case (elle n'est pas la prochaine destination : pas mise en avant), et une marge de 4 pixels autour.
  expect(b.w).toBeCloseTo(CASE_CSS + 8, 6);
  expect(b.x).toBeCloseTo(512, 0);
  // La plaque se pose sur la tête : son bas à l'écran est au-dessus de la tête.
  const tete = new THREE.Vector3(0, 3, 0).project(camera);
  expect(b.y + b.h / 2).toBeLessThan(((1 - tete.y) / 2) * 768);
  // Les images suivantes, la caméra qui vole, la Carte : rien ne change (les étiquettes ne se replacent pas en vol).
  signes.animer!(0, 0, true);
  instant.now = 5000;
  camera.position.set(10, 30, -20);
  signes.animer!(0, 0, false);
  derniers.current.carte = true;
  signes.animer!(0, 0, true);
  expect(signes.version).toBe(v);
  // Une plaque qui s'en va (une commande livrée) : rien ne bouge non plus, et elle n'est plus un obstacle.
  signes.poser([]);
  expect(signes.version).toBe(v);
  expect(signes.boites(camera, 1024, 768)).toEqual([]);
  // Une plaque de plus : les étiquettes se replacent.
  signes.poser([{ id: FORET, icone: 'pickaxe' }]);
  expect(signes.version).not.toBe(v);
  // Celle qui attend la fin du geste compte déjà (l'étiquette ne bouge pas quand elle apparaît).
  expect(signes.boites(camera, 1024, 768)).toHaveLength(1);
});

it('pendant la vague, une plaque nouvelle se montre tout de suite, mais les étiquettes ne se replacent qu’à sa fin', () => {
  const { signes, instant, derniers } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  signes.animer!(0, 0, true);
  const v = signes.version;
  // « Livrer » : la vague commence, la commande livrée s'en va, la suivante (la Mine, où va le bonhomme) est suggérée
  // tout de suite.
  signes.suivreLaVague(true);
  derniers.current.focus = { island: MINE, seq: 2 };
  signes.poser([{ id: MINE, icone: 'blocks', bloc: 'french-6e-phonology' }]);
  instant.now = 500;
  signes.animer!(0, 0, true);
  expect(signes.maillage.visible).toBe(true);
  expect(signes.maillage.geometry.drawRange.count).toBe(6);
  expect(signes.version).toBe(v);
  // La vague finie (ou touchée) : une fois.
  signes.suivreLaVague(false);
  expect(signes.version).toBe(v + 1);
  signes.suivreLaVague(false);
  expect(signes.version).toBe(v + 1);
});

it('pendant la vague, une créature qui arrive dans la scène attend aussi la fin de la vague', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  const monde = { scene: new THREE.Scene(), habillage: HABILLAGES.blocland } as unknown as Monde;
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  let la = false;
  const personnages = { faireSigne: vi.fn(), teteDe: (_id: BiomeId, out: THREE.Vector3) => (out.set(0, 3, 0), la) } as unknown as Personnages;
  const derniers = { current: { carte: false, focus: { island: null, seq: 1 }, home: FORET, forceDay: false, whalePass: null, sons: false } as unknown as Derniers };
  const instant = { now: 0, marche: false, traversee: null, navigue: null, carte: false, but: { target: new THREE.Vector3(), pos: new THREE.Vector3() } } as Instant;
  const signes = creerSignes(monde, { clientHeight: 768 } as HTMLElement, camera, personnages, derniers, instant);
  signes.suivreLaVague(true);
  signes.poser([{ id: FORET, icone: 'tree' }]);
  const v = signes.version;
  la = true;
  signes.animer!(0, 0, true);
  expect(signes.maillage.visible).toBe(true);
  expect(signes.version).toBe(v);
  signes.suivreLaVague(false);
  expect(signes.version).toBe(v + 1);
  // Hors de la vague, une plaque de plus replace les étiquettes tout de suite (aucune ne reste sous une plaque).
  signes.poser([
    { id: FORET, icone: 'tree' },
    { id: MINE, icone: 'pickaxe' },
  ]);
  expect(signes.version).toBe(v + 2);
});

it('la créature d’une plaque est aussi un obstacle : aucune étiquette ne se pose sur elle', () => {
  const { signes } = scene();
  const corps = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 2));
  corps.position.set(0, 1.5, 0);
  corps.userData.creature = FORET;
  const creatures = new THREE.Group().add(corps);
  creatures.updateMatrixWorld(true);
  const { signes: avecCorps } = (() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const monde = { scene: new THREE.Scene(), habillage: HABILLAGES.blocland } as unknown as Monde;
    const personnages = { creatures, faireSigne: vi.fn(), teteDe: (_id: BiomeId, out: THREE.Vector3) => (out.set(0, 3, 0), true) } as unknown as Personnages;
    const derniers = { current: { carte: false, focus: { island: null, seq: 1 }, home: FORET } as unknown as Derniers };
    const instant = { now: 0, carte: false, navigue: null } as unknown as Instant;
    return { signes: creerSignes(monde, { clientHeight: 768 } as HTMLElement, new THREE.PerspectiveCamera(), personnages, derniers, instant) };
  })();
  avecCorps.poser([{ id: FORET, icone: 'tree' }]);
  const camera = new THREE.PerspectiveCamera(40, 4 / 3, 0.5, 1000);
  camera.position.set(0, 20, -30);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const [plaque, corpsALEcran] = avecCorps.boites(camera, 1024, 768);
  expect(plaque.w).toBeCloseTo(CASE_CSS + 8, 6);
  expect(corpsALEcran.x).toBeCloseTo(512, 0);
  // Sous la plaque, et plus haut qu'une case.
  expect(corpsALEcran.y).toBeGreaterThan(plaque.y);
  expect(corpsALEcran.h).toBeGreaterThan(40);
  avecCorps.dispose!();
  signes.dispose!();
});

it('la hauteur de la vue ne se lit pas dans le DOM image par image : le redimensionnement la donne', () => {
  const { signes, instant } = scene();
  signes.poser([{ id: FORET, icone: 'tree' }]);
  instant.now = 1;
  signes.animer!(0, 0, true);
  const taille = () => {
    const p = signes.maillage.geometry.getAttribute('position');
    return Math.abs(p.getX(1) - p.getX(0)) + Math.abs(p.getZ(1) - p.getZ(0));
  };
  const avant = taille();
  // La vue deux fois plus haute : la bulle garde sa taille en pixels, donc deux fois plus petite dans le monde.
  signes.redimensionner(768 * 2);
  signes.animer!(0, 0, true);
  expect(taille()).toBeCloseTo(avant / 2, 5);
});

describe('les bulles de Blocland (proposition « à la Supercell », 4 octobre 2026)', () => {
  const OBJETS = [
    objet({ genre: 'borne', id: `${FORET}:a` }, -4),
    objet({ genre: 'borne', id: `${FORET}:b` }, -2),
    objet({ genre: 'ouvrage', id: 'pont' }, 2),
    objet({ genre: 'borne', id: `${MINE}:a` }, 6, MINE),
  ];

  it('trois au plus, sur l’île où l’on est ; la première (la prochaine chose à faire) plus grande, les autres à 56 pixels', () => {
    const { signes, derniers } = scene();
    derniers.current.home = FORET;
    signes.poser([{ id: FORET, icone: 'blocks', bloc: 'maths-6e-calculation' }]);
    signes.poserLesObjets(OBJETS, 'ouvrage:pont');
    signes.animer!(0, 0, true);
    expect(signes.maillage.geometry.drawRange.count).toBe(18);
    // L'ouvrage d'abord (la prochaine), mis en avant : plus grand que les deux suivantes, dans la proportion des pixels.
    expect(cote(signes, 0) / cote(signes, 1)).toBeLessThan(CASE_EN_AVANT_CSS / CASE_CSS + 0.2);
    // Sur la Mine, sa seule borne, mise en avant.
    derniers.current.focus = { island: MINE, seq: 2 };
    signes.animer!(0, 0, true);
    expect(signes.maillage.geometry.drawRange.count).toBe(6);
    // Archipéo : une plaque par créature qui fait signe, sur toutes les îles, et aucune bulle d'objet.
    const archipeo = scene(HABILLAGES.archipeo).signes;
    archipeo.poser([
      { id: FORET, icone: 'tree' },
      { id: MINE, icone: 'pickaxe' },
    ]);
    archipeo.poserLesObjets(OBJETS, null);
    archipeo.animer!(0, 0, true);
    expect(archipeo.maillage.geometry.drawRange.count).toBe(12);
  });

  it('seule la bulle mise en avant monte et descend, de 4 pixels au plus au-dessus de sa place ; rien avec le mouvement réduit ni une fiche ouverte', () => {
    const { signes, derniers } = scene();
    derniers.current.home = FORET;
    signes.poserLesObjets(OBJETS, `borne:${FORET}:a`);
    const hauteurs = (t: number, reduit: boolean) => {
      signes.animer!(t, 0, reduit);
      const p = signes.maillage.geometry.getAttribute('position');
      return [0, 1].map((n) => p.getY(4 * n));
    };
    const [repos0, repos1] = hauteurs(0, false);
    const [haut0, haut1] = hauteurs(BULLE.flotte.periodeS / 4, false);
    expect(haut0).toBeGreaterThan(repos0);
    expect(haut1).toBeCloseTo(repos1, 9);
    // Avec le mouvement réduit, elle reste posée sur sa pointe (à 4 blocs), comme les autres.
    const [reduit0] = hauteurs(BULLE.flotte.periodeS / 4, true);
    expect(reduit0).toBeCloseTo(4, 6);
    expect(repos0).toBeGreaterThan(4);
    // Une fiche ouverte : on lit, elle se tient tranquille sur sa pointe.
    derniers.current.calme = true;
    const [calme0] = hauteurs(BULLE.flotte.periodeS / 4, false);
    expect(calme0).toBeCloseTo(4, 6);
  });

  it('Archipéo garde son disque tel quel : il ne se touche pas et ne rebondit pas', () => {
    const { signes, derniers, camera } = scene(HABILLAGES.archipeo);
    derniers.current.home = FORET;
    signes.poser([{ id: FORET, icone: 'tree' }]);
    signes.animer!(0, 0, true);
    const v = new THREE.Vector3(0, 3 + ICONE_DU_SIGNE.auDessus, 0).project(camera);
    expect(signes.sous(((v.x + 1) / 2) * 1024, ((1 - v.y) / 2) * 768 - 20, 1024, 768)).toBeNull();
    expect(signes.rebondir(`creature:${FORET}`)).toBe(false);
  });

  it('une créature qui a des révisions ne fait signe que si sa bulle est montrée (trois au plus)', () => {
    const { signes, derniers, faireSigne } = scene();
    signes.poser([{ id: FORET, icone: 'tree' }]);
    // Trois choses à faire passent avant ses révisions : pas de bulle, pas de geste.
    signes.poserLesObjets(OBJETS, null);
    signes.animer!(0, 0, false);
    expect(faireSigne).not.toHaveBeenCalled();
    // Une seule chose à faire : sa bulle est montrée, elle fait signe à l'arrivée suivante.
    signes.poserLesObjets(OBJETS.slice(0, 1), null);
    derniers.current.focus = { island: FORET, seq: 2 };
    signes.animer!(0, 0, false);
    expect(faireSigne).toHaveBeenCalledTimes(1);
  });

  it('un ouvrage : sa bulle au-dessus de son bout du côté de l’île où l’on est', () => {
    const { signes, derniers } = scene();
    derniers.current.home = FORET;
    signes.poserLesObjets([{ ...objet({ genre: 'ouvrage', id: 'pont' }, 0), parIle: { [FORET]: { x: -3, y: 0, z: 2 }, [MINE]: { x: 3, y: 0, z: 2 } } }], 'ouvrage:pont');
    signes.animer!(0, 0, true);
    const p = signes.maillage.geometry.getAttribute('position');
    // Le milieu de son bas (sa pointe) au-dessus de x = -3, à 2 blocs.
    expect((p.getX(0) + p.getX(1)) / 2).toBeCloseTo(-3, 6);
    expect((p.getY(0) + p.getY(1)) / 2).toBeCloseTo(2, 6);
  });

  it('touchée, une bulle s’écrase puis rebondit et se pose ; une bulle cachée, ou avec le mouvement réduit, ne bouge pas', () => {
    const { signes, derniers, instant } = scene();
    derniers.current.home = FORET;
    signes.poserLesObjets(OBJETS, null);
    signes.animer!(0, 0, false);
    const avant = cote(signes, 1);
    expect(signes.rebondir(`borne:${FORET}:b`)).toBe(true);
    instant.now += BULLE.rebond.ecraseMs;
    signes.animer!(0, 0, false);
    expect(cote(signes, 1) / avant).toBeCloseTo(BULLE.rebond.ecrase, 6);
    instant.now += 1000;
    signes.animer!(0, 0, false);
    expect(cote(signes, 1)).toBeCloseTo(avant, 9);
    // Une bulle d'une autre île n'est pas montrée.
    expect(signes.rebondir(`borne:${MINE}:a`)).toBe(false);
    // Avec le mouvement réduit, elle ne s'écrase pas.
    signes.rebondir(`borne:${FORET}:b`);
    instant.now += BULLE.rebond.ecraseMs;
    signes.animer!(0, 0, true);
    expect(cote(signes, 1)).toBeCloseTo(avant, 9);
  });

  it('sous le doigt, une bulle rend ce qu’elle touche (un objet, une créature) ; ailleurs, et sur la Carte, rien', () => {
    const { signes, derniers, camera } = scene();
    derniers.current.home = FORET;
    signes.poser([{ id: FORET, icone: 'blocks', bloc: 'maths-6e-calculation' }]);
    signes.poserLesObjets(OBJETS.slice(0, 1), null);
    signes.animer!(0, 0, true);
    const aLEcran = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return [((v.x + 1) / 2) * 1024, ((1 - v.y) / 2) * 768] as const;
    };
    // Juste au-dessus de la pointe de chaque bulle : la créature (1,1 bloc au-dessus de sa tête en (0, 3, 0)), la borne
    // (en (-4, 4, 0)).
    const [cx, cy] = aLEcran(0, 3 + ICONE_DU_SIGNE.auDessus, 0);
    expect(signes.sous(cx, cy - 20, 1024, 768)).toEqual({ genre: 'creature', id: FORET });
    const [bx, by] = aLEcran(-4, 4, 0);
    expect(signes.sous(bx, by - 20, 1024, 768)).toEqual({ genre: 'borne', id: `${FORET}:a` });
    // Les marges transparentes de sa case ne prennent pas le toucher : seulement la plaque et sa pointe.
    expect(signes.sous(bx - CASE_CSS / 2 + 3, by - 20, 1024, 768)).toBeNull();
    expect(signes.sous(5, 5, 1024, 768)).toBeNull();
    derniers.current.carte = true;
    signes.animer!(0, 0, true);
    expect(signes.sous(cx, cy - 20, 1024, 768)).toBeNull();
  });

  it('la bulle d’une chose qui sort de l’écran (le milieu d’un long ouvrage) reste au bord, entière, au-dessus de la barre', () => {
    const { signes, derniers, camera } = scene();
    derniers.current.home = FORET;
    signes.poserLesObjets([objet({ genre: 'ouvrage', id: 'pont' }, -60), objet({ genre: 'borne', id: `${FORET}:a` }, 0)], null);
    signes.animer!(0, 0, true);
    const p = signes.maillage.geometry.getAttribute('position');
    for (const n of [0, 1]) {
      const coins = [0, 1, 2, 3].map((j) => new THREE.Vector3(p.getX(4 * n + j), p.getY(4 * n + j), p.getZ(4 * n + j)).project(camera));
      expect(Math.min(...coins.map((c) => c.x))).toBeGreaterThanOrEqual(-1);
      expect(Math.max(...coins.map((c) => c.x))).toBeLessThanOrEqual(1);
      expect(Math.min(...coins.map((c) => c.y))).toBeGreaterThanOrEqual(-1 + (2 * BULLE.bordPx) / 768 - 1e-9);
      expect(Math.max(...coins.map((c) => c.y))).toBeLessThanOrEqual(1);
    }
    // Celle de l'ouvrage (la deuxième : la borne passe avant) touche le bord : on la voit, et on la touche.
    const ouvrage = [4, 5, 6, 7].map((j) => new THREE.Vector3(p.getX(j), p.getY(j), p.getZ(j)).project(camera));
    expect(Math.min(...ouvrage.map((c) => Math.abs(Math.abs(c.x) - 1)))).toBeLessThan(0.05);
  });
});

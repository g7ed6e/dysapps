import { BIOMES, BLOCKS, type BlockId } from '../biomes';
import { EMPTY_STATE, type GameState } from '../engine';
import {
  basDuSigne,
  centreDuSigneGrossi,
  cleDeLObjet,
  COULEURS_DU_SIGNE,
  COTE_DU_SIGNE,
  coutDesSignes,
  echelleDuSigne,
  flottementDuSigne,
  formeDuSigne,
  hauteurDuSigneDeLObjet,
  sautDuSigne,
  SIGNE,
  signesDesObjets,
  sommetDe,
  sommetsDesBornes,
  tourDuSigne,
  TRIANGLES_DU_SIGNE,
  zoneDeToucher,
  zoneDuToucher,
  zoneRetenue,
  borneDe,
  ecartALaBoite,
  type ZoneDObjet,
  type SigneDObjet,
} from './affordance';
import { isBiomeUnlocked } from './archipelago';
import { toutConstruit } from './budget';
import { etatsDesObjets, modeleDuMonde } from './modele';
import { creaturePlacements, gardienDuMonde, guardianPlacements, vehiclePlacement, worldCubes } from './terrain';
import { textesDe } from '../../univers';
import { GESTE_DU_SIGNE, hauteurDuSigne } from './signe';
import type { ArchipelagoId } from './map';

const textes = textesDe('blocland');

/** Les signes d'un archipel pour une partie, comme la page du monde les donne à la vue. */
function signesDe(state: GameState, a: ArchipelagoId): SigneDObjet[] {
  const cubes = worldCubes(a, state.progress, state.world, false);
  const quests = modeleDuMonde(state, a, textes.archipels, textes.libelles).bornes.map((b) => ({ id: b.id, state: b.etat }));
  const creatures = [...creaturePlacements(a, state.world.links), ...guardianPlacements(a, state.progress, state.world.links)];
  return signesDesObjets({ cubes, quests, creatures, vehicle: vehiclePlacement(a, state.progress, state.world), etats: etatsDesObjets(state, a) });
}

const fini = (): GameState => ({ ...EMPTY_STATE, ...toutConstruit() }) as GameState;

it('au début du jeu : un losange d’or sur chaque borne à faire de l’île ouverte, rien sur les îles fermées, le crème sur l’école et la salle des trophées', () => {
  const signes = signesDe(EMPTY_STATE, '6e');
  const bornes = signes.filter((s) => s.objet.genre === 'borne');
  expect(bornes.length).toBeGreaterThan(0);
  // Les bornes des îles ouvertes seulement, pas celles des îles fermées (délavées).
  const ouvertes = BIOMES.filter((b) => b.classe === '6e' && isBiomeUnlocked(b.id, EMPTY_STATE.world.links)).map((b) => b.id);
  expect(new Set(bornes.flatMap((s) => s.iles))).toEqual(new Set(ouvertes));
  expect(ouvertes.length).toBeLessThan(BIOMES.filter((b) => b.classe === '6e').length);
  expect(bornes.every((s) => s.etat === 'aFaire')).toBe(true);
  const lieux = signes.filter((s) => s.objet.genre === 'lieu' && !String(s.objet.id).startsWith('monument:'));
  expect(lieux.map((s) => s.objet.genre === 'lieu' && s.objet.id).sort()).toEqual(['school', 'trophies']);
  expect(lieux.every((s) => s.etat === 'lieu')).toBe(true);
  // Le lieu où l'on assemble ne porte rien (l'école et la salle des trophées seulement, §8).
  expect(signes.some((s) => s.objet.genre === 'lieu' && s.objet.id === 'assembly')).toBe(false);
  // Le navire, sans bloc à poser ni départ possible : la pierre ; aucun Gardien n'attend.
  expect(signes.find((s) => s.objet.genre === 'navire')?.etat).toBe('pasEncore');
  expect(signes.some((s) => s.objet.genre === 'gardien')).toBe(false);
});

it('une chose ne porte jamais deux signes', () => {
  for (const state of [EMPTY_STATE, fini()])
    for (const a of ['6e', '5e', '4e', '3e'] as const) {
      const cles = signesDe(state, a).map((s) => s.cle);
      expect(new Set(cles).size, a).toBe(cles.length);
    }
});

it('tout construit : rien sur les bornes réussies (leurs étoiles), les Gardiens vaincus, les ouvrages construits ; le crème sur l’école, la salle des trophées et les monuments bâtis', () => {
  const signes = signesDe(fini(), '6e');
  expect(signes.filter((s) => ['borne', 'gardien', 'ouvrage'].includes(s.objet.genre))).toEqual([]);
  const lieux = signes.filter((s) => s.objet.genre === 'lieu');
  expect(lieux.length).toBeGreaterThan(2);
  expect(lieux.every((s) => s.etat === 'lieu')).toBe(true);
});

it('une borne pas jouable porte la pierre, une jouée sans étoile l’or ; un Gardien prêt l’or, pas prêt la pierre ; un vaincu rien', () => {
  const { cubes } = { cubes: worldCubes('6e', {}, EMPTY_STATE.world, false) };
  const id = [...sommetsDesBornes(cubes).keys()].find((q) => q.startsWith('french-6e-phonology:'))!;
  const etat = (state: 'new' | 'locked' | number) => signesDesObjets({ cubes, quests: [{ id, state }] })[0];
  expect(etat('new').etat).toBe('aFaire');
  expect(etat('locked').etat).toBe('pasEncore');
  expect(etat(0).etat).toBe('aFaire');
  expect(signesDesObjets({ cubes, quests: [{ id, state: 2 }] }).filter((s) => s.objet.genre === 'borne')).toEqual([]);
  // Les Gardiens : au défi prêt, au défi pas prêt (la sentinelle d'Archipéo, qui attend), vaincu.
  const g = { id: 'french-6e-phonology' as const, kind: 'guardian' as const, cubes: [{ x: 0, y: 0, z: 0, color: '#fff' }], origin: { x: 10, y: 10, z: 3 } };
  const etats = { gardiensPrets: ['french-6e-phonology' as const], navirePret: false, chantiersPrets: [] };
  expect(signesDesObjets({ cubes: [], creatures: [g], etats })[0].etat).toBe('aFaire');
  expect(signesDesObjets({ cubes: [], creatures: [g], etats: { ...etats, gardiensPrets: [] } })[0].etat).toBe('pasEncore');
  expect(signesDesObjets({ cubes: [], creatures: [{ ...g, beaten: true }], etats })).toEqual([]);
  // Une créature n'a jamais de cube (sa plaque).
  expect(signesDesObjets({ cubes: [], creatures: [{ ...g, kind: 'creature' }], etats })).toEqual([]);
});

it('la hauteur : 1,2 bloc au-dessus du sommet de l’objet (le plus haut z de ses cubes, + 1)', () => {
  expect(sommetDe([{ z: 2 }, { z: 5 }, { z: 3 }])).toBe(6);
  expect(hauteurDuSigneDeLObjet([{ z: 2 }, { z: 5 }])).toBeCloseTo(7.2, 9);
  expect(hauteurDuSigneDeLObjet([{ z: 0 }], 3)).toBeCloseTo(5.2, 9);
  // Une borne : son socle et son ardoise sur le sol de sa case ; le signe 1,2 au-dessus de l'ardoise.
  const cubes = worldCubes('6e', {}, EMPTY_STATE.world, false);
  const [id, sommet] = [...sommetsDesBornes(cubes)][0];
  const ardoise = cubes.filter((c) => c.quest === id);
  expect(sommet).toBe(Math.max(...ardoise.map((c) => c.z)) + 1);
  const [s] = signesDesObjets({ cubes, quests: [{ id, state: 'new' }] });
  expect(s.z).toBeCloseTo(sommet + SIGNE.auDessus, 9);
  expect(s.x).toBe(ardoise[0].x + 0.5);
  expect(s.y).toBe(ardoise[0].y + 0.5);
  // Un Gardien et le navire : au-dessus de leurs cubes, dans le monde (leur origine comprise).
  const g = { id: 'french-6e-phonology' as const, kind: 'guardian' as const, cubes: [{ x: 0, y: 0, z: 0, color: '#fff' }, { x: 1, y: 0, z: 4, color: '#fff' }], origin: { x: 10, y: 20, z: 3 } };
  const [gs] = signesDesObjets({ cubes: [], creatures: [g] });
  expect([gs.x, gs.y, gs.z]).toEqual([11, 20.5, 3 + 5 + SIGNE.auDessus]);
  const navire = vehiclePlacement('6e', {}, EMPTY_STATE.world);
  const [ns] = signesDesObjets({ cubes: [], vehicle: navire });
  expect(ns.z).toBeCloseTo(navire.origin.z + sommetDe(navire.cubes) + SIGNE.auDessus, 9);
});

it('un chantier en fantôme : un seul cube par ouvrage ou par monument, l’or si l’élève a les blocs, sinon la pierre', () => {
  // Toutes les îles ouvertes, rien de bâti : chaque monument est un chantier.
  const links = toutConstruit().world.links;
  const vide: GameState = { ...EMPTY_STATE, world: { ...EMPTY_STATE.world, links } };
  const monuments = signesDe(vide, '6e').filter((s) => s.objet.genre === 'lieu' && String(s.objet.id).startsWith('monument:'));
  expect(monuments.length).toBeGreaterThan(0);
  expect(monuments.every((s) => s.etat === 'pasEncore')).toBe(true);
  const stock = Object.fromEntries(Object.keys(BLOCKS).map((b) => [b, 999])) as Record<BlockId, number>;
  const riche = signesDe({ ...vide, stock }, '6e').filter((s) => s.objet.genre === 'lieu' && String(s.objet.id).startsWith('monument:'));
  expect(riche.every((s) => s.etat === 'aFaire')).toBe(true);
  // Un ouvrage en fantôme, au début du jeu : un cube, sur sa case du milieu, posé sur sa colonne.
  const cubes = worldCubes('6e', {}, EMPTY_STATE.world, false);
  const fantomes = cubes.filter((c) => c.bridge && c.ghost);
  const id = fantomes[0]?.bridge;
  if (!id) return;
  const ouvrages = signesDesObjets({ cubes }).filter((s) => s.objet.genre === 'ouvrage');
  expect(ouvrages.filter((s) => s.objet.genre === 'ouvrage' && s.objet.id === id)).toHaveLength(1);
  const pret = signesDesObjets({ cubes, etats: { gardiensPrets: [], navirePret: false, chantiersPrets: [id] } }).find((s) => s.cle === `ouvrage:${id}`);
  expect(pret?.etat).toBe('aFaire');
  expect(pret?.iles.length).toBe(2);
});

it('l’état des objets, lu de la sauvegarde : rien au début, rien tout construit ; les Gardiens prêts, le navire et les chantiers quand l’élève a les blocs', () => {
  expect(etatsDesObjets(EMPTY_STATE, '6e')).toEqual({ gardiensPrets: [], navirePret: false, chantiersPrets: [] });
  expect(etatsDesObjets(fini(), '6e')).toEqual({ gardiensPrets: [], navirePret: false, chantiersPrets: [] });
  // Toutes les missions réussies, aucun défi relevé : chaque Gardien de l'archipel attend.
  const sansDefis = fini();
  const progress = Object.fromEntries(Object.entries(sansDefis.progress).filter(([k]) => !k.endsWith('-challenge')));
  const ids = BIOMES.filter((b) => b.classe === '6e').map((b) => b.id);
  expect(etatsDesObjets({ ...sansDefis, progress }, '6e').gardiensPrets.sort()).toEqual([...ids].sort());
  // Des blocs plein les poches : le navire a un bloc à poser, chaque monument aussi.
  const stock = Object.fromEntries(Object.keys(BLOCKS).map((b) => [b, 999])) as Record<BlockId, number>;
  const riche = etatsDesObjets({ ...EMPTY_STATE, stock }, '6e');
  expect(riche.navirePret).toBe(true);
  expect(riche.chantiersPrets.length).toBeGreaterThan(0);
});

it('le mouvement : le losange flotte de ± 0,15 bloc en 3 s et fait un tour en 6 s, le même pour tous', () => {
  expect(flottementDuSigne(0)).toBeCloseTo(0, 9);
  expect(flottementDuSigne(0.75)).toBeCloseTo(0.15, 9);
  expect(flottementDuSigne(2.25)).toBeCloseTo(-0.15, 9);
  expect(flottementDuSigne(3.75)).toBeCloseTo(flottementDuSigne(0.75), 9);
  expect(tourDuSigne(3)).toBeCloseTo(Math.PI, 9);
  expect(tourDuSigne(6)).toBeCloseTo(0, 9);
});

it('le saut au toucher : une bosse de 0,2 bloc en 180 ms, sans rebond, plus courte et plus basse que celle des révisions', () => {
  expect(sautDuSigne(0)).toBe(0);
  expect(sautDuSigne(-5)).toBe(0);
  expect(sautDuSigne(70)).toBeCloseTo(0.2, 9);
  expect(sautDuSigne(180)).toBe(0);
  expect(sautDuSigne(400)).toBe(0);
  // Elle monte jusqu'à 70 ms, puis redescend sans jamais passer sous zéro (pas de rebond).
  let avant = 0;
  for (let ms = 1; ms < 180; ms++) {
    const h = sautDuSigne(ms);
    expect(h).toBeGreaterThanOrEqual(0);
    if (ms <= 70) expect(h).toBeGreaterThanOrEqual(avant);
    else expect(h).toBeLessThanOrEqual(avant + 1e-12);
    avant = h;
  }
  expect(SIGNE.saut.monteeMs + SIGNE.saut.descenteMs).toBeLessThan(GESTE_DU_SIGNE.dureeMs);
  expect(SIGNE.saut.hauteur).toBeLessThan(GESTE_DU_SIGNE.hauteur);
  expect(hauteurDuSigne(700)).toBeCloseTo(GESTE_DU_SIGNE.hauteur, 9);
});

it('la taille : 14 pixels au moins à l’écran, le cube grossit quand la caméra s’éloigne', () => {
  // 1 000 pixels par bloc à un bloc de distance : le crème (0,8) fait 800 pixels à 1 bloc, 14 à environ 57 blocs.
  expect(echelleDuSigne(COTE_DU_SIGNE.lieu, 10, 1000)).toBe(1);
  const loin = 200;
  const e = echelleDuSigne(COTE_DU_SIGNE.pasEncore, loin, 1000);
  expect(e).toBeGreaterThan(1);
  expect((COTE_DU_SIGNE.pasEncore * e * 1000) / loin).toBeCloseTo(SIGNE.minPx, 6);
});

it('la forme : le losange d’or sur sa pointe, la pierre et le crème à plat, tous aux arêtes dans la même géométrie, sans dessous à plat', () => {
  expect(TRIANGLES_DU_SIGNE).toEqual({ aFaire: 60, pasEncore: 50, lieu: 50 });
  for (const etat of ['aFaire', 'pasEncore', 'lieu'] as const) {
    const f = formeDuSigne(etat);
    expect(f.normals.length).toBe(f.positions.length);
    expect(f.aretes.length * 3).toBe(f.positions.length);
    expect(f.aretes.some((a) => a === 1)).toBe(true);
    // Centré, et à sa taille : le crème à plat touche ± 0,4 ; le losange sur sa pointe, ± la demi-diagonale.
    const ys = [...f.positions].filter((_, i) => i % 3 === 1);
    if (etat === 'aFaire') {
      expect(Math.max(...ys)).toBeCloseTo(basDuSigne('aFaire'), 6);
      expect(Math.min(...ys)).toBeCloseTo(-basDuSigne('aFaire'), 6);
    } else {
      expect(Math.max(...ys)).toBeCloseTo(COTE_DU_SIGNE[etat] / 2, 6);
      // Aucune normale vers le bas : le dessous n'est pas dessiné.
      expect([...f.normals].filter((_, i) => i % 3 === 1).every((n) => n >= 0)).toBe(true);
    }
  }
  // Les arêtes du losange d'or, brun sombre comme celles du crème : il ne se confond pas avec l'or du décor.
  expect(COULEURS_DU_SIGNE.aFaire.arete).toBe('#2b2118');
  expect(coutDesSignes([{ etat: 'aFaire' }, { etat: 'aFaire' }, { etat: 'lieu' }])).toEqual({ triangles: 170, drawCalls: 2 });
});

it('le losange d’or reste sur sa pointe, à tout moment de son tour : un sommet en bas et un en haut, sur l’axe vertical', () => {
  const f = formeDuSigne('aFaire');
  const bas = basDuSigne('aFaire');
  // Les huit coins du cube : les sommets de sa forme à une demi-diagonale du centre.
  const coins: [number, number, number][] = [];
  for (let k = 0; k < f.positions.length; k += 3) {
    const p: [number, number, number] = [f.positions[k], f.positions[k + 1], f.positions[k + 2]];
    if (Math.abs(Math.hypot(...p) - bas) < 1e-4 && !coins.some((c) => Math.hypot(c[0] - p[0], c[1] - p[1], c[2] - p[2]) < 1e-4)) coins.push(p);
  }
  expect(coins).toHaveLength(8);
  // Le tour, autour de la verticale du monde, après la pose : le sommet du bas reste en bas, sur l'axe.
  for (const angle of [0, 0.3, Math.PI / 4, 1, 2, Math.PI, 4.5]) {
    const tournes = coins.map(([x, y, z]) => [x * Math.cos(angle) + z * Math.sin(angle), y, -x * Math.sin(angle) + z * Math.cos(angle)]);
    const plusBas = tournes.reduce((a, b) => (b[1] < a[1] ? b : a));
    expect(plusBas[1], `angle ${angle}`).toBeCloseTo(-bas, 6);
    expect(Math.hypot(plusBas[0], plusBas[2]), `angle ${angle}`).toBeLessThan(1e-6);
    // Un seul sommet en bas, les trois suivants nettement plus haut.
    expect(tournes.filter((c) => c[1] < -bas / 2)).toHaveLength(1);
  }
  // Figé (au repos), vu de face (la caméra est du côté des z négatifs) : une arête verticale au milieu, qui monte du
  // sommet du bas, sur le devant (ses deux bouts au même x, au milieu), et les deux arêtes des côtés verticales aussi.
  const verticales = coins.flatMap((a, i) =>
    coins
      .slice(i + 1)
      .filter((b) => Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - COTE_DU_SIGNE.aFaire) < 1e-4 && Math.abs(a[0] - b[0]) < 1e-6)
      .map((b) => [a, b]),
  );
  const devant = verticales.filter(([a, b]) => Math.abs(a[0]) < 1e-6 && Math.min(a[1], b[1]) < -bas + 1e-6);
  expect(devant).toHaveLength(1);
  expect(Math.min(devant[0][0][2], devant[0][1][2])).toBeLessThan(0);
  expect(verticales.filter(([a]) => Math.abs(a[0]) > 1e-3)).toHaveLength(2);
  // Grossi de loin, il monte d'autant : son bas ne descend jamais.
  expect(centreDuSigneGrossi('aFaire', 10, 1)).toBe(10);
  expect(centreDuSigneGrossi('aFaire', 10, 3) - 3 * bas).toBeCloseTo(10 - bas, 9);
  expect(centreDuSigneGrossi('lieu', 10, 2) - 2 * basDuSigne('lieu')).toBeCloseTo(10 - COTE_DU_SIGNE.lieu / 2, 9);
});

it('le Golem de roche (Gardien de l’île des lettres) : son losange à 1,2 bloc au-dessus de son cube le plus haut, dans le monde', () => {
  const ile = 'french-6e-letter-confusion' as const;
  // Son île ouverte (le sentier depuis la Forêt) : il attend sur son îlot.
  const golem = guardianPlacements('6e', {}, ['french-6e-phonology-french-6e-letter-confusion'], true).find((g) => g.id === ile)!;
  expect(golem.beaten).toBe(false);
  // Tous ses cubes, la tête et l'œil d'or compris : le plus haut est le dessus de sa tête.
  const haut = Math.max(...golem.cubes.map((c) => c.z));
  expect(haut).toBe(Math.max(...gardienDuMonde(ile).map((c) => c.z)));
  const [s] = signesDesObjets({ cubes: [], creatures: [{ ...golem, beaten: false }] });
  expect(s.objet).toEqual({ genre: 'gardien', id: ile });
  expect(s.z).toBeCloseTo(golem.origin.z + haut + 1 + SIGNE.auDessus, 9);
  // Sa pointe, même en bas de son flottement, reste au-dessus de sa tête.
  expect(s.z - basDuSigne('aFaire') - SIGNE.flotte.amplitude).toBeGreaterThan(golem.origin.z + haut + 1 + 0.3);
});

it('la clé d’un objet : une par objet', () => {
  expect(cleDeLObjet({ genre: 'borne', id: 'a:b' })).toBe('borne:a:b');
  expect(cleDeLObjet({ genre: 'navire', port: 'french-6e-phonology' })).toBe('navire');
  expect(cleDeLObjet({ genre: 'lieu', id: 'school', ile: 'french-6e-phonology' })).toBe('lieu:school');
});

describe('zoneRetenue : la zone de toucher de 48 pixels', () => {
  it('une zone fait au moins 48 × 48 pixels autour de son centre', () => {
    expect(zoneDeToucher(100, 100, 110, 104, 20)).toEqual({ x: 105, y: 102, w: 48, h: 48, distance: 20 });
    expect(zoneDeToucher(0, 0, 100, 60, 5)).toEqual({ x: 50, y: 30, w: 100, h: 60, distance: 5 });
  });

  it('le doigt hors de toute zone : rien', () => {
    expect(zoneRetenue([zoneDeToucher(100, 100, 110, 110, 20)], { x: 200, y: 200 }, null)).toBe(-1);
    expect(zoneRetenue([], { x: 0, y: 0 }, null)).toBe(-1);
  });

  it('le doigt à côté d’un petit objet, dans sa zone élargie : l’objet', () => {
    expect(zoneRetenue([zoneDeToucher(100, 100, 110, 110, 20)], { x: 125, y: 90 }, null)).toBe(0);
  });

  it('deux zones qui se chevauchent : le centre le plus proche du doigt, puis l’objet le plus proche de la caméra', () => {
    const a = zoneDeToucher(100, 100, 110, 110, 20);
    const b = zoneDeToucher(120, 100, 130, 110, 10);
    expect(zoneRetenue([a, b], { x: 108, y: 105 }, null)).toBe(0);
    expect(zoneRetenue([a, b], { x: 122, y: 105 }, null)).toBe(1);
    // À égale distance des deux centres : le plus proche de la caméra.
    expect(zoneRetenue([a, b], { x: 115, y: 105 }, null)).toBe(1);
    expect(zoneRetenue([b, a], { x: 115, y: 105 }, null)).toBe(0);
  });

  it('un objet caché derrière le sol touché, nettement plus proche que lui : écarté', () => {
    const z = zoneDeToucher(100, 100, 110, 110, 30);
    expect(zoneRetenue([z], { x: 105, y: 105 }, 10)).toBe(-1);
    // Le sol juste devant l'objet (son pied) ne le cache pas.
    expect(zoneRetenue([z], { x: 105, y: 105 }, 29)).toBe(0);
    expect(zoneRetenue([z], { x: 105, y: 105 }, 40)).toBe(0);
  });
});

describe('zoneDuToucher : la priorité du toucher (direct, puis zone, sinon rien ; une face jamais remplacée)', () => {
  // Une école de 6 × 4 cases (x de 10 à 16, y de 20 à 24), son signe projeté autour de (200, 100), à 30 blocs.
  const ecole: ZoneDObjet = { ...zoneDeToucher(195, 95, 205, 105, 30), boite: { min: { x: 10, y: 20, z: 3 }, max: { x: 16, y: 24, z: 9 } } };
  const doigt = { x: 210, y: 110 };

  it('un toucher sur une face en chantier, dans la zone : la pose du bloc, pas l’objet', () => {
    expect(zoneDuToucher({ genre: 'face' }, [ecole], doigt)).toBe(-1);
  });

  it('un objet touché directement garde la main', () => {
    expect(zoneDuToucher({ genre: 'objet' }, [ecole], doigt)).toBe(-1);
  });

  it('le sol à deux cases de l’école ne la retient pas ; une case voisine, oui', () => {
    expect(zoneDuToucher({ genre: 'sol', case: { x: 18, y: 21 }, distance: 31 }, [ecole], doigt)).toBe(-1);
    expect(zoneDuToucher({ genre: 'sol', case: { x: 17, y: 21 }, distance: 31 }, [ecole], doigt)).toBe(-1);
    expect(zoneDuToucher({ genre: 'sol', case: { x: 16, y: 21 }, distance: 31 }, [ecole], doigt)).toBe(0);
    // Le sol tout près, mais nettement devant l'objet : il le cache.
    expect(zoneDuToucher({ genre: 'sol', case: { x: 16, y: 21 }, distance: 12 }, [ecole], doigt)).toBe(-1);
    expect(ecartALaBoite({ x: 16, y: 24 }, ecole.boite)).toBe(0);
    expect(ecartALaBoite({ x: 8, y: 22 }, ecole.boite)).toBe(1);
  });

  it('un toucher dans le vide près d’un signe le retient ; loin, rien ; un objet au centre caché, écarté', () => {
    expect(zoneDuToucher(null, [ecole], doigt)).toBe(0);
    expect(zoneDuToucher(null, [ecole], { x: 300, y: 300 })).toBe(-1);
    expect(zoneDuToucher(null, [ecole], doigt, () => true)).toBe(-1);
  });

  it('deux zones voisines : la plus proche du doigt', () => {
    const borne: ZoneDObjet = { ...zoneDeToucher(225, 100, 235, 110, 30), boite: { min: { x: 20, y: 20, z: 3 }, max: { x: 21, y: 21, z: 5 } } };
    expect(zoneDuToucher(null, [ecole, borne], { x: 212, y: 104 })).toBe(0);
    expect(zoneDuToucher(null, [ecole, borne], { x: 220, y: 104 })).toBe(1);
  });
});

it('borneDe : l’île et la mission d’une borne, seulement pour une île du jeu', () => {
  expect(borneDe('french-6e-phonology:sons')).toEqual({ ile: 'french-6e-phonology', mission: 'sons' });
  expect(borneDe('volcan:a')).toBeNull();
  expect(borneDe('sans-mission')).toBeNull();
});

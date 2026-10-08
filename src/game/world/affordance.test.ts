import { BIOMES, BLOCKS, type BlockId } from '../biomes';
import { EMPTY_STATE, type GameState } from '../engine';
import {
  BULLE,
  bullesMontrees,
  bullesPossibles,
  centreDeLObjet,
  cleDeLaCreature,
  cleDeLObjet,
  COUT_DES_BULLES,
  flottementDeLaBulle,
  hauteurDuSigneDeLObjet,
  imageDeLaDestination,
  iconeDeLObjet,
  rebondDeLaBulle,
  sautDuSigne,
  SIGNE,
  signesDesObjets,
  sommetDe,
  sommetsDesBornes,
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
import { etatsDesObjets, modeleDuMonde } from './model';
import { creaturePlacements, gardienDuMonde, guardianPlacements, islandCenter, vehiclePlacement, worldCubes } from './terrain';
import { textesDe } from '../../universes';
import { GESTE_DU_SIGNE, hauteurDuSigne } from './sign';
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

it('au début du jeu : chaque borne à faire de l’île ouverte, rien sur les îles fermées, l’école et la salle des trophées en lieux', () => {
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
  // Le navire, sans bloc à poser ni départ possible : pas encore ; aucun Gardien n'attend.
  expect(signes.find((s) => s.objet.genre === 'navire')?.etat).toBe('pasEncore');
  expect(signes.some((s) => s.objet.genre === 'gardien')).toBe(false);
});

it('une chose n’est jamais comptée deux fois', () => {
  for (const state of [EMPTY_STATE, fini()])
    for (const a of ['6e', '5e', '4e', '3e'] as const) {
      const cles = signesDe(state, a).map((s) => s.cle);
      expect(new Set(cles).size, a).toBe(cles.length);
    }
});

it('tout construit : rien sur les bornes réussies (leurs étoiles), les Gardiens vaincus, les ouvrages construits ; l’école, la salle des trophées et les monuments bâtis en lieux', () => {
  const signes = signesDe(fini(), '6e');
  expect(signes.filter((s) => ['borne', 'gardien', 'ouvrage'].includes(s.objet.genre))).toEqual([]);
  const lieux = signes.filter((s) => s.objet.genre === 'lieu');
  expect(lieux.length).toBeGreaterThan(2);
  expect(lieux.every((s) => s.etat === 'lieu')).toBe(true);
});

it('une borne pas jouable est « pas encore », une jouée sans étoile « à faire » ; un Gardien prêt à faire, pas prêt pas encore ; un vaincu rien', () => {
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

it('la hauteur : la pointe de la bulle 0,4 bloc au-dessus du sommet de l’objet (le plus haut z de ses cubes, + 1)', () => {
  expect(sommetDe([{ z: 2 }, { z: 5 }, { z: 3 }])).toBe(6);
  expect(hauteurDuSigneDeLObjet([{ z: 2 }, { z: 5 }])).toBeCloseTo(6.4, 9);
  expect(hauteurDuSigneDeLObjet([{ z: 0 }], 3)).toBeCloseTo(4.4, 9);
  // Une borne : son socle et son ardoise sur le sol de sa case ; la bulle 0,4 au-dessus de l'ardoise.
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

it('un chantier en fantôme : un seul objet par ouvrage ou par monument, à faire si l’élève a les blocs, sinon pas encore', () => {
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
  // Vue de chacune de ses îles, sa bulle va à son bout de ce côté : plus près du cœur de cette île que de l'autre.
  const [de, vers] = pret!.iles;
  const pres = (p: { x: number; y: number }, ile: typeof de) => Math.hypot(p.x - islandCenter(ile).x, p.y - islandCenter(ile).y);
  expect(pres(pret!.parIle![de]!, de)).toBeLessThan(pres(pret!.parIle![vers]!, de));
  expect(pres(pret!.parIle![vers]!, vers)).toBeLessThan(pres(pret!.parIle![de]!, vers));
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

it('la bulle mise en avant monte et descend de ± 2 pixels en 2,4 s ; touchée, une bulle s’écrase puis rebondit, une seule fois', () => {
  expect(flottementDeLaBulle(0)).toBeCloseTo(0, 9);
  expect(flottementDeLaBulle(0.6)).toBeCloseTo(BULLE.flotte.amplitudePx, 9);
  expect(flottementDeLaBulle(1.8)).toBeCloseTo(-BULLE.flotte.amplitudePx, 9);
  expect(flottementDeLaBulle(3)).toBeCloseTo(flottementDeLaBulle(0.6), 9);
  // Le rebond : 1 avant et après ; 90 % à 80 ms ; jamais plus de 105 % ; reposée à 260 ms.
  expect(rebondDeLaBulle(0)).toBe(1);
  expect(rebondDeLaBulle(-5)).toBe(1);
  expect(rebondDeLaBulle(80)).toBeCloseTo(0.9, 9);
  expect(rebondDeLaBulle(170)).toBeCloseTo(1.05, 9);
  expect(rebondDeLaBulle(260)).toBe(1);
  let plusPetite = 1;
  let plusGrande = 1;
  let avant = 1;
  let changements = 0;
  for (let ms = 1; ms < 260; ms++) {
    const e = rebondDeLaBulle(ms);
    plusPetite = Math.min(plusPetite, e);
    plusGrande = Math.max(plusGrande, e);
    // Elle descend, remonte, redescend : deux changements de sens, pas d'oscillation.
    if (ms > 1 && Math.sign(e - avant) !== 0 && Math.sign(e - avant) !== Math.sign(avant - rebondDeLaBulle(ms - 2))) changements++;
    avant = e;
  }
  expect(plusPetite).toBeCloseTo(BULLE.rebond.ecrase, 3);
  expect(plusGrande).toBeLessThanOrEqual(BULLE.rebond.deborde + 1e-9);
  expect(changements).toBeLessThanOrEqual(2);
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

describe('les bulles (proposition P2, 4 octobre 2026)', () => {
  const FORET = 'french-6e-phonology' as const;
  const MINE = 'french-6e-letter-confusion' as const;
  const objet = (o: SigneDObjet['objet'], etat: SigneDObjet['etat'], ile: typeof FORET | typeof MINE): SigneDObjet => ({
    cle: cleDeLObjet(o),
    objet: o,
    etat,
    x: 0,
    y: 0,
    z: 1,
    iles: [ile],
    boite: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
  });
  const OBJETS = [
    objet({ genre: 'borne', id: `${FORET}:a` }, 'aFaire', FORET),
    objet({ genre: 'borne', id: `${FORET}:b` }, 'aFaire', FORET),
    objet({ genre: 'borne', id: `${FORET}:c` }, 'pasEncore', FORET),
    objet({ genre: 'lieu', id: 'school', ile: FORET }, 'lieu', FORET),
    objet({ genre: 'ouvrage', id: 'pont' }, 'aFaire', FORET),
    objet({ genre: 'gardien', id: FORET }, 'aFaire', FORET),
    objet({ genre: 'borne', id: `${MINE}:a` }, 'aFaire', MINE),
  ];

  it('seul ce qu’on peut faire maintenant en porte une, avec l’icône de ce qu’on y fait ; une créature, son bloc ou sa notion', () => {
    const possibles = bullesPossibles(OBJETS, [
      { id: FORET, icone: 'blocks', bloc: 'grass' as BlockId },
      { id: MINE, icone: 'pickaxe' },
    ]);
    // Ni « pas encore », ni un lieu.
    expect(possibles.map((b) => b.cle)).toEqual([`borne:${FORET}:a`, `borne:${FORET}:b`, 'ouvrage:pont', `gardien:${FORET}`, `borne:${MINE}:a`, cleDeLaCreature(FORET), cleDeLaCreature(MINE)]);
    expect(possibles[0].image).toEqual({ icone: 'star' });
    expect(possibles[2].image).toEqual({ icone: 'hammer' });
    expect(possibles[3].image).toEqual({ icone: 'flame' });
    expect(possibles[5]).toMatchObject({ cible: { genre: 'creature', id: FORET }, image: { bloc: 'grass' } });
    expect(possibles[6].image).toEqual({ icone: 'pickaxe' });
    expect(iconeDeLObjet({ genre: 'navire', port: FORET })).toBe('ship');
    expect(iconeDeLObjet({ genre: 'lieu', id: 'monument:x', ile: FORET })).toBe('hammer');
  });

  it('trois au plus, sur l’île où l’on est seulement : une commande d’abord, puis les bornes ; sans prochaine ici, aucune mise en avant', () => {
    const possibles = bullesPossibles(OBJETS, [{ id: FORET, icone: 'blocks', bloc: 'grass' as BlockId }]);
    const ici = bullesMontrees(possibles, FORET, null);
    expect(ici.map((b) => b.bulle.cle)).toEqual([cleDeLaCreature(FORET), `borne:${FORET}:a`, `borne:${FORET}:b`]);
    expect(ici.map((b) => b.enAvant)).toEqual([false, false, false]);
    // La commande est la prochaine destination : elle est mise en avant.
    expect(bullesMontrees(possibles, FORET, cleDeLaCreature(FORET)).map((b) => b.enAvant)).toEqual([true, false, false]);
    expect(BULLE.max).toBe(3);
    // Sur la Mine : sa seule borne à faire. Sans île (le bonhomme nulle part) : rien.
    expect(bullesMontrees(possibles, MINE, null).map((b) => b.bulle.cle)).toEqual([`borne:${MINE}:a`]);
    expect(bullesMontrees(possibles, null, null)).toEqual([]);
  });

  it('la prochaine chose à faire passe devant et est mise en avant, quand elle est sur l’île ; ailleurs, aucune bulle d’or', () => {
    const possibles = bullesPossibles(OBJETS, []);
    const ici = bullesMontrees(possibles, FORET, 'ouvrage:pont');
    expect(ici[0]).toMatchObject({ bulle: { cle: 'ouvrage:pont' }, enAvant: true });
    expect(ici).toHaveLength(3);
    const ailleurs = bullesMontrees(possibles, FORET, `borne:${MINE}:a`);
    expect(ailleurs.map((b) => b.bulle.cle)).toEqual(bullesMontrees(possibles, FORET, null).map((b) => b.bulle.cle));
    expect(ailleurs.some((b) => b.enAvant)).toBe(false);
  });

  it('leur taille : 56 pixels, 64 pour la mise en avant ; trois quadrilatères au plus, en un appel de dessin', () => {
    expect([BULLE.px, BULLE.prochainePx]).toEqual([56, 64]);
    expect(COUT_DES_BULLES).toEqual({ triangles: 6, drawCalls: 1 });
  });
});

it('le Golem de roche (Gardien de l’île des lettres) : sa bulle au-dessus de son cube le plus haut, dans le monde', () => {
  const ile = 'french-6e-letter-confusion' as const;
  // Son île ouverte (le pont depuis la Forêt) : il attend sur son île.
  const golem = guardianPlacements('6e', {}, ['french-6e-phonology-french-6e-letter-confusion'], true).find((g) => g.id === ile)!;
  expect(golem.beaten).toBe(false);
  // Tous ses cubes, la tête et l'œil d'or compris : le plus haut est le dessus de sa tête.
  const haut = Math.max(...golem.cubes.map((c) => c.z));
  expect(haut).toBe(Math.max(...gardienDuMonde(ile).map((c) => c.z)));
  const [s] = signesDesObjets({ cubes: [], creatures: [{ ...golem, beaten: false }] });
  expect(s.objet).toEqual({ genre: 'gardien', id: ile });
  expect(s.z).toBeCloseTo(golem.origin.z + haut + 1 + SIGNE.auDessus, 9);
  // La pointe de sa bulle reste au-dessus de sa tête.
  expect(s.z).toBeGreaterThan(golem.origin.z + haut + 1 + 0.3);
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

it('le centre de l’objet d’une fiche (lot 2 de « Toucher le monde ») : dans ses cubes, ou le cœur d’une île', () => {
  const a: ArchipelagoId = '6e';
  const cubes = worldCubes(a, EMPTY_STATE.progress, EMPTY_STATE.world, false);
  const creatures = [...creaturePlacements(a, EMPTY_STATE.world.links), ...guardianPlacements(a, EMPTY_STATE.progress, EMPTY_STATE.world.links)];
  const vehicle = vehiclePlacement(a, EMPTY_STATE.progress, EMPTY_STATE.world);
  const entree = { cubes, creatures, vehicle };
  const borne = signesDe(EMPTY_STATE, a).find((x) => x.objet.genre === 'borne')!;
  const c = centreDeLObjet(borne.objet, entree)!;
  // Le centre de la borne, sous son signe.
  expect(c.x).toBeCloseTo(borne.x, 0);
  expect(c.y).toBeCloseTo(borne.y, 0);
  expect(c.z).toBeLessThan(borne.z);
  // La créature de la Forêt, à sa place ; le navire au port ; une île, par la fonction donnée ; un inconnu : rien.
  expect(centreDeLObjet({ genre: 'creature', id: 'french-6e-phonology' }, entree)).not.toBeNull();
  expect(centreDeLObjet({ genre: 'navire', port: vehicle.port }, entree)).not.toBeNull();
  expect(centreDeLObjet({ genre: 'ile', id: 'french-6e-letter-confusion' }, { ...entree, ile: () => ({ x: 1, y: 2, z: 3 }) })).toEqual({ x: 1, y: 2, z: 3 });
  expect(centreDeLObjet({ genre: 'ouvrage', id: 'inconnu' }, entree)).toBeNull();
});

it('sur la Carte, la bulle d\'or de la destination porte l\'image de ce qu\'on y fait (piste B)', () => {
  expect(imageDeLaDestination({ commande: 'c', ouvrage: 'o' }, { navire: false, bloc: 'wood' as BlockId })).toEqual({ bloc: 'wood' });
  expect(imageDeLaDestination({ ouvrage: 'o' }, { navire: false })).toEqual({ icone: 'ouvrage' });
  expect(imageDeLaDestination({}, { navire: true })).toEqual({ icone: 'ship' });
  expect(imageDeLaDestination({}, { navire: false })).toEqual({ icone: 'star' });
  // Une commande dont le bloc n'est pas connu : l'image de ce qu'on fait sinon.
  expect(imageDeLaDestination({ commande: 'c' }, { navire: false })).toEqual({ icone: 'star' });
});

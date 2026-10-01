// La salle des trophées qui s'agrandit (GD-3, option B, décidée le 1er octobre 2026) : plus aucun trophée sur le toit,
// une travée de 2 × 3 cases tous les six succès après les douze premiers, jusqu'à 8 × 3, dans une emprise réservée dès
// le départ, en sol nu.
import { BADGES } from '../../core/progress';
import { trophyBlock } from '../trophies';
import type { BlockId } from '../biomes';
import { BIOMES } from '../biomes';
import { ARCHIPELAGOS } from './archipelago';
import { toutConstruit } from './budget';
import { islandDef } from './map';
import { COLONNES_DES_PILIERS, EMPRISE_DE_LA_SALLE, PLACES_DE_LA_SALLE, PLACES_PAR_TRAVEE, SALLE_DE_DEPART, TRAVEES_AU_PLUS, traveesPour } from './salle';
import { CREATURE_CUBES } from './personnages/creatures';
import { GUARDIAN_CUBES } from './personnages/gardiens';
import { creatureDuMonde, creatureSpot, gardienDuMonde, QUARTS_DE_TOUR_DE_LA_CREATURE, groundHeight, origineDe, placeDoor, placeSpot, TROPHY_AT, TROPHY_SIZE, TROPHY_SLOTS, trophyModel, VILLAGE_PLACES, worldCubes } from './terrain';

const TOUS: BlockId[] = BADGES.map((b) => trophyBlock(b.id));
const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
/** Les colonnes bâties de la salle (relatives au coin de l'emprise) avec `n` trophées. */
const colonnes = (n: number) => [...new Set(trophyModel(TOUS.slice(0, n)).map((c) => c.x))].sort((a, b) => a - b);
/** Une case de l'emprise réservée (relative au cœur) ? */
const dansLEmprise = (x: number, y: number) => x >= TROPHY_AT.x && x < TROPHY_AT.x + TROPHY_SIZE.w && y >= TROPHY_AT.y && y < TROPHY_AT.y + TROPHY_SIZE.d;

describe('La salle des trophées (GD-3)', () => {
  it('chaque succès de BADGES a sa place, sous le toit : aucun n’est coupé de la liste', () => {
    expect(TROPHY_SLOTS.length).toBe(PLACES_DE_LA_SALLE + TRAVEES_AU_PLUS * PLACES_PAR_TRAVEE);
    expect(BADGES.length).toBeLessThanOrEqual(TROPHY_SLOTS.length);
    const salle = trophyModel(TOUS);
    const trophees = salle.filter((c) => TROPHY_SLOTS.some((t) => cle(t) === cle(c)));
    expect(trophees.length).toBe(BADGES.length);
    // Dans l'ordre de la liste des succès.
    expect(TROPHY_SLOTS.slice(0, BADGES.length).map((t) => salle.find((c) => cle(c) === cle(t))?.block)).toEqual(TOUS);
    // Toutes sous le toit (z = 4), jamais dessus ; une place ne remplace jamais un cube de la salle.
    expect(TROPHY_SLOTS.every((t) => t.z === 2 || t.z === 3)).toBe(true);
    expect(new Set(TROPHY_SLOTS.map(cle)).size).toBe(TROPHY_SLOTS.length);
    const vide = new Set(trophyModel(TOUS.map(() => 'or')).filter((c) => !TROPHY_SLOTS.some((t) => cle(t) === cle(c))).map(cle));
    for (const t of TROPHY_SLOTS) expect(vide.has(cle(t))).toBe(false);
    // Chaque trophée est posé sur un socle de marbre ou sur le trophée du dessous.
    const parCase = new Map(salle.map((c) => [cle(c), c]));
    for (const t of TROPHY_SLOTS) expect(parCase.get(cle({ ...t, z: t.z - 1 })), cle(t)).toBeDefined();
    // Rien au-dessus du toit que le faîte d'or.
    expect(salle.filter((c) => c.z >= 5).every((c) => c.block === 'or' && c.z === 5 && c.y === 1)).toBe(true);
  });

  it('la salle de départ et ses six premières places ne bougent pas ; les places 7 à 12 sont le second rang', () => {
    // Relatives au cœur : la salle de départ de x = 4 à 7 (comme avant GD-3), sa porte en (6, 7).
    expect(TROPHY_AT.x + SALLE_DE_DEPART.x).toBe(4);
    expect(TROPHY_AT.y).toBe(8);
    const avant = [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
      [0, 1],
      [3, 1],
    ];
    const abs = (t: { x: number; y: number; z: number }) => [TROPHY_AT.x + t.x, TROPHY_AT.y + t.y, t.z];
    expect(TROPHY_SLOTS.slice(0, 6).map(abs)).toEqual(avant.map(([x, y]) => [4 + x, 8 + y, 2]));
    expect(TROPHY_SLOTS.slice(6, 12).map(abs)).toEqual(avant.map(([x, y]) => [4 + x, 8 + y, 3]));
    for (const a of ARCHIPELAGOS) {
      const o = origineDe(a.school);
      const porte = placeDoor('trophees', a.school)!;
      expect([porte.x - o.x, porte.y - o.y], a.school).toEqual([6, 7]);
    }
  });

  it('une travée tous les six succès après les douze premiers, vers la gauche, jusqu’à 8 × 3 ; elle ne disparaît jamais', () => {
    expect([0, 6, 12, 13, 18, 19, 24].map(traveesPour)).toEqual([0, 0, 0, 1, 1, 2, 2]);
    expect(colonnes(0)).toEqual([4, 5, 6, 7]);
    expect(colonnes(12)).toEqual([4, 5, 6, 7]);
    expect(colonnes(13)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(colonnes(18)).toEqual([2, 3, 4, 5, 6, 7]);
    expect(colonnes(19)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(colonnes(24)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(Math.max(...colonnes(24)) + 1).toBe(EMPRISE_DE_LA_SALLE.w);
    // D'un succès au suivant, rien ne se retire, rien ne change de matière : la salle ne fait que gagner des cubes.
    for (let n = 0; n < BADGES.length; n++) {
      const suivante = new Map(trophyModel(TOUS.slice(0, n + 1)).map((c) => [cle(c), c.block]));
      for (const c of trophyModel(TOUS.slice(0, n))) expect(suivante.get(cle(c)), `${n} → ${n + 1} : ${cle(c)}`).toBe(c.block);
    }
  });

  it('une travée : en cubes entiers, dans les matières d’avant, ses piliers, son fond de velours, trois socles, son toit et son faîte d’or au même rang', () => {
    const avant = new Set(trophyModel(TOUS.slice(0, 12)).map(cle));
    const travee = trophyModel(TOUS.slice(0, 12)).length;
    const apres = trophyModel(TOUS.slice(0, 13));
    const neufs = apres.filter((c) => !avant.has(cle(c)));
    expect(apres.length - travee).toBe(neufs.length);
    expect(new Set(neufs.map((c) => c.x))).toEqual(new Set([2, 3]));
    // Les matières de la salle de départ, et le treizième trophée.
    expect(new Set(neufs.filter((c) => !(c.z === 2 && c.x === 3 && c.y === 0)).map((c) => c.block))).toEqual(new Set(['marbre', 'velours', 'taille', 'or']));
    // Deux piliers (devant et au fond, au bord gauche), un fond de velours, trois socles, un pan de toit de 2 × 3, le faîte.
    const de = (x: number, y: number) => neufs.filter((c) => c.x === x && c.y === y);
    expect(de(2, 0).map((c) => `${c.z}${c.block}`)).toEqual(['1marbre', '2marbre', '3marbre', '4taille']);
    expect(de(2, 2).map((c) => `${c.z}${c.block}`)).toEqual(['1marbre', '2marbre', '3marbre', '4taille']);
    expect(de(3, 2).map((c) => `${c.z}${c.block}`)).toEqual(['1velours', '2velours', '3velours', '4taille']);
    expect(neufs.filter((c) => c.z === 1 && c.block === 'marbre' && c.y < 2 && !(c.x === 2 && c.y === 0)).length).toBe(3);
    expect(neufs.filter((c) => c.z === 5).map((c) => `${c.x},${c.y}:${c.block}`).sort()).toEqual(['2,1:or', '3,1:or']);
    // Les piliers, lus par colonne.
    expect(COLONNES_DES_PILIERS).toEqual([7, 4, 2, 0]);
  });

  it('l’emprise de 8 × 3 est réservée dès le départ, en sol nu : sans dalle, sans marque, sans décor, ni créature, ni cible au toucher', () => {
    const { progress, village } = toutConstruit();
    for (const a of ARCHIPELAGOS) {
      const id = a.school;
      const index = BIOMES.findIndex((b) => b.id === id);
      const o = origineDe(id);
      // Plat : la salle ne monte ni ne descend quand elle s'allonge.
      const hauteurs = new Set<number>();
      for (let x = 0; x < TROPHY_SIZE.w; x++) for (let y = 0; y < TROPHY_SIZE.d; y++) hauteurs.add(groundHeight(index, TROPHY_AT.x + x, TROPHY_AT.y + y));
      expect([...hauteurs], id).toEqual([0]);
      expect(placeSpot('trophees', id)!.h).toBe(0);
      const cubes = worldCubes(a.classe, progress, village, true, []);
      const sol = islandDef(id).altitude;
      // Sur la place réservée (à gauche de la salle de départ) : rien au-dessus du sol de l'île.
      const dessus = cubes.filter((c) => !c.sol && c.z > sol && dansLEmprise(c.x - o.x, c.y - o.y) && c.x - o.x < TROPHY_AT.x + SALLE_DE_DEPART.x);
      expect(dessus, id).toEqual([]);
      // Ni la créature (avec ses pas) ni ses voisins n'y entrent.
      const spot = creatureSpot(id);
      for (const [sx, sy] of spot.steps) for (const c of creatureDuMonde(id)) expect(dansLEmprise(spot.x + sx + c.x, spot.y + sy + c.y), `${id} créature`).toBe(false);
    }
  });

  it('chaque porte de lieu (école, salle, lieu où l’on assemble, et tout lieu du village) est hors de l’emprise réservée, la créature ne se tient jamais devant, et aucun autre lieu n’empiète sur l’emprise', () => {
    expect(Object.keys(VILLAGE_PLACES).sort()).toEqual(['assemblage', 'ecole', 'trophees']);
    for (const [place, { at, door, size }] of Object.entries(VILLAGE_PLACES)) {
      expect(dansLEmprise(at.x + door, at.y - 1), place).toBe(false);
      expect(door >= 0 && door < size.w, place).toBe(true);
      // Les autres lieux (l'école, le lieu où l'on assemble) n'empiètent jamais sur l'emprise.
      if (place !== 'trophees') for (let x = 0; x < size.w; x++) for (let y = 0; y < size.d; y++) expect(dansLEmprise(at.x + x, at.y + y), `${place} ${x},${y}`).toBe(false);
    }
    for (const a of ARCHIPELAGOS) {
      const o = origineDe(a.school);
      for (const place of Object.keys(VILLAGE_PLACES) as (keyof typeof VILLAGE_PLACES)[]) {
        const porte = placeDoor(place, a.school)!;
        expect(dansLEmprise(porte.x - o.x, porte.y - o.y), `${a.school} ${place}`).toBe(false);
        // La créature ne se tient pas devant une porte.
        const spot = creatureSpot(a.school);
        for (const [sx, sy] of spot.steps)
          for (const c of creatureDuMonde(a.school)) expect(`${spot.x + sx + c.x},${spot.y + sy + c.y}`, `${a.school} ${place}`).not.toBe(`${porte.x - o.x},${porte.y - o.y}`);
      }
    }
  });

  it('la travée arrive d’un coup : la salle ne se déduit que des succès gagnés, sans étape, sans fantôme, avec ou sans « Réduire les animations »', () => {
    const { progress, village } = toutConstruit();
    const salle = (n: number) => worldCubes('6e', progress, village, false, TOUS.slice(0, n)).filter((c) => c.place === 'trophees');
    const douze = salle(12);
    const treize = salle(13);
    expect(treize.some((c) => c.ghost)).toBe(false);
    // Le même résultat à chaque calcul : rien ne dépend du temps ni d'un réglage d'animation.
    expect(salle(13)).toEqual(treize);
    const o = origineDe('foret');
    const avant = new Set(douze.map(cle));
    expect(new Set(treize.filter((c) => !avant.has(cle(c))).map((c) => c.x - o.x))).toEqual(new Set([2, 3]));
  });

  it('au Marché des proportions, la créature tourne d’un quart pour tenir devant le cœur, hors de l’emprise ; son Gardien ne tourne pas', () => {
    expect(QUARTS_DE_TOUR_DE_LA_CREATURE).toEqual({ marche: 1 });
    expect(gardienDuMonde('marche')).toEqual(GUARDIAN_CUBES.marche);
    const tournee = creatureDuMonde('marche');
    const maxY = Math.max(...CREATURE_CUBES.marche.map((c) => c.y));
    expect(tournee).toEqual(CREATURE_CUBES.marche.map((c) => ({ ...c, x: maxY - c.y, y: c.x })));
    // Devant la salle (côté caméra), pas derrière elle.
    const spot = creatureSpot('marche');
    expect(spot.y + Math.max(...tournee.map((c) => c.y))).toBeLessThan(TROPHY_AT.y);
  });
});

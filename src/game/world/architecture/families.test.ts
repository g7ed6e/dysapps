// La table commune « matière → famille » (décision du mainteneur du 8 octobre 2026) : exhaustive, ses exceptions
// nommées, et ce qu'elle laisse en blocs au 6e.
import { TEXTURE_KINDS } from '../pixels';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { getMonument } from '../monuments';
import { rangerLeDecor } from '../decorMesh';
import { batimentsDe, blocsDArchipeoDe, caseDuLieu, coursDe, genresDesBlocs, sansToursDuCoeur } from '../construction';
import { estUnePlaceDeTrophee } from '../trophyHall';
import { BADGES } from '../../../core/progress';
import { trophyBlock } from '../../trophies';
import { architectureDe, CUBE_EXCEPTIONS, FAMILIES_TO_CONFIRM, familyOf, KITS, MATERIAL_FAMILIES, materialsOf } from '.';

describe('La table commune « matière → famille »', () => {
  it('chaque matière a une famille ou une exception nommée (sinon la CI échoue)', () => {
    const exceptions = new Set<string>(CUBE_EXCEPTIONS.flatMap((e) => (e.texture ? [e.texture] : [])));
    const sans = TEXTURE_KINDS.filter((t) => familyOf(t) === null && !exceptions.has(t));
    expect(sans).toEqual([]);
    // Rien de plus que les matières du jeu.
    expect(Object.keys(MATERIAL_FAMILIES).filter((t) => !(TEXTURE_KINDS as string[]).includes(t))).toEqual([]);
  });

  it('les exceptions sont nommées : le fantôme (A) et la pierre du fondu (B), proposés au mainteneur, puis ce qui a son modèle ; la barrière n’en est plus une', () => {
    expect(CUBE_EXCEPTIONS.map((e) => e.id)).toEqual(['fantome', 'pierre-du-fondu', 'borne']);
    for (const e of CUBE_EXCEPTIONS) {
      expect(e.what.length, e.id).toBeGreaterThan(0);
      expect(e.where.length, e.id).toBeGreaterThan(0);
      expect(e.status.length, e.id).toBeGreaterThan(0);
    }
  });

  it('les familles du directeur artistique (8 octobre 2026)', () => {
    const de = (...t: string[]) => t.map((x) => familyOf(x));
    expect(de('planches', 'terre', 'poutre', 'chaume')).toEqual(Array(4).fill('colombage'));
    expect(de('cabine', 'carton')).toEqual(Array(2).fill('bardage'));
    expect(de('pierre', 'galet', 'brique', 'obsidienne', 'sable', 'fossile', 'mosaique', 'taille', 'marbre', 'cadran', 'lentille')).toEqual(Array(11).fill('pierre'));
    expect(de('aimant')).toEqual(['metal']);
    expect(de('toit', 'tuile')).toEqual(['toit', 'toit']);
    expect(de('verre', 'lanterne')).toEqual(['verre', 'lanterne']);
    expect(de('porte', 'barriere', 'escalier')).toEqual(Array(3).fill('finition'));
    expect(de('tronc', 'feuilles', 'herbe', 'mousse', 'sapin')).toEqual(Array(5).fill('vegetal'));
    expect(de('toile', 'or', 'cristal', 'velours', 'eau')).toEqual(['toile', 'precieux', 'precieux', 'precieux', 'eau']);
    // Une couleur seule (sans matière) n'a pas de famille.
    expect(familyOf(undefined)).toBeNull();
    expect(familyOf('#ff0000')).toBeNull();
  });

  it('les matières rangées par analogie sont dans la table, une seule fois', () => {
    for (const t of FAMILIES_TO_CONFIRM) expect(familyOf(t), t).not.toBeNull();
    expect(new Set(FAMILIES_TO_CONFIRM).size).toBe(FAMILIES_TO_CONFIRM.length);
  });

  it('elle ne s’active qu’au 6e : les kits du 5e, du 4e et du 3e restent vides', () => {
    expect(KITS['6e'].matieres).toEqual(materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal']));
    for (const a of ['5e', '4e', '3e'] as const) expect(KITS[a].matieres, a).toEqual({});
  });

  it('au 6e, tout construit avec les commandes et les quêtes : aucune matière rangée par analogie, et ce qui reste en blocs est nommé', () => {
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    const cubes = worldCubes('6e', progress, village, false, [], false, 'halle');
    const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
    const restes = sansToursDuCoeur(reste).filter((c) => !c.quest);
    for (const c of restes) expect((FAMILIES_TO_CONFIRM as readonly string[]).includes(c.texture ?? ''), `${c.texture}`).toBe(false);
    const archi = architectureDe('6e', restes, { batiments: batimentsDe('6e'), cours: coursDe('6e'), toitures: blocsDArchipeoDe('6e'), caseDuLieu });
    const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
    const pris = new Set([...archi.remplacees, ...archi.peints.keys()]);
    const batiments = batimentsDe('6e');
    const cours = coursDe('6e');
    // Dans les bâtiments, leurs cours, les monuments et les petites constructions, un bloc posé d'une famille que le kit
    // dessine (colombage, bardage, pierre, finition, métal) est pris (la barrière aussi, depuis le 9 octobre 2026).
    const exceptions = new Set<string>(CUBE_EXCEPTIONS.flatMap((e) => (e.texture ? [e.texture] : [])));
    const restent = new Map<string, number>();
    for (const c of restes) {
      if (c.ghost || c.place === 'school' || c.place === 'trophies' || c.place === 'assembly') continue;
      const k = cle(c);
      const dansUnPlan = batiments.has(k) || cours.has(k) || c.petiteConstruction || (c.place?.startsWith('monument:') && getMonument(c.place.slice(9)) !== undefined);
      if (!dansUnPlan || pris.has(k) || exceptions.has(c.texture ?? '')) continue;
      const f = familyOf(c.texture);
      if (f === 'colombage' || f === 'bardage' || f === 'pierre' || f === 'finition' || f === 'metal') restent.set(`${c.texture}`, (restent.get(`${c.texture}`) ?? 0) + 1);
    }
    expect(Object.fromEntries(restent)).toEqual({});
  }, 60_000);

  /**
   * Ce qui reste en blocs taillés au 6e, hors exceptions nommées, matière par origine. Le lot du 9 octobre 2026 (« eau,
   * quai, liaisons, cœur, barrière ») l'a vidé : le décor du cœur, les tabliers des liaisons et de la jetée, l'eau de la
   * Mine, les toits cachés et plats, le verre hors d'un mur, les lieux du village et la barrière ont leur dessin
   * (./heart.ts, ./heartPieces.ts, `barriereDe`). Une paire qui apparaît fait échouer le test : elle se dessine, ou se
   * range ici avec sa raison.
   */
  const EN_ATTENTE: string[] = [];

  /** Ce que les lots du 9 octobre 2026 ont dessiné : rien de tout cela ne redevient un bloc taillé. */
  const TRAITEES = [
    // Le métal, le précieux posé par un lieu, les poteaux de bois des liaisons et de la jetée (#399).
    'aimant', 'velours', 'tronc@liaison', 'or@lieu:school', 'tronc@lieu',
    // Le décor du cœur, le quai et le Gardien.
    'brique@coeur', 'cabine@coeur', 'cadran@coeur', 'carton@coeur', 'chaume@coeur', 'feuilles@coeur', 'galet@coeur',
    'mosaique@coeur', 'mousse@coeur', 'obsidienne@coeur', 'or@coeur', 'pierre@coeur', 'planches@coeur', 'sable@coeur',
    'tronc@coeur', 'verre@coeur', 'couleur@coeur',
    // Les tabliers des liaisons, l'eau de la Mine, les toits cachés et plats, le verre hors d'un mur.
    'planches@liaison', 'eau@petite', 'toit@batiment', 'toit@petite', 'verre@batiment', 'verre@cour', 'verre@petite',
    // Les lieux du village.
    'brique@lieu:assembly', 'planches@lieu:assembly', 'poutre@lieu:assembly', 'toit@lieu:assembly', 'porte@lieu:school',
    'taille@lieu:school', 'toit@lieu:school', 'marbre@lieu:trophies', 'taille@lieu:trophies',
    // La barrière, d'où qu'elle vienne.
    'barriere',
  ];

  it('au 6e, tout construit, salle des trophées pleine : aucun cube de la construction hors sol, décor et exception nommée ne reste un bloc taillé, sauf ce qui attend sa pull request (nommé)', () => {
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    const trophees = BADGES.map((b) => trophyBlock(b.id));
    const cubes = worldCubes('6e', progress, village, false, trophees, false, 'halle');
    const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
    const restes = sansToursDuCoeur(reste).filter((c) => !c.quest && !c.decor);
    const batiments = batimentsDe('6e');
    const cours = coursDe('6e');
    const archi = architectureDe('6e', restes, { batiments, cours, toitures: blocsDArchipeoDe('6e'), caseDuLieu });
    const genres = genresDesBlocs(restes);
    const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
    const exceptions = new Set<string>(CUBE_EXCEPTIONS.flatMap((e) => (e.texture ? [e.texture] : [])));
    const tailles = new Set<string>();
    for (const c of restes) {
      // Le fantôme (exception A), ce qui s'allume (vitres, lanternes), ce que le kit peint ou dessine, et les trophées
      // (dessinés à part : lingot, cristal, ou boîte plus petite que leur case).
      if (c.ghost || genres.get(c) !== 'bloc' || archi.remplacees.has(cle(c)) || archi.peints.has(cle(c)) || exceptions.has(c.texture ?? '')) continue;
      const m = c.place === 'trophies' ? caseDuLieu(c) : null;
      if (m && estUnePlaceDeTrophee(m.x, m.y, m.z)) continue;
      const k = cle(c);
      const origine = c.bridge ? 'liaison' : c.place ? `lieu:${c.place}` : c.petiteConstruction ? 'petite' : batiments.has(k) ? 'batiment' : cours.has(k) ? 'cour' : 'coeur';
      tailles.add(`${c.texture ?? 'couleur'}@${origine}`);
    }
    expect([...tailles].sort()).toEqual(EN_ATTENTE);
    for (const t of tailles) expect(TRAITEES.some((x) => t.startsWith(x)), t).toBe(false);
  }, 60_000);
});

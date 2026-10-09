// La table commune « matière → famille » (décision du mainteneur du 8 octobre 2026) : exhaustive, ses exceptions
// nommées, et ce qu'elle laisse en blocs au 6e.
import { TEXTURE_KINDS } from '../pixels';
import { toutConstruitAvecLesCommandes } from '../budget';
import { worldCubes } from '../terrain';
import { getMonument } from '../monuments';
import { rangerLeDecor } from '../decorMesh';
import { batimentsDe, blocsDArchipeoDe, caseDuLieu, coursDe, genresDesBlocs, sansToursDuCoeur } from '../construction';
import { estUnePlaceDeTrophee } from '../trophyHall';
import { phareDuLarge } from '../offshoreLighthouse';
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
    // Le 5e (9 octobre 2026).
    expect(de('glace', 'dalle', 'strate', 'sel', 'tourbe')).toEqual(Array(5).fill('pierre'));
    // Le nuage en congères, tas bas : de la famille de la pierre (retouches du 9 octobre 2026).
    expect(familyOf('nuage')).toBe('pierre');
    expect(de('panneau', 'lambris', 'bambou')).toEqual(Array(3).fill('bardage'));
    expect(de('vitrail', 'enluminure', 'riziere')).toEqual(['verre', 'colombage', 'colombage']);
    // Une couleur seule (sans matière) n'a pas de famille.
    expect(familyOf(undefined)).toBeNull();
    expect(familyOf('#ff0000')).toBeNull();
  });

  it('les matières rangées par analogie sont dans la table, une seule fois ; celles du 5e n’y sont plus', () => {
    for (const t of FAMILIES_TO_CONFIRM) expect(familyOf(t), t).not.toBeNull();
    expect(new Set(FAMILIES_TO_CONFIRM).size).toBe(FAMILIES_TO_CONFIRM.length);
    for (const t of ['glace', 'dalle', 'strate', 'sel', 'tourbe', 'panneau', 'lambris', 'bambou', 'vitrail', 'enluminure', 'riziere', 'nuage'] as const) expect(FAMILIES_TO_CONFIRM, t).not.toContain(t);
  });

  it('elle s’active au 6e et au 5e : seuls le 4e et le 3e restent vides', () => {
    expect(KITS['6e'].matieres).toEqual(materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal']));
    expect(KITS['5e'].matieres).toEqual(materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']));
    for (const a of ['4e', '3e'] as const) expect(KITS[a].matieres, a).toEqual({});
  });


  for (const a of ['6e', '5e'] as const)
  it(`au ${a}, tout construit avec les commandes et les quêtes : aucune autre matière rangée par analogie, et ce qui reste en blocs est nommé`, () => {
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    const cubes = worldCubes(a, progress, village, false, [], false, 'halle');
    const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
    const restes = sansToursDuCoeur(reste).filter((c) => !c.quest);
    for (const c of restes) expect((FAMILIES_TO_CONFIRM as readonly string[]).includes(c.texture ?? ''), `${c.texture}`).toBe(false);
    const archi = architectureDe(a, restes, { batiments: batimentsDe(a), cours: coursDe(a), toitures: blocsDArchipeoDe(a), caseDuLieu });
    const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
    const pris = new Set([...archi.remplacees, ...archi.peints.keys()]);
    const batiments = batimentsDe(a);
    const cours = coursDe(a);
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
   * Ce qui reste en blocs taillés, hors exceptions nommées, matière par origine, archipel par archipel. Au 6e, le lot du
   * 9 octobre 2026 (« eau, quai, liaisons, cœur, barrière ») l'a vidé : le décor du cœur, les tabliers des liaisons et de
   * la jetée, l'eau de la Mine, les toits cachés et plats, le verre hors d'un mur, les lieux du village et la barrière ont
   * leur dessin (./heart.ts, ./heartPieces.ts, `barriereDe`). Au 5e, le lot du même jour (./kits/5e.ts) l'a vidé aussi.
   * Une paire qui apparaît fait échouer le test : elle se dessine, ou se range ici avec sa raison.
   */
  const EN_ATTENTE: Record<'6e' | '5e', string[]> = { '6e': [], '5e': [] };

  /** Ce que les lots du 9 octobre 2026 ont dessiné : rien de tout cela ne redevient un bloc taillé. */
  const TRAITEES: Record<'6e' | '5e', string[]> = {
    '6e': [
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
    ],
    '5e': [
      // Les murs : la toile tendue, la tuile en mur, la tourbe, l'enluminure et la rizière, le vitrail en verrière.
      'toile', 'tuile', 'tourbe', 'enluminure', 'riziere', 'vitrail', 'bambou',
      // Le décor du cœur : la glace, les congères, le sel, la strate, la dalle, le lambris, le panneau, l'escalier.
      'glace', 'nuage', 'sel', 'strate', 'dalle', 'lambris', 'panneau', 'escalier', 'verre@coeur', 'couleur@coeur', 'planches@coeur',
      // Les lieux du village.
      'brique@lieu:school', 'taille@lieu', 'marbre@lieu', 'toit@lieu', 'porte@lieu', 'or@lieu',
    ],
  };

  for (const a of ['6e', '5e'] as const)
    it(`au ${a}, tout construit, salle des trophées pleine : aucun cube de la construction hors sol, décor et exception nommée ne reste un bloc taillé, sauf ce qui attend sa pull request (nommé)`, () => {
      const { progress, world: village } = toutConstruitAvecLesCommandes();
      const trophees = BADGES.map((b) => trophyBlock(b.id));
      const cubes = worldCubes(a, progress, village, false, trophees, false, 'halle');
      const { reste } = rangerLeDecor(cubes.filter((c) => !c.sol));
      // Le phare du large fini (5e) laisse la place à son modèle (world/offshoreLighthouse.ts) : ses cubes ne sont pas dessinés.
      const large = phareDuLarge(reste).remplacees;
      const restes = sansToursDuCoeur(reste).filter((c) => !c.quest && !c.decor && !large.has(`${c.x},${c.y},${c.z}`));
      const batiments = batimentsDe(a);
      const cours = coursDe(a);
      const archi = architectureDe(a, restes, { batiments, cours, toitures: blocsDArchipeoDe(a), caseDuLieu });
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
      expect([...tailles].sort()).toEqual(EN_ATTENTE[a]);
      for (const t of tailles) expect(TRAITEES[a].some((x) => t.startsWith(x)), t).toBe(false);
    }, 60_000);
});

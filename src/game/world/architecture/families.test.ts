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
import { kitRempli } from './kits';
import { allumesALaFin } from '../construction/endGlow';

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

  it('les matières rangées par analogie sont dans la table, une seule fois ; ne restent à confirmer que le basalte et la lave, qu’aucun bloc ne pose', () => {
    for (const t of FAMILIES_TO_CONFIRM) expect(familyOf(t), t).not.toBeNull();
    expect(new Set(FAMILIES_TO_CONFIRM).size).toBe(FAMILIES_TO_CONFIRM.length);
    expect([...FAMILIES_TO_CONFIRM]).toEqual(['basalte', 'lave']);
    // Posées par aucun bloc, dans aucun archipel tout construit (salle pleine, commandes et quêtes) : ce sont des sols (le
    // volcan), jamais une construction.
    const { progress, world: village } = toutConstruitAvecLesCommandes();
    const trophees = BADGES.map((b) => trophyBlock(b.id));
    for (const a of ['6e', '5e', '4e', '3e'] as const)
      for (const c of worldCubes(a, progress, village, false, trophees, false, 'halle'))
        if (!c.sol && !c.decor) expect((FAMILIES_TO_CONFIRM as readonly string[]).includes(c.texture ?? ''), `${a} ${c.texture}`).toBe(false);
  }, 60_000);

  it('les familles du 4e et du 3e (10 octobre 2026) : confirmées, et changées pour le quartz, le prisme, le calque, la reliure et le pétale', () => {
    const de = (...t: string[]) => t.map((x) => familyOf(x));
    expect(de('ardoise', 'gres', 'savon', 'cire', 'pave', 'fresque', 'quartz', 'petale')).toEqual(Array(8).fill('pierre'));
    expect(de('osier', 'bardeau', 'liege', 'acajou')).toEqual(Array(4).fill('bardage'));
    expect(de('acier', 'rail', 'antenne', 'fonte', 'conteneur', 'ressort', 'engrenage', 'bobine', 'reliure')).toEqual(Array(9).fill('metal'));
    expect(de('miroir', 'prisme', 'calque')).toEqual(Array(3).fill('verre'));
    expect(de('parchemin', 'laurier', 'velours')).toEqual(['toile', 'vegetal', 'precieux']);
  });

  it('elle s’active partout : aucun kit vide', () => {
    expect(KITS['6e'].matieres).toEqual(materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal']));
    expect(KITS['5e'].matieres).toEqual(materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']));
    for (const a of ['4e', '3e'] as const) expect(KITS[a].matieres, a).toEqual({ ...materialsOf(['colombage', 'bardage', 'pierre', 'toit', 'finition', 'metal', 'verre', 'toile']), velours: 'precieux' });
    for (const a of ['6e', '5e', '4e', '3e'] as const) expect(kitRempli(KITS[a]), a).toBe(true);
  });


  for (const a of ['6e', '5e', '4e', '3e'] as const)
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
   * leur dessin (./heart.ts, ./heartPieces.ts, `barriereDe`). Au 5e, le lot du même jour (./kits/5e.ts) l'a vidé aussi ;
   * au 4e et au 3e, celui du 10 octobre 2026 (./kits/4e.ts, ./kits/3e.ts). Une paire qui apparaît fait échouer le test :
   * elle se dessine, ou se range ici avec sa raison. Les replis du 10 octobre 2026, qui ne sont pas des blocs taillés
   * (dessinés, mais pas encore comme l'intention le veut), sont nommés dans docs/univers/archipeo/cadrage.md (« Le 4e et
   * le 3e », « À reprendre plus tard ») : la colonne des solides lissée, sans modèle (un modèle demande un troisième chemin
   * dans la construction, après les deux phares : toucher, fenêtres, pièces du grand projet) ; le dôme de Stat en gradins
   * lissés (son plan de 5 sur 4 n'est pas carré, le pavillon n'a qu'une demi-largeur) ; le toit de prismes du temple
   * peint à plat (un anneau d'une rangée, sans pente à suivre).
   */
  const EN_ATTENTE: Record<'6e' | '5e' | '4e' | '3e', string[]> = { '6e': [], '5e': [], '4e': [], '3e': [] };

  /** Ce que les lots du 9 octobre 2026 ont dessiné : rien de tout cela ne redevient un bloc taillé. */
  const TRAITEES: Record<'6e' | '5e' | '4e' | '3e', string[]> = {
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
    '4e': [
      // Les murs : le velours (tenture ou volume uni), le pétale (enduit rose ou plate-bande), le calque en verrière.
      'velours', 'petale', 'calque',
      // Le décor du cœur : lingots et enclume, paroi d'ardoise, longue-vue, conteneurs, vasque, presse, fresque, maquette,
      // potager d'osier, parchemins, pavés, voie ferrée.
      'acier', 'ardoise', 'bobine', 'conteneur', 'eau', 'fonte', 'fresque', 'liege', 'osier', 'parchemin', 'pave', 'rail', 'couleur@coeur', 'planches@coeur',
      // Les lieux du village.
      'brique@lieu:school', 'taille@lieu', 'marbre@lieu', 'toit@lieu', 'porte@lieu', 'or@lieu', 'planches@lieu', 'pierre@lieu',
    ],
    '3e': [
      // Les murs : le quartz (le dôme de Stat), le prisme (la lanterne de Fi, le toit du temple), le miroir (le faîte).
      'quartz', 'prisme', 'miroir',
      // Le décor du cœur et le Bosquet : banc d'acajou, mât d'antenne, grès, laurier, lunette et lentille, triangle de
      // marbre, parchemin, reliures, tourelle de pierre de taille.
      'acajou', 'antenne', 'gres', 'laurier', 'lentille', 'marbre', 'parchemin', 'reliure', 'taille', 'couleur@coeur', 'planches@coeur',
      // Les lieux du village.
      'brique@lieu:school', 'toit@lieu', 'porte@lieu', 'or@lieu', 'planches@lieu', 'pierre@lieu',
    ],
  };

  for (const a of ['6e', '5e', '4e', '3e'] as const)
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
      // La lueur de fin d'un grand projet (../construction/endGlow.ts) : ses blocs sont dans les fenêtres, nommés.
      const allumes = allumesALaFin(restes);
      const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;
      const exceptions = new Set<string>(CUBE_EXCEPTIONS.flatMap((e) => (e.texture ? [e.texture] : [])));
      const tailles = new Set<string>();
      for (const c of restes) {
        // Le fantôme (exception A), ce qui s'allume (vitres, lanternes), ce que le kit peint ou dessine, et les trophées
        // (dessinés à part : lingot, cristal, ou boîte plus petite que leur case).
        if (c.ghost || allumes.has(c) || genres.get(c) !== 'bloc' || archi.remplacees.has(cle(c)) || archi.peints.has(cle(c)) || exceptions.has(c.texture ?? '')) continue;
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

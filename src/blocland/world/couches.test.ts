// Les couches du jeu (docs/conception/separation-jeu-rendu.md) : les règles ne dépendent ni de la grille ni du dessin ;
// la grille (la place des choses en cases) ne dépend pas du dessin ; le contrat commun des vues non plus. Les
// dépendances à contresens d'aujourd'hui sont listées avec leur motif et l'étape qui les retire : une nouvelle fait
// échouer le test, et une exception retirée du code doit l'être de la liste.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

type Couche = 'regle' | 'grille' | 'commun' | 'dessin' | 'neutre';

const SRC = join(__dirname, '..', '..');
const BLOCLAND = join(SRC, 'blocland');

/** Les règles du jeu : sans coordonnées du monde, sans React ni Three.js. */
const REGLES = [
  'engine',
  'boss',
  'bossCore',
  'trophies',
  'review',
  'arrivals',
  'biomes',
  'world/goals',
  'world/destination',
  'world/uses',
  'world/worksite',
  'world/whale',
  'world/villageStage',
  'world/islandState',
  'world/archipelago',
  'world/vehicle',
  'world/voyage',
  'world/archipels',
  'world/plans',
  'world/plansV1',
  'world/architect',
  'world/monuments',
  'world/modele',
  // Le contrat entre le jeu et ses dispositions (types seulement) : le jeu dit ce dont il a besoin.
  'world/disposition',
];

/** La disposition en grille : la place des îles, des chemins, du quai, en cases du monde. */
const GRILLE = ['world/map', 'world/harbour', 'world/ground', 'world/paths', 'world/terrain', 'world/decor', 'world/whalePass', 'world/grille'];

/** Le contrat commun des vues et sa simulation. */
const COMMUN = ['world/view', 'world/scene'];

const PERMIS: Record<Couche, Couche[]> = {
  regle: ['regle', 'neutre'],
  grille: ['regle', 'grille', 'neutre'],
  commun: ['regle', 'grille', 'commun', 'neutre'],
  dessin: ['regle', 'grille', 'commun', 'dessin', 'neutre'],
  neutre: ['neutre'],
};

/**
 * Les dépendances à contresens d'aujourd'hui, avec leur motif et l'étape qui les retire. « a → b » : a importe b.
 * Une exception retirée du code sort de cette liste.
 */
const EXCEPTIONS: Record<string, string> = {
  'biomes → components/Icon': 'le nom d’icône d’une île (un type seulement), un détail d’interface dans les données (J7)',
  'boss → exercises/registry': 'le défi du Gardien lit combien d’items montre chaque écran, rangé avec les écrans (J7)',
  'world/islandState → components/Icon': 'le nom d’icône d’un état d’île (un type seulement) (J7)',
  'world/grille → Voxel': 'les types VoxelCube et VillagePlaceId, rangés dans un composant (J5)',
  'world/paths → Voxel': 'le type VoxelCube, rangé dans un composant (J5)',
  'world/terrain → Avatar': 'la place du bonhomme sur son île, AVATAR_HOME (J5)',
  'world/terrain → Creatures': 'les modèles des créatures, dans un composant React (J5)',
  'world/terrain → Guardians': 'les modèles des Gardiens, dans un composant React (J5)',
  'world/terrain → Voxel': 'le type VoxelCube, rangé dans un composant (J5)',
  'world/decor → Voxel': 'le type VoxelCube, rangé dans un composant ; le décor sorti de terrain.ts au lot R4 en hérite (J5)',
  'world/terrain → world/daylight': 'l’ambiance d’un archipel (le ciel), lue pour poser le décor (J5)',
  'world/view → Voxel': 'le contrat des vues reçoit des cubes ; ils passent en ancrages avec le repère des îles (J5)',
  'world/scene → Voxel': 'la simulation lit les cubes ; ils passent en ancrages avec le repère des îles (J5)',
};

/** Le nom court d'un module : chemin depuis src/ (ou depuis src/ hors de Blocland), sans extension. */
function nom(file: string): string {
  const r = relative(BLOCLAND, file);
  const n = r.startsWith('..') ? relative(SRC, file) : r;
  return n.replace(/\.(tsx?|json)$/, '').replace(/\/index$/, '');
}

function couche(file: string): Couche {
  if (file.endsWith('.json')) return 'neutre';
  const n = nom(file);
  if (!file.startsWith(BLOCLAND)) return n.startsWith('components/') ? 'dessin' : 'neutre';
  if (REGLES.includes(n)) return 'regle';
  if (GRILLE.includes(n)) return 'grille';
  if (COMMUN.includes(n)) return 'commun';
  if (n.startsWith('exercises/') && n !== 'exercises/registry' && !file.endsWith('.tsx')) return 'regle';
  if (n === 'exercises') return 'regle';
  return 'dessin';
}

/** Le fichier qu'importe `spec` depuis `from`, ou `null` hors du dépôt (un paquet). */
function resoudre(from: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = join(dirname(from), spec);
  if (/\.(json|tsx?)$/.test(base) && existsSync(base)) return base;
  for (const f of [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]) if (existsSync(f)) return f;
  throw new Error(`Import introuvable : ${spec} depuis ${from}`);
}

function fichier(n: string): string {
  const f = join(BLOCLAND, `${n}.ts`);
  return existsSync(f) ? f : join(BLOCLAND, `${n}.tsx`);
}

/** Les dépendances à contresens des règles, de la grille et du contrat commun, « a → b ». */
function contresens(): string[] {
  const out = new Set<string>();
  for (const n of [...REGLES, ...GRILLE, ...COMMUN]) {
    const f = fichier(n);
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:from|import)\s+'([^']+)'/g)) {
      const cible = resoudre(f, m[1]);
      if (!cible) continue;
      const c = couche(cible);
      if (!PERMIS[couche(f)].includes(c)) out.add(`${n} → ${nom(cible)}`);
    }
  }
  return [...out].sort();
}

describe('Les couches du jeu', () => {
  const trouvees = contresens();

  it('aucune nouvelle dépendance à contresens', () => {
    expect(trouvees.filter((d) => !(d in EXCEPTIONS))).toEqual([]);
  });

  it('chaque exception existe encore (sinon, la retirer de la liste)', () => {
    expect(Object.keys(EXCEPTIONS).filter((d) => !trouvees.includes(d))).toEqual([]);
  });

  it('chaque exception dit son motif', () => {
    expect(Object.entries(EXCEPTIONS).filter(([, motif]) => !motif)).toEqual([]);
  });
});

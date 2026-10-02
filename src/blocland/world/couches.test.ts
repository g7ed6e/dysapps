// Les couches du jeu (docs/conception/separation-jeu-rendu.md) : les règles ne dépendent ni de la grille ni du dessin ;
// la grille (la place des choses en cases) ne dépend pas du dessin ; le contrat commun des vues non plus. Les
// dépendances à contresens d'aujourd'hui sont listées avec leur motif et l'étape qui les retire : une nouvelle fait
// échouer le test, et une exception retirée du code doit l'être de la liste.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

type Couche = 'regle' | 'grille' | 'commun' | 'univers' | 'dessin' | 'neutre';

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
  // Les îles et leurs missions, produites depuis docs/contenu/ par `npm run contenu`.
  'iles',
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
  // L'assemblage des blocs (GD-2) et ses recettes, produites depuis docs/contenu/assemblage.md par `npm run contenu`.
  'world/assemblage',
  'world/recettes',
  'world/modele',
  // Le contrat entre le jeu et ses dispositions (types seulement) : le jeu dit ce dont il a besoin.
  'world/disposition',
];

/** La disposition en grille : la place des îles, des chemins, du quai, en cases du monde. */
const GRILLE = [
  'world/map',
  'world/harbour',
  'world/ground',
  'world/paths',
  'world/terrain',
  'world/decor',
  'world/whalePass',
  'world/grille',
  // Où va le bonhomme quand on touche le sol : la case touchée, ou la plus proche où il peut aller.
  'world/arrivee',
  // Le monde en cubes : un cube en cases du monde, ce qu'on touche pour entrer (J5).
  'world/cube',
  // La salle des trophées qui s'agrandit (GD-3) : son emprise, ses travées et les places des trophées, en cases.
  'world/salle',
  // Le relief de chaque île, en repère d'île, un fichier par archipel (socle de la piste Rendu).
  'world/silhouettes',
  'world/silhouettes/types',
  'world/silhouettes/6e',
  'world/silhouettes/5e',
  'world/silhouettes/4e',
  'world/silhouettes/3e',
  // Les modèles des personnages en cubes, en repère propre : la grille les pose, les vues les dessinent (R6).
  'world/personnages/ascii',
  'world/personnages/creatures',
  'world/personnages/gardiens',
];

/**
 * Ce qui change d'un univers à l'autre (J7, docs/univers/univers.md §5) : ses textes, son habillage, sa palette, son
 * modelé dessiné. Le jeu, la grille et le contrat commun ne l'importent jamais : un univers habille le jeu sans le changer.
 */
function estUnivers(file: string): boolean {
  const n = nom(file);
  if (!file.startsWith(BLOCLAND)) return n === 'univers' || n.startsWith('univers/') || n === 'core/univers';
  return n === 'habillage' || n === 'world/habillage' || n.startsWith('world/habillage/') || n === 'world/palette' || n === 'world/modeleDessine' || n.startsWith('world/modeleDessine/');
}

/** Le contrat commun des vues et sa simulation. */
const COMMUN = ['world/view', 'world/scene'];

const PERMIS: Record<Couche, Couche[]> = {
  regle: ['regle', 'neutre'],
  grille: ['regle', 'grille', 'neutre'],
  commun: ['regle', 'grille', 'commun', 'neutre'],
  // Un univers habille le dessin et peut donc le lire (sa palette lit l'heure, son habillage le rendu choisi). Seuls les
  // règles, la grille et le contrat commun sont parcourus : ce qui compte ici, c'est qu'aucun d'eux n'importe un univers.
  univers: ['regle', 'grille', 'commun', 'univers', 'dessin', 'neutre'],
  dessin: ['regle', 'grille', 'commun', 'univers', 'dessin', 'neutre'],
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
};

/** Le nom court d'un module : chemin depuis src/ (ou depuis src/ hors de Blocland), sans extension. */
function nom(file: string): string {
  const r = relative(BLOCLAND, file);
  const n = r.startsWith('..') ? relative(SRC, file) : r;
  return n.replace(/\.(tsx?|json)$/, '').replace(/\/index$/, '');
}

function couche(file: string): Couche {
  if (file.endsWith('.json')) return 'neutre';
  if (estUnivers(file)) return 'univers';
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
  const f = [`${n}.ts`, `${n}.tsx`, `${n}/index.ts`].map((x) => join(BLOCLAND, x)).find((x) => existsSync(x));
  return f ?? join(BLOCLAND, `${n}.tsx`);
}

/**
 * Les couches pures du rendu : calculées sans Three.js, sans React ni une vue (three/, pixel/, les composants), testées
 * sous jsdom. Elles ne lisent que le monde (world/), aucun paquet.
 */
const PURES = [
  // L'architecture modulaire d'Archipéo (lot 7) : voisinage, choix des pièces, pièces, kits.
  'world/architecture',
];

/** Les fichiers (hors tests) d'un dossier, sous-dossiers compris. */
function fichiersDe(dossier: string): string[] {
  return readdirSync(dossier).flatMap((n) => {
    const f = join(dossier, n);
    if (statSync(f).isDirectory()) return fichiersDe(f);
    return /\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) ? [f] : [];
  });
}

/** Ce qu'importe une couche pure hors du monde (world/, en .ts) : un paquet, une vue, un composant. */
function impuretes(): string[] {
  const out = new Set<string>();
  const monde = join(BLOCLAND, 'world');
  for (const d of PURES)
    for (const f of fichiersDe(join(BLOCLAND, d))) {
      if (f.endsWith('.tsx')) out.add(`${nom(f)} (un composant)`);
      for (const m of readFileSync(f, 'utf8').matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
        const cible = resoudre(f, m[1]);
        if (!cible) out.add(`${nom(f)} → ${m[1]}`);
        else if (!cible.startsWith(monde + '/') || cible.endsWith('.tsx')) out.add(`${nom(f)} → ${nom(cible)}`);
      }
    }
  return [...out].sort();
}

/** Les dépendances à contresens des règles, de la grille et du contrat commun, « a → b ». */
function contresens(): string[] {
  const out = new Set<string>();
  for (const n of [...REGLES, ...GRILLE, ...COMMUN]) {
    const f = fichier(n);
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
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

  it('les couches pures du rendu (l’architecture modulaire) ne lisent que le monde : ni Three.js, ni React, ni une vue', () => {
    expect(PURES.every((d) => existsSync(join(BLOCLAND, d)) && fichiersDe(join(BLOCLAND, d)).length > 0)).toBe(true);
    expect(impuretes()).toEqual([]);
  });

  it('chaque exception dit son motif', () => {
    expect(Object.entries(EXCEPTIONS).filter(([, motif]) => !motif)).toEqual([]);
  });

  it('les textes, l’habillage, la palette et le modelé de chaque univers sont dans la couche des univers', () => {
    const univers = ['univers/index.ts', 'univers/blocland/index.ts', 'univers/communs.ts', 'core/univers.ts'].map((f) => join(SRC, f));
    const habillages = ['habillage.ts', 'world/habillage/index.ts', 'world/habillage/blocland.ts', 'world/habillage/archipeo.ts', 'world/palette.ts', 'world/modeleDessine/5e.ts'].map((f) => join(BLOCLAND, f));
    expect([...univers, ...habillages].filter((f) => !existsSync(f) || couche(f) !== 'univers')).toEqual([]);
    expect(PERMIS.regle.includes('univers') || PERMIS.grille.includes('univers') || PERMIS.commun.includes('univers')).toBe(false);
  });
});

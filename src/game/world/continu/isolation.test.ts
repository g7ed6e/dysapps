// La coupure du monde continu (prototype du monde ouvert d'Archipéo) : son code pur (world/continu/) ne lit que
// lui-même, sans Three.js ni React ; sa vue (three/archipeo/) n'est importée que par la fabrique de disposition, et
// seulement à la demande (`import()`) ; aucun autre fichier du jeu, de Blocland ou du monde en grille ne mène à l'un ou à
// l'autre. Ainsi, sans le drapeau, le monde d'aujourd'hui est exactement le même.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..', '..', '..');
const CONTINU = join(SRC, 'game', 'world', 'continu');
const VUE = join(SRC, 'game', 'three', 'archipeo');
const FABRIQUE = join(SRC, 'game', 'worldLayoutFactory.tsx');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((n) => {
    const f = join(dossier, n);
    return statSync(f).isDirectory() ? fichiers(f) : /\.(tsx?|css)$/.test(n) ? [f] : [];
  });
}

const estUnTest = (f: string) => /\.test\.tsx?$/.test(f);

/** Les imports d'un fichier : leur chaîne, et s'ils sont faits à la demande (`import('…')`). */
function importsDe(f: string): { spec: string; aLaDemande: boolean }[] {
  const src = readFileSync(f, 'utf8');
  const statiques = [...src.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g)].map((m) => ({ spec: m[1], aLaDemande: false }));
  const nus = [...src.matchAll(/(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g)].map((m) => ({ spec: m[1], aLaDemande: false }));
  const dynamiques = [...src.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => ({ spec: m[1], aLaDemande: true }));
  return [...statiques, ...nus, ...dynamiques];
}

const cible = (f: string, spec: string) => (spec.startsWith('.') ? resolve(dirname(f), spec) : null);
const dans = (chemin: string | null, dossier: string) => chemin !== null && (chemin === dossier || chemin.startsWith(dossier + '/'));

describe('La coupure du monde continu', () => {
  const tout = fichiers(SRC).filter((f) => !estUnTest(f));

  it('world/continu/ ne lit que lui-même : ni paquet, ni Three.js, ni React, ni le reste du jeu', () => {
    const sorties = fichiers(CONTINU)
      .filter((f) => !estUnTest(f))
      .flatMap((f) => importsDe(f).filter(({ spec }) => !dans(cible(f, spec), CONTINU)).map(({ spec }) => `${relative(SRC, f)} → ${spec}`));
    expect(sorties).toEqual([]);
  });

  it('seule la fabrique de disposition mène à la vue du monde continu, et à la demande', () => {
    const entrees = tout
      .filter((f) => !dans(f, VUE))
      .flatMap((f) => importsDe(f).filter(({ spec }) => dans(cible(f, spec), VUE)).map(({ spec, aLaDemande }) => `${relative(SRC, f)} → ${spec}${aLaDemande ? ' (à la demande)' : ''}`));
    expect(entrees).toEqual(['game/worldLayoutFactory.tsx → ./three/archipeo/OpenWorldPage (à la demande)']);
  });

  it('seule la vue du monde continu lit world/continu/', () => {
    const lecteurs = tout
      .filter((f) => !dans(f, CONTINU) && !dans(f, VUE))
      .flatMap((f) => importsDe(f).filter(({ spec }) => dans(cible(f, spec), CONTINU)).map(() => relative(SRC, f)));
    expect(lecteurs).toEqual([]);
  });

  it('la fabrique existe et ne charge rien du monde continu d’avance', () => {
    expect(importsDe(FABRIQUE).filter(({ spec, aLaDemande }) => !aLaDemande && (dans(cible(FABRIQUE, spec), VUE) || dans(cible(FABRIQUE, spec), CONTINU)))).toEqual([]);
  });
});

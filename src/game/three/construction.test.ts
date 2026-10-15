// Le shader des blocs de la construction taillée : l'attribut `motif` porte soit le motif d'un mur peint (lot 7b,
// world/architecture/paint.ts, en bits), soit celui d'un bloc assemblé (GD-2, au-delà de `MOTIF_ASSEMBLE_DEBUT`) ;
// chaque fonction ne reçoit que le sien.
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MOTIF_ASSEMBLE_DEBUT, type MaillageDeLaConstruction } from '../world/construction';
import { OPACITE_DU_HALO_DU_FEU } from '../world/monumentModels';
import { creerConstruction, creerMateriaux } from './construction';
import type { Lumiere } from './light';

/** Le shader du matériau des blocs, une fois complété (les points d'insertion de Three.js, seuls). */
function shaderDesBlocs() {
  const m = creerMateriaux(null);
  const s = {
    uniforms: {},
    vertexShader: '#include <common>\n#include <begin_vertex>',
    fragmentShader: '#include <common>\n#include <color_fragment>',
  } as unknown as THREE.WebGLProgramParametersWithUniforms;
  m.opaque.onBeforeCompile(s, null as unknown as THREE.WebGLRenderer);
  m.dispose();
  return s;
}

describe('Le shader des blocs de la construction', () => {
  it('le motif reste plat par triangle, et chaque fonction ne reçoit que son motif', () => {
    const { vertexShader, fragmentShader } = shaderDesBlocs();
    expect(vertexShader).toContain('flat varying float vMotif;');
    expect(fragmentShader).toContain('flat varying float vMotif;');
    expect(fragmentShader).toContain('vec3 peindreLeMotif(');
    expect(fragmentShader).toContain('vec3 motifAssemble(');
    expect(fragmentShader).toContain(`bool assemble = vMotif > ${MOTIF_ASSEMBLE_DEBUT - 0.5};`);
    expect(fragmentShader).toContain('peindreLeMotif(diffuseColor.rgb, assemble ? 0.0 : vMotif, vPos, vN)');
    expect(fragmentShader).toContain(`motifAssemble(diffuseColor.rgb, assemble ? vMotif - ${MOTIF_ASSEMBLE_DEBUT}.0 : 0.0, vPos, vN)`);
    // Les deux appels hors de tout `if` : leurs dérivées se prennent en flot uniforme.
    const corps = fragmentShader.slice(fragmentShader.indexOf('bool assemble'), fragmentShader.indexOf('motifAssemble(diffuseColor'));
    expect(corps).not.toMatch(/\bif\s*\(/);
  });
});

describe('Le halo du feu d’un monument fini', () => {
  const vide = () => ({ positions: new Float32Array(0), normals: new Float32Array(0), colors: new Float32Array(0), indices: new Uint32Array(0) });
  const maillage = {
    opaque: { ...vide(), biseaux: new Float32Array(0), teintes: new Float32Array(0), aretes: new Float32Array(0), motifs: new Float32Array(0) },
    fenetres: { ...vide(), decalages: new Float32Array(0) },
    fantomes: { ...vide(), colors: new Float32Array(0), uvs: new Float32Array(0) },
    monuments: [{ opaque: [0, 0], fenetres: [0, 0], cellules: [], halo: { centre: [10, 12, 20], cote: 7 } }],
  } as unknown as MaillageDeLaConstruction;

  it('un sprite additif et fixe par feu, invisible le jour, à pleine force la nuit, sans toucher', () => {
    let regler: (jour: number) => void = () => {};
    const lumiere = { suivre: (f: (jour: number) => void) => (regler = f) } as unknown as Lumiere;
    const materiaux = creerMateriaux(lumiere);
    const c = creerConstruction(materiaux);
    c.peindre(maillage);
    const sprites = c.group.children.filter((o): o is THREE.Sprite => o instanceof THREE.Sprite);
    expect(sprites).toHaveLength(1);
    expect(sprites[0].position.toArray()).toEqual([10, 12, 20]);
    expect(sprites[0].scale.x).toBe(7);
    expect(sprites[0].matrixAutoUpdate).toBe(false);
    expect(materiaux.halo.blending).toBe(THREE.AdditiveBlending);
    expect(materiaux.halo.fog).toBe(false);
    regler(1);
    expect(materiaux.halo.opacity).toBe(0);
    regler(0);
    expect(materiaux.halo.opacity).toBeCloseTo(OPACITE_DU_HALO_DU_FEU);
    expect(c.triangles()).toBe(2);
    // Repeindre ne laisse rien derrière soi.
    c.peindre(maillage);
    expect(c.group.children).toHaveLength(1);
    c.dispose();
    expect(c.group.children).toHaveLength(0);
    materiaux.dispose();
  });
});

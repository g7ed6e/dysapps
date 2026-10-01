// Le shader des blocs de la construction taillée : l'attribut `motif` porte soit le motif d'un mur peint (lot 7b,
// world/architecture/peinture.ts, en bits), soit celui d'un bloc assemblé (GD-2, au-delà de `MOTIF_ASSEMBLE_DEBUT`) ;
// chaque fonction ne reçoit que le sien.
import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MOTIF_ASSEMBLE_DEBUT } from '../world/construction';
import { creerMateriaux } from './construction';

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

// La lecture d'un modèle texturé (`lireGlbTexture`, les habitants du monde ouvert) refuse un fichier abîmé, sans jamais
// lire hors du binaire ni allouer d'après un compte démesuré : le pion reste (../../../importedCharacters.ts l'attrape).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireGlbTexture } from './glb';

const FICHIER = resolve(__dirname, '../../../../../docs/univers/archipeo/personnages/modeles/6e-habitant-phare/habitant.glb');

/** Le fichier du Phare : son JSON et son binaire, séparés. */
function parts(): { json: Record<string, any>; bin: Uint8Array } {
  const b = new Uint8Array(readFileSync(FICHIER));
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + jsonLength)));
  const binLength = view.getUint32(20 + jsonLength, true);
  return { json, bin: b.slice(28 + jsonLength, 28 + jsonLength + binLength) };
}

/** Un .glb refait d'un JSON et d'un binaire. */
function glb(json: unknown, bin: Uint8Array): ArrayBuffer {
  const text = new TextEncoder().encode(JSON.stringify(json));
  const jl = (text.length + 3) & ~3;
  const out = new Uint8Array(12 + 8 + jl + 8 + bin.length);
  const v = new DataView(out.buffer);
  v.setUint32(0, 0x46546c67, true);
  v.setUint32(4, 2, true);
  v.setUint32(8, out.length, true);
  v.setUint32(12, jl, true);
  v.setUint32(16, 0x4e4f534a, true);
  out.fill(0x20, 20, 20 + jl);
  out.set(text, 20);
  v.setUint32(20 + jl, bin.length, true);
  v.setUint32(24 + jl, 0x004e4942, true);
  out.set(bin, 28 + jl);
  return out.buffer;
}

describe('Un modèle texturé abîmé est refusé', () => {
  it('le fichier tel quel se lit', () => {
    const { json, bin } = parts();
    expect(lireGlbTexture(glb(json, bin)).indices.length).toBe(51_000);
  });

  it('un indice hors des sommets', () => {
    const { json, bin } = parts();
    const a = json.accessors[json.meshes[0].primitives[0].indices];
    const offset = (json.bufferViews[a.bufferView].byteOffset ?? 0) + (a.byteOffset ?? 0);
    new DataView(bin.buffer).setUint16(offset, 65_000, true);
    expect(() => lireGlbTexture(glb(json, bin))).toThrow(/Sommet inconnu/);
  });

  it('sans image, ou une image qui n’est ni JPEG ni PNG', () => {
    const { json, bin } = parts();
    expect(() => lireGlbTexture(glb({ ...json, images: [] }, bin))).toThrow(/sans image/);
    expect(() => lireGlbTexture(glb({ ...json, images: [{ ...json.images[0], mimeType: 'image/svg+xml' }] }, bin))).toThrow(/Type d’image refusé/);
  });

  it('un compte démesuré, une vue ou une image hors du binaire', () => {
    const { json, bin } = parts();
    const big = structuredClone(json);
    big.accessors[0].count = 1e9;
    expect(() => lireGlbTexture(glb(big, bin))).toThrow(/hors de sa vue/);
    const view = structuredClone(json);
    view.bufferViews[1].byteLength = bin.length * 2;
    expect(() => lireGlbTexture(glb(view, bin))).toThrow(/hors du binaire/);
    const image = structuredClone(json);
    image.bufferViews[image.images[0].bufferView].byteOffset = bin.length;
    expect(() => lireGlbTexture(glb(image, bin))).toThrow(/hors du binaire/);
  });
});

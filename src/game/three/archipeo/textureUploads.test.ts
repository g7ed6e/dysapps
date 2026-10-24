// L'envoi des textures en bandes (./textureUploads.ts) : réservée sans ses pixels, remplie une bande par pas, les
// mipmaps à la dernière seulement ; finie d'un coup si elle va être dessinée ; d'un coup aussi si le découpage manque ;
// oubliée si elle est libérée. Sans WebGL : un faux rendu qui note ce qu'on lui demande, un faux `createImageBitmap`.
import * as THREE from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTextureUploads } from './textureUploads';

const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

interface Copy {
  y: number | null;
  height: number;
  mipmaps: boolean;
}

function fauxRendu() {
  const copies: Copy[] = [];
  const inits: { dataReady: boolean }[] = [];
  const renderer = {
    initTexture: vi.fn((t: THREE.Texture) => inits.push({ dataReady: t.source.dataReady })),
    copyTextureToTexture: vi.fn((src: THREE.Texture, dst: THREE.Texture, _r: unknown, at: THREE.Vector2 | null) =>
      copies.push({ y: at ? at.y : null, height: (src.image as { height: number }).height, mipmaps: dst.generateMipmaps }),
    ),
  };
  return { renderer: renderer as unknown as THREE.WebGLRenderer, copies, inits };
}

const crops: { close: ReturnType<typeof vi.fn> }[] = [];
let cropFails = false;

beforeEach(() => {
  crops.length = 0;
  cropFails = false;
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async (_src: unknown, _x: number, _y: number, width: number, height: number) => {
      if (cropFails) throw new Error('pas de découpage');
      const b = { width, height, close: vi.fn() };
      crops.push(b);
      return b;
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

const texture = (size = 512) => {
  const t = new THREE.Texture({ width: size, height: size, close: vi.fn() } as unknown as ImageBitmap);
  return t;
};

describe("l'envoi des textures en bandes", () => {
  it('réserve la texture sans ses pixels, puis la remplit une bande par pas, les mipmaps à la dernière', async () => {
    const { renderer, copies, inits } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const t = texture(512);
    up.add(t);
    up.step(); // le découpage lancé
    await settle();
    expect(crops).toHaveLength(4);
    up.step(); // la réservation
    expect(inits).toEqual([{ dataReady: false }]);
    expect(t.source.dataReady).toBe(true);
    for (let i = 0; i < 4; i++) up.step();
    expect(copies).toEqual([
      { y: 0, height: 128, mipmaps: false },
      { y: 128, height: 128, mipmaps: false },
      { y: 256, height: 128, mipmaps: false },
      { y: 384, height: 128, mipmaps: true },
    ]);
    expect(t.generateMipmaps).toBe(true);
    expect(up.has(t)).toBe(false);
    expect(crops.every((c) => c.close.mock.calls.length === 1)).toBe(true);
    up.step();
    expect(copies).toHaveLength(4);
  });

  it('une image dont la hauteur ne tombe pas juste : la dernière bande, plus courte', async () => {
    const { renderer, copies } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const t = new THREE.Texture({ width: 256, height: 300, close: vi.fn() } as unknown as ImageBitmap);
    up.add(t);
    up.step();
    await settle();
    for (let i = 0; i < 4; i++) up.step();
    expect(copies.map((c) => [c.y, c.height])).toEqual([
      [0, 128],
      [128, 128],
      [256, 44],
    ]);
  });

  it('finie d’un coup quand elle va être dessinée : le reste des bandes, ou toute l’image si rien n’est réservé', async () => {
    const { renderer, copies, inits } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const a = texture(512);
    up.add(a);
    up.step();
    await settle();
    up.step();
    up.step();
    up.finish(a);
    expect(copies.map((c) => c.y)).toEqual([0, 128, 256, 384]);
    expect(copies.at(-1)?.mipmaps).toBe(true);
    expect(up.has(a)).toBe(false);
    // Pas encore réservée : Three.js l'envoie toute, comme avant.
    const b = texture(512);
    up.add(b);
    up.finish(b);
    expect(inits.at(-1)).toEqual({ dataReady: true });
    expect(up.has(b)).toBe(false);
  });

  it('le découpage manqué : la texture part d’un coup', async () => {
    cropFails = true;
    const { renderer, inits, copies } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const t = texture(512);
    up.add(t);
    up.step();
    await settle();
    up.step();
    expect(inits).toEqual([{ dataReady: true }]);
    expect(copies).toHaveLength(0);
    expect(up.has(t)).toBe(false);
  });

  it('une texture libérée en attente quitte la file, ses bandes fermées', async () => {
    const { renderer, copies } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const t = texture(256);
    up.add(t);
    up.step();
    await settle();
    t.dispose();
    expect(up.has(t)).toBe(false);
    expect(crops.every((c) => c.close.mock.calls.length === 1)).toBe(true);
    up.step();
    expect(copies).toHaveLength(0);
  });

  it('libérée pendant le découpage : les bandes qui arrivent sont fermées', async () => {
    const { renderer } = fauxRendu();
    const up = createTextureUploads(renderer, 128);
    const t = texture(256);
    up.add(t);
    up.step();
    up.clear();
    await settle();
    expect(crops).toHaveLength(2);
    expect(crops.every((c) => c.close.mock.calls.length === 1)).toBe(true);
  });
});

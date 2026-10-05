import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAINTERS, SIZE, faded, type TextureKind } from './pixels';

/** Les pixels d'un peintre, avec un hasard reproductible. */
function paint(kind: TextureKind, face: 'top' | 'side') {
  let s = 1;
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const out: number[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) out.push(...PAINTERS[kind][face](x, y, r));
  return out;
}

it('chaque texture peint des couleurs valides, dessus et côté, et sa version délavée aussi', () => {
  for (const kind of Object.keys(PAINTERS) as TextureKind[]) {
    for (const face of ['top', 'side'] as const) {
      const px = paint(kind, face);
      expect(px.length, kind).toBe(SIZE * SIZE * 3);
      for (const v of px) expect(v >= 0 && v <= 255, `${kind} ${face}`).toBe(true);
    }
    const [r, g, b] = faded(PAINTERS[kind].top)(0, 0, () => 0.5);
    for (const v of [r, g, b]) expect(v).toBeGreaterThanOrEqual(0);
  }
});

it('le monde (world/) ne dépend pas de Three.js ', () => {
  const dir = join(process.cwd(), 'src/game/world');
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && !n.endsWith('.test.ts'))) {
    expect(readFileSync(join(dir, f), 'utf8'), f).not.toMatch(/from 'three'/);
  }
});

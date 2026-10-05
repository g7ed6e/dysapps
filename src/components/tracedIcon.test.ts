// Le tracé des icônes, pour la texture du signe des créatures (three/signs.ts) : chaque icône d'île a ses chemins.
import { BIOMES } from '../game/biomes';
import { tracesDeLIcone } from './tracedIcon';

it('chaque icône d’île se trace en chemins SVG', () => {
  for (const icone of new Set(BIOMES.map((b) => b.icon))) {
    const traces = tracesDeLIcone(icone);
    expect(traces.length, icone).toBeGreaterThan(0);
    for (const d of traces) expect(d, icone).toMatch(/^[Mm]\s?[-\d.]/);
  }
});

it('les cercles, les lignes et les rectangles deviennent des chemins', () => {
  // « Cible » : trois cercles ; « Règle » : un rectangle et des lignes, selon la version de Lucide.
  expect(tracesDeLIcone('target')).toHaveLength(3);
  expect(tracesDeLIcone('target').every((d) => d.includes('a'))).toBe(true);
});

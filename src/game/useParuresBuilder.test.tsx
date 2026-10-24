// Le chantier des parures du 3e (GD-25), au niveau du hook : avec un inventaire à moitié plein, « Poser » pose ce qu'il
// peut de la figure de proue, jamais le pavois avant elle (relecture de l'expert frontend, PR du 3e, point 7).
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { ProgressProvider } from '../core/ProgressContext';
import { SettingsProvider } from '../core/SettingsContext';
import { BloclandProvider } from './BloclandContext';
import { useParuresBuilder } from './useParuresBuilder';
import { NEF_PARURES_ID, NEF_PARURES_PLAN, PARURE_POSED } from './world/nefParures';
import { planCells } from './world/plans';

const keys = planCells(NEF_PARURES_PLAN).map((c) => c.key);

function mount(posed: readonly string[], stock: Record<string, number>) {
  localStorage.clear();
  localStorage.setItem('dysapps:settings', JSON.stringify({ univers: 'archipeo', autoRead: false, sounds: false }));
  localStorage.setItem('dysapps:game', JSON.stringify({ version: 5, stock, world: { parts: { [NEF_PARURES_ID]: posed }, links: [] } }));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsProvider>
      <ProgressProvider>
        <BloclandProvider>{children}</BloclandProvider>
      </ProgressProvider>
    </SettingsProvider>
  );
  return renderHook(() => useParuresBuilder(false), { wrapper });
}

const saved = () => JSON.parse(localStorage.getItem('dysapps:game')!) as { world: { parts: Record<string, string[]> }; stock: Record<string, number> };

describe('useParuresBuilder (GD-25)', () => {
  it('inventaire à moitié plein : deux marbres posés sur la proue, le quartz gardé pour le pavois', () => {
    const { result } = mount([], { 'maths-3e-geometry': 2, 'maths-3e-statistics': 10 });
    expect(result.current.canFill).toBe(true);
    act(() => result.current.fillAll());
    expect(result.current.notice).toBe('2 blocs posés sur la Nef.');
    expect(saved().world.parts[NEF_PARURES_ID]).toEqual(keys.slice(0, 2));
    expect(saved().stock['maths-3e-statistics']).toBe(10);
    // Plus de marbre : rien à poser, même avec du quartz, tant que la proue n'est pas finie.
    expect(result.current.canFill).toBe(false);
    act(() => result.current.fillAll());
    expect(saved().world.parts[NEF_PARURES_ID]).toHaveLength(2);
  });

  it('la proue finie, le pavois se pose ensuite, et dit sa phrase', () => {
    const { result } = mount(keys.slice(0, 6), { 'maths-3e-statistics': 10 });
    act(() => result.current.fillAll());
    expect(result.current.notice).toBe(PARURE_POSED[1]);
    expect(saved().world.parts[NEF_PARURES_ID]).toHaveLength(16);
  });
});

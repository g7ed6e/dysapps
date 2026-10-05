import { vi } from 'vitest';

/** L'appareil demande moins d'animations (`prefers-reduced-motion`), jusqu'à la fin du test. */
export function demanderMoinsDAnimations(): void {
  vi.stubGlobal('matchMedia', (media: string) => ({ matches: media.includes('prefers-reduced-motion'), media, addEventListener() {}, removeEventListener() {} }));
}

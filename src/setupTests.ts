import '@testing-library/jest-dom/vitest';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});
// La géométrie des liaisons (GD-9), que les règles du monde demandent à la grille, comme dans l'application.
import './game/world/linkGeometry';

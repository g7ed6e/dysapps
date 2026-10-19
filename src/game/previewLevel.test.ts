import { estUnApercu, niveauDepuis, partieAuDebutDe } from './previewLevel';
import { archipelagoOf, isArchipelagoReached, isBiomeUnlocked } from './world/archipelago';

it('ne compte que sur les aperçus de branche, jamais sur l’application publiée', () => {
  expect(estUnApercu('preview-dysapps.guillaume-delahaye.workers.dev')).toBe(true);
  expect(estUnApercu('claude-lot-dysapps.guillaume-delahaye.workers.dev')).toBe(true);
  expect(estUnApercu('dysapps.guillaume-delahaye.workers.dev')).toBe(false);
  expect(estUnApercu('dysapps.fr')).toBe(false);
});

it('lit le niveau avant le #, seulement sur un aperçu, et pas le premier', () => {
  const ici = 'https://preview-dysapps.guillaume-delahaye.workers.dev/?monde=ouvert&niveau=5e#/adventure';
  expect(niveauDepuis(ici, true)).toBe('5e');
  expect(niveauDepuis(ici, false)).toBeNull();
  expect(niveauDepuis('https://x/#/adventure?niveau=5e', true)).toBeNull();
  expect(niveauDepuis('https://x/?niveau=6e', true)).toBeNull();
  expect(niveauDepuis('https://x/?niveau=autre', true)).toBeNull();
});

it('commence le 5e à son port, la Nef arrivée, sans rien de joué', () => {
  const partie = partieAuDebutDe('5e');
  expect(archipelagoOf(partie.world.place ?? 'french-6e-phonology').classe).toBe('5e');
  expect(isArchipelagoReached('5e', partie.world.links)).toBe(true);
  expect(isBiomeUnlocked(partie.world.place!, partie.world.links)).toBe(true);
  expect(partie.progress).toEqual({});
});

it('passe par les voyages d’avant pour un niveau plus loin', () => {
  const partie = partieAuDebutDe('4e');
  expect(partie.world.links).toEqual(['passage-5e', 'passage-4e']);
  expect(archipelagoOf(partie.world.place!).classe).toBe('4e');
});

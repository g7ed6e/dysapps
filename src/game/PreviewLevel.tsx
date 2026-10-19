// Le niveau d'essai de la pré-version (`?niveau=5e`, ./previewLevel.ts) : à l'ouverture de la page, la partie au début du
// niveau remplace, en mémoire, celle de l'appareil, la sauvegarde gelée. Monté seulement avec cette adresse.
import { useEffect, useRef } from 'react';
import { useBlocland } from './BloclandContext';
import type { ArchipelagoId } from './world/archipelago';
import { partieAuDebutDe } from './previewLevel';

export function PreviewLevel({ niveau }: { niveau: ArchipelagoId }) {
  const { chargerPourLesMesures } = useBlocland();
  const charge = useRef(false);
  useEffect(() => {
    if (charge.current) return;
    charge.current = true;
    chargerPourLesMesures(partieAuDebutDe(niveau));
  }, [chargerPourLesMesures, niveau]);
  return null;
}

// Le moment du rallumage (lot 6, fil B2) : un Gardien rallumé au défi reste éteint dans le monde jusqu'au retour au
// village ; la caméra glisse alors vers sa sentinelle, qui se rallume en fondu, avec une cloche et un mot. Une fois par
// Gardien et par appareil (comme le mot de la baleine), jamais dans la sauvegarde. Dans un univers sans sentinelles
// (Blocland), rien ne se montre : les Gardiens vaincus sont notés vus, pour qu'un passage à Archipéo n'en rejoue aucun.
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/SpeakButton';
import { Syllabified } from '../components/Syllabified';
import { frenchTypography } from '../components/math/RichText';
import { useSettings } from '../core/SettingsContext';
import { loadJSON, saveJSON } from '../core/storage';
import { useTextes } from '../univers';
import { getBiome, guardianTitle, type BiomeId } from './biomes';
import type { ArchipelagoId } from './world/archipelago';
import { aRallumer, gardiensRallumes, vusSansMoment, type RallumagesVus } from './world/rallumage';

const STORAGE_KEY = 'rallumage';

function noterVus(ids: BiomeId[]): void {
  if (!ids.length) return;
  const vus = loadJSON<RallumagesVus>(STORAGE_KEY, {});
  for (const id of ids) vus[id] = true;
  saveJSON(STORAGE_KEY, vus);
}

/**
 * Les Gardiens de l'archipel `a` qui attendent leur rallumage dans le monde (au plus trois), et de quoi noter l'un
 * d'eux vu. `actif` : l'univers a des sentinelles et le monde les montre. À la première ouverture, tout Gardien déjà
 * rallumé est noté vu sans moment.
 */
export function useRallumage(progress: Record<string, { stars: number }>, a: ArchipelagoId, actif: boolean) {
  const [tick, setTick] = useState(() => {
    if (loadJSON<RallumagesVus | null>(STORAGE_KEY, null) === null) {
      saveJSON(STORAGE_KEY, {});
      noterVus(gardiensRallumes(progress));
    }
    return 0;
  });
  const vus = useMemo(() => loadJSON<RallumagesVus>(STORAGE_KEY, {}), [tick, progress]);
  const sansMoment = vusSansMoment(progress, a, vus, actif);
  useEffect(() => {
    if (!sansMoment.length) return;
    noterVus(sansMoment);
    setTick((t) => t + 1);
    // Une liste nouvelle a d'autres Gardiens : sa forme en texte suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sansMoment.join()]);
  const enAttente = actif ? aRallumer(progress, a, vus).filter((id) => !sansMoment.includes(id)) : [];
  const noterVu = (id: BiomeId) => {
    noterVus([id]);
    setTick((t) => t + 1);
  };
  return { enAttente, noterVu };
}

interface PanelProps {
  id: BiomeId;
  onClose: () => void;
}

/** Le mot du rallumage, à la place du mot de la baleine : « Le Grand Chêne brille à nouveau. », lu à voix haute. */
export function RallumagePanel({ id, onClose }: PanelProps) {
  const { settings, speak } = useSettings();
  const textes = useTextes();
  const biome = getBiome(id);
  const text = biome && textes.sentinelles ? textes.sentinelles.rallume(guardianTitle(biome)) : '';
  useEffect(() => {
    if (text && settings.autoRead) speak(frenchTypography(text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!text) return null;
  return (
    <section className="panel whale-word rallumage-word" role="status" aria-live="polite">
      <p className="whale-word-text">
        <Icon name="flame" /> <Syllabified text={text} />
      </p>
      <div className="whale-word-actions">
        <SpeakButton text={text} />
        <button type="button" className="button primary" onClick={onClose}>
          J’ai compris
        </button>
      </div>
    </section>
  );
}

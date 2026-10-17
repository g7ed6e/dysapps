// Le panneau d'un lieu du monde continu (GD-20, point 8, choix du mainteneur du 15 octobre 2026 : chaque lieu porte toutes
// les missions de son île) : le même panneau qu'une porte de l'école (`MissionSheet`, ./PortPanels.tsx), une ligne par
// mission. Toucher le lieu l'ouvre ; une seule ligne est mise en avant, la prochaine mission ; une ligne qui se joue dans
// le lieu porte un signe (le même partout, dit « Scène », comme le bouton qui ramène à la scène depuis « Vue simple » : une icône, un mot), les autres se jouent sur l'écran habituel, le temps de
// la transition. Au retour d'une mission, la liste se rouvre, le focus sur la ligne jouée (`?lieu=`).
import type { ReactNode } from 'react';
import { Icon } from '../../../components/Icon';
import { MissionRows, type MissionRow } from '../../../components/MissionRows';
import { getBiome } from '../../biomes';
import { Stars } from '../../Stars';
import { playsInPlace, type MissionMark } from '../../world/continu/mission';
import { PLACES, placeOfIsland, type OpenPlace, type PlaceId } from '../../world/continu/plan6e';
import { MissionSheet, useOpenPanel } from './PortPanels';

/** Ce que dit le signe d'une ligne qui se joue dans le lieu (il ne porte jamais seul le sens : il est dit). */
export const IN_PLACE_LABEL = 'Scène';

/**
 * L'adresse qui ramène à un lieu, sa liste ouverte, le focus sur une mission : `/adventure?lieu=quais&mission=make-ten`
 * (comme `/adventure?porte=` pour une porte de l'école).
 */
export const placeReturn = (place: PlaceId, mission?: string) => `/adventure?lieu=${place}${mission ? `&mission=${encodeURIComponent(mission)}` : ''}`;

/** Un lieu lu dans l'adresse de retour (`?lieu=quais`), s'il en est un ; rien d'autre n'est lu. */
export function placeFromParam(value: string | null): PlaceId | null {
  return PLACES.find((p) => p.id === value)?.id ?? null;
}

/**
 * D'où ramène « Ma dernière mission » (accès direct), quand c'est une mission d'une île qui a son lieu
 * (`/adventure/<île>/<mission>`) : la liste de ce lieu, le focus sur elle ; sinon rien (son retour habituel).
 */
export function placeResume(path: string): string | undefined {
  const [, island, mission] = /^\/adventure\/([^/?#]+)\/([^/?#]+)$/.exec(path) ?? [];
  const place = island ? placeOfIsland(island) : undefined;
  return place && getBiome(island)?.exercises.some((e) => e.id === mission) ? placeReturn(place.id, mission) : undefined;
}

interface Props {
  place: OpenPlace;
  /** Les missions du lieu, leurs bornes (`missionsOfPlace`), dans l'ordre de l'île. */
  missions: readonly MissionMark[];
  /** La prochaine mission, si elle est de ce lieu : sa ligne est mise en avant. */
  suggested: string | null;
  /** La ligne qui prend le focus à l'ouverture : celle dont on revient, sinon la suggérée, sinon la première. */
  focus: string | null;
  onPlay(mission: string): void;
  onClose(): void;
  /** La ligne de l'habitant (GD-20, point 4, lot L1), en tête du panneau, avant les missions ; rien s'il n'attend rien. */
  habitant?: ReactNode;
}

/** Le panneau d'un lieu : sa liste de missions. */
export function PlacePanel({ place, missions, suggested, focus, onPlay, onClose, habitant }: Props) {
  useOpenPanel(onClose);
  const biome = getBiome(place.island);
  const rows: MissionRow[] = missions.map((m) => ({
    id: m.mission,
    icon: 'play',
    title: biome?.exercises.find((e) => e.id === m.mission)?.title ?? m.mission,
    tag:
      typeof m.etat === 'number' ? (
        <Stars count={m.etat} label={`${m.etat} étoile${m.etat > 1 ? 's' : ''} sur 3`} />
      ) : (
        <span className="tag tag-new">Nouveau</span>
      ),
    // Le signe des missions qui se jouent dans le lieu (référent dys) : une icône, le même partout, dite à la voix.
    sign: playsInPlace(place, m.mission) ? (
      <span className="mission-sign" role="img" aria-label={IN_PLACE_LABEL} title={IN_PLACE_LABEL}>
        <Icon name="mountain" />
      </span>
    ) : null,
    suggested: m.mission === suggested,
    onSelect: () => onPlay(m.mission),
  }));
  return (
    <MissionSheet id="panneau-lieu" className={`place-sheet${biome ? ` biome-${biome.id}` : ''}`} icon={biome?.icon ?? 'map'} title={place.name} onClose={onClose}>
      {habitant}
      <MissionRows rows={rows} focus={focus ?? (missions.some((m) => m.mission === suggested) ? suggested : (missions[0]?.mission ?? null))} label={`Missions ${place.at}`} />
    </MissionSheet>
  );
}

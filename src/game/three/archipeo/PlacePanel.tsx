// Le panneau d'un lieu du monde continu (GD-20, point 8, choix du mainteneur du 15 octobre 2026 : chaque lieu porte toutes
// les missions de son île) : le même panneau qu'une porte de l'école (`MissionSheet`, ./PortPanels.tsx), une ligne par
// mission. Toucher le lieu l'ouvre ; une seule ligne est mise en avant, la prochaine mission ; une ligne qui se joue dans
// le lieu porte un signe (le même partout, dit « Scène », comme le bouton qui ramène à la scène depuis « Vue simple » : une icône, un mot), les autres se jouent sur l'écran habituel, le temps de
// la transition. Au retour d'une mission, la liste se rouvre, le focus sur la ligne jouée (`?lieu=`). Sinon, quand
// l'habitant attend quelque chose, le focus va sur le bouton de sa ligne (« Livrer », « Reprendre », « Y aller ») et le
// panneau s'ouvre en haut, la ligne entière, rôle et icône compris (référent dys et consultant UX UI, relecture du lot
// L1 : à 844 × 390, la première mission prenait le focus et faisait défiler le panneau).
import { useEffect, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { MissionRows, type MissionRow } from '../../../components/MissionRows';
import { SpeakButton } from '../../../components/SpeakButton';
import { Syllabified } from '../../../components/Syllabified';
import { frenchTypography } from '../../../components/math/RichText';
import { useSettings } from '../../../core/SettingsContext';
import { getIle, sansSonOption } from '../../biomes';
import { Stars } from '../../Stars';
import { playsInPlace, type MissionMark } from '../../world/continu/mission';
import { surPlaceOf } from '../../world/continu/paroles';
import { placeOfIsland, type LevelPlan, type OpenPlace, type PlaceId } from '../../world/continu/levelPlan';
import type { EarnPlaceOf } from '../../PlanSection';
import { MissionSheet, useOpenPanel } from './PortPanels';

/** Ce que dit le signe d'une ligne qui se joue dans le lieu (il ne porte jamais seul le sens : il est dit). */
export const IN_PLACE_LABEL = 'Scène';
/** Le signe d'une mission dont un niveau se joue sur place, aux abords du lieu (GD-27, lot 6) : des pas, le mot dit. */
export const SUR_PLACE_LABEL = 'Sur place';

/**
 * L'adresse qui ramène à un lieu, sa liste ouverte, le focus sur une mission : `/adventure?lieu=quais&mission=make-ten`
 * (comme `/adventure?porte=` pour une porte de l'école).
 */
export const placeReturn = (place: PlaceId, mission?: string) => `/adventure?lieu=${place}${mission ? `&mission=${encodeURIComponent(mission)}` : ''}`;

/**
 * Au monde ouvert, le lieu du plan qui reprend les missions d'une île (`EarnLink`, la fiche de la Nef, l'Entrepôt) : son
 * place en mots (« à la Montée ») et l'adresse qui y ramène ; rien pour une île qu'aucun lieu du plan ne reprend.
 */
export function earnPlacesOf(plan: LevelPlan): EarnPlaceOf {
  return (island) => {
    const p = plan.places.find((q) => q.island === island);
    return p ? { at: p.at, to: placeReturn(p.id) } : null;
  };
}

/**
 * Un lieu du plan lu dans l'adresse de retour (`?lieu=quais`), s'il en est un ; ou, depuis l'écran d'une mission d'un
 * lieu du monde ouvert seulement (`?ile=maths-4e-data`, GD-24), le lieu du plan qui reprend cette île. Rien d'autre n'est lu.
 */
export function placeFromParam(plan: LevelPlan, value: string | null, island: string | null = null): PlaceId | null {
  return plan.places.find((p) => p.id === value)?.id ?? (island ? (plan.places.find((p) => p.island === island)?.id ?? null) : null);
}

/**
 * D'où ramène « Ma dernière mission » (accès direct), quand c'est une mission d'une île qui a son lieu
 * (`/adventure/<île>/<mission>`) : la liste de ce lieu, le focus sur elle ; sinon rien (son retour habituel).
 */
export function placeResume(path: string): string | undefined {
  const [, island, mission] = /^\/adventure\/([^/?#]+)\/([^/?#]+)$/.exec(path) ?? [];
  const place = island ? placeOfIsland(island) : undefined;
  return place && getIle(island)?.exercises.some((e) => e.id === mission) ? placeReturn(place.id, mission) : undefined;
}

interface Props {
  place: OpenPlace;
  /** Les missions du lieu, leurs bornes (`missionsOfPlace`), dans l'ordre de l'île. */
  missions: readonly MissionMark[];
  /** La prochaine mission, si elle est de ce lieu : sa ligne est mise en avant. */
  suggested: string | null;
  /**
   * La ligne qui prend le focus à l'ouverture : celle dont on revient ; sinon le bouton de la ligne de l'habitant, s'il en a
   * une ; sinon la suggérée, sinon la première.
   */
  focus: string | null;
  onPlay(mission: string): void;
  onClose(): void;
  /** La ligne de l'habitant (GD-20, point 4, lot L1), en tête du panneau, avant les missions ; rien s'il n'attend rien. */
  habitant?: ReactNode;
}

/**
 * Le panneau d'un lieu : sa liste de missions. Un lieu d'option dont l'élève n'a pas choisi l'option (l'Oracle sans
 * latin ni grec, l'Auberge sans LV2 ; GD-13) : jamais un panneau vide, la phrase de l'option et « Réécouter », puis un
 * seul bouton vers les Réglages, les mêmes mots que les écrans de l'archipel (proposition du consultant UX UI).
 */
export function PlacePanel({ place, missions, suggested, focus, onPlay, onClose, habitant }: Props) {
  useOpenPanel(onClose);
  // Après celui de la liste (l'effet d'un enfant passe avant celui du parent) : le bouton de la ligne de l'habitant prend
  // le focus, sans faire défiler, et le panneau revient en haut.
  const head = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focus) return;
    const button = head.current?.querySelector<HTMLElement>('.habitant-line-actions .button');
    if (!button) return;
    button.focus({ preventScroll: true });
    for (let el = head.current?.parentElement ?? null; el; el = el.parentElement) {
      el.scrollTop = 0;
      if (el.classList.contains('open-world-panel')) break;
    }
  }, [place.id, focus]);
  const biome = getIle(place.island);
  const { settings } = useSettings();
  const sansOption = sansSonOption(biome, settings);
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
    // Le signe des missions qui se jouent dans le lieu (référent dys) : une icône, le même partout, dite à la voix ;
    // celle dont un niveau se joue sur place, aux abords (GD-27, lot 6), le dit par ses pas (directeur artistique).
    sign:
      surPlaceOf(place.id)?.mission === m.mission ? (
        <span className="mission-sign" role="img" aria-label={SUR_PLACE_LABEL} title={SUR_PLACE_LABEL}>
          <Icon name="footprints" />
        </span>
      ) : playsInPlace(place, m.mission) ? (
        <span className="mission-sign" role="img" aria-label={IN_PLACE_LABEL} title={IN_PLACE_LABEL}>
          <Icon name="mountain" />
        </span>
      ) : null,
    suggested: m.mission === suggested,
    onSelect: () => onPlay(m.mission),
  }));
  return (
    <MissionSheet id="panneau-lieu" className={`place-sheet${biome ? ` biome-${biome.id}` : ''}`} icon={biome?.icon ?? 'map'} title={place.name} onClose={onClose}>
      <div ref={head} className="place-sheet-habitant">
        {habitant}
      </div>
      {sansOption ? (
        <>
          <p className="world-fiche-phrase">
            <Syllabified text={frenchTypography(sansOption.lu)} /> <SpeakButton text={frenchTypography(sansOption.lu)} label="Réécouter" compact />
          </p>
          <p>
            <Link to="/reglages" className="button">
              <Icon name="settings" /> {sansOption.bouton}
            </Link>
          </p>
        </>
      ) : (
        <MissionRows rows={rows} focus={focus ?? (missions.some((m) => m.mission === suggested) ? suggested : (missions[0]?.mission ?? null))} label={`Missions ${place.at}`} />
      )}
    </MissionSheet>
  );
}

import { createContext, useContext, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, type BiomeDef, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { InventoryLink } from './Inventory';
import { Foldable } from './IslandFold';
import { minuscule, partiePosee, partiesDe, phraseDesPartiesPosees, type Partie } from './world/parts';
import { SpeakButton } from '../components/SpeakButton';
import { frenchTypography } from '../components/math/RichText';
import { getPlan, plansFor } from './world/plans';
import { earnIsland, whereToEarn } from './world/uses';
import { ASSEMBLAGE_PATH } from './world/assembly';
import { useTextes } from '../universes';
import { useMoinsDAnimations } from '../core/motion';

interface Props {
  biome: BiomeDef;
  /** Dans le panneau 3D : la section est repliée (rien à y faire à la main ; la clé change avec l'île). */
  fold?: string;
  /** Le bâtiment mis en avant (« Voir le bâtiment », au bilan d'une mission qui pose une partie) : section ouverte, centrée. */
  highlight?: boolean;
  /** Sous un titre « Le bâtiment » (vue simple) : le seul nom du bâtiment. */
  titreCourt?: boolean;
  /** Les parties qui viennent de se poser dans le monde (GD-6) : la phrase « Partie posée : … », avec « Écouter », en tête. */
  vientDePoser?: Partie[] | null;
  /** Les parties que la vague pose encore dans le monde (GD-6) : comptées comme pas encore posées jusqu'à la fin. */
  enCoursDePose?: Partie[] | null;
}

/** Le lieu qui reprend les missions d'une île, au monde ouvert : où il est, en mots (« à la Montée »), et son adresse ; ou rien. */
export type EarnPlaceOf = (island: BiomeId) => { at: string; to: string } | null;

/**
 * Au monde ouvert, ce qu'un renvoi à une île montre : le lieu du plan (« La Montée »), pas l'île de la grille (consultant
 * d'Archipéo, retouche du lot 4 : chaque cadre nomme ce qu'il montre). Sans lui (la grille), l'île.
 */
export const EarnPlaces = createContext<EarnPlaceOf | null>(null);

/**
 * Où gagner un bloc, en mots : au monde ouvert, le lieu du plan (« à la Montée ») ; sinon l'île, ou un coffre (« dans
 * Forêt des sons », `whereToEarn`).
 */
export function useEarnWhere(): (block: BlockId) => string {
  const placeOf = useContext(EarnPlaces);
  return (block) => {
    const island = earnIsland(block);
    return (island && placeOf?.(island.id)?.at) ?? `dans ${whereToEarn(block)}`;
  };
}

/** « à gagner dans Forêt des sons » (un lien vers l'île), « ici, dans les missions », ou un coffre (`whereToEarn`). */
export function EarnLink({ block, here }: { block: BlockId; here?: BiomeId }) {
  const lieu = useTextes().assemblage;
  const placeOf = useContext(EarnPlaces);
  if (BLOCKS[block].assemble)
    return (
      <>
        à assembler <Link to={`${ASSEMBLAGE_PATH}?bloc=${block}`}>{lieu.a}</Link>
      </>
    );
  const island = earnIsland(block);
  if (!island) return <>à gagner dans {whereToEarn(block)}</>;
  if (island.id === here) return <>à gagner ici, dans les missions</>;
  const place = placeOf?.(island.id);
  return (
    <>
      {place ? 'à gagner ' : 'à gagner dans '}<Link to={place?.to ?? `/adventure/${island.id}`}>{place?.at ?? island.name}</Link>
    </>
  );
}

/** L'état du bâtiment en une ligne, pour le pli replié : « 2 parties posées sur 4 », ou « Fini ». */
function batimentSummary(posees: number, total: number): string {
  if (!total) return '';
  if (posees >= total) return 'Fini';
  return `${posees} partie${posees > 1 ? 's' : ''} posée${posees > 1 ? 's' : ''} sur ${total}`;
}

/**
 * Le bâtiment de l'île (GD-6) : il se pose tout seul, une partie par mission réussie. La section dit en mots combien de
 * parties sont posées, le nom de la prochaine et comment la poser, ou que le bâtiment est fini ; puis le lien vers
 * « Mes blocs » et le journal du village. Rien ne s'y pose à la main. Même contenu dans le panneau 3D et en vue simple.
 */
export function PlanSection({ biome, fold, highlight = false, titreCourt = false, vientDePoser = null, enCoursDePose = null }: Props) {
  const { state } = useBlocland();
  const reduceMotion = useMoinsDAnimations();
  const section = useRef<HTMLElement>(null);
  const phrase = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (highlight) section.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, biome.id]);
  const dite = vientDePoser?.length ? phraseDesPartiesPosees(vientDePoser) : '';
  // La phrase arrive : elle vient en vue dans le panneau, sans glisser si l'élève demande moins d'animations.
  useEffect(() => {
    if (dite) phrase.current?.scrollIntoView?.({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dite]);
  const parties = partiesDe(biome.id);
  const total = parties.length;
  // Pendant la vague, le compte reste à l'ancien : la partie n'est posée qu'au dernier cube.
  const enCours = new Set((enCoursDePose ?? []).map((p) => p.rang));
  const estPosee = (p: Partie) => !enCours.has(p.rang) && partiePosee(p, state.world.parts);
  const posees = parties.filter(estPosee).length;
  const prochaine = parties.find((p) => !estPosee(p)) ?? null;
  const plans = plansFor(biome.id);
  const built = state.world.log.filter((e) => getPlan(e.part)?.biome === biome.id);
  const heading = (
    <h3 id={`plan-${biome.id}`} className="island-sheet-heading">
      <Icon name="map" /> {total ? (titreCourt ? plans[0].name : `Le bâtiment : ${minuscule(plans[0].name)}`) : 'Aucun bâtiment sur cette île'}
    </h3>
  );
  return (
    <Foldable fold={fold} name="plan" heading={heading} status={batimentSummary(posees, total)} defaultOpen={highlight}>
      <section ref={section} className={`plan-section${highlight ? ' bridge-highlight' : ''}`} aria-labelledby={`plan-${biome.id}`}>
        {/* Montée vide en permanence : la phrase y entre, et les lecteurs d'écran la disent. */}
        <div role="status" className="plan-posee-region">
          {dite && (
            <p className="plan-posee" ref={phrase}>
              <Icon name="home" /> <strong>{dite}</strong> <SpeakButton text={frenchTypography(dite)} label="Écouter" compact />
            </p>
          )}
        </div>
        {total > 0 && (
          <>
            <div
              className="plan-track"
              role="progressbar"
              aria-label={`Le bâtiment ${plans[0].name}`}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={posees}
              aria-valuetext={batimentSummary(posees, total)}
            >
              <div className="plan-fill" style={{ width: `${Math.round((posees / total) * 100)}%` }} />
            </div>
            {prochaine ? (
              <>
                <p className="plan-count">
                  <strong>{posees}</strong> partie{posees > 1 ? 's' : ''} posée{posees > 1 ? 's' : ''} sur {total}
                </p>
                <p className="plan-next">
                  Prochaine partie : <strong>{minuscule(prochaine.nom)}</strong>.
                </p>
                <p className="plan-how">
                  <Icon name="play" />{' '}
                  <Syllabified text={posees ? 'Termine une autre mission de l’île pour la poser.' : 'Termine une mission de l’île pour la poser.'} />
                </p>
              </>
            ) : (
              <p className="plan-done">
                <Icon name="star" /> Le bâtiment est fini ! <Syllabified text={plans[plans.length - 1].done} />
              </p>
            )}
          </>
        )}
        <p className="island-inventory-link">
          <InventoryLink />
        </p>
        {built.length > 0 && (
          <p className="island-journal">
            <Icon name="flag" />
            {/* Un seul bloc de texte : le paragraphe est en flex, le point ne doit pas se détacher de la liste. */}
            <span>
              Terminé ici :{' '}
              {built
                .map((e) => `${getPlan(e.part)?.name} (${new Date(e.day + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })})`)
                .join(', ')}
              .
            </span>
          </p>
        )}
      </section>
    </Foldable>
  );
}

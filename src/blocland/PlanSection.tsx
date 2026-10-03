import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, type BiomeDef, type BiomeId, type BlockId } from './biomes';
import { useBlocland } from './BloclandContext';
import { InventoryLink } from './Inventory';
import { Foldable } from './IslandFold';
import { minuscule, partiesDe, partiesPosees, prochainePartie } from './world/parties';
import { getPlan, plansFor } from './world/plans';
import { earnIsland, whereToEarn } from './world/uses';
import { ASSEMBLAGE_PATH } from './world/assemblage';
import { useTextes } from '../univers';

interface Props {
  biome: BiomeDef;
  /** Dans le panneau 3D : la section est repliée (rien à y faire à la main ; la clé change avec l'île). */
  fold?: string;
  /** Le bâtiment mis en avant (« Voir le bâtiment », au bilan d'une mission qui pose une partie) : section ouverte, centrée. */
  highlight?: boolean;
  /** Sous un titre « Le bâtiment » (vue simple) : le seul nom du bâtiment. */
  titreCourt?: boolean;
}


/** « à gagner dans Forêt des sons » (un lien vers l'île), « ici, dans les missions », ou un coffre (`whereToEarn`). */
export function EarnLink({ block, here }: { block: BlockId; here?: BiomeId }) {
  const lieu = useTextes().assemblage;
  if (BLOCKS[block].assemble)
    return (
      <>
        à assembler <Link to={`${ASSEMBLAGE_PATH}?bloc=${block}`}>{lieu.a}</Link>
      </>
    );
  const island = earnIsland(block);
  if (!island) return <>à gagner dans {whereToEarn(block)}</>;
  if (island.id === here) return <>à gagner ici, dans les missions</>;
  return (
    <>
      à gagner dans <Link to={`/adventure/${island.id}`}>{island.name}</Link>
    </>
  );
}

/** L'état du bâtiment en une ligne, pour le pli replié : « 2 parties posées sur 4 », ou « Fini ». */
export function batimentSummary(posees: number, total: number): string {
  if (!total) return '';
  if (posees >= total) return 'Fini';
  return `${posees} partie${posees > 1 ? 's' : ''} posée${posees > 1 ? 's' : ''} sur ${total}`;
}

/**
 * Le bâtiment de l'île (GD-6) : il se pose tout seul, une partie par mission réussie. La section dit en mots combien de
 * parties sont posées, le nom de la prochaine et comment la poser, ou que le bâtiment est fini ; puis le lien vers
 * « Mes blocs » et le journal du village. Rien ne s'y pose à la main. Même contenu dans le panneau 3D et en vue simple.
 */
export function PlanSection({ biome, fold, highlight = false, titreCourt = false }: Props) {
  const { state } = useBlocland();
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (highlight) section.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [highlight, biome.id]);
  const parties = partiesDe(biome.id);
  const total = parties.length;
  const posees = partiesPosees(biome.id, state.world.parts);
  const prochaine = prochainePartie(biome.id, state.world.parts);
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

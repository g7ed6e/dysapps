import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BLOCKS, getBiome, ofBlock } from './biomes';
import {
  ARCHIPELAGOS,
  KIND_NAME,
  archipelagoOf,
  archipelagoTitle,
  buildableBridges,
  isArchipelagoReached,
  isBiomeUnlocked,
  islandsOf,
  remainingVoyages,
} from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { planStatus } from './engine';
import { Creature } from './Creatures';
import { BlockIcon } from './Voxel';
import { VEHICLE_NAME, stageAt, stageTo } from './world/vehicle';

/** Ce qu'il faut pour rejoindre un archipel fermé, en une phrase. */
function lockedArchipelagoText(state: ReturnType<typeof useBlocland>['state'], classe: (typeof ARCHIPELAGOS)[number]['classe']): string {
  const port = ARCHIPELAGOS.find((a) => a.classe === classe)!.port;
  const left = remainingVoyages(port, state.village.bridges);
  const first = stageTo(left[0].toClasse)!;
  const shipyard = getBiome(first.biome)?.name ?? first.biome;
  if (left.length === 1) return `Archipel fermé. Pour y aller, il faut ${VEHICLE_NAME} avec ${first.short} : construis-le au port, sur ${shipyard}.`;
  const steps = left.map((v) => stageTo(v.toClasse)!.short).join(', puis ');
  return `Archipel fermé. Il faut d’abord ${VEHICLE_NAME} avec ${steps}. Commence au port, sur ${shipyard}.`;
}

/** Carte de Blocland en vue simple : les quatre archipels, un par classe, et leurs îles. */
export function BloclandPage() {
  const { state } = useBlocland();
  const at = state.village.at ?? 'foret';
  const here = archipelagoOf(at).classe;
  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="back" /> Menu
      </Link>
      <section className="hero hero-blocland">
        <p className="hero-kicker">Aventure</p>
        <h1 className="hero-title">Blocland</h1>
        <p className="hero-text">
          <Syllabified text="Le village est en ruine. Toi, tu es le bâtisseur. Chaque exercice réussi te donne des blocs pour le reconstruire, puis le Bloc-Navire t’emmène d’archipel en archipel." />
        </p>
      </section>

      {ARCHIPELAGOS.map((a) => {
        const reached = isArchipelagoReached(a.classe, state.village.bridges);
        const stage = stageAt(a.port);
        const status = stage && reached ? planStatus(state, stage) : null;
        return (
          <section key={a.classe} className={`archipel${reached ? '' : ' archipel-locked'}`} aria-labelledby={`archipel-${a.classe}`}>
            <h2 id={`archipel-${a.classe}`} className="section-title">
              <Icon name="map" /> {archipelagoTitle(a.classe)}{' '}
              <span className={`tag${a.classe === here ? ' tag-new' : reached ? ' tag-ok' : ''}`}>{a.classe === here ? 'Tu es ici' : reached ? 'Ouvert' : 'Fermé'}</span>
            </h2>
            {!reached && (
              <p className="section-intro">
                <Syllabified text={lockedArchipelagoText(state, a.classe)} />
              </p>
            )}
            <ol className="biome-map">
              {islandsOf(a.classe).map((biome) => {
                const block = BLOCKS[biome.block];
                const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
                const bridge = unlocked || !reached ? undefined : buildableBridges(state.village.bridges, biome.id)[0];
                const owned = state.inventory[biome.block] ?? 0;
                return (
                  <li key={biome.id}>
                    <Link to={`/aventure/${biome.id}`} className={`panel biome-card biome-${biome.id}${unlocked ? '' : ' locked'}`}>
                      <Creature biome={biome.id} className="creature-small" />
                      <span className="biome-name">{biome.name}</span>
                      <span className="biome-module">
                        {biome.module} · Niveau {biome.classe}
                      </span>
                      <span className="biome-block">
                        <BlockIcon top={block.top} side={block.side} size={28} />
                        {owned} bloc{owned > 1 ? 's' : ''} {ofBlock(biome.block)}
                      </span>
                      {biome.id === a.port && (
                        <span className="tag">
                          <Icon name="ship" /> Port{status && !status.complete ? ` · Bloc-Navire ${status.done} / ${status.total}` : ''}
                        </span>
                      )}
                      {!unlocked && (
                        <span className="tag">
                          <Icon name="lock" />{' '}
                          {!reached ? 'Archipel à rejoindre' : bridge ? `${KIND_NAME[bridge.kind]} à construire : ${bridge.cost} blocs` : 'Île lointaine'}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </>
  );
}

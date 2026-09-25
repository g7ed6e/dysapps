import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BIOMES, BLOCKS, ofBlock } from './biomes';
import { KIND_NAME, buildableBridges, isBiomeUnlocked } from './world/archipelago';
import { useBlocland } from './BloclandContext';
import { Creature } from './Creatures';
import { BlockIcon } from './Voxel';

/** Carte du village : un biome par module, dans l'ordre conseillé. */
export function BloclandPage() {
  const { state } = useBlocland();
  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="back" /> Menu
      </Link>
      <section className="hero hero-blocland">
        <p className="hero-kicker">Aventure</p>
        <h1 className="hero-title">Blocland</h1>
        <p className="hero-text">
          <Syllabified text="Le village est en ruine. Toi, tu es le bâtisseur. Chaque exercice réussi te donne des blocs pour le reconstruire." />
        </p>
      </section>

      <h2 className="section-title">
        <Icon name="map" /> Les biomes
      </h2>
      <ol className="biome-map">
        {BIOMES.map((biome) => {
          const block = BLOCKS[biome.block];
          const unlocked = isBiomeUnlocked(biome.id, state.village.bridges);
          const bridge = unlocked ? undefined : buildableBridges(state.village.bridges, biome.id)[0];
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
                {!unlocked && (
                  <span className="tag">
                    <Icon name="lock" /> {bridge ? `${KIND_NAME[bridge.kind]} à construire : ${bridge.cost} blocs` : 'Île lointaine'}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BIOMES, BLOCKS, isBiomeUnlocked } from './biomes';
import { useBlocland } from './BloclandContext';
import { Creature } from './Creatures';
import { BlockIcon } from './Voxel';
import { BloclandMap3D } from './BloclandMap3D';

/** Carte du village : un biome par module, dans l'ordre conseillé. */
export function BloclandPage() {
  const { state } = useBlocland();
  const totalBlocks = Object.values(state.inventory).reduce((a, b) => a + (b ?? 0), 0);
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

      <BloclandMap3D />

      <Link to="/aventure/chantier" className="panel chantier-card">
        <span className="chantier-icon">
          <Icon name="hammer" size="2rem" />
        </span>
        <span className="adventure-text">
          <span className="adventure-title">Chantier</span>
          <span className="adventure-desc">
            {totalBlocks} bloc{totalBlocks > 1 ? 's' : ''} dans l’inventaire, {state.build.length} posé{state.build.length > 1 ? 's' : ''}. Viens construire !
          </span>
        </span>
        <span className="subject-count">
          Construire <Icon name="play" />
        </span>
      </Link>

      <h2 className="section-title">
        <Icon name="map" /> Les biomes
      </h2>
      <ol className="biome-map">
        {BIOMES.map((biome, i) => {
          const block = BLOCKS[biome.block];
          const unlocked = isBiomeUnlocked(biome.id, state.progress);
          const owned = state.inventory[biome.block] ?? 0;
          return (
            <li key={biome.id}>
              <Link to={`/aventure/${biome.id}`} className={`panel biome-card biome-${biome.id}${unlocked ? '' : ' locked'}`}>
                <span className="biome-step" aria-hidden="true">
                  {i + 1}
                </span>
                <Creature biome={biome.id} className="creature-small" />
                <span className="biome-name">{biome.name}</span>
                <span className="biome-module">{biome.module}</span>
                <span className="biome-block">
                  <BlockIcon top={block.top} side={block.side} size={28} />
                  {owned} bloc{owned > 1 ? 's' : ''} de {block.name.toLowerCase()}
                </span>
                {!unlocked && (
                  <span className="tag">
                    <Icon name="lock" /> Termine une quête de {BIOMES[i - 1].name}
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

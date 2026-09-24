import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Syllabified } from '../components/Syllabified';
import { BIOMES, BLOCKS } from './biomes';
import { Creature } from './Creatures';
import { BlockIcon } from './Voxel';

/** Carte du village : un biome par module, dans l'ordre conseillé. */
export function BloclandPage() {
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
        {BIOMES.map((biome, i) => {
          const block = BLOCKS[biome.block];
          return (
            <li key={biome.id}>
              <Link to={`/aventure/${biome.id}`} className={`panel biome-card biome-${biome.id}`}>
                <span className="biome-step" aria-hidden="true">
                  {i + 1}
                </span>
                <Creature biome={biome.id} className="creature-small" />
                <span className="biome-name">{biome.name}</span>
                <span className="biome-module">{biome.module}</span>
                <span className="biome-block">
                  <BlockIcon top={block.top} side={block.side} size={28} />
                  Blocs de {block.name.toLowerCase()}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}

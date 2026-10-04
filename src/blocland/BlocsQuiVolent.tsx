// Les blocs qui volent jusqu'au compteur (proposition P2, PR 2, Blocland ; quand et combien : volDesBlocs.ts) : trois
// petits blocs au plus, le cube du bloc gagné (celui de l'écran de fin), 32 px, sans éclat ni traînée, de la borne de
// la mission jusqu'à la pastille du bouton Blocs, en arc simple, 0,6 s chacun, départs à 0,1 s d'écart. Décoratifs :
// ni lus ni touchables (le nouveau nombre n'est pas annoncé, l'écran de fin l'a déjà dit).
import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { BLOCKS, type BlockId } from './biomes';
import { BlockIcon } from './Voxel';
import { VOL, blocsDuVol, dureeDuVol } from './volDesBlocs';

interface Props {
  bloc: BlockId;
  nombre: number;
  /** D'où ils partent et où ils arrivent, en pixels de la fenêtre (le centre de la pastille). */
  depart: { x: number; y: number };
  arrivee: { x: number; y: number };
  /** Le dernier est arrivé : la pastille change de chiffre. */
  onArrive: () => void;
}

export function BlocsQuiVolent({ bloc, nombre, depart, arrivee, onArrive }: Props) {
  const n = blocsDuVol(nombre);
  useEffect(() => {
    const timer = window.setTimeout(onArrive, dureeDuVol(nombre));
    return () => window.clearTimeout(timer);
    // Une fois par vol (la page le remonte à chaque vol).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const b = BLOCKS[bloc];
  const style = {
    left: `${arrivee.x}px`,
    top: `${arrivee.y}px`,
    '--vol-dx': `${depart.x - arrivee.x}px`,
    '--vol-dy': `${depart.y - arrivee.y}px`,
    '--vol-ms': `${VOL.trajetMs}ms`,
  } as CSSProperties;
  return (
    <div className="vol-des-blocs" style={style} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="vol-bloc" style={{ animationDelay: `${i * VOL.ecartMs}ms` }}>
          <span className="vol-bloc-arc" style={{ animationDelay: `${i * VOL.ecartMs}ms` }}>
            {b && <BlockIcon top={b.top} side={b.side} size={32} />}
          </span>
        </span>
      ))}
    </div>
  );
}

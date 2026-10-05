import { ARCHIPELAGOS, isArchipelagoReached, type ArchipelagoId } from './world/archipelago';
import { useTextes } from '../universes';

interface Props {
  bridges: string[];
  /** L'archipel où se tient le bonhomme. */
  here: ArchipelagoId;
  className?: string;
}

/** Où chaque archipel se trouve sur la carte (une route de gauche à droite), et la forme de ses îles. */
const PLACES: Record<ArchipelagoId, { x: number; y: number }> = {
  '6e': { x: 62, y: 118 },
  '5e': { x: 162, y: 62 },
  '4e': { x: 262, y: 118 },
  '3e': { x: 350, y: 58 },
};
const ISLETS = [
  { dx: -18, dy: -4, rx: 20, ry: 13 },
  { dx: 16, dy: -12, rx: 15, ry: 10 },
  { dx: 10, dy: 14, rx: 17, ry: 11 },
];

/**
 * La carte des quatre archipels, dessinée en code et en lecture seule : une route du Bloc-Navire de la 6e à la 3e, les
 * archipels atteints en îles pleines, les autres dans la brume. Chaque archipel porte sa classe ; les mots (nom, « Tu
 * es ici », « Dans la brume ») sont dans la liste qui l'accompagne, et la phrase de l'image les redit.
 */
export function ArchipelagoMap({ bridges, here, className = '' }: Props) {
  const textes = useTextes();
  const label = ARCHIPELAGOS.map(
    (a) => `${a.classe}, les ${textes.archipels[a.classe]} : ${a.classe === here ? 'tu es ici' : isArchipelagoReached(a.classe, bridges) ? 'atteint' : 'dans la brume'}`,
  ).join(' ; ');
  const route = ARCHIPELAGOS.map((a, i) => `${i ? 'L' : 'M'}${PLACES[a.classe].x} ${PLACES[a.classe].y}`).join(' ');
  return (
    <svg className={`archipelago-map ${className}`} viewBox="0 0 410 180" role="img" aria-label={`Carte des quatre archipels. ${label}.`}>
      <path className="archipelago-map-route" d={route} />
      {ARCHIPELAGOS.map((a) => {
        const { x, y } = PLACES[a.classe];
        const reached = isArchipelagoReached(a.classe, bridges);
        return (
          <g key={a.classe} className={`archipelago-map-place${reached ? ' reached' : ' mist'}${a.classe === here ? ' here' : ''}`}>
            {ISLETS.map((s, i) => (
              <ellipse key={i} className="archipelago-map-islet" cx={x + s.dx} cy={y + s.dy} rx={s.rx} ry={s.ry} />
            ))}
            {!reached && (
              // La brume : trois bancs clairs posés sur les îles.
              <g className="archipelago-map-cloud">
                <ellipse cx={x - 12} cy={y - 2} rx={30} ry={11} />
                <ellipse cx={x + 16} cy={y + 6} rx={26} ry={10} />
                <ellipse cx={x + 2} cy={y - 14} rx={20} ry={8} />
              </g>
            )}
            {a.classe === here && <circle className="archipelago-map-here" cx={x} cy={y} r={44} />}
            <text className="archipelago-map-label" x={x} y={y + 50} textAnchor="middle">
              {a.classe}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

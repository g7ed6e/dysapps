import {
  Amphora,
  Anchor,
  Menu,
  ArrowLeft,
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  Move,
  RotateCw,
  Undo2,
  Unlink,
  Merge,
  Blocks,
  BookOpen,
  Box,
  Calculator,
  Castle,
  ChevronDown,
  ChevronRight,
  Ship,
  Check,
  CircleHelp,
  Compass,
  Container,
  Crown,
  Droplets,
  Dumbbell,
  Factory,
  Feather,
  Flag,
  Flame,
  Footprints,
  Gem,
  Globe,
  Hammer,
  History,
  House,
  Landmark,
  Library,
  List,
  Languages,
  Lightbulb,
  Lock,
  Map,
  MapPinHouse,
  Pause,
  Medal,
  Mountain,
  Pickaxe,
  Pizza,
  Play,
  RotateCcw,
  Ruler,
  School,
  Settings,
  Shuffle,
  Moon,
  Newspaper,
  Route,
  Shield,
  Sparkles,
  Sun,
  Square,
  SquareDashed,
  Star,
  Target,
  TreePine,
  Trophy,
  Volume2,
  VolumeX,
  Wheat,
  X,
  Zap,
  createLucideIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { CHEMIN_DE_L_OUVRAGE } from './linkIcon';

/** Un ouvrage (GD-7) : la même image que la plaque de la flèche de la Carte (./linkIcon.ts). */
const Ouvrage = createLucideIcon('ouvrage', [['path', { d: CHEMIN_DE_L_OUVRAGE, key: 'ouvrage' }]]);

export const ICONS = {
  back: ArrowLeft,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  blocks: Blocks,
  book: BookOpen,
  calculator: Calculator,
  castle: Castle,
  ship: Ship,
  check: Check,
  help: CircleHelp,
  close: X,
  compass: Compass,
  hammer: Hammer,
  map: Map,
  pickaxe: Pickaxe,
  sparkles: Sparkles,
  tree: TreePine,
  wheat: Wheat,
  crown: Crown,
  dumbbell: Dumbbell,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gem: Gem,
  globe: Globe,
  history: History,
  home: House,
  amphora: Amphora,
  landmark: Landmark,
  library: Library,
  'map-pin-house': MapPinHouse,
  feather: Feather,
  droplets: Droplets,
  factory: Factory,
  container: Container,
  newspaper: Newspaper,
  route: Route,
  languages: Languages,
  lightbulb: Lightbulb,
  lock: Lock,
  medal: Medal,
  mountain: Mountain,
  pizza: Pizza,
  play: Play,
  replay: RotateCcw,
  ruler: Ruler,
  school: School,
  settings: Settings,
  shuffle: Shuffle,
  stop: Square,
  speaker: Volume2,
  star: Star,
  target: Target,
  trophy: Trophy,
  shield: Shield,
  sun: Sun,
  moon: Moon,
  volume: Volume2,
  volumeOff: VolumeX,
  zap: Zap,
  pause: Pause,
  // Le menu (trois traits) : partout où l'on ouvre le menu ; ⏸ reste la pause d'une partie (mode concentration).
  menu: Menu,
  ancre: Anchor,
  cube: Box,
  ouvrage: Ouvrage,
  // Le mode « Aménager » (GD-9) : quatre flèches, les flèches de la barre, « Tourner », ↶, une liaison à reposer.
  amenager: Move,
  nord: ArrowUp,
  sud: ArrowDown,
  est: ArrowRight,
  ouest: ArrowLeft,
  // Les quatre diagonales, de la même famille : les huit directions de la ligne de place (GD-9, piste A).
  nordOuest: ArrowUpLeft,
  nordEst: ArrowUpRight,
  sudOuest: ArrowDownLeft,
  sudEst: ArrowDownRight,
  // Une case de la grille des places : le carré pointillé, le même dessin que la place libre sur la Carte.
  case: SquareDashed,
  // La vue en liste (« En liste »).
  liste: List,
  tourner: RotateCw,
  defaire: Undo2,
  // « Poser » : une flèche vers le bas, sur un trait.
  poser: ArrowDownToLine,
  aReposer: Unlink,
  // Réunir deux lieux (GD-9, point 10) : deux chemins qui se rejoignent.
  reunir: Merge,
} satisfies Record<string, LucideIcon>;

export type AnyIconName = keyof typeof ICONS;

interface Props {
  name: AnyIconName;
  size?: number | string;
  className?: string;
}

/** Icône décorative (masquée aux lecteurs d'écran : le texte voisin porte le sens). */
export function Icon({ name, size = '1.2em', className }: Props) {
  const Component = ICONS[name];
  return <Component size={size} strokeWidth={2.5} className={className} aria-hidden="true" focusable="false" />;
}

/**
 * Un bouton d'icône : l'icône seule, son nom pour les lecteurs d'écran (`nom`), et son mot (`mot`, le nom par défaut)
 * écrit dessous en grand texte seulement, comme la barre du monde.
 */
export function IconButton({ icone, nom, mot = nom, className, ...rest }: { icone: AnyIconName; nom: string; mot?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  return (
    <button type="button" className={`button bouton-icone${className ? ` ${className}` : ''}`} aria-label={nom} {...rest}>
      <Icon name={icone} />
      <span className="mot-sous-icone" aria-hidden="true">
        {mot}
      </span>
    </button>
  );
}

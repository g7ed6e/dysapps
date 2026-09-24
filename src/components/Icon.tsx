import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Check,
  Compass,
  Crown,
  Dumbbell,
  Flag,
  Flame,
  Footprints,
  Gem,
  House,
  Library,
  Lightbulb,
  Lock,
  Medal,
  Mountain,
  Pizza,
  Play,
  RotateCcw,
  Ruler,
  Settings,
  Shuffle,
  Square,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS = {
  back: ArrowLeft,
  book: BookOpen,
  calculator: Calculator,
  check: Check,
  close: X,
  compass: Compass,
  crown: Crown,
  dumbbell: Dumbbell,
  flag: Flag,
  flame: Flame,
  footprints: Footprints,
  gem: Gem,
  home: House,
  library: Library,
  lightbulb: Lightbulb,
  lock: Lock,
  medal: Medal,
  mountain: Mountain,
  pizza: Pizza,
  play: Play,
  replay: RotateCcw,
  ruler: Ruler,
  settings: Settings,
  shuffle: Shuffle,
  stop: Square,
  speaker: Volume2,
  star: Star,
  target: Target,
  trophy: Trophy,
  zap: Zap,
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

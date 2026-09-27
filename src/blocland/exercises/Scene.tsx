// Les schémas des problèmes situés dans l'archipel (mission « Chantiers du rivage ») : un pont, un quai, une traversée,
// dessinés à plat à partir de données. Chaque schéma porte au plus un « ? », la grandeur cherchée, en couleur.

/** Une cote : un nombre connu, ou « ? » pour la grandeur cherchée. */
export type Cote = number | '?';

export type SceneProps =
  /** Un pont d'une falaise à l'autre, en travées : une cote sous chaque travée, l'écart total au-dessus. */
  | { scene: 'pont'; unit: 'm'; parts: Cote[]; total: Cote }
  /** Un quai rectangulaire vu du dessus, à clôturer ; l'entrée, s'il y en a une, reste sans clôture. */
  | { scene: 'quai'; unit: 'm'; longueur: Cote; largeur: Cote; entree?: number; perimetre?: Cote; ask: 'perimetre' }
  /** Une traversée en bateau d'une île à l'autre : heures en minutes depuis minuit, durée en minutes. */
  | { scene: 'traversee'; depart: Cote; arrivee: Cote; duree: Cote };

/** 580 → « 9 h 40 », 605 → « 10 h 05 ». */
export function formatHeure(min: number): string {
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

/** 35 → « 35 min », 75 → « 1 h 15 min », 60 → « 1 h ». */
export function formatDuree(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const cote = (c: Cote, unit: string) => (c === '?' ? '?' : `${c} ${unit}`);
const spoken = (c: Cote, unit: string) => (c === '?' ? 'inconnu' : `${c} ${unit === 'm' ? 'mètres' : unit}`);
const cls = (c: Cote) => (c === '?' ? 'len ask' : 'len');

/** Une cote tracée : un trait fléché aux deux bouts et son texte. */
function Dim({ x1, x2, y, label, c, above = false }: { x1: number; x2: number; y: number; label: string; c: Cote; above?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} className="dim" markerStart="url(#scene-arrow)" markerEnd="url(#scene-arrow)" />
      <line x1={x1} y1={y - 7} x2={x1} y2={y + 7} className="dim" />
      <line x1={x2} y1={y - 7} x2={x2} y2={y + 7} className="dim" />
      <text x={(x1 + x2) / 2} y={above ? y - 12 : y + 26} textAnchor="middle" className={cls(c)}>
        {label}
      </text>
    </g>
  );
}

function Arrow() {
  return (
    <defs>
      <marker id="scene-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="dim-head" />
      </marker>
    </defs>
  );
}

function Pont({ unit, parts, total }: { unit: string; parts: Cote[]; total: Cote }) {
  // Largeur de chaque travée : la cote connue, ou ce qu'il reste du total ; sans total connu, toutes égales.
  const known = parts.reduce<number>((s, p) => s + (p === '?' ? 0 : p), 0);
  const missing = typeof total === 'number' ? Math.max(total - known, 1) : 0;
  const sizes = parts.map((p) => (p === '?' ? missing : p));
  const sum = sizes.reduce((s, v) => s + v, 0) || 1;
  const [x0, x1] = [48, 332];
  let x = x0;
  const spans = sizes.map((v) => {
    const w = ((x1 - x0) * v) / sum;
    const s = { a: x, b: x + w };
    x += w;
    return s;
  });
  const label = `Un pont entre deux falaises, en ${parts.length} travées : ${parts.map((p) => spoken(p, unit)).join(', ')}. Écart total : ${spoken(total, unit)}.`;
  return (
    <svg viewBox="0 0 380 210" role="img" aria-label={label}>
      <Arrow />
      <Dim x1={x0} x2={x1} y={48} label={cote(total, unit)} c={total} above />
      <path d="M 0 96 L 48 96 L 48 210 L 0 210 z" className="cliff" />
      <path d="M 332 96 L 380 96 L 380 210 L 332 210 z" className="cliff" />
      <path d="M 48 170 Q 190 196 332 170 L 332 210 L 48 210 z" className="water" />
      {spans.map((s, i) => (
        <g key={i}>
          <rect x={s.a} y={92} width={s.b - s.a} height={12} className="deck" />
          {i > 0 && <line x1={s.a} y1={104} x2={s.a} y2={170} className="pile" />}
          <Dim x1={s.a} x2={s.b} y={124} label={cote(parts[i], unit)} c={parts[i]} />
        </g>
      ))}
    </svg>
  );
}

function Quai({ unit, longueur, largeur, entree, perimetre }: { unit: string; longueur: Cote; largeur: Cote; entree?: number; perimetre?: Cote }) {
  // Les proportions suivent les cotes connues, sans aller jusqu'au quai trop fin pour y écrire.
  const ratio = typeof longueur === 'number' && typeof largeur === 'number' ? Math.min(Math.max(largeur / longueur, 0.35), 0.8) : 0.5;
  const w = 240;
  const h = Math.round(w * ratio);
  const [x, y] = [90, 40];
  const gap = entree && typeof longueur === 'number' ? Math.max((w * entree) / longueur, 24) : 0;
  const g0 = x + (w - gap) / 2;
  const label =
    `Un quai rectangulaire vu du dessus : longueur ${spoken(longueur, unit)}, largeur ${spoken(largeur, unit)}` +
    `${entree ? `, une entrée de ${spoken(entree, unit)} sans clôture` : ''}` +
    `${perimetre !== undefined ? `. Tour du quai : ${spoken(perimetre, unit)}` : ''}.`;
  return (
    <svg viewBox={`0 0 380 ${y + h + (entree ? 96 : 64)}`} role="img" aria-label={label}>
      <Arrow />
      <rect x={x} y={y} width={w} height={h} className="quay" />
      {/* La clôture : tout le tour, sauf l'entrée. */}
      <path
        d={gap ? `M ${g0} ${y + h} L ${x} ${y + h} L ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${g0 + gap} ${y + h}` : `M ${x} ${y} h ${w} v ${h} h ${-w} z`}
        className="fence"
      />
      {/* Côtés égaux codés : un trait sur les longueurs, deux sur les largeurs. */}
      <line x1={x + w / 2} y1={y - 7} x2={x + w / 2} y2={y + 7} className="tick" />
      {!gap && <line x1={x + w / 2} y1={y + h - 7} x2={x + w / 2} y2={y + h + 7} className="tick" />}
      {[x, x + w].map((cx) => (
        <g key={cx}>
          <line x1={cx - 7} y1={y + h / 2 - 4} x2={cx + 7} y2={y + h / 2 - 4} className="tick" />
          <line x1={cx - 7} y1={y + h / 2 + 4} x2={cx + 7} y2={y + h / 2 + 4} className="tick" />
        </g>
      ))}
      <text x={x + w / 2} y={y - 14} textAnchor="middle" className={cls(longueur)}>
        {cote(longueur, unit)}
      </text>
      <text x={x - 14} y={y + h / 2 + 6} textAnchor="end" className={cls(largeur)}>
        {cote(largeur, unit)}
      </text>
      {gap > 0 && <Dim x1={g0} x2={g0 + gap} y={y + h + 22} label={`entrée ${entree} ${unit}`} c={entree!} />}
      {perimetre !== undefined && (
        <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" className={cls(perimetre)}>
          {`tour : ${cote(perimetre, unit)}`}
        </text>
      )}
    </svg>
  );
}

function Traversee({ depart, arrivee, duree }: { depart: Cote; arrivee: Cote; duree: Cote }) {
  const h = (c: Cote) => (c === '?' ? '?' : formatHeure(c));
  const d = duree === '?' ? '?' : formatDuree(duree);
  const label = `Une traversée en bateau d'une île à l'autre. Départ : ${depart === '?' ? 'inconnu' : formatHeure(depart)}. Durée : ${duree === '?' ? 'inconnue' : formatDuree(duree)}. Arrivée : ${arrivee === '?' ? 'inconnue' : formatHeure(arrivee)}.`;
  return (
    <svg viewBox="0 0 380 190" role="img" aria-label={label}>
      <path d="M 0 150 Q 190 132 380 150 L 380 190 L 0 190 z" className="water" />
      <ellipse cx="52" cy="130" rx="50" ry="20" className="island" />
      <ellipse cx="328" cy="130" rx="50" ry="20" className="island" />
      <path d="M 96 118 Q 190 60 284 118" className="route" />
      {/* Le bateau, au milieu de la route. */}
      <path d="M 174 88 h 32 l -6 10 h -20 z" className="boat" />
      <path d="M 190 88 v -20 l 12 16 z" className="boat" />
      <text x="190" y="46" textAnchor="middle" className={cls(duree)}>
        {`durée : ${d}`}
      </text>
      <text x="52" y="176" textAnchor="middle" className="pt">
        Départ
      </text>
      <text x="52" y="100" textAnchor="middle" className={cls(depart)}>
        {h(depart)}
      </text>
      <text x="328" y="176" textAnchor="middle" className="pt">
        Arrivée
      </text>
      <text x="328" y="100" textAnchor="middle" className={cls(arrivee)}>
        {h(arrivee)}
      </text>
    </svg>
  );
}

/** Le schéma de la situation : pont, quai ou traversée, à plat, la grandeur cherchée marquée « ? ». */
export function Scene(props: SceneProps) {
  return (
    <figure className={`scene-figure scene-${props.scene}`}>
      {props.scene === 'pont' && <Pont {...props} />}
      {props.scene === 'quai' && <Quai {...props} />}
      {props.scene === 'traversee' && <Traversee {...props} />}
    </figure>
  );
}

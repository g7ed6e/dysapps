// Les schémas des problèmes situés dans l'archipel (mission « Carnet du passeur », niveaux situés du collège) : un pont,
// un quai, une traversée, une carte, une cargaison, un mât, une route, une ombre, dessinés à plat à partir de données. Chaque schéma porte au plus un « ? », la grandeur cherchée, en couleur.

/** Une cote : un nombre connu, ou « ? » pour la grandeur cherchée. */
export type Side = number | '?';

export type SceneProps =
  /** Un pont d'une falaise à l'autre, en travées : une cote sous chaque travée, l'écart total au-dessus. */
  | { scene: 'pont'; unit: 'm'; parts: Side[]; total: Side }
  /** Un quai rectangulaire vu du dessus, à clôturer ; l'entrée, s'il y en a une, reste sans clôture. */
  | { scene: 'quai'; unit: 'm'; longueur: Side; largeur: Side; entree?: number; perimetre?: Side; ask: 'perimetre' }
  /** Une traversée en bateau d'une île à l'autre : heures en minutes depuis minuit, durée en minutes. */
  | { scene: 'traversee'; depart: Side; arrivee: Side; duree: Side }
  /** Une carte à l'échelle : deux îles, la distance mesurée sur la carte (en cm), l'échelle, et la distance en vrai. */
  | { scene: 'carte'; echelle: { reel: number; unit: 'm' | 'km' } | { fraction: number }; carte: Side; reel: Side; unitReel: 'm' | 'km' }
  /**
   * Une cargaison partagée entre navires selon un ratio : une rangée de cases égales par navire, le total sous l'accolade.
   * `null` : une quantité ni donnée ni cherchée, pas écrite (sinon on trouverait la réponse par une simple soustraction).
   */
  | { scene: 'cargaison'; unit: 'caisses' | 'kg'; ratio: number[]; total: Side | null; parts: (Side | null)[] }
  /** Un mât vertical tenu par un câble jusqu'au sol : un triangle rectangle, l'angle droit codé au pied du mât. */
  | { scene: 'mat'; unit: 'm'; hauteur: Side; pied: Side; cable: Side }
  /** Une traversée à vitesse constante d'une île à l'autre : la distance (km), la durée (minutes), la vitesse (km/h). */
  | { scene: 'route'; distance: Side; duree: Side; vitesse: Side }
  /**
   * Un bâton et un mât verticaux, et leurs ombres au sol qui finissent au même point (Thalès) : les hauts du bâton et du
   * mât sont sur le même rayon de soleil.
   */
  | { scene: 'ombre'; unit: 'm'; baton: Side; ombreBaton: Side; hauteur: Side; ombre: Side };

/** 2250 → « 2 250 », 50000 → « 50 000 », 1.5 → « 1,5 » (écriture française, espace insécable entre les classes). */
export function formatNombre(n: number): string {
  const [int, dec] = String(n).split('.');
  const grouped = int.length > 3 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : int;
  return dec ? `${grouped},${dec}` : grouped;
}

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

/** 90 → « 1 heure 30 minutes », 45 → « 45 minutes » : une durée lue à voix haute (jamais nulle). */
export function sayDuree(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const hours = h ? `${h} heure${h > 1 ? 's' : ''}` : '';
  const mins = m ? `${m} minutes` : '';
  return [hours, mins].filter(Boolean).join(' ');
}

const UNIT_SPOKEN: Record<string, string> = { m: 'mètres', km: 'kilomètres', cm: 'centimètres', kg: 'kilos' };
const cote = (c: Side, unit: string) => (c === '?' ? '?' : `${formatNombre(c)} ${unit}`);
/**
 * Au-dessous de 2, l’unité reste au singulier : « 1 mètre », « 1,5 kilo ». Pour une unité d’un seul mot : « kilomètres
 * par heure » ne passe pas par ici.
 */
export const singulier = (n: number, unit: string): string => (Math.abs(n) < 2 ? unit.replace(/s$/, '') : unit);
const spoken = (c: Side, unit: string) => (c === '?' ? 'inconnu' : `${formatNombre(c)} ${singulier(c, UNIT_SPOKEN[unit] ?? unit)}`);
const cls = (c: Side) => (c === '?' ? 'len ask' : 'len');

/** Une cote tracée : un trait fléché aux deux bouts et son texte. */
function Dim({ x1, x2, y, label, c, above = false }: { x1: number; x2: number; y: number; label: string; c: Side; above?: boolean }) {
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

function Pont({ unit, parts, total }: { unit: string; parts: Side[]; total: Side }) {
  // Largeur de chaque travée : la cote connue, ou ce qu'il reste du total ; sans total connu, toutes égales.
  const known = parts.reduce<number>((s, p) => s + (p === '?' ? 0 : p), 0);
  const missing = typeof total === 'number' ? Math.max(total - known, 1) : 0;
  const sizes = parts.map((p) => (p === '?' ? missing : p));
  const [x0, x1] = [48, 332];
  // Une travée garde au moins la place d'écrire sa cote, même courte ; les autres se partagent le reste.
  const min = 72;
  const sum = sizes.reduce((s, v) => s + v, 0) || 1;
  const small = sizes.map((v) => ((x1 - x0) * v) / sum < min);
  const rest = sizes.reduce((s, v, i) => s + (small[i] ? 0 : v), 0) || 1;
  const free = x1 - x0 - min * small.filter(Boolean).length;
  let x = x0;
  const spans = sizes.map((v, i) => {
    const w = small[i] ? min : (free * v) / rest;
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

function Quai({ unit, longueur, largeur, entree, perimetre }: { unit: string; longueur: Side; largeur: Side; entree?: number; perimetre?: Side }) {
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

function Traversee({ depart, arrivee, duree }: { depart: Side; arrivee: Side; duree: Side }) {
  const h = (c: Side) => (c === '?' ? '?' : formatHeure(c));
  const d = duree === '?' ? '?' : formatDuree(duree);
  const label = `Une traversée en bateau d’une île à l’autre. Départ : ${depart === '?' ? 'inconnu' : formatHeure(depart)}. Durée : ${duree === '?' ? 'inconnue' : formatDuree(duree)}. Arrivée : ${arrivee === '?' ? 'inconnue' : formatHeure(arrivee)}.`;
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

function Carte({ echelle, carte, reel, unitReel }: { echelle: { reel: number; unit: 'm' | 'km' } | { fraction: number }; carte: Side; reel: Side; unitReel: 'm' | 'km' }) {
  const scale = 'fraction' in echelle ? `1/${formatNombre(echelle.fraction)}` : `1 cm pour ${formatNombre(echelle.reel)} ${echelle.unit}`;
  const scaleSpoken = 'fraction' in echelle ? `1 sur ${formatNombre(echelle.fraction)}` : `1 centimètre pour ${spoken(echelle.reel, echelle.unit)}`;
  const label = `Une carte avec deux îles. Échelle : ${scaleSpoken}. Sur la carte, entre les deux îles : ${spoken(carte, 'cm')}. En vrai : ${spoken(reel, unitReel)}.`;
  return (
    <svg viewBox="0 0 380 230" role="img" aria-label={label}>
      <Arrow />
      <rect x="8" y="8" width="364" height="160" rx="6" className="map" />
      <ellipse cx="74" cy="84" rx="44" ry="30" className="island" />
      <ellipse cx="306" cy="84" rx="44" ry="30" className="island" />
      <Dim x1={74} x2={306} y={84} label={cote(carte, 'cm')} c={carte} above />
      <circle cx="74" cy="84" r="4" className="dim-head" />
      <circle cx="306" cy="84" r="4" className="dim-head" />
      <rect x="80" y="126" width="220" height="32" rx="4" className="cartouche" />
      <text x="190" y="149" textAnchor="middle" className="pt">
        {scale}
      </text>
      <text x="190" y="206" textAnchor="middle" className={cls(reel)}>
        {`en vrai : ${cote(reel, unitReel)}`}
      </text>
    </svg>
  );
}

const SHIPS = ['A', 'B', 'C'];

function Cargaison({ unit, ratio, total, parts }: { unit: string; ratio: number[]; total: Side | null; parts: (Side | null)[] }) {
  // Toutes les cases ont la même taille : c'est ce qui fait voir le partage en parts égales.
  const box = Math.min(36, 120 / Math.max(...ratio));
  const rowH = 44;
  const [x0, y0] = [104, 20];
  const h = y0 + ratio.length * rowH;
  // Une largeur de texte estimée (police dys de 18 px) pour placer l'accolade après la plus longue cote ; le total s'écrit dessous.
  const textW = (t: string) => t.length * 10.5;
  const bx = Math.max(...ratio.map((r, i) => x0 + r * box + 10 + textW(parts[i] === null ? '' : cote(parts[i], unit)))) + 12;
  const width = Math.max(380, bx + 24);
  const label = `Une cargaison ${total === null ? '' : `de ${spoken(total, unit)} `}partagée entre ${ratio.length} navires dans le ratio ${ratio.length > 2 ? `${ratio.slice(0, -1).join(', ')} et ${ratio[ratio.length - 1]}` : ratio.join(' pour ')}. ${ratio
    .map((r, i) => `Navire ${SHIPS[i]}, ${r} part${r > 1 ? 's' : ''}${parts[i] === null ? '' : ` : ${spoken(parts[i], unit)}`}`)
    .join('. ')}.`;
  return (
    <svg viewBox={`0 0 ${Math.round(width)} ${h + 44}`} role="img" aria-label={label}>
      {ratio.map((r, i) => {
        const y = y0 + i * rowH;
        return (
          <g key={i}>
            <text x={x0 - 12} y={y + 24} textAnchor="end" className="pt">
              {`Navire ${SHIPS[i]}`}
            </text>
            {Array.from({ length: r }, (_, k) => (
              <rect key={k} x={x0 + k * box} y={y + 4} width={box} height={28} className="crate" />
            ))}
            {parts[i] !== null && (
              <text x={x0 + r * box + 10} y={y + 24} className={cls(parts[i])}>
                {cote(parts[i], unit)}
              </text>
            )}
          </g>
        );
      })}
      {/* L'accolade du total, à droite de toutes les rangées ; sans total écrit, ni accolade ni « en tout ». */}
      {total !== null && (
        <path d={`M ${bx} ${y0 + 4} q 10 0 10 10 V ${(y0 + h) / 2 - 8} q 0 8 8 8 q -8 0 -8 8 V ${h - 18} q 0 10 -10 10`} className="brace" />
      )}
      {total !== null && (
        <text x={width / 2} y={h + 30} textAnchor="middle" className={cls(total)}>
          {`en tout : ${cote(total, unit)}`}
        </text>
      )}
    </svg>
  );
}

function Mat({ unit, hauteur, pied, cable }: { unit: string; hauteur: Side; pied: Side; cable: Side }) {
  const label = `Un mât vertical tenu par un câble tendu jusqu’au sol, un triangle rectangle au pied du mât. Hauteur du mât : ${spoken(hauteur, unit)}. Du pied du mât au câble, au sol : ${spoken(pied, unit)}. Longueur du câble : ${spoken(cable, unit)}.`;
  return (
    <svg viewBox="0 0 380 220" role="img" aria-label={label}>
      <line x1="20" y1="180" x2="360" y2="180" className="ground" />
      <rect x="96" y="28" width="12" height="152" className="mast" />
      <line x1="108" y1="32" x2="300" y2="180" className="cable" />
      <polyline points="108,160 128,160 128,180" className="right-mark" />
      <text x="84" y="110" textAnchor="end" className={cls(hauteur)}>
        {cote(hauteur, unit)}
      </text>
      <text x="204" y="208" textAnchor="middle" className={cls(pied)}>
        {cote(pied, unit)}
      </text>
      <text x="222" y="92" className={cls(cable)}>
        {cote(cable, unit)}
      </text>
    </svg>
  );
}

function Route({ distance, duree, vitesse }: { distance: Side; duree: Side; vitesse: Side }) {
  const label = `Une traversée en bateau d’une île à l’autre, à vitesse constante. Distance : ${spoken(distance, 'km')}. Durée : ${duree === '?' ? 'inconnue' : sayDuree(duree)}. Vitesse : ${vitesse === '?' ? 'inconnue' : `${formatNombre(vitesse)} kilomètres par heure`}.`;
  return (
    <svg viewBox="0 0 380 236" role="img" aria-label={label}>
      <Arrow />
      <Dim x1={52} x2={328} y={52} label={cote(distance, 'km')} c={distance} above />
      {/* Les îles posées sur l’eau. */}
      <path d="M 0 130 Q 190 114 380 130 L 380 236 L 0 236 z" className="water" />
      <ellipse cx="52" cy="112" rx="50" ry="20" className="island" />
      <ellipse cx="328" cy="112" rx="50" ry="20" className="island" />
      <line x1="102" y1="112" x2="278" y2="112" className="route" />
      {/* Le bateau, au milieu de la route. */}
      <path d="M 174 100 h 32 l -6 10 h -20 z" className="boat" />
      <path d="M 190 100 v -20 l 12 16 z" className="boat" />
      <text x="190" y="170" textAnchor="middle" className={cls(duree)}>
        {`durée : ${duree === '?' ? '?' : formatDuree(duree)}`}
      </text>
      <rect x="100" y="186" width="180" height="34" rx="4" className="cartouche" />
      <text x="190" y="210" textAnchor="middle" className={cls(vitesse)}>
        {`vitesse : ${vitesse === '?' ? '?' : `${formatNombre(vitesse)} km/h`}`}
      </text>
    </svg>
  );
}

function Ombre({ unit, baton, ombreBaton, hauteur, ombre }: { unit: string; baton: Side; ombreBaton: Side; hauteur: Side; ombre: Side }) {
  // Le coefficient entre les deux triangles, depuis la paire connue ; le dessin garde le mât et son ombre fixes.
  const k =
    typeof hauteur === 'number' && typeof baton === 'number' ? hauteur / baton : typeof ombre === 'number' && typeof ombreBaton === 'number' ? ombre / ombreBaton : 2;
  const [ground, tip, mx, mh] = [196, 350, 84, 150];
  const bx = tip - (tip - mx) / k;
  const bh = mh / k;
  const label = `Un bâton et un mât, tous deux verticaux, et leurs ombres au sol qui finissent au même point : le haut du bâton et le haut du mât sont sur le même rayon de soleil. Bâton : ${spoken(baton, unit)}, son ombre : ${spoken(ombreBaton, unit)}. Mât : ${spoken(hauteur, unit)}, son ombre : ${spoken(ombre, unit)}.`;
  return (
    <svg viewBox="0 0 380 300" role="img" aria-label={label}>
      <Arrow />
      <line x1="10" y1={ground} x2="370" y2={ground} className="ground" />
      <line x1={mx} y1={ground} x2={tip} y2={ground} className="shadow" />
      {/* Le soleil, au bout du rayon qui passe par le haut du mât et le haut du bâton. */}
      <line x1={mx - 36} y1={ground - mh - 20} x2={tip} y2={ground} className="ray" />
      <circle cx={mx - 48} cy={ground - mh - 27} r="12" className="sun" />
      <rect x={mx - 6} y={ground - mh} width="12" height={mh} className="mast" />
      <rect x={bx - 3} y={ground - bh} width="6" height={bh} className="mast" />
      <text x={mx - 14} y={ground - mh / 2 + 6} textAnchor="end" className={cls(hauteur)}>
        {cote(hauteur, unit)}
      </text>
      <text x={bx - 10} y={ground - bh / 2 + 6} textAnchor="end" className={cls(baton)}>
        {cote(baton, unit)}
      </text>
      <Dim x1={bx} x2={tip} y={218} label={cote(ombreBaton, unit)} c={ombreBaton} />
      <Dim x1={mx} x2={tip} y={256} label={cote(ombre, unit)} c={ombre} />
    </svg>
  );
}

/** Le schéma de la situation : pont, quai, traversée, carte, cargaison, mât, route ou ombre, à plat, la grandeur cherchée marquée « ? ». */
export function Scene(props: SceneProps) {
  return (
    <figure className={`scene-figure scene-${props.scene}`}>
      {props.scene === 'pont' && <Pont {...props} />}
      {props.scene === 'quai' && <Quai {...props} />}
      {props.scene === 'traversee' && <Traversee {...props} />}
      {props.scene === 'carte' && <Carte {...props} />}
      {props.scene === 'cargaison' && <Cargaison {...props} />}
      {props.scene === 'mat' && <Mat {...props} />}
      {props.scene === 'route' && <Route {...props} />}
      {props.scene === 'ombre' && <Ombre {...props} />}
    </figure>
  );
}

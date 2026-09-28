// Le monde en 2D : pixels nets, vue de dessus en oblique (le dessus des cases et les falaises). Même contrat que la
// vue 3D (world/view.ts), même simulation (world/scene.ts) ; le terrain est une carte de tuiles (oblique.ts) dessinée
// par morceaux, d'avance (draw.ts). Chargé à la demande, sans Three.js (voir ./index.ts).
// Étape 3 : le bonhomme, les créatures et les Gardiens, les panneaux des bornes et leurs repères, le jour et la nuit.
// Étape 4 : le Bloc-Navire (à quai, en chantier, en voyage).
import { useEffect, useRef, useState } from 'react';
import type { BiomeId } from '../biomes';
import type { PlaceId, VoxelCube } from '../Voxel';
import { AMBIENCE, daylight, palette } from '../world/daylight';
import { faceCanvas } from '../world/pixels';
import {
  ARROW_DIRS,
  avatarWalk,
  boardingWalk,
  cubeTags,
  finishWalk,
  groundTap,
  islandInDirection,
  startStrolls,
  startVoyage,
  strollAt,
  voyageFrame,
  walkPose,
  type Stroll,
  type VoyageRun,
  type Walk,
} from '../world/scene';
import { islandCenter } from '../world/terrain';
import { drawIslandLabel, drawMapArrow, measureIslandLabel } from '../world/labelCanvas';
import { layoutLabels, separateMark, type LabelBox, type LabelOffset } from '../world/labelLayout';
import { VEHICLE_DECK } from '../world/harbour';
import { vehiclePath } from '../world/voyage';
import { islandsOf } from '../world/archipelago';
import { rappelsDeLaVue, type Cell, type WorldViewProps } from '../world/view';
import { useEnCasesDuMonde } from '../useEnCasesDuMonde';
import { drawChunk, drawTileMap, type DrawEnv } from './draw';
import { propsOf, type Prop, type Station } from '../world/props';
import {
  avatarSprite,
  drawChevron,
  drawDiamond,
  drawShadow,
  drawStars,
  facingOf,
  placeSprite,
  signpostSprite,
  voxelSprite,
  type Facing,
  type Sprite,
} from './characters';
import { drawSprite } from './sprites';
import { renduDuMonde } from '../rendu';
import { morceauxAPeindre, palierDe, peinture, type Peinture } from './painted';
import { seaPattern } from './paintedDraw';
import { fenetresDe } from '../world/construction';
import { drawPaintedShadow, drawPaintedSprite } from './paintedSprites';
import { STYLE } from './style';
import { surfaceOf } from './surface';
import { CHUNK, TILE, buildTiles, frame2D, pickTile, project, toBase, toScreen, type TileMap, type View2D } from './oblique';

/** Sous ce niveau, les cubes sont sous la mer : on ne les dessine pas (la mer est un fond animé). */
const SEA_HIDES_BELOW = -1;

/** Morceaux de terrain dessinés au plus par image : le premier affichage reste fluide. */
const CHUNKS_PER_FRAME = 8;
/** La 2D peinte (lot R7) peint ses morceaux pixel par pixel : au plus ce temps par image, au moins un morceau. */
const PAINT_MS_PER_FRAME = 12;
/** Sous cette échelle (pixels d'écran par pixel de base), la 2D peinte efface les joints des ouvrages. */
const LOIN_SOUS = 1.5;

const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** Un rectangle touchable de l'écran (un personnage, un panneau), et ce que fait le toucher. */
interface Hit {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Ce que fait le toucher (au point touché, en pixels de l'écran) ; faux : le toucher passe au sol dessous. */
  act: (sx: number, sy: number) => boolean | void;
}

/** Une créature ou un Gardien qui se promène, son sprite, et le milieu de la place qu'occupent ses cubes. */
interface Walker {
  stroll: Stroll;
  sprite: Sprite | null;
  mid: { x: number; y: number };
}

/** Un éclat de couleur (pose d'un bloc) : position et vitesse dans le monde, en blocs. */
interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  born: number;
  color: string;
}

export default function WorldCanvas2D({
  archipelago,
  cubes,
  focus: focusEnAncrages,
  reduceMotion = false,
  vehicle = null,
  voyage = null,
  creatures = [],
  forceDay = false,
  marker: markerEnAncrage = null,
  avatar: avatarEnAncrages,
  map = false,
  home,
  trail: trailEnAncrages,
  quests: questsEnAncrages,
  islandLabels,
  burst: burstEnAncrage,
  className,
  label,
  onIntent,
  chantier = false,
}: WorldViewProps) {
  // Les positions reçues en ancrages (une île, un point dans son repère), dessinées en cases du monde.
  const { focus, marker, avatar, trail, quests, burst } = useEnCasesDuMonde({
    archipelago,
    focus: focusEnAncrages,
    marker: markerEnAncrage,
    avatar: avatarEnAncrages,
    trail: trailEnAncrages,
    quests: questsEnAncrages,
    burst: burstEnAncrage,
  });
  // Les gestes deviennent des intentions (world/view.ts) : la vue garde ses rappels, tirés d'elles.
  const { onPickIsland, onPickBridge, onPickQuest, onPickPlace, onPickCreature, onPickVehicle, build, onVoyageLegEnd, onVoyageSkip } = rappelsDeLaVue(
    onIntent,
    archipelago,
    chantier,
  );
  const host = useRef<HTMLDivElement>(null);
  // La 2D peinte, derrière le drapeau `?rendu=archipeo` (lot R7) ; sans lui, la 2D en pixels, inchangée.
  const [painted] = useState(() => renduDuMonde() === 'archipeo');
  // Le palier de lumière de la 2D peinte (la boucle le relit chaque image ; un changement repeint le terrain).
  const palier = useRef(palierDe(forceDay ? 1 : daylight().light));
  // Ce que la vue reçoit, lu au moment du geste ou de l'image (sans reconstruire la scène).
  const latest = { avatar: Boolean(avatar), onPickVehicle, onPickIsland, onPickBridge, onPickQuest, onPickPlace, onPickCreature, build, onVoyageLegEnd, onVoyageSkip, map, home, focus: focus.island, focusSpot: focus.spot ?? null, archipelago, vehicle, marker, trail, quests, forceDay, islandLabels };
  const props = useRef(latest);
  props.current = latest;
  const terrain = useRef<{
    map: TileMap;
    chunks: Map<string, HTMLCanvasElement | null>;
    tags: ReturnType<typeof cubeTags>;
    env: DrawEnv;
    /** Les morceaux à dessiner : ceux du terrain, et en 2D peinte ceux où débordent les rives éclaircies. */
    drawable: Set<string>;
    /** En 2D peinte, les morceaux d'avant un changement de lumière, montrés le temps d'être repeints. */
    stale: Map<string, HTMLCanvasElement | null>;
    /** Le décor en sprites. */
    props: Prop[];
    /** Les bornes de mission, en panneaux. */
    stations: Station[];
    /** Les cases (x, y) des lieux où l'on entre (l'école), avec leur île. */
    places: Map<string, { place: PlaceId; island: BiomeId }>;
  } | null>(null);
  const view = useRef<View2D | null>(null);
  const voyageRef = useRef<VoyageRun | null>(null);
  // Le bonhomme : son trajet en cours, sa dernière place, où il regarde.
  const hero = useRef<{ walk: Walk | null; at: Cell | null; facing: Facing }>({ walk: null, at: null, facing: 'down' });
  const walkers = useRef<Walker[]>([]);
  const sparks = useRef<Spark[]>([]);
  // Le Bloc-Navire : ses tuiles (pour le toucher) et son image, dessinée une fois à chaque changement.
  const ship = useRef<{ map: TileMap; image: ReturnType<typeof drawTileMap>; maxY: number; cubes: VoxelCube[]; paint?: Peinture } | null>(null);

  // ---- Le terrain : la carte des tuiles, et ses morceaux redessinés à la demande
  useEffect(() => {
    const sky = AMBIENCE[archipelago].sky;
    // Le décor en sprites (arbres, buissons…) et les bornes en panneaux : leurs cubes quittent le terrain.
    const split = STYLE.sprites ? propsOf(cubes) : { props: [], stations: [], terrain: cubes };
    const map = buildTiles(split.terrain, sky ? -Infinity : SEA_HIDES_BELOW);
    const drawable = painted ? morceauxAPeindre(map, !sky) : new Set(map.chunks.keys());
    terrain.current = {
      map,
      chunks: new Map(),
      drawable,
      stale: new Map(),
      tags: cubeTags(cubes),
      env: {
        surface: surfaceOf(cubes),
        style: STYLE,
        sea: !sky,
        painted: painted ? peinture(archipelago, palier.current) : undefined,
        // Les vitres et les lanternes qui s'allument la nuit (lot R5).
        fenetres: painted ? fenetresDe(cubes) : undefined,
      },
      props: split.props,
      stations: split.stations,
      places: new Map(cubes.filter((c) => c.place).map((c) => [`${c.x},${c.y}`, { place: c.place!, island: c.tag as BiomeId }])),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cubes, archipelago]);

  // ---- Les créatures et les Gardiens : leur promenade (world/scene.ts) et leur sprite, tiré de leurs cubes
  useEffect(() => {
    const strolls = startStrolls(creatures, performance.now());
    walkers.current = creatures.map((c, i) => {
      const xs = c.cubes.map((k) => k.x);
      const ys = c.cubes.map((k) => k.y);
      const mid = { x: (Math.min(...xs) + Math.max(...xs) + 1) / 2, y: (Math.min(...ys) + Math.max(...ys) + 1) / 2 };
      return { stroll: strolls[i], sprite: voxelSprite(`${c.kind ?? 'creature'}:${c.id}`, c.cubes), mid };
    });
  }, [creatures]);

  // ---- Le bonhomme : chaque itinéraire (le premier placement est immédiat)
  useEffect(() => {
    if (!avatar) return;
    hero.current.walk = avatarWalk(avatar, performance.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.seq]);

  // ---- Le Bloc-Navire : ses cubes (locaux) dessinés comme le terrain, dans une image à part qui tangue
  useEffect(() => {
    if (!vehicle) {
      ship.current = null;
      return;
    }
    const map = buildTiles(vehicle.cubes);
    const paint = painted ? peinture(archipelago, palier.current) : undefined;
    const image = drawTileMap(map, { surface: surfaceOf(vehicle.cubes), style: STYLE, sea: false, painted: paint });
    ship.current = { map, image, maxY: Math.max(0, ...vehicle.cubes.map((c) => c.y)), cubes: vehicle.cubes, paint };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, archipelago]);

  // ---- À la pose d'un bloc : trois poussières claires qui montent doucement, sans partir en tous sens
  useEffect(() => {
    if (!burst || burst.seq === 0 || reduceMotion) return;
    const now = performance.now();
    for (let i = 0; i < 3; i++) {
      sparks.current.push({ x: burst.cell.x + 0.3 + i * 0.2, y: burst.cell.y + 0.5, z: burst.cell.z + 0.8, vx: 0, vy: 0, vz: 3.6 + i * 0.3, born: now, color: '#f3eee3' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst?.seq]);

  // ---- Le cadrage : au premier (ou quand on le redemande d'emblée), d'un coup ; ensuite, la boucle le rejoint en douceur
  useEffect(() => {
    if (focus.seq === 0) view.current = null;
  }, [focus.island, focus.seq]);
  // Un autre archipel (sous le voile du voyage) : une autre scène, la caméra y est d'emblée, sans traverser la mer.
  useEffect(() => {
    view.current = null;
  }, [archipelago]);

  // ---- Le voyage : le bonhomme marche jusqu'au pont et monte à bord ; le navire s'éloigne (ou accoste, et il débarque)
  useEffect(() => {
    const now = performance.now();
    voyageRef.current = voyage && voyage.seq !== 0 && vehicle ? startVoyage(voyage, now) : null;
    if (voyageRef.current && vehicle) {
      const walk = boardingWalk(vehicle.port, voyageRef.current, now);
      if (walk) hero.current.walk = walk;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.seq, voyage?.leg]);

  // ---- La scène : le canvas, les gestes, la boucle (une fois par archipel)
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.imageRendering = 'pixelated';
    canvas.style.touchAction = 'none';
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ambience = AMBIENCE[archipelago];
    // La mer (ou le plancher de nuages des Îles du Ciel) : sa couleur, et sa texture qui ondule par-dessus.
    const seaTexture = painted ? null : faceCanvas(ambience.sky ? 'nuage' : 'eau', 'top');
    const sea = seaTexture ? ctx.createPattern(seaTexture, 'repeat') : null;
    // En 2D peinte : la mer (ou les nuages) de la palette, et ses reflets rares, par palier de lumière.
    const paintedSea = new Map<string, CanvasPattern | null>();
    const paintedSeaOf = (P: Peinture) => {
      if (!paintedSea.has(P.cle)) {
        const img = seaPattern(P, ambience.sky);
        paintedSea.set(P.cle, img ? ctx.createPattern(img, 'repeat') : null);
      }
      return paintedSea.get(P.cle)!;
    };

    // Jour et nuit : la lumière suit l'heure réelle, relue chaque minute (figée avec « réduire les animations »).
    let light = props.current.forceDay ? 1 : daylight().light;
    const dayTimer = reduceMotion ? 0 : window.setInterval(() => (light = props.current.forceDay ? 1 : daylight().light), 60_000);

    const screen = () => ({ w: canvas.width, h: canvas.height });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const w = Math.max(1, Math.round(el.clientWidth * dpr));
      const h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    // Ce qu'on peut toucher dans la dernière image (du plus lointain au plus proche).
    let hits: Hit[] = [];

    // Toucher : un tap, pas un glissé.
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const toCanvas = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { sx: ((e.clientX - rect.left) / rect.width) * canvas.width, sy: ((e.clientY - rect.top) / rect.height) * canvas.height };
    };
    const hitAt = (e: PointerEvent) => {
      const { sx, sy } = toCanvas(e);
      for (let i = hits.length - 1; i >= 0; i--) {
        const h = hits[i];
        if (sx >= h.x && sx <= h.x + h.w && sy >= h.y && sy <= h.y + h.h) return h;
      }
      return null;
    };
    const pickAt = (e: PointerEvent) => {
      const t = terrain.current;
      const v = view.current;
      if (!t || !v) return null;
      const { sx, sy } = toCanvas(e);
      const { bx, by } = toBase(v, screen(), sx, sy);
      return pickTile(t.map, Math.floor(bx / TILE), Math.floor(by / TILE));
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 8) return;
      const p = props.current;
      // Pendant le voyage, un tap n'importe où fait arriver tout de suite ; pendant un trajet, le bonhomme arrive.
      if (voyageRef.current) return p.onVoyageSkip?.();
      if (finishWalk(hero.current.walk, performance.now())) return;
      const hit = hitAt(e);
      if (hit) {
        const { sx, sy } = toCanvas(e);
        if (hit.act(sx, sy) !== false) return;
      }
      const ground = pickAt(e);
      const t = terrain.current;
      if (!ground || !t) return;
      const tap = groundTap(p.archipelago, ground, t.tags, {
        quest: Boolean(p.onPickQuest),
        bridge: Boolean(p.onPickBridge),
        build: Boolean(p.build),
        place: Boolean(p.onPickPlace),
      });
      if (tap.kind === 'quest') p.onPickQuest?.(tap.biome, tap.typeId);
      else if (tap.kind === 'place') p.onPickPlace?.(tap.place, tap.island);
      else if (tap.kind === 'bridge') p.onPickBridge?.(tap.id);
      else if (tap.kind === 'face') p.build?.onPickFace(tap.cell, tap.next);
      else p.onPickIsland?.(tap.id);
    };
    const onHover = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      canvas.style.cursor = hitAt(e) || pickAt(e) ? 'pointer' : 'default';
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onHover);

    // Clavier (le cadre prend le focus) : les flèches vont à l'île voisine dans cette direction.
    el.tabIndex = 0;
    const onKey = (e: KeyboardEvent) => {
      const p = props.current;
      if (voyageRef.current) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          p.onVoyageSkip?.();
        }
        return;
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir || !p.onPickIsland) return;
      e.preventDefault();
      const here: BiomeId = p.focus ?? p.home ?? islandsOf(p.archipelago)[0].id;
      const next = islandInDirection(p.archipelago, islandCenter(here), dir);
      if (next) p.onPickIsland(next);
    };
    el.addEventListener('keydown', onKey);

    // Économie de batterie : on ne dessine que si le cadre est visible et l'onglet actif.
    let visible = true;
    let running = false;
    let frame = 0;
    const seen = new IntersectionObserver((entries) => {
      visible = entries.some((en) => en.isIntersecting);
      if (visible && !running) start();
    });
    seen.observe(el);
    const onVisibility = () => {
      if (!document.hidden && !running) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const t0 = performance.now();
    let last = t0;
    // Sur la Carte, l'écart des étiquettes, calculé pour un cadrage (sa clé) et gardé tant qu'il ne change pas.
    let labelLayout: { key: string; offsets: LabelOffset[] } | null = null;
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      // Jamais négatif : une horloge qui recule (celle, figée, des captures de la documentation) retournerait la caméra.
      const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
      last = now;
      const t = reduceMotion ? 0 : (now - t0) / 1000;
      const p = props.current;
      const tm = terrain.current;
      if (!tm) return;
      const scr = screen();
      if (p.forceDay && light !== 1) light = 1;
      // La 2D peinte : à un autre palier de lumière, le terrain et le navire se repeignent (morceau par morceau).
      const P = tm.env.painted;
      if (P && palierDe(light) !== P.palier) {
        palier.current = palierDe(light);
        tm.env = { ...tm.env, painted: peinture(archipelago, palier.current) };
        for (const [k, img] of tm.chunks) tm.stale.set(k, img);
        tm.chunks.clear();
        const sh = ship.current;
        if (sh?.paint) {
          sh.paint = peinture(archipelago, palier.current);
          sh.image = drawTileMap(sh.map, { surface: surfaceOf(sh.cubes), style: STYLE, sea: false, painted: sh.paint });
        }
      }
      const paint = tm.env.painted;

      // Le Bloc-Navire : à quai, il tangue (ou plane, dans le ciel) ; en voyage, il suit sa trajectoire.
      let aboard = false;
      let sailing: { k: number; stage: 1 | 2 | 3 } | null = null;
      let shipAt: Cell | null = null;
      const vy = voyageRef.current;
      if (p.vehicle) {
        const o = p.vehicle.origin;
        const rest = p.vehicle.afloat ? Math.sin(t * 1.8) * 0.08 : 0.3 + Math.sin(t * 0.9) * 0.15;
        shipAt = { x: o.x, y: o.y, z: o.z + rest };
        if (vy) {
          const f = voyageFrame(vy, p.vehicle.port, now);
          // Accosté : le bonhomme débarque (le chemin d'embarquement à rebours).
          if (f.disembark) hero.current.walk = f.disembark;
          aboard = f.aboard;
          const path = vehiclePath(vy.stage, f.k);
          shipAt = { x: o.x + path.dx, y: o.y + path.dy, z: o.z + path.dz };
          if (f.underway && !reduceMotion) {
            sailing = { k: f.progress, stage: vy.stage };
            // L'écume à la poupe, à la voile.
            if (vy.stage === 1 && now - vy.lastFoam > 100) {
              vy.lastFoam = now;
              sparks.current.push({ x: shipAt.x + 2.5 + (Math.random() - 0.5) * 3, y: shipAt.y + 8, z: shipAt.z + 0.2, vx: (Math.random() - 0.5) * 1.5, vy: 1.5, vz: 1.2, born: now, color: '#f4f8fb' });
            }
          }
          if (f.end) p.onVoyageLegEnd?.();
        }
      }

      const h = hero.current;

      let moving = false;
      if (h.walk) {
        const pose = walkPose(h.walk, now, reduceMotion);
        h.at = { x: pose.x, y: pose.y, z: pose.z };
        if (pose.facing) h.facing = facingOf(pose.facing);
        moving = pose.moving;
        if (!pose.moving) h.walk = null;
      }

      // La caméra rejoint son cadrage en douceur (le bonhomme, pas à pas) ; le changement d'échelle aussi.
      // Le chantier du navire (la flèche posée sur lui) : la caméra va le montrer.
      // (La flèche flotte en haut du mât : on regarde plus bas, le milieu du navire.)
      const spot = p.focus && p.focusSpot ? p.focusSpot : p.focus && p.marker && typeof p.marker !== 'string' ? { ...p.marker, z: p.marker.z - 9 } : null;
      const target = frame2D({ archipelago: p.archipelago, map: p.map, island: p.focus, home: p.home ?? null, avatar: h.at, spot, far: Boolean(p.focusSpot) }, tm.map, scr);
      if (sailing && shipAt) {
        // En mer (ou dans les airs) : la caméra suit le navire, et recule un peu à mesure qu'il s'éloigne.
        const c = project(shipAt.x + 2.5, shipAt.y + 5, shipAt.z + 2);
        target.cx = c.bx;
        target.cy = c.by;
        target.s = Math.max(1, target.s * (1 - 0.35 * sailing.k));
      }
      const v = view.current;
      if (!v || reduceMotion) view.current = target;
      else {
        const k = 1 - Math.exp(-dt * 3.5);
        v.cx += (target.cx - v.cx) * k;
        v.cy += (target.cy - v.cy) * k;
        v.s += (target.s - v.s) * k;
        if (Math.abs(target.s - v.s) < 0.01) v.s = target.s;
      }
      const cam = view.current!;
      // La 2D peinte vue de loin (la Carte, où l'on arrive) : les joints des ouvrages s'effacent ; en passant le seuil,
      // le terrain se repeint (morceau par morceau, comme à un changement de lumière).
      if (tm.env.painted && target.s < LOIN_SOUS !== Boolean(tm.env.loin)) {
        tm.env = { ...tm.env, loin: target.s < LOIN_SOUS };
        for (const [k, img] of tm.chunks) tm.stale.set(k, img);
        tm.chunks.clear();
      }
      // La taille des repères : celle de la vue, mais jamais minuscules (sur la Carte, vue de loin).
      const mark = Math.max(1.5 * cam.s, 3 * (window.devicePixelRatio || 1));
      const at = (x: number, y: number, z: number) => {
        const b = project(x, y, z);
        return toScreen(cam, scr, b.bx, b.by);
      };

      // La mer : sa couleur (selon l'heure), et sa texture qui dérive lentement.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (paint) {
        // En 2D peinte : le large de la palette, et ses reflets longs et rares (figés avec « Réduire les animations »).
        ctx.fillStyle = hex(paint.mer.large);
        ctx.fillRect(0, 0, scr.w, scr.h);
        const pattern = paintedSeaOf(paint);
        if (pattern) {
          const ox = scr.w / 2 - cam.cx * cam.s + t * 2 * cam.s;
          const oy = scr.h / 2 - cam.cy * cam.s;
          ctx.save();
          ctx.translate(ox, oy);
          ctx.scale(cam.s, cam.s);
          ctx.fillStyle = pattern;
          ctx.fillRect(-ox / cam.s, -oy / cam.s, scr.w / cam.s, scr.h / cam.s);
          ctx.restore();
        }
      } else {
        const pal = palette(light, archipelago);
        ctx.fillStyle = hex(ambience.sky ? pal.sky : pal.water);
        ctx.fillRect(0, 0, scr.w, scr.h);
      }
      if (sea) {
        const ox = scr.w / 2 - cam.cx * cam.s + t * 3 * cam.s;
        const oy = scr.h / 2 - cam.cy * cam.s + t * 2 * cam.s;
        ctx.save();
        ctx.globalAlpha = ambience.sky ? 0.5 : 0.35;
        ctx.translate(ox, oy);
        ctx.scale(cam.s, cam.s);
        ctx.fillStyle = sea;
        ctx.fillRect(-ox / cam.s, -oy / cam.s, scr.w / cam.s, scr.h / cam.s);
        ctx.restore();
      }

      // Le terrain : les morceaux visibles, dessinés d'avance, posés sur des pixels entiers (pas de joints).
      const tl = toBase(cam, scr, 0, 0);
      const br = toBase(cam, scr, scr.w, scr.h);
      const size = CHUNK * TILE;
      let drawn = 0;
      // En 2D peinte, après un changement de lumière : les anciens morceaux hors de l'écran s'oublient.
      if (tm.stale.size)
        for (const k of tm.stale.keys()) {
          const [cx, cy] = k.split(',').map(Number);
          if (cx < Math.floor(tl.bx / size) || cx > Math.floor(br.bx / size) || cy < Math.floor(tl.by / size) || cy > Math.floor(br.by / size)) tm.stale.delete(k);
        }
      for (let cy = Math.floor(tl.by / size); cy <= Math.floor(br.by / size); cy++) {
        for (let cx = Math.floor(tl.bx / size); cx <= Math.floor(br.bx / size); cx++) {
          const k = `${cx},${cy}`;
          if (!tm.drawable.has(k)) continue;
          if (!tm.chunks.has(k)) {
            const busy = drawn >= CHUNKS_PER_FRAME || (paint && drawn > 0 && performance.now() - now > PAINT_MS_PER_FRAME);
            if (!busy) {
              tm.chunks.set(k, drawChunk(tm.map, cx, cy, tm.env));
              tm.stale.delete(k);
              drawn++;
            } else if (!tm.stale.has(k)) continue;
          }
          const img = tm.chunks.get(k) ?? tm.stale.get(k);
          if (!img) continue;
          const x0 = Math.round((cx * size - cam.cx) * cam.s + scr.w / 2);
          const y0 = Math.round((cy * size - cam.cy) * cam.s + scr.h / 2);
          const x1 = Math.round(((cx + 1) * size - cam.cx) * cam.s + scr.w / 2);
          const y1 = Math.round(((cy + 1) * size - cam.cy) * cam.s + scr.h / 2);
          ctx.drawImage(img, x0, y0, x1 - x0, y1 - y0);
        }
      }

      // Tout ce qui se tient debout (décor, panneaux, créatures, bonhomme), du plus lointain au plus proche.
      const visibleAt = (x: number, y: number, z: number) => {
        const b = project(x, y, z);
        return b.bx > tl.bx - 4 * TILE && b.bx < br.bx + 4 * TILE && b.by > tl.by - TILE && b.by < br.by + 5 * TILE;
      };
      const standing: { depth: number; draw: () => void }[] = [];
      // L'ombre au sol d'un panneau, d'une créature, du bonhomme : bleutée et adoucie en 2D peinte.
      const shadow = (sx: number, sy: number, rx: number, ry: number) =>
        paint ? drawPaintedShadow(ctx, paint, sx, sy, rx, ry) : drawShadow(ctx, sx, sy, rx, ry);
      for (const pr of tm.props) {
        if (!visibleAt(pr.x + 0.5, pr.y + 0.5, pr.z)) continue;
        standing.push({
          depth: pr.y - pr.z,
          draw: () => {
            const { sx, sy } = at(pr.x + 0.5, pr.y + 0.5, pr.z);
            if (paint) drawPaintedSprite(ctx, pr.kind, pr.muted, paint, sx, sy, cam.s, STYLE.shadows);
            else drawSprite(ctx, pr.kind, pr.muted, sx, sy, cam.s, STYLE.shadows);
          },
        });
      }
      const marks = new Map((p.quests ?? []).map((q) => [q.id, q.state]));
      const newHits: Hit[] = [];
      const overlays: (() => void)[] = [];
      for (const st of tm.stations) {
        if (!visibleAt(st.x + 0.5, st.y + 0.5, st.z)) continue;
        standing.push({
          depth: st.y - st.z,
          draw: () => {
            const { sx, sy } = at(st.x + 0.5, st.y + 0.75, st.z);
            const sign = signpostSprite(st.muted);
            if (!sign) return;
            if (STYLE.shadows) shadow(sx + cam.s, sy, 6 * cam.s, 2 * cam.s);
            const r = placeSprite(ctx, sign, sx, sy, cam.s);
            const [biome, typeId] = st.quest.split(':');
            newHits.push({ ...r, act: () => props.current.onPickQuest?.(biome as BiomeId, typeId) });
            // Le repère au-dessus : un losange qui flotte (à faire), ou les étoiles gagnées.
            const state = marks.get(st.quest);
            overlays.push(() => {
              if (state === 'new') {
                const bob = Math.abs(Math.sin(t * 2.4 + st.x)) * 3 * cam.s;
                drawDiamond(ctx, sx, r.y - 6 * cam.s - bob, 4 * cam.s);
              } else if (typeof state === 'number' && state > 0) drawStars(ctx, sx, r.y - 5 * cam.s, state, 3 * cam.s);
            });
          },
        });
      }
      for (const wk of walkers.current) {
        const { dx, dy, bob } = strollAt(wk.stroll, now, t);
        const o = wk.stroll.origin;
        const sprite = wk.sprite;
        if (!sprite) continue;
        // Le milieu de sa place (les créatures en cubes occupent quelques cases ; le sprite se pose au milieu).
        const x = o.x + dx + wk.mid.x;
        const y = o.y + dy + wk.mid.y;
        if (!visibleAt(x, y, o.z)) continue;
        standing.push({
          depth: y - o.z,
          draw: () => {
            const { sx, sy } = at(x, y, o.z);
            if (STYLE.shadows) shadow(sx + cam.s, sy, (sprite.w / 2.4) * cam.s, 3 * cam.s);
            const r = placeSprite(ctx, sprite, sx, sy - bob * TILE * cam.s, cam.s);
            const { id, kind } = wk.stroll;
            newHits.push({
              ...r,
              act: () => {
                const q = props.current;
                if (q.onPickCreature) q.onPickCreature(id, kind);
                else if (!q.build) q.onPickIsland?.(id);
              },
            });
          },
        });
      }
      const sh = ship.current;
      if (sh?.image && shipAt) {
        const pos = shipAt;
        standing.push({
          // Le navire se range par son bord le plus lointain : ce qui est sur le quai devant lui passe devant.
          depth: pos.y + sh.maxY - pos.z,
          draw: () => {
            const img = sh.image!;
            const o = project(pos.x, pos.y, pos.z);
            const tlS = toScreen(cam, scr, o.bx + img.col0 * TILE, o.by + img.row0 * TILE);
            const brS = toScreen(cam, scr, o.bx + (img.col0 + img.canvas.width / TILE) * TILE, o.by + (img.row0 + img.canvas.height / TILE) * TILE);
            const r = { x: Math.round(tlS.sx), y: Math.round(tlS.sy), w: Math.round(brS.sx) - Math.round(tlS.sx), h: Math.round(brS.sy) - Math.round(tlS.sy) };
            ctx.drawImage(img.canvas, r.x, r.y, r.w, r.h);
            // La flamme du réacteur, qui vacille, en vol.
            if (sailing?.stage === 3) {
              const fl = at(pos.x + 2.5, pos.y + 11.6, pos.z + 1.5);
              const hgt = (5 + 3 * Math.abs(Math.sin(t * 37)) + 2 * Math.random()) * cam.s;
              ctx.fillStyle = '#ff7a1a';
              ctx.fillRect(Math.round(fl.sx - 5 * cam.s), Math.round(fl.sy), Math.round(10 * cam.s), Math.round(hgt));
              ctx.fillStyle = '#ffd24a';
              ctx.fillRect(Math.round(fl.sx - 2 * cam.s), Math.round(fl.sy), Math.round(4 * cam.s), Math.round(hgt * 0.6));
            }
            // Le bonhomme sur le pont, pendant le voyage.
            if (aboard && p.avatar) {
              const d = at(pos.x + VEHICLE_DECK.x + 0.5, pos.y + VEHICLE_DECK.y + 0.5, pos.z + 1);
              const sprite = avatarSprite('down', 0);
              if (sprite) placeSprite(ctx, sprite, d.sx, d.sy, cam.s);
            }
            // Le toucher : une case à poser se pose ; ailleurs sur le navire, le panneau du port s'ouvre.
            newHits.push({
              ...r,
              act: (sx, sy) => {
                const b = toBase(cam, scr, sx, sy);
                const hit = pickTile(sh.map, Math.floor((b.bx - o.bx) / TILE), Math.floor((b.by - o.by) / TILE));
                if (!hit) return false;
                const q = props.current;
                if (!q.vehicle) return false;
                const vo = q.vehicle.origin;
                const cell = { x: vo.x + hit.cell.x, y: vo.y + hit.cell.y, z: vo.z + hit.cell.z };
                const ghost = q.vehicle.cubes.some((c) => c.ghost && c.x === hit.cell.x && c.y === hit.cell.y && c.z === hit.cell.z);
                if (ghost && q.build) q.build.onPickFace(cell, cell, q.vehicle.port);
                else q.onPickVehicle?.(q.vehicle.port);
              },
            });
          },
        });
      }
      if (h.at && p.avatar && !aboard) {
        const { x, y, z } = h.at;
        standing.push({
          depth: y + 0.5 - z - 0.01,
          draw: () => {
            const { sx, sy } = at(x + 0.5, y + 0.5, z);
            const step = moving ? Math.floor(t * 8) % 2 : 0;
            const sprite = avatarSprite(h.facing, step);
            if (!sprite) return;
            if (STYLE.shadows) shadow(sx, sy, 6 * cam.s, 2 * cam.s);
            placeSprite(ctx, sprite, sx, sy - (moving ? (step ? 1 : 0) * cam.s : 0), cam.s);
            // Sur la Carte : un grand fanion au-dessus de lui (« tu es ici »).
            if (p.map) overlays.push(() => drawChevron(ctx, sx, sy - 24 * cam.s - Math.abs(Math.sin(t * 2.2)) * 3 * mark, 1.6 * mark));
          },
        });
      }
      standing.sort((a, b) => b.depth - a.depth);
      for (const d of standing) d.draw();
      hits = newHits;

      // Les éclats d'un bloc posé : de petits carrés qui retombent.
      sparks.current = sparks.current.filter((sp) => now - sp.born < 700);
      for (const sp of sparks.current) {
        sp.vz -= 9 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.z += sp.vz * dt;
        const { sx, sy } = at(sp.x, sp.y, sp.z);
        ctx.fillStyle = sp.color;
        ctx.fillRect(Math.round(sx - cam.s), Math.round(sy - cam.s), Math.round(3 * cam.s), Math.round(3 * cam.s));
      }

      // La nuit : un voile bleu nuit sur le monde (les repères restent vifs, par-dessus). La 2D peinte n'en a pas : ses
      // couleurs sont déjà celles de la nuit de la palette.
      if (light < 1 && !paint) {
        ctx.fillStyle = `rgba(16, 24, 64, ${((1 - light) * 0.5).toFixed(3)})`;
        ctx.fillRect(0, 0, scr.w, scr.h);
      }

      // Les repères jaunes : au-dessus des bornes, la flèche « Commence ici », les balises d'un chemin à construire.
      for (const o of overlays) o();
      const mk = p.marker;
      // Sur la Carte, la flèche d'une île (la prochaine destination) se dessine plus bas, par-dessus les étiquettes.
      const mapArrowIsland = p.map && typeof mk === 'string' ? mk : null;
      if (mk && !mapArrowIsland) {
        const c = typeof mk === 'string' ? islandCenter(mk) : mk;
        // Une île : au-dessus de son cœur. Une case (le chantier du navire, calée sur le haut du mât en 3D) : juste
        // au-dessus de la coque, qui se voit de dessus.
        const top = p.vehicle ? p.vehicle.origin.z + 4 : c.z;
        const z = typeof mk === 'string' ? c.z + 2 : Math.min(c.z, top);
        const { sx, sy } = at(c.x + 0.5, c.y + 0.5, z);
        drawChevron(ctx, sx, sy - 18 * cam.s - Math.abs(Math.sin(t * 2.2)) * 3 * mark, mark);
      }
      // Le nom des îles ouvertes, sur l'île, en police de lecture (18 px à l'écran au moins) ; sur la Carte, toutes les
      // îles avec leur état (icône et mot, 16 px), écartées pour qu'aucune étiquette n'en cache une autre (celles des îles
      // fermées s'écartent d'abord), et hors de la bande des boutons du bas (72 px).
      // Sur la Carte, le fanion du bonhomme et la grande flèche de la destination, vus d'une vue (`c`) : la flèche pose
      // sa pointe sur l'île et s'écarte de côté si le fanion est tout près (le bonhomme sur la même île).
      const dprMarks = Math.min(window.devicePixelRatio || 1, 3);
      const arrowH = 48 * dprMarks;
      const mapMarks = (c: typeof cam) => {
        const out: { arrow: LabelBox | null; tip: { x: number; y: number } | null; beacon: LabelBox | null } = { arrow: null, tip: null, beacon: null };
        if (h.at && p.avatar && p.map) {
          const b = project(h.at.x + 0.5, h.at.y + 0.5, h.at.z);
          const feet = toScreen(c, scr, b.bx, b.by);
          const s = 1.6 * Math.max(1.5 * c.s, 3 * (window.devicePixelRatio || 1));
          const cy = feet.sy - 24 * c.s;
          out.beacon = { x: feet.sx, y: cy - 3.5 * s, w: 14 * s + 4, h: 13 * s + 3 };
        }
        if (mapArrowIsland) {
          const i = islandCenter(mapArrowIsland);
          const b = project(i.x + 0.5, i.y + 0.5, i.z + 2);
          const tip = toScreen(c, scr, b.bx, b.by);
          const shift = out.beacon ? separateMark({ x: tip.sx, y: tip.sy }, { x: out.beacon.x, y: out.beacon.y + out.beacon.h / 2 }, 56 * dprMarks) : { dx: 0, dy: 0 };
          out.tip = { x: tip.sx + shift.dx, y: tip.sy + shift.dy };
          out.arrow = { x: out.tip.x, y: out.tip.y - arrowH / 2, w: arrowH * 0.8, h: arrowH };
        }
        return out;
      };
      if (p.islandLabels?.length) {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const px = 18 * dpr;
        const list = p.islandLabels;
        const anchor = (l: (typeof list)[number], c: typeof cam) => {
          const i = islandCenter(l.id);
          const b = project(i.x + 0.5, i.y + 0.5, i.z + 2);
          const { sx, sy } = toScreen(c, scr, b.bx, b.by);
          return { x: sx, y: sy + 14 * dpr };
        };
        // L'écart se calcule pour le cadrage où la vue arrive (une fois, gardé tant qu'il ne change pas) : pendant
        // qu'elle glisse, les étiquettes suivent leur île sans sauter d'une place à l'autre.
        let offsets: LabelOffset[] | null = null;
        if (p.map) {
          const marks = `${mapArrowIsland ?? ''}:${h.at && p.avatar ? `${h.at.x},${h.at.y},${h.at.z}` : ''}`;
          const key = `${list.map((l) => `${l.id}:${l.text}:${l.state?.id ?? ''}`).join('|')}@${target.cx.toFixed(1)},${target.cy.toFixed(1)},${target.s.toFixed(3)},${scr.w}x${scr.h}@${marks}`;
          if (labelLayout?.key !== key) {
            const boxes = list.map((l) => ({ ...anchor(l, target), ...measureIslandLabel(ctx, l.text, px, l.state) }));
            // La flèche de la destination et le fanion du bonhomme restent visibles : aucune étiquette ne se pose dessus.
            const { arrow, beacon } = mapMarks(target);
            const obstacles = [arrow, beacon].filter((b): b is LabelBox => b !== null);
            labelLayout = { key, offsets: layoutLabels(boxes, 6 * dpr, { w: scr.w, h: scr.h - 72 * dpr }, list.map((l) => (l.state?.id === 'fermee' ? 0.5 : 1)), obstacles) };
          }
          offsets = labelLayout.offsets;
        }
        list.forEach((l, i) => {
          const a = anchor(l, cam);
          const o = offsets?.[i];
          drawIslandLabel(ctx, l.text, a.x + (o?.dx ?? 0), a.y + (o?.dy ?? 0), px, l.state);
        });
      }
      if (mapArrowIsland) {
        const { tip } = mapMarks(cam);
        if (tip) drawMapArrow(ctx, tip.x, tip.y - Math.abs(Math.sin(t * 2.2)) * 6 * dprMarks, arrowH);
      }
      if (p.trail?.length) {
        const pulse = 0.85 + Math.sin(t * 3) * 0.15;
        p.trail.forEach((c, i) => {
          if (i % 3) return;
          const { sx, sy } = at(c.x + 0.5, c.y + 0.5, c.z + 1);
          drawDiamond(ctx, sx, sy - 8 * cam.s, 3 * cam.s * pulse);
        });
      }
    };
    const start = () => {
      last = performance.now();
      loop();
    };
    start();

    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      observer.disconnect();
      if (dayTimer) window.clearInterval(dayTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('keydown', onKey);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onHover);
      canvas.remove();
      view.current = null;
    };
  }, [archipelago, reduceMotion]);

  return (
    <div
      ref={host}
      className={`voxel-canvas pixel-canvas ${className ?? ''}`.trim()}
      role="img"
      aria-label={`${label}. Au clavier : les flèches vont à l'île voisine.`}
    />
  );
}

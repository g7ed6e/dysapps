// Le monde en 2D : pixels nets, vue de dessus en oblique (le dessus des cases et les falaises). Même contrat que la
// vue 3D (world/view.ts), même simulation (world/scene.ts) ; le terrain est une carte de tuiles (oblique.ts) dessinée
// par morceaux, d'avance (draw.ts). Chargé à la demande, sans Three.js (voir ./index.ts).
// Étape 3 : le bonhomme, les créatures et les Gardiens, les panneaux des bornes et leurs repères, le jour et la nuit.
// Étape 4 : le Bloc-Navire (à quai, en chantier, en voyage).
import { useEffect, useRef, useState } from 'react';
import type { BiomeId } from '../biomes';
import type { PlaceId } from '../Voxel';
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
  startWalk,
  startVoyage,
  strollAt,
  voyageFrame,
  walkPose,
  type Stroll,
  type VoyageRun,
  type Walk,
} from '../world/scene';
import { islandAt, islandCenter } from '../world/terrain';
import { drawIslandLabel } from '../world/labelCanvas';
import { VEHICLE_DECK } from '../world/harbour';
import { vehiclePath } from '../world/voyage';
import { islandsOf } from '../world/archipelago';
import type { Cell, WorldViewProps } from '../world/view';
import { drawChunk, drawTileMap, type DrawEnv } from './draw';
import { propsOf, type Prop, type Station } from './props';
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
import { STYLE } from './style';
import { surfaceOf } from './surface';
import { blockedCells, cellAhead, stepFrom, type StepDir } from './walk';
import { CHUNK, TILE, buildTiles, frame2D, pickTile, project, toBase, toScreen, type TileMap, type View2D } from './oblique';

/** Sous ce niveau, les cubes sont sous la mer : on ne les dessine pas (la mer est un fond animé). */
const SEA_HIDES_BELOW = -1;
/** Marche libre : la durée d'un pas d'une case (six par seconde, comme la marche vers une île). */
const STEP_MS = 170;
/** Marche libre : les flèches du clavier et leur direction. */
const KEY_STEPS: Record<string, StepDir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

/** Morceaux de terrain dessinés au plus par image : le premier affichage reste fluide. */
const CHUNKS_PER_FRAME = 8;

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
  focus,
  reduceMotion = false,
  vehicle = null,
  onPickVehicle,
  voyage = null,
  onVoyageLegEnd,
  onVoyageSkip,
  onPickIsland,
  onPickBridge,
  build,
  creatures = [],
  onPickCreature,
  forceDay = false,
  marker = null,
  avatar,
  map = false,
  home,
  trail,
  quests,
  onPickQuest,
  onPickPlace,
  islandLabels,
  burst,
  freeWalk = false,
  onWalkedInto,
  className,
  label,
}: WorldViewProps) {
  const host = useRef<HTMLDivElement>(null);
  // Ce que la vue reçoit, lu au moment du geste ou de l'image (sans reconstruire la scène).
  const latest = { freeWalk, onWalkedInto, avatar: Boolean(avatar), onPickVehicle, onPickIsland, onPickBridge, onPickQuest, onPickPlace, onPickCreature, build, onVoyageLegEnd, onVoyageSkip, map, home, focus: focus.island, archipelago, vehicle, marker, trail, quests, forceDay, islandLabels };
  const props = useRef(latest);
  props.current = latest;
  const terrain = useRef<{
    map: TileMap;
    chunks: Map<string, HTMLCanvasElement | null>;
    tags: ReturnType<typeof cubeTags>;
    env: DrawEnv;
    /** Le décor en sprites. */
    props: Prop[];
    /** Les bornes de quête, en panneaux. */
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
  // La marche libre : la direction tenue (croix ou flèche), ce qu'il y a devant le bonhomme, et le geste « Entrer ».
  const held = useRef<StepDir | null>(null);
  const [ahead, setAhead] = useState<'quest' | 'place' | 'creature' | null>(null);
  const enter = useRef<() => void>(() => {});
  // Le Bloc-Navire : ses tuiles (pour le toucher) et son image, dessinée une fois à chaque changement.
  const ship = useRef<{ map: TileMap; image: ReturnType<typeof drawTileMap>; maxY: number } | null>(null);

  // ---- Le terrain : la carte des tuiles, et ses morceaux redessinés à la demande
  useEffect(() => {
    const sky = AMBIENCE[archipelago].sky;
    // Le décor en sprites (arbres, buissons…) et les bornes en panneaux : leurs cubes quittent le terrain.
    const split = STYLE.sprites ? propsOf(cubes) : { props: [], stations: [], terrain: cubes };
    terrain.current = {
      map: buildTiles(split.terrain, sky ? -Infinity : SEA_HIDES_BELOW),
      chunks: new Map(),
      tags: cubeTags(cubes),
      env: { surface: surfaceOf(cubes), style: STYLE, sea: !sky },
      props: split.props,
      stations: split.stations,
      places: new Map(cubes.filter((c) => c.place).map((c) => [`${c.x},${c.y}`, { place: c.place!, island: c.tag as BiomeId }])),
    };
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
    const image = drawTileMap(map, { surface: surfaceOf(vehicle.cubes), style: STYLE, sea: false });
    ship.current = { map, image, maxY: Math.max(0, ...vehicle.cubes.map((c) => c.y)) };
  }, [vehicle]);

  // ---- Les éclats à la pose d'un bloc
  useEffect(() => {
    if (!burst || burst.seq === 0 || reduceMotion) return;
    const now = performance.now();
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1 + Math.random() * 2;
      sparks.current.push({ x: burst.cell.x + 0.5, y: burst.cell.y + 0.5, z: burst.cell.z + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 3 + Math.random() * 3, born: now, color: burst.color });
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
    const seaTexture = faceCanvas(ambience.sky ? 'nuage' : 'eau', 'top');
    const sea = seaTexture ? ctx.createPattern(seaTexture, 'repeat') : null;

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
      // Marche libre : les flèches font marcher (tant qu'elles sont tenues), Entrée ou Espace entre.
      if (p.freeWalk) {
        const step = KEY_STEPS[e.key];
        if (step) {
          e.preventDefault();
          held.current = step;
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          enter.current();
          return;
        }
      }
      const dir = ARROW_DIRS[e.key];
      if (!dir || !p.onPickIsland) return;
      e.preventDefault();
      const here: BiomeId = p.focus ?? p.home ?? islandsOf(p.archipelago)[0].id;
      const next = islandInDirection(p.archipelago, islandCenter(here), dir);
      if (next) p.onPickIsland(next);
    };
    el.addEventListener('keydown', onKey);
    const onKeyUp = (e: KeyboardEvent) => {
      if (KEY_STEPS[e.key] === held.current) held.current = null;
    };
    el.addEventListener('keyup', onKeyUp);

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
    let aheadRef: 'quest' | 'place' | 'creature' | null = null;
    const loop = () => {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      running = true;
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = reduceMotion ? 0 : (now - t0) / 1000;
      const p = props.current;
      const tm = terrain.current;
      if (!tm) return;
      const scr = screen();
      if (p.forceDay && light !== 1) light = 1;

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

      // La marche libre : tant qu'une direction est tenue, un pas d'une case à la fois (six par seconde).
      const h = hero.current;
      const creaturesAt = walkers.current.map((wk) => {
        const o = wk.stroll.origin;
        return { id: wk.stroll.id, kind: wk.stroll.kind, x: o.x + wk.mid.x, y: o.y + wk.mid.y };
      });
      if (p.freeWalk && held.current && !h.walk && h.at && !vy) {
        const dir = held.current;
        h.facing = dir;
        const next = stepFrom(tm.env.surface, blockedCells(tm.props, tm.stations, creaturesAt), h.at, dir);
        if (next) {
          h.walk = startWalk([h.at, next], now, STEP_MS);
          // Sur une autre île (ouverte) : elle devient la sienne, la caméra glisse vers elle.
          const there = islandAt(p.archipelago, next.x, next.y);
          if (p.home && there !== p.home) p.onWalkedInto?.(there);
        }
      }

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
      const spot = p.focus && p.marker && typeof p.marker !== 'string' ? { ...p.marker, z: p.marker.z - 9 } : null;
      const target = frame2D({ archipelago: p.archipelago, map: p.map, island: p.focus, home: p.home ?? null, avatar: h.at, spot }, tm.map, scr);
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
      // La taille des repères : celle de la vue, mais jamais minuscules (sur la Carte, vue de loin).
      const mark = Math.max(1.5 * cam.s, 3 * (window.devicePixelRatio || 1));
      const at = (x: number, y: number, z: number) => {
        const b = project(x, y, z);
        return toScreen(cam, scr, b.bx, b.by);
      };

      // La mer : sa couleur (selon l'heure), et sa texture qui dérive lentement.
      const pal = palette(light, archipelago);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = hex(ambience.sky ? pal.sky : pal.water);
      ctx.fillRect(0, 0, scr.w, scr.h);
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
      for (let cy = Math.floor(tl.by / size); cy <= Math.floor(br.by / size); cy++) {
        for (let cx = Math.floor(tl.bx / size); cx <= Math.floor(br.bx / size); cx++) {
          const k = `${cx},${cy}`;
          if (!tm.map.chunks.has(k)) continue;
          if (!tm.chunks.has(k)) {
            if (drawn >= CHUNKS_PER_FRAME) continue;
            tm.chunks.set(k, drawChunk(tm.map, cx, cy, tm.env));
            drawn++;
          }
          const img = tm.chunks.get(k);
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
      for (const pr of tm.props) {
        if (!visibleAt(pr.x + 0.5, pr.y + 0.5, pr.z)) continue;
        standing.push({
          depth: pr.y - pr.z,
          draw: () => {
            const { sx, sy } = at(pr.x + 0.5, pr.y + 0.5, pr.z);
            drawSprite(ctx, pr.kind, pr.muted, sx, sy, cam.s, STYLE.shadows);
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
            if (STYLE.shadows) drawShadow(ctx, sx + cam.s, sy, 6 * cam.s, 2 * cam.s);
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
            if (STYLE.shadows) drawShadow(ctx, sx + cam.s, sy, (sprite.w / 2.4) * cam.s, 3 * cam.s);
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
                if (ghost && q.build) q.build.onPickFace(cell, cell);
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
            if (STYLE.shadows) drawShadow(ctx, sx, sy, 6 * cam.s, 2 * cam.s);
            placeSprite(ctx, sprite, sx, sy - (moving ? (step ? 1 : 0) * cam.s : 0), cam.s);
            // Sur la Carte : un grand fanion au-dessus de lui (« tu es ici »).
            if (p.map) overlays.push(() => drawChevron(ctx, sx, sy - 24 * cam.s - Math.abs(Math.sin(t * 2.2)) * 3 * mark, 1.6 * mark));
          },
        });
      }
      standing.sort((a, b) => b.depth - a.depth);
      for (const d of standing) d.draw();
      hits = newHits;

      // Marche libre : ce qu'il y a juste devant le bonhomme (une borne, une créature), pour le bouton « Entrer ».
      if (p.freeWalk && h.at && !h.walk) {
        const front = cellAhead(h.at, h.facing);
        const station = tm.stations.find((st) => st.x === front.x && st.y === front.y);
        const creature = creaturesAt.find((c) => Math.abs(c.x - (front.x + 0.5)) < 1.2 && Math.abs(c.y - (front.y + 0.5)) < 1.2);
        const place = tm.places.get(`${front.x},${front.y}`);
        const target = station ? 'quest' : place && p.onPickPlace ? 'place' : creature ? 'creature' : null;
        enter.current = () => {
          const q = props.current;
          if (station) {
            const [biome, typeId] = station.quest.split(':');
            q.onPickQuest?.(biome as BiomeId, typeId);
          } else if (place && q.onPickPlace) q.onPickPlace(place.place, place.island);
          else if (creature) {
            if (q.onPickCreature) q.onPickCreature(creature.id, creature.kind);
            else if (!q.build) q.onPickIsland?.(creature.id);
          }
        };
        if (target !== aheadRef) {
          aheadRef = target;
          setAhead(target);
        }
      } else if (aheadRef !== null) {
        aheadRef = null;
        setAhead(null);
      }

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

      // La nuit : un voile bleu nuit sur le monde (les repères restent vifs, par-dessus).
      if (light < 1) {
        ctx.fillStyle = `rgba(16, 24, 64, ${((1 - light) * 0.5).toFixed(3)})`;
        ctx.fillRect(0, 0, scr.w, scr.h);
      }

      // Les repères jaunes : au-dessus des bornes, la flèche « Commence ici », les balises d'un chemin à construire.
      for (const o of overlays) o();
      const mk = p.marker;
      if (mk) {
        const c = typeof mk === 'string' ? islandCenter(mk) : mk;
        // Une île : au-dessus de son cœur. Une case (le chantier du navire, calée sur le haut du mât en 3D) : juste
        // au-dessus de la coque, qui se voit de dessus.
        const top = p.vehicle ? p.vehicle.origin.z + 4 : c.z;
        const z = typeof mk === 'string' ? c.z + 2 : Math.min(c.z, top);
        const { sx, sy } = at(c.x + 0.5, c.y + 0.5, z);
        drawChevron(ctx, sx, sy - 18 * cam.s - Math.abs(Math.sin(t * 2.2)) * 3 * mark, mark);
      }
      // Le nom des îles ouvertes, sur l'île, en police de lecture (18 px à l'écran au moins).
      if (p.islandLabels?.length) {
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        for (const l of p.islandLabels) {
          const c = islandCenter(l.id);
          const { sx, sy } = at(c.x + 0.5, c.y + 0.5, c.z + 2);
          drawIslandLabel(ctx, l.text, sx, sy + 14 * dpr, 18 * dpr);
        }
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
      el.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointermove', onHover);
      canvas.remove();
      view.current = null;
    };
  }, [archipelago, reduceMotion]);

  // La croix de direction : tenir une flèche fait marcher, case par case ; la relâcher arrête.
  const pad = (dir: StepDir, text: string, name: string) => (
    <button
      type="button"
      className={`button pixel-pad-${dir}`}
      aria-label={name}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        held.current = dir;
      }}
      onPointerUp={() => (held.current = null)}
      onPointerCancel={() => (held.current = null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') held.current = dir;
      }}
      onKeyUp={() => (held.current = null)}
    >
      <span aria-hidden="true">{text}</span>
    </button>
  );
  return (
    <>
      <div
        ref={host}
        className={`voxel-canvas pixel-canvas ${className ?? ''}`.trim()}
        role="img"
        aria-label={`${label}. Au clavier : ${freeWalk ? 'les flèches font marcher, Entrée entre' : "les flèches vont à l'île voisine"}.`}
      />
      {freeWalk && (
        <div className="pixel-pad" role="group" aria-label="Marcher">
          {pad('up', '▲', 'Marcher vers le haut')}
          {pad('left', '◀', 'Marcher vers la gauche')}
          <button type="button" className={`button pixel-pad-enter${ahead ? ' primary' : ''}`} disabled={!ahead} onClick={() => enter.current()}>
            Entrer
          </button>
          {pad('right', '▶', 'Marcher vers la droite')}
          {pad('down', '▼', 'Marcher vers le bas')}
        </div>
      )}
    </>
  );
}

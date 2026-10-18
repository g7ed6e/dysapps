// La pose de la remise et les pastilles des habitants, dans la scène du monde ouvert (GD-20, point 4, piste B « La
// remise » ; sortis de scene.ts au lot L2, piste de l'expert frontend, pour que la scène ne grossisse plus) :
// - la pose (lots L1 et L2) : ce qui se pose pendant la remise (l'aménagement d'une commande, la caisse et les blocs de
//   « Donner », l'objet d'entraide d'« Apporter »), dessiné à part, du matériau des lieux ; ses éléments posés par la
//   plage de dessin, celui qui arrive dans le maillage de la réaction : il descend de haut (un élément, un bloc), ou
//   glisse depuis la main de Kéo (l'objet apporté), et ralentit en arrivant ; un toc par élément posé, un seul avec
//   « Réduire les animations » (tout d'un coup) ;
// - les pastilles (lot L1) : au-dessus de la place de l'habitant, là où la remise se joue, comme un cadenas au-dessus de
//   son pont ; la même liste, remplie sur place à chaque image, refaite quand la page change les lieux.
// La scène garde le cadrage, la caméra et la boucle ; ces deux fabriques n'ont aucune minuterie : la boucle de la scène
// les fait avancer (`step`, `report`).
import * as THREE from 'three';
import type { PlacedAmenagement } from '../../world/continu/amenagements';
import type { Facets } from '../../world/continu/facets';
import type { Vec3 } from '../../world/continu/geometry';
import type { PlaceId } from '../../world/continu/levelPlan';
import { remiseAt } from '../../world/continu/remise';

/** Ce que la remise dit à la page : un élément posé (son toc), la pose finie d'elle-même. */
export interface RemiseEvents {
  element(): void;
  done(): void;
}

/** Ce qui se pose : ses facettes et ses éléments (`PlacedAmenagement`), d'où arrive chaque élément, et son temps. */
export interface RemisePiece {
  place: PlaceId;
  /** L'aménagement (sa sauvegarde) : une fois livré, il est dessiné avec les lieux, et la pose se cache ; rien pour la caisse. */
  id: string | null;
  placed: PlacedAmenagement;
  /** D'où part l'élément qui arrive, depuis sa place : de haut (la descente), ou de la main de Kéo (l'objet apporté). */
  from: Vec3;
  /** Le temps d'un élément, en secondes. */
  per: number;
}

interface Deps {
  /** Le maillage de la pose (à part, du matériau des lieux). */
  mesh: THREE.Mesh;
  /** Le maillage de la réaction : l'élément qui arrive. */
  reaction: THREE.Mesh;
  material: THREE.Material;
  reduceMotion: boolean;
  /** L'aménagement est-il déjà dessiné avec les lieux (livré, la page l'y a mis) ? */
  delivered(place: PlaceId, id: string): boolean;
  geometryOf(f: Facets): THREE.BufferGeometry;
  setGeometry(mesh: THREE.Mesh, f: Facets): void;
}

/** La pose de la remise : jouée, lancée, finie, avancée image par image, quittée. */
export function createRemiseRun({ mesh, reaction, material, reduceMotion, delivered, geometryOf, setGeometry }: Deps) {
  let run: (RemisePiece & { start: number | null; posed: number; falling: number; done: boolean; on?: RemiseEvents }) | null = null;
  const isDelivered = () => Boolean(run && run.id !== null && delivered(run.place, run.id));
  /** Le début du premier triangle d'un élément qui arrive : l'assise (ou la caisse) reste là dès le début. */
  const fallFrom = (r: NonNullable<typeof run>, i: number) => (i === 0 ? (r.placed.assise?.to ?? 0) : r.placed.elements[i].from);
  /** Les `posed` premiers éléments posés (et l'assise, ou la caisse, toujours là). */
  const draw = (r: NonNullable<typeof run>, posed: number) => {
    const to = posed > 0 ? r.placed.elements[posed - 1].to : (r.placed.assise?.to ?? 0);
    mesh.geometry.setDrawRange(0, to * 3);
    mesh.visible = to > 0 && !isDelivered();
  };
  const end = () => {
    if (!run) return;
    run = null;
    mesh.visible = false;
    reaction.visible = false;
    reaction.position.set(0, 0, 0);
  };
  return {
    /** Prépare la pose : rien de posé encore (l'assise, ou la caisse, seule). */
    play(piece: RemisePiece, on?: RemiseEvents) {
      end();
      run = { ...piece, start: null, posed: 0, falling: -1, done: false, on };
      mesh.geometry.dispose();
      mesh.geometry = geometryOf(piece.placed.facets);
      draw(run, 0);
    },
    /** La pose part : un calme, puis chaque élément arrive à sa place. */
    start() {
      if (run && run.start === null && !run.done) run.start = performance.now() / 1000;
    },
    /** L'état final, tout de suite : tout est posé. */
    finish() {
      if (!run) return;
      run.done = true;
      run.posed = run.placed.elements.length;
      draw(run, run.posed);
      reaction.visible = false;
    },
    /** La pose à l'instant `t` (en secondes) : un toc par élément posé (un seul, tout d'un coup, avec « Réduire les animations »). */
    step(t: number) {
      const r = run;
      if (!r || r.start === null || r.done) return;
      const n = r.placed.elements.length;
      const m = remiseAt(t - r.start, n, reduceMotion, r.per);
      if (m.posed !== r.posed) {
        r.posed = m.posed;
        draw(r, m.posed);
        r.on?.element();
      }
      if (m.falling) {
        const i = m.falling.index;
        if (r.falling !== i) {
          r.falling = i;
          const f = r.placed.facets;
          const [from, to] = [fallFrom(r, i), r.placed.elements[i].to];
          setGeometry(reaction, { positions: f.positions.slice(from * 9, to * 9), normals: f.normals.slice(from * 9, to * 9), colors: f.colors.slice(from * 9, to * 9), triangles: to - from });
          reaction.material = material;
          reaction.rotation.set(0, 0, 0);
          reaction.scale.set(1, 1, 1);
        }
        // Il arrive de son départ et ralentit en arrivant (rien ne rebondit).
        const k = 1 - (1 - m.falling.amount) ** 3;
        reaction.position.set(r.from.x * (1 - k), r.from.y * (1 - k), r.from.z * (1 - k));
        reaction.visible = true;
      } else reaction.visible = false;
      if (m.done) {
        r.done = true;
        reaction.visible = false;
        r.on?.done();
      }
    },
    end,
    /** La pose se joue-t-elle (même finie, tant que la remise n'est pas quittée) ? */
    get active() {
      return run !== null;
    },
  };
}

/** La pastille de l'habitant d'un lieu, à l'écran : en pixels, et si elle se voit. */
export interface SignOnScreen {
  place: PlaceId;
  x: number;
  y: number;
  shown: boolean;
}

/**
 * Les pastilles des habitants : `anchorOf` dit où se tient chacune dans le monde, `place` écrit dans la pastille où elle
 * tombe à l'écran et si elle se voit (sur place : rien n'est alloué à chaque image) ; `onSigns` les rend à la page
 * (aucune n'est dessinée dans la 3D).
 */
export function createSignsTracker({ anchorOf, place, onSigns }: { anchorOf(place: PlaceId): Vec3; place(anchor: THREE.Vector3, sign: SignOnScreen): void; onSigns?(signs: readonly SignOnScreen[]): void }) {
  let signs: SignOnScreen[] = [];
  const anchors = new Map<PlaceId, THREE.Vector3>();
  return {
    set(places: readonly PlaceId[]) {
      if (places.length === signs.length && places.every((p, i) => signs[i].place === p)) return;
      signs = places.map((p) => ({ place: p, x: 0, y: 0, shown: false }));
      for (const p of places) {
        if (anchors.has(p)) continue;
        const a = anchorOf(p);
        anchors.set(p, new THREE.Vector3(a.x, a.y, a.z));
      }
      onSigns?.(signs);
    },
    report() {
      if (!signs.length) return;
      for (const s of signs) {
        const anchor = anchors.get(s.place);
        if (!anchor) continue;
        place(anchor, s);
      }
      onSigns?.(signs);
    },
    hide() {
      if (!signs.some((s) => s.shown)) return;
      for (const s of signs) s.shown = false;
      onSigns?.(signs);
    },
  };
}

// Les maquettes des lieux du prototype (le Phare, les Quais, les Filets, les Écluses) : des volumes simples dessinés
// par le code, en aplats francs (le low poly d'Archipéo), dans le repère du lieu (le centre au sol en 0, le nord vers
// −z). `modelOfPlace` est l'emplacement où les modèles TRELLIS des pièces seules se glisseront ensuite, sur le mot du
// mainteneur : la vue ne lit que ce qu'il rend. Les lieux sont éteints ou démontés (fiche du 6e) : aucune lumière, aucun
// texte (rien à lire dans la 3D). Code pur.
import { FacetBuilder, boundsOf, type Facets } from './facets';
import type { PlaceId } from './plan6e';

/** Le modèle d'un lieu : ses facettes dans son repère, d'où il vient, et la hauteur de son sommet (la marque s'y pose). */
export interface PlaceModel {
  facets: Facets;
  /** `dessine` : les volumes de ce fichier ; `importe` : un modèle TRELLIS (pas encore). */
  source: 'dessine';
  top: number;
}

/** Sous le sol : les pieds des volumes s'enfoncent d'autant, pour ne jamais flotter sur une pente. */
const SINK = -0.8;

const C = {
  white: 0xf2eee4,
  stone: 0xb9b2a3,
  darkStone: 0x9a9488,
  // Rien de presque noir (directeur artistique, 14 octobre 2026) : l'ardoise est un gris-bleu franc.
  slate: 0x6f8089,
  // La vitre de la lanterne éteinte : claire, gris-bleu, proche de la Brume du pack (#E5EBE3) : elle peut se rallumer.
  glass: 0xbfd0d3,
  // La galerie du Phare : une pierre claire, plus sombre que la tour, pour qu'elle se détache.
  gallery: 0x9aa6a8,
  door: 0x7a5538,
  wood: 0xa9784a,
  darkWood: 0x8a6440,
  straw: 0xd9a441,
  wall: 0xe9dcc0,
  net: 0x8e7b5a,
  crate: 0xb5793f,
  tarp: 0x4f7fa3,
  rust: 0xb0583a,
  water: 0x2fb5a6,
} as const;

/**
 * Le Phare, éteint mais prêt à se rallumer : la tour blanche sur son socle de rochers, une galerie large et bien
 * marquée (sa dalle et son garde-corps), la lanterne à la vitre claire, sans feu, et l'ardoise sur le toit seulement.
 */
function phare(b: FacetBuilder): void {
  b.prism({ x: 0, y: SINK, z: 0 }, 3.6, 2.9, 1.5, 7, C.darkStone);
  b.prism({ x: 0, y: 0.7, z: 0 }, 1.7, 1.2, 10, 8, C.white);
  b.prism({ x: 0, y: 10.7, z: 0 }, 2.1, 2.1, 0.4, 8, C.gallery);
  b.prism({ x: 0, y: 11.1, z: 0 }, 2.0, 2.0, 0.45, 8, C.gallery);
  b.prism({ x: 0, y: 11.1, z: 0 }, 1.05, 1.05, 1.5, 8, C.glass);
  b.prism({ x: 0, y: 12.6, z: 0 }, 1.35, 0, 1.1, 8, C.slate);
  b.box({ x: 0, y: 0.7, z: 1.55 }, [0.9, 1.6, 0.3], C.door);
}

/** Les Quais : la grue au bord de l'eau, les caisses, le hangar, les bittes d'amarrage. */
function quais(b: FacetBuilder): void {
  // La grue : son pied, son mât, sa flèche vers le ponton (au nord-ouest), son crochet.
  b.box({ x: -2.6, y: SINK, z: -1.6 }, [1.6, 1.4, 1.6], C.darkStone);
  b.box({ x: -2.6, y: 0.6, z: -1.6 }, [0.45, 6, 0.45], C.rust);
  b.box({ x: -4.2, y: 6.3, z: -2.6, yaw: Math.atan2(1, 1.6) }, [4.6, 0.4, 0.4], C.rust);
  b.box({ x: -5.6, y: 3.4, z: -3.5 }, [0.12, 2.9, 0.12], C.slate);
  b.box({ x: -5.6, y: 3, z: -3.5 }, [0.6, 0.4, 0.6], C.slate);
  // Les caisses, en tas.
  b.box({ x: 0.2, y: SINK, z: -0.4 }, [1.4, 2, 1.4], C.crate, 0xc98d50);
  b.box({ x: 1.7, y: SINK, z: -0.2 }, [1.4, 2, 1.4], C.tarp);
  b.box({ x: 0.9, y: 1.2, z: -0.3 }, [1.3, 1.1, 1.3], C.crate, 0xc98d50);
  b.box({ x: 0.6, y: SINK, z: 1.3 }, [1.2, 1.7, 1.2], C.crate, 0xc98d50);
  // Le hangar, au fond.
  b.box({ x: 3.6, y: SINK, z: 2.6 }, [4.2, 3.6, 3], C.wall);
  b.gableRoof({ x: 3.6, y: 2.8, z: 2.6 }, 4.6, 3.4, 1.4, C.rust, C.wall);
  b.box({ x: 3.6, y: SINK, z: 1.08 }, [1.4, 2.6, 0.1], C.darkWood);
  // Deux bittes d'amarrage au bord.
  b.prism({ x: -1.2, y: SINK, z: -2.8 }, 0.25, 0.25, 1.2, 6, C.slate);
  b.prism({ x: -3.8, y: SINK, z: 0.4 }, 0.25, 0.25, 1.2, 6, C.slate);
}

/** Les Filets : deux cabanes de pêcheurs au toit de chaume, un séchoir à filets, une barque tirée sur le sable. */
function filets(b: FacetBuilder): void {
  for (const [x, z, s] of [[-2.4, -0.6, 1], [2.2, -1.4, 0.85]] as const) {
    b.box({ x, y: SINK, z }, [3 * s, 2.6 * s - SINK, 2.4 * s], C.wall);
    b.gableRoof({ x, y: 1.8 * s, z }, 3.5 * s, 2.9 * s, 1.5 * s, C.straw, C.wall);
    b.box({ x, y: SINK, z: z + 1.21 * s }, [0.8 * s, 1.5 * s - SINK, 0.08], C.darkWood);
  }
  // Le séchoir : trois poteaux, une perche, deux pans de filet.
  for (const x of [-2.6, 0, 2.6]) b.box({ x, y: SINK, z: 2.4 }, [0.22, 3 - SINK, 0.22], C.darkWood);
  b.box({ x: 0, y: 2.8, z: 2.4 }, [5.6, 0.18, 0.18], C.darkWood);
  b.box({ x: -1.3, y: 0.6, z: 2.4 }, [2.4, 2.1, 0.06], C.net);
  b.box({ x: 1.3, y: 0.6, z: 2.4 }, [2.4, 2.1, 0.06], C.net);
  // La barque, retournée sur le sable.
  b.box({ x: 4.3, y: SINK, z: 1, yaw: 0.5 }, [1.2, 1.3, 3], C.wood, C.darkWood);
}

/** Les Écluses, démontées : trois bassins de pierre en escalier, la porte d'aval, et la roue arrêtée. */
function ecluses(b: FacetBuilder): void {
  const steps = [
    { z: -3, top: 1.6 },
    { z: 0, top: 0.9 },
    { z: 3, top: 0.2 },
  ];
  for (const { z, top } of steps) {
    b.box({ x: 0, y: SINK, z }, [4.4, top - SINK, 3], C.stone);
    // L'eau du bassin, juste sous le bord.
    b.box({ x: 0, y: top - 0.25, z }, [3.4, 0.3, 2.2], C.stone, C.water);
  }
  // La porte d'aval, entre le sas et le bassin du bas : des vantaux de bois sombre, leurs bornes de pierre aux gonds et
  // leurs balanciers couchés sur les murs du sas (une porte d'écluse, pas une planche). Celle d'amont est des pièces du
  // lieu (questionScene.ts, `placePieces`) : fermée, puis ouverte par la réussite de la scénette.
  b.box({ x: 0, y: 0, z: 1.5 }, [3.6, 1.2, 0.3], C.darkWood);
  for (const side of [-1, 1]) {
    b.box({ x: side * 1.95, y: 0.9, z: 1.5 }, [0.4, 0.45, 0.4], C.darkStone, C.stone);
    // Couchés sur le mur du sas (son haut à 0,9), pas au-dessus.
    b.beam({ x: side * 1.5, y: 0.99, z: 1.5 }, { x: side * 2, y: 0.99, z: 0.1 }, 0.18, C.darkWood);
  }
  // La Roue, arrêtée, à l'est du sas : un tambour fermé (ses deux faces, leurs rayons), au-dessus de son socle de
  // pierre (où passeront ses pales), son axe porté par deux piles. Elle se lit comme une roue posée, jamais comme un arc
  // en l'air ; la Roue qui tourne (questionScene.ts, `placePieces`) l'enveloppe au même axe.
  const wheel = { x: WHEEL.x, y: WHEEL.y, z: WHEEL.z };
  b.box({ x: wheel.x, y: SINK, z: wheel.z }, [1.5, wheel.y - WHEEL.r - 0.2 - SINK, 1.8], C.darkStone, C.stone);
  for (const dx of [-0.55, 0.55]) b.box({ x: wheel.x + dx, y: SINK, z: wheel.z }, [0.3, wheel.y + 0.3 - SINK, 0.45], C.darkStone, C.stone);
  b.beam({ x: wheel.x - 0.8, y: wheel.y, z: wheel.z }, { x: wheel.x + 0.8, y: wheel.y, z: wheel.z }, 0.22, C.darkWood);
  const w = WHEEL.width / 2;
  b.drum({ x: wheel.x - w, y: wheel.y, z: wheel.z, yaw: Math.PI / 2, pitch: Math.PI / 2 }, WHEEL.r, WHEEL.width, 10, C.wood, C.darkWood);
  // Les rayons, sur ses deux faces.
  for (const fx of [-w - 0.012, w + 0.012])
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3;
      const half = WHEEL.r - 0.15;
      b.box({ x: wheel.x + fx, y: wheel.y - half * Math.cos(a), z: wheel.z - half * Math.sin(a), pitch: a }, [0.024, 2 * half, 0.16], C.wood);
    }
}

/**
 * La Roue des Écluses, dans le repère du lieu : son axe (est-ouest), son rayon et sa largeur, arrêtée. La Roue qui
 * tourne, plus grande d'un rien, l'enveloppe au même axe (aucune face confondue, rien de l'arrêtée ne dépasse).
 */
export const WHEEL = { x: 3.05, y: 1.5, z: -0.4, r: 1.5, width: 0.44 } as const;

const DRAWN: Record<PlaceId, (b: FacetBuilder) => void> = { phare, quais, filets, ecluses };

const cache = new Map<PlaceId, PlaceModel>();

/**
 * Le modèle d'un lieu, dans son repère : aujourd'hui ses volumes dessinés ; demain, le modèle TRELLIS de sa pièce seule
 * quand il existera (même repère, même retour).
 */
export function modelOfPlace(id: PlaceId): PlaceModel {
  let m = cache.get(id);
  if (!m) {
    const b = new FacetBuilder();
    DRAWN[id](b);
    const facets = b.build();
    m = { facets, source: 'dessine', top: boundsOf(facets).max[1] };
    cache.set(id, m);
  }
  return m;
}

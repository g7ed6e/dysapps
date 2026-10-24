// L'envoi des textures des habitants et des équipiers de scénette à la carte graphique, en bandes (choix du mainteneur
// du 24 octobre 2026, « Bandes et résolution », après la remesure de l'iPad) : envoyée d'un bloc, une image de 2048 faisait
// une image de 124 à 298 ms à l'arrêt, à l'arrivée et en scénette. La texture est d'abord réservée (sans ses pixels),
// puis remplie bande par bande, une bande par image, et ses mipmaps faits à la dernière. Ses bandes sont découpées hors
// du fil principal (`createImageBitmap`). Une texture qu'on va dessiner avant la fin est finie d'un coup (`finish`), comme
// Three.js l'aurait envoyée de lui-même : jamais une bande vide à l'écran.
import * as THREE from 'three';

/** La hauteur d'une bande, en pixels : seize bandes pour une image de 2048, huit pour une de 1024. */
const BAND_ROWS = 128;

interface Pending {
  texture: THREE.Texture;
  /** Les bandes découpées, `null` tant qu'elles ne sont pas prêtes, `'failed'` si le découpage a manqué. */
  bands: ImageBitmap[] | null | 'failed';
  /** Le découpage lancé. */
  cut: boolean;
  /** La texture réservée dans la carte graphique (sans ses pixels). */
  allocated: boolean;
  /** La prochaine bande à envoyer. */
  next: number;
}

export interface TextureUploads {
  /** Une texture à envoyer plus tard, bande par bande (son image : une `ImageBitmap`). */
  add(texture: THREE.Texture): void;
  /** Un pas de l'envoi : la bande suivante de la première texture en attente (ou son découpage, ou sa réservation). */
  step(): void;
  /** La texture finie d'un coup si elle attend encore : elle va être dessinée. */
  finish(texture: THREE.Texture): void;
  /** Une texture encore en attente. */
  has(texture: THREE.Texture): boolean;
  /** Tout oublié (le monde défait). */
  clear(): void;
}

export function createTextureUploads(renderer: THREE.WebGLRenderer, rows = BAND_ROWS): TextureUploads {
  const queue = new Map<THREE.Texture, Pending>();
  const at = new THREE.Vector2();

  const closeBands = (p: Pending) => {
    if (Array.isArray(p.bands)) for (const b of p.bands) b.close();
    p.bands = null;
  };
  const forget = (p: Pending) => {
    closeBands(p);
    p.texture.removeEventListener('dispose', onDispose);
    queue.delete(p.texture);
  };
  const onDispose = (e: { target: THREE.Texture }) => {
    const p = queue.get(e.target);
    if (p) forget(p);
  };

  const image = (t: THREE.Texture) => t.image as ImageBitmap;

  /** Les bandes découpées hors du fil principal ; un échec (navigateur sans découpage) : la texture part d'un coup. */
  const cut = (p: Pending) => {
    p.cut = true;
    const bitmap = image(p.texture);
    const tops: number[] = [];
    for (let y = 0; y < bitmap.height; y += rows) tops.push(y);
    void Promise.all(
      tops.map((y) => createImageBitmap(bitmap, 0, y, bitmap.width, Math.min(rows, bitmap.height - y), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })),
    ).then(
      (bands) => {
        if (queue.get(p.texture) === p) p.bands = bands;
        else for (const b of bands) b.close();
      },
      () => {
        if (queue.get(p.texture) === p) p.bands = 'failed';
      },
    );
  };

  /** La texture réservée sans ses pixels : Three.js en fait la place (et ses mipmaps vides), rien n'est envoyé. */
  const allocate = (p: Pending) => {
    p.allocated = true;
    p.texture.source.dataReady = false;
    renderer.initTexture(p.texture);
    p.texture.source.dataReady = true;
  };

  /** Une bande copiée à sa place ; les mipmaps refaits à la dernière seulement. */
  const sendBand = (p: Pending, bands: ImageBitmap[]) => {
    const i = p.next++;
    const last = p.next === bands.length;
    const keep = p.texture.generateMipmaps;
    p.texture.generateMipmaps = keep && last;
    renderer.copyTextureToTexture(new THREE.Texture(bands[i]), p.texture, null, at.set(0, i * rows));
    p.texture.generateMipmaps = keep;
    if (last) forget(p);
  };

  /** Toute l'image d'un coup, à la place des bandes qui manquent. */
  const sendWhole = (p: Pending) => {
    forget(p);
    if (p.allocated) renderer.copyTextureToTexture(new THREE.Texture(image(p.texture)), p.texture);
    else renderer.initTexture(p.texture);
  };

  return {
    add: (texture) => {
      if (queue.has(texture)) return;
      queue.set(texture, { texture, bands: null, cut: false, allocated: false, next: 0 });
      texture.addEventListener('dispose', onDispose);
    },
    step: () => {
      const p = queue.values().next().value;
      if (!p) return;
      if (!p.cut) return cut(p);
      if (p.bands === 'failed') return sendWhole(p);
      if (!p.bands) return;
      if (!p.allocated) return allocate(p);
      sendBand(p, p.bands);
    },
    finish: (texture) => {
      const p = queue.get(texture);
      if (!p) return;
      if (!p.allocated || !Array.isArray(p.bands)) return sendWhole(p);
      while (queue.has(texture)) sendBand(p, p.bands);
    },
    has: (texture) => queue.has(texture),
    clear: () => {
      for (const p of queue.values()) forget(p);
    },
  };
}

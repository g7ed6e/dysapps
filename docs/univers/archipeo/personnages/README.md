# Les personnages d’Archipéo en images de concept

Une image par créature et par Gardien des 51 îles, soit 102 images. Elles servent d’entrée à TRELLIS.2, qui tire un modèle 3D d’une seule image ; le modèle est ensuite réduit au budget du jeu et peint aux couleurs de la palette. Demandé par le mainteneur le 7 octobre 2026, après le banc d’essai du Lion de pierre.

Ces images sont des références de travail, pas le jeu : l’application ne les importe ni ne les charge.

## La fiche

| | |
| --- | --- |
| Outil | [mflux](https://github.com/filipstrand/mflux) 0.20.0 (licence MIT), en local sur un Mac à puce Apple (16 Go) |
| Modèle | Z-Image Turbo, version compressée MLX 4 bits [`deepsweet/Z-Image-Turbo-6B-MLX-Q4`](https://huggingface.co/deepsweet/Z-Image-Turbo-6B-MLX-Q4) (licence Apache 2.0) |
| Réglages | 1024 × 1024, 9 étapes, graine 1206, un prompt par image ; les images refaites en seconde passe ont leur graine notée dans `prompts.md` |
| Prompts | [`prompts.md`](prompts.md) : écrits par le consultant Archipéo d’après les règles du lot R6 ([`../intentions/r6-personnages.md`](../intentions/r6-personnages.md)) et le prompt du Lion de pierre validé par le mainteneur |
| Format | WebP (qualité 90), 1024 × 1024, converti depuis le PNG produit |
| Nom | `<archipel>-<île>-<creature ou gardien>-<nom>.webp`, le même que dans `prompts.md` |

## Ce que montrent les images

- **Les créatures** : debout, petits yeux sombres sans blanc ni sourire, trois couleurs (la dominante de l’espèce, une tenue de lin ou de cuir, l’outil du métier), sans socle.
- **Les Gardiens** : des sentinelles de pierre éteinte (`#8E8C84`, une ou deux facettes de lichen `#7A8A6A`) sur un socle bas octogonal.
- **Pour toutes** : low-poly à grandes facettes plates, vue de trois quarts avant gauche, un seul personnage entier sur un fond gris clair uni, sans décor ni texte.

Le lichen des images ne passe pas dans les modèles 3D : au moment de peindre les facettes aux couleurs du jeu, toutes celles des Gardiens deviennent pierre `#8E8C84` (décision du mainteneur, 8 octobre 2026) ; les images ne sont pas regénérées.

Les deux Sphinx (des routes, de marbre) sortent toujours avec une barbe postiche et un ornement au front, quel que soit le prompt : on les retire au moment du modèle 3D (décision du mainteneur, 8 octobre 2026). Bazar garde sa balance, avec le plateau pendu que le modèle d’image ajoute toujours (décision du mainteneur, 8 octobre 2026). Le Golem des équations garde lui aussi sa balance aux plateaux pendus : on épaissit ou on rattache les fils au moment du modèle 3D (décision du mainteneur, 8 octobre 2026).

46 personnages n’avaient pas de fiche R6 : le consultant Archipéo a déduit leur métier, leur outil, leur couleur ou la forme de leur Gardien de leur espèce, de la matière de l’île et du code (`src/game/world/characters/species/`). Ils sont marqués « déduit » dans `prompts.md`.

## Refaire une image

Avec mflux installé (`uv tool install --python 3.12 mflux`) :

```sh
mflux-generate-z-image-turbo --base-model z-image-turbo --model deepsweet/Z-Image-Turbo-6B-MLX-Q4 \
  --width 1024 --height 1024 --steps 9 --seed 1206 --output <nom>.png --prompt "<prompt>"
```

Environ 6 minutes par image et 11 Go de mémoire sur le Mac de référence.

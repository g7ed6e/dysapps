// Produit par `npm run contenu` depuis docs/contenu/assemblage.md : ne pas éditer.
import type { Assemblage } from './assemblage';

export const ASSEMBLAGE = {
  "lieu": {
    "blocland": {
      "titre": "La Fabrique",
      "a": "à la Fabrique",
      "presentation": "Ici, tu assembles tes blocs pour en faire des pièces que les monuments attendent."
    },
    "archipeo": {
      "titre": "La Halle aux matériaux",
      "a": "à la Halle aux matériaux",
      "presentation": "Les anciens savaient assembler ce qu’aucune île ne donne seule. Ici, tu retrouves leur savoir-faire pour les monuments."
    }
  },
  "recettes": [
    {
      "bloc": "poutre",
      "archipelago": "6e",
      "ingredients": [
        {
          "bloc": "bois",
          "n": 2
        },
        {
          "bloc": "pierre",
          "n": 1
        }
      ],
      "noms": {
        "blocland": {
          "nom": "Poutre"
        },
        "archipeo": {
          "nom": "Madrier"
        }
      }
    },
    {
      "bloc": "vitrail",
      "archipelago": "5e",
      "ingredients": [
        {
          "bloc": "glace",
          "n": 2
        },
        {
          "bloc": "panneau",
          "n": 1
        }
      ],
      "noms": {
        "blocland": {
          "nom": "Vitrail",
          "pluriel": "vitraux"
        },
        "archipeo": {
          "nom": "Hublot"
        }
      }
    },
    {
      "bloc": "engrenage",
      "archipelago": "4e",
      "ingredients": [
        {
          "bloc": "acier",
          "n": 2
        },
        {
          "bloc": "rail",
          "n": 1
        }
      ],
      "noms": {
        "blocland": {
          "nom": "Engrenage"
        },
        "archipeo": {
          "nom": "Poulie"
        }
      }
    },
    {
      "bloc": "miroir",
      "archipelago": "3e",
      "ingredients": [
        {
          "bloc": "lentille",
          "n": 2
        },
        {
          "bloc": "quartz",
          "n": 1
        }
      ],
      "noms": {
        "blocland": {
          "nom": "Miroir"
        },
        "archipeo": {
          "nom": "Loupe"
        }
      }
    }
  ]
} satisfies Assemblage;

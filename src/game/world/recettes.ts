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
      "bloc": "compound-6e",
      "archipelago": "6e",
      "ingredients": [
        {
          "bloc": "french-6e-phonology",
          "n": 2
        },
        {
          "bloc": "maths-6e-calculation",
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
      "bloc": "compound-5e",
      "archipelago": "5e",
      "ingredients": [
        {
          "bloc": "maths-5e-signed-numbers",
          "n": 2
        },
        {
          "bloc": "french-5e-homophones",
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
      "bloc": "compound-4e",
      "archipelago": "4e",
      "ingredients": [
        {
          "bloc": "maths-4e-powers",
          "n": 2
        },
        {
          "bloc": "english-4e-grammar",
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
      "bloc": "compound-3e",
      "archipelago": "3e",
      "ingredients": [
        {
          "bloc": "french-3e-close-reading",
          "n": 2
        },
        {
          "bloc": "maths-3e-statistics",
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

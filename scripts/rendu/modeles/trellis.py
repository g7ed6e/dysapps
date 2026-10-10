# Fait le modèle brut d'un personnage d'Archipéo à partir de son concept, avec le Space microsoft/TRELLIS.2 (licence MIT)
# sous le compte Hugging Face du mainteneur : le jeton est posé par l'environnement (secret réseau sur huggingface.co et
# *.hf.space), jamais écrit ici. Réglages du Lion : résolution 512, texture 1024. Un passage prend environ 40 secondes du
# quota du compte (environ 25 minutes par jour, partagé entre les fils qui génèrent).
#
#   python3 trellis.py -- <dossier de sortie> <concept.webp> [<concept.webp>…]
#
# Écrit <dossier de sortie>/<nom du concept>.glb, sans refaire un brut déjà là. Les bruts vont ensuite dans la
# Bibliothèque du projet (archipeo/personnages-3d/bruts/), jamais dans le dépôt, puis passent par lot.py.
# Dépendance : gradio_client (pip install gradio_client).

import os, shutil, sys
from gradio_client import Client, handle_file

SPACE = "microsoft/TRELLIS.2"
RESOLUTION, TEXTURE, SEED = "512", 1024, 0


def generate(client, concept, out):
    """Le brut d'un concept : détourer l'image, la passer en 3D, puis extraire le .glb texturé."""
    client.predict(api_name="/start_session")
    image = client.predict(handle_file(concept), api_name="/preprocess_image")
    client.predict(handle_file(image), SEED, RESOLUTION, api_name="/image_to_3d")
    glb, _ = client.predict(300000, TEXTURE, api_name="/extract_glb")
    shutil.copyfile(glb, out)


def main():
    args = sys.argv[sys.argv.index("--") + 1:]
    folder, concepts = args[0], args[1:]
    os.makedirs(folder, exist_ok=True)
    client = Client(SPACE)
    for concept in concepts:
        name = os.path.splitext(os.path.basename(concept))[0]
        out = os.path.join(folder, f"{name}.glb")
        if os.path.exists(out):
            print(name, "déjà là")
            continue
        generate(client, concept, out)
        print(name, "fait")


if __name__ == "__main__":
    main()

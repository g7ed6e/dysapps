# Prepare d'un coup tous les Gardiens d'un dossier : pour chaque .glb sorti de TRELLIS.2,
# aligner (aligner.py), reduire et peindre en 200 et 1500 triangles (lion_lowpoly.py), couper le socle (couper.py),
# puis un rendu de controle. Une seule commande pour tout le dossier :
#
#   blender -b -P lot.py -- <dossier des .glb>
#   ou, sans Blender installe, avec le module bpy (Python 3.11) : python lot.py -- <dossier des .glb>
#
# Les trois scripts doivent etre a cote de lot.py. Resultat : <dossier>/prets/<nom>/ (final-200.glb, final-1500.glb,
# controle.png) et <dossier>/prets/recapitulatif.csv.
# Reglages par statue, facultatifs : un fichier reglages.csv dans le dossier, une ligne par modele :
#   nom;hauteur;quarts      (ex. lion;0.12;0  ou  sphinx;0.10;2)
# Sans ligne pour un modele : coupe a 0.12, pas de quart de tour.

import bpy, csv, os, shutil, subprocess, sys

ICI = os.path.dirname(os.path.abspath(__file__))
# Avec Blender, chaque etape relance Blender ; avec le module Python bpy (pip install bpy), elle relance Python.
LANCER = [bpy.app.binary_path, "-b", "-P"] if bpy.app.binary_path else [sys.executable]
dossier = os.path.abspath(sys.argv[sys.argv.index("--") + 1])
sortie = os.path.join(dossier, "prets")
os.makedirs(sortie, exist_ok=True)

reglages = {}
f = os.path.join(dossier, "reglages.csv")
if os.path.exists(f):
    for ligne in csv.reader(open(f, encoding="utf-8"), delimiter=";"):
        if len(ligne) >= 2 and not ligne[0].startswith("#"):
            reglages[ligne[0].strip()] = (ligne[1].strip(), (ligne[2].strip() if len(ligne) > 2 else "0"))


def blender(script, *args):
    r = subprocess.run([*LANCER, os.path.join(ICI, script), "--", *map(str, args)],
                       capture_output=True, text=True)
    if r.returncode != 0 or "Traceback" in r.stdout + r.stderr:
        raise RuntimeError((r.stdout + r.stderr)[-1500:])
    return r.stdout


recap = [["nom", "hauteur de coupe", "quarts de tour", "triangles 200", "triangles 1500", "etat"]]
for nom_fichier in sorted(os.listdir(dossier)):
    if not nom_fichier.lower().endswith(".glb"):
        continue
    nom = os.path.splitext(nom_fichier)[0]
    hauteur, quarts = reglages.get(nom, ("0.12", "0"))
    d = os.path.join(sortie, nom)
    os.makedirs(d, exist_ok=True)
    print(f"== {nom} (coupe {hauteur}, quarts {quarts})", flush=True)
    try:
        blender("aligner.py", os.path.join(dossier, nom_fichier), os.path.join(d, "1-aligne.glb"), quarts)
        # on reduit avant de couper : la reduction cale sur un modele deja coupe (vu sur le lion, 12 000 triangles au
        # lieu de 200), alors que la coupe d'un modele reduit marche tres bien
        t = []
        # une creature (nom en -creature-) n'a pas de socle et garde ses couleurs ; un Gardien est coupe et peint en pierre
        creature = "-creature-" in nom
        for n in (200, 1500):
            out = blender("lion_lowpoly.py", os.path.join(d, "1-aligne.glb"), os.path.join(d, f"2-reduit-{n}.glb"), n,
                          4 if creature else 0)
            if creature:
                shutil.copy(os.path.join(d, f"2-reduit-{n}.glb"), os.path.join(d, f"final-{n}.glb"))
                t.append(next((l.split(" : ")[1].split()[0] for l in out.splitlines() if "triangles," in l), "?"))
                continue
            out = blender("couper.py", os.path.join(d, f"2-reduit-{n}.glb"), os.path.join(d, f"final-{n}.glb"), hauteur)
            t.append(next((l.split()[1] for l in out.splitlines() if "faces apres coupe" in l), "?"))
        # rendu de controle : le modele aligne (avec socle), la version 1500, la version 200
        blender("rendre_controle.py", os.path.join(d, "1-aligne.glb"), os.path.join(d, "final-1500.glb"),
                os.path.join(d, "final-200.glb"), os.path.join(d, "controle.png"))
        recap.append([nom, hauteur, quarts, t[0], t[1], "ok"])
    except Exception as e:
        print("ECHEC", nom, e, flush=True)
        recap.append([nom, hauteur, quarts, "", "", "echec"])

with open(os.path.join(sortie, "recapitulatif.csv"), "w", newline="", encoding="utf-8") as f:
    csv.writer(f, delimiter=";").writerows(recap)
print("fini :", sortie)

# La chaine entiere du batiment d'un plan d'Archipeo, depuis son brut TRELLIS et sa ligne de
# docs/univers/archipeo/batiments/modeles/reglages.csv (decision du mainteneur, 10 octobre 2026 : les bâtiments des plans
# en modeles « low poly avec aplats », sans texture) :
#   1. aligner.py : le socle a plat, son grand cote nord-sud, la facade au sud (colonne quarts) ;
#   2. monument_lowpoly.py : 3 000 triangles en aplats, les couleurs de la colonne cibles ;
#   3. couper.py socle : la dalle retiree au ras de son dessus ;
#   4. monument_etapes.py : l'etape 1, coupee a l'avant-toit (colonne avant-toit), fermee de la couleur des murs ;
#   5. batiment_loin.py : la version de loin, en 200 triangles au plus, qui suit la silhouette ;
#   6. rendre_controle.py : le controle (de pres l'etape 1 et le batiment, de loin les deux), a la meme echelle.
# Les colonnes avant-toit et quarts vides sont lues sur le modele (batiment_mesures.py, et la facade que donne
# monument_lowpoly.py) puis inscrites dans la table : relancer donne le meme resultat, et une valeur corrigee a la main
# l'emporte.
#
#   python3.11 scripts/rendu/modeles/batiments.py -- <dossier des bruts> [<nom> ...]
#
# Le brut d'un batiment est <dossier des bruts>/<nom>-42.glb (ou <nom>.glb). Sans nom : toutes les lignes de la table
# dont le brut est la. Sortie : docs/univers/archipeo/batiments/modeles/<nom>/ (final-3000.glb, etape-1.glb, loin.glb,
# loin-etape-1.glb, controle.png) ; les fichiers de travail dans un dossier temporaire.
# Module bpy (Python 3.11) ou Blender (blender -b -P batiments.py -- ...).
import csv
import os
import re
import shutil
import subprocess
import sys
import tempfile

import bpy
import numpy as np

ICI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ICI)
import batiment_mesures as BM  # noqa: E402

TABLE = os.path.normpath(os.path.join(ICI, "../../../docs/univers/archipeo/batiments/modeles/reglages.csv"))
SORTIE = os.path.dirname(TABLE)
LANCER = [bpy.app.binary_path, "-b", "-P"] if bpy.app.binary_path else [sys.executable]
COLONNES = ["batiment", "cibles", "voxel", "avant-toit", "quarts", "retouches"]


def lire_table():
    entete, lignes = [], []
    for l in open(TABLE, encoding="utf-8"):
        if l.startswith("#"):
            entete.append(l)
        elif l.strip():
            cols = next(csv.reader([l.rstrip("\n")], delimiter=";"))
            lignes.append(dict(zip(COLONNES, cols + [""] * (len(COLONNES) - len(cols)))))
    return entete, lignes


def ecrire_table(entete, lignes):
    with open(TABLE, "w", encoding="utf-8") as f:
        f.writelines(entete)
        for d in lignes:
            f.write(";".join(d[c] for c in COLONNES).rstrip(";") + "\n")


def lancer(script, *args):
    r = subprocess.run([*LANCER, os.path.join(ICI, script), "--", *map(str, args)], capture_output=True, text=True)
    sortie = r.stdout + r.stderr
    if r.returncode != 0 or "Traceback" in sortie:
        raise RuntimeError(f"{script} :\n{sortie[-2000:]}")
    return sortie


def maillage(chemin):
    """Les sommets et les triangles d'un .glb (repere de Blender, z en haut)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=chemin)
    o = [x for x in bpy.data.objects if x.type == "MESH"][0]
    o.data.transform(o.matrix_world)
    V = np.array([v.co[:] for v in o.data.vertices])
    F = np.array([p.vertices[:3] for p in o.data.polygons])
    return BM.souder(V, F)


def un_batiment(nom, brut, d):
    travail = tempfile.mkdtemp(prefix=f"{nom}-")
    dossier = os.path.join(SORTIE, nom)
    os.makedirs(dossier, exist_ok=True)
    aligne, low, final = (os.path.join(travail, f) for f in ("1-aligne.glb", "low.glb", "final-3000.glb"))
    quarts = int(d["quarts"]) if d["quarts"].strip() else 0
    lancer("aligner.py", brut, aligne, quarts)
    journal = lancer("monument_lowpoly.py", aligne, low, nom)
    facade = int(re.search(r"^facade (\d)", journal, re.M).group(1))
    if not d["quarts"].strip():
        if facade:
            # la porte n'est pas au sud : on tourne le brut d'autant et on refait les aplats
            quarts = facade
            lancer("aligner.py", brut, aligne, quarts)
            journal = lancer("monument_lowpoly.py", aligne, low, nom)
        d["quarts"] = str(quarts)
    elif facade:
        print(f"  attention : la facade lue est a {facade} quart(s) de tour du sud (quarts = {quarts} dans la table)")
    print("  " + "\n  ".join(l for l in journal.splitlines() if l.startswith(("grappe", "socle", "facade", "retrait"))))
    print("  " + next(l for l in lancer("couper.py", low, final, "socle").splitlines() if l.startswith("coupe")))
    # le sol pose par couper.py sous un batiment creux, et les bandes des retouches zone=, ajoutent des triangles : au-dela
    # des 3 000 (BUILDING_NEAR_TRIANGLES), on refait les aplats d'autant moins de triangles (le salon de Moustache)
    n = len(maillage(final)[1])
    if n > 3000:
        journal = lancer("monument_lowpoly.py", aligne, low, nom, 3000 - (n - 3000) - 20)
        print(f"  {n} triangles : refait a {3000 - (n - 3000) - 20}")
        print("  " + next(l for l in lancer("couper.py", low, final, "socle").splitlines() if l.startswith("coupe")))
    if not d["avant-toit"].strip():
        V, F = maillage(final)
        d["avant-toit"] = f"{BM.avant_toit(V, F)[0]:.3f}"
    toit = d["avant-toit"]
    murs = d["cibles"].split()[0]
    final = shutil.move(final, os.path.join(dossier, "final-3000.glb"))
    shutil.rmtree(travail)
    print("  " + lancer("monument_etapes.py", final, dossier, toit, f"couleur={murs}", "plein").strip().splitlines()[-1])
    loin = lancer("batiment_loin.py", final, dossier, toit, *(r for r in d["retouches"].split() if r.startswith("loin-")))
    print("  " + "\n  ".join(l for l in loin.splitlines() if "colonne" in l or "triangles" in l))
    lancer("rendre_controle.py", "echelle", "soleil", os.path.join(dossier, "etape-1.glb"), final, os.path.join(dossier, "loin-etape-1.glb"),
           os.path.join(dossier, "loin.glb"), os.path.join(dossier, "controle.png"))
    print(f"  avant-toit {toit}, quarts {quarts}")


def main():
    a = sys.argv[sys.argv.index("--") + 1:]
    bruts, noms = a[0], a[1:]
    entete, lignes = lire_table()
    par_nom = {d["batiment"]: d for d in lignes}
    if not noms:
        noms = [n for n in par_nom if any(os.path.exists(os.path.join(bruts, n + s)) for s in ("-42.glb", ".glb"))]
    echecs = []
    for nom in noms:
        if nom not in par_nom:
            raise SystemExit(f"{nom} : pas de ligne dans {TABLE}")
        brut = next((os.path.join(bruts, nom + s) for s in ("-42.glb", ".glb") if os.path.exists(os.path.join(bruts, nom + s))), None)
        if brut is None:
            raise SystemExit(f"{nom} : pas de brut dans {bruts}")
        print(f"== {nom}", flush=True)
        try:
            un_batiment(nom, brut, par_nom[nom])
        except RuntimeError as e:
            print("ECHEC", nom, e, flush=True)
            echecs.append(nom)
        # les hauteurs et les quarts lus sont inscrits au fur et a mesure, sur la table relue (un autre lot a pu y ecrire)
        entete, lignes = lire_table()
        for d in lignes:
            if d["batiment"] == nom:
                d.update({k: par_nom[nom][k] for k in ("avant-toit", "quarts")})
        ecrire_table(entete, lignes)
    if echecs:
        raise SystemExit("en echec : " + " ".join(echecs))


if __name__ == "__main__":
    main()

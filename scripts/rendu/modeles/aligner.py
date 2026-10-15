# Aligne un modele .glb sur son socle : le grand cote du socle passe sur l'axe nord-sud, le socle est pose
# a plat au sol (z = 0) et centre. Le maillage lui-meme est tourne (pas seulement l'objet) : le .glb
# exporte est corrige, textures et couleurs gardees. Blender 4.2 ou plus recent.
#
# En ligne de commande (Windows, macOS, Linux) :
#   blender -b -P aligner.py -- entree.glb sortie.glb [quart_de_tour]
# quart_de_tour (facultatif, 0 par defaut) : 1, 2 ou 3 quarts de tour en plus, si le modele regarde du mauvais
# cote une fois aligne (2 = demi-tour : la face passe du nord au sud).
#
# Dans Blender : importer le .glb, le selectionner, onglet Scripting > Open > ce fichier > Run Script (Alt+P).
# Le modele selectionne est aligne sur place ; il reste a l'exporter (Fichier > Exporter > glTF 2.0).
#
# Reperes : dans Blender, le nord-sud est l'axe Y (vue de dessus : nord en haut). Dans le .glb (et dans
# Three.js), c'est l'axe Z.

import bpy, sys, math
from mathutils import Matrix, Vector

TRANCHE = 0.05   # part de la hauteur, depuis le bas, qui sert a lire le socle
PAS = 0.25       # finesse de la recherche de l'angle, en degres

ligne = "--" in sys.argv
quarts = 0
if ligne:
    a = sys.argv[sys.argv.index("--") + 1:]
    entree, sortie = a[0], a[1]
    quarts = int(a[2]) if len(a) > 2 else 0
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=entree)
    objets = [o for o in bpy.data.objects if o.type == "MESH"]
else:
    objets = [o for o in bpy.context.selected_objects if o.type == "MESH"]
    if not objets:
        raise SystemExit("Selectionne d'abord le modele importe.")

# on cuit la place de chaque objet dans ses sommets, pour travailler dans le repere du monde
for o in objets:
    o.data.transform(o.matrix_world)
    o.parent = None
    o.matrix_world = Matrix.Identity(4)

pts = [v.co.copy() for o in objets for v in o.data.vertices]
zmin = min(p.z for p in pts); zmax = max(p.z for p in pts)
socle = [p.to_2d() for p in pts if p.z <= zmin + TRANCHE * (zmax - zmin)]
cx = sum(p.x for p in socle) / len(socle); cy = sum(p.y for p in socle) / len(socle)


def emprise(deg):  # largeur (x) et longueur (y) du socle tourne de deg degres
    t = math.radians(deg); c, s = math.cos(t), math.sin(t)
    xs = [c * (p.x - cx) - s * (p.y - cy) for p in socle]; ys = [s * (p.x - cx) + c * (p.y - cy) for p in socle]
    return max(xs) - min(xs), max(ys) - min(ys)


# l'angle qui donne au socle le plus petit rectangle englobant, puis le grand cote sur Y
angle = min((emprise(i * PAS)[0] * emprise(i * PAS)[1], i * PAS) for i in range(int(90 / PAS)))[1]
larg, long_ = emprise(angle)
if larg > long_:
    angle += 90
angle = (angle + 90) % 180 - 90  # le plus petit tour possible : le modele garde le cote vers lequel il regardait
angle += 90 * quarts
print(f"socle tourne de {angle:.2f} degres ({min(larg, long_):.3f} x {max(larg, long_):.3f})")

rot = Matrix.Rotation(math.radians(angle), 4, "Z")
for o in objets:
    o.data.transform(Matrix.Translation((-cx, -cy, -zmin)))
    o.data.transform(rot)
    o.data.update()

if ligne:
    bpy.ops.export_scene.gltf(filepath=sortie)
    print("exporte :", sortie)

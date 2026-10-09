# Coupe un modele .glb par un plan horizontal et garde le haut (ou le bas), coupe refermee.
# Usage le plus courant : retirer le socle d'une statue, puisque le socle commun vient du code.
#
#   blender -b -P couper.py -- entree.glb sortie.glb [hauteur] [haut|bas]
#
# hauteur : ou couper, en part de la hauteur du modele depuis le bas (0.08 = 8 %). Si on l'omet, le script
# cherche lui-meme le dessus du socle : la hauteur ou l'emprise au sol retrecit nettement.
# haut|bas : la partie gardee (haut par defaut, donc le socle part).
# Le modele est d'abord redresse sur Z et pose a z = 0 (comme aligner.py ne le fait pas : lancer aligner.py avant
# si le socle doit aussi etre aligne nord-sud).

import bpy, bmesh, sys
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
entree, sortie = a[0], a[1]
hauteur = float(a[2]) if len(a) > 2 and a[2] not in ("haut", "bas") else None
garder = a[-1] if a[-1] in ("haut", "bas") else "haut"

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entree)
objets = [o for o in bpy.data.objects if o.type == "MESH"]
for o in objets:
    o.data.transform(o.matrix_world)
    o.matrix_world.identity()
pts = [v.co.copy() for o in objets for v in o.data.vertices]
zmin = min(p.z for p in pts); zmax = max(p.z for p in pts); h = zmax - zmin


def emprise(z):  # surface au sol (rectangle englobant) des points proches de la hauteur z
    tranche = [p for p in pts if abs(p.z - z) < h * 0.01]
    if len(tranche) < 10:
        return 0.0
    return (max(p.x for p in tranche) - min(p.x for p in tranche)) * (max(p.y for p in tranche) - min(p.y for p in tranche))


if hauteur is None:
    # le socle est large et plat : on monte tant que l'emprise reste proche de celle du bas,
    # et on coupe juste au-dessus, la ou elle retrecit franchement
    base = emprise(zmin + h * 0.02)
    hauteur = 0.08
    for i in range(3, 40):
        if emprise(zmin + h * i / 100) < base * 0.6:
            hauteur = (i + 1) / 100
            break
zc = zmin + h * hauteur
print(f"coupe a {hauteur:.0%} de la hauteur, partie gardee : {garder}")

for o in objets:
    bm = bmesh.new(); bm.from_mesh(o.data)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=Vector((0, 0, zc)), plane_no=Vector((0, 0, 1)),
                               clear_inner=(garder == "haut"), clear_outer=(garder == "bas"))
    bord = [e for e in r["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    if bord:
        bmesh.ops.holes_fill(bm, edges=bord)  # referme la coupe
    bm.to_mesh(o.data); bm.free()
    if garder == "haut":
        o.data.transform(__import__("mathutils").Matrix.Translation((0, 0, -zc)))  # repose la coupe sur z = 0
    o.data.update()
    print(o.name, len(o.data.polygons), "faces apres coupe")

bpy.ops.export_scene.gltf(filepath=sortie)
print("exporte :", sortie)

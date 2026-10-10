# Coupe un modele .glb par un plan horizontal et garde le haut (ou le bas), coupe refermee.
# Usage le plus courant : retirer le socle d'une statue, puisque le socle commun vient du code.
#
#   blender -b -P couper.py -- entree.glb sortie.glb [hauteur] [haut|bas]
#
# hauteur : ou couper, en part de la hauteur du modele depuis le bas (0.08 = 8 %). Si on l'omet, le script
# cherche lui-meme le dessus du socle : la hauteur ou l'emprise au sol retrecit nettement.
# socle (a la place de la hauteur) : le batiment d'un plan, pose sur une dalle serree autour des murs, dont l'emprise ne
# retrecit presque pas ; la coupe passe un pour cent au-dessus du dessus de la dalle, son plus grand palier horizontal
# (batiment_mesures.py ; la planche du 10 octobre 2026 gardait la dalle de la cabine, de la hutte, du four et du musee).
# haut|bas : la partie gardee (haut par defaut, donc le socle part).
# Le modele est d'abord redresse sur Z et pose a z = 0 (comme aligner.py ne le fait pas : lancer aligner.py avant
# si le socle doit aussi etre aligne nord-sud).

import bpy, bmesh, sys
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
entree, sortie = a[0], a[1]
hauteur = float(a[2]) if len(a) > 2 and a[2] not in ("haut", "bas", "socle") else None
socle = len(a) > 2 and a[2] == "socle"
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


def sol_interieur(bm, avant, zc):
    """Le batiment d'un plan : la coupe du socle ouvre le sol d'un batiment creux (la dalle en faisait le sol), et par sa
    porte on voyait a travers lui le fond de la scene (l'etable de Bloquette, la cabane de Mousso). On pose un sol plat,
    juste au-dessus de la coupe, la ou le modele entoure le point (un plafond au-dessus, des murs sur trois cotes au
    moins, vus de l'interieur), en bandes d'une rangee de grille chacune ; il prend, comme la coupe refermee, la couleur
    la plus sombre du modele : le fond d'une porte se lit sombre jusqu'au sol (avis du directeur artistique, 10 octobre
    2026)."""
    from mathutils.bvhtree import BVHTree
    couche = bm.loops.layers.color.active or (bm.loops.layers.color.values() or [None])[0]
    if couche is None:
        return
    lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    sombre = min((tuple(f.loops[0][couche]) for f in avant), key=lum)
    arbre = BVHTree.FromBMesh(bm)
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]; zs = [v.co.z for v in bm.verts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    pas = max(x1 - x0, y1 - y0) / 32
    z = zc + 0.003 * (max(zs) - zc)

    def dedans(x, y):
        o = Vector((x, y, z))
        def touche(d):
            loc, n, _, _ = arbre.ray_cast(o, d)
            return loc is not None and n.dot(d) < 0   # une face vue de son cote exterieur : l'interieur d'une piece
        if not touche(Vector((0, 0, 1))):
            return False
        return sum(touche(d) for d in (Vector((1, 0, 0)), Vector((-1, 0, 0)), Vector((0, 1, 0)), Vector((0, -1, 0)))) >= 3

    nx, ny = int((x1 - x0) / pas) + 1, int((y1 - y0) / pas) + 1
    for j in range(ny):
        y = y0 + (j + 0.5) * pas
        i = 0
        while i < nx:
            if not dedans(x0 + (i + 0.5) * pas, y):
                i += 1
                continue
            k = i
            while k + 1 < nx and dedans(x0 + (k + 1.5) * pas, y):
                k += 1
            a, b = x0 + i * pas, x0 + (k + 1) * pas
            f = bm.faces.new([bm.verts.new((a, y - pas / 2, z)), bm.verts.new((b, y - pas / 2, z)),
                              bm.verts.new((b, y + pas / 2, z)), bm.verts.new((a, y + pas / 2, z))])
            f.normal_update()
            i = k + 1
    # la coupe refermee et le sol prennent le sombre (le dessous ne se voit pas ; sans cela, des couleurs interpolees)
    for f in bm.faces:
        if f not in avant:
            for l in f.loops:
                l[couche] = sombre


if socle:
    import numpy as np
    import batiment_mesures as BM
    V = np.array([v.co[:] for o in objets for v in o.data.vertices])
    F, n = [], 0
    for o in objets:
        F += [[i + n for i in p.vertices[:3]] for p in o.data.polygons]
        n += len(o.data.vertices)
    V, F = BM.souder(V, np.array(F))
    dessus = BM.dessus_du_socle(V, F)
    if dessus is not None:
        hauteur = (dessus - zmin) / h + 0.01
    else:
        print("pas de dalle nette : on cherche ou l'emprise retrecit")
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
    if socle:
        # le .glb a facettes plates arrive desoude : soude, la coupe forme des boucles fermees que l'on sait remplir
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=Vector((0, 0, zc)), plane_no=Vector((0, 0, 1)),
                               clear_inner=(garder == "haut"), clear_outer=(garder == "bas"))
    bord = [e for e in r["geom_cut"] if isinstance(e, bmesh.types.BMEdge)]
    if bord:
        avant = set(bm.faces)
        bmesh.ops.holes_fill(bm, edges=bord)  # referme la coupe
        if socle:
            sol_interieur(bm, avant, zc)
    bm.to_mesh(o.data); bm.free()
    if garder == "haut":
        o.data.transform(__import__("mathutils").Matrix.Translation((0, 0, -zc)))  # repose la coupe sur z = 0
    o.data.update()
    print(o.name, len(o.data.polygons), "faces apres coupe")

bpy.ops.export_scene.gltf(filepath=sortie)
print("exporte :", sortie)

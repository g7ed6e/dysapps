# Allège un brut TRELLIS sans le repeindre : il garde sa forme, ses UV et sa texture (ramenée à la taille donnée).
# Environ 20 000 triangles gardent un ado fidèle au concept ; à 3 000, la forme casse.
#
#   python3.11 alleger_brut.py -- <brut.glb> <sortie.glb> <triangles> <taille de texture>

import sys

import bpy

a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(a) != 4:
    sys.exit("usage : python3.11 alleger_brut.py -- <brut.glb> <sortie.glb> <triangles> <taille de texture>")
src, out, cible, tex = a[0], a[1], int(a[2]), int(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
maillages = [o for o in bpy.data.objects if o.type == "MESH"]
if len(maillages) != 1:
    sys.exit(f"un brut TRELLIS n'a qu'un maillage ; {src} en a {len(maillages)}")
o = maillages[0]
bpy.context.view_layer.objects.active = o
o.select_set(True)
n0 = len(o.data.polygons)
# La décimation par effondrement d'arêtes garde les UV : la texture du brut reste à sa place.
md = o.modifiers.new("d", "DECIMATE")
md.decimate_type = "COLLAPSE"
md.ratio = min(1, cible / n0)
md.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier="d")
# Depuis octobre 2026, TRELLIS livre ses textures en WebP, que l'export JPEG ignore sans erreur :
# chaque image est recopiée pixel par pixel dans une image neuve, que l'export sait écrire.
for img in list(bpy.data.images):
    if img.size[0] > tex:
        img.scale(tex, tex)
    copie = bpy.data.images.new(img.name + "-copie", img.size[0], img.size[1], alpha=False)
    copie.colorspace_settings.name = img.colorspace_settings.name
    copie.pixels.foreach_set(list(img.pixels))
    copie.pack()
    img.user_remap(copie)
bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_image_format="JPEG", export_jpeg_quality=88)
print("ok", n0, "->", len(o.data.polygons), "triangles")

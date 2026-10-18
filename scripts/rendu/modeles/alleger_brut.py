# Allège un brut TRELLIS sans le repeindre : il garde sa forme, ses UV et sa texture (ramenée à la taille donnée).
# Environ 20 000 triangles gardent un ado fidèle au concept ; à 3 000, la forme casse.
#
#   python3.11 alleger_brut.py -- <brut.glb> <sortie.glb> <triangles> <taille de texture>

import sys

import bpy

a = sys.argv[sys.argv.index("--") + 1:]
src, out, cible, tex = a[0], a[1], int(a[2]), int(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
o = [o for o in bpy.data.objects if o.type == "MESH"][0]
bpy.context.view_layer.objects.active = o
o.select_set(True)
n0 = len(o.data.polygons)
# La décimation par effondrement d'arêtes garde les UV : la texture du brut reste à sa place.
md = o.modifiers.new("d", "DECIMATE")
md.decimate_type = "COLLAPSE"
md.ratio = min(1, cible / n0)
md.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier="d")
for img in bpy.data.images:
    if img.size[0] > tex:
        img.scale(tex, tex)
    img.pack()
bpy.ops.export_scene.gltf(filepath=out, use_selection=True, export_image_format="JPEG", export_jpeg_quality=88)
print("ok", n0, "->", len(o.data.polygons), "triangles")

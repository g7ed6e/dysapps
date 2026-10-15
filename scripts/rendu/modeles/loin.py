# Refait la version de loin d'un modele a partir de sa version de pres, quand lion_lowpoly.py l'a reduite a un bloc.
# Soude les sommets, remaille en voxels si demande (une fraction de la plus grande dimension ; 0 = non), puis reduit
# jusqu'a N triangles. Un modele sans couleurs (le remaillage les perd) prend la pierre des Gardiens, que le jeu repeint ;
# pour une creature, relancer aplats.py ensuite.
#
#   python3.11 loin.py -- final-1500.glb final-200.glb N [voxel]
#
# Essayer voxel 0, puis 0.02 et 0.03 ; garder celui qui se reconnait le mieux sur le controle, sans depasser N.
import sys

import bpy  # avant bmesh, qu'il fournit
import bmesh

a = sys.argv[sys.argv.index("--") + 1:]
src, dst, N = a[0], a[1], int(a[2])
vox = float(a[3]) if len(a) > 3 else 0.0
PIERRE = (0x8E, 0x8C, 0x84)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
o = [x for x in bpy.data.objects if x.type == "MESH"][0]
bpy.context.view_layer.objects.active = o
o.select_set(True)
bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bm.to_mesh(o.data); bm.free()
if vox > 0:
    r = o.modifiers.new("v", "REMESH"); r.mode = "VOXEL"; r.voxel_size = vox * max(o.dimensions)
    bpy.ops.object.modifier_apply(modifier=r.name)
for _ in range(12):
    if len(o.data.polygons) <= N:
        break
    d = o.modifiers.new("r", "DECIMATE"); d.ratio = max(0.05, N / len(o.data.polygons) * 0.98); d.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=d.name)
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.triangulate(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free()
# Des triangles a plat, aucun sommet partage (aplats.py l'exige).
bm = bmesh.new(); bm.from_mesh(o.data)
bmesh.ops.triangulate(bm, faces=bm.faces); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.split_edges(bm, edges=bm.edges[:])
bm.to_mesh(o.data); bm.free()
for p in o.data.polygons:
    p.use_smooth = False
if not o.data.color_attributes:
    c = o.data.color_attributes.new("Col", "FLOAT_COLOR", "CORNER")
    lin = [(v / 255) / 12.92 if v / 255 <= 0.04045 else ((v / 255 + 0.055) / 1.055) ** 2.4 for v in PIERRE]
    for k in c.data:
        k.color = (*lin, 1)
    o.data.color_attributes.active_color = c
print("triangles", len(o.data.polygons))
# Sans matériau : celui d'un brut porte sa texture, que le fichier embarquerait (dix fois son poids).
o.data.materials.clear()
bpy.ops.export_scene.gltf(filepath=dst, use_selection=True, export_texcoords=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False)

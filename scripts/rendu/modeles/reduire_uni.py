# Reduit un .glb deja low-poly d'une seule couleur (pierre #8E8C84) a N triangles (fast-simplification).
#   python reduire_uni.py -- entree.glb sortie.glb 200
import bpy, bmesh, sys, numpy as np, fast_simplification as fs
a = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a[0])
o = [o for o in bpy.data.objects if o.type == "MESH"][0]
o.data.transform(o.matrix_world)
bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bmesh.ops.triangulate(bm, faces=bm.faces)
V = np.array([v.co[:] for v in bm.verts], np.float32); F = np.array([[v.index for v in f.verts] for f in bm.faces], np.int32); bm.free()
V2, F2 = fs.simplify(V, F, target_reduction=max(0.0, 1 - int(a[2]) / len(F)))
bpy.ops.wm.read_factory_settings(use_empty=True)
me = bpy.data.meshes.new("r"); me.from_pydata(V2.tolist(), [], F2.tolist()); me.update()
r = bpy.data.objects.new("r", me); bpy.context.collection.objects.link(r)
lin = lambda c: (c / 255 / 12.92) if c / 255 <= 0.04045 else ((c / 255 + 0.055) / 1.055) ** 2.4
pierre = [lin(0x8E), lin(0x8C), lin(0x84), 1.0]
at = me.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER"); me.color_attributes.active_color = at
for d in at.data: d.color = pierre
r.select_set(True)
bpy.ops.export_scene.gltf(filepath=a[1], use_selection=True, export_texcoords=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False)
print(len(me.polygons), "triangles")

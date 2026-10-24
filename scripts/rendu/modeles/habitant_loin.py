# Version de loin d'un habitant : remaillage en voxels, réduction à N triangles, nouvelle carte UV, texture TEX×TEX
# reprise du modèle de près par le point le plus proche de sa surface (pas de rayons : la doublure ne s'y mêle pas).
# python3.11 scripts/rendu/modeles/habitant_loin.py -- src.glb out.glb N TEX [voxel=0.015]
import bpy, bmesh, sys, mathutils, numpy as np
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform
a = sys.argv[sys.argv.index("--")+1:]; src, out, N, TEX = a[0], a[1], int(a[2]), int(a[3])
VOX = float(a[4]) if len(a) > 4 else 0.015
bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
ms = [o for o in bpy.data.objects if o.type == "MESH"]
for o in bpy.data.objects: o.select_set(o in ms)
bpy.context.view_layer.objects.active = ms[0]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
if len(ms) > 1: bpy.ops.object.join()
so = bpy.context.view_layer.objects.active
# la source : triangles, UV, image
sb = bmesh.new(); sb.from_mesh(so.data); bmesh.ops.triangulate(sb, faces=sb.faces[:])
suv = sb.loops.layers.uv.active
img = next(n.image for m in so.data.materials for n in m.node_tree.nodes if n.type == "TEX_IMAGE")
iw, ih = img.size; spx = np.array(img.pixels[:], dtype=np.float32).reshape(ih, iw, 4)
sb.faces.ensure_lookup_table()
bvh = BVHTree.FromBMesh(sb)
H = max(v.co.z for v in sb.verts) - min(v.co.z for v in sb.verts)
# le nouveau maillage
lo_me = so.data.copy(); lo = bpy.data.objects.new("habitant", lo_me); bpy.context.scene.collection.objects.link(lo)
lo_me.materials.clear()
for o in bpy.data.objects: o.select_set(o == lo)
bpy.context.view_layer.objects.active = lo
sf = lo.modifiers.new("s", "SOLIDIFY"); sf.thickness = 0.012 * H; sf.offset = 0; bpy.ops.object.modifier_apply(modifier="s")
r = lo.modifiers.new("r", "REMESH"); r.mode = "VOXEL"; r.voxel_size = VOX * H; bpy.ops.object.modifier_apply(modifier="r")
t1 = len(lo.data.polygons) * 2
d = lo.modifiers.new("d", "DECIMATE"); d.ratio = min(1, N / t1); d.use_collapse_triangulate = True; bpy.ops.object.modifier_apply(modifier="d")
bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="SELECT"); bpy.ops.mesh.quads_convert_to_tris(); bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.03); bpy.ops.object.mode_set(mode="OBJECT")
lb = bmesh.new(); lb.from_mesh(lo.data); luv = lb.loops.layers.uv.active
out_px = np.zeros((TEX, TEX, 4), dtype=np.float32); filled = np.zeros((TEX, TEX), bool)
for f in lb.faces:
    P = [l.vert.co.copy() for l in f.loops]; U = [l[luv].uv * TEX for l in f.loops]
    xs = [u.x for u in U]; ys = [u.y for u in U]
    for py in range(max(0, int(min(ys)) - 1), min(TEX, int(max(ys)) + 2)):
        for px in range(max(0, int(min(xs)) - 1), min(TEX, int(max(xs)) + 2)):
            q = mathutils.Vector((px + 0.5, py + 0.5, 0))
            U3 = [mathutils.Vector((u.x, u.y, 0)) for u in U]
            cq = mathutils.geometry.closest_point_on_tri(q, *U3)
            if (cq - q).length > 0.75: continue
            if filled[py, px] and (cq - q).length > 0: continue
            p3 = barycentric_transform(cq, *U3, *P)
            hit, _, fi, _ = bvh.find_nearest(p3)
            if hit is None: continue
            sf = sb.faces[fi]; sv = [l.vert.co for l in sf.loops]; su = [mathutils.Vector((l[suv].uv.x, l[suv].uv.y, 0)) for l in sf.loops]
            uv = barycentric_transform(hit, *sv, *su)
            sx = min(iw - 1, max(0, int(uv.x % 1 * iw))); sy = min(ih - 1, max(0, int(uv.y % 1 * ih)))
            out_px[py, px] = spx[sy, sx]; filled[py, px] = True
# marges : étendre les bords des îles de quelques pixels
for _ in range(4):
    grow = out_px.copy(); g = filled.copy()
    for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
        sh = np.roll(np.roll(filled, dy, 0), dx, 1); sp = np.roll(np.roll(out_px, dy, 0), dx, 1)
        m = sh & ~g; grow[m] = sp[m]; g |= m
    out_px, filled = grow, g
out_px[..., 3] = 1
tex = bpy.data.images.new("tex", TEX, TEX); tex.pixels[:] = out_px.ravel(); tex.pack(); tex.file_format = "JPEG"
mat = bpy.data.materials.new("habitant"); mat.use_nodes = True; nt = mat.node_tree
tn = nt.nodes.new("ShaderNodeTexImage"); tn.image = tex; bs = nt.nodes["Principled BSDF"]
nt.links.new(tn.outputs[0], bs.inputs["Base Color"]); bs.inputs["Metallic"].default_value = 0
lo.data.materials.append(mat)
bpy.data.objects.remove(so)
print("TRI", t1, "->", len(lo.data.polygons))
for o in bpy.data.objects: o.select_set(o == lo)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_image_format="JPEG", export_jpeg_quality=85, export_normals=False, export_animations=False)

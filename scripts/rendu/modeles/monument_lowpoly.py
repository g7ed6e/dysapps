# Monument low-poly : reduit un .glb texture (TRELLIS.2) a N triangles SANS remaillage (les ailes et les
# pieces fines d'un monument n'y survivent pas) et peint chaque facette de sa couleur d'origine, ramenee a
# une palette de K couleurs (k-moyennes sur les facettes).
#   (module bpy, avec numpy et fast-simplification installes)
#   python monument_lowpoly.py -- entree.glb sortie.glb 1500 [K=8]
import bpy, bmesh, sys, random
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

a = sys.argv[sys.argv.index("--") + 1:]
ENTREE, SORTIE, N = a[0], a[1], int(a[2])
K = int(a[3]) if len(a) > 3 else 8
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ENTREE)
orig = [o for o in bpy.data.objects if o.type == "MESH"][0]
image = next(n.image for m in orig.data.materials if m and m.use_nodes for n in m.node_tree.nodes
             if n.type == "TEX_IMAGE" and n.image)
L, H = image.size
pixels = image.pixels[:]
uvs = orig.data.uv_layers.active.data

# reduction quadrique (fast-simplification, licence MIT) : le Decimate de Blender cale vers 7 000 triangles
# sur les maillages de TRELLIS
import numpy as np, fast_simplification as fs
bm = bmesh.new(); bm.from_mesh(orig.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4); bmesh.ops.triangulate(bm, faces=bm.faces)
V = np.array([v.co[:] for v in bm.verts], np.float32); F = np.array([[v.index for v in f.verts] for f in bm.faces], np.int32)
bm.free()
V2, F2 = fs.simplify(V, F, target_reduction=max(0.0, 1 - N / len(F)))
me = bpy.data.meshes.new("reduit"); me.from_pydata(V2.tolist(), [], F2.tolist()); me.update()
red = bpy.data.objects.new("reduit", me); bpy.context.collection.objects.link(red)
for o in bpy.context.selected_objects: o.select_set(False)
bpy.context.view_layer.objects.active = red; red.select_set(True)
red.data.materials.clear()

arbre = BVHTree.FromObject(orig, bpy.context.evaluated_depsgraph_get())
mo = orig.data
poids = [(1/3, 1/3, 1/3), (.6, .2, .2), (.2, .6, .2), (.2, .2, .6)]
cols = []
for p in red.data.polygons:
    v = [red.data.vertices[i].co for i in p.vertices]; s = Vector((0, 0, 0))
    for w in poids:
        q = v[0] * w[0] + v[1] * w[1] + v[2] * w[2]
        co, _, idx, _ = arbre.find_nearest(q)
        f = mo.polygons[idx]
        A, B, C = (mo.vertices[i].co for i in f.vertices[:3])
        ua, ub, uc = (uvs[li].uv.to_3d() for li in list(f.loop_indices)[:3])
        uv = barycentric_transform(co, A, B, C, ua, ub, uc)
        x = min(L - 1, max(0, int(uv.x * L))); y = min(H - 1, max(0, int(uv.y * H)))
        k = (y * L + x) * 4; s += Vector(pixels[k:k + 3])
    cols.append(s / len(poids))
# k-moyennes ponderees par l'aire
aires = [p.area for p in red.data.polygons]
random.seed(1); centres = random.sample(cols, K)
for _ in range(20):
    acc = [[Vector((0, 0, 0)), 0.0] for _ in range(K)]
    lab = []
    for c, w in zip(cols, aires):
        j = min(range(K), key=lambda j: (c - centres[j]).length_squared); lab.append(j)
        acc[j][0] += c * w; acc[j][1] += w
    centres = [acc[j][0] / acc[j][1] if acc[j][1] else centres[j] for j in range(K)]
attr = red.data.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
red.data.color_attributes.active_color = attr
for p, j in zip(red.data.polygons, lab):
    c = list(centres[j]) + [1.0]
    for li in p.loop_indices: attr.data[li].color = c
    p.use_smooth = False
print(f"{len(red.data.polygons)} triangles, palette :", ["#%02X%02X%02X" % tuple(int(255 * (x / 12.92 if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055)) for x in c[:3]) for c in centres])
for o in bpy.context.selected_objects: o.select_set(False)
red.select_set(True)
bpy.ops.export_scene.gltf(filepath=SORTIE, use_selection=True, export_texcoords=False,
                          export_vertex_color="ACTIVE", export_all_vertex_colors=False)
print("exporte :", SORTIE)

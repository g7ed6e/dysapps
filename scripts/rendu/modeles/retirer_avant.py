# Retire la partie d'un modele situee devant un plan vertical (y < y0, axe de Blender) et au-dessus d'une hauteur
# (part de la hauteur du modele), coupe refermee : sert a oter la tete de cheval du Centaure d'argile.
#   python retirer_avant.py -- entree.glb sortie.glb y0 hauteur
import bpy, bmesh, sys
from mathutils import Vector
a = sys.argv[sys.argv.index("--") + 1:]
entree, sortie, y0, part = a[0], a[1], float(a[2]), float(a[3])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entree)
o = [o for o in bpy.data.objects if o.type == "MESH"][0]
o.data.transform(o.matrix_world); o.matrix_world.identity()
zs = [v.co.z for v in o.data.vertices]; zc = min(zs) + (max(zs) - min(zs)) * part
bm = bmesh.new(); bm.from_mesh(o.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector((0, y0, 0)), plane_no=Vector((0, 1, 0)))
bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector((0, 0, zc)), plane_no=Vector((0, 0, 1)))
morte = [f for f in bm.faces if f.calc_center_median().y < y0 and f.calc_center_median().z > zc]
bmesh.ops.delete(bm, geom=morte, context="FACES")
bord = [e for e in bm.edges if e.is_boundary]
neuves = bmesh.ops.holes_fill(bm, edges=bord)["faces"]
col = bm.loops.layers.color.active or bm.loops.layers.float_color.active
if col:
    for f in neuves:
        g = next((g for e in f.edges for g in e.link_faces if g not in neuves), None)
        if g:
            for l in f.loops: l[col] = g.loops[0][col]
# garder le plus gros morceau (un bout de main detache par la coupe tombe)
vus, iles = set(), []
for v in bm.verts:
    if v in vus: continue
    ile, pile = [], [v]
    while pile:
        x = pile.pop()
        if x in vus: continue
        vus.add(x); ile.append(x); pile.extend(e.other_vert(x) for e in x.link_edges)
    iles.append(ile)
iles.sort(key=len, reverse=True)
for ile in iles[1:]: bmesh.ops.delete(bm, geom=ile, context="VERTS")
bm.to_mesh(o.data); bm.free()
bpy.ops.export_scene.gltf(filepath=sortie, export_texcoords=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False)
print(len(o.data.polygons), "faces, retire", len(morte))

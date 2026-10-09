# Rendu de controle cote a cote (vue de trois quarts) de trois .glb : original, 1500 et 200 triangles.
# Usage : blender -b -P rendre_controle.py -- original.glb v1500.glb v200.glb controle.png
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = "BLENDER_WORKBENCH"
s.display.shading.light = "STUDIO"
s.display.shading.color_type = "VERTEX"
s.render.resolution_x, s.render.resolution_y = 1536, 512
s.world = bpy.data.worlds.new("w"); s.world.color = (0.75, 0.75, 0.75)

decalage = 0.0
for chemin in a[:3]:
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=chemin)
    objs = [o for o in bpy.data.objects if o not in avant and o.type == "MESH"]
    for o in objs:
        o.data.transform(o.matrix_world); o.matrix_world.identity()
    pts = [v.co for o in objs for v in o.data.vertices]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
    taille = max(hi - lo)
    for o in objs:  # meme taille pour les trois, cote a cote, poses au sol
        o.scale = (1 / taille,) * 3
        o.location = Vector((decalage, 0, 0)) - (lo + hi) / 2 / taille * Vector((1, 1, 0)) - Vector((0, 0, lo.z / taille))
    decalage += 1.2

cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"; cd.ortho_scale = 4.2
cam = bpy.data.objects.new("c", cd); s.collection.objects.link(cam); s.camera = cam
centre = Vector((1.2, 0, 0.3)); t = math.radians(-35)
cam.location = centre + Vector((math.sin(t) * 6, -math.cos(t) * 6, 3))
cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
s.render.filepath = a[3]
bpy.ops.render.render(write_still=True)

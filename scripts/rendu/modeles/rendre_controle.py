# Rendu de controle cote a cote (vue de trois quarts, depuis l'avant gauche) de plusieurs .glb.
# Usage : blender -b -P rendre_controle.py -- original.glb v1500.glb v200.glb controle.png
#         python3.11 rendre_controle.py -- [echelle] a.glb b.glb ... controle.png
# Chaque modele est ramene a la meme taille, sauf avec « echelle » : tous gardent l'echelle du plus grand, pour comparer
# une etape de chantier et le batiment entier, ou le modele de pres et sa version de loin (batiments.py).
# Avec « soleil » (batiments.py) : les couleurs du fichier sous une lumiere blanche, un ciel et un soleil comme ceux du
# jeu (lumiere plate, l'ombrage calcule face par face), sans la lumiere de studio de Blender ni sa courbe AgX, qui
# grisent et desaturent les aplats clairs (mesure du 10 octobre 2026 : un mur e2d8c4 du fichier sortait 908f89 a
# 94938d sur la planche, le crème lu gris).
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
commune = "echelle" in a
soleil = "soleil" in a
a = [x for x in a if x not in ("echelle", "soleil")]
fichiers, sortie = a[:-1], a[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = "BLENDER_WORKBENCH"
s.display.shading.light = "STUDIO"
s.display.shading.color_type = "VERTEX"
s.render.resolution_x, s.render.resolution_y = 512 * len(fichiers), 512
s.world = bpy.data.worlds.new("w"); s.world.color = (0.75, 0.75, 0.75)
if soleil:
    s.display.shading.light = "FLAT"
    s.view_settings.view_transform = "Standard"
    s.world.color = (0.52, 0.52, 0.52)

lots = []
for chemin in fichiers:
    avant = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=chemin)
    objs = [o for o in bpy.data.objects if o not in avant and o.type == "MESH"]
    for o in objs:
        o.data.transform(o.matrix_world); o.matrix_world.identity()
    if soleil:
        # le ciel (0,55) et le soleil (0,5), venu de devant a droite et d'en haut, sur chaque face
        L = Vector((0.4, -0.7, 0.8)).normalized()
        for o in objs:
            attr = o.data.color_attributes.active_color
            if attr is None:
                continue
            for p in o.data.polygons:
                k = 0.55 + 0.5 * max(0.0, p.normal.dot(L))
                for li in p.loop_indices:
                    c = attr.data[li].color
                    attr.data[li].color = (c[0] * k, c[1] * k, c[2] * k, c[3])
    pts = [v.co for o in objs for v in o.data.vertices]
    lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
    lots.append((objs, lo, hi))
plus_grand = max(max(hi - lo) for _, lo, hi in lots)
cd = bpy.data.cameras.new("c"); cd.type = "ORTHO"
cam = bpy.data.objects.new("c", cd); s.collection.objects.link(cam); s.camera = cam
t = math.radians(-35)
vers = Vector((math.sin(t) * 6, -math.cos(t) * 6, 3))   # du centre vers la camera
avant = -vers.normalized(); droite = avant.cross(Vector((0, 0, 1))).normalized(); haut = droite.cross(avant)
# cote a cote dans l'image : decales le long de l'axe droit de la camera, poses au sol, meme taille (ou meme echelle)
pas = Vector((droite.x, droite.y, 0)).normalized() * 1.3
for i, (objs, lo, hi) in enumerate(lots):
    taille = plus_grand if commune else max(hi - lo)
    for o in objs:
        o.scale = (1 / taille,) * 3
        o.location = pas * i - (lo + hi) / 2 / taille * Vector((1, 1, 0)) - Vector((0, 0, lo.z / taille))
bpy.context.view_layer.update()
pts = [o.matrix_world @ v.co for objs, _, _ in lots for o in objs for v in o.data.vertices]
u = [p.dot(droite) for p in pts]; w = [p.dot(haut) for p in pts]
# le cadre tient tous les modeles, avec une marge
cx, cy = (min(u) + max(u)) / 2, (min(w) + max(w)) / 2
rapport = s.render.resolution_x / s.render.resolution_y
cd.ortho_scale = 1.08 * max(max(u) - min(u), (max(w) - min(w)) * rapport)
centre = droite * cx + haut * cy
cam.location = centre + vers
cam.rotation_euler = avant.to_track_quat("-Z", "Y").to_euler()
s.render.filepath = sortie
bpy.ops.render.render(write_still=True)

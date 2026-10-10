# Etapes de chantier d'un monument : coupe le modele reduit (monument_lowpoly.py) par des plans horizontaux et
# garde le bas, coupe refermee et peinte de la couleur voisine ; les morceaux qui ne tiennent plus au corps du
# monument (une pale coupee de son moyeu) sont retires.
#   python monument_etapes.py -- entree.glb dossier_sortie 0.33 0.66 [couleur=8f8c86]
# Sortie : etape-1.glb, etape-2.glb... (la derniere etape, le monument entier, est entree.glb lui-meme)
# couleur= : la coupe prend la couleur du modele la plus proche de celle-ci, au lieu de la couleur claire voisine (le
# batiment d'un plan, coupe au ras de l'avant-toit, se ferme en pierre des murs : avis du directeur artistique,
# 10 octobre 2026).
import bpy, bmesh, sys, os
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
entree, dossier = a[0], a[1]
parts = [float(x) for x in a[2:] if not x.startswith("couleur=")]
voulue = next((int(x[8:], 16) for x in a[2:] if x.startswith("couleur=")), None)
os.makedirs(dossier, exist_ok=True)
for i, part in enumerate(parts, 1):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=entree)
    o = [o for o in bpy.data.objects if o.type == "MESH"][0]
    o.data.transform(o.matrix_world); o.matrix_world.identity()
    zs = [v.co.z for v in o.data.vertices]; zc = min(zs) + (max(zs) - min(zs)) * part
    bm = bmesh.new(); bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)  # le .glb a facettes plates arrive desoude
    col = bm.loops.layers.color.active or bm.loops.layers.float_color.active
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    r = bmesh.ops.bisect_plane(bm, geom=geom, plane_co=Vector((0, 0, zc)), plane_no=Vector((0, 0, 1)), clear_outer=True)
    bord = [e for e in r["geom_cut"] if isinstance(e, bmesh.types.BMEdge) and e.is_valid]
    neuves = bmesh.ops.holes_fill(bm, edges=bord)["faces"] if bord else []
    # holes_fill laisse ouverts les bords qui ne forment pas une boucle simple : on les ferme a plat
    reste = [e for e in bm.edges if e.is_boundary and abs(e.verts[0].co.z - zc) < 1e-4 and abs(e.verts[1].co.z - zc) < 1e-4]
    if reste:
        neuves += [f for f in bmesh.ops.triangle_fill(bm, edges=reste, use_beauty=True, normal=Vector((0, 0, 1)))["geom"] if isinstance(f, bmesh.types.BMFace)]
    # la coupe regarde vers le haut (sinon on la voit de dos, noire)
    for f in neuves:
        f.normal_update()
        if f.normal.z < 0: f.normal_flip()
    # couleur de la coupe : la couleur qui couvre le plus de surface sur les facettes du bord (le mur, pas un
    # bout de toit ou de pale qui touche la coupe)
    if col:
        # repli : la couleur claire qui couvre le plus de surface sur tout le modele
        tout = {}
        for g in bm.faces:
            k = tuple(round(x, 3) for x in g.loops[0][col])
            if sum(k[:3]) > 0.45: tout[k] = tout.get(k, 0) + g.calc_area()
        defaut = max(tout, key=tout.get) if tout else None
        if voulue is not None:
            # la couleur du modele la plus proche de la couleur voulue ; bmesh rend les octets du fichier encodes une
            # seconde fois en sRVB (0x8f lu 0,77) : la couleur voulue est encodee de meme avant la comparaison
            enc = lambda x: 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055
            v = [enc((voulue >> s & 255) / 255) for s in (16, 8, 0)]
            couleurs = {tuple(round(x, 3) for x in g.loops[0][col]) for g in bm.faces}
            defaut = min(couleurs, key=lambda k: sum((k[j] - v[j]) ** 2 for j in range(3)))
        for f in neuves:
            aires = {}
            for e in f.edges:
                for g in e.link_faces:
                    if g not in neuves:
                        k = tuple(round(x, 3) for x in g.loops[0][col])
                        if sum(k[:3]) > 0.45:  # jamais une couleur d'ombre (quasi noire) sur la coupe
                            aires[k] = aires.get(k, 0) + g.calc_area()
            c = defaut if voulue is not None else (max(aires, key=aires.get) if aires else defaut)
            if c:
                for l in f.loops: l[col] = c
    # une paroi interieure sombre du modele, mise a nu juste sous la coupe, prend la meme couleur que la coupe
    if col and defaut:
        h = max(zs) - min(zs)
        for f in bm.faces:
            if f not in neuves and f.normal.z > 0.7 and zc - f.calc_center_median().z < h * 0.03 and sum(f.loops[0][col][:3]) <= 0.45:
                for l in f.loops: l[col] = defaut
    # garder le plus gros morceau
    bm.verts.ensure_lookup_table(); vus = set(); iles = []
    for v in bm.verts:
        if v in vus: continue
        ile, pile = [], [v]
        while pile:
            x = pile.pop()
            if x in vus: continue
            vus.add(x); ile.append(x); pile.extend(e.other_vert(x) for e in x.link_edges)
        iles.append(ile)
    iles.sort(key=len, reverse=True)
    # on garde le plus gros morceau, ceux qui touchent le sol (piles d'un pont posees sur leur dalle) et les gros ;
    # les petits morceaux en l'air (une pale coupee de son moyeu) partent
    sol = min(zs) + (max(zs) - min(zs)) * 0.02
    # (un prisme de huit sommets pose par monument_retouches.py, un cadre de fenetre, reste)
    retires = [ile for ile in iles[1:] if min(v.co.z for v in ile) > sol and len(ile) < len(iles[0]) * 0.25 and len(ile) != 8]
    for ile in retires:
        bmesh.ops.delete(bm, geom=ile, context="VERTS")
    bm.to_mesh(o.data); bm.free(); o.data.update()
    sortie = os.path.join(dossier, f"etape-{i}.glb")
    bpy.ops.export_scene.gltf(filepath=sortie, export_texcoords=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    print(f"etape {i} : coupe a {part:.0%}, {len(o.data.polygons)} triangles, {len(retires)} morceaux retires")

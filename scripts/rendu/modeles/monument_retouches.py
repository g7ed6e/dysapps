# Retouches d'un monument reduit (monument_lowpoly.py), demandees par le directeur artistique et le consultant Archipeo
# apres les captures du 10 octobre 2026 : repeindre par zones, retirer une piece mal sortie de TRELLIS, ajouter une
# forme simple (gradins, flamme, dalle), etirer une tour. Couleurs en sRGB, comme le .glb.
#   python monument_retouches.py -- <nom> entree.glb sortie.glb
# <nom> : moulin, moulin-etape (une etape du grand moulin), kiosque, observatoire-etoiles, temple, observatoire-baleines, phare, amphitheatre, viaduc
import bpy, bmesh, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
nom, entree, sortie = a[0], a[1], a[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=entree)
o = [o for o in bpy.data.objects if o.type == "MESH"][0]
o.data.transform(o.matrix_world); o.matrix_world.identity()
bm = bmesh.new(); bm.from_mesh(o.data)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
col = bm.loops.layers.color.active or bm.loops.layers.float_color.active
zs = [v.co.z for v in bm.verts]; Z0, H = min(zs), max(zs) - min(zs)

def couleur(f): return tuple(f.loops[0][col][:3])
def peindre(f, c):
    for l in f.loops: l[col] = (*c, 1.0)
def z(f): return (f.calc_center_median().z - Z0) / H      # hauteur relative 0..1
def r(f): c = f.calc_center_median(); return math.hypot(c.x, c.y)
def faces(): bm.faces.ensure_lookup_table(); return list(bm.faces)
def retirer(fs): bmesh.ops.delete(bm, geom=list(fs), context="FACES")

def prisme(contour_bas, h, c_dessus, c_cotes, c_dessous=None):
    """Prisme droit sous un contour (liste de (x, y) dans le sens direct, z absolu du bas), hauteur h."""
    zb = contour_bas[0][2]
    bas = [bm.verts.new((x, y, zb)) for x, y, _ in contour_bas]
    haut = [bm.verts.new((x, y, zb + h)) for x, y, _ in contour_bas]
    n = len(bas)
    peindre(bm.faces.new(haut), c_dessus)
    peindre(bm.faces.new(bas[::-1]), c_dessous or c_cotes)
    for i in range(n):
        j = (i + 1) % n
        peindre(bm.faces.new((bas[i], bas[j], haut[j], haut[i])), c_cotes)

def secteur(cx, cy, r0, r1, a0, a1, zb, h, c_dessus, c_cotes, n=10):
    """Gradin : secteur d'anneau plein, en n segments."""
    for k in range(n):
        t0 = math.radians(a0 + (a1 - a0) * k / n); t1 = math.radians(a0 + (a1 - a0) * (k + 1) / n)
        pts = [(cx + r0 * math.cos(t0), cy + r0 * math.sin(t0), zb), (cx + r1 * math.cos(t0), cy + r1 * math.sin(t0), zb),
               (cx + r1 * math.cos(t1), cy + r1 * math.sin(t1), zb), (cx + r0 * math.cos(t1), cy + r0 * math.sin(t1), zb)]
        if a1 < a0: pts = pts[::-1]
        prisme(pts, h, c_dessus, c_cotes)

def cylindre(cx, cy, zb, rayon, h, c_dessus, c_cotes, n=12):
    prisme([(cx + rayon * math.cos(2 * math.pi * k / n), cy + rayon * math.sin(2 * math.pi * k / n), zb) for k in range(n)], h, c_dessus, c_cotes)

def cone(cx, cy, zb, rayon, h, c, n=6, tourne=0.0):
    bas = [bm.verts.new((cx + rayon * math.cos(2 * math.pi * k / n + tourne), cy + rayon * math.sin(2 * math.pi * k / n + tourne), zb)) for k in range(n)]
    pointe = bm.verts.new((cx, cy, zb + h))
    peindre(bm.faces.new(bas[::-1]), c)
    for k in range(n): peindre(bm.faces.new((bas[k], bas[(k + 1) % n], pointe)), c)


def simplifier(fs_, n):
    """Reduit un ensemble de facettes a n triangles (fast-simplification) ; chaque triangle neuf reprend la couleur de
    la facette d'origine la plus proche de son centre. Rend les facettes neuves."""
    import numpy as np, fast_simplification
    from mathutils.kdtree import KDTree
    tri = bmesh.ops.triangulate(bm, faces=list(fs_))["faces"]
    idx, pts, tris, kd = {}, [], [], KDTree(len(tri))
    for i, f in enumerate(tri):
        kd.insert(f.calc_center_median(), i)
        t = []
        for v in f.verts:
            k = tuple(round(c, 6) for c in v.co)
            if k not in idx: idx[k] = len(pts); pts.append(k)
            t.append(idx[k])
        tris.append(t)
    kd.balance()
    cols = [couleur(f) for f in tri]
    p2, t2 = fast_simplification.simplify(np.array(pts, dtype=np.float32), np.array(tris, dtype=np.int32), target_reduction=1 - n / len(tris))
    retirer(tri)
    vs = [bm.verts.new(tuple(map(float, q))) for q in p2]
    neuves = []
    for t in t2:
        try: f = bm.faces.new([vs[int(i)] for i in t])
        except ValueError: continue
        peindre(f, cols[kd.find(f.calc_center_median())[1]]); neuves.append(f)
    return neuves

BOIS_SOMBRE, BOIS_CLAIR, LAITON = (0.42, 0.27, 0.17), (0.80, 0.66, 0.46), (0.80, 0.58, 0.22)
FEU = (0.929, 0.584, 0.278)   # #ed9547 : la couleur que le jeu allume la nuit (isFire)

if nom == "kiosque":
    # toit a bandes de toile rouge et creme (une facette sur deux, d'apres l'orientation de sa normale), epi dore,
    # piliers et balustrade en bois sombre, plancher en lames claires
    for f in faces():
        h = z(f); n = f.normal
        if h > 0.93: peindre(f, (0.90, 0.68, 0.22))
        elif h > 0.62 and n.z > 0.15:
            k = int(((math.atan2(n.y, n.x) + math.pi) / (math.pi / 4)) + 0.5) % 8
            peindre(f, (0.74, 0.20, 0.20) if k % 2 else (0.95, 0.90, 0.80))
        elif h > 0.60 and n.z <= 0.15: peindre(f, BOIS_SOMBRE)
        elif h > 0.07 and abs(n.z) < 0.6: peindre(f, BOIS_SOMBRE)
        elif h > 0.04 and n.z >= 0.6: peindre(f, BOIS_CLAIR)

elif nom == "observatoire-etoiles":
    # coupole bleu soutenu, tambour creme nettement plus clair, lunette et anneau en laiton, socle de pierre chaude
    for f in faces():
        c = couleur(f); h = z(f)
        if c[0] - c[2] > 0.15 and c[1] - c[2] > 0.1: peindre(f, LAITON)
        elif c[2] - c[0] > 0.05 or h > 0.47: peindre(f, (0.30, 0.44, 0.66))
        elif h < 0.05: peindre(f, (0.60, 0.55, 0.48))
        elif 0.40 < h <= 0.47: peindre(f, LAITON)
        else: peindre(f, (0.97, 0.94, 0.86))

elif nom == "temple":
    # toit de marbre bleute plus sombre, eclat dore au faite, mur du sanctuaire ocre derriere les colonnes, marches grises
    for f in faces():
        h = z(f)
        if h > 0.89: peindre(f, (1.0, 0.82, 0.30))
        elif h > 0.68: peindre(f, (0.50, 0.58, 0.70))
        elif h < 0.12: peindre(f, (0.74, 0.72, 0.68))
        elif r(f) < 0.22 and h < 0.62: peindre(f, (0.82, 0.62, 0.42))

elif nom == "observatoire-baleines":
    # longue-vue en laiton ; le pourtour de galets dechiquete laisse la place a une dalle carree nette
    for f in faces():
        c = couleur(f)
        if z(f) > 0.70 and c[0] > 0.8 and c[2] < 0.72: peindre(f, LAITON)
    retirer(f for f in faces() if z(f) < 0.12 and max(abs(f.calc_center_median().x), abs(f.calc_center_median().y)) > 0.25)
    zb = Z0
    prisme([(-0.33, -0.33, zb), (0.33, -0.33, zb), (0.33, 0.33, zb), (-0.33, 0.33, zb)], 0.035, (0.62, 0.62, 0.64), (0.50, 0.50, 0.52))

elif nom == "phare":
    # la colonne grise mal sortie au-dessus de la corbeille part, une flamme pleine la remplace ; la tour s'etire
    # (plus haute que large) ; l'eboulis du pied laisse la place a une dalle ronde
    retirer(f for f in faces() if z(f) > 0.80 and r(f) < 0.14)
    retirer(f for f in faces() if z(f) < 0.12 and r(f) > 0.21)
    bas, haut = Z0 + 0.07 * H, Z0 + 0.71 * H
    for v in bm.verts:
        if v.co.z > haut: v.co.z += (haut - bas) * 0.6
        elif v.co.z > bas: v.co.z = bas + (v.co.z - bas) * 1.6
    zc = Z0 + 0.80 * H + (haut - bas) * 0.6
    cone(0.02, -0.02, zc - 0.03, 0.12, 0.26, FEU, 6)
    cone(0.06, 0.02, zc - 0.02, 0.07, 0.18, FEU, 5, 0.4)
    cone(-0.04, 0.03, zc - 0.02, 0.07, 0.15, FEU, 5, 1.1)
    cylindre(0.0, 0.0, Z0, 0.34, 0.05, (0.55, 0.57, 0.60), (0.42, 0.45, 0.50), 12)
    # les facettes presque noires du creux de la corbeille (un trou sous la flamme, de jour comme de nuit) : fer gris
    for f in faces():
        if sum(couleur(f)) < 0.35: peindre(f, (0.32, 0.34, 0.38))

elif nom == "amphitheatre":
    # les eclats rouges partent ; trois gradins pleins en arc de cercle, velours rouge dessus, pierre devant
    retirer(f for f in faces() if couleur(f)[0] > 0.6 and couleur(f)[1] < 0.3)
    # les eclats sombres qui restaient sous les sieges
    retirer(f for f in faces() if sum(couleur(f)) < 0.3 and f.calc_center_median().y < 0.1 and z(f) < 0.4)
    zb = Z0 + 0.05
    for i, (r0, r1, h) in enumerate(((0.22, 0.32, 0.05), (0.32, 0.42, 0.10), (0.42, 0.52, 0.15))):
        secteur(0.0, 0.12, r0, r1, 210, 330, zb, h, (0.72, 0.15, 0.20), (0.86, 0.79, 0.70), 10)

elif nom == "viaduc":
    # deux arches au lieu d'une, comme le plan en cubes (trois paires de piles) : le pont sans la locomotive est
    # repete bout a bout dans sa longueur (y), ses piles s'etirent pour que le tablier monte a la hauteur de celui du
    # plan ; la locomotive, repeinte gris-bleu et grossie, passe au milieu
    loco = set(f for f in faces() if z(f) > 0.86 or (z(f) > 0.8 and couleur(f)[2] - couleur(f)[0] > 0.05))
    # la locomotive se detache du tablier : elle bouge sans tirer ses facettes
    loco = set(g for g in bmesh.ops.split(bm, geom=list(loco))["geom"] if isinstance(g, bmesh.types.BMFace))
    # le haut du fichier melange la locomotive (bleutee) et des eclats du tablier : ceux-ci prennent la pierre du tablier
    for f in loco:
        peindre(f, (0.36, 0.46, 0.60) if couleur(f)[2] - couleur(f)[0] > 0.0 else (0.47, 0.48, 0.50))
    pont = simplifier([f for f in faces() if f not in loco], 900)   # deux ponts et la locomotive tiennent dans 3 000
    ys = [v.co.y for f in pont for v in f.verts]; L = max(ys) - min(ys)
    r_ = bmesh.ops.duplicate(bm, geom=pont)
    bmesh.ops.translate(bm, verts=[g for g in r_["geom"] if isinstance(g, bmesh.types.BMVert)], vec=Vector((0, L * 0.97, 0)))
    vl = set(v for f in loco for v in f.verts)
    tablier = Z0 + 0.86 * H
    ETIRE = float(a[3]) if len(a) > 3 else 3.0   # les piles allongees : le viaduc fini atteint la hauteur de son plan
    for v in bm.verts:
        if v in vl: continue
        if v.co.z > Z0 + 0.12 * H: v.co.z = Z0 + 0.12 * H + (v.co.z - Z0 - 0.12 * H) * ETIRE
    hausse = (tablier - Z0 - 0.12 * H) * (ETIRE - 1)   # le tablier monte d'autant que les piles s'allongent
    c = sum((v.co for v in vl), Vector()) / len(vl)
    for v in vl:
        d = v.co - c   # plus longue et plus haute, pas plus large que le tablier
        v.co = Vector((c.x + d.x * 1.05, c.y + d.y * 1.6, c.z + d.z * 1.8)) + Vector((0, L * 0.485, hausse))
    # le dessus du tablier, un amas de facettes grises (rails, eclats), d'une seule teinte de pierre
    zt = tablier + hausse - 0.15 * H
    for f in faces():
        if f not in loco and f.calc_center_median().z > zt: peindre(f, (0.47, 0.48, 0.50))
elif nom == "moulin":
    # fenetres nettes (directeur artistique, 10 octobre 2026) : les creux des fenetres, de la couleur du mur, se lisaient
    # comme des chiffres (un « 8 », un « 6 ») ; chacun devient un rectangle simple, cadre de bois et fond d'ardoise,
    # pose sur le mur. Places relevees sur le modele en aplats (angle autour de l'axe en degres, hauteur du centre).
    # couleurs du fichier (celles de reglages.csv) : le calque de couleur les lit encodees en sRVB
    def fichier(h): return tuple(x * 12.92 if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055 for x in ((h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255))
    MUR, BOIS, FOND = fichier(0xd6c8ab), fichier(0x8c5a3c), fichier(0x46628a)
    for angle, zc in ((-105.0, 0.224), (-104.0, 0.415), (107.0, 0.225)):
        t = math.radians(angle); u = Vector((math.cos(t), math.sin(t), 0)); v = Vector((-math.sin(t), math.cos(t), 0))
        zz = Z0 + zc * H
        proches = [f for f in faces() if abs(f.calc_center_median().z - zz) < 0.07 * H
                   and abs(math.remainder(math.atan2(f.calc_center_median().y, f.calc_center_median().x) - t, 2 * math.pi)) < math.radians(14)]
        mur = sorted(r(f) for f in proches if abs(f.normal.z) < 0.5 and abs(f.calc_center_median().z - zz) < 0.03 * H and r(f) < 0.24)
        rmur = mur[len(mur) * 3 // 4] if mur else 0.2   # le mur, pas les ailes ni le socle
        for f in proches:
            if r(f) < rmur - 0.004: peindre(f, MUR)   # le creux prend la couleur du mur
        for demi_l, demi_h, prof, c in ((0.040, 0.055, 0.016, BOIS), (0.027, 0.042, 0.022, FOND)):
            o_ = u * rmur
            coins = [o_ + v * sx * demi_l for sx in (-1, 1)]
            bas = [Vector((p.x, p.y, zz - demi_h)) for p in (coins[0] - u * 0.012, coins[1] - u * 0.012, coins[1] + u * prof, coins[0] + u * prof)]
            prisme([(p.x, p.y, p.z) for p in bas], 2 * demi_h, c, c)
elif nom == "moulin-etape":
    # etape de chantier du grand moulin coupee sous le moyeu : le bout d'aile qui depasse de la tour part (il se lisait
    # comme un debris) ; la tour garde son rayon, mesure sur le couvercle de la coupe
    cap = [r(f) for f in faces() if f.normal.z > 0.9 and z(f) > 0.95]
    rmax = max(cap) if cap else 0.2
    retirer(f for f in faces() if z(f) > 0.45 and max(math.hypot(v.co.x, v.co.y) for v in f.verts) > rmax * 1.06)
    # les eclats d'aile restes en haut de la tour (bois brun, au-dessus des fenetres) ; les cadres des fenetres, des
    # prismes a part de huit sommets, restent
    cadres = set()
    for f in faces():
        if f in cadres: continue
        ile, pile, vus = set(), [f], set()
        while pile:
            g = pile.pop()
            if g in ile: continue
            ile.add(g); vus.update(g.verts)
            pile.extend(h for e in g.edges for h in e.link_faces if h not in ile)
            if len(vus) > 8: break
        if len(vus) == 8: cadres |= ile
    retirer(f for f in faces() if f not in cadres and z(f) > 0.74 and f.normal.z < 0.9 and couleur(f)[0] - couleur(f)[2] > 0.2)
    # et ce qui reste de l'arbre du moyeu (vers -138 degres) : des facettes qui ne regardent pas vers l'exterieur
    def hors_mur(f):
        c = f.calc_center_median(); rc = math.hypot(c.x, c.y) or 1e-6
        return (f.normal.x * c.x + f.normal.y * c.y) / rc < 0.6 and abs(f.normal.z) < 0.95
    retirer(f for f in faces() if f not in cadres and z(f) > 0.8 and hors_mur(f)
            and abs(math.remainder(math.atan2(f.calc_center_median().y, f.calc_center_median().x) - math.radians(-138), 2 * math.pi)) < math.radians(25))
    # puis les petits bouts restes seuls (moins de 30 facettes), cadres mis a part
    vus = set()
    for f in faces():
        if f in vus or f in cadres: continue
        ile, pile = set(), [f]
        while pile:
            g = pile.pop()
            if g in ile: continue
            ile.add(g); pile.extend(h for e in g.edges for h in e.link_faces if h not in ile)
        vus |= ile
        if len(ile) < 30: retirer(ile)
else:
    raise SystemExit(f"monument inconnu : {nom}")

bm.normal_update()
bm.to_mesh(o.data); bm.free(); o.data.update()
bpy.ops.export_scene.gltf(filepath=sortie, export_texcoords=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False)
print(f"{nom} : {len(o.data.polygons)} faces")

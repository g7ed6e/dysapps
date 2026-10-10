# Monument low-poly en aplats francs : remaille en voxels un .glb texture (TRELLIS.2), le reduit a N triangles,
# puis peint chaque facette d'une seule couleur, prise dans une courte liste de couleurs cibles (4 a 6) choisie pour
# le monument dans docs/univers/archipeo/monuments/modeles/reglages.csv, ou pour le batiment d'un plan dans
# docs/univers/archipeo/batiments/modeles/reglages.csv (choix du mainteneur, 10 octobre 2026 : « low poly avec des
# aplats de couleur »).
#   (module bpy, avec numpy et fast-simplification)
#   python monument_lowpoly.py -- entree.glb sortie.glb <nom du dossier> [N=3000] [K=6] [voxel]
#
# Le remaillage (voxel = part de la plus grande dimension, 0,008 sauf autre valeur dans la table) lisse la surface de TRELLIS avant le Decimate de Blender :
# sans lui, la reduction laisse eclats, trous et ailes dechirees. Les couleurs : la texture de TRELLIS a l'ombre
# peinte, et ses faces internes sont noires. Chaque facette lit la texture du brut en sept points (les noirs ecartes) ;
# les facettes se regroupent en K grappes (k-moyennes en Lab, la luminance comptee a 35 % pour que l'ombre pese moins) ;
# chaque grappe prend la cible la plus proche, une grappe bleutee prend la cible la plus bleue (l'ardoise sortait
# noire) ; une facette sans couleur lue prend celle de ses voisines, et un triangle isole celle qui l'entoure.
import bpy, sys, os, csv
import numpy as np
from collections import Counter, defaultdict
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform

a = sys.argv[sys.argv.index("--") + 1:]
ENTREE, SORTIE, NOM = a[0], a[1], a[2]
N = int(a[3]) if len(a) > 3 else 3000
K = int(a[4]) if len(a) > 4 and a[4] != "-" else None
VOXEL = float(a[5]) if len(a) > 5 else None
# les deux tables : celle des monuments, puis celle des batiments des plans (decision du mainteneur, 10 octobre 2026 :
# les batiments passent par la meme chaine) ; le nom du dossier n'est que dans l'une des deux
ICI = os.path.dirname(os.path.abspath(__file__))
TABLES = [os.path.join(ICI, "../../../docs/univers/archipeo", t, "modeles/reglages.csv") for t in ("monuments", "batiments")]
cibles = None
BATIMENT = False   # le nom est dans la table des batiments : les regles des batiments (plus bas)
AVANT_TOIT = None  # la hauteur de l'avant-toit lue dans la table (colonne 4), en part de la hauteur sans le socle
RETOUCHES = []     # les retouches du batiment (colonne 6 de sa ligne), voir plus bas
for table in TABLES:
    if not os.path.exists(table): continue
    for ligne in csv.reader((l for l in open(table, encoding="utf-8") if not l.startswith("#")), delimiter=";"):
        if ligne and ligne[0].strip() == NOM:
            cibles = [int(h, 16) for h in ligne[1].split()]
            if VOXEL is None and len(ligne) > 2 and ligne[2].strip(): VOXEL = float(ligne[2])
            BATIMENT = table.endswith(os.path.join("batiments", "modeles", "reglages.csv"))
            if BATIMENT and len(ligne) > 3 and ligne[3].strip(): AVANT_TOIT = float(ligne[3])
            if BATIMENT and len(ligne) > 5: RETOUCHES = ligne[5].split()
if VOXEL is None: VOXEL = 0.008
if K is None: K = 12 if BATIMENT else 6
if not cibles:
    raise SystemExit(f"{NOM} : pas de couleurs cibles dans {' ni '.join(TABLES)}")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=ENTREE)
o = [x for x in bpy.data.objects if x.type == "MESH"][0]
o.data.transform(o.matrix_world); o.matrix_world.identity()
orig = o.copy(); orig.data = o.data.copy(); bpy.context.collection.objects.link(orig)
image = next(l.from_node.image for m in orig.data.materials if m and m.use_nodes for n in m.node_tree.nodes
             if n.type == "BSDF_PRINCIPLED" for l in n.inputs["Base Color"].links if l.from_node.type == "TEX_IMAGE")
L, H = image.size
pixels = np.array(image.pixels[:], np.float32).reshape(H, L, 4)[..., :3]   # sRVB (image 8 bits)

bpy.context.view_layer.objects.active = o
if VOXEL > 0:
    r = o.modifiers.new("v", "REMESH"); r.mode = "VOXEL"; r.voxel_size = max(o.dimensions) * VOXEL
    bpy.ops.object.modifier_apply(modifier="v")
for _ in range(6):   # le Decimate cale parfois au-dessus de la cible (pieces detachees) : on repasse
    o.modifiers.new("t", "TRIANGULATE"); bpy.ops.object.modifier_apply(modifier="t")
    n = len(o.data.polygons)
    if n <= N * 1.02: break
    d = o.modifiers.new("d", "DECIMATE"); d.decimate_type = "COLLAPSE"; d.ratio = N / n
    bpy.ops.object.modifier_apply(modifier="d")
if len(o.data.polygons) > N * 1.02:   # toujours trop : reduction quadrique (fast-simplification, licence MIT)
    import fast_simplification as fs
    V = np.array([v.co[:] for v in o.data.vertices], np.float32)
    F = np.array([p.vertices[:] for p in o.data.polygons], np.int32)
    V2, F2 = fs.simplify(V, F, target_reduction=1 - N / len(F))
    o.data.clear_geometry(); o.data.from_pydata(V2.tolist(), [], F2.tolist()); o.data.update()
me = o.data

# la couleur de chaque facette, lue sur le brut (point le plus proche, coordonnees de texture interpolees)
arbre = BVHTree.FromObject(orig, bpy.context.evaluated_depsgraph_get())
mo = orig.data; uvs = mo.uv_layers.active.data
poids = [(1/3, 1/3, 1/3), (.6, .2, .2), (.2, .6, .2), (.2, .2, .6), (.45, .45, .1), (.1, .45, .45), (.45, .1, .45)]
cols = []
for p in me.polygons:
    v = [me.vertices[i].co for i in p.vertices[:3]]; s = []
    for w in poids:
        co, _, idx, _ = arbre.find_nearest(v[0] * w[0] + v[1] * w[1] + v[2] * w[2])
        f = mo.polygons[idx]
        A, B, C = (mo.vertices[i].co for i in f.vertices[:3])
        uv = barycentric_transform(co, A, B, C, *(uvs[li].uv.to_3d() for li in list(f.loop_indices)[:3]))
        s.append(pixels[min(H - 1, max(0, int(uv.y * H))), min(L - 1, max(0, int(uv.x * L)))])
    s = np.array(s); ok = s.max(1) > .06
    cols.append(np.median(s[ok], 0) if ok.any() else np.zeros(3))
bpy.data.objects.remove(orig)
S = np.array(cols)
inconnu = S.max(1) <= .06
aire = np.array([p.area for p in me.polygons]) * ~inconnu

def lab(c, lw=.35):
    l = np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
    xyz = l @ np.array([[.4124, .3576, .1805], [.2126, .7152, .0722], [.0193, .1192, .9505]]).T / np.array([.9505, 1, 1.089])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([(116 * f[:, 1] - 16) * lw, 500 * (f[:, 0] - f[:, 1]), 200 * (f[:, 1] - f[:, 2])], 1)

X = lab(S)
if (aire > 0).sum() < K:
    raise SystemExit(f"{NOM} : moins de {K} facettes dont la couleur se lit dans la texture")
C = X[np.random.default_rng(1).choice(len(X), K, replace=False, p=aire / aire.sum())]
for _ in range(40):
    g = ((X[:, None] - C[None]) ** 2).sum(2).argmin(1)
    C = np.array([np.average(X[g == k], 0, aire[g == k]) if aire[g == k].sum() > 0 else C[k] for k in range(K)])
T = np.array([[(c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255] for c in cibles])
if not BATIMENT:
    # l'ombre peinte rend une grappe plus sombre que sa cible : on la remonte de 12 points de luminance L* (mesure sur le
    # moulin : un mur clair au soleil et a l'ombre se lit a 10 a 15 points sous sa cible), comptes a 35 % comme le reste
    TL = lab(T); CL = C.copy(); CL[:, 0] += 12 * .35
    choix = ((CL[:, None] - TL[None]) ** 2).sum(2).argmin(1)
    # une grappe nettement bleutee (b* sous -4 : au-dela du bruit d'un gris) prend la cible la plus bleue, meme sombre
    choix[CL[:, 2] < -4] = TL[:, 2].argmin()
else:
    # Les batiments (planche du 10 octobre 2026 : murs blancs sortis gris, toit d'ardoise sorti brun, bandeau orange perdu).
    # La texture de TRELLIS est sombre et l'ombre y est peinte : une ombre multiplie les trois canaux, elle garde la
    # chromaticite (r, g, b divises par leur somme, en lineaire) et ne change que la luminance. Chaque grappe prend donc la
    # cible la plus proche en chromaticite, la luminance (en logarithme, la cible assombrie de 20 %) comptee moins. Puis la
    # geometrie tient les roles : le socle, le toit et les murs (batiment_mesures.py).
    import batiment_mesures as BM
    lin = lambda c: np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)

    def teinte(c, ombre=1.0):
        l = lin(c) + 0.004
        return np.c_[10 * l / l.sum(1, keepdims=True), 0.8 * np.log(ombre * (l @ np.array([.2126, .7152, .0722])))]

    moy = np.array([np.average(S[g == k], 0, aire[g == k]) if aire[g == k].sum() > 0 else np.zeros(3) for k in range(K)])
    D = ((teinte(moy)[:, None] - teinte(T, 0.8)[None]) ** 2).sum(2)
    Vb = np.array([v.co[:] for v in me.vertices]); Fb = np.array([p.vertices[:] for p in me.polygons])
    Vb, Fb = BM.souder(Vb, Fb)
    z0, z1 = Vb[:, 2].min(), Vb[:, 2].max()
    socle = BM.dessus_du_socle(Vb, Fb)
    pied = z0 if socle is None else socle
    toit_z = pied + (z1 - pied) * (AVANT_TOIT if AVANT_TOIT is not None else BM.avant_toit(Vb, Fb, bas=socle)[0])
    ctr = np.array([p.center[:] for p in me.polygons]); nz = np.array([p.normal.z for p in me.polygons])
    zone_socle = ctr[:, 2] < pied
    zone_toit = (ctr[:, 2] > toit_z) & (nz > 0.3)
    zone_murs = (ctr[:, 2] > pied) & (ctr[:, 2] < toit_z) & (np.abs(nz) < 0.3)
    part = lambda zone, k: aire[(g == k) & zone].sum() / max(aire[g == k].sum(), 1e-12)
    pierre = [i for i, c in enumerate(cibles) if c == 0xA8A39A]   # la pierre du socle (convention de la table)
    sombre = int(np.argmin(lin(T) @ np.array([.2126, .7152, .0722])))
    for k in range(K):
        if part(zone_socle, k) < 0.5: D[k, pierre] = np.inf   # la pierre du socle ne va qu'au socle
        if part(zone_toit, k) >= 0.4: D[k, [sombre, 0]] = np.inf   # un toit n'est ni le fond sombre ni les murs
    choix = D.argmin(1)
    # la grappe qui couvre le plus les murs (entre le socle et l'avant-toit, faces verticales) prend la cible des murs, la
    # premiere de la ligne (la hutte de Nenu : son enduit vert sauge sortait vert nenuphar)
    tm = teinte(moy)
    murs_k = int(np.argmax([aire[(g == k) & zone_murs].sum() for k in range(K)]))
    choix[murs_k] = 0
    # et les grappes surtout sur les murs, plus proches de celle-la que de leur cible, la suivent (le rose vif du chalet de
    # Perle, eclate en plusieurs grappes par l'ombre, sortait brun)
    for k in range(K):
        if part(zone_murs, k) >= 0.5 and ((tm[k] - tm[murs_k]) ** 2).sum() < D[k, choix[k]] and part(zone_toit, k) < 0.4:
            choix[k] = 0
    # le toit : la deuxieme cible de la ligne. Si aucune grappe ne la prend sur au moins un quart du toit (au-dessus de
    # l'avant-toit, tourne vers le haut), la grappe qui couvre le plus le toit la prend (la scierie de Rabot : ses
    # bardeaux bruns dans le brut, gris-vert dans le concept)
    if len(cibles) > 1:
        toit_aire = aire[zone_toit].sum()
        par_toit = np.array([aire[(g == k) & zone_toit].sum() for k in range(K)])
        if toit_aire > 0 and par_toit[choix == 1].sum() < 0.25 * toit_aire:
            choix[int(np.argmax(par_toit))] = 1
            # et les autres grappes surtout sur le toit (sinon un toit en taches)
            for k in range(K):
                if part(zone_toit, k) >= 0.6:
                    choix[k] = 1
    print(f"socle a {0 if socle is None else (socle - z0) / (z1 - z0):.3f}, avant-toit a {(toit_z - pied) / (z1 - pied):.3f}")
for k in np.argsort([-aire[g == k].sum() for k in range(K)]):
    m = np.average(S[g == k], 0, aire[g == k]) if aire[g == k].sum() > 0 else np.zeros(3)
    print("grappe #%02x%02x%02x %3.0f %% -> #%06x" % (*(m * 255).round().astype(int), 100 * aire[g == k].sum() / aire.sum(), cibles[choix[k]]))
lab_f = choix[g]; lab_f[inconnu] = -1

voisins = defaultdict(list)
for p in me.polygons:
    for ek in p.edge_keys: voisins[ek].append(p.index)
def autour(p): return [lab_f[f] for ek in p.edge_keys for f in voisins[ek] if f != p.index]
for _ in range(50):   # facettes sans couleur lue (faces internes) : la couleur la plus frequente autour
    reste = False
    for p in me.polygons:
        if lab_f[p.index] == -1:
            nb = [x for x in autour(p) if x != -1]
            if nb: lab_f[p.index] = Counter(nb).most_common(1)[0][0]
            else: reste = True
    if not reste: break
lab_f[lab_f == -1] = 0
for _ in range(2):    # triangles isoles
    neuf = lab_f.copy()
    for p in me.polygons:
        nb = autour(p)
        if len(nb) >= 2 and len(set(nb)) == 1 and nb[0] != lab_f[p.index]: neuf[p.index] = nb[0]
    lab_f = neuf

if BATIMENT:
    # Les ouvertures (avis du directeur artistique, 10 octobre 2026 : une porte se lit comme un trou sombre, de pres comme
    # de loin). Le fond sombre de la ligne (3a2a22 au 6e, 33291f au 5e ; sinon sa cible la plus sombre) l'emporte sur
    # toute face en retrait, porte, arche, etal ou four, quelle que soit la couleur que sa grappe a prise : une face entre
    # le socle et l'avant-toit d'ou moins de 40 % du ciel se voit (des rayons lances autour de sa normale, sans compter le
    # socle) est au fond d'un creux ; un mur sous un grand avant-toit en voit plus de la moitie.
    from mathutils import Vector
    fonds = [i for i, c in enumerate(cibles) if c in (0x3A2A22, 0x33291F)]
    fond = fonds[0] if fonds else sombre
    taille = max(z1 - z0, np.ptp(Vb[:, 0]), np.ptp(Vb[:, 1]))
    garde = [p.index for p in me.polygons if p.center.z >= pied]
    arbre_b = BVHTree.FromPolygons([v.co for v in me.vertices], [me.polygons[i].vertices[:] for i in garde])
    # 48 directions en cosinus autour de la normale (spirale de Fibonacci), les memes pour toutes les faces
    nr = 48
    u = (np.arange(nr) + 0.5) / nr; phi = np.arange(nr) * np.pi * (3 - np.sqrt(5))
    loc = np.c_[np.sqrt(u) * np.cos(phi), np.sqrt(u) * np.sin(phi), np.sqrt(1 - u)]

    def ciel(p):
        n = np.array(p.normal[:]); t = np.cross(n, (0, 0, 1) if abs(n[2]) < 0.9 else (1, 0, 0)); t /= np.linalg.norm(t)
        b = np.cross(n, t); o = Vector(p.center + p.normal * (0.004 * taille))
        return sum(arbre_b.ray_cast(o, Vector(d))[0] is None for d in loc @ np.array([t, b, n])) / nr

    retrait = np.zeros(len(me.polygons), bool)
    for p in me.polygons:
        if pied + 0.01 * taille < p.center.z < toit_z and p.normal.z < 0.9:
            retrait[p.index] = ciel(p) < 0.4
    lab_f[retrait] = fond
    if os.environ.get("DIAG"):
        np.savez(os.environ["DIAG"], ctr=ctr, nor=np.array([p.normal[:] for p in me.polygons]), S=S, lab=lab_f, aire=aire,
                 V=np.array([v.co[:] for v in me.vertices]), F=np.array([p.vertices[:] for p in me.polygons]), pied=pied, toit=toit_z, g=g)
    print(f"retrait : {100 * aire[retrait].sum() / aire.sum():.1f} % de la surface prend le fond #{cibles[fond]:06x}")

    # Les retouches d'un batiment (colonne 6 de sa ligne, demandes du directeur artistique et du consultant Archipeo,
    # 10 octobre 2026), des mots separes par des espaces :
    #   murs=tout          toute grappe surtout sur les murs prend la cible des murs (le bleu glace de l'igloo de Frimas) ;
    #   grappe=src>dst     la grappe dont la couleur moyenne lue (journal « grappe #… ») est la plus proche de src prend dst :
    #                      une signature fondue dans une cible voisine (le pot de la serre, la roue dentee de l'atelier) ;
    #   toit=tout          toute face du toit (au-dessus de l'avant-toit, tournee vers le haut) prend la cible du toit ;
    #   zone=a-b:src>dst   entre a et b (part de la hauteur depuis le socle), les faces de couleur src prennent dst
    #                      (src * : toutes) ; zone=a-b:src>dst:v pour les faces verticales seulement. Le maillage est
    #                      d'abord recoupe aux hauteurs a et b : la bande suit une ligne droite, pas les grands triangles
    #                      d'un mur (le bandeau de la cabane de Sema sortait en coins) ;
    #   loin-...           lues par batiment_loin.py (la version de loin).
    rang = {c: i for i, c in enumerate(cibles)}
    hauteur = (ctr[:, 2] - pied) / (z1 - pied)
    nzf = np.array([p.normal.z for p in me.polygons])
    for r in RETOUCHES:
        if r == "murs=tout":
            for k in range(K):
                if part(zone_murs, k) >= 0.5 and part(zone_toit, k) < 0.4:
                    lab_f[(g == k) & ~retrait & (lab_f != fond)] = 0
        elif r.startswith("grappe="):
            src, dst = r[7:].split(">")
            h = int(src, 16); h = np.array([h >> 16 & 255, h >> 8 & 255, h & 255]) / 255
            k = int(np.argmin(((moy - h) ** 2).sum(1)))
            lab_f[(g == k) & ~retrait] = rang[int(dst, 16)]
        elif r == "toit=tout":
            lab_f[zone_toit] = 1
        elif r.startswith("zone="):
            pass   # apres la peinture, sur le maillage recoupe (plus bas)
        elif not r.startswith("loin-"):
            raise SystemExit(f"{NOM} : retouche inconnue {r}")
    # la facade : le cote ou le sombre (porte, ouverture) couvre le plus de murs ; « facade q » donne le nombre de
    # quarts de tour a passer a aligner.py pour la mettre au sud (-Y), ou le jeu l'attend
    nor = np.array([p.normal[:] for p in me.polygons])
    # le fond sombre lu dans la texture (une ouverture est sombre dans le brut, quelle que soit la cible qu'elle a prise)
    vu = ((S @ np.array([.2126, .7152, .0722]) < 0.16) & ~inconnu) | retrait
    vu &= (np.abs(nor[:, 2]) < 0.3) & (ctr[:, 2] > pied) & (ctr[:, 2] < toit_z)
    # au plus pres du mur exterieur de ce cote (le fond d'un batiment creux, vu par la porte, ne compte pas) ; un autre
    # cote ne l'emporte sur le sud que nettement (la forge a aussi une fenetre de cote)
    lo, hi = ctr[zone_murs, :2].min(0), ctr[zone_murs, :2].max(0)
    pres = 0.15 * (hi - lo).max()
    cotes = []
    for (dx, dy) in ((0, -1), (-1, 0), (0, 1), (1, 0)):
        bord = (lo[1] - ctr[:, 1] if dy < 0 else ctr[:, 1] - hi[1]) if dy else (lo[0] - ctr[:, 0] if dx < 0 else ctr[:, 0] - hi[0])
        cotes.append(aire[vu & (nor[:, :2] @ np.array((dx, dy)) > 0.7) & (bord > -pres)].sum())
    q = int(np.argmax(cotes))
    if cotes[q] < 1.3 * cotes[0]:
        q = 0
    print(f"facade {q} (fond sombre sud, ouest, nord, est : {' '.join(f'{c:.4f}' for c in cotes)})")
attr = me.color_attributes.new("Couleur", "BYTE_COLOR", "CORNER")
me.color_attributes.active_color = attr
# valeurs sRVB ecrites telles quelles dans COLOR_0 (que glTF tient pour lineaire) : le jeu les lit ainsi pour les
# monuments, et les ramene en lineaire pour les batiments (couleursLineaires, src/game/world/buildingModels.ts)
for p in me.polygons:
    c = (*T[lab_f[p.index]], 1.0)
    for li in p.loop_indices: attr.data[li].color = c
    p.use_smooth = False
if BATIMENT and any(r.startswith("zone=") for r in RETOUCHES):
    import bmesh
    from mathutils import Vector
    bm = bmesh.new(); bm.from_mesh(me)
    couche = bm.loops.layers.color[attr.name]
    for r in RETOUCHES:
        if not r.startswith("zone="):
            continue
        champs = r[5:].split(":")
        za, zb = (pied + float(x) * (z1 - pied) for x in champs[0].split("-"))
        src, dst = champs[1].split(">")
        for z in (za, zb):
            bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=Vector((0, 0, z)),
                                   plane_no=Vector((0, 0, 1)))
        # la couche de bmesh rend les octets tels qu'ils sont ranges (sRVB) : l'attribut, lui, les rend lineaires
        code = lambda v: np.where(v <= 0.0031308, v * 12.92, 1.055 * np.power(v, 1 / 2.4) - 0.055)
        a_src = None if src == "*" else code(T[cibles.index(int(src, 16))])
        a_dst = (*code(T[cibles.index(int(dst, 16))]), 1.0)
        for f in bm.faces:
            f.normal_update()
            c = f.calc_center_median()
            if not (za <= c.z <= zb):
                continue
            if a_src is not None and np.abs(np.array(f.loops[0][couche][:3]) - a_src).max() > 0.006:
                continue
            if len(champs) > 2 and champs[2] == "v" and abs(f.normal.z) >= 0.3:
                continue
            for l in f.loops:
                l[couche] = a_dst
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = False
me.materials.clear()
while me.uv_layers: me.uv_layers.remove(me.uv_layers[0])
print(f"{NOM} : {len(me.polygons)} triangles")
bpy.ops.export_scene.gltf(filepath=SORTIE, export_format="GLB", export_texcoords=False,
                          export_vertex_color="ACTIVE", export_all_vertex_colors=False)

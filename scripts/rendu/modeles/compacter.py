# compacter.py entree.glb sortie.glb [quant=0|1] : sans normales (le jeu calcule les siennes, à facettes plates ;
# GLTFLoader passe en flatShading quand elles manquent), sommets identiques (position + UV) soudés, UV en entiers
# 16 bits « normalized » (glTF de base), indices 16 bits si possible ; quant=1 : positions en int16 « normalized »
# ramenées par la translation et l'échelle du nœud (KHR_mesh_quantization, lu par GLTFLoader et par glb.ts).
# L'image (JPEG) et le matériau passent tels quels, ou jpeg=<qualité> : l'image est réencodée.
import json, struct, sys, numpy as np
src, out = sys.argv[1], sys.argv[2]
opts = dict(x.split("=") for x in sys.argv[3:]); quant = opts.get("quant") == "1"; JQ = int(opts["jpeg"]) if "jpeg" in opts else None
b = open(src, "rb").read()
assert struct.unpack_from("<I", b, 0)[0] == 0x46546C67
o = 12; js = bn = None
while o < len(b):
    ln, ty = struct.unpack_from("<II", b, o)
    if ty == 0x4E4F534A: js = json.loads(b[o + 8:o + 8 + ln])
    elif ty == 0x004E4942: bn = b[o + 8:o + 8 + ln]
    o += 8 + ln
CT = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}
NC = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}
def lire(i):
    a = js["accessors"][i]; v = js["bufferViews"][a["bufferView"]]
    dt = np.dtype(CT[a["componentType"]]); n = NC[a["type"]]
    st = v.get("byteStride", dt.itemsize * n); base = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    arr = np.ndarray((a["count"], n), dt, bn, base, (st, dt.itemsize))
    return arr.astype(np.float64 if dt == np.float32 else np.int64)
assert len(js["meshes"]) == 1
node = [n for n in js["nodes"] if "mesh" in n][0]
assert "rotation" not in node and "matrix" not in node and "scale" not in node and "translation" not in node, node
blobs = []; views = []; accs = []; prims = []
def ajouter(data, target=None, stride=None):
    off = sum(len(x) for x in blobs); pad = (-len(data)) % 4
    blobs.append(data + b"\0" * pad)
    v = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
    if target: v["target"] = target
    if stride: v["byteStride"] = stride
    views.append(v); return len(views) - 1
nv0 = nv1 = 0
for p in js["meshes"][0]["primitives"]:
    pos = lire(p["attributes"]["POSITION"]); uv = lire(p["attributes"]["TEXCOORD_0"]); idx = lire(p["indices"])[:, 0]
    nv0 += len(pos)
    assert uv.min() >= -0.01 and uv.max() <= 1.01, (uv.min(), uv.max())  # la réduction déborde à peine (< 0,001) : ramené dans [0, 1]
    uq = np.round(np.clip(uv, 0, 1) * 65535).astype(np.uint16)
    if quant:
        lo, hi = pos.min(0), pos.max(0)
        prims.append((pos, uq, idx, lo, hi, p))
    else:
        prims.append((pos, uq, idx, None, None, p))
if quant:
    lo = np.min([x[3] for x in prims], 0); hi = np.max([x[4] for x in prims], 0)
    T = (lo + hi) / 2; Sc = np.maximum((hi - lo) / 2, 1e-9)
    node["translation"] = T.tolist(); node["scale"] = Sc.tolist()
newprims = []
for pos, uq, idx, _, _, p in prims:
    if quant:
        pq = np.round((pos - T) / Sc * 32767).astype(np.int16)
        cle = np.concatenate([pq.view(np.uint16).astype(np.uint64), uq.astype(np.uint64)], 1)
    else:
        pf = pos.astype(np.float32)
        cle = np.concatenate([pf.view(np.uint32).astype(np.uint64), uq.astype(np.uint64)], 1)
    _, first, inv = np.unique(cle, axis=0, return_index=True, return_inverse=True)
    inv = inv.ravel(); nv = len(first); nv1 += nv
    nidx = inv[idx]
    if quant:
        P = np.zeros((nv, 4), np.int16); P[:, :3] = pq[first]
        vp = ajouter(P.tobytes(), 34962, 8)
        accs.append({"bufferView": vp, "componentType": 5122, "normalized": True, "count": nv, "type": "VEC3",
                     "min": [-32767] * 3, "max": [32767] * 3})
        # min/max réels des entiers
        accs[-1]["min"] = P[:, :3].min(0).tolist(); accs[-1]["max"] = P[:, :3].max(0).tolist()
    else:
        P = pos.astype(np.float32)[first]
        vp = ajouter(P.tobytes(), 34962)
        accs.append({"bufferView": vp, "componentType": 5126, "count": nv, "type": "VEC3",
                     "min": P.min(0).tolist(), "max": P.max(0).tolist()})
    ip = len(accs) - 1
    vu = ajouter(uq[first].tobytes(), 34962)
    accs.append({"bufferView": vu, "componentType": 5123, "normalized": True, "count": nv, "type": "VEC2"}); iu = len(accs) - 1
    if nv < 65536:
        vi = ajouter(nidx.astype(np.uint16).tobytes(), 34963); ct = 5123
    else:
        vi = ajouter(nidx.astype(np.uint32).tobytes(), 34963); ct = 5125
    accs.append({"bufferView": vi, "componentType": ct, "count": len(nidx), "type": "SCALAR"}); ii = len(accs) - 1
    q = {"attributes": {"POSITION": ip, "TEXCOORD_0": iu}, "indices": ii}
    if "material" in p: q["material"] = p["material"]
    newprims.append(q)
# images : recopier leurs octets
for im in js.get("images", []):
    v = js["bufferViews"][im["bufferView"]]; data = bn[v.get("byteOffset", 0):v.get("byteOffset", 0) + v["byteLength"]]
    data = bytes(data)
    if JQ:  # réencodage JPEG (qualité JQ, sans sous-échantillonnage forcé)
        import io
        from PIL import Image
        bio = io.BytesIO(); Image.open(io.BytesIO(data)).convert("RGB").save(bio, "JPEG", quality=JQ, optimize=True); data = bio.getvalue()
        im["mimeType"] = "image/jpeg"
    im["bufferView"] = ajouter(data)
js["bufferViews"] = views; js["accessors"] = accs; js["meshes"][0]["primitives"] = newprims
js["buffers"] = [{"byteLength": sum(len(x) for x in blobs)}]
if quant:
    js["extensionsUsed"] = sorted(set(js.get("extensionsUsed", [])) | {"KHR_mesh_quantization"})
    js["extensionsRequired"] = sorted(set(js.get("extensionsRequired", [])) | {"KHR_mesh_quantization"})
J = json.dumps(js, separators=(",", ":")).encode(); J += b" " * ((-len(J)) % 4)
B = b"".join(blobs)
with open(out, "wb") as f:
    f.write(struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(J) + 8 + len(B)))
    f.write(struct.pack("<II", len(J), 0x4E4F534A)); f.write(J)
    f.write(struct.pack("<II", len(B), 0x004E4942)); f.write(B)
print("sommets", nv0, "->", nv1, "octets", len(b), "->", 12 + 16 + len(J) + len(B), "mime", [i.get("mimeType") for i in js.get("images", [])])

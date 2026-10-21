"""BodyParts3D の OBJ から、腹圧(IAP)ラボ用の胴体モデル(.glb)を作る。

blender -b --factory-startup -P build_iap.py -- <parts_dir> <parts.json> <out.glb>

座標: BodyParts3D は mm・Z が上・-Y が前。1/250 に縮め、高さ 1000mm を原点にする。
glTF 書き出し時に Blender が Y-up へ変換するので、three.js では「前 = +Z」になる。
"""
import sys, json, bpy, bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
PARTS_DIR, PARTS_JSON, OUT = argv
parts = json.load(open(PARTS_JSON))

SCALE = 1 / 250
Z0 = 1000.0

bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = 0.55
    bsdf.inputs["Alpha"].default_value = alpha
    return m

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

M = {
    "bone": mat("bone", srgb("#ddd6c4")),
    "disc": mat("disc", srgb("#b9c4b8")),
    "diaphragm": mat("diaphragm", srgb("#5E8BA8")),
    "floor": mat("floor", srgb("#C9982F")),
    "oblique": mat("oblique", srgb("#86B98C")),
}

def import_ids(ids):
    objs = []
    for fid in ids:
        before = set(bpy.data.objects)
        bpy.ops.wm.obj_import(filepath=f"{PARTS_DIR}/{fid}.obj", forward_axis="Y", up_axis="Z")
        objs += [o for o in bpy.data.objects if o not in before]
    return objs

def build(name, ids, material, ratio):
    objs = import_ids(ids)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name
    ob.data.name = name
    # mm -> 表示単位、高さ 1000mm を原点に
    for v in ob.data.vertices:
        v.co = Vector(((v.co.x) * SCALE, (v.co.y) * SCALE, (v.co.z - Z0) * SCALE))
    if ratio < 1:
        mod = ob.modifiers.new("dec", "DECIMATE")
        mod.ratio = ratio
        bpy.ops.object.modifier_apply(modifier="dec")
    ob.data.materials.clear()
    ob.data.materials.append(material)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob

lumbar_order = ["FJ3157", "FJ3159", "FJ3162", "FJ3165", "FJ3168"]  # L1..L5
objs = []
objs.append(build("ribs", parts["rib"], M["bone"], 0.12))
objs.append(build("cartilage", parts["cartilage"], M["bone"], 0.4))
objs.append(build("sternum", parts["sternum"], M["bone"], 0.4))
objs.append(build("thoracic", parts["thoracic"], M["bone"], 0.3))
for i, fid in enumerate(lumbar_order):
    objs.append(build(f"L{i + 1}", [fid], M["bone"], 0.5))
objs.append(build("discs", parts["disc"], M["disc"], 0.2))
objs.append(build("pelvis", parts["hip"] + parts["sacrum"], M["bone"], 0.8))
objs.append(build("diaphragm", parts["diaphragm"], M["diaphragm"], 0.2))
objs.append(build("pelvic_floor", parts["floor"], M["floor"], 0.25))
objs.append(build("oblique", parts["oblique"], M["oblique"], 0.06))

# 目印(three.js 座標 = Blender の (x, z, -y))
def bb(ob):
    xs = [v.co.x for v in ob.data.vertices]; ys = [v.co.y for v in ob.data.vertices]; zs = [v.co.z for v in ob.data.vertices]
    return {"x": [min(xs), max(xs)], "y_three": [min(zs), max(zs)], "z_three": [-max(ys), -min(ys)], "faces": len(ob.data.polygons)}
info = {o.name: bb(o) for o in objs}
json.dump(info, open(OUT.replace(".glb", ".landmarks.json"), "w"), indent=1)
print("TOTAL_FACES", sum(v["faces"] for v in info.values()))

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True,
                          export_normals=True, export_materials="EXPORT", export_yup=True)
print("EXPORTED", OUT)

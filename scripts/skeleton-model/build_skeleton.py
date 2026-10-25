"""BodyParts3D の OBJ から、骨格マップ用の全身骨格モデル(.glb)を作る。

blender -b --factory-startup -P build_skeleton.py -- <parts_dir> <parts.json> <out.glb> [目標の三角形数] [segments.json]

segments.json を渡すと、部品を「脚・骨盤・腰椎1〜5・上半身」などの名前つきのまとまりに分けて書き出す
（筋膜のつながりラボの前屈で、まとまりごとに回すため）。渡さなければ骨・軟骨・歯の3つにまとめる。

座標: BodyParts3D は mm・Z が上・-Y が前・+X が体の左。
骨格マップの 3D 空間(足裏 y=-3.05 / 頭頂 y≒3.4 / 前 = +Z)に合わせて縮小・移動する。
glTF 書き出しで Blender の (x, y, z) は three.js の (x, z, -y) になる。
"""
import sys, json, bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
PARTS_DIR, PARTS_JSON, OUT = argv[:3]
TARGET = int(argv[3]) if len(argv) > 3 else 90000
parts = json.load(open(PARTS_JSON))

S = 6.45 / 1706.0  # 身長 1706mm → 6.45
Z0 = 736.7         # 足裏(-70mm)が y=-3.05 になる高さ
Y0 = -100.0        # 前後の中心

bpy.ops.wm.read_factory_settings(use_empty=True)


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def mat(name, hexcol, rough=0.55):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*srgb(hexcol), 1)
    b.inputs["Roughness"].default_value = rough
    return m


MATS = {"bone": mat("bone", "#ddd6c4"), "cart": mat("cartilage", "#b9c4b8"), "tooth": mat("tooth", "#efeadc", 0.35)}


def import_ids(ids):
    objs = []
    for fid in ids:
        before = set(bpy.data.objects)
        bpy.ops.wm.obj_import(filepath=f"{PARTS_DIR}/{fid}.obj", forward_axis="Y", up_axis="Z")
        objs += [o for o in bpy.data.objects if o not in before]
    return objs


SEGMENTS = json.load(open(argv[4])) if len(argv) > 4 else None
kind_of = {fid: k for k, ids in parts.items() for fid in ids}
segment_of = {fid: g for g, ids in SEGMENTS.items() for fid in ids} if SEGMENTS else kind_of

groups = {}
for fid, kind in kind_of.items():
    objs = import_ids([fid])
    for o in objs:
        o["kind"] = kind
    groups.setdefault(segment_of[fid], []).extend(objs)
total = sum(len(o.data.polygons) for objs in groups.values() for o in objs)
ratio = min(1.0, TARGET / total)
print("SOURCE_FACES", total, "RATIO", ratio)

out = []
for name, objs in groups.items():
    for o in objs:
        for v in o.data.vertices:
            v.co = Vector((v.co.x * S, (v.co.y - Y0) * S, (v.co.z - Z0) * S))
        if ratio < 1 and len(o.data.polygons) > 60:
            bpy.context.view_layer.objects.active = o
            mod = o.modifiers.new("dec", "DECIMATE")
            mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier="dec")
        o.data.materials.clear()
        o.data.materials.append(MATS[o["kind"]])
        for p in o.data.polygons:
            p.use_smooth = True
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = ob.data.name = name
    out.append(ob)

print("TOTAL_FACES", sum(len(o.data.polygons) for o in out))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True,
                          export_normals=True, export_materials="EXPORT", export_yup=True)
print("EXPORTED", OUT)

"""脳の中の体の地図（ホムンクルス）用の人体モデル(.glb)を MakeHuman(MPFB 2, CC0) から作る。

BLENDER_USER_RESOURCES=<MPFBを入れたフォルダ> blender -b -P build_homunculus.py -- <out.glb> <skin.jpg> <cloth.jpg>

- 2つのモーフ（形）を持たせる: real = 腕を下ろした実際の体 / brain = 感覚の地図の広さで描き直した体。
  three.js 側で real と brain の重みを入れ替えて、なめらかに変形させる。
- 部位ごと（hand / face / foot / trunk / limb）に材質を分け、選んだ部位だけ色を変えられるようにする。
  分け方は、各面でいちばん重みの大きい骨で決める。
"""
import bpy, sys, os, math
from bl_ext.user_default.mpfb.services import HumanService, LocationService

argv = sys.argv[sys.argv.index("--") + 1:]
OUT, SKIN_JPG, CLOTH_JPG = argv
D = LocationService.get_user_data()

# 「脳の中の体」にしたときの拡大率（HomunculusLab.tsx の SCALE と同じ）
SCALE = {"hand": 3.1, "face": 1.7, "foot": 1.4, "trunk": 0.62, "limb": 0.6}
LIPS = 1.45  # 唇は顔の拡大に加えてさらに大きくする


def category(bone):
    if bone.startswith(("wrist", "finger", "metacarpal")):
        return "hand"
    if bone.startswith(("foot", "toe")):
        return "foot"
    if bone.startswith(("upperarm", "lowerarm", "upperleg", "lowerleg")):
        return "limb"
    if bone.startswith(("root", "pelvis", "spine", "breast", "clavicle", "shoulder", "neck")):
        return "trunk"
    return "face"  # head・jaw・表情の骨


bpy.ops.wm.read_factory_settings(use_empty=True)
h = HumanService.create_human()
rig = HumanService.add_builtin_rig(h, "default")
assets = {}
for kind, name in [("Clothes", "clothes/male_casualsuit04/male_casualsuit04.mhclo"),
                   ("Hair", "hair/short02/short02.mhclo"),
                   ("Eyebrows", "eyebrows/eyebrow001/eyebrow001.mhclo"),
                   ("Eyes", "eyes/high-poly/high-poly.mhclo")]:
    assets[kind] = HumanService.add_mhclo_asset(os.path.join(D, name), h, asset_type=kind, subdiv_levels=0)


def image_mat(name, path, emissive=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    img = bpy.data.images.load(path, check_existing=True)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.7
    return m


def flat_mat(name, rgb, rough=0.6):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m


meshes = [h] + [o for o in assets.values() if o is not None]

# 1) 形のキーと、隠れた部分を消す MASK などを先に確定させる（ARMATURE だけ残す）
for o in meshes:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    if o.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    for m in list(o.modifiers):
        if m.type != "ARMATURE":
            bpy.ops.object.modifier_apply(modifier=m.name)

# 2) 部位ごとに材質を分ける（体と服）
CATS = ["hand", "face", "foot", "trunk", "limb"]
for o, prefix, path in [(h, "skin", SKIN_JPG), (assets["Clothes"], "cloth", CLOTH_JPG)]:
    o.data.materials.clear()
    for c in CATS:
        o.data.materials.append(image_mat(f"{prefix}_{c}", path))
    # 体の頂点には骨以外の補助グループ(joint-… など)もあるので、骨の名前のグループだけを見る
    bone_names = {b.name for b in rig.data.bones}
    gname = {g.index: g.name for g in o.vertex_groups if g.name in bone_names}
    vcat = []
    for v in o.data.vertices:
        acc = {}
        for g in v.groups:
            n = gname.get(g.group)
            if n:
                c = category(n)
                acc[c] = acc.get(c, 0) + g.weight
        vcat.append(acc)
    for p in o.data.polygons:
        acc = {}
        for vi in p.vertices:
            for c, w in vcat[vi].items():
                acc[c] = acc.get(c, 0) + w
        p.material_index = CATS.index(max(acc, key=acc.get)) if acc else CATS.index("trunk")
    for p in o.data.polygons:
        p.use_smooth = True

hair = flat_mat("hair", (0.03, 0.022, 0.018), 0.55)
for kind in ("Hair", "Eyebrows"):
    o = assets.get(kind)
    if o is not None:
        o.data.materials.clear()
        o.data.materials.append(hair)
eyes = assets.get("Eyes")
if eyes is not None:
    for i, m in enumerate(eyes.data.materials):
        if m:
            m.name = "eyes"

# 3) 姿勢: 腕を下ろす → real
def pose(ops):
    for bone, axis, deg in ops:
        pb = rig.pose.bones[bone]
        pb.rotation_mode = "XYZ"
        e = list(pb.rotation_euler)
        e["XYZ".index(axis)] += math.radians(deg)
        pb.rotation_euler = e
    bpy.context.view_layer.update()


def bake(name, keep):
    for o in meshes:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        mod = next(m for m in o.modifiers if m.type == "ARMATURE")
        bpy.ops.object.modifier_apply_as_shapekey(keep_modifier=keep, modifier=mod.name)
        o.data.shape_keys.key_blocks[-1].name = name


# 大きくした手が太ももに重ならないよう、腕は体から少し離して下ろす
pose([("upperarm01.L", "Z", -24), ("upperarm01.R", "Z", 24)])
bake("real", True)

# 4) 部位ごとに大きさを変える → brain
bones = rig.data.bones
def scale(name, s, inherit=True):
    pb = rig.pose.bones[name]
    pb.scale = s if isinstance(s, tuple) else (s, s, s)
    if not inherit:
        bones[name].inherit_scale = "NONE"


t, l = SCALE["trunk"], SCALE["limb"]
scale("spine05", (t, 1, t))
for n in ("clavicle.L", "clavicle.R", "neck01"):
    bones[n].inherit_scale = "NONE"
for side in ("L", "R"):
    scale(f"pelvis.{side}", 0.8)
    scale(f"upperarm01.{side}", (l, 1, l), inherit=False)
    scale(f"upperleg01.{side}", (l, 1, l), inherit=False)
    scale(f"wrist.{side}", SCALE["hand"], inherit=False)
    scale(f"foot.{side}", SCALE["foot"], inherit=False)
scale("head", SCALE["face"])
for b in rig.pose.bones:
    if b.name.startswith("oris"):
        b.scale = (LIPS, LIPS, LIPS)
bpy.context.view_layer.update()
bake("brain", False)

# 5) 骨は不要（形はモーフに入っている）
for o in meshes:
    o.parent = None
    for g in list(o.vertex_groups):
        o.vertex_groups.remove(g)
bpy.data.objects.remove(rig)

for o in meshes:
    xs = [v.co for v in o.data.vertices]
print("BBOX", [min(v.co.z for v in h.data.vertices), max(v.co.z for v in h.data.vertices)])
bpy.ops.object.select_all(action="DESELECT")
for o in meshes:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=False,
                          export_morph=True, export_morph_normal=True, export_skins=False,
                          export_image_format="JPEG", export_materials="EXPORT", export_yup=True)
print("EXPORTED", OUT)
